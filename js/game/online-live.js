// ============================================================
//  FONTE DA PARTIDA ONLINE (ao vivo) — mesma interface de live.js
//
//  O servidor manda só o 1º tempo. No intervalo, cada jogador tem
//  um prazo para substituir; depois o servidor simula o 2º tempo e
//  a tela continua. O placar final não existe antes do intervalo,
//  então não há como "espiar" o resultado.
//  Também vigia a partida: se o adversário desistir, avisa a tela.
// ============================================================
import { api } from '../net/online.js';
import { hydrateTeam } from './online-core.js';
import { openSubPanel } from './subs.js';
import { esc } from '../ui.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));

/** p: resposta de GET /partidas/:id (fase '1t'). */
export function onlineSource(p0) {
  let p = p0;
  let off = 0;                                  // relógio do servidor - relógio local
  const sync = np => { if (np?.agora) off = Date.parse(np.agora) - Date.now(); };
  sync(p0);
  const toLocal = iso => Date.parse(iso) - off;
  const home = hydrateTeam(p.times[0]), away = hydrateTeam(p.times[1]);
  const userSide = p.lado;
  let final = null, full = false, stopped = false, remoteFn = null, elenco = null;

  const setP = np => {
    if (!np) return;
    p = np; sync(np);
    if (np.fase === 'fim') final = { result: np.resultado, shootout: np.resultado.shootout || null };
  };
  if (p.fase === 'fim') { setP(p); full = true; }
  const remoteForfeit = () => final && final.result.forfeit != null && final.result.forfeit !== userSide;

  // vigia: o adversário desistiu?
  (async () => {
    while (!stopped) {
      await sleep(3000);
      if (stopped) break;
      try {
        const np = await api('GET', `/partidas/${p.id}`);
        if (stopped) break;
        if (np.fase === 'fim' && np.resultado.forfeit != null && np.resultado.forfeit !== userSide) {
          setP(np); full = true; stopped = true; remoteFn?.(final);
        }
      } catch { /* rede instável: tenta de novo */ }
    }
  })();

  /** Espera o servidor fechar o intervalo (os dois mandaram as trocas ou o prazo acabou). */
  async function waitSecondHalf(container) {
    const box = document.createElement('div');
    box.className = 'sp sp-confirm sp-wait';
    box.innerHTML = `<div class="sp-in"><div class="sp-h"><div><b>Intervalo</b><small>Aguardando o adversário fazer as substituições…</small></div><span class="sp-clock">--</span></div><div class="sp-bar"><i></i></div></div>`;
    container.appendChild(box);
    requestAnimationFrame(() => box.classList.add('in'));
    const clock = box.querySelector('.sp-clock');
    const tick = setInterval(() => {
      if (!p.prazo) return;
      const s = Math.max(0, Math.ceil((toLocal(p.prazo) - Date.now()) / 1000));
      clock.textContent = `0:${String(s).padStart(2, '0')}`;
    }, 250);
    try {
      while (p.fase !== 'fim') {
        await sleep(1500);
        try { setP(await api('GET', `/partidas/${p.id}`)); } catch { /* tenta de novo */ }
      }
    } finally {
      clearInterval(tick);
      box.classList.remove('in'); setTimeout(() => box.remove(), 250);
    }
  }

  const src = {
    id: p.id, home, away, userSide, online: true, replay: false, version: 0,
    speedFixed: p.config?.vel || 1,
    get startsAt() { return p.inicio ? toLocal(p.inicio) : Date.now(); },
    get events() { return full && final ? final.result.events : p.resultado.events; },
    get possession() { return full && final ? final.result.possession : p.resultado.possession; },
    get reward() { return p.recompensa || {}; },
    canSubNow: () => false,                      // online: só no intervalo
    roster: () => elenco || { onField: [], bench: [], subsLeft: 0 },
    substitute() { throw new Error('No online, as substituições são feitas no intervalo'); },

    async onHalf({ container }) {
      if (full) return;
      let r = null;
      try { r = await api('POST', `/partidas/${p.id}/intervalo`); setP(r); } catch { /* segue esperando */ }
      if (remoteForfeit()) { remoteFn?.(final); return new Promise(() => {}); }   // a tela já mostra o resultado
      if (p.fase !== 'fim' && r?.elenco && !p.subs_ok?.[userSide]) {
        elenco = r.elenco;
        const changes = await openSubPanel(container, {
          roster: r.elenco, title: 'Intervalo · substituições', sub: `${esc(home.name)} ${p.resultado.score[0]} x ${p.resultado.score[1]} ${esc(away.name)}`,
          deadline: toLocal(p.prazo), confirmLabel: 'Confirmar',
        });
        try { setP(await api('POST', `/partidas/${p.id}/substituicoes`, { trocas: changes || [] })); } catch { /* o prazo resolve */ }
      }
      if (p.fase !== 'fim') await waitSecondHalf(container);
      if (remoteForfeit()) { remoteFn?.(final); return new Promise(() => {}); }
      full = true; src.version++;
    },

    async forfeit(atMin) {
      stopped = true;
      try { setP(await api('POST', `/partidas/${p.id}/desistir`, { min: Math.floor(atMin) })); } catch { /* sem rede: o resultado fica para o servidor */ }
      full = true;
      return final || { result: { ...p.resultado, forfeit: userSide, score: userSide === 0 ? [0, 3] : [3, 0] }, shootout: null };
    },

    async finish() {
      stopped = true;
      while (!final) {
        try { setP(await api('GET', `/partidas/${p.id}`)); } catch { /* tenta de novo */ }
        if (!final) await sleep(1500);
      }
      return final;
    },

    onRemoteEnd(fn) { remoteFn = fn; return () => { remoteFn = null; stopped = true; }; },
  };
  return src;
}
