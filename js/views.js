// Telas do app. Cada view recebe `app` = { go(route, params), refresh(), open(collectionId, type) }.
import { COLLECTIONS, COLLECTION_BY_ID, CARD_BY_UID, RARITIES, RARITY_ORDER, PRIZES, SHOP, PACKS, UPCOMING, ALL_CARDS } from './data.js';
import { state, save, progress, ownedCount, freeAvailable, msToNextFree, prizeStatus, claimPrize } from './state.js';
import { cardHTML, slotHTML, rarityTag, gem } from './cards.js';
import { packHTML } from './pack.js';
import { packOdds } from './gacha.js';
import { attachTilt, sfx, haptic, confetti, enableGyro } from './fx.js';
import { icon, esc, el, sheet, overlay, toast, fmtMoney, fmtPct, fmtDate, fmtCountdown, wait } from './ui.js';

const ui = { album: { col: COLLECTIONS[0].id, filter: 'all', rarity: null }, cards: { mode: 'showcase', sort: 'rarity', col: 'all' } };
let cleanups = [];
export function cleanupView() { cleanups.forEach(fn => fn()); cleanups = []; }

// ============================================================
//  INÍCIO
// ============================================================
export function homeView(app) {
  const free = freeAvailable();
  const firstName = esc((state.user?.name || 'Colecionador').split(' ')[0]);
  const startIdx = Math.max(0, COLLECTIONS.findIndex(c => c.id === state.lastCollection));
  const ready = PRIZES.filter(p => prizeStatus(p) === 'ready');

  const node = el(`
  <section class="view home">
    <div class="hello">
      <span class="muted">Olá, ${firstName}</span>
      <h1>Qual pacote vamos <em>abrir</em> hoje?</h1>
    </div>

    <div class="free-banner ${free ? 'on' : ''}">
      ${icon.clock}
      <div>
        <b>${free ? 'Seu pacote diário está disponível!' : 'Próximo pacote grátis em'}</b>
        <span class="countdown">${free ? '3 cartas grátis, escolha a coleção abaixo' : fmtCountdown(msToNextFree())}</span>
      </div>
    </div>

    <div class="pack-carousel" tabindex="0" aria-label="Escolha a coleção">
      ${COLLECTIONS.map(c => {
        const pr = progress(c.id);
        return `
        <div class="pack-slide" data-col="${c.id}">
          <div class="pack-wrap">${packHTML(c.id, free ? 'free' : 'premium')}</div>
          <div class="pack-meta">
            <h2>${esc(c.name)}</h2>
            <p>${esc(c.tagline)}</p>
            <div class="mini-prog"><div class="bar"><i style="--to:${pr.pct}"></i></div><b>${pr.have}/${pr.total}</b></div>
          </div>
        </div>`;
      }).join('')}
    </div>
    <div class="dots">${COLLECTIONS.map((c, i) => `<i class="${i === startIdx ? 'on' : ''}"></i>`).join('')}</div>

    <div class="cta-row">
      <button class="btn primary big" data-act="free" ${free ? '' : 'disabled'}>
        ${free ? `${icon.pack} Abrir grátis` : `${icon.clock} <span class="countdown">${fmtCountdown(msToNextFree())}</span>`}
      </button>
      ${state.premiumPacks > 0
        ? `<button class="btn premium big" data-act="premium">${icon.sparkle} Premium <span class="pill">${state.premiumPacks}</span></button>`
        : `<button class="btn premium big" data-act="shop">${icon.bag} Comprar pacotes</button>`}
    </div>

    ${ready.length ? `
      <button class="prize-unlock" data-act="prizes">
        ${icon.gift}<div><b>Você tem ${ready.length} prêmio(s) para resgatar</b><span>${ready.map(p => esc(p.title)).join(' · ')}</span></div>${icon.arrow}
      </button>` : ''}

    <div class="section-head"><h3>Suas coleções</h3><button class="link-btn" data-act="album">Ver álbum</button></div>
    <div class="col-list">
      ${COLLECTIONS.map(c => {
        const pr = progress(c.id);
        const next = PRIZES.find(p => p.collection === c.id && prizeStatus(p) === 'locked');
        return `
        <button class="col-row" data-col-open="${c.id}" style="--glow:${c.theme.glow};--c2:${c.theme.c2}">
          <div class="ring" style="--p:${pr.pct}"><span>${Math.round(pr.pct * 100)}%</span></div>
          <div class="col-row-txt">
            <b>${esc(c.name)}</b>
            <span>${pr.have} de ${pr.total} cartas${next ? ` · próximo prêmio: ${esc(next.title)}` : ' · coleção completa!'}</span>
          </div>
          ${icon.arrow}
        </button>`;
      }).join('')}
    </div>

    <div class="section-head"><h3>Próximos álbuns</h3></div>
    <div class="upcoming">
      ${UPCOMING.map(u => `<div class="up-tile">${icon.lock}<b>${esc(u.name)}</b><span>${esc(u.when)}</span></div>`).join('')}
    </div>
  </section>`);

  // carrossel
  const car = node.querySelector('.pack-carousel');
  const dots = node.querySelectorAll('.dots i');
  let current = COLLECTIONS[startIdx].id;
  const tilts = [...node.querySelectorAll('.pack3d')].map(p => attachTilt(p, { max: 14 }));
  cleanups.push(() => tilts.forEach(s => s()));

  requestAnimationFrame(() => { car.scrollLeft = startIdx * car.clientWidth; });
  car.addEventListener('scroll', () => {
    const i = Math.round(car.scrollLeft / car.clientWidth);
    dots.forEach((d, j) => d.classList.toggle('on', i === j));
    const id = COLLECTIONS[i]?.id;
    if (id && id !== current) { current = id; state.lastCollection = id; save(); }
  }, { passive: true });
  car.querySelectorAll('.pack-slide').forEach(s => s.addEventListener('click', () => {
    enableGyro();
    if (freeAvailable()) app.open(s.dataset.col, 'free');
    else if (state.premiumPacks > 0) app.open(s.dataset.col, 'premium');
    else app.go('shop');
  }));

  node.addEventListener('click', e => {
    const b = e.target.closest('[data-act],[data-col-open]');
    if (!b) return;
    sfx.tap();
    const act = b.dataset.act;
    if (b.dataset.colOpen) { ui.album.col = b.dataset.colOpen; return app.go('album'); }
    if (act === 'free') app.open(current, 'free');
    else if (act === 'premium') app.open(current, 'premium');
    else app.go(act);
  });

  // contagem regressiva
  const timer = setInterval(() => {
    if (freeAvailable() && !node.querySelector('.free-banner.on')) return app.refresh();
    node.querySelectorAll('.countdown').forEach(c => { if (!freeAvailable()) c.textContent = fmtCountdown(msToNextFree()); });
  }, 1000);
  cleanups.push(() => clearInterval(timer));
  return node;
}

