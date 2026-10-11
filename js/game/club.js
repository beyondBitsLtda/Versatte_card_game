// ============================================================
//  MODO CLUBE — telas (criar clube, escalação, liga, partidas)
// ============================================================
import { ALL_CARDS, CARD_BY_UID, TEAM_BY_ID, POSITIONS, RARITIES, CREST_MORAL, ABILITIES } from '../data.js';
import { state, save, ownedCount } from '../state.js';
import { cardHTML, gem, abilityText } from '../cards.js';
import {
  FORMATIONS, LINE_LABEL, autoLineup, userTeam, aiTeam, teamRatings, simulateMatch, predict, naturalFor,
  createLeague, applyResult, standings, simulateOtherGames, userFixture, advanceRound, matchReward, REWARDS,
} from './engine.js';
import { playMatch, crestMini } from './match.js';
import { confetti, burst, sfx, haptic } from '../fx.js';
import { icon, esc, el, sheet, overlay, toast } from '../ui.js';

// ------------------------------------------------------------
//  Cartas do jogador por tipo
// ------------------------------------------------------------
const owned = c => ownedCount(c.uid) > 0;
export const myCrests = () => ALL_CARDS.filter(c => c.kind === 'team' && owned(c));
export const myStadiums = () => ALL_CARDS.filter(c => c.kind === 'stadium' && owned(c));
export const myMascots = () => ALL_CARDS.filter(c => c.kind === 'mascot' && owned(c));
export const myPlayers = () => ALL_CARDS.filter(c => c.kind === 'player' && owned(c));

const byRarity = (a, b) => RARITIES[b.rarity].order - RARITIES[a.rarity].order;

/** Remove do clube cartas que o jogador não tem mais (ex.: depois de um reset no debug). */
function sanitizeClub() {
  const c = state.club; if (!c) return;
  const has = u => u && CARD_BY_UID[u] && ownedCount(u) > 0;
  if (!has(c.crest)) c.crest = null;
  if (!has(c.stadium)) c.stadium = null;
  if (!has(c.mascot)) c.mascot = null;
  c.slots = c.slots.map(u => (has(u) ? u : null));
  c.bench = c.bench.map(u => (has(u) ? u : null));
}

const fmtPct = v => `${Math.round(v * 100)}%`;
function probBar(win, draw, loss, big = false) {
  const seg = (cls, v, short, long) => v < 0.005 ? '' : `<span class="${cls}" style="flex:${Math.max(v, 0.06)}">${v >= 0.18 ? `${big ? long : short} ` : ''}${fmtPct(v)}</span>`;
  return `<div class="nx-prob ${big ? 'big' : ''}">${seg('w', win, 'V', 'Vitória')}${seg('d', draw, 'E', 'Empate')}${seg('l', loss, 'D', 'Derrota')}</div>`;
}
const teamLabel = id => (id === 'user' ? state.club.name : TEAM_BY_ID[id].name);
const teamAbbr = id => (id === 'user' ? state.club.abbr : TEAM_BY_ID[id].abbr);

