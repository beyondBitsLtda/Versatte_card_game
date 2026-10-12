// ============================================================
//  MULTIPLAYER — lista de jogadores, convites, trocas de cartas,
//  amistoso online e torneio online (tudo validado no servidor).
//  Tempo real por consulta periódica (polling) à caixa de entrada.
// ============================================================
import { CARD_BY_UID, ALL_CARDS, RARITIES, COLLECTIONS } from '../data.js';
import { state } from '../state.js';
import { cardHTML } from '../cards.js';
import { api, me, isOnline, onInbox, getInbox, pollNow, pollFastMode, applyProfile, refreshProfile } from '../net/online.js';
import { hydrateTeam, cupStandings, cupRoundName, ONLINE_REWARDS } from './online-core.js';
import { playMatch } from './match.js';
import { playTextMatch } from './textmatch.js';
import { mountTrophies } from './trophy3d.js';
import { burst, confetti, sfx, haptic, coinFly } from '../fx.js';
import { icon, esc, el, sheet, overlay, toast, wait } from '../ui.js';

let appRef = null;
const ui = { tab: 'jogadores', busca: '' };
const seen = { convites: new Set(), partidas: new Set(), aceitos: new Set(), first: true };
let openTradeId = null;

const MODES = {
  troca: { ico: '🔄', label: 'Trocar cartas', desc: 'Monte uma troca e confirmem juntos' },
  amistoso: { ico: '⚽', label: 'Amistoso online', desc: 'Seu clube contra o clube dele, simulado no servidor' },
  torneio: { ico: '🏆', label: 'Torneio online', desc: 'Mata-mata ou pontos corridos com amigos (e robôs)' },
};

/** Convites pendentes para mim + partidas não vistas (badge do topo). */
export function pendingCount() {
  const ib = getInbox(); if (!ib) return 0;
  const id = me()?.id;
  return ib.convites.filter(c => c.para === id && c.status === 'pendente').length
    + ib.partidas.filter(p => !p.vista).length;
}

// ============================================================
//  Notificações globais (convites novos, troca aceita, partida pronta)
// ============================================================
export function initMultiplayer(app) {
  appRef = app;
  onInbox(ib => {
    const id = me()?.id;
    for (const c of ib.convites) {
      const k = c.id + c.status;
      if (c.para === id && c.status === 'pendente' && !seen.convites.has(c.id)) {
        seen.convites.add(c.id);
        if (!seen.first) notify(`${MODES[c.modo].ico} <b>${esc(c.nome_de)}</b> te convidou: ${MODES[c.modo].label.toLowerCase()}`, 'Ver', () => app.go('online'));
      }
      // convite que EU enviei e foi aceito → abre a troca / avisa da partida
      // (a troca/partida é criada logo depois do "aceito": só avisa quando a referência já existe)
      if (c.de === id && c.status === 'aceito' && !seen.aceitos.has(k) && (c.ref || c.modo === 'torneio')) {
        seen.aceitos.add(k);
        if (!seen.first && c.modo === 'troca' && c.ref) notify(`🔄 <b>${esc(c.nome_para)}</b> aceitou a troca!`, 'Abrir', () => openTrade(c.ref));
        if (!seen.first && c.modo === 'torneio') notify(`🏆 <b>${esc(c.nome_para)}</b> entrou no seu torneio`, 'Ver', () => app.go('online'));
      }
      if (c.de === id && c.status === 'recusado' && !seen.aceitos.has(k)) { seen.aceitos.add(k); if (!seen.first) toast(`${esc(c.nome_para)} recusou o convite.`); }
    }
    for (const p of ib.partidas) {
      if (!p.vista && !seen.partidas.has(p.id)) {
        seen.partidas.add(p.id);
        if (!seen.first) notify(`⚽ Partida online pronta: <b>${esc(p.nomes[0])} x ${esc(p.nomes[1])}</b>`, 'Assistir', () => watchMatch(p.id));
      }
    }
    seen.first = false;
    // a tela online se atualiza sozinha (menos na lista de jogadores, para não atrapalhar a busca)
    if (location.hash === '#/online' && ui.tab !== 'jogadores' && !document.querySelector('.overlay.open, .sheet-wrap.open')) app.refresh();
  });
}

function notify(html, action, fn) {
  sfx.coin(); haptic([20, 30, 20]);
  const n = el(`<div class="mp-note"><span>${html}</span><button class="btn primary sm">${action}</button><button class="mp-x" aria-label="Fechar">${icon.close}</button></div>`);
  document.body.appendChild(n);
  requestAnimationFrame(() => n.classList.add('in'));
  const close = () => { n.classList.remove('in'); setTimeout(() => n.remove(), 300); };
  n.querySelector('.btn').addEventListener('click', () => { close(); fn(); });
  n.querySelector('.mp-x').addEventListener('click', close);
  setTimeout(close, 9000);
}