// ============================================================
//  ÁLBUM (coleção completa, com o que falta)
// ============================================================
export function albumView(app) {
  const a = ui.album;
  const col = COLLECTION_BY_ID[a.col];
  const pr = progress(col.id);
  let cards = col.cards;
  if (a.filter === 'have') cards = cards.filter(c => ownedCount(c.uid) > 0);
  if (a.filter === 'missing') cards = cards.filter(c => ownedCount(c.uid) === 0);
  if (a.rarity) cards = cards.filter(c => c.rarity === a.rarity);

  const node = el(`
  <section class="view album">
    <div class="seg" role="tablist">
      ${COLLECTIONS.map(c => `<button role="tab" class="${c.id === a.col ? 'on' : ''}" data-col="${c.id}">${esc(c.name)}</button>`).join('')}
    </div>

    <div class="album-head" style="--glow:${col.theme.glow}">
      <div class="ring big" style="--p:${pr.pct}"><span><b>${pr.have}</b>/${pr.total}</span></div>
      <div>
        <h2>${esc(col.name)}</h2>
        <p class="muted">${esc(col.tagline)}</p>
        <div class="rar-stats">
          ${RARITY_ORDER.slice().reverse().map(r => {
            const all = col.cards.filter(c => c.rarity === r);
            const have = all.filter(c => ownedCount(c.uid) > 0).length;
            return `<span class="rs r-${r}" style="--rc:${RARITIES[r].color}">${gem(r)}<b>${have}/${all.length}</b></span>`;
          }).join('')}
        </div>
      </div>
    </div>

    <div class="filters">
      ${[['all', 'Todas'], ['have', 'Tenho'], ['missing', 'Faltam']].map(([k, l]) => `<button class="chip ${a.filter === k ? 'on' : ''}" data-filter="${k}">${l}</button>`).join('')}
      <span class="sep"></span>
      ${RARITY_ORDER.slice().reverse().map(r => `<button class="chip rchip ${a.rarity === r ? 'on' : ''}" data-rar="${r}" style="--rc:${RARITIES[r].color}" aria-label="${RARITIES[r].label}">${gem(r)}</button>`).join('')}
    </div>

    <div class="album-grid">
      ${cards.length ? cards.map(c => ownedCount(c.uid) > 0
        ? `<button class="slot-owned" data-uid="${c.uid}">${cardHTML(c, { size: 'sm', count: ownedCount(c.uid) })}</button>`
        : slotHTML(c)).join('')
        : `<div class="empty">${a.filter === 'missing' ? `${icon.check}<b>Nada faltando aqui!</b>` : `${icon.pack}<b>Nenhuma carta neste filtro.</b><span>Abra pacotes para preencher o álbum.</span>`}</div>`}
    </div>
  </section>`);

  node.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.col) { a.col = b.dataset.col; sfx.tap(); return app.refresh(); }
    if (b.dataset.filter) { a.filter = b.dataset.filter; sfx.tap(); return app.refresh(); }
    if (b.dataset.rar) { a.rarity = a.rarity === b.dataset.rar ? null : b.dataset.rar; sfx.tap(); return app.refresh(); }
    if (b.dataset.uid) { sfx.tap(); openDetail(b.dataset.uid); }
  });
  return node;
}

