// ============================================================
//  MODO CLUBE — partida visual (estilo futebol de botão)
//  O resultado já vem calculado pelo motor; aqui só encenamos:
//  campo em canvas, botões, bola, narração e efeitos.
// ============================================================
import { CARD_BY_UID } from '../data.js';
import { FORMATIONS } from './engine.js';
import { cardHTML, teamArt, cardImage } from '../cards.js';
import { burst, confetti, sfx, haptic, attachTilt } from '../fx.js';
import { overlay, esc, icon, wait } from '../ui.js';

const SEC_PER_MIN = 0.42;          // 90 min ≈ 38 s em velocidade 1x
const LINE_Y = { GOL: 0.93, DEF: 0.76, MEI: 0.57, ATA: 0.39 };

/** Escudo pequeno (imagem do PNG se houver, senão arte gerada). */
export function crestMini(team) {
  const card = team.crest;
  if (card) {
    const img = cardImage(card);
    if (img) return `<span class="crest-mini has-img"><img src="${esc(img.src)}" alt="" onerror="this.parentNode.classList.add('img-fail')">${teamArt(card.teamData, card.variant)}</span>`;
    return `<span class="crest-mini">${teamArt(card.teamData, card.variant)}</span>`;
  }
  return `<span class="crest-mini vs"><img src="assets/logo-versatte.png" alt=""></span>`;
}

const textOn = hex => {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#05080f' : '#ffffff';
};

/**
 * Encena a partida. Resolve quando o jogador fecha a tela de resultado.
 * @param {object} o { home, away, result, userSide (0|1|null), context: { title, subtitle }, reward }
 */
