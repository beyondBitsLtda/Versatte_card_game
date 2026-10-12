// Estado do jogador — guardado no aparelho (localStorage).
// Modo offline: é a fonte da verdade. Modo online: é um espelho do perfil do servidor
// (cartas, moedas e pacotes vêm da API; cada conta tem a sua chave de armazenamento).
import { COLLECTIONS, PRIZES, CARD_BY_UID } from './data.js';

const OFFLINE_KEY = 'versatte-cards:v2';
let KEY = OFFLINE_KEY;
const listeners = new Set();

function fresh() {
  return {
    user: null,                // { name, email, createdAt }
    owned: {},                 // uid -> { n, first, last }
    premiumPacks: 0,
    inv: { basico: 0, lendario: 0 },  // outros pacotes (premium fica em premiumPacks)
    coins: 0,                  // moedas Versatte
    lastFreeDay: null,         // 'YYYY-MM-DD' do último pacote grátis
    timeOffset: 0,             // ms — relógio simulado (debug)
    pity: 0,                   // pacotes premium seguidos sem Especial
    forceNext: null,           // raridade forçada no próximo pacote (debug)
    forceCard: null,           // carta garantida no próximo pacote (debug)
    claimed: {},               // prizeId -> { code, at }
    stats: { opened: 0, free: 0, premium: 0, cards: 0, spent: 0 },
    settings: { sound: true, intro: true, debug: true, tilt: true },
    lastCollection: COLLECTIONS[0].id,
    club: null,                // Modo Clube: { name, crest, stadium, mascot, formation, slots[5], bench[5] }
    league: null,              // (legado) liga da versão anterior — migrada para comp
    comp: null,                // campeonato em andamento: { type, edition, ... } (js/game/tournament.js)
    trophies: { liga: 0, copa: 0, continental: 0 },
    editions: { liga: 0, copa: 0, continental: 0 },
    game: { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, streak: 0, best: 0, titles: 0, seasons: 0 },
    onlineTrophies: 0,         // torneios online vencidos (vem do servidor)
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const s = JSON.parse(raw);
    const base = fresh();
    if (s.coins == null && s.points != null) s.coins = s.points;
    return { ...base, ...s, trophies: { ...base.trophies, ...s.trophies }, editions: { ...base.editions, ...s.editions }, inv: { ...base.inv, ...s.inv }, stats: { ...base.stats, ...s.stats }, settings: { ...base.settings, ...s.settings }, game: { ...base.game, ...s.game } };
  } catch {
    return fresh();
  }
}

export const state = load();

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* modo privado */ }
  listeners.forEach(fn => fn(state));
}

export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

/**
 * Troca o armazenamento ativo: offline (demonstração) ou o espelho de uma conta online.
 * Recarrega o estado no MESMO objeto (os módulos guardam a referência de `state`).
 */
export function useStorage(accountId = null) {
  KEY = accountId ? `versatte-cards:v2:conta:${accountId}` : OFFLINE_KEY;
  const keepSettings = { ...state.settings };
  const next = load();
  Object.keys(state).forEach(k => delete state[k]);
  Object.assign(state, next, { settings: { ...next.settings, ...(accountId ? { debug: keepSettings.debug } : {}) } });
}
export const storageKey = () => KEY;

export function resetAll() {
  const keepSettings = { ...state.settings };
  Object.keys(state).forEach(k => delete state[k]);
  Object.assign(state, fresh(), { settings: keepSettings });
  save();
}

// ---------- pacotes ----------
export const packCount = type => (type === 'premium' ? state.premiumPacks : state.inv[type] || 0);
export function addPacks(type, n = 1) {
  if (type === 'premium') state.premiumPacks += n;
  else state.inv[type] = (state.inv[type] || 0) + n;
}
export function usePack(type) {
  if (type === 'premium') state.premiumPacks = Math.max(0, state.premiumPacks - 1);
  else state.inv[type] = Math.max(0, (state.inv[type] || 0) - 1);
}
export const totalPacks = () => state.premiumPacks + Object.values(state.inv).reduce((a, b) => a + b, 0);

// ---------- relógio ----------
export const now = () => Date.now() + (state.timeOffset || 0);

export function dayKey(t = now()) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const freeAvailable = () => state.lastFreeDay !== dayKey();

export function msToNextFree() {
  const d = new Date(now());
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
  return next - now();
}

// ---------- coleção ----------
export const ownedCount = uid => state.owned[uid]?.n || 0;

export function progress(collectionId) {
  const col = COLLECTIONS.find(c => c.id === collectionId);
  const have = col.cards.filter(c => ownedCount(c.uid) > 0).length;
  return { have, total: col.cards.length, pct: have / col.cards.length };
}

export function addCard(uid) {
  const t = now();
  const o = state.owned[uid] || { n: 0, first: t };
  o.n += 1; o.last = t;
  state.owned[uid] = o;
  state.stats.cards += 1;
  return o.n === 1;
}

export function removeCollection(collectionId) {
  Object.keys(state.owned).forEach(uid => {
    if (CARD_BY_UID[uid]?.collection === collectionId) delete state.owned[uid];
  });
  PRIZES.filter(p => p.collection === collectionId || p.collection === null)
    .forEach(p => delete state.claimed[p.id]);
}

// ---------- prêmios ----------
export function prizeStatus(prize) {
  if (state.claimed[prize.id]) return 'claimed';
  if (prize.collection === null) {
    return COLLECTIONS.every(c => progress(c.id).pct >= 1) ? 'ready' : 'locked';
  }
  return progress(prize.collection).pct >= prize.at ? 'ready' : 'locked';
}

export function readyPrizes() {
  return PRIZES.filter(p => prizeStatus(p) === 'ready');
}

export function claimPrize(prize) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand = n => Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  const code = `VS-${prize.id.toUpperCase().replace('-', '')}-${rand(4)}`;
  state.claimed[prize.id] = { code, at: now() };
  save();
  return code;
}
