// ============================================================
//  MODO ONLINE — sessão, API e espelho do perfil
//  • Senha: o navegador estica com PBKDF2-SHA512 (210 mil iterações,
//    em 3 rodadas de 70 mil, sal derivado do e-mail) e manda só a
//    chave derivada — mesmo desenho do Abacato no beyond-assist.
//  • Sessão: token no cabeçalho Authorization (o jogo roda no
//    GitHub Pages e a API em outro domínio).
//  • O servidor é a fonte da verdade de cartas, moedas e pacotes;
//    aqui só espelhamos no `state` e enviamos o clube/campeonatos.
// ============================================================
import { API_URLS, POLL_MS } from '../config.js';
import { state, save, onChange, useStorage } from '../state.js';

const SESSION_KEY = 'versatte-sessao';
let session = null;          // { token, usuario }
try { session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { session = null; }

export const isOnline = () => !!session;
export const me = () => session?.usuario || null;
export const isAdmin = () => !!session?.usuario?.admin;

export class ApiError extends Error {
  constructor(status, code, message) { super(message || code); this.status = status; this.code = code; }
}

// endereço que respondeu por último (o domínio próprio ou o reserva *.workers.dev)
let baseIdx = 0;
try { baseIdx = Math.max(0, API_URLS.indexOf(sessionStorage.getItem('versatte-api'))); } catch { baseIdx = 0; }
const remember = i => { baseIdx = i; try { sessionStorage.setItem('versatte-api', API_URLS[i]); } catch { /* sem storage */ } };

/** fetch que tenta os endereços da API em ordem, começando pelo último que funcionou. */
async function fetchApi(path, init) {
  let lastErr;
  for (let k = 0; k < API_URLS.length; k++) {
    const i = (baseIdx + k) % API_URLS.length;
    try {
      const r = await fetch(API_URLS[i] + path, init);
      if (i !== baseIdx) remember(i);
      return r;
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

/** Chamada à API. Erros de rede viram ApiError('rede'). Sessão expirada → sai da conta. */
export async function api(method, path, body) {
  let r;
  try {
    r = await fetchApi(path, {
      method,
      headers: { 'content-type': 'application/json', ...(session ? { authorization: 'Bearer ' + session.token } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'rede', 'Sem conexão com o servidor do Versatte. Confira a internet e tente de novo.');
  }
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401 && session && path !== '/auth/entrar') { logout(); location.reload(); }
    throw new ApiError(r.status, data.erro || 'erro', data.mensagem || `Erro ${r.status}`);
  }
  return data;
}

export async function serverUp() {
  try { const r = await fetchApi('/saude', { cache: 'no-store' }); return r.ok; } catch { return false; }
}

// ---------------- senha → chave derivada ----------------
const enc = new TextEncoder();
async function deriveKey(email, senha) {
  const sal = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode('versatte:' + String(email).trim().toLowerCase())));
  let material = enc.encode(senha), bits;
  for (let i = 0; i < 3; i++) {
    const k = await crypto.subtle.importKey('raw', material, 'PBKDF2', false, ['deriveBits']);
    bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: sal, iterations: 70000, hash: 'SHA-512' }, k, 256);
    material = new Uint8Array(bits);
  }
  let s = '';
  for (const b of new Uint8Array(bits)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function startSession(data) {
  session = { token: data.token, usuario: data.usuario };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  useStorage(session.usuario.id);
}

export async function signup({ nome, email, senha, aceite }) {
  if (String(senha).length < 8) throw new ApiError(400, 'senha', 'A senha precisa ter pelo menos 8 caracteres');
  const chave = await deriveKey(email, senha);
  startSession(await api('POST', '/auth/cadastro', { nome, email, chave, aceite }));
  await refreshProfile();
}

export async function login({ email, senha }) {
  const chave = await deriveKey(email, senha);
  startSession(await api('POST', '/auth/entrar', { email, chave }));
  await refreshProfile();
}

export function logout() {
  session = null;
  localStorage.removeItem(SESSION_KEY);
  stopPolling();
  useStorage(null);
}

/** Restaura a sessão salva (ao abrir o app). */
export function resumeSession() {
  if (session) useStorage(session.usuario.id);
  return !!session;
}

// ---------------- espelho do perfil ----------------
const ECON = ['owned', 'coins', 'premiumPacks', 'inv', 'lastFreeDay', 'pity', 'claimed', 'stats', 'onlineTrophies'];
let clubVersion = null, applying = false;

/** Aplica no `state` o perfil vindo do servidor. */
export function applyProfile(perfil, { clube = false } = {}) {
  if (!perfil) return;
  applying = true;
  const d = perfil.dados || {};
  ECON.forEach(k => { if (d[k] !== undefined) state[k] = d[k]; });
  state.inv = { basico: 0, lendario: 0, ...(d.inv || {}) };
  if (clube && perfil.clube) {
    const c = perfil.clube;
    state.club = c.club ?? null;
    state.comp = c.comp ?? null;
    state.trophies = { liga: 0, copa: 0, continental: 0, ...(c.trophies || {}) };
    state.editions = { liga: 0, copa: 0, continental: 0, ...(c.editions || {}) };
    state.game = { ...state.game, ...(c.game || {}) };
  }
  state.user = { name: session?.usuario?.nome, email: session?.usuario?.email, createdAt: state.user?.createdAt || Date.now() };
  save();
  applying = false;
}

export async function refreshProfile() {
  const r = await api('GET', '/eu');
  session.usuario = r.usuario;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  applyProfile(r.perfil, { clube: true });
  return r;
}

// envia clube/campeonatos/troféus quando mudam (economia não: essa só o servidor muda)
let clubTimer = 0, lastClubJSON = '';
const clubPayload = () => ({ club: state.club, comp: state.comp, trophies: state.trophies, editions: state.editions, game: state.game });
onChange(() => {
  if (!session || applying) return;
  const clube = clubPayload();
  const j = JSON.stringify(clube);
  if (j === lastClubJSON) return;
  clearTimeout(clubTimer);
  clubTimer = setTimeout(async () => {
    try { const r = await api('PUT', '/perfil/clube', { clube }); lastClubJSON = j; clubVersion = r.versao; } catch { /* tenta de novo na próxima mudança */ }
  }, 1200);
});

/** Envia a escalação agora (antes de desafiar/aceitar: o servidor monta o time a partir dela). */
export async function syncClubNow() {
  if (!session) return;
  clearTimeout(clubTimer);
  const clube = clubPayload();
  const j = JSON.stringify(clube);
  if (j === lastClubJSON) return;
  const r = await api('PUT', '/perfil/clube', { clube });
  lastClubJSON = j; clubVersion = r.versao;
}

// ---------------- caixa de entrada (polling) ----------------
const inboxListeners = new Set();
let inbox = null, pollTimer = 0, pollFast = false, polling = false;
export const getInbox = () => inbox;
export function onInbox(fn) { inboxListeners.add(fn); if (inbox) fn(inbox); return () => inboxListeners.delete(fn); }
export function pollFastMode(on) { pollFast = on; if (on) pollNow(); }

export async function pollNow() {
  if (!session || polling) return inbox;
  polling = true;
  try {
    inbox = await api('GET', '/caixa');
  } catch { polling = false; return inbox; /* offline momentâneo */ }
  // cada ouvinte isolado: o erro de um não pode impedir os outros (nem sumir calado)
  inboxListeners.forEach(fn => { try { fn(inbox); } catch (e) { console.error('[caixa]', e); } });
  polling = false;
  return inbox;
}

export function startPolling() {
  stopPolling();
  const tick = async () => {
    if (document.visibilityState === 'visible') await pollNow();
    pollTimer = setTimeout(tick, pollFast ? POLL_MS.active : POLL_MS.idle);
  };
  tick();
}
export function stopPolling() { clearTimeout(pollTimer); pollTimer = 0; }
