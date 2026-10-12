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
  teamFromProfile, botTeam, serializeTeam, hydrateTeam, playOnline, onlineReward, buildCup, advanceCup, aliveHumans, ONLINE_REWARDS,
  LIVE, normalizeConfig, liveFirstHalf, liveRoster, validSubs, liveSecondHalf, liveForfeit,
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
  if (m === 'GET' && path === '/caixa') {
    const caixa = await db.rpc('versatte_caixa', { p_id: me });
    if (await varrerVencidas(db, me, caixa)) return await db.rpc('versatte_caixa', { p_id: me });
    return caixa;
  }
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
    const dados = modo === 'amistoso' ? { nome: sess.nome, config: normalizeConfig(body.config) } : { nome: sess.nome };
    return await db.rpc('versatte_convite_criar', { p_de: me, p_para: body.para, p_modo: modo, p_ref: null, p_dados: dados });
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
      const id = await jogarAmistoso(db, c.de, c.para, c.dados?.config);
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

  // ---------------- partidas (ao vivo: 1º tempo → intervalo → 2º tempo) ----------------
  if (m === 'GET' && (r = path.match(/^\/partidas\/(\d+)$/))) {
    let p = await lerPartida(db, +r[1], me);
    if (vencida(p)) p = await finalizarPartida(db, p);
    return publicoPartida(p, me);
  }
  if (m === 'POST' && (r = path.match(/^\/partidas\/(\d+)\/intervalo$/))) {
    // o primeiro a chegar ao intervalo abre a janela de substituição (igual para os dois)
    let p = await lerPartida(db, +r[1], me);
    const lado = ladoDe(p, me);
    for (let i = 0; i < 4 && p.fase !== 'fim' && !p.prazo; i++) {
      const prazo = iso(Date.now() + LIVE.janelaIntervaloMs);
      const v = await salvarPartida(db, p, { prazo });
      if (v != null) { p = { ...p, prazo, versao: v }; break; }
      p = await lerPartida(db, +r[1], me);
    }
    if (vencida(p)) p = await finalizarPartida(db, p);
    return { ...publicoPartida(p, me), elenco: p.fase === 'fim' || lado == null ? null : liveRoster(p.estado, lado) };
  }
  if (m === 'POST' && (r = path.match(/^\/partidas\/(\d+)\/substituicoes$/))) {
    let p = await lerPartida(db, +r[1], me);
    const lado = ladoDe(p, me);
    for (let i = 0; i < 4 && p.fase !== 'fim' && subsDe(p, lado) == null; i++) {
      if (p.prazo && Date.now() > Date.parse(p.prazo) + 5000) break;          // passou do prazo (com tolerância de rede)
      const trocas = validSubs(p.estado, lado, body.trocas);
      const subs = { ...(p.subs || {}), [String(lado)]: trocas };
      const v = await salvarPartida(db, p, { subs });
      if (v != null) { p = { ...p, subs, versao: v }; break; }
      p = await lerPartida(db, +r[1], me);
    }
    p = await finalizarPartida(db, p);
    return publicoPartida(p, me);
  }
  if (m === 'POST' && (r = path.match(/^\/partidas\/(\d+)\/desistir$/))) {
    const p = await desistirPartida(db, await lerPartida(db, +r[1], me), me, body.min);
    return publicoPartida(p, me);
  }
  if (m === 'POST' && (r = path.match(/^\/partidas\/(\d+)\/vista$/))) {
    await db.rpc('versatte_partida_vista', { p_id: +r[1], p_usuario: me });
    const p = await db.rpc('versatte_partida', { p_id: +r[1], p_usuario: me });
    if (p?.torneio_id) await fecharRodada(db, p.torneio_id).catch(() => {});
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
    const config = normalizeConfig(body.config);
    const t0 = await db.rpc('versatte_torneio_criar', { p_dono: me, p_nome: nome, p_formato: formato, p_participantes: participantes });
    const t = await mudarTorneio(db, t0.id, t => { t.estado = { ...(t.estado || {}), config }; });
    for (const id of convidados) await db.rpc('versatte_convite_criar', { p_de: me, p_para: id, p_modo: 'torneio', p_ref: t.id, p_dados: { nome: sess.nome, torneio: nome, formato, config } });
    return t;
  }
  if (m === 'GET' && (r = path.match(/^\/torneios\/(\d+)$/))) {
    let t = await db.rpc('versatte_torneio', { p_id: +r[1] });
    if (t?.estado?.emJogo && t.status === 'andamento') t = await fecharRodada(db, t.id);
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
      t.participantes = cup.participantes; t.estado = { ...cup.estado, config: normalizeConfig(t.estado?.config) }; t.status = 'andamento'; t.rodada = 0;
    });
  }
  if (m === 'POST' && (r = path.match(/^\/torneios\/(\d+)\/pronto$/))) {
    return await mudarTorneioPremiando(db, +r[1], async t => {
      if (t.status !== 'andamento') erro(400, 'status', 'O torneio não está em andamento');
      if (t.estado.emJogo) return false;                       // a rodada já está sendo jogada
      const alive = aliveHumans(t);
      const p = t.participantes.find(x => x.id === me);
      if (!p || !alive.includes(me)) erro(400, 'eliminado', 'Você não joga esta rodada');
      p.pronto = true;
      const todos = alive.every(id => t.participantes.find(x => x.id === id).pronto);
      if (todos || (body.forcar && t.dono === me)) await iniciarRodada(db, t);
    });
  }
  if (m === 'POST' && (r = path.match(/^\/torneios\/(\d+)\/cancelar$/))) {
    return await mudarTorneio(db, +r[1], t => { if (t.dono !== me) erro(403, 'dono'); t.status = 'cancelado'; });
  }

  erro(404, 'rota', 'Rota não encontrada');
}