export function playMatch({ home, away, result, userSide = 0, context = {}, onResultHtml }) {
  return new Promise(resolve => {
    const teams = [home, away];
    const ov = overlay(`
      <div class="mt">
        <div class="mt-head">
          <div class="mt-ctx">${esc(context.title || 'Amistoso')}<span>${esc(context.subtitle || '')}</span></div>
          <div class="mt-score">
            <div class="mt-team">${crestMini(home)}<b>${esc(home.abbr)}</b></div>
            <div class="mt-digits"><span class="sd" data-s="0">0</span><i>:</i><span class="sd" data-s="1">0</span></div>
            <div class="mt-team r"><b>${esc(away.abbr)}</b>${crestMini(away)}</div>
          </div>
          <div class="mt-clock"><span class="mt-min">0'</span><div class="mt-poss"><i style="--c:${home.colors[0]}"></i><i style="--c:${away.colors[0]}"></i></div></div>
        </div>
        <div class="mt-pitch-wrap">
          <canvas class="mt-pitch"></canvas>
          <div class="mt-fx"></div>
        </div>
        <div class="mt-feed" aria-live="polite"></div>
        <div class="mt-ctrl">
          <div class="mt-speed">${[1, 2, 4].map(s => `<button data-speed="${s}" class="${s === 1 ? 'on' : ''}">${s}x</button>`).join('')}</div>
          <button class="link-btn mt-skip">Pular para o fim ${icon.arrow}</button>
        </div>
      </div>`, 'match-ov');

    const node = ov.node;
    const canvas = node.querySelector('.mt-pitch');
    const ctx = canvas.getContext('2d');
    const wrap = node.querySelector('.mt-pitch-wrap');
    const fxLayer = node.querySelector('.mt-fx');
    const feed = node.querySelector('.mt-feed');
    const minEl = node.querySelector('.mt-min');
    const possEl = node.querySelectorAll('.mt-poss i');
    let W = 0, H = 0, dpr = 1;

    function resize() {
      const r = wrap.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    }
    resize();
    const ro = new ResizeObserver(resize); ro.observe(wrap);

    // ---------------- botões (jogadores) ----------------
    const discs = [];
    teams.forEach((t, side) => {
      const lines = FORMATIONS[t.formation].slots;
      const counts = {};
      lines.forEach(l => { counts[l] = (counts[l] || 0) + 1; });
      const seen = {};
      lines.forEach((line, i) => {
        const k = seen[line] = (seen[line] || 0) + 1;
        const n = counts[line];
        const bx = n === 1 ? 0.5 : 0.5 + (k - (n + 1) / 2) * 0.34;
        const by = side === 0 ? LINE_Y[line] : 1 - LINE_Y[line];
        const p = t.players[i];
        discs.push({ side, line, bx, by, x: bx, y: by, tx: bx, ty: by, name: p.name, shirt: p.shirt ?? i + 1, glow: 0 });
      });
    });
    const ball = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, speed: 0.06, trail: [], inNet: 0 };
    const sideDiscs = s => discs.filter(d => d.side === s);
    const findDisc = (s, name) => sideDiscs(s).find(d => d.name === name) || sideDiscs(s).find(d => d.line === 'ATA') || sideDiscs(s)[0];

    let attacker = 0;           // quem tem a bola (para posicionamento)
    let holder = sideDiscs(0).find(d => d.line === 'MEI');
    function layout() {
      discs.forEach(d => {
        const fwd = d.side === 0 ? -1 : 1;           // mandante ataca para cima
        const push = d.side === attacker ? 0.1 : -0.05;
        const lineAdj = d.line === 'GOL' ? 0.25 : 1;
        d.tx = d.bx + (Math.sin(perf / 900 + d.bx * 9) * 0.02);
        d.ty = d.by + fwd * push * lineAdj + Math.cos(perf / 1100 + d.by * 7) * 0.012;
      });
    }

    // ---------------- desenho ----------------
    let perf = 0, shakeT = 0, netShake = [0, 0];
    function draw() {
      const s = dpr;
      ctx.setTransform(s, 0, 0, s, 0, 0);
      const sx = shakeT > 0 ? (Math.random() - 0.5) * 10 * shakeT : 0;
      const sy = shakeT > 0 ? (Math.random() - 0.5) * 10 * shakeT : 0;
      ctx.save(); ctx.translate(sx, sy);
      const pad = 12, gw = W - pad * 2, gh = H - pad * 2;
      const X = x => pad + x * gw, Y = y => pad + y * gh;
      // gramado listrado
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = i % 2 ? '#0b3a22' : '#0d4428';
        ctx.fillRect(pad, pad + (gh / 12) * i, gw, gh / 12 + 1);
      }
      // luz das torcidas
      const glow = (y, c) => { const g = ctx.createLinearGradient(0, Y(y), 0, Y(y === 0 ? 0.25 : 0.75)); g.addColorStop(0, c + '55'); g.addColorStop(1, c + '00'); ctx.fillStyle = g; ctx.fillRect(pad, y === 0 ? Y(0) : Y(0.75), gw, gh * 0.25); };
      glow(1, home.colors[0] === '#FFFFFF' ? home.colors[1] : home.colors[0]);
      glow(0, away.colors[0] === '#FFFFFF' ? away.colors[1] : away.colors[0]);
      // linhas neon
      ctx.strokeStyle = 'rgba(235,255,245,.85)'; ctx.lineWidth = 2; ctx.shadowColor = 'rgba(120,255,190,.8)'; ctx.shadowBlur = 8;
      ctx.strokeRect(pad, pad, gw, gh);
      ctx.beginPath(); ctx.moveTo(pad, Y(0.5)); ctx.lineTo(pad + gw, Y(0.5)); ctx.stroke();
      ctx.beginPath(); ctx.arc(X(0.5), Y(0.5), gw * 0.16, 0, Math.PI * 2); ctx.stroke();
      [0, 1].forEach(t => {
        const dir = t === 0 ? 1 : -1, y0 = t === 0 ? 0 : 1;
        ctx.strokeRect(X(0.22), Math.min(Y(y0), Y(y0 + dir * 0.17)), gw * 0.56, gh * 0.17);
        ctx.strokeRect(X(0.36), Math.min(Y(y0), Y(y0 + dir * 0.07)), gw * 0.28, gh * 0.07);
      });
      ctx.shadowBlur = 0;
      // gols (com rede)
      [0, 1].forEach(t => {
        const y = t === 0 ? Y(0) : Y(1), h = 10, dir = t === 0 ? -1 : 1;
        const sh = netShake[t] > 0 ? Math.sin(perf / 25) * 3 * netShake[t] : 0;
        ctx.fillStyle = 'rgba(255,255,255,.08)';
        ctx.fillRect(X(0.38), Math.min(y, y + dir * h) + sh, gw * 0.24, h);
        ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2.5;
        ctx.strokeRect(X(0.38), Math.min(y, y + dir * h) + sh, gw * 0.24, h);
        ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1;
        for (let i = 1; i < 8; i++) { ctx.beginPath(); ctx.moveTo(X(0.38) + gw * 0.03 * i, y); ctx.lineTo(X(0.38) + gw * 0.03 * i, y + dir * h + sh); ctx.stroke(); }
      });
      // nome do estádio (marca d'água)
      ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.font = `800 ${Math.round(gw * 0.07)}px 'Barlow Condensed', sans-serif`; ctx.textAlign = 'center';
      ctx.fillText((home.stadiumName || '').toUpperCase(), X(0.5), Y(0.5) + gw * 0.025);
      // botões
      const r = Math.max(11, gw * 0.05);
      discs.forEach(d => {
        const t = teams[d.side];
        const [c1, c2] = t.colors;
        const cx = X(d.x), cy = Y(d.y);
        ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(cx + 2, cy + 4, r, r * 0.9, 0, 0, Math.PI * 2); ctx.fill();
        if (d.glow > 0) { ctx.shadowColor = '#FFC940'; ctx.shadowBlur = 24 * d.glow; }
        const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r);
        g.addColorStop(0, '#ffffff'); g.addColorStop(0.18, c1); g.addColorStop(1, shade(c1));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.lineWidth = 3; ctx.strokeStyle = d.line === 'GOL' ? '#FFC940' : (c2.toUpperCase() === c1.toUpperCase() ? '#fff' : c2);
        ctx.beginPath(); ctx.arc(cx, cy, r - 1.5, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = textOn(c1); ctx.font = `800 ${Math.round(r * 0.95)}px 'Barlow Condensed', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(d.shirt), cx, cy + 1);
        if (t.user) { ctx.strokeStyle = 'rgba(255,138,31,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, Math.PI * 2); ctx.stroke(); }
      });
      // bola
      ball.trail.forEach((p, i) => { ctx.fillStyle = `rgba(255,255,255,${(i / ball.trail.length) * 0.35})`; ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), r * 0.3, 0, Math.PI * 2); ctx.fill(); });
      ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.arc(X(ball.x) + 2, Y(ball.y) + 3, r * 0.38, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(X(ball.x), Y(ball.y), r * 0.38, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      ctx.restore();
    }
    const shade = hex => {
      const h = hex.replace('#', ''); const v = [0, 2, 4].map(i => Math.round(parseInt(h.slice(i, i + 2), 16) * 0.55));
      return `rgb(${v.join(',')})`;
    };
    const toScreen = (x, y) => {
      const r = canvas.getBoundingClientRect(), pad = 12;
      return { x: r.left + pad + x * (r.width - pad * 2), y: r.top + pad + y * (r.height - pad * 2) };
    };

    // ---------------- relógio e eventos ----------------
    let speed = 1, gameMin = 0, evIdx = 1, busy = false, finished = false, skipping = false, last = performance.now();
    let nextPass = 0;
    const events = result.events;

    function tick(now) {
      if (!node.isConnected) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now; perf = now;
      if (!busy && !finished) {
        gameMin = Math.min(90, gameMin + dt * speed / SEC_PER_MIN);
        const m = Math.floor(gameMin);
        attacker = result.possession[Math.max(1, m)] ?? attacker;
        minEl.textContent = `${m}'`;
        const ev = events[evIdx];
        if (ev && ev.min <= gameMin) { evIdx++; runEvent(ev); }
        // passes de ambiente
        if (now > nextPass && !busy) {
          const mates = sideDiscs(attacker).filter(d => d.line !== 'GOL' || Math.random() < 0.15);
          holder = mates[Math.floor(Math.random() * mates.length)];
          ball.tx = holder.x; ball.ty = holder.y; ball.speed = 0.08;
          nextPass = now + (500 + Math.random() * 600) / speed;
          if (speed < 4 && Math.random() < 0.4) sfx.kick();
        }
      }
      layout();
      discs.forEach(d => { d.x += (d.tx - d.x) * 0.05; d.y += (d.ty - d.y) * 0.05; d.glow = Math.max(0, d.glow - dt * 0.8); });
      if (!busy && holder) { ball.tx = holder.x; ball.ty = holder.y + (holder.side === 0 ? -0.025 : 0.025); }
      ball.x += (ball.tx - ball.x) * ball.speed; ball.y += (ball.ty - ball.y) * ball.speed;
      ball.trail.push({ x: ball.x, y: ball.y }); if (ball.trail.length > 8) ball.trail.shift();
      shakeT = Math.max(0, shakeT - dt * 2.2);
      netShake = netShake.map(v => Math.max(0, v - dt * 1.4));
      possEl[0].style.flex = String(result.possession.slice(0, Math.max(1, gameMin | 0)).filter(x => x === 0).length + 1);
      possEl[1].style.flex = String(result.possession.slice(0, Math.max(1, gameMin | 0)).filter(x => x === 1).length + 1);
      draw();
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(t => { last = t; sfx.whistle(1); tick(t); });

    const pause = ms => wait(skipping ? 0 : ms / Math.min(speed, 2));
    const addFeed = (min, html, cls = '') => {
      const line = document.createElement('div');
      line.className = `fd ${cls}`;
      line.innerHTML = `<b>${min}'</b><span>${html}</span>`;
      feed.prepend(line);
      while (feed.children.length > 4) feed.lastChild.remove();
    };
    const teamName = s => esc(teams[s].abbr);

    function bigText(text, cls, sub = '', card = null) {
      const el = document.createElement('div');
      el.className = `mt-big ${cls}`;
      el.innerHTML = `<div class="mb-t">${text}</div>${sub ? `<div class="mb-s">${sub}</div>` : ''}${card ? `<div class="mb-card">${cardHTML(card, { size: 'md', live: true })}</div>` : ''}`;
      fxLayer.appendChild(el);
      const c = el.querySelector('.card');
      const stop = c ? attachTilt(c, { max: 16 }) : null;
      return () => { el.classList.add('out'); stop && stop(); setTimeout(() => el.remove(), 400); };
    }

    async function shot(ev) {
      const s = ev.team;
      const d = findDisc(s, ev.shooter);
      attacker = s;
      d.ty = s === 0 ? 0.22 : 0.78; d.tx = 0.5 + (ev.x - 0.5) * 0.4;
      ball.tx = d.tx; ball.ty = d.ty; ball.speed = 0.12;
      await pause(450);
      sfx.kick();
      const goalY = s === 0 ? -0.01 : 1.01;
      let gx = 0.42 + ev.x * 0.16;
      if (ev.type === 'post') gx = ev.x < 0.5 ? 0.38 : 0.62;
      if (ev.type === 'miss') gx = ev.x < 0.5 ? 0.25 : 0.75;
      ball.tx = gx; ball.ty = ev.type === 'save' ? (s === 0 ? 0.06 : 0.94) : goalY; ball.speed = 0.22;
      if (ev.type === 'save') { const k = sideDiscs(1 - s).find(x => x.line === 'GOL'); if (k) { k.tx = gx; k.glow = 1; } }
      await pause(380);
      return gx;
    }

    async function runEvent(ev) {
      busy = true;
      const userTeam = ev.team === userSide;
      switch (ev.type) {
        case 'goal': {
          const gx = await shot(ev);
          netShake[ev.team === 0 ? 0 : 1] = 1;
          node.querySelector(`.sd[data-s="${ev.team}"]`).textContent = ev.score[ev.team];
          node.querySelector(`.sd[data-s="${ev.team}"]`).classList.add('pop');
          setTimeout(() => node.querySelector(`.sd[data-s="${ev.team}"]`)?.classList.remove('pop'), 900);
          addFeed(ev.min, `<em class="g">GOL</em> ${esc(ev.shooter)} (${teamName(ev.team)})${ev.penalty ? ' de pênalti' : ''}${ev.assist ? ` · assist. ${esc(ev.assist)}` : ''}`, 'goal');
          if (!skipping) {
            shakeT = 1;
            const p = toScreen(gx, ev.team === 0 ? 0 : 1);
            const t = teams[ev.team];
            burst(p.x, p.y, { colors: ['#fff', t.colors[0], t.colors[1], '#FFC940'], count: 140, speed: 13, shape: 'star', size: 3, angle: ev.team === 0 ? Math.PI / 2 : -Math.PI / 2, spread: Math.PI * 1.4 });
            node.classList.add('flash-goal', userTeam ? 'mine' : 'theirs');
            sfx.goal(); haptic(userTeam ? [60, 40, 120, 40, 200] : [40]);
            if (userTeam) confetti(['#FF8A1F', '#FFC940', teams[ev.team].colors[0], '#fff']);
            const card = ev.shooterUid ? CARD_BY_UID[ev.shooterUid] : null;
            const close = bigText(ev.penalty ? 'GOOOL<br><small>DE PÊNALTI</small>' : 'GOOOOL!', `goal ${userTeam ? 'mine' : 'theirs'}`,
              `${esc(ev.shooter)} · ${esc(teams[ev.team].name)}${ev.assist ? `<br><small>Assistência: ${esc(ev.assist)}</small>` : ''}`, card);
            await pause(card ? 2600 : 1900);
            close();
            node.classList.remove('flash-goal', 'mine', 'theirs');
          }
          ball.x = ball.tx = 0.5; ball.y = ball.ty = 0.5; ball.trail = [];
          attacker = 1 - ev.team;
          break;
        }
        case 'save': {
          await shot(ev);
          addFeed(ev.min, `Defesa de ${esc(ev.keeper)} no chute de ${esc(ev.shooter)}`, 'save');
          if (!skipping) {
            sfx.save(); haptic(20);
            const keeperMine = (1 - ev.team) === userSide;
            const card = ev.keeperUid && keeperMine ? CARD_BY_UID[ev.keeperUid] : null;
            const p = toScreen(ball.x, ball.y);
            burst(p.x, p.y, { colors: ['#fff', '#7fe0ff'], count: 30, speed: 6 });
            const close = bigText('DEFESAÇA!', `save ${keeperMine ? 'mine' : ''}`, esc(ev.keeper), card);
            await pause(card ? 1700 : 1100); close();
          }
          break;
        }
        case 'post': {
          await shot(ev);
          addFeed(ev.min, `Na trave! ${esc(ev.shooter)} quase marca${ev.luck ? ` · sorte de ${esc(ev.luck)}` : ''}`, 'post');
          if (!skipping) {
            sfx.clang(); shakeT = 0.5; haptic([20, 30, 20]);
            const close = bigText('NA TRAVE!', 'post', ev.luck ? `Sorte de ${esc(ev.luck)}!` : esc(ev.shooter));
            await pause(1100); close();
          }
          break;
        }
        case 'miss': {
          await shot(ev);
          addFeed(ev.min, `${esc(ev.shooter)} chuta para fora`);
          if (!skipping) { sfx.ooh(); const close = bigText('PRA FORA!', 'miss'); await pause(650); close(); }
          break;
        }
        case 'yellow': case 'red': {
          addFeed(ev.min, `${ev.type === 'red' ? '🟥 Expulso' : '🟨 Amarelo'}: ${esc(ev.player)} (${teamName(ev.team)})${ev.second ? ' — segundo amarelo' : ''}`, ev.type);
          if (!skipping) { sfx.card(); const close = bigText(`<span class="cardico ${ev.type}"></span>`, `booking ${ev.type}`, esc(ev.player)); await pause(900); close(); }
          if (ev.type === 'red') { const d = findDisc(ev.team, ev.player); if (d) { d.by = ev.team === 0 ? 1.08 : -0.08; d.name = '—'; } }
          break;
        }
        case 'foul':
          addFeed(ev.min, `Falta de ${esc(ev.player)}`);
          break;
        case 'sub': {
          const d = findDisc(ev.team, ev.playerOut);
          if (d) { d.name = ev.playerIn; d.shirt = (CARD_BY_UID[ev.inUid]?.shirt) ?? d.shirt; d.glow = 1; }
          addFeed(ev.min, `🔁 ${teamName(ev.team)}: entra ${esc(ev.playerIn)}, sai ${esc(ev.playerOut)}`);
          if (!skipping) { const close = bigText('SUBSTITUIÇÃO', 'sub', `Entra ${esc(ev.playerIn)} · sai ${esc(ev.playerOut)}`); await pause(900); close(); }
          break;
        }
        case 'half': {
          addFeed(45, `Intervalo: ${ev.score[0]} x ${ev.score[1]}`);
          if (!skipping) { sfx.whistle(2); const close = bigText('INTERVALO', 'half', `${ev.score[0]} x ${ev.score[1]}`); await pause(1300); close(); }
          ball.x = ball.tx = 0.5; ball.y = ball.ty = 0.5;
          break;
        }
        case 'end': {
          finished = true;
          minEl.textContent = "90'";
          sfx.whistle(3);
          addFeed(90, `Fim de jogo: ${ev.score[0]} x ${ev.score[1]}`);
          await wait(skipping ? 50 : 1100);
          showResult();
          break;
        }
      }
      busy = false;
    }

    // ---------------- controles ----------------
    node.querySelector('.mt-speed').addEventListener('click', e => {
      const b = e.target.closest('[data-speed]'); if (!b) return;
      speed = +b.dataset.speed; sfx.tap();
      node.querySelectorAll('[data-speed]').forEach(x => x.classList.toggle('on', x === b));
    });
    node.querySelector('.mt-skip').addEventListener('click', async () => {
      if (finished) return;
      skipping = true; sfx.tap();
      // aplica o placar e a narração restante sem animação
      for (; evIdx < events.length; evIdx++) {
        const ev = events[evIdx];
        if (ev.type === 'goal') {
          node.querySelector(`.sd[data-s="${ev.team}"]`).textContent = ev.score[ev.team];
          addFeed(ev.min, `<em class="g">GOL</em> ${esc(ev.shooter)} (${teamName(ev.team)})`, 'goal');
        }
        if (ev.type === 'end') { finished = true; showResult(); break; }
      }
    });

    // ---------------- resultado ----------------
    function showResult() {
      if (node.querySelector('.mt-result')) return;
      const [a, b] = result.score;
      const mine = userSide == null ? null : (userSide === 0 ? a - b : b - a);
      const outcome = mine == null ? 'neutral' : mine > 0 ? 'win' : mine === 0 ? 'draw' : 'loss';
      const title = { win: 'VITÓRIA!', draw: 'EMPATE', loss: 'DERROTA', neutral: 'FIM DE JOGO' }[outcome];
      const mvpCard = result.mvp?.uid ? CARD_BY_UID[result.mvp.uid] : null;
      const st = result.stats;
      const panel = document.createElement('div');
      panel.className = `mt-result ${outcome}`;
      panel.innerHTML = `
        <div class="mr-in">
          <div class="mr-title">${title}</div>
          <div class="mr-score">
            <div>${crestMini(home)}<b>${esc(home.name)}</b></div>
            <strong>${a} <i>x</i> ${b}</strong>
            <div>${crestMini(away)}<b>${esc(away.name)}</b></div>
          </div>
          ${result.mvp ? `
            <div class="mr-mvp">
              ${mvpCard ? `<div class="mr-mvp-card">${cardHTML(mvpCard, { size: 'sm' })}</div>` : ''}
              <div><span>Craque do jogo</span><b>${esc(result.mvp.name)}</b>${result.mvp.goals ? `<small>${result.mvp.goals} gol(s)</small>` : ''}</div>
            </div>` : ''}
          <div class="mr-stats">
            <div><b>${st[0].poss}%</b><span>posse</span><b>${st[1].poss}%</b></div>
            <div><b>${st[0].shots}</b><span>finalizações</span><b>${st[1].shots}</b></div>
            <div><b>${st[0].onTarget}</b><span>no alvo</span><b>${st[1].onTarget}</b></div>
          </div>
          <div class="mr-extra">${onResultHtml ? onResultHtml(outcome) : ''}</div>
          <button class="btn primary big mr-go">Continuar</button>
        </div>`;
      node.querySelector('.mt').appendChild(panel);
      requestAnimationFrame(() => panel.classList.add('in'));
      if (outcome === 'win') {
        sfx.win(); haptic([40, 60, 120]);
        setTimeout(() => confetti(['#FF8A1F', '#FFC940', '#33B5FF', '#fff']), 200);
        const r = panel.querySelector('.mr-title').getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height / 2, { colors: ['#FFC940', '#fff', '#FF8A1F'], count: 120, speed: 11, shape: 'star', size: 3 });
      } else if (outcome === 'loss') sfx.lose();
      else sfx.ooh();
      countUp(panel);
      panel.querySelector('.mr-go').addEventListener('click', () => {
        sfx.tap(); ro.disconnect(); ov.close(); resolve(outcome);
      });
    }
  });
}

/** Anima números com data-count (recompensas). */
function countUp(root) {
  root.querySelectorAll('[data-count]').forEach(el => {
    const target = +el.dataset.count; const t0 = performance.now();
    const step = t => {
      const p = Math.min(1, (t - t0) / 1200);
      el.textContent = `+${Math.round(target * (1 - Math.pow(1 - p, 3)))}`;
      if (p < 1) requestAnimationFrame(step); else sfx.coin();
    };
    setTimeout(() => requestAnimationFrame(step), 600);
  });
}
