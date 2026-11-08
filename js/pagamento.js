// ============================================================
//  COMPRAS COM DINHEIRO (InfinitePay) E AVISO DE 18+
//  • Aviso de 18+ na primeira abertura (o jogo não é para crianças
//    nem adolescentes: tem pacotes sorteados vendidos com dinheiro).
//  • Checkout: o servidor cria o pedido e o link da InfinitePay; o app
//    leva o jogador até lá (Pix ou cartão) e, na volta, confere o
//    pagamento. Os pacotes só entram depois da confirmação no servidor.
//  • Sem conta online ou sem InfinitePay configurada no servidor, a
//    compra continua simulada (demonstração, sem cobrança).
// ============================================================
import { MIN_AGE, SHOP } from './data.js';
import { ageOn, dayKeyBR } from './economy-core.js';
import { state } from './state.js';
import { isOnline, api, applyProfile, me, paymentsOn, setAdult } from './net/online.js';
import { buyE } from './net/economy.js';
import { icon, esc, el, sheet, toast, fmtMoney, fmtDate, wait } from './ui.js';
import { sfx, haptic } from './fx.js';

const AGE_KEY = 'versatte-18';
const PENDING_KEY = 'versatte-pedido';
const PENDING_MS = 2 * 60 * 60 * 1000;      // depois de 2 h sem confirmação, o app para de perguntar sozinho
const ls = {
  get: k => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* sem armazenamento */ } },
  del: k => { try { localStorage.removeItem(k); } catch { /* sem armazenamento */ } },
};

// ------------------------------------------------------------
//  Aviso de 18+ (primeira abertura neste aparelho)
// ------------------------------------------------------------
export function ageGate() {
  if (ls.get(AGE_KEY) === 'sim') return Promise.resolve();
  return new Promise(resolve => {
    const node = el(`
      <div class="age-gate" role="dialog" aria-modal="true" aria-labelledby="ag-t" aria-describedby="ag-d">
        <div class="ag-card">
          <span class="badge-18 big" aria-hidden="true">${MIN_AGE}+</span>
          <h1 id="ag-t">Jogo para maiores de ${MIN_AGE} anos</h1>
          <p id="ag-d">O Versatte Cards tem pacotes de cartas sorteadas que podem ser comprados com dinheiro. Por isso ele <b>não é destinado a crianças nem a adolescentes</b>.</p>
          <div class="ag-btns">
            <button class="btn primary big" data-adulto>Tenho ${MIN_AGE} anos ou mais</button>
            <button class="btn ghost" data-menor>Tenho menos de ${MIN_AGE}</button>
          </div>
          <p class="fine">Ao continuar, você declara ter ${MIN_AGE} anos ou mais. Na conta online, a idade é conferida pela data de nascimento no cadastro.</p>
        </div>
      </div>`);
    document.body.appendChild(node);
    requestAnimationFrame(() => node.querySelector('[data-adulto]')?.focus());
    node.addEventListener('click', e => {
      if (e.target.closest('[data-adulto]')) {
        ls.set(AGE_KEY, 'sim');
        node.classList.add('out');
        setTimeout(() => { node.remove(); resolve(); }, 250);
      }
      if (e.target.closest('[data-menor]')) {
        node.querySelector('.ag-card').innerHTML = `
          <span class="badge-18 big" aria-hidden="true">${MIN_AGE}+</span>
          <h1>Este jogo não é para você agora</h1>
          <p>O Versatte Cards é só para maiores de ${MIN_AGE} anos. Que tal conhecer as camisas da Versatte enquanto isso?</p>
          <a class="btn primary big" href="https://versattesports.com.br" rel="noopener">Ir para a loja Versatte</a>`;
      }
    });
  });
}

/** Marca o aviso como visto (quem confirma a idade no cadastro não precisa ver de novo). */
export const markAdultDevice = () => ls.set(AGE_KEY, 'sim');

// ------------------------------------------------------------
//  Checkout
// ------------------------------------------------------------
/** As compras são pagas de verdade? (conta online + InfinitePay configurada no servidor) */
export const realPayments = () => isOnline() && paymentsOn();