// ---------------- amistoso online ----------------
/** Cria o amistoso já com o 1º tempo simulado; o 2º tempo só depois do intervalo. */
async function jogarAmistoso(db, casaId, foraId, config) {
  const [pc, pf] = await Promise.all([lerPerfil(db, casaId), lerPerfil(db, foraId)]);
  const casa = teamFromProfile(pc), fora = teamFromProfile(pf);
  if (!casa || !fora) erro(400, 'sem-clube', 'Os dois jogadores precisam ter clube criado');
  return novaPartida(db, { tipo: 'amistoso', A: { team: casa, user: casaId, bot: null }, B: { team: fora, user: foraId, bot: null }, config });
}

// ---------------- partidas ao vivo (duas fases) ----------------
const iso = (ms = Date.now()) => new Date(ms).toISOString();
const semente = () => ((Date.now() ^ (Math.random() * 1e9)) >>> 0);
const ladoDe = (p, me) => (p.casa === me ? 0 : p.fora === me ? 1 : null);
const humanoNoLado = (p, s) => !!(s === 0 ? p.casa : p.fora);
const subsDe = (p, s) => (p.subs || {})[String(s)];
/** O intervalo acabou (prazo das substituições) ou ninguém apareceu (prazo máximo)? */
const vencida = (p, now = Date.now()) => p.fase !== 'fim' &&
  ((p.prazo && now > Date.parse(p.prazo)) || (p.prazo_max && now > Date.parse(p.prazo_max)));

/** O que o app recebe: sem o estado interno da simulação (que permitiria prever o 2º tempo). */
function publicoPartida(p, me) {
  const { estado, ...resto } = p;
  return {
    ...resto, lado: ladoDe(p, me), agora: iso(),
    subs_ok: [0, 1].map(s => subsDe(p, s) != null || !humanoNoLado(p, s)),
    recompensa: p.fase === 'fim' ? p.recompensa : {},
  };
}

async function lerPartida(db, id, me) {
  const p = await db.rpc('versatte_partida', { p_id: id, p_usuario: me });
  if (!p) erro(404, 'partida', 'Partida não encontrada');
  return p;
}
const salvarPartida = (db, p, dados) => db.rpc('versatte_partida_salvar', { p_id: p.id, p_versao: p.versao, p_dados: dados });

/** Cria a partida com o 1º tempo já simulado. A/B: { team, user, bot }. */
async function novaPartida(db, { tipo, torneio = null, rodada = null, A, B, config }) {
  const { estado, primeiro } = liveFirstHalf(A.team, B.team, semente());
  const inicio = Date.now() + LIVE.atrasoInicioMs;
  return db.rpc('versatte_partida_nova', {
    p_tipo: tipo, p_torneio: torneio, p_rodada: rodada, p_casa: A.user, p_fora: B.user, p_casa_bot: A.bot, p_fora_bot: B.bot,
    p_times: [serializeTeam(A.team, A.user), serializeTeam(B.team, B.user)], p_resultado: primeiro,
    p_config: normalizeConfig(config), p_estado: estado, p_inicio: iso(inicio), p_prazo_max: iso(inicio + LIVE.prazoMaxMs),
  });
}

