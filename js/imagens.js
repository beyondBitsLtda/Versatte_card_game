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
  'clube-fla-camp': '',                    // #01 Flamengo · Campeão · Especial
  'clube-pal-camp': '',                    // #02 Palmeiras · Campeão · Especial
  'clube-bot-hist': '',                    // #03 Botafogo · Histórica · Muito rara
  'clube-flu-hist': '',                    // #04 Fluminense · Histórica · Muito rara
  'clube-san-hist': '',                    // #05 Santos · Histórica · Muito rara
  'clube-vas-hist': '',                    // #06 Vasco · Histórica · Muito rara
  'clube-cam-u2': '',                      // #07 Atlético-MG · Uniforme 2 · Rara
  'clube-cor-u2': '',                      // #08 Corinthians · Uniforme 2 · Rara
  'clube-cru-u2': '',                      // #09 Cruzeiro · Uniforme 2 · Rara
  'clube-gre-u2': '',                      // #10 Grêmio · Uniforme 2 · Rara
  'clube-int-u2': '',                      // #11 Internacional · Uniforme 2 · Rara
  'clube-sao-u2': '',                      // #12 São Paulo · Uniforme 2 · Rara
  'clube-cap': '',                         // #13 Athletico-PR · Escudo oficial · Comum
  'clube-cam': '',                         // #14 Atlético-MG · Escudo oficial · Comum
  'clube-bah': '',                         // #15 Bahia · Escudo oficial · Comum
  'clube-bot': '',                         // #16 Botafogo · Escudo oficial · Comum
  'clube-rbb': '',                         // #17 Bragantino · Escudo oficial · Comum
  'clube-cha': '',                         // #18 Chapecoense · Escudo oficial · Comum
  'clube-cor': '',                         // #19 Corinthians · Escudo oficial · Comum
  'clube-cfc': '',                         // #20 Coritiba · Escudo oficial · Comum
  'clube-cru': '',                         // #21 Cruzeiro · Escudo oficial · Comum
  'clube-fla': '',                         // #22 Flamengo · Escudo oficial · Comum
  'clube-flu': '',                         // #23 Fluminense · Escudo oficial · Comum
  'clube-gre': '',                         // #24 Grêmio · Escudo oficial · Comum
  'clube-int': '',                         // #25 Internacional · Escudo oficial · Comum
  'clube-mir': '',                         // #26 Mirassol · Escudo oficial · Comum
  'clube-pal': '',                         // #27 Palmeiras · Escudo oficial · Comum
  'clube-rem': '',                         // #28 Remo · Escudo oficial · Comum
  'clube-san': '',                         // #29 Santos · Escudo oficial · Comum
  'clube-sao': '',                         // #30 São Paulo · Escudo oficial · Comum
  'clube-vas': '',                         // #31 Vasco · Escudo oficial · Comum
  'clube-vit': '',                         // #32 Vitória · Escudo oficial · Comum

  // ---------- Jogadores (56 cartas) — jogador PNG transparente 600×800 (busto, pés/peito na base)
  'jog-garrincha-prime': '',               // #01 Garrincha · Prime · Especial
  'jog-pele-prime': '',                    // #02 Pelé · Prime · Especial
  'jog-romario-prime': '',                 // #03 Romário · Prime · Especial
  'jog-ronaldo-prime': '',                 // #04 Ronaldo · Prime · Especial
  'jog-zico-prime': '',                    // #05 Zico · Prime · Especial
  'jog-ademir': '',                        // #06 Ademir da Guia · Lenda · Muito rara
  'jog-cafu': '',                          // #07 Cafu · Lenda · Muito rara
  'jog-falcao': '',                        // #08 Falcão · Lenda · Muito rara
  'jog-figueroa': '',                      // #09 Figueroa · Lenda · Muito rara
  'jog-garrincha': '',                     // #10 Garrincha · Lenda · Muito rara
  'jog-marcos': '',                        // #11 Marcos · Lenda · Muito rara
  'jog-nilton-santos': '',                 // #12 Nilton Santos · Lenda · Muito rara
  'jog-pele': '',                          // #13 Pelé · Lenda · Muito rara
  'jog-rivellino': '',                     // #14 Rivellino · Lenda · Muito rara
  'jog-dinamite': '',                      // #15 Roberto Dinamite · Lenda · Muito rara
  'jog-ceni': '',                          // #16 Rogério Ceni · Lenda · Muito rara
  'jog-socrates': '',                      // #17 Sócrates · Lenda · Muito rara
  'jog-zico': '',                          // #18 Zico · Lenda · Muito rara
  'jog-ruschel': '',                       // #19 Alan Ruschel · Ídolo · Rara
  'jog-alcino': '',                        // #20 Alcino · Ídolo · Rara
  'jog-alex': '',                          // #21 Alex · Ídolo · Rara
  'jog-bebeto': '',                        // #22 Bebeto · Ídolo · Rara
  'jog-bobo': '',                          // #23 Bobô · Ídolo · Rara
  'jog-castilho': '',                      // #24 Castilho · Ídolo · Rara
  'jog-clodoaldo': '',                     // #25 Clodoaldo · Ídolo · Rara
  'jog-fred': '',                          // #26 Fred · Ídolo · Rara
  'jog-gamarra': '',                       // #27 Gamarra · Ídolo · Rara
  'jog-leandro': '',                       // #28 Leandro · Ídolo · Rara
  'jog-lugano': '',                        // #29 Lugano · Ídolo · Rara
  'jog-luis-pereira': '',                  // #30 Luís Pereira · Ídolo · Rara
  'jog-mauro-silva': '',                   // #31 Mauro Silva · Ídolo · Rara
  'jog-reinaldo': '',                      // #32 Reinaldo · Ídolo · Rara
  'jog-renato': '',                        // #33 Renato Gaúcho · Ídolo · Rara
  'jog-sicupira': '',                      // #34 Sicupira · Ídolo · Rara
  'jog-tostao': '',                        // #35 Tostão · Ídolo · Rara
  'jog-victor': '',                        // #36 Victor · Ídolo · Rara
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
  'estadio-maracana': '',                  // #01 Maracanã · Estádio · Especial
  'estadio-arena-mrv': '',                 // #02 Arena MRV · Estádio · Muito rara
  'estadio-mineirao': '',                  // #03 Mineirão · Estádio · Muito rara
  'estadio-morumbis': '',                  // #04 MorumBIS · Estádio · Muito rara
  'estadio-allianz': '',                   // #05 Allianz Parque · Estádio · Rara
  'estadio-arena-gremio': '',              // #06 Arena do Grêmio · Estádio · Rara
  'estadio-fonte-nova': '',                // #07 Arena Fonte Nova · Estádio · Rara
  'estadio-beira-rio': '',                 // #08 Beira-Rio · Estádio · Rara
  'estadio-ligga-arena': '',               // #09 Ligga Arena · Estádio · Rara
  'estadio-neo-quimica': '',               // #10 Neo Química Arena · Estádio · Rara
  'estadio-nilton-santos': '',             // #11 Nilton Santos · Estádio · Rara
  'estadio-sao-januario': '',              // #12 São Januário · Estádio · Rara
  'estadio-vila-belmiro': '',              // #13 Vila Belmiro · Estádio · Rara
  'estadio-arena-conda': '',               // #14 Arena Condá · Estádio · Comum
  'estadio-barradao': '',                  // #15 Barradão · Estádio · Comum
  'estadio-couto-pereira': '',             // #16 Couto Pereira · Estádio · Comum
  'estadio-maiao': '',                     // #17 Maião · Estádio · Comum
  'estadio-mangueirao': '',                // #18 Mangueirão · Estádio · Comum
  'estadio-nabi-abi-chedid': '',           // #19 Nabi Abi Chedid · Estádio · Comum

  // ---------- Mascotes (29 cartas) — mascote PNG transparente 600×600
  'masc-pal-supremo': '',                  // #01 Porco Supremo · Supremo · Especial
  'masc-fla-supremo': '',                  // #02 Urubu Supremo · Supremo · Especial
  'masc-san-lendario': '',                 // #03 Baleia Lendária · Lendário · Muito rara
  'masc-cor-lendario': '',                 // #04 Mosqueteiro Alvinegro Lendário · Lendário · Muito rara
  'masc-int-lendario': '',                 // #05 Saci Lendário · Lendário · Muito rara
  'masc-cam-neon': '',                     // #06 Galo Neon · Neon · Rara
  'masc-pal-neon': '',                     // #07 Porco Neon · Neon · Rara
  'masc-cru-neon': '',                     // #08 Raposa Neon · Neon · Rara
  'masc-fla-neon': '',                     // #09 Urubu Neon · Neon · Rara
  'masc-vas': '',                          // #10 Almirante · Oficial · Comum
  'masc-san': '',                          // #11 Baleia · Oficial · Comum
  'masc-bot': '',                          // #12 Biriba · Oficial · Comum
  'masc-flu': '',                          // #13 Cartola · Oficial · Comum
  'masc-cap': '',                          // #14 Furacão · Oficial · Comum
  'masc-cam': '',                          // #15 Galo · Oficial · Comum
  'masc-bah': '',                          // #16 Herói Tricolor · Oficial · Comum
  'masc-cha': '',                          // #17 Índio Condá · Oficial · Comum
  'masc-rem': '',                          // #18 Leão Azul · Oficial · Comum
  'masc-mir': '',                          // #19 Leão Caipira · Oficial · Comum
  'masc-vit': '',                          // #20 Leão da Barra · Oficial · Comum
  'masc-cor': '',                          // #21 Mosqueteiro Alvinegro · Oficial · Comum
  'masc-gre': '',                          // #22 Mosqueteiro Tricolor · Oficial · Comum
  'masc-pal': '',                          // #23 Porco · Oficial · Comum
  'masc-cru': '',                          // #24 Raposa · Oficial · Comum
  'masc-int': '',                          // #25 Saci · Oficial · Comum
  'masc-sao': '',                          // #26 Santo Paulo · Oficial · Comum
  'masc-rbb': '',                          // #27 Touro · Oficial · Comum
  'masc-fla': '',                          // #28 Urubu · Oficial · Comum
  'masc-cfc': '',                          // #29 Vovô Coxa · Oficial · Comum

  // ---------- Juízo Final (12 cartas) — mascote PNG transparente 600×600
  'jf-doutor-rebaixamento': '',            // #01 Doutor Rebaixamento · Vilão · Especial
  'jf-urubu-infinito': '',                 // #02 Urubu Infinito · Líder da Liga · Especial
  'jf-galo-trovao': '',                    // #03 Galo do Trovão · Força · Muito rara
  'jf-porco-blindado': '',                 // #04 Porco Blindado · Defensor · Muito rara
  'jf-raposa-sombria': '',                 // #05 Raposa Sombria · Estrategista · Muito rara
  'jf-leao-colossal': '',                  // #06 Leão Colossal · Gigante · Rara
  'jf-mosqueteiro-escudo': '',             // #07 Mosqueteiro Escudo · Capitão · Rara
  'jf-saci-mistico': '',                   // #08 Saci Místico · Feiticeiro · Rara
  'jf-almirante-tempestade': '',           // #09 Almirante Tempestade · Navegador · Comum
  'jf-baleia-tsunami': '',                 // #10 Baleia Tsunami · Maré · Comum
  'jf-furacao-veloz': '',                  // #11 Furacão Veloz · Velocista · Comum
  'jf-touro-implacavel': '',               // #12 Touro Implacável · Aríete · Comum
};
