// ============================================================
//  MODO ONLINE — regras compartilhadas entre o servidor e o app
//  (puro: sem DOM). O servidor monta os times a partir do perfil
//  guardado no banco, simula a partida e grava o resultado; o app
//  só assiste. Times viajam em JSON enxuto (serializeTeam) e são
//  remontados com as cartas do catálogo (hydrateTeam).
// ============================================================
import { CARD_BY_UID, TEAMS } from '../data.js';
import {
  userTeam, aiTeam, drawLoans, simulateMatch, penaltyShootout, mulberry32,
  createSim, resumeSim, simTo, simSubstitute, simResult, forfeitResult, MAX_SUBS,
} from './engine.js';

export const ONLINE_REWARDS = { win: 20, draw: 8, loss: 4, goal: 2, cupChampion: 250, cupPack: 'premium', cupVice: 100, cupPart: 30 };

/** Monta o time de um jogador a partir do perfil do servidor (cartas que ele realmente tem). */
export function teamFromProfile(perfil, { level = 1, rng = Math.random } = {}) {
  const club = perfil?.clube?.club;
  if (!club || !Array.isArray(club.slots)) return null;
  const owned = perfil.dados?.owned || {};
  const isOwned = uid => (owned[uid]?.n || 0) > 0;
  const draws = drawLoans(club, isOwned, rng);
  const t = userTeam(club, level, isOwned, draws);
  return t;
}

export function botTeam(teamId, level = 2) { return aiTeam(teamId, level); }
export const randomBotIds = (n, rng = Math.random, exclude = []) => {
  const pool = TEAMS.map(t => t.id).filter(id => !exclude.includes(id));
  const out = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return out;
};

const playerJSON = p => ({ name: p.name, shirt: p.shirt, line: p.line, pos: p.pos, uid: p.uid || null, loan: !!p.loan, drawn: !!p.drawn, base: !!p.base, rating: p.rating });

/** Time → JSON enxuto (sem objetos de carta). */
export function serializeTeam(t, owner = null) {
  return {
    owner, user: !!t.user, id: t.id, name: t.name, abbr: t.abbr, colors: t.colors, pattern: t.pattern,
    crest: t.crest ? t.crest.uid : null, stadium: t.stadium ? t.stadium.uid : null,
    mascot: t.mascot ? { uid: t.mascot.uid, power: t.mascot.power, loan: !!t.mascot.loan } : null,
    formation: t.formation, players: t.players.map(playerJSON), bench: t.bench.map(playerJSON),
    moral: t.moral, chem: t.chem, season: t.season, stadiumName: t.stadiumName, mando: t.mando,
    loans: t.loans || null, power: t.power || null,
  };
}

/** JSON → time pronto para o motor e para as telas (com as cartas do catálogo). */
export function hydrateTeam(j) {
  const card = uid => (uid ? CARD_BY_UID[uid] || null : null);
  const withCard = p => ({ ...p, card: card(p.uid) });
  const m = j.mascot ? card(j.mascot.uid) : null;
  return {
    ...j,
    crest: card(j.crest), stadium: card(j.stadium),
    mascot: m ? { ...m, power: j.mascot.power, loan: j.mascot.loan } : null,
    players: j.players.map(withCard), bench: j.bench.map(withCard),
  };
}

/** Simula um confronto entre dois times já montados. knockout → pênaltis no empate. */
export function playOnline(home, away, { seed = Date.now(), knockout = false } = {}) {
  const result = simulateMatch(home, away, { seed });
  let shootout = null;
  if (knockout && result.score[0] === result.score[1]) shootout = penaltyShootout(home, away, mulberry32(seed + 77));
  return { ...result, shootout };
}

// ------------------------------------------------------------
//  Partida online AO VIVO (duas fases)
//  1) ao criar: o servidor simula só o 1º tempo e guarda a simulação
//     parada no intervalo;
//  2) no intervalo: cada jogador tem um prazo para substituir;
//  3) depois: o servidor aplica as trocas, sorteia uma semente nova e
//     simula o 2º tempo. Antes disso o placar final não existe.
// ------------------------------------------------------------
export const LIVE = {
  atrasoInicioMs: 6000,          // contagem regressiva para os dois começarem juntos
  janelaIntervaloMs: 30000,      // tempo para substituir no intervalo
  prazoMaxMs: 5 * 60000,         // ninguém apareceu: encerra sozinha
  desistirAteMs: 3 * 60000,      // depois do 2º tempo simulado, ainda dá para desistir enquanto ele "passa"
};
export const ONLINE_VEL = [1, 2, 4];
export const ONLINE_ESTILOS = ['botao', 'texto'];

