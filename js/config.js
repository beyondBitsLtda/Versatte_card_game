// ============================================================
//  Configuração do servidor (Versatte API)
//  • Produção: domínio próprio e, como reserva, o endereço *.workers.dev
//    (se a rede/DNS ainda não enxergar o domínio, o app usa o reserva).
//  • Desenvolvimento (localhost): o servidor local (server/dev.mjs).
//  • Para testar outro endereço: abra o jogo com ?api=https://...
// ============================================================
const params = new URLSearchParams(location.search);
const local = ['localhost', '127.0.0.1'].includes(location.hostname);

export const API_URLS = (params.get('api')
  ? [params.get('api')]
  : local
    ? ['http://127.0.0.1:8787']
    : ['https://api-versatte.beyond.dev.br', 'https://versatte-api.beyondbitslisa.workers.dev']
).map(u => u.replace(/\/$/, ''));

// intervalos de consulta (polling) do modo online, em ms
export const POLL_MS = { idle: 4000, active: 1500 };
