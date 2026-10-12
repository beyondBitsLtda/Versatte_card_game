// ============================================================
//  NÚCLEO DA ECONOMIA (puro: sem DOM, sem localStorage)
//  Usado pelo app no modo offline (sobre o state local) e pelo
//  servidor no modo online (sobre o perfil do banco) — a regra é
//  a mesma nos dois lados.
//
//  Perfil (p): { owned: {uid:{n,first,last}}, coins, premiumPacks,
//    inv:{basico,lendario}, lastFreeDay, pity, forceNext, forceCard,
//    claimed:{prizeId:{code,at}}, stats:{opened,free,premium,cards,spent} }
// ============================================================
import { PACKS, RARITIES, RARITY_ORDER, COLLECTION_BY_ID, COLLECTIONS, PRIZES, SHOP, COINS } from './data.js';

export class EconomyError extends Error {
  constructor(code, message) { super(message || code); this.code = code; }
}

/** Garante os campos do perfil (perfis novos ou antigos). */
export function normalizeProfile(p = {}) {
  p.owned = p.owned || {};
  p.coins = p.coins || 0;
  p.premiumPacks = p.premiumPacks || 0;
  p.inv = { basico: 0, lendario: 0, ...(p.inv || {}) };
  p.pity = p.pity || 0;
  p.claimed = p.claimed || {};
  p.stats = { opened: 0, free: 0, premium: 0, cards: 0, spent: 0, ...(p.stats || {}) };
  return p;
}

/** Perfil inicial de uma conta nova (bônus de boas-vindas). */
export function newProfile() {
  return normalizeProfile({ premiumPacks: 1, coins: COINS.welcome });
}

/** Dia (AAAA-MM-DD) no fuso de Brasília — o pacote grátis vira à meia-noite daqui. */
export function dayKeyBR(t = Date.now()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(t));
}

// ------------------------------------------------------------
//  Sorteio
// ------------------------------------------------------------
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
 * Sorteia um pacote (não altera nada).
 * opts: isOwned(uid), rng, force (raridade p/ o melhor slot), pityCount
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

// ------------------------------------------------------------
//  Operações sobre o perfil
// ------------------------------------------------------------
export const countOf = (p, uid) => p.owned[uid]?.n || 0;

export function addCardTo(p, uid, now = Date.now()) {
  const o = p.owned[uid] || { n: 0, first: now };
  o.n += 1; o.last = now;
  p.owned[uid] = o;
  p.stats.cards = (p.stats.cards || 0) + 1;
  return o.n === 1;
}

export function packCountOf(p, type) {
  return type === 'premium' ? p.premiumPacks : (p.inv[type] || 0);
}

/**
 * Abre um pacote: confere se pode, consome, sorteia e grava as cartas no perfil.
 * Lança EconomyError('sem-pacote' | 'gratis-usado' | 'so-premium' | 'colecao').
 * @returns {{ cards: {uid, isNew, points, copies}[], points }}
 */
export function applyOpenPack(p, collectionId, type, { today = dayKeyBR(), now = Date.now(), rng = Math.random } = {}) {
  normalizeProfile(p);
  const col = COLLECTION_BY_ID[collectionId];
  if (!col || !PACKS[type]) throw new EconomyError('colecao', 'Coleção ou pacote inválido');
  if (col.premiumOnly && (type === 'free' || type === 'basico')) throw new EconomyError('so-premium', 'Esta coleção só sai em pacotes premium ou lendários');
  if (type === 'free') {
    if (p.lastFreeDay === today) throw new EconomyError('gratis-usado', 'Pacote diário já aberto hoje');
    p.lastFreeDay = today;
  } else {
    if (packCountOf(p, type) <= 0) throw new EconomyError('sem-pacote', 'Você não tem esse pacote');
    if (type === 'premium') p.premiumPacks -= 1; else p.inv[type] -= 1;
  }

  const { cards } = rollPack(collectionId, type, { isOwned: uid => countOf(p, uid) > 0, force: p.forceNext, pityCount: p.pity, rng });
  p.forceNext = null;
  const forced = p.forceCard && col.cards.find(c => c.uid === p.forceCard);
  if (forced && !cards.some(c => c.uid === forced.uid)) cards[cards.length - 1] = forced;
  p.forceCard = null;
  if (type === 'premium') p.pity = cards.some(c => c.rarity === 'especial') ? 0 : p.pity + 1;

  let points = 0;
  const result = cards.map(card => {
    const isNew = addCardTo(p, card.uid, now);
    const pts = isNew ? 0 : RARITIES[card.rarity].points;
    points += pts;
    return { uid: card.uid, isNew, points: pts, copies: countOf(p, card.uid) };
  });
  p.coins += points;
  p.stats.opened = (p.stats.opened || 0) + 1;
  p.stats[type] = (p.stats[type] || 0) + 1;
  return { cards: result, points };
}

/** Troca moedas por pacote (Loja). */
export function applyExchange(p, type) {
  normalizeProfile(p);
  const offer = SHOP.coinOffers.find(o => o.type === type);
  if (!offer) throw new EconomyError('oferta', 'Oferta inválida');
  if (p.coins < offer.price) throw new EconomyError('sem-moedas', 'Moedas insuficientes');
  p.coins -= offer.price;
  if (type === 'premium') p.premiumPacks += 1; else p.inv[type] = (p.inv[type] || 0) + 1;
  return offer;
}

/** Compra (simulada no protótipo) de pacotes premium. */
export function applyPurchase(p, offerId) {
  normalizeProfile(p);
  const o = SHOP.offers.find(x => x.id === offerId);
  if (!o) throw new EconomyError('oferta', 'Oferta inválida');
  p.premiumPacks += o.packs + (o.bonus || 0);
  p.stats.spent = (p.stats.spent || 0) + o.price;
  return o;
}

export function progressOf(p, collectionId) {
  const col = COLLECTION_BY_ID[collectionId];
  const have = col.cards.filter(c => countOf(p, c.uid) > 0).length;
  return { have, total: col.cards.length, pct: have / col.cards.length };
}

export function prizeStatusOf(p, prize) {
  if (p.claimed[prize.id]) return 'claimed';
  if (prize.collection === null) return COLLECTIONS.every(c => progressOf(p, c.id).pct >= 1) ? 'ready' : 'locked';
  return progressOf(p, prize.collection).pct >= prize.at ? 'ready' : 'locked';
}

/** Resgata um prêmio se a coleção já chegou no marco. */
export function applyClaim(p, prizeId, { now = Date.now(), rng = Math.random } = {}) {
  normalizeProfile(p);
  const prize = PRIZES.find(x => x.id === prizeId);
  if (!prize) throw new EconomyError('premio', 'Prêmio inválido');
  if (prizeStatusOf(p, prize) !== 'ready') throw new EconomyError('premio-bloqueado', 'Prêmio ainda não liberado');
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const code = `VS-${prize.id.toUpperCase().replace('-', '')}-${Array.from({ length: 4 }, () => alphabet[Math.floor(rng() * alphabet.length)]).join('')}`;
  p.claimed[prize.id] = { code, at: now };
  return code;
}
