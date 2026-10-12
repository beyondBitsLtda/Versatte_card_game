// Sorteio: a regra fica em economy-core.js (compartilhada com o servidor); aqui ficam
// a aplicação no estado local (modo offline) e a simulação Monte Carlo do debug.
import { PACKS, RARITIES, RARITY_ORDER, COLLECTION_BY_ID, SHOP, CARD_BY_UID } from './data.js';
import { state, save, dayKey, now } from './state.js';
import { rollPack, applyOpenPack } from './economy-core.js';

export { rollPack };

/** Abre um pacote no modo offline: mesma regra do servidor (economy-core), aplicada ao estado local. */
export function openPack(collectionId, type) {
  const today = dayKey();
  const r = applyOpenPack(state, collectionId, type, { today, now: now() });
  state.lastCollection = collectionId;
  save();
  return decorate(r);
}

/** Converte o resultado ({uid,...}) para o formato da tela de abertura ({card,...}), do menor para o maior. */
export function decorate(r) {
  const cards = r.cards.map(c => ({ ...c, card: CARD_BY_UID[c.uid] }));
  cards.sort((a, b) => RARITIES[a.card.rarity].order - RARITIES[b.card.rarity].order);
  return { cards, points: r.points };
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