// ============================================================
//  TELA ONLINE
// ============================================================
export function onlineView(app) {
  appRef = app;
  if (!isOnline()) {
    return el(`<section class="view online"><div class="empty big">${icon.user}<b>Multiplayer precisa de conta</b><span>Entre ou crie sua conta para trocar cartas e desafiar amigos.</span><button class="btn primary" data-login>Entrar / criar conta</button></div></section>`);
  }
  const ib = getInbox() || { convites: [], trocas: [], partidas: [], torneios: [], online: 0 };
  const id = me().id;
  const recebidos = ib.convites.filter(c => c.para === id && c.status === 'pendente');
  const enviados = ib.convites.filter(c => c.de === id && c.status === 'pendente');
  const trocas = ib.trocas.filter(t => t.status === 'aberta');
  const partidas = ib.partidas.slice(0, 8);
  const torneios = ib.torneios;
  const badge = n => (n ? `<i class="tbadge">${n}</i>` : '');

  const node = el(`
  <section class="view online">
    <div class="vh"><h2>Online</h2><span class="pill"><i class="dot-ok"></i> ${ib.online} online</span></div>
    <div class="seg mp-tabs">
      <button data-tab="jogadores" class="${ui.tab === 'jogadores' ? 'on' : ''}">Jogadores</button>
      <button data-tab="convites" class="${ui.tab === 'convites' ? 'on' : ''}">Convites${badge(recebidos.length + trocas.length + partidas.filter(p => !p.vista).length)}</button>
      <button data-tab="torneios" class="${ui.tab === 'torneios' ? 'on' : ''}">Torneios${badge(torneios.filter(t => t.status !== 'encerrado' && t.status !== 'cancelado').length)}</button>
    </div>
    <div class="mp-body"></div>
  </section>`);
  const body = node.querySelector('.mp-body');

  if (ui.tab === 'jogadores') {
    body.innerHTML = `
      <label class="mp-search">${icon.user}<input placeholder="Buscar jogador pelo nome" value="${esc(ui.busca)}"></label>
      ${!state.club ? `<button class="warn-row" data-go-club>${icon.lock}<span>Crie seu clube no Modo Clube para jogar amistosos e torneios online. Trocas de cartas já estão liberadas.</span>${icon.arrow}</button>` : ''}
      <div class="mp-players"><div class="empty">${icon.clock}<span>Carregando jogadores…</span></div></div>`;
    loadPlayers(body.querySelector('.mp-players'));
    let t = 0;
    body.querySelector('input').addEventListener('input', e => { ui.busca = e.target.value; clearTimeout(t); t = setTimeout(() => loadPlayers(body.querySelector('.mp-players')), 350); });
  }

  if (ui.tab === 'convites') {
    body.innerHTML = `
      ${section('Convites recebidos', recebidos.map(c => `
        <div class="inv">
          <span class="inv-ico">${MODES[c.modo].ico}</span>
          <div><b>${esc(c.nome_de)}</b><small>${MODES[c.modo].label}${c.modo === 'torneio' ? ` · ${esc(c.dados?.torneio || '')} (${c.dados?.formato === 'pontos' ? 'pontos corridos' : 'mata-mata'})` : ''}</small></div>
          <button class="btn ghost sm" data-recusar="${c.id}">Recusar</button>
          <button class="btn primary sm" data-aceitar="${c.id}">Aceitar</button>
        </div>`).join(''), 'Nenhum convite novo.')}
      ${section('Trocas abertas', trocas.map(t => {
        const outro = t.a === id ? t.nome_b : t.nome_a;
        const ok = t.a === id ? t.ok_b : t.ok_a;
        return `<div class="inv"><span class="inv-ico">🔄</span><div><b>Troca com ${esc(outro)}</b><small>${ok ? 'ele já confirmou!' : `${(t.oferta_a.length + t.oferta_b.length)} carta(s) na mesa`}</small></div><button class="btn primary sm" data-troca="${t.id}">Abrir</button></div>`;
      }).join(''), 'Nenhuma troca em andamento.')}
      ${section('Partidas online', partidas.map(p => `
        <div class="inv ${p.vista ? '' : 'new'}">
          <span class="inv-ico">${p.tipo === 'torneio' ? '🏆' : '⚽'}</span>
          <div><b>${esc(p.nomes[0])} ${p.placar[0]} x ${p.placar[1]} ${esc(p.nomes[1])}</b><small>${p.tipo === 'torneio' ? 'Torneio online' : 'Amistoso online'}${p.vista ? '' : ' · nova!'}</small></div>
          <button class="btn ${p.vista ? 'ghost' : 'primary'} sm" data-assistir="${p.id}">${p.vista ? 'Rever' : 'Assistir'}</button>
        </div>`).join(''), 'Nenhuma partida online ainda.')}
      ${section('Enviados', enviados.map(c => `
        <div class="inv dim"><span class="inv-ico">${MODES[c.modo].ico}</span><div><b>${esc(c.nome_para)}</b><small>${MODES[c.modo].label} · aguardando resposta</small></div><button class="btn ghost sm" data-cancelar="${c.id}">Cancelar</button></div>`).join(''), '')}`;
  }

  if (ui.tab === 'torneios') {
    body.innerHTML = `
      <button class="btn primary wide" data-novo-torneio>${icon.trophy} Criar torneio online</button>
      <div class="ot-intro">
        <div class="ot-3d" data-trophy="online" data-spin="0.9"></div>
        <div><b>Copa Online dos Amigos</b><small>Convide até 7 jogadores. As vagas que faltarem viram robôs. Campeão leva ${ONLINE_REWARDS.cupChampion} moedas + pacote premium e o troféu online.</small><span>🏆 Seus títulos online: <b>${state.onlineTrophies || 0}</b></span></div>
      </div>
      ${section('Seus torneios', torneios.map(t => `
        <div class="inv">
          <span class="inv-ico">🏆</span>
          <div><b>${esc(t.nome)}</b><small>${t.formato === 'pontos' ? 'Pontos corridos' : 'Mata-mata'} · ${{ convites: 'aguardando jogadores', andamento: 'em andamento', encerrado: 'encerrado', cancelado: 'cancelado' }[t.status]}${t.campeao ? ` · campeão: ${esc(t.participantes.find(p => p.id === t.campeao)?.nome || '')}` : ''}</small></div>
          <button class="btn ${t.status === 'andamento' ? 'primary' : 'ghost'} sm" data-torneio="${t.id}">Abrir</button>
        </div>`).join(''), 'Você ainda não participa de nenhum torneio.')}`;
    mountTrophies(body);
  }

  node.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.tab) { ui.tab = b.dataset.tab; sfx.tap(); return app.refresh(); }
    if (b.hasAttribute('data-login')) return app.boot({ forceAuth: true });
    if (b.hasAttribute('data-go-club')) return app.go('jogar');
    if (b.dataset.desafiar) return challenge(JSON.parse(b.dataset.desafiar));
    if (b.dataset.aceitar || b.dataset.recusar) return respond(+(b.dataset.aceitar || b.dataset.recusar), !!b.dataset.aceitar, b);
    if (b.dataset.cancelar) { await api('POST', `/convites/${b.dataset.cancelar}/cancelar`).catch(() => {}); await pollNow(); return app.refresh(); }
    if (b.dataset.troca) return openTrade(+b.dataset.troca);
    if (b.dataset.assistir) return watchMatch(+b.dataset.assistir);
    if (b.dataset.torneio) return openCup(+b.dataset.torneio);
    if (b.hasAttribute('data-novo-torneio')) return createCup();
  });
  pollNow();
  return node;
}

