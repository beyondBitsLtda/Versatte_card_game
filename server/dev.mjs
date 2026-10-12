// ============================================================
//  Servidor de DESENVOLVIMENTO da Versatte API
//  Roda o MESMO Worker (src/index.js) em Node, com o banco em
//  PGlite (Postgres embutido, em memória ou em pasta) aplicando o
//  SQL real (db/*.sql, em ordem). Não toca no banco de produção.
//
//    node dev.mjs            → http://127.0.0.1:8787 (banco em memória)
//    PORT=8788 DATA=./.pgdata node dev.mjs   (banco persistente)
//
//  Contas criadas com e-mail terminado em @admin.local viram admin
//  (para testar o modo debug).
// ============================================================
import http from 'node:http';
import { readFileSync, readdirSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import worker from './src/index.js';

const PORT = +(process.env.PORT || 8787);
const db = new PGlite(process.env.DATA || undefined);
for (const f of readdirSync(new URL('./db/', import.meta.url)).filter(f => f.endsWith('.sql')).sort()) {
  // "notify pgrst" é só para o PostgREST de produção
  await db.exec(readFileSync(new URL(`./db/${f}`, import.meta.url), 'utf8').replace(/^notify .*$/gm, ''));
}

async function rpc(fn, params = {}) {
  if (!/^versatte_[a-z_]+$/.test(fn)) throw new Error('função inválida');
  const keys = Object.keys(params);
  const args = keys.map((k, i) => `${k} => $${i + 1}`).join(', ');
  const values = keys.map(k => { const v = params[k]; return v !== null && typeof v === 'object' ? JSON.stringify(v) : v; });
  const res = await db.query(`select ${fn}(${args}) as r`, values);
  // contas de teste @admin.local viram admin
  if (fn === 'versatte_usuario_criar' && res.rows[0]?.r && String(params.p_email).endsWith('@admin.local')) {
    await db.query('update versatte_usuarios set admin = true where id = $1', [res.rows[0].r.id]);
    res.rows[0].r.admin = true;
  }
  return res.rows[0]?.r ?? null;
}

const env = {
  rpc,
  VERSATTE_SESSAO_SECRET: process.env.VERSATTE_SESSAO_SECRET || 'segredo-de-desenvolvimento-nao-usar-em-producao',
  CORS_ORIGINS: process.env.CORS_ORIGINS || '*',
};

http.createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  const request = new Request(`http://${req.headers.host}${req.url}`, {
    method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body,
  });
  const response = await worker.fetch(request, env);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}).listen(PORT, '127.0.0.1', () => console.log(`Versatte API (dev) em http://127.0.0.1:${PORT}`));
