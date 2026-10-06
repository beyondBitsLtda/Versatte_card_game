// Estado do jogador — persistido só no aparelho (localStorage).
import { COLLECTIONS, PRIZES, CARD_BY_UID } from './data.js';

const KEY = 'versatte-cards:v1';
const listeners = new Set();

function fresh() {
  return {
    user: null,                // { name, email, createdAt }
    owned: {},                 // uid -> { n, first, last }
    premiumPacks: 0,
    points: 0,
    lastFreeDay: null,         // 'YYYY-MM-DD' do último pacote grátis
    timeOffset: 0,             // ms — relógio simulado (debug)
    pity: 0,                   // pacotes premium seguidos sem Especial
    forceNext: null,           // raridade forçada no próximo pacote (debug)
    forceCard: null,           // carta garantida no próximo pacote (debug)
    claimed: {},               // prizeId -> { code, at }
    stats: { opened: 0, free: 0, premium: 0, cards: 0, spent: 0 },
    settings: { sound: true, intro: true, debug: true, tilt: true },
    lastCollection: COLLECTIONS[0].id,
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const s = JSON.parse(raw);
    const base = fresh();
    return { ...base, ...s, stats: { ...base.stats, ...s.stats }, settings: { ...base.settings, ...s.settings } };
  } catch {
    return fresh();
  }
}

export const state = load();

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* modo privado */ }
  listeners.forEach(fn => fn(state));
}

export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function resetAll() {
  const keepSettings = { ...state.settings };
  Object.keys(state).forEach(k => delete state[k]);
  Object.assign(state, fresh(), { settings: keepSettings });
  save();
}

// ---------- relógio ----------
export const now = () => Date.now() + (state.timeOffset || 0);

export function dayKey(t = now()) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const freeAvailable = () => state.lastFreeDay !== dayKey();

export function msToNextFree() {
  const d = new Date(now());
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
  return next - now();
}

// ---------- coleção ----------
export const ownedCount = uid => state.owned[uid]?.n || 0;

export function progress(collectionId) {
  const col = COLLECTIONS.find(c => c.id === collectionId);
  const have = col.cards.filter(c => ownedCount(c.uid) > 0).length;
  return { have, total: col.cards.length, pct: have / col.cards.length };
}

export function addCard(uid) {
  const t = now();
  const o = state.owned[uid] || { n: 0, first: t };
  o.n += 1; o.last = t;
  state.owned[uid] = o;
  state.stats.cards += 1;
  return o.n === 1;
}

export function removeCollection(collectionId) {
  Object.keys(state.owned).forEach(uid => {
    if (CARD_BY_UID[uid]?.collection === collectionId) delete state.owned[uid];
  });
  PRIZES.filter(p => p.collection === collectionId || p.collection === null)
    .forEach(p => delete state.claimed[p.id]);
}

// ---------- prêmios ----------
export function prizeStatus(prize) {
  if (state.claimed[prize.id]) return 'claimed';
  if (prize.collection === null) {
    return COLLECTIONS.every(c => progress(c.id).pct >= 1) ? 'ready' : 'locked';
  }
  return progress(prize.collection).pct >= prize.at ? 'ready' : 'locked';
}

export function readyPrizes() {
  return PRIZES.filter(p => prizeStatus(p) === 'ready');
}

export function claimPrize(prize) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand = n => Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  const code = `VS-${prize.id.toUpperCase().replace('-', '')}-${rand(4)}`;
  state.claimed[prize.id] = { code, at: now() };
  save();
  return code;
}
