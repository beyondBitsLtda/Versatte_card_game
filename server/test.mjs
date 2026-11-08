// ============================================================
//  Teste de ponta a ponta da API (Worker + SQL em PGlite)
//  Dois jogadores: cadastro, login, pacote, loja, troca, amistoso
//  online ao vivo (intervalo, substituições, desistência), torneio online,
//  maioridade (18+) e compras pela InfinitePay (com um simulador local:
//  nenhuma cobrança real). Rode com: node test.mjs
// ============================================================
import { spawn } from 'node:child_process';
import http from 'node:http';
import { webcrypto as crypto } from 'node:crypto';

const PORT = +(process.env.TEST_PORT || 8811);
const API = `http://127.0.0.1:${PORT}`;

// ---- simulador da InfinitePay: /links devolve um link; /payment_check só diz "pago" para o que o teste pagou
const IP_PORT = PORT + 1, IP_URL = `http://127.0.0.1:${IP_PORT}`;
const ip = { links: [], pagos: new Map(), checks: 0 };
const ipSrv = http.createServer(async (req, res) => {
  let s = ''; for await (const c of req) s += c;
  const b = JSON.parse(s || '{}');
  const send = o => { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(o)); };
  if (b.handle !== 'versatte-teste') { res.writeHead(403); return res.end('{"error":"handle"}'); }
  if (req.url === '/links') { ip.links.push(b); return send({ url: `${IP_URL}/checkout/${b.order_nsu}` }); }
  if (req.url === '/payment_check') {
    ip.checks++;
    const p = ip.pagos.get(b.order_nsu);
    const pago = !!p && p.transacao === b.transaction_nsu && p.slug === b.slug;
    return send({ success: true, paid: pago, amount: p?.amount ?? 0, paid_amount: p?.amount ?? 0, installments: 1, capture_method: 'pix' });
  }
  res.writeHead(404); res.end('{}');
});
await new Promise(r => ipSrv.listen(IP_PORT, '127.0.0.1', r));

const srv = spawn(process.execPath, ['dev.mjs'], {
  cwd: new URL('.', import.meta.url),
  env: { ...process.env, PORT: String(PORT), INFINITEPAY_HANDLE: 'versatte-teste', INFINITEPAY_API_URL: IP_URL },
  stdio: ['ignore', 'pipe', 'inherit'],
});
await new Promise(r => srv.stdout.on('data', d => String(d).includes('Versatte API') && r()));

