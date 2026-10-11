// ============================================================
//  MODO CLUBE — motor
//  Força do time a partir das cartas, simulação da partida
//  minuto a minuto e liga (temporada) com tabela.
//  Tudo aqui é puro: recebe dados, devolve resultados.
// ============================================================
import { CARD_BY_UID, ALL_CARDS, TEAMS, TEAM_BY_ID, POSITIONS, CREST_MORAL, LOAN, COINS, RARITY_ORDER } from '../data.js';

// ------------------------------------------------------------
//  Formações (5 em campo: goleiro + 4)
// ------------------------------------------------------------
export const FORMATIONS = {
  '2-1-1': { label: 'Defensiva',   slots: ['GOL', 'DEF', 'DEF', 'MEI', 'ATA'] },
  '1-2-1': { label: 'Equilibrada', slots: ['GOL', 'DEF', 'MEI', 'MEI', 'ATA'] },
  '1-1-2': { label: 'Ofensiva',    slots: ['GOL', 'DEF', 'MEI', 'ATA', 'ATA'] },
};
export const LINE_LABEL = { GOL: 'Goleiro', DEF: 'Defesa', MEI: 'Meio', ATA: 'Ataque' };
const BASE_PLAYER = { GOL: 42, DEF: 50, MEI: 50, ATA: 50 };   // "jogador da base" quando a vaga está vazia
const SURNAMES = ['Silva', 'Souza', 'Oliveira', 'Santos', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento', 'Lima',
  'Araújo', 'Fernandes', 'Carvalho', 'Gomes', 'Martins', 'Rocha', 'Ribeiro', 'Alves', 'Monteiro', 'Mendes', 'Barbosa', 'Freitas'];

/** O jogador está na posição natural da vaga? */
export const naturalFor = (card, line) => !!card && POSITIONS[card.pos].line === line;

/** Atributos efetivos: jogador emprestado do baralho rende LOAN.player (80%). */
export function effAttrs(card, loan = false) {
  if (!loan) return card.attrs;
  const o = {};
  for (const k in card.attrs) o[k] = Math.round(card.attrs[k] * LOAN.player);
  return o;
}
export const effOvr = (card, loan = false) => (loan ? Math.round(card.ovr * LOAN.player) : card.ovr);
export const loanMoral = card => Math.max(0, CREST_MORAL[card.rarity] + LOAN.crestMoral);
export const loanMando = card => Math.max(1, Math.round(card.mando * LOAN.stadium));
export const loanPower = card => Math.max(1, Math.round(card.power * LOAN.mascot));

/** Nota do jogador numa vaga: o atributo da linha (já reflete jogar fora de posição). */
export function slotRating(card, line, loan = false) {
  return card ? effAttrs(card, loan)[line] : BASE_PLAYER[line];
}

export const LOAN_SLOT = 'loan';      // marcador de "vaga de empréstimo" em club.slots / club.bench
export const isLoanSlot = u => u === LOAN_SLOT;
export const loanSlots = club => [...club.slots, ...club.bench].filter(isLoanSlot).length;

/**
 * Melhor escalação automática com as cartas do jogador.
 * Vagas que nenhuma carta própria preenche viram vagas de empréstimo (até LOAN.maxPlayers),
 * desde que o sorteio médio renda mais que o jogador da base.
 */
export function autoLineup(ownedUids, formation, isOwned = () => true) {
  const lines = FORMATIONS[formation].slots;
  const owned = ownedUids.map(u => CARD_BY_UID[u]).filter(Boolean);
  const slots = Array(5).fill(null);
  const used = new Set(), people = new Set();      // a mesma pessoa (ex.: Pelé lenda e Pelé Prime) só entra uma vez
  const free = c => !used.has(c.uid) && !people.has(c.person);
  const take = c => { used.add(c.uid); people.add(c.person); };
  const idx = l => lines.map((x, i) => [x, i]).filter(([x]) => x === l).map(([, i]) => i);
  const order = [...idx('GOL'), ...idx('ATA'), ...idx('DEF'), ...idx('MEI')];
  for (const i of order) {
    const best = owned.filter(free).sort((a, b) => b.attrs[lines[i]] - a.attrs[lines[i]])[0];
    if (best && best.attrs[lines[i]] > BASE_PLAYER[lines[i]]) { slots[i] = best.uid; take(best); }
  }
  let loans = 0;
  for (const i of order) {
    if (slots[i] || loans >= LOAN.maxPlayers) continue;
    if (expectedLoan(lines[i], isOwned)[lines[i]] > BASE_PLAYER[lines[i]]) { slots[i] = LOAN_SLOT; loans++; }
  }
  const bench = [];
  for (const c of owned.slice().sort((a, b) => b.ovr - a.ovr)) {
    if (bench.length >= 5) break;
    if (free(c)) { bench.push(c.uid); take(c); }
  }
  while (bench.length < 5 && loans < LOAN.maxPlayers) { bench.push(LOAN_SLOT); loans++; }
  while (bench.length < 5) bench.push(null);
  return { slots, bench };
}

