// Erro com status HTTP e código (o Worker devolve { erro, mensagem } com esse status).
export class HttpError extends Error {
  constructor(status, code, msg) { super(msg || code); this.status = status; this.code = code; }
}
export const erro = (status, code, msg) => { throw new HttpError(status, code, msg); };
