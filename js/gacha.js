// Motor de sorteio. Funções puras (rollPack/simulate) + aplicação no estado (openPack).
import { PACKS, RARITIES, RARITY_ORDER, COLLECTION_BY_ID, SHOP } from './data.js';
import { state, save, addCard, ownedCount, dayKey } from './state.js';

function pickRarity(odds, rng) {
  let r = rng();
  for (const id of RARITY_ORDER) {
    r -= odds[id] || 0;
    if (r < 0) return id;
  }
  return RARITY_ORDER.find(id => odds[id] > 0);
}

const pickFrom = (arr, rng) => arr[Math.floor(rng() * arr.length)];

/**
 * Sorteia um pacote.
 * @param {object} opts
 *   isOwned(uid) -> bool, rng, force (raridade p/ melhor slot), pityCount
 * @returns {{cards: object[], hitPity: boolean}}
 */
export function rollPack(collectionId, type, opts = {}) {
  const pack = PACKS[type];
  const col = COLLECTION_BY_ID[collectionId];
  const rng = opts.rng || Math.random;
  const isOwned = opts.isOwned || (() => false);
  const pityHit = !!(pack.pity && (opts.pityCount || 0) + 1 >= pack.pity.after);

  const rarities = pack.slots.map(odds => pickRarity(odds, rng));
  const last = rarities.length - 1;
  if (pityHit && !rarities.includes(pack.pity.rarity)) rarities[last] = pack.pity.rarity;
  if (opts.force && RARITIES[opts.force].order > RARITIES[rarities[last]].order) rarities[last] = opts.force;

  const taken = new Set();
  const cards = rarities.map(rarity => {
    const pool = col.cards.filter(c => c.rarity === rarity);
    let card;
    for (let attempt = 0; attempt < 4; attempt++) {
      const have = pool.filter(c => isOwned(c.uid));
      const missing = pool.filter(c => !isOwned(c.uid));
      if (pack.dupBias && have.length && rng() < pack.dupBias) card = pickFrom(have, rng);
      else if (pack.newBoost && missing.length && rng() < pack.newBoost) card = pickFrom(missing, rng);
      else card = pickFrom(pool, rng);
      if (!taken.has(card.uid)) break; // evita a mesma carta 2x no mesmo pacote
    }
    taken.add(card.uid);
    return card;
  });

  return { cards, hitPity: pityHit };
}

/** Abre um pacote "de verdade": consome, sorteia, grava e devolve o resultado. */
export function openPack(collectionId, type) {
  if (type === 'free') state.lastFreeDay = dayKey();
  else state.premiumPacks = Math.max(0, state.premiumPacks - 1);

  const { cards } = rollPack(collectionId, type, {
    isOwned: uid => ownedCount(uid) > 0,
    force: state.forceNext,
    pityCount: state.pity,
  });
  state.forceNext = null;
  const forced = state.forceCard && COLLECTION_BY_ID[collectionId].cards.find(c => c.uid === state.forceCard);
  if (forced && !cards.some(c => c.uid === forced.uid)) cards[cards.length - 1] = forced;
  state.forceCard = null;

  if (type === 'premium') {
    state.pity = cards.some(c => c.rarity === 'especial') ? 0 : state.pity + 1;
  }

  let points = 0;
  const result = cards.map(card => {
    const isNew = addCard(card.uid);
    const pts = isNew ? 0 : RARITIES[card.rarity].points;
    points += pts;
    return { card, isNew, points: pts, copies: ownedCount(card.uid) };
  });
  state.points += points;
  state.stats.opened += 1;
  state.stats[type] += 1;
  state.lastCollection = collectionId;
  save();

  // revelação: da menor para a maior raridade (suspense no final)
  result.sort((a, b) => RARITIES[a.card.rarity].order - RARITIES[b.card.rarity].order);
  return { cards: result, points };
}

// ------------------------------------------------------------
//  Simulação Monte Carlo (modo debug) — quantos pacotes p/ completar
// ------------------------------------------------------------
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function simulate(collectionId, type, runs = 400, cap = 6000) {
  const col = COLLECTION_BY_ID[collectionId];
  const total = col.cards.length;
  const marks = [0.25, 0.5, 0.75, 1];
  const results = marks.map(() => []);
  const rng = mulberry32(1234 + runs);

  for (let r = 0; r < runs; r++) {
    const owned = new Set();
    let pity = 0, packs = 0, mi = 0;
    while (owned.size < total && packs < cap) {
      packs++;
      const { cards } = rollPack(collectionId, type, { isOwned: uid => owned.has(uid), rng, pityCount: pity });
      if (type === 'premium') pity = cards.some(c => c.rarity === 'especial') ? 0 : pity + 1;
      cards.forEach(c => owned.add(c.uid));
      while (mi < marks.length && owned.size / total >= marks[mi]) results[mi++].push(packs);
    }
    while (mi < marks.length) results[mi++].push(cap);
  }

  const stat = arr => {
    const s = arr.slice().sort((a, b) => a - b);
    const mean = s.reduce((a, b) => a + b, 0) / s.length;
    return { mean, median: s[Math.floor(s.length / 2)], p90: s[Math.floor(s.length * 0.9)] };
  };
  const out = marks.map((m, i) => ({ mark: m, ...stat(results[i]) }));
  const best = SHOP.offers[SHOP.offers.length - 1];
  const pricePerPack = best.price / (best.packs + (best.bonus || 0));
  return { type, runs, marks: out, pricePerPack };
}

/** Probabilidade efetiva de cada raridade por pacote (para a tabela de odds). */
export function packOdds(type) {
  const pack = PACKS[type];
  return RARITY_ORDER.map(id => {
    const perCard = pack.slots.reduce((a, s) => a + (s[id] || 0), 0) / pack.slots.length;
    const atLeastOne = 1 - pack.slots.reduce((a, s) => a * (1 - (s[id] || 0)), 1);
    return { id, perCard, atLeastOne };
  });
}
