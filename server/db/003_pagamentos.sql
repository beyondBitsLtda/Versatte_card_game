-- ============================================================
--  VERSATTE — 003: compras com dinheiro (InfinitePay) e maioridade
--  • Pedidos: cada compra vira um pedido (o id é o order_nsu enviado à
--    InfinitePay). O status só anda para a frente:
--      criado → pago (a InfinitePay confirmou no payment_check)
--             → creditado (os pacotes entraram no perfil)
--    e, pelo administrador, → estornado. Link que falhou → cancelado.
--  • Maioridade: o jogo é só para maiores de 18. Guardamos SÓ quando a
--    pessoa declarou ter 18+ (a data de nascimento não é guardada).
--
--  Migração ADITIVA e idempotente (pode rodar mais de uma vez).
--  Rode depois de 001 e 002.
-- ============================================================

alter table versatte_usuarios add column if not exists maior_idade_em timestamptz;   -- quando declarou ter 18 anos ou mais

create table if not exists versatte_pedidos (
  id            text primary key,                                   -- order_nsu (UUID gerado no Worker)
  usuario_id    uuid not null references versatte_usuarios(id),     -- sem cascade: registro financeiro fica guardado
  oferta        text not null,                                      -- id da oferta (SHOP.offers)
  descricao     text not null,                                      -- texto que aparece no checkout
  valor         int  not null check (valor >= 100),                 -- centavos (mínimo da InfinitePay: R$ 1,00)
  conteudo      jsonb not null,                                     -- o que a compra credita: {"premium": 6}
  status        text not null default 'criado'
                check (status in ('criado', 'pago', 'creditado', 'estornado', 'cancelado')),
  checkout_url  text,                                               -- link da InfinitePay
  slug          text,                                               -- invoice_slug da InfinitePay
  transacao     text unique,                                        -- transaction_nsu da InfinitePay
  metodo        text,                                               -- 'pix' | 'credit_card'
  valor_pago    int,                                                -- centavos (pode ser maior que valor: parcelado com juros)
  parcelas      int,
  recibo_url    text,
  criado_em     timestamptz not null default now(),
  pago_em       timestamptz,
  creditado_em  timestamptz,
  estornado_em  timestamptz,
  atualizado_em timestamptz not null default now()
);
create index if not exists versatte_pedidos_usuario_idx on versatte_pedidos (usuario_id, criado_em desc);
create index if not exists versatte_pedidos_status_idx on versatte_pedidos (status, criado_em desc);
alter table versatte_pedidos enable row level security;   -- sem policies: só a service_role (Worker) acessa

-- ---------------- maioridade ----------------
create or replace function versatte_usuario_maioridade(p_id uuid)
returns void language sql as $$
  update versatte_usuarios set maior_idade_em = coalesce(maior_idade_em, now()) where id = p_id;
$$;

create or replace function versatte_usuario_maior(p_id uuid)
returns boolean language sql stable as $$
  select coalesce((select maior_idade_em is not null from versatte_usuarios where id = p_id), false);
$$;

-- ---------------- pedidos ----------------
create or replace function versatte_pedido_criar(p_id text, p_usuario uuid, p_oferta text, p_descricao text, p_valor int, p_conteudo jsonb)
returns jsonb language sql as $$
  insert into versatte_pedidos (id, usuario_id, oferta, descricao, valor, conteudo)
  values (p_id, p_usuario, p_oferta, p_descricao, p_valor, p_conteudo)
  returning to_jsonb(versatte_pedidos);
$$;

create or replace function versatte_pedido(p_id text)
returns jsonb language sql stable as $$
  select to_jsonb(p) from versatte_pedidos p where p.id = p_id;
$$;

create or replace function versatte_pedido_link(p_id text, p_url text)
returns void language sql as $$
  update versatte_pedidos set checkout_url = p_url, atualizado_em = now() where id = p_id;
$$;

-- guarda as referências da InfinitePay que chegaram antes da confirmação (para conferir de novo depois)
create or replace function versatte_pedido_ref(p_id text, p_slug text, p_transacao text)
returns void language sql as $$
  update versatte_pedidos set slug = coalesce(p_slug, slug), transacao = coalesce(p_transacao, transacao), atualizado_em = now()
  where id = p_id and status = 'criado';
$$;

-- criado → pago (só uma vez; quem chegar depois recebe o pedido como está)
create or replace function versatte_pedido_pago(p_id text, p_slug text, p_transacao text, p_metodo text, p_valor_pago int, p_parcelas int, p_recibo text)
returns jsonb language plpgsql as $$
declare r jsonb;
begin
  update versatte_pedidos
     set status = 'pago', pago_em = now(), atualizado_em = now(),
         slug = coalesce(p_slug, slug), transacao = coalesce(p_transacao, transacao),
         metodo = p_metodo, valor_pago = p_valor_pago, parcelas = p_parcelas, recibo_url = coalesce(p_recibo, recibo_url)
   where id = p_id and status = 'criado'
  returning to_jsonb(versatte_pedidos) into r;
  if r is null then select to_jsonb(p) into r from versatte_pedidos p where p.id = p_id; end if;
  return r;
end $$;

-- pago → creditado
create or replace function versatte_pedido_creditado(p_id text)
returns jsonb language plpgsql as $$
declare r jsonb;
begin
  update versatte_pedidos set status = 'creditado', creditado_em = now(), atualizado_em = now()
   where id = p_id and status = 'pago'
  returning to_jsonb(versatte_pedidos) into r;
  if r is null then select to_jsonb(p) into r from versatte_pedidos p where p.id = p_id; end if;
  return r;
end $$;

-- link não pôde ser criado → cancelado (não conta no limite do dia)
create or replace function versatte_pedido_cancelar(p_id text)
returns void language sql as $$
  update versatte_pedidos set status = 'cancelado', atualizado_em = now() where id = p_id and status = 'criado';
$$;

-- estorno feito na InfinitePay → estornado. Devolve o status anterior (null se já estava estornado).
create or replace function versatte_pedido_estornar(p_id text)
returns text language plpgsql as $$
declare antes text;
begin
  select status into antes from versatte_pedidos where id = p_id for update;
  if antes is null or antes in ('estornado', 'cancelado') then return null; end if;
  update versatte_pedidos set status = 'estornado', estornado_em = now(), atualizado_em = now() where id = p_id;
  return antes;
end $$;

-- quanto a conta gastou: pagos desde p_desde + links ainda abertos criados desde p_pendentes_desde (centavos)
create or replace function versatte_pedidos_gasto(p_usuario uuid, p_desde timestamptz, p_pendentes_desde timestamptz)
returns int language sql stable as $$
  select coalesce(sum(valor), 0)::int from versatte_pedidos
   where usuario_id = p_usuario
     and ((status in ('pago', 'creditado') and pago_em >= p_desde)
       or (status = 'criado' and criado_em >= p_pendentes_desde));
$$;

-- últimas compras da conta (para a Loja)
create or replace function versatte_pedidos_usuario(p_usuario uuid, p_limite int)
returns jsonb language sql stable as $$
  select coalesce(jsonb_agg(to_jsonb(x) order by x.criado_em desc), '[]'::jsonb) from (
    select id, oferta, descricao, valor, status, metodo, parcelas, recibo_url, criado_em, pago_em
      from versatte_pedidos where usuario_id = p_usuario and status <> 'cancelado'
     order by criado_em desc limit greatest(1, least(p_limite, 50))
  ) x;
$$;

notify pgrst, 'reload schema';
