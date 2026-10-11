// Renderização das cartas.
// Se a carta tiver imagem em js/imagens.js, usa o PNG; senão (ou se falhar), usa a arte gerada em SVG.
import { RARITIES, COLLECTION_BY_ID, POSITIONS, ABILITIES } from './data.js';
import { IMAGENS } from './imagens.js';
import { esc } from './ui.js';

let uidSeq = 0;
const nid = p => `${p}${++uidSeq}`;

const SHIELD = 'M100 10 L178 32 C181 72 182 112 176 142 C166 190 134 214 100 230 C66 214 34 190 24 142 C18 112 19 72 22 32 Z';
const EMOJI_FONT = `'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif`;

// ------------------------------------------------------------
//  Imagens configuradas
// ------------------------------------------------------------
const DEFAULT_MODE = { team: 'conter', player: 'jogador', stadium: 'cobrir', mascot: 'conter' };

export function cardImage(card) {
  const raw = IMAGENS[card.uid];
  if (!raw) return null;
  const o = typeof raw === 'string' ? { src: raw } : raw;
  if (!o.src) return null;
  return { src: o.src, modo: o.modo || DEFAULT_MODE[card.kind] || 'conter', escala: o.escala || 1, y: o.y || '0px' };
}

// ------------------------------------------------------------
//  Arte gerada: escudos
// ------------------------------------------------------------
function teamPattern(colors, pattern, clip) {
  const [c1, c2, c3 = c2] = colors;
  const g = inner => `<g clip-path="url(#${clip})">${inner}</g>`;
  switch (pattern) {
    case 'stripes': {
      let s = `<rect width="200" height="240" fill="${c1}"/>`;
      for (let i = 1; i < 9; i += 2) s += `<rect x="${i * 22.2}" width="22.2" height="240" fill="${c2}"/>`;
      return g(s);
    }
    case 'hoops': {
      let s = `<rect width="200" height="240" fill="${c1}"/>`;
      for (let i = 1; i < 10; i += 2) s += `<rect y="${i * 24}" width="200" height="24" fill="${c2}"/>`;
      return g(s);
    }
    case 'halves':
      return g(`<rect width="100" height="240" fill="${c1}"/><rect x="100" width="100" height="240" fill="${c2}"/>`);
    case 'sash':
      return g(`<rect width="200" height="240" fill="${c1}"/><path d="M-10 40 L40 -10 L210 160 L160 210 Z" fill="${c2}"/><path d="M-10 52 L52 -10 L60 -2 L-2 60 Z M150 202 L202 150 L210 158 L158 210Z" fill="${c3}"/>`);
    case 'tri':
      return g(`<rect width="67" height="240" fill="${c1}"/><rect x="67" width="66" height="240" fill="${c2}"/><rect x="133" width="67" height="240" fill="${c3}"/>`);
    case 'band':
      return g(`<rect width="200" height="240" fill="${c1}"/><rect y="150" width="200" height="34" fill="${c2}"/><rect y="186" width="200" height="6" fill="${c3}"/>`);
    default:
      return g(`<rect width="200" height="240" fill="${c1}"/><path d="M0 170 L200 120 L200 240 L0 240Z" fill="${c2}" opacity=".16"/>`);
  }
}

const STAR = 'M100 38 l5.9 12 13.2 1.9-9.6 9.3 2.3 13.1L100 68.1l-11.8 6.2 2.3-13.1-9.6-9.3 13.2-1.9Z';