export function openCheckout(o, app) {
  if (!realPayments()) return simulatedCheckout(o, app);
  const total = o.packs + (o.bonus || 0);
  const s = sheet(`
    <div class="checkout pay">
      <h2>Finalizar compra</h2>
      <div class="co-line"><span>${total} pacote${total > 1 ? 's' : ''} premium${o.bonus ? ` <small>(${o.packs} + ${o.bonus} de bônus)</small>` : ''}</span><b>${fmtMoney(o.price)}</b></div>
      <div class="pay-step" data-step></div>
    </div>`);
  const box = s.node.querySelector('[data-step]');

  const askAge = (msg = '') => {
    box.innerHTML = `
      <form class="age-form" novalidate>
        <p><span class="badge-18" aria-hidden="true">${MIN_AGE}+</span> <b>Confirme sua idade.</b> As compras são só para maiores de ${MIN_AGE} anos. A data serve só para conferir e não fica guardada.</p>
        <label class="field"><span>Data de nascimento</span><input type="date" name="nasc" required max="${dayKeyBR()}" min="1900-01-01"></label>
        <p class="au-err" role="alert">${esc(msg)}</p>
        <button class="btn primary big" type="submit">Confirmar idade</button>
      </form>`;
    const form = box.querySelector('form');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const nasc = form.nasc.value, err = box.querySelector('.au-err'), btn = form.querySelector('button');
      const age = ageOn(nasc);
      if (age === null) { err.textContent = 'Informe uma data de nascimento válida.'; return sfx.ooh(); }
      if (age < MIN_AGE) { err.textContent = `As compras são só para maiores de ${MIN_AGE} anos.`; return sfx.ooh(); }
      btn.disabled = true;
      try { await api('POST', '/eu/maioridade', { nascimento: nasc }); setAdult(); showPay(); }
      catch (ex) { btn.disabled = false; err.textContent = ex.message; sfx.ooh(); }
    });
  };

  const showPay = () => {
    box.innerHTML = `
      <ul class="pay-how">
        <li>${icon.lock}<span>Pagamento seguro na <b>InfinitePay</b>, com <b>Pix</b> ou <b>cartão de crédito</b>. Os dados do cartão ficam só com a InfinitePay.</span></li>
        <li>${icon.pack}<span>Os pacotes entram na sua conta assim que o pagamento for confirmado.</span></li>
        <li>${icon.check}<span>Depois de pagar, toque em <b>Continuar</b> para voltar ao jogo.</span></li>
      </ul>
      <button class="btn primary big" data-pay>Pagar ${fmtMoney(o.price)}</button>
      <p class="fine"><span class="badge-18" aria-hidden="true">${MIN_AGE}+</span> Só para maiores de ${MIN_AGE} anos · limite de ${fmtMoney(SHOP.limitPerDay)} por dia por conta.</p>`;
    box.querySelector('[data-pay]').addEventListener('click', async ev => {
      const b = ev.currentTarget;
      b.disabled = true; b.innerHTML = '<span class="spinner"></span> Abrindo o pagamento…';
      try {
        const r = await api('POST', '/pagamento/criar', { oferta: o.id, volta: location.origin + location.pathname });
        ls.set(PENDING_KEY, JSON.stringify({ id: r.pedido, at: Date.now() }));
        sfx.tap();
        location.assign(r.url);   // a InfinitePay não abre dentro do app: vai para a página dela e volta depois
      } catch (ex) {
        b.disabled = false; b.textContent = `Pagar ${fmtMoney(o.price)}`;
        if (ex.code === 'idade') return askAge(ex.message);
        toast(ex.message, { tone: 'warn', ms: 4500 });
      }
    });
  };

  if (me()?.maior === false) askAge(); else showPay();
}

