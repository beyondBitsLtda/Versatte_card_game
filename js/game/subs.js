// ============================================================
//  PAINEL DE SUBSTITUIÇÃO (usado nos dois estilos de partida)
//  Toque em quem SAI (em campo) e depois em quem ENTRA (banco).
//  Online: aparece no intervalo, com contagem regressiva.
// ============================================================
import { CARD_BY_UID, RARITIES } from '../data.js';
import { gem } from '../cards.js';
import { sfx } from '../fx.js';
import { esc } from '../ui.js';

const LINE = { GOL: 'GOL', DEF: 'DEF', MEI: 'MEI', ATA: 'ATA' };

/**
 * @param {HTMLElement} container  onde o painel aparece (cobre a partida)
 * @param {object} o { roster: {onField, bench, subsLeft}, title, sub, deadline (ms, relógio local), confirmLabel, cancelLabel }
 * @returns Promise<[{out, in}] | null>   null = cancelou (offline)
 */
export function openSubPanel(container, { roster, title = 'Substituições', sub = '', deadline = null, confirmLabel = 'Confirmar', cancelLabel = 'Voltar ao jogo' }) {
  return new Promise(resolve => {
    const changes = [];                       // [{ out, in }]
    let pickOut = null;
    const panel = document.createElement('div');
    panel.className = 'sp';
    container.appendChild(panel);
    requestAnimationFrame(() => panel.classList.add('in'));
    let timer = 0, done = false;

    const finish = v => {
      if (done) return; done = true;
      clearInterval(timer);
      panel.classList.remove('in');
      setTimeout(() => panel.remove(), 250);
      resolve(v);
    };
    const usedOut = new Set(), usedIn = new Set();
    const rate = (p, line) => p.rating?.[line] ?? 0;
    const cardOf = p => (p.uid ? CARD_BY_UID[p.uid] : null);
    const tag = p => {
      const c = cardOf(p);
      return c ? `<i class="sp-gem" style="color:${RARITIES[c.rarity].color}">${gem(c.rarity)}</i>` : '';
    };

    function render() {
      const left = roster.subsLeft - changes.length;
      const outLine = pickOut != null ? roster.onField[pickOut].line : null;
      panel.innerHTML = `
        <div class="sp-in">
          <div class="sp-h">
            <div><b>${esc(title)}</b><small>${esc(sub)}</small></div>
            ${deadline ? '<span class="sp-clock">--</span>' : ''}
          </div>
          <div class="sp-left">${left > 0 ? `Você pode fazer mais <b>${left}</b> substituição(ões)` : 'Limite de substituições atingido'}</div>
          ${changes.length ? `<div class="sp-chg">${changes.map((c, i) => `
            <div class="sp-pair"><span class="out">⬇ ${esc(roster.onField[c.out].name)}</span><span class="in">⬆ ${esc(roster.bench[c.in].name)}</span><button data-undo="${i}" aria-label="Desfazer">✕</button></div>`).join('')}</div>` : ''}
          <div class="sp-cols">
            <div class="sp-col">
              <span class="sp-ch">Em campo · toque em quem sai</span>
              ${roster.onField.map((p, i) => {
                const dis = p.sentOff || usedOut.has(i) || left <= 0;
                return `<button class="sp-p ${pickOut === i ? 'on' : ''} ${p.sentOff ? 'red' : ''}" data-out="${i}" ${dis ? 'disabled' : ''}>
                  <span class="sp-v">${rate(p, p.line)}</span><span class="sp-n">${tag(p)}${esc(p.name)}<small>${LINE[p.line]}${p.sentOff ? ' · expulso' : p.fresh ? ' · entrou' : ''}</small></span></button>`;
              }).join('')}
            </div>
            <div class="sp-col">
              <span class="sp-ch">Banco ${pickOut != null ? `· nota na vaga ${LINE[outLine]}` : ''}</span>
              ${roster.bench.length ? roster.bench.map((p, i) => {
                const dis = pickOut == null || usedIn.has(i);
                return `<button class="sp-p bench" data-in="${i}" ${dis ? 'disabled' : ''}>
                  <span class="sp-v">${outLine ? rate(p, outLine) : rate(p, p.line)}</span><span class="sp-n">${tag(p)}${esc(p.name)}<small>${p.pos || LINE[p.line]}</small></span></button>`;
              }).join('') : '<p class="muted">Sem reservas.</p>'}
            </div>
          </div>
          <div class="sp-act">
            ${deadline ? '' : `<button class="btn ghost" data-cancel>${esc(cancelLabel)}</button>`}
            <button class="btn primary big" data-ok>${changes.length ? `${esc(confirmLabel)} (${changes.length})` : (deadline ? 'Sem alterações' : esc(confirmLabel))}</button>
          </div>
        </div>`;
      tick();
    }
    function tick() {
      if (!deadline) return;
      const ms = deadline - Date.now();
      const el = panel.querySelector('.sp-clock');
      if (el) { const s = Math.max(0, Math.ceil(ms / 1000)); el.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; el.classList.toggle('hot', s <= 10); }
      if (ms <= 0) finish(changes.slice());     // tempo esgotado: vale o que foi escolhido
    }
    panel.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      sfx.tap();
      if (b.dataset.out != null) { pickOut = pickOut === +b.dataset.out ? null : +b.dataset.out; return render(); }
      if (b.dataset.in != null && pickOut != null) {
        changes.push({ out: pickOut, in: +b.dataset.in }); usedOut.add(pickOut); usedIn.add(+b.dataset.in); pickOut = null; return render();
      }
      if (b.dataset.undo != null) {
        const c = changes.splice(+b.dataset.undo, 1)[0]; usedOut.delete(c.out); usedIn.delete(c.in); return render();
      }
      if (b.hasAttribute('data-cancel')) return finish(null);
      if (b.hasAttribute('data-ok')) return finish(changes.slice());
    });
    render();
    if (deadline) timer = setInterval(tick, 250);
  });
}

/** Confirmação simples dentro da partida (ex.: desistir). */
export function confirmIn(container, { title, text, yes = 'Sim', no = 'Cancelar', danger = true }) {
  return new Promise(resolve => {
    const el = document.createElement('div');
    el.className = 'sp sp-confirm';
    el.innerHTML = `<div class="sp-in"><div class="sp-h"><div><b>${esc(title)}</b><small>${esc(text)}</small></div></div>
      <div class="sp-act"><button class="btn ghost" data-no>${esc(no)}</button><button class="btn ${danger ? 'danger' : 'primary'} big" data-yes>${esc(yes)}</button></div></div>`;
    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('in'));
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      sfx.tap(); el.classList.remove('in'); setTimeout(() => el.remove(), 250);
      resolve(b.hasAttribute('data-yes'));
    });
  });
}