const section = (title, html, empty) => (html || empty ? `<div class="section-head"><h3>${title}</h3></div>${html || `<p class="muted mp-empty">${empty}</p>`}` : '');

async function loadPlayers(box) {
  try {
    const list = await api('GET', '/jogadores?busca=' + encodeURIComponent(ui.busca));
    if (!box.isConnected) return;
    box.innerHTML = list.length ? list.map(p => `
      <div class="pl">
        <div class="pl-av ${p.online ? 'on' : ''}">${esc(p.nome[0].toUpperCase())}</div>
        <div class="pl-txt">
          <b>${esc(p.nome)}</b>
          <small>${p.online ? '<i class="dot-ok"></i> online' : 'offline'} · ${p.clube ? esc(p.clube) : 'sem clube'} · ${p.cartas} cartas${p.trofeus ? ` · 🏆${p.trofeus}` : ''}</small>
        </div>
        <button class="btn primary sm" data-desafiar='${esc(JSON.stringify({ id: p.id, nome: p.nome, temClube: p.temClube }))}'>Desafiar</button>
      </div>`).join('') : `<div class="empty">${icon.user}<b>Nenhum jogador encontrado</b><span>Chame os amigos para criar conta no Versatte Cards!</span></div>`;
  } catch (e) { box.innerHTML = `<p class="muted">${esc(e.message)}</p>`; }
}

// ---------------- desafiar ----------------
function challenge(p) {
  const s = sheet(`
    <div class="chal">
      <h2>Desafiar ${esc(p.nome)}</h2>
      <p class="muted">Escolha o modo:</p>
      ${Object.entries(MODES).map(([k, m]) => {
        const blocked = k !== 'troca' && (!state.club || !p.temClube);
        return `<button class="chal-opt" data-modo="${k}" ${blocked ? 'disabled' : ''}>
          <span>${m.ico}</span><div><b>${m.label}</b><small>${blocked ? (!state.club ? 'Crie seu clube no Modo Clube primeiro' : `${esc(p.nome)} ainda não criou o clube`) : m.desc}</small></div>${icon.arrow}
        </button>`;
      }).join('')}
    </div>`);
  s.node.addEventListener('click', async e => {
    const b = e.target.closest('[data-modo]'); if (!b || b.disabled || s.node.classList.contains('busy')) return;
    sfx.tap();
    if (b.dataset.modo === 'torneio') { s.close(); return createCup([p]); }
    s.node.classList.add('busy');
    const small = b.querySelector('small'), old = small.textContent;
    small.innerHTML = '<span class="spinner"></span> Enviando convite…';
    try {
      await api('POST', '/convites', { para: p.id, modo: b.dataset.modo });
      s.close(); toast(`Convite enviado para ${esc(p.nome)}!`, { tone: 'ok' });
      pollFastMode(true); setTimeout(() => pollFastMode(false), 60000);
    } catch (err) { toast(err.message, { tone: 'warn' }); small.textContent = old; s.node.classList.remove('busy'); }
  });
}