// ------------------------------------------------------------
//  Sorteio dos emprestados
// ------------------------------------------------------------
const PLAYERS = () => ALL_CARDS.filter(c => c.kind === 'player');
function loanPool(line, isOwned, exclude = new Set()) {
  return PLAYERS().filter(c => !isOwned(c.uid) && !exclude.has(c.person) && (!line || POSITIONS[c.pos].line === line));
}

/** Atributos médios esperados de um sorteio para a linha (para mostrar a força antes do jogo). */
const expCache = new Map();
export function expectedLoan(line, isOwned) {
  const pool = loanPool(line, isOwned);
  const key = line + ':' + pool.length;
  if (expCache.has(key)) return expCache.get(key);
  const out = { GOL: 0, DEF: 0, MEI: 0, ATA: 0 };
  let wsum = 0;
  for (const r of RARITY_ORDER) {
    const group = pool.filter(c => c.rarity === r);
    if (!group.length) continue;
    const w = LOAN.odds[r];
    wsum += w;
    for (const k in out) out[k] += w * group.reduce((t, c) => t + effAttrs(c, true)[k], 0) / group.length;
  }
  for (const k in out) out[k] = wsum ? Math.round(out[k] / wsum) : BASE_PLAYER[k];
  expCache.set(key, out);
  return out;
}

/**
 * Sorteia um jogador do baralho para cada vaga de empréstimo.
 * Titulares: da posição da vaga. Reservas: qualquer posição. Sem repetir pessoas do elenco.
 * @returns {{ [slotKey: string]: string }}  ex.: { s4: 'jog-pele', b2: 'jog-fred' }
 */
export function drawLoans(club, isOwned, rng = Math.random) {
  const lines = FORMATIONS[club.formation].slots;
  const taken = new Set([...club.slots, ...club.bench].filter(u => u && !isLoanSlot(u) && CARD_BY_UID[u]).map(u => CARD_BY_UID[u].person));
  const draws = {};
  const pick = line => {
    let pool = loanPool(line, isOwned, taken);
    if (!pool.length) pool = loanPool(null, isOwned, taken);
    if (!pool.length) return null;
    let r = rng(), rarity = RARITY_ORDER[0];
    for (const id of RARITY_ORDER) { r -= LOAN.odds[id]; if (r < 0) { rarity = id; break; } }
    const group = pool.filter(c => c.rarity === rarity);
    const list = group.length ? group : pool;
    const card = list[Math.floor(rng() * list.length)];
    taken.add(card.person);
    return card.uid;
  };
  club.slots.forEach((u, i) => { if (isLoanSlot(u)) draws['s' + i] = pick(lines[i]); });
  club.bench.forEach((u, i) => { if (isLoanSlot(u)) draws['b' + i] = pick(null); });
  return draws;
}

// ------------------------------------------------------------
//  Montagem dos times
// ------------------------------------------------------------
const VERSATTE_CREST = { id: 'vs', name: 'Versatte', abbr: 'VS', colors: ['#0F4C8A', '#FF8A1F'], pattern: 'solid' };

/**
 * Time do jogador a partir do state.club.
 * isOwned(uid): o jogador tem a carta? Se não tiver, ela entra como empréstimo (desempenho reduzido).
 */
