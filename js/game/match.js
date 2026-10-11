// ============================================================
//  MODO CLUBE — partida visual
//  O placar e os lances vêm prontos do motor (engine.js). Aqui eles
//  são ENCENADOS com física: cada jogador é um agente independente
//  (marca, pressiona, se desmarca, apoia, infiltra), a bola tem
//  atrito, altura e quique, e os lances do motor (gol, defesa,
//  trave, chute para fora, falta, pênalti) são construídos em campo.
// ============================================================
import { CARD_BY_UID } from '../data.js';
import { FORMATIONS } from './engine.js';
import { cardHTML, teamArt, cardImage } from '../cards.js';
import { burst, confetti, sfx, haptic, attachTilt } from '../fx.js';
import { overlay, esc, icon } from '../ui.js';

// ---------------- campo (metros) ----------------
const FW = 44, FL = 68;                          // largura × comprimento
const GOAL_W = 7.3, GX0 = (FW - GOAL_W) / 2, GX1 = GX0 + GOAL_W;
const BOX_W = 26, BOX_D = 12, SMALL_W = 13, SMALL_D = 4.5, SPOT = 9, CIRCLE_R = 6.5;
const NET_D = 2.2;
const SEC_PER_MIN = 0.3;                         // ritmo do relógio (segundos de simulação por minuto de jogo)
const FRICTION = 1.1;                            // atrito da bola no gramado
const GRAVITY = 20;
const ANCHOR = { GOL: 2.4, DEF: 15, MEI: 29, ATA: 42 };   // distância da âncora até o próprio gol
const DISC = 1.6;                                // raio do botão (m)
const TOUCH = DISC * 2 + 0.3;                    // distância de contato entre dois botões

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hyp = Math.hypot;
const dist = (a, b) => hyp(a.x - b.x, a.y - b.y);
const rnd = (a = 0, b = 1) => a + Math.random() * (b - a);
const fwd = s => (s === 0 ? -1 : 1);             // mandante ataca para cima (y → 0)
const attackY = s => (s === 0 ? 0 : FL);
const ownY = s => (s === 0 ? FL : 0);

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
const shade = (hex, k = 0.55) => {
  const h = hex.replace('#', '');
  return `rgb(${[0, 2, 4].map(i => Math.round(parseInt(h.slice(i, i + 2), 16) * k)).join(',')})`;
};

