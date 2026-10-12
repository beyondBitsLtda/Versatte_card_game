// ============================================================
//  MODO CLUBE — telas (criar clube, escalação, campeonatos, partidas)
//  Cartas que o jogador não tem podem ser EMPRESTADAS do baralho,
//  sempre com desempenho reduzido (regras em LOAN, js/data.js).
// ============================================================
import { ALL_CARDS, CARD_BY_UID, TEAM_BY_ID, POSITIONS, RARITIES, CREST_MORAL, ABILITIES, LOAN, COINS, PACK_STYLE, COMPETITIONS } from '../data.js';
import { state, save, ownedCount, addPacks } from '../state.js';
import { cardHTML, gem, abilityText } from '../cards.js';
import {
  FORMATIONS, LINE_LABEL, autoLineup, userTeam, aiTeam, teamRatings, simulateMatch, predict, naturalFor,
  standings, matchReward,
  effAttrs, effOvr, loanMoral, loanMando, loanPower,
  LOAN_SLOT, isLoanSlot, loanSlots, drawLoans, expectedLoan,
} from './engine.js';
import { playMatch, crestMini } from './match.js';
import { playTextMatch } from './textmatch.js';
import { offlineSource } from './live.js';
import {
  createComp, nextUserMatch, recordUserMatch, compReward, compStatus, compLevel, groupStandings, userGroup, koRoundName, migrateLeague,
} from './tournament.js';
import { mountTrophies } from './trophy3d.js';
import { rewardE } from '../net/economy.js';
import { isDesk } from '../desktop.js';
import { confetti, burst, sfx, haptic, coinFly } from '../fx.js';
import { icon, esc, el, sheet, overlay, toast } from '../ui.js';

// ------------------------------------------------------------
//  Cartas por tipo: próprias e emprestáveis (do baralho)
// ------------------------------------------------------------
const isOwned = u => ownedCount(u) > 0;
const owned = c => isOwned(c.uid);
const ofKind = k => ALL_CARDS.filter(c => c.kind === k);
export const myCrests = () => ofKind('team').filter(owned);
export const myStadiums = () => ofKind('stadium').filter(owned);
export const myMascots = () => ofKind('mascot').filter(owned);
export const myPlayers = () => ofKind('player').filter(owned);
const loanable = k => ofKind(k).filter(c => !owned(c));

const byRarity = (a, b) => RARITIES[b.rarity].order - RARITIES[a.rarity].order;
const team = (club = state.club, draws = null) => userTeam(club, state.comp ? compLevel(state.comp) : 1, isOwned, draws);
const lineup = formation => autoLineup(myPlayers().map(p => p.uid), formation, isOwned);
const loanCount = club => loanSlots(club);

/**
 * Normaliza o clube: remove cartas inválidas e transforma jogadores que o usuário
 * não tem (de versões antigas) em vagas de empréstimo sorteadas.
 */
function sanitizeClub() {
  const c = state.club; if (!c) return;
  const ok = u => (u && CARD_BY_UID[u] ? u : null);
  c.crest = ok(c.crest); c.stadium = ok(c.stadium); c.mascot = ok(c.mascot);
  let loans = 0;
  const fix = u => {
    if (isLoanSlot(u) || (u && CARD_BY_UID[u] && !isOwned(u))) return loans++ < LOAN.maxPlayers ? LOAN_SLOT : null;
    return ok(u);
  };
  c.slots = c.slots.map(fix); c.bench = c.bench.map(fix);
}

const fmtPct = v => `${Math.round(v * 100)}%`;
function probBar(win, draw, loss, big = false) {
  const seg = (cls, v, short, long) => v < 0.005 ? '' : `<span class="${cls}" style="flex:${Math.max(v, 0.06)}">${v >= 0.18 ? `${big ? long : short} ` : ''}${fmtPct(v)}</span>`;
  return `<div class="nx-prob ${big ? 'big' : ''}">${seg('w', win, 'V', 'Vitória')}${seg('d', draw, 'E', 'Empate')}${seg('l', loss, 'D', 'Derrota')}</div>`;
}
const teamLabel = id => (id === 'user' ? state.club.name : TEAM_BY_ID[id].name);
const teamAbbr = id => (id === 'user' ? state.club.abbr : TEAM_BY_ID[id].abbr);
const loanTag = '<span class="loan-tag">EMP</span>';

function ratingBars(r) {
  const rows = [['Ataque', r.ATQ], ['Criação', r.CRI], ['Defesa', r.DEF], ['Goleiro', r.G]];
  return `<div class="rbars">${rows.map(([label, v]) => `
    <div class="rb"><span>${label}</span><div class="bar"><i style="--to:${Math.min(1, v / 100)}"></i></div><b>${Math.min(99, Math.round(v))}</b></div>`).join('')}</div>`;
}

// ============================================================
//  TELA "JOGAR"
// ============================================================
const COMP_IDS = Object.keys(COMPETITIONS);
const compLevelOf = c => (c ? compLevel(c) : 1);
const crestOf = id => (id === 'user' ? crestMini(team()) : crestMini({ crest: CARD_BY_UID[`clube-${id}`] }));
let cleanupTrophies = null;

/** Converte a liga da versão anterior e garante o estado do campeonato. */
function ensureComp() {
  if (!state.comp && state.league) { state.comp = migrateLeague(state.league); state.league = null; save(); }
}