async function respond(id, aceitar, btn) {
  btn.disabled = true;
  if (aceitar) btn.innerHTML = '<span class="spinner"></span>';
  try {
    const r = await api('POST', `/convites/${id}/responder`, { aceitar });
    await pollNow();
    if (!aceitar) return appRef.refresh();
    if (r.troca) return openTrade(r.troca);
    if (r.partida) return watchMatch(r.partida);
    if (r.torneio) return openCup(r.torneio);
  } catch (e) { btn.disabled = false; toast(e.message, { tone: 'warn' }); }
}

// ============================================================
//  TROCA DE CARTAS
// ============================================================
export async function openTrade(id) {
  if (openTradeId === id) return;
  openTradeId = id;
  pollFastMode(true);
  const myId = me().id;
  let t = null, myOffer = [], dirty = false, sending = 0, closed = false, filter = 'all';
  const ov = overlay(`<button class="icon-btn ov-x" aria-label="Fechar">${icon.close}</button><div class="trd"></div>`, 'detail-ov trade-ov');
  const root = ov.node.querySelector('.trd');
  const close = () => { closed = true; openTradeId = null; pollFastMode(false); ov.close(); appRef?.refresh(); };
  ov.node.querySelector('.ov-x').addEventListener('click', () => { sfx.tap(); close(); });

  const mine = () => (t.a === myId ? { offer: t.oferta_a, ok: t.ok_a, name: t.nome_a } : { offer: t.oferta_b, ok: t.ok_b, name: t.nome_b });
  const theirs = () => (t.a === myId ? { offer: t.oferta_b, ok: t.ok_b, name: t.nome_b } : { offer: t.oferta_a, ok: t.ok_a, name: t.nome_a });
  const countIn = uid => myOffer.filter(o => o.uid === uid).reduce((s, o) => s + o.n, 0);
  const slot = (o, removable) => {
    const c = CARD_BY_UID[o.uid]; if (!c) return '';
    return `<button class="tr-card" ${removable ? `data-tira="${o.uid}"` : ''}>${cardHTML(c, { size: 'sm' })}${o.n > 1 ? `<span class="count-badge">×${o.n}</span>` : ''}</button>`;
  };

  function render() {
    if (!t) { root.innerHTML = `<div class="empty">${icon.clock}<span>Abrindo troca…</span></div>`; return; }
    const M = mine(), T = theirs();
    if (!dirty) myOffer = M.offer.map(o => ({ ...o }));
    const cards = ALL_CARDS.filter(c => (state.owned[c.uid]?.n || 0) > 0 && (filter === 'all' || filter === 'dupes' ? true : c.collection === filter))
      .filter(c => filter !== 'dupes' || state.owned[c.uid].n > 1)
      .sort((a, b) => RARITIES[b.rarity].order - RARITIES[a.rarity].order);
    const empty = !myOffer.length && !T.offer.length;
    root.innerHTML = `
      <h2>Troca com ${esc(T.name)}</h2>
      <div class="tr-table">
        <div class="tr-side ${M.ok ? 'ok' : ''}">
          <span class="tr-h">Você oferece ${M.ok ? '✔' : ''}</span>
          <div class="tr-cards">${myOffer.map(o => slot(o, true)).join('') || '<p class="muted">Toque nas suas cartas abaixo</p>'}</div>
        </div>
        <div class="tr-swap">⇄</div>
        <div class="tr-side them ${T.ok ? 'ok' : ''}">
          <span class="tr-h">${esc(T.name)} oferece ${T.ok ? '✔' : ''}</span>
          <div class="tr-cards">${T.offer.map(o => slot(o, false)).join('') || '<p class="muted">Aguardando a oferta…</p>'}</div>
        </div>
      </div>
      ${t.erro ? `<p class="tr-err">${esc(t.erro)}</p>` : ''}
      <div class="tr-status">${T.ok && !M.ok ? `<b>${esc(T.name)} já confirmou!</b> Confira e confirme também.` : M.ok ? `Aguardando ${esc(T.name)} confirmar…` : 'Qualquer mudança na mesa desfaz as confirmações.'}</div>
      <div class="tr-actions">
        <button class="btn ghost" data-cancelar-troca>Cancelar troca</button>
        <button class="btn primary big" data-confirmar ${M.ok || empty || dirty ? 'disabled' : ''}>${M.ok ? 'Confirmado ✔' : 'Confirmar troca'}</button>
      </div>
      <div class="section-head"><h3>Sua coleção</h3><span class="muted">toque para oferecer</span></div>
      <div class="filters">
        ${[['all', 'Todas'], ['dupes', 'Repetidas'], ...COLLECTIONS.map(c => [c.id, c.short])].map(([k, l]) => `<button class="chip ${filter === k ? 'on' : ''}" data-filtro="${k}">${esc(l)}</button>`).join('')}
      </div>
      <div class="album-grid tr-mine">
        ${cards.map(c => {
          const have = state.owned[c.uid].n, used = countIn(c.uid);
          return `<button class="slot-owned tr-pick ${used ? 'used' : ''}" data-poe="${c.uid}" ${used >= have ? 'disabled' : ''}>${cardHTML(c, { size: 'sm', count: have - used })}${used ? `<span class="tr-in">na mesa ×${used}</span>` : ''}</button>`;
        }).join('') || '<p class="muted">Você ainda não tem cartas.</p>'}
      </div>`;
  }

  async function sendOffer() {
    const n = ++sending;
    await wait(450);
    if (n !== sending || closed) return;
    try { t = await api('POST', `/trocas/${id}/oferta`, { oferta: myOffer }); dirty = false; render(); }
    catch (e) { toast(e.message, { tone: 'warn' }); dirty = false; refresh(); }
  }

  async function refresh() {
    if (closed) return;
    try {
      const nt = await api('GET', `/trocas/${id}`);
      const changed = !t || nt.versao !== t.versao || nt.ok_a !== t.ok_a || nt.ok_b !== t.ok_b || nt.status !== t.status;
      t = nt;
      if (t.status === 'concluida') return finish();
      if (t.status === 'cancelada') { toast('A troca foi cancelada.'); return close(); }
      if (changed && !dirty) render();
    } catch (e) { toast(e.message, { tone: 'warn' }); return close(); }
    setTimeout(refresh, 1500);
  }

  async function finish() {
    if (closed) return;
    const gave = mine().offer, got = theirs().offer, name = theirs().name;
    closed = true; openTradeId = null; pollFastMode(false);
    ov.close();
    await tradeAnimation(gave, got, name);
    await refreshProfile().catch(() => {});
    appRef?.refresh();
  }

  root.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.filtro) { filter = b.dataset.filtro; return render(); }
    if (b.dataset.poe) {
      if (myOffer.length >= 12) return toast('Máximo de 12 cartas por troca');
      const o = myOffer.find(x => x.uid === b.dataset.poe);
      if (o) o.n++; else myOffer.push({ uid: b.dataset.poe, n: 1 });
      sfx.tap(); dirty = true; render(); return sendOffer();
    }
    if (b.dataset.tira) {
      const o = myOffer.find(x => x.uid === b.dataset.tira);
      if (o) { o.n--; if (o.n <= 0) myOffer = myOffer.filter(x => x !== o); }
      sfx.tap(); dirty = true; render(); return sendOffer();
    }
    if (b.hasAttribute('data-confirmar')) {
      b.disabled = true; sfx.charge();
      try {
        t = await api('POST', `/trocas/${id}/confirmar`, { versao: t.versao });
        if (t.aviso) toast('A oferta mudou: confira de novo antes de confirmar.', { tone: 'warn' });
        if (t.status === 'concluida') { if (t.perfil) applyProfile(t.perfil); return finish(); }
        render();
      } catch (err) { toast(err.message, { tone: 'warn' }); render(); }
      return;
    }
    if (b.hasAttribute('data-cancelar-troca')) {
      if (!confirm('Cancelar esta troca?')) return;
      await api('POST', `/trocas/${id}/cancelar`).catch(() => {});
      return close();
    }
  });
  render();
  refresh();
}

