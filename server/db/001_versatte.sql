-- ============================================================
--  VERSATTE CARDS — banco (Postgres do Supabase do beyond-assist)
--
--  Segue o padrão do Abacato/Proof: mesmo banco, tabelas com
--  prefixo próprio (versatte_*), login próprio e acesso só pela
--  service_role (RLS ligado e sem policies = nada fica exposto
--  pela anon key).
--
--  Idempotente: pode rodar mais de uma vez (if not exists /
--  create or replace). Aplicar com:
--    node --env-file=.env server/scripts/migrar.mjs server/db/001_versatte.sql
-- ============================================================

-- gen_random_uuid() é nativo do Postgres 13+ (não precisa de extensão)

-- ------------------------------------------------------------
--  Contas
-- ------------------------------------------------------------
create table if not exists versatte_usuarios (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  nome          text not null,
  senha_hash    text not null,
  senha_sal     text not null,
  senha_iter    int  not null default 210000,
  admin         boolean not null default false,       -- libera o modo debug no servidor
  aceite_termos timestamptz not null,                 -- LGPD: quando aceitou termos e privacidade
  criado_em     timestamptz not null default now(),
  ultimo_login  timestamptz,
  visto_em      timestamptz                           -- presença (online nos últimos 45 s)
);
create index if not exists versatte_usuarios_visto on versatte_usuarios (visto_em desc);
alter table versatte_usuarios enable row level security;

-- ------------------------------------------------------------
--  Perfil: dados = economia (cartas, moedas, pacotes) — escrito só
--  pelo servidor; clube = clube, campeonatos e troféus do jogador.
--  versao = controle otimista de concorrência.
-- ------------------------------------------------------------
create table if not exists versatte_perfis (
  usuario_id    uuid primary key references versatte_usuarios(id) on delete cascade,
  dados         jsonb not null default '{}'::jsonb,
  clube         jsonb not null default '{}'::jsonb,
  versao        int   not null default 0,
  atualizado_em timestamptz not null default now()
);
alter table versatte_perfis enable row level security;

-- ------------------------------------------------------------
--  Multiplayer
-- ------------------------------------------------------------
create table if not exists versatte_convites (
  id           bigint generated always as identity primary key,
  de           uuid not null references versatte_usuarios(id) on delete cascade,
  para         uuid not null references versatte_usuarios(id) on delete cascade,
  modo         text not null check (modo in ('troca', 'amistoso', 'torneio')),
  ref          bigint,                                  -- id da troca / partida / torneio
  status       text not null default 'pendente' check (status in ('pendente', 'aceito', 'recusado', 'cancelado')),
  dados        jsonb not null default '{}'::jsonb,
  criado_em    timestamptz not null default now(),
  respondido_em timestamptz
);
create index if not exists versatte_convites_para on versatte_convites (para, status);
create index if not exists versatte_convites_de on versatte_convites (de, status);
alter table versatte_convites enable row level security;

create table if not exists versatte_trocas (
  id           bigint generated always as identity primary key,
  a            uuid not null references versatte_usuarios(id) on delete cascade,
  b            uuid not null references versatte_usuarios(id) on delete cascade,
  oferta_a     jsonb not null default '[]'::jsonb,       -- [{ "uid": "jog-pele", "n": 1 }]
  oferta_b     jsonb not null default '[]'::jsonb,
  ok_a         boolean not null default false,
  ok_b         boolean not null default false,
  status       text not null default 'aberta' check (status in ('aberta', 'concluida', 'cancelada')),
  erro         text,
  versao       int not null default 0,
  criado_em    timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  concluida_em timestamptz
);
create index if not exists versatte_trocas_a on versatte_trocas (a, status);
create index if not exists versatte_trocas_b on versatte_trocas (b, status);
alter table versatte_trocas enable row level security;

