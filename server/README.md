# Versatte API (servidor do jogo)

Cloudflare Worker com as contas, o inventário (cartas, moedas e pacotes) e o multiplayer (convites, trocas, amistosos e torneios online) do Versatte Cards.

Segue o mesmo padrão do **Abacato** e do **Lisa_Proof** no beyond-assist:

- **Banco:** o **mesmo Postgres** (Supabase auto-hospedado, `banco.beyond.dev.br`), com tabelas e funções com prefixo próprio, `versatte_*`. Nada nas tabelas da Lisa, do Abacato ou do Proof é alterado.
- **Acesso ao banco:** só pela **service_role**, de dentro do Worker. As tabelas têm RLS ligado e sem policies, então nada fica exposto pela anon key.
- **Login próprio** (`versatte_usuarios`): o navegador estica a senha (PBKDF2-SHA512, 210 mil iterações) e manda só a chave derivada; o servidor guarda um HMAC dela. O segredo de sessão é próprio, então um login da Lisa ou do Abacato não vale aqui.
- **Worker próprio** em `api-versatte.beyond.dev.br`. O deploy é independente do deploy da Lisa.

## Desenvolvimento (sem tocar no banco de produção)

```bash
cd server
npm install           # instala só o PGlite (Postgres embutido, para dev/testes)
npm run dev           # API em http://127.0.0.1:8787 com o SQL real em memória
npm test              # teste de ponta a ponta (2 jogadores: conta, pacote, troca, amistoso, torneio)
node scripts/sqltest.mjs   # testes do SQL (troca atômica, convites, concorrência)
```

Com o jogo aberto em `http://127.0.0.1:8765` (por exemplo, `python -m http.server 8765` na raiz), ele usa a API local automaticamente. Contas criadas com e-mail `@admin.local` viram administradoras no dev, para testar o modo debug.

## Colocar no ar

> **Antes:** é uma solução nova com dados pessoais de clientes (nome e e-mail) num banco compartilhado. Leve à avaliação de Governança e Compliance, e da TI se aplicável. O texto de termos e privacidade do app é um rascunho e precisa ser revisado.

1. **Backup do banco.** Hoje o banco não tem backup (ver `docs/infraestrutura.html` no beyond-assist). Faça um `pg_dump` antes de aplicar.
2. **Aplicar o SQL** (idempotente):
   ```bash
   cp .env.example .env    # preencha SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
   npm run migrar
   ```
   Aplica `db/001_versatte.sql`, `db/002_partida_ao_vivo.sql` e `db/003_pagamentos.sql`, nessa ordem (todas são aditivas e podem rodar de novo). Alternativa: colar os arquivos no SQL Editor do Studio, na mesma ordem.
3. **Segredos do Worker** (não ficam no repositório):
   ```bash
   npx wrangler login
   npx wrangler secret put SUPABASE_URL                # https://banco.beyond.dev.br
   npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   npx wrangler secret put VERSATTE_SESSAO_SECRET      # gere com: node -e "console.log(crypto.randomUUID()+crypto.randomUUID())"
   ```
4. **Deploy:** `npm run deploy`. Isso cria o Worker `versatte-api` e o domínio `api-versatte.beyond.dev.br`. Para usar outro domínio, ajuste `routes` em `wrangler.jsonc` e `API_URL` em `js/config.js`.
5. **Conferir:** `https://api-versatte.beyond.dev.br/saude` deve responder `{"ok":true}`. No jogo, a tela de login passa a mostrar "Servidor online".
6. **Administradores** (liberam o modo debug online):
   ```sql
   update versatte_usuarios set admin = true where email = 'seu@email';
   ```
   O usuário precisa entrar de novo para valer.
7. **Compras com dinheiro (InfinitePay)** — ver a seção abaixo.

Enquanto o servidor não estiver no ar, o jogo mostra "Servidor indisponível" e oferece **Jogar offline (demonstração)**, que funciona como antes.

## Compras com dinheiro (InfinitePay) e 18+

