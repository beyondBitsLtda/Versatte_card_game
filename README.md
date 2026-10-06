# Versatte Cards — protótipo

Jogo de cartas colecionáveis para a **Versatte Sports**: o cliente abre um pacote grátis por dia, compra pacotes extras, completa álbuns temáticos e troca o progresso por brindes (cupons, canecas e camisas).

Protótipo de demonstração desenvolvido por **Beyond Bits**, para validar a ideia com a equipe da Versatte.

## O que tem nesta versão

| Área | Conteúdo |
|---|---|
| Intro | Beyond Bits "apresenta" → logo Versatte com brilho e partículas |
| Cadastro | Conta grátis (nome + e-mail), bônus de 1 pacote premium |
| Coleções | **Série A 2026** (20 clubes) e **Ídolos** (20 lendas dos mesmos clubes) |
| Pacotes | Diário grátis (3 cartas) e premium (4 cartas, a 4ª sempre Rara ou melhor) em 3D, com abertura por deslize |
| Raridades | Comum (prata), Rara (azul neon), Muito rara (holográfico violeta), Especial (ouro, raios e prisma) |
| Álbum | Mostra o que você tem e o que falta, com a raridade e a chance de cada carta |
| Minhas cartas | Vitrine em carrossel com brilho ao vivo, ou grade; filtros e ordenação |
| Detalhe | Ficha da carta, destaque e curiosidade; toque para virar, arraste ou incline o celular |
| Prêmios | Marcos de 25/50/75/100% por coleção + Kit Lendário por completar as duas |
| Loja | Compra simulada, troca de pontos (repetidas viram pontos) e tabela de probabilidades |
| Debug | Roteiro de apresentação, relógio simulado, forçar raridade, preencher coleção, simulação Monte Carlo |

## Mecânica de sorteio

As regras ficam em [js/data.js](js/data.js) (`PACKS`, `PRIZES`, `SHOP`) e podem ser ajustadas sem mexer no motor:

- **Diário:** 70% comum · 24% rara · 5% muito rara · 1% especial por carta, com **55% de tendência a repetir** cartas que o jogador já tem.
- **Premium:** 60/28/10/2% nas 3 primeiras cartas; a 4ª é Rara+ (75/21/4%). **15% de tendência a trazer cartas que faltam.**
- **Garantia:** a cada 15 premium sem Especial, o próximo traz uma.
- **Repetidas** viram pontos (5/15/40/100); 250 pontos = 1 premium.

O botão **Balanceamento (Monte Carlo)** no modo debug mostra quantos dias ou pacotes um jogador leva para chegar a cada marco. Use-o para calibrar o custo dos brindes.

## Rodar localmente

Os módulos ES não carregam via `file://`; é preciso um servidor estático. Exemplo, com Python:

```bash
python -m http.server 8000
# abra http://localhost:8000
```

## Publicar no GitHub Pages

1. Faça commit e push deste diretório para um repositório no GitHub.
2. Em **Settings → Pages**, escolha *Deploy from a branch*, branch `main`, pasta `/ (root)`.
3. O site fica em `https://<usuario>.github.io/<repositorio>/`.

Todos os caminhos são relativos e há um `.nojekyll`, então nenhum build é necessário. No celular, "Adicionar à tela inicial" instala como app (manifest incluso).

O modo debug vem ligado. Para esconder, desligue em Perfil → Modo debug. Para reativar, acesse a URL com `?debug=1`.

## Estrutura

```
index.html            casca do app, intro e barra de navegação
css/styles.css        visual completo (cartas, pacote 3D, animações)
js/data.js            coleções, cartas, raridades, odds, prêmios, loja
js/state.js           progresso do jogador (localStorage)
js/gacha.js           sorteio, garantia e simulação Monte Carlo
js/pack.js            pacote 3D e sequência de abertura
js/cards.js           renderização das cartas (arte em SVG)
js/views.js           telas: início, álbum, cartas, prêmios, loja, detalhe
js/debug.js           painel de debug
js/fx.js              partículas, sons sintetizados, vibração, tilt 3D
assets/               logos recortadas e ícones do app
```

## Observações para a versão final

- **Imagens:** as cartas usam escudos e silhuetas genéricos gerados em SVG. Escudos, nomes e imagens de clubes e atletas exigem licenciamento antes do lançamento.
- **Conteúdo:** as curiosidades são demonstrativas e devem ser revisadas pela Versatte.
- **Dados pessoais:** neste protótipo tudo fica só no aparelho. A versão real terá cadastro de clientes, pagamentos e resgate de brindes. Ela precisa de backend com sorteio no servidor e adequação à LGPD (consentimento, política de privacidade, retenção), avaliada com as áreas de governança e compliance.
- **Probabilidades:** manter a tabela de odds visível na loja é uma boa prática de transparência para mecânicas de pacotes pagos.
