// ============================================================
//  VERSATTE API — Cloudflare Worker
//  Contas, inventário (cartas/moedas/pacotes no servidor) e
//  multiplayer (convites, trocas, amistosos e torneios online).
//
//  O banco é o Postgres do Supabase do beyond-assist, acessado só
//  por funções RPC (db/001_versatte.sql) com a service_role.
//  As regras do jogo vêm dos MESMOS módulos do app (../../js),
//  então app e servidor nunca discordam.
// ============================================================
import { criarToken, lerToken, selarChave, conferirChave, chaveValida } from './crypto.js';
import {
  normalizeProfile, newProfile, applyOpenPack, applyExchange, applyPurchase, applyClaim, dayKeyBR, EconomyError, addCardTo,
} from '../../js/economy-core.js';
import { ALL_CARDS, COLLECTION_BY_ID, RARITIES } from '../../js/data.js';
import {
  teamFromProfile, botTeam, serializeTeam, playOnline, onlineReward, buildCup, advanceCup, aliveHumans, ONLINE_REWARDS,
} from '../../js/game/online-core.js';

// ---------------- infraestrutura ----------------
class HttpError extends Error { constructor(status, code, msg) { super(msg || code); this.status = status; this.code = code; } }
const erro = (status, code, msg) => { throw new HttpError(status, code, msg); };

function cors(env, req) {
  const origin = req.headers.get('origin') || '';
  const allowed = String(env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const ok = allowed.includes('*') || allowed.includes(origin);
  return {
    'access-control-allow-origin': ok ? origin || '*' : allowed[0] || '',
    'access-control-allow-methods': 'GET,POST,PUT,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
    'access-control-max-age': '86400',
    vary: 'origin',
  };
}
const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...headers } });

