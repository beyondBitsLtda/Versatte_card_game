// Ponto de entrada: intro, cadastro, roteamento por hash e barra de navegação.
import { state, save, onChange, freeAvailable, msToNextFree, readyPrizes, packCount, totalPacks } from './state.js';
import { PACK_STYLE, COLLECTION_BY_ID, COLLECTIONS } from './data.js';
import { homeView, albumView, cardsView, prizesView, shopView, authView, openProfile, cleanupView } from './views.js';
import { isOnline, resumeSession, refreshProfile, startPolling, onInbox } from './net/online.js';
import { onlineView, initMultiplayer, pendingCount } from './game/multiplayer.js';
import { COINS } from './data.js';
import { startOpening } from './pack.js';
import { openDebug } from './debug.js';
import { clubView } from './game/club.js';
import { burst, sfx, haptic } from './fx.js';
import { icon, esc, toast, wait, fmtCountdown } from './ui.js';
import { initDesktop, isDesk } from './desktop.js';

const ROUTES = {
  home:   { view: homeView,   label: 'Início',  icon: 'home' },
  album:  { view: albumView,  label: 'Álbum',   icon: 'album' },
  jogar:  { view: clubView,   label: 'Jogar',   icon: 'ball', center: true },
  prizes: { view: prizesView, label: 'Prêmios', icon: 'gift' },
  shop:   { view: shopView,   label: 'Loja',    icon: 'bag' },
  cards:  { view: cardsView,  label: 'Cartas',  icon: 'cards', hidden: true, tab: 'album' },
  online: { view: onlineView, label: 'Online',  icon: 'user',  hidden: true, tab: 'jogar' },
};
// ordem da navegação; no celular as rotas "hidden" não aparecem na barra (ficam dentro das telas),
// no computador todas viram itens da barra lateral (atalhos 1 a 7)
const NAV = ['home', 'album', 'cards', 'jogar', 'online', 'prizes', 'shop'];
const TITLES = { home: 'Início', album: 'Álbum', cards: 'Minhas cartas', jogar: 'Modo Clube', online: 'Online', prizes: 'Prêmios', shop: 'Loja' };
const DESK_LABEL = { cards: 'Minhas cartas', jogar: 'Modo Clube' };

const $ = s => document.querySelector(s);
const viewEl = $('#view');
let route = 'home';

const app = {
  go(r) {
    if (!ROUTES[r]) r = 'home';
    if (location.hash !== `#/${r}`) location.hash = `#/${r}`;
    else render();
  },
  refresh: () => render(true),
  open(collectionId, type) {
    if (type === 'free' && !freeAvailable()) return toast('Pacote diário já aberto hoje. Volte amanhã!');
    if (type !== 'free' && packCount(type) <= 0) { toast(`Sem pacote ${PACK_STYLE[type].short.toLowerCase()} — troque moedas na Loja`); return app.go('shop'); }
    if (type === 'free' && COLLECTION_BY_ID[collectionId]?.premiumOnly) return toast('Esta coleção só sai em pacotes premium ou lendários');
    startOpening(collectionId, type, {
      onDone(next) {
        render(true);
        if (!next) return;
        if (next.again) {
          const po = COLLECTION_BY_ID[next.collection]?.premiumOnly;
          const t = freeAvailable() && !po ? 'free' : (next.type && packCount(next.type) > 0 ? next.type : ['premium', 'lendario', 'basico'].find(x => packCount(x) > 0 && !(po && x === 'basico')));
          if (t) setTimeout(() => app.open(next.collection, t), 250); else app.go('shop');
        } else app.go(next.route);
      },
    });
  },
  intro: () => playIntro(true),
  boot,
};

