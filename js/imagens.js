// ============================================================
//  RELAÇÃO DE IMAGENS DAS CARTAS — edite este arquivo
// ============================================================
//  Para cada carta, informe o caminho do arquivo (relativo à raiz do site).
//  Deixe '' (vazio) para usar a arte gerada automaticamente (fallback).
//  Se o arquivo não existir ou falhar ao carregar, a carta também volta
//  para a arte automática — nada quebra.
//
//  Formatos aceitos: PNG (recomendado, com fundo transparente), WEBP ou JPG.
//  Pastas sugeridas: assets/cartas/<coleção>/<id-da-carta>.png  (ex.: assets/cartas/clubes/clube-fla.png)
//
//  Tamanhos recomendados por tipo de carta:
//    Clubes     → escudo PNG transparente, 512×512, centralizado
//    Jogadores  → PNG transparente 600×800, recorte do busto apoiado na base
//    Estádios   → imagem 630×880 (proporção da carta), preenche o fundo
//    Mascotes   → PNG transparente 600×600, centralizado
//
//  Ajuste fino (opcional): em vez do texto, use um objeto:
//    'clube-fla': { src: 'assets/cartas/clubes/fla.png', modo: 'conter', escala: 1.1, y: '-4%' }
//      modo:  'conter' (inteira, sem cortar) | 'cobrir' (preenche, pode cortar) | 'jogador' (apoiada na base)
//      escala: zoom da imagem (1 = normal) · y: deslocamento vertical (ex.: '-4%', '10px')
//
//  Os efeitos de raridade (brilho, holográfico, moldura) continuam sendo
//  aplicados por cima de qualquer imagem.
//
//  Para conferir o andamento, abra a página  imagens.html  do site.
// ============================================================