export function userTeam(club, season = 1, isOwned = () => true, draws = null) {
  const loan = u => !!u && !isLoanSlot(u) && !isOwned(u);
  const crest = club.crest ? CARD_BY_UID[club.crest] : null;
  const stadium = club.stadium ? CARD_BY_UID[club.stadium] : null;
  const mascotCard = club.mascot ? CARD_BY_UID[club.mascot] : null;
  const mascot = mascotCard && loan(mascotCard.uid) ? { ...mascotCard, power: loanPower(mascotCard), loan: true } : mascotCard;
  const base = crest ? crest.teamData : VERSATTE_CREST;
  const lines = FORMATIONS[club.formation].slots;
  const slotPlayer = (u, line, key, idx) => {
    if (!isLoanSlot(u)) return makePlayer(CARD_BY_UID[u], line, idx, loan(u));
    const drawn = draws && draws[key] ? CARD_BY_UID[draws[key]] : null;
    if (drawn) return { ...makePlayer(drawn, line || POSITIONS[drawn.pos].line, idx, true), drawn: true };
    // antes do sorteio: força média esperada
    const l = line || 'MEI';
    return { name: 'Sorteio', shirt: 30 + idx, line: l, loanSlot: true, rating: { ...expectedLoan(line, isOwned) } };
  };
  const players = lines.map((line, i) => slotPlayer(club.slots[i], line, 's' + i, i));
  const bench = (club.bench || []).map((u, i) => [u, i]).filter(([u]) => isLoanSlot(u) ? draws && draws['b' + i] : CARD_BY_UID[u])
    .map(([u, i]) => isLoanSlot(u) ? slotPlayer(u, null, 'b' + i, 10 + i) : makePlayer(CARD_BY_UID[u], POSITIONS[CARD_BY_UID[u].pos].line, 10 + i, loan(u)));
  const crestLoan = !!crest && loan(crest.uid);
  const chem = crest && !crestLoan ? Math.min(5, players.filter(p => p.card && p.card.team === crest.team).length) : 0;
  return {
    id: 'user', user: true, name: club.name, abbr: club.abbr || base.abbr, colors: base.colors, pattern: base.pattern,
    crest, stadium, mascot, formation: club.formation, players, bench,
    moral: crest ? (crestLoan ? loanMoral(crest) : CREST_MORAL[crest.rarity]) : 0, chem, season,
    stadiumName: stadium ? stadium.name : 'Estádio Municipal',
    mando: stadium ? (loan(stadium.uid) ? loanMando(stadium) : stadium.mando) : 1,
    loans: {
      crest: crestLoan, stadium: !!stadium && loan(stadium.uid), mascot: !!mascotCard && loan(mascotCard.uid),
      players: loanSlots(club),
    },
  };
}

function makePlayer(card, line, idx, loan = false) {
  if (!card) return { name: 'Jogador da base', shirt: 20 + idx, line, base: true, rating: { ...BASE_PLAYER } };
  return { uid: card.uid, card, name: card.name, shirt: card.shirt, line, pos: card.pos, loan, rating: { ...effAttrs(card, loan) } };
}

/** Força dos clubes controlados pelo computador: sobe a cada temporada. */
export function aiPower(team, season) {
  return Math.min(95, Math.round(56 + (team.power - 70) * 0.95 + (season - 1) * 3.5));
}

/** Time da IA a partir de um clube da Série A */
export function aiTeam(teamId, season = 1, formation) {
  const t = TEAM_BY_ID[teamId];
  const pw = aiPower(t, season);
  const seed = [...teamId].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const form = formation || Object.keys(FORMATIONS)[seed % 3];
  const lines = FORMATIONS[form].slots;
  const name = i => SURNAMES[(seed * 7 + i * 5) % SURNAMES.length];
  const rating = (line, d) => {
    const v = pw + d;
    return { GOL: line === 'GOL' ? v : 30, DEF: line === 'DEF' ? v : v - 14, MEI: line === 'MEI' ? v : v - 10, ATA: line === 'ATA' ? v : v - 16 };
  };
  const delta = { GOL: -1, DEF: 0, MEI: 1, ATA: 1 };
  const players = lines.map((line, i) => ({ name: name(i), shirt: [1, 4, 8, 10, 9][i], line, rating: rating(line, delta[line] + ((seed + i) % 5) - 2) }));
  const bench = ['DEF', 'MEI', 'ATA'].map((line, i) => ({ name: name(i + 6), shirt: 12 + i, line, rating: rating(line, -5) }));
  const mascot = CARD_BY_UID[`masc-${teamId}`] || null;
  const stadiumCard = Object.values(CARD_BY_UID).find(c => c.kind === 'stadium' && c.team === teamId) || null;
  return {
    id: teamId, user: false, name: t.name, abbr: t.abbr, colors: t.colors, pattern: t.pattern,
    crest: CARD_BY_UID[`clube-${teamId}`], stadium: stadiumCard, mascot, formation: form, players, bench,
    moral: 1, chem: 3, season, stadiumName: stadiumCard ? stadiumCard.name : t.stadium, mando: stadiumCard ? stadiumCard.mando : 2,
    power: pw,
  };
}

// ------------------------------------------------------------
//  Força por setor
// ------------------------------------------------------------
const avg = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;