/** Animação especial da troca: as cartas viram energia, giram uma em volta da outra e trocam de lado. */
function tradeAnimation(gave, got, name) {
  return new Promise(resolve => {
    const card = o => CARD_BY_UID[o.uid];
    const stack = (list, cls) => list.slice(0, 3).map((o, i) => `<div class="ta-card ${cls}" style="--i:${i}">${cardHTML(card(o), { size: 'sm' })}</div>`).join('');
    const ov = overlay(`
      <div class="ta">
        <div class="ta-bg"></div>
        <div class="ta-rings"><i></i><i></i><i></i></div>
        <div class="ta-title">TROCANDO…</div>
        <div class="ta-stage">
          <div class="ta-top">${stack(got, 'from-top')}</div>
          <div class="ta-orb a"></div><div class="ta-orb b"></div>
          <div class="ta-bottom">${stack(gave, 'from-bottom')}</div>
        </div>
        <div class="ta-result">
          <h2>Troca concluída!</h2>
          <p>Você recebeu de <b>${esc(name)}</b>:</p>
          <div class="ta-got">${got.map(o => `<div class="ta-new">${cardHTML(card(o), { size: 'sm', live: true })}${o.n > 1 ? `<span class="count-badge">×${o.n}</span>` : ''}</div>`).join('') || '<p class="muted">nada (foi um presente!)</p>'}</div>
          <button class="btn primary big wide" data-ok>Ver minhas cartas</button>
        </div>
      </div>`, 'trade-anim-ov');
    const n = ov.node;
    sfx.charge(); haptic([20, 40, 20]);
    setTimeout(() => { n.classList.add('s1'); sfx.whoosh(); }, 400);                       // cartas voam para o centro
    setTimeout(() => { n.classList.add('s2'); sfx.charge(); haptic([30, 30, 30, 30, 60]); }, 1300);   // viram energia e giram
    setTimeout(() => {                                                                       // explosão de luz e troca
      n.classList.add('s3'); sfx.goal();
      const r = n.querySelector('.ta-stage').getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, { colors: ['#fff', '#7fd0ff', '#FFC940', '#B866FF'], count: 180, speed: 13, shape: 'star', size: 3 });
    }, 3000);
    setTimeout(() => {
      n.classList.add('s4');
      got.forEach(o => sfx.reveal(CARD_BY_UID[o.uid].rarity));
      confetti(['#7fd0ff', '#FFC940', '#B866FF', '#fff']);
    }, 3500);
    n.querySelector('[data-ok]').addEventListener('click', () => { sfx.tap(); ov.close(); resolve(); location.hash = '#/cards'; });
  });
}