// ============================================================
//  MINHAS CARTAS (vitrine)
// ============================================================
export function cardsView(app) {
  const u = ui.cards;
  let list = ALL_CARDS.filter(c => ownedCount(c.uid) > 0);
  const totalCopies = list.reduce((s, c) => s + ownedCount(c.uid), 0);
  if (u.col !== 'all') list = list.filter(c => c.collection === u.col);
  const sorters = {
    rarity: (x, y) => RARITIES[y.rarity].order - RARITIES[x.rarity].order || x.number - y.number,
    recent: (x, y) => (state.owned[y.uid].last || 0) - (state.owned[x.uid].last || 0),
    dupes: (x, y) => ownedCount(y.uid) - ownedCount(x.uid),
  };
  list.sort(sorters[u.sort]);

  const node = el(`
  <section class="view mycards">
    <div class="vh">
      <h2>Minhas cartas</h2>
      <div class="seg small">
        <button class="${u.mode === 'showcase' ? 'on' : ''}" data-mode="showcase">Vitrine</button>
        <button class="${u.mode === 'grid' ? 'on' : ''}" data-mode="grid">Grade</button>
      </div>
    </div>
    <div class="stat-row">
      <div><b>${ALL_CARDS.filter(c => ownedCount(c.uid) > 0).length}</b><span>únicas</span></div>
      <div><b>${totalCopies}</b><span>no total</span></div>
      <div><b>${totalCopies - ALL_CARDS.filter(c => ownedCount(c.uid) > 0).length}</b><span>repetidas</span></div>
      <div><b>${state.points}</b><span>pontos</span></div>
    </div>
    <div class="filters">
      ${[['all', 'Todas'], ...COLLECTIONS.map(c => [c.id, c.short])].map(([k, l]) => `<button class="chip ${u.col === k ? 'on' : ''}" data-col="${k}">${esc(l)}</button>`).join('')}
      <span class="sep"></span>
      ${[['rarity', 'Raridade'], ['recent', 'Recentes'], ['dupes', 'Repetidas']].map(([k, l]) => `<button class="chip ${u.sort === k ? 'on' : ''}" data-sort="${k}">${l}</button>`).join('')}
    </div>
    ${!list.length ? `
      <div class="empty big">${icon.cards}<b>Nenhuma carta por aqui ainda</b><span>Abra seu pacote diário para começar a coleção.</span>
      <button class="btn primary" data-go="home">Ir para pacotes</button></div>`
    : u.mode === 'showcase' ? `
      <div class="showcase">
        ${list.map(c => `<div class="sc-item" data-uid="${c.uid}">${cardHTML(c, { size: 'lg', count: ownedCount(c.uid) })}</div>`).join('')}
      </div>
      <div class="sc-caption"></div>`
    : `<div class="album-grid">${list.map(c => `<button class="slot-owned" data-uid="${c.uid}">${cardHTML(c, { size: 'sm', count: ownedCount(c.uid) })}</button>`).join('')}</div>`}
  </section>`);

  node.addEventListener('click', e => {
    const b = e.target.closest('button, .sc-item');
    if (!b) return;
    if (b.dataset.mode) { u.mode = b.dataset.mode; sfx.tap(); return app.refresh(); }
    if (b.dataset.col) { u.col = b.dataset.col; sfx.tap(); return app.refresh(); }
    if (b.dataset.sort) { u.sort = b.dataset.sort; sfx.tap(); return app.refresh(); }
    if (b.dataset.go) return app.go(b.dataset.go);
    if (b.dataset.uid) {
      if (b.classList.contains('sc-item') && !b.classList.contains('center')) {
        b.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        return;
      }
      sfx.tap(); openDetail(b.dataset.uid);
    }
  });

  // vitrine: a carta central ganha efeitos ao vivo
  const sc = node.querySelector('.showcase');
  if (sc) {
    const caption = node.querySelector('.sc-caption');
    let stop = null, centerEl = null;
    const update = () => {
      const mid = sc.getBoundingClientRect().left + sc.clientWidth / 2;
      let best = null, bd = Infinity;
      sc.querySelectorAll('.sc-item').forEach(it => {
        const r = it.getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - mid);
        if (d < bd) { bd = d; best = it; }
      });
      if (best && best !== centerEl) {
        centerEl && centerEl.classList.remove('center');
        centerEl && centerEl.querySelector('.card').classList.remove('is-live');
        stop && stop();
        centerEl = best;
        best.classList.add('center');
        const card = best.querySelector('.card');
        card.classList.add('is-live');
        stop = attachTilt(card, { max: 14 });
        const c = CARD_BY_UID[best.dataset.uid];
        caption.innerHTML = `${rarityTag(c.rarity)}<b>${esc(c.name)}</b><span>${esc(COLLECTION_BY_ID[c.collection].name)} · #${String(c.number).padStart(2, '0')} · ×${ownedCount(c.uid)}</span><small>Toque na carta para ver detalhes e curiosidades</small>`;
      }
    };
    sc.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    requestAnimationFrame(update);
    cleanups.push(() => stop && stop());
  }
  return node;
}

