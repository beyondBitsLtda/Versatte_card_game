// Aplica um arquivo .sql no banco do Supabase (mesmo caminho do Studio: /pg/query).
// Mesmo padrão do scripts/migrar.mjs do Abacato no beyond-assist.
//
// NÃO É UM SISTEMA DE MIGRAÇÃO: não guarda histórico nem desfaz nada. Por isso todo
// arquivo em db/ é idempotente (create table if not exists / create or replace).
//
// Uso:  node --env-file=.env scripts/migrar.mjs db/001_versatte.sql
import fs from 'node:fs';
import path from 'node:path';

const arquivo = process.argv[2];
if (!arquivo) { console.error('\nInforme o arquivo:  node --env-file=.env scripts/migrar.mjs db/001_versatte.sql\n'); process.exit(1); }
const base = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!base || !chave) { console.error('faltam SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente (.env).'); process.exit(1); }
const caminho = path.resolve(arquivo);
const sql = fs.readFileSync(caminho, 'utf8');

console.log(`\nAplicando ${path.basename(caminho)} em ${new URL(base).hostname}\n`);
const r = await fetch(`${base}/pg/query`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', apikey: chave, authorization: `Bearer ${chave}` },
  body: JSON.stringify({ query: sql }),
});
const texto = await r.text();
if (!r.ok) { console.error(`Falhou (${r.status}):\n${texto.slice(0, 2000)}`); process.exit(1); }
console.log('OK — SQL aplicado.');

// conferência: as tabelas existem?
const t = await fetch(`${base}/pg/query`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', apikey: chave, authorization: `Bearer ${chave}` },
  body: JSON.stringify({ query: "select table_name from information_schema.tables where table_name like 'versatte_%' order by 1" }),
});
console.log(await t.text());
