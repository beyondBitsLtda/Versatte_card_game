// ============================================================
//  MODO CLUBE — partida em texto (estilo Brasfoot)
//  Mesmo resultado do motor; aqui ele é narrado minuto a minuto:
//  placar, linha do tempo, artilheiros, estatísticas ao vivo,
//  barra de pressão e narração lance a lance.
// ============================================================
import { crestMini, mountResult } from './match.js';
import { burst, confetti, sfx, haptic } from '../fx.js';
import { overlay, esc, icon } from '../ui.js';

const SEC_PER_MIN = 0.36;          // 90 min ≈ 32 s em 1x

const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const fill = (tpl, v) => tpl.replace(/\{(\w+)\}/g, (_, k) => (v[k] != null ? v[k] : ''));

// ---------------- frases ----------------
const T = {
  kickoff: ['Bola rolando no {stadium}!', 'Apita o árbitro: começa o jogo no {stadium}!', 'Tudo pronto no {stadium}. Rola a bola!'],
  second: ['Começa o segundo tempo!', 'Bola rolando para a etapa final!', 'Os times voltam do vestiário: segundo tempo!'],
  buildup: [
    '{p} avança pela direita e procura {p2} na área…', '{p} tabela com {p2} e invade a área!', 'Contra-ataque rápido do {t}! {p} puxa a jogada…',
    '{p} recebe na entrada da área, gira…', 'Cruzamento de {p2} na medida para {p}…', '{p} dribla o marcador e vai para o chute…',
    'Bola enfiada de {p2} para {p}, que sai cara a cara!', 'Pressão do {t}! A bola sobra para {p}…',
  ],
  goal: [
    'GOOOOOL DO {T}! {p} bate cruzado e não dá chance ao goleiro!', 'GOOOOOL! {p} acerta um chutaço no ângulo! É do {T}!',
    'É GOL! {p} toca com categoria na saída do goleiro! {T} marca!', 'GOOOOOL! {p} sobe mais alto que todo mundo e cabeceia para a rede!',
    'GOL DO {T}! {p} empurra para o fundo da rede!', 'GOLAAAÇO! {p} solta a bomba de fora da área!',
  ],
  goalPen: ['Pênalti para o {T}! {p} parte para a cobrança… GOOOOL! Deslocou o goleiro!', 'Pênalti! {p} bate firme no canto… É GOL DO {T}!'],
  assist: ['Assistência de {a}.', 'Passe perfeito de {a}.', 'Que jogada de {a}!'],
  save: ['DEFESAÇA! {k} voa e espalma o chute de {p}!', '{p} finaliza firme, mas {k} faz grande defesa!', '{k} fecha o ângulo e salva o {D}!', 'Que defesa de {k}! O chute de {p} ia no canto!'],
  savePen: ['Pênalti para o {T}! {p} cobra… {k} DEFENDE! Que defesa!'],
  post: ['NA TRAVE! {p} carimba o poste!', 'UHHHH! A bola de {p} explode no travessão!', 'No poste! {p} quase marcou para o {T}!'],
  postLuck: ['NA TRAVE! E o {l} comemora: sorte do {D}!'],
  miss: ['{p} finaliza para fora. Tiro de meta.', '{p} bate por cima do gol!', 'Chute de {p} passa raspando a trave!', '{p} pega mal na bola e manda longe.'],
  foul: ['Falta de {p} ({T}).', '{p} chega atrasado e o juiz marca falta.', 'Falta dura de {p} no meio-campo.'],
  yellow: ['🟨 Cartão amarelo para {p} ({T}).', '🟨 {p} ({T}) é advertido com o amarelo.'],
  red: ['🟥 EXPULSO! {p} ({T}) recebe o vermelho direto!'],
  red2: ['🟥 Segundo amarelo! {p} ({T}) está expulso!'],
  sub: ['🔁 Substituição no {T}: sai {o}, entra {i}.'],
  half: ['Fim do primeiro tempo: {H} {a} x {b} {A}.'],
  end: ['FIM DE JOGO! {H} {a} x {b} {A}.'],
  filler: [
    '{t} troca passes no campo de defesa.', '{p} ({t}) tenta a jogada individual, mas perde a bola.', 'Pressão do {t}! O time está todo no ataque.',
    '{p} lança para {p2}, mas a bola sai pela linha de fundo.', 'Escanteio para o {t}. {p} cobra… a zaga afasta.', 'Jogo truncado no meio-campo.',
    '{k} sai bem do gol e fica com a bola.', 'O {t} gira a bola, procurando espaço.', '{p} arrisca de longe… bola fraca nas mãos do goleiro.',
    'Impedimento de {p}. A arbitragem marca.', '{p} e {p2} tabelam, mas a defesa corta.', 'O {t} gosta mais do jogo neste momento.',
  ],
  crowd: ['A torcida do {H} empurra o time!', 'O {stadium} canta alto!'],
  mascot: ['O mascote {m} agita a arquibancada!'],
  dominance: ['O meio-campo do {t} domina a partida.', 'O {t} tem mais a bola e controla o jogo.'],
  late: ['Últimos minutos! O {t} se lança ao ataque.', 'Reta final de jogo e o {t} pressiona!'],
};

