// Painel de debug — simula todo o fluxo da demonstração.
import { COLLECTIONS, COLLECTION_BY_ID, RARITIES, RARITY_ORDER, PACKS } from './data.js';
import { state, save, resetAll, addCard, ownedCount, progress, removeCollection, dayKey } from './state.js';
import { simulate } from './gacha.js';
import { icon, sheet, toast, esc, fmtMoney } from './ui.js';
import { sfx } from './fx.js';

const DAY = 86400000;
let debugCol = COLLECTIONS[0].id;

function fill(colId, target) {
  const col = COLLECTION_BY_ID[colId];
  const missing = col.cards.filter(c => ownedCount(c.uid) === 0).sort(() => Math.random() - 0.5);
  const need = Math.max(0, Math.ceil(target * col.cards.length) - progress(colId).have);
  missing.slice(0, need).forEach(c => addCard(c.uid));
}

function allButOne(colId) {
  const col = COLLECTION_BY_ID[colId];
  const missing = col.cards.filter(c => ownedCount(c.uid) === 0);
  // deixa de fora a carta mais rara que ainda falta
  missing.sort((a, b) => RARITIES[b.rarity].order - RARITIES[a.rarity].order).slice(1).forEach(c => addCard(c.uid));
}

export function openDebug(app) {
  const pr = progress(debugCol);
  const offsetDays = Math.round((state.timeOffset || 0) / DAY);
  const s = sheet(`
    <div class="debug">
      <div class="dbg-title">${icon.bug}<h2>Modo debug</h2><span class="pill">demo</span></div>

      <div class="dbg-sec">
        <h4>Roteiro de apresentação</h4>
        <ol class="dbg-steps">
          <li><button data-a="step-free">Abrir o pacote diário grátis</button></li>
          <li><button data-a="step-day">Avançar 1 dia e abrir de novo</button></li>
          <li><button data-a="step-shop">Comprar pacotes na loja</button></li>
          <li><button data-a="step-especial">Abrir premium com carta Especial</button></li>
          <li><button data-a="step-75">Chegar a 75% e resgatar a caneca</button></li>
          <li><button data-a="step-100">Completar a coleção e ganhar a camisa</button></li>
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
        <p class="dbg-info">Premium: <b>${state.premiumPacks}</b> · Pontos: <b>${state.points}</b> · Garantia Especial: <b>${state.pity}/${PACKS.premium.pity.after}</b> · Gasto simulado: <b>${fmtMoney(state.stats.spent)}</b></p>
        <div class="dbg-btns">
          <button data-a="p+1">+1 premium</button>
          <button data-a="p+10">+10 premium</button>
          <button data-a="pts">+500 pontos</button>
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
        <div class="seg small">${COLLECTIONS.map(c => `<button data-dcol="${c.id}" class="${c.id === debugCol ? 'on' : ''}">${esc(c.short)}</button>`).join('')}</div>
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
      state.forceNext = b.dataset.force || null;
      return done(state.forceNext ? `Próximo pacote terá uma carta ${RARITIES[state.forceNext].label}` : 'Sorteio normal');
    }
    const a = b.dataset.a;
    switch (a) {
      case 'free-now': state.lastFreeDay = null; return done('Pacote grátis liberado');
      case 'day+': state.timeOffset = (state.timeOffset || 0) + DAY; return done('+1 dia');
      case 'clock0': state.timeOffset = 0; return done('Relógio real');
      case 'p+1': state.premiumPacks += 1; return done('+1 premium');
      case 'p+10': state.premiumPacks += 10; return done('+10 premium');
      case 'pts': state.points += 500; return done('+500 pontos');
      case 'shop': s.close(); return app.go('shop');
      case 'f25': fill(debugCol, 0.25); return done('Coleção em 25%');
      case 'f50': fill(debugCol, 0.5); return done('Coleção em 50%');
      case 'f75': fill(debugCol, 0.75); return done('Coleção em 75%');
      case 'f-1': allButOne(debugCol); return done('Falta só 1 carta');
      case 'f100': fill(debugCol, 1); return done('Coleção completa!');
      case 'clear': removeCollection(debugCol); return done('Coleção limpa');
      case 'claims': state.claimed = {}; return done('Resgates resetados');
      case 'intro': s.close(); return app.intro();
      case 'reset':
        if (!confirm('Apagar todo o progresso e a conta deste aparelho?')) return;
        resetAll(); s.close(); return app.boot();
      case 'sim': return runSim(s.node.querySelector('.dbg-sim'), b);

      // roteiro
      case 'step-free': state.lastFreeDay = null; save(); s.close(); return app.open(state.lastCollection, 'free');
      case 'step-day': state.timeOffset = (state.timeOffset || 0) + DAY; save(); s.close(); return app.open(state.lastCollection, 'free');
      case 'step-shop': s.close(); return app.go('shop');
      case 'step-especial': state.premiumPacks += 1; state.forceNext = 'especial'; save(); s.close(); return app.open(state.lastCollection, 'premium');
      case 'step-75': fill(debugCol, 0.75); save(); s.close(); return app.go('prizes');
      case 'step-100': allButOne(debugCol); state.premiumPacks += 1; state.forceNext = null; save(); s.close();
        toast('Falta só 1 carta! Abra o premium (ou use "Completar 100%")', { ms: 3500 });
        return app.go('home');
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
