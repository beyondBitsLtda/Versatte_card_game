// ============================================================
//  Senha e sessão — mesmo desenho do Abacato (beyond-assist):
//  • o NAVEGADOR estica a senha (PBKDF2-SHA512, 210 mil iterações,
//    sal derivado do e-mail) e manda só a CHAVE derivada;
//  • o servidor guarda um HMAC dessa chave com sal sorteado por
//    usuário (barato de conferir: cabe no orçamento de CPU do Worker);
//  • a sessão é um token "payload.assinatura" (HMAC-SHA256) com exp
//    dentro do payload, enviado no cabeçalho Authorization (o jogo
//    roda em outro domínio, então cookie SameSite não serviria).
//  Prefixo e segredo próprios: um login do Abacato/Lisa não vale aqui.
// ============================================================
const enc = new TextEncoder();
const TAMANHO_SAL = 16;

export function b64(bytes) {
  let s = '';
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function unb64(texto) {
  const t = String(texto || '').replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(t.length % 4 ? t + '='.repeat(4 - (t.length % 4)) : t);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

/** Compara em tempo constante (não vaza quantos bytes já batem). */
function iguais(a, b) {
  const x = new Uint8Array(a), y = new Uint8Array(b);
  if (x.length !== y.length) return false;
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i];
  return d === 0;
}

async function hmac(chaveBytes, texto) {
  const k = await crypto.subtle.importKey('raw', chaveBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', k, enc.encode(texto));
}

/** Guarda uma chave derivada: HMAC com sal sorteado por usuário. */
export async function selarChave(chave) {
  const sal = crypto.getRandomValues(new Uint8Array(TAMANHO_SAL));
  return { hash: b64(await hmac(sal, chave)), sal: b64(sal) };
}

/** A chave recebida bate com a guardada? Nunca lança. */
export async function conferirChave(chave, hash, sal) {
  if (!chave || !hash || !sal) return false;
  try { return iguais(await hmac(unb64(sal), chave), unb64(hash)); } catch { return false; }
}

/** Chave derivada tem o formato esperado (32 bytes em base64url)? */
export const chaveValida = c => typeof c === 'string' && /^[A-Za-z0-9_-]{43}$/.test(c);

// ---------------- sessão ----------------
export async function criarToken(usuario, segredo, dias = 30) {
  const payload = { id: usuario.id, nome: usuario.nome, adm: !!usuario.admin, exp: Math.floor(Date.now() / 1000) + dias * 86400 };
  const corpo = b64(enc.encode(JSON.stringify(payload)));
  return `${corpo}.${b64(await hmac(enc.encode(segredo), corpo))}`;
}

/** Devolve o payload se o token for válido e não expirou; senão null. */
export async function lerToken(token, segredo) {
  if (!token || !segredo) return null;
  const [corpo, assinatura] = String(token).split('.');
  if (!corpo || !assinatura) return null;
  try {
    if (!iguais(await hmac(enc.encode(segredo), corpo), unb64(assinatura))) return null;
    const p = JSON.parse(new TextDecoder().decode(unb64(corpo)));
    if (!p.exp || p.exp < Date.now() / 1000) return null;
    return p;
  } catch { return null; }
}
