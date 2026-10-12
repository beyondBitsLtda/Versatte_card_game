// ============================================================
//  Teste de ponta a ponta da API (Worker + SQL em PGlite)
//  Dois jogadores: cadastro, login, pacote, loja, troca, amistoso
//  online e torneio online. Rode com: node test.mjs
// ============================================================
import { spawn } from 'node:child_process';
import { webcrypto as crypto } from 'node:crypto';

const PORT = +(process.env.TEST_PORT || 8811);
const API = `http://127.0.0.1:${PORT}`;
const srv = spawn(process.execPath, ['dev.mjs'], { cwd: new URL('.', import.meta.url), env: { ...process.env, PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise(r => srv.stdout.on('data', d => String(d).includes('Versatte API') && r()));

let falhas = 0;
const ok = (c, msg) => { console.log(c ? '✔' : '✘', msg); if (!c) falhas++; };
const call = async (method, path, body, token) => {
  const r = await fetch(API + path, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json(); return { status: r.status, ...j, _: j };
};

// a mesma derivação do navegador (PBKDF2-SHA512 em rodadas, sal do e-mail)
async function chave(email, senha) {
  const enc = new TextEncoder();
  const sal = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode('versatte:' + email.trim().toLowerCase())));
  let material = enc.encode(senha), bits;
  for (let i = 0; i < 3; i++) {
    const k = await crypto.subtle.importKey('raw', material, 'PBKDF2', false, ['deriveBits']);
    bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: sal, iterations: 70000, hash: 'SHA-512' }, k, 256);
    material = new Uint8Array(bits);
  }
  return Buffer.from(bits).toString('base64url');
}

