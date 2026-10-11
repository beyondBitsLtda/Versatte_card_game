# Versatte Cards — protótipo

Jogo de cartas colecionáveis para a **Versatte Sports**: o cliente abre um pacote grátis por dia, compra pacotes extras, completa álbuns temáticos e troca o progresso por brindes (cupons, canecas, bonés, bolas e camisas). As cartas também montam um time no **Modo Clube**, uma liga com partidas simuladas.

Protótipo de demonstração desenvolvido por **Beyond Bits**, para validar a ideia com a equipe da Versatte.

## Coleções

| Coleção | Cartas | Comum | Rara | Muito rara | Especial |
|---|---|---|---|---|---|
| **Clubes Série A** | 32 | os 20 escudos oficiais | 6 × Uniforme 2 | 4 × Histórica (retrô) | 2 × Campeão (dourada) |
| **Jogadores** | 56 | 20 atletas do elenco 2026, um por clube, todas as posições | 18 ídolos | 13 lendas | 5 versões Prime |
| **Estádios** | 19 | 6 | 9 | 3 | Maracanã |
| **Mascotes** | 29 | os 20 mascotes oficiais | 4 × Neon | 3 × Lendário | 2 × Supremo |
| **Juízo Final** | 12 | 4 | 3 | 3 | 2 (só em pacote premium) |

- **Jogadores comuns são fictícios** (nomes inventados), para não usar a imagem de atletas em atividade sem licença. Troque-os pelo elenco licenciado em [js/data.js](js/data.js) (`COMMON_PLAYERS`).
- **Juízo Final** é a "Liga dos Mascotes" contra o vilão **Doutor Rebaixamento**. É inspirada em grandes sagas de super-heróis, mas os personagens, nomes e artes são originais, sem marcas de terceiros.

## Imagens das cartas

Arquivo editável: [js/imagens.js](js/imagens.js). Ele traz uma linha por carta (148 no total):

```js
'clube-fla': 'assets/cartas/clubes/clube-fla.png',   // com imagem
'clube-pal': '',                                      // vazio = arte automática
'jog-pele-prime': { src: 'assets/cartas/jogadores/pele.png', modo: 'jogador', escala: 1.05, y: '-2%' },
```

- Se o campo estiver vazio, ou se o arquivo não existir ou falhar ao carregar, a carta usa a arte gerada automaticamente. Nada quebra.
- Os efeitos de raridade (moldura, holográfico, brilho, raios) continuam por cima da imagem.
- Tamanhos recomendados:
  - **Escudo:** PNG transparente, 512×512.
  - **Jogador:** PNG transparente, 600×800, com o busto apoiado na base.
  - **Estádio:** 630×880, preenche a carta.
  - **Mascote:** PNG transparente, 600×600.
- A página **`imagens.html`** (ex.: `https://…/Versatte_card_game/imagens.html`) lista todas as cartas, mostra quais já têm imagem e procura PNGs salvos nos caminhos sugeridos (`assets/cartas/<coleção>/<id>.png`). Ela também gera o trecho pronto para colar no `imagens.js`.

## Modo Clube (aba "Jogar")

1. **Criar o clube:** dê um nome e escolha um **escudo** (carta de Clubes), um **estádio** e um **mascote** entre as cartas que você já tem.
2. **Escalar o elenco:** **5 titulares** (goleiro + 4) e **5 reservas**, em três formações:
   - 2-1-1: defensiva;
   - 1-2-1: equilibrada;
   - 1-1-2: ofensiva.
3. **Disputar a Liga Versatte:** temporada de 8 clubes em turno único, com 7 rodadas. A cada temporada os rivais ficam mais fortes. Também há amistosos rápidos.

### Como as cartas influem no jogo

| Carta | Efeito |
|---|---|
| Jogador | 4 atributos: **ATA** (finalização), **MEI** (criação), **DEF** (marcação) e **GOL** (goleiro). Fora de posição, rende menos. |
| Escudo | **Moral** +0 a +3 em todos os setores, conforme a raridade. Cada titular do mesmo clube do escudo dá **química** +1. |
| Estádio | **Mando** +2 a +7 nos jogos em casa (estádios grandes dão +1). |
| Mascote | Uma **habilidade**: Ataque, Muralha, Meio, Reflexo, Torcida, Pressão (fim de jogo), Raça (quando perdendo), Contra-ataque, Sorte (gol rival na trave) ou Caos (enfraquece o rival). |

### Como a partida é simulada

O motor ([js/game/engine.js](js/game/engine.js)) simula os 90 minutos:

