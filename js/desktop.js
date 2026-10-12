// ============================================================
//  MODO COMPUTADOR — o layout muda por CSS (html.desk, decidido
//  no index.html); aqui ficam o teclado e a roda do mouse.
//
//    1 a 7        navega pelas seções da barra lateral
//    ← →          pacote / carta anterior e próxima (Início, Minhas cartas)
//    Esc          fecha a janela ou o painel aberto (na abertura de pacote: pula)
//    Espaço/Enter abre o pacote e revela as cartas (← → passa a carta)
//    Na partida:  1, 2, 4 velocidade · Espaço pausa · S substituir
//    Enter        confirma o painel de substituição / confirmação
// ============================================================

export const isDesk = () => document.documentElement.classList.contains('desk');

const typing = e => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
const last = sel => { const l = document.querySelectorAll(sel); return l[l.length - 1] || null; };

/** Botões ‹ › de um carrossel (só aparecem no computador). */
export const carNavHtml = (label = 'item') => `
  <div class="car-nav" aria-hidden="false">
    <button data-dir="-1" aria-label="${label} anterior"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg></button>
    <button data-dir="1" aria-label="Próximo ${label}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button>
  </div>`;

/** Liga os botões ‹ › ao carrossel: anda um item (largura do primeiro item) por clique. */
export function bindCarNav(root, scroller, itemSel) {
  root.querySelector('.car-nav')?.addEventListener('click', e => {
    const b = e.target.closest('[data-dir]'); if (!b) return;
    const item = itemSel ? scroller.querySelector(itemSel) : null;
    const step = item ? item.getBoundingClientRect().width : scroller.clientWidth;
    scroller.scrollBy({ left: +b.dataset.dir * step, behavior: 'smooth' });
  });
}

export function initDesktop(app, nav) {
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (typing(e)) { if (e.key === 'Escape') e.target.blur(); return; }
    const sheet = last('.sheet-wrap.open');
    const ov = last('#overlay-root > .overlay.open');
    const panel = last('.sp.in');                              // substituição / confirmação dentro da partida
    const match = ov && ov.querySelector('.mt, .tm');

    if (e.key === 'Escape') {
      if (panel) return panel.querySelector('[data-cancel], [data-no]')?.click();
      if (sheet) return sheet.querySelector('[data-close]')?.click();
      if (ov && !match) {
        // fechar (×), voltar, fechar o resumo do pacote; na abertura em andamento, pula para o resumo
        const close = ov.querySelector('.ov-x, [data-back], [data-close-open]');
        if (close) close.click();
        else ov.querySelector('.open-skip')?.click();
      }
      return;
    }
    if (panel) {
      if (e.key === 'Enter') { e.preventDefault(); panel.querySelector('[data-ok], [data-yes]')?.click(); }
      return;
    }
    if (match && !sheet) {
      if (['1', '2', '4'].includes(e.key)) { e.preventDefault(); match.querySelector(`[data-speed="${e.key}"]`)?.click(); }
      else if (e.key === ' ') { e.preventDefault(); match.querySelector('.tm-pause')?.click(); }
      else if (e.key.toLowerCase() === 's') match.querySelector('.mt-sub:not([disabled])')?.click();
      return;
    }
    if (sheet || ov || !isDesk()) return;
    if (/^[1-7]$/.test(e.key) && nav[+e.key - 1]) { app.go(nav[+e.key - 1]); return; }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const b = document.querySelector(`#view .car-nav [data-dir="${e.key === 'ArrowLeft' ? -1 : 1}"]`);
      if (b) { e.preventDefault(); b.click(); }
    }
  });

  // roda do mouse em listas horizontais: rola para o lado (no carrossel, um item por vez)
  document.addEventListener('wheel', e => {
    if (!isDesk() || e.ctrlKey) return;
    const el = e.target.closest('.pack-carousel, .showcase, .bracket, .filters, .col-chips');
    if (!el || Math.abs(e.deltaX) >= Math.abs(e.deltaY) || el.scrollWidth <= el.clientWidth + 2) return;
    e.preventDefault();
    if (el.matches('.pack-carousel, .showcase')) {
      const now = performance.now();
      if (now - (el._wheelAt || 0) < 380) return;
      el._wheelAt = now;
      el.closest('.view, .hero')?.querySelector(`.car-nav [data-dir="${e.deltaY > 0 ? 1 : -1}"]`)?.click();
    } else el.scrollLeft += e.deltaY;
  }, { passive: false });
}
