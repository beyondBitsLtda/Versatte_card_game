// ============================================================
//  VERSATTE CARDS — dados da demonstração
//  Tudo que é "regra de negócio" (coleções, raridades, odds,
//  prêmios e atributos de jogo) fica aqui para ser ajustado
//  com a Versatte sem mexer no motor.
// ============================================================

export const RARITIES = {
  comum:    { id: 'comum',    label: 'Comum',      order: 0, color: '#C7D2E0', points: 5   },
  rara:     { id: 'rara',     label: 'Rara',       order: 1, color: '#33B5FF', points: 15  },
  muito:    { id: 'muito',    label: 'Muito rara', order: 2, color: '#B866FF', points: 40  },
  especial: { id: 'especial', label: 'Especial',   order: 3, color: '#FFC940', points: 100 },
};
export const RARITY_ORDER = ['comum', 'rara', 'muito', 'especial'];

// ------------------------------------------------------------
//  Pacotes e probabilidades (por carta)
// ------------------------------------------------------------
export const PACKS = {
  free: {
    id: 'free',
    label: 'Pacote diário',
    cards: 3,
    slots: [
      { comum: 0.70, rara: 0.24, muito: 0.05, especial: 0.01 },
      { comum: 0.70, rara: 0.24, muito: 0.05, especial: 0.01 },
      { comum: 0.70, rara: 0.24, muito: 0.05, especial: 0.01 },
    ],
    // chance de, sorteada a raridade, a carta vir entre as que o jogador JÁ TEM
    dupBias: 0.55,
    newBoost: 0,
    pity: null,
  },
  premium: {
    id: 'premium',
    label: 'Pacote premium',
    cards: 4,
    slots: [
      { comum: 0.60, rara: 0.28, muito: 0.10, especial: 0.02 },
      { comum: 0.60, rara: 0.28, muito: 0.10, especial: 0.02 },
      { comum: 0.60, rara: 0.28, muito: 0.10, especial: 0.02 },
      // 4ª carta garantida Rara ou melhor
      { comum: 0,    rara: 0.75, muito: 0.21, especial: 0.04 },
    ],
    dupBias: 0,
    // chance de, sorteada a raridade, a carta vir entre as que FALTAM
    newBoost: 0.15,
    // garantia: após N pacotes premium sem Especial, o próximo traz uma
    pity: { rarity: 'especial', after: 15 },
  },
};

export const SHOP = {
  offers: [
    { id: 'p1',  packs: 1,  price: 4.90,  label: '1 pacote',   tag: null },
    { id: 'p5',  packs: 5,  price: 19.90, label: '5 pacotes',  tag: 'Mais vendido', bonus: 1 },
    { id: 'p12', packs: 12, price: 39.90, label: '12 pacotes', tag: 'Melhor valor', bonus: 3 },
  ],
  pointsPerPack: 250,
};