O jogo é **só para maiores de 18 anos** (tem pacotes sorteados vendidos com dinheiro: ECA Digital, Lei 15.211/2025, art. 20). O app mostra o aviso na primeira abertura; o cadastro exige a data de nascimento e o servidor recusa menores. A data **não é guardada**: só `versatte_usuarios.maior_idade_em`. Contas antigas confirmam a idade (`POST /eu/maioridade`) antes da primeira compra.

**Como a compra funciona** (Checkout Integrado da InfinitePay, [documentação](https://www.infinitepay.io/checkout-documentacao)):

1. O app chama `POST /pagamento/criar {oferta, volta}`. O servidor confere idade, oferta e limite do dia (R$ 200, `SHOP.limitPerDay`), grava o pedido (`versatte_pedidos`, status `criado`) e pede o link à InfinitePay (`POST /links`, preço em centavos, `order_nsu` = id do pedido, `redirect_url` = o jogo, `webhook_url` = `/pagamento/webhook`).
2. O jogador paga na página da InfinitePay (Pix ou cartão; os dados do cartão nunca passam pelo Worker) e volta ao jogo com `order_nsu`, `transaction_nsu`, `slug` e `receipt_url` no endereço.
3. O app chama `POST /pagamento/confirmar` e, se preciso, consulta `GET /pagamento/:id` por até 2 minutos. A InfinitePay também avisa por webhook.
4. **Nada é creditado sem o `POST /payment_check`** da InfinitePay, porque o webhook não é assinado. Pago e com o valor certo → `pago` → os pacotes entram no perfil → `creditado`. Cada passo acontece uma vez só: webhook repetido, volta do checkout e consultas não duplicam pacotes.
5. Estorno: faça na InfinitePay (app ou Conta Web) e depois `POST /admin/pedidos/:id/estornar` com uma conta admin. O pedido vira `estornado` e os pacotes ainda não abertos daquela compra saem do perfil.

**Configurar:**

```bash
# InfiniteTag da conta de negócios, SEM o "$" (não é segredo): em wrangler.jsonc → vars.INFINITEPAY_HANDLE
# Opcional (limita cada link a 1 pagamento e 1 hora): chave criada na Conta Web da InfinitePay
npx wrangler secret put INFINITEPAY_API_KEY
npm run deploy
```

- `INFINITEPAY_HANDLE` vazio = compras com dinheiro **desligadas**: a Loja continua com a compra simulada. Com o handle preenchido, a compra simulada é recusada (`410`).
- `JOGO_URL` (vars): para onde a InfinitePay devolve o jogador. O app manda o próprio endereço e o servidor só aceita se a origem estiver em `CORS_ORIGINS`.
- `API_PUBLICA_URL` (opcional): endereço público da API para o webhook. Padrão: o próprio domínio do Worker.
- **Não existe ambiente de teste na InfinitePay**: todo link é real. Teste com a oferta de R$ 4,90 e estorne depois.
- Testes locais (`npm test`) usam um simulador da InfinitePay (`INFINITEPAY_API_URL`), sem cobrança.

Consultas úteis no SQL Editor:

```sql
select id, status, valor, metodo, criado_em, pago_em from versatte_pedidos order by criado_em desc limit 50;
select status, count(*), sum(valor) / 100.0 as reais from versatte_pedidos group by status;
```

## Rotas

| Método | Rota | O que faz |
|---|---|---|
| POST | `/auth/cadastro` | `{nome, email, chave, aceite, nascimento}` → token (recusa menores de 18) |
| POST | `/auth/entrar` | `{email, chave}` → token |
| GET | `/eu` | conta (com `maior`) + perfil (cartas, moedas, pacotes, clube) + `pagamentos` (InfinitePay ligada?) |
| POST | `/eu/maioridade` | `{nascimento}`: conta antiga confirma ter 18+ (a data não é guardada) |
| POST | `/pacote/abrir` | `{colecao, tipo}`: sorteio feito no servidor |
| POST | `/loja/trocar` · `/loja/comprar` | moedas → pacote · compra simulada (só com a InfinitePay desligada) |
| POST | `/pagamento/criar` | `{oferta, volta}` → `{pedido, url}`: pedido + link da InfinitePay |
| POST | `/pagamento/confirmar` | `{pedido, transacao, slug, recibo}`: volta do checkout; confere e credita |
| GET | `/pagamento/:id` · `/pagamentos` | status de um pedido · últimas compras da conta |
| POST | `/pagamento/webhook` | aviso da InfinitePay (sem login; sempre conferido no `payment_check`) |
| POST | `/admin/pedidos/:id/estornar` | estorno (só admin): marca o pedido e tira os pacotes não abertos |
| POST | `/premio/resgatar` | `{premio}`: confere o marco no servidor |
| POST | `/recompensa` | moedas de partidas offline do Modo Clube (com limites) |
| PUT | `/perfil/clube` | clube, campeonatos e troféus |
| POST | `/debug` | ações de debug (só admin) |
| GET | `/caixa` | convites, trocas, partidas e torneios (o app consulta a cada 1,5 a 4 s) |
| GET | `/jogadores?busca=` | lista com presença (online nos últimos 45 s) |
| POST | `/convites` · `/convites/:id/responder` · `/convites/:id/cancelar` | convites (troca, amistoso e torneio) |
| GET/POST | `/trocas/:id` · `/oferta` · `/confirmar` · `/cancelar` | troca: atômica no banco, com controle de versão |
| GET | `/partidas/:id` | partida online: só o 1º tempo até o intervalo; o placar final aparece depois |
| POST | `/partidas/:id/intervalo` | chegou ao intervalo: abre a janela de substituição (30 s, igual para os dois) e devolve o elenco |
| POST | `/partidas/:id/substituicoes` | trocas do intervalo; quando os dois mandam (ou o prazo acaba), o 2º tempo é simulado |
| POST | `/partidas/:id/desistir` | desistência (W.O. 3 x 0, sem moedas para quem desistiu) |
| POST | `/partidas/:id/vista` | o jogador assistiu até o fim (libera o placar na lista e fecha a rodada do torneio) |
| POST/GET | `/torneios` · `/:id` · `/:id/iniciar` · `/:id/pronto` · `/:id/cancelar` | torneio online |

## Decisões e limites conhecidos

- **Tempo real por polling** (consultas periódicas). O plano gratuito de Workers não mantém WebSocket sem Durable Objects. As partidas são simuladas no servidor e os dois assistem ao mesmo resultado, então a latência de 1,5 a 4 s não atrapalha.
- **Partida online em duas fases** (`db/002_partida_ao_vivo.sql`): ao aceitar, o servidor simula só o 1º tempo; no intervalo cada jogador tem 30 s para substituir; depois o 2º tempo é simulado com uma semente nova. O placar final não existe antes disso, então não há como espiar. O estado interno da simulação nunca sai do servidor. Se ninguém aparecer, a partida se encerra sozinha 5 min após o apito (a caixa de entrada e o GET da partida fecham as vencidas).
- **Estilo e velocidade** da partida online são escolhidos por quem desafia (ou organiza o torneio) e valem para os dois.
- **Partidas offline do Modo Clube** ainda são simuladas no aparelho. O servidor só credita as moedas, com limites: no máximo 120 por partida, 1.500 por dia e 3 pacotes por dia, e uma partida a cada 15 s. As partidas **online** são 100% no servidor.
- **Compras com dinheiro pela InfinitePay**, prontas e testadas com um simulador; ficam desligadas até preencher `INFINITEPAY_HANDLE`. Sem o handle, a compra continua simulada (máximo de 5 por dia por conta).
- **Rate limit por IP e por conta** é de melhor esforço, por instância do Worker. Para produção, considere o Rate Limiting da Cloudflare.
- O jogo usa os **mesmos módulos de regra** (`../js/economy-core.js`, `../js/game/*`) no app e no Worker. Ao mudar odds, prêmios ou o motor, publique os dois juntos.
