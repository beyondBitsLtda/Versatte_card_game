// Helpers de interface: ícones, toasts, sheets e formatação.
import { sfx } from './fx.js';

const p = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export const icon = {
  home: p('<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>'),
  album: p('<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>'),
  cards: p('<rect x="7" y="3.5" width="12" height="16" rx="2" transform="rotate(8 13 11.5)"/><rect x="4" y="4.5" width="12" height="16" rx="2"/>'),
  gift: p('<rect x="3.5" y="8.5" width="17" height="4" rx="1"/><path d="M5 12.5v8h14v-8"/><path d="M12 8.5v12"/><path d="M12 8.5C10 4 6.5 4.5 7 7c.3 1.4 2.5 1.5 5 1.5ZM12 8.5c2-4.5 5.5-4 5-1.5-.3 1.4-2.5 1.5-5 1.5Z"/>'),
  bag: p('<path d="M5 8h14l-1 12.5H6Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>'),
  bug: p('<rect x="7" y="8" width="10" height="12" rx="5"/><path d="M12 8v12M9 5l1.5 2M15 5l-1.5 2M3.5 12H7M17 12h3.5M4.5 17.5 7 16M19.5 17.5 17 16M4.5 7.5 7 9M19.5 7.5 17 9"/>'),
  close: p('<path d="M6 6l12 12M18 6 6 18"/>'),
  coin: p('<circle cx="12" cy="12" r="8.5"/><path d="M9.5 9.5 12 15l2.5-5.5"/>'),
  pack: p('<path d="M6 3.5h12l-.6 2 .6 1.5v12l-.6 1.5H6.6L6 19V7l.6-1.5Z"/><path d="M9 11h6M9 14h4"/>'),
  clock: p('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  lock: p('<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'),
  check: p('<path d="M5 12.5 10 17l9-10"/>'),
  ticket: p('<path d="M3.5 7.5h17v3a2 2 0 0 0 0 3v3h-17v-3a2 2 0 0 0 0-3Z"/><path d="M14 7.5v9" stroke-dasharray="2 2"/>'),
  mug: p('<path d="M5 6.5h11v10a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3Z"/><path d="M16 9h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8.5 3v1.5M12 3v1.5"/>'),
  shirt: p('<path d="M8.5 3.5 4 6l1.5 4.5 2.5-1v11h8v-11l2.5 1L20 6l-4.5-2.5c-.5 1.6-1.8 2.5-3.5 2.5s-3-.9-3.5-2.5Z"/>'),
  trophy: p('<path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0Z"/><path d="M7.5 6H4.5a3 3 0 0 0 3 4M16.5 6h3a3 3 0 0 1-3 4M12 13.5V17M8.5 20.5h7M9.5 17h5v3.5h-5Z"/>'),
  bulb: p('<path d="M9 17.5h6M10 20.5h4"/><path d="M12 3.5a5.5 5.5 0 0 0-3.2 10c.6.5 1 1.2 1 2V16h4.4v-.5c0-.8.4-1.5 1-2A5.5 5.5 0 0 0 12 3.5Z"/>'),
  star: p('<path d="m12 3.8 2.5 5.1 5.6.8-4 4 1 5.5-5.1-2.6-5 2.6.9-5.5-4-4 5.6-.8Z"/>'),
  sound: p('<path d="M4.5 9.5h3l4.5-4v13l-4.5-4h-3Z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>'),
  user: p('<circle cx="12" cy="8.5" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>'),
  sparkle: p('<path d="M12 3.5c.7 4.3 2.2 5.8 6.5 6.5-4.3.7-5.8 2.2-6.5 6.5-.7-4.3-2.2-5.8-6.5-6.5 4.3-.7 5.8-2.2 6.5-6.5Z"/><path d="M18.5 15.5c.3 1.7.8 2.2 2.5 2.5-1.7.3-2.2.8-2.5 2.5-.3-1.7-.8-2.2-2.5-2.5 1.7-.3 2.2-.8 2.5-2.5Z"/>'),
  arrow: p('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  swipe: p('<path d="M3.5 7h11M11 3.5 14.5 7 11 10.5"/><path d="M9.5 21v-6.5a1.5 1.5 0 0 1 3 0V17l3.7.6a2 2 0 0 1 1.7 2.2L17.6 21"/>'),
  play: p('<path d="M8 5.5v13l10.5-6.5Z"/>'),
  reset: p('<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9"/><path d="M4.5 4.5V9H9"/>'),
};

export const fmtMoney = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const fmtPct = (v, d = 1) => `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: d, minimumFractionDigits: v * 100 < 1 && v > 0 ? 2 : 0 })}%`;
export const fmtDate = t => new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
export function fmtCountdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${h}:${m}:${ss}`;
}
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

// ---------- toast ----------
let toastWrap;
export function toast(msg, { tone = 'info', ms = 2600 } = {}) {
  toastWrap = toastWrap || document.body.appendChild(el('<div class="toasts" role="status" aria-live="polite"></div>'));
  const t = el(`<div class="toast t-${tone}">${msg}</div>`);
  toastWrap.appendChild(t);
  requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 400); }, ms);
}

// ---------- overlays ----------
const root = () => document.getElementById('overlay-root');

/** Bottom sheet genérico. Retorna { node, close }. */
export function sheet(html, { cls = '', onClose } = {}) {
  const node = el(`
    <div class="sheet-wrap ${cls}">
      <div class="sheet-backdrop" data-close></div>
      <div class="sheet" role="dialog" aria-modal="true">
        <div class="sheet-grab"></div>
        <button class="icon-btn sheet-x" data-close aria-label="Fechar">${icon.close}</button>
        <div class="sheet-body">${html}</div>
      </div>
    </div>`);
  root().appendChild(node);
  requestAnimationFrame(() => node.classList.add('open'));
  let closed = false;
  const close = () => {
    if (closed) return; closed = true;
    node.classList.remove('open');
    setTimeout(() => node.remove(), 380);
    onClose && onClose();
  };
  node.addEventListener('click', e => { if (e.target.closest('[data-close]')) { sfx.tap(); close(); } });
  return { node, close };
}

/** Overlay tela cheia. */
export function overlay(html, cls = '') {
  const node = el(`<div class="overlay ${cls}">${html}</div>`);
  root().appendChild(node);
  requestAnimationFrame(() => node.classList.add('open'));
  return {
    node,
    close() { node.classList.remove('open'); setTimeout(() => node.remove(), 420); },
  };
}

export const wait = ms => new Promise(r => setTimeout(r, ms));