export function teamArt(t, variant = 'base') {
  const clip = nid('cl'), sh = nid('sh'), st = nid('st');
  const colors = variant === 'away' ? [t.colors[1], t.colors[0], t.colors[2] || t.colors[0]] : t.colors;
  const champ = variant === 'champ';
  const retro = variant === 'retro';
  const laurel = champ ? `
    <g fill="none" stroke="#FFC940" stroke-width="5" stroke-linecap="round" opacity=".95">
      <path d="M30 200 C10 160 12 110 30 70"/><path d="M170 200 C190 160 188 110 170 70"/>
    </g>
    <g fill="#FFC940">${[0, 1, 2, 3, 4].map(i => `<ellipse cx="${22 - i * 1.5}" cy="${190 - i * 28}" rx="9" ry="4.5" transform="rotate(-40 ${22 - i * 1.5} ${190 - i * 28})"/><ellipse cx="${178 + i * 1.5}" cy="${190 - i * 28}" rx="9" ry="4.5" transform="rotate(40 ${178 + i * 1.5} ${190 - i * 28})"/>`).join('')}</g>` : '';
  const crownStars = champ ? `<g fill="#FFC940" stroke="#05080f" stroke-width="2" paint-order="stroke">${[-34, 0, 34].map(dx => `<path d="${STAR}" transform="translate(${dx} ${dx === 0 ? -34 : -26}) scale(.6) translate(66 0)"/>`).join('')}</g>` : '';
  return `
  <svg class="art-team ${retro ? 'art-retro' : ''}" viewBox="0 0 200 240" aria-hidden="true">
    <defs>
      <clipPath id="${clip}"><path d="${SHIELD}"/></clipPath>
      <linearGradient id="${sh}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity=".45"/>
        <stop offset=".45" stop-color="#fff" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity=".35"/>
      </linearGradient>
      <linearGradient id="${st}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#05080f" stop-opacity=".88"/>
        <stop offset="1" stop-color="#05080f" stop-opacity=".7"/>
      </linearGradient>
    </defs>
    ${laurel}
    <path d="${SHIELD}" transform="translate(0 6)" fill="#000" opacity=".45"/>
    ${teamPattern(colors, t.pattern, clip)}
    <path d="${SHIELD}" fill="url(#${sh})"/>
    <rect x="14" y="92" width="172" height="58" rx="6" fill="url(#${st})" clip-path="url(#${clip})"/>
    <text x="100" y="138" text-anchor="middle" class="art-abbr">${esc(t.abbr)}</text>
    <path d="${STAR}" fill="${champ ? '#FFC940' : '#fff'}" stroke="#05080f" stroke-width="2.5" paint-order="stroke"/>
    <text x="100" y="186" text-anchor="middle" class="art-year">${retro ? `DESDE ${t.founded}` : t.founded}</text>
    <path d="${SHIELD}" fill="none" stroke="currentColor" stroke-width="5"/>
    <path d="${SHIELD}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.2" transform="translate(10 10) scale(.9)"/>
    ${crownStars}
  </svg>`;
}

// ------------------------------------------------------------
//  Arte gerada: jogador (silhueta com a camisa do clube)
// ------------------------------------------------------------
export function playerArt(p) {
  const t = p.teamData;
  const [c1, c2] = t.colors;
  const jg = nid('jg'), hg = nid('hg'), jc = nid('jc');
  const keeper = p.pos === 'GOL';
  const jerseyPath = 'M18 244 C20 190 38 162 70 150 L86 136 Q100 150 114 136 L130 150 C162 162 180 190 182 244 Z';
  const fill = keeper ? '#2a2f3a' : c1;
  const stripes = !keeper && (t.pattern === 'stripes' || t.pattern === 'hoops')
    ? `<g clip-path="url(#${jc})" opacity=".9">${t.pattern === 'stripes'
        ? [0, 1, 2, 3].map(i => `<rect x="${40 + i * 34}" y="130" width="17" height="120" fill="${c2}"/>`).join('')
        : [0, 1, 2].map(i => `<rect x="0" y="${168 + i * 26}" width="200" height="13" fill="${c2}"/>`).join('')}</g>`
    : '';
  return `
  <svg class="art-idol" viewBox="0 0 200 240" aria-hidden="true">
    <defs>
      <linearGradient id="${jg}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity=".45"/>
      </linearGradient>
      <radialGradient id="${hg}" cx=".38" cy=".3" r=".9">
        <stop offset="0" stop-color="#2b3a55"/><stop offset="1" stop-color="#070b14"/>
      </radialGradient>
      <clipPath id="${jc}"><path d="${jerseyPath}"/></clipPath>
    </defs>
    <text x="100" y="150" text-anchor="middle" class="art-bignum">${p.shirt}</text>
    <path d="M88 112 L112 112 L115 140 L85 140Z" fill="url(#${hg})"/>
    <ellipse cx="100" cy="84" rx="28" ry="33" fill="url(#${hg})" stroke="currentColor" stroke-opacity=".75" stroke-width="2"/>
    <path d="${jerseyPath}" fill="${fill}"/>
    ${stripes}
    ${keeper ? `<path d="M40 200 h120" stroke="${c1}" stroke-width="8" opacity=".9"/>` : ''}
    <path d="M84 136 Q100 160 116 136" fill="none" stroke="${keeper ? c1 : c2}" stroke-width="6"/>
    <text x="100" y="214" text-anchor="middle" class="art-chest" fill="${keeper ? '#fff' : c2}" stroke="#05080f">${p.shirt}</text>
    <path d="${jerseyPath}" fill="url(#${jg})"/>
    <path d="${jerseyPath}" fill="none" stroke="currentColor" stroke-opacity=".8" stroke-width="2"/>
  </svg>`;
}

