// ============================================================
//  MODO CLUBE — telas (criar clube, escalação, liga, partidas)
//  Cartas que o jogador não tem podem ser EMPRESTADAS do baralho,
//  sempre com desempenho reduzido (regras em LOAN, js/data.js).
// ============================================================
import { ALL_CARDS, CARD_BY_UID, TEAM_BY_ID, POSITIONS, RARITIES, CREST_MORAL, ABILITIES, LOAN, COINS, PACK_STYLE } from '../data.js';
import { state, save, ownedCount, addPacks } from '../state.js';
import { cardHTML, gem, abilityText } from '../cards.js';
import {
  FORMATIONS, LINE_LABEL, autoLineup, userTeam, aiTeam, teamRatings, simulateMatch, predict, naturalFor,
  createLeague, applyResult, standings, simulateOtherGames, userFixture, advanceRound, matchReward,
  effAttrs, effOvr, loanMoral, loanMando, loanPower,
} from './engine.js';
import { playMatch, crestMini } from './match.js';
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
const team = (club = state.club) => userTeam(club, state.league?.season || 1, isOwned);
const lineup = formation => autoLineup(myPlayers().map(p => p.uid), formation, loanable('player').map(p => p.uid));
const loanCount = club => [...club.slots, ...club.bench].filter(u => u && !isOwned(u)).length;

/** Remove do clube cartas inválidas (o empréstimo continua valendo para as que o jogador não tem). */
function sanitizeClub() {
  const c = state.club; if (!c) return;
  const ok = u => (u && CARD_BY_UID[u] ? u : null);
  c.crest = ok(c.crest); c.stadium = ok(c.stadium); c.mascot = ok(c.mascot);
  c.slots = c.slots.map(ok); c.bench = c.bench.map(ok);
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
export function clubView(app) {
  sanitizeClub();
  if (!state.club) return introView(app);
  const club = state.club;
  if (!state.league) { state.league = createLeague(club.crest ? CARD_BY_UID[club.crest].team : null, 1); save(); }
  const lg = state.league;
  const me = team();
  const R = teamRatings(me, { home: true });
  const fx = userFixture(lg);
  const table = standings(lg);
  const myPos = table.findIndex(r => r.id === 'user') + 1;
  const g = state.game;
  const stadium = club.stadium ? CARD_BY_UID[club.stadium] : null;
  const mascot = me.mascot;
  const empty = club.slots.filter(u => !u).length;
  const L = me.loans;
  const loanItems = [L.crest && 'escudo', L.stadium && 'estádio', L.mascot && 'mascote', L.players && `${L.players} jogador(es)`].filter(Boolean);

  let next = '';
  if (fx) {
    const opp = aiTeam(fx.opponent, lg.season);
    const home = fx.userHome ? me : opp, away = fx.userHome ? opp : me;
    const p = predict(home, away, 160);
    const [win, loss] = fx.userHome ? [p.win, p.loss] : [p.loss, p.win];
    next = `
      <div class="nx">
        <div class="nx-h"><span>Rodada ${lg.round + 1} de ${lg.rounds.length}</span><span>${fx.userHome ? 'Em casa' : 'Fora de casa'} · ${esc(home.stadiumName)}</span></div>
        <div class="nx-vs">
          <div>${crestMini(me)}<b>${esc(club.name)}</b><small>OVR ${R.OVR}</small></div>
          <strong>VS</strong>
          <div>${crestMini(opp)}<b>${esc(opp.name)}</b><small>OVR ${teamRatings(opp).OVR}</small></div>
        </div>
        ${probBar(win, p.draw, loss)}
        <div class="nx-actions">
          <button class="btn ghost" data-act="lineup">${icon.album} Escalação</button>
          <button class="btn primary big" data-act="play">${icon.play} Jogar</button>
        </div>
      </div>`;
  } else {
    const champ = lg.champion === 'user';
    next = `
      <div class="nx done ${champ ? 'champ' : ''}">
        <div class="nx-trophy">${champ ? '🏆' : '🏁'}</div>
        <b>${champ ? 'Você é campeão da temporada!' : `Temporada encerrada · ${myPos}º lugar`}</b>
        <span>Campeão: ${esc(teamLabel(lg.champion))}</span>
        <button class="btn primary big" data-act="season">Começar temporada ${lg.season + 1}</button>
      </div>`;
  }

  const node = el(`
  <section class="view jogar">
    <div class="cl-card" style="--c1:${me.colors[0]};--c2:${me.colors[1] || '#fff'}">
      <div class="cl-crest">${crestMini(me)}</div>
      <div class="cl-info">
        <span class="cl-season">Liga Versatte · Temporada ${lg.season}</span>
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
    ${loanItems.length ? `<button class="loan-row" data-act="lineup">${icon.swipe}<span><b>Emprestado do baralho:</b> ${loanItems.join(', ')}. Cartas emprestadas rendem menos — conquiste as suas nos pacotes!</span></button>` : ''}
    ${empty ? `<button class="warn-row" data-act="lineup">${icon.lock}<span>${empty} vaga(s) com jogador da base — escale ou pegue emprestado</span>${icon.arrow}</button>` : ''}

    ${next}

    <div class="section-head"><h3>Classificação</h3><span class="muted">${myPos}º lugar</span></div>
    <div class="tbl">
      <div class="tr th"><span>#</span><span>Clube</span><span>P</span><span>J</span><span>V</span><span>SG</span></div>
      ${table.map((r, i) => `
        <div class="tr ${r.id === 'user' ? 'me' : ''}">
          <span>${i + 1}</span>
          <span class="tc">${r.id === 'user' ? crestMini(me) : crestMini({ crest: CARD_BY_UID[`clube-${r.id}`] })}<b>${esc(teamLabel(r.id))}</b></span>
          <span><b>${r.P}</b></span><span>${r.J}</span><span>${r.V}</span><span>${r.SG > 0 ? '+' : ''}${r.SG}</span>
        </div>`).join('')}
    </div>
    ${lastRoundHtml(lg)}

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
    <button class="coin-hint" data-act="shop">${icon.coin}<span>Vitória <b>+${COINS.win}</b> · empate <b>+${COINS.draw}</b> · gol <b>+${COINS.goal}</b> moedas. Troque por pacotes na Loja.</span>${icon.arrow}</button>
  </section>`);

  node.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    sfx.tap();
    const act = b.dataset.act;
    if (act === 'lineup') openLineup(app);
    if (act === 'edit') openIdentity(app, false);
    if (act === 'play') playLeagueRound(app);
    if (act === 'friendly') playFriendly(app);
    if (act === 'shop') app.go('shop');
    if (act === 'season') {
      state.league = createLeague(club.crest ? CARD_BY_UID[club.crest].team : null, lg.season + 1);
      save(); toast(`Temporada ${lg.season + 1}: os rivais estão mais fortes!`, { tone: 'ok' }); app.refresh();
    }
  });
  return node;
}

