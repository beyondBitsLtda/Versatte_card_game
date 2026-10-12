// ============================================================
//  Configuração do servidor (Versatte API)
//  • Em produção: o Worker em api-versatte.beyond.dev.br
//  • Em desenvolvimento (localhost): o servidor local (server/dev.mjs)
//  • Para testar outro endereço: abra o jogo com ?api=https://...
// ============================================================
const params = new URLSearchParams(location.search);
const local = ['localhost', '127.0.0.1'].includes(location.hostname);

export const API_URL = (params.get('api') || (local ? 'http://127.0.0.1:8787' : 'https://api-versatte.beyond.dev.br')).replace(/\/$/, '');

// intervalos de consulta (polling) do modo online, em ms
export const POLL_MS = { idle: 4000, active: 1500 };