/** Configuração escolhida por quem desafia/organiza: estilo de jogo e velocidade (iguais para os dois). */
export function normalizeConfig(c = {}) {
  return {
    estilo: ONLINE_ESTILOS.includes(c.estilo) ? c.estilo : 'botao',
    vel: ONLINE_VEL.includes(+c.vel) ? +c.vel : 1,
    mata: !!c.mata,
  };
}

/** Simula o 1º tempo. Devolve o estado parado no intervalo e o que pode ser mostrado. */
export function liveFirstHalf(home, away, seed) {
  const sim = createSim(home, away, { seed });
  simTo(sim, 45);
  const r = simResult(sim);
  return { estado: sim.st, primeiro: { score: r.score, events: r.events, possession: r.possession, stats: r.stats, mvp: r.mvp } };
}

/** Elenco de um lado no intervalo (para o painel de substituição). */
export function liveRoster(estado, side) {
  const s = estado.sides[side];
  return { onField: s.onField, bench: s.bench, subsLeft: Math.max(0, MAX_SUBS - s.subs) };
}

/** Confere as trocas pedidas no intervalo (índices do elenco do intervalo). */
export function validSubs(estado, side, trocas) {
  if (!Array.isArray(trocas)) return [];
  const r = liveRoster(estado, side);
  const outs = new Set(), ins = new Set(), ok = [];
  for (const t of trocas.slice(0, r.subsLeft)) {
    const o = Math.floor(+t?.out), i = Math.floor(+t?.in);
    if (!(o >= 0 && o < r.onField.length) || !(i >= 0 && i < r.bench.length)) continue;
    if (outs.has(o) || ins.has(i) || r.onField[o].sentOff) continue;
    outs.add(o); ins.add(i); ok.push({ out: o, in: i });
  }
  return ok;
}

/** Aplica as trocas do intervalo e simula o 2º tempo (semente nova, decidida só agora). */
export function liveSecondHalf(home, away, estado, subs, { seed, knockout = false }) {
  const sim = resumeSim(home, away, estado);
  sim.st.rng.s = seed | 0;
  [0, 1].forEach(side => {
    const trocas = subs[side] || [];
    const s = sim.st.sides[side];
    const benchPlayers = trocas.map(t => s.bench[t.in]);
    trocas.forEach((t, k) => {
      try { simSubstitute(sim, side, t.out, s.bench.indexOf(benchPlayers[k])); } catch { /* troca inválida: ignora */ }
    });
  });
  simTo(sim, 90);
  const result = simResult(sim);
  const shootout = knockout && result.score[0] === result.score[1] ? penaltyShootout(home, away, mulberry32(seed + 77)) : null;
  return { ...result, shootout };
}

/** Desistência no minuto `min`: o que já aconteceu até ali + W.O. para o outro lado. */
export function liveForfeit(base, side, min) {
  const m = Math.max(0, Math.min(90, Math.floor(+min || 0)));
  const events = base.events.filter(e => e.min <= m && e.type !== 'end' && !(e.type === 'half' && m < 45));
  const score = [0, 0];
  events.forEach(e => { if (e.type === 'goal') score[e.team]++; });
  return { ...forfeitResult({ ...base, score, events, possession: base.possession.slice(0, m + 1) }, side), shootout: null };
}

/** Moedas de uma partida online para o lado `side`. */
export function onlineReward(result, side) {
  if (result.forfeit === side) return { outcome: 'loss', coins: 0, lines: [['Desistência', 0]] };
  const gf = result.score[side], ga = result.score[1 - side];
  let out = gf > ga ? 'win' : gf < ga ? 'loss' : 'draw';
  if (out === 'draw' && result.shootout) out = result.shootout.winner === side ? 'win' : 'loss';
  const lines = [[{ win: 'Vitória online', draw: 'Empate online', loss: 'Participação online' }[out], ONLINE_REWARDS[out]]];
  if (gf) lines.push([`${gf} gol(s)`, gf * ONLINE_REWARDS.goal]);
  return { outcome: out, coins: lines.reduce((t, [, v]) => t + v, 0), lines };
}