create table if not exists versatte_partidas (
  id           bigint generated always as identity primary key,
  tipo         text not null check (tipo in ('amistoso', 'torneio')),
  torneio_id   bigint,
  rodada       int,
  casa         uuid references versatte_usuarios(id) on delete set null,
  fora         uuid references versatte_usuarios(id) on delete set null,
  casa_bot     text,
  fora_bot     text,
  times        jsonb not null,                           -- times montados pelo servidor
  resultado    jsonb not null,                           -- saída de simulateMatch (+ pênaltis)
  recompensa   jsonb not null default '{}'::jsonb,       -- moedas creditadas por jogador
  vista_casa   boolean not null default false,
  vista_fora   boolean not null default false,
  criado_em    timestamptz not null default now()
);
create index if not exists versatte_partidas_casa on versatte_partidas (casa, criado_em desc);
create index if not exists versatte_partidas_fora on versatte_partidas (fora, criado_em desc);
alter table versatte_partidas enable row level security;

create table if not exists versatte_torneios (
  id            bigint generated always as identity primary key,
  dono          uuid not null references versatte_usuarios(id) on delete cascade,
  nome          text not null,
  formato       text not null check (formato in ('mata', 'pontos')),
  status        text not null default 'convites' check (status in ('convites', 'andamento', 'encerrado', 'cancelado')),
  participantes jsonb not null default '[]'::jsonb,      -- [{ id, nome, tipo: 'humano'|'bot', aceito, pronto }]
  estado        jsonb not null default '{}'::jsonb,      -- chaveamento / tabela
  rodada        int not null default 0,
  campeao       text,
  versao        int not null default 0,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
alter table versatte_torneios enable row level security;

-- ============================================================
--  FUNÇÕES (RPC) — o Worker fala com o banco só por elas
-- ============================================================

-- ---------------- contas ----------------
create or replace function versatte_usuario_criar(p_email text, p_nome text, p_hash text, p_sal text, p_iter int, p_dados jsonb)
returns jsonb language plpgsql as $$
declare u versatte_usuarios;
begin
  insert into versatte_usuarios (email, nome, senha_hash, senha_sal, senha_iter, aceite_termos, ultimo_login, visto_em)
  values (lower(trim(p_email)), trim(p_nome), p_hash, p_sal, p_iter, now(), now(), now())
  on conflict (email) do nothing
  returning * into u;
  if u.id is null then return null; end if;
  insert into versatte_perfis (usuario_id, dados) values (u.id, coalesce(p_dados, '{}'::jsonb));
  return jsonb_build_object('id', u.id, 'email', u.email, 'nome', u.nome, 'admin', u.admin);
end $$;

create or replace function versatte_usuario_por_email(p_email text)
returns jsonb language sql stable as $$
  select jsonb_build_object('id', id, 'email', email, 'nome', nome, 'admin', admin,
                            'senha_hash', senha_hash, 'senha_sal', senha_sal, 'senha_iter', senha_iter)
  from versatte_usuarios where email = lower(trim(p_email));
$$;

create or replace function versatte_usuario_entrou(p_id uuid)
returns void language sql as $$
  update versatte_usuarios set ultimo_login = now(), visto_em = now() where id = p_id;
$$;

create or replace function versatte_usuario(p_id uuid)
returns jsonb language sql stable as $$
  select jsonb_build_object('id', id, 'email', email, 'nome', nome, 'admin', admin) from versatte_usuarios where id = p_id;
$$;

-- ---------------- perfil ----------------
create or replace function versatte_perfil(p_id uuid)
returns jsonb language plpgsql as $$
declare r versatte_perfis;
begin
  select * into r from versatte_perfis where usuario_id = p_id;
  if r.usuario_id is null then
    insert into versatte_perfis (usuario_id) values (p_id) on conflict do nothing;
    select * into r from versatte_perfis where usuario_id = p_id;
  end if;
  return jsonb_build_object('dados', r.dados, 'clube', r.clube, 'versao', r.versao);
end $$;

-- grava com controle de versão: devolve a nova versão, ou null se alguém gravou antes
create or replace function versatte_perfil_salvar(p_id uuid, p_dados jsonb, p_clube jsonb, p_versao int)
returns int language plpgsql as $$
declare v int;
begin
  update versatte_perfis
     set dados = coalesce(p_dados, dados),
         clube = coalesce(p_clube, clube),
         versao = versao + 1,
         atualizado_em = now()
   where usuario_id = p_id and (p_versao is null or versao = p_versao)
  returning versao into v;
  return v;
end $$;

-- ---------------- jogadores / presença ----------------
create or replace function versatte_jogadores(p_id uuid, p_busca text)
returns jsonb language sql stable as $$
  select coalesce(jsonb_agg(x order by x->>'online' desc, x->>'visto' desc nulls last), '[]'::jsonb) from (
    select jsonb_build_object(
      'id', u.id, 'nome', u.nome,
      'online', coalesce(u.visto_em > now() - interval '45 seconds', false),
      'visto', u.visto_em,
      'clube', p.clube->'club'->>'name',
      'escudo', p.clube->'club'->>'crest',
      'temClube', (p.clube->'club') is not null and jsonb_typeof(p.clube->'club') = 'object',
      'cartas', (select count(*) from jsonb_object_keys(coalesce(p.dados->'owned', '{}'::jsonb))),
      'trofeus', coalesce((select sum(value::int) from jsonb_each_text(coalesce(p.clube->'trophies', '{}'::jsonb))), 0)
    ) as x
    from versatte_usuarios u left join versatte_perfis p on p.usuario_id = u.id
    where u.id <> p_id and (p_busca is null or p_busca = '' or u.nome ilike '%' || p_busca || '%')
    order by u.visto_em desc nulls last
    limit 50
  ) t;
$$;

-- ---------------- convites ----------------
create or replace function versatte_convite_criar(p_de uuid, p_para uuid, p_modo text, p_ref bigint, p_dados jsonb)
returns jsonb language plpgsql as $$
declare c versatte_convites;
begin
  -- não repete convite pendente igual
  select * into c from versatte_convites
   where de = p_de and para = p_para and modo = p_modo and status = 'pendente'
     and (p_ref is null or ref = p_ref) limit 1;
  if c.id is null then
    insert into versatte_convites (de, para, modo, ref, dados) values (p_de, p_para, p_modo, p_ref, coalesce(p_dados, '{}'::jsonb))
    returning * into c;
  end if;
  return to_jsonb(c);
end $$;

create or replace function versatte_convite_responder(p_id bigint, p_usuario uuid, p_aceitar boolean)
returns jsonb language plpgsql as $$
declare c versatte_convites;
begin
  update versatte_convites
     set status = case when p_aceitar then 'aceito' else 'recusado' end, respondido_em = now()
   where id = p_id and para = p_usuario and status = 'pendente'
  returning * into c;
  if c.id is null then return null; end if;
  return to_jsonb(c);
end $$;

create or replace function versatte_convite_ref(p_id bigint, p_ref bigint)
returns void language sql as $$ update versatte_convites set ref = p_ref where id = p_id; $$;

create or replace function versatte_convite_cancelar(p_id bigint, p_usuario uuid)
returns jsonb language plpgsql as $$
declare c versatte_convites;
begin
  update versatte_convites set status = 'cancelado', respondido_em = now()
   where id = p_id and de = p_usuario and status = 'pendente' returning * into c;
  if c.id is null then return null; end if;
  return to_jsonb(c);
end $$;

-- ---------------- trocas ----------------
create or replace function versatte_troca_criar(p_a uuid, p_b uuid)
returns jsonb language plpgsql as $$
declare t versatte_trocas;
begin
  insert into versatte_trocas (a, b) values (p_a, p_b) returning * into t;
  return to_jsonb(t);
end $$;

create or replace function versatte_troca(p_id bigint, p_usuario uuid)
returns jsonb language sql stable as $$
  select to_jsonb(t) || jsonb_build_object(
           'nome_a', (select nome from versatte_usuarios where id = t.a),
           'nome_b', (select nome from versatte_usuarios where id = t.b))
    from versatte_trocas t where t.id = p_id and (t.a = p_usuario or t.b = p_usuario);
$$;

-- muda a minha oferta: qualquer mudança desfaz as duas confirmações
create or replace function versatte_troca_oferta(p_id bigint, p_usuario uuid, p_oferta jsonb)
returns jsonb language plpgsql as $$
begin
  update versatte_trocas set
    oferta_a = case when a = p_usuario then p_oferta else oferta_a end,
    oferta_b = case when b = p_usuario then p_oferta else oferta_b end,
    ok_a = false, ok_b = false, erro = null, versao = versao + 1, atualizado_em = now()
  where id = p_id and status = 'aberta' and (a = p_usuario or b = p_usuario);
  return versatte_troca(p_id, p_usuario);
end $$;

create or replace function versatte_troca_cancelar(p_id bigint, p_usuario uuid)
returns jsonb language plpgsql as $$
begin
  update versatte_trocas set status = 'cancelada', versao = versao + 1, atualizado_em = now()
   where id = p_id and status = 'aberta' and (a = p_usuario or b = p_usuario);
  return versatte_troca(p_id, p_usuario);
end $$;

-- move n cópias de uma carta do perfil "de" para o perfil "para" (dentro da transação da troca)
create or replace function versatte_mover_carta(p_de uuid, p_para uuid, p_uid text, p_n int)
returns boolean language plpgsql as $$
declare tem int; agora bigint := (extract(epoch from now()) * 1000)::bigint;
begin
  select coalesce((dados->'owned'->p_uid->>'n')::int, 0) into tem from versatte_perfis where usuario_id = p_de;
  if tem < p_n then return false; end if;
  update versatte_perfis set
    dados = case when tem - p_n <= 0
                 then jsonb_set(dados, '{owned}', (dados->'owned') - p_uid)
                 else jsonb_set(dados, array['owned', p_uid, 'n'], to_jsonb(tem - p_n)) end,
    versao = versao + 1, atualizado_em = now()
  where usuario_id = p_de;
  update versatte_perfis set
    dados = jsonb_set(
      case when dados ? 'owned' then dados else jsonb_set(dados, '{owned}', '{}'::jsonb) end,
      array['owned', p_uid],
      jsonb_build_object(
        'n', coalesce((dados->'owned'->p_uid->>'n')::int, 0) + p_n,
        'first', coalesce(dados->'owned'->p_uid->'first', to_jsonb(agora)),
        'last', to_jsonb(agora),
        'trade', true)),
    versao = versao + 1, atualizado_em = now()
  where usuario_id = p_para;
  return true;
end $$;

-- confirma; se os dois confirmaram, executa a troca de forma atômica
create or replace function versatte_troca_confirmar(p_id bigint, p_usuario uuid, p_versao int)
returns jsonb language plpgsql as $$
declare t versatte_trocas; item jsonb; ok boolean := true;
begin
  select * into t from versatte_trocas where id = p_id and status = 'aberta' and (a = p_usuario or b = p_usuario) for update;
  if t.id is null then return versatte_troca(p_id, p_usuario); end if;
  -- confirmou vendo uma versão antiga da oferta? não vale
  if p_versao is not null and t.versao <> p_versao then return versatte_troca(p_id, p_usuario) || '{"aviso":"oferta mudou"}'::jsonb; end if;
  update versatte_trocas set
    ok_a = ok_a or a = p_usuario, ok_b = ok_b or b = p_usuario, atualizado_em = now()
  where id = p_id returning * into t;
  if not (t.ok_a and t.ok_b) then return versatte_troca(p_id, p_usuario); end if;
  if jsonb_array_length(t.oferta_a) = 0 and jsonb_array_length(t.oferta_b) = 0 then
    update versatte_trocas set ok_a = false, ok_b = false, erro = 'troca vazia' where id = p_id;
    return versatte_troca(p_id, p_usuario);
  end if;
  -- trava os dois perfis em ordem fixa (evita deadlock)
  perform 1 from versatte_perfis where usuario_id in (t.a, t.b) order by usuario_id for update;
  for item in select * from jsonb_array_elements(t.oferta_a) loop
    if not versatte_mover_carta(t.a, t.b, item->>'uid', greatest(1, coalesce((item->>'n')::int, 1))) then ok := false; exit; end if;
  end loop;
  if ok then
    for item in select * from jsonb_array_elements(t.oferta_b) loop
      if not versatte_mover_carta(t.b, t.a, item->>'uid', greatest(1, coalesce((item->>'n')::int, 1))) then ok := false; exit; end if;
    end loop;
  end if;
  if not ok then
    raise exception 'versatte_troca_invalida';
  end if;
  update versatte_trocas set status = 'concluida', concluida_em = now(), versao = versao + 1 where id = p_id;
  return versatte_troca(p_id, p_usuario);
exception when raise_exception then
  -- desfaz tudo o que foi movido (o bloco é atômico) e registra o motivo
  update versatte_trocas set ok_a = false, ok_b = false, erro = 'uma das cartas não está mais disponível', versao = versao + 1 where id = p_id;
  return versatte_troca(p_id, p_usuario);
end $$;

-- ---------------- partidas ----------------
create or replace function versatte_partida_criar(p_tipo text, p_torneio bigint, p_rodada int, p_casa uuid, p_fora uuid,
                                                  p_casa_bot text, p_fora_bot text, p_times jsonb, p_resultado jsonb, p_recompensa jsonb)
returns bigint language sql as $$
  insert into versatte_partidas (tipo, torneio_id, rodada, casa, fora, casa_bot, fora_bot, times, resultado, recompensa)
  values (p_tipo, p_torneio, p_rodada, p_casa, p_fora, p_casa_bot, p_fora_bot, p_times, p_resultado, coalesce(p_recompensa, '{}'::jsonb))
  returning id;
$$;

create or replace function versatte_partida(p_id bigint, p_usuario uuid)
returns jsonb language sql stable as $$
  select to_jsonb(p) from versatte_partidas p where p.id = p_id and (p.casa = p_usuario or p.fora = p_usuario);
$$;

create or replace function versatte_partida_vista(p_id bigint, p_usuario uuid)
returns void language sql as $$
  update versatte_partidas set
    vista_casa = vista_casa or casa = p_usuario,
    vista_fora = vista_fora or fora = p_usuario
  where id = p_id;
$$;

-- ---------------- torneios ----------------
create or replace function versatte_torneio_criar(p_dono uuid, p_nome text, p_formato text, p_participantes jsonb)
returns jsonb language plpgsql as $$
declare t versatte_torneios;
begin
  insert into versatte_torneios (dono, nome, formato, participantes) values (p_dono, p_nome, p_formato, p_participantes) returning * into t;
  return to_jsonb(t);
end $$;

create or replace function versatte_torneio(p_id bigint)
returns jsonb language sql stable as $$ select to_jsonb(t) from versatte_torneios t where t.id = p_id; $$;

create or replace function versatte_torneio_salvar(p_id bigint, p_versao int, p_status text, p_participantes jsonb, p_estado jsonb, p_rodada int, p_campeao text)
returns int language plpgsql as $$
declare v int;
begin
  update versatte_torneios set
    status = coalesce(p_status, status), participantes = coalesce(p_participantes, participantes),
    estado = coalesce(p_estado, estado), rodada = coalesce(p_rodada, rodada), campeao = coalesce(p_campeao, campeao),
    versao = versao + 1, atualizado_em = now()
  where id = p_id and versao = p_versao returning versao into v;
  return v;
end $$;

-- ---------------- caixa de entrada (o que o app consulta a cada poucos segundos) ----------------
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
               'placar', p.resultado->'score', 'nomes', jsonb_build_array(p.times->0->>'name', p.times->1->>'name'),
               'vista', case when p.casa = p_id then p.vista_casa else p.vista_fora end, 'criado_em', p.criado_em)
             order by p.criado_em desc)
        from versatte_partidas p
       where (p.casa = p_id or p.fora = p_id) and p.criado_em > now() - interval '2 days'), '[]'::jsonb),
    'torneios', coalesce((
      select jsonb_agg(jsonb_build_object('id', t.id, 'nome', t.nome, 'formato', t.formato, 'status', t.status,
               'rodada', t.rodada, 'dono', t.dono, 'versao', t.versao, 'campeao', t.campeao, 'participantes', t.participantes)
             order by t.atualizado_em desc)
        from versatte_torneios t
       where exists (select 1 from jsonb_array_elements(t.participantes) e where e->>'id' = p_id::text)
         and (t.status in ('convites', 'andamento') or t.atualizado_em > now() - interval '1 day')
       ), '[]'::jsonb)
  );
end $$;