// ============================================================
//  DETALHE DA CARTA
// ============================================================
export function openDetail(uid) {
  enableGyro();
  const c = CARD_BY_UID[uid];
  const R = RARITIES[c.rarity];
  const col = COLLECTION_BY_ID[c.collection];
  const have = ownedCount(uid) > 0;
  const t = c.teamData;

  const facts = c.kind === 'team'
    ? [['Nome oficial', c.full], ['Cidade', c.city], ['Fundação', c.founded], ['Estádio', c.stadium], ['Apelido', c.nickname], ['Mascote', c.mascot]]
    : [['Nome completo', c.full], ['Clube', t.full], ['Posição', c.position], ['Período no clube', c.era], ['Camisa', c.shirt ?? '—']];

  const odds = type => {
    const pool = col.cards.filter(x => x.rarity === c.rarity).length;
    const perCard = PACKS[type].slots.reduce((s, sl) => s + (sl[c.rarity] || 0), 0) / PACKS[type].slots.length;
    return perCard / pool;
  };

  const ov = overlay(`
    <button class="icon-btn ov-x" aria-label="Fechar">${icon.close}</button>
    <div class="detail" style="--rc:${R.color}">
      <div class="d-stage">
        ${have ? cardHTML(c, { size: 'lg', live: true }) : `<div class="d-locked">${slotHTML(c)}</div>`}
      </div>
      ${have ? `<p class="d-hint">Toque para virar · arraste ou incline o celular para ver o brilho</p>` : ''}
      <div class="d-info">
        <div class="d-title">
          ${rarityTag(c.rarity)}
          <h2>${esc(c.name)}</h2>
          <span class="muted">#${String(c.number).padStart(2, '0')} · ${esc(col.name)}</span>
        </div>
        ${have ? `
          <div class="d-high">${icon.trophy}<p>${esc(c.highlight)}</p></div>
          <div class="d-fact">
            <div class="d-fact-h">${icon.bulb}<b>Curiosidade</b></div>
            <p>${esc(c.fact)}</p>
          </div>
          <dl class="d-facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
          <div class="d-own">${icon.cards}<span>Você tem <b>${ownedCount(uid)}</b> cópia(s) · obtida em ${fmtDate(state.owned[uid].first)}</span></div>
        ` : `
          <div class="d-lock">${icon.lock}<p>Encontre esta carta para desbloquear a ficha e a curiosidade.</p></div>
          <div class="d-odds">
            <div><span>Chance por carta · premium</span><b>${fmtPct(odds('premium'), 2)}</b></div>
            <div><span>Chance por carta · diário</span><b>${fmtPct(odds('free'), 2)}</b></div>
          </div>
        `}
      </div>
    </div>`, 'detail-ov');

  const card = ov.node.querySelector('.card');
  let stop = null;
  if (card) {
    stop = attachTilt(card, { max: 18 });
    card.addEventListener('click', () => { card.classList.toggle('flipped'); sfx.flip(); haptic(8); });
  }
  ov.node.querySelector('.ov-x').addEventListener('click', () => { sfx.tap(); stop && stop(); ov.close(); });
}

