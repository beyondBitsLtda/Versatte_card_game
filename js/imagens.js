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

  // ---------- Clubes Série A (47 cartas)
  'clube-cap-1924': 'assets/cartas/clubes/clube-cap-1924.png',  // #01 Athletico-PR · Escudo 1924 · Especial
  'clube-cam-1910': 'assets/cartas/clubes/clube-cam-1910.png',  // #02 Atlético-MG · Escudo 1910 · Especial
  'clube-bah-1931': 'assets/cartas/clubes/clube-bah-1931.png',  // #03 Bahia · Escudo 1931 · Especial
  'clube-bot-1904': 'assets/cartas/clubes/clube-bot-1904.png',  // #04 Botafogo · Escudo 1904 · Especial
  'clube-cor-1913': 'assets/cartas/clubes/clube-cor-1913.png',  // #05 Corinthians · Escudo 1913 · Especial
  'clube-cfc-1909': 'assets/cartas/clubes/clube-cfc-1909.png',  // #06 Coritiba · Escudo 1909 · Especial
  'clube-cru-1921': 'assets/cartas/clubes/clube-cru-1921.png',  // #07 Cruzeiro · Escudo 1921 · Especial
  'clube-fla-1895': 'assets/cartas/clubes/clube-fla-1895.png',  // #08 Flamengo · Escudo 1895 · Especial
  'clube-flu-1902': 'assets/cartas/clubes/clube-flu-1902.png',  // #09 Fluminense · Escudo 1902 · Especial
  'clube-gre-1903': 'assets/cartas/clubes/clube-gre-1903.png',  // #10 Grêmio · Escudo 1903 · Especial
  'clube-int-1909': 'assets/cartas/clubes/clube-int-1909.png',  // #11 Internacional · Escudo 1909 · Especial
  'clube-pal-1914': 'assets/cartas/clubes/clube-pal-1914.png',  // #12 Palmeiras · Escudo 1914 · Especial
  'clube-san-1912': 'assets/cartas/clubes/clube-san-1912.png',  // #13 Santos · Escudo 1912 · Especial
  'clube-sao-1930': 'assets/cartas/clubes/clube-sao-1930.png',  // #14 São Paulo · Escudo 1930 · Especial
  'clube-vas-1898': 'assets/cartas/clubes/clube-vas-1898.png',  // #15 Vasco · Escudo 1898 · Especial
  'clube-gre-1911': 'assets/cartas/clubes/clube-gre-1911.png',  // #16 Grêmio · Escudo 1911 · Muito rara
  'clube-pal-1942': 'assets/cartas/clubes/clube-pal-1942.png',  // #17 Palmeiras · Escudo 1942 · Muito rara
  'clube-cap-2002': 'assets/cartas/clubes/clube-cap-2002.png',  // #18 Athletico-PR · Escudo 2002 · Rara
  'clube-rbb-1995': 'assets/cartas/clubes/clube-rbb-1995.png',  // #19 Bragantino · Escudo 1995 · Rara
  'clube-cha-1961': 'assets/cartas/clubes/clube-cha-1961.png',  // #20 Chapecoense · Escudo 1961 · Rara
  'clube-cru-1942': 'assets/cartas/clubes/clube-cru-1942.png',  // #21 Cruzeiro · Escudo 1942 · Rara
  'clube-flu-1930': 'assets/cartas/clubes/clube-flu-1930.png',  // #22 Fluminense · Escudo 1930 · Rara
  'clube-gre-1936': 'assets/cartas/clubes/clube-gre-1936.png',  // #23 Grêmio · Escudo 1936 · Rara
  'clube-mir-1964': 'assets/cartas/clubes/clube-mir-1964.png',  // #24 Mirassol · Escudo 1964 · Rara
  'clube-pal-1919': 'assets/cartas/clubes/clube-pal-1919.png',  // #25 Palmeiras · Escudo 1919 · Rara
  'clube-rem-1950': 'assets/cartas/clubes/clube-rem-1950.png',  // #26 Remo · Escudo 1940 · Rara
  'clube-vit-1934': 'assets/cartas/clubes/clube-vit-1934.png',  // #27 Vitória · Escudo 1934 · Rara
  'clube-cap': 'assets/cartas/clubes/clube-cap.png',  // #28 Athletico-PR · Escudo atual · Comum
  'clube-cam': 'assets/cartas/clubes/clube-cam.png',  // #29 Atlético-MG · Escudo atual · Comum
  'clube-bah': 'assets/cartas/clubes/clube-bah.png',  // #30 Bahia · Escudo atual · Comum
  'clube-bot': 'assets/cartas/clubes/clube-bot.png',  // #31 Botafogo · Escudo atual · Comum
  'clube-rbb': 'assets/cartas/clubes/clube-rbb.png',  // #32 Bragantino · Escudo atual · Comum
  'clube-cha': 'assets/cartas/clubes/clube-cha.png',  // #33 Chapecoense · Escudo atual · Comum
  'clube-cor': 'assets/cartas/clubes/clube-cor.png',  // #34 Corinthians · Escudo atual · Comum
  'clube-cfc': 'assets/cartas/clubes/clube-cfc.png',  // #35 Coritiba · Escudo atual · Comum
  'clube-cru': 'assets/cartas/clubes/clube-cru.png',  // #36 Cruzeiro · Escudo atual · Comum
  'clube-fla': 'assets/cartas/clubes/clube-fla.png',  // #37 Flamengo · Escudo atual · Comum
  'clube-flu': 'assets/cartas/clubes/clube-flu.png',  // #38 Fluminense · Escudo atual · Comum
  'clube-gre': 'assets/cartas/clubes/clube-gre.png',  // #39 Grêmio · Escudo atual · Comum
  'clube-int': 'assets/cartas/clubes/clube-int.png',  // #40 Internacional · Escudo atual · Comum
  'clube-mir': 'assets/cartas/clubes/clube-mir.png',  // #41 Mirassol · Escudo atual · Comum
  'clube-pal': 'assets/cartas/clubes/clube-pal.png',  // #42 Palmeiras · Escudo atual · Comum
  'clube-rem': 'assets/cartas/clubes/clube-rem.png',  // #43 Remo · Escudo atual · Comum
  'clube-san': 'assets/cartas/clubes/clube-san.png',  // #44 Santos · Escudo atual · Comum
  'clube-sao': 'assets/cartas/clubes/clube-sao.png',  // #45 São Paulo · Escudo atual · Comum
  'clube-vas': 'assets/cartas/clubes/clube-vas.png',  // #46 Vasco · Escudo atual · Comum
  'clube-vit': 'assets/cartas/clubes/clube-vit.png',  // #47 Vitória · Escudo atual · Comum

  // ---------- Jogadores (357 cartas)
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
  'jog-camilo': 'assets/cartas/jogadores/jog-camilo.jpg',  // #24 Camilo · Ídolo · Rara
  'jog-castilho': 'assets/cartas/jogadores/jog-castilho.jpg',  // #25 Castilho · Ídolo · Rara
  'jog-clodoaldo': 'assets/cartas/jogadores/jog-clodoaldo.jpg',  // #26 Clodoaldo · Ídolo · Rara
  'jog-fred': 'assets/cartas/jogadores/jog-fred.jpg',  // #27 Fred · Ídolo · Rara
  'jog-gamarra': 'assets/cartas/jogadores/jog-gamarra.jpg',  // #28 Gamarra · Ídolo · Rara
  'jog-leandro': 'assets/cartas/jogadores/jog-leandro.jpg',  // #29 Leandro · Ídolo · Rara
  'jog-lugano': 'assets/cartas/jogadores/jog-lugano.jpg',  // #30 Lugano · Ídolo · Rara
  'jog-luis-pereira': 'assets/cartas/jogadores/jog-luis-pereira.jpg',  // #31 Luís Pereira · Ídolo · Rara
  'jog-mauro-silva': 'assets/cartas/jogadores/jog-mauro-silva.jpg',  // #32 Mauro Silva · Ídolo · Rara
  'jog-reinaldo': 'assets/cartas/jogadores/jog-reinaldo.jpg',  // #33 Reinaldo · Ídolo · Rara
  'jog-renato': 'assets/cartas/jogadores/jog-renato.jpg',  // #34 Renato Gaúcho · Ídolo · Rara
  'jog-sicupira': 'assets/cartas/jogadores/jog-sicupira.jpg',  // #35 Sicupira · Ídolo · Rara
  'jog-tostao': 'assets/cartas/jogadores/jog-tostao.jpg',  // #36 Tostão · Ídolo · Rara
  'jog-victor': 'assets/cartas/jogadores/jog-victor.jpg',  // #37 Victor · Ídolo · Rara
  'jog-abel-ferreira': 'assets/cartas/jogadores/jog-abel-ferreira.jpg',  // #38 Abel Ferreira · Elenco 2026 · Comum
  'jog-acevedo': 'assets/cartas/jogadores/jog-acevedo.jpg',  // #39 Acevedo · Elenco 2026 · Comum
  'jog-aguirre': 'assets/cartas/jogadores/jog-aguirre.jpg',  // #40 Aguirre · Elenco 2026 · Comum
  'jog-aguirre-2': 'assets/cartas/jogadores/jog-aguirre-2.jpg',  // #41 Aguirre · Elenco 2026 · Comum
  'jog-alan-franco': 'assets/cartas/jogadores/jog-alan-franco.jpg',  // #42 Alan Franco · Elenco 2026 · Comum
  'jog-alan-patrick': 'assets/cartas/jogadores/jog-alan-patrick.jpg',  // #43 Alan Patrick · Elenco 2026 · Comum
  'jog-alejo-veliz': 'assets/cartas/jogadores/jog-alejo-veliz.jpg',  // #44 Alejo Véliz · Elenco 2026 · Comum
  'jog-alerrandro': 'assets/cartas/jogadores/jog-alerrandro.jpg',  // #45 Alerrandro · Elenco 2026 · Comum
  'jog-alesson': 'assets/cartas/jogadores/jog-alesson.jpg',  // #46 Alesson · Elenco 2026 · Comum
  'jog-alex-telles': 'assets/cartas/jogadores/jog-alex-telles.jpg',  // #47 Alex Telles · Elenco 2026 · Comum
  'jog-alexsander': 'assets/cartas/jogadores/jog-alexsander.jpg',  // #48 Alexsander · Elenco 2026 · Comum
  'jog-alix-vinicius': 'assets/cartas/jogadores/jog-alix-vinicius.jpg',  // #49 Alix Vinícius · Elenco 2026 · Comum
  'jog-amuzu': 'assets/cartas/jogadores/jog-amuzu.jpg',  // #50 Amuzu · Elenco 2026 · Comum
  'jog-anderson': 'assets/cartas/jogadores/jog-anderson.jpg',  // #51 Anderson · Elenco 2026 · Comum
  'jog-andre': 'assets/cartas/jogadores/jog-andre.jpg',  // #52 André · Elenco 2026 · Comum
  'jog-andre-luis': 'assets/cartas/jogadores/jog-andre-luis.jpg',  // #53 André Luís · Elenco 2026 · Comum
  'jog-andre-ramalho': 'assets/cartas/jogadores/jog-andre-ramalho.jpg',  // #54 André Ramalho · Elenco 2026 · Comum
  'jog-andreas-pereira': 'assets/cartas/jogadores/jog-andreas-pereira.jpg',  // #55 Andreas Pereira · Elenco 2026 · Comum
  'jog-andres-gomez': 'assets/cartas/jogadores/jog-andres-gomez.jpg',  // #56 Andrés Gómez · Elenco 2026 · Comum
  'jog-angileri': 'assets/cartas/jogadores/jog-angileri.jpg',  // #57 Angileri · Elenco 2026 · Comum
  'jog-anthoni': 'assets/cartas/jogadores/jog-anthoni.jpg',  // #58 Anthoni · Elenco 2026 · Comum
  'jog-arana': 'assets/cartas/jogadores/jog-arana.jpg',  // #59 Arana · Elenco 2026 · Comum
  'jog-arboleda': 'assets/cartas/jogadores/jog-arboleda.jpg',  // #60 Arboleda · Elenco 2026 · Comum
  'jog-arias': 'assets/cartas/jogadores/jog-arias.jpg',  // #61 Arias · Elenco 2026 · Comum
  'jog-arrascaeta': 'assets/cartas/jogadores/jog-arrascaeta.jpg',  // #62 Arrascaeta · Elenco 2026 · Comum
  'jog-arthur-cabral': 'assets/cartas/jogadores/jog-arthur-cabral.jpg',  // #63 Arthur Cabral · Elenco 2026 · Comum
  'jog-arthur-dias': 'assets/cartas/jogadores/jog-arthur-dias.jpg',  // #64 Arthur Dias · Elenco 2026 · Comum
  'jog-artur': 'assets/cartas/jogadores/jog-artur.jpg',  // #65 Artur · Elenco 2026 · Comum
  'jog-artur-jorge': 'assets/cartas/jogadores/jog-artur-jorge.jpg',  // #66 Artur Jorge · Elenco 2026 · Comum
  'jog-ayrton-lucas': 'assets/cartas/jogadores/jog-ayrton-lucas.jpg',  // #67 Ayrton Lucas · Elenco 2026 · Comum
  'jog-balbuena': '',  // #68 Balbuena · Elenco 2026 · Comum
  'jog-baralhas': 'assets/cartas/jogadores/jog-baralhas.jpg',  // #69 Baralhas · Elenco 2026 · Comum
  'jog-barboza': 'assets/cartas/jogadores/jog-barboza.jpg',  // #70 Barboza · Elenco 2026 · Comum
  'jog-barreal': 'assets/cartas/jogadores/jog-barreal.jpg',  // #71 Barreal · Elenco 2026 · Comum
  'jog-bernabei': 'assets/cartas/jogadores/jog-bernabei.jpg',  // #72 Bernabei · Elenco 2026 · Comum
  'jog-bernard': 'assets/cartas/jogadores/jog-bernard.jpg',  // #73 Bernard · Elenco 2026 · Comum
  'jog-bobadilla': 'assets/cartas/jogadores/jog-bobadilla.jpg',  // #74 Bobadilla · Elenco 2026 · Comum
  'jog-dylan-borrero': '',  // #75 Borrero · Elenco 2026 · Comum
  'jog-braithwaite': 'assets/cartas/jogadores/jog-braithwaite.jpg',  // #76 Braithwaite · Elenco 2026 · Comum
  'jog-breno-bidon': 'assets/cartas/jogadores/jog-breno-bidon.jpg',  // #77 Breno Bidon · Elenco 2026 · Comum
  'jog-breno-lopes': 'assets/cartas/jogadores/jog-breno-lopes.jpg',  // #78 Breno Lopes · Elenco 2026 · Comum
  'jog-bruno-duarte': 'assets/cartas/jogadores/jog-bruno-duarte.jpg',  // #79 Bruno Duarte · Elenco 2026 · Comum
  'jog-bruno-gomes': 'assets/cartas/jogadores/jog-bruno-gomes.jpg',  // #80 Bruno Gomes · Elenco 2026 · Comum
  'jog-bruno-henrique': 'assets/cartas/jogadores/jog-bruno-henrique.jpg',  // #81 Bruno Henrique · Elenco 2026 · Comum
  'jog-bruno-melo': 'assets/cartas/jogadores/jog-bruno-melo.jpg',  // #82 Bruno Melo · Elenco 2026 · Comum
  'jog-bruno-pacheco': 'assets/cartas/jogadores/jog-bruno-pacheco.jpg',  // #83 Bruno Pacheco · Elenco 2026 · Comum
  'jog-bruno-santos': 'assets/cartas/jogadores/jog-bruno-santos.jpg',  // #84 Bruno Santos · Elenco 2026 · Comum
  'jog-bruno-tubarao': '',  // #85 Bruno Tubarão · Elenco 2026 · Comum
  'jog-bustos': 'assets/cartas/jogadores/jog-bustos.jpg',  // #86 Bustos · Elenco 2026 · Comum
  'jog-caca': 'assets/cartas/jogadores/jog-caca.jpg',  // #87 Cacá · Elenco 2026 · Comum
  'jog-caique-goncalves': 'assets/cartas/jogadores/jog-caique-goncalves.jpg',  // #88 Caíque Gonçalves · Elenco 2026 · Comum
  'jog-caito': 'assets/cartas/jogadores/jog-caito.jpg',  // #89 Caito · Elenco 2026 · Comum
  'jog-calleri': 'assets/cartas/jogadores/jog-calleri.jpg',  // #90 Calleri · Elenco 2026 · Comum
  'jog-camilo-2': 'assets/cartas/jogadores/jog-camilo-2.jpg',  // #91 Camilo · Elenco 2026 · Comum
  'jog-canobbio': 'assets/cartas/jogadores/jog-canobbio.jpg',  // #92 Canobbio · Elenco 2026 · Comum
  'jog-carbonero': 'assets/cartas/jogadores/jog-carbonero.jpg',  // #93 Carbonero · Elenco 2026 · Comum
  'jog-carlos-miguel': 'assets/cartas/jogadores/jog-carlos-miguel.jpg',  // #94 Carlos Miguel · Elenco 2026 · Comum
  'jog-carlos-vinicius': 'assets/cartas/jogadores/jog-carlos-vinicius.jpg',  // #95 Carlos Vinícius · Elenco 2026 · Comum
  'jog-carrascal': 'assets/cartas/jogadores/jog-carrascal.jpg',  // #96 Carrascal · Elenco 2026 · Comum
  'jog-cassierra': 'assets/cartas/jogadores/jog-cassierra.jpg',  // #97 Cassierra · Elenco 2026 · Comum
  'jog-cassio': 'assets/cartas/jogadores/jog-cassio.jpg',  // #98 Cássio · Elenco 2026 · Comum
  'jog-christian-oliva': 'assets/cartas/jogadores/jog-christian-oliva.jpg',  // #99 Christian Oliva · Elenco 2026 · Comum
  'jog-colidio': 'assets/cartas/jogadores/jog-colidio.jpg',  // #100 Colidio · Elenco 2026 · Comum
  'jog-cristian-medina': 'assets/cartas/jogadores/jog-cristian-medina.jpg',  // #101 Cristian Medina · Elenco 2026 · Comum
  'jog-cuca': 'assets/cartas/jogadores/jog-cuca.jpg',  // #102 Cuca · Elenco 2026 · Comum
  'jog-cuiabano': 'assets/cartas/jogadores/jog-cuiabano.jpg',  // #103 Cuiabano · Elenco 2026 · Comum
  'jog-danilo': 'assets/cartas/jogadores/jog-danilo.jpg',  // #104 Danilo · Elenco 2026 · Comum
  'jog-dantas': 'assets/cartas/jogadores/jog-dantas.jpg',  // #105 Dantas · Elenco 2026 · Comum
  'jog-david-braga': '',  // #106 David Braga · Elenco 2026 · Comum
  'jog-david-duarte': 'assets/cartas/jogadores/jog-david-duarte.jpg',  // #107 David Duarte · Elenco 2026 · Comum
  'jog-denilson': 'assets/cartas/jogadores/jog-denilson.jpg',  // #108 Denilson · Elenco 2026 · Comum
  'jog-diego-tarzia': 'assets/cartas/jogadores/jog-diego-tarzia.jpg',  // #109 Diego Tarzia · Elenco 2026 · Comum
  'jog-diogenes': 'assets/cartas/jogadores/jog-diogenes.jpg',  // #110 Diógenes · Elenco 2026 · Comum
  'jog-djhordney': 'assets/cartas/jogadores/jog-djhordney.jpg',  // #111 Djhordney · Elenco 2026 · Comum
  'jog-doma': 'assets/cartas/jogadores/jog-doma.jpg',  // #112 Doma · Elenco 2026 · Comum
  'jog-dorival-junior': 'assets/cartas/jogadores/jog-dorival-junior.jpg',  // #113 Dorival Júnior · Elenco 2026 · Comum
  'jog-edenilson': 'assets/cartas/jogadores/jog-edenilson.jpg',  // #114 Edenílson · Elenco 2026 · Comum
  'jog-edson-carioca': 'assets/cartas/jogadores/jog-edson-carioca.jpg',  // #115 Edson Carioca · Elenco 2026 · Comum
  'jog-eduardo': 'assets/cartas/jogadores/jog-eduardo.jpg',  // #116 Eduardo · Elenco 2026 · Comum
  'jog-eduardo-baptista': 'assets/cartas/jogadores/jog-eduardo-baptista.jpg',  // #117 Eduardo Baptista · Elenco 2026 · Comum
  'jog-eduardo-dominguez': 'assets/cartas/jogadores/jog-eduardo-dominguez.jpg',  // #118 Eduardo Domínguez · Elenco 2026 · Comum
  'jog-eduardo-sasha': 'assets/cartas/jogadores/jog-eduardo-sasha.jpg',  // #119 Eduardo Sasha · Elenco 2026 · Comum
  'jog-emerson-royal': 'assets/cartas/jogadores/jog-emerson-royal.jpg',  // #120 Emerson Royal · Elenco 2026 · Comum
  'jog-emmanuel-martinez': 'assets/cartas/jogadores/jog-emmanuel-martinez.jpg',  // #121 Emmanuel Martínez · Elenco 2026 · Comum
  'jog-enamorado': 'assets/cartas/jogadores/jog-enamorado.jpg',  // #122 Enamorado · Elenco 2026 · Comum
  'jog-eric-ramires': 'assets/cartas/jogadores/jog-eric-ramires.jpg',  // #123 Eric Ramires · Elenco 2026 · Comum
  'jog-erick': 'assets/cartas/jogadores/jog-erick.jpg',  // #124 Erick · Elenco 2026 · Comum
  'jog-erick-2': 'assets/cartas/jogadores/jog-erick-2.jpg',  // #125 Erick · Elenco 2026 · Comum
  'jog-erick-pulga': 'assets/cartas/jogadores/jog-erick-pulga.jpg',  // #126 Erick Pulga · Elenco 2026 · Comum
  'jog-esquivel': 'assets/cartas/jogadores/jog-esquivel.jpg',  // #127 Esquivel · Elenco 2026 · Comum
  'jog-everson': 'assets/cartas/jogadores/jog-everson.jpg',  // #128 Everson · Elenco 2026 · Comum
  'jog-everton-cebolinha': 'assets/cartas/jogadores/jog-everton-cebolinha.jpg',  // #129 Everton Cebolinha · Elenco 2026 · Comum
  'jog-everton-ribeiro': 'assets/cartas/jogadores/jog-everton-ribeiro.jpg',  // #130 Everton Ribeiro · Elenco 2026 · Comum
  'jog-fabinho': 'assets/cartas/jogadores/jog-fabinho.jpg',  // #131 Fabinho · Elenco 2026 · Comum
  'jog-fabio': 'assets/cartas/jogadores/jog-fabio.jpg',  // #132 Fábio · Elenco 2026 · Comum
  'jog-fabricio-bruno': 'assets/cartas/jogadores/jog-fabricio-bruno.jpg',  // #133 Fabrício Bruno · Elenco 2026 · Comum
  'jog-felipe-anderson': 'assets/cartas/jogadores/jog-felipe-anderson.jpg',  // #134 Felipe Anderson · Elenco 2026 · Comum
  'jog-fernando': 'assets/cartas/jogadores/jog-fernando.jpg',  // #135 Fernando · Elenco 2026 · Comum
  'jog-ferraresi': 'assets/cartas/jogadores/jog-ferraresi.jpg',  // #136 Ferraresi · Elenco 2026 · Comum
  'jog-flaco-lopez': 'assets/cartas/jogadores/jog-flaco-lopez.jpg',  // #137 Flaco López · Elenco 2026 · Comum
  'jog-fred-2': 'assets/cartas/jogadores/jog-fred-2.jpg',  // #138 Fred · Elenco 2026 · Comum
  'jog-gabigol': 'assets/cartas/jogadores/jog-gabigol.jpg',  // #139 Gabigol · Elenco 2026 · Comum
  'jog-gabriel-batista': 'assets/cartas/jogadores/jog-gabriel-batista.jpg',  // #140 Gabriel Batista · Elenco 2026 · Comum
  'jog-bontempo': 'assets/cartas/jogadores/jog-bontempo.jpg',  // #141 Gabriel Bontempo · Elenco 2026 · Comum
  'jog-gabriel-pereira': 'assets/cartas/jogadores/jog-gabriel-pereira.jpg',  // #142 Gabriel Pereira · Elenco 2026 · Comum
  'jog-gabriel-rojas': 'assets/cartas/jogadores/jog-gabriel-rojas.jpg',  // #143 Gabriel Rojas · Elenco 2026 · Comum
  'jog-galeano': 'assets/cartas/jogadores/jog-galeano.jpg',  // #144 Galeano · Elenco 2026 · Comum
  'jog-ganso': 'assets/cartas/jogadores/jog-ganso.jpg',  // #145 Ganso · Elenco 2026 · Comum
  'jog-garcez': 'assets/cartas/jogadores/jog-garcez.jpg',  // #146 Garcez · Elenco 2026 · Comum
  'jog-garro': 'assets/cartas/jogadores/jog-garro.jpg',  // #147 Garro · Elenco 2026 · Comum
  'jog-gerson': 'assets/cartas/jogadores/jog-gerson.jpg',  // #148 Gerson · Elenco 2026 · Comum
  'jog-giay': 'assets/cartas/jogadores/jog-giay.jpg',  // #149 Giay · Elenco 2026 · Comum
  'jog-gilberto': 'assets/cartas/jogadores/jog-gilberto.jpg',  // #150 Gilberto · Elenco 2026 · Comum
  'jog-giovanni-augusto': 'assets/cartas/jogadores/jog-giovanni-augusto.jpg',  // #151 Giovanni Augusto · Elenco 2026 · Comum
  'jog-guga': 'assets/cartas/jogadores/jog-guga.jpg',  // #152 Guga · Elenco 2026 · Comum
  'jog-guila-bossle': 'assets/cartas/jogadores/jog-guila-bossle.jpg',  // #153 Guila Bossle · Elenco 2026 · Comum
  'jog-gustavo-gomez': 'assets/cartas/jogadores/jog-gustavo-gomez.jpg',  // #154 Gustavo Gómez · Elenco 2026 · Comum
  'jog-gustavo-henrique': 'assets/cartas/jogadores/jog-gustavo-henrique.jpg',  // #155 Gustavo Henrique · Elenco 2026 · Comum
  'jog-gustavo-henrique-2': 'assets/cartas/jogadores/jog-gustavo-henrique-2.jpg',  // #156 Gustavo Henrique · Elenco 2026 · Comum
  'jog-gustavo-marques': 'assets/cartas/jogadores/jog-gustavo-marques.jpg',  // #157 Gustavo Marques · Elenco 2026 · Comum
  'jog-gustavo-martins': 'assets/cartas/jogadores/jog-gustavo-martins.jpg',  // #158 Gustavo Martins · Elenco 2026 · Comum
  'jog-gustavo-scarpa': 'assets/cartas/jogadores/jog-gustavo-scarpa.jpg',  // #159 Gustavo Scarpa · Elenco 2026 · Comum
  'jog-guzman-rodriguez': 'assets/cartas/jogadores/jog-guzman-rodriguez.jpg',  // #160 Guzmán Rodríguez · Elenco 2026 · Comum
  'jog-heitor': 'assets/cartas/jogadores/jog-heitor.jpg',  // #161 Heitor · Elenco 2026 · Comum
  'jog-henry-mosquera': 'assets/cartas/jogadores/jog-henry-mosquera.jpg',  // #162 Henry Mosquera · Elenco 2026 · Comum
  'jog-hercules': 'assets/cartas/jogadores/jog-hercules.jpg',  // #163 Hércules · Elenco 2026 · Comum
  'jog-hinestroza': 'assets/cartas/jogadores/jog-hinestroza.jpg',  // #164 Hinestroza · Elenco 2026 · Comum
  'jog-hugo-souza': 'assets/cartas/jogadores/jog-hugo-souza.jpg',  // #165 Hugo Souza · Elenco 2026 · Comum
  'jog-huguinho': 'assets/cartas/jogadores/jog-huguinho.jpg',  // #166 Huguinho · Elenco 2026 · Comum
  'jog-hulk': 'assets/cartas/jogadores/jog-hulk.jpg',  // #167 Hulk · Elenco 2026 · Comum
  'jog-iago': '',  // #168 Iago · Elenco 2026 · Comum
  'jog-ignacio': 'assets/cartas/jogadores/jog-ignacio.jpg',  // #169 Ignácio · Elenco 2026 · Comum
  'jog-igor-formiga': 'assets/cartas/jogadores/jog-igor-formiga.jpg',  // #170 Igor Formiga · Elenco 2026 · Comum
  'jog-isidro-pitta': 'assets/cartas/jogadores/jog-isidro-pitta.jpg',  // #171 Isidro Pitta · Elenco 2026 · Comum
  'jog-jacy': 'assets/cartas/jogadores/jog-jacy.jpg',  // #172 Jacy · Elenco 2026 · Comum
  'jog-jadson': 'assets/cartas/jogadores/jog-jadson.jpg',  // #173 Jadson · Elenco 2026 · Comum
  'jog-jair': 'assets/cartas/jogadores/jog-jair.jpg',  // #174 Jair · Elenco 2026 · Comum
  'jog-jaja': 'assets/cartas/jogadores/jog-jaja.jpg',  // #175 Jajá · Elenco 2026 · Comum
  'jog-jamerson': 'assets/cartas/jogadores/jog-jamerson.jpg',  // #176 Jamerson · Elenco 2026 · Comum
  'jog-jean-lucas': 'assets/cartas/jogadores/jog-jean-lucas.jpg',  // #177 Jean Lucas · Elenco 2026 · Comum
  'jog-joao-alencar': 'assets/cartas/jogadores/jog-joao-alencar.jpg',  // #178 João Alencar · Elenco 2026 · Comum
  'jog-joao-cruz': 'assets/cartas/jogadores/jog-joao-cruz.jpg',  // #179 João Cruz · Elenco 2026 · Comum
  'jog-joao-marcelo': 'assets/cartas/jogadores/jog-joao-marcelo.jpg',  // #180 João Marcelo · Elenco 2026 · Comum
  'jog-joao-paulo': '',  // #181 João Paulo · Elenco 2026 · Comum
  'jog-joao-schmidt': 'assets/cartas/jogadores/jog-joao-schmidt.jpg',  // #182 João Schmidt · Elenco 2026 · Comum
  'jog-joao-victor': 'assets/cartas/jogadores/jog-joao-victor.jpg',  // #183 João Victor · Elenco 2026 · Comum
  'jog-jonathan-jesus': 'assets/cartas/jogadores/jog-jonathan-jesus.jpg',  // #184 Jonathan Jesus · Elenco 2026 · Comum
  'jog-jorginho': 'assets/cartas/jogadores/jog-jorginho.jpg',  // #185 Jorginho · Elenco 2026 · Comum
  'jog-jose-herrera': 'assets/cartas/jogadores/jog-jose-herrera.jpg',  // #186 José Herrera · Elenco 2026 · Comum
  'jog-josue': 'assets/cartas/jogadores/jog-josue.jpg',  // #187 Josué · Elenco 2026 · Comum
  'jog-juninho': 'assets/cartas/jogadores/jog-juninho.jpg',  // #188 Juninho · Elenco 2026 · Comum
  'jog-juninho-capixaba': 'assets/cartas/jogadores/jog-juninho-capixaba.jpg',  // #189 Juninho Capixaba · Elenco 2026 · Comum
  'jog-justino': 'assets/cartas/jogadores/jog-justino.jpg',  // #190 Justino · Elenco 2026 · Comum
  'jog-kaio-cesar': 'assets/cartas/jogadores/jog-kaio-cesar.jpg',  // #191 Kaio César · Elenco 2026 · Comum
  'jog-kaio-jorge': 'assets/cartas/jogadores/jog-kaio-jorge.jpg',  // #192 Kaio Jorge · Elenco 2026 · Comum
  'jog-kannemann': 'assets/cartas/jogadores/jog-kannemann.jpg',  // #193 Kannemann · Elenco 2026 · Comum
  'jog-kanu': 'assets/cartas/jogadores/jog-kanu.jpg',  // #194 Kanu · Elenco 2026 · Comum
  'jog-kauan': 'assets/cartas/jogadores/jog-kauan.jpg',  // #195 Kauan · Elenco 2026 · Comum
  'jog-kauan-faria': 'assets/cartas/jogadores/jog-kauan-faria.jpg',  // #196 Kauan Faria · Elenco 2026 · Comum
  'jog-keny-arroyo': 'assets/cartas/jogadores/jog-keny-arroyo.jpg',  // #197 Keny Arroyo · Elenco 2026 · Comum
  'jog-kerwin-vargas': 'assets/cartas/jogadores/jog-kerwin-vargas.jpg',  // #198 Kerwin Vargas · Elenco 2026 · Comum
  'jog-kevin-castano': 'assets/cartas/jogadores/jog-kevin-castano.jpg',  // #199 Kevin Castaño · Elenco 2026 · Comum
  'jog-kike-olivera': 'assets/cartas/jogadores/jog-kike-olivera.jpg',  // #200 Kike Olivera · Elenco 2026 · Comum
  'jog-krovinovic': 'assets/cartas/jogadores/jog-krovinovic.jpg',  // #201 Krovinović · Elenco 2026 · Comum
  'jog-lavega': 'assets/cartas/jogadores/jog-lavega.jpg',  // #202 Lavega · Elenco 2026 · Comum
  'jog-leo-jardim': 'assets/cartas/jogadores/jog-leo-jardim.jpg',  // #203 Léo Jardim · Elenco 2026 · Comum
  'jog-leo-ortiz': 'assets/cartas/jogadores/jog-leo-ortiz.jpg',  // #204 Léo Ortiz · Elenco 2026 · Comum
  'jog-leo-pereira': 'assets/cartas/jogadores/jog-leo-pereira.jpg',  // #205 Léo Pereira · Elenco 2026 · Comum
  'jog-leonardo-jardim': 'assets/cartas/jogadores/jog-leonardo-jardim.jpg',  // #206 Leonardo Jardim · Elenco 2026 · Comum
  'jog-leozinho': 'assets/cartas/jogadores/jog-leozinho.jpg',  // #207 Leozinho · Elenco 2026 · Comum
  'jog-lescano': 'assets/cartas/jogadores/jog-lescano.jpg',  // #208 Lescano · Elenco 2026 · Comum
  'jog-lingard': 'assets/cartas/jogadores/jog-lingard.jpg',  // #209 Lingard · Elenco 2026 · Comum
  'jog-luan-candido': 'assets/cartas/jogadores/jog-luan-candido.jpg',  // #210 Luan Cândido · Elenco 2026 · Comum
  'jog-luan-peres': 'assets/cartas/jogadores/jog-luan-peres.jpg',  // #211 Luan Peres · Elenco 2026 · Comum
  'jog-lucas-arcanjo': 'assets/cartas/jogadores/jog-lucas-arcanjo.jpg',  // #212 Lucas Arcanjo · Elenco 2026 · Comum
  'jog-lucas-barbosa': 'assets/cartas/jogadores/jog-lucas-barbosa.jpg',  // #213 Lucas Barbosa · Elenco 2026 · Comum
  'jog-lucas-evangelista': 'assets/cartas/jogadores/jog-lucas-evangelista.jpg',  // #214 Lucas Evangelista · Elenco 2026 · Comum
  'jog-lucas-moura': 'assets/cartas/jogadores/jog-lucas-moura.jpg',  // #215 Lucas Moura · Elenco 2026 · Comum
  'jog-lucas-oliveira': 'assets/cartas/jogadores/jog-lucas-oliveira.jpg',  // #216 Lucas Oliveira · Elenco 2026 · Comum
  'jog-lucas-romero': 'assets/cartas/jogadores/jog-lucas-romero.jpg',  // #217 Lucas Romero · Elenco 2026 · Comum
  'jog-lucas-verissimo': 'assets/cartas/jogadores/jog-lucas-verissimo.jpg',  // #218 Lucas Veríssimo · Elenco 2026 · Comum
  'jog-lucho-acosta': 'assets/cartas/jogadores/jog-lucho-acosta.jpg',  // #219 Lucho Acosta · Elenco 2026 · Comum
  'jog-luciano': 'assets/cartas/jogadores/jog-luciano.jpg',  // #220 Luciano · Elenco 2026 · Comum
  'jog-luciano-juba': 'assets/cartas/jogadores/jog-luciano-juba.jpg',  // #221 Luciano Juba · Elenco 2026 · Comum
  'jog-luiz-gustavo': 'assets/cartas/jogadores/jog-luiz-gustavo.jpg',  // #222 Luiz Gustavo · Elenco 2026 · Comum
  'jog-lyanco': 'assets/cartas/jogadores/jog-lyanco.jpg',  // #223 Lyanco · Elenco 2026 · Comum
  'jog-marcal': 'assets/cartas/jogadores/jog-marcal.jpg',  // #224 Marçal · Elenco 2026 · Comum
  'jog-marcao': 'assets/cartas/jogadores/jog-marcao.jpg',  // #225 Marcão · Elenco 2026 · Comum
  'jog-marcelinho': 'assets/cartas/jogadores/jog-marcelinho.jpg',  // #226 Marcelinho · Elenco 2026 · Comum
  'jog-marcelo-rangel': 'assets/cartas/jogadores/jog-marcelo-rangel.jpg',  // #227 Marcelo Rangel · Elenco 2026 · Comum
  'jog-marcinho': 'assets/cartas/jogadores/jog-marcinho.jpg',  // #228 Marcinho · Elenco 2026 · Comum
  'jog-marcos-antonio': 'assets/cartas/jogadores/jog-marcos-antonio.jpg',  // #229 Marcos Antônio · Elenco 2026 · Comum
  'jog-marcos-victor': 'assets/cartas/jogadores/jog-marcos-victor.jpg',  // #230 Marcos Victor · Elenco 2026 · Comum
  'jog-maripan': '',  // #231 Maripán · Elenco 2026 · Comum
  'jog-marllon': 'assets/cartas/jogadores/jog-marllon.jpg',  // #232 Marllon · Elenco 2026 · Comum
  'jog-marlon': 'assets/cartas/jogadores/jog-marlon.jpg',  // #233 Marlon · Elenco 2026 · Comum
  'jog-marlon-2': 'assets/cartas/jogadores/jog-marlon-2.jpg',  // #234 Marlon · Elenco 2026 · Comum
  'jog-marlon-freitas': 'assets/cartas/jogadores/jog-marlon-freitas.jpg',  // #235 Marlon Freitas · Elenco 2026 · Comum
  'jog-martinelli': 'assets/cartas/jogadores/jog-martinelli.jpg',  // #236 Martinelli · Elenco 2026 · Comum
  'jog-mateus-silva': 'assets/cartas/jogadores/jog-mateus-silva.jpg',  // #237 Mateus Silva · Elenco 2026 · Comum
  'jog-matheus-bahia': 'assets/cartas/jogadores/jog-matheus-bahia.jpg',  // #238 Matheus Bahia · Elenco 2026 · Comum
  'jog-matheus-bidu': 'assets/cartas/jogadores/jog-matheus-bidu.jpg',  // #239 Matheus Bidu · Elenco 2026 · Comum
  'jog-matheus-henrique': 'assets/cartas/jogadores/jog-matheus-henrique.jpg',  // #240 Matheus Henrique · Elenco 2026 · Comum
  'jog-matheus-martins': 'assets/cartas/jogadores/jog-matheus-martins.jpg',  // #241 Matheus Martins · Elenco 2026 · Comum
  'jog-matheus-pereira': 'assets/cartas/jogadores/jog-matheus-pereira.jpg',  // #242 Matheus Pereira · Elenco 2026 · Comum
  'jog-matheuzinho': 'assets/cartas/jogadores/jog-matheuzinho.jpg',  // #243 Matheuzinho · Elenco 2026 · Comum
  'jog-matheuzinho-2': 'assets/cartas/jogadores/jog-matheuzinho-2.jpg',  // #244 Matheuzinho · Elenco 2026 · Comum
  'jog-mauricio': 'assets/cartas/jogadores/jog-mauricio.jpg',  // #245 Maurício · Elenco 2026 · Comum
  'jog-maycon': 'assets/cartas/jogadores/jog-maycon.jpg',  // #246 Maycon · Elenco 2026 · Comum
  'jog-memphis': 'assets/cartas/jogadores/jog-memphis.jpg',  // #247 Memphis · Elenco 2026 · Comum
  'jog-mendoza': 'assets/cartas/jogadores/jog-mendoza.jpg',  // #248 Mendoza · Elenco 2026 · Comum
  'jog-mercado': 'assets/cartas/jogadores/jog-mercado.jpg',  // #249 Mercado · Elenco 2026 · Comum
  'jog-montoro': 'assets/cartas/jogadores/jog-montoro.jpg',  // #250 Montoro · Elenco 2026 · Comum
  'jog-murilo': 'assets/cartas/jogadores/jog-murilo.jpg',  // #251 Murilo · Elenco 2026 · Comum
  'jog-mycael': 'assets/cartas/jogadores/jog-mycael.jpg',  // #252 Mycael · Elenco 2026 · Comum
  'jog-natanael': 'assets/cartas/jogadores/jog-natanael.jpg',  // #253 Natanael · Elenco 2026 · Comum
  'jog-neto-moura': 'assets/cartas/jogadores/jog-neto-moura.jpg',  // #254 Neto Moura · Elenco 2026 · Comum
  'jog-newton': 'assets/cartas/jogadores/jog-newton.jpg',  // #255 Newton · Elenco 2026 · Comum
  'jog-neymar': 'assets/cartas/jogadores/jog-neymar.jpg',  // #256 Neymar · Elenco 2026 · Comum
  'jog-nicolas-fonseca': 'assets/cartas/jogadores/jog-nicolas-fonseca.jpg',  // #257 Nicolás Fonseca · Elenco 2026 · Comum
  'jog-nonato': 'assets/cartas/jogadores/jog-nonato.jpg',  // #258 Nonato · Elenco 2026 · Comum
  'jog-noriega': 'assets/cartas/jogadores/jog-noriega.jpg',  // #259 Noriega · Elenco 2026 · Comum
  'jog-odair-hellmann': 'assets/cartas/jogadores/jog-odair-hellmann.jpg',  // #260 Odair Hellmann · Elenco 2026 · Comum
  'jog-osorio': 'assets/cartas/jogadores/jog-osorio.jpg',  // #261 Osorio · Elenco 2026 · Comum
  'jog-otavio': 'assets/cartas/jogadores/jog-otavio.jpg',  // #262 Otávio · Elenco 2026 · Comum
  'jog-pablo-maia': 'assets/cartas/jogadores/jog-pablo-maia.jpg',  // #263 Pablo Maia · Elenco 2026 · Comum
  'jog-paqueta': 'assets/cartas/jogadores/jog-paqueta.jpg',  // #264 Paquetá · Elenco 2026 · Comum
  'jog-patrick': 'assets/cartas/jogadores/jog-patrick.jpg',  // #265 Patrick · Elenco 2026 · Comum
  'jog-paulo-henrique': 'assets/cartas/jogadores/jog-paulo-henrique.jpg',  // #266 Paulo Henrique · Elenco 2026 · Comum
  'jog-paulo-roberto': 'assets/cartas/jogadores/jog-paulo-roberto.jpg',  // #267 Paulo Roberto · Elenco 2026 · Comum
  'jog-pavon': 'assets/cartas/jogadores/jog-pavon.jpg',  // #268 Pavón · Elenco 2026 · Comum
  'jog-pedro': 'assets/cartas/jogadores/jog-pedro.jpg',  // #269 Pedro · Elenco 2026 · Comum
  'jog-pedro-emanuel': 'assets/cartas/jogadores/jog-pedro-emanuel.jpg',  // #270 Pedro Emanuel · Elenco 2026 · Comum
  'jog-pedro-lima': 'assets/cartas/jogadores/jog-pedro-lima.jpg',  // #271 Pedro Lima · Elenco 2026 · Comum
  'jog-pedro-milans': 'assets/cartas/jogadores/jog-pedro-milans.jpg',  // #272 Pedro Milans · Elenco 2026 · Comum
  'jog-pedro-morisco': 'assets/cartas/jogadores/jog-pedro-morisco.jpg',  // #273 Pedro Morisco · Elenco 2026 · Comum
  'jog-pedro-rangel': 'assets/cartas/jogadores/jog-pedro-rangel.jpg',  // #274 Pedro Rangel · Elenco 2026 · Comum
  'jog-pedro-rocha': 'assets/cartas/jogadores/jog-pedro-rocha.jpg',  // #275 Pedro Rocha · Elenco 2026 · Comum
  'jog-coutinho': 'assets/cartas/jogadores/jog-coutinho.jpg',  // #276 Philippe Coutinho · Elenco 2026 · Comum
  'jog-picco': 'assets/cartas/jogadores/jog-picco.jpg',  // #277 Picco · Elenco 2026 · Comum
  'jog-piquerez': 'assets/cartas/jogadores/jog-piquerez.jpg',  // #278 Piquerez · Elenco 2026 · Comum
  'jog-plata': 'assets/cartas/jogadores/jog-plata.jpg',  // #279 Plata · Elenco 2026 · Comum
  'jog-pulgar': 'assets/cartas/jogadores/jog-pulgar.jpg',  // #280 Pulgar · Elenco 2026 · Comum
  'jog-puma-rodriguez': 'assets/cartas/jogadores/jog-puma-rodriguez.jpg',  // #281 Puma Rodríguez · Elenco 2026 · Comum
  'jog-rafael': 'assets/cartas/jogadores/jog-rafael.jpg',  // #282 Rafael · Elenco 2026 · Comum
  'jog-rafael-guanaes': 'assets/cartas/jogadores/jog-rafael-guanaes.jpg',  // #283 Rafael Guanaes · Elenco 2026 · Comum
  'jog-rafael-lacerda': 'assets/cartas/jogadores/jog-rafael-lacerda.jpg',  // #284 Rafael Lacerda · Elenco 2026 · Comum
  'jog-rafael-toloi': 'assets/cartas/jogadores/jog-rafael-toloi.jpg',  // #285 Rafael Tolói · Elenco 2026 · Comum
  'jog-ramon': 'assets/cartas/jogadores/jog-ramon.jpg',  // #286 Ramon · Elenco 2026 · Comum
  'jog-ramon-sosa': 'assets/cartas/jogadores/jog-ramon-sosa.jpg',  // #287 Ramón Sosa · Elenco 2026 · Comum
  'jog-raniele': 'assets/cartas/jogadores/jog-raniele.jpg',  // #288 Raniele · Elenco 2026 · Comum
  'jog-reinaldo-2': 'assets/cartas/jogadores/jog-reinaldo-2.jpg',  // #289 Reinaldo · Elenco 2026 · Comum
  'jog-reinier': 'assets/cartas/jogadores/jog-reinier.jpg',  // #290 Reinier · Elenco 2026 · Comum
  'jog-renan-lodi': 'assets/cartas/jogadores/jog-renan-lodi.jpg',  // #291 Renan Lodi · Elenco 2026 · Comum
  'jog-renato-gaucho': 'assets/cartas/jogadores/jog-renato-gaucho.jpg',  // #292 Renato Gaúcho · Elenco 2026 · Comum
  'jog-renato-kayzer': 'assets/cartas/jogadores/jog-renato-kayzer.jpg',  // #293 Renato Kayzer · Elenco 2026 · Comum
  'jog-rene': 'assets/cartas/jogadores/jog-rene.jpg',  // #294 Renê · Elenco 2026 · Comum
  'jog-rene-2': 'assets/cartas/jogadores/jog-rene-2.jpg',  // #295 Renê · Elenco 2026 · Comum
  'jog-robert-renan': 'assets/cartas/jogadores/jog-robert-renan.jpg',  // #296 Robert Renan · Elenco 2026 · Comum
  'jog-rodinei': 'assets/cartas/jogadores/jog-rodinei.jpg',  // #297 Rodinei · Elenco 2026 · Comum
  'jog-rodrigo-nestor': 'assets/cartas/jogadores/jog-rodrigo-nestor.jpg',  // #298 Rodrigo Nestor · Elenco 2026 · Comum
  'jog-rogerio-ceni': 'assets/cartas/jogadores/jog-rogerio-ceni.jpg',  // #299 Rogério Ceni · Elenco 2026 · Comum
  'jog-rollheiser': 'assets/cartas/jogadores/jog-rollheiser.jpg',  // #300 Rollheiser · Elenco 2026 · Comum
  'jog-roman-gomez': 'assets/cartas/jogadores/jog-roman-gomez.jpg',  // #301 Román Gómez · Elenco 2026 · Comum
  'jog-ronaldo': 'assets/cartas/jogadores/jog-ronaldo.jpg',  // #302 Ronaldo · Elenco 2026 · Comum
  'jog-rossi': 'assets/cartas/jogadores/jog-rossi.jpg',  // #303 Rossi · Elenco 2026 · Comum
  'jog-ryan-augusto': 'assets/cartas/jogadores/jog-ryan-augusto.jpg',  // #304 Ryan Augusto · Elenco 2026 · Comum
  'jog-saldivia': 'assets/cartas/jogadores/jog-saldivia.jpg',  // #305 Saldivia · Elenco 2026 · Comum
  'jog-samuel-lino': 'assets/cartas/jogadores/jog-samuel-lino.jpg',  // #306 Samuel Lino · Elenco 2026 · Comum
  'jog-santos': 'assets/cartas/jogadores/jog-santos.jpg',  // #307 Santos · Elenco 2026 · Comum
  'jog-savarino': 'assets/cartas/jogadores/jog-savarino.jpg',  // #308 Savarino · Elenco 2026 · Comum
  'jog-sebastian-gomez': '',  // #309 Sebastián Gómez · Elenco 2026 · Comum
  'jog-seedorf': 'assets/cartas/jogadores/jog-seedorf.jpg',  // #310 Seedorf · Elenco 2026 · Comum
  'jog-serna': 'assets/cartas/jogadores/jog-serna.jpg',  // #311 Serna · Elenco 2026 · Comum
  'jog-shaylon': 'assets/cartas/jogadores/jog-shaylon.jpg',  // #312 Shaylon · Elenco 2026 · Comum
  'jog-sosa': 'assets/cartas/jogadores/jog-sosa.jpg',  // #313 Sosa · Elenco 2026 · Comum
  'jog-taliari': '',  // #314 Taliari · Elenco 2026 · Comum
  'jog-tchamba': 'assets/cartas/jogadores/jog-tchamba.jpg',  // #315 Tchamba · Elenco 2026 · Comum
  'jog-thiago-carpini': 'assets/cartas/jogadores/jog-thiago-carpini.jpg',  // #316 Thiago Carpini · Elenco 2026 · Comum
  'jog-thiago-maia': 'assets/cartas/jogadores/jog-thiago-maia.jpg',  // #317 Thiago Maia · Elenco 2026 · Comum
  'jog-thiago-mendes': 'assets/cartas/jogadores/jog-thiago-mendes.jpg',  // #318 Thiago Mendes · Elenco 2026 · Comum
  'jog-thiago-santos': 'assets/cartas/jogadores/jog-thiago-santos.jpg',  // #319 Thiago Santos · Elenco 2026 · Comum
  'jog-thiago-silva': 'assets/cartas/jogadores/jog-thiago-silva.jpg',  // #320 Thiago Silva · Elenco 2026 · Comum
  'jog-tiago-coser': 'assets/cartas/jogadores/jog-tiago-coser.jpg',  // #321 Tiago Cóser · Elenco 2026 · Comum
  'jog-tiago-volpi': 'assets/cartas/jogadores/jog-tiago-volpi.jpg',  // #322 Tiago Volpi · Elenco 2026 · Comum
  'jog-tinga': 'assets/cartas/jogadores/jog-tinga.jpg',  // #323 Tinga · Elenco 2026 · Comum
  'jog-tiquinho-soares': 'assets/cartas/jogadores/jog-tiquinho-soares.jpg',  // #324 Tiquinho Soares · Elenco 2026 · Comum
  'jog-tite': 'assets/cartas/jogadores/jog-tite.jpg',  // #325 Tite · Elenco 2026 · Comum
  'jog-cuello': 'assets/cartas/jogadores/jog-cuello.jpg',  // #326 Tomás Cuello · Elenco 2026 · Comum
  'jog-tulio-eduardo': 'assets/cartas/jogadores/jog-tulio-eduardo.jpg',  // #327 Túlio Eduardo · Elenco 2026 · Comum
  'jog-vagner-mancini': 'assets/cartas/jogadores/jog-vagner-mancini.jpg',  // #328 Vagner Mancini · Elenco 2026 · Comum
  'jog-varela': 'assets/cartas/jogadores/jog-varela.jpg',  // #329 Varela · Elenco 2026 · Comum
  'jog-victor-caetano': 'assets/cartas/jogadores/jog-victor-caetano.jpg',  // #330 Victor Caetano · Elenco 2026 · Comum
  'jog-villagra': 'assets/cartas/jogadores/jog-villagra.jpg',  // #331 Villagra · Elenco 2026 · Comum
  'jog-villalba': 'assets/cartas/jogadores/jog-villalba.jpg',  // #332 Villalba · Elenco 2026 · Comum
  'jog-villasanti': 'assets/cartas/jogadores/jog-villasanti.jpg',  // #333 Villasanti · Elenco 2026 · Comum
  'jog-vinicius-bergantin': 'assets/cartas/jogadores/jog-vinicius-bergantin.jpg',  // #334 Vinícius Bergantin · Elenco 2026 · Comum
  'jog-vitao': 'assets/cartas/jogadores/jog-vitao.jpg',  // #335 Vitão · Elenco 2026 · Comum
  'jog-vitinho': 'assets/cartas/jogadores/jog-vitinho.jpg',  // #336 Vitinho · Elenco 2026 · Comum
  'jog-vitinho-2': 'assets/cartas/jogadores/jog-vitinho-2.jpg',  // #337 Vitinho · Elenco 2026 · Comum
  'jog-vitor-bueno': 'assets/cartas/jogadores/jog-vitor-bueno.jpg',  // #338 Vitor Bueno · Elenco 2026 · Comum
  'jog-vitor-roque': 'assets/cartas/jogadores/jog-vitor-roque.jpg',  // #339 Vitor Roque · Elenco 2026 · Comum
  'jog-viveros': 'assets/cartas/jogadores/jog-viveros.jpg',  // #340 Viveros · Elenco 2026 · Comum
  'jog-wallace': 'assets/cartas/jogadores/jog-wallace.jpg',  // #341 Wallace · Elenco 2026 · Comum
  'jog-wallace-yan': 'assets/cartas/jogadores/jog-wallace-yan.jpg',  // #342 Wallace Yan · Elenco 2026 · Comum
  'jog-wallisson': 'assets/cartas/jogadores/jog-wallisson.jpg',  // #343 Wallisson · Elenco 2026 · Comum
  'jog-walter': 'assets/cartas/jogadores/jog-walter.jpg',  // #344 Walter · Elenco 2026 · Comum
  'jog-weverton': 'assets/cartas/jogadores/jog-weverton.jpg',  // #345 Weverton · Elenco 2026 · Comum
  'jog-william': 'assets/cartas/jogadores/jog-william.jpg',  // #346 William · Elenco 2026 · Comum
  'jog-willian-jose': 'assets/cartas/jogadores/jog-willian-jose.jpg',  // #347 Willian José · Elenco 2026 · Comum
  'jog-willian-machado': 'assets/cartas/jogadores/jog-willian-machado.jpg',  // #348 Willian Machado · Elenco 2026 · Comum
  'jog-yago-felipe': '',  // #349 Yago Felipe · Elenco 2026 · Comum
  'jog-yago-pikachu': 'assets/cartas/jogadores/jog-yago-pikachu.jpg',  // #350 Yago Pikachu · Elenco 2026 · Comum
  'jog-yuri-alberto': 'assets/cartas/jogadores/jog-yuri-alberto.jpg',  // #351 Yuri Alberto · Elenco 2026 · Comum
  'jog-zapelli': 'assets/cartas/jogadores/jog-zapelli.jpg',  // #352 Zapelli · Elenco 2026 · Comum
  'jog-ze-lucas': 'assets/cartas/jogadores/jog-ze-lucas.jpg',  // #353 Zé Lucas · Elenco 2026 · Comum
  'jog-ze-ricardo': 'assets/cartas/jogadores/jog-ze-ricardo.jpg',  // #354 Zé Ricardo · Elenco 2026 · Comum
  'jog-ze-vitor': 'assets/cartas/jogadores/jog-ze-vitor.jpg',  // #355 Zé Vitor · Elenco 2026 · Comum
  'jog-ze-welison': 'assets/cartas/jogadores/jog-ze-welison.jpg',  // #356 Zé Welison · Elenco 2026 · Comum
  'jog-ziyech': 'assets/cartas/jogadores/jog-ziyech.jpg',  // #357 Ziyech · Elenco 2026 · Comum

  // ---------- Estádios (49 cartas)
  'estadio-fla-maracana-1950': 'assets/cartas/estadios/estadio-fla-maracana-1950.jpg',  // #01 Maracanã 1950 · Histórico · Especial
  'estadio-cor-pacaembu': 'assets/cartas/estadios/estadio-cor-pacaembu.jpg',  // #02 Pacaembu · Histórico · Especial
  'estadio-vas-sao-januario-1927': 'assets/cartas/estadios/estadio-vas-sao-januario-1927.jpg',  // #03 São Januário 1927 · Histórico · Especial
  'estadio-gre-baixada': 'assets/cartas/estadios/estadio-gre-baixada.jpg',  // #04 Baixada dos Moinhos de Vento · Histórico · Muito rara
  'estadio-cru-barro-preto-1951': 'assets/cartas/estadios/estadio-cru-barro-preto-1951.jpg',  // #05 Barro Preto 1951 · Histórico · Muito rara
  'estadio-int-beira-rio-obras': 'assets/cartas/estadios/estadio-int-beira-rio-obras.jpg',  // #06 Beira-Rio anos 1960 · Histórico · Muito rara
  'estadio-flu-maracana-1950': 'assets/cartas/estadios/estadio-flu-maracana-1950.jpg',  // #07 Maracanã 1950 (final) · Histórico · Muito rara
  'estadio-sao-morumbi-1970': 'assets/cartas/estadios/estadio-sao-morumbi-1970.jpg',  // #08 Morumbi 1970 · Histórico · Muito rara
  'estadio-pal-palestra-italia-1958': 'assets/cartas/estadios/estadio-pal-palestra-italia-1958.jpg',  // #09 Palestra Itália 1958 · Histórico · Muito rara
  'estadio-cam-antonio-carlos': 'assets/cartas/estadios/estadio-cam-antonio-carlos.jpg',  // #10 Antônio Carlos 1943 · Histórico · Rara
  'estadio-cha-arena-conda-2016': 'assets/cartas/estadios/estadio-cha-arena-conda-2016.jpg',  // #11 Arena Condá 2016 · Histórico · Rara
  'estadio-rem-baenao': '',  // #12 Baenão antigo · Histórico · Rara
  'estadio-cap-baixada-madeira': 'assets/cartas/estadios/estadio-cap-baixada-madeira.jpg',  // #13 Baixada de madeira · Histórico · Rara
  'estadio-vit-barradao-2006': 'assets/cartas/estadios/estadio-vit-barradao-2006.jpg',  // #14 Barradão 2006 · Histórico · Rara
  'estadio-cfc-belfort-duarte': 'assets/cartas/estadios/estadio-cfc-belfort-duarte.jpg',  // #15 Belfort Duarte em obras · Histórico · Rara
  'estadio-int-eucaliptos': 'assets/cartas/estadios/estadio-int-eucaliptos.jpg',  // #16 Estádio dos Eucaliptos · Histórico · Rara
  'estadio-vas-sao-januario-fachada': 'assets/cartas/estadios/estadio-vas-sao-januario-fachada.jpg',  // #17 Fachada de São Januário · Histórico · Rara
  'estadio-bah-fonte-nova': 'assets/cartas/estadios/estadio-bah-fonte-nova.jpg',  // #18 Fonte Nova antiga · Histórico · Rara
  'estadio-vit-fonte-nova': 'assets/cartas/estadios/estadio-vit-fonte-nova.jpg',  // #19 Fonte Nova do Ba-Vi · Histórico · Rara
  'estadio-bot-general-severiano': 'assets/cartas/estadios/estadio-bot-general-severiano.jpg',  // #20 General Severiano · Histórico · Rara
  'estadio-bot-general-severiano-1915': 'assets/cartas/estadios/estadio-bot-general-severiano-1915.jpg',  // #21 General Severiano 1915 · Histórico · Rara
  'estadio-cap-baixada-1969': 'assets/cartas/estadios/estadio-cap-baixada-1969.jpg',  // #22 Joaquim Américo 1969 · Histórico · Rara
  'estadio-flu-laranjeiras': 'assets/cartas/estadios/estadio-flu-laranjeiras.jpg',  // #23 Laranjeiras · Histórico · Rara
  'estadio-mir-maiao-2009': 'assets/cartas/estadios/estadio-mir-maiao-2009.jpg',  // #24 Maião 2009 · Histórico · Rara
  'estadio-rbb-marcelo-stefani-1968': 'assets/cartas/estadios/estadio-rbb-marcelo-stefani-1968.jpg',  // #25 Marcelo Stéfani 1968 · Histórico · Rara
  'estadio-cru-mineirao-1965': 'assets/cartas/estadios/estadio-cru-mineirao-1965.jpg',  // #26 Mineirão 1965 · Histórico · Rara
  'estadio-cam-mineirao-1969': 'assets/cartas/estadios/estadio-cam-mineirao-1969.jpg',  // #27 Mineirão 1969 · Histórico · Rara
  'estadio-sao-morumbi-1960': 'assets/cartas/estadios/estadio-sao-morumbi-1960.jpg',  // #28 Morumbi 1960 · Histórico · Rara
  'estadio-gre-olimpico': 'assets/cartas/estadios/estadio-gre-olimpico.jpg',  // #29 Olímpico Monumental · Histórico · Rara
  'estadio-san-vila-belmiro': 'assets/cartas/estadios/estadio-san-vila-belmiro.jpg',  // #30 Vila Belmiro antiga · Histórico · Rara
  'estadio-allianz': 'assets/cartas/estadios/estadio-allianz.jpg',  // #31 Allianz Parque · Estádio · Comum
  'estadio-arena-conda': 'assets/cartas/estadios/estadio-arena-conda.jpg',  // #32 Arena Condá · Estádio · Comum
  'estadio-arena-gremio': 'assets/cartas/estadios/estadio-arena-gremio.jpg',  // #33 Arena do Grêmio · Estádio · Comum
  'estadio-fonte-nova': 'assets/cartas/estadios/estadio-fonte-nova.jpg',  // #34 Arena Fonte Nova · Estádio · Comum
  'estadio-arena-mrv': 'assets/cartas/estadios/estadio-arena-mrv.jpg',  // #35 Arena MRV · Estádio · Comum
  'estadio-barradao': 'assets/cartas/estadios/estadio-barradao.jpg',  // #36 Barradão · Estádio · Comum
  'estadio-beira-rio': 'assets/cartas/estadios/estadio-beira-rio.jpg',  // #37 Beira-Rio · Estádio · Comum
  'estadio-couto-pereira': 'assets/cartas/estadios/estadio-couto-pereira.jpg',  // #38 Couto Pereira · Estádio · Comum
  'estadio-ligga-arena': 'assets/cartas/estadios/estadio-ligga-arena.jpg',  // #39 Ligga Arena · Estádio · Comum
  'estadio-maiao': 'assets/cartas/estadios/estadio-maiao.jpg',  // #40 Maião · Estádio · Comum
  'estadio-mangueirao': 'assets/cartas/estadios/estadio-mangueirao.jpg',  // #41 Mangueirão · Estádio · Comum
  'estadio-maracana': 'assets/cartas/estadios/estadio-maracana.jpg',  // #42 Maracanã · Estádio · Comum
  'estadio-mineirao': 'assets/cartas/estadios/estadio-mineirao.jpg',  // #43 Mineirão · Estádio · Comum
  'estadio-morumbis': 'assets/cartas/estadios/estadio-morumbis.jpg',  // #44 MorumBIS · Estádio · Comum
  'estadio-nabi-abi-chedid': 'assets/cartas/estadios/estadio-nabi-abi-chedid.jpg',  // #45 Nabi Abi Chedid · Estádio · Comum
  'estadio-neo-quimica': 'assets/cartas/estadios/estadio-neo-quimica.jpg',  // #46 Neo Química Arena · Estádio · Comum
  'estadio-nilton-santos': 'assets/cartas/estadios/estadio-nilton-santos.jpg',  // #47 Nilton Santos · Estádio · Comum
  'estadio-sao-januario': 'assets/cartas/estadios/estadio-sao-januario.jpg',  // #48 São Januário · Estádio · Comum
  'estadio-vila-belmiro': 'assets/cartas/estadios/estadio-vila-belmiro.jpg',  // #49 Vila Belmiro · Estádio · Comum

  // ---------- Mascotes (29 cartas)
  'masc-pal-supremo': 'assets/cartas/mascotes/masc-pal.jpg',  // #01 Gobbato Supremo · Supremo · Especial
  'masc-fla-supremo': 'assets/cartas/mascotes/masc-fla.jpg',  // #02 Urubão Supremo · Supremo · Especial
  'masc-san-lendario': 'assets/cartas/mascotes/masc-san.jpg',  // #03 Baleião Lendária · Lendário · Muito rara
  'masc-cor-lendario': 'assets/cartas/mascotes/masc-cor.jpg',  // #04 Mosqueteiro Lendário · Lendário · Muito rara
  'masc-int-lendario': 'assets/cartas/mascotes/masc-int.jpg',  // #05 Saci Lendário · Lendário · Muito rara
  'masc-cam-neon': 'assets/cartas/mascotes/masc-cam.jpg',  // #06 Galo Doido Neon · Neon · Rara
  'masc-pal-neon': 'assets/cartas/mascotes/masc-pal.jpg',  // #07 Gobbato Neon · Neon · Rara
  'masc-cru-neon': 'assets/cartas/mascotes/masc-cru.jpg',  // #08 Raposão Neon · Neon · Rara
  'masc-fla-neon': 'assets/cartas/mascotes/masc-fla.jpg',  // #09 Urubão Neon · Neon · Rara
  'masc-vas': 'assets/cartas/mascotes/masc-vas.jpg',  // #10 Almirante · Oficial · Comum
  'masc-san': 'assets/cartas/mascotes/masc-san.jpg',  // #11 Baleião · Oficial · Comum
  'masc-bot': 'assets/cartas/mascotes/masc-bot.jpg',  // #12 Bira · Oficial · Comum
  'masc-cap': 'assets/cartas/mascotes/masc-cap.jpg',  // #13 Fura-Cão · Oficial · Comum
  'masc-cam': 'assets/cartas/mascotes/masc-cam.jpg',  // #14 Galo Doido · Oficial · Comum
  'masc-pal': 'assets/cartas/mascotes/masc-pal.jpg',  // #15 Gobbato · Oficial · Comum
  'masc-flu': 'assets/cartas/mascotes/masc-flu.jpg',  // #16 Guerreirinho · Oficial · Comum
  'masc-cha': 'assets/cartas/mascotes/masc-cha.jpg',  // #17 Índio Condá · Oficial · Comum
  'masc-mir': 'assets/cartas/mascotes/masc-mir.jpg',  // #18 Leão · Oficial · Comum
  'masc-rem': 'assets/cartas/mascotes/masc-rem.jpg',  // #19 Leão Malino · Oficial · Comum
  'masc-vit': 'assets/cartas/mascotes/masc-vit.jpg',  // #20 Lelê Leão · Oficial · Comum
  'masc-cor': 'assets/cartas/mascotes/masc-cor.jpg',  // #21 Mosqueteiro · Oficial · Comum
  'masc-gre': 'assets/cartas/mascotes/masc-gre.jpg',  // #22 Mosqueteiro · Oficial · Comum
  'masc-cru': 'assets/cartas/mascotes/masc-cru.jpg',  // #23 Raposão · Oficial · Comum
  'masc-int': 'assets/cartas/mascotes/masc-int.jpg',  // #24 Saci · Oficial · Comum
  'masc-sao': 'assets/cartas/mascotes/masc-sao.jpg',  // #25 Santo Paulo · Oficial · Comum
  'masc-bah': 'assets/cartas/mascotes/masc-bah.jpg',  // #26 Super-Homem Tricolor · Oficial · Comum
  'masc-rbb': 'assets/cartas/mascotes/masc-rbb.jpg',  // #27 Toro Loko · Oficial · Comum
  'masc-fla': 'assets/cartas/mascotes/masc-fla.jpg',  // #28 Urubão · Oficial · Comum
  'masc-cfc': 'assets/cartas/mascotes/masc-cfc.jpg',  // #29 Vovô Coxa · Oficial · Comum

  // ---------- Champions · Clubes (72 cartas)
  'ucl-ars-1949': 'assets/cartas/ucl-clubes/ucl-ars-1949.png',  // #01 Arsenal · Escudo 1949 · Especial
  'ucl-rom-1979': 'assets/cartas/ucl-clubes/ucl-rom-1979.png',  // #02 AS Roma · Escudo 1979 · Especial
  'ucl-bar-1899': 'assets/cartas/ucl-clubes/ucl-bar-1899.png',  // #03 Barcelona · Escudo 1899 · Especial
  'ucl-bay-1954': 'assets/cartas/ucl-clubes/ucl-bay-1954.png',  // #04 Bayern de Munique · Escudo 1954 · Especial
  'ucl-inm-1908': 'assets/cartas/ucl-clubes/ucl-inm-1908.png',  // #05 Inter de Milão · Escudo 1908 · Especial
  'ucl-mun-1973': 'assets/cartas/ucl-clubes/ucl-mun-1973.png',  // #06 Manchester United · Escudo 1973 · Especial
  'ucl-rma-1931': 'assets/cartas/ucl-clubes/ucl-rma-1931.png',  // #07 Real Madrid · Escudo 1931 · Especial
  'ucl-avl-1956': 'assets/cartas/ucl-clubes/ucl-avl-1956.png',  // #08 Aston Villa · Escudo 1956 · Muito rara
  'ucl-atm-1941': 'assets/cartas/ucl-clubes/ucl-atm-1941.png',  // #09 Atlético de Madrid · Escudo 1941 · Muito rara
  'ucl-bvb-1945': 'assets/cartas/ucl-clubes/ucl-bvb-1945.png',  // #10 Borussia Dortmund · Escudo 1945 · Muito rara
  'ucl-por-1922': 'assets/cartas/ucl-clubes/ucl-por-1922.png',  // #11 FC Porto · Escudo 1922 · Muito rara
  'ucl-fen-1923': 'assets/cartas/ucl-clubes/ucl-fen-1923.png',  // #12 Fenerbahçe · Escudo 1923 · Muito rara
  'ucl-fey-1956': 'assets/cartas/ucl-clubes/ucl-fey-1956.png',  // #13 Feyenoord · Escudo 1956 · Muito rara
  'ucl-gal-antigo': 'assets/cartas/ucl-clubes/ucl-gal-antigo.png',  // #14 Galatasaray · Escudo histórico · Muito rara
  'ucl-liv-1987': 'assets/cartas/ucl-clubes/ucl-liv-1987.png',  // #15 Liverpool · Escudo 1987 · Muito rara
  'ucl-mci-1972': 'assets/cartas/ucl-clubes/ucl-mci-1972.png',  // #16 Manchester City · Escudo 1972 · Muito rara
  'ucl-nap-1926': 'assets/cartas/ucl-clubes/ucl-nap-1926.png',  // #17 Napoli · Escudo 1926 · Muito rara
  'ucl-psg-1972': 'assets/cartas/ucl-clubes/ucl-psg-1972.png',  // #18 Paris Saint-Germain · Escudo 1972 · Muito rara
  'ucl-bet-1931': 'assets/cartas/ucl-clubes/ucl-bet-1931.png',  // #19 Real Betis · Escudo 1931 · Muito rara
  'ucl-sha-1960': 'assets/cartas/ucl-clubes/ucl-sha-1960.png',  // #20 Shakhtar Donetsk · Escudo 1960 · Muito rara
  'ucl-slo-1969': 'assets/cartas/ucl-clubes/ucl-slo-1969.png',  // #21 Slovan Bratislava · Escudo 1969 · Muito rara
  'ucl-vil-1923': 'assets/cartas/ucl-clubes/ucl-vil-1923.png',  // #22 Villarreal · Escudo 1920 · Muito rara
  'ucl-aek-1924': 'assets/cartas/ucl-clubes/ucl-aek-1924.png',  // #23 AEK Atenas · Escudo 1924 · Rara
  'ucl-bod-antigo': '',  // #24 Bodø/Glimt · Escudo histórico · Rara
  'ucl-bru-1891': 'assets/cartas/ucl-clubes/ucl-bru-1891.png',  // #25 Club Brugge · Escudo histórico · Rara
  'ucl-com-1950': 'assets/cartas/ucl-clubes/ucl-com-1950.png',  // #26 Como · Escudo 1950 · Rara
  'ucl-lsk-antigo': 'assets/cartas/ucl-clubes/ucl-lsk-antigo.png',  // #27 LASK · Escudo 2023 · Rara
  'ucl-lil-1981': 'assets/cartas/ucl-clubes/ucl-lil-1981.png',  // #28 LOSC Lille · Escudo 1981 · Rara
  'ucl-psv-1982': 'assets/cartas/ucl-clubes/ucl-psv-1982.png',  // #29 PSV Eindhoven · Escudo 1982 · Rara
  'ucl-rbl-2009': 'assets/cartas/ucl-clubes/ucl-rbl-2009.png',  // #30 RB Leipzig · Escudo 2009 · Rara
  'ucl-len-1979': 'assets/cartas/ucl-clubes/ucl-len-1979.png',  // #31 RC Lens · Escudo 1979 · Rara
  'ucl-sab-2017': '',  // #32 Sabah · Escudo 2017 · Rara
  'ucl-sla-1923': 'assets/cartas/ucl-clubes/ucl-sla-1923.png',  // #33 Slavia Praha · Escudo 1923 · Rara
  'ucl-scp-1930': 'assets/cartas/ucl-clubes/ucl-scp-1930.png',  // #34 Sporting CP · Escudo 1930 · Rara
  'ucl-vfb-1998': 'assets/cartas/ucl-clubes/ucl-vfb-1998.png',  // #35 VfB Stuttgart · Escudo 1998 · Rara
  'ucl-vik-1926': 'assets/cartas/ucl-clubes/ucl-vik-1926.png',  // #36 Viking · Escudo 2020 · Rara
  'ucl-aek': 'assets/cartas/ucl-clubes/ucl-aek.png',  // #37 AEK Atenas · Escudo atual · Comum
  'ucl-ars': 'assets/cartas/ucl-clubes/ucl-ars.png',  // #38 Arsenal · Escudo atual · Comum
  'ucl-rom': 'assets/cartas/ucl-clubes/ucl-rom.png',  // #39 AS Roma · Escudo atual · Comum
  'ucl-avl': 'assets/cartas/ucl-clubes/ucl-avl.png',  // #40 Aston Villa · Escudo atual · Comum
  'ucl-atm': 'assets/cartas/ucl-clubes/ucl-atm.png',  // #41 Atlético de Madrid · Escudo atual · Comum
  'ucl-bar': 'assets/cartas/ucl-clubes/ucl-bar.png',  // #42 Barcelona · Escudo atual · Comum
  'ucl-bay': 'assets/cartas/ucl-clubes/ucl-bay.png',  // #43 Bayern de Munique · Escudo atual · Comum
  'ucl-bod': 'assets/cartas/ucl-clubes/ucl-bod.png',  // #44 Bodø/Glimt · Escudo atual · Comum
  'ucl-bvb': 'assets/cartas/ucl-clubes/ucl-bvb.png',  // #45 Borussia Dortmund · Escudo atual · Comum
  'ucl-bru': 'assets/cartas/ucl-clubes/ucl-bru.png',  // #46 Club Brugge · Escudo atual · Comum
  'ucl-com': 'assets/cartas/ucl-clubes/ucl-com.png',  // #47 Como · Escudo atual · Comum
  'ucl-por': 'assets/cartas/ucl-clubes/ucl-por.png',  // #48 FC Porto · Escudo atual · Comum
  'ucl-fen': 'assets/cartas/ucl-clubes/ucl-fen.png',  // #49 Fenerbahçe · Escudo atual · Comum
  'ucl-fey': 'assets/cartas/ucl-clubes/ucl-fey.png',  // #50 Feyenoord · Escudo atual · Comum
  'ucl-gal': 'assets/cartas/ucl-clubes/ucl-gal.png',  // #51 Galatasaray · Escudo atual · Comum
  'ucl-inm': 'assets/cartas/ucl-clubes/ucl-inm.png',  // #52 Inter de Milão · Escudo atual · Comum
  'ucl-lsk': 'assets/cartas/ucl-clubes/ucl-lsk.png',  // #53 LASK · Escudo atual · Comum
  'ucl-liv': 'assets/cartas/ucl-clubes/ucl-liv.png',  // #54 Liverpool · Escudo atual · Comum
  'ucl-lil': 'assets/cartas/ucl-clubes/ucl-lil.png',  // #55 LOSC Lille · Escudo atual · Comum
  'ucl-mci': 'assets/cartas/ucl-clubes/ucl-mci.png',  // #56 Manchester City · Escudo atual · Comum
  'ucl-mun': 'assets/cartas/ucl-clubes/ucl-mun.png',  // #57 Manchester United · Escudo atual · Comum
  'ucl-nap': 'assets/cartas/ucl-clubes/ucl-nap.png',  // #58 Napoli · Escudo atual · Comum
  'ucl-psg': 'assets/cartas/ucl-clubes/ucl-psg.png',  // #59 Paris Saint-Germain · Escudo atual · Comum
  'ucl-psv': 'assets/cartas/ucl-clubes/ucl-psv.png',  // #60 PSV Eindhoven · Escudo atual · Comum
  'ucl-rbl': 'assets/cartas/ucl-clubes/ucl-rbl.png',  // #61 RB Leipzig · Escudo atual · Comum
  'ucl-len': 'assets/cartas/ucl-clubes/ucl-len.png',  // #62 RC Lens · Escudo atual · Comum
  'ucl-bet': 'assets/cartas/ucl-clubes/ucl-bet.png',  // #63 Real Betis · Escudo atual · Comum
  'ucl-rma': 'assets/cartas/ucl-clubes/ucl-rma.png',  // #64 Real Madrid · Escudo atual · Comum
  'ucl-sab': 'assets/cartas/ucl-clubes/ucl-sab.png',  // #65 Sabah · Escudo atual · Comum
  'ucl-sha': 'assets/cartas/ucl-clubes/ucl-sha.png',  // #66 Shakhtar Donetsk · Escudo atual · Comum
  'ucl-sla': 'assets/cartas/ucl-clubes/ucl-sla.png',  // #67 Slavia Praha · Escudo atual · Comum
  'ucl-slo': 'assets/cartas/ucl-clubes/ucl-slo.png',  // #68 Slovan Bratislava · Escudo atual · Comum
  'ucl-scp': 'assets/cartas/ucl-clubes/ucl-scp.png',  // #69 Sporting CP · Escudo atual · Comum
  'ucl-vfb': 'assets/cartas/ucl-clubes/ucl-vfb.png',  // #70 VfB Stuttgart · Escudo atual · Comum
  'ucl-vik': 'assets/cartas/ucl-clubes/ucl-vik.png',  // #71 Viking · Escudo atual · Comum
  'ucl-vil': 'assets/cartas/ucl-clubes/ucl-vil.png',  // #72 Villarreal · Escudo atual · Comum

  // ---------- Champions · Jogadores (187 cartas)
  'ujog-beckenbauer-retro': '',  // #01 Beckenbauer · Prime · Especial
  'ujog-cristiano-ronaldo-retro': 'assets/cartas/ucl-jogadores/ujog-cristiano-ronaldo-retro.jpg',  // #02 Cristiano Ronaldo · Prime · Especial
  'ujog-cristiano-ronaldo-retro-2': 'assets/cartas/ucl-jogadores/ujog-cristiano-ronaldo-retro-2.jpg',  // #03 Cristiano Ronaldo · Prime · Especial
  'ujog-cruyff-retro': 'assets/cartas/ucl-jogadores/ujog-cruyff-retro.jpg',  // #04 Cruyff · Prime · Especial
  'ujog-di-stefano-retro': 'assets/cartas/ucl-jogadores/ujog-di-stefano-retro.jpg',  // #05 Di Stéfano · Prime · Especial
  'ujog-gerrard-retro': 'assets/cartas/ucl-jogadores/ujog-gerrard-retro.jpg',  // #06 Gerrard · Prime · Especial
  'ujog-maradona-retro': 'assets/cartas/ucl-jogadores/ujog-maradona-retro.jpg',  // #07 Maradona · Prime · Especial
  'ujog-messi-retro': 'assets/cartas/ucl-jogadores/ujog-messi-retro.jpg',  // #08 Messi · Prime · Especial
  'ujog-zidane-retro': 'assets/cartas/ucl-jogadores/ujog-zidane-retro.jpg',  // #09 Zidane · Prime · Especial
  'ujog-aguero-retro': 'assets/cartas/ucl-jogadores/ujog-aguero-retro.jpg',  // #10 Agüero · Lenda · Muito rara
  'ujog-alex-retro': 'assets/cartas/ucl-jogadores/ujog-alex-retro.jpg',  // #11 Alex · Lenda · Muito rara
  'ujog-bican-retro': 'assets/cartas/ucl-jogadores/ujog-bican-retro.jpg',  // #12 Bican · Lenda · Muito rara
  'ujog-dalglish-retro': 'assets/cartas/ucl-jogadores/ujog-dalglish-retro.jpg',  // #13 Dalglish · Lenda · Muito rara
  'ujog-david-silva-retro': 'assets/cartas/ucl-jogadores/ujog-david-silva-retro.jpg',  // #14 David Silva · Lenda · Muito rara
  'ujog-de-rossi-retro': 'assets/cartas/ucl-jogadores/ujog-de-rossi-retro.jpg',  // #15 De Rossi · Lenda · Muito rara
  'ujog-fernando-torres-retro': 'assets/cartas/ucl-jogadores/ujog-fernando-torres-retro.jpg',  // #16 Fernando Torres · Lenda · Muito rara
  'ujog-gerd-muller-retro': '',  // #17 Gerd Müller · Lenda · Muito rara
  'ujog-henry-retro': '',  // #18 Henry · Lenda · Muito rara
  'ujog-ibrahimovic-retro': 'assets/cartas/ucl-jogadores/ujog-ibrahimovic-retro.jpg',  // #19 Ibrahimović · Lenda · Muito rara
  'ujog-joaquin-retro': 'assets/cartas/ucl-jogadores/ujog-joaquin-retro.jpg',  // #20 Joaquín · Lenda · Muito rara
  'ujog-moulijn-retro': 'assets/cartas/ucl-jogadores/ujog-moulijn-retro.jpg',  // #21 Moulijn · Lenda · Muito rara
  'ujog-peyroteo-retro': 'assets/cartas/ucl-jogadores/ujog-peyroteo-retro.jpg',  // #22 Peyroteo · Lenda · Muito rara
  'ujog-reus-retro': 'assets/cartas/ucl-jogadores/ujog-reus-retro.jpg',  // #23 Reus · Lenda · Muito rara
  'ujog-romario-retro': 'assets/cartas/ucl-jogadores/ujog-romario-retro.jpg',  // #24 Romário · Lenda · Muito rara
  'ujog-srna-retro': 'assets/cartas/ucl-jogadores/ujog-srna-retro.jpg',  // #25 Srna · Lenda · Muito rara
  'ujog-totti-retro': 'assets/cartas/ucl-jogadores/ujog-totti-retro.jpg',  // #26 Totti · Lenda · Muito rara
  'ujog-van-der-kuijlen-retro': 'assets/cartas/ucl-jogadores/ujog-van-der-kuijlen-retro.jpg',  // #27 Van der Kuijlen · Lenda · Muito rara
  'ujog-zanetti-retro': 'assets/cartas/ucl-jogadores/ujog-zanetti-retro.jpg',  // #28 Zanetti · Lenda · Muito rara
  'ujog-fernandinho-retro': 'assets/cartas/ucl-jogadores/ujog-fernandinho-retro.jpg',  // #29 Fernandinho · Ídolo · Rara
  'ujog-marcos-senna-retro': 'assets/cartas/ucl-jogadores/ujog-marcos-senna-retro.jpg',  // #30 Marcos Senna · Ídolo · Rara
  'ujog-milito-retro': 'assets/cartas/ucl-jogadores/ujog-milito-retro.jpg',  // #31 Milito · Ídolo · Rara
  'ujog-abde': 'assets/cartas/ucl-jogadores/ujog-abde.jpg',  // #32 Abde · Champions 2026/27 · Comum
  'ujog-adeniran': 'assets/cartas/ucl-jogadores/ujog-adeniran.jpg',  // #33 Adeniran · Champions 2026/27 · Comum
  'ujog-alan-varela': 'assets/cartas/ucl-jogadores/ujog-alan-varela.jpg',  // #34 Alan Varela · Champions 2026/27 · Comum
  'ujog-alisson': 'assets/cartas/ucl-jogadores/ujog-alisson.jpg',  // #35 Alisson · Champions 2026/27 · Comum
  'ujog-antony': 'assets/cartas/ucl-jogadores/ujog-antony.jpg',  // #36 Antony · Champions 2026/27 · Comum
  'ujog-asensio': 'assets/cartas/ucl-jogadores/ujog-asensio.jpg',  // #37 Asensio · Champions 2026/27 · Comum
  'ujog-barella': 'assets/cartas/ucl-jogadores/ujog-barella.jpg',  // #38 Barella · Champions 2026/27 · Comum
  'ujog-baris-alper-yilmaz': 'assets/cartas/ucl-jogadores/ujog-baris-alper-yilmaz.jpg',  // #39 Barış Alper Yılmaz · Champions 2026/27 · Comum
  'ujog-barseghyan': 'assets/cartas/ucl-jogadores/ujog-barseghyan.jpg',  // #40 Barseghyan · Champions 2026/27 · Comum
  'ujog-bastoni': 'assets/cartas/ucl-jogadores/ujog-bastoni.jpg',  // #41 Bastoni · Champions 2026/27 · Comum
  'ujog-baumgartner': 'assets/cartas/ucl-jogadores/ujog-baumgartner.jpg',  // #42 Baumgartner · Champions 2026/27 · Comum
  'ujog-bellingham': 'assets/cartas/ucl-jogadores/ujog-bellingham.jpg',  // #43 Bellingham · Champions 2026/27 · Comum
  'ujog-benjamin-andre': 'assets/cartas/ucl-jogadores/ujog-benjamin-andre.jpg',  // #44 Benjamin André · Champions 2026/27 · Comum
  'ujog-berke-ozer': 'assets/cartas/ucl-jogadores/ujog-berke-ozer.jpg',  // #45 Berke Özer · Champions 2026/27 · Comum
  'ujog-bjorkan': 'assets/cartas/ucl-jogadores/ujog-bjorkan.jpg',  // #46 Bjørkan · Champions 2026/27 · Comum
  'ujog-botheim': 'assets/cartas/ucl-jogadores/ujog-botheim.jpg',  // #47 Botheim · Champions 2026/27 · Comum
  'ujog-bruno-fernandes': 'assets/cartas/ucl-jogadores/ujog-bruno-fernandes.jpg',  // #48 Bruno Fernandes · Champions 2026/27 · Comum
  'ujog-buendia': 'assets/cartas/ucl-jogadores/ujog-buendia.jpg',  // #49 Buendía · Champions 2026/27 · Comum
  'ujog-camavinga': 'assets/cartas/ucl-jogadores/ujog-camavinga.jpg',  // #50 Camavinga · Champions 2026/27 · Comum
  'ujog-forbs': '',  // #51 Carlos Forbs · Champions 2026/27 · Comum
  'ujog-cherki': 'assets/cartas/ucl-jogadores/ujog-cherki.jpg',  // #52 Cherki · Champions 2026/27 · Comum
  'ujog-chytil': 'assets/cartas/ucl-jogadores/ujog-chytil.jpg',  // #53 Chytil · Champions 2026/27 · Comum
  'ujog-cucho-hernandez': 'assets/cartas/ucl-jogadores/ujog-cucho-hernandez.jpg',  // #54 Cucho Hernández · Champions 2026/27 · Comum
  'ujog-de-bruyne': 'assets/cartas/ucl-jogadores/ujog-de-bruyne.jpg',  // #55 De Bruyne · Champions 2026/27 · Comum
  'ujog-rice': 'assets/cartas/ucl-jogadores/ujog-rice.jpg',  // #56 Declan Rice · Champions 2026/27 · Comum
  'ujog-dembele': 'assets/cartas/ucl-jogadores/ujog-dembele.jpg',  // #57 Dembélé · Champions 2026/27 · Comum
  'ujog-demirovic': 'assets/cartas/ucl-jogadores/ujog-demirovic.jpg',  // #58 Demirović · Champions 2026/27 · Comum
  'ujog-dimarco': 'assets/cartas/ucl-jogadores/ujog-dimarco.jpg',  // #59 Dimarco · Champions 2026/27 · Comum
  'ujog-diogo-costa': 'assets/cartas/ucl-jogadores/ujog-diogo-costa.jpg',  // #60 Diogo Costa · Champions 2026/27 · Comum
  'ujog-doku': 'assets/cartas/ucl-jogadores/ujog-doku.jpg',  // #61 Doku · Champions 2026/27 · Comum
  'ujog-dybala': 'assets/cartas/ucl-jogadores/ujog-dybala.jpg',  // #62 Dybala · Champions 2026/27 · Comum
  'ujog-ederson': 'assets/cartas/ucl-jogadores/ujog-ederson.jpg',  // #63 Ederson · Champions 2026/27 · Comum
  'ujog-eguinaldo': '',  // #64 Eguinaldo · Champions 2026/27 · Comum
  'ujog-el-khannouss': 'assets/cartas/ucl-jogadores/ujog-el-khannouss.jpg',  // #65 El Khannouss · Champions 2026/27 · Comum
  'ujog-enzo-fernandez': 'assets/cartas/ucl-jogadores/ujog-enzo-fernandez.jpg',  // #66 Enzo Fernández · Champions 2026/27 · Comum
  'ujog-falchener': 'assets/cartas/ucl-jogadores/ujog-falchener.jpg',  // #67 Falchener · Champions 2026/27 · Comum
  'ujog-frenkie-de-jong': 'assets/cartas/ucl-jogadores/ujog-frenkie-de-jong.jpg',  // #68 Frenkie de Jong · Champions 2026/27 · Comum
  'ujog-froholdt': 'assets/cartas/ucl-jogadores/ujog-froholdt.jpg',  // #69 Froholdt · Champions 2026/27 · Comum
  'ujog-geny-catamo': '',  // #70 Geny Catamo · Champions 2026/27 · Comum
  'ujog-gerard-moreno': 'assets/cartas/ucl-jogadores/ujog-gerard-moreno.jpg',  // #71 Gerard Moreno · Champions 2026/27 · Comum
  'ujog-giuliano-simeone': '',  // #72 Giuliano Simeone · Champions 2026/27 · Comum
  'ujog-goncalo-inacio': 'assets/cartas/ucl-jogadores/ujog-goncalo-inacio.jpg',  // #73 Gonçalo Inácio · Champions 2026/27 · Comum
  'ujog-guirassy': 'assets/cartas/ucl-jogadores/ujog-guirassy.jpg',  // #74 Guirassy · Champions 2026/27 · Comum
  'ujog-gyokeres': 'assets/cartas/ucl-jogadores/ujog-gyokeres.jpg',  // #75 Gyökeres · Champions 2026/27 · Comum
  'ujog-haaland': 'assets/cartas/ucl-jogadores/ujog-haaland.jpg',  // #76 Haaland · Champions 2026/27 · Comum
  'ujog-hadj-moussa': '',  // #77 Hadj Moussa · Champions 2026/27 · Comum
  'ujog-haikin': 'assets/cartas/ucl-jogadores/ujog-haikin.jpg',  // #78 Haikin · Champions 2026/27 · Comum
  'ujog-hakimi': 'assets/cartas/ucl-jogadores/ujog-hakimi.jpg',  // #79 Hakimi · Champions 2026/27 · Comum
  'ujog-haraldsson': 'assets/cartas/ucl-jogadores/ujog-haraldsson.jpg',  // #80 Haraldsson · Champions 2026/27 · Comum
  'ujog-hauge': 'assets/cartas/ucl-jogadores/ujog-hauge.jpg',  // #81 Hauge · Champions 2026/27 · Comum
  'ujog-holes': 'assets/cartas/ucl-jogadores/ujog-holes.jpg',  // #82 Holeš · Champions 2026/27 · Comum
  'ujog-horvath': 'assets/cartas/ucl-jogadores/ujog-horvath.jpg',  // #83 Horvath · Champions 2026/27 · Comum
  'ujog-isak': 'assets/cartas/ucl-jogadores/ujog-isak.jpg',  // #84 Isak · Champions 2026/27 · Comum
  'ujog-isco': 'assets/cartas/ucl-jogadores/ujog-isco.jpg',  // #85 Isco · Champions 2026/27 · Comum
  'ujog-jesus-rodriguez': '',  // #86 Jesús Rodríguez · Champions 2026/27 · Comum
  'ujog-joao-neves': 'assets/cartas/ucl-jogadores/ujog-joao-neves.jpg',  // #87 João Neves · Champions 2026/27 · Comum
  'ujog-jobe-bellingham': 'assets/cartas/ucl-jogadores/ujog-jobe-bellingham.jpg',  // #88 Jobe Bellingham · Champions 2026/27 · Comum
  'ujog-joe-bell': 'assets/cartas/ucl-jogadores/ujog-joe-bell.jpg',  // #89 Joe Bell · Champions 2026/27 · Comum
  'ujog-jovic': '',  // #90 Jović · Champions 2026/27 · Comum
  'ujog-julian-alvarez': 'assets/cartas/ucl-jogadores/ujog-julian-alvarez.jpg',  // #91 Julián Álvarez · Champions 2026/27 · Comum
  'ujog-jurasek': 'assets/cartas/ucl-jogadores/ujog-jurasek.jpg',  // #92 Jurásek · Champions 2026/27 · Comum
  'ujog-kalajdzic': 'assets/cartas/ucl-jogadores/ujog-kalajdzic.jpg',  // #93 Kalajdžić · Champions 2026/27 · Comum
  'ujog-kane': 'assets/cartas/ucl-jogadores/ujog-kane.jpg',  // #94 Kane · Champions 2026/27 · Comum
  'ujog-kante': 'assets/cartas/ucl-jogadores/ujog-kante.jpg',  // #95 Kanté · Champions 2026/27 · Comum
  'ujog-kean': '',  // #96 Kean · Champions 2026/27 · Comum
  'ujog-kerem': 'assets/cartas/ucl-jogadores/ujog-kerem.jpg',  // #97 Kerem Aktürkoğlu · Champions 2026/27 · Comum
  'ujog-kimmich': 'assets/cartas/ucl-jogadores/ujog-kimmich.jpg',  // #98 Kimmich · Champions 2026/27 · Comum
  'ujog-kjaergaard': 'assets/cartas/ucl-jogadores/ujog-kjaergaard.jpg',  // #99 Kjærgaard · Champions 2026/27 · Comum
  'ujog-kobel': 'assets/cartas/ucl-jogadores/ujog-kobel.jpg',  // #100 Kobel · Champions 2026/27 · Comum
  'ujog-koita': '',  // #101 Koïta · Champions 2026/27 · Comum
  'ujog-koke': '',  // #102 Koke · Champions 2026/27 · Comum
  'ujog-kone': 'assets/cartas/ucl-jogadores/ujog-kone.jpg',  // #103 Koné · Champions 2026/27 · Comum
  'ujog-kukharevych': 'assets/cartas/ucl-jogadores/ujog-kukharevych.jpg',  // #104 Kukharevych · Champions 2026/27 · Comum
  'ujog-kvaratskhelia': 'assets/cartas/ucl-jogadores/ujog-kvaratskhelia.jpg',  // #105 Kvaratskhelia · Champions 2026/27 · Comum
  'ujog-lamine-yamal': 'assets/cartas/ucl-jogadores/ujog-lamine-yamal.jpg',  // #106 Lamine Yamal · Champions 2026/27 · Comum
  'ujog-lautaro': 'assets/cartas/ucl-jogadores/ujog-lautaro.jpg',  // #107 Lautaro Martínez · Champions 2026/27 · Comum
  'ujog-ljubicic': 'assets/cartas/ucl-jogadores/ujog-ljubicic.jpg',  // #108 Ljubičić · Champions 2026/27 · Comum
  'ujog-lookman': '',  // #109 Lookman · Champions 2026/27 · Comum
  'ujog-luis-diaz': 'assets/cartas/ucl-jogadores/ujog-luis-diaz.jpg',  // #110 Luis Díaz · Champions 2026/27 · Comum
  'ujog-luis-suarez': 'assets/cartas/ucl-jogadores/ujog-luis-suarez.jpg',  // #111 Luis Suárez · Champions 2026/27 · Comum
  'ujog-lukeba': '',  // #112 Lukeba · Champions 2026/27 · Comum
  'ujog-mac-allister': 'assets/cartas/ucl-jogadores/ujog-mac-allister.jpg',  // #113 Mac Allister · Champions 2026/27 · Comum
  'ujog-mainoo': 'assets/cartas/ucl-jogadores/ujog-mainoo.jpg',  // #114 Mainoo · Champions 2026/27 · Comum
  'ujog-majer': '',  // #115 Majer · Champions 2026/27 · Comum
  'ujog-malen': 'assets/cartas/ucl-jogadores/ujog-malen.jpg',  // #116 Malen · Champions 2026/27 · Comum
  'ujog-marcelli': 'assets/cartas/ucl-jogadores/ujog-marcelli.jpg',  // #117 Marcelli · Champions 2026/27 · Comum
  'ujog-cunha': 'assets/cartas/ucl-jogadores/ujog-cunha.jpg',  // #118 Matheus Cunha · Champions 2026/27 · Comum
  'ujog-matviyenko': 'assets/cartas/ucl-jogadores/ujog-matviyenko.jpg',  // #119 Matviyenko · Champions 2026/27 · Comum
  'ujog-mauro-junior': 'assets/cartas/ucl-jogadores/ujog-mauro-junior.jpg',  // #120 Mauro Júnior · Champions 2026/27 · Comum
  'ujog-maxi-araujo': '',  // #121 Maxi Araújo · Champions 2026/27 · Comum
  'ujog-mbappe': 'assets/cartas/ucl-jogadores/ujog-mbappe.jpg',  // #122 Mbappé · Champions 2026/27 · Comum
  'ujog-mbeumo': 'assets/cartas/ucl-jogadores/ujog-mbeumo.jpg',  // #123 Mbeumo · Champions 2026/27 · Comum
  'ujog-mcginn': 'assets/cartas/ucl-jogadores/ujog-mcginn.jpg',  // #124 McGinn · Champions 2026/27 · Comum
  'ujog-mctominay': 'assets/cartas/ucl-jogadores/ujog-mctominay.jpg',  // #125 McTominay · Champions 2026/27 · Comum
  'ujog-mickels': 'assets/cartas/ucl-jogadores/ujog-mickels.jpg',  // #126 Mickels · Champions 2026/27 · Comum
  'ujog-godts': 'assets/cartas/ucl-jogadores/ujog-godts.jpg',  // #127 Mika Godts · Champions 2026/27 · Comum
  'ujog-mikautadze': '',  // #128 Mikautadze · Champions 2026/27 · Comum
  'ujog-milinkovic-savic': 'assets/cartas/ucl-jogadores/ujog-milinkovic-savic.jpg',  // #129 Milinković-Savić · Champions 2026/27 · Comum
  'ujog-moleiro': '',  // #130 Moleiro · Champions 2026/27 · Comum
  'ujog-musiala': 'assets/cartas/ucl-jogadores/ujog-musiala.jpg',  // #131 Musiala · Champions 2026/27 · Comum
  'ujog-nico-paz': '',  // #132 Nico Paz · Champions 2026/27 · Comum
  'ujog-nicolas-jackson': 'assets/cartas/ucl-jogadores/ujog-nicolas-jackson.jpg',  // #133 Nicolas Jackson · Champions 2026/27 · Comum
  'ujog-nmecha': 'assets/cartas/ucl-jogadores/ujog-nmecha.jpg',  // #134 Nmecha · Champions 2026/27 · Comum
  'ujog-noa-lang': 'assets/cartas/ucl-jogadores/ujog-noa-lang.jpg',  // #135 Noa Lang · Champions 2026/27 · Comum
  'ujog-nusa': '',  // #136 Nusa · Champions 2026/27 · Comum
  'ujog-oblak': 'assets/cartas/ucl-jogadores/ujog-oblak.jpg',  // #137 Oblak · Champions 2026/27 · Comum
  'ujog-odegaard': 'assets/cartas/ucl-jogadores/ujog-odegaard.jpg',  // #138 Ødegaard · Champions 2026/27 · Comum
  'ujog-edouard': 'assets/cartas/ucl-jogadores/ujog-edouard.jpg',  // #139 Odsonne Édouard · Champions 2026/27 · Comum
  'ujog-olise': 'assets/cartas/ucl-jogadores/ujog-olise.jpg',  // #140 Olise · Champions 2026/27 · Comum
  'ujog-osimhen': 'assets/cartas/ucl-jogadores/ujog-osimhen.jpg',  // #141 Osimhen · Champions 2026/27 · Comum
  'ujog-berg': 'assets/cartas/ucl-jogadores/ujog-berg.jpg',  // #142 Patrick Berg · Champions 2026/27 · Comum
  'ujog-pau-torres': 'assets/cartas/ucl-jogadores/ujog-pau-torres.jpg',  // #143 Pau Torres · Champions 2026/27 · Comum
  'ujog-paul-wanner': 'assets/cartas/ucl-jogadores/ujog-paul-wanner.jpg',  // #144 Paul Wanner · Champions 2026/27 · Comum
  'ujog-pedri': 'assets/cartas/ucl-jogadores/ujog-pedri.jpg',  // #145 Pedri · Champions 2026/27 · Comum
  'ujog-pedrinho': 'assets/cartas/ucl-jogadores/ujog-pedrinho.jpg',  // #146 Pedrinho · Champions 2026/27 · Comum
  'ujog-pepe': 'assets/cartas/ucl-jogadores/ujog-pepe.jpg',  // #147 Pépé · Champions 2026/27 · Comum
  'ujog-perisic': 'assets/cartas/ucl-jogadores/ujog-perisic.jpg',  // #148 Perišić · Champions 2026/27 · Comum
  'ujog-perrone': '',  // #149 Perrone · Champions 2026/27 · Comum
  'ujog-pokatilov': 'assets/cartas/ucl-jogadores/ujog-pokatilov.jpg',  // #150 Pokatilov · Champions 2026/27 · Comum
  'ujog-provod': 'assets/cartas/ucl-jogadores/ujog-provod.jpg',  // #151 Provod · Champions 2026/27 · Comum
  'ujog-puchacz': 'assets/cartas/ucl-jogadores/ujog-puchacz.jpg',  // #152 Puchacz · Champions 2026/27 · Comum
  'ujog-rafael-leao': 'assets/cartas/ucl-jogadores/ujog-rafael-leao.jpg',  // #153 Rafael Leão · Champions 2026/27 · Comum
  'ujog-raphinha': 'assets/cartas/ucl-jogadores/ujog-raphinha.jpg',  // #154 Raphinha · Champions 2026/27 · Comum
  'ujog-raum': '',  // #155 Raum · Champions 2026/27 · Comum
  'ujog-risser': 'assets/cartas/ucl-jogadores/ujog-risser.jpg',  // #156 Risser · Champions 2026/27 · Comum
  'ujog-riznyk': 'assets/cartas/ucl-jogadores/ujog-riznyk.jpg',  // #157 Riznyk · Champions 2026/27 · Comum
  'ujog-rodri': 'assets/cartas/ucl-jogadores/ujog-rodri.jpg',  // #158 Rodri · Champions 2026/27 · Comum
  'ujog-ruben-dias': 'assets/cartas/ucl-jogadores/ujog-ruben-dias.jpg',  // #159 Rúben Dias · Champions 2026/27 · Comum
  'ujog-saka': 'assets/cartas/ucl-jogadores/ujog-saka.jpg',  // #160 Saka · Champions 2026/27 · Comum
  'ujog-saliba': 'assets/cartas/ucl-jogadores/ujog-saliba.jpg',  // #161 Saliba · Champions 2026/27 · Comum
  'ujog-samu': 'assets/cartas/ucl-jogadores/ujog-samu.jpg',  // #162 Samu · Champions 2026/27 · Comum
  'ujog-leroy-sane': '',  // #163 Sané · Champions 2026/27 · Comum
  'ujog-abdulhamid': 'assets/cartas/ucl-jogadores/ujog-abdulhamid.jpg',  // #164 Saud Abdulhamid · Champions 2026/27 · Comum
  'ujog-schlotterbeck': 'assets/cartas/ucl-jogadores/ujog-schlotterbeck.jpg',  // #165 Schlotterbeck · Champions 2026/27 · Comum
  'ujog-schouten': 'assets/cartas/ucl-jogadores/ujog-schouten.jpg',  // #166 Schouten · Champions 2026/27 · Comum
  'ujog-sesko': 'assets/cartas/ucl-jogadores/ujog-sesko.jpg',  // #167 Šeško · Champions 2026/27 · Comum
  'ujog-simic': 'assets/cartas/ucl-jogadores/ujog-simic.jpg',  // #168 Simić · Champions 2026/27 · Comum
  'ujog-sommer': '',  // #169 Sommer · Champions 2026/27 · Comum
  'ujog-sporar': 'assets/cartas/ucl-jogadores/ujog-sporar.jpg',  // #170 Šporar · Champions 2026/27 · Comum
  'ujog-steijn': '',  // #171 Steijn · Champions 2026/27 · Comum
  'ujog-stiller': 'assets/cartas/ucl-jogadores/ujog-stiller.jpg',  // #172 Stiller · Champions 2026/27 · Comum
  'ujog-strakosha': '',  // #173 Strakosha · Champions 2026/27 · Comum
  'ujog-svilar': 'assets/cartas/ucl-jogadores/ujog-svilar.jpg',  // #174 Svilar · Champions 2026/27 · Comum
  'ujog-thauvin': 'assets/cartas/ucl-jogadores/ujog-thauvin.jpg',  // #175 Thauvin · Champions 2026/27 · Comum
  'ujog-thuram': 'assets/cartas/ucl-jogadores/ujog-thuram.jpg',  // #176 Thuram · Champions 2026/27 · Comum
  'ujog-tresoldi': '',  // #177 Tresoldi · Champions 2026/27 · Comum
  'ujog-tripic': 'assets/cartas/ucl-jogadores/ujog-tripic.jpg',  // #178 Tripić · Champions 2026/27 · Comum
  'ujog-undav': 'assets/cartas/ucl-jogadores/ujog-undav.jpg',  // #179 Undav · Champions 2026/27 · Comum
  'ujog-valente': 'assets/cartas/ucl-jogadores/ujog-valente.jpg',  // #180 Valente · Champions 2026/27 · Comum
  'ujog-valverde': 'assets/cartas/ucl-jogadores/ujog-valverde.jpg',  // #181 Valverde · Champions 2026/27 · Comum
  'ujog-van-dijk': 'assets/cartas/ucl-jogadores/ujog-van-dijk.jpg',  // #182 Van Dijk · Champions 2026/27 · Comum
  'ujog-vanaken': 'assets/cartas/ucl-jogadores/ujog-vanaken.jpg',  // #183 Vanaken · Champions 2026/27 · Comum
  'ujog-vinicius-junior': 'assets/cartas/ucl-jogadores/ujog-vinicius-junior.jpg',  // #184 Vinícius Júnior · Champions 2026/27 · Comum
  'ujog-watanabe': '',  // #185 Watanabe · Champions 2026/27 · Comum
  'ujog-wirtz': 'assets/cartas/ucl-jogadores/ujog-wirtz.jpg',  // #186 Wirtz · Champions 2026/27 · Comum
  'ujog-rodrigo-zalazar': '',  // #187 Zalazar · Champions 2026/27 · Comum

  // ---------- Champions · Estádios (72 cartas)
  'uest-liv-kop-1983': 'assets/cartas/ucl-estadios/uest-liv-kop-1983.jpg',  // #01 Anfield (Kop, 1983) · Histórico · Especial
  'uest-bar-camp-nou-antigo': 'assets/cartas/ucl-estadios/uest-bar-camp-nou-antigo.jpg',  // #02 Camp Nou (antes da reforma) · Histórico · Especial
  'uest-rom-testaccio': 'assets/cartas/ucl-estadios/uest-rom-testaccio.jpg',  // #03 Campo Testaccio · Histórico · Especial
  'uest-por-antas-1952': 'assets/cartas/ucl-estadios/uest-por-antas-1952.jpg',  // #04 Estádio das Antas (1952) · Histórico · Especial
  'uest-ars-highbury': 'assets/cartas/ucl-estadios/uest-ars-highbury.jpg',  // #05 Highbury · Histórico · Especial
  'uest-bay-olympiastadion': 'assets/cartas/ucl-estadios/uest-bay-olympiastadion.jpg',  // #06 Olympiastadion München · Histórico · Especial
  'uest-inm-san-siro-1960': 'assets/cartas/ucl-estadios/uest-inm-san-siro-1960.jpg',  // #07 San Siro (1960) · Histórico · Especial
  'uest-gal-ali-sami-yen': 'assets/cartas/ucl-estadios/uest-gal-ali-sami-yen.jpg',  // #08 Ali Sami Yen · Histórico · Muito rara
  'uest-bet-benito-villamarin': 'assets/cartas/ucl-estadios/uest-bet-benito-villamarin.jpg',  // #09 Benito Villamarín · Histórico · Muito rara
  'uest-rma-bernabeu-2007': 'assets/cartas/ucl-estadios/uest-rma-bernabeu-2007.jpg',  // #10 Bernabéu antes da reforma · Histórico · Muito rara
  'uest-fey-de-kuip-1982': 'assets/cartas/ucl-estadios/uest-fey-de-kuip-1982.jpg',  // #11 De Kuip (1982) · Histórico · Muito rara
  'uest-sha-donbas-arena': 'assets/cartas/ucl-estadios/uest-sha-donbas-arena.jpg',  // #12 Donbas Arena · Histórico · Muito rara
  'uest-scp-alvalade-1956': 'assets/cartas/ucl-estadios/uest-scp-alvalade-1956.jpg',  // #13 Estádio José Alvalade (1956) · Histórico · Muito rara
  'uest-mci-maine-road': 'assets/cartas/ucl-estadios/uest-mci-maine-road.jpg',  // #14 Maine Road · Histórico · Muito rara
  'uest-mun-old-trafford-1992': 'assets/cartas/ucl-estadios/uest-mun-old-trafford-1992.jpg',  // #15 Old Trafford (1992) · Histórico · Muito rara
  'uest-psg-parc-des-princes-1972': 'assets/cartas/ucl-estadios/uest-psg-parc-des-princes-1972.jpg',  // #16 Parc des Princes (1972) · Histórico · Muito rara
  'uest-nap-san-paolo-1963': 'assets/cartas/ucl-estadios/uest-nap-san-paolo-1963.jpg',  // #17 Stadio San Paolo (1963) · Histórico · Muito rara
  'uest-bvb-rote-erde': 'assets/cartas/ucl-estadios/uest-bvb-rote-erde.jpg',  // #18 Stadion Rote Erde · Histórico · Muito rara
  'uest-vik-stavanger-stadion': 'assets/cartas/ucl-estadios/uest-vik-stavanger-stadion.jpg',  // #19 Stavanger Stadion · Histórico · Muito rara
  'uest-atm-vicente-calderon': 'assets/cartas/ucl-estadios/uest-atm-vicente-calderon.jpg',  // #20 Vicente Calderón · Histórico · Muito rara
  'uest-avl-villa-park-1907': 'assets/cartas/ucl-estadios/uest-avl-villa-park-1907.jpg',  // #21 Villa Park (1907) · Histórico · Muito rara
  'uest-bod-aspmyra-1966': 'assets/cartas/ucl-estadios/uest-bod-aspmyra-1966.jpg',  // #22 Aspmyra (1966) · Histórico · Rara
  'uest-sab-bank-respublika-arena': 'assets/cartas/ucl-estadios/uest-sab-bank-respublika-arena.jpg',  // #23 Bank Respublika Arena · Histórico · Rara
  'uest-bru-de-klokke': 'assets/cartas/ucl-estadios/uest-bru-de-klokke.jpg',  // #24 De Klokke · Histórico · Rara
  'uest-vil-el-madrigal': 'assets/cartas/ucl-estadios/uest-vil-el-madrigal.jpg',  // #25 El Madrigal · Histórico · Rara
  'uest-aek-nikos-goumas': '',  // #26 Estádio Nikos Goumas · Histórico · Rara
  'uest-vfb-gottlieb-daimler-stadion': 'assets/cartas/ucl-estadios/uest-vfb-gottlieb-daimler-stadion.jpg',  // #27 Gottlieb-Daimler-Stadion · Histórico · Rara
  'uest-lsk-linzer-stadion': 'assets/cartas/ucl-estadios/uest-lsk-linzer-stadion.jpg',  // #28 Linzer Stadion (Gugl) · Histórico · Rara
  'uest-psv-philips-stadion-1982': 'assets/cartas/ucl-estadios/uest-psv-philips-stadion-1982.jpg',  // #29 Philips Stadion (1982) · Histórico · Rara
  'uest-com-sinigaglia-lago': 'assets/cartas/ucl-estadios/uest-com-sinigaglia-lago.jpg',  // #30 Sinigaglia (antes da reforma) · Histórico · Rara
  'uest-sla-letna-1933': 'assets/cartas/ucl-estadios/uest-sla-letna-1933.jpg',  // #31 Slavia em Letná (1933) · Histórico · Rara
  'uest-len-felix-bollaert': 'assets/cartas/ucl-estadios/uest-len-felix-bollaert.jpg',  // #32 Stade Félix-Bollaert · Histórico · Rara
  'uest-lil-grimonprez-jooris': 'assets/cartas/ucl-estadios/uest-lil-grimonprez-jooris.jpg',  // #33 Stade Grimonprez-Jooris · Histórico · Rara
  'uest-fen-sukru-saracoglu-antigo': 'assets/cartas/ucl-estadios/uest-fen-sukru-saracoglu-antigo.jpg',  // #34 Şükrü Saracoğlu (anos 2010) · Histórico · Rara
  'uest-slo-tehelne-pole-2009': 'assets/cartas/ucl-estadios/uest-slo-tehelne-pole-2009.jpg',  // #35 Tehelné pole antigo · Histórico · Rara
  'uest-rbl-zentralstadion': 'assets/cartas/ucl-estadios/uest-rbl-zentralstadion.jpg',  // #36 Zentralstadion · Histórico · Rara
  'uest-bay-allianz-arena': 'assets/cartas/ucl-estadios/uest-bay-allianz-arena.jpg',  // #37 Allianz Arena · Estádio · Comum
  'uest-aek-allwyn-arena': 'assets/cartas/ucl-estadios/uest-aek-allwyn-arena.jpg',  // #38 Allwyn Arena · Estádio · Comum
  'uest-liv-anfield': 'assets/cartas/ucl-estadios/uest-liv-anfield.jpg',  // #39 Anfield · Estádio · Comum
  'uest-bod-aspmyra': 'assets/cartas/ucl-estadios/uest-bod-aspmyra.jpg',  // #40 Aspmyra Stadion · Estádio · Comum
  'uest-fen-sukru-saracoglu': 'assets/cartas/ucl-estadios/uest-fen-sukru-saracoglu.jpg',  // #41 Chobani Stadyumu Fenerbahçe Şükrü Saracoğlu · Estádio · Comum
  'uest-fey-de-kuip': 'assets/cartas/ucl-estadios/uest-fey-de-kuip.jpg',  // #42 De Kuip · Estádio · Comum
  'uest-lil-pierre-mauroy': 'assets/cartas/ucl-estadios/uest-lil-pierre-mauroy.jpg',  // #43 Decathlon Arena – Stade Pierre-Mauroy · Estádio · Comum
  'uest-ars-emirates': 'assets/cartas/ucl-estadios/uest-ars-emirates.jpg',  // #44 Emirates Stadium · Estádio · Comum
  'uest-bet-la-cartuja': 'assets/cartas/ucl-estadios/uest-bet-la-cartuja.jpg',  // #45 Estadio de La Cartuja · Estádio · Comum
  'uest-vil-ceramica': 'assets/cartas/ucl-estadios/uest-vil-ceramica.jpg',  // #46 Estadio de la Cerámica · Estádio · Comum
  'uest-por-dragao': 'assets/cartas/ucl-estadios/uest-por-dragao.jpg',  // #47 Estádio do Dragão · Estádio · Comum
  'uest-scp-alvalade': 'assets/cartas/ucl-estadios/uest-scp-alvalade.jpg',  // #48 Estádio José Alvalade · Estádio · Comum
  'uest-sab-olimpico-baku': 'assets/cartas/ucl-estadios/uest-sab-olimpico-baku.jpg',  // #49 Estádio Olímpico de Baku · Estádio · Comum
  'uest-mci-etihad': 'assets/cartas/ucl-estadios/uest-mci-etihad.jpg',  // #50 Etihad Stadium · Estádio · Comum
  'uest-sla-fortuna-arena': 'assets/cartas/ucl-estadios/uest-sla-fortuna-arena.jpg',  // #51 Fortuna Arena · Estádio · Comum
  'uest-bru-jan-breydel': 'assets/cartas/ucl-estadios/uest-bru-jan-breydel.jpg',  // #52 Jan Breydel Stadium · Estádio · Comum
  'uest-vfb-mhparena': 'assets/cartas/ucl-estadios/uest-vfb-mhparena.jpg',  // #53 MHPArena · Estádio · Comum
  'uest-mun-old-trafford': 'assets/cartas/ucl-estadios/uest-mun-old-trafford.jpg',  // #54 Old Trafford · Estádio · Comum
  'uest-psg-parc-des-princes': 'assets/cartas/ucl-estadios/uest-psg-parc-des-princes.jpg',  // #55 Parc des Princes · Estádio · Comum
  'uest-psv-philips-stadion': 'assets/cartas/ucl-estadios/uest-psv-philips-stadion.jpg',  // #56 Philips Stadion · Estádio · Comum
  'uest-lsk-raiffeisen-arena': 'assets/cartas/ucl-estadios/uest-lsk-raiffeisen-arena.jpg',  // #57 Raiffeisen Arena · Estádio · Comum
  'uest-gal-rams-park': 'assets/cartas/ucl-estadios/uest-gal-rams-park.jpg',  // #58 RAMS Park · Estádio · Comum
  'uest-rbl-red-bull-arena': 'assets/cartas/ucl-estadios/uest-rbl-red-bull-arena.jpg',  // #59 Red Bull Arena · Estádio · Comum
  'uest-atm-metropolitano': 'assets/cartas/ucl-estadios/uest-atm-metropolitano.jpg',  // #60 Riyadh Air Metropolitano · Estádio · Comum
  'uest-inm-san-siro': 'assets/cartas/ucl-estadios/uest-inm-san-siro.jpg',  // #61 San Siro · Estádio · Comum
  'uest-rma-bernabeu': 'assets/cartas/ucl-estadios/uest-rma-bernabeu.jpg',  // #62 Santiago Bernabéu · Estádio · Comum
  'uest-bvb-signal-iduna-park': 'assets/cartas/ucl-estadios/uest-bvb-signal-iduna-park.jpg',  // #63 Signal Iduna Park · Estádio · Comum
  'uest-bar-spotify-camp-nou': 'assets/cartas/ucl-estadios/uest-bar-spotify-camp-nou.jpg',  // #64 Spotify Camp Nou · Estádio · Comum
  'uest-len-bollaert-delelis': 'assets/cartas/ucl-estadios/uest-len-bollaert-delelis.jpg',  // #65 Stade Bollaert-Delelis · Estádio · Comum
  'uest-nap-maradona': 'assets/cartas/ucl-estadios/uest-nap-maradona.jpg',  // #66 Stadio Diego Armando Maradona · Estádio · Comum
  'uest-com-sinigaglia': 'assets/cartas/ucl-estadios/uest-com-sinigaglia.jpg',  // #67 Stadio Giuseppe Sinigaglia · Estádio · Comum
  'uest-rom-olimpico': 'assets/cartas/ucl-estadios/uest-rom-olimpico.jpg',  // #68 Stadio Olimpico · Estádio · Comum
  'uest-sha-stamford-bridge': 'assets/cartas/ucl-estadios/uest-sha-stamford-bridge.jpg',  // #69 Stamford Bridge · Estádio · Comum
  'uest-slo-tehelne-pole': 'assets/cartas/ucl-estadios/uest-slo-tehelne-pole.jpg',  // #70 Tehelné pole · Estádio · Comum
  'uest-vik-viking-stadion': 'assets/cartas/ucl-estadios/uest-vik-viking-stadion.jpg',  // #71 Viking Stadion · Estádio · Comum
  'uest-avl-villa-park': 'assets/cartas/ucl-estadios/uest-avl-villa-park.jpg',  // #72 Villa Park · Estádio · Comum

  // ---------- Juízo Final (12 cartas)
  'jf-doutor-rebaixamento': '',  // #01 Doutor Rebaixamento · Vilão · Especial
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
