// ============================================================
//  MODO CLUBE — campeonatos
//  liga        → pontos corridos (8 clubes, turno único)
//  copa        → mata-mata (16 clubes, jogo único, pênaltis no empate)
//  continental → 4 grupos de 4 + mata-mata (quartas, semi, final)
//  Funções puras sobre o objeto do campeonato (salvo em state.comp).
// ============================================================
import { TEAMS, COMPETITIONS, KO_ROUND_NAMES } from '../data.js';
import {
  aiTeam, simulateMatch, penaltyShootout, mulberry32,
  createLeague, applyResult, standings, simulateOtherGames, userFixture, advanceRound,
} from './engine.js';

const shuffle = (arr, rng) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

/** Força dos rivais: edição do campeonato + dificuldade do formato. */
export const compLevel = comp => comp.edition + COMPETITIONS[comp.type].level;

export function createComp(type, userCrestTeam, edition = 1, seed = Date.now()) {
  const rng = mulberry32(seed);
  const def = COMPETITIONS[type];
  const comp = { type, edition, seed, done: false, champion: null, userOut: false, finish: null, played: 0, log: [] };
  if (type === 'liga') {
    comp.league = createLeague(userCrestTeam, edition + def.level, seed);
    return comp;
  }
  const pool = shuffle(TEAMS.map(t => t.id).filter(id => id !== userCrestTeam), rng).slice(0, def.size - 1);
  const ids = shuffle(['user', ...pool], rng);
  if (type === 'copa') {
    comp.phase = 'ko';
    comp.ko = { rounds: [pairUp(ids)], round: 0 };
  } else {
    comp.phase = 'groups';
    comp.groupRound = 0;
    comp.groups = ['A', 'B', 'C', 'D'].map((name, g) => {
      const gids = ids.slice(g * 4, g * 4 + 4);
      const [a, b, c, d] = gids;
      return {
        name, ids: gids,
        rounds: [[[a, b], [c, d]], [[d, a], [b, c]], [[a, c], [b, d]]],
        table: Object.fromEntries(gids.map(id => [id, { P: 0, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0 }])),
        results: [],
      };
    });
  }
  return comp;
}

const pairUp = ids => {
  const ties = [];
  for (let i = 0; i < ids.length; i += 2) ties.push({ a: ids[i], b: ids[i + 1], score: null, pens: null, winner: null });
  return ties;
};

// ------------------------------------------------------------
//  Consultas
// ------------------------------------------------------------
export const koRoundName = n => KO_ROUND_NAMES[n] || `Fase de ${n}`;

export function groupStandings(group) {
  return Object.entries(group.table)
    .map(([id, r]) => ({ id, ...r, SG: r.GP - r.GC }))
    .sort((x, y) => y.P - x.P || y.SG - x.SG || y.GP - x.GP || y.V - x.V || x.id.localeCompare(y.id));
}

export const userGroup = comp => comp.groups?.find(g => g.ids.includes('user'));

/** Próxima partida do usuário: { opponent, userHome, title, stage, knockout } ou null. */
export function nextUserMatch(comp) {
  if (comp.done || comp.userOut) return null;
  const def = COMPETITIONS[comp.type];
  if (comp.type === 'liga') {
    const fx = userFixture(comp.league);
    if (!fx) return null;
    return { opponent: fx.opponent, userHome: fx.userHome, knockout: false,
      stage: `Rodada ${comp.league.round + 1} de ${comp.league.rounds.length}`, title: `${def.name} · Rodada ${comp.league.round + 1}/${comp.league.rounds.length}` };
  }
  if (comp.phase === 'groups') {
    const g = userGroup(comp);
    const pair = g.rounds[comp.groupRound].find(p => p.includes('user'));
    const userHome = pair[0] === 'user';
    return { opponent: userHome ? pair[1] : pair[0], userHome, knockout: false,
      stage: `Grupo ${g.name} · ${comp.groupRound + 1}ª rodada`, title: `${def.name} · Grupo ${g.name} · ${comp.groupRound + 1}ª rodada` };
  }
  const round = comp.ko.rounds[comp.ko.round];
  const tie = round.find(t => t.a === 'user' || t.b === 'user');
  if (!tie) return null;
  const name = koRoundName(round.length * 2);
  return { opponent: tie.a === 'user' ? tie.b : tie.a, userHome: tie.a === 'user', knockout: true, final: round.length === 1,
    stage: name, title: `${def.name} · ${name}` };
}

// ------------------------------------------------------------
//  Simulação das outras partidas
// ------------------------------------------------------------
function simAI(comp, a, b, salt, knockout) {
  const lvl = compLevel(comp);
  const home = aiTeam(a, lvl), away = aiTeam(b, lvl);
  const res = simulateMatch(home, away, { seed: (comp.seed + salt * 7919) >>> 0 });
  let pens = null;
  if (knockout && res.score[0] === res.score[1]) pens = penaltyShootout(home, away, mulberry32(comp.seed + salt * 131));
  return { score: res.score, pens };
}

function addGroupResult(g, home, away, score) {
  const [h, a] = [g.table[home], g.table[away]];
  h.J++; a.J++; h.GP += score[0]; h.GC += score[1]; a.GP += score[1]; a.GC += score[0];
  if (score[0] > score[1]) { h.V++; h.P += 3; a.D++; } else if (score[0] < score[1]) { a.V++; a.P += 3; h.D++; } else { h.E++; a.E++; h.P++; a.P++; }
  g.results.push({ home, away, score });
}

function resolveTie(tie, score, pens) {
  tie.score = score; tie.pens = pens ? pens.score : null;
  tie.winner = score[0] > score[1] ? tie.a : score[0] < score[1] ? tie.b : (pens.winner === 0 ? tie.a : tie.b);
}

