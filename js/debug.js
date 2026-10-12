// Painel de debug — simula todo o fluxo da demonstração.
import { COLLECTIONS, COLLECTION_BY_ID, RARITIES, RARITY_ORDER, PACKS } from './data.js';
import { state, save, resetAll, addCard, ownedCount, progress, removeCollection, dayKey, addPacks } from './state.js';
import { simulate } from './gacha.js';
import { icon, sheet, toast, esc, fmtMoney } from './ui.js';
import { sfx } from './fx.js';
import { giveStarterKit, quickCreateClub, simulateUntilLastRound } from './game/club.js';
import { ALL_CARDS, COMPETITIONS } from './data.js';
import { compStatus } from './game/tournament.js';
import { isOnline, isAdmin } from './net/online.js';
import { debugE } from './net/economy.js';

const DAY = 86400000;
let debugCol = COLLECTIONS[0].id;

// As ações calculam QUAIS cartas dar; quem aplica é `econ`: no modo offline, o estado local;
// no online, o servidor (e só para contas administradoras — senão o debug viraria trapaça).
function fillUids(colId, target) {
  const col = COLLECTION_BY_ID[colId];
  const missing = col.cards.filter(c => ownedCount(c.uid) === 0).sort(() => Math.random() - 0.5);
  const need = Math.max(0, Math.ceil(target * col.cards.length) - progress(colId).have);
  return missing.slice(0, need).map(c => c.uid);
}

/** Todas as que faltam menos a mais rara: { uids, last } */
function allButOneUids(colId) {
  const col = COLLECTION_BY_ID[colId];
  const missing = col.cards.filter(c => ownedCount(c.uid) === 0).sort((a, b) => RARITIES[b.rarity].order - RARITIES[a.rarity].order);
  return { uids: missing.slice(1).map(c => c.uid), last: missing[0] || null };
}

async function econ(local, remote) {
  if (!isOnline()) { local(); return true; }
  if (!isAdmin()) { toast('Na conta online, o debug de cartas e moedas é só para administradores.', { tone: 'warn', ms: 3500 }); return false; }
  try { await remote(); return true; } catch (e) { toast(e.message, { tone: 'warn' }); return false; }
}
const giveCards = uids => econ(() => uids.forEach(u => addCard(u)), () => debugE('cartas', { uids }));
const giveFill = (colId, pct) => econ(() => fillUids(colId, pct).forEach(u => addCard(u)), () => debugE('colecao', { colecao: colId, pct }));
function kitUids() { const uids = []; giveStarterKit(uid => { if (!uids.includes(uid)) uids.push(uid); }); return uids; }