function lastRoundHtml(lg) {
  const last = lg.results.filter(r => r.round === lg.round - 1);
  if (!last.length) return '';
  return `
    <div class="last-round">
      <span class="lr-h">Rodada ${lg.round}</span>
      ${last.map(r => `<div class="lr ${r.home === 'user' || r.away === 'user' ? 'me' : ''}"><span>${esc(teamAbbr(r.home))}</span><b>${r.score[0]} x ${r.score[1]}</b><span>${esc(teamAbbr(r.away))}</span></div>`).join('')}
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
    <div class="loan-info">${icon.swipe}<span><b>Faltou carta?</b> Pegue emprestado do baralho: escudo, estádio, mascote e até ${LOAN.maxPlayers} jogadores — sempre com desempenho reduzido (jogadores a ${Math.round(LOAN.player * 100)}%).</span></div>
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
      state.league = createLeague(sel.crest ? CARD_BY_UID[sel.crest].team : null, 1);
    } else {
      Object.assign(state.club, { name, abbr, ...sel });
    }
    save(); ov.close();
    if (creating) {
      sfx.win(); confetti(['#FF8A1F', '#FFC940', '#33B5FF', '#fff']);
      const loans = loanCount(state.club);
      toast(`${esc(name)} fundado!${loans ? ` ${loans} jogador(es) emprestado(s) do baralho.` : ''}`, { tone: 'ok', ms: 3200 });
    }
    app.refresh();
  });
}

// ============================================================
//  ESCALAÇÃO
// ============================================================
function openLineup(app) {
  const ov = overlay(`<button class="icon-btn ov-x" aria-label="Fechar">${icon.close}</button><div class="lu"></div>`, 'detail-ov lu-ov');
  const root = ov.node.querySelector('.lu');
  const close = () => { ov.close(); app.refresh(); };
  ov.node.querySelector('.ov-x').addEventListener('click', () => { sfx.tap(); close(); });

  function render() {
    const club = state.club;
    const lines = FORMATIONS[club.formation].slots;
    const R = teamRatings(team(club), { home: true });
    const token = (uid, line, idx, benchSlot = false) => {
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
      <div class="lu-bench-h"><b>Reservas</b><span>Entram aos 65' se renderem mais que o titular cansado</span></div>
      <div class="lu-bench">${club.bench.map((u, i) => token(u, u ? POSITIONS[CARD_BY_UID[u].pos].line : 'MEI', i, true)).join('')}</div>
      <div class="lu-loans ${loans ? 'on' : ''}">${icon.swipe}<span>Empréstimos: <b>${loans}/${LOAN.maxPlayers}</b> · jogadores emprestados rendem ${Math.round(LOAN.player * 100)}%</span></div>
      <div class="lu-ovr"><div class="ovr-big"><b>${R.OVR}</b><span>OVR</span></div>${ratingBars(R)}</div>
      <div class="lu-actions">
        <button class="btn ghost" data-auto>${icon.sparkle} Escalar melhores</button>
        <button class="btn primary" data-done>Pronto</button>
      </div>
      <p class="fine">⚠ = fora de posição (rende menos) · EMP = emprestado do baralho. Toque numa vaga para trocar.</p>`;
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
  const val = (c, loan) => (line ? effAttrs(c, loan)[line] : effOvr(c, loan));
  const row = (c, loan) => {
    const v = val(c, loan);
    const nat = !line || naturalFor(c, line);
    const w = where(c.uid);
    return `<button class="pp ${c.uid === current ? 'on' : ''} ${loan ? 'loan' : ''}" data-uid="${c.uid}" style="--rc:${RARITIES[c.rarity].color}">
      <span class="pp-v ${nat ? '' : 'off'}">${v}</span>
      <span class="pp-n"><b>${gem(c.rarity)} ${esc(c.name)}</b><small>${POSITIONS[c.pos].label} · ${esc(c.teamData.abbr)} · ${loan ? `OVR ${c.ovr} → ${effOvr(c, true)}` : `OVR ${c.ovr}`}${c.edition !== 'Elenco 2026' ? ` · ${esc(c.edition)}` : ''}</small></span>
      ${w ? `<span class="pp-w">${w}</span>` : ''}${loan ? '<span class="pp-w loan">empréstimo</span>' : ''}${nat ? '' : '<span class="pp-w off">fora de posição</span>'}
    </button>`;
  };
  const mine = myPlayers().sort((a, b) => val(b, false) - val(a, false));
  const others = loanable('player').sort((a, b) => val(b, true) - val(a, true));
  const loans = loanCount(club);
  const s = sheet(`
    <h2>${isBench ? `Reserva ${idx + 1}` : `Vaga: ${LINE_LABEL[line]}`}</h2>
    <p class="muted" style="margin:4px 0 10px">${line ? `Nota = atributo ${line} do jogador nessa vaga.` : 'Reservas entram no segundo tempo.'}</p>
    <div class="pp-list">
      <button class="pp" data-uid=""><span class="pp-v">${line === 'GOL' ? 42 : 50}</span><span class="pp-n"><b>Jogador da base</b><small>vaga sem carta</small></span></button>
      ${mine.length ? `<div class="pp-sec">Suas cartas</div>${mine.map(c => row(c, false)).join('')}` : ''}
      <div class="pp-sec">Emprestar do baralho <small>${loans}/${LOAN.maxPlayers} usados · rendem ${Math.round(LOAN.player * 100)}%</small></div>
      ${others.map(c => row(c, true)).join('')}
    </div>`);
  s.node.querySelector('.pp-list').addEventListener('click', e => {
    const b = e.target.closest('button.pp'); if (!b) return;
    const uid = b.dataset.uid || null;
    if (uid) {
      const card = CARD_BY_UID[uid];
      // a mesma pessoa não pode estar duas vezes no elenco (ex.: Pelé lenda + Pelé Prime)
      const twin = [...club.slots, ...club.bench].find(u => u && u !== uid && u !== current && CARD_BY_UID[u].person === card.person);
      if (twin) { toast(`${esc(card.name)} já está no elenco em outra versão`); return; }
      // limite de empréstimos
      const isLoan = !isOwned(uid), inSquad = [...club.slots, ...club.bench].includes(uid);
      const freesOne = current && !isOwned(current);
      if (isLoan && !inSquad && !freesOne && loans >= LOAN.maxPlayers) { toast(`Limite de ${LOAN.maxPlayers} empréstimos atingido`); return; }
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
          ${t.loans && t.loans.players ? `<small class="pm-loan">${t.loans.players} emprestado(s)</small>` : ''}
        </div>`;
    };
    const ov = overlay(`
      <div class="pm">
        <div class="pm-title">${esc(title)}</div>
        <div class="pm-vs">${side(home)}<div class="pm-x">VS</div>${side(away)}</div>
        ${probBar(win, p.draw, loss, true)}
        <button class="btn primary big wide" data-go>${icon.play} Bola rolando!</button>
        <button class="link-btn" data-back>Voltar</button>
      </div>`, 'prematch-ov');
    sfx.whoosh();
    ov.node.querySelector('[data-go]').addEventListener('click', () => { sfx.tap(); ov.close(); resolve(true); });
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

async function playLeagueRound(app) {
  const lg = state.league;
  const fx = userFixture(lg);
  if (!fx) return;
  const me = team();
  const opp = aiTeam(fx.opponent, lg.season);
  const home = fx.userHome ? me : opp, away = fx.userHome ? opp : me;
  const userSide = fx.userHome ? 0 : 1;
  const title = `Liga Versatte · Rodada ${lg.round + 1}/${lg.rounds.length}`;
  if (!(await preMatch(home, away, userSide, title))) return;

  const result = simulateMatch(home, away, { seed: (lg.seed + lg.round * 7919 + state.game.played * 104729) >>> 0 });
  const gf = result.score[userSide], ga = result.score[1 - userSide];
  const outcome = gf > ga ? 'win' : gf === ga ? 'draw' : 'loss';
  const g = state.game;
  const streak = outcome === 'win' ? g.streak + 1 : 0;
  const reward = matchReward(gf, ga, outcome, streak);

  // grava tudo antes da animação (se o app fechar, o resultado vale)
  applyResult(lg, fx.home, fx.away, result.score);
  simulateOtherGames(lg);
  const round = lg.round + 1;
  advanceRound(lg);
  Object.assign(g, { played: g.played + 1, gf: g.gf + gf, ga: g.ga + ga, streak, best: Math.max(g.best, streak) });
  g[{ win: 'won', draw: 'drawn', loss: 'lost' }[outcome]]++;
  state.coins += reward.coins;
  if (reward.pack) addPacks(reward.pack, 1);
  save();
  const pos = standings(lg).findIndex(r => r.id === 'user') + 1;

  await playMatch({
    home, away, result, userSide,
    context: { title, subtitle: `Temporada ${lg.season}` },
    onResultHtml: () => rewardHtml(reward, `<div class="rw-pos">Liga: <b>${pos}º lugar</b> · rodada ${round}/${lg.rounds.length}</div>`),
  });
  app.refresh();
  flyCoins(reward.coins);
  if (lg.done) { await new Promise(r => setTimeout(r, 1400)); await seasonEnd(lg); app.refresh(); }
}

async function playFriendly(app) {
  const season = state.league?.season || 1;
  const ids = Object.keys(TEAM_BY_ID);
  const opp = aiTeam(ids[Math.floor(Math.random() * ids.length)], season);
  const me = team();
  const userHome = Math.random() < 0.5;
  const home = userHome ? me : opp, away = userHome ? opp : me;
  const userSide = userHome ? 0 : 1;
  if (!(await preMatch(home, away, userSide, 'Amistoso'))) return;
  const result = simulateMatch(home, away, { seed: (Date.now() & 0xffffff) >>> 0 });
  const gf = result.score[userSide], ga = result.score[1 - userSide];
  const outcome = gf > ga ? 'win' : gf === ga ? 'draw' : 'loss';
  const full = matchReward(gf, ga, outcome, 0);
  const coins = Math.round(full.coins * COINS.friendly);
  const reward = { coins, lines: [...full.lines, ['Amistoso (metade)', coins - full.coins]], pack: null };
  state.coins += coins; save();
  await playMatch({ home, away, result, userSide, context: { title: 'Amistoso', subtitle: `Temporada ${season}` }, onResultHtml: () => rewardHtml(reward) });
  app.refresh();
  flyCoins(coins);
}

async function seasonEnd(lg) {
  const table = standings(lg);
  const pos = table.findIndex(r => r.id === 'user') + 1;
  const champ = pos === 1;
  const coins = champ ? COINS.title : pos === 2 ? COINS.vice : pos === 3 ? COINS.third : COINS.other;
  const pack = champ ? COINS.titlePack : null;
  if (champ) state.game.titles++;
  state.game.seasons++;
  state.coins += coins; if (pack) addPacks(pack, 1);
  save();
  return new Promise(resolve => {
    const ov = overlay(`
      <div class="se ${champ ? 'champ' : ''}">
        <div class="se-rays"></div>
        <div class="se-trophy">${champ ? '🏆' : ({ 2: '🥈', 3: '🥉' }[pos] || '🏁')}</div>
        <h1>${champ ? 'CAMPEÃO!' : `${pos}º LUGAR`}</h1>
        <p>${champ ? `${esc(state.club.name)} é o campeão da Liga Versatte · Temporada ${lg.season}` : `Temporada ${lg.season} encerrada. Campeão: ${esc(teamLabel(lg.champion))}`}</p>
        <div class="mr-rew">
          <div class="rw">${icon.coin}<b>+${coins}</b><span>moedas</span></div>
          ${pack ? `<div class="rw pack">${icon.pack}<b>+1</b><span>pacote ${PACK_STYLE[pack].short.toLowerCase()}</span></div>` : ''}
        </div>
        <button class="btn primary big wide" data-ok>Continuar</button>
      </div>`, 'season-ov');
    if (champ) {
      sfx.champion(); haptic([80, 60, 160, 60, 240]);
      confetti(['#FFC940', '#FF8A1F', '#fff', '#33B5FF']);
      setTimeout(() => confetti(['#FFC940', '#FF8A1F', '#fff']), 900);
      const r = ov.node.querySelector('.se-trophy').getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, { colors: ['#FFC940', '#fff', '#FF8A1F'], count: 200, speed: 14, shape: 'star', size: 3.4 });
    } else sfx.whistle(2);
    ov.node.querySelector('[data-ok]').addEventListener('click', () => { sfx.tap(); ov.close(); flyCoins(coins); resolve(); });
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
  state.league = createLeague(t ? t.id : null, 1);
  save();
}

/** Joga instantaneamente as rodadas restantes, deixando só a última (debug). */
export function simulateUntilLastRound() {
  const lg = state.league; if (!lg) return 0;
  let n = 0;
  while (!lg.done && lg.round < lg.rounds.length - 1) {
    const fx = userFixture(lg);
    const me = team(), opp = aiTeam(fx.opponent, lg.season);
    const [home, away] = fx.userHome ? [me, opp] : [opp, me];
    const side = fx.userHome ? 0 : 1;
    const { score } = simulateMatch(home, away, { seed: lg.seed + lg.round * 31 });
    applyResult(lg, fx.home, fx.away, score);
    simulateOtherGames(lg);
    advanceRound(lg);
    const g = state.game, gf = score[side], ga = score[1 - side];
    const outcome = gf > ga ? 'won' : gf === ga ? 'drawn' : 'lost';
    g.played++; g[outcome]++; g.gf += gf; g.ga += ga; g.streak = outcome === 'won' ? g.streak + 1 : 0; g.best = Math.max(g.best, g.streak);
    n++;
  }
  save();
  return n;
}