export function clubView(app) {
  sanitizeClub();
  ensureComp();
  if (settlePendingMatch()) setTimeout(() => toast('Partida abandonada no meio: derrota por W.O. (3 x 0)'), 400);
  if (cleanupTrophies) { cleanupTrophies(); cleanupTrophies = null; }
  if (!state.club) return introView(app);
  const club = state.club;
  const comp = state.comp;
  const active = comp && !comp.done && !comp.userOut;
  const me = team();
  const R = teamRatings(me, { home: true });
  const g = state.game;
  const stadium = club.stadium ? CARD_BY_UID[club.stadium] : null;
  const mascot = me.mascot;
  const empty = club.slots.filter(u => !u).length;
  const L = me.loans;
  const loanItems = [L.crest && 'escudo', L.stadium && 'estádio', L.mascot && 'mascote', L.players && `${L.players} vaga(s) de jogador`].filter(Boolean);
  const def = comp ? COMPETITIONS[comp.type] : null;

  const node = el(`
  <section class="view jogar">
   <div class="jg-a">
    <div class="cl-card" style="--c1:${me.colors[0]};--c2:${me.colors[1] || '#fff'}">
      <div class="cl-crest">${crestMini(me)}</div>
      <div class="cl-info">
        <span class="cl-season">${active ? `${esc(def.name)} · ${comp.edition}ª edição` : 'Modo Clube'}</span>
        <h2>${esc(club.name)}</h2>
        <div class="cl-tags">
          <span>${icon.home} ${esc(stadium ? stadium.name : 'Estádio Municipal')} <b>+${me.mando}</b>${L.stadium ? loanTag : ''}</span>
          <span>${mascot ? `${mascot.emoji} ${esc(mascot.name)}${L.mascot ? loanTag : ''}` : 'Sem mascote'}</span>
          <span>${icon.album} ${club.formation}</span>
        </div>
      </div>
      <button class="icon-btn cl-edit" data-act="edit" aria-label="Editar clube">${icon.sparkle}</button>
    </div>

    <div class="cl-ovr">
      <div class="ovr-big"><b>${R.OVR}</b><span>OVR</span></div>
      ${ratingBars(R)}
    </div>
    <div class="cl-mods">
      <span>${icon.trophy} Moral +${me.moral}${L.crest ? loanTag : ''}</span>
      <span>${icon.sparkle} Química +${me.chem}</span>
      ${mascot ? `<span title="${esc(abilityText(mascot).desc)}">${mascot.emoji} ${esc(abilityText(mascot).label)} +${mascot.power}</span>` : ''}
    </div>
    ${loanItems.length ? `<button class="loan-row" data-act="lineup">${icon.swipe}<span><b>Emprestado do baralho:</b> ${loanItems.join(', ')}.${L.players ? ' Os jogadores são <b>sorteados a cada partida</b>.' : ''} Conquiste suas cartas nos pacotes!</span></button>` : ''}
    ${empty ? `<button class="warn-row" data-act="lineup">${icon.lock}<span>${empty} vaga(s) com jogador da base — escale ou pegue emprestado</span>${icon.arrow}</button>` : ''}
    <button class="btn ghost wide jg-lineup" data-act="lineup">${icon.album} Escalação</button>
   </div>

   <div class="jg-b">
    ${active ? activeCompHtml(comp, me) : (comp ? finishedCompHtml(comp) : '') + chooseCompHtml()}
   </div>

   <div class="jg-c">
    <div class="section-head"><h3>Sala de troféus</h3><span class="muted">${Object.values(state.trophies).reduce((a, b) => a + b, 0)} título(s)</span></div>
    <div class="cabinet">
      ${COMP_IDS.map(id => {
        const n = state.trophies[id] || 0;
        return `
        <div class="cab ${n ? 'won' : 'locked'}" style="--tc:${COMPETITIONS[id].color}">
          <div class="cab-3d" data-trophy="${id}" data-locked="${n ? 0 : 1}" data-spin="${n ? 0.7 : 0.25}"></div>
          <b>${esc(COMPETITIONS[id].trophy)}</b>
          <span>${n ? `×${n} conquista${n > 1 ? 's' : ''}` : 'Ainda não conquistado'}</span>
        </div>`;
      }).join('')}
    </div>

    <div class="section-head"><h3>Seu desempenho</h3></div>
    <div class="stat-row six">
      <div><b>${g.played}</b><span>jogos</span></div>
      <div><b>${g.won}</b><span>vitórias</span></div>
      <div><b>${g.drawn}</b><span>empates</span></div>
      <div><b>${g.lost}</b><span>derrotas</span></div>
      <div class="${g.streak >= 3 ? 'hot' : ''}"><b>${g.streak}${g.streak >= 3 ? '🔥' : ''}</b><span>sequência</span></div>
      <div><b>${g.titles}</b><span>títulos</span></div>
    </div>
    <button class="btn ghost wide" data-act="friendly">${icon.play} Amistoso rápido</button>
    <button class="coin-hint" data-act="shop">${icon.coin}<span>Vitória <b>+${COINS.win}</b> · empate <b>+${COINS.draw}</b> · gol <b>+${COINS.goal}</b> moedas. Títulos valem muito mais!</span>${icon.arrow}</button>
    ${active ? `<button class="link-btn abandon" data-act="abandon">Abandonar ${esc(def.name)}</button>` : ''}
   </div>
  </section>`);

  node.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    sfx.tap();
    const act = b.dataset.act;
    if (act === 'lineup') openLineup(app);
    if (act === 'edit') openIdentity(app, false);
    if (act === 'play') playCompRound(app);
    if (act === 'friendly') playFriendly(app);
    if (act === 'shop') app.go('shop');
    if (act === 'start') startComp(app, b.dataset.comp);
    if (act === 'abandon' && confirm(`Abandonar a ${def.name}? A campanha atual será perdida.`)) { state.comp = null; save(); app.refresh(); }
    if (act === 'group') { node.querySelectorAll('.grp').forEach(x => x.classList.toggle('open', x === b.closest('.grp') && !x.classList.contains('open'))); }
  });
  requestAnimationFrame(() => { cleanupTrophies = mountTrophies(node); });
  return node;
}

function startComp(app, type) {
  const club = state.club;
  const edition = (state.editions[type] || 0) + 1;
  state.editions[type] = edition;
  state.comp = createComp(type, club.crest ? CARD_BY_UID[club.crest].team : null, edition);
  save();
  sfx.whistle(1);
  toast(`${COMPETITIONS[type].name} · ${edition}ª edição: boa sorte!`, { tone: 'ok' });
  app.refresh();
}

