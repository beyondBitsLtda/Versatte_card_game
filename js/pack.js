// Pacote 3D (CSS 3D) + sequência de abertura estilo TCG.
import { COLLECTION_BY_ID, RARITIES } from './data.js';
import { state, progress, readyPrizes, freeAvailable } from './state.js';
import { openPack } from './gacha.js';
import { cardHTML, rarityTag } from './cards.js';
import { burst, confetti, centerOf, sfx, haptic, attachTilt, enableGyro } from './fx.js';
import { overlay, el, esc, icon, wait } from './ui.js';

function packArt(col, type) {
  const premium = type === 'premium';
  const [l1, l2] = col.id === 'idolos' ? ['ÍDOLOS', 'LENDAS'] : ['SÉRIE A', '2026'];
  return `
    <div class="pk-art">
      <div class="pk-foil"></div>
      <div class="pk-lines"></div>
      <div class="pk-crimp top"></div>
      <div class="pk-crimp bottom"></div>
      <div class="pk-brand">VERSATTE <b>CARDS</b></div>
      <div class="pk-emblem"><img src="assets/logo-versatte.png" alt="" draggable="false"></div>
      <div class="pk-title"><span>${l1}</span><strong>${l2}</strong></div>
      <div class="pk-badge">${premium ? `${icon.sparkle} PREMIUM · 4 CARTAS` : 'DIÁRIO · 3 CARTAS'}</div>
      <div class="pk-shine"></div>
    </div>`;
}

const faces = (col, type, part) => `
  <div class="pf front">${packArt(col, type)}</div>
  <div class="pf back"><div class="pk-backart"></div></div>
  <div class="pf side left"></div>
  <div class="pf side right"></div>
  <div class="pf cap-end ${part === 'cap' ? 'top' : 'bottom'}"></div>`;

export function packHTML(collectionId, type = 'free') {
  const col = COLLECTION_BY_ID[collectionId];
  return `
    <div class="pack3d t-${type} c-${col.id}" style="--c1:${col.theme.c1};--c2:${col.theme.c2};--glow:${col.theme.glow}">
      <div class="pk-rot">
        <div class="pk-part pk-cap">${faces(col, type, 'cap')}</div>
        <div class="pk-part pk-body">${faces(col, type, 'body')}<div class="pk-inner-light"></div></div>
        <div class="pk-cut"><i></i></div>
      </div>
      <div class="pk-shadow"></div>
    </div>`;
}