function recompensasDe(p, resultado) {
  const r = {};
  if (p.casa) r[p.casa] = onlineReward(resultado, 0);
  if (p.fora) r[p.fora] = onlineReward(resultado, 1);
  return r;
}
/** Credita a diferença entre a recompensa nova e a já paga (desistência depois do fim troca o resultado). */
async function creditar(db, nova, antiga = {}) {
  for (const uid of new Set([...Object.keys(nova), ...Object.keys(antiga)])) {
    const delta = (nova[uid]?.coins || 0) - (antiga[uid]?.coins || 0);
    if (delta) await mudarPerfil(db, uid, d => { d.coins = Math.max(0, d.coins + delta); });
  }
}

/**
 * Fecha o intervalo e simula o 2º tempo quando os dois já mandaram as trocas
 * (robô conta como pronto) ou o prazo acabou. Só um pedido consegue gravar (versão).
 */
async function finalizarPartida(db, p, { torneio = true } = {}) {
  for (let i = 0; i < 4 && p; i++) {
    if (p.fase === 'fim') return p;
    const prontos = [0, 1].every(s => subsDe(p, s) != null || !humanoNoLado(p, s));
    if (!prontos && !vencida(p)) return p;
    const [home, away] = p.times.map(hydrateTeam);
    const resultado = liveSecondHalf(home, away, p.estado, [subsDe(p, 0) || [], subsDe(p, 1) || []], { seed: semente(), knockout: !!p.config?.mata });
    const recompensa = recompensasDe(p, resultado);
    const dados = { fase: 'fim', resultado, estado: null, recompensa, encerrada_em: iso() };
    const v = await salvarPartida(db, p, dados);
    if (v != null) {
      await creditar(db, recompensa);
      if (torneio && p.torneio_id) await fecharRodada(db, p.torneio_id).catch(e => console.error('[torneio]', e));
      return { ...p, ...dados, versao: v };
    }
    p = await db.rpc('versatte_partida_por_id', { p_id: p.id });
  }
  return p;
}

/** Desistência no minuto `min`. Vale até pouco depois do 2º tempo simulado (enquanto ele ainda "passa" na tela). */
async function desistirPartida(db, p, me, min) {
  const lado = ladoDe(p, me);
  if (lado == null) erro(403, 'partida', 'Você não joga esta partida');
  for (let i = 0; i < 4 && p; i++) {
    if (p.fase === 'fim') {
      if (p.resultado?.forfeit != null) return p;
      if (Date.now() > Date.parse(p.encerrada_em || 0) + LIVE.desistirAteMs) return p;
      if (p.torneio_id) {                       // rodada do torneio já fechada: o resultado não muda mais
        const t = await db.rpc('versatte_torneio', { p_id: p.torneio_id });
        if (!t?.estado?.emJogo || t.estado.round !== p.rodada) return p;
      }
    }
    const resultado = liveForfeit(p.resultado, lado, p.fase === 'fim' ? min : Math.min(+min || 0, 45));
    const recompensa = recompensasDe(p, resultado);
    const dados = { fase: 'fim', resultado, estado: null, recompensa, encerrada_em: p.encerrada_em || iso() };
    const v = await salvarPartida(db, p, dados);
    if (v != null) {
      await creditar(db, recompensa, p.fase === 'fim' ? p.recompensa : {});
      if (p.torneio_id) await fecharRodada(db, p.torneio_id).catch(e => console.error('[torneio]', e));
      return { ...p, ...dados, versao: v };
    }
    p = await db.rpc('versatte_partida_por_id', { p_id: p.id });
  }
  erro(409, 'conflito', 'A partida mudou ao mesmo tempo. Tente de novo.');
}

/** Encerra partidas cujo prazo passou (chamado pela caixa de entrada, com folga para não pesar). */
const ultimaVarredura = new Map();
async function varrerVencidas(db, me, caixa) {
  const now = Date.now();
  if (now - (ultimaVarredura.get(me) || 0) < 5000) return false;
  ultimaVarredura.set(me, now);
  if (ultimaVarredura.size > 5000) ultimaVarredura.clear();
  let mudou = false;
  for (const x of caixa.partidas || []) {
    if (!vencida(x, now)) continue;
    const p = await db.rpc('versatte_partida_por_id', { p_id: x.id });
    if (p && vencida(p, now)) { await finalizarPartida(db, p); mudou = true; }
  }
  for (const t of caixa.torneios || []) if (t.em_jogo && t.status === 'andamento') { await fecharRodada(db, t.id).catch(() => {}); mudou = true; }
  return mudou;
}