export function openDebug(app) {
  const pr = progress(debugCol);
  const offsetDays = Math.round((state.timeOffset || 0) / DAY);
  const s = sheet(`
    <div class="debug">
      <div class="dbg-title">${icon.bug}<h2>Modo debug</h2><span class="pill">${isOnline() ? (isAdmin() ? 'online · admin' : 'online') : 'offline'}</span></div>
      ${isOnline() && !isAdmin() ? '<p class="dbg-info warn">Conta online sem permissão de administrador: ações que dão cartas, moedas ou pacotes ficam bloqueadas no servidor.</p>' : ''}

      <div class="dbg-sec">
        <h4>Roteiro de apresentação</h4>
        <ol class="dbg-steps">
          <li><button data-a="step-free">Abrir o pacote diário grátis</button></li>
          <li><button data-a="step-day">Avançar 1 dia e abrir de novo</button></li>
          <li><button data-a="step-shop">Comprar pacotes na loja</button></li>
          <li><button data-a="step-especial">Abrir premium com carta Especial</button></li>
          <li><button data-a="step-75">Chegar a 75% e resgatar a caneca</button></li>
          <li><button data-a="step-100">Completar a coleção e ganhar a camisa</button></li>
          <li><button data-a="step-club">Montar um clube e jogar a Liga</button></li>
        </ol>
      </div>

      <div class="dbg-sec">
        <h4>Fluxo gratuito</h4>
        <p class="dbg-info">Relógio: <b>${dayKey()}</b> ${offsetDays ? `(+${offsetDays} dia(s))` : ''} · grátis hoje: <b>${state.lastFreeDay === dayKey() ? 'usado' : 'disponível'}</b></p>
        <div class="dbg-btns">
          <button data-a="free-now">Liberar pacote grátis</button>
          <button data-a="day+">Avançar +1 dia</button>
          <button data-a="clock0">Relógio real</button>
        </div>
      </div>

      <div class="dbg-sec">
        <h4>Compras e pontos</h4>
        <p class="dbg-info">Premium: <b>${state.premiumPacks}</b> · Lendário: <b>${state.inv.lendario}</b> · Básico: <b>${state.inv.basico}</b> · Moedas: <b>${state.coins}</b> · Garantia Especial: <b>${state.pity}/${PACKS.premium.pity.after}</b> · Gasto simulado: <b>${fmtMoney(state.stats.spent)}</b></p>
        <div class="dbg-btns">
          <button data-a="p+1">+1 premium</button>
          <button data-a="p+10">+10 premium</button>
          <button data-a="lend">+1 lendário</button>
          <button data-a="pts">+500 moedas</button>
          <button data-a="shop">Abrir loja</button>
        </div>
      </div>

      <div class="dbg-sec">
        <h4>Forçar próxima abertura</h4>
        <div class="dbg-btns rar">
          <button data-force="" class="${!state.forceNext ? 'on' : ''}">Normal</button>
          ${RARITY_ORDER.slice(1).map(r => `<button data-force="${r}" class="${state.forceNext === r ? 'on' : ''}" style="--rc:${RARITIES[r].color}">${RARITIES[r].label}</button>`).join('')}
        </div>
      </div>

      <div class="dbg-sec">
        <h4>Coleção</h4>
        <div class="col-chips">${COLLECTIONS.map(c => `<button data-dcol="${c.id}" class="cchip ${c.id === debugCol ? 'on' : ''}" style="--glow:${c.theme.glow}">${esc(c.short)}</button>`).join('')}</div>
        <p class="dbg-info">${esc(COLLECTION_BY_ID[debugCol].name)}: <b>${pr.have}/${pr.total}</b></p>
        <div class="dbg-btns">
          <button data-a="f25">Ir a 25%</button>
          <button data-a="f50">Ir a 50%</button>
          <button data-a="f75">Ir a 75%</button>
          <button data-a="f-1">Todas menos 1</button>
          <button data-a="f100">Completar 100%</button>
          <button data-a="clear" class="warn">Limpar coleção</button>
        </div>
      </div>

      <div class="dbg-sec">
        <h4>Modo Clube</h4>
        <p class="dbg-info">Clube: <b>${state.club ? esc(state.club.name) : 'não criado'}</b>${state.comp ? ` · ${esc(COMPETITIONS[state.comp.type].name)} ${state.comp.edition}ª ed. · ${esc(compStatus(state.comp))}` : ' · sem campeonato'}</p>
        <div class="dbg-btns">
          <button data-a="kit">Dar kit inicial</button>
          <button data-a="all-cards">Dar todas as cartas</button>
          <button data-a="auto-club">Criar clube automático</button>
          <button data-a="to-last">Ir para a decisão</button>
          <button data-a="trophies">Ganhar os 3 troféus</button>
          <button data-a="pens" class="${state.forcePens ? 'on' : ''}">Forçar pênaltis (mata-mata)</button>
          <button data-a="reset-club" class="warn">Apagar clube</button>
        </div>
      </div>

      <div class="dbg-sec">
        <h4>Balanceamento (Monte Carlo)</h4>
        <p class="dbg-info">Simula jogadores abrindo apenas um tipo de pacote até completar a coleção selecionada.</p>
        <div class="dbg-btns"><button data-a="sim">Rodar 400 simulações</button></div>
        <div class="dbg-sim"></div>
      </div>

      <div class="dbg-sec">
        <h4>Sistema</h4>
        <div class="dbg-btns">
          <button data-a="claims">Resetar resgates</button>
          <button data-a="intro">Rever intro</button>
          <button data-a="reset" class="warn">Resetar tudo (nova conta)</button>
        </div>
      </div>
    </div>`, { cls: 'debug-sheet' });

  const done = (msg, reopen = true) => {
    save(); sfx.tap();
    if (msg) toast(msg, { tone: 'ok' });
    app.refresh();
    if (reopen) { s.close(); setTimeout(() => openDebug(app), 120); }
  };

  s.node.addEventListener('click', async e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.dcol) { debugCol = b.dataset.dcol; return done(); }
    if (b.dataset.force !== undefined) {
      const r = b.dataset.force || null;
      if (await econ(() => { state.forceNext = r; }, () => debugE('forcar', { raridade: r }))) {
        state.forceNext = r;
        return done(r ? `Próximo pacote terá uma carta ${RARITIES[r].label}` : 'Sorteio normal');
      }
      return;
    }
    const a = b.dataset.a;
    const cards = async (uids, msg) => { if (await giveCards(uids)) done(msg); };
    switch (a) {
      case 'free-now': if (await econ(() => { state.lastFreeDay = null; }, () => debugE('gratis'))) done('Pacote grátis liberado'); return;
      case 'day+':
        if (isOnline()) { if (await econ(() => {}, () => debugE('gratis'))) done('Online vale o dia do servidor: pacote grátis liberado'); return; }
        state.timeOffset = (state.timeOffset || 0) + DAY; return done('+1 dia');
      case 'clock0': state.timeOffset = 0; return done('Relógio real');
      case 'p+1': if (await econ(() => { state.premiumPacks += 1; }, () => debugE('premium', { n: 1 }))) done('+1 premium'); return;
      case 'p+10': if (await econ(() => { state.premiumPacks += 10; }, () => debugE('premium', { n: 10 }))) done('+10 premium'); return;
      case 'pts': if (await econ(() => { state.coins += 500; }, () => debugE('moedas', { n: 500 }))) done('+500 moedas'); return;
      case 'lend': if (await econ(() => addPacks('lendario', 1), () => debugE('lendario', { n: 1 }))) done('+1 pacote lendário'); return;
      case 'shop': s.close(); return app.go('shop');
      case 'f25': if (await giveFill(debugCol, 0.25)) done('Coleção em 25%'); return;
      case 'f50': if (await giveFill(debugCol, 0.5)) done('Coleção em 50%'); return;
      case 'f75': if (await giveFill(debugCol, 0.75)) done('Coleção em 75%'); return;
      case 'f-1': return cards(allButOneUids(debugCol).uids, 'Falta só 1 carta');
      case 'f100': if (await giveFill(debugCol, 1)) { save(); s.close(); toast('Coleção completa! Resgate os prêmios liberados.', { tone: 'ok' }); app.go('prizes'); } return;
      case 'clear': if (await econ(() => removeCollection(debugCol), () => debugE('limpar', { colecao: debugCol }))) done('Coleção limpa'); return;
      case 'claims': if (await econ(() => { state.claimed = {}; }, () => debugE('resgates'))) done('Resgates resetados'); return;
      case 'intro': s.close(); return app.intro();
      case 'reset':
        if (!confirm(isOnline() ? 'Zerar cartas, moedas, pacotes e clube DESTA CONTA?' : 'Apagar todo o progresso e a conta deste aparelho?')) return;
        if (isOnline()) {
          if (await econ(() => {}, () => debugE('resetar'))) { state.club = null; state.comp = null; state.trophies = { liga: 0, copa: 0, continental: 0 }; save(); s.close(); app.go('home'); }
          return;
        }
        resetAll(); s.close(); return app.boot();
      case 'sim': return runSim(s.node.querySelector('.dbg-sim'), b);
      case 'kit': return cards(kitUids(), 'Kit inicial: escudo, 2 estádios, 2 mascotes e 12 jogadores');
      case 'all-cards': if (await econ(() => ALL_CARDS.forEach(c => { if (!ownedCount(c.uid)) addCard(c.uid); }), () => debugE('todas'))) done('Todas as cartas liberadas'); return;
      case 'auto-club': quickCreateClub(); save(); s.close(); toast('Clube criado com as suas melhores cartas', { tone: 'ok' }); return app.go('jogar');
      case 'to-last': {
        if (!state.club) { toast('Crie um clube primeiro'); return; }
        if (!state.comp) { toast('Escolha um campeonato primeiro'); return; }
        const n = simulateUntilLastRound(); s.close(); toast(`${n} jogo(s) simulado(s) — jogue a decisão!`, { tone: 'ok' }); return app.go('jogar');
      }
      case 'reset-club': state.club = null; state.league = null; state.comp = null; return done('Clube apagado');
      case 'pens': state.forcePens = !state.forcePens; return done(state.forcePens ? 'Próximo mata-mata vai para os pênaltis' : 'Pênaltis normais');
      case 'trophies': state.trophies = { liga: 1, copa: 1, continental: 1 }; return done('Todos os troféus na sala');
      case 'step-club': {
        if (!ALL_CARDS.some(c => c.kind === 'player' && ownedCount(c.uid)) && !(await giveCards(kitUids()))) return;
        if (!state.club) quickCreateClub();
        save(); s.close(); toast('Clube pronto! Agora é só jogar.', { tone: 'ok' }); return app.go('jogar');
      }

      // roteiro
      case 'step-free':
        if (!(await econ(() => { state.lastFreeDay = null; }, () => debugE('gratis')))) return;
        save(); s.close(); return app.open(state.lastCollection, 'free');
      case 'step-day':
        if (isOnline()) { if (!(await econ(() => {}, () => debugE('gratis')))) return; }
        else state.timeOffset = (state.timeOffset || 0) + DAY;
        save(); s.close(); return app.open(state.lastCollection, 'free');
      case 'step-shop': s.close(); return app.go('shop');
      case 'step-especial':
        if (!(await econ(() => { state.premiumPacks += 1; state.forceNext = 'especial'; }, async () => { await debugE('premium', { n: 1 }); await debugE('forcar', { raridade: 'especial' }); }))) return;
        save(); s.close(); return app.open(state.lastCollection, 'premium');
      case 'step-75':
        if (!(await giveFill(debugCol, 0.75))) return;
        state.lastCollection = debugCol; save(); s.close(); toast('Coleção em 75% — resgate a caneca.', { tone: 'ok' }); return app.go('prizes');
      case 'step-100': {
        // completa tudo menos 1 e garante a última carta no próximo premium, que já abre
        const { uids, last } = allButOneUids(debugCol);
        s.close();
        if (!last) { toast('Coleção já está completa — resgate os prêmios.', { tone: 'ok' }); return app.go('prizes'); }
        const ok = await econ(
          () => { uids.forEach(u => addCard(u)); state.forceCard = last.uid; state.forceNext = null; state.premiumPacks += 1; },
          async () => { await debugE('cartas', { uids }); await debugE('forcarCarta', { uid: last.uid }); await debugE('premium', { n: 1 }); });
        if (!ok) return;
        state.lastCollection = debugCol; save();
        toast(`Falta só ${last.name}! Ela vem neste pacote.`, { ms: 3000 });
        return app.open(debugCol, 'premium');
      }
    }
  });
}

