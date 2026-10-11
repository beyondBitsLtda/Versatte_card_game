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

1. **Criar o clube:** dê um nome e escolha um **escudo** (carta de Clubes), um **estádio** e um **mascote**.
2. **Escalar o elenco:** **5 titulares** (goleiro + 4) e **5 reservas**, em três formações:
   - 2-1-1: defensiva;
   - 1-2-1: equilibrada;
   - 1-1-2: ofensiva.
3. **Disputar a Liga Versatte:** temporada de 8 clubes em turno único, com 7 rodadas. A cada temporada os rivais ficam mais fortes. Também há amistosos rápidos.

### Empréstimo do baralho

Quem ainda não tem a carta pode usar o **baralho**, sempre com desempenho reduzido. As regras ficam em `LOAN`, em [js/data.js](js/data.js).

- **Jogadores (sorteados):** você não escolhe o emprestado. Reserva até **3 vagas de empréstimo** no elenco e, **a cada partida**, um jogador do baralho é **sorteado** para cada vaga.
  - Para titulares, o sorteado é da posição da vaga.
  - Chances: 62% comum, 26% rara, 9% muito rara e 3% especial.
  - O sorteado rende **80%**.
  - Antes do jogo, os sorteados são revelados carta a carta. O sorteio fica guardado para aquela partida: sair e voltar não sorteia de novo.
- **Escudo, estádio e mascote:** são escolhidos no baralho, com efeito reduzido.
  - Escudo: moral −2 e sem química.
  - Estádio e mascote: rendem metade.

"Escalar melhores" usa primeiro as suas cartas e cria vagas de empréstimo só onde faltar. Na simulação, um clube sem nenhuma carta vence cerca de 11% dos jogos; com as cartas comuns próprias, cerca de 43%.

### Como as cartas influem no jogo

| Carta | Efeito |
|---|---|
| Jogador | 4 atributos: **ATA** (finalização), **MEI** (criação), **DEF** (marcação) e **GOL** (goleiro). Fora de posição, rende menos. |
| Escudo | **Moral** +0 a +3 em todos os setores, conforme a raridade. Cada titular do mesmo clube do escudo dá **química** +1. |
| Estádio | **Mando** +2 a +7 nos jogos em casa (estádios grandes dão +1). |
| Mascote | Uma **habilidade**: Ataque, Muralha, Meio, Reflexo, Torcida, Pressão (fim de jogo), Raça (quando perdendo), Contra-ataque, Sorte (gol rival na trave) ou Caos (enfraquece o rival). |

### Como a partida é simulada

O motor ([js/game/engine.js](js/game/engine.js)) decide o jogo:

- **Posse de bola:** decidida pela **criação** de cada time.
- **Chances de gol:** dependem de **ataque × defesa**.
- **Finalização:** acerto, defesa, trave ou fora dependem de **ataque × (defesa + goleiro)**.
- **Outros lances:** faltas, cartões, expulsões, cansaço depois dos 60' e substituições aos 65'.

O jogador escolhe no pré-jogo como assistir (a escolha fica salva):

- **⚽ Jogo de botão:** [js/game/match.js](js/game/match.js), descrito abaixo.
- **📄 Texto (Brasfoot):** [js/game/textmatch.js](js/game/textmatch.js). Narração minuto a minuto com:
  - placar com as cores dos times e cronômetro;
  - linha do tempo dos 90 minutos com gols e expulsões;
  - artilheiros com os minutos dos gols;
  - barra de pressão e estatísticas ao vivo (posse, finalizações, no alvo, faltas e cartões);
  - jogadas de preparação antes de cada chance e comentários de ambiente;
  - efeitos de gol, trave e expulsão;
  - controles de velocidade e pausa, e um botão de resultado final.

A tela do jogo de botão **encena** o resultado com física.

**Cada jogador é um agente independente:**