// ============================================================
//  PRÊMIOS
// ============================================================
export function prizesView(app) {
  const prizeRow = p => {
    const st = prizeStatus(p);
    const pr = p.collection ? progress(p.collection) : null;
    const need = pr ? Math.ceil(p.at * pr.total) - pr.have : null;
    const claim = state.claimed[p.id];
    return `
      <div class="prize ${st}" data-prize="${p.id}">
        <div class="pz-ico">${icon[p.icon]}</div>
        <div class="pz-txt">
          <b>${esc(p.title)}</b>
          <span>${esc(p.desc)}</span>
          ${st === 'claimed' ? `<code>${claim.code}</code>` : ''}
        </div>
        ${st === 'ready' ? `<button class="btn primary sm" data-claim="${p.id}">Resgatar</button>`
          : st === 'claimed' ? `<span class="pz-ok">${icon.check}Resgatado</span>`
          : `<span class="pz-need">${icon.lock}${pr ? `faltam ${need}` : '2 coleções'}</span>`}
      </div>`;
  };

  const node = el(`
  <section class="view prizes">
    <div class="vh"><h2>Prêmios</h2></div>
    <p class="muted lead">Complete as coleções e troque por brindes reais nas lojas Versatte.</p>
    ${COLLECTIONS.map(c => {
      const pr = progress(c.id);
      const ps = PRIZES.filter(p => p.collection === c.id);
      return `
      <div class="pz-col" style="--glow:${c.theme.glow}">
        <div class="pz-head"><b>${esc(c.name)}</b><span>${pr.have}/${pr.total}</span></div>
        <div class="pz-track">
          <div class="bar"><i style="--to:${pr.pct}"></i></div>
          ${ps.map(p => `<span class="mk ${pr.pct >= p.at ? 'hit' : ''}" style="--at:${p.at}">${icon[p.icon]}</span>`).join('')}
        </div>
        ${ps.map(prizeRow).join('')}
      </div>`;
    }).join('')}
    <div class="pz-col master">
      <div class="pz-head"><b>Desafio Lendário</b><span>${COLLECTIONS.filter(c => progress(c.id).pct >= 1).length}/${COLLECTIONS.length} coleções</span></div>
      ${prizeRow(PRIZES.find(p => p.id === 'master'))}
    </div>
    <p class="fine">Protótipo: os códigos são fictícios. Na versão final, o resgate é validado no PDV/e-commerce da Versatte.</p>
  </section>`);

  node.addEventListener('click', e => {
    const b = e.target.closest('[data-claim]');
    if (!b) return;
    const p = PRIZES.find(x => x.id === b.dataset.claim);
    const code = claimPrize(p);
    sfx.win(); haptic([30, 40, 60]);
    confetti(['#FF8A1F', '#33B5FF', '#FFC940', '#ffffff']);
    const s = sheet(`
      <div class="claim">
        <div class="claim-ico">${icon[p.icon]}</div>
        <h2>${esc(p.title)}</h2>
        <p class="muted">${esc(p.desc)}</p>
        <div class="claim-code"><span>Seu código</span><code>${code}</code></div>
        <p class="fine">Apresente este código em uma loja Versatte ou use no site. Válido por 30 dias.</p>
        <button class="btn primary" data-close>Fechar</button>
      </div>`, { cls: 'center', onClose: () => app.refresh() });
    s.node.querySelector('code').addEventListener('click', () => {
      navigator.clipboard?.writeText(code).then(() => toast('Código copiado'), () => {});
    });
  });
  return node;
}