// ============================================================
//  ASSISTIR PARTIDA ONLINE
// ============================================================
export async function watchMatch(id) {
  let p;
  try { p = await api('GET', `/partidas/${id}`); } catch (e) { return toast(e.message, { tone: 'warn' }); }
  const myId = me().id;
  const home = hydrateTeam(p.times[0]), away = hydrateTeam(p.times[1]);
  const userSide = p.casa === myId ? 0 : 1;
  const rw = p.recompensa?.[myId];
  const result = p.resultado;
  const play = state.settings.matchView === 'texto' ? playTextMatch : playMatch;
  await play({
    home, away, result, userSide, shootout: result.shootout || null,
    context: { title: p.tipo === 'torneio' ? `Torneio online · rodada ${(p.rodada ?? 0) + 1}` : 'Amistoso online', subtitle: `${home.name} x ${away.name}` },
    onResultHtml: () => (rw ? `<div class="mr-rew"><div class="rw-lines">${rw.lines.map(([l, v], i) => `<div class="rwl" style="--i:${i}"><span>${esc(l)}</span><b>+${v}</b></div>`).join('')}</div><div class="rw">${icon.coin}<b data-count="${rw.coins}">+0</b><span>moedas</span></div></div>` : ''),
  });
  if (!p[userSide === 0 ? 'vista_casa' : 'vista_fora']) {
    await api('POST', `/partidas/${id}/vista`).catch(() => {});
    await refreshProfile().catch(() => {});
    if (rw) setTimeout(() => coinFly(innerWidth / 2, innerHeight * 0.45, rw.coins, { total: state.coins }), 350);
  }
  await pollNow();
  appRef?.refresh();
}

// ============================================================
//  TORNEIO ONLINE
// ============================================================
async function createCup(preselect = []) {
  let players = [];
  try { players = await api('GET', '/jogadores'); } catch (e) { return toast(e.message, { tone: 'warn' }); }
  const pre = new Set(preselect.map(p => p.id));
  const s = sheet(`
    <div class="cupnew">
      <h2>Criar torneio online</h2>
      <label class="fld"><span>Nome</span><input name="nome" maxlength="40" value="Copa dos Amigos"></label>
      <div class="seg cup-fmt"><button data-fmt="mata" class="on">Mata-mata</button><button data-fmt="pontos">Pontos corridos</button></div>
      <p class="muted cup-fmt-d">Jogo único, empate vai para os pênaltis. 4 ou 8 vagas (o resto vira robô).</p>
      <div class="section-head"><h3>Convidar (até 7)</h3><span class="muted cup-n">${pre.size} selecionado(s)</span></div>
      <div class="cup-list">
        ${players.filter(p => p.temClube).map(p => `<label class="cup-p"><input type="checkbox" value="${p.id}" ${pre.has(p.id) ? 'checked' : ''}><span><b>${esc(p.nome)}</b><small>${p.online ? '<i class="dot-ok"></i> online' : 'offline'} · ${esc(p.clube || '')}</small></span></label>`).join('') || '<p class="muted">Nenhum jogador com clube criado ainda.</p>'}
      </div>
      <button class="btn primary big wide" data-criar>Enviar convites</button>
    </div>`);
  let fmt = 'mata';
  s.node.addEventListener('change', () => { s.node.querySelector('.cup-n').textContent = `${s.node.querySelectorAll('.cup-p input:checked').length} selecionado(s)`; });
  s.node.addEventListener('click', async e => {
    const f = e.target.closest('[data-fmt]');
    if (f) {
      fmt = f.dataset.fmt;
      s.node.querySelectorAll('[data-fmt]').forEach(x => x.classList.toggle('on', x === f));
      s.node.querySelector('.cup-fmt-d').textContent = fmt === 'mata' ? 'Jogo único, empate vai para os pênaltis. 4 ou 8 vagas (o resto vira robô).' : 'Todos contra todos, turno único. Mínimo de 4 clubes (o resto vira robô).';
      return;
    }
    if (!e.target.closest('[data-criar]')) return;
    const convidados = [...s.node.querySelectorAll('.cup-p input:checked')].map(i => i.value);
    if (!convidados.length) return toast('Selecione pelo menos um jogador');
    if (convidados.length > 7) return toast('No máximo 7 convidados');
    try {
      const t = await api('POST', '/torneios', { nome: s.node.querySelector('[name=nome]').value, formato: fmt, convidados });
      s.close(); toast('Convites enviados! Abra o torneio para iniciar quando aceitarem.', { tone: 'ok', ms: 3500 });
      ui.tab = 'torneios'; await pollNow(); openCup(t.id);
    } catch (err) { toast(err.message, { tone: 'warn' }); }
  });
}