const rgb = hex => { const h = hex.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
const colorDist = (a, b) => { const [x, y] = [rgb(a), rgb(b)]; return hyp(x[0] - y[0], x[1] - y[1], x[2] - y[2]); };
/** Uniformes: se as cores principais forem parecidas, o visitante joga com o uniforme reserva. */
function kits(home, away) {
  const h = [home.colors[0], home.colors[1] || '#FFFFFF'];
  let a = [away.colors[0], away.colors[1] || '#FFFFFF'];
  if (colorDist(h[0], a[0]) < 120) {
    const alt = [away.colors[1], away.colors[2], '#FFFFFF', '#141414'].find(c => c && colorDist(c, h[0]) >= 140 && colorDist(c, h[1]) >= 60) || '#FFFFFF';
    a = [alt, away.colors[0]];
  }
  return [h, a];
}

/**
 * Encena a partida. Resolve com 'win' | 'draw' | 'loss' | 'neutral' quando o jogador fecha o resultado.
 * @param {object} o { home, away, result, userSide (0|1|null), context: { title, subtitle }, onResultHtml }
 */
export function playMatch({ home, away, result, userSide = 0, context = {}, onResultHtml }) {
  return new Promise(resolve => {
    const teams = [home, away];
    const KIT = kits(home, away);
    const ov = overlay(`
      <div class="mt">
        <div class="mt-head">
          <div class="mt-ctx">${esc(context.title || 'Amistoso')}<span>${esc(context.subtitle || '')}</span></div>
          <div class="mt-score">
            <div class="mt-team">${crestMini(home)}<b>${esc(home.abbr)}</b></div>
            <div class="mt-digits"><span class="sd" data-s="0">0</span><i>:</i><span class="sd" data-s="1">0</span></div>
            <div class="mt-team r"><b>${esc(away.abbr)}</b>${crestMini(away)}</div>
          </div>
          <div class="mt-clock"><span class="mt-min">0'</span><div class="mt-poss"><i style="--c:${KIT[0][0]}"></i><i style="--c:${KIT[1][0]}"></i></div></div>
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

    // ---------------- dimensões / câmera ----------------
    let W = 0, H = 0, dpr = 1, sc = 1, ox = 0, oy = 0, fieldCache = null;
    function resize() {
      const r = wrap.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      sc = Math.min((W - 16) / FW, (H - 16) / (FL + NET_D * 2));
      ox = (W - FW * sc) / 2; oy = (H - FL * sc) / 2;
      fieldCache = null;
    }
    resize();
    const ro = new ResizeObserver(resize); ro.observe(wrap);
    const PX = x => ox + x * sc, PY = y => oy + y * sc;

    // ---------------- agentes (jogadores) ----------------
    const agents = [];
    teams.forEach((t, side) => {
      const lines = FORMATIONS[t.formation].slots;
      const count = {}; lines.forEach(l => { count[l] = (count[l] || 0) + 1; });
      const seen = {};
      lines.forEach((line, i) => {
        const k = seen[line] = (seen[line] || 0) + 1, n = count[line];
        const p = t.players[i];
        const r = p.rating[line] || 50;
        agents.push({
          side, line, name: p.name, shirt: p.shirt ?? i + 1, uid: p.uid,
          ax: n === 1 ? FW / 2 : FW / 2 + (k - (n + 1) / 2) * 17, ad: ANCHOR[line],
          x: FW / 2, y: FL / 2, vx: 0, vy: 0, hx: 0, hy: fwd(side),
          speed: line === 'GOL' ? 7 : clamp(6.6 + (r - 55) * 0.06, 6.2, 9.4),
          skill: r,
          wx: 0, wy: 0, wt: 0,       // deslocamento livre (cada um se move por conta própria)
          run: null, runT: 0,        // infiltração / desmarque
          stun: 0, down: 0, glow: 0, dive: 0, diveX: 0, label: 0, out: false, gone: false,
          set: null,                 // posição imposta por um roteiro (bola parada, saída etc.)
          think: rnd(0.3, 0.9), lane: FW / 2,
        });
      });
    });
    agents.forEach(a => { const p = anchorPos(a, 0, Math.min(0, FL / 2 - 3 - a.ad)); a.x = p.x; a.y = p.y; });
    const outfield = s => agents.filter(a => a.side === s && !a.gone && a.line !== 'GOL');
    const keeperOf = s => agents.find(a => a.side === s && a.line === 'GOL' && !a.gone) || outfield(s)[0];
    const findAgent = (s, name) => agents.find(a => a.side === s && !a.gone && a.name === name && a.line !== 'GOL')
      || agents.find(a => a.side === s && !a.gone && a.name === name)
      || outfield(s).sort((a, b) => (b.line === 'ATA') - (a.line === 'ATA'))[0];
    const nearest = (list, p) => list.reduce((best, a) => (!best || dist(a, p) < dist(best, p) ? a : best), null);

    function anchorPos(a, shiftX = 0, shiftD = 0) {
      const bx = a.side === 0 ? a.ax : FW - a.ax;
      const d = clamp(a.ad + shiftD, 1.5, FL - 4);
      return { x: clamp(bx + shiftX, 2.5, FW - 2.5), y: a.side === 0 ? FL - d : d };
    }

    // ---------------- bola ----------------
    const ball = { x: FW / 2, y: FL / 2, z: 0, vx: 0, vy: 0, vz: 0, owner: null, to: null, noTouch: null, noTouchT: 0, trail: [], spin: 0, lastSide: 0, inNet: false };
    let possSide = 0;                // time com a bola (ou o último a tocar)
    const giveBall = a => { if (!a) return; ball.owner = a; ball.to = null; ball.vx = ball.vy = ball.vz = 0; ball.z = 0; possSide = a.side; a.think = rnd(0.35, 0.8); };

    function kick(from, tx, ty, speed, { loft = 0, to = null } = {}) {
      const dx = tx - ball.x, dy = ty - ball.y, d = hyp(dx, dy) || 1;
      ball.vx = dx / d * speed; ball.vy = dy / d * speed; ball.vz = loft;
      ball.owner = null; ball.to = to; ball.noTouch = from; ball.noTouchT = 0.28; ball.lastSide = from ? from.side : possSide;
      if (speedMul < 4 && !skipping) sfx.kick();
    }
    /** Passe com antecipação: mira onde o companheiro vai estar. */
    function pass(from, to) {
      const d = dist(from, to);
      const speed = clamp(d * FRICTION + 5, 9, 26);
      const t = d / ((speed + 4) / 2);
      const tx = clamp(to.x + to.vx * t * 0.8, 1, FW - 1), ty = clamp(to.y + to.vy * t * 0.8, 1, FL - 1);
      kick(from, tx, ty, speed, { loft: d > 18 ? rnd(4, 7) : 0, to });
      from.think = rnd(0.4, 0.8);
    }

    // ---------------- roteiro (lances do motor) ----------------
    let script = null;               // { side, immune, shooter, dribbleTo, shot, freeze, chaser, victim }
    let simTime = 0, speedMul = 1, gameMin = 0, evIdx = 1, busy = false, finished = false, skipping = false;
    let wantSide = 0, wantSince = 0, pendingSteal = 0;
    const waiters = [];
    const simWait = s => new Promise(r => waiters.push({ t: simTime + s, r }));
    const until = (cond, timeout) => new Promise(r => waiters.push({ cond, t: simTime + timeout, r }));
    const flushWaiters = () => { while (waiters.length) waiters.shift().r(false); };

    /** Posse desejada pelo motor numa janela de minutos (evita troca frenética). */
    function desiredSide(min) {
      let c0 = 0, n = 0;
      for (let m = min - 2; m <= min + 2; m++) { const v = result.possession[clamp(m, 1, 90)]; if (v === 0) c0++; n++; }
      return c0 * 2 >= n ? 0 : 1;
    }

    // ============================================================
    //  IA DE CADA JOGADOR
    // ============================================================
    function steer(a, tx, ty, dt, urgency = 1) {
      const dx = tx - a.x, dy = ty - a.y, d = hyp(dx, dy);
      const max = a.speed * urgency * (a.stun > 0 ? 0.25 : 1) * (a.down > 0 ? 0 : 1);
      const want = Math.min(max, d * 2.2);
      let dvx = (d > 0.01 ? dx / d * want : 0) - a.vx, dvy = (d > 0.01 ? dy / d * want : 0) - a.vy;
      const acc = (a.line === 'GOL' && a.dive > 0 ? 60 : 24) * dt, dl = hyp(dvx, dvy);
      if (dl > acc) { dvx *= acc / dl; dvy *= acc / dl; }
      a.vx += dvx; a.vy += dvy;
    }

    function thinkCarrier(a, dt) {
      const s = a.side, gy = attackY(s), f = fwd(s);
      const dGoal = Math.abs(a.y - gy);
      a.think -= dt;
      if (a.line === 'GOL') {
        steer(a, FW / 2, ownY(s) + f * 3, dt, 0.6);
        if (a.think <= 0 && !(script && script.side === s)) {
          const mate = outfield(s).filter(m => !m.down).sort((p, q) => (q.line === 'DEF') - (p.line === 'DEF') || rnd(-1, 1))[0];
          if (mate) pass(a, mate);
        }
        return;
      }
      // conduz: para frente, numa "faixa" que muda de tempos em tempos
      if (a.think < 0.15 && Math.random() < 0.02) a.lane = clamp(FW / 2 + rnd(-14, 14), 5, FW - 5);
      let tx = a.lane, ty = a.y + f * 9;
      const scripted = script && script.side === s && script.shooter === a && script.dribbleTo;
      if (scripted) { tx = script.dribbleTo.x; ty = script.dribbleTo.y; }
      else if (dGoal < 21) ty = a.y;                                       // sem roteiro, não finaliza: gira o jogo
      const opp = nearest(agents.filter(o => o.side !== s && !o.gone), a);
      if (opp && dist(opp, a) < 4.5 && !scripted) tx += (a.x - opp.x >= 0 ? 7 : -7);   // drible: foge do marcador
      steer(a, clamp(tx, 2, FW - 2), clamp(ty, 2, FL - 2), dt, scripted ? 0.95 : 0.8);

      if (script && script.side === s) return;                             // o roteiro decide o passe
      const pressured = opp && dist(opp, a) < 3.2;
      const turnover = wantSide !== s && simTime - wantSince > 1.0;
      if (a.think > 0 && !(pressured && a.think < 0.3) && !turnover) return;
      const mates = agents.filter(m => m.side === s && m !== a && !m.gone && !m.down);
      if (turnover && mates.length) {
        // passe interceptado: a bola vai para o adversário mais perto da linha de passe
        const mate = mates[Math.floor(Math.random() * mates.length)];
        const mid = { x: (a.x + mate.x) / 2, y: (a.y + mate.y) / 2 };
        const thief = nearest(agents.filter(o => o.side !== s && !o.gone && o.line !== 'GOL'), mid);
        if (thief) { kick(a, thief.x + thief.vx * 0.3, thief.y + thief.vy * 0.3, clamp(dist(a, thief) * FRICTION + 4, 8, 22), { to: thief }); pendingSteal = 0; return; }
      }
      let best = null, bestScore = -1e9;
      for (const m of mates) {
        if (m.line === 'GOL' && Math.abs(a.y - ownY(s)) > 22) continue;
        const progress = (m.y - a.y) * f;                                    // positivo = para frente
        const openness = Math.min(8, Math.min(...agents.filter(o => o.side !== s && !o.gone).map(o => dist(o, m))));
        const d = dist(a, m);
        const score = progress * 0.5 + openness * 1.1 - Math.abs(d - 13) * 0.25 + rnd(-2, 2) - (m.line === 'GOL' ? 6 : 0);
        if (score > bestScore) { bestScore = score; best = m; }
      }
      a.think = rnd(0.5, 1.3);
      if (best && (pressured || dGoal < 23 || Math.random() < 0.55)) pass(a, best);
    }

    function thinkOffBall(a, dt) {
      const s = a.side, att = possSide === s, f = fwd(s);
      // cada jogador "passeia" um pouco por conta própria
      a.wt -= dt;
      if (a.wt <= 0) { a.wt = rnd(1.1, 2.6); a.wx = rnd(-3.5, 3.5); a.wy = rnd(-3, 3); }
      const ballD = s === 0 ? FL - ball.y : ball.y;        // distância da bola ao próprio gol
      let shiftD = (ballD - FL / 2) * 0.55 + (att ? 5 : -3);
      let shiftX = (ball.x - FW / 2) * (att ? 0.35 : 0.5);
      if (a.line === 'DEF') shiftD = Math.min(shiftD, att ? 18 : 10);
      let { x, y } = anchorPos(a, shiftX + a.wx, shiftD + a.wy);
      let urg = 0.75;

      if (att) {
        // infiltração: atacantes e meias atacam o espaço
        a.runT -= dt;
        if (a.runT <= 0) {
          a.runT = rnd(1.4, 3);
          const carrier = ball.owner;
          a.run = (a.line === 'ATA' || (a.line === 'MEI' && Math.random() < 0.5)) && carrier && Math.random() < 0.55
            ? { x: clamp(carrier.x + rnd(-14, 14), 4, FW - 4), y: clamp(carrier.y + f * rnd(9, 17), 7, FL - 7) } : null;
        }
        if (a.run) { x = a.run.x; y = a.run.y; urg = 0.95; }
        // quem vai receber o passe ataca a bola
        if (ball.to === a && !ball.owner) { x = ball.x + ball.vx * 0.25; y = ball.y + ball.vy * 0.25; urg = 1.05; }
      } else {
        // marcação: perto do atacante mais próximo, entre ele e o gol
        const mark = nearest(agents.filter(o => o.side !== s && !o.gone && o !== ball.owner && o.line !== 'GOL'), { x, y });
        if (mark && dist(mark, { x, y }) < 11) {
          const gx = FW / 2, gy = ownY(s), md = hyp(gx - mark.x, gy - mark.y) || 1;
          x = x * 0.35 + (mark.x + (gx - mark.x) / md * 2.2) * 0.65;
          y = y * 0.35 + (mark.y + (gy - mark.y) / md * 2.2) * 0.65;
          urg = 0.9;
        }
      }
      steer(a, x, y, dt, urg);
    }

    function thinkKeeper(a, dt) {
      const s = a.side, gy = ownY(s), f = fwd(s);          // f aponta do próprio gol para o campo
      if (a.dive > 0) { steer(a, a.diveX, gy + f * 0.8, dt, 1.9); return; }
      const ballNear = Math.abs(ball.y - gy) < 24;
      const x = clamp(FW / 2 + (ball.x - FW / 2) * (ballNear ? 0.32 : 0.15), GX0 + 0.6, GX1 - 0.6);
      steer(a, x, gy + f * (ballNear ? 2.4 : 1.4), dt, 0.9);
    }

    function pressers(s) {
      // defensores mais próximos da bola: um pressiona, outro cobre
      const list = outfield(s).filter(a => !a.down && !a.set).sort((a, b) => dist(a, ball) - dist(b, ball));
      return { press: list[0], cover: list[1] };
    }

    // ============================================================
    //  PASSO DE SIMULAÇÃO
    // ============================================================
    function update(dt) {
      simTime += dt;
      for (let i = waiters.length - 1; i >= 0; i--) {
        const w = waiters[i];
        if ((w.cond && w.cond()) || simTime >= w.t) { waiters.splice(i, 1); w.r(!!(w.cond && w.cond())); }
      }

      // relógio + lances
      if (!busy && !finished && !script) {
        gameMin = Math.min(90, gameMin + dt / SEC_PER_MIN);
        minEl.textContent = `${Math.floor(gameMin)}'`;
        const ev = result.events[evIdx];
        if (ev && ev.min <= gameMin) { evIdx++; busy = true; runEvent(ev).finally(() => { busy = false; }); }
        const want = desiredSide(Math.max(1, Math.floor(gameMin)));
        if (want !== wantSide && simTime - wantSince > 2.2) { wantSide = want; wantSince = simTime; }
      }

      const attacking = possSide;
      const def = 1 - attacking;
      const { press, cover } = ball.owner ? pressers(def) : { press: null, cover: null };
      const loose = !ball.owner && (!ball.to || hyp(ball.vx, ball.vy) < 2.5) && !ball.inNet && !(script && script.shot && !script.shot.done);
      const chasers = loose ? [0, 1].map(s => nearest(outfield(s).filter(a => !a.down && !a.set), ball)) : [];

      for (const a of agents) {
        if (a.gone) continue;
        a.stun = Math.max(0, a.stun - dt); a.down = Math.max(0, a.down - dt); a.glow = Math.max(0, a.glow - dt * 0.7);
        a.label = Math.max(0, a.label - dt); a.dive = Math.max(0, a.dive - dt);
        if (a.out) {                                        // expulso: sai pela lateral
          steer(a, a.side === 0 ? -4 : FW + 4, a.y, dt, 0.5);
          if (a.x < -2 || a.x > FW + 2) a.gone = true;
        } else if (a.set) {
          steer(a, a.set.x, a.set.y, dt, a.set.urg || 0.9);
        } else if (script && script.freeze) {
          steer(a, a.x, a.y, dt, 0.3);
        } else if (ball.owner === a) {
          thinkCarrier(a, dt);
        } else if (a.line === 'GOL') {
          thinkKeeper(a, dt);
        } else if (script && script.chaser === a && script.victim) {
          steer(a, script.victim.x, script.victim.y, dt, 1.25);
        } else if (chasers.includes(a)) {
          steer(a, ball.x + ball.vx * 0.2, ball.y + ball.vy * 0.2, dt, 1.05);
        } else if (a === press && ball.owner && !(script && script.immune)) {
          const c = ball.owner;   // o dono da bola pode mudar dentro do próprio passo
          steer(a, c.x + c.vx * 0.35, c.y + c.vy * 0.35, dt, wantSide === a.side ? 1.15 : 0.95);
        } else if (a === cover && ball.owner) {
          const gy = ownY(a.side);
          steer(a, ball.x * 0.6 + FW / 2 * 0.4, ball.y + (gy - ball.y) * 0.3, dt, 0.9);
        } else {
          thinkOffBall(a, dt);
        }
      }

      // separação (ninguém atravessa ninguém) + integração
      for (let i = 0; i < agents.length; i++) {
        const a = agents[i]; if (a.gone) continue;
        for (let j = i + 1; j < agents.length; j++) {
          const b = agents[j]; if (b.gone) continue;
          const dx = b.x - a.x, dy = b.y - a.y, d = hyp(dx, dy);
          if (d > 0 && d < DISC * 2) {
            if ((a === ball.owner || b === ball.owner) && a.side !== b.side) continue;   // o marcador pode encostar no portador
            const push = (DISC * 2 - d) * 7 * dt, nx = dx / d, ny = dy / d;
            a.vx -= nx * push; a.vy -= ny * push; b.vx += nx * push; b.vy += ny * push;
          }
        }
      }
      for (const a of agents) {
        if (a.gone) continue;
        a.x += a.vx * dt; a.y += a.vy * dt;
        if (!a.out) { a.x = clamp(a.x, 0.6, FW - 0.6); a.y = clamp(a.y, a.line === 'GOL' ? -0.5 : 0.6, a.line === 'GOL' ? FL + 0.5 : FL - 0.6); }
        const sp = hyp(a.vx, a.vy);
        if (sp > 0.6) { a.hx += (a.vx / sp - a.hx) * 0.2; a.hy += (a.vy / sp - a.hy) * 0.2; }
      }

      // roubada de bola: o marcador encosta no portador quando o motor manda trocar a posse
      if (ball.owner && press && press.side !== ball.owner.side && !(script && script.immune) && wantSide === press.side && dist(press, ball.owner) < TOUCH * 0.75) {
        const victim = ball.owner;
        giveBall(press); victim.stun = 0.6; press.glow = 0.4;
        if (!skipping && speedMul < 4) sfx.tap();
      }

      updateBall(dt);
    }

    function updateBall(dt) {
      ball.noTouchT = Math.max(0, ball.noTouchT - dt);
      if (ball.owner) {
        const a = ball.owner;
        const sp = hyp(a.vx, a.vy);
        ball.spin += sp * dt * 3;
        const touch = DISC + 0.45 + Math.sin(simTime * 9) * 0.3 * Math.min(1, sp / 5);   // toquinhos na condução
        ball.x = a.x + a.hx * touch; ball.y = a.y + a.hy * touch; ball.z = 0;
        ball.vx = a.vx; ball.vy = a.vy;
      } else if (!ball.inNet) {
        const air = ball.z > 0.05;
        const k = Math.exp(-FRICTION * dt * (air ? 0.15 : 1));
        ball.vx *= k; ball.vy *= k;
        ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        if (air || ball.vz > 0) {
          ball.vz -= GRAVITY * dt; ball.z += ball.vz * dt;
          if (ball.z < 0) { ball.z = 0; ball.vz = -ball.vz * 0.4; if (ball.vz < 1.2) ball.vz = 0; }
        }
        ball.spin += hyp(ball.vx, ball.vy) * dt * 3;
        // laterais: a bola bate na "mureta" (futebol de botão)
        if (ball.x < 0.3) { ball.x = 0.3; ball.vx = Math.abs(ball.vx) * 0.55; }
        if (ball.x > FW - 0.3) { ball.x = FW - 0.3; ball.vx = -Math.abs(ball.vx) * 0.55; }
        const shot = script && script.shot && !script.shot.done ? script.shot : null;
        if (shot) checkShot(shot);
        else {
          if (ball.y < 0.3) { ball.y = 0.3; ball.vy = Math.abs(ball.vy) * 0.5; }
          if (ball.y > FL - 0.3) { ball.y = FL - 0.3; ball.vy = -Math.abs(ball.vy) * 0.5; }
        }
        // domínio
        if (!(shot && !shot.done)) {
          for (const a of agents) {
            if (a.gone || a.out || a.down > 0 || a.stun > 0.3) continue;
            if (a === ball.noTouch && ball.noTouchT > 0) continue;
            if (ball.to && ball.to !== a && hyp(ball.vx, ball.vy) > 3.5) continue;
            if (ball.z < 1.3 && dist(a, ball) < DISC + (a.line === 'GOL' ? 0.9 : 0.5)) { giveBall(a); break; }
          }
        }
      }
      ball.trail.push({ x: ball.x, y: ball.y, z: ball.z });
      if (ball.trail.length > 10) ball.trail.shift();
    }

    // ---------------- chute: acompanha até o desfecho ----------------
    function checkShot(shot) {
      const gy = attackY(shot.side), f = fwd(shot.side);
      const past = f < 0 ? ball.y < gy : ball.y > gy;
      const keeper = keeperOf(1 - shot.side);
      if (shot.type === 'save' && keeper && dist(keeper, ball) < DISC + 0.8 && ball.z < 2.4) {
        // defesa: espalma para o lado
        ball.vx = (ball.x >= keeper.x ? 1 : -1) * rnd(8, 12); ball.vy = -f * rnd(5, 8); ball.vz = rnd(2, 4);
        keeper.glow = 1.2; shot.done = true; shot.at = { x: ball.x, y: ball.y }; return;
      }
      if (shot.type === 'save' && Math.abs(ball.y - gy) < 1.2 && keeper) {   // garante a defesa
        keeper.x = ball.x - Math.sign(ball.vx || 1) * 0.6; keeper.y = ball.y - f * 0.4;
        return;
      }
      if (past) resolveShot(shot);
    }
    function resolveShot(shot) {
      const gy = attackY(shot.side), f = fwd(shot.side);
      if (shot.type === 'save') {
        const keeper = keeperOf(1 - shot.side);
        ball.x = keeper ? keeper.x + 0.8 : ball.x; ball.y = gy - f * 1.5;
        ball.vx = rnd(-9, 9); ball.vy = -f * rnd(5, 8); ball.vz = 2;
        if (keeper) keeper.glow = 1.2;
        shot.done = true; shot.at = { x: ball.x, y: ball.y }; return;
      }
      if (shot.type === 'goal') {
        ball.inNet = true; ball.y = gy + f * (NET_D - 0.5); ball.x = clamp(ball.x, GX0 + 0.5, GX1 - 0.5);
        ball.vx = ball.vy = ball.vz = 0; ball.z = 0.3; shot.done = true; shot.at = { x: ball.x, y: gy };
        netShake[shot.side === 0 ? 0 : 1] = 1;
      } else if (shot.type === 'post') {
        ball.y = gy - f * 0.3; ball.vy = -ball.vy * 0.55; ball.vx = (ball.x < FW / 2 ? 1 : -1) * rnd(3, 7); ball.vz = 1.5;
        shot.done = true; shot.at = { x: ball.x, y: gy }; postFlash = { x: ball.x < FW / 2 ? GX0 : GX1, y: gy, t: 0.6 };
      } else {
        ball.vx *= 0.3; ball.vy *= 0.2; ball.y = gy + f * 1.5; ball.z = 0; ball.vz = 0;
        shot.done = true; shot.at = { x: ball.x, y: gy };
      }
    }

    // ---------------- posições de bola parada ----------------
    function setKickoff(side) {
      const taker = outfield(side).sort((a, b) => (b.line === 'ATA') - (a.line === 'ATA') || b.skill - a.skill)[0];
      for (const a of agents) {
        if (a.gone) continue;
        const d = a === taker ? FL / 2 - 0.6 : Math.min(a.ad, FL / 2 - (a.side === side ? 2.5 : CIRCLE_R + 1.5));
        const bx = a.side === 0 ? a.ax : FW - a.ax;
        a.set = a === taker ? { x: FW / 2 + 0.9, y: a.side === 0 ? FL / 2 + 0.6 : FL / 2 - 0.6, urg: 1.2 } : { x: bx, y: a.side === 0 ? FL - d : d, urg: 1.2 };
        a.run = null; a.dive = 0;
      }
      return taker;
    }
    async function kickoff(side) {
      script = { freeze: false, side, immune: true };
      ball.owner = null; ball.to = null; ball.inNet = false; ball.vx = ball.vy = ball.vz = 0; ball.z = 0;
      ball.x = FW / 2; ball.y = FL / 2; ball.trail = [];
      const taker = setKickoff(side);
      await until(() => agents.every(a => a.gone || !a.set || dist(a, a.set) < 1.4), 2.4);
      agents.forEach(a => { if (a.set && !a.gone) { a.x = a.set.x; a.y = a.set.y; a.vx = a.vy = 0; } a.set = null; });
      giveBall(taker);
      possSide = side; wantSide = side; wantSince = simTime;
      if (!skipping) sfx.whistle(1);
      await simWait(0.25);
      script = null;
    }

    // ============================================================
    //  ROTEIROS DOS LANCES
    // ============================================================
    async function gainPossession(s) {
      if (ball.owner && ball.owner.side === s) return;
      wantSide = s; wantSince = simTime - 5;
      const ok = await until(() => ball.owner && ball.owner.side === s, 2.2);
      if (!ok && !skipping) giveBall(nearest(outfield(s), ball));      // dividida ganha
    }

    async function attack(ev) {
      const s = ev.team;
      script = { side: s, immune: false };
      await gainPossession(s);
      if (skipping) return;
      script.immune = true;
      const shooter = findAgent(s, ev.shooter);
      script.shooter = shooter; shooter.label = 6;
      const gy = attackY(s), f = fwd(s);
      if (ev.penalty) return penalty(ev, shooter);

      // o finalizador se apresenta; o portador toca para ele (às vezes uma tabela antes)
      if (ball.owner !== shooter) {
        shooter.set = { x: clamp(FW / 2 + (ev.x - 0.5) * 22, 6, FW - 6), y: gy - f * rnd(17, 22), urg: 1.05 };
        await simWait(0.45);
        if (skipping) return;
        shooter.set = null;
        if (ball.owner && ball.owner !== shooter) pass(ball.owner, shooter);
        const ok = await until(() => ball.owner === shooter, 2.6);
        if (!ok && !skipping) giveBall(shooter);
      }
      if (skipping) return;
      // conduz até a zona de chute, passando pela marcação
      script.dribbleTo = { x: clamp(FW / 2 + (ev.x - 0.5) * 18, 8, FW - 8), y: gy - f * rnd(11.5, 16) };
      await until(() => dist(shooter, script.dribbleTo) < 2, 2.4);
      if (skipping) return;
      await shoot(ev, shooter);
    }

    async function shoot(ev, shooter) {
      const s = shooter.side, gy = attackY(s), f = fwd(s);
      const keeper = keeperOf(1 - s);
      const left = ev.x < 0.5;
      const corner = left ? GX0 + rnd(0.7, 1.6) : GX1 - rnd(0.7, 1.6);
      let tx = corner, ty = gy + f * 1.5, loft = rnd(1, 3.5), speed = rnd(24, 30);
      if (ev.type === 'post') { tx = left ? GX0 : GX1; ty = gy + f * 0.5; loft = rnd(1, 2.5); }
      if (ev.type === 'miss') {
        if (Math.random() < 0.45) { tx = clamp(corner + rnd(-1.5, 1.5), GX0, GX1); loft = rnd(7.5, 9.5); }   // por cima
        else { tx = left ? GX0 - rnd(1.5, 4) : GX1 + rnd(1.5, 4); }
      }
      // reação do goleiro: na defesa ele voa; no gol chega atrasado ou vai no canto errado
      if (keeper) {
        if (ev.type === 'save') { keeper.dive = 1.2; keeper.diveX = tx; }
        else if (ev.type === 'goal') { keeper.dive = 1.0; keeper.diveX = Math.random() < 0.5 ? FW - tx : FW / 2 + (tx - FW / 2) * 0.35; }
        else { keeper.dive = 0.6; keeper.diveX = FW / 2 + (tx - FW / 2) * 0.5; }
      }
      script.shot = { type: ev.type, side: s, done: false };
      kick(shooter, tx, ty, speed, { loft });
      shooter.glow = 0.8;
      await until(() => script.shot.done, 2.5);
      if (!script.shot.done && !skipping) resolveShot(script.shot);   // garante o desfecho combinado com o motor
      return script.shot;
    }

    async function penalty(ev, shooter) {
      const s = ev.team, gy = attackY(s), f = fwd(s);
      if (!skipping) { sfx.whistle(2); haptic(30); }
      const spot = { x: FW / 2, y: gy - f * SPOT };
      const close = !skipping ? bigText('PÊNALTI!', 'half', esc(teams[s].name)) : null;
      ball.owner = null; ball.to = null; ball.vx = ball.vy = 0;
      // todos fora da área; goleiro na linha; cobrador atrás da bola
      const keeper = keeperOf(1 - s);
      for (const a of agents) {
        if (a.gone) continue;
        if (a === shooter) a.set = { x: spot.x - 1.5, y: spot.y - f * 3.5, urg: 1.1 };
        else if (a === keeper) a.set = { x: FW / 2, y: gy + f * 0.4, urg: 1 };
        else if (a.line === 'GOL') a.set = { x: a.x, y: a.y, urg: 0.6 };
        else a.set = { x: clamp(a.x, 4, FW - 4), y: gy - f * (BOX_D + rnd(1.5, 4)), urg: 1 };
      }
      await simWait(0.2); ball.x = spot.x; ball.y = spot.y; ball.z = 0;
      await until(() => agents.every(a => a.gone || !a.set || dist(a, a.set) < 1.3), 2.2);
      close && close();
      if (skipping) return;
      await simWait(0.5);
      shooter.set = { x: spot.x, y: spot.y - f * 0.6, urg: 0.9 };             // corrida
      await until(() => dist(shooter, ball) < DISC + 0.4, 1.4);
      agents.forEach(a => { a.set = null; });
      if (skipping) return;
      await shoot(ev, shooter);
    }

    async function foul(ev) {
      const d = ev.team, s = 1 - d;                     // d cometeu a falta
      if (!(ball.owner && ball.owner.side === s)) giveBall(nearest(outfield(s), ball));
      const victim = ball.owner;
      const fouler = findAgent(d, ev.player);
      script = { side: s, immune: true, chaser: fouler, victim };
      await until(() => dist(fouler, victim) < TOUCH * 0.8, 1.4);
      if (skipping) { script = null; return; }
      victim.down = 1.3; victim.stun = 1.3; fouler.stun = 0.6; fouler.vx *= -0.3; fouler.vy *= -0.3;
      const p = toScreen(victim.x, victim.y);
      burst(p.x, p.y, { colors: ['#fff', '#ffd27a'], count: 16, speed: 4, size: 1.8 });
      sfx.whistle(1); haptic(25);
      script.freeze = true; script.chaser = null;
      if (ev.type === 'yellow' || ev.type === 'red') {
        sfx.card();
        const close = bigText(`<span class="cardico ${ev.type}"></span>`, `booking ${ev.type}`, esc(ev.player));
        await simWait(1.1); close();
        if (ev.type === 'red') { fouler.out = true; fouler.label = 3; }
      } else await simWait(0.7);
      script = null;
      if (victim.side === s) giveBall(victim);
    }

    // ============================================================
    //  EXECUÇÃO DE CADA EVENTO
    // ============================================================
    const addFeed = (min, html, cls = '') => {
      const line = document.createElement('div');
      line.className = `fd ${cls}`;
      line.innerHTML = `<b>${min}'</b><span>${html}</span>`;
      feed.prepend(line);
      while (feed.children.length > 4) feed.lastChild.remove();
    };
    const teamName = s => esc(teams[s].abbr);
    const toScreen = (x, y) => { const r = canvas.getBoundingClientRect(); return { x: r.left + PX(x), y: r.top + PY(y) }; };

    function bigText(text, cls, sub = '', card = null) {
      const el = document.createElement('div');
      el.className = `mt-big ${cls}`;
      el.innerHTML = `<div class="mb-t">${text}</div>${sub ? `<div class="mb-s">${sub}</div>` : ''}${card ? `<div class="mb-card">${cardHTML(card, { size: 'md', live: true })}</div>` : ''}`;
      fxLayer.appendChild(el);
      const c = el.querySelector('.card');
      const stop = c ? attachTilt(c, { max: 16 }) : null;
      return () => { el.classList.add('out'); stop && stop(); setTimeout(() => el.remove(), 400); };
    }

    let goalsShown = [0, 0];
    async function runEvent(ev) {
      if (skipping) return;
      const mine = ev.team === userSide;
      switch (ev.type) {
        case 'goal': case 'save': case 'post': case 'miss': {
          await attack(ev);
          if (skipping) { script = null; return; }
          const at = script && script.shot && script.shot.at ? toScreen(script.shot.at.x, script.shot.at.y) : toScreen(FW / 2, attackY(ev.team));
          if (ev.type === 'goal') {
            goalsShown[ev.team] = ev.score[ev.team];
            const sd = node.querySelector(`.sd[data-s="${ev.team}"]`);
            sd.textContent = ev.score[ev.team]; sd.classList.add('pop'); setTimeout(() => sd.classList.remove('pop'), 900);
            addFeed(ev.min, `<em class="g">GOL</em> ${esc(ev.shooter)} (${teamName(ev.team)})${ev.penalty ? ' de pênalti' : ''}${ev.assist ? ` · assist. ${esc(ev.assist)}` : ''}`, 'goal');
            shakeT = 1;
            const t = teams[ev.team];
            burst(at.x, at.y, { colors: ['#fff', KIT[ev.team][0], KIT[ev.team][1], '#FFC940'], count: 150, speed: 13, shape: 'star', size: 3, angle: ev.team === 0 ? Math.PI / 2 : -Math.PI / 2, spread: Math.PI * 1.4 });
            node.classList.add('flash-goal', mine ? 'mine' : 'theirs');
            sfx.goal(); haptic(mine ? [60, 40, 120, 40, 200] : [40]);
            if (mine) confetti(['#FF8A1F', '#FFC940', teams[ev.team].colors[0], '#fff']);
            // comemoração: o artilheiro corre para a bandeirinha e o time vai atrás
            const scorer = script.shooter;
            const flag = { x: scorer.x < FW / 2 ? 1.5 : FW - 1.5, y: attackY(ev.team) - fwd(ev.team) * 1.5 };
            agents.filter(a => a.side === ev.team && !a.gone && a.line !== 'GOL').forEach((a, i) => {
              a.set = a === scorer ? { ...flag, urg: 1.1 } : { x: flag.x + (flag.x < FW / 2 ? 1 : -1) * (2 + i * 1.6), y: flag.y - fwd(ev.team) * (1.5 + i), urg: 1 };
            });
            scorer.glow = 3; scorer.label = 4;
            script.freeze = false;
            const card = ev.shooterUid ? CARD_BY_UID[ev.shooterUid] : null;
            const close = bigText(ev.penalty ? 'GOOOL<br><small>DE PÊNALTI</small>' : 'GOOOOL!', `goal ${mine ? 'mine' : 'theirs'}`,
              `${esc(ev.shooter)} · ${esc(teams[ev.team].name)}${ev.assist ? `<br><small>Assistência: ${esc(ev.assist)}</small>` : ''}`, card);
            await simWait(card ? 2.6 : 2.0);
            close();
            node.classList.remove('flash-goal', 'mine', 'theirs');
            agents.forEach(a => { a.set = null; });
            await kickoff(1 - ev.team);
          } else if (ev.type === 'save') {
            addFeed(ev.min, `Defesa de ${esc(ev.keeper)} no chute de ${esc(ev.shooter)}`, 'save');
            sfx.save(); haptic(20);
            burst(at.x, at.y, { colors: ['#fff', '#7fe0ff'], count: 34, speed: 6 });
            const keeperMine = (1 - ev.team) === userSide;
            const card = ev.keeperUid && keeperMine ? CARD_BY_UID[ev.keeperUid] : null;
            const close = bigText('DEFESAÇA!', `save ${keeperMine ? 'mine' : ''}`, esc(ev.keeper), card);
            script.freeze = false; script.shooter = null; script.immune = true;
            await simWait(card ? 1.6 : 1.1); close();
            if (!ball.owner || ball.owner.side === ev.team) giveBall(keeperOf(1 - ev.team));
            script = null;
            wantSide = 1 - ev.team; wantSince = simTime;
          } else if (ev.type === 'post') {
            addFeed(ev.min, `Na trave! ${esc(ev.shooter)} quase marca${ev.luck ? ` · sorte de ${esc(ev.luck)}` : ''}`, 'post');
            sfx.clang(); shakeT = 0.5; haptic([20, 30, 20]);
            const close = bigText('NA TRAVE!', 'post', ev.luck ? `Sorte de ${esc(ev.luck)}!` : esc(ev.shooter));
            script.shooter = null; script.immune = false; script.shot = null;
            await simWait(1.0); close();
            script = null;
            wantSide = 1 - ev.team; wantSince = simTime - 5;
          } else {
            addFeed(ev.min, `${esc(ev.shooter)} chuta para fora`);
            sfx.ooh();
            const close = bigText('PRA FORA!', 'miss');
            await simWait(0.8); close();
            // tiro de meta
            script = { freeze: true, immune: true };
            const k = keeperOf(1 - ev.team);
            ball.inNet = false; ball.vx = ball.vy = ball.vz = 0; ball.z = 0;
            const dSide = 1 - ev.team;
            k.x = FW / 2 + rnd(-3, 3); k.y = ownY(dSide) + fwd(dSide) * SMALL_D;
            giveBall(k); k.think = 0.8;
            script = null;
            wantSide = 1 - ev.team; wantSince = simTime;
          }
          break;
        }
        case 'yellow': case 'red': case 'foul': {
          if (ev.type !== 'foul') addFeed(ev.min, `${ev.type === 'red' ? '🟥 Expulso' : '🟨 Amarelo'}: ${esc(ev.player)} (${teamName(ev.team)})${ev.second ? ' — segundo amarelo' : ''}`, ev.type);
          else addFeed(ev.min, `Falta de ${esc(ev.player)}`);
          await foul(ev);
          break;
        }
        case 'sub': {
          const a = findAgent(ev.team, ev.playerOut);
          if (a && a.name === ev.playerOut) { a.name = ev.playerIn; a.uid = ev.inUid; a.shirt = (CARD_BY_UID[ev.inUid]?.shirt) ?? a.shirt; a.glow = 2; a.label = 3; a.speed += 0.4; }
          addFeed(ev.min, `🔁 ${teamName(ev.team)}: entra ${esc(ev.playerIn)}, sai ${esc(ev.playerOut)}`);
          const close = bigText('SUBSTITUIÇÃO', 'sub', `Entra ${esc(ev.playerIn)} · sai ${esc(ev.playerOut)}`);
          await simWait(0.9); close();
          break;
        }
        case 'half': {
          addFeed(45, `Intervalo: ${ev.score[0]} x ${ev.score[1]}`);
          sfx.whistle(2);
          const close = bigText('INTERVALO', 'half', `${ev.score[0]} x ${ev.score[1]}`);
          await simWait(1.3); close();
          await kickoff(1);
          break;
        }
        case 'end': {
          finished = true;
          minEl.textContent = "90'";
          sfx.whistle(3);
          addFeed(90, `Fim de jogo: ${ev.score[0]} x ${ev.score[1]}`);
          script = { freeze: true, immune: true };
          await simWait(1.2);
          showResult();
          break;
        }
      }
    }

    // ============================================================
    //  DESENHO
    // ============================================================
    let shakeT = 0, netShake = [0, 0], postFlash = null;
    function drawField() {
      fieldCache = document.createElement('canvas');
      fieldCache.width = canvas.width; fieldCache.height = canvas.height;
      const c = fieldCache.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.fillStyle = '#082a18'; c.fillRect(0, 0, W, H);
      const stripes = 12;
      for (let i = 0; i < stripes; i++) {
        c.fillStyle = i % 2 ? '#0b3a22' : '#0e4528';
        c.fillRect(PX(0), PY(FL / stripes * i), FW * sc, FL / stripes * sc + 1);
      }
      // vinheta das torcidas
      [[0, KIT[1]], [1, KIT[0]]].forEach(([top, k]) => {
        const col = k[0].toUpperCase() === '#FFFFFF' ? k[1] : k[0];
        const g = c.createLinearGradient(0, top ? PY(FL) : PY(0), 0, top ? PY(FL * 0.7) : PY(FL * 0.3));
        g.addColorStop(0, col + '50'); g.addColorStop(1, col + '00');
        c.fillStyle = g; c.fillRect(PX(0), top ? PY(FL * 0.7) : PY(0), FW * sc, FL * 0.3 * sc);
      });
      c.strokeStyle = 'rgba(235,255,245,.88)'; c.lineWidth = Math.max(1.5, sc * 0.12);
      c.shadowColor = 'rgba(120,255,190,.75)'; c.shadowBlur = 8;
      c.strokeRect(PX(0), PY(0), FW * sc, FL * sc);
      c.beginPath(); c.moveTo(PX(0), PY(FL / 2)); c.lineTo(PX(FW), PY(FL / 2)); c.stroke();
      c.beginPath(); c.arc(PX(FW / 2), PY(FL / 2), CIRCLE_R * sc, 0, Math.PI * 2); c.stroke();
      [0, FL].forEach(gy => {
        const dir = gy === 0 ? 1 : -1;
        c.strokeRect(PX((FW - BOX_W) / 2), PY(Math.min(gy, gy + dir * BOX_D)), BOX_W * sc, BOX_D * sc);
        c.strokeRect(PX((FW - SMALL_W) / 2), PY(Math.min(gy, gy + dir * SMALL_D)), SMALL_W * sc, SMALL_D * sc);
        c.beginPath(); c.arc(PX(FW / 2), PY(gy + dir * SPOT), Math.max(1.5, sc * 0.18), 0, Math.PI * 2); c.fillStyle = 'rgba(235,255,245,.9)'; c.fill();
        c.beginPath(); c.arc(PX(FW / 2), PY(gy + dir * SPOT), 7 * sc, dir > 0 ? 0.2 * Math.PI : 1.2 * Math.PI, dir > 0 ? 0.8 * Math.PI : 1.8 * Math.PI); c.stroke();
      });
      [[0, 0], [FW, 0], [0, FL], [FW, FL]].forEach(([x, y]) => { c.beginPath(); c.arc(PX(x), PY(y), 1.2 * sc, 0, Math.PI * 2); c.stroke(); });
      c.shadowBlur = 0;
      c.fillStyle = 'rgba(255,255,255,.06)'; c.font = `800 ${Math.round(sc * 3)}px 'Barlow Condensed', sans-serif`; c.textAlign = 'center';
      c.fillText((home.stadiumName || '').toUpperCase(), PX(FW / 2), PY(FL / 2) + sc * 1);
    }

    function drawGoal(top, shake) {
      const y = top ? PY(0) : PY(FL), d = NET_D * sc, dir = top ? -1 : 1;
      const sx = shake > 0 ? Math.sin(simTime * 40) * 3 * shake : 0;
      const x0 = PX(GX0), w = GOAL_W * sc, yy = Math.min(y, y + dir * d);
      ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(x0 + sx, yy, w, d);
      ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 1;
      for (let i = 1; i < 10; i++) { ctx.beginPath(); ctx.moveTo(x0 + w * i / 10 + sx, y); ctx.lineTo(x0 + w * i / 10 + sx * 1.6, y + dir * d); ctx.stroke(); }
      for (let i = 1; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x0 + sx, y + dir * d * i / 3); ctx.lineTo(x0 + w + sx, y + dir * d * i / 3); ctx.stroke(); }
      ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(2.5, sc * 0.3); ctx.shadowColor = '#fff'; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0, y + dir * d); ctx.lineTo(x0 + w, y + dir * d); ctx.lineTo(x0 + w, y); ctx.stroke();
      ctx.shadowBlur = 0;
    }

    function draw() {
      if (!fieldCache) drawField();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(fieldCache, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.save();
      if (shakeT > 0) ctx.translate((Math.random() - 0.5) * 10 * shakeT, (Math.random() - 0.5) * 10 * shakeT);
      drawGoal(true, netShake[0]); drawGoal(false, netShake[1]);
      if (postFlash && postFlash.t > 0) {
        ctx.fillStyle = `rgba(255,255,255,${postFlash.t})`; ctx.beginPath(); ctx.arc(PX(postFlash.x), PY(postFlash.y), sc * 1.6, 0, Math.PI * 2); ctx.fill();
      }
      const r = Math.max(10, sc * DISC);
      // sombras
      for (const a of agents) {
        if (a.gone) continue;
        ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(PX(a.x) + 2, PY(a.y) + 3, r, r * 0.85, 0, 0, Math.PI * 2); ctx.fill();
      }
      // jogadores (botões)
      for (const a of agents.slice().sort((p, q) => p.y - q.y)) {
        if (a.gone) continue;
        const t = teams[a.side];
        const [c1, c2] = KIT[a.side];
        const cx = PX(a.x), cy = PY(a.y);
        ctx.save();
        ctx.translate(cx, cy);
        if (a.out) ctx.globalAlpha = 0.5;
        if (a.down > 0) { ctx.rotate(0.9); ctx.scale(1, 0.55); }
        if (a.dive > 0 && a.line === 'GOL') ctx.scale(1.35, 0.75);
        if (a.glow > 0) { ctx.shadowColor = '#FFC940'; ctx.shadowBlur = 22 * Math.min(1, a.glow); }
        const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
        g.addColorStop(0, '#ffffff'); g.addColorStop(0.2, c1); g.addColorStop(1, shade(c1));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.lineWidth = Math.max(2, r * 0.22);
        ctx.strokeStyle = a.line === 'GOL' ? '#FFC940' : (c2.toUpperCase() === c1.toUpperCase() ? '#fff' : c2);
        ctx.beginPath(); ctx.arc(0, 0, r - ctx.lineWidth / 2, 0, Math.PI * 2); ctx.stroke();
        // direção do olhar (bico do botão)
        const hl = hyp(a.hx, a.hy) || 1;
        ctx.fillStyle = 'rgba(255,255,255,.9)';
        ctx.beginPath(); ctx.arc(a.hx / hl * r * 0.78, a.hy / hl * r * 0.78, Math.max(1.6, r * 0.17), 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = textOn(c1); ctx.font = `800 ${Math.round(r * 0.95)}px 'Barlow Condensed', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(a.shirt), 0, 1);
        ctx.restore();
        if (t.user && !a.out) { ctx.strokeStyle = 'rgba(255,138,31,.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, r + 3.5, 0, Math.PI * 2); ctx.stroke(); }
        if (ball.owner === a) {
          ctx.strokeStyle = `rgba(255,255,255,${0.55 + Math.sin(simTime * 8) * 0.25})`; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(cx, cy, r + 5.5, 0, Math.PI * 2); ctx.stroke();
        }
        if (ball.owner === a || a.label > 0) {
          const name = a.out ? `${a.name} 🟥` : a.name;
          ctx.font = `700 ${Math.max(10, Math.round(r * 0.8))}px Barlow, sans-serif`;
          const tw = ctx.measureText(name).width + 10;
          const lx = clamp(cx, tw / 2 + 2, W - tw / 2 - 2), ly = cy - r - 12;
          ctx.fillStyle = 'rgba(3,6,12,.78)'; roundRect(lx - tw / 2, ly - 8, tw, 16, 8); ctx.fill();
          ctx.fillStyle = a.side === userSide ? '#ffd9b0' : '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(name, lx, ly + 0.5);
        }
      }
      // bola (com altura: a sombra fica no chão, a bola sobe)
      const br = Math.max(4.5, sc * 0.62);
      const bx = PX(ball.x), by = PY(ball.y), lift = ball.z * sc * 0.55;
      const fast = hyp(ball.vx, ball.vy) > 9;
      if (fast) ball.trail.forEach((p, i) => { ctx.fillStyle = `rgba(255,255,255,${(i / ball.trail.length) * 0.35})`; ctx.beginPath(); ctx.arc(PX(p.x), PY(p.y) - p.z * sc * 0.55, br * (0.4 + i / ball.trail.length * 0.5), 0, Math.PI * 2); ctx.fill(); });
      ctx.fillStyle = `rgba(0,0,0,${0.45 - Math.min(0.3, ball.z * 0.04)})`;
      ctx.beginPath(); ctx.ellipse(bx + 1.5, by + 2, br * (1 + ball.z * 0.06), br * 0.7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.translate(bx, by - lift); ctx.rotate(ball.spin);
      const bs = br * (1 + ball.z * 0.05);
      ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(0, 0, bs, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = '#1b2433';
      ctx.beginPath(); ctx.arc(0, 0, bs * 0.38, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 5; i++) { const an = i * Math.PI * 2 / 5; ctx.beginPath(); ctx.arc(Math.cos(an) * bs * 0.82, Math.sin(an) * bs * 0.82, bs * 0.18, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      ctx.restore();
    }
    function roundRect(x, y, w, h, r) {
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }

    // ============================================================
    //  LAÇO PRINCIPAL
    // ============================================================
    let last = performance.now();
    function frame(now) {
      if (!node.isConnected) return;
      const real = Math.min(0.05, (now - last) / 1000); last = now;
      let sim = real * speedMul;
      while (sim > 0) { const h = Math.min(1 / 90, sim); update(h); sim -= h; }
      shakeT = Math.max(0, shakeT - real * 2.2);
      netShake = netShake.map(v => Math.max(0, v - real * 1.2));
      if (postFlash) postFlash.t -= real * 1.5;
      const m = Math.max(1, Math.floor(gameMin));
      const p0 = result.possession.slice(1, m + 1).filter(x => x === 0).length + 1;
      possEl[0].style.flex = String(p0); possEl[1].style.flex = String(m + 2 - p0);
      draw();
      requestAnimationFrame(frame);
    }
    (async () => { await kickoff(0); })();
    requestAnimationFrame(t => { last = t; frame(t); });

    // ---------------- controles ----------------
    node.querySelector('.mt-speed').addEventListener('click', e => {
      const b = e.target.closest('[data-speed]'); if (!b) return;
      speedMul = +b.dataset.speed; sfx.tap();
      node.querySelectorAll('[data-speed]').forEach(x => x.classList.toggle('on', x === b));
    });
    node.querySelector('.mt-skip').addEventListener('click', () => {
      if (finished) return;
      skipping = true; finished = true; sfx.tap();
      flushWaiters();
      node.querySelectorAll('.mt-big').forEach(x => x.remove());
      for (let i = 1; i < result.events.length; i++) {
        const ev = result.events[i];
        if (ev.type === 'goal' && ev.score[ev.team] > goalsShown[ev.team]) addFeed(ev.min, `<em class="g">GOL</em> ${esc(ev.shooter)} (${teamName(ev.team)})`, 'goal');
      }
      node.querySelector('.sd[data-s="0"]').textContent = result.score[0];
      node.querySelector('.sd[data-s="1"]').textContent = result.score[1];
      minEl.textContent = "90'";
      script = { freeze: true, immune: true };
      showResult();
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

/** Anima números com data-count (moedas ganhas). */
function countUp(root) {
  root.querySelectorAll('[data-count]').forEach(el => {
    const target = +el.dataset.count; const t0 = performance.now() + 700;
    const step = t => {
      const p = Math.max(0, Math.min(1, (t - t0) / 1200));
      el.textContent = `+${Math.round(target * (1 - Math.pow(1 - p, 3)))}`;
      if (p < 1) requestAnimationFrame(step); else { sfx.coin(); el.parentNode.classList.add('done'); }
    };
    requestAnimationFrame(step);
  });
}
