// ============================================================
//  InfinitePay — Checkout Integrado (link de pagamento hospedado)
//  Documentação: https://www.infinitepay.io/checkout-documentacao
//
//  • POST /links          cria o link (preço em centavos; order_nsu = id do nosso pedido)
//  • POST /payment_check  confere se o pedido foi pago (handle + order_nsu + transaction_nsu + slug)
//
//  O webhook da InfinitePay NÃO é assinado: qualquer um poderia chamar a
//  nossa rota. Por isso nada é creditado sem conferir no payment_check, que
//  só responde paid:true quando todos os dados batem com uma venda real.
//  Os dados do cartão ficam na InfinitePay (nunca passam pelo Worker).
//
//  Configuração (wrangler):
//    INFINITEPAY_HANDLE   (vars)    InfiniteTag da conta, sem o "$". Vazio = compras desligadas.
//    INFINITEPAY_API_KEY  (secret)  opcional: limita o link a 1 pagamento e 1 hora de validade.
//    INFINITEPAY_API_URL  (só testes) endereço de um simulador; em produção fica vazio.
//  Não existe ambiente de teste na InfinitePay: todo link criado é real.
// ============================================================
import { HttpError } from './erros.js';

const API_PADRAO = 'https://api.checkout.infinitepay.io';
const VALIDADE_LINK_MS = 60 * 60 * 1000;

const handleDe = env => String(env.INFINITEPAY_HANDLE || '').trim().replace(/^\$/, '');
export const pagamentosAtivos = env => !!handleDe(env);

/** URL https da InfinitePay (link de checkout, comprovante); qualquer outra coisa vira null. */
export function urlInfinitePay(u, env = {}) {
  try {
    const x = new URL(String(u || ''));
    if (env.INFINITEPAY_API_URL && x.origin === new URL(env.INFINITEPAY_API_URL).origin) return x.href;   // simulador dos testes
    const host = x.hostname.toLowerCase();
    return x.protocol === 'https:' && (host === 'infinitepay.io' || host.endsWith('.infinitepay.io')) ? x.href : null;
  } catch { return null; }
}

async function chamar(env, rota, corpo) {
  const base = String(env.INFINITEPAY_API_URL || API_PADRAO).replace(/\/$/, '');
  const headers = { 'content-type': 'application/json', accept: 'application/json' };
  if (env.INFINITEPAY_API_KEY) headers['x-api-key'] = env.INFINITEPAY_API_KEY;
  let r;
  try {
    r = await fetch(base + rota, { method: 'POST', headers, body: JSON.stringify({ handle: handleDe(env), ...corpo }), signal: AbortSignal.timeout(12000) });
  } catch {
    throw new HttpError(502, 'pagamento-rede', 'Não foi possível falar com a InfinitePay. Tente de novo em instantes.');
  }
  const texto = await r.text();
  let dados = null;
  try { dados = texto ? JSON.parse(texto) : null; } catch { /* resposta que não é JSON */ }
  if (!r.ok) {
    console.error('InfinitePay', rota, r.status, texto.slice(0, 300));
    throw new HttpError(502, 'pagamento', `A InfinitePay recusou a operação (${r.status}). Tente de novo mais tarde.`);
  }
  return dados || {};
}

/**
 * Cria o link de pagamento. Devolve a URL do checkout (o app leva o jogador até lá;
 * a InfinitePay não permite abrir o checkout dentro de iframe ou janela do app).
 */
export async function criarLink(env, { pedido, descricao, valor, cliente, volta, webhook }) {
  const corpo = {
    order_nsu: pedido,
    items: [{ quantity: 1, price: valor, description: descricao }],
    ...(volta && { redirect_url: volta }),
    ...(webhook && { webhook_url: webhook }),
    ...(cliente && { customer: { name: cliente.nome, email: cliente.email } }),
  };
  if (env.INFINITEPAY_API_KEY) {
    corpo.options = { single_payment: true, valid_until: new Date(Date.now() + VALIDADE_LINK_MS).toISOString() };
  }
  const r = await chamar(env, '/links', corpo);
  const url = urlInfinitePay(r.url || r.link || r.checkout_url || r.data?.url, env);
  if (!url) {
    console.error('InfinitePay /links sem URL válida', JSON.stringify(r).slice(0, 300));
    throw new HttpError(502, 'pagamento-link', 'A InfinitePay não devolveu o link de pagamento. Tente de novo mais tarde.');
  }
  return url;
}

/** Confere o pagamento. Sem transaction_nsu e slug não há o que conferir (pedido continua aberto). */
export async function conferir(env, { pedido, transacao, slug }) {
  if (!transacao || !slug) return { pago: false };
  const r = await chamar(env, '/payment_check', { order_nsu: pedido, transaction_nsu: transacao, slug });
  return {
    pago: r.success === true && r.paid === true,
    valor: Number(r.amount) || 0,              // valor original da cobrança (centavos)
    valorPago: Number(r.paid_amount) || 0,     // pode ser maior (parcelado com juros repassados)
    parcelas: Number(r.installments) || 1,
    metodo: String(r.capture_method || ''),
  };
}