// ============================================================
//  CLUBES (base de tudo: cores, estádio, mascote e força da IA)
//  pattern: solid | stripes | halves | sash | hoops | tri | band
//  power: força do time controlado pelo computador no Modo Clube
// ============================================================
export const TEAMS = [
  { id: 'fla', name: 'Flamengo', abbr: 'FLA', colors: ['#D3202A', '#121212'], pattern: 'hoops', power: 88,
    full: 'Clube de Regatas do Flamengo', city: 'Rio de Janeiro · RJ', founded: 1895, stadium: 'Maracanã', nickname: 'Mengão', mascot: 'Urubu',
    fact: 'Nasceu como clube de remo em 1895. O futebol só chegou em 1911, trazido por jogadores dissidentes do Fluminense.',
    highlight: 'Maior torcida do Brasil.' },
  { id: 'pal', name: 'Palmeiras', abbr: 'PAL', colors: ['#0B6B3A', '#FFFFFF'], pattern: 'solid', power: 87,
    full: 'Sociedade Esportiva Palmeiras', city: 'São Paulo · SP', founded: 1914, stadium: 'Allianz Parque', nickname: 'Verdão', mascot: 'Porco',
    fact: 'Fundado por imigrantes italianos como Palestra Itália, mudou de nome em 1942, durante a Segunda Guerra Mundial.',
    highlight: 'Maior campeão da história do Campeonato Brasileiro.' },
  { id: 'cor', name: 'Corinthians', abbr: 'COR', colors: ['#141414', '#FFFFFF'], pattern: 'band', power: 80,
    full: 'Sport Club Corinthians Paulista', city: 'São Paulo · SP', founded: 1910, stadium: 'Neo Química Arena', nickname: 'Timão', mascot: 'Mosqueteiro',
    fact: 'Fundado por operários no bairro do Bom Retiro, o nome homenageia o Corinthian FC, time inglês que excursionava pelo Brasil.',
    highlight: 'Bicampeão mundial de clubes (2000 e 2012).' },
  { id: 'sao', name: 'São Paulo', abbr: 'SAO', colors: ['#FFFFFF', '#E2231A', '#141414'], pattern: 'tri', power: 81,
    full: 'São Paulo Futebol Clube', city: 'São Paulo · SP', founded: 1930, stadium: 'MorumBIS', nickname: 'Tricolor Paulista', mascot: 'Santo Paulo',
    fact: 'O MorumBIS é um dos maiores estádios particulares do país e já recebeu jogos da Seleção e finais continentais.',
    highlight: 'Tricampeão mundial (1992, 1993 e 2005) e hexacampeão brasileiro.' },
  { id: 'san', name: 'Santos', abbr: 'SAN', colors: ['#FFFFFF', '#141414'], pattern: 'stripes', power: 75,
    full: 'Santos Futebol Clube', city: 'Santos · SP', founded: 1912, stadium: 'Vila Belmiro', nickname: 'Peixe', mascot: 'Baleia',
    fact: 'Na Vila Belmiro, Pelé construiu a lenda do "Santos de Pelé", bicampeão mundial em 1962 e 1963.',
    highlight: 'Clube que revelou Pelé, Robinho e Neymar.' },
  { id: 'bot', name: 'Botafogo', abbr: 'BOT', colors: ['#141414', '#FFFFFF'], pattern: 'stripes', power: 83,
    full: 'Botafogo de Futebol e Regatas', city: 'Rio de Janeiro · RJ', founded: 1904, stadium: 'Nilton Santos', nickname: 'Glorioso', mascot: 'Biriba',
    fact: 'A Estrela Solitária do escudo veio do clube de regatas, que tinha a Estrela d\'Alva como símbolo antes da fusão de 1942.',
    highlight: 'Conquistou Libertadores e Brasileirão no mesmo ano, em 2024.' },
  { id: 'cam', name: 'Atlético-MG', abbr: 'CAM', colors: ['#141414', '#FFFFFF'], pattern: 'stripes', power: 81,
    full: 'Clube Atlético Mineiro', city: 'Belo Horizonte · MG', founded: 1908, stadium: 'Arena MRV', nickname: 'Galo', mascot: 'Galo',
    fact: 'A Arena MRV, casa própria do Galo, foi inaugurada em 2023 e tem capacidade para mais de 40 mil torcedores.',
    highlight: 'Campeão da Libertadores em 2013 e brasileiro em 1971 e 2021.' },
  { id: 'cru', name: 'Cruzeiro', abbr: 'CRU', colors: ['#1A3F9C', '#FFFFFF'], pattern: 'solid', power: 82,
    full: 'Cruzeiro Esporte Clube', city: 'Belo Horizonte · MG', founded: 1921, stadium: 'Mineirão', nickname: 'Raposa', mascot: 'Raposa',
    fact: 'Também nasceu como Palestra Itália. As estrelas do escudo representam a constelação do Cruzeiro do Sul.',
    highlight: 'Conquistou a Tríplice Coroa em 2003: Mineiro, Copa do Brasil e Brasileiro.' },
  { id: 'gre', name: 'Grêmio', abbr: 'GRE', colors: ['#1D8FD6', '#141414', '#FFFFFF'], pattern: 'stripes', power: 78,
    full: 'Grêmio Foot-Ball Porto Alegrense', city: 'Porto Alegre · RS', founded: 1903, stadium: 'Arena do Grêmio', nickname: 'Imortal Tricolor', mascot: 'Mosqueteiro',
    fact: 'Foi campeão mundial em 1983 com dois gols de Renato Gaúcho na final contra o Hamburgo, em Tóquio.',
    highlight: 'Tricampeão da Libertadores (1983, 1995 e 2017).' },
  { id: 'int', name: 'Internacional', abbr: 'INT', colors: ['#D50E1C', '#FFFFFF'], pattern: 'solid', power: 79,
    full: 'Sport Club Internacional', city: 'Porto Alegre · RS', founded: 1909, stadium: 'Beira-Rio', nickname: 'Colorado', mascot: 'Saci',
    fact: 'É o único clube a conquistar o Campeonato Brasileiro de forma invicta, em 1979.',
    highlight: 'Campeão mundial em 2006, vencendo o Barcelona na final.' },
  { id: 'vas', name: 'Vasco', abbr: 'VAS', colors: ['#141414', '#FFFFFF', '#E2231A'], pattern: 'sash', power: 76,
    full: 'Club de Regatas Vasco da Gama', city: 'Rio de Janeiro · RJ', founded: 1898, stadium: 'São Januário', nickname: 'Gigante da Colina', mascot: 'Almirante',
    fact: 'Com a "Resposta Histórica" de 1924, recusou-se a excluir jogadores negros e operários do seu elenco.',
    highlight: 'São Januário foi erguido em 1927 com ajuda da própria torcida.' },
  { id: 'flu', name: 'Fluminense', abbr: 'FLU', colors: ['#8B1E3F', '#0E6B3B', '#FFFFFF'], pattern: 'tri', power: 79,
    full: 'Fluminense Football Club', city: 'Rio de Janeiro · RJ', founded: 1902, stadium: 'Maracanã', nickname: 'Tricolor', mascot: 'Cartola',
    fact: 'O apelido "Pó de Arroz" vem de 1914, quando um jogador teria entrado em campo com o rosto coberto de pó de arroz.',
    highlight: 'Campeão da Libertadores em 2023.' },
  { id: 'bah', name: 'Bahia', abbr: 'BAH', colors: ['#1C55B0', '#E3262E', '#FFFFFF'], pattern: 'tri', power: 78,
    full: 'Esporte Clube Bahia', city: 'Salvador · BA', founded: 1931, stadium: 'Arena Fonte Nova', nickname: 'Esquadrão de Aço', mascot: 'Herói Tricolor',
    fact: 'Foi o primeiro campeão brasileiro: venceu a Taça Brasil de 1959 derrotando o Santos de Pelé na final.',
    highlight: 'Bicampeão brasileiro (1959 e 1988).' },
  { id: 'rbb', name: 'Bragantino', abbr: 'RBB', colors: ['#FFFFFF', '#E4002B', '#0A1A3F'], pattern: 'band', power: 76,
    full: 'Red Bull Bragantino', city: 'Bragança Paulista · SP', founded: 1928, stadium: 'Nabi Abi Chedid', nickname: 'Massa Bruta', mascot: 'Touro',
    fact: 'Foi vice-campeão brasileiro em 1991 e, em 2019, passou a se chamar Red Bull Bragantino.',
    highlight: 'Vice-campeão da Copa Sul-Americana em 2021.' },
  { id: 'mir', name: 'Mirassol', abbr: 'MIR', colors: ['#F2C200', '#0B7A3B'], pattern: 'halves', power: 77,
    full: 'Mirassol Futebol Clube', city: 'Mirassol · SP', founded: 1925, stadium: 'José Maria de Campos Maia', nickname: 'Leão', mascot: 'Leão',
    fact: 'Estreou na Série A em 2025 e, logo de cara, garantiu uma vaga inédita na Libertadores de 2026.',
    highlight: 'Sensação do Brasileirão 2025 em sua primeira participação na elite.' },
  { id: 'vit', name: 'Vitória', abbr: 'VIT', colors: ['#D6111A', '#141414'], pattern: 'hoops', power: 72,
    full: 'Esporte Clube Vitória', city: 'Salvador · BA', founded: 1899, stadium: 'Barradão', nickname: 'Leão da Barra', mascot: 'Leão',
    fact: 'Um dos clubes mais antigos do Nordeste, chegou à final do Campeonato Brasileiro em 1993.',
    highlight: 'Revelou craques como Bebeto, Dida e Vampeta.' },
  { id: 'cfc', name: 'Coritiba', abbr: 'CFC', colors: ['#0B6B3A', '#FFFFFF'], pattern: 'band', power: 73,
    full: 'Coritiba Foot Ball Club', city: 'Curitiba · PR', founded: 1909, stadium: 'Couto Pereira', nickname: 'Coxa', mascot: 'Vovô Coxa',
    fact: 'Em 2011 entrou para o Guinness Book com uma sequência de 24 vitórias seguidas.',
    highlight: 'Campeão brasileiro em 1985 e campeão da Série B em 2025.' },
  { id: 'cap', name: 'Athletico-PR', abbr: 'CAP', colors: ['#D1121C', '#141414'], pattern: 'stripes', power: 74,
    full: 'Club Athletico Paranaense', city: 'Curitiba · PR', founded: 1924, stadium: 'Ligga Arena', nickname: 'Furacão', mascot: 'Furacão',
    fact: 'Sua arena tem teto retrátil e gramado sintético, algo raro entre os estádios do país.',
    highlight: 'Campeão brasileiro em 2001 e bicampeão da Sul-Americana (2018 e 2021).' },
  { id: 'cha', name: 'Chapecoense', abbr: 'CHA', colors: ['#0E8A3E', '#FFFFFF'], pattern: 'solid', power: 70,
    full: 'Associação Chapecoense de Futebol', city: 'Chapecó · SC', founded: 1973, stadium: 'Arena Condá', nickname: 'Verdão do Oeste', mascot: 'Índio Condá',
    fact: 'Campeã da Sul-Americana de 2016, título concedido após a tragédia aérea que comoveu o mundo do futebol.',
    highlight: 'Símbolo mundial de solidariedade e reconstrução.' },
  { id: 'rem', name: 'Remo', abbr: 'REM', colors: ['#0B2A63', '#FFFFFF'], pattern: 'solid', power: 70,
    full: 'Clube do Remo', city: 'Belém · PA', founded: 1905, stadium: 'Mangueirão', nickname: 'Leão Azul', mascot: 'Leão Azul',
    fact: 'Volta à Série A em 2026 após 32 anos e recoloca o futebol do Norte na elite depois de 21 anos.',
    highlight: 'Protagonista do Re-Pa, clássico com o Paysandu.' },
];
export const TEAM_BY_ID = Object.fromEntries(TEAMS.map(t => [t.id, t]));