// ------------------------------------------------------------
//  Sequência de abertura
// ------------------------------------------------------------
export function startOpening(collectionId, type, { onDone } = {}) {
  enableGyro();
  const col = COLLECTION_BY_ID[collectionId];
  const before = progress(collectionId);
  const readyBefore = new Set(readyPrizes().map(p => p.id));
  const result = openPack(collectionId, type);

  const ov = overlay(`
    <div class="open-bg" style="--glow:${col.theme.glow}"></div>
    <div class="open-head">
      <span class="open-kind">${type === 'premium' ? 'Pacote premium' : 'Pacote diário'} · ${esc(col.name)}</span>
      <button class="link-btn open-skip">Pular</button>
    </div>
    <div class="open-stage">
      <div class="pack-holder">${packHTML(collectionId, type)}</div>
      <div class="deck"></div>
      <div class="reveal-chip"></div>
    </div>
    <div class="open-foot">
      <div class="tear-hint">${icon.swipe}<span>Deslize o dedo sobre o pacote para rasgar</span></div>
      <div class="deck-counter"></div>
    </div>`, 'opening');

  const node = ov.node;
  const stage = node.querySelector('.open-stage');
  const pack = node.querySelector('.pack3d');
  const cut = node.querySelector('.pk-cut');
  const deck = node.querySelector('.deck');
  const chip = node.querySelector('.reveal-chip');
  const counter = node.querySelector('.deck-counter');
  const hint = node.querySelector('.tear-hint');
  const stopTilt = attachTilt(pack, { max: 12 });

  let phase = 'tear';
  let prog = 0, lastX = null, lastTick = 0;

  // ---------- fase 1: rasgar ----------
  const onDown = e => { if (phase !== 'tear') return; lastX = e.clientX; stage.setPointerCapture?.(e.pointerId); };
  const onMove = e => {
    if (phase !== 'tear' || lastX == null) return;
    const dx = Math.abs(e.clientX - lastX);
    lastX = e.clientX;
    prog = Math.min(1, prog + dx / (pack.offsetWidth * 0.75)); // um deslize de ponta a ponta já rasga
    pack.style.setProperty('--cut', prog.toFixed(3));
    pack.classList.add('cutting');
    if (prog - lastTick > 0.08) {
      lastTick = prog; sfx.tearTick(); haptic(6);
      const r = cut.getBoundingClientRect();
      burst(r.left + r.width * prog, r.top + r.height / 2, { colors: ['#fff', col.theme.glow, col.theme.c2], count: 8, speed: 4, size: 1.6, decay: 0.04 });
    }
    if (prog >= 1) tear();
  };
  const onUp = () => { lastX = null; };
  stage.addEventListener('pointerdown', onDown);
  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerup', onUp);
  stage.addEventListener('pointercancel', onUp);
  pack.addEventListener('dblclick', () => phase === 'tear' && tear());

  async function tear() {
    if (phase !== 'tear') return;
    phase = 'burst';
    stopTilt();
    hint.classList.add('gone');
    sfx.tear(); haptic([20, 30, 40]);
    pack.classList.add('torn');
    const r = cut.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top, { colors: ['#fff', col.theme.glow, col.theme.c2], count: 70, speed: 9, spread: Math.PI, angle: -Math.PI / 2, g: 0.15 });
    node.classList.add('flash');
    await wait(520);
    sfx.whoosh();
    buildDeck();
    pack.classList.add('drop');
    deck.classList.add('rise');
    await wait(650);
    node.querySelector('.pack-holder').remove();
    phase = 'reveal';
    nextHint();
  }

  // ---------- fase 2: revelar ----------
  const items = result.cards;          // ordem: menor → maior raridade
  let idx = 0;
  let busy = false;

  function buildDeck() {
    // a carta do topo (1ª a revelar) é a última do DOM
    items.slice().reverse().forEach((it, i) => {
      const depth = items.length - 1 - i;
      const c = el(cardHTML(it.card, { size: 'lg', flipped: true, live: true }));
      c.style.setProperty('--d', depth);
      c.classList.add('deck-card');
      deck.appendChild(c);
      it.node = c;
    });
  }

  function nextHint() {
    const it = items[idx];
    counter.textContent = `${idx + 1} / ${items.length}`;
    chip.className = 'reveal-chip';
    if (!it) return;
    const ord = RARITIES[it.card.rarity].order;
    if (ord >= 1) it.node.classList.add('hint', `hint-${it.card.rarity}`);
    it.node.classList.add('top');
  }

  async function reveal(it) {
    busy = true;
    const r = it.card.rarity;
    const ord = RARITIES[r].order;
    if (ord >= 2) {
      it.node.classList.add('charging');
      node.classList.add(`dim-${r}`);
      sfx.charge(); haptic(r === 'especial' ? [30, 40, 30, 40, 60] : [20, 30, 20]);
      await wait(r === 'especial' ? 1250 : 650);
      it.node.classList.remove('charging');
    }
    it.node.classList.remove('flipped', 'hint');
    sfx.flip();
    await wait(300);
    sfx.reveal(r);
    const c = centerOf(it.node);
    const R = RARITIES[r];
    const colors = { comum: ['#fff', '#C7D2E0'], rara: ['#fff', R.color, '#7fe0ff'], muito: ['#fff', R.color, '#ff7ad9', '#7fe0ff'], especial: ['#fff', '#FFC940', '#FF8A1F', '#fff3c4'] }[r];
    burst(c.x, c.y, { colors, count: [24, 50, 90, 160][ord], speed: [5, 7, 9, 12][ord], shape: ord >= 2 ? 'star' : 'spark', size: ord >= 2 ? 3 : 2 });
    if (r === 'especial') { node.classList.add('rays'); confetti(colors); haptic([60, 40, 120]); }
    else if (ord >= 1) haptic(25);
    it.stopTilt = attachTilt(it.node, { max: 14 });
    chip.innerHTML = it.isNew
      ? `<b class="new">NOVA!</b> ${rarityTag(r)}`
      : `<span class="dupe">Repetida · ×${it.copies}</span> <b class="pts">+${it.points} pts</b>`;
    chip.className = `reveal-chip show ${it.isNew ? 'is-new' : ''}`;
    if (!it.isNew) setTimeout(() => sfx.coin(), 250);
    it.revealed = true;
    busy = false;
  }

  async function dismiss(it, dir = -1) {
    busy = true;
    it.stopTilt && it.stopTilt();
    node.classList.remove('rays', 'dim-muito', 'dim-especial');
    chip.className = 'reveal-chip';
    it.node.style.setProperty('--dir', dir);
    it.node.classList.add('away');
    sfx.whoosh();
    await wait(260);
    idx++;
    busy = false;
    if (idx >= items.length) { setTimeout(() => it.node.remove(), 400); return summary(); }
    nextHint();
    setTimeout(() => it.node.remove(), 500);
  }

  let sx = null;
  deck.addEventListener('pointerdown', e => { sx = e.clientX; });
  deck.addEventListener('pointerup', e => {
    if (phase !== 'reveal' || busy) return;
    const it = items[idx]; if (!it) return;
    const dx = sx == null ? 0 : e.clientX - sx;
    sx = null;
    if (!it.revealed) return reveal(it);
    dismiss(it, dx > 0 ? 1 : -1); // toque ou deslize: a carta sai para o lado do gesto
  });

  node.querySelector('.open-skip').addEventListener('click', () => {
    if (phase === 'summary') return;
    stopTilt();
    items.forEach(it => it.stopTilt && it.stopTilt());
    summary();
  });

  // ---------- fase 3: resumo ----------
  function summary() {
    if (phase === 'summary') return;
    phase = 'summary';
    node.classList.remove('rays', 'flash', 'dim-muito', 'dim-especial');
    const after = progress(collectionId);
    const newPrizes = readyPrizes().filter(p => !readyBefore.has(p.id));
    const canAgain = state.premiumPacks > 0 || freeAvailable();
    const sorted = items.slice().sort((a, b) => RARITIES[b.card.rarity].order - RARITIES[a.card.rarity].order);
    const panel = el(`
      <div class="summary">
        <h2>Pacote aberto!</h2>
        <p class="muted">${result.cards.filter(c => c.isNew).length} nova(s) · ${result.cards.filter(c => !c.isNew).length} repetida(s)</p>
        <div class="sum-grid n${items.length}">
          ${sorted.map((it, i) => `
            <div class="sum-item" style="--i:${i}" data-uid="${it.card.uid}">
              ${cardHTML(it.card, { size: 'sm' })}
              <span class="sum-chip ${it.isNew ? 'new' : ''}">${it.isNew ? 'NOVA' : `+${it.points} pts`}</span>
            </div>`).join('')}
        </div>
        ${result.points ? `<div class="sum-points">${icon.coin}<span>+${result.points} pontos por repetidas</span></div>` : ''}
        <div class="sum-prog">
          <div class="sp-head"><span>${esc(col.name)}</span><b>${after.have}/${after.total}</b></div>
          <div class="bar"><i style="--from:${before.pct};--to:${after.pct}"></i></div>
        </div>
        ${newPrizes.length ? `
          <button class="prize-unlock" data-go="prizes">
            ${icon.gift}<div><b>Prêmio desbloqueado!</b><span>${newPrizes.map(p => esc(p.title)).join(' · ')}</span></div>${icon.arrow}
          </button>` : ''}
        <div class="sum-actions">
          ${canAgain ? `<button class="btn primary" data-again>Abrir outro</button>` : `<button class="btn primary" data-go="shop">Comprar pacotes</button>`}
          <button class="btn ghost" data-go="album">Ver no álbum</button>
        </div>
        <button class="link-btn" data-close-open>Fechar</button>
      </div>`);
    stage.replaceChildren(panel);
    node.querySelector('.open-foot').remove();
    node.querySelector('.open-skip').remove();
    if (newPrizes.length) { sfx.win(); confetti(['#FF8A1F', '#33B5FF', '#FFC940', '#fff']); }

    const finish = go => { ov.close(); onDone && onDone(go); };
    panel.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      sfx.tap();
      if (b.dataset.go) finish({ route: b.dataset.go, collection: collectionId });
      else if (b.hasAttribute('data-again')) finish({ again: true, collection: collectionId });
      else if (b.hasAttribute('data-close-open')) finish(null);
    });
  }
}