- **Posicionamento:** o bloco do time sobe, desce e corre de lado acompanhando a bola.
- **Sem a bola:** cada um ainda se desloca por conta própria. Atacantes e meias **infiltram** no espaço; defensores **marcam** o atacante mais próximo entre ele e o gol.
- **Pressão e cobertura:** o defensor mais perto **pressiona** o portador e o segundo **faz a cobertura**.
- **Goleiro:** acompanha a bola na frente do gol e **voa** nas defesas.
- **Portador:** conduz com toquinhos, **dribla** fugindo do marcador e escolhe o **passe** pelo companheiro mais livre e mais à frente.

**A bola tem física:**

- **No chão e no ar:** atrito no gramado, altura (passes longos e chutes por cima) e quique.
- **Passe:** mira onde o companheiro **vai estar**.
- **Mureta:** a bola bate na lateral, como no futebol de botão.

**Lances do motor construídos em campo:**

- **Troca de posse:** acontece por **desarme** ou **passe interceptado**.
- **Finalização:** o finalizador se apresenta, recebe, conduz até a zona de chute e bate.
- **Desfechos:** gol na rede, defesa espalmada, trave com rebote ou bola para fora com tiro de meta.
- **Bola parada:** pênalti com o posicionamento de todos fora da área, falta com o jogador derrubado e cartão, expulso saindo pela lateral.
- **Gol:** o artilheiro corre para a bandeirinha, com o time atrás, e há nova saída de bola do meio.

Efeitos: "GOOOL" com a carta do artilheiro, explosão de partículas, tremor, rede balançando, torcida, vibração e telas de vitória e título. A partida tem velocidade 1x/2x/4x e um botão para pular até o fim.

## Economia: moedas Versatte

As moedas são ganhas jogando e trocadas por pacotes na **Loja**. As regras ficam em `COINS` e `SHOP.coinOffers`, em [js/data.js](js/data.js).

| Como ganhar | Moedas |
|---|---|
| Vitória / empate / derrota | +30 / +12 / +5 |
| Cada gol marcado | +4 |
| Não sofrer gol | +6 |
| A cada 3 vitórias seguidas | +40 |
| A cada 5 vitórias seguidas | +1 pacote básico |
| Título da Liga | +200 e +1 pacote premium |
| 2º / 3º / demais | +80 / +40 / +15 |
| Carta repetida | +5 / +15 / +40 / +100 (pela raridade) |
| Amistoso | metade |
| Cadastro | +100 |

| Trocar por | Preço | Conteúdo |
|---|---|---|
| Pacote básico | 120 | 3 cartas, menos repetidas que o diário |
| Pacote premium | 300 | 4 cartas, a 4ª é Rara ou melhor |
| Pacote lendário | 900 | 4 cartas, a 4ª é Muito rara (80%) ou Especial (20%) |

Na média, uma partida rende cerca de 25 moedas. Um pacote básico sai a cada 4 ou 5 jogos e um premium a cada 12, aproximadamente. No fim de cada partida, as moedas "voam" até o contador do topo. Os pacotes ficam guardados em **Meus pacotes**, na tela inicial, e você escolhe em qual coleção abrir.

## Mecânica de sorteio

As regras ficam em [js/data.js](js/data.js) (`PACKS`, `PRIZES`, `SHOP`) e podem ser ajustadas sem mexer no motor:

- **Diário:** 70% comum · 24% rara · 5% muito rara · 1% especial por carta. Tem **55% de tendência a repetir** cartas que o jogador já tem.
- **Premium:** 60/28/10/2% nas 3 primeiras cartas; a 4ª é Rara ou melhor (75/21/4%). Tem **15% de tendência a trazer cartas que faltam**.
- **Garantia:** a cada 15 pacotes premium sem Especial, o próximo traz uma.

## Modo debug

Fica no ícone roxo no topo da tela. Ele oferece:

- **Roteiro de apresentação em 7 passos:** o último é "Montar um clube e jogar a Liga".
- **Coleções e pacotes:** relógio simulado, forçar raridade e preencher coleção.
- **Modo Clube:**
  - dar o kit inicial: escudo, 2 estádios, 2 mascotes e 12 jogadores de todas as posições;
  - dar todas as cartas e +1 pacote lendário ou +500 moedas;
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
js/game/textmatch.js    Modo Clube: partida em texto (estilo Brasfoot)
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
