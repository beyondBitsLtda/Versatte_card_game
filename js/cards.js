// Renderização das cartas (frente gerada em SVG — sem imagens de terceiros).
import { RARITIES, COLLECTION_BY_ID } from './data.js';
import { esc } from './ui.js';

let uidSeq = 0;
const nid = p => `${p}${++uidSeq}`;

const SHIELD = 'M100 10 L178 32 C181 72 182 112 176 142 C166 190 134 214 100 230 C66 214 34 190 24 142 C18 112 19 72 22 32 Z';

function teamPattern(t, clip) {
  const [c1, c2, c3 = c2] = t.colors;
  const g = inner => `<g clip-path="url(#${clip})">${inner}</g>`;
  switch (t.pattern) {
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

export function teamArt(t) {
  const clip = nid('cl'), sh = nid('sh'), st = nid('st');
  return `
  <svg class="art-team" viewBox="0 0 200 240" aria-hidden="true">
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
    <path d="${SHIELD}" transform="translate(0 6)" fill="#000" opacity=".45"/>
    ${teamPattern(t, clip)}
    <path d="${SHIELD}" fill="url(#${sh})"/>
    <rect x="14" y="92" width="172" height="58" rx="6" fill="url(#${st})" clip-path="url(#${clip})"/>
    <text x="100" y="138" text-anchor="middle" class="art-abbr">${esc(t.abbr)}</text>
    <path d="M100 38 l5.9 12 13.2 1.9-9.6 9.3 2.3 13.1L100 68.1l-11.8 6.2 2.3-13.1-9.6-9.3 13.2-1.9Z" fill="#fff" stroke="#05080f" stroke-width="2.5" paint-order="stroke"/>
    <text x="100" y="186" text-anchor="middle" class="art-year">${t.founded}</text>
    <path d="${SHIELD}" fill="none" stroke="currentColor" stroke-width="5"/>
    <path d="${SHIELD}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.2" transform="translate(10 10) scale(.9)"/>
  </svg>`;
}

export function idolArt(idol) {
  const t = idol.teamData;
  const [c1, c2] = t.colors;
  const jg = nid('jg'), hg = nid('hg'), jc = nid('jc');
  const coach = idol.shirt == null;
  const jerseyPath = 'M18 244 C20 190 38 162 70 150 L86 136 Q100 150 114 136 L130 150 C162 162 180 190 182 244 Z';
  const stripes = !coach && (t.pattern === 'stripes' || t.pattern === 'hoops')
    ? `<g clip-path="url(#${jc})" opacity=".9">${t.pattern === 'stripes'
        ? [0, 1, 2, 3].map(i => `<rect x="${40 + i * 34}" y="130" width="17" height="120" fill="${c2}"/>`).join('')
        : [0, 1, 2].map(i => `<rect x="0" y="${168 + i * 26}" width="200" height="13" fill="${c2}"/>`).join('')}</g>`
    : '';
  const jerseyFill = coach ? '#151c2b' : c1;
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
    <text x="100" y="150" text-anchor="middle" class="art-bignum">${coach ? 'T' : idol.shirt}</text>
    <path d="M88 112 L112 112 L115 140 L85 140Z" fill="url(#${hg})"/>
    <ellipse cx="100" cy="84" rx="28" ry="33" fill="url(#${hg})" stroke="currentColor" stroke-opacity=".75" stroke-width="2"/>
    <path d="${jerseyPath}" fill="${jerseyFill}"/>
    ${stripes}
    ${coach
      ? `<path d="M86 136 L100 176 L114 136 Q100 146 86 136Z" fill="#e9eef7"/><path d="M97 146 L103 146 L106 186 L100 194 L94 186Z" fill="${c1}"/>`
      : `<path d="M84 136 Q100 160 116 136" fill="none" stroke="${c2}" stroke-width="6"/>
         <text x="100" y="214" text-anchor="middle" class="art-chest" fill="${c2}" stroke="#05080f">${idol.shirt}</text>`}
    <path d="${jerseyPath}" fill="url(#${jg})"/>
    <path d="${jerseyPath}" fill="none" stroke="currentColor" stroke-opacity=".8" stroke-width="2"/>
  </svg>`;
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
  const sub = card.kind === 'team' ? card.city : `${card.position} · ${t.name}`;
  return `
  <div class="card r-${card.rarity} k-${card.kind} s-${size} ${live ? 'is-live' : ''} ${flipped ? 'flipped' : ''} ${extraClass}"
       data-uid="${card.uid}" style="--c1:${t.colors[0]};--c2:${t.colors[1]};--rc:${R.color}">
    <div class="card-tilt">
      <div class="card-flip">
        <div class="face front">
          <div class="f-bg"></div>
          <div class="f-rays"></div>
          <div class="f-art">${card.kind === 'team' ? teamArt(card) : idolArt(card)}</div>
          <img class="f-wm" src="assets/logo-versatte.png" alt="" draggable="false">
          <div class="f-top">
            <span class="f-num">#${String(card.number).padStart(2, '0')}</span>
            <span class="f-col">${esc(col.short)}</span>
            <span class="f-gem">${gem(card.rarity)}</span>
          </div>
          <div class="f-foot">
            <div class="f-name">${esc(card.name)}</div>
            <div class="f-sub">${esc(sub)}</div>
            <div class="f-rar">${R.label}</div>
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
export function slotHTML(card) {
  const R = RARITIES[card.rarity];
  return `
  <button class="slot r-${card.rarity}" data-uid="${card.uid}" style="--rc:${R.color}" aria-label="${esc(card.name)} — faltando, ${R.label}">
    <span class="slot-num">#${String(card.number).padStart(2, '0')}</span>
    <span class="slot-sil">${card.kind === 'team'
      ? `<svg viewBox="0 0 200 240"><path d="${SHIELD}" fill="none" stroke="currentColor" stroke-width="7" stroke-dasharray="14 10"/><text x="100" y="146" text-anchor="middle">?</text></svg>`
      : `<svg viewBox="0 0 200 240"><ellipse cx="100" cy="84" rx="28" ry="33" fill="none" stroke="currentColor" stroke-width="7" stroke-dasharray="12 9"/><path d="M18 244 C20 190 38 162 70 150 L86 136 Q100 150 114 136 L130 150 C162 162 180 190 182 244" fill="none" stroke="currentColor" stroke-width="7" stroke-dasharray="12 9"/></svg>`}</span>
    <span class="slot-name">${esc(card.name)}</span>
    <span class="slot-rar">${gem(card.rarity)}${R.label}</span>
  </button>`;
}