async function runSim(box, btn) {
  btn.disabled = true; btn.textContent = 'Simulando…';
  await new Promise(r => setTimeout(r, 30));
  const f = simulate(debugCol, 'free');
  const p = simulate(debugCol, 'premium');
  const row = (label, m) => `<tr><td>${label}</td><td>${Math.round(m.median)}</td><td>${Math.round(m.p90)}</td></tr>`;
  const pct = m => `${Math.round(m.mark * 100)}%`;
  box.innerHTML = `
    <div class="sim-grid">
      <div>
        <b>Só pacote diário</b><small>(dias)</small>
        <table><thead><tr><th>Meta</th><th>Mediana</th><th>P90</th></tr></thead>
        <tbody>${f.marks.map(m => row(pct(m), m)).join('')}</tbody></table>
      </div>
      <div>
        <b>Só premium</b><small>(pacotes)</small>
        <table><thead><tr><th>Meta</th><th>Mediana</th><th>P90</th></tr></thead>
        <tbody>${p.marks.map(m => row(pct(m), m)).join('')}</tbody></table>
      </div>
    </div>
    <p class="dbg-info">Custo médio para completar só com premium: <b>${fmtMoney(p.marks[3].mean * p.pricePerPack)}</b> (no pacote de melhor valor).</p>`;
  btn.disabled = false; btn.textContent = 'Rodar de novo';
}