export const IMAGENS = {

  // ---------- Clubes Série A (32 cartas) — escudo PNG transparente 512×512
  'clube-fla-camp': 'assets/cartas/clubes/clube-fla.png',  // #01 Flamengo · Campeão · Especial
  'clube-pal-camp': 'assets/cartas/clubes/clube-pal.png',  // #02 Palmeiras · Campeão · Especial
  'clube-bot-hist': 'assets/cartas/clubes/clube-bot.png',  // #03 Botafogo · Histórica · Muito rara
  'clube-flu-hist': 'assets/cartas/clubes/clube-flu.png',  // #04 Fluminense · Histórica · Muito rara
  'clube-san-hist': 'assets/cartas/clubes/clube-san.png',  // #05 Santos · Histórica · Muito rara
  'clube-vas-hist': 'assets/cartas/clubes/clube-vas.png',  // #06 Vasco · Histórica · Muito rara
  'clube-cam-u2': 'assets/cartas/clubes/clube-cam.png',  // #07 Atlético-MG · Uniforme 2 · Rara
  'clube-cor-u2': 'assets/cartas/clubes/clube-cor.png',  // #08 Corinthians · Uniforme 2 · Rara
  'clube-cru-u2': 'assets/cartas/clubes/clube-cru.png',  // #09 Cruzeiro · Uniforme 2 · Rara
  'clube-gre-u2': 'assets/cartas/clubes/clube-gre.png',  // #10 Grêmio · Uniforme 2 · Rara
  'clube-int-u2': 'assets/cartas/clubes/clube-int.png',  // #11 Internacional · Uniforme 2 · Rara
  'clube-sao-u2': 'assets/cartas/clubes/clube-sao.png',  // #12 São Paulo · Uniforme 2 · Rara
  'clube-cap': 'assets/cartas/clubes/clube-cap.png',  // #13 Athletico-PR · Escudo oficial · Comum
  'clube-cam': 'assets/cartas/clubes/clube-cam.png',  // #14 Atlético-MG · Escudo oficial · Comum
  'clube-bah': 'assets/cartas/clubes/clube-bah.png',  // #15 Bahia · Escudo oficial · Comum
  'clube-bot': 'assets/cartas/clubes/clube-bot.png',  // #16 Botafogo · Escudo oficial · Comum
  'clube-rbb': 'assets/cartas/clubes/clube-rbb.png',  // #17 Bragantino · Escudo oficial · Comum
  'clube-cha': 'assets/cartas/clubes/clube-cha.png',  // #18 Chapecoense · Escudo oficial · Comum
  'clube-cor': 'assets/cartas/clubes/clube-cor.png',  // #19 Corinthians · Escudo oficial · Comum
  'clube-cfc': 'assets/cartas/clubes/clube-cfc.png',  // #20 Coritiba · Escudo oficial · Comum
  'clube-cru': 'assets/cartas/clubes/clube-cru.png',  // #21 Cruzeiro · Escudo oficial · Comum
  'clube-fla': 'assets/cartas/clubes/clube-fla.png',  // #22 Flamengo · Escudo oficial · Comum
  'clube-flu': 'assets/cartas/clubes/clube-flu.png',  // #23 Fluminense · Escudo oficial · Comum
  'clube-gre': 'assets/cartas/clubes/clube-gre.png',  // #24 Grêmio · Escudo oficial · Comum
  'clube-int': 'assets/cartas/clubes/clube-int.png',  // #25 Internacional · Escudo oficial · Comum
  'clube-mir': 'assets/cartas/clubes/clube-mir.png',  // #26 Mirassol · Escudo oficial · Comum
  'clube-pal': 'assets/cartas/clubes/clube-pal.png',  // #27 Palmeiras · Escudo oficial · Comum
  'clube-rem': 'assets/cartas/clubes/clube-rem.png',  // #28 Remo · Escudo oficial · Comum
  'clube-san': 'assets/cartas/clubes/clube-san.png',  // #29 Santos · Escudo oficial · Comum
  'clube-sao': 'assets/cartas/clubes/clube-sao.png',  // #30 São Paulo · Escudo oficial · Comum
  'clube-vas': 'assets/cartas/clubes/clube-vas.png',  // #31 Vasco · Escudo oficial · Comum
  'clube-vit': 'assets/cartas/clubes/clube-vit.png',  // #32 Vitória · Escudo oficial · Comum

  // ---------- Jogadores (56 cartas) — foto do jogador em ação (JPG) ou PNG transparente 600×800
  'jog-garrincha-prime': 'assets/cartas/jogadores/jog-garrincha-prime.jpg',  // #01 Garrincha · Prime · Especial
  'jog-pele-prime': 'assets/cartas/jogadores/jog-pele-prime.jpg',  // #02 Pelé · Prime · Especial
  'jog-romario-prime': 'assets/cartas/jogadores/jog-romario-prime.jpg',  // #03 Romário · Prime · Especial
  'jog-ronaldo-prime': 'assets/cartas/jogadores/jog-ronaldo-prime.jpg',  // #04 Ronaldo · Prime · Especial
  'jog-zico-prime': 'assets/cartas/jogadores/jog-zico-prime.jpg',  // #05 Zico · Prime · Especial
  'jog-ademir': 'assets/cartas/jogadores/jog-ademir.jpg',  // #06 Ademir da Guia · Lenda · Muito rara
  'jog-cafu': 'assets/cartas/jogadores/jog-cafu.jpg',  // #07 Cafu · Lenda · Muito rara
  'jog-falcao': 'assets/cartas/jogadores/jog-falcao.jpg',  // #08 Falcão · Lenda · Muito rara
  'jog-figueroa': 'assets/cartas/jogadores/jog-figueroa.jpg',  // #09 Figueroa · Lenda · Muito rara
  'jog-garrincha': 'assets/cartas/jogadores/jog-garrincha.jpg',  // #10 Garrincha · Lenda · Muito rara
  'jog-marcos': 'assets/cartas/jogadores/jog-marcos.jpg',  // #11 Marcos · Lenda · Muito rara
  'jog-nilton-santos': 'assets/cartas/jogadores/jog-nilton-santos.jpg',  // #12 Nilton Santos · Lenda · Muito rara
  'jog-pele': 'assets/cartas/jogadores/jog-pele.jpg',  // #13 Pelé · Lenda · Muito rara
  'jog-rivellino': 'assets/cartas/jogadores/jog-rivellino.jpg',  // #14 Rivellino · Lenda · Muito rara
  'jog-dinamite': 'assets/cartas/jogadores/jog-dinamite.jpg',  // #15 Roberto Dinamite · Lenda · Muito rara
  'jog-ceni': 'assets/cartas/jogadores/jog-ceni.jpg',  // #16 Rogério Ceni · Lenda · Muito rara
  'jog-socrates': 'assets/cartas/jogadores/jog-socrates.jpg',  // #17 Sócrates · Lenda · Muito rara
  'jog-zico': 'assets/cartas/jogadores/jog-zico.jpg',  // #18 Zico · Lenda · Muito rara
  'jog-ruschel': 'assets/cartas/jogadores/jog-ruschel.jpg',  // #19 Alan Ruschel · Ídolo · Rara
  'jog-alcino': 'assets/cartas/jogadores/jog-alcino.jpg',  // #20 Alcino · Ídolo · Rara
  'jog-alex': 'assets/cartas/jogadores/jog-alex.jpg',  // #21 Alex · Ídolo · Rara
  'jog-bebeto': 'assets/cartas/jogadores/jog-bebeto.jpg',  // #22 Bebeto · Ídolo · Rara
  'jog-bobo': 'assets/cartas/jogadores/jog-bobo.jpg',  // #23 Bobô · Ídolo · Rara
  'jog-castilho': 'assets/cartas/jogadores/jog-castilho.jpg',  // #24 Castilho · Ídolo · Rara
  'jog-clodoaldo': 'assets/cartas/jogadores/jog-clodoaldo.jpg',  // #25 Clodoaldo · Ídolo · Rara
  'jog-fred': 'assets/cartas/jogadores/jog-fred.jpg',  // #26 Fred · Ídolo · Rara
  'jog-gamarra': 'assets/cartas/jogadores/jog-gamarra.jpg',  // #27 Gamarra · Ídolo · Rara
  'jog-leandro': 'assets/cartas/jogadores/jog-leandro.jpg',  // #28 Leandro · Ídolo · Rara
  'jog-lugano': 'assets/cartas/jogadores/jog-lugano.jpg',  // #29 Lugano · Ídolo · Rara
  'jog-luis-pereira': 'assets/cartas/jogadores/jog-luis-pereira.jpg',  // #30 Luís Pereira · Ídolo · Rara
  'jog-mauro-silva': 'assets/cartas/jogadores/jog-mauro-silva.jpg',  // #31 Mauro Silva · Ídolo · Rara
  'jog-reinaldo': 'assets/cartas/jogadores/jog-reinaldo.jpg',  // #32 Reinaldo · Ídolo · Rara
  'jog-renato': 'assets/cartas/jogadores/jog-renato.jpg',  // #33 Renato Gaúcho · Ídolo · Rara
  'jog-sicupira': 'assets/cartas/jogadores/jog-sicupira.jpg',  // #34 Sicupira · Ídolo · Rara
  'jog-tostao': 'assets/cartas/jogadores/jog-tostao.jpg',  // #35 Tostão · Ídolo · Rara
  'jog-victor': 'assets/cartas/jogadores/jog-victor.jpg',  // #36 Victor · Ídolo · Rara
  'jog-breno-lacerda': '',                 // #37 Breno Lacerda · Elenco 2026 · Comum
  'jog-caio-lemos': '',                    // #38 Caio Lemos · Elenco 2026 · Comum
  'jog-davi-rocha': '',                    // #39 Davi Rocha · Elenco 2026 · Comum
  'jog-diego-zanella': '',                 // #40 Diego Zanella · Elenco 2026 · Comum
  'jog-enzo-carvalho': '',                 // #41 Enzo Carvalho · Elenco 2026 · Comum
  'jog-felipe-kruger': '',                 // #42 Felipe Krüger · Elenco 2026 · Comum
  'jog-gustavo-neri': '',                  // #43 Gustavo Neri · Elenco 2026 · Comum
  'jog-henrique-bauer': '',                // #44 Henrique Bauer · Elenco 2026 · Comum
  'jog-icaro-santana': '',                 // #45 Ícaro Santana · Elenco 2026 · Comum
  'jog-igor-paiva': '',                    // #46 Igor Paiva · Elenco 2026 · Comum
  'jog-jonas-bezerra': '',                 // #47 Jonas Bezerra · Elenco 2026 · Comum
  'jog-kaua-mendes': '',                   // #48 Kauã Mendes · Elenco 2026 · Comum
  'jog-luan-cerqueira': '',                // #49 Luan Cerqueira · Elenco 2026 · Comum
  'jog-lucas-fontes': '',                  // #50 Lucas Fontes · Elenco 2026 · Comum
  'jog-marlon-siqueira': '',               // #51 Marlon Siqueira · Elenco 2026 · Comum
  'jog-matheus-prado': '',                 // #52 Matheus Prado · Elenco 2026 · Comum
  'jog-pedro-almeida': '',                 // #53 Pedro Almeida · Elenco 2026 · Comum
  'jog-rafael-teixeira': '',               // #54 Rafael Teixeira · Elenco 2026 · Comum
  'jog-renan-sousa': '',                   // #55 Renan Sousa · Elenco 2026 · Comum
  'jog-thiago-brandao': '',                // #56 Thiago Brandão · Elenco 2026 · Comum

  // ---------- Estádios (19 cartas) — foto/arte 630×880 (preenche a carta)
  'estadio-maracana': 'assets/cartas/estadios/estadio-maracana.jpg',  // #01 Maracanã · Estádio · Especial
  'estadio-arena-mrv': 'assets/cartas/estadios/estadio-arena-mrv.jpg',  // #02 Arena MRV · Estádio · Muito rara
  'estadio-mineirao': 'assets/cartas/estadios/estadio-mineirao.jpg',  // #03 Mineirão · Estádio · Muito rara
  'estadio-morumbis': 'assets/cartas/estadios/estadio-morumbis.jpg',  // #04 MorumBIS · Estádio · Muito rara
  'estadio-allianz': 'assets/cartas/estadios/estadio-allianz.jpg',  // #05 Allianz Parque · Estádio · Rara
  'estadio-arena-gremio': 'assets/cartas/estadios/estadio-arena-gremio.jpg',  // #06 Arena do Grêmio · Estádio · Rara
  'estadio-fonte-nova': 'assets/cartas/estadios/estadio-fonte-nova.jpg',  // #07 Arena Fonte Nova · Estádio · Rara
  'estadio-beira-rio': 'assets/cartas/estadios/estadio-beira-rio.jpg',  // #08 Beira-Rio · Estádio · Rara
  'estadio-ligga-arena': 'assets/cartas/estadios/estadio-ligga-arena.jpg',  // #09 Ligga Arena · Estádio · Rara
  'estadio-neo-quimica': 'assets/cartas/estadios/estadio-neo-quimica.jpg',  // #10 Neo Química Arena · Estádio · Rara
  'estadio-nilton-santos': 'assets/cartas/estadios/estadio-nilton-santos.jpg',  // #11 Nilton Santos · Estádio · Rara
  'estadio-sao-januario': 'assets/cartas/estadios/estadio-sao-januario.jpg',  // #12 São Januário · Estádio · Rara
  'estadio-vila-belmiro': 'assets/cartas/estadios/estadio-vila-belmiro.jpg',  // #13 Vila Belmiro · Estádio · Rara
  'estadio-arena-conda': 'assets/cartas/estadios/estadio-arena-conda.jpg',  // #14 Arena Condá · Estádio · Comum
  'estadio-barradao': 'assets/cartas/estadios/estadio-barradao.jpg',  // #15 Barradão · Estádio · Comum
  'estadio-couto-pereira': 'assets/cartas/estadios/estadio-couto-pereira.jpg',  // #16 Couto Pereira · Estádio · Comum
  'estadio-maiao': 'assets/cartas/estadios/estadio-maiao.jpg',  // #17 Maião · Estádio · Comum
  'estadio-mangueirao': 'assets/cartas/estadios/estadio-mangueirao.jpg',  // #18 Mangueirão · Estádio · Comum
  'estadio-nabi-abi-chedid': 'assets/cartas/estadios/estadio-nabi-abi-chedid.jpg',  // #19 Nabi Abi Chedid · Estádio · Comum

  // ---------- Mascotes (29 cartas) — mascote PNG transparente 600×600
  'masc-pal-supremo': 'assets/cartas/mascotes/masc-pal.jpg',  // #01 Porco Supremo · Supremo · Especial
  'masc-fla-supremo': 'assets/cartas/mascotes/masc-fla.jpg',  // #02 Urubu Supremo · Supremo · Especial
  'masc-san-lendario': 'assets/cartas/mascotes/masc-san.jpg',  // #03 Baleia Lendária · Lendário · Muito rara
  'masc-cor-lendario': 'assets/cartas/mascotes/masc-cor.jpg',  // #04 Mosqueteiro Alvinegro Lendário · Lendário · Muito rara
  'masc-int-lendario': 'assets/cartas/mascotes/masc-int.jpg',  // #05 Saci Lendário · Lendário · Muito rara
  'masc-cam-neon': 'assets/cartas/mascotes/masc-cam.jpg',  // #06 Galo Neon · Neon · Rara
  'masc-pal-neon': 'assets/cartas/mascotes/masc-pal.jpg',  // #07 Porco Neon · Neon · Rara
  'masc-cru-neon': 'assets/cartas/mascotes/masc-cru.jpg',  // #08 Raposa Neon · Neon · Rara
  'masc-fla-neon': 'assets/cartas/mascotes/masc-fla.jpg',  // #09 Urubu Neon · Neon · Rara
  'masc-vas': 'assets/cartas/mascotes/masc-vas.jpg',  // #10 Almirante · Oficial · Comum
  'masc-san': 'assets/cartas/mascotes/masc-san.jpg',  // #11 Baleia · Oficial · Comum
  'masc-bot': 'assets/cartas/mascotes/masc-bot.jpg',  // #12 Biriba · Oficial · Comum
  'masc-flu': 'assets/cartas/mascotes/masc-flu.jpg',  // #13 Cartola · Oficial · Comum
  'masc-cap': 'assets/cartas/mascotes/masc-cap.jpg',  // #14 Furacão · Oficial · Comum
  'masc-cam': 'assets/cartas/mascotes/masc-cam.jpg',  // #15 Galo · Oficial · Comum
  'masc-bah': 'assets/cartas/mascotes/masc-bah.jpg',  // #16 Herói Tricolor · Oficial · Comum
  'masc-cha': 'assets/cartas/mascotes/masc-cha.jpg',  // #17 Índio Condá · Oficial · Comum
  'masc-rem': 'assets/cartas/mascotes/masc-rem.jpg',  // #18 Leão Azul · Oficial · Comum
  'masc-mir': 'assets/cartas/mascotes/masc-mir.jpg',  // #19 Leão Caipira · Oficial · Comum
  'masc-vit': 'assets/cartas/mascotes/masc-vit.jpg',  // #20 Leão da Barra · Oficial · Comum
  'masc-cor': 'assets/cartas/mascotes/masc-cor.jpg',  // #21 Mosqueteiro Alvinegro · Oficial · Comum
  'masc-gre': 'assets/cartas/mascotes/masc-gre.jpg',  // #22 Mosqueteiro Tricolor · Oficial · Comum
  'masc-pal': 'assets/cartas/mascotes/masc-pal.jpg',  // #23 Porco · Oficial · Comum
  'masc-cru': 'assets/cartas/mascotes/masc-cru.jpg',  // #24 Raposa · Oficial · Comum
  'masc-int': 'assets/cartas/mascotes/masc-int.jpg',  // #25 Saci · Oficial · Comum
  'masc-sao': 'assets/cartas/mascotes/masc-sao.jpg',  // #26 Santo Paulo · Oficial · Comum
  'masc-rbb': 'assets/cartas/mascotes/masc-rbb.jpg',  // #27 Touro · Oficial · Comum
  'masc-fla': 'assets/cartas/mascotes/masc-fla.jpg',  // #28 Urubu · Oficial · Comum
  'masc-cfc': 'assets/cartas/mascotes/masc-cfc.jpg',  // #29 Vovô Coxa · Oficial · Comum

  // ---------- Juízo Final (12 cartas) — mascote PNG transparente 600×600
  'jf-doutor-rebaixamento': '',            // #01 Doutor Rebaixamento · Vilão · Especial
  'jf-urubu-infinito': 'assets/cartas/mascotes/masc-fla.jpg',  // #02 Urubu Infinito · Líder da Liga · Especial
  'jf-galo-trovao': 'assets/cartas/mascotes/masc-cam.jpg',  // #03 Galo do Trovão · Força · Muito rara
  'jf-porco-blindado': 'assets/cartas/mascotes/masc-pal.jpg',  // #04 Porco Blindado · Defensor · Muito rara
  'jf-raposa-sombria': 'assets/cartas/mascotes/masc-cru.jpg',  // #05 Raposa Sombria · Estrategista · Muito rara
  'jf-leao-colossal': 'assets/cartas/mascotes/masc-rem.jpg',  // #06 Leão Colossal · Gigante · Rara
  'jf-mosqueteiro-escudo': 'assets/cartas/mascotes/masc-cor.jpg',  // #07 Mosqueteiro Escudo · Capitão · Rara
  'jf-saci-mistico': 'assets/cartas/mascotes/masc-int.jpg',  // #08 Saci Místico · Feiticeiro · Rara
  'jf-almirante-tempestade': 'assets/cartas/mascotes/masc-vas.jpg',  // #09 Almirante Tempestade · Navegador · Comum
  'jf-baleia-tsunami': 'assets/cartas/mascotes/masc-san.jpg',  // #10 Baleia Tsunami · Maré · Comum
  'jf-furacao-veloz': 'assets/cartas/mascotes/masc-cap.jpg',  // #11 Furacão Veloz · Velocista · Comum
  'jf-touro-implacavel': 'assets/cartas/mascotes/masc-rbb.jpg',  // #12 Touro Implacável · Aríete · Comum
};