function ratingBars(r, compare = null) {
  const rows = [['ATQ', 'Ataque', r.ATQ], ['CRI', 'Criação', r.CRI], ['DEF', 'Defesa', r.DEF], ['GOL', 'Goleiro', r.G]];
  return `<div class="rbars">${rows.map(([k, label, v]) => `
    <div class="rb"><span>${label}</span><div class="bar"><i style="--to:${Math.min(1, v / 100)}"></i></div><b>${Math.min(99, Math.round(v))}</b>${compare ? `<em class="${v >= compare[k === 'GOL' ? 'G' : k] ? 'up' : 'down'}">${Math.round(compare[k === 'GOL' ? 'G' : k])}</em>` : ''}</div>`).join('')}</div>`;
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
  const me = userTeam(club, lg.season);
  const R = teamRatings(me, { home: true });
  const fx = userFixture(lg);
  const table = standings(lg);
  const myPos = table.findIndex(r => r.id === 'user') + 1;
  const g = state.game;
  const crest = club.crest ? CARD_BY_UID[club.crest] : null;
  const stadium = club.stadium ? CARD_BY_UID[club.stadium] : null;
  const mascot = club.mascot ? CARD_BY_UID[club.mascot] : null;
  const empty = club.slots.filter(u => !u).length;

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
          <span>${icon.home} ${esc(stadium ? stadium.name : 'Estádio Municipal')} <b>+${me.mando}</b></span>
          <span>${mascot ? `${mascot.emoji} ${esc(mascot.name)}` : 'Sem mascote'}</span>
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
      <span title="Escudo">${icon.trophy} Moral +${me.moral}</span>
      <span title="Jogadores do mesmo clube do escudo">${icon.sparkle} Química +${me.chem}</span>
      ${mascot ? `<span title="${esc(abilityText(mascot).desc)}">${mascot.emoji} ${esc(abilityText(mascot).label)} +${mascot.power}</span>` : ''}
    </div>
    ${empty ? `<button class="warn-row" data-act="lineup">${icon.lock}<span>${empty} vaga(s) com jogador da base — escale suas cartas</span>${icon.arrow}</button>` : ''}

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
    <p class="fine">Vitória +${REWARDS.win} pts · empate +${REWARDS.draw} · derrota +${REWARDS.loss} · +${REWARDS.perGoal} por gol. Pontos viram pacotes na Loja.</p>
  </section>`);

  node.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    sfx.tap();
    const act = b.dataset.act;
    if (act === 'lineup') openLineup(app);
    if (act === 'edit') openIdentity(app, false);
    if (act === 'play') playLeagueRound(app);
    if (act === 'friendly') playFriendly(app);
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
      <p>Monte seu time com as cartas que você conquistou e dispute a <b>Liga Versatte</b>. Cada vitória rende pontos para abrir mais pacotes.</p>
    </div>
    <div class="reqs">
      ${row('🛡️', 'Escudo', n.crest, 1, 'Uma carta da coleção Clubes vira o escudo e as cores do seu time')}
      ${row('🏟️', 'Estádio', n.stadium, 1, 'Dá bônus de mando nos jogos em casa')}
      ${row('🐾', 'Mascote', n.mascot, 1, 'Dá uma habilidade especial ao time')}
      ${row('👟', 'Jogadores', n.player, 10, '5 titulares e 5 reservas da coleção Jogadores')}
    </div>
    <button class="btn primary big wide" data-act="create">${icon.sparkle} Criar meu clube</button>
    <p class="fine">Faltou carta? Tudo bem: vagas vazias usam jogadores da base (mais fracos), estádio municipal e nenhum mascote. Abra pacotes para reforçar o time.</p>
  </section>`);
  node.querySelector('[data-act="create"]').addEventListener('click', () => { sfx.tap(); openIdentity(app, true); });
  return node;
}

// ============================================================
//  CRIAR / EDITAR IDENTIDADE DO CLUBE
// ============================================================
function openIdentity(app, creating) {
  const c = state.club || {};
  let sel = { crest: c.crest ?? myCrests().sort(byRarity)[0]?.uid ?? null, stadium: c.stadium ?? myStadiums().sort(byRarity)[0]?.uid ?? null, mascot: c.mascot ?? myMascots().sort(byRarity)[0]?.uid ?? null };
  const picker = (key, label, cards, noneLabel, noneDesc) => `
    <div class="pk">
      <div class="pk-h"><b>${label}</b><span>${cards.length} carta(s)</span></div>
      <div class="pk-row" data-key="${key}">
        <button class="pk-none ${sel[key] == null ? 'on' : ''}" data-uid=""><span>${noneLabel}</span><small>${noneDesc}</small></button>
        ${cards.sort(byRarity).map(card => `<button class="pk-card ${sel[key] === card.uid ? 'on' : ''}" data-uid="${card.uid}">${cardHTML(card, { size: 'sm' })}<small>${esc(bonusLabel(card))}</small></button>`).join('')}
      </div>
    </div>`;
  const ov = overlay(`
    <button class="icon-btn ov-x" aria-label="Fechar">${icon.close}</button>
    <div class="ident">
      <h2>${creating ? 'Crie seu clube' : 'Identidade do clube'}</h2>
      <label class="fld"><span>Nome do clube</span><input name="name" maxlength="22" value="${esc(c.name || 'Versatte FC')}"></label>
      <label class="fld small"><span>Sigla</span><input name="abbr" maxlength="3" value="${esc(c.abbr || 'VFC')}"></label>
      ${picker('crest', 'Escudo', myCrests(), 'Escudo Versatte', 'padrão · moral +0')}
      ${picker('stadium', 'Estádio', myStadiums(), 'Estádio Municipal', 'mando +1')}
      ${picker('mascot', 'Mascote', myMascots(), 'Sem mascote', 'sem habilidade')}
      <button class="btn primary big wide" data-save>${creating ? 'Fundar clube' : 'Salvar'}</button>
    </div>`, 'detail-ov ident-ov');
  const node = ov.node;
  node.querySelector('.ov-x').addEventListener('click', () => { sfx.tap(); ov.close(); });
  node.querySelectorAll('.pk-row').forEach(row => row.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    sfx.tap(); sel[row.dataset.key] = b.dataset.uid || null;
    row.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    if (row.dataset.key === 'crest') {
      const card = CARD_BY_UID[sel.crest];
      if (card && creating) node.querySelector('[name=abbr]').value = card.teamData.abbr;
    }
  }));
  node.querySelector('[data-save]').addEventListener('click', () => {
    const name = node.querySelector('[name=name]').value.trim() || 'Versatte FC';
    const abbr = (node.querySelector('[name=abbr]').value.trim() || name.slice(0, 3)).toUpperCase().slice(0, 3);
    if (creating) {
      const { slots, bench } = autoLineup(myPlayers().map(p => p.uid), '1-2-1');
      state.club = { name, abbr, ...sel, formation: '1-2-1', slots, bench, createdAt: Date.now() };
      state.league = createLeague(sel.crest ? CARD_BY_UID[sel.crest].team : null, 1);
    } else {
      Object.assign(state.club, { name, abbr, ...sel });
    }
    save(); ov.close();
    if (creating) { sfx.win(); confetti(['#FF8A1F', '#FFC940', '#33B5FF', '#fff']); toast(`${esc(name)} fundado! Confira a escalação.`, { tone: 'ok' }); }
    app.refresh();
  });
}