// ------------------------------------------------------------
//  Arte gerada: estádio (vista noturna com refletores)
// ------------------------------------------------------------
export function stadiumArt(s) {
  const [c1, c2] = s.teamData.colors;
  const sky = nid('sky'), beam = nid('bm'), pitch = nid('pt');
  const big = Math.min(1, (s.capacity || 30000) / 78000);
  const w = 150 + big * 40;           // largura da arquibancada
  const x0 = 100 - w / 2, x1 = 100 + w / 2;
  const stars = Array.from({ length: 18 }, (_, i) => `<circle cx="${(i * 47) % 200}" cy="${(i * 29) % 90}" r="${i % 3 ? .7 : 1.1}" fill="#fff" opacity="${.3 + (i % 4) * .15}"/>`).join('');
  const tower = x => `<rect x="${x - 2}" y="40" width="4" height="120" fill="#1b2433"/><rect x="${x - 12}" y="30" width="24" height="12" rx="2" fill="#e9f2ff"/><path d="M${x - 12} 42 L${x - 60} 230 L${x + 60} 230 L${x + 12} 42Z" fill="url(#${beam})"/>`;
  return `
  <svg class="art-stadium" viewBox="0 0 200 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="${sky}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050a18"/><stop offset=".6" stop-color="#0d1d3a"/><stop offset="1" stop-color="${c1}" stop-opacity=".55"/></linearGradient>
      <linearGradient id="${beam}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="${pitch}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f8f4a"/><stop offset="1" stop-color="#0f5a2c"/></linearGradient>
    </defs>
    <rect width="200" height="240" fill="url(#${sky})"/>
    ${stars}
    ${tower(28)}${tower(172)}
    <path d="M${x0} 150 Q100 ${92 - big * 18} ${x1} 150 L${x1} 206 Q100 234 ${x0} 206Z" fill="${c1}"/>
    <path d="M${x0 + 8} 152 Q100 ${104 - big * 14} ${x1 - 8} 152" fill="none" stroke="${c2}" stroke-width="5" opacity=".85"/>
    <path d="M${x0 + 4} 170 Q100 ${130 - big * 10} ${x1 - 4} 170" fill="none" stroke="#fff" stroke-width="1.5" opacity=".35" stroke-dasharray="2 3"/>
    <ellipse cx="100" cy="188" rx="${w / 2 - 22}" ry="22" fill="url(#${pitch})"/>
    <ellipse cx="100" cy="188" rx="${w / 2 - 30}" ry="16" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.2"/>
    <line x1="100" y1="172" x2="100" y2="204" stroke="#fff" stroke-opacity=".55" stroke-width="1.2"/>
    <circle cx="100" cy="188" r="6" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.2"/>
    <path d="M${x0} 206 Q100 234 ${x1} 206 L${x1} 240 L${x0} 240Z" fill="#05080f" opacity=".7"/>
  </svg>`;
}