/** Acesso ao banco: funções RPC do PostgREST (produção) ou um rpc injetado (dev/testes com PGlite). */
export function makeDb(env) {
  if (env.rpc) return { rpc: env.rpc };
  const base = String(env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    async rpc(fn, params = {}) {
      const r = await fetch(`${base}/rest/v1/rpc/${fn}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', apikey: key, authorization: `Bearer ${key}` },
        body: JSON.stringify(params),
      });
      if (!r.ok) throw new HttpError(502, 'banco', `banco respondeu ${r.status}: ${(await r.text()).slice(0, 200)}`);
      const t = await r.text();
      return t ? JSON.parse(t) : null;
    },
  };
}

// limitador simples por IP (melhor esforço: vale por instância do Worker)
const tentativas = new Map();
function limitar(ip, chave, max, janelaMs) {
  const k = chave + ':' + ip, now = Date.now();
  const lista = (tentativas.get(k) || []).filter(t => now - t < janelaMs);
  if (lista.length >= max) erro(429, 'limite', 'Muitas tentativas. Aguarde um pouco.');
  lista.push(now); tentativas.set(k, lista);
  if (tentativas.size > 5000) tentativas.clear();
}

// ---------------- perfil (concorrência otimista) ----------------
async function lerPerfil(db, uid) {
  const p = await db.rpc('versatte_perfil', { p_id: uid });
  p.dados = normalizeProfile(p.dados || {});
  p.clube = p.clube || {};
  return p;
}

/** Lê, altera e grava o perfil; repete se outra requisição gravou no meio. */
async function mudarPerfil(db, uid, fn) {
  for (let i = 0; i < 5; i++) {
    const p = await lerPerfil(db, uid);
    const out = await fn(p.dados, p.clube, p);
    const v = await db.rpc('versatte_perfil_salvar', { p_id: uid, p_dados: p.dados, p_clube: p.clube, p_versao: p.versao });
    if (v != null) return { out, perfil: { ...p, versao: v } };
  }
  erro(409, 'conflito', 'O perfil mudou ao mesmo tempo em outro lugar. Tente de novo.');
}

/** O que o app recebe do perfil (sem os controles internos). */
const publicoPerfil = p => {
  const { limites, forceNext, forceCard, ...dados } = p.dados;
  return { dados, clube: p.clube, versao: p.versao };
};

// ---------------- recompensas de partidas offline (anti-trapaça básica) ----------------
const LIMITES = {
  partida: { maxMoedas: 120, intervaloMs: 15000 },
  amistoso: { maxMoedas: 60, intervaloMs: 15000 },
  campeonato: { maxMoedas: 400, intervaloMs: 0 },
  diaMoedas: 1500, diaPacotes: 3,
};
function aplicarRecompensa(d, { moedas, pacote, motivo }, today, now) {
  const lim = LIMITES[motivo];
  if (!lim) erro(400, 'motivo', 'Motivo inválido');
  const L = d.limites && d.limites.dia === today ? d.limites : { dia: today, moedas: 0, pacotes: 0, ultimo: 0 };
  if (lim.intervaloMs && now - (L.ultimo || 0) < lim.intervaloMs) erro(429, 'rapido', 'Partidas rápidas demais para recompensa');
  let m = Math.max(0, Math.min(Math.floor(+moedas || 0), lim.maxMoedas, LIMITES.diaMoedas - L.moedas));
  let pack = null;
  if (pacote && ['basico', 'premium', 'lendario'].includes(pacote) && motivo !== 'amistoso' && L.pacotes < LIMITES.diaPacotes) pack = pacote;
  d.coins += m; L.moedas += m;
  if (pack) { if (pack === 'premium') d.premiumPacks++; else d.inv[pack] = (d.inv[pack] || 0) + 1; L.pacotes++; }
  if (motivo !== 'campeonato') L.ultimo = now;
  d.limites = L;
  return { moedas: m, pacote: pack, limitado: m < (+moedas || 0) };
}

// ---------------- debug (só contas admin) ----------------
function aplicarDebug(d, body, now) {
  const add = uid => addCardTo(d, uid, now);
  const fill = (colId, pct) => {
    const col = COLLECTION_BY_ID[colId]; if (!col) erro(400, 'colecao');
    const need = Math.ceil(pct * col.cards.length) - col.cards.filter(c => d.owned[c.uid]).length;
    col.cards.filter(c => !d.owned[c.uid]).sort(() => Math.random() - 0.5).slice(0, Math.max(0, need)).forEach(c => add(c.uid));
  };
  switch (body.acao) {
    case 'moedas': d.coins += Math.min(+body.n || 500, 100000); break;
    case 'premium': d.premiumPacks += Math.min(+body.n || 1, 100); break;
    case 'lendario': d.inv.lendario += Math.min(+body.n || 1, 100); break;
    case 'gratis': d.lastFreeDay = null; break;
    case 'forcar': d.forceNext = RARITIES[body.raridade] ? body.raridade : null; break;
    case 'forcarCarta': d.forceCard = body.uid || null; break;
    case 'colecao': fill(body.colecao, Math.min(1, Math.max(0, +body.pct || 0))); break;
    case 'limpar': {
      const col = COLLECTION_BY_ID[body.colecao]; if (!col) erro(400, 'colecao');
      col.cards.forEach(c => delete d.owned[c.uid]);
      Object.keys(d.claimed).forEach(k => delete d.claimed[k]);
      break;
    }
    case 'todas': ALL_CARDS.forEach(c => { if (!d.owned[c.uid]) add(c.uid); }); break;
    case 'cartas': (body.uids || []).forEach(uid => { if (!d.owned[uid]) add(uid); }); break;
    case 'resgates': d.claimed = {}; break;
    case 'resetar': Object.keys(d).forEach(k => delete d[k]); Object.assign(d, newProfile()); break;
    default: erro(400, 'acao', 'Ação de debug desconhecida');
  }
}

// ============================================================
//  ROTAS
// ============================================================
async function rotear(req, env, db, url) {
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const m = req.method;
  const body = m === 'GET' ? {} : await req.json().catch(() => ({}));
  const ip = req.headers.get('cf-connecting-ip') || 'local';
  const today = dayKeyBR(), now = Date.now();

  if (path === '/saude') return { ok: true, servico: 'versatte-api', hora: new Date().toISOString() };

  // ---------------- contas ----------------
  if (m === 'POST' && path === '/auth/cadastro') {
    limitar(ip, 'cadastro', 5, 10 * 60 * 1000);
    const email = String(body.email || '').trim().toLowerCase();
    const nome = String(body.nome || '').trim().slice(0, 40);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) erro(400, 'email', 'E-mail inválido');
    if (nome.length < 2) erro(400, 'nome', 'Informe seu nome');
    if (!chaveValida(body.chave)) erro(400, 'chave', 'Senha inválida');
    if (!body.aceite) erro(400, 'aceite', 'É preciso aceitar os termos e a política de privacidade');
    const { hash, sal } = await selarChave(body.chave);
    const u = await db.rpc('versatte_usuario_criar', { p_email: email, p_nome: nome, p_hash: hash, p_sal: sal, p_iter: 210000, p_dados: newProfile() });
    if (!u) erro(409, 'email-existe', 'Já existe uma conta com este e-mail');
    return { token: await criarToken(u, env.VERSATTE_SESSAO_SECRET), usuario: u };
  }
  if (m === 'POST' && path === '/auth/entrar') {
    limitar(ip, 'entrar', 10, 10 * 60 * 1000);
    const u = await db.rpc('versatte_usuario_por_email', { p_email: String(body.email || '') });
    // confere mesmo sem usuário, para o tempo de resposta não revelar quem tem conta
    const ok = await conferirChave(body.chave, u?.senha_hash || 'AAAA', u?.senha_sal || 'AAAA');
    if (!u || !ok) erro(401, 'credenciais', 'E-mail ou senha incorretos');
    await db.rpc('versatte_usuario_entrou', { p_id: u.id });
    const usuario = { id: u.id, email: u.email, nome: u.nome, admin: u.admin };
    return { token: await criarToken(usuario, env.VERSATTE_SESSAO_SECRET), usuario };
  }

  // ---------------- daqui para baixo, só logado ----------------
  const auth = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const sess = await lerToken(auth, env.VERSATTE_SESSAO_SECRET);
  if (!sess) erro(401, 'sessao', 'Sessão expirada. Entre de novo.');
  const me = sess.id;
  limitar(me, 'api', 240, 60 * 1000);

  if (m === 'GET' && path === '/eu') {
    const usuario = await db.rpc('versatte_usuario', { p_id: me });
    if (!usuario) erro(401, 'sessao', 'Conta não encontrada');
    return { usuario, perfil: publicoPerfil(await lerPerfil(db, me)), hoje: today };
  }

  // ---------------- economia (autoritativa) ----------------
  if (m === 'POST' && path === '/pacote/abrir') {
    const { out, perfil } = await mudarPerfil(db, me, d => applyOpenPack(d, body.colecao, body.tipo, { today, now }));
    return { ...out, perfil: publicoPerfil(perfil) };
  }
  if (m === 'POST' && path === '/loja/trocar') {
    const { perfil } = await mudarPerfil(db, me, d => applyExchange(d, body.tipo));
    return { perfil: publicoPerfil(perfil) };
  }
  if (m === 'POST' && path === '/loja/comprar') {
    // protótipo: pagamento simulado (integrar gateway de pagamento antes de produção)
    const { perfil } = await mudarPerfil(db, me, d => {
      const n = (d.limites?.compras?.[today]) || 0;
      if (n >= 5) erro(429, 'compras', 'Limite de compras simuladas por dia');
      applyPurchase(d, body.oferta);
      d.limites = { ...(d.limites || {}), compras: { [today]: n + 1 } };
    });
    return { perfil: publicoPerfil(perfil) };
  }
  if (m === 'POST' && path === '/premio/resgatar') {
    const { out, perfil } = await mudarPerfil(db, me, d => applyClaim(d, body.premio, { now }));
    return { codigo: out, perfil: publicoPerfil(perfil) };
  }
  if (m === 'POST' && path === '/recompensa') {
    const { out, perfil } = await mudarPerfil(db, me, d => aplicarRecompensa(d, body, today, now));
    return { ...out, perfil: publicoPerfil(perfil) };
  }
  if (m === 'PUT' && path === '/perfil/clube') {
    const c = body.clube || {};
    if (JSON.stringify(c).length > 200000) erro(413, 'grande', 'Dados do clube grandes demais');
    const clube = { club: c.club ?? null, comp: c.comp ?? null, trophies: c.trophies || {}, editions: c.editions || {}, game: c.game || {} };
    const { perfil } = await mudarPerfil(db, me, (d, cl, p) => { p.clube = clube; });
    return { versao: perfil.versao };
  }
  if (m === 'POST' && path === '/debug') {
    if (!sess.adm) erro(403, 'admin', 'Modo debug só para contas administradoras');
    const { perfil } = await mudarPerfil(db, me, d => aplicarDebug(d, body, now));
    return { perfil: publicoPerfil(perfil) };
  }

  // ---------------- social ----------------
  if (m === 'GET' && path === '/caixa') return await db.rpc('versatte_caixa', { p_id: me });
  if (m === 'GET' && path === '/jogadores') return await db.rpc('versatte_jogadores', { p_id: me, p_busca: url.searchParams.get('busca') || '' });

  if (m === 'POST' && path === '/convites') {
    const modo = body.modo;
    if (!['troca', 'amistoso'].includes(modo)) erro(400, 'modo', 'Modo inválido');
    if (!body.para || body.para === me) erro(400, 'para', 'Escolha outro jogador');
    if (modo === 'amistoso') {
      const [eu, ele] = await Promise.all([lerPerfil(db, me), lerPerfil(db, body.para)]);
      if (!eu.clube.club) erro(400, 'sem-clube', 'Crie seu clube no Modo Clube antes de desafiar');
      if (!ele.clube.club) erro(400, 'sem-clube-dele', 'Esse jogador ainda não criou o clube');
    }
    return await db.rpc('versatte_convite_criar', { p_de: me, p_para: body.para, p_modo: modo, p_ref: null, p_dados: { nome: sess.nome } });
  }
  let r;
  if (m === 'POST' && (r = path.match(/^\/convites\/(\d+)\/responder$/))) {
    const c = await db.rpc('versatte_convite_responder', { p_id: +r[1], p_usuario: me, p_aceitar: !!body.aceitar });
    if (!c) erro(404, 'convite', 'Convite não encontrado ou já respondido');
    if (!body.aceitar) return { convite: c };
    if (c.modo === 'troca') {
      const t = await db.rpc('versatte_troca_criar', { p_a: c.de, p_b: c.para });
      await db.rpc('versatte_convite_ref', { p_id: c.id, p_ref: t.id });
      return { convite: { ...c, ref: t.id }, troca: t.id };
    }
    if (c.modo === 'amistoso') {
      const id = await jogarAmistoso(db, c.de, c.para);
      await db.rpc('versatte_convite_ref', { p_id: c.id, p_ref: id });
      return { convite: { ...c, ref: id }, partida: id };
    }
    if (c.modo === 'torneio') {
      await mudarTorneio(db, c.ref, t => { const p = t.participantes.find(x => x.id === me); if (p) { p.aceito = true; p.nome = sess.nome; } });
      return { convite: c, torneio: c.ref };
    }
  }
  if (m === 'POST' && (r = path.match(/^\/convites\/(\d+)\/cancelar$/))) return await db.rpc('versatte_convite_cancelar', { p_id: +r[1], p_usuario: me });

  // ---------------- trocas ----------------
  if (m === 'GET' && (r = path.match(/^\/trocas\/(\d+)$/))) {
    const t = await db.rpc('versatte_troca', { p_id: +r[1], p_usuario: me });
    if (!t) erro(404, 'troca', 'Troca não encontrada');
    return t;
  }
  if (m === 'POST' && (r = path.match(/^\/trocas\/(\d+)\/oferta$/))) {
    const p = await lerPerfil(db, me);
    const oferta = [];
    for (const it of (body.oferta || []).slice(0, 12)) {
      const n = Math.max(1, Math.floor(+it.n || 1));
      if ((p.dados.owned[it.uid]?.n || 0) < n) erro(400, 'carta', 'Você não tem essa carta');
      oferta.push({ uid: it.uid, n });
    }
    return await db.rpc('versatte_troca_oferta', { p_id: +r[1], p_usuario: me, p_oferta: oferta });
  }
  if (m === 'POST' && (r = path.match(/^\/trocas\/(\d+)\/confirmar$/))) {
    const t = await db.rpc('versatte_troca_confirmar', { p_id: +r[1], p_usuario: me, p_versao: body.versao ?? null });
    return { ...t, perfil: t?.status === 'concluida' ? publicoPerfil(await lerPerfil(db, me)) : undefined };
  }
  if (m === 'POST' && (r = path.match(/^\/trocas\/(\d+)\/cancelar$/))) return await db.rpc('versatte_troca_cancelar', { p_id: +r[1], p_usuario: me });

  // ---------------- partidas ----------------
  if (m === 'GET' && (r = path.match(/^\/partidas\/(\d+)$/))) {
    const p = await db.rpc('versatte_partida', { p_id: +r[1], p_usuario: me });
    if (!p) erro(404, 'partida', 'Partida não encontrada');
    return p;
  }
  if (m === 'POST' && (r = path.match(/^\/partidas\/(\d+)\/vista$/))) {
    await db.rpc('versatte_partida_vista', { p_id: +r[1], p_usuario: me });
    return { ok: true };
  }

  // ---------------- torneios online ----------------
  if (m === 'POST' && path === '/torneios') {
    const convidados = [...new Set((body.convidados || []).filter(id => id && id !== me))].slice(0, 7);
    if (!convidados.length) erro(400, 'convidados', 'Convide pelo menos um jogador');
    const eu = await lerPerfil(db, me);
    if (!eu.clube.club) erro(400, 'sem-clube', 'Crie seu clube no Modo Clube antes de organizar um torneio');
    const formato = body.formato === 'pontos' ? 'pontos' : 'mata';
    const nome = String(body.nome || 'Torneio entre amigos').slice(0, 40);
    const participantes = [{ id: me, nome: sess.nome, tipo: 'humano', aceito: true, pronto: false }, ...convidados.map(id => ({ id, nome: null, tipo: 'humano', aceito: false, pronto: false }))];
    const t = await db.rpc('versatte_torneio_criar', { p_dono: me, p_nome: nome, p_formato: formato, p_participantes: participantes });
    for (const id of convidados) await db.rpc('versatte_convite_criar', { p_de: me, p_para: id, p_modo: 'torneio', p_ref: t.id, p_dados: { nome: sess.nome, torneio: nome, formato } });
    return t;
  }
  if (m === 'GET' && (r = path.match(/^\/torneios\/(\d+)$/))) {
    const t = await db.rpc('versatte_torneio', { p_id: +r[1] });
    if (!t || !t.participantes.some(p => p.id === me)) erro(404, 'torneio', 'Torneio não encontrado');
    return t;
  }
  if (m === 'POST' && (r = path.match(/^\/torneios\/(\d+)\/iniciar$/))) {
    return await mudarTorneio(db, +r[1], async t => {
      if (t.dono !== me) erro(403, 'dono', 'Só quem organizou pode iniciar');
      if (t.status !== 'convites') erro(400, 'status', 'O torneio já começou');
      const humanos = t.participantes.filter(p => p.tipo === 'humano' && p.aceito);
      if (humanos.length < 2) erro(400, 'poucos', 'Espere pelo menos um convidado aceitar');
      for (const h of humanos) if (!h.nome) h.nome = (await db.rpc('versatte_usuario', { p_id: h.id }))?.nome || 'Jogador';
      const cup = buildCup(t.formato, humanos);
      t.participantes = cup.participantes; t.estado = cup.estado; t.status = 'andamento'; t.rodada = 0;
    });
  }
  if (m === 'POST' && (r = path.match(/^\/torneios\/(\d+)\/pronto$/))) {
    return await mudarTorneio(db, +r[1], async t => {
      if (t.status !== 'andamento') erro(400, 'status', 'O torneio não está em andamento');
      const alive = aliveHumans(t);
      const p = t.participantes.find(x => x.id === me);
      if (!p || !alive.includes(me)) erro(400, 'eliminado', 'Você não joga esta rodada');
      p.pronto = true;
      const todos = alive.every(id => t.participantes.find(x => x.id === id).pronto);
      if (todos || (body.forcar && t.dono === me)) await jogarRodada(db, t);
    });
  }
  if (m === 'POST' && (r = path.match(/^\/torneios\/(\d+)\/cancelar$/))) {
    return await mudarTorneio(db, +r[1], t => { if (t.dono !== me) erro(403, 'dono'); t.status = 'cancelado'; });
  }

  erro(404, 'rota', 'Rota não encontrada');
}

// ---------------- amistoso online ----------------
async function jogarAmistoso(db, casaId, foraId) {
  const [pc, pf] = await Promise.all([lerPerfil(db, casaId), lerPerfil(db, foraId)]);
  const casa = teamFromProfile(pc), fora = teamFromProfile(pf);
  if (!casa || !fora) erro(400, 'sem-clube', 'Os dois jogadores precisam ter clube criado');
  const seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0;
  const resultado = playOnline(casa, fora, { seed });
  const rc = onlineReward(resultado, 0), rf = onlineReward(resultado, 1);
  await mudarPerfil(db, casaId, d => { d.coins += rc.coins; });
  await mudarPerfil(db, foraId, d => { d.coins += rf.coins; });
  return db.rpc('versatte_partida_criar', {
    p_tipo: 'amistoso', p_torneio: null, p_rodada: null, p_casa: casaId, p_fora: foraId, p_casa_bot: null, p_fora_bot: null,
    p_times: [serializeTeam(casa, casaId), serializeTeam(fora, foraId)], p_resultado: resultado, p_recompensa: { [casaId]: rc, [foraId]: rf },
  });
}

// ---------------- torneio online ----------------
async function mudarTorneio(db, id, fn) {
  for (let i = 0; i < 5; i++) {
    const t = await db.rpc('versatte_torneio', { p_id: id });
    if (!t) erro(404, 'torneio', 'Torneio não encontrado');
    await fn(t);
    const v = await db.rpc('versatte_torneio_salvar', { p_id: id, p_versao: t.versao, p_status: t.status, p_participantes: t.participantes, p_estado: t.estado, p_rodada: t.rodada, p_campeao: t.campeao || null });
    if (v != null) return { ...t, versao: v };
  }
  erro(409, 'conflito', 'O torneio mudou ao mesmo tempo. Tente de novo.');
}

async function jogarRodada(db, t) {
  const e = t.estado;
  const games = e.rounds[e.round];
  const knockout = t.formato === 'mata';
  const cache = {};
  const montar = async id => {
    if (cache[id]) return cache[id];
    if (id.startsWith('bot:')) return (cache[id] = { team: botTeam(id.slice(4), 2 + e.round), user: null, bot: id.slice(4) });
    const p = await lerPerfil(db, id);
    const team = teamFromProfile(p);
    return (cache[id] = { team: team || botTeam('rem', 1), user: id, bot: null });
  };
  const results = [];
  for (const g of games) {
    const [A, B] = [await montar(g.a), await montar(g.b)];
    const seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0;
    const res = playOnline(A.team, B.team, { seed, knockout });
    let partida = null;
    if (A.user || B.user) {
      const ra = A.user ? onlineReward(res, 0) : null, rb = B.user ? onlineReward(res, 1) : null;
      if (A.user) await mudarPerfil(db, A.user, d => { d.coins += ra.coins; });
      if (B.user) await mudarPerfil(db, B.user, d => { d.coins += rb.coins; });
      partida = await db.rpc('versatte_partida_criar', {
        p_tipo: 'torneio', p_torneio: t.id, p_rodada: e.round, p_casa: A.user, p_fora: B.user, p_casa_bot: A.bot, p_fora_bot: B.bot,
        p_times: [serializeTeam(A.team, A.user), serializeTeam(B.team, B.user)], p_resultado: res,
        p_recompensa: { ...(A.user ? { [A.user]: ra } : {}), ...(B.user ? { [B.user]: rb } : {}) },
      });
    }
    results.push({ score: res.score, shootout: res.shootout, partida });
  }
  advanceCup(t, results);
  // sem humanos vivos (todos eliminados), as rodadas restantes entre robôs são simuladas na hora
  if (t.status === 'andamento' && aliveHumans(t).length === 0) return jogarRodada(db, t);
  if (t.status === 'encerrado') {
    const humanos = t.participantes.filter(p => p.tipo === 'humano');
    for (const h of humanos) {
      const champ = h.id === t.campeao, vice = h.id === t.vice;
      await mudarPerfil(db, h.id, d => {
        d.coins += champ ? ONLINE_REWARDS.cupChampion : vice ? ONLINE_REWARDS.cupVice : ONLINE_REWARDS.cupPart;
        if (champ) { d.premiumPacks++; d.onlineTrophies = (d.onlineTrophies || 0) + 1; }
      });
    }
  }
}

// ============================================================
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const headers = cors(env, req);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    try {
      const db = makeDb(env);
      const data = await rotear(req, env, db, url);
      return json(data ?? null, 200, headers);
    } catch (e) {
      if (e instanceof HttpError) return json({ erro: e.code, mensagem: e.message }, e.status, headers);
      if (e instanceof EconomyError) return json({ erro: e.code, mensagem: e.message }, 400, headers);
      console.error(e);
      return json({ erro: 'interno', mensagem: 'Erro interno do servidor' }, 500, headers);
    }
  },
};
