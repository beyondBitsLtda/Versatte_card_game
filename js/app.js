// Ponto de entrada: intro, cadastro, roteamento por hash e barra de navegação.
import { state, save, onChange, freeAvailable, readyPrizes } from './state.js';
import { homeView, albumView, cardsView, prizesView, shopView, signupView, openProfile, cleanupView } from './views.js';
import { startOpening } from './pack.js';
import { openDebug } from './debug.js';
import { burst, sfx, haptic } from './fx.js';
import { icon, esc, toast, wait } from './ui.js';

const ROUTES = {
  home:   { view: homeView,   label: 'Início',  icon: 'home' },
  album:  { view: albumView,  label: 'Álbum',   icon: 'album' },
  cards:  { view: cardsView,  label: 'Cartas',  icon: 'cards' },
  prizes: { view: prizesView, label: 'Prêmios', icon: 'gift' },
  shop:   { view: shopView,   label: 'Loja',    icon: 'bag' },
};

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
    if (type === 'premium' && state.premiumPacks <= 0) { toast('Sem pacotes premium — que tal a loja?'); return app.go('shop'); }
    startOpening(collectionId, type, {
      onDone(next) {
        render(true);
        if (!next) return;
        if (next.again) {
          const t = freeAvailable() ? 'free' : 'premium';
          setTimeout(() => app.open(next.collection, t), 250);
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
  $('#tabbar').innerHTML = Object.entries(ROUTES).map(([k, r]) => `
    <a href="#/${k}" class="tab ${k === route ? 'on' : ''}" aria-label="${r.label}">
      ${icon[r.icon]}<span>${r.label}</span>
      ${k === 'prizes' && readyPrizes().length ? '<i class="dot"></i>' : ''}
      ${k === 'home' && freeAvailable() ? '<i class="dot"></i>' : ''}
    </a>`).join('');
  $('#chips').innerHTML = `
    <button class="chip-stat" data-go="shop" aria-label="Pontos">${icon.coin}<b>${state.points}</b></button>
    <button class="chip-stat premium" data-go="shop" aria-label="Pacotes premium">${icon.pack}<b>${state.premiumPacks}</b></button>
    <button class="avatar" data-profile aria-label="Perfil">${esc((state.user?.name || '?')[0].toUpperCase())}</button>`;
  $('#dbg-fab').hidden = !state.settings.debug;
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
async function boot() {
  cleanupView();
  document.body.classList.remove('signed');
  if (!state.user) {
    await playIntro();
    $('#tabbar').innerHTML = ''; $('#chips').innerHTML = '';
    $('#dbg-fab').hidden = true;
    viewEl.replaceChildren(signupView(() => { document.body.classList.add('signed'); render(); }));
    return;
  }
  document.body.classList.add('signed');
  render();
  if (state.settings.intro) await playIntro();
}

// ---------- eventos globais ----------
addEventListener('hashchange', () => {
  document.querySelectorAll('#overlay-root .sheet-wrap').forEach(n => n.remove());
  sfx.tap(); render();
});
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]');
  if (g && g.closest('#chips')) { sfx.tap(); app.go(g.dataset.go); }
  if (e.target.closest('[data-profile]')) { sfx.tap(); openProfile(app); }
});
$('#dbg-fab').addEventListener('click', () => { sfx.tap(); openDebug(app); });
$('.brand').addEventListener('click', () => app.go('home'));

// ativa o modo debug pela URL (?debug=1) mesmo se estiver desligado
if (new URLSearchParams(location.search).has('debug')) { state.settings.debug = true; save(); }

onChange(() => { if (state.user) renderChrome(); });
boot();