// ------------------------------------------------------------
//  Arte gerada: mascote (selo com emoji) e herói (quadrinho)
// ------------------------------------------------------------
export function mascotArt(m) {
  const [c1, c2] = m.teamData.colors;
  const g = nid('mg');
  if (m.hero) {
    const villain = m.team === 'vil';
    const burst = Array.from({ length: 16 }, (_, i) => {
      const a = (i / 16) * Math.PI * 2, r = i % 2 ? 62 : 92;
      return `${100 + Math.cos(a) * r},${112 + Math.sin(a) * r}`;
    }).join(' ');
    return `
    <svg class="art-mascot art-hero" viewBox="0 0 200 240" aria-hidden="true">
      <defs>
        <radialGradient id="${g}" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="${villain ? '#3DFF8F' : '#FFE27A'}"/><stop offset="1" stop-color="${villain ? '#1d0a33' : c1}"/></radialGradient>
        <pattern id="${g}h" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="1.6" fill="#000" opacity=".25"/></pattern>
      </defs>
      <polygon points="${burst}" fill="url(#${g})" stroke="#05080f" stroke-width="4" stroke-linejoin="round"/>
      <polygon points="${burst}" fill="url(#${g}h)"/>
      <text x="100" y="146" text-anchor="middle" font-size="92" style="font-family:${EMOJI_FONT}">${m.emoji}</text>
      <text x="166" y="58" class="art-pow" text-anchor="middle">${villain ? 'Z!' : 'POW!'}</text>
    </svg>`;
  }
  return `
  <svg class="art-mascot" viewBox="0 0 200 240" aria-hidden="true">
    <defs><radialGradient id="${g}" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="#05080f"/></radialGradient></defs>
    <circle cx="100" cy="112" r="84" fill="url(#${g})"/>
    <circle cx="100" cy="112" r="84" fill="none" stroke="${c2}" stroke-width="6" opacity=".9"/>
    <circle cx="100" cy="112" r="72" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="4 6" opacity=".8"/>
    <text x="100" y="146" text-anchor="middle" font-size="96" style="font-family:${EMOJI_FONT}">${m.emoji}</text>
  </svg>`;
}

function generatedArt(card) {
  if (card.kind === 'team') return teamArt(card.teamData, card.variant);
  if (card.kind === 'player') return playerArt(card);
  if (card.kind === 'stadium') return stadiumArt(card);
  return mascotArt(card);
}

function artBlock(card) {
  const img = cardImage(card);
  if (!img) return `<div class="f-art">${generatedArt(card)}</div>`;
  return `
    <div class="f-art has-img mode-${img.modo}" style="--img-s:${img.escala};--img-y:${img.y}">
      <img class="art-img" src="${esc(img.src)}" alt="" draggable="false" loading="lazy" onerror="this.parentNode.classList.add('img-fail')">
      <div class="art-fallback">${generatedArt(card)}</div>
    </div>`;
}

// ------------------------------------------------------------
//  Textos de apoio (usados na carta e no detalhe)
// ------------------------------------------------------------
export function abilityText(card) {
  const a = ABILITIES[card.ability];
  return a ? { label: a.label, desc: a.desc(card.power) } : null;
}

export function cardSubtitle(card) {
  const t = card.teamData;
  switch (card.kind) {
    case 'player': return `${POSITIONS[card.pos].label} · ${t.name}`;
    case 'stadium': return `${card.city.split(' · ')[0]} · ${Math.round(card.capacity / 1000)} mil`;
    case 'mascot': {
      const a = abilityText(card);
      return card.hero ? `${card.role} · ${a.label} +${card.power}` : `${t.name} · ${a.label} +${card.power}`;
    }
    default: return card.city;
  }
}

function rarityLine(card) {
  const R = RARITIES[card.rarity];
  return card.rarity === 'comum' && !card.hero ? R.label : `${card.edition} · ${R.label}`;
}

const GEM = {
  comum: '<circle cx="6" cy="6" r="3.2"/>',
  rara: '<path d="M6 1.2 10.8 6 6 10.8 1.2 6Z"/>',
  muito: '<path d="M4 1.5 7.5 6 4 10.5 .5 6Z"/><path d="M8 1.5 11.5 6 8 10.5 4.5 6Z" opacity=".75"/>',
  especial: '<path d="m6 .6 1.6 3.5 3.8.4-2.9 2.6.8 3.8L6 9 2.7 10.9l.8-3.8L.6 4.5l3.8-.4Z"/>',
};
export const gem = r => `<svg class="gem" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">${GEM[r]}</svg>`;

export function rarityTag(r) {
  const R = RARITIES[r];
  return `<span class="rar-tag r-${r}" style="--rc:${R.color}">${gem(r)}${R.label}</span>`;
}