/** Compra de demonstração (modo offline ou servidor sem InfinitePay): nada é cobrado. */
function simulatedCheckout(o, app) {
  const total = o.packs + (o.bonus || 0);
  const s = sheet(`
    <div class="checkout">
      <h2>Finalizar compra</h2>
      <div class="co-line"><span>${o.label}${o.bonus ? ` + ${o.bonus} bônus` : ''}</span><b>${fmtMoney(o.price)}</b></div>
      <div class="co-pay">
        <label><input type="radio" name="pay" checked><span>Pix</span></label>
        <label><input type="radio" name="pay"><span>Cartão de crédito</span></label>
      </div>
      <button class="btn primary big" data-pay>Pagar ${fmtMoney(o.price)}</button>
      <p class="fine">Demonstração: pagamento simulado, nenhuma cobrança é feita.${isOnline() ? '' : ' Para comprar de verdade, entre com uma conta online.'}</p>
    </div>`);
  s.node.querySelector('[data-pay]').addEventListener('click', async ev => {
    const b = ev.currentTarget;
    b.disabled = true; b.innerHTML = '<span class="spinner"></span> Processando…';
    await wait(1100);
    try { await buyE(o.id); } catch (err) { b.disabled = false; b.textContent = `Pagar ${fmtMoney(o.price)}`; return toast(err.message, { tone: 'warn' }); }
    sfx.win(); haptic([20, 30, 50]);
    s.node.querySelector('.sheet-body').innerHTML = approvedHTML(total);
    s.node.querySelector('[data-now]').addEventListener('click', () => { s.close(); app.open(state.lastCollection, 'premium'); });
    app.refresh();
  });
}

const approvedHTML = (total, recibo) => `
  <div class="claim">
    <div class="claim-ico ok">${icon.check}</div>
    <h2>Compra aprovada!</h2>
    <p class="muted">+${total} pacote${total > 1 ? 's' : ''} premium na sua conta.</p>
    <button class="btn primary big" data-now>Abrir agora</button>
    ${recibo ? `<a class="link-btn" href="${esc(recibo)}" target="_blank" rel="noopener">Ver comprovante</a>` : ''}
    <button class="link-btn" data-close>Depois</button>
  </div>`;

// ------------------------------------------------------------
//  Volta do checkout
//  A InfinitePay devolve o jogador ao jogo com ?order_nsu=…&transaction_nsu=…&slug=…&receipt_url=…
//  O app manda isso ao servidor, que confere na InfinitePay e credita.
// ------------------------------------------------------------
const PARAMS = ['order_nsu', 'transaction_nsu', 'slug', 'receipt_url', 'capture_method'];