function bonusLabel(card) {
  if (card.kind === 'team') return `moral +${CREST_MORAL[card.rarity]}`;
  if (card.kind === 'stadium') return `mando +${card.mando}`;
  if (card.kind === 'mascot') return `${ABILITIES[card.ability].label} +${card.power}`;
  return '';
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
    const me = userTeam(club, state.league?.season || 1);
    const R = teamRatings(me, { home: true });
    const token = (uid, line, idx, benchSlot = false) => {
      const card = uid ? CARD_BY_UID[uid] : null;
      const v = card ? (benchSlot ? card.ovr : card.attrs[line]) : (line === 'GOL' ? 42 : 50);
      const off = card && !benchSlot && !naturalFor(card, line);
      return `
        <button class="tk ${card ? `r-${card.rarity}` : 'empty'} ${off ? 'off' : ''}" data-slot="${benchSlot ? 'b' : 's'}${idx}" style="${card ? `--rc:${RARITIES[card.rarity].color};--c1:${card.teamData.colors[0]}` : ''}">
          <span class="tk-v">${v}</span>
          <span class="tk-n">${card ? esc(card.name) : 'Base'}</span>
          <span class="tk-p">${card ? card.pos : (benchSlot ? '—' : line)}${off ? ' ⚠' : ''}</span>
        </button>`;
    };
    // posições no campinho (ATA em cima, GOL embaixo)
    const rowsOrder = ['ATA', 'MEI', 'DEF', 'GOL'];
    const rows = rowsOrder.map(l => lines.map((x, i) => [x, i]).filter(([x]) => x === l));
    root.innerHTML = `
      <h2>Escalação</h2>
      <div class="lu-forms">${Object.entries(FORMATIONS).map(([k, f]) => `<button class="chip ${club.formation === k ? 'on' : ''}" data-form="${k}">${k}<small>${f.label}</small></button>`).join('')}</div>
      <div class="lu-pitch">
        ${rows.map(r => `<div class="lu-row">${r.map(([l, i]) => token(club.slots[i], l, i)).join('')}</div>`).join('')}
      </div>
      <div class="lu-bench-h"><b>Reservas</b><span>Entram aos 65' se renderem mais que o titular cansado</span></div>
      <div class="lu-bench">${club.bench.map((u, i) => token(u, u ? POSITIONS[CARD_BY_UID[u].pos].line : 'MEI', i, true)).join('')}</div>
      <div class="lu-ovr"><div class="ovr-big"><b>${R.OVR}</b><span>OVR</span></div>${ratingBars(R)}</div>
      <div class="lu-actions">
        <button class="btn ghost" data-auto>${icon.sparkle} Escalar melhores</button>
        <button class="btn primary" data-done>Pronto</button>
      </div>
      <p class="fine">⚠ = fora de posição (rende menos). Toque numa vaga para trocar o jogador.</p>`;
  }
  render();

  root.addEventListener('click', e => {
    const club = state.club;
    const f = e.target.closest('[data-form]');
    if (f) {
      club.formation = f.dataset.form; sfx.tap(); save(); render(); return;
    }
    if (e.target.closest('[data-auto]')) {
      const { slots, bench } = autoLineup(myPlayers().map(p => p.uid), club.formation);
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
  const where = uid => {
    const s = club.slots.indexOf(uid); if (s >= 0) return 'titular';
    const b = club.bench.indexOf(uid); if (b >= 0) return 'reserva';
    return '';
  };
  const list = myPlayers().sort((a, b) => (line ? b.attrs[line] - a.attrs[line] : b.ovr - a.ovr));
  const s = sheet(`
    <h2>${isBench ? `Reserva ${idx + 1}` : `Vaga: ${LINE_LABEL[line]}`}</h2>
    <p class="muted" style="margin:4px 0 10px">${line ? `Nota mostrada = atributo ${line} do jogador nessa vaga.` : 'Reservas entram no segundo tempo.'}</p>
    <div class="pp-list">
      <button class="pp" data-uid=""><span class="pp-v">${line === 'GOL' ? 42 : 50}</span><span class="pp-n"><b>Jogador da base</b><small>vaga sem carta</small></span></button>
      ${list.map(c => {
        const v = line ? c.attrs[line] : c.ovr;
        const nat = !line || naturalFor(c, line);
        const w = where(c.uid);
        return `<button class="pp ${c.uid === current ? 'on' : ''}" data-uid="${c.uid}" style="--rc:${RARITIES[c.rarity].color}">
          <span class="pp-v ${nat ? '' : 'off'}">${v}</span>
          <span class="pp-n"><b>${gem(c.rarity)} ${esc(c.name)}</b><small>${POSITIONS[c.pos].label} · ${esc(c.teamData.abbr)} · OVR ${c.ovr}${c.edition !== 'Elenco 2026' ? ` · ${esc(c.edition)}` : ''}</small></span>
          ${w ? `<span class="pp-w">${w}</span>` : ''}${nat ? '' : '<span class="pp-w off">fora de posição</span>'}
        </button>`;
      }).join('')}
    </div>`);
  s.node.querySelector('.pp-list').addEventListener('click', e => {
    const b = e.target.closest('.pp'); if (!b) return;
    const uid = b.dataset.uid || null;
    // a mesma pessoa não pode estar duas vezes no elenco (ex.: Pelé lenda + Pelé Prime)
    if (uid) {
      const person = CARD_BY_UID[uid].person;
      const twin = [...club.slots, ...club.bench].find(u => u && u !== uid && u !== current && CARD_BY_UID[u].person === person);
      if (twin) { toast(`${esc(CARD_BY_UID[uid].name)} já está no elenco em outra versão`); return; }
    }
    // se o jogador já está em outra vaga, troca de lugar
    if (uid) {
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
      <div class="rw">${icon.coin}<b data-count="${reward.points}">+0</b><span>pontos</span></div>
      ${reward.packs ? `<div class="rw pack">${icon.pack}<b>+${reward.packs}</b><span>pacote premium</span></div>` : ''}
      ${reward.bonuses.map(b => `<div class="rw-b">🔥 ${esc(b)}</div>`).join('')}
      ${extra}
    </div>`;
}

async function playLeagueRound(app) {
  const lg = state.league;
  const fx = userFixture(lg);
  if (!fx) return;
  const me = userTeam(state.club, lg.season);
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
  const reward = matchReward(gf, outcome, streak);

  // grava tudo antes da animação (se o app fechar, o resultado vale)
  applyResult(lg, fx.home, fx.away, result.score);
  simulateOtherGames(lg);
  const round = lg.round + 1;
  advanceRound(lg);
  Object.assign(g, { played: g.played + 1, gf: g.gf + gf, ga: g.ga + ga, streak, best: Math.max(g.best, streak) });
  g[{ win: 'won', draw: 'drawn', loss: 'lost' }[outcome]]++;
  state.points += reward.points; state.premiumPacks += reward.packs;
  save();
  const pos = standings(lg).findIndex(r => r.id === 'user') + 1;

  await playMatch({
    home, away, result, userSide,
    context: { title, subtitle: `Temporada ${lg.season}` },
    onResultHtml: () => rewardHtml(reward, `<div class="rw-pos">Liga: <b>${pos}º lugar</b> · rodada ${round}/${lg.rounds.length}</div>`),
  });
  if (lg.done) await seasonEnd(lg);
  app.refresh();
}

async function playFriendly(app) {
  const season = state.league?.season || 1;
  const ids = Object.keys(TEAM_BY_ID);
  const opp = aiTeam(ids[Math.floor(Math.random() * ids.length)], season);
  const me = userTeam(state.club, season);
  const userHome = Math.random() < 0.5;
  const home = userHome ? me : opp, away = userHome ? opp : me;
  const userSide = userHome ? 0 : 1;
  if (!(await preMatch(home, away, userSide, 'Amistoso'))) return;
  const result = simulateMatch(home, away, { seed: (Date.now() & 0xffffff) >>> 0 });
  const gf = result.score[userSide], ga = result.score[1 - userSide];
  const outcome = gf > ga ? 'win' : gf === ga ? 'draw' : 'loss';
  const full = matchReward(gf, outcome, 0);
  const reward = { points: Math.round(full.points / 2), packs: 0, bonuses: ['Amistoso: metade dos pontos'] };
  state.points += reward.points; save();
  await playMatch({ home, away, result, userSide, context: { title: 'Amistoso', subtitle: `Temporada ${season}` }, onResultHtml: () => rewardHtml(reward) });
  app.refresh();
}

async function seasonEnd(lg) {
  const table = standings(lg);
  const pos = table.findIndex(r => r.id === 'user') + 1;
  const champ = pos === 1;
  const reward = champ ? REWARDS.title : pos === 2 ? REWARDS.vice : { points: 20, packs: 0 };
  if (champ) state.game.titles++;
  state.game.seasons++;
  state.points += reward.points; state.premiumPacks += reward.packs;
  save();
  return new Promise(resolve => {
    const ov = overlay(`
      <div class="se ${champ ? 'champ' : ''}">
        <div class="se-rays"></div>
        <div class="se-trophy">${champ ? '🏆' : ({ 2: '🥈', 3: '🥉' }[pos] || '🏁')}</div>
        <h1>${champ ? 'CAMPEÃO!' : `${pos}º LUGAR`}</h1>
        <p>${champ ? `${esc(state.club.name)} é o campeão da Liga Versatte · Temporada ${lg.season}` : `Temporada ${lg.season} encerrada. Campeão: ${esc(teamLabel(lg.champion))}`}</p>
        <div class="mr-rew">
          <div class="rw">${icon.coin}<b>+${reward.points}</b><span>pontos</span></div>
          ${reward.packs ? `<div class="rw pack">${icon.pack}<b>+${reward.packs}</b><span>pacote premium</span></div>` : ''}
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
    ov.node.querySelector('[data-ok]').addEventListener('click', () => { sfx.tap(); ov.close(); resolve(); });
  });
}

// ------------------------------------------------------------
//  Debug: kit inicial e utilitários
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

/** Cria um clube automaticamente com as melhores cartas do jogador (debug). */
export function quickCreateClub() {
  const best = list => list.sort(byRarity)[0]?.uid ?? null;
  const crest = best(myCrests());
  const { slots, bench } = autoLineup(myPlayers().map(p => p.uid), '1-2-1');
  const t = crest ? CARD_BY_UID[crest].teamData : null;
  state.club = { name: t ? `${t.name} Versatte` : 'Versatte FC', abbr: t ? t.abbr : 'VFC', crest, stadium: best(myStadiums()), mascot: best(myMascots()),
    formation: '1-2-1', slots, bench, createdAt: Date.now() };
  state.league = createLeague(t ? t.id : null, 1);
  save();
}

/** Joga instantaneamente as rodadas restantes, deixando só a última para jogar com animação (debug). */
export function simulateUntilLastRound() {
  const lg = state.league; if (!lg) return 0;
  let n = 0;
  while (!lg.done && lg.round < lg.rounds.length - 1) {
    const fx = userFixture(lg);
    const me = userTeam(state.club, lg.season), opp = aiTeam(fx.opponent, lg.season);
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