function chooseCompHtml() {
  return `
    <div class="section-head"><h3>Escolha um campeonato</h3></div>
    <div class="comps">
      ${COMP_IDS.map(id => {
        const c = COMPETITIONS[id];
        const ed = (state.editions[id] || 0) + 1;
        return `
        <div class="comp-card" style="--tc:${c.color}">
          <div class="cc-3d" data-trophy="${id}" data-spin="0.8"></div>
          <div class="cc-txt">
            <span class="cc-fmt">${esc(c.format)} · ${esc(c.games)}</span>
            <b>${esc(c.name)}</b>
            <p>${esc(c.desc)}</p>
            <div class="cc-rew">${icon.coin} ${c.rewards.champion} moedas + pacote ${PACK_STYLE[c.rewards.pack].short.toLowerCase()} para o campeão</div>
            <button class="btn primary" data-act="start" data-comp="${id}">Disputar ${ed > 1 ? `a ${ed}ª edição` : ''}</button>
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

function finishedCompHtml(comp) {
  const def = COMPETITIONS[comp.type];
  const champ = comp.champion === 'user';
  const r = compReward(comp);
  return `
    <div class="nx done ${champ ? 'champ' : ''}">
      <div class="nx-trophy3d" data-trophy="${comp.type}" data-locked="${champ ? 0 : 1}"></div>
      <b>${champ ? `Campeão da ${esc(def.name)}!` : `${esc(def.name)} · ${esc(r.label)}`}</b>
      <span>Campeão: ${esc(teamLabel(comp.champion))}</span>
    </div>`;
}

function activeCompHtml(comp, me) {
  const def = COMPETITIONS[comp.type];
  const m = nextUserMatch(comp);
  let next = '';
  if (m) {
    const opp = aiTeam(m.opponent, compLevel(comp));
    const home = m.userHome ? me : opp, away = m.userHome ? opp : me;
    const p = predict(home, away, 160);
    const [win, loss] = m.userHome ? [p.win, p.loss] : [p.loss, p.win];
    next = `
      <div class="nx ${m.knockout ? 'ko' : ''} ${m.final ? 'final' : ''}">
        <div class="nx-h"><span>${esc(m.stage)}${m.knockout ? ' · jogo único' : ''}</span><span>${m.userHome ? 'Em casa' : 'Fora de casa'} · ${esc(home.stadiumName)}</span></div>
        <div class="nx-vs">
          <div>${crestMini(me)}<b>${esc(state.club.name)}</b><small>OVR ${teamRatings(me).OVR}</small></div>
          <strong>${m.final ? '🏆' : 'VS'}</strong>
          <div>${crestMini(opp)}<b>${esc(opp.name)}</b><small>OVR ${teamRatings(opp).OVR}</small></div>
        </div>
        ${probBar(win, p.draw, loss)}
        ${m.knockout ? '<p class="nx-ko">Empate leva para os pênaltis. Quem perder está fora!</p>' : ''}
        <div class="nx-actions">
          <button class="btn ghost" data-act="lineup">${icon.album} Escalação</button>
          <button class="btn primary big" data-act="play">${icon.play} Jogar</button>
        </div>
      </div>`;
  }
  return `
    <div class="comp-head" style="--tc:${def.color}">
      <div class="ch-3d" data-trophy="${comp.type}" data-spin="0.9"></div>
      <div><span>${esc(def.format)} · ${comp.edition}ª edição</span><b>${esc(def.name)}</b><small>${esc(compStatus(comp))}</small></div>
    </div>
    ${next}
    ${comp.type === 'liga' ? leagueHtml(comp) : ''}
    ${comp.type === 'continental' && comp.phase === 'groups' ? groupsHtml(comp) : ''}
    ${comp.phase === 'ko' ? bracketHtml(comp) : ''}
    ${comp.type === 'continental' && comp.phase === 'ko' ? groupsHtml(comp, true) : ''}`;
}

function tableRows(rows) {
  return `
    <div class="tbl">
      <div class="tr th"><span>#</span><span>Clube</span><span>P</span><span>J</span><span>V</span><span>SG</span></div>
      ${rows.map((r, i) => `
        <div class="tr ${r.id === 'user' ? 'me' : ''} ${r.q ? 'q' : ''}">
          <span>${i + 1}</span>
          <span class="tc">${crestOf(r.id)}<b>${esc(teamLabel(r.id))}</b></span>
          <span><b>${r.P}</b></span><span>${r.J}</span><span>${r.V}</span><span>${r.SG > 0 ? '+' : ''}${r.SG}</span>
        </div>`).join('')}
    </div>`;
}

function leagueHtml(comp) {
  const lg = comp.league;
  const rows = standings(lg);
  const last = lg.results.filter(r => r.round === lg.round - 1);
  return `
    <div class="section-head"><h3>Classificação</h3><span class="muted">${rows.findIndex(r => r.id === 'user') + 1}º lugar</span></div>
    ${tableRows(rows)}
    ${last.length ? `
      <div class="last-round">
        <span class="lr-h">Rodada ${lg.round}</span>
        ${last.map(r => `<div class="lr ${r.home === 'user' || r.away === 'user' ? 'me' : ''}"><span>${esc(teamAbbr(r.home))}</span><b>${r.score[0]} x ${r.score[1]}</b><span>${esc(teamAbbr(r.away))}</span></div>`).join('')}
      </div>` : ''}`;
}

function groupsHtml(comp, collapsed = false) {
  const mine = userGroup(comp);
  return `
    <div class="section-head"><h3>Fase de grupos</h3><span class="muted">2 melhores avançam</span></div>
    <div class="groups">
      ${comp.groups.map(g => {
        const rows = groupStandings(g).map((r, i) => ({ ...r, q: i < 2 }));
        const open = !collapsed && g === mine;
        return `
        <div class="grp ${open ? 'open' : ''} ${g === mine ? 'mine' : ''}">
          <button class="grp-h" data-act="group"><b>Grupo ${g.name}</b><span>${rows.slice(0, 2).map(r => esc(teamAbbr(r.id))).join(' · ')}</span>${icon.arrow}</button>
          <div class="grp-b">${tableRows(rows)}</div>
        </div>`;
      }).join('')}
    </div>`;
}

function bracketHtml(comp) {
  const rounds = comp.ko.rounds;
  const total = rounds[0].length * 2;
  const names = [];
  for (let n = total; n >= 2; n /= 2) names.push(koRoundName(n));
  const tieHtml = t => {
    const side = (id, s) => `
      <div class="bt-s ${t.winner === id ? 'w' : ''} ${t.winner && t.winner !== id ? 'l' : ''} ${id === 'user' ? 'me' : ''}">
        ${id ? crestOf(id) : ''}<b>${id ? esc(teamAbbr(id)) : '—'}</b><i>${t.score ? t.score[s] : ''}${t.pens ? `<small>(${t.pens[s]})</small>` : ''}</i>
      </div>`;
    return `<div class="bt">${side(t.a, 0)}${side(t.b, 1)}</div>`;
  };
  return `
    <div class="section-head"><h3>Mata-mata</h3><span class="muted">${isDesk() ? 'role para o lado para ver as fases' : 'deslize para ver as fases'}</span></div>
    <div class="bracket">
      ${names.map((name, ri) => {
        const ties = rounds[ri] || Array.from({ length: total / Math.pow(2, ri + 1) }, () => ({ a: null, b: null }));
        return `<div class="br-col ${ri === comp.ko.round ? 'now' : ''}"><span class="br-h">${esc(name)}</span><div class="br-ties">${ties.map(tieHtml).join('')}</div></div>`;
      }).join('')}
      <div class="br-col champ"><span class="br-h">Campeão</span><div class="br-ties"><div class="bt champ-box">${comp.champion ? `${crestOf(comp.champion)}<b>${esc(teamLabel(comp.champion))}</b>` : '<div class="br-cup" data-trophy="' + comp.type + '" data-spin="1"></div>'}</div></div></div>
    </div>`;
}

function introView(app) {
  const n = { crest: myCrests().length, stadium: myStadiums().length, mascot: myMascots().length, player: myPlayers().length };
  const row = (ico, label, count, need, tip) => `
    <div class="req ${count >= need ? 'ok' : ''}">
      <span class="req-ico">${ico}</span>
      <div><b>${label}</b><small>${tip}</small></div>
      <span class="req-n">${count}${need > 1 ? `/${need}` : ''}</span>
    </div>`;
  const node = el(`
  <section class="view jogar intro-club">
    <div class="jg-hero">
      <div class="jg-ball">⚽</div>
      <h1>Modo <em>Clube</em></h1>
      <p>Monte seu time com as cartas que você conquistou e dispute a <b>Liga Versatte</b>. Cada partida rende <b>moedas</b> para trocar por pacotes.</p>
    </div>
    <div class="reqs">
      ${row('🛡️', 'Escudo', n.crest, 1, 'Uma carta da coleção Clubes vira o escudo e as cores do seu time')}
      ${row('🏟️', 'Estádio', n.stadium, 1, 'Dá bônus de mando nos jogos em casa')}
      ${row('🐾', 'Mascote', n.mascot, 1, 'Dá uma habilidade especial ao time')}
      ${row('👟', 'Jogadores', n.player, 10, '5 titulares e 5 reservas da coleção Jogadores')}
    </div>
    <div class="loan-info">${icon.swipe}<span><b>Faltou carta?</b> Pegue emprestado do baralho: escudo, estádio e mascote com efeito reduzido, e até ${LOAN.maxPlayers} vagas de jogador — <b>sorteado a cada partida</b>, rendendo ${Math.round(LOAN.player * 100)}%.</span></div>
    <button class="btn primary big wide" data-act="create">${icon.sparkle} Criar meu clube</button>
  </section>`);
  node.querySelector('[data-act="create"]').addEventListener('click', () => { sfx.tap(); openIdentity(app, true); });
  return node;
}

// ============================================================
//  CRIAR / EDITAR IDENTIDADE DO CLUBE
// ============================================================
function bonusLabel(card, loan) {
  if (card.kind === 'team') return `moral +${loan ? loanMoral(card) : CREST_MORAL[card.rarity]}`;
  if (card.kind === 'stadium') return `mando +${loan ? loanMando(card) : card.mando}`;
  if (card.kind === 'mascot') return `${ABILITIES[card.ability].label} +${loan ? loanPower(card) : card.power}`;
  return '';
}

function openIdentity(app, creating) {
  const c = state.club || {};
  const firstOf = (mine, kind) => mine.sort(byRarity)[0]?.uid ?? null;
  const sel = {
    crest: c.crest !== undefined ? c.crest : firstOf(myCrests()),
    stadium: c.stadium !== undefined ? c.stadium : firstOf(myStadiums()),
    mascot: c.mascot !== undefined ? c.mascot : firstOf(myMascots()),
  };
  const tile = (card, key, loan) => `
    <button class="pk-card ${sel[key] === card.uid ? 'on' : ''} ${loan ? 'is-loan' : ''}" data-uid="${card.uid}">
      ${cardHTML(card, { size: 'sm' })}
      ${loan ? '<span class="pk-loan">EMPRÉSTIMO</span>' : ''}
      <small>${esc(bonusLabel(card, loan))}</small>
    </button>`;
  const picker = (key, label, kind, mine, noneLabel, noneDesc) => {
    const others = loanable(kind).sort(byRarity);
    return `
    <div class="pk">
      <div class="pk-h"><b>${label}</b><span>${mine.length} sua(s)</span></div>
      <div class="pk-row" data-key="${key}">
        <button class="pk-none ${sel[key] == null ? 'on' : ''}" data-uid=""><span>${noneLabel}</span><small>${noneDesc}</small></button>
        ${mine.sort(byRarity).map(card => tile(card, key, false)).join('')}
      </div>
      <details class="pk-loans" ${sel[key] && !isOwned(sel[key]) ? 'open' : ''}>
        <summary>${icon.swipe} Emprestar do baralho <small>(${others.length} cartas · efeito reduzido)</small></summary>
        <div class="pk-row" data-key="${key}">${others.map(card => tile(card, key, true)).join('')}</div>
      </details>
    </div>`;
  };
  const ov = overlay(`
    <button class="icon-btn ov-x" aria-label="Fechar">${icon.close}</button>
    <div class="ident">
      <h2>${creating ? 'Crie seu clube' : 'Identidade do clube'}</h2>
      <label class="fld"><span>Nome do clube</span><input name="name" maxlength="22" value="${esc(c.name || 'Versatte FC')}"></label>
      <label class="fld small"><span>Sigla</span><input name="abbr" maxlength="3" value="${esc(c.abbr || 'VFC')}"></label>
      ${picker('crest', 'Escudo', 'team', myCrests(), 'Escudo Versatte', 'padrão · moral +0')}
      ${picker('stadium', 'Estádio', 'stadium', myStadiums(), 'Estádio Municipal', 'mando +1')}
      ${picker('mascot', 'Mascote', 'mascot', myMascots(), 'Sem mascote', 'sem habilidade')}
      <button class="btn primary big wide" data-save>${creating ? 'Fundar clube' : 'Salvar'}</button>
    </div>`, 'detail-ov ident-ov');
  const node = ov.node;
  node.querySelector('.ov-x').addEventListener('click', () => { sfx.tap(); ov.close(); });
  node.querySelectorAll('.pk').forEach(pk => pk.addEventListener('click', e => {
    const b = e.target.closest('.pk-row > button'); if (!b) return;
    const key = b.closest('.pk-row').dataset.key;
    sfx.tap(); sel[key] = b.dataset.uid || null;
    pk.querySelectorAll('.pk-row > button').forEach(x => x.classList.toggle('on', x === b));
    if (key === 'crest' && creating && sel.crest) node.querySelector('[name=abbr]').value = CARD_BY_UID[sel.crest].teamData.abbr;
  }));
  node.querySelector('[data-save]').addEventListener('click', () => {
    const name = node.querySelector('[name=name]').value.trim() || 'Versatte FC';
    const abbr = (node.querySelector('[name=abbr]').value.trim() || name.slice(0, 3)).toUpperCase().slice(0, 3);
    if (creating) {
      const { slots, bench } = lineup('1-2-1');
      state.club = { name, abbr, ...sel, formation: '1-2-1', slots, bench, createdAt: Date.now() };
    } else {
      Object.assign(state.club, { name, abbr, ...sel });
    }
    save(); ov.close();
    if (creating) {
      sfx.win(); confetti(['#FF8A1F', '#FFC940', '#33B5FF', '#fff']);
      const loans = loanCount(state.club);
      toast(`${esc(name)} fundado!${loans ? ` ${loans} vaga(s) de empréstimo: jogadores sorteados a cada partida.` : ''}`, { tone: 'ok', ms: 3400 });
    }
    app.refresh();
  });
}

// ============================================================
//  ESCALAÇÃO
// ============================================================
/** Escalação do clube. Também usada antes de desafiar/aceitar uma partida online (app = null, onClose avisa). */
export function openLineup(app, onClose = null) {
  const ov = overlay(`<button class="icon-btn ov-x" aria-label="Fechar">${icon.close}</button><div class="lu"></div>`, 'detail-ov lu-ov');
  const root = ov.node.querySelector('.lu');
  const close = () => { ov.close(); app?.refresh(); onClose?.(); };
  ov.node.querySelector('.ov-x').addEventListener('click', () => { sfx.tap(); close(); });

  function render() {
    const club = state.club;
    const lines = FORMATIONS[club.formation].slots;
    const R = teamRatings(team(club), { home: true });
    const token = (uid, line, idx, benchSlot = false) => {
      if (isLoanSlot(uid)) {
        const v = expectedLoan(benchSlot ? null : line, isOwned)[benchSlot ? 'MEI' : line];
        return `
        <button class="tk loan-slot" data-slot="${benchSlot ? 'b' : 's'}${idx}">
          <span class="tk-loan">EMP</span>
          <span class="tk-v">🎲<small>~${v}</small></span>
          <span class="tk-n">Sorteio</span>
          <span class="tk-p">${benchSlot ? 'qualquer' : line}</span>
        </button>`;
      }
      const card = uid ? CARD_BY_UID[uid] : null;
      const loan = !!card && !isOwned(uid);
      const v = card ? (benchSlot ? effOvr(card, loan) : effAttrs(card, loan)[line]) : (line === 'GOL' ? 42 : 50);
      const off = card && !benchSlot && !naturalFor(card, line);
      return `
        <button class="tk ${card ? `r-${card.rarity}` : 'empty'} ${off ? 'off' : ''} ${loan ? 'loan' : ''}" data-slot="${benchSlot ? 'b' : 's'}${idx}" style="${card ? `--rc:${RARITIES[card.rarity].color};--c1:${card.teamData.colors[0]}` : ''}">
          ${loan ? '<span class="tk-loan">EMP</span>' : ''}
          <span class="tk-v">${v}</span>
          <span class="tk-n">${card ? esc(card.name) : 'Base'}</span>
          <span class="tk-p">${card ? card.pos : (benchSlot ? '—' : line)}${off ? ' ⚠' : ''}</span>
        </button>`;
    };
    const rows = ['ATA', 'MEI', 'DEF', 'GOL'].map(l => lines.map((x, i) => [x, i]).filter(([x]) => x === l));
    const loans = loanCount(club);
    root.innerHTML = `
      <h2>Escalação</h2>
      <div class="lu-forms">${Object.entries(FORMATIONS).map(([k, f]) => `<button class="chip ${club.formation === k ? 'on' : ''}" data-form="${k}">${k}<small>${f.label}</small></button>`).join('')}</div>
      <div class="lu-pitch">
        ${rows.map(r => `<div class="lu-row">${r.map(([l, i]) => token(club.slots[i], l, i)).join('')}</div>`).join('')}
      </div>
      <div class="lu-bench-h"><b>Reservas</b><span>Você faz as trocas durante a partida (no online, no intervalo)</span></div>
      <div class="lu-bench">${club.bench.map((u, i) => token(u, u ? POSITIONS[CARD_BY_UID[u].pos].line : 'MEI', i, true)).join('')}</div>
      <div class="lu-loans ${loans ? 'on' : ''}">🎲<span>Vagas de empréstimo: <b>${loans}/${LOAN.maxPlayers}</b> · um jogador do baralho é sorteado para cada vaga a cada partida e rende ${Math.round(LOAN.player * 100)}%</span></div>
      <div class="lu-ovr"><div class="ovr-big"><b>${R.OVR}</b><span>OVR</span></div>${ratingBars(R)}</div>
      <div class="lu-actions">
        <button class="btn ghost" data-auto>${icon.sparkle} Escalar melhores</button>
        <button class="btn primary" data-done>Pronto</button>
      </div>
      <p class="fine">⚠ = fora de posição (rende menos) · 🎲 = vaga de empréstimo (valor médio do sorteio). ${isDesk() ? 'Clique' : 'Toque'} numa vaga para trocar.</p>`;
  }
  render();

  root.addEventListener('click', e => {
    const club = state.club;
    const f = e.target.closest('[data-form]');
    if (f) { club.formation = f.dataset.form; sfx.tap(); save(); render(); return; }
    if (e.target.closest('[data-auto]')) {
      const { slots, bench } = lineup(club.formation);
      club.slots = slots; club.bench = bench; save(); sfx.coin(); render(); return;
    }
    if (e.target.closest('[data-done]')) { sfx.tap(); close(); return; }
    const t = e.target.closest('[data-slot]');
    if (t) { sfx.tap(); pickPlayer(t.dataset.slot, render); }
  });
}

function pickPlayer(slotKey, onDone) {
  const club = state.club;
  const isBench = slotKey[0] === 'b';
  const idx = +slotKey.slice(1);
  const line = isBench ? null : FORMATIONS[club.formation].slots[idx];
  const current = isBench ? club.bench[idx] : club.slots[idx];
  const where = uid => (club.slots.includes(uid) ? 'titular' : club.bench.includes(uid) ? 'reserva' : '');
  const val = c => (line ? c.attrs[line] : c.ovr);
  const mine = myPlayers().sort((a, b) => val(b) - val(a));
  const loans = loanCount(club);
  const canLoan = isLoanSlot(current) || loans < LOAN.maxPlayers;
  const exp = expectedLoan(line, isOwned)[line || 'MEI'];
  const s = sheet(`
    <h2>${isBench ? `Reserva ${idx + 1}` : `Vaga: ${LINE_LABEL[line]}`}</h2>
    <p class="muted" style="margin:4px 0 10px">${line ? `Nota = atributo ${line} do jogador nessa vaga.` : 'Reservas entram no segundo tempo.'}</p>
    <div class="pp-list">
      <button class="pp loan-pick ${isLoanSlot(current) ? 'on' : ''}" data-uid="${LOAN_SLOT}" ${canLoan ? '' : 'disabled'}>
        <span class="pp-v">🎲</span>
        <span class="pp-n"><b>Vaga de empréstimo</b><small>${canLoan ? `Um jogador do baralho${line ? ` (${LINE_LABEL[line].toLowerCase()})` : ''} é sorteado a cada partida · rende ${Math.round(LOAN.player * 100)}% · média ~${exp}` : `Limite de ${LOAN.maxPlayers} vagas de empréstimo atingido`}</small></span>
        <span class="pp-w loan">${loans}/${LOAN.maxPlayers}</span>
      </button>
      <button class="pp ${current == null ? 'on' : ''}" data-uid=""><span class="pp-v">${line === 'GOL' ? 42 : 50}</span><span class="pp-n"><b>Jogador da base</b><small>vaga sem carta</small></span></button>
      ${mine.length ? `<div class="pp-sec">Suas cartas</div>${mine.map(c => {
        const nat = !line || naturalFor(c, line);
        const w = where(c.uid);
        return `<button class="pp ${c.uid === current ? 'on' : ''}" data-uid="${c.uid}" style="--rc:${RARITIES[c.rarity].color}">
          <span class="pp-v ${nat ? '' : 'off'}">${val(c)}</span>
          <span class="pp-n"><b>${gem(c.rarity)} ${esc(c.name)}</b><small>${POSITIONS[c.pos].label} · ${esc(c.teamData.abbr)} · OVR ${c.ovr}${c.edition !== 'Elenco 2026' ? ` · ${esc(c.edition)}` : ''}</small></span>
          ${w ? `<span class="pp-w">${w}</span>` : ''}${nat ? '' : '<span class="pp-w off">fora de posição</span>'}
        </button>`;
      }).join('')}` : '<p class="fine">Você ainda não tem cartas de jogador — abra pacotes ou use vagas de empréstimo.</p>'}
    </div>`);
  s.node.querySelector('.pp-list').addEventListener('click', e => {
    const b = e.target.closest('button.pp'); if (!b || b.disabled) return;
    const uid = b.dataset.uid || null;
    if (uid && !isLoanSlot(uid)) {
      const card = CARD_BY_UID[uid];
      // a mesma pessoa não pode estar duas vezes no elenco (ex.: Pelé lenda + Pelé Prime)
      const twin = [...club.slots, ...club.bench].find(u => u && !isLoanSlot(u) && u !== uid && u !== current && CARD_BY_UID[u].person === card.person);
      if (twin) { toast(`${esc(card.name)} já está no elenco em outra versão`); return; }
      // se o jogador já está em outra vaga, troca de lugar
      const si = club.slots.indexOf(uid), bi = club.bench.indexOf(uid);
      if (si >= 0) club.slots[si] = current;
      if (bi >= 0) club.bench[bi] = current;
    }
    if (isBench) club.bench[idx] = uid; else club.slots[idx] = uid;
    save(); sfx.tap(); s.close(); onDone();
  });
}

// ============================================================
//  PARTIDAS
// ============================================================

/**
 * Sorteio dos jogadores emprestados para uma partida.
 * Fica salvo por partida (tag): sair e voltar não sorteia de novo.
 */
async function loanDraw(tag) {
  const club = state.club;
  const keys = [...club.slots.map((u, i) => isLoanSlot(u) && 's' + i), ...club.bench.map((u, i) => isLoanSlot(u) && 'b' + i)].filter(Boolean);
  if (!keys.length) return null;
  const saved = state.loanDraw;
  const valid = saved && saved.tag === tag && keys.every(k => saved.draws[k] && !isOwned(saved.draws[k]));
  const draws = valid ? saved.draws : drawLoans(club, isOwned);
  if (!valid) { state.loanDraw = { tag, draws }; save(); }
  await revealLoans(keys, draws, valid);
  return draws;
}

function revealLoans(keys, draws, already) {
  return new Promise(resolve => {
    const lines = FORMATIONS[state.club.formation].slots;
    const label = k => (k[0] === 's' ? `Vaga: ${LINE_LABEL[lines[+k.slice(1)]]}` : `Reserva ${+k.slice(1) + 1}`);
    const ov = overlay(`
      <div class="ld">
        <div class="ld-h"><span>🎲</span><h2>Sorteio do empréstimo</h2><p>${already ? 'Estes são os emprestados desta partida.' : 'Jogadores do baralho para as suas vagas de empréstimo. Toque para revelar.'}</p></div>
        <div class="ld-grid n${keys.length}">
          ${keys.map((k, i) => {
            const c = CARD_BY_UID[draws[k]];
            return c ? `
            <div class="ld-item" style="--i:${i}">
              <span class="ld-slot">${label(k)}</span>
              ${cardHTML(c, { size: 'sm', flipped: !already, live: true })}
              <span class="ld-ovr">OVR ${c.ovr} → <b>${effOvr(c, true)}</b></span>
            </div>` : '';
          }).join('')}
        </div>
        <p class="fine">Emprestados rendem ${Math.round(LOAN.player * 100)}%. Na próxima partida, novo sorteio.</p>
        <button class="btn primary big wide" data-ok ${already ? '' : 'disabled'}>${already ? 'Continuar' : 'Revelando…'}</button>
      </div>`, 'loan-ov');
    const cards = [...ov.node.querySelectorAll('.ld-item .card')];
    const btn = ov.node.querySelector('[data-ok]');
    let i = 0;
    const flipNext = () => {
      const c = cards[i++]; if (!c) { btn.disabled = false; btn.textContent = 'Continuar'; return; }
      const card = CARD_BY_UID[c.dataset.uid];
      c.classList.remove('flipped');
      sfx.flip();
      setTimeout(() => {
        sfx.reveal(card.rarity);
        const r = c.getBoundingClientRect();
        const ord = RARITIES[card.rarity].order;
        burst(r.left + r.width / 2, r.top + r.height / 2, { colors: ['#fff', RARITIES[card.rarity].color], count: [16, 30, 60, 110][ord], speed: [4, 6, 8, 11][ord], shape: ord >= 2 ? 'star' : 'spark' });
        if (ord >= 2) haptic([30, 40, 60]);
        c.closest('.ld-item').classList.add('shown');
        setTimeout(flipNext, ord >= 2 ? 700 : 420);
      }, 320);
    };
    if (!already) setTimeout(flipNext, 600);
    ov.node.addEventListener('click', e => {
      if (e.target.closest('[data-ok]') && !btn.disabled) { sfx.tap(); ov.close(); resolve(); }
    });
  });
}

async function preMatch(home, away, userSide, title) {
  return new Promise(resolve => {
    const p = predict(home, away, 200);
    const [win, loss] = userSide === 0 ? [p.win, p.loss] : [p.loss, p.win];
    const side = t => {
      const r = teamRatings(t, { home: t === home, opp: t === home ? away : home });
      return `
        <div class="pm-side">
          <div class="pm-crest">${crestMini(t)}</div>
          <b>${esc(t.name)}</b>
          <span class="pm-ovr">${r.OVR}</span>
          <small>${t === home ? `Mandante · ${esc(t.stadiumName)}` : 'Visitante'}</small>
          ${t.mascot ? `<small class="pm-masc">${t.mascot.emoji} ${esc(abilityText(t.mascot).label)} +${t.mascot.power}</small>` : ''}
          ${t.loans && t.loans.players ? `<small class="pm-loan">🎲 ${t.loans.players} sorteado(s)</small>` : ''}
        </div>`;
    };
    const ov = overlay(`
      <div class="pm">
        <div class="pm-title">${esc(title)}</div>
        <div class="pm-vs">${side(home)}<div class="pm-x">VS</div>${side(away)}</div>
        ${probBar(win, p.draw, loss, true)}
        <div class="pm-mode">
          <span>Assistir como</span>
          <div class="seg">
            <button data-mode="botao" class="${(state.settings.matchView || 'botao') === 'botao' ? 'on' : ''}">⚽ Jogo de botão</button>
            <button data-mode="texto" class="${state.settings.matchView === 'texto' ? 'on' : ''}">📊 Modo Simulação</button>
          </div>
        </div>
        <button class="btn primary big wide" data-go>${icon.play} Bola rolando!</button>
        <button class="link-btn" data-back>Voltar</button>
      </div>`, 'prematch-ov');
    sfx.whoosh();
    ov.node.querySelector('.pm-mode').addEventListener('click', e => {
      const b = e.target.closest('[data-mode]'); if (!b) return;
      state.settings.matchView = b.dataset.mode; save(); sfx.tap();
      ov.node.querySelectorAll('[data-mode]').forEach(x => x.classList.toggle('on', x === b));
    });
    ov.node.querySelector('[data-go]').addEventListener('click', () => { sfx.tap(); ov.close(); resolve(state.settings.matchView || 'botao'); });
    ov.node.querySelector('[data-back]').addEventListener('click', () => { sfx.tap(); ov.close(); resolve(false); });
  });
}

function rewardHtml(reward, extra = '') {
  return `
    <div class="mr-rew">
      <div class="rw-lines">${reward.lines.map(([label, v], i) => `<div class="rwl" style="--i:${i}"><span>${esc(label)}</span><b>+${v}</b></div>`).join('')}</div>
      <div class="rw">${icon.coin}<b data-count="${reward.coins}">+0</b><span>moedas</span></div>
      ${reward.pack ? `<div class="rw pack">${icon.pack}<b>+1</b><span>pacote ${PACK_STYLE[reward.pack].short.toLowerCase()}</span></div>` : ''}
      ${extra}
    </div>`;
}

/** Depois de fechar a partida: as moedas "voam" até o contador do topo. */
function flyCoins(amount) {
  setTimeout(() => coinFly(innerWidth / 2, innerHeight * 0.45, amount, { total: state.coins }), 350);
}

/** Placar em que o usuário perde por W.O. (3 x 0). */
const woScore = userSide => (userSide === 0 ? [0, 3] : [3, 0]);

/** Soma a partida às estatísticas do clube. */
function addGameStats(gf, ga, outcome) {
  const g = state.game;
  const streak = outcome === 'win' ? g.streak + 1 : 0;
  Object.assign(g, { played: g.played + 1, gf: g.gf + gf, ga: g.ga + ga, streak, best: Math.max(g.best, streak) });
  g[{ win: 'won', draw: 'drawn', loss: 'lost' }[outcome]]++;
  return streak;
}

/**
 * Partida que começou e não terminou (app fechado no meio do jogo): vale como W.O.
 * Sem isso, bastaria fechar o app ao tomar um gol para jogar de novo.
 */
export function settlePendingMatch() {
  const p = state.pendingMatch;
  if (!p) return null;
  state.pendingMatch = null;
  const comp = state.comp;
  if (p.kind === 'comp' && comp && comp.edition === p.edition && comp.seed === p.seed && comp.played === p.played && !comp.done && !comp.userOut) {
    const m = nextUserMatch(comp);
    if (m) recordUserMatch(comp, m, p.userSide, woScore(p.userSide), null);
  }
  addGameStats(0, 3, 'loss');
  save();
  return p;
}

async function playCompRound(app) {
  const comp = state.comp;
  const m = comp && nextUserMatch(comp);
  if (!m) return;
  const def = COMPETITIONS[comp.type];
  const draws = await loanDraw(`C${comp.type}${comp.edition}-${comp.played}-${comp.seed}`);
  const me = team(state.club, draws);
  const opp = aiTeam(m.opponent, compLevel(comp));
  const home = m.userHome ? me : opp, away = m.userHome ? opp : me;
  const userSide = m.userHome ? 0 : 1;
  const mode = await preMatch(home, away, userSide, m.title);
  if (!mode) return;
  state.loanDraw = null;          // sorteio usado: a próxima partida sorteia de novo
  const forceTie = !!state.forcePens;
  state.forcePens = false;
  // a partida começou: se o app fechar antes do apito final, vale W.O.
  state.pendingMatch = { kind: 'comp', edition: comp.edition, seed: comp.seed, played: comp.played, userSide };
  save();

  const src = offlineSource(home, away, userSide, {
    seed: (comp.seed + comp.played * 7919 + state.game.played * 104729) >>> 0, knockout: !!m.knockout, forceTie,
  });
  let reward = null, res = null, statusLine = '';
  const onFinish = async ({ result, shootout }) => {
    state.pendingMatch = null;
    const wo = result.forfeit != null;
    const gf = result.score[userSide], ga = result.score[1 - userSide];
    const outcome = gf > ga ? 'win' : gf === ga ? 'draw' : 'loss';
    const streak = addGameStats(gf, ga, outcome);
    res = recordUserMatch(comp, m, userSide, result.score, wo ? null : shootout);
    if (wo) reward = { coins: 0, lines: [['Desistência', 0]], pack: null };
    else {
      reward = matchReward(gf, ga, outcome, streak);
      if (shootout && shootout.winner === userSide) { reward.lines.push(['Vitória nos pênaltis', COINS.draw]); reward.coins += COINS.draw; }
    }
    save();
    // moedas: offline vão direto; online o servidor credita (com limites anti-trapaça)
    if (reward.coins || reward.pack) {
      const got = await rewardE(reward.coins, reward.pack, 'partida');
      if (got.limited) { reward.lines.push(['Limite diário de recompensas', got.coins - reward.coins]); reward.coins = got.coins; reward.pack = got.pack; }
    }
    const after = comp.done || comp.userOut ? '' : nextUserMatch(comp)?.stage;
    statusLine = res.champion ? `<div class="rw-pos big">🏆 <b>Campeão da ${esc(def.name)}!</b></div>`
      : res.eliminated ? `<div class="rw-pos out">Fim da campanha · <b>${esc(compReward(comp).label)}</b></div>`
      : res.advanced ? `<div class="rw-pos up">Classificado! Próxima fase: <b>${esc(after || '')}</b></div>`
      : comp.type === 'liga' ? `<div class="rw-pos">${esc(def.name)}: <b>${standings(comp.league).findIndex(r => r.id === 'user') + 1}º lugar</b></div>`
      : `<div class="rw-pos">${esc(compStatus(comp))}</div>`;
  };
  const resultTitle = o => {
    if (res?.champion) return 'CAMPEÃO!';
    if (m.knockout) return o === 'win' ? (src.final?.shootout ? 'CLASSIFICADO NOS PÊNALTIS!' : 'CLASSIFICADO!') : 'ELIMINADO';
    return null;
  };

  await (mode === 'texto' ? playTextMatch : playMatch)({
    src, resultTitle, onFinish,
    context: { title: m.title, subtitle: `${comp.edition}ª edição` },
    onResultHtml: () => (reward ? rewardHtml(reward, statusLine) : ''),
  });
  app.refresh();
  if (reward?.coins) flyCoins(reward.coins);
  if (comp.done || comp.userOut) { await new Promise(r => setTimeout(r, 1300)); await compEnd(comp); app.refresh(); }
}

async function playFriendly(app) {
  const level = compLevelOf(state.comp);
  const ids = Object.keys(TEAM_BY_ID);
  const opp = aiTeam(ids[Math.floor(Math.random() * ids.length)], level);
  const draws = await loanDraw('F');
  const me = team(state.club, draws);
  const userHome = Math.random() < 0.5;
  const home = userHome ? me : opp, away = userHome ? opp : me;
  const userSide = userHome ? 0 : 1;
  const mode = await preMatch(home, away, userSide, 'Amistoso');
  if (!mode) return;
  state.loanDraw = null;
  state.pendingMatch = { kind: 'friendly', userSide };
  save();
  const src = offlineSource(home, away, userSide, { seed: (Date.now() & 0xffffff) >>> 0 });
  let reward = null;
  const onFinish = async ({ result }) => {
    state.pendingMatch = null;
    save();
    if (result.forfeit != null) { reward = { coins: 0, lines: [['Desistência', 0]], pack: null }; return; }
    const gf = result.score[userSide], ga = result.score[1 - userSide];
    const outcome = gf > ga ? 'win' : gf === ga ? 'draw' : 'loss';
    const full = matchReward(gf, ga, outcome, 0);
    const coins = Math.round(full.coins * COINS.friendly);
    reward = { coins, lines: [...full.lines, ['Amistoso (metade)', coins - full.coins]], pack: null };
    const got = await rewardE(coins, null, 'amistoso');
    if (got.limited) { reward.lines.push(['Limite de recompensas', got.coins - coins]); reward.coins = got.coins; }
  };
  await (mode === 'texto' ? playTextMatch : playMatch)({
    src, onFinish, context: { title: 'Amistoso', subtitle: 'Modo Clube' }, onResultHtml: () => (reward ? rewardHtml(reward) : ''),
  });
  app.refresh();
  if (reward?.coins) flyCoins(reward.coins);
}

/** Fim do campeonato: troféu 3D para o campeão, resumo para quem caiu. */
async function compEnd(comp) {
  if (comp.rewarded) return;
  comp.rewarded = true;
  const def = COMPETITIONS[comp.type];
  const champ = comp.champion === 'user';
  const r = compReward(comp);
  if (champ) { state.trophies[comp.type] = (state.trophies[comp.type] || 0) + 1; state.game.titles++; }
  state.game.seasons++;
  save();
  const got = await rewardE(r.coins, r.pack, 'campeonato');
  r.coins = got.coins; r.pack = got.pack;
  return new Promise(resolve => {
    const ov = overlay(`
      <div class="se ${champ ? 'champ' : ''}" style="--tc:${def.color}">
        <div class="se-rays"></div>
        <div class="se-3d" data-trophy="${comp.type}" data-locked="${champ ? 0 : 1}" data-intro="1" data-spin="1.1"></div>
        <span class="se-comp">${esc(def.name)} · ${comp.edition}ª edição</span>
        <h1>${champ ? 'CAMPEÃO!' : esc(r.label.toUpperCase())}</h1>
        <p>${champ ? `${esc(state.club.name)} conquistou a <b>${esc(def.trophy)}</b>!` : `Campeão: ${esc(teamLabel(comp.champion))}. Volte mais forte na próxima edição!`}</p>
        <div class="mr-rew">
          <div class="rw">${icon.coin}<b>+${r.coins}</b><span>moedas</span></div>
          ${r.pack ? `<div class="rw pack">${icon.pack}<b>+1</b><span>pacote ${PACK_STYLE[r.pack].short.toLowerCase()}</span></div>` : ''}
        </div>
        <button class="btn primary big wide" data-ok>${champ ? 'Levar para a sala de troféus' : 'Continuar'}</button>
      </div>`, 'season-ov');
    const stop = mountTrophies(ov.node);
    if (champ) {
      sfx.champion(); haptic([80, 60, 160, 60, 240]);
      setTimeout(() => {
        confetti(['#FFC940', '#FF8A1F', '#fff', def.color]);
        const t = ov.node.querySelector('.se-3d').getBoundingClientRect();
        burst(t.left + t.width / 2, t.top + t.height / 2, { colors: ['#FFC940', '#fff', def.color], count: 200, speed: 14, shape: 'star', size: 3.4 });
      }, 900);
      setTimeout(() => confetti(['#FFC940', '#FF8A1F', '#fff']), 2000);
    } else sfx.whistle(2);
    ov.node.querySelector('[data-ok]').addEventListener('click', () => { sfx.tap(); stop(); ov.close(); flyCoins(r.coins); resolve(); });
  });
}

// ------------------------------------------------------------
//  Debug
// ------------------------------------------------------------
export function giveStarterKit(addCard) {
  const pick = (f, n) => ALL_CARDS.filter(f).slice(0, n).forEach(c => { if (!ownedCount(c.uid)) addCard(c.uid); });
  pick(c => c.uid === 'clube-fla', 1);
  pick(c => c.uid === 'estadio-maracana' || c.uid === 'estadio-barradao', 2);
  pick(c => c.uid === 'masc-fla' || c.uid === 'masc-cam-neon', 2);
  // 10 jogadores comuns cobrindo todas as posições + 2 ídolos
  const need = { GOL: 1, ZAG: 2, LAT: 1, VOL: 2, MEI: 2, ATA: 2 };
  ALL_CARDS.filter(c => c.kind === 'player' && c.rarity === 'comum').forEach(c => {
    if (need[c.pos] > 0) { need[c.pos]--; if (!ownedCount(c.uid)) addCard(c.uid); }
  });
  pick(c => c.kind === 'player' && c.rarity === 'rara', 2);
}

/** Cria um clube automaticamente com as melhores cartas do jogador (e empréstimos se faltar). */
export function quickCreateClub() {
  const best = list => list.sort(byRarity)[0]?.uid ?? null;
  const crest = best(myCrests());
  const { slots, bench } = lineup('1-2-1');
  const t = crest ? CARD_BY_UID[crest].teamData : null;
  state.club = { name: t ? `${t.name} Versatte` : 'Versatte FC', abbr: t ? t.abbr : 'VFC', crest, stadium: best(myStadiums()), mascot: best(myMascots()),
    formation: '1-2-1', slots, bench, createdAt: Date.now() };
  save();
}

/** Joga instantaneamente o campeonato até a última partida (final / última rodada) — debug. */
export function simulateUntilLastRound() {
  const comp = state.comp; if (!comp) return 0;
  let n = 0;
  const isLast = m => m.final || (comp.type === 'liga' && comp.league.round === comp.league.rounds.length - 1);
  for (let guard = 0; guard < 12; guard++) {
    const m = nextUserMatch(comp);
    if (!m || isLast(m)) break;
    const me = team(state.club, drawLoans(state.club, isOwned)), opp = aiTeam(m.opponent, compLevel(comp));
    const [home, away] = m.userHome ? [me, opp] : [opp, me];
    const side = m.userHome ? 0 : 1;
    // no debug o usuário sempre passa de fase, para chegar à decisão
    let { score } = simulateMatch(home, away, { seed: comp.seed + guard * 31 });
    if (score[side] <= score[1 - side]) score = side === 0 ? [score[1] + 1, score[1]] : [score[0], score[0] + 1];
    recordUserMatch(comp, m, side, score, null);
    const g = state.game, gf = score[side], ga = score[1 - side];
    g.played++; g.won++; g.gf += gf; g.ga += ga; g.streak++; g.best = Math.max(g.best, g.streak);
    n++;
  }
  save();
  return n;
}