- **Posse de bola:** decidida pela **criação** de cada time.
- **Chances de gol:** dependem de **ataque × defesa**.
- **Finalização:** acerto, defesa, trave ou fora dependem de **ataque × (defesa + goleiro)**.
- **Outros lances:** faltas, cartões, expulsões (o time expulso fica mais fraco), cansaço depois dos 60' e substituições automáticas aos 65'.

A tela da partida ([js/game/match.js](js/game/match.js)) encena o resultado como **futebol de botão** em campo neon. Os efeitos de cada lance:

- **Gol:** "GOOOL", a carta do artilheiro, explosão de partículas, tremor, rede balançando e torcida.
- **Defesa, trave e cartões:** cada um tem seu efeito próprio.
- **Fim de jogo:** tela de vitória ou derrota com o craque do jogo e as estatísticas.
- **Título:** troféu e confete.

A partida tem velocidade 1x/2x/4x e um botão para pular até o fim.

**Recompensas** (alimentam a coleção):

| Situação | Prêmio |
|---|---|
| Vitória | +40 pts |
| Empate | +15 pts |
| Derrota | +5 pts |
| Cada gol | +5 pts |
| 3 vitórias seguidas | +50 pts |
| 5 vitórias seguidas | +1 pacote premium |
| Título | +150 pts e +1 pacote premium |

## Mecânica de sorteio

As regras ficam em [js/data.js](js/data.js) (`PACKS`, `PRIZES`, `SHOP`) e podem ser ajustadas sem mexer no motor:

- **Diário:** 70% comum · 24% rara · 5% muito rara · 1% especial por carta. Tem **55% de tendência a repetir** cartas que o jogador já tem.
- **Premium:** 60/28/10/2% nas 3 primeiras cartas; a 4ª é Rara ou melhor (75/21/4%). Tem **15% de tendência a trazer cartas que faltam**.
- **Garantia:** a cada 15 pacotes premium sem Especial, o próximo traz uma.
- **Repetidas** viram pontos (5/15/40/100); 250 pontos = 1 pacote premium.

## Modo debug

Fica no ícone roxo no topo da tela. Ele oferece:

- **Roteiro de apresentação em 7 passos:** o último é "Montar um clube e jogar a Liga".
- **Coleções e pacotes:** relógio simulado, forçar raridade e preencher coleção.
- **Modo Clube:**
  - dar o kit inicial: escudo, 2 estádios, 2 mascotes e 12 jogadores de todas as posições;
  - dar todas as cartas;
  - criar um clube automático;
  - ir para a última rodada;
  - apagar o clube.
- **Simulação Monte Carlo** do balanceamento.

## Rodar localmente

Os módulos ES não carregam via `file://`; é preciso um servidor estático:

```bash
python -m http.server 8000
# abra http://localhost:8000
```

## Publicar no GitHub Pages

Basta fazer push na branch `main`: o Pages publica a raiz do repositório. Todos os caminhos são relativos e há um `.nojekyll`, então nenhum build é necessário.

## Estrutura

```
index.html              casca do app, intro e barra de navegação
imagens.html            catálogo e conferência das imagens das cartas
css/styles.css          visual base (cartas, pacote 3D, telas)
css/game.css            novos tipos de carta e Modo Clube
js/data.js              coleções, cartas, atributos, raridades, odds, prêmios
js/imagens.js           relação carta → imagem (editável)
js/state.js             progresso do jogador (localStorage)
js/gacha.js             sorteio, garantia e Monte Carlo
js/pack.js              pacote 3D e sequência de abertura
js/cards.js             renderização das cartas (imagem ou arte SVG)
js/views.js             início, álbum, cartas, prêmios, loja, detalhe
js/game/engine.js       Modo Clube: força dos times, simulação e liga
js/game/match.js        Modo Clube: partida animada (futebol de botão)
js/game/club.js         Modo Clube: telas de clube, escalação e liga
js/debug.js             painel de debug
js/fx.js                partículas, sons sintetizados, vibração e tilt 3D
assets/cartas/          imagens das cartas (uma pasta por coleção)
```

## Observações para a versão final

- **Imagens e nomes:** escudos, nomes e imagens de clubes e atletas exigem licenciamento antes do lançamento.
- **Conteúdo:** as curiosidades são demonstrativas e devem ser revisadas pela Versatte.
- **Dados pessoais:** neste protótipo tudo fica só no aparelho. A versão real terá cadastro, pagamentos e resgate de brindes. Ela precisa de backend com sorteio e simulação no servidor (para evitar trapaça) e de adequação à LGPD, avaliada com as áreas de governança e compliance.
- **Probabilidades:** manter a tabela de odds visível na loja é uma boa prática de transparência para mecânicas de pacotes pagos.