export function cardBack() {
  return `
    <div class="face back">
      <div class="b-grid"></div>
      <div class="b-ring"></div>
      <img class="b-logo" src="assets/logo-versatte.png" alt="" draggable="false">
      <div class="b-title">VERSATTE<span>CARDS</span></div>
    </div>`;
}

/**
 * HTML de uma carta.
 * opts: size sm|md|lg · live (efeitos animados) · flipped (mostra o verso) · count
 */
export function cardHTML(card, { size = 'md', live = false, flipped = false, count = 0, extraClass = '' } = {}) {
  const R = RARITIES[card.rarity];
  const t = card.teamData;
  const col = COLLECTION_BY_ID[card.collection];
  const corner = card.kind === 'player'
    ? `<span class="f-ovr"><b>${card.ovr}</b><i>${card.pos}</i></span>`
    : `<span class="f-num">#${String(card.number).padStart(2, '0')}</span>`;
  const classes = [
    'card', `r-${card.rarity}`, `k-${card.kind}`, `s-${size}`,
    card.variant ? `v-${card.variant}` : '', card.hero ? 'k-hero' : '', card.team === 'vil' ? 'is-villain' : '',
    live ? 'is-live' : '', flipped ? 'flipped' : '', extraClass,
  ].filter(Boolean).join(' ');
  return `
  <div class="${classes}" data-uid="${card.uid}" style="--c1:${t.colors[0]};--c2:${t.colors[1]};--rc:${R.color}">
    <div class="card-tilt">
      <div class="card-flip">
        <div class="face front">
          <div class="f-bg"></div>
          <div class="f-rays"></div>
          ${artBlock(card)}
          <img class="f-wm" src="assets/logo-versatte.png" alt="" draggable="false">
          <div class="f-top">
            ${corner}
            <span class="f-col">${esc(col.short)}</span>
            <span class="f-gem">${gem(card.rarity)}</span>
          </div>
          <div class="f-foot">
            <div class="f-name">${esc(card.name)}</div>
            <div class="f-sub">${esc(cardSubtitle(card))}</div>
            <div class="f-rar">${esc(rarityLine(card))}</div>
          </div>
          <div class="f-holo"></div>
          <div class="f-sparkle"></div>
          <div class="f-frame"></div>
          <div class="f-glare"></div>
        </div>
        ${cardBack()}
      </div>
    </div>
    ${count > 1 ? `<span class="count-badge">×${count}</span>` : ''}
  </div>`;
}

/** Espaço vazio do álbum (carta que falta). */
const SLOT_SIL = {
  team: `<path d="${SHIELD}" fill="none" stroke="currentColor" stroke-width="7" stroke-dasharray="14 10"/><text x="100" y="146" text-anchor="middle">?</text>`,
  player: `<ellipse cx="100" cy="84" rx="28" ry="33" fill="none" stroke="currentColor" stroke-width="7" stroke-dasharray="12 9"/><path d="M18 244 C20 190 38 162 70 150 L86 136 Q100 150 114 136 L130 150 C162 162 180 190 182 244" fill="none" stroke="currentColor" stroke-width="7" stroke-dasharray="12 9"/>`,
  stadium: `<path d="M20 150 Q100 80 180 150 L180 200 Q100 236 20 200Z" fill="none" stroke="currentColor" stroke-width="7" stroke-dasharray="12 9"/><text x="100" y="186" text-anchor="middle">?</text>`,
  mascot: `<circle cx="100" cy="112" r="80" fill="none" stroke="currentColor" stroke-width="7" stroke-dasharray="12 9"/><text x="100" y="146" text-anchor="middle">?</text>`,
};
export function slotHTML(card) {
  const R = RARITIES[card.rarity];
  return `
  <button class="slot r-${card.rarity}" data-uid="${card.uid}" style="--rc:${R.color}" aria-label="${esc(card.name)} — faltando, ${R.label}">
    <span class="slot-num">#${String(card.number).padStart(2, '0')}</span>
    <span class="slot-sil"><svg viewBox="0 0 200 240">${SLOT_SIL[card.kind]}</svg></span>
    <span class="slot-name">${esc(card.name)}</span>
    <span class="slot-rar">${gem(card.rarity)}${card.rarity === 'comum' ? R.label : esc(card.edition)}</span>
  </button>`;
}
