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
   Alternativa: colar `db/001_versatte.sql` no SQL Editor do Studio.
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

Enquanto o servidor não estiver no ar, o jogo mostra "Servidor indisponível" e oferece **Jogar offline (demonstração)**, que funciona como antes.

## Rotas

| Método | Rota | O que faz |
|---|---|---|
| POST | `/auth/cadastro` | `{nome, email, chave, aceite}` → token |
| POST | `/auth/entrar` | `{email, chave}` → token |
| GET | `/eu` | conta + perfil (cartas, moedas, pacotes, clube) |
| POST | `/pacote/abrir` | `{colecao, tipo}`: sorteio feito no servidor |
| POST | `/loja/trocar` · `/loja/comprar` | moedas → pacote · compra (simulada no protótipo) |
| POST | `/premio/resgatar` | `{premio}`: confere o marco no servidor |
| POST | `/recompensa` | moedas de partidas offline do Modo Clube (com limites) |
| PUT | `/perfil/clube` | clube, campeonatos e troféus |
| POST | `/debug` | ações de debug (só admin) |
| GET | `/caixa` | convites, trocas, partidas e torneios (o app consulta a cada 1,5 a 4 s) |
| GET | `/jogadores?busca=` | lista com presença (online nos últimos 45 s) |
| POST | `/convites` · `/convites/:id/responder` · `/convites/:id/cancelar` | convites (troca, amistoso e torneio) |
| GET/POST | `/trocas/:id` · `/oferta` · `/confirmar` · `/cancelar` | troca: atômica no banco, com controle de versão |
| GET/POST | `/partidas/:id` · `/partidas/:id/vista` | partida online (simulada no servidor) |
| POST/GET | `/torneios` · `/:id` · `/:id/iniciar` · `/:id/pronto` · `/:id/cancelar` | torneio online |

## Decisões e limites conhecidos

- **Tempo real por polling** (consultas periódicas). O plano gratuito de Workers não mantém WebSocket sem Durable Objects. As partidas são simuladas no servidor e os dois assistem ao mesmo resultado, então a latência de 1,5 a 4 s não atrapalha.
- **Partidas offline do Modo Clube** ainda são simuladas no aparelho. O servidor só credita as moedas, com limites: no máximo 120 por partida, 1.500 por dia e 3 pacotes por dia, e uma partida a cada 15 s. As partidas **online** são 100% no servidor.
- **Compra de pacotes é simulada** (máximo de 5 por dia por conta). Integrar um gateway de pagamento antes de cobrar de verdade.
- **Rate limit por IP e por conta** é de melhor esforço, por instância do Worker. Para produção, considere o Rate Limiting da Cloudflare.
- O jogo usa os **mesmos módulos de regra** (`../js/economy-core.js`, `../js/game/*`) no app e no Worker. Ao mudar odds, prêmios ou o motor, publique os dois juntos.