/**
 * Narra a partida em texto. Mesma interface de playMatch.
 */
export function playTextMatch({ home, away, result, userSide = 0, context = {}, onResultHtml }) {
  return new Promise(resolve => {
    const teams = [home, away];
    const ev = result.events;
    const ov = overlay(`
      <div class="tm">
        <div class="tm-ctx">${esc(context.title || 'Amistoso')}<span>${esc(context.subtitle || '')}</span></div>
        <div class="tm-board">
          ${[0, 1].map(s => `
            <div class="tm-team" style="--c1:${teams[s].colors[0]};--c2:${teams[s].colors[1] || '#fff'}">
              ${crestMini(teams[s])}
              <b>${esc(teams[s].name)}</b>
              <span class="tm-goal" data-s="${s}">0</span>
            </div>`).join('')}
          <div class="tm-clock"><b class="tm-min">0'</b><span class="tm-period">1º tempo</span></div>
        </div>
        <div class="tm-scorers">
          <div data-sc="0"></div><div data-sc="1"></div>
        </div>
        <div class="tm-line"><div class="tm-fillbar"></div>${ev.filter(e => ['goal', 'red'].includes(e.type)).map(e => `<i class="tm-mark ${e.type} s${e.team}" style="--at:${e.min / 90}" title="${e.min}'"></i>`).join('')}<span class="tm-ht"></span></div>
        <div class="tm-press"><span>${esc(home.abbr)}</span><div class="tm-pbar" style="--h:${home.colors[0]};--a:${away.colors[0].toUpperCase() === home.colors[0].toUpperCase() ? (away.colors[1] || '#fff') : away.colors[0]}"><i></i></div><span>${esc(away.abbr)}</span></div>
        <div class="tm-stats">
          ${['Posse', 'Finalizações', 'No alvo', 'Faltas', 'Cartões'].map(k => `<div class="tm-st" data-k="${k}"><b>0</b><span>${k}</span><b>0</b></div>`).join('')}
        </div>
        <div class="tm-feed" aria-live="polite"></div>
        <div class="tm-ctrl">
          <div class="mt-speed">${[1, 2, 4].map(s => `<button data-speed="${s}" class="${s === 1 ? 'on' : ''}">${s}x</button>`).join('')}</div>
          <button class="icon-btn tm-pause" aria-label="Pausar">⏸</button>
          <button class="link-btn tm-skip">Resultado final ${icon.arrow}</button>
        </div>
        <div class="tm-flash"></div>
      </div>`, 'tm-ov');

    const node = ov.node;
    const $ = sel => node.querySelector(sel);
    const feed = $('.tm-feed');
    const names = s => teams[s].players.map(p => p.name).filter(n => n && n !== 'Sorteio');
    const keeper = s => (teams[s].players.find(p => p.line === 'GOL') || teams[s].players[0]).name;
    const two = s => { const n = names(s); const a = pick(n); let b = pick(n); if (b === a && n.length > 1) b = n.find(x => x !== a); return [a, b]; };
    const vars = s => {
      const [p, p2] = two(s);
      return { p, p2, t: teams[s].name, T: teams[s].name.toUpperCase(), k: keeper(1 - s), D: teams[1 - s].name, H: home.name, A: away.name, stadium: home.stadiumName, m: teams[s].mascot ? teams[s].mascot.name : '' };
    };

    // ---------------- roteiro de narração ----------------
    const lines = [];                       // { min, sec (ordem dentro do minuto), kind, text, team, ev }
    lines.push({ min: 0, kind: 'info', text: fill(pick(T.kickoff), vars(0)) });
    const events = ev.slice(1);
    const busyMin = new Set(events.map(e => e.min));
    for (const e of events) {
      const v = { ...vars(e.team ?? 0) };
      const isShot = ['goal', 'save', 'post', 'miss'].includes(e.type);
      if (isShot) {
        v.p = e.shooter; if (e.assist) v.p2 = e.assist;
        if (!e.penalty) lines.push({ min: Math.max(1, e.min - (Math.random() < 0.5 ? 1 : 0)), order: 0, kind: 'build', team: e.team, text: fill(pick(T.buildup), v) });
      }
      let text = '', kind = e.type;
      switch (e.type) {
        case 'goal':
          text = fill(pick(e.penalty ? T.goalPen : T.goal), v) + (e.assist ? ' ' + fill(pick(T.assist), { a: e.assist }) : '');
          break;
        case 'save': text = fill(pick(e.penalty ? T.savePen : T.save), { ...v, k: e.keeper }); break;
        case 'post': text = fill(pick(e.luck ? T.postLuck : T.post), { ...v, l: e.luck }); break;
        case 'miss': text = fill(pick(T.miss), v); break;
        case 'foul': text = fill(pick(T.foul), { ...v, p: e.player }); break;
        case 'yellow': text = fill(pick(T.yellow), { ...v, p: e.player }); break;
        case 'red': text = fill(pick(e.second ? T.red2 : T.red), { ...v, p: e.player }); break;
        case 'sub': text = fill(pick(T.sub), { ...v, o: e.playerOut, i: e.playerIn }); break;
        case 'half': text = fill(pick(T.half), { ...v, a: e.score[0], b: e.score[1] }); kind = 'half'; break;
        case 'end': text = fill(pick(T.end), { ...v, a: e.score[0], b: e.score[1] }); kind = 'end'; break;
      }
      lines.push({ min: e.min, order: 1, kind, team: e.team, text, ev: e });
      if (e.type === 'half') lines.push({ min: 45, order: 2, kind: 'info', text: fill(pick(T.second), v), second: true });
    }
    // comentários de ambiente nos minutos "vazios"
    let next = 3 + Math.floor(Math.random() * 3);
    for (let m = next; m < 90; m++) {
      if (m < next || busyMin.has(m) || busyMin.has(m + 1)) continue;
      const win = result.possession.slice(Math.max(1, m - 5), m + 1);
      const s = win.filter(x => x === 0).length * 2 >= win.length ? 0 : 1;
      const share = win.filter(x => x === s).length / win.length;
      const v = vars(s);
      let pool = T.filler;
      if (m > 80) pool = Math.random() < 0.5 ? T.late : T.filler;
      else if (share > 0.8 && Math.random() < 0.5) pool = T.dominance;
      else if (Math.random() < 0.12) pool = teams[s].mascot && Math.random() < 0.5 ? T.mascot : T.crowd;
      lines.push({ min: m, order: 0, kind: 'info', team: pool === T.crowd ? 0 : s, text: fill(pick(pool), pool === T.crowd ? vars(0) : v) });
      next = m + 3 + Math.floor(Math.random() * 4);
    }
    lines.sort((a, b) => a.min - b.min || (a.order || 0) - (b.order || 0));

    // ---------------- estado ao vivo ----------------
    let gameMin = 0, li = 0, speed = 1, paused = false, finished = false, hold = 0;
    const score = [0, 0];
    const st = { shots: [0, 0], on: [0, 0], fouls: [0, 0], cards: [0, 0] };

    const addLine = l => {
      const el = document.createElement('div');
      el.className = `tl k-${l.kind} ${l.team != null ? 's' + l.team : ''} ${l.team === userSide ? 'mine' : ''}`;
      el.style.setProperty('--tc', l.team != null ? teams[l.team].colors[0] : '#93A3BD');
      el.innerHTML = `<b>${l.min}'</b><span>${esc(l.text)}</span>`;
      feed.prepend(el);
      while (feed.children.length > 40) feed.lastChild.remove();
    };

    function applyEvent(e, quiet = false) {
      if (!e) return;
      const s = e.team;
      if (['goal', 'save', 'post', 'miss'].includes(e.type)) { st.shots[s]++; if (e.type === 'goal' || e.type === 'save') st.on[s]++; }
      if (e.type === 'foul' || e.type === 'yellow' || e.type === 'red') st.fouls[s]++;
      if (e.type === 'yellow' || e.type === 'red') st.cards[s]++;
      if (e.type === 'goal') {
        score[s] = e.score[s];
        const g = node.querySelector(`.tm-goal[data-s="${s}"]`);
        g.textContent = score[s];
        node.querySelector(`[data-sc="${s}"]`).insertAdjacentHTML('beforeend', `<span>⚽ ${e.min}' ${esc(e.shooter)}${e.penalty ? ' (pên.)' : ''}</span>`);
        if (!quiet) {
          g.classList.remove('pop'); void g.offsetWidth; g.classList.add('pop');
          const mine = s === userSide;
          node.classList.remove('goal-flash', 'mine', 'theirs'); void node.offsetWidth;
          node.classList.add('goal-flash', mine ? 'mine' : 'theirs');
          const big = $('.tm-flash');
          big.innerHTML = `<div class="tf-t">GOOOOL!</div><div class="tf-s">${esc(e.shooter)} · ${esc(teams[s].name)}</div>`;
          big.classList.remove('show'); void big.offsetWidth; big.classList.add('show');
          const r = g.getBoundingClientRect();
          burst(r.left + r.width / 2, r.top + r.height / 2, { colors: ['#fff', teams[s].colors[0], '#FFC940'], count: 110, speed: 11, shape: 'star', size: 2.8 });
          sfx.goal(); haptic(mine ? [60, 40, 120, 40, 200] : [40]);
          if (mine) confetti(['#FF8A1F', '#FFC940', teams[s].colors[0], '#fff']);
          hold = 1.9;
        }
      } else if (!quiet) {
        if (e.type === 'post') { sfx.clang(); node.classList.remove('shake'); void node.offsetWidth; node.classList.add('shake'); haptic([20, 30, 20]); hold = 0.8; }
        if (e.type === 'save') { sfx.save(); hold = 0.5; }
        if (e.type === 'miss') sfx.ooh();
        if (e.type === 'yellow' || e.type === 'red') { sfx.card(); hold = 0.5; }
        if (e.type === 'red') { node.classList.remove('red-flash'); void node.offsetWidth; node.classList.add('red-flash'); }
        if (e.type === 'half') { sfx.whistle(2); hold = 1.3; }
      }
    }

    function renderLive() {
      const m = Math.max(1, Math.floor(gameMin));
      $('.tm-min').textContent = `${Math.floor(gameMin)}'`;
      $('.tm-period').textContent = gameMin < 45 ? '1º tempo' : gameMin < 90 ? '2º tempo' : 'Encerrado';
      $('.tm-fillbar').style.width = `${(gameMin / 90) * 100}%`;
      const upto = result.possession.slice(1, m + 1);
      const p0 = upto.length ? Math.round(upto.filter(x => x === 0).length / upto.length * 100) : 50;
      const win = result.possession.slice(Math.max(1, m - 6), m + 1);
      const pr = win.length ? win.filter(x => x === 0).length / win.length : 0.5;
      $('.tm-pbar i').style.setProperty('--p', pr);
      const set = (k, a, b) => { const r = node.querySelector(`.tm-st[data-k="${k}"]`).children; r[0].textContent = a; r[2].textContent = b; };
      set('Posse', `${p0}%`, `${100 - p0}%`);
      set('Finalizações', st.shots[0], st.shots[1]);
      set('No alvo', st.on[0], st.on[1]);
      set('Faltas', st.fouls[0], st.fouls[1]);
      set('Cartões', st.cards[0], st.cards[1]);
    }

    let last = performance.now();
    function frame(now) {
      if (!node.isConnected) return;
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (!paused && !finished) {
        if (hold > 0) hold -= dt * Math.min(speed, 2);
        else {
          gameMin = Math.min(90, gameMin + dt * speed / SEC_PER_MIN);
          while (li < lines.length && lines[li].min <= gameMin && hold <= 0) {
            const l = lines[li++];
            addLine(l);
            if (l.ev) applyEvent(l.ev);
            if (l.kind === 'build' && speed < 4) hold = 0.35;
            if (l.ev && l.ev.type === 'end') { finished = true; sfx.whistle(3); setTimeout(showResult, 1100); }
          }
        }
        renderLive();
      }
      requestAnimationFrame(frame);
    }
    addLine(lines[li++]);
    sfx.whistle(1);
    requestAnimationFrame(t => { last = t; frame(t); });

    // ---------------- controles ----------------
    $('.mt-speed').addEventListener('click', e => {
      const b = e.target.closest('[data-speed]'); if (!b) return;
      speed = +b.dataset.speed; sfx.tap();
      node.querySelectorAll('[data-speed]').forEach(x => x.classList.toggle('on', x === b));
    });
    $('.tm-pause').addEventListener('click', e => {
      paused = !paused; sfx.tap(); e.currentTarget.textContent = paused ? '▶' : '⏸';
    });
    $('.tm-skip').addEventListener('click', () => {
      if (finished) return;
      finished = true; sfx.tap();
      while (li < lines.length) { const l = lines[li++]; addLine(l); if (l.ev) applyEvent(l.ev, true); }
      gameMin = 90; renderLive();
      showResult();
    });

    function showResult() {
      if (node.querySelector('.mt-result')) return;
      mountResult($('.tm'), { home, away, result, userSide, onResultHtml }, outcome => { ov.close(); resolve(outcome); });
    }
  });
}