// ============================================================
//  LOJA
// ============================================================
export function shopView(app) {
  const oddsF = packOdds('free'), oddsP = packOdds('premium');
  const node = el(`
  <section class="view shop">
    <div class="vh"><h2>Loja</h2><span class="pill">${icon.pack} ${state.premiumPacks} premium</span></div>
    <p class="muted lead">Pacotes premium têm 4 cartas, a 4ª é sempre Rara ou melhor, e chances maiores de cartas novas.</p>
    <div class="offers">
      ${SHOP.offers.map(o => `
        <button class="offer ${o.tag ? 'tagged' : ''}" data-buy="${o.id}">
          ${o.tag ? `<span class="o-tag">${o.tag}</span>` : ''}
          <div class="o-packs">${Array.from({ length: Math.min(3, o.packs) }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>
          <b>${o.label}</b>
          ${o.bonus ? `<span class="o-bonus">+${o.bonus} de bônus</span>` : '<span class="o-bonus dim">&nbsp;</span>'}
          <span class="o-price">${fmtMoney(o.price)}</span>
        </button>`).join('')}
    </div>

    <div class="points-box">
      <div class="pb-txt">${icon.coin}<div><b>${state.points} pontos</b><span>Cartas repetidas viram pontos. ${SHOP.pointsPerPack} pontos = 1 pacote premium.</span></div></div>
      <div class="bar"><i style="--to:${Math.min(1, state.points / SHOP.pointsPerPack)}"></i></div>
      <button class="btn ghost" data-redeem ${state.points >= SHOP.pointsPerPack ? '' : 'disabled'}>Trocar ${SHOP.pointsPerPack} pontos</button>
    </div>

    <div class="odds">
      <h3>Probabilidades</h3>
      <table>
        <thead><tr><th>Raridade</th><th>Diário<small>por carta</small></th><th>Premium<small>por carta</small></th><th>Premium<small>≥1 no pacote</small></th></tr></thead>
        <tbody>
          ${RARITY_ORDER.map((r, i) => `<tr><td>${rarityTag(r)}</td><td>${fmtPct(oddsF[i].perCard)}</td><td>${fmtPct(oddsP[i].perCard)}</td><td>${fmtPct(oddsP[i].atLeastOne)}</td></tr>`).join('')}
        </tbody>
      </table>
      <ul class="fine-list">
        <li><b>Diário:</b> ${PACKS.free.cards} cartas; ${Math.round(PACKS.free.dupBias * 100)}% de tendência a repetir cartas que você já tem.</li>
        <li><b>Premium:</b> ${PACKS.premium.cards} cartas; ${Math.round(PACKS.premium.newBoost * 100)}% de tendência a trazer cartas que faltam.</li>
        <li><b>Garantia:</b> a cada ${PACKS.premium.pity.after} pacotes premium sem Especial, o próximo traz uma.</li>
      </ul>
    </div>
    <p class="fine">Protótipo: valores ilustrativos e pagamento simulado.</p>
  </section>`);

  node.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.buy) { sfx.tap(); checkout(SHOP.offers.find(o => o.id === b.dataset.buy), app); }
    if (b.hasAttribute('data-redeem') && state.points >= SHOP.pointsPerPack) {
      state.points -= SHOP.pointsPerPack; state.premiumPacks += 1; save();
      sfx.coin(); haptic(20); toast('+1 pacote premium', { tone: 'ok' }); app.refresh();
    }
  });
  return node;
}

