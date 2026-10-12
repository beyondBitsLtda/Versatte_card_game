// ============================================================
//  Economia: um ponto único para o app mexer em cartas, moedas e
//  pacotes. Offline → regra local (economy-core sobre o state).
//  Online → o servidor decide e devolve o perfil, que é espelhado.
// ============================================================
import { state, save, dayKey, now, addPacks } from '../state.js';
import { applyExchange, applyPurchase, applyClaim } from '../economy-core.js';
import { openPack, decorate } from '../gacha.js';
import { isOnline, api, applyProfile } from './online.js';

/** Abre um pacote. Devolve { cards:[{card,isNew,points,copies}], points }. */
export async function openPackE(collectionId, type) {
  if (!isOnline()) return openPack(collectionId, type);
  const r = await api('POST', '/pacote/abrir', { colecao: collectionId, tipo: type });
  applyProfile(r.perfil);
  state.lastCollection = collectionId; save();
  return decorate(r);
}

export async function exchangeE(type) {
  if (!isOnline()) { const o = applyExchange(state, type); save(); return o; }
  applyProfile((await api('POST', '/loja/trocar', { tipo: type })).perfil);
}

export async function buyE(offerId) {
  if (!isOnline()) { applyPurchase(state, offerId); save(); return; }
  applyProfile((await api('POST', '/loja/comprar', { oferta: offerId })).perfil);
}

export async function claimE(prizeId) {
  if (!isOnline()) { const code = applyClaim(state, prizeId, { now: now() }); save(); return code; }
  const r = await api('POST', '/premio/resgatar', { premio: prizeId });
  applyProfile(r.perfil);
  return r.codigo;
}

/**
 * Recompensa de partidas offline do Modo Clube (moedas e, às vezes, um pacote).
 * Online, o servidor aplica limites anti-trapaça e devolve quanto realmente creditou.
 * motivo: 'partida' | 'amistoso' | 'campeonato'
 */
export async function rewardE(coins, pack = null, motivo = 'partida') {
  if (!isOnline()) { state.coins += coins; if (pack) addPacks(pack, 1); save(); return { coins, pack }; }
  try {
    const r = await api('POST', '/recompensa', { moedas: coins, pacote: pack, motivo });
    applyProfile(r.perfil);
    return { coins: r.moedas, pack: r.pacote, limited: r.limitado };
  } catch (e) {
    return { coins: 0, pack: null, limited: true, error: e.message };
  }
}

/** Ações de debug que mexem na economia (online: só para contas administradoras). */
export async function debugE(acao, extra = {}) {
  const r = await api('POST', '/debug', { acao, ...extra });
  applyProfile(r.perfil);
}

export { dayKey };