export async function resumeCheckout(app) {
  const q = new URLSearchParams(location.search);
  let pend = null;
  try { pend = JSON.parse(ls.get(PENDING_KEY) || 'null'); } catch { pend = null; }
  const voltou = q.has('order_nsu');
  const id = q.get('order_nsu') || (pend && Date.now() - pend.at < PENDING_MS ? pend.id : null);
  const refs = voltou ? { transacao: q.get('transaction_nsu') || undefined, slug: q.get('slug') || undefined, recibo: q.get('receipt_url') || undefined } : {};
  if (voltou) {   // limpa o endereço (sem recarregar)
    PARAMS.forEach(k => q.delete(k));
    history.replaceState(null, '', location.pathname + (q.toString() ? `?${q}` : '') + location.hash);
  }
  if (!id) { if (pend) ls.del(PENDING_KEY); return; }
  if (!isOnline()) return;

  // sem ter voltado pelo checkout: só uma conferida silenciosa (ex.: pagou o Pix e fechou a aba)
  if (!voltou) {
    try {
      const r = await api('GET', `/pagamento/${encodeURIComponent(id)}`);
      if (r.pedido.status === 'creditado') { ls.del(PENDING_KEY); applyProfile(r.perfil); celebrate(r.pedido, app, null); }
      else if (['estornado', 'cancelado'].includes(r.pedido.status)) ls.del(PENDING_KEY);
    } catch (e) { if (e.status === 404) ls.del(PENDING_KEY); }
    return;
  }

  const s = sheet(`
    <div class="claim pay-wait" aria-live="polite">
      <div class="claim-ico"><span class="spinner big"></span></div>
      <h2>Confirmando seu pagamento…</h2>
      <p class="muted" data-msg>Conferindo com a InfinitePay.</p>
    </div>`);
  const msg = t => { const m = s.node.querySelector('[data-msg]'); if (m) m.textContent = t; };
  let r = null;
  const t0 = Date.now();
  try {
    r = await api('POST', '/pagamento/confirmar', { pedido: id, ...refs });
    // Pix pode levar alguns segundos: consulta por até 2 minutos
    while (r.pedido.status !== 'creditado' && ['criado', 'pago'].includes(r.pedido.status) && Date.now() - t0 < 120000) {
      msg(Date.now() - t0 > 20000 ? 'Ainda aguardando a confirmação. Se pagou com Pix, isso pode levar alguns instantes.' : 'Conferindo com a InfinitePay.');
      await wait(3000);
      if (!s.node.isConnected) return;   // fechou a janela: a conferida silenciosa tenta de novo na próxima abertura
      r = await api('GET', `/pagamento/${encodeURIComponent(id)}`);
    }
  } catch (e) {
    if (e.status === 404) ls.del(PENDING_KEY);
    s.node.querySelector('.sheet-body').innerHTML = `
      <div class="claim">
        <div class="claim-ico">${icon.clock}</div>
        <h2>Não deu para confirmar agora</h2>
        <p class="muted">${esc(e.message)}</p>
        <p class="fine">Se o pagamento foi aprovado, os pacotes entram sozinhos assim que a InfinitePay confirmar. Em caso de dúvida, fale com a Versatte informando o pedido <b>${esc(id.slice(0, 8))}</b>.</p>
        <button class="btn primary wide" data-close>Entendi</button>
      </div>`;
    return;
  }
  if (r.pedido.status === 'creditado') {
    ls.del(PENDING_KEY);
    applyProfile(r.perfil);
    s.close();
    return celebrate(r.pedido, app, r.pedido.recibo);
  }
  s.node.querySelector('.sheet-body').innerHTML = `
    <div class="claim">
      <div class="claim-ico">${icon.clock}</div>
      <h2>Pagamento ainda não confirmado</h2>
      <p class="muted">Assim que a InfinitePay confirmar, os pacotes entram na sua conta sozinhos. Você pode continuar jogando.</p>
      <p class="fine">Pedido <b>${esc(id.slice(0, 8))}</b>. Se você não concluiu o pagamento, é só comprar de novo na Loja.</p>
      <button class="btn primary wide" data-close>Continuar jogando</button>
    </div>`;
}

function celebrate(pedido, app, recibo) {
  const total = pedido.conteudo?.premium || 0;
  sfx.win(); haptic([20, 30, 50]);
  const s = sheet(approvedHTML(total, recibo), { onClose: () => app.refresh() });
  s.node.querySelector('[data-now]').addEventListener('click', () => { s.close(); app.open(state.lastCollection, 'premium'); });
}

// ------------------------------------------------------------
//  Últimas compras (Loja)
// ------------------------------------------------------------
const STATUS = {
  criado: ['Aguardando pagamento', 'wait'],
  pago: ['Pago · liberando pacotes', 'wait'],
  creditado: ['Concluída', 'ok'],
  estornado: ['Estornada', 'off'],
};

export async function fillOrders(box) {
  if (!box || !realPayments()) return;
  let r;
  try { r = await api('GET', '/pagamentos'); } catch { return; }
  const pedidos = (r.pedidos || []).filter(p => p.status !== 'criado' || Date.now() - Date.parse(p.criado_em) < PENDING_MS);
  if (!pedidos.length || !box.isConnected) return;
  box.innerHTML = `
    <h3 class="shop-h">Suas compras</h3>
    <ul class="orders" role="list">
      ${pedidos.map(p => {
        const [label, tone] = STATUS[p.status] || [p.status, 'off'];
        const recibo = /^https:\/\//.test(p.recibo || '') ? p.recibo : null;
        return `
        <li class="order">
          <div class="or-txt"><b>${esc(p.descricao.replace(/^Versatte Cards: /, ''))}</b><span>${fmtDate(p.criado_em)} · ${fmtMoney(p.valor / 100)}${p.metodo ? ` · ${p.metodo === 'pix' ? 'Pix' : 'Cartão'}` : ''}</span></div>
          <span class="or-st ${tone}">${label}</span>
          ${recibo ? `<a class="link-btn" href="${esc(recibo)}" target="_blank" rel="noopener">Comprovante</a>` : ''}
        </li>`;
      }).join('')}
    </ul>`;
}
