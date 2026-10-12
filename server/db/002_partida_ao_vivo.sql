-- ============================================================
--  VERSATTE — 002: partidas online "ao vivo"
--  A partida é jogada em duas fases: o servidor simula só o 1º tempo,
--  os dois jogadores fazem substituições no intervalo (com prazo) e
--  só então o 2º tempo é simulado. Ninguém tem como saber o placar
--  final antes da hora, porque ele ainda não existe.
--
--  Migração ADITIVA e idempotente (pode rodar mais de uma vez):
--  só adiciona colunas e (re)cria funções versatte_*.
--  Partidas antigas ficam com fase = 'fim' (já encerradas).
-- ============================================================

alter table versatte_partidas add column if not exists fase         text not null default 'fim';   -- '1t' | 'fim'
alter table versatte_partidas add column if not exists config       jsonb not null default '{}'::jsonb; -- { estilo, vel, mata }
alter table versatte_partidas add column if not exists estado       jsonb;                          -- simulação parada no intervalo (só o servidor lê)
alter table versatte_partidas add column if not exists subs         jsonb not null default '{}'::jsonb; -- { "0": [...], "1": [...] } trocas do intervalo
alter table versatte_partidas add column if not exists inicio       timestamptz;                    -- apito inicial (igual para os dois)
alter table versatte_partidas add column if not exists prazo        timestamptz;                    -- fim da janela de substituição
alter table versatte_partidas add column if not exists prazo_max    timestamptz;                    -- encerra sozinha se ninguém aparecer
alter table versatte_partidas add column if not exists encerrada_em timestamptz;
alter table versatte_partidas add column if not exists versao       int not null default 0;

create index if not exists versatte_partidas_abertas on versatte_partidas (fase) where fase <> 'fim';

-- ---------------- criar partida (1º tempo já simulado) ----------------
-- Em torneio é idempotente: dois pedidos fechando a mesma rodada ao mesmo
-- tempo recebem a MESMA partida (trava por torneio/rodada até o fim da transação).
create or replace function versatte_partida_nova(p_tipo text, p_torneio bigint, p_rodada int, p_casa uuid, p_fora uuid,
                                                 p_casa_bot text, p_fora_bot text, p_times jsonb, p_resultado jsonb,
                                                 p_config jsonb, p_estado jsonb, p_inicio timestamptz, p_prazo_max timestamptz)
returns bigint language plpgsql as $$
declare v_id bigint;
begin
  if p_torneio is not null then
    perform pg_advisory_xact_lock(hashtext('versatte_partida:' || p_torneio || ':' || coalesce(p_rodada, -1)));
    select id into v_id from versatte_partidas
     where torneio_id = p_torneio and rodada is not distinct from p_rodada
       and casa is not distinct from p_casa and fora is not distinct from p_fora
       and casa_bot is not distinct from p_casa_bot and fora_bot is not distinct from p_fora_bot
     limit 1;
    if v_id is not null then return v_id; end if;
  end if;
  insert into versatte_partidas (tipo, torneio_id, rodada, casa, fora, casa_bot, fora_bot, times, resultado, recompensa,
                                 fase, config, estado, inicio, prazo_max)
  values (p_tipo, p_torneio, p_rodada, p_casa, p_fora, p_casa_bot, p_fora_bot, p_times, p_resultado, '{}'::jsonb,
          '1t', coalesce(p_config, '{}'::jsonb), p_estado, p_inicio, p_prazo_max)
  returning id into v_id;
  return v_id;
end $$;

-- ---------------- ler sem filtro de participante (uso interno do servidor) ----------------
create or replace function versatte_partida_por_id(p_id bigint)
returns jsonb language sql stable as $$ select to_jsonb(p) from versatte_partidas p where p.id = p_id; $$;

