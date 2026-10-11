// ============================================================
//  MODO CLUBE — disputa de pênaltis (mata-mata empatado)
//  Encena o resultado de penaltyShootout() cobrança a cobrança.
// ============================================================
import { crestMini } from './match.js';
import { burst, confetti, sfx, haptic } from '../fx.js';
import { esc } from '../ui.js';

const wait = ms => new Promise(r => setTimeout(r, ms));

/** Mostra a disputa dentro de `container`. Resolve quando o jogador toca em Continuar. */
export function runShootout(container, { home, away, shootout, userSide }) {
  return new Promise(resolve => {
    const teams = [home, away];
    const per = Math.max(5, Math.ceil(shootout.kicks.length / 2));
    const panel = document.createElement('div');
    panel.className = 'so';
    panel.innerHTML = `
      <div class="so-in">
        <div class="so-title">DISPUTA DE PÊNALTIS</div>
        <div class="so-score"><span data-g="0">0</span><i>x</i><span data-g="1">0</span></div>
        ${[0, 1].map(s => `
          <div class="so-row ${s === userSide ? 'mine' : ''}">
            ${crestMini(teams[s])}<b>${esc(teams[s].abbr)}</b>
            <div class="so-dots">${Array.from({ length: per }, (_, i) => `<i data-k="${s}-${i}"></i>`).join('')}</div>
          </div>`).join('')}
        <div class="so-goal">
          <div class="so-net"></div>
          <div class="so-keeper"></div>
          <div class="so-ball"></div>
        </div>
        <div class="so-call">&nbsp;</div>
        <div class="so-actions">
          <button class="link-btn so-skip">Pular</button>
          <button class="btn primary big so-go" hidden>Continuar</button>
        </div>
      </div>`;
    container.appendChild(panel);
    requestAnimationFrame(() => panel.classList.add('in'));
    const $ = s => panel.querySelector(s);
    let skip = false;
    $('.so-skip').addEventListener('click', () => { skip = true; sfx.tap(); });

    const count = [0, 0];
    const dirs = ['l', 'c', 'r'];
    (async () => {
      await wait(700);
      for (const k of shootout.kicks) {
        const n = count[k.side]++;
        const dot = panel.querySelector(`[data-k="${k.side}-${n}"]`);
        const g = $('.so-goal');
        if (!skip) {
          $('.so-call').innerHTML = `<b>${esc(k.taker)}</b> <span>(${esc(teams[k.side].abbr)})</span> vai para a cobrança…`;
          g.className = 'so-goal'; void g.offsetWidth;
          dot && dot.classList.add('now');
          sfx.charge();
          await wait(950);
          const shot = dirs[Math.floor(Math.random() * 3)];
          let dive = k.how === 'defesa' ? shot : dirs.filter(d => d !== shot)[Math.floor(Math.random() * 2)];
          if (k.how === 'fora' && Math.random() < 0.5) dive = shot;
          g.classList.add(`shot-${k.how === 'fora' ? 'out-' + shot : shot}`, `dive-${dive}`);
          sfx.kick();
          await wait(420);
        }
        dot && dot.classList.remove('now');
        dot && dot.classList.add(k.scored ? 'ok' : 'miss');
        $(`[data-g="${k.side}"]`).textContent = k.score[k.side];
        if (!skip) {
          const mine = k.side === userSide;
          const r = g.getBoundingClientRect();
          if (k.scored) {
            $('.so-call').innerHTML = `<b class="ok">GOL!</b> ${esc(k.taker)} converte.`;
            sfx.goal(); burst(r.left + r.width / 2, r.top + r.height * 0.4, { colors: mine ? ['#FFC940', '#fff', '#3ddc84'] : ['#fff', '#9fb3d6'], count: 40, speed: 7 });
            haptic(mine ? [30, 30, 60] : 20);
          } else {
            $('.so-call').innerHTML = k.how === 'defesa' ? `<b class="miss">DEFENDEU!</b> ${esc(k.keeper)} pega a cobrança!` : `<b class="miss">PRA FORA!</b> ${esc(k.taker)} desperdiça!`;
            k.how === 'defesa' ? sfx.save() : sfx.ooh();
            haptic([20, 40, 20]);
          }
          await wait(1100);
        }
      }
      const w = shootout.winner;
      const userWon = w === userSide;
      $('.so-call').innerHTML = `<b class="${userWon ? 'ok' : 'miss'}">${esc(teams[w].name)} vence nos pênaltis!</b>`;
      panel.classList.add(userWon ? 'won' : 'lost');
      if (userWon) { sfx.win(); confetti(['#FFC940', '#FF8A1F', '#3ddc84', '#fff']); } else sfx.lose();
      $('.so-skip').hidden = true;
      const go = $('.so-go'); go.hidden = false;
      go.addEventListener('click', () => { sfx.tap(); panel.remove(); resolve(); }, { once: true });
    })();
  });
}