export async function openCup(id) {
  pollFastMode(true);
  const ov = overlay(`<button class="icon-btn ov-x" aria-label="Fechar">${icon.close}</button><div class="cup"></div>`, 'detail-ov cup-ov');
  const root = ov.node.querySelector('.cup');
  let t = null, closed = false, lastRound = null;
  const myId = me().id;
  let lastGames = '';
  const off = onInbox(ib => {           // novos jogos do torneio aparecem sem recarregar
    const g = JSON.stringify((ib.partidas || []).filter(p => p.torneio_id === id).map(p => [p.id, p.vista]));
    if (g !== lastGames) { lastGames = g; if (t) render(); }
  });
  const close = () => { closed = true; off(); pollFastMode(false); ov.close(); appRef?.refresh(); };
  ov.node.querySelector('.ov-x').addEventListener('click', () => { sfx.tap(); close(); });
  const name = pid => t.participantes.find(p => p.id === pid)?.nome || 'A definir';

  function render() {
    if (!t) { root.innerHTML = `<div class="empty">${icon.clock}<span>Carregando torneio…</span></div>`; return; }
    const isHost = t.dono === myId;
    const e = t.estado || {};
    const humans = t.participantes.filter(p => p.tipo === 'humano');
    let bodyHtml = '';
    if (t.status === 'convites') {
      const accepted = humans.filter(p => p.aceito).length;
      bodyHtml = `
        <div class="section-head"><h3>Participantes</h3><span class="muted">${accepted}/${humans.length} aceitaram</span></div>
        ${humans.map(p => `<div class="inv ${p.aceito ? '' : 'dim'}"><span class="inv-ico">${p.aceito ? '✅' : '⏳'}</span><div><b>${esc(p.nome || 'Convidado')}</b><small>${p.id === t.dono ? 'organizador' : p.aceito ? 'confirmado' : 'aguardando resposta'}</small></div></div>`).join('')}
        ${isHost ? `<button class="btn primary big wide" data-iniciar ${accepted < 2 ? 'disabled' : ''}>${accepted < 2 ? 'Aguardando convidados aceitarem…' : `Iniciar com ${accepted} jogador(es)`}</button><button class="link-btn" data-cancelar-cup>Cancelar torneio</button>` : '<p class="muted">Aguardando o organizador iniciar.</p>'}`;
    } else if (t.status === 'andamento' || t.status === 'encerrado') {
      const games = e.rounds?.[e.round] || [];
      const alive = games.flatMap(g => [g.a, g.b]);
      const iPlay = alive.includes(myId) && t.status === 'andamento';
      const meP = t.participantes.find(p => p.id === myId);
      const waiting = humans.filter(p => alive.includes(p.id) && !p.pronto);
      bodyHtml = `
        ${t.status === 'encerrado' ? `
          <div class="cup-champ">
            <div class="cup-3d" data-trophy="online" data-locked="${t.campeao === myId ? 0 : 1}" data-intro="1"></div>
            <b>${t.campeao === myId ? 'VOCÊ É O CAMPEÃO!' : `Campeão: ${esc(name(t.campeao))}`}</b>
          </div>` : `
          <div class="cup-round">
            <span>${esc(cupRoundName(t.formato, e))}</span>
            ${iPlay ? `<button class="btn primary big wide" data-pronto ${meP?.pronto ? 'disabled' : ''}>${meP?.pronto ? '✔ Pronto — aguardando os outros' : '⚽ Estou pronto: jogar a rodada'}</button>` : '<p class="muted">Você não joga esta rodada — acompanhe o resultado.</p>'}
            ${waiting.length ? `<small>Aguardando: ${waiting.map(p => esc(p.nome)).join(', ')}</small>` : ''}
            ${isHost && waiting.length && iPlay && meP?.pronto ? '<button class="link-btn" data-forcar>Jogar a rodada agora (organizador)</button>' : ''}
          </div>`}
        ${t.formato === 'pontos' ? `
          <div class="tbl">
            <div class="tr th"><span>#</span><span>Clube</span><span>P</span><span>J</span><span>V</span><span>SG</span></div>
            ${cupStandings(e).map((r, i) => `<div class="tr ${r.id === myId ? 'me' : ''}"><span>${i + 1}</span><span class="tc"><b>${esc(name(r.id))}</b></span><span><b>${r.P}</b></span><span>${r.J}</span><span>${r.V}</span><span>${r.SG > 0 ? '+' : ''}${r.SG}</span></div>`).join('')}
          </div>` : `
          <div class="bracket">
            ${(e.rounds || []).map((round, ri) => `
              <div class="br-col ${ri === e.round && t.status === 'andamento' ? 'now' : ''}">
                <span class="br-h">${{ 8: 'Quartas', 4: 'Semifinal', 2: 'Final' }[round.length * 2] || 'Fase'}</span>
                <div class="br-ties">${round.map(g => `
                  <div class="bt">${[[g.a, 0], [g.b, 1]].map(([pid, s]) => `
                    <div class="bt-s ${g.winner === pid ? 'w' : ''} ${g.winner && g.winner !== pid ? 'l' : ''} ${pid === myId ? 'me' : ''}">
                      <b>${esc(name(pid))}</b><i>${g.score ? g.score[s] : ''}${g.pens ? `<small>(${g.pens[s]})</small>` : ''}</i>
                    </div>`).join('')}</div>`).join('')}
                </div>
              </div>`).join('')}
          </div>`}
        <div class="section-head"><h3>Seus jogos</h3></div>
        ${(getInbox()?.partidas || []).filter(p => p.torneio_id === t.id).map(p => `
          <div class="inv ${p.vista ? '' : 'new'}"><span class="inv-ico">⚽</span><div><b>${esc(p.nomes[0])} ${p.placar[0]} x ${p.placar[1]} ${esc(p.nomes[1])}</b><small>rodada ${(p.rodada ?? 0) + 1}</small></div><button class="btn ${p.vista ? 'ghost' : 'primary'} sm" data-assistir="${p.id}">${p.vista ? 'Rever' : 'Assistir'}</button></div>`).join('') || '<p class="muted mp-empty">Os jogos aparecem aqui depois de cada rodada.</p>'}`;
    } else bodyHtml = '<p class="muted">Torneio cancelado.</p>';
    root.innerHTML = `
      <div class="cup-head"><div class="cup-mini" data-trophy="online" data-spin="1"></div><div><span>${t.formato === 'pontos' ? 'Pontos corridos' : 'Mata-mata'} · online</span><h2>${esc(t.nome)}</h2></div></div>
      ${bodyHtml}`;
    mountTrophies(root);
    if (t.status === 'encerrado' && lastRound !== 'fim') {
      lastRound = 'fim';
      if (t.campeao === myId) { sfx.champion(); confetti(['#7fd0ff', '#FFC940', '#fff', '#3DFF8F']); }
    }
  }

  async function refresh() {
    if (closed) return;
    try {
      const nt = await api('GET', `/torneios/${id}`);
      const changed = !t || nt.versao !== t.versao;
      const newRound = t && nt.rodada !== t.rodada;
      t = nt;
      if (changed) { render(); if (newRound) { sfx.whistle(1); toast('Rodada jogada! Assista ao seu jogo.', { tone: 'ok' }); pollNow(); } }
    } catch (e) { toast(e.message, { tone: 'warn' }); return close(); }
    if (t.status === 'encerrado' || t.status === 'cancelado') return;
    setTimeout(refresh, 2000);
  }

  root.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    sfx.tap();
    const act = async (path, body) => { b.disabled = true; try { t = await api('POST', path, body); render(); await pollNow(); render(); } catch (err) { b.disabled = false; toast(err.message, { tone: 'warn' }); } };
    if (b.hasAttribute('data-iniciar')) return act(`/torneios/${id}/iniciar`);
    if (b.hasAttribute('data-pronto')) return act(`/torneios/${id}/pronto`);
    if (b.hasAttribute('data-forcar')) return act(`/torneios/${id}/pronto`, { forcar: true });
    if (b.hasAttribute('data-cancelar-cup')) { if (confirm('Cancelar o torneio?')) { await act(`/torneios/${id}/cancelar`); close(); } return; }
    if (b.dataset.assistir) return watchMatch(+b.dataset.assistir);
  });
  render();
  refresh();
}