function lineValues(onField, fatigue) {
  const by = l => onField.filter(p => p.line === l).map(p => p.rating[l] * (p.fresh ? 1 : fatigue));
  return { G: avg(by('GOL')) || 30, D: avg(by('DEF')) || 40, M: avg(by('MEI')) || 40, A: avg(by('ATA')) || 40 };
}

/** Força consolidada (usada na partida e nas barras da tela de escalação). */
export function teamRatings(team, { home = false, fatigue = 1, reds = 0, onField = team.players, opp = null } = {}) {
  const l = lineValues(onField, fatigue);
  let ATQ = 0.6 * l.A + 0.3 * l.M + 0.1 * l.D;
  let CRI = 0.6 * l.M + 0.2 * l.A + 0.2 * l.D;
  let DEF = 0.6 * l.D + 0.25 * l.M + 0.15 * l.G;
  let G = l.G;
  const all = team.moral + team.chem + (home ? team.mando : 0);
  ATQ += all; CRI += all; DEF += all; G += all * 0.5;
  const m = team.mascot;
  if (m) {
    const v = m.power;
    if (m.ability === 'ataque') ATQ += v;
    if (m.ability === 'muralha') DEF += v;
    if (m.ability === 'meio') CRI += v;
    if (m.ability === 'reflexo') G += v;
    if (m.ability === 'torcida' && home) { ATQ += v; CRI += v; DEF += v; }
  }
  const om = opp && opp.mascot;
  if (om && om.ability === 'caos') { ATQ -= om.power; CRI -= om.power / 2; }
  const redF = Math.pow(0.88, reds);
  return { ATQ: ATQ * redF, CRI: CRI * redF, DEF: DEF * redF, G, OVR: Math.min(99, Math.round((ATQ + CRI + DEF + G) / 4 * redF)) };
}

// ------------------------------------------------------------
//  Partida
// ------------------------------------------------------------
export function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pickWeighted = (items, weight, rng) => {
  const total = items.reduce((s, x) => s + weight(x), 0);
  let r = rng() * total;
  for (const x of items) { r -= weight(x); if (r <= 0) return x; }
  return items[items.length - 1];
};

const SHOT_W = { ATA: 6, MEI: 3, DEF: 1, GOL: 0.05 };
const ASSIST_W = { ATA: 2, MEI: 3, DEF: 1, GOL: 0.2 };

/**
 * Simula uma partida. Devolve { score, events, mvp, stats }.
 * Eventos: kickoff, goal, save, post, miss, foul, yellow, red, sub, half, end
 */
