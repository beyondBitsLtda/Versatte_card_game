// ============================================================
//  FONTE DA PARTIDA — o que as telas (jogo de botão e Modo
//  Simulação) consomem enquanto a partida acontece.
//
//  As telas leem src.events / src.possession (que crescem ou são
//  refeitos a partir do minuto atual) e chamam:
//    src.canSubNow()          → pode substituir agora?
//    src.roster()             → { onField, bench, subsLeft } do usuário
//    src.substitute(changes)  → aplica substituições (offline)
//    src.onHalf(ui)           → intervalo (online: janela de substituição)
//    src.forfeit()            → desistir
//    src.finish()             → { result, shootout } quando acaba
//    src.onRemoteEnd(fn)      → online: o adversário desistiu
//
//  offlineSource: simulado no aparelho, com "foto" de cada minuto —
//    ao substituir no minuto m, o jogo volta à foto de m, aplica a troca
//    e simula de novo dali em diante (nada do que já foi mostrado muda).
//  replaySource: só assistir uma partida pronta.
//  onlineSource: js/game/online-live.js (o servidor decide).
// ============================================================
import {
  createSim, simTo, simSubstitute, simRoster, simResult, snapshotSim, restoreSim, penaltyShootout, mulberry32, forfeitResult,
} from './engine.js';

export function offlineSource(home, away, userSide, { seed = Date.now(), knockout = false, forceTie = false } = {}) {
  // debug "forçar pênaltis": procura uma semente cujo jogo (sem mudanças) termine empatado
  if (forceTie && knockout) {
    for (let i = 0; i < 300; i++) {
      const s = createSim(home, away, { seed: seed + i * 15485863 });
      simTo(s, 90);
      const r = simResult(s);
      if (r.score[0] === r.score[1]) { seed = seed + i * 15485863; break; }
    }
  }
  const sim = createSim(home, away, { seed });
  const snaps = [snapshotSim(sim)];             // snaps[m] = estado ao fim do minuto m
  const run = from => { for (let m = from + 1; m <= 90; m++) { simTo(sim, m); snaps[m] = snapshotSim(sim); } };
  run(0);
  let forfeited = null;

  const src = {
    home, away, userSide, online: false, speedFixed: null, version: 0,
    get events() { return sim.st.events; },
    get possession() { return sim.st.possession; },
    canSubNow: () => !forfeited,
    roster(atMin) {
      const m = Math.max(0, Math.min(90, Math.floor(atMin)));
      const snap = snaps[m] || snaps[0];
      const s = snap.sides[userSide];
      return { onField: s.onField, bench: s.bench, subsLeft: Math.max(0, 3 - s.subs) };
    },
    /** changes: [{ out: índice em campo, in: índice no banco }] aplicadas no minuto atMin */
    substitute(changes, atMin) {
      const m = Math.max(0, Math.min(89, Math.floor(atMin)));
      restoreSim(sim, snaps[m]);
      // os índices do banco mudam a cada troca: resolve pelo jogador, não pela posição
      const benchPlayers = changes.map(c => sim.st.sides[userSide].bench[c.in]);
      const out = [];
      changes.forEach((c, k) => {
        const idx = sim.st.sides[userSide].bench.indexOf(benchPlayers[k]);
        out.push(simSubstitute(sim, userSide, c.out, idx));
      });
      snaps[m] = snapshotSim(sim);
      snaps.length = m + 1;
      run(m);
      src.version++;
      return out;
    },
    async onHalf() { /* offline: segue direto (dá para substituir a qualquer momento) */ },
    async forfeit(atMin) {
      const m = Math.max(0, Math.min(90, Math.floor(atMin)));
      restoreSim(sim, snaps[m]);
      forfeited = forfeitResult(simResult(sim), userSide);
      return { result: forfeited, shootout: null };
    },
    async finish() {
      if (forfeited) return { result: forfeited, shootout: null };
      const result = simResult(sim);
      const shootout = knockout && result.score[0] === result.score[1] ? penaltyShootout(home, away, mulberry32(seed + 77)) : null;
      return { result, shootout };
    },
    onRemoteEnd() { return () => {}; },
  };
  return src;
}

/** Só assistir (partida já decidida, p. ex. replay online). */
export function replaySource(home, away, userSide, result, shootout = null) {
  return {
    home, away, userSide, online: false, replay: true, speedFixed: null, version: 0,
    events: result.events, possession: result.possession,
    canSubNow: () => false,
    roster: () => ({ onField: [], bench: [], subsLeft: 0 }),
    substitute() { throw new Error('Replay: sem substituições'); },
    async onHalf() {},
    async forfeit() { return { result, shootout, left: true }; },
    async finish() { return { result, shootout }; },
    onRemoteEnd() { return () => {}; },
  };
}

export { simRoster };