// ---------------- torneio online ----------------
async function mudarTorneio(db, id, fn) {
  for (let i = 0; i < 5; i++) {
    const t = await db.rpc('versatte_torneio', { p_id: id });
    if (!t) erro(404, 'torneio', 'Torneio não encontrado');
    if ((await fn(t)) === false) return t;          // nada mudou: não grava
    const v = await db.rpc('versatte_torneio_salvar', { p_id: id, p_versao: t.versao, p_status: t.status, p_participantes: t.participantes, p_estado: t.estado, p_rodada: t.rodada, p_campeao: t.campeao || null });
    if (v != null) return { ...t, versao: v };
  }
  erro(409, 'conflito', 'O torneio mudou ao mesmo tempo. Tente de novo.');
}

/**
 * Começa a rodada: jogos com humano viram partidas ao vivo (1º tempo, intervalo, 2º tempo);
 * robô x robô é simulado na hora. A rodada fecha quando todos os jogos acabarem (fecharRodada).
 */
async function iniciarRodada(db, t) {
  const e = t.estado;
  const games = e.rounds[e.round];
  const knockout = t.formato === 'mata';
  const config = normalizeConfig({ ...(e.config || {}), mata: knockout });
  const cache = {};
  const montar = async id => {
    if (cache[id]) return cache[id];
    if (id.startsWith('bot:')) return (cache[id] = { team: botTeam(id.slice(4), 2 + e.round), user: null, bot: id.slice(4) });
    const p = await lerPerfil(db, id);
    const team = teamFromProfile(p);
    return (cache[id] = { team: team || botTeam('rem', 1), user: id, bot: null });
  };
  let aoVivo = 0;
  for (const g of games) {
    const [A, B] = [await montar(g.a), await montar(g.b)];
    if (A.user || B.user) {
      g.partida = await novaPartida(db, { tipo: 'torneio', torneio: t.id, rodada: e.round, A, B, config });
      g.res = null; aoVivo++;
    } else {
      const res = playOnline(A.team, B.team, { seed: semente(), knockout });
      g.partida = null; g.res = { score: res.score, shootout: res.shootout };
    }
  }
  e.emJogo = true;
  if (!aoVivo) await fecharRodadaEm(db, t);
}

/** Partida "assentada": o resultado não muda mais (desistência, os dois já viram o fim, ou passou a janela). */
function assentada(p) {
  if (p.resultado?.forfeit != null) return true;
  const viu = (!p.casa || p.vista_casa) && (!p.fora || p.vista_fora);
  return viu || Date.now() > Date.parse(p.encerrada_em || 0) + LIVE.desistirAteMs;
}

/** Fecha a rodada (dentro de mudarTorneio) se todos os jogos acabaram. Devolve false se nada mudou. */
async function fecharRodadaEm(db, t) {
  const e = t.estado;
  if (!e?.emJogo || t.status !== 'andamento') return false;
  const results = [];
  for (const g of e.rounds[e.round]) {
    if (!g.partida) { results.push({ score: g.res.score, shootout: g.res.shootout, partida: null }); continue; }
    let p = await db.rpc('versatte_partida_por_id', { p_id: g.partida });
    if (p && vencida(p)) p = await finalizarPartida(db, p, { torneio: false });
    if (!p || p.fase !== 'fim' || !assentada(p)) return false;
    results.push({ score: p.resultado.score, shootout: p.resultado.shootout || null, partida: g.partida });
  }
  e.emJogo = false;
  advanceCup(t, results);
  // sem humanos vivos (todos eliminados), as rodadas restantes entre robôs são simuladas na hora
  if (t.status === 'andamento' && aliveHumans(t).length === 0) await iniciarRodada(db, t);
  return true;
}

/**
 * Como mudarTorneio, mas paga os prêmios se ESTA gravação encerrou o torneio
 * (só uma gravação vence a disputa pela versão, então o prêmio sai uma vez só).
 */
async function mudarTorneioPremiando(db, id, fn) {
  let fechou = false;
  const t = await mudarTorneio(db, id, async t => {
    const antes = t.status;
    const r = await fn(t);
    fechou = antes !== 'encerrado' && t.status === 'encerrado';
    return r;
  });
  if (fechou) await premiarTorneio(db, t);
  return t;
}
const fecharRodada = (db, id) => mudarTorneioPremiando(db, id, t => fecharRodadaEm(db, t));

async function premiarTorneio(db, t) {
  for (const h of t.participantes.filter(p => p.tipo === 'humano')) {
    const champ = h.id === t.campeao, vice = h.id === t.vice;
    await mudarPerfil(db, h.id, d => {
      d.coins += champ ? ONLINE_REWARDS.cupChampion : vice ? ONLINE_REWARDS.cupVice : ONLINE_REWARDS.cupPart;
      if (champ) { d.premiumPacks++; d.onlineTrophies = (d.onlineTrophies || 0) + 1; }
    });
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