export function simulateMatch(home, away, { seed = Date.now() } = {}) {
  const rng = mulberry32(seed);
  const side = [home, away].map(t => ({
    team: t, onField: t.players.map(p => ({ ...p, fresh: false })), bench: t.bench.map(p => ({ ...p, fresh: true })),
    reds: 0, yellows: {}, goals: 0, shots: 0, onTarget: 0, poss: 0,
  }));
  const events = [{ min: 0, type: 'kickoff' }];
  const score = [0, 0];
  const scorers = new Map();
  const possession = [0];   // quem teve a bola em cada minuto (0 = mandante, 1 = visitante)

  const ratingsAt = (s, min) => {
    const fatigue = min <= 60 ? 1 : 1 - 0.07 * (min - 60) / 30;
    return teamRatings(s.team, { home: s === side[0], fatigue, reds: s.reds, onField: s.onField, opp: (s === side[0] ? side[1] : side[0]).team });
  };

  for (let min = 1; min <= 90; min++) {
    if (min === 46) events.push({ min: 45, type: 'half', score: [...score] });
    if (min === 65) side.forEach((s, i) => doSubs(s, i, events, min));

    const r = side.map(s => ratingsAt(s, min));
    const pHome = Math.pow(r[0].CRI, 2) / (Math.pow(r[0].CRI, 2) + Math.pow(r[1].CRI, 2));
    const a = rng() < pHome ? 0 : 1, d = 1 - a;
    side[a].poss++;
    possession[min] = a;
    const ra = r[a], rd = r[d];
    const att = side[a], def = side[d];

    let chance = Math.min(0.2, 0.085 * Math.pow(ra.ATQ / rd.DEF, 1.25));
    const am = att.team.mascot, dm = def.team.mascot;
    if (am && am.ability === 'pressao' && min >= 76) chance *= 1 + am.power * 0.04;
    if (am && am.ability === 'raca' && score[a] < score[d]) chance *= 1 + am.power * 0.05;

    if (rng() < chance) {
      const penalty = rng() < 0.06;
      const field = att.onField.filter(p => !p.sentOff);
      const shooter = pickWeighted(field, p => SHOT_W[p.line] * (p.rating.ATA / 50), rng);
      const mates = field.filter(p => p !== shooter);
      const assist = !penalty && mates.length && rng() < 0.75 ? pickWeighted(mates, p => ASSIST_W[p.line] * (p.rating.MEI / 50), rng) : null;
      const keeper = def.onField.find(p => p.line === 'GOL') || def.onField[0];
      const q = ra.ATQ / (rd.DEF * 0.45 + rd.G * 0.55);
      let goalP = penalty ? 0.76 : Math.min(0.55, Math.max(0.1, 0.3 * Math.pow(q, 1.3)));
      if (am && am.ability === 'contra') goalP += am.power * 0.01;
      const roll = rng();
      att.shots++;
      const base = { min, team: a, shooter: shooter.name, shooterUid: shooter.uid, penalty, x: rng() };
      if (roll < goalP) {
        if (dm && dm.ability === 'sorte' && rng() < dm.power * 0.015) {
          events.push({ ...base, type: 'post', luck: dm.name });
        } else {
          score[a]++; att.goals++; att.onTarget++;
          scorers.set(shooter, (scorers.get(shooter) || 0) + 1);
          events.push({ ...base, type: 'goal', assist: assist ? assist.name : null, score: [...score] });
        }
      } else if (roll < goalP + 0.10) {
        events.push({ ...base, type: 'post' });
      } else if (roll < goalP + 0.10 + 0.5 * (1 - goalP)) {
        att.onTarget++;
        events.push({ ...base, type: 'save', keeper: keeper.name, keeperUid: keeper.uid });
      } else {
        events.push({ ...base, type: 'miss' });
      }
    } else if (rng() < 0.028) {
      const field = def.onField.filter(p => !p.sentOff && p.line !== 'GOL');
      if (!field.length) continue;
      const who = field[Math.floor(rng() * field.length)];
      const key = who.name + who.shirt;
      if (rng() < 0.012) {
        who.sentOff = true; def.reds++;
        events.push({ min, team: d, type: 'red', player: who.name });
      } else if (rng() < 0.32) {
        def.yellows[key] = (def.yellows[key] || 0) + 1;
        if (def.yellows[key] === 2) { who.sentOff = true; def.reds++; events.push({ min, team: d, type: 'red', player: who.name, second: true }); }
        else events.push({ min, team: d, type: 'yellow', player: who.name });
      } else {
        events.push({ min, team: d, type: 'foul', player: who.name });
      }
    }
  }
  events.push({ min: 90, type: 'end', score: [...score] });

  // craque do jogo: quem mais marcou; empate → melhor nota do time vencedor
  let mvp = null, best = -1;
  for (const [p, g] of scorers) if (g > best) { best = g; mvp = p; }
  if (!mvp) {
    const w = score[0] >= score[1] ? 0 : 1;
    mvp = side[w].onField.slice().sort((x, y) => (y.rating[y.line] || 0) - (x.rating[x.line] || 0))[0];
  }
  const totalPoss = side[0].poss + side[1].poss || 1;
  return {
    score, events, possession,
    mvp: mvp ? { name: mvp.name, uid: mvp.uid, goals: scorers.get(mvp) || 0, team: side[0].onField.includes(mvp) || side[0].bench.includes(mvp) ? 0 : 1 } : null,
    stats: side.map(s => ({ shots: s.shots, onTarget: s.onTarget, poss: Math.round(s.poss / totalPoss * 100) })),
  };
}

function doSubs(s, sideIdx, events, min) {
  const fatigue = 0.977;   // cansaço aos 65'
  let done = 0;
  for (const benchP of s.bench.slice().sort((a, b) => (b.rating[b.line]) - (a.rating[a.line]))) {
    if (done >= 2) break;
    // troca o titular da mesma linha com menor nota, se o reserva render mais
    const candidates = s.onField.filter(p => p.line === benchP.line && !p.sentOff && !p.subbed);
    const worst = candidates.sort((a, b) => a.rating[a.line] - b.rating[b.line])[0];
    if (!worst || benchP.rating[benchP.line] <= worst.rating[worst.line] * fatigue) continue;
    const idx = s.onField.indexOf(worst);
    s.onField[idx] = { ...benchP, line: worst.line, fresh: true, subbed: true };
    s.bench = s.bench.filter(p => p !== benchP);
    events.push({ min, team: sideIdx, type: 'sub', playerIn: benchP.name, playerOut: worst.name, inUid: benchP.uid });
    done++;
  }
}