function checkout(o, app) {
  const total = o.packs + (o.bonus || 0);
  const s = sheet(`
    <div class="checkout">
      <h2>Finalizar compra</h2>
      <div class="co-line"><span>${o.label}${o.bonus ? ` + ${o.bonus} bônus` : ''}</span><b>${fmtMoney(o.price)}</b></div>
      <div class="co-pay">
        <label><input type="radio" name="pay" checked><span>Pix</span></label>
        <label><input type="radio" name="pay"><span>Cartão de crédito</span></label>
      </div>
      <button class="btn primary big" data-pay>Pagar ${fmtMoney(o.price)}</button>
      <p class="fine">Pagamento simulado — nenhuma cobrança é feita.</p>
    </div>`);
  s.node.querySelector('[data-pay]').addEventListener('click', async ev => {
    const b = ev.currentTarget;
    b.disabled = true; b.innerHTML = '<span class="spinner"></span> Processando…';
    await wait(1100);
    state.premiumPacks += total;
    state.stats.spent += o.price;
    save();
    sfx.win(); haptic([20, 30, 50]);
    s.node.querySelector('.sheet-body').innerHTML = `
      <div class="claim">
        <div class="claim-ico ok">${icon.check}</div>
        <h2>Compra aprovada!</h2>
        <p class="muted">+${total} pacotes premium na sua conta.</p>
        <button class="btn primary big" data-now>Abrir agora</button>
        <button class="link-btn" data-close>Depois</button>
      </div>`;
    s.node.querySelector('[data-now]').addEventListener('click', () => { s.close(); app.open(state.lastCollection, 'premium'); });
    app.refresh();
  });
}

// ============================================================
//  CADASTRO
// ============================================================
export function signupView(onDone) {
  const node = el(`
  <section class="signup">
    <img class="su-logo" src="assets/logo-versatte.png" alt="Versatte">
    <h1>Crie sua conta <em>grátis</em></h1>
    <p class="muted">Abra um pacote por dia, complete álbuns e troque por brindes reais na Versatte.</p>
    <ul class="su-perks">
      <li>${icon.pack}<span><b>3 cartas grátis</b> todo dia</span></li>
      <li>${icon.album}<span><b>Álbuns temáticos</b> lançados ao longo do ano</span></li>
      <li>${icon.gift}<span><b>Camisas, canecas e cupons</b> ao completar coleções</span></li>
    </ul>
    <form class="su-form" autocomplete="on">
      <label><span>Nome</span><input name="name" required maxlength="40" placeholder="Como quer ser chamado?"></label>
      <label><span>E-mail</span><input name="email" type="email" required placeholder="voce@email.com"></label>
      <label class="check"><input type="checkbox" name="ok" required><span>Li e aceito os termos de uso e a política de privacidade.</span></label>
      <button class="btn primary big" type="submit">Criar conta e ganhar bônus</button>
      <p class="fine">Protótipo: os dados ficam salvos apenas neste aparelho.</p>
    </form>
  </section>`);
  node.querySelector('form').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    state.user = { name: String(f.get('name')).trim(), email: String(f.get('email')).trim(), createdAt: Date.now() };
    state.premiumPacks += 1;
    save();
    sfx.win();
    onDone();
    setTimeout(() => toast(`${icon.sparkle} Bônus de boas-vindas: 1 pacote premium!`, { tone: 'ok', ms: 3500 }), 400);
  });
  return node;
}

// ============================================================
//  PERFIL
// ============================================================
export function openProfile(app) {
  const s = sheet(`
    <div class="profile">
      <div class="pf-av">${esc((state.user?.name || '?')[0].toUpperCase())}</div>
      <h2>${esc(state.user?.name || '')}</h2>
      <p class="muted">${esc(state.user?.email || '')}</p>
      <div class="stat-row">
        <div><b>${state.stats.opened}</b><span>pacotes</span></div>
        <div><b>${state.stats.cards}</b><span>cartas</span></div>
        <div><b>${Object.keys(state.claimed).length}</b><span>prêmios</span></div>
      </div>
      <label class="toggle"><span>${icon.sound} Sons</span><input type="checkbox" data-set="sound" ${state.settings.sound ? 'checked' : ''}><i></i></label>
      <label class="toggle"><span>${icon.sparkle} Brilho pelo giroscópio</span><input type="checkbox" data-set="tilt" ${state.settings.tilt ? 'checked' : ''}><i></i></label>
      <label class="toggle"><span>${icon.play} Intro ao abrir o app</span><input type="checkbox" data-set="intro" ${state.settings.intro ? 'checked' : ''}><i></i></label>
      <label class="toggle"><span>${icon.bug} Modo debug</span><input type="checkbox" data-set="debug" ${state.settings.debug ? 'checked' : ''}><i></i></label>
      <p class="fine">Versatte Cards · protótipo desenvolvido por Beyond Bits</p>
    </div>`);
  s.node.addEventListener('change', e => {
    const k = e.target.dataset.set;
    if (!k) return;
    state.settings[k] = e.target.checked; save();
    app.refresh();
  });
}