try {
  ok((await call('GET', '/saude')).ok, 'saúde');
  const ka = await chave('ana@admin.local', 'senha-da-ana-123');
  const A = await call('POST', '/auth/cadastro', { email: 'ana@admin.local', nome: 'Ana', chave: ka, aceite: true });
  ok(A.token && A.usuario.admin, 'cadastro da Ana (admin de teste)');
  const dupl = await call('POST', '/auth/cadastro', { email: 'ANA@admin.local', nome: 'Xu', chave: ka, aceite: true });
  ok(dupl.status === 409, 'e-mail repetido recusado ' + JSON.stringify(dupl._));
  ok((await call('POST', '/auth/cadastro', { email: 'z@z.com', nome: 'Zé', chave: ka })).status === 400, 'sem aceite dos termos → recusado');
  ok((await call('POST', '/auth/entrar', { email: 'ana@admin.local', chave: await chave('ana@admin.local', 'errada') })).status === 401, 'senha errada → 401');
  const login = await call('POST', '/auth/entrar', { email: 'Ana@Admin.local', chave: ka });
  ok(login.token, 'login (e-mail em maiúsculas)');
  const ta = login.token;
  const B = await call('POST', '/auth/cadastro', { email: 'beto@x.com', nome: 'Beto', chave: await chave('beto@x.com', 'senha-do-beto-123'), aceite: true });
  const tb = B.token;
  ok((await call('GET', '/eu', null, 'lixo')).status === 401, 'token inválido → 401');

  const eu = await call('GET', '/eu', null, ta);
  ok(eu.perfil.dados.premiumPacks === 1 && eu.perfil.dados.coins === 100, 'bônus de boas-vindas: 1 premium + 100 moedas');

  const p1 = await call('POST', '/pacote/abrir', { colecao: 'clubes', tipo: 'free' }, ta);
  ok(p1.cards?.length === 3, `pacote grátis abre 3 cartas (${p1.cards?.map(c => c.uid).join(', ')})`);
  ok((await call('POST', '/pacote/abrir', { colecao: 'clubes', tipo: 'free' }, ta)).erro === 'gratis-usado', 'segundo grátis no mesmo dia → recusado');
  ok((await call('POST', '/pacote/abrir', { colecao: 'juizo-final', tipo: 'basico' }, ta)).erro === 'so-premium', 'básico na coleção só-premium → recusado');
  const p2 = await call('POST', '/pacote/abrir', { colecao: 'jogadores', tipo: 'premium' }, ta);
  ok(p2.cards?.length === 4 && p2.perfil.dados.premiumPacks === 0, 'premium abre 4 cartas e consome o pacote');
  ok((await call('POST', '/pacote/abrir', { colecao: 'jogadores', tipo: 'premium' }, ta)).erro === 'sem-pacote', 'sem pacote premium → recusado');
  ok((await call('POST', '/loja/trocar', { tipo: 'lendario' }, ta)).erro === 'sem-moedas', 'trocar sem moedas suficientes → recusado');
  ok((await call('POST', '/loja/trocar', { tipo: 'basico' }, tb)).erro === 'sem-moedas', 'Beto (100 moedas) não troca pacote básico de 120');
  await call('POST', '/debug', { acao: 'moedas', n: 200 }, ta);
  const ex = await call('POST', '/loja/trocar', { tipo: 'basico' }, ta);
  ok(ex.perfil?.dados.inv.basico === 1 && ex.perfil.dados.coins >= 0, 'Ana troca 120 moedas por pacote básico');
  ok((await call('POST', '/debug', { acao: 'moedas', n: 1000 }, tb)).status === 403, 'debug bloqueado para conta comum');
  const dbg = await call('POST', '/debug', { acao: 'todas' }, ta);
  ok(Object.keys(dbg.perfil.dados.owned).length > 100, 'debug (admin) dá todas as cartas');
  ok((await call('POST', '/recompensa', { motivo: 'partida', moedas: 9999 }, ta)).moedas === 120, 'recompensa de partida limitada a 120');
  ok((await call('POST', '/recompensa', { motivo: 'partida', moedas: 50 }, ta)).status === 429, 'recompensas seguidas rápidas demais → 429');

  // clubes
  const clubeAna = { club: { name: 'Ana FC', abbr: 'ANA', crest: 'clube-fla', stadium: 'estadio-maracana', mascot: 'masc-fla', formation: '1-2-1', slots: ['jog-ceni', 'jog-figueroa', 'jog-zico', 'jog-socrates', 'jog-pele-prime'], bench: [null, null, null, null, null] } };
  ok((await call('PUT', '/perfil/clube', { clube: clubeAna }, ta)).versao > 0, 'Ana salva o clube');
  ok((await call('POST', '/convites', { para: B.usuario.id, modo: 'amistoso' }, ta)).erro === 'sem-clube-dele', 'desafio a quem não tem clube → recusado');
  await call('PUT', '/perfil/clube', { clube: { club: { name: 'Beto EC', abbr: 'BET', crest: null, stadium: null, mascot: null, formation: '1-2-1', slots: ['loan', 'loan', null, null, 'loan'], bench: [null, null, null, null, null] } } }, tb);

  // jogadores e convites
  const lista = await call('GET', '/jogadores', null, ta);
  ok(lista._.length === 1 && lista._[0].nome === 'Beto' && lista._[0].online, 'Ana vê o Beto online');

  // troca
  const cv = await call('POST', '/convites', { para: B.usuario.id, modo: 'troca' }, ta);
  const cx = await call('GET', '/caixa', null, tb);
  ok(cx.convites.some(c => c.id === cv.id && c.modo === 'troca'), 'Beto recebe o convite de troca na caixa');
  const acc = await call('POST', `/convites/${cv.id}/responder`, { aceitar: true }, tb);
  ok(acc.troca, 'Beto aceita: troca aberta');
  const betoCarta = Object.keys((await call('GET', '/eu', null, tb)).perfil.dados.owned)[0];
  ok((await call('POST', `/trocas/${acc.troca}/oferta`, { oferta: [{ uid: 'jog-pele-prime', n: 1 }] }, tb)).erro === 'carta', 'oferecer carta que não tem → recusado');
  await call('POST', `/trocas/${acc.troca}/oferta`, { oferta: [{ uid: 'jog-pele-prime', n: 1 }] }, ta);
  let tr = await call('POST', `/trocas/${acc.troca}/oferta`, betoCarta ? { oferta: [{ uid: betoCarta, n: 1 }] } : { oferta: [] }, tb);
  tr = await call('POST', `/trocas/${acc.troca}/confirmar`, { versao: tr.versao }, ta);
  tr = await call('POST', `/trocas/${acc.troca}/confirmar`, { versao: tr.versao }, tb);
  ok(tr.status === 'concluida' && tr.perfil.dados.owned['jog-pele-prime'], 'troca concluída: Beto recebeu o Pelé Prime');

  // amistoso online
  const am = await call('POST', '/convites', { para: B.usuario.id, modo: 'amistoso' }, ta);
  const aa = await call('POST', `/convites/${am.id}/responder`, { aceitar: true }, tb);
  ok(aa.partida, 'amistoso aceito: partida simulada no servidor');
  const pa = await call('GET', `/partidas/${aa.partida}`, null, ta);
  ok(pa.resultado?.events?.length > 2 && pa.times?.length === 2, `partida com eventos (placar ${pa.resultado?.score?.join(' x ')})`);
  ok(pa.times[1].players.some(p => p.drawn), 'emprestados do Beto foram sorteados no servidor');
  ok((await call('GET', `/partidas/${aa.partida}`, null, (await call('POST', '/auth/cadastro', { email: 'c@x.com', nome: 'Caio', chave: ka, aceite: true })).token)).status === 404, 'terceiro não vê a partida dos outros');

  // torneio online
  const tor = await call('POST', '/torneios', { nome: 'Copa dos Amigos', formato: 'mata', convidados: [B.usuario.id] }, ta);
  ok(tor.id, 'torneio criado com convite');
  const cxb = await call('GET', '/caixa', null, tb);
  const ct = cxb.convites.find(c => c.modo === 'torneio');
  await call('POST', `/convites/${ct.id}/responder`, { aceitar: true }, tb);
  let t = await call('POST', `/torneios/${tor.id}/iniciar`, {}, ta);
  ok(t.status === 'andamento' && t.participantes.length === 4, 'torneio iniciado com 2 humanos + 2 robôs');
  for (let guard = 0; guard < 6 && t.status === 'andamento'; guard++) {
    const alive = t.estado.rounds[t.estado.round].flatMap(g => [g.a, g.b]);
    if (alive.includes(A.usuario.id)) t = await call('POST', `/torneios/${tor.id}/pronto`, {}, ta);
    if (t.status === 'andamento' && alive.includes(B.usuario.id)) t = await call('POST', `/torneios/${tor.id}/pronto`, {}, tb);
    if (t.status === 'andamento' && !alive.includes(A.usuario.id) && !alive.includes(B.usuario.id)) break;
  }
  ok(t.status === 'encerrado' && t.campeao, `torneio encerrado — campeão: ${t.participantes.find(p => p.id === t.campeao)?.nome}`);
} catch (e) { console.error(e); falhas++; }
srv.kill();
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nAPI OK');
process.exit(falhas ? 1 : 0);