// ------------------------------------------------------------
//  Torneio online (entre amigos, completado com robôs)
//  formato 'mata': 4 ou 8 vagas, jogo único, pênaltis no empate
//  formato 'pontos': todos contra todos, turno único
//  Participante: { id, nome, tipo: 'humano'|'bot', bot?: teamId }
// ------------------------------------------------------------
export function buildCup(formato, participantes, rng = Math.random) {
  const humans = participantes.filter(p => p.tipo === 'humano');
  let size = formato === 'mata' ? (humans.length <= 4 ? 4 : 8) : Math.max(4, humans.length + (humans.length % 2));
  const bots = randomBotIds(size - humans.length, rng).map(id => ({ id: 'bot:' + id, nome: TEAMS.find(t => t.id === id).name, tipo: 'bot', bot: id }));
  const all = [...humans, ...bots];
  for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
  const ids = all.map(p => p.id);
  let estado;
  if (formato === 'mata') {
    const ties = [];
    for (let i = 0; i < ids.length; i += 2) ties.push({ a: ids[i], b: ids[i + 1] });
    estado = { rounds: [ties], round: 0 };
  } else {
    const n = ids.length, arr = ids.slice(), rounds = [];
    for (let r = 0; r < n - 1; r++) {
      const games = [];
      for (let i = 0; i < n / 2; i++) { const a = arr[i], b = arr[n - 1 - i]; games.push(r % 2 ? { a: b, b: a } : { a, b }); }
      rounds.push(games);
      arr.splice(1, 0, arr.pop());
    }
    estado = { rounds, round: 0, table: Object.fromEntries(ids.map(id => [id, { P: 0, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0 }])) };
  }
  return { participantes: all.map(p => ({ ...p, pronto: false })), estado };
}

export function cupStandings(estado) {
  return Object.entries(estado.table || {})
    .map(([id, r]) => ({ id, ...r, SG: r.GP - r.GC }))
    .sort((x, y) => y.P - x.P || y.SG - x.SG || y.GP - x.GP || x.id.localeCompare(y.id));
}

export const cupRoundName = (formato, estado) => {
  if (formato === 'pontos') return `Rodada ${estado.round + 1} de ${estado.rounds.length}`;
  const n = estado.rounds[estado.round].length * 2;
  return { 8: 'Quartas de final', 4: 'Semifinal', 2: 'Final' }[n] || `Fase de ${n}`;
};

/** Humanos ainda vivos (que jogam a rodada atual). */
export function aliveHumans(t) {
  const humans = t.participantes.filter(p => p.tipo === 'humano').map(p => p.id);
  const games = t.estado.rounds[t.estado.round] || [];
  return humans.filter(id => games.some(g => g.a === id || g.b === id));
}

/**
 * Aplica os resultados de uma rodada (já simulados) e avança.
 * results: [{ a, b, score, shootout }] na mesma ordem dos jogos da rodada.
 */
export function advanceCup(t, results) {
  const e = t.estado;
  const games = e.rounds[e.round];
  games.forEach((g, i) => {
    const r = results[i];
    g.score = r.score; g.pens = r.shootout ? r.shootout.score : null; g.partida = r.partida || null;
    if (t.formato === 'mata') {
      g.winner = r.score[0] > r.score[1] ? g.a : r.score[0] < r.score[1] ? g.b : (r.shootout.winner === 0 ? g.a : g.b);
    } else {
      const [h, a] = [e.table[g.a], e.table[g.b]];
      h.J++; a.J++; h.GP += r.score[0]; h.GC += r.score[1]; a.GP += r.score[1]; a.GC += r.score[0];
      if (r.score[0] > r.score[1]) { h.V++; h.P += 3; a.D++; } else if (r.score[0] < r.score[1]) { a.V++; a.P += 3; h.D++; } else { h.E++; a.E++; h.P++; a.P++; }
    }
  });
  if (t.formato === 'mata') {
    if (games.length === 1) { t.status = 'encerrado'; t.campeao = games[0].winner; t.vice = games[0].winner === games[0].a ? games[0].b : games[0].a; }
    else {
      const next = [];
      for (let i = 0; i < games.length; i += 2) next.push({ a: games[i].winner, b: games[i + 1].winner });
      e.rounds.push(next); e.round++;
    }
  } else {
    e.round++;
    if (e.round >= e.rounds.length) { const s = cupStandings(e); t.status = 'encerrado'; t.campeao = s[0].id; t.vice = s[1]?.id; }
  }
  t.participantes.forEach(p => { p.pronto = false; });
  t.rodada = e.round;
  return t;
}