/** Termina o mata-mata sem o usuário (para mostrar o campeão). */
function finishKnockout(comp) {
  let guard = 0;
  while (!comp.done && guard++ < 10) {
    const round = comp.ko.rounds[comp.ko.round];
    round.forEach((t, i) => { if (!t.winner) { const r = simAI(comp, t.a, t.b, 500 + comp.ko.round * 20 + i, true); resolveTie(t, r.score, r.pens); } });
    advanceKO(comp);
  }
}

function advanceKO(comp) {
  const round = comp.ko.rounds[comp.ko.round];
  if (round.length === 1) { comp.done = true; comp.champion = round[0].winner; return; }
  comp.ko.rounds.push(pairUp(round.map(t => t.winner)));
  comp.ko.round++;
}

// ------------------------------------------------------------
//  Registro da partida do usuário (já simulada pelo motor)
//  pens: resultado de penaltyShootout quando mata-mata empatou
//  Retorna { eliminated, advanced, champion } para a tela.
// ------------------------------------------------------------
export function recordUserMatch(comp, m, userSide, score, pens) {
  comp.played++;
  const [home, away] = m.userHome ? ['user', m.opponent] : [m.opponent, 'user'];
  comp.log.push({ stage: m.stage, home, away, score, pens: pens ? pens.score : null });
  const out = { eliminated: false, advanced: false, champion: false };

  if (comp.type === 'liga') {
    const lg = comp.league;
    applyResult(lg, home, away, score);
    simulateOtherGames(lg);
    advanceRound(lg);
    if (lg.done) { comp.done = true; comp.champion = lg.champion; out.champion = lg.champion === 'user'; finishPlace(comp); }
    return out;
  }

  if (comp.phase === 'groups') {
    const gr = comp.groupRound;
    comp.groups.forEach((g, gi) => g.rounds[gr].forEach(([h, a], pi) => {
      if (h === 'user' || a === 'user') addGroupResult(g, home, away, score);
      else addGroupResult(g, h, a, simAI(comp, h, a, 100 + gr * 10 + gi * 3 + pi, false).score);
    }));
    comp.groupRound++;
    if (comp.groupRound === 3) {
      // classificados: 1º e 2º de cada grupo → quartas (A1×B2, B1×A2, C1×D2, D1×C2)
      const [A, B, C, D] = comp.groups.map(g => groupStandings(g).map(r => r.id));
      comp.phase = 'ko';
      comp.ko = { rounds: [pairUp([A[0], B[1], B[0], A[1], C[0], D[1], D[0], C[1]])], round: 0 };
      const qualified = [A, B, C, D].some(t => t[0] === 'user' || t[1] === 'user');
      if (!qualified) { comp.userOut = true; comp.finish = 'grupos'; finishKnockout(comp); out.eliminated = true; }
      else out.advanced = true;
    }
    return out;
  }

  // mata-mata
  const round = comp.ko.rounds[comp.ko.round];
  round.forEach((t, i) => {
    if (t.a === 'user' || t.b === 'user') {
      const sc = t.a === home ? score : [score[1], score[0]];
      const p = pens ? { ...pens, score: t.a === home ? pens.score : [pens.score[1], pens.score[0]], winner: t.a === home ? pens.winner : 1 - pens.winner } : null;
      resolveTie(t, sc, p);
    } else {
      const r = simAI(comp, t.a, t.b, 300 + comp.ko.round * 20 + i, true);
      resolveTie(t, r.score, r.pens);
    }
  });
  const userTie = round.find(t => t.a === 'user' || t.b === 'user');
  const stageKey = { 16: 'oitavas', 8: 'quartas', 4: 'semi', 2: 'final' }[round.length * 2];
  if (userTie.winner !== 'user') {
    comp.userOut = true; comp.finish = stageKey; out.eliminated = true;
    advanceKO(comp); finishKnockout(comp);
  } else {
    advanceKO(comp);
    if (comp.done) { out.champion = true; comp.finish = 'champion'; } else out.advanced = true;
  }
  return out;
}

function finishPlace(comp) {
  const pos = standings(comp.league).findIndex(r => r.id === 'user') + 1;
  comp.finish = pos === 1 ? 'champion' : pos;
}

/** Moedas e pacote da campanha (pela fase alcançada). */
export function compReward(comp) {
  const r = COMPETITIONS[comp.type].rewards;
  if (comp.finish === 'champion') return { coins: r.champion, pack: r.pack, label: 'Campeão' };
  if (comp.type === 'liga') return { coins: r[comp.finish] || r.other, pack: null, label: `${comp.finish}º lugar` };
  const labels = { final: 'Vice-campeão', semi: 'Semifinal', quartas: 'Quartas de final', oitavas: 'Oitavas de final', grupos: 'Fase de grupos' };
  return { coins: r[comp.finish] || 0, pack: null, label: labels[comp.finish] || '' };
}

/** Texto da campanha para listas e histórico. */
export function compStatus(comp) {
  if (comp.done && comp.champion === 'user') return 'Campeão! 🏆';
  if (comp.userOut) return `Eliminado · ${compReward(comp).label}`;
  if (comp.done) return compReward(comp).label;
  const m = nextUserMatch(comp);
  return m ? m.stage : '';
}

/** Migra a liga da versão anterior (state.league) para o formato de campeonato. */
export function migrateLeague(league) {
  return { type: 'liga', edition: league.season || 1, seed: league.seed, done: league.done, champion: league.champion,
    userOut: false, finish: null, played: league.results.filter(r => r.home === 'user' || r.away === 'user').length, log: [], league };
}