-- ---------------- gravar mudanças (concorrência otimista pela versão) ----------------
-- p_dados: só as chaves presentes mudam (fase, resultado, estado, subs, prazo, recompensa, encerrada_em)
create or replace function versatte_partida_salvar(p_id bigint, p_versao int, p_dados jsonb)
returns int language plpgsql as $$
declare v int;
begin
  update versatte_partidas set
    fase         = coalesce(p_dados->>'fase', fase),
    resultado    = coalesce(p_dados->'resultado', resultado),
    estado       = case when p_dados ? 'estado' then nullif(p_dados->'estado', 'null'::jsonb) else estado end,
    subs         = coalesce(p_dados->'subs', subs),
    prazo        = coalesce((p_dados->>'prazo')::timestamptz, prazo),
    recompensa   = coalesce(p_dados->'recompensa', recompensa),
    encerrada_em = coalesce((p_dados->>'encerrada_em')::timestamptz, encerrada_em),
    versao       = versao + 1
  where id = p_id and versao = p_versao
  returning versao into v;
  return v;
end $$;

-- ---------------- marcar como vista ----------------
-- Correção da 001: contra robô (casa/fora nulos) a comparação dava NULL.
create or replace function versatte_partida_vista(p_id bigint, p_usuario uuid)
returns void language sql as $$
  update versatte_partidas set
    vista_casa = vista_casa or coalesce(casa = p_usuario, false),
    vista_fora = vista_fora or coalesce(fora = p_usuario, false)
  where id = p_id;
$$;

-- ---------------- caixa de entrada ----------------
-- Mudança em relação à 001: as partidas trazem fase/prazos/config e o placar
-- só aparece depois que o jogador assistiu (nada de spoiler na lista).
create or replace function versatte_caixa(p_id uuid)
returns jsonb language plpgsql as $$
begin
  update versatte_usuarios set visto_em = now() where id = p_id;
  return jsonb_build_object(
    'agora', now(),
    'online', (select count(*) from versatte_usuarios where visto_em > now() - interval '45 seconds'),
    'convites', coalesce((
      select jsonb_agg(to_jsonb(c) || jsonb_build_object('nome_de', u1.nome, 'nome_para', u2.nome) order by c.criado_em desc)
        from versatte_convites c
        join versatte_usuarios u1 on u1.id = c.de join versatte_usuarios u2 on u2.id = c.para
       where (c.para = p_id or c.de = p_id)
         and (c.status = 'pendente' or c.respondido_em > now() - interval '2 minutes')
         and c.criado_em > now() - interval '1 day'), '[]'::jsonb),
    'trocas', coalesce((
      select jsonb_agg(versatte_troca(t.id, p_id) order by t.atualizado_em desc)
        from versatte_trocas t
       where (t.a = p_id or t.b = p_id)
         and (t.status = 'aberta' or t.atualizado_em > now() - interval '2 minutes')), '[]'::jsonb),
    'partidas', coalesce((
      select jsonb_agg(jsonb_build_object('id', p.id, 'tipo', p.tipo, 'torneio_id', p.torneio_id, 'rodada', p.rodada,
               'casa', p.casa, 'fora', p.fora, 'casa_bot', p.casa_bot, 'fora_bot', p.fora_bot,
               'fase', p.fase, 'config', p.config, 'inicio', p.inicio, 'prazo', p.prazo, 'prazo_max', p.prazo_max,
               'placar', case when p.fase = 'fim' and (case when p.casa = p_id then p.vista_casa else p.vista_fora end)
                              then p.resultado->'score' else null end,
               'nomes', jsonb_build_array(p.times->0->>'name', p.times->1->>'name'),
               'vista', case when p.casa = p_id then p.vista_casa else p.vista_fora end, 'criado_em', p.criado_em)
             order by p.criado_em desc)
        from versatte_partidas p
       where (p.casa = p_id or p.fora = p_id) and p.criado_em > now() - interval '2 days'), '[]'::jsonb),
    'torneios', coalesce((
      select jsonb_agg(jsonb_build_object('id', t.id, 'nome', t.nome, 'formato', t.formato, 'status', t.status,
               'rodada', t.rodada, 'dono', t.dono, 'versao', t.versao, 'campeao', t.campeao, 'participantes', t.participantes,
               'config', t.estado->'config', 'em_jogo', coalesce((t.estado->>'emJogo')::boolean, false))
             order by t.atualizado_em desc)
        from versatte_torneios t
       where exists (select 1 from jsonb_array_elements(t.participantes) e where e->>'id' = p_id::text)
         and (t.status in ('convites', 'andamento') or t.atualizado_em > now() - interval '1 day')
       ), '[]'::jsonb)
  );
end $$;

notify pgrst, 'reload schema';