/** Probabilidade aproximada de vitória/empate/derrota (para a prévia do jogo). */
export function predict(home, away, runs = 300) {
  let w = 0, dr = 0, l = 0;
  for (let i = 0; i < runs; i++) {
    const { score } = simulateMatch(home, away, { seed: 999 + i * 7919 });
    if (score[0] > score[1]) w++; else if (score[0] === score[1]) dr++; else l++;
  }
  return { win: w / runs, draw: dr / runs, loss: l / runs };
}

// ------------------------------------------------------------
//  Liga (temporada de 8 clubes, turno único = 7 rodadas)
// ------------------------------------------------------------
export function createLeague(userCrestTeam, season = 1, seed = Date.now()) {
  const rng = mulberry32(seed);
  const pool = TEAMS.map(t => t.id).filter(id => id !== userCrestTeam);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const ids = ['user', ...pool.slice(0, 7)];
  // método do círculo para o turno único
  const n = ids.length, rounds = [];
  const arr = ids.slice();
  for (let r = 0; r < n - 1; r++) {
    const games = [];
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i], b = arr[n - 1 - i];
      games.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    rounds.push(games);
    arr.splice(1, 0, arr.pop());
  }
  const table = Object.fromEntries(ids.map(id => [id, { P: 0, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0 }]));
  return { season, round: 0, ids, rounds, table, results: [], done: false, champion: null, seed };
}

export function applyResult(league, homeId, awayId, score) {
  const [h, a] = [league.table[homeId], league.table[awayId]];
  h.J++; a.J++; h.GP += score[0]; h.GC += score[1]; a.GP += score[1]; a.GC += score[0];
  if (score[0] > score[1]) { h.V++; h.P += 3; a.D++; }
  else if (score[0] < score[1]) { a.V++; a.P += 3; h.D++; }
  else { h.E++; a.E++; h.P++; a.P++; }
  league.results.push({ round: league.round, home: homeId, away: awayId, score });
}

export function standings(league) {
  return Object.entries(league.table)
    .map(([id, r]) => ({ id, ...r, SG: r.GP - r.GC }))
    .sort((x, y) => y.P - x.P || y.V - x.V || y.SG - x.SG || y.GP - x.GP || x.id.localeCompare(y.id));
}

/** Simula as outras partidas da rodada atual (as que não envolvem o jogador). */
export function simulateOtherGames(league) {
  const games = league.rounds[league.round].filter(([h, a]) => h !== 'user' && a !== 'user');
  games.forEach(([h, a], i) => {
    const res = simulateMatch(aiTeam(h, league.season), aiTeam(a, league.season), { seed: league.seed + league.round * 101 + i * 13 });
    applyResult(league, h, a, res.score);
  });
}

export function userFixture(league) {
  if (league.done) return null;
  const g = league.rounds[league.round].find(([h, a]) => h === 'user' || a === 'user');
  return g ? { home: g[0], away: g[1], userHome: g[0] === 'user', opponent: g[0] === 'user' ? g[1] : g[0] } : null;
}

export function advanceRound(league) {
  league.round++;
  if (league.round >= league.rounds.length) {
    league.done = true;
    league.champion = standings(league)[0].id;
  }
}

// ------------------------------------------------------------
//  Recompensas (alimentam a coleção: pontos → pacotes)
// ------------------------------------------------------------
export const REWARDS = COINS;

/** Moedas (e pacote bônus) ganhos numa partida. */
export function matchReward(goalsFor, goalsAgainst, outcome, streak) {
  const lines = [];
  lines.push([{ win: 'Vitória', draw: 'Empate', loss: 'Participação' }[outcome], { win: COINS.win, draw: COINS.draw, loss: COINS.loss }[outcome]]);
  if (goalsFor) lines.push([`${goalsFor} gol(s) marcado(s)`, goalsFor * COINS.goal]);
  if (!goalsAgainst) lines.push(['Sem sofrer gol', COINS.cleanSheet]);
  if (outcome === 'win' && streak > 0 && streak % 3 === 0) lines.push([`${streak} vitórias seguidas 🔥`, COINS.streak3]);
  const pack = outcome === 'win' && streak > 0 && streak % 5 === 0 ? COINS.streak5Pack : null;
  return { coins: lines.reduce((t, [, v]) => t + v, 0), lines, pack };
}