// ------------------------------------------------------------
//  Atributos de jogo
// ------------------------------------------------------------
export const POSITIONS = {
  GOL: { label: 'Goleiro',  line: 'GOL' },
  ZAG: { label: 'Zagueiro', line: 'DEF' },
  LAT: { label: 'Lateral',  line: 'DEF' },
  VOL: { label: 'Volante',  line: 'MEI' },
  MEI: { label: 'Meia',     line: 'MEI' },
  ATA: { label: 'Atacante', line: 'ATA' },
};
// atributos: ATA (finalização), MEI (criação), DEF (marcação), GOL (defesa do goleiro)
const PROFILE = {
  GOL: { GOL: 3,   DEF: -28, MEI: -34, ATA: -48 },
  ZAG: { GOL: -55, DEF: 3,   MEI: -12, ATA: -22 },
  LAT: { GOL: -55, DEF: 0,   MEI: -5,  ATA: -11 },
  VOL: { GOL: -55, DEF: -3,  MEI: 1,   ATA: -13 },
  MEI: { GOL: -55, DEF: -18, MEI: 3,   ATA: -4  },
  ATA: { GOL: -55, DEF: -28, MEI: -8,  ATA: 3   },
};
function hash(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function playerAttrs(id, pos, ovr) {
  const out = {};
  for (const k of ['ATA', 'MEI', 'DEF', 'GOL']) {
    const jitter = (hash(id + k) % 7) - 3;
    out[k] = Math.max(8, Math.min(99, ovr + PROFILE[pos][k] + (k === POSITIONS[pos].line ? 0 : jitter)));
  }
  return out;
}

// bônus de jogo por raridade
export const CREST_MORAL = { comum: 0, rara: 1, muito: 2, especial: 3 };          // escudo: +moral em todas as linhas
export const STADIUM_BONUS = { comum: 2, rara: 3, muito: 4, especial: 6 };        // estádio: +mando (só em casa)
export const MASCOT_POWER = { comum: 2, rara: 4, muito: 6, especial: 8 };         // mascote oficial
export const HERO_POWER = { comum: 5, rara: 7, muito: 9, especial: 12 };          // mascote Juízo Final

export const ABILITIES = {
  ataque:  { label: 'Ataque',   desc: v => `+${v} no ataque do time` },
  muralha: { label: 'Muralha',  desc: v => `+${v} na defesa do time` },
  meio:    { label: 'Meio',     desc: v => `+${v} na criação de jogadas` },
  reflexo: { label: 'Reflexo',  desc: v => `+${v} para o goleiro` },
  torcida: { label: 'Torcida',  desc: v => `+${v} em tudo jogando em casa` },
  pressao: { label: 'Pressão',  desc: v => `+${v * 4}% de chances criadas nos últimos 15 minutos` },
  raca:    { label: 'Raça',     desc: v => `+${v * 5}% de chances criadas quando está perdendo` },
  contra:  { label: 'Contra-ataque', desc: v => `+${v}% de aproveitamento nas finalizações` },
  sorte:   { label: 'Sorte',    desc: v => `${(v * 1.5).toFixed(0)}% de chance de um gol adversário bater na trave` },
  caos:    { label: 'Caos',     desc: v => `-${v} no ataque e -${Math.round(v / 2)} na criação do adversário` },
};

// ============================================================
//  COLEÇÃO 1 — CLUBES
//  Todos os 20 clubes têm carta comum (escudo oficial);
//  raras, muito raras e especiais são edições especiais.
// ============================================================
const CLUB_EDITIONS = [
  // Uniforme 2 (rara): cores invertidas
  { team: 'cor', rarity: 'rara', edition: 'Uniforme 2', variant: 'away', fact: 'É o maior campeão do Campeonato Paulista.' },
  { team: 'sao', rarity: 'rara', edition: 'Uniforme 2', variant: 'away', fact: 'Foi o primeiro clube brasileiro tricampeão da Libertadores (1992, 1993 e 2005).' },
  { team: 'gre', rarity: 'rara', edition: 'Uniforme 2', variant: 'away', fact: 'O hino do clube, "Até a pé nós iremos", é de Lupicínio Rodrigues, torcedor gremista.' },
  { team: 'int', rarity: 'rara', edition: 'Uniforme 2', variant: 'away', fact: 'Bicampeão da Libertadores, em 2006 e 2010.' },
  { team: 'cru', rarity: 'rara', edition: 'Uniforme 2', variant: 'away', fact: 'Bicampeão da Libertadores, em 1976 e 1997.' },
  { team: 'cam', rarity: 'rara', edition: 'Uniforme 2', variant: 'away', fact: 'Em 2021 venceu Brasileirão e Copa do Brasil na mesma temporada.' },
  // Histórica (muito rara): visual retrô
  { team: 'san', rarity: 'muito', edition: 'Histórica', variant: 'retro', fact: 'Foi o primeiro clube brasileiro bicampeão da Libertadores, em 1962 e 1963.' },
  { team: 'vas', rarity: 'muito', edition: 'Histórica', variant: 'retro', fact: 'Em 1998, ano do seu centenário, conquistou a Libertadores.' },
  { team: 'bot', rarity: 'muito', edition: 'Histórica', variant: 'retro', fact: 'Garrincha, Nilton Santos, Didi e Zagallo: o Botafogo cedeu titulares à Seleção campeã em 1958 e 1962.' },
  { team: 'flu', rarity: 'muito', edition: 'Histórica', variant: 'retro', fact: 'O Fla-Flu de 1963 reuniu cerca de 194 mil pessoas no Maracanã, um dos maiores públicos da história.' },
  // Campeão (especial): dourada
  { team: 'fla', rarity: 'especial', edition: 'Campeão', variant: 'champ', fact: 'Em 2025 conquistou Brasileirão e Libertadores, tornando-se o primeiro clube do Brasil tetra da América.' },
  { team: 'pal', rarity: 'especial', edition: 'Campeão', variant: 'champ', fact: 'Bicampeão seguido da Libertadores, em 2020 e 2021.' },
];

const CLUB_CARDS = [
  ...TEAMS.map(t => ({ ...t, id: t.id, team: t.id, rarity: 'comum', edition: 'Escudo oficial', variant: 'base' })),
  ...CLUB_EDITIONS.map(e => {
    const t = TEAM_BY_ID[e.team];
    const suffix = { away: 'u2', retro: 'hist', champ: 'camp' }[e.variant];
    return { ...t, ...e, id: `${t.id}-${suffix}`, name: t.name, highlight: `Edição ${e.edition}: ${t.highlight}` };
  }),
];

// ============================================================
//  COLEÇÃO 2 — JOGADORES
//  Comuns: atletas FICTÍCIOS do elenco 2026 (substituir por licenciados)
//  Raras: ídolos · Muito raras: lendas · Especiais: versões Prime
// ============================================================
const COMMON_TIPS = {
  GOL: 'No Modo Clube, o atributo GOL do goleiro reduz a chance de o adversário marcar.',
  ZAG: 'Zagueiros sustentam a DEF do time; jogando fora da posição, rendem menos.',
  LAT: 'Laterais contam como defensores, mas ajudam na criação melhor que zagueiros.',
  VOL: 'Volantes equilibram: ajudam a criar (MEI) e a marcar (DEF).',
  MEI: 'Meias controlam a posse de bola: quem cria mais, ataca mais vezes.',
  ATA: 'Atacantes têm o maior peso na finalização (ATA) e no número de gols.',
};
const COMMON_PLAYERS = [
  ['davi-rocha', 'Davi Rocha', 'fla', 'ATA', 70, 9],
  ['caio-lemos', 'Caio Lemos', 'pal', 'ZAG', 69, 4],
  ['renan-sousa', 'Renan Sousa', 'cor', 'VOL', 67, 5],
  ['thiago-brandao', 'Thiago Brandão', 'sao', 'GOL', 68, 1],
  ['kaua-mendes', 'Kauã Mendes', 'san', 'ATA', 66, 11],
  ['igor-paiva', 'Igor Paiva', 'bot', 'LAT', 68, 6],
  ['rafael-teixeira', 'Rafael Teixeira', 'cam', 'MEI', 68, 10],
  ['lucas-fontes', 'Lucas Fontes', 'cru', 'ZAG', 67, 3],
  ['matheus-prado', 'Matheus Prado', 'gre', 'GOL', 66, 1],
  ['enzo-carvalho', 'Enzo Carvalho', 'int', 'MEI', 67, 8],
  ['pedro-almeida', 'Pedro Almeida', 'vas', 'ATA', 66, 9],
  ['gustavo-neri', 'Gustavo Neri', 'flu', 'LAT', 66, 2],
  ['icaro-santana', 'Ícaro Santana', 'bah', 'VOL', 66, 5],
  ['breno-lacerda', 'Breno Lacerda', 'rbb', 'ZAG', 65, 4],
  ['jonas-bezerra', 'Jonas Bezerra', 'mir', 'GOL', 65, 1],
  ['luan-cerqueira', 'Luan Cerqueira', 'vit', 'ATA', 64, 7],
  ['henrique-bauer', 'Henrique Bauer', 'cfc', 'MEI', 64, 10],
  ['felipe-kruger', 'Felipe Krüger', 'cap', 'LAT', 64, 6],
  ['diego-zanella', 'Diego Zanella', 'cha', 'ZAG', 63, 3],
  ['marlon-siqueira', 'Marlon Siqueira', 'rem', 'VOL', 63, 8],
].map(([id, name, team, pos, ovr, shirt]) => ({
  id, name, team, pos, ovr, shirt, rarity: 'comum', edition: 'Elenco 2026', fictional: true, era: '2026',
  full: `${name} (atleta fictício)`,
  highlight: 'Atleta fictício da demonstração: substitua por um jogador licenciado do elenco.',
  fact: COMMON_TIPS[pos],
}));

const IDOLS = [
  // ---- goleiros
  { id: 'ceni', name: 'Rogério Ceni', team: 'sao', pos: 'GOL', ovr: 89, rarity: 'muito', shirt: 1, era: '1990–2015', full: 'Rogério Mücke Ceni',
    highlight: 'Goleiro com mais gols na história do futebol: 131.', fact: 'Disputou mais de 1.200 partidas pelo São Paulo, recorde de jogos por um mesmo clube.' },
  { id: 'marcos', name: 'Marcos', team: 'pal', pos: 'GOL', ovr: 87, rarity: 'muito', shirt: 12, era: '1992–2012', full: 'Marcos Roberto Silveira Reis',
    highlight: 'Pentacampeão mundial com a Seleção em 2002.', fact: 'Virou "São Marcos" com defesas decisivas no título da Libertadores de 1999.' },
  { id: 'victor', name: 'Victor', team: 'cam', pos: 'GOL', ovr: 82, rarity: 'rara', shirt: 1, era: '2012–2021', full: 'Victor Leandro Bagy',
    highlight: 'Campeão da Libertadores de 2013.', fact: 'Virou "São Victor" ao defender com o pé um pênalti no último lance das quartas de final da Libertadores de 2013.' },
  { id: 'castilho', name: 'Castilho', team: 'flu', pos: 'GOL', ovr: 80, rarity: 'rara', shirt: 1, era: '1947–1965', full: 'Carlos José Castilho',
    highlight: 'Um dos maiores goleiros da história do Fluminense.', fact: 'Conta-se que aceitou amputar a ponta de um dedo para voltar mais rápido aos jogos.' },
  // ---- zagueiros
  { id: 'figueroa', name: 'Figueroa', team: 'int', pos: 'ZAG', ovr: 88, rarity: 'muito', shirt: 3, era: '1971–1976', full: 'Elías Figueroa',
    highlight: 'Bicampeão brasileiro pelo Inter (1975 e 1976).', fact: 'O chileno marcou de cabeça o gol do título de 1975, eternizado como o "gol iluminado".' },
  { id: 'luis-pereira', name: 'Luís Pereira', team: 'pal', pos: 'ZAG', ovr: 81, rarity: 'rara', shirt: 3, era: '1968–1975', full: 'Luís Edmundo Pereira',
    highlight: 'Bicampeão brasileiro (1972 e 1973).', fact: 'Zagueiro elegante, defendeu a Seleção na Copa do Mundo de 1974.' },
  { id: 'lugano', name: 'Lugano', team: 'sao', pos: 'ZAG', ovr: 81, rarity: 'rara', shirt: 5, era: '2003–2017', full: 'Diego Lugano',
    highlight: 'Campeão da Libertadores e do Mundial em 2005.', fact: 'O capitão uruguaio de garra virou ídolo do São Paulo e, depois de parar, trabalhou como dirigente do clube.' },
  { id: 'gamarra', name: 'Gamarra', team: 'cor', pos: 'ZAG', ovr: 80, rarity: 'rara', shirt: 4, era: '1998', full: 'Carlos Gamarra',
    highlight: 'Campeão brasileiro de 1998 pelo Corinthians.', fact: 'O paraguaio ficou conhecido pelo jogo limpo e pelo posicionamento impecável.' },
  // ---- laterais
  { id: 'nilton-santos', name: 'Nilton Santos', team: 'bot', pos: 'LAT', ovr: 89, rarity: 'muito', shirt: 6, era: '1948–1964', full: 'Nilton dos Reis Santos',
    highlight: 'Bicampeão mundial (1958 e 1962).', fact: 'Chamado de "A Enciclopédia do Futebol", jogou a carreira toda no Botafogo e dá nome ao estádio do clube.' },
  { id: 'cafu', name: 'Cafu', team: 'sao', pos: 'LAT', ovr: 88, rarity: 'muito', shirt: 2, era: '1990–1994', full: 'Marcos Evangelista de Moraes',
    highlight: 'Único jogador a disputar três finais de Copa seguidas (1994, 1998 e 2002).', fact: 'Capitão do penta, levantou a taça em 2002 com "100% Jardim Irene" escrito na camisa.' },
  { id: 'leandro', name: 'Leandro', team: 'fla', pos: 'LAT', ovr: 83, rarity: 'rara', shirt: 2, era: '1978–1990', full: 'José Leandro de Souza Ferreira',
    highlight: 'Campeão mundial de clubes em 1981.', fact: 'Lateral-direito clássico, jogou a carreira inteira pelo Flamengo.' },
  { id: 'ruschel', name: 'Alan Ruschel', team: 'cha', pos: 'LAT', ovr: 78, rarity: 'rara', shirt: 6, era: '2016–2019', full: 'Alan Luciano Ruschel',
    highlight: 'Sobrevivente da tragédia de 2016.', fact: 'Voltou a jogar em 2017 e virou símbolo de superação e da reconstrução da Chape.' },
  // ---- volantes
  { id: 'falcao', name: 'Falcão', team: 'int', pos: 'VOL', ovr: 90, rarity: 'muito', shirt: 5, era: '1973–1980', full: 'Paulo Roberto Falcão',
    highlight: 'Tricampeão brasileiro pelo Inter (1975, 1976 e 1979).', fact: 'Na Itália ganhou o apelido de "Rei de Roma" ao levar a Roma ao título italiano de 1983.' },
  { id: 'mauro-silva', name: 'Mauro Silva', team: 'rbb', pos: 'VOL', ovr: 81, rarity: 'rara', shirt: 5, era: '1990–1992', full: 'Mauro da Silva Gomes',
    highlight: 'Tetracampeão mundial com a Seleção em 1994.', fact: 'Brilhou no Bragantino do início dos anos 90 antes de virar lenda do Deportivo La Coruña.' },
  { id: 'clodoaldo', name: 'Clodoaldo', team: 'san', pos: 'VOL', ovr: 82, rarity: 'rara', shirt: 5, era: '1966–1979', full: 'Clodoaldo Tavares de Santana',
    highlight: 'Campeão mundial em 1970.', fact: 'Na final da Copa de 1970, driblou quatro italianos no início da jogada do quarto gol do Brasil.' },
  // ---- meias
  { id: 'zico', name: 'Zico', team: 'fla', pos: 'MEI', ovr: 91, rarity: 'muito', shirt: 10, era: '1971–1989', full: 'Arthur Antunes Coimbra',
    highlight: 'Maior artilheiro da história do Flamengo.', fact: 'O "Galinho de Quintino" comandou o Flamengo no título mundial de 1981, contra o Liverpool, em Tóquio.' },
  { id: 'ademir', name: 'Ademir da Guia', team: 'pal', pos: 'MEI', ovr: 88, rarity: 'muito', shirt: 10, era: '1961–1977', full: 'Ademir da Guia',
    highlight: 'Jogador com mais partidas na história do Palmeiras.', fact: 'Apelidado de "Divino", é filho de Domingos da Guia, lenda da zaga brasileira.' },
  { id: 'socrates', name: 'Sócrates', team: 'cor', pos: 'MEI', ovr: 89, rarity: 'muito', shirt: 8, era: '1978–1984', full: 'Sócrates Brasileiro Sampaio de Souza Vieira de Oliveira',
    highlight: 'Líder da Democracia Corinthiana.', fact: 'Formado em Medicina, o "Doutor" ficou famoso pelos passes e gols de calcanhar.' },
  { id: 'rivellino', name: 'Rivellino', team: 'cor', pos: 'MEI', ovr: 88, rarity: 'muito', shirt: 10, era: '1965–1974', full: 'Roberto Rivellino',
    highlight: 'Campeão mundial em 1970.', fact: 'Eternizou o "elástico", drible que inspirou gerações de craques.' },
  { id: 'alex', name: 'Alex', team: 'cfc', pos: 'MEI', ovr: 83, rarity: 'rara', shirt: 10, era: '1995–2014', full: 'Alexsandro de Souza',
    highlight: 'Revelado pelo Coxa, onde também encerrou a carreira.', fact: 'Virou ídolo ainda no Palmeiras, no Cruzeiro da Tríplice Coroa e no Fenerbahçe, da Turquia.' },
  { id: 'bobo', name: 'Bobô', team: 'bah', pos: 'MEI', ovr: 80, rarity: 'rara', shirt: 8, era: '1985–1989', full: 'Raimundo Nonato Tavares da Silva',
    highlight: 'Craque do título brasileiro de 1988.', fact: 'Comandou o Bahia na decisão contra o Internacional que deu ao clube seu segundo Brasileirão.' },
  // ---- atacantes
  { id: 'pele', name: 'Pelé', team: 'san', pos: 'ATA', ovr: 91, rarity: 'muito', shirt: 10, era: '1956–1974', full: 'Edson Arantes do Nascimento',
    highlight: 'Único jogador tricampeão mundial (1958, 1962 e 1970).', fact: 'Marcou o milésimo gol da carreira em 1969, de pênalti, no Maracanã, contra o Vasco.' },
  { id: 'garrincha', name: 'Garrincha', team: 'bot', pos: 'ATA', ovr: 90, rarity: 'muito', shirt: 7, era: '1953–1965', full: 'Manoel Francisco dos Santos',
    highlight: 'Bicampeão mundial com a Seleção (1958 e 1962).', fact: 'Chamado de "Alegria do Povo" e "Anjo de Pernas Tortas", tinha uma perna mais curta que a outra.' },
  { id: 'dinamite', name: 'Roberto Dinamite', team: 'vas', pos: 'ATA', ovr: 88, rarity: 'muito', shirt: 10, era: '1971–1993', full: 'Carlos Roberto de Oliveira',
    highlight: 'Maior artilheiro da história do Campeonato Brasileiro.', fact: 'Depois de encerrar a carreira, também foi presidente do Vasco.' },
  { id: 'tostao', name: 'Tostão', team: 'cru', pos: 'ATA', ovr: 84, rarity: 'rara', shirt: 9, era: '1963–1972', full: 'Eduardo Gonçalves de Andrade',
    highlight: 'Campeão mundial em 1970 e maior artilheiro da história do Cruzeiro.', fact: 'Após encerrar a carreira cedo, formou-se em Medicina e virou colunista esportivo.' },
  { id: 'reinaldo', name: 'Reinaldo', team: 'cam', pos: 'ATA', ovr: 83, rarity: 'rara', shirt: 9, era: '1973–1985', full: 'José Reinaldo de Lima',
    highlight: 'Maior artilheiro da história do Atlético-MG.', fact: 'Comemorava os gols com o punho cerrado, gesto que virou símbolo de resistência nos anos 70.' },
  { id: 'renato', name: 'Renato Gaúcho', team: 'gre', pos: 'ATA', ovr: 83, rarity: 'rara', shirt: 7, era: '1980–1986', full: 'Renato Portaluppi',
    highlight: 'Dois gols na final do Mundial de 1983 contra o Hamburgo.', fact: 'Anos depois, como técnico, levou o Grêmio ao título da Libertadores de 2017.' },
  { id: 'fred', name: 'Fred', team: 'flu', pos: 'ATA', ovr: 82, rarity: 'rara', shirt: 9, era: '2009–2022', full: 'Frederico Chaves Guedes',
    highlight: 'Bicampeão brasileiro pelo Fluminense (2010 e 2012).', fact: 'Um dos maiores artilheiros da história do Flu, com quase 200 gols pelo clube.' },
  { id: 'bebeto', name: 'Bebeto', team: 'vit', pos: 'ATA', ovr: 83, rarity: 'rara', shirt: 7, era: '1982–1983', full: 'José Roberto Gama de Oliveira',
    highlight: 'Tetracampeão mundial com a Seleção em 1994.', fact: 'Revelado pelo Vitória, eternizou na Copa de 94 a comemoração "embalando o bebê".' },
  { id: 'sicupira', name: 'Sicupira', team: 'cap', pos: 'ATA', ovr: 79, rarity: 'rara', shirt: 9, era: '1965–1976', full: 'Barcímio Sicupira Júnior',
    highlight: 'Maior artilheiro da história do Athletico.', fact: 'Seus gols nos anos 60 e 70 fizeram dele a primeira grande lenda do Furacão.' },
  { id: 'alcino', name: 'Alcino', team: 'rem', pos: 'ATA', ovr: 78, rarity: 'rara', shirt: 9, era: '1970–1978', full: 'Alcino Neves dos Santos Filho',
    highlight: 'Considerado o maior ídolo da história do Remo.', fact: 'Tricampeão paraense (1973, 1974 e 1975), foi artilheiro nas três edições.' },
].map(p => ({ ...p, edition: p.rarity === 'muito' ? 'Lenda' : 'Ídolo' }));

const PRIMES = [
  { id: 'pele-prime', name: 'Pelé', team: 'san', pos: 'ATA', ovr: 97, shirt: 10, era: 'Prime 1970', full: 'Edson Arantes do Nascimento',
    highlight: 'O Rei do Futebol no auge, tricampeão mundial.', fact: 'Marcou mais de mil gols na carreira, contando amistosos.' },
  { id: 'zico-prime', name: 'Zico', team: 'fla', pos: 'MEI', ovr: 95, shirt: 10, era: 'Prime 1981', full: 'Arthur Antunes Coimbra',
    highlight: 'Campeão da Libertadores e do Mundial em 1981.', fact: 'Na final do Mundial contra o Liverpool, deu os passes para os três gols do Flamengo.' },
  { id: 'garrincha-prime', name: 'Garrincha', team: 'bot', pos: 'ATA', ovr: 95, shirt: 7, era: 'Prime 1962', full: 'Manoel Francisco dos Santos',
    highlight: 'Melhor jogador e um dos artilheiros da Copa de 1962.', fact: 'Com Pelé machucado, carregou o Brasil rumo ao bicampeonato mundial no Chile.' },
  { id: 'ronaldo-prime', name: 'Ronaldo', team: 'cru', pos: 'ATA', ovr: 96, shirt: 9, era: 'Prime 1994', full: 'Ronaldo Luís Nazário de Lima',
    highlight: 'Campeão mundial com a Seleção em 1994 e 2002.', fact: 'Revelado pelo Cruzeiro em 1993, aos 16 anos, antes de ganhar o mundo e o apelido de "Fenômeno".' },
  { id: 'romario-prime', name: 'Romário', team: 'vas', pos: 'ATA', ovr: 95, shirt: 11, era: 'Prime 1994', full: 'Romário de Souza Faria',
    highlight: 'Eleito o melhor jogador da Copa do Mundo de 1994.', fact: 'Comemorou o "milésimo gol" da carreira, pela sua contagem, pelo Vasco, em 2007.' },
].map(p => ({ ...p, rarity: 'especial', edition: 'Prime' }));

const PLAYER_CARDS = [...COMMON_PLAYERS, ...IDOLS, ...PRIMES]
  .map(p => ({ ...p, person: p.id.replace(/-prime$/, ''), attrs: playerAttrs(p.id, p.pos, p.ovr) }));

// ============================================================
//  COLEÇÃO 3 — ESTÁDIOS
//  capacity: capacidade aproximada · mando: bônus jogando em casa (Modo Clube)
// ============================================================
const STADIUM_CARDS = [
  { id: 'maracana', name: 'Maracanã', team: 'fla', rarity: 'especial', city: 'Rio de Janeiro · RJ', opened: 1950, capacity: 78000, nickname: 'Templo do Futebol',
    full: 'Estádio Jornalista Mário Filho', fact: 'Recebeu duas finais de Copa do Mundo: em 1950 e em 2014.', highlight: 'Casa de Flamengo e Fluminense.' },
  { id: 'mineirao', name: 'Mineirão', team: 'cru', rarity: 'muito', city: 'Belo Horizonte · MG', opened: 1965, capacity: 62000, nickname: 'Gigante da Pampulha',
    full: 'Estádio Governador Magalhães Pinto', fact: 'Foi palco da semifinal da Copa de 2014 entre Brasil e Alemanha.', highlight: 'Casa do Cruzeiro.' },
  { id: 'morumbis', name: 'MorumBIS', team: 'sao', rarity: 'muito', city: 'São Paulo · SP', opened: 1960, capacity: 66000, nickname: 'Morumbi',
    full: 'Estádio Cícero Pompeu de Toledo', fact: 'O nome MorumBIS vem de um acordo de naming rights fechado em 2024.', highlight: 'Casa do São Paulo.' },
  { id: 'arena-mrv', name: 'Arena MRV', team: 'cam', rarity: 'muito', city: 'Belo Horizonte · MG', opened: 2023, capacity: 46000, nickname: 'Casa do Galo',
    full: 'Arena MRV', fact: 'Primeira casa própria do Atlético-MG, inaugurada em 2023.', highlight: 'Casa do Atlético-MG.' },
  { id: 'allianz', name: 'Allianz Parque', team: 'pal', rarity: 'rara', city: 'São Paulo · SP', opened: 2014, capacity: 43000, nickname: 'Arena do Verdão',
    full: 'Allianz Parque', fact: 'Construído no lugar do antigo Palestra Itália, é também uma das casas de shows mais movimentadas do país.', highlight: 'Casa do Palmeiras.' },
  { id: 'neo-quimica', name: 'Neo Química Arena', team: 'cor', rarity: 'rara', city: 'São Paulo · SP', opened: 2014, capacity: 47000, nickname: 'Arena do Timão',
    full: 'Neo Química Arena', fact: 'Recebeu o jogo de abertura da Copa do Mundo de 2014.', highlight: 'Casa do Corinthians.' },
  { id: 'beira-rio', name: 'Beira-Rio', team: 'int', rarity: 'rara', city: 'Porto Alegre · RS', opened: 1969, capacity: 50000, nickname: 'Gigante da Beira-Rio',
    full: 'Estádio José Pinheiro Borda', fact: 'Erguido às margens do Guaíba, em parte com doações de material feitas pela torcida.', highlight: 'Casa do Internacional.' },
  { id: 'arena-gremio', name: 'Arena do Grêmio', team: 'gre', rarity: 'rara', city: 'Porto Alegre · RS', opened: 2012, capacity: 55000, nickname: 'Arena',
    full: 'Arena do Grêmio', fact: 'Inaugurada em 2012, substituiu o lendário Estádio Olímpico.', highlight: 'Casa do Grêmio.' },
  { id: 'fonte-nova', name: 'Arena Fonte Nova', team: 'bah', rarity: 'rara', city: 'Salvador · BA', opened: 2013, capacity: 48000, nickname: 'Fonte Nova',
    full: 'Arena Fonte Nova', fact: 'Reconstruída para a Copa de 2014 no mesmo local da antiga Fonte Nova, de 1951.', highlight: 'Casa do Bahia.' },
  { id: 'nilton-santos', name: 'Nilton Santos', team: 'bot', rarity: 'rara', city: 'Rio de Janeiro · RJ', opened: 2007, capacity: 44000, nickname: 'Engenhão',
    full: 'Estádio Nilton Santos', fact: 'Construído para o Pan-Americano de 2007, foi sede do atletismo na Olimpíada Rio 2016.', highlight: 'Casa do Botafogo.' },
  { id: 'sao-januario', name: 'São Januário', team: 'vas', rarity: 'rara', city: 'Rio de Janeiro · RJ', opened: 1927, capacity: 21000, nickname: 'Colina Histórica',
    full: 'Estádio Vasco da Gama', fact: 'Quando foi inaugurado, em 1927, era o maior estádio do Brasil.', highlight: 'Casa do Vasco.' },
  { id: 'vila-belmiro', name: 'Vila Belmiro', team: 'san', rarity: 'rara', city: 'Santos · SP', opened: 1916, capacity: 16000, nickname: 'Vila Mais Famosa do Mundo',
    full: 'Estádio Urbano Caldeira', fact: 'Pequena e pulsante: ali Pelé, Robinho e Neymar começaram a brilhar.', highlight: 'Casa do Santos.' },
  { id: 'ligga-arena', name: 'Ligga Arena', team: 'cap', rarity: 'rara', city: 'Curitiba · PR', opened: 1999, capacity: 42000, nickname: 'Arena da Baixada',
    full: 'Estádio Joaquim Américo Guimarães', fact: 'Tem teto retrátil e gramado sintético, e foi sede da Copa do Mundo de 2014.', highlight: 'Casa do Athletico.' },
  { id: 'barradao', name: 'Barradão', team: 'vit', rarity: 'comum', city: 'Salvador · BA', opened: 1986, capacity: 30000, nickname: 'Toca do Leão',
    full: 'Estádio Manoel Barradas', fact: 'O nome oficial homenageia Manoel Barradas, dirigente histórico do clube.', highlight: 'Casa do Vitória.' },
  { id: 'couto-pereira', name: 'Couto Pereira', team: 'cfc', rarity: 'comum', city: 'Curitiba · PR', opened: 1932, capacity: 40000, nickname: 'Alto da Glória',
    full: 'Estádio Major Antônio Couto Pereira', fact: 'Inaugurado em 1932, é um dos estádios mais antigos em uso na elite.', highlight: 'Casa do Coritiba.' },
  { id: 'arena-conda', name: 'Arena Condá', team: 'cha', rarity: 'comum', city: 'Chapecó · SC', opened: 1976, capacity: 20000, nickname: 'Condá',
    full: 'Arena Condá', fact: 'Recebeu milhares de pessoas na homenagem às vítimas da tragédia de 2016.', highlight: 'Casa da Chapecoense.' },
  { id: 'nabi-abi-chedid', name: 'Nabi Abi Chedid', team: 'rbb', rarity: 'comum', city: 'Bragança Paulista · SP', opened: 1949, capacity: 15000, nickname: 'Nabizão',
    full: 'Estádio Nabi Abi Chedid', fact: 'Leva o nome de um ex-presidente do Bragantino que também foi deputado.', highlight: 'Casa do Bragantino.' },
  { id: 'maiao', name: 'Maião', team: 'mir', rarity: 'comum', city: 'Mirassol · SP', opened: null, capacity: 15000, nickname: 'Maião',
    full: 'Estádio José Maria de Campos Maia', fact: 'Pequeno e acolhedor, viu o Mirassol chegar à elite e à Libertadores.', highlight: 'Casa do Mirassol.' },
  { id: 'mangueirao', name: 'Mangueirão', team: 'rem', rarity: 'comum', city: 'Belém · PA', opened: 1978, capacity: 50000, nickname: 'Mangueirão',
    full: 'Estádio Olímpico do Pará', fact: 'Reformado recentemente, recebe os grandes jogos do Remo e o clássico Re-Pa.', highlight: 'Palco dos grandes jogos do Remo.' },
].map(s => ({ ...s, edition: 'Estádio', mando: STADIUM_BONUS[s.rarity] + (s.capacity >= 60000 ? 1 : 0) }));

// ============================================================
//  COLEÇÃO 4 — MASCOTES (oficiais e versões especiais)
//  emoji: arte provisória até entrar o PNG · ability: efeito no Modo Clube
// ============================================================
const MASCOT_BASE = {
  fla: { name: 'Urubu', emoji: '🦅', ability: 'pressao', fact: 'O urubu virou símbolo rubro-negro nos anos 60, quando torcedores soltaram uma ave no Maracanã durante um Fla-Flu.' },
  pal: { name: 'Porco', emoji: '🐷', ability: 'muralha', fact: 'O apelido, antes uma provocação dos rivais, foi assumido com orgulho pela torcida em 1986.' },
  cor: { name: 'Mosqueteiro Alvinegro', emoji: '⚔️', ability: 'raca', fact: 'O mosqueteiro representa a coragem do "um por todos, todos por um" da Fiel.' },
  sao: { name: 'Santo Paulo', emoji: '😇', ability: 'reflexo', fact: 'Inspirado no apóstolo Paulo, que dá nome à cidade e ao clube.' },
  san: { name: 'Baleia', emoji: '🐋', ability: 'meio', fact: 'Chamado de "Peixe" pelos rivais, o Santos abraçou o mar e adotou a baleia como mascote.' },
  bot: { name: 'Biriba', emoji: '🐕', ability: 'sorte', fact: 'O cachorro Biriba virou amuleto do Botafogo campeão carioca de 1948.' },
  cam: { name: 'Galo', emoji: '🐓', ability: 'ataque', fact: 'Criado pelo cartunista Mangabeira, o Galo virou o grito de guerra da torcida: "Galo!".' },
  cru: { name: 'Raposa', emoji: '🦊', ability: 'contra', fact: 'Também desenhada por Mangabeira, a raposa simboliza a astúcia celeste.' },
  gre: { name: 'Mosqueteiro Tricolor', emoji: '🤺', ability: 'raca', fact: 'Inspirado nos Três Mosqueteiros, representa a garra do "Imortal".' },
  int: { name: 'Saci', emoji: '🌀', ability: 'meio', fact: 'Personagem do folclore brasileiro, o Saci de gorro vermelho é o mascote colorado.' },
  vas: { name: 'Almirante', emoji: '⚓', ability: 'muralha', fact: 'Homenagem ao navegador português Vasco da Gama, que dá nome ao clube.' },
  flu: { name: 'Cartola', emoji: '🎩', ability: 'meio', fact: 'A cartola remete ao início elegante do clube, fundado em 1902.' },
  bah: { name: 'Herói Tricolor', emoji: '🦸', ability: 'ataque', fact: 'Um herói de capa para o "Esquadrão de Aço".' },
  rbb: { name: 'Touro', emoji: '🐂', ability: 'ataque', fact: 'O touro chegou com a parceria de 2019 e combina com o apelido "Massa Bruta".' },
  mir: { name: 'Leão Caipira', emoji: '🦁', ability: 'torcida', fact: 'O Leão do interior paulista rugiu alto na estreia na elite, em 2025.' },
  vit: { name: 'Leão da Barra', emoji: '🦁', ability: 'torcida', fact: 'O Leão da Barra ruge forte no Barradão.' },
  cfc: { name: 'Vovô Coxa', emoji: '👴', ability: 'reflexo', fact: 'O "Vovô" lembra que o Coritiba, de 1909, é um dos clubes mais antigos do Paraná.' },
  cap: { name: 'Furacão', emoji: '🌪️', ability: 'pressao', fact: 'O apelido nasceu com o time arrasador de 1949.' },
  cha: { name: 'Índio Condá', emoji: '🏹', ability: 'raca', fact: 'Homenagem ao cacique Condá, liderança kaingang da região de Chapecó.' },
  rem: { name: 'Leão Azul', emoji: '🦁', ability: 'torcida', fact: 'O Remo é o "Leão Azul" da Amazônia; o rival Paysandu é o "Papão".' },
};
const MASCOT_EDITIONS = [
  { team: 'fla', rarity: 'rara', edition: 'Neon' },
  { team: 'cam', rarity: 'rara', edition: 'Neon' },
  { team: 'cru', rarity: 'rara', edition: 'Neon' },
  { team: 'pal', rarity: 'rara', edition: 'Neon' },
  { team: 'cor', rarity: 'muito', edition: 'Lendário' },
  { team: 'int', rarity: 'muito', edition: 'Lendário' },
  { team: 'san', rarity: 'muito', edition: 'Lendário' },
  { team: 'fla', rarity: 'especial', edition: 'Supremo' },
  { team: 'pal', rarity: 'especial', edition: 'Supremo' },
];
const MASCOT_CARDS = [
  ...TEAMS.map(t => ({ ...MASCOT_BASE[t.id], id: t.id, team: t.id, rarity: 'comum', edition: 'Oficial' })),
  ...MASCOT_EDITIONS.map(e => {
    const b = MASCOT_BASE[e.team];
    const suffix = { Neon: 'neon', Lendário: 'lendario', Supremo: 'supremo' }[e.edition];
    const label = e.edition === 'Lendário' && e.team === 'san' ? 'Lendária' : e.edition;
    return { ...b, ...e, id: `${e.team}-${suffix}`, name: `${b.name} ${label}`,
      fact: `Versão ${e.edition.toLowerCase()} do mascote. ${b.fact}` };
  }),
].map(m => ({ ...m, power: MASCOT_POWER[m.rarity] }));

// ============================================================
//  COLEÇÃO 5 — LIGA DOS MASCOTES: JUÍZO FINAL (especial, só premium)
//  Inspirada em grandes sagas de super-heróis, com personagens
//  e nomes originais (sem marcas de terceiros).
// ============================================================
const HERO_CARDS = [
  { id: 'doutor-rebaixamento', name: 'Doutor Rebaixamento', team: 'vil', rarity: 'especial', emoji: '🦹', ability: 'caos', role: 'Vilão',
    highlight: 'O vilão que quer mandar todos os clubes para a "Série Z".', fact: 'Usa uma armadura forjada com troféus derretidos e só teme uma coisa: torcida unida.' },
  { id: 'urubu-infinito', name: 'Urubu Infinito', team: 'fla', rarity: 'especial', emoji: '🦅', ability: 'pressao', role: 'Líder da Liga',
    highlight: 'Líder da Liga dos Mascotes, voa acima de qualquer marcação.', fact: 'Reúne os mascotes quando o placar parece perdido — e nunca desiste até o apito final.' },
  { id: 'galo-trovao', name: 'Galo do Trovão', team: 'cam', rarity: 'muito', emoji: '🐓', ability: 'ataque', role: 'Força',
    highlight: 'Seu canto ecoa como trovão no estádio.', fact: 'Diz a lenda que cada gol do Galo do Trovão vem acompanhado de um relâmpago.' },
  { id: 'raposa-sombria', name: 'Raposa Sombria', team: 'cru', rarity: 'muito', emoji: '🦊', ability: 'contra', role: 'Estrategista',
    highlight: 'Mestre do contra-ataque silencioso.', fact: 'Nunca é vista chegando: quando a defesa percebe, a bola já está na rede.' },
  { id: 'porco-blindado', name: 'Porco Blindado', team: 'pal', rarity: 'muito', emoji: '🐷', ability: 'muralha', role: 'Defensor',
    highlight: 'Uma armadura verde que nenhum atacante atravessa.', fact: 'Treina defendendo chutes de canhão — e pede mais.' },
  { id: 'saci-mistico', name: 'Saci Místico', team: 'int', rarity: 'rara', emoji: '🌀', ability: 'sorte', role: 'Feiticeiro',
    highlight: 'Seus redemoinhos desviam bolas para a trave.', fact: 'Abre portais com o gorro vermelho para aparecer onde ninguém espera.' },
  { id: 'mosqueteiro-escudo', name: 'Mosqueteiro Escudo', team: 'cor', rarity: 'rara', emoji: '🛡️', ability: 'raca', role: 'Capitão',
    highlight: 'Um por todos, todos por um — principalmente quando o time está atrás.', fact: 'Seu escudo leva as marcas de cem batalhas e nenhuma derrota sem luta.' },
  { id: 'leao-colossal', name: 'Leão Colossal', team: 'rem', rarity: 'rara', emoji: '🦁', ability: 'torcida', role: 'Gigante',
    highlight: 'Cresce junto com o barulho da arquibancada.', fact: 'Quanto mais a torcida grita, maior ele fica.' },
  { id: 'baleia-tsunami', name: 'Baleia Tsunami', team: 'san', rarity: 'comum', emoji: '🐋', ability: 'meio', role: 'Maré',
    highlight: 'Inunda o meio-campo com passes.', fact: 'Quando ela salta, a maré de jogadas não para mais.' },
  { id: 'almirante-tempestade', name: 'Almirante Tempestade', team: 'vas', rarity: 'comum', emoji: '⚓', ability: 'muralha', role: 'Navegador',
    highlight: 'Comanda a defesa como quem enfrenta uma tormenta.', fact: 'Navegou pelos sete mares atrás da taça perdida da Liga.' },
  { id: 'furacao-veloz', name: 'Furacão Veloz', team: 'cap', rarity: 'comum', emoji: '🌪️', ability: 'pressao', role: 'Velocista',
    highlight: 'Acelera o jogo nos minutos finais.', fact: 'Corre tão rápido que deixa redemoinhos no gramado.' },
  { id: 'touro-implacavel', name: 'Touro Implacável', team: 'rbb', rarity: 'comum', emoji: '🐂', ability: 'ataque', role: 'Aríete',
    highlight: 'Atropela qualquer linha de defesa.', fact: 'Nunca dá ré — só sabe ir para frente.' },
].map(h => ({ ...h, edition: h.role, hero: true, power: HERO_POWER[h.rarity] }));

// ============================================================
//  Montagem das coleções
// ============================================================
const VILLAIN_TEAM = { id: 'vil', name: 'Série Z', abbr: 'Z', colors: ['#3A0F5C', '#3DFF8F'], pattern: 'solid', full: 'Legião do Rebaixamento', city: 'Série Z' };

function byRarityThenName(a, b) {
  return RARITIES[b.rarity].order - RARITIES[a.rarity].order || a.name.localeCompare(b.name, 'pt-BR');
}

function build(collectionId, prefix, list, kind) {
  return list
    .slice()
    .sort(byRarityThenName)
    .map((c, i) => ({
      ...c,
      uid: `${prefix}-${c.id}`,
      kind,
      collection: collectionId,
      number: i + 1,
      teamData: c.team === 'vil' ? VILLAIN_TEAM : (TEAM_BY_ID[c.team] || c),
    }));
}

export const COLLECTIONS = [
  {
    id: 'clubes', name: 'Clubes Série A', short: 'Clubes',
    tagline: 'Os 20 clubes da elite e suas edições especiais',
    packTitle: ['SÉRIE A', '2026'],
    theme: { c1: '#0F4C8A', c2: '#FF8A1F', glow: '#2E9BFF' },
    cards: build('clubes', 'clube', CLUB_CARDS, 'team'),
  },
  {
    id: 'jogadores', name: 'Jogadores', short: 'Jogadores',
    tagline: 'Elenco, ídolos, lendas e versões Prime',
    packTitle: ['CRAQUES', 'LENDAS'],
    theme: { c1: '#3B1670', c2: '#FFC940', glow: '#B866FF' },
    cards: build('jogadores', 'jog', PLAYER_CARDS, 'player'),
  },
  {
    id: 'estadios', name: 'Estádios', short: 'Estádios',
    tagline: 'Os templos do futebol brasileiro',
    packTitle: ['ESTÁDIOS', 'BRASIL'],
    theme: { c1: '#0B5D3B', c2: '#7CFFB2', glow: '#22C67A' },
    cards: build('estadios', 'estadio', STADIUM_CARDS, 'stadium'),
  },
  {
    id: 'mascotes', name: 'Mascotes', short: 'Mascotes',
    tagline: 'Os mascotes oficiais e suas versões raras',
    packTitle: ['MASCOTES', 'OFICIAIS'],
    theme: { c1: '#8A3A0A', c2: '#FFD15C', glow: '#FF8A1F' },
    cards: build('mascotes', 'masc', MASCOT_CARDS, 'mascot'),
  },
  {
    id: 'juizo-final', name: 'Juízo Final', short: 'Juízo Final',
    tagline: 'Liga dos Mascotes contra o Doutor Rebaixamento',
    packTitle: ['JUÍZO', 'FINAL'],
    premiumOnly: true,
    theme: { c1: '#2A0B45', c2: '#3DFF8F', glow: '#7B2CFF' },
    cards: build('juizo-final', 'jf', HERO_CARDS, 'mascot'),
  },
];

export const UPCOMING = [
  { name: 'Camisas Históricas', when: 'Em breve' },
  { name: 'Libertadores', when: '2027' },
  { name: 'Seleções', when: '2027' },
];

export const ALL_CARDS = COLLECTIONS.flatMap(c => c.cards);
export const CARD_BY_UID = Object.fromEntries(ALL_CARDS.map(c => [c.uid, c]));
export const COLLECTION_BY_ID = Object.fromEntries(COLLECTIONS.map(c => [c.id, c]));

// ------------------------------------------------------------
//  Prêmios (brindes) por progresso
// ------------------------------------------------------------
const P = (collection, prefix, list) => list.map(([at, icon, title, desc]) => ({ id: `${prefix}-${Math.round(at * 100)}`, collection, at, icon, title, desc }));
export const PRIZES = [
  ...P('clubes', 'cl', [
    [0.25, 'ticket', 'Cupom 5% OFF', 'Em qualquer produto da loja.'],
    [0.50, 'ticket', 'Cupom 10% OFF', 'Em camisas de clubes da Série A.'],
    [0.75, 'mug', 'Caneca Série A 2026', 'Caneca exclusiva da coleção.'],
    [1.00, 'shirt', 'Camisa de clube', 'Uma camisa de time da Série A à sua escolha.'],
  ]),
  ...P('jogadores', 'jg', [
    [0.25, 'ticket', 'Cupom 5% OFF', 'Em qualquer produto da loja.'],
    [0.50, 'ticket', 'Cupom 15% OFF', 'Em camisas retrô.'],
    [0.75, 'mug', 'Caneca Lendas', 'Caneca exclusiva da coleção.'],
    [1.00, 'shirt', 'Camisa retrô de um ídolo', 'Camisa retrô personalizada do seu ídolo.'],
  ]),
  ...P('estadios', 'es', [
    [0.25, 'ticket', 'Cupom 5% OFF', 'Em qualquer produto da loja.'],
    [0.50, 'ticket', 'Cupom 10% OFF', 'Em bolas e acessórios.'],
    [0.75, 'cap', 'Boné Versatte', 'Boné exclusivo da coleção.'],
    [1.00, 'ball', 'Bola oficial', 'Uma bola oficial de campo.'],
  ]),
  ...P('mascotes', 'ma', [
    [0.25, 'ticket', 'Cupom 5% OFF', 'Em qualquer produto da loja.'],
    [0.50, 'ticket', 'Cupom 10% OFF', 'Em produtos infantis.'],
    [0.75, 'mug', 'Caneca Mascotes', 'Caneca exclusiva da coleção.'],
    [1.00, 'gift', 'Mascote de pelúcia', 'Pelúcia do mascote do seu clube.'],
  ]),
  ...P('juizo-final', 'jf', [
    [0.25, 'ticket', 'Cupom 10% OFF', 'Em qualquer produto da loja.'],
    [0.50, 'star', 'Pôster Juízo Final', 'Pôster exclusivo da Liga dos Mascotes.'],
    [0.75, 'mug', 'Caneca Juízo Final', 'Caneca edição especial.'],
    [1.00, 'shirt', 'Camisa edição Juízo Final', 'Camisa especial da Liga dos Mascotes.'],
  ]),
  { id: 'master', collection: null, at: 1.00, icon: 'trophy', title: 'Kit Lendário Versatte', desc: 'Camisa + caneca + 25% OFF. Para quem completar todas as coleções.' },
];