let falhas = 0;
const ok = (c, msg) => { console.log(c ? '✔' : '✘', msg); if (!c) falhas++; };
const call = async (method, path, body, token, extra = {}) => {
  // cadastro sem data de nascimento no corpo → um adulto (as contas dos testes antigos)
  if (path === '/auth/cadastro' && body && !('nascimento' in body)) body = { nascimento: '1990-05-10', ...body };
  const r = await fetch(API + path, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}), ...extra }, body: body ? JSON.stringify(body) : undefined });
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

  // amistoso online AO VIVO: 1º tempo → intervalo (substituições) → 2º tempo
  await call('PUT', '/perfil/clube', { clube: { club: { ...clubeAna.club, bench: ['jog-cafu', 'jog-falcao', 'jog-garrincha', null, null] } } }, ta);
  const moedas = async tk => (await call('GET', '/eu', null, tk)).perfil.dados.coins;
  const [ma0, mb0] = [await moedas(ta), await moedas(tb)];
  const am = await call('POST', '/convites', { para: B.usuario.id, modo: 'amistoso', config: { estilo: 'texto', vel: 2 } }, ta);
  ok(am.dados?.config?.estilo === 'texto' && am.dados.config.vel === 2, 'desafiante escolhe estilo e velocidade');
  const aa = await call('POST', `/convites/${am.id}/responder`, { aceitar: true }, tb);
  ok(aa.partida, 'amistoso aceito: partida criada');
  let pa = await call('GET', `/partidas/${aa.partida}`, null, ta);
  const maxMin = Math.max(...pa.resultado.events.map(e => e.min));
  ok(pa.fase === '1t' && pa.estado === undefined && maxMin <= 45 && pa.resultado.events.some(e => e.type === 'half') && !pa.resultado.events.some(e => e.type === 'end'),
    `só o 1º tempo existe (${pa.resultado.score.join(' x ')} no intervalo, sem estado interno)`);
  ok(pa.config.vel === 2 && pa.config.estilo === 'texto' && pa.inicio && pa.lado === 0, 'partida traz configuração, apito inicial e o lado do jogador');
  ok(pa.times[1].players.some(p => p.drawn), 'emprestados do Beto foram sorteados no servidor');
  ok((await call('GET', '/caixa', null, tb)).partidas.find(p => p.id === aa.partida).placar === null, 'caixa não mostra placar de partida em andamento');
  ok((await call('GET', `/partidas/${aa.partida}`, null, (await call('POST', '/auth/cadastro', { email: 'c@x.com', nome: 'Caio', chave: ka, aceite: true })).token)).status === 404, 'terceiro não vê a partida dos outros');
  const ia = await call('POST', `/partidas/${aa.partida}/intervalo`, {}, ta);
  ok(ia.prazo && ia.elenco?.onField?.length === 5 && ia.elenco.bench.length === 3 && ia.elenco.subsLeft === 3, 'intervalo abre a janela de substituição com o elenco');
  const ib = await call('POST', `/partidas/${aa.partida}/intervalo`, {}, tb);
  ok(Date.parse(ib.prazo) === Date.parse(ia.prazo), 'o prazo do intervalo é o mesmo para os dois');
  pa = await call('POST', `/partidas/${aa.partida}/substituicoes`, { trocas: [{ out: 2, in: 0 }, { out: 2, in: 1 }, { out: 99, in: 0 }] }, ta);
  ok(pa.fase === '1t' && pa.subs_ok[0] && !pa.subs_ok[1], 'Ana substituiu; 2º tempo espera o Beto');
  pa = await call('POST', `/partidas/${aa.partida}/substituicoes`, { trocas: [] }, tb);
  const subs = pa.resultado.events.filter(e => e.type === 'sub' && e.manual);
  ok(pa.fase === 'fim' && pa.resultado.events.some(e => e.type === 'end') && subs.length === 1 && subs[0].min === 45 && subs[0].team === 0,
    `2º tempo simulado depois das trocas (final ${pa.resultado.score.join(' x ')}, 1 troca válida aplicada)`);
  const [ma1, mb1] = [await moedas(ta), await moedas(tb)];
  ok(ma1 - ma0 === pa.recompensa[A.usuario.id].coins && mb1 - mb0 === pa.recompensa[B.usuario.id].coins, 'moedas creditadas só no fim');
  ok((await call('GET', '/caixa', null, tb)).partidas.find(p => p.id === aa.partida).placar === null, 'placar escondido até o Beto assistir');
  await call('POST', `/partidas/${aa.partida}/vista`, {}, tb);
  ok((await call('GET', '/caixa', null, tb)).partidas.find(p => p.id === aa.partida).placar?.length === 2, 'depois de assistir, o placar aparece');

  // desistência
  const am2 = await call('POST', '/convites', { para: B.usuario.id, modo: 'amistoso', config: {} }, ta);
  const aa2 = await call('POST', `/convites/${am2.id}/responder`, { aceitar: true }, tb);
  const d = await call('POST', `/partidas/${aa2.partida}/desistir`, { min: 30 }, tb);
  ok(d.fase === 'fim' && d.resultado.forfeit === 1 && d.resultado.score[0] >= 3 && d.resultado.score[1] === 0 && d.recompensa[B.usuario.id].coins === 0,
    `Beto desiste: W.O. ${d.resultado.score.join(' x ')} e sem moedas`);
  const d2 = await call('GET', `/partidas/${aa2.partida}`, null, ta);
  ok(d2.resultado.forfeit === 1 && d2.recompensa[A.usuario.id].coins > 0, 'Ana vê a desistência e ganha a vitória');

  // torneio online (rodadas ao vivo)
  const tor = await call('POST', '/torneios', { nome: 'Copa dos Amigos', formato: 'mata', convidados: [B.usuario.id], config: { estilo: 'botao', vel: 4 } }, ta);
  ok(tor.id && tor.estado?.config?.vel === 4, 'torneio criado com convite e configuração');
  const cxb = await call('GET', '/caixa', null, tb);
  const ct = cxb.convites.find(c => c.modo === 'torneio');
  await call('POST', `/convites/${ct.id}/responder`, { aceitar: true }, tb);
  let t = await call('POST', `/torneios/${tor.id}/iniciar`, {}, ta);
  ok(t.status === 'andamento' && t.participantes.length === 4 && t.estado.config.vel === 4, 'torneio iniciado com 2 humanos + 2 robôs');
  const jogarMinhas = async tk => {
    const cx = await call('GET', '/caixa', null, tk);
    for (const p of cx.partidas.filter(p => p.torneio_id === tor.id && p.fase !== 'fim')) {
      await call('POST', `/partidas/${p.id}/intervalo`, {}, tk);
      await call('POST', `/partidas/${p.id}/substituicoes`, { trocas: [] }, tk);
    }
    for (const p of (await call('GET', '/caixa', null, tk)).partidas.filter(p => p.torneio_id === tor.id && !p.vista)) await call('POST', `/partidas/${p.id}/vista`, {}, tk);
  };
  let viuAoVivo = false;
  for (let guard = 0; guard < 8 && t.status === 'andamento'; guard++) {
    const alive = t.estado.rounds[t.estado.round].flatMap(g => [g.a, g.b]);
    if (alive.includes(A.usuario.id)) t = await call('POST', `/torneios/${tor.id}/pronto`, {}, ta);
    if (t.status === 'andamento' && alive.includes(B.usuario.id)) t = await call('POST', `/torneios/${tor.id}/pronto`, {}, tb);
    if (t.estado?.emJogo) {
      const g = t.estado.rounds[t.estado.round].find(g => g.partida);
      const p = g && await call('GET', `/partidas/${g.partida}`, null, alive.includes(A.usuario.id) ? ta : tb);
      if (p?.fase === '1t' && p.config.mata && p.config.vel === 4) viuAoVivo = true;
    }
    await jogarMinhas(ta); await jogarMinhas(tb);
    t = await call('GET', `/torneios/${tor.id}`, null, ta);
    if (t.status === 'andamento' && !alive.includes(A.usuario.id) && !alive.includes(B.usuario.id)) break;
  }
  ok(viuAoVivo, 'rodada do torneio vira partida ao vivo (mata-mata, velocidade do organizador)');
  ok(t.status === 'encerrado' && t.campeao, `torneio encerrado — campeão: ${t.participantes.find(p => p.id === t.campeao)?.nome}`);

  // ---------------- maioridade (18+) ----------------
  const outroIp = n => ({ 'cf-connecting-ip': `10.0.0.${n}` });   // o cadastro tem limite por IP
  const hoje = new Date(), menorNasc = `${hoje.getFullYear() - 17}-01-01`;
  const kc = await chave('carla@x.com', 'senha-da-carla-123');
  ok((await call('POST', '/auth/cadastro', { email: 'carla@x.com', nome: 'Carla', chave: kc, aceite: true, nascimento: undefined }, null, outroIp(1))).erro === 'nascimento', '18+: cadastro sem data de nascimento → recusado');
  const menor = await call('POST', '/auth/cadastro', { email: 'carla@x.com', nome: 'Carla', chave: kc, aceite: true, nascimento: menorNasc }, null, outroIp(2));
  ok(menor.status === 403 && menor.erro === 'menor', '18+: cadastro de menor de idade → 403');
  ok((await call('POST', '/auth/cadastro', { email: 'carla@x.com', nome: 'Carla', chave: kc, aceite: true, nascimento: '2007-02-30' }, null, outroIp(3))).erro === 'nascimento', '18+: data impossível → recusada');
  ok((await call('GET', '/eu', null, ta)).usuario.maior === true, '18+: conta criada com data de adulto fica marcada como maior');
  ok((await call('POST', '/eu/maioridade', { nascimento: menorNasc }, tb)).status === 403, '18+: confirmar idade com data de menor → 403');
  ok((await call('POST', '/eu/maioridade', { nascimento: '1985-12-01' }, tb)).maior === true, '18+: confirmar idade de adulto');

  // ---------------- compras pela InfinitePay (simulador) ----------------
  ok((await call('GET', '/saude')).pagamentos === true, 'pagamentos ativos com INFINITEPAY_HANDLE');
  ok((await call('POST', '/loja/comprar', { oferta: 'p1' }, ta)).status === 410, 'compra simulada desligada quando a InfinitePay está configurada');
  ok((await call('POST', '/pagamento/criar', { oferta: 'xx' }, ta)).erro === 'oferta', 'oferta inexistente → recusada');
  const premiumAntes = (await call('GET', '/eu', null, ta)).perfil.dados.premiumPacks;
  const c1 = await call('POST', '/pagamento/criar', { oferta: 'p5', volta: 'http://127.0.0.1:8765/' }, ta);
  const enviado = ip.links.at(-1);
  ok(c1.url === `${IP_URL}/checkout/${c1.pedido}`, 'cria o pedido e devolve o link de pagamento');
  ok(enviado.order_nsu === c1.pedido && enviado.items[0].price === 1990 && enviado.items[0].quantity === 1 && /6 pacotes premium/.test(enviado.items[0].description),
    `InfinitePay recebe order_nsu, preço em centavos e descrição (${enviado.items[0].description})`);
  ok(enviado.redirect_url === 'http://127.0.0.1:8765/' && !enviado.webhook_url && enviado.customer?.name === 'Ana', 'volta para o jogo; sem webhook em endereço que não é https; comprador pré-preenchido');
  ok((await call('POST', '/pagamento/confirmar', { pedido: c1.pedido }, ta)).pedido.status === 'criado', 'antes de pagar: pedido continua aberto');
  const falso = await call('POST', '/pagamento/webhook', { order_nsu: c1.pedido, transaction_nsu: 'tx-falsa', invoice_slug: 'slug-falso', amount: 1990 });
  ok(falso.status === 400 && (await call('GET', '/eu', null, ta)).perfil.dados.premiumPacks === premiumAntes, 'webhook falso (não conferido na InfinitePay) não credita nada');
  ip.pagos.set(c1.pedido, { transacao: 'tx-1', slug: 'slug-1', amount: 1990 });
  const wh = await call('POST', '/pagamento/webhook', { order_nsu: c1.pedido, transaction_nsu: 'tx-1', invoice_slug: 'slug-1', amount: 1990, receipt_url: 'https://recibo.infinitepay.io/abc' });
  ok(wh._.ok === true && wh._.status === 'creditado', 'webhook verdadeiro → conferido no payment_check e creditado');
  ok((await call('GET', '/eu', null, ta)).perfil.dados.premiumPacks === premiumAntes + 6, '+6 pacotes premium na conta (5 + 1 de bônus)');
  await call('POST', '/pagamento/webhook', { order_nsu: c1.pedido, transaction_nsu: 'tx-1', invoice_slug: 'slug-1' });
  const conf = await call('POST', '/pagamento/confirmar', { pedido: c1.pedido, transacao: 'tx-1', slug: 'slug-1' }, ta);
  ok(conf.pedido.status === 'creditado' && conf.perfil.dados.premiumPacks === premiumAntes + 6, 'webhook repetido e volta do checkout não creditam de novo');
  ok(conf.pedido.recibo === 'https://recibo.infinitepay.io/abc' && !('orders' in conf.perfil.dados), 'comprovante guardado; controle interno não vai para o app');
  ok((await call('POST', '/pagamento/confirmar', { pedido: c1.pedido }, tb)).status === 404, 'outro jogador não vê o pedido');
  ok((await call('POST', '/pagamento/webhook', { order_nsu: crypto.randomUUID() })).ignorado === true, 'webhook de pedido desconhecido é ignorado');
  // volta do checkout antes do webhook (Pix): o app manda slug e transaction_nsu e o servidor confere
  const c2 = await call('POST', '/pagamento/criar', { oferta: 'p1', volta: 'http://127.0.0.1:8765/' }, ta);
  ip.pagos.set(c2.pedido, { transacao: 'tx-2', slug: 'slug-2', amount: 490 });
  const volta = await call('POST', '/pagamento/confirmar', { pedido: c2.pedido, transacao: 'tx-2', slug: 'slug-2' }, ta);
  ok(volta.pedido.status === 'creditado' && volta.perfil.dados.premiumPacks === premiumAntes + 7, 'volta do checkout confere e credita sem esperar o webhook');
  // valor diferente do pedido: não credita
  const c3 = await call('POST', '/pagamento/criar', { oferta: 'p1', volta: 'http://127.0.0.1:8765/' }, ta);
  ip.pagos.set(c3.pedido, { transacao: 'tx-3', slug: 'slug-3', amount: 100 });
  ok((await call('POST', '/pagamento/confirmar', { pedido: c3.pedido, transacao: 'tx-3', slug: 'slug-3' }, ta)).erro === 'valor', 'valor pago diferente do pedido → não credita');
  // limite do dia: 19,90 + 4,90 pagos + 4,90 aberto + 3 × 39,90 = 149,40; o 5º pedido de 39,90 passaria de R$ 200
  for (let i = 0; i < 3; i++) await call('POST', '/pagamento/criar', { oferta: 'p12', volta: 'http://127.0.0.1:8765/' }, ta);
  ok((await call('POST', '/pagamento/criar', { oferta: 'p12', volta: 'http://127.0.0.1:8765/' }, ta)).status === 200, 'dentro do limite de R$ 200 por dia');
  ok((await call('POST', '/pagamento/criar', { oferta: 'p12', volta: 'http://127.0.0.1:8765/' }, ta)).erro === 'limite-gasto', 'acima de R$ 200 no dia → recusado');
  const compras = await call('GET', '/pagamentos', null, ta);
  ok(compras.pedidos.length >= 6 && compras.pedidos.filter(p => p.status === 'creditado').length === 2, `lista de compras da conta (${compras.pedidos.length})`);
  // estorno (administrador)
  ok((await call('POST', `/admin/pedidos/${c1.pedido}/estornar`, {}, tb)).status === 403, 'estorno: só administrador');
  const est = await call('POST', `/admin/pedidos/${c1.pedido}/estornar`, {}, ta);
  ok(est.pedido.status === 'estornado' && est.retirado.premium === 6, 'estorno marca o pedido e tira os 6 pacotes');
  ok((await call('GET', '/eu', null, ta)).perfil.dados.premiumPacks === premiumAntes + 1, 'perfil sem os pacotes estornados');
  ok((await call('POST', '/pagamento/webhook', { order_nsu: c1.pedido, transaction_nsu: 'tx-1', invoice_slug: 'slug-1' }))._.status === 'estornado'
    && (await call('GET', '/eu', null, ta)).perfil.dados.premiumPacks === premiumAntes + 1, 'webhook depois do estorno não credita de novo');
} catch (e) { console.error(e); falhas++; }
srv.kill();
ipSrv.close();
console.log(falhas ? `\n${falhas} FALHA(S)` : '\nAPI OK');
process.exit(falhas ? 1 : 0);
