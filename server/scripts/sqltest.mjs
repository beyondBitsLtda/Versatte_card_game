// Teste do SQL no Postgres embutido (PGlite): contas, perfil, troca atômica, convites, caixa.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
const db = new PGlite();
const sql = readFileSync(new URL('../db/001_versatte.sql', import.meta.url), 'utf8');
await db.exec(sql); await db.exec(sql);
const q = async (s, p = []) => (await db.query(s, p)).rows[0]?.r;
const fn = (name, ...args) => q(`select ${name}(${args.map((_, i) => '$' + (i + 1)).join(',')}) r`, args.map(a => (a && typeof a === 'object' ? JSON.stringify(a) : a)));
const ok = (cond, msg) => { console.log(cond ? '✔' : '✘', msg); if (!cond) process.exitCode = 1; };

const A = (await fn('versatte_usuario_criar', 'a@x.com', 'Ana', 'h', 's', 210000, { owned: { 'jog-pele': { n: 2, first: 1, last: 1 } }, coins: 10 })).id;
const B = (await fn('versatte_usuario_criar', 'b@x.com', 'Beto', 'h', 's', 210000, { owned: { 'jog-zico': { n: 1, first: 1, last: 1 } } })).id;
ok(A && B, 'cria duas contas');
ok((await fn('versatte_usuario_criar', 'A@X.com ', 'Ana2', 'h', 's', 210000, {})) === null, 'e-mail repetido (maiúsculas/espaço) é recusado');
ok((await fn('versatte_usuario_por_email', ' a@x.com')).nome === 'Ana', 'busca por e-mail normalizado');

let t = await fn('versatte_troca_criar', A, B);
await fn('versatte_troca_oferta', t.id, A, [{ uid: 'jog-pele', n: 1 }]);
t = await fn('versatte_troca_oferta', t.id, B, [{ uid: 'jog-zico', n: 1 }]);
t = await fn('versatte_troca_confirmar', t.id, A, t.versao);
ok(t.status === 'aberta' && t.ok_a && !t.ok_b, 'só A confirmou: troca continua aberta');
const stale = await fn('versatte_troca_confirmar', t.id, B, t.versao - 1);
ok(stale.aviso === 'oferta mudou' && !stale.ok_b, 'confirmar vendo oferta antiga não vale');
t = await fn('versatte_troca_confirmar', t.id, B, t.versao);
ok(t.status === 'concluida', 'os dois confirmaram: troca concluída');
const pa = await fn('versatte_perfil', A), pb = await fn('versatte_perfil', B);
ok(pa.dados.owned['jog-pele'].n === 1 && pa.dados.owned['jog-zico'].n === 1, 'A ficou com 1 Pelé e 1 Zico');
ok(pb.dados.owned['jog-pele'].n === 1 && !pb.dados.owned['jog-zico'], 'B ficou com o Pelé e sem o Zico');

// troca inválida: a carta sumiu entre a oferta e a confirmação → nada se move
let t2 = await fn('versatte_troca_criar', A, B);
await fn('versatte_troca_oferta', t2.id, B, [{ uid: 'jog-pele', n: 1 }]);
t2 = await fn('versatte_troca_oferta', t2.id, A, [{ uid: 'jog-zico', n: 1 }]);
await db.query(`update versatte_perfis set dados = jsonb_set(dados, '{owned}', (dados->'owned') - 'jog-zico') where usuario_id = $1`, [A]);
t2 = await fn('versatte_troca_confirmar', t2.id, A, t2.versao);
t2 = await fn('versatte_troca_confirmar', t2.id, B, t2.versao);
const pb2 = await fn('versatte_perfil', B);
ok(t2.status === 'aberta' && t2.erro, `troca inválida não conclui (${t2.erro})`);
ok(pb2.dados.owned['jog-pele'].n === 1, 'nada saiu do perfil de B (operação atômica)');

const v = (await fn('versatte_perfil', A)).versao;
ok((await fn('versatte_perfil_salvar', A, null, { club: { name: 'Ana FC' } }, v)) === v + 1, 'gravar perfil com a versão certa');
ok((await fn('versatte_perfil_salvar', A, null, null, v)) === null, 'gravar com versão velha → conflito');

const c = await fn('versatte_convite_criar', A, B, 'amistoso', null, {});
ok((await fn('versatte_convite_criar', A, B, 'amistoso', null, {})).id === c.id, 'convite pendente igual não duplica');
ok((await fn('versatte_convite_responder', c.id, A, true)) === null, 'quem enviou não pode aceitar o próprio convite');
ok((await fn('versatte_convite_responder', c.id, B, true)).status === 'aceito', 'convidado aceita');
await fn('versatte_torneio_criar', A, 'Copa', 'mata', [{ id: A, aceito: true }, { id: B, aceito: false }]);
const cx = await fn('versatte_caixa', B);
ok(cx.convites.length === 1 && cx.trocas.length === 2 && cx.torneios.length === 1, `caixa de B: ${cx.convites.length} convite, ${cx.trocas.length} trocas, ${cx.torneios.length} torneio`);
const js = await fn('versatte_jogadores', A, '');
ok(js.length === 1 && js[0].nome === 'Beto' && js[0].online === true, 'lista de jogadores com presença');
console.log(process.exitCode ? '\nFALHOU' : '\nSQL OK');