// ---------- render ----------
function render(keepScroll = false) {
  const r = (location.hash.match(/^#\/(\w+)/) || [])[1];
  route = ROUTES[r] ? r : 'home';
  const y = viewEl.scrollTop;
  cleanupView();
  const node = ROUTES[route].view(app);
  viewEl.replaceChildren(node);
  viewEl.scrollTop = keepScroll ? y : 0;
  if (!keepScroll) node.classList.add('enter');
  renderChrome();
}

function renderChrome() {
  const desk = isDesk();
  const activeTab = desk ? route : (ROUTES[route].tab || route);
  const pend = isOnline() ? pendingCount() : 0;
  const free = freeAvailable();
  $('#tabbar').innerHTML = NAV.map((k, i) => {
    const r = ROUTES[k];
    return `
    <a href="#/${k}" class="tab ${k === activeTab ? 'on' : ''} ${r.center ? 'center' : ''} ${r.hidden ? 'x' : ''}" aria-label="${r.label}" title="${desk ? `${DESK_LABEL[k] || r.label} · tecla ${i + 1}` : ''}">
      ${icon[r.icon]}<span>${desk ? DESK_LABEL[k] || r.label : r.label}</span>
      ${k === 'prizes' && readyPrizes().length ? '<i class="dot"></i>' : ''}
      ${k === 'home' && free ? '<i class="dot"></i>' : ''}
      ${k === 'online' && pend ? `<i class="badge">${pend}</i>` : ''}
    </a>`;
  }).join('') + `
    <div class="side-foot">
      <button class="sf-free ${free ? 'on' : ''}" data-side-free>
        ${icon.pack}<div><b>${free ? 'Pacote grátis liberado' : 'Próximo pacote grátis'}</b><span class="sf-time">${free ? 'Abrir agora' : fmtCountdown(msToNextFree())}</span></div>
      </button>
      <p class="sf-keys"><kbd>1</kbd>–<kbd>7</kbd> navegar · <kbd>Esc</kbd> fechar</p>
    </div>`;
  $('#chips').innerHTML = `
    <span class="desk-title">${TITLES[route]}</span>
    <button class="chip-stat" data-go="shop" data-coins aria-label="Moedas">${icon.coin}<b>${state.coins}</b></button>
    <button class="chip-stat premium" data-go="shop" aria-label="Pacotes">${icon.pack}<b>${totalPacks()}</b></button>
    ${isOnline() ? `<button class="chip-icon online" data-go="online" aria-label="Multiplayer">${icon.user}${pendingCount() ? `<i class="badge">${pendingCount()}</i>` : ''}</button>` : ''}
    ${state.settings.debug ? `<button class="chip-icon" data-debug aria-label="Modo debug">${icon.bug}</button>` : ''}
    <button class="avatar" data-profile aria-label="Perfil">${esc((state.user?.name || '?')[0].toUpperCase())}</button>`;
}

// ---------- intro ----------
async function playIntro(force = false) {
  const intro = $('#intro');
  if (!force && !state.settings.intro) return;
  intro.hidden = false;
  intro.className = 'intro';
  let skip = false;
  const skipBtn = intro.querySelector('.in-skip');
  const done = new Promise(res => {
    const end = () => { skip = true; res(); };
    skipBtn.onclick = end;
    intro.onclick = e => { if (intro.classList.contains('s3')) end(); else if (e.target === skipBtn) end(); };
  });
  const step = async (cls, ms) => { if (skip) return; intro.classList.add(cls); await Promise.race([wait(ms), done]); };
  await wait(50);
  await step('s1', 2600);         // Beyond Bits
  await step('s2', 900);          // transição
  if (!skip) {
    const r = intro.querySelector('.in-vs img').getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, { colors: ['#FF8A1F', '#2E9BFF', '#fff'], count: 90, speed: 9, shape: 'star', size: 2.6 });
  }
  await step('s3', 600);          // Versatte + "toque para começar"
  await done;
  sfx.whoosh(); haptic(10);
  intro.classList.add('out');
  await wait(600);
  intro.hidden = true;
}

// ---------- boot ----------
const MODE_KEY = 'versatte-modo';
async function boot({ forceAuth = false } = {}) {
  cleanupView();
  document.body.classList.remove('signed');
  const offline = !forceAuth && localStorage.getItem(MODE_KEY) === 'offline';

  // 1) conta online salva neste aparelho
  if (!forceAuth && resumeSession()) {
    enter();
    try { await refreshProfile(); render(true); }
    catch (e) { toast('Servidor indisponível: mostrando sua coleção salva neste aparelho.', { tone: 'warn', ms: 4000 }); }
    startPolling(); initMultiplayer(app);
    if (state.settings.intro) await playIntro();
    return;
  }
  // 2) modo offline (demonstração) já escolhido
  if (offline && state.user) { enter(); if (state.settings.intro) await playIntro(); return; }

  // 3) entrar / criar conta
  if (!forceAuth) await playIntro();
  $('#tabbar').innerHTML = ''; $('#chips').innerHTML = '';
  viewEl.replaceChildren(authView(mode => {
    if (mode === 'offline') {
      localStorage.setItem(MODE_KEY, 'offline');
      if (!state.user) { state.user = { name: 'Visitante', email: '', createdAt: Date.now() }; state.premiumPacks += 1; state.coins += COINS.welcome; save(); }
    } else {
      localStorage.removeItem(MODE_KEY);
      startPolling(); initMultiplayer(app);
    }
    enter();
  }));
}
function enter() { document.body.classList.add('signed'); render(); }

// ---------- eventos globais ----------
addEventListener('hashchange', () => {
  document.querySelectorAll('#overlay-root .sheet-wrap').forEach(n => n.remove());
  sfx.tap(); render();
});
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]');
  if (g && g.closest('#chips')) { sfx.tap(); app.go(g.dataset.go); }
  if (e.target.closest('[data-profile]')) { sfx.tap(); openProfile(app); }
  if (e.target.closest('[data-debug]')) { sfx.tap(); openDebug(app); }
});
$('.brand').addEventListener('click', () => app.go('home'));
document.addEventListener('click', e => {
  if (!e.target.closest('[data-side-free]')) return;
  sfx.tap();
  if (freeAvailable() && !COLLECTION_BY_ID[state.lastCollection]?.premiumOnly) app.open(state.lastCollection || COLLECTIONS[0].id, 'free');
  else app.go('home');
});
// contagem do próximo pacote grátis na barra lateral
setInterval(() => {
  const t = document.querySelector('.sf-time');
  if (!t || !state.user) return;
  if (freeAvailable() !== !!document.querySelector('.sf-free.on')) return renderChrome();
  if (!freeAvailable()) t.textContent = fmtCountdown(msToNextFree());
}, 1000);
// trocou de celular para computador (ou o contrário): redesenha a navegação e a tela
addEventListener('versatte:layout', () => { if (document.body.classList.contains('signed')) render(true); });
initDesktop(app, NAV);

// ativa o modo debug pela URL (?debug=1) mesmo se estiver desligado
if (new URLSearchParams(location.search).has('debug')) { state.settings.debug = true; save(); }

onChange(() => { if (state.user) renderChrome(); });
onInbox(() => { if (state.user) renderChrome(); });
boot();
