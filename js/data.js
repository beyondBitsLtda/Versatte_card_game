// ============================================================
//  VERSATTE CARDS — dados da demonstração
//  Tudo que é "regra de negócio" (raridades, odds, prêmios)
//  fica aqui para ser ajustado com a Versatte sem mexer no motor.
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
    // mesma tabela para os 3 slots
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

// ------------------------------------------------------------
//  Coleção 1 — Clubes da Série A 2026
//  pattern: solid | stripes | halves | sash | hoops | tri | band
// ------------------------------------------------------------
const TEAMS = [
  { id: 'fla', name: 'Flamengo', abbr: 'FLA', rarity: 'especial', colors: ['#D3202A', '#121212'], pattern: 'hoops',
    full: 'Clube de Regatas do Flamengo', city: 'Rio de Janeiro · RJ', founded: 1895, stadium: 'Maracanã', nickname: 'Mengão', mascot: 'Urubu',
    fact: 'Nasceu como clube de remo em 1895. O futebol só chegou em 1911, trazido por jogadores dissidentes do Fluminense.',
    highlight: 'Campeão Brasileiro e da Libertadores em 2025 — primeiro clube do Brasil tetra da América.' },
  { id: 'pal', name: 'Palmeiras', abbr: 'PAL', rarity: 'especial', colors: ['#0B6B3A', '#FFFFFF'], pattern: 'solid',
    full: 'Sociedade Esportiva Palmeiras', city: 'São Paulo · SP', founded: 1914, stadium: 'Allianz Parque', nickname: 'Verdão', mascot: 'Porco',
    fact: 'Fundado por imigrantes italianos como Palestra Itália, mudou de nome em 1942, durante a Segunda Guerra Mundial.',
    highlight: 'Maior campeão da história do Campeonato Brasileiro.' },
  { id: 'cor', name: 'Corinthians', abbr: 'COR', rarity: 'muito', colors: ['#141414', '#FFFFFF'], pattern: 'band',
    full: 'Sport Club Corinthians Paulista', city: 'São Paulo · SP', founded: 1910, stadium: 'Neo Química Arena', nickname: 'Timão', mascot: 'Mosqueteiro',
    fact: 'Fundado por operários no bairro do Bom Retiro, o nome homenageia o Corinthian FC, time inglês que excursionava pelo Brasil.',
    highlight: 'Bicampeão mundial de clubes (2000 e 2012).' },
  { id: 'sao', name: 'São Paulo', abbr: 'SAO', rarity: 'muito', colors: ['#FFFFFF', '#E2231A', '#141414'], pattern: 'tri',
    full: 'São Paulo Futebol Clube', city: 'São Paulo · SP', founded: 1930, stadium: 'MorumBIS', nickname: 'Tricolor Paulista', mascot: 'Santo Paulo',
    fact: 'O MorumBIS é um dos maiores estádios particulares do país e já recebeu jogos da Seleção e finais continentais.',
    highlight: 'Tricampeão mundial (1992, 1993 e 2005) e hexacampeão brasileiro.' },
  { id: 'san', name: 'Santos', abbr: 'SAN', rarity: 'muito', colors: ['#FFFFFF', '#141414'], pattern: 'stripes',
    full: 'Santos Futebol Clube', city: 'Santos · SP', founded: 1912, stadium: 'Vila Belmiro', nickname: 'Peixe', mascot: 'Baleia',
    fact: 'Na Vila Belmiro, Pelé construiu a lenda do "Santos de Pelé", bicampeão mundial em 1962 e 1963.',
    highlight: 'Clube que revelou Pelé, Robinho e Neymar.' },
  { id: 'bot', name: 'Botafogo', abbr: 'BOT', rarity: 'muito', colors: ['#141414', '#FFFFFF'], pattern: 'stripes',
    full: 'Botafogo de Futebol e Regatas', city: 'Rio de Janeiro · RJ', founded: 1904, stadium: 'Nilton Santos', nickname: 'Glorioso', mascot: 'Biriba',
    fact: 'A Estrela Solitária do escudo veio do clube de regatas, que tinha a Estrela d\'Alva como símbolo antes da fusão de 1942.',
    highlight: 'Conquistou Libertadores e Brasileirão no mesmo ano, em 2024.' },
  { id: 'cam', name: 'Atlético-MG', abbr: 'CAM', rarity: 'rara', colors: ['#141414', '#FFFFFF'], pattern: 'stripes',
    full: 'Clube Atlético Mineiro', city: 'Belo Horizonte · MG', founded: 1908, stadium: 'Arena MRV', nickname: 'Galo', mascot: 'Galo',
    fact: 'A Arena MRV, casa própria do Galo, foi inaugurada em 2023 e tem capacidade para mais de 40 mil torcedores.',
    highlight: 'Campeão da Libertadores em 2013 e brasileiro em 1971 e 2021.' },
  { id: 'cru', name: 'Cruzeiro', abbr: 'CRU', rarity: 'rara', colors: ['#1A3F9C', '#FFFFFF'], pattern: 'solid',
    full: 'Cruzeiro Esporte Clube', city: 'Belo Horizonte · MG', founded: 1921, stadium: 'Mineirão', nickname: 'Raposa', mascot: 'Raposa',
    fact: 'Também nasceu como Palestra Itália. As estrelas do escudo representam a constelação do Cruzeiro do Sul.',
    highlight: 'Conquistou a Tríplice Coroa em 2003: Mineiro, Copa do Brasil e Brasileiro.' },
  { id: 'gre', name: 'Grêmio', abbr: 'GRE', rarity: 'rara', colors: ['#1D8FD6', '#141414', '#FFFFFF'], pattern: 'stripes',
    full: 'Grêmio Foot-Ball Porto Alegrense', city: 'Porto Alegre · RS', founded: 1903, stadium: 'Arena do Grêmio', nickname: 'Imortal Tricolor', mascot: 'Mosqueteiro',
    fact: 'Foi campeão mundial em 1983 com dois gols de Renato Gaúcho na final contra o Hamburgo, em Tóquio.',
    highlight: 'Tricampeão da Libertadores (1983, 1995 e 2017).' },
  { id: 'int', name: 'Internacional', abbr: 'INT', rarity: 'rara', colors: ['#D50E1C', '#FFFFFF'], pattern: 'solid',
    full: 'Sport Club Internacional', city: 'Porto Alegre · RS', founded: 1909, stadium: 'Beira-Rio', nickname: 'Colorado', mascot: 'Saci',
    fact: 'É o único clube a conquistar o Campeonato Brasileiro de forma invicta, em 1979.',
    highlight: 'Campeão mundial em 2006, vencendo o Barcelona na final.' },
  { id: 'vas', name: 'Vasco', abbr: 'VAS', rarity: 'rara', colors: ['#141414', '#FFFFFF', '#E2231A'], pattern: 'sash',
    full: 'Club de Regatas Vasco da Gama', city: 'Rio de Janeiro · RJ', founded: 1898, stadium: 'São Januário', nickname: 'Gigante da Colina', mascot: 'Almirante',
    fact: 'Com a "Resposta Histórica" de 1924, recusou-se a excluir jogadores negros e operários do seu elenco.',
    highlight: 'São Januário foi erguido em 1927 com ajuda da própria torcida.' },
  { id: 'flu', name: 'Fluminense', abbr: 'FLU', rarity: 'rara', colors: ['#8B1E3F', '#0E6B3B', '#FFFFFF'], pattern: 'tri',
    full: 'Fluminense Football Club', city: 'Rio de Janeiro · RJ', founded: 1902, stadium: 'Maracanã', nickname: 'Tricolor', mascot: 'Cartola',
    fact: 'O apelido "Pó de Arroz" vem de 1914, quando um jogador teria entrado em campo com o rosto coberto de pó de arroz.',
    highlight: 'Campeão da Libertadores em 2023.' },
  { id: 'bah', name: 'Bahia', abbr: 'BAH', rarity: 'comum', colors: ['#1C55B0', '#E3262E', '#FFFFFF'], pattern: 'tri',
    full: 'Esporte Clube Bahia', city: 'Salvador · BA', founded: 1931, stadium: 'Arena Fonte Nova', nickname: 'Esquadrão de Aço', mascot: 'Super-Homem',
    fact: 'Foi o primeiro campeão brasileiro: venceu a Taça Brasil de 1959 derrotando o Santos de Pelé na final.',
    highlight: 'Bicampeão brasileiro (1959 e 1988).' },
  { id: 'rbb', name: 'Bragantino', abbr: 'RBB', rarity: 'comum', colors: ['#FFFFFF', '#E4002B', '#0A1A3F'], pattern: 'band',
    full: 'Red Bull Bragantino', city: 'Bragança Paulista · SP', founded: 1928, stadium: 'Nabi Abi Chedid', nickname: 'Massa Bruta', mascot: 'Touro',
    fact: 'Foi vice-campeão brasileiro em 1991 e, em 2019, passou a se chamar Red Bull Bragantino.',
    highlight: 'Vice-campeão da Copa Sul-Americana em 2021.' },
  { id: 'mir', name: 'Mirassol', abbr: 'MIR', rarity: 'comum', colors: ['#F2C200', '#0B7A3B'], pattern: 'halves',
    full: 'Mirassol Futebol Clube', city: 'Mirassol · SP', founded: 1925, stadium: 'José Maria de Campos Maia', nickname: 'Leão', mascot: 'Leão',
    fact: 'Estreou na Série A em 2025 e, logo de cara, garantiu uma vaga inédita na Libertadores de 2026.',
    highlight: 'Sensação do Brasileirão 2025 em sua primeira participação na elite.' },
  { id: 'vit', name: 'Vitória', abbr: 'VIT', rarity: 'comum', colors: ['#D6111A', '#141414'], pattern: 'hoops',
    full: 'Esporte Clube Vitória', city: 'Salvador · BA', founded: 1899, stadium: 'Barradão', nickname: 'Leão da Barra', mascot: 'Leão',
    fact: 'Um dos clubes mais antigos do Nordeste, chegou à final do Campeonato Brasileiro em 1993.',
    highlight: 'Revelou craques como Bebeto, Dida e Vampeta.' },
  { id: 'cfc', name: 'Coritiba', abbr: 'CFC', rarity: 'comum', colors: ['#0B6B3A', '#FFFFFF'], pattern: 'band',
    full: 'Coritiba Foot Ball Club', city: 'Curitiba · PR', founded: 1909, stadium: 'Couto Pereira', nickname: 'Coxa', mascot: 'Vovô Coxa',
    fact: 'Em 2011 entrou para o Guinness Book com uma sequência de 24 vitórias seguidas.',
    highlight: 'Campeão brasileiro em 1985 e campeão da Série B em 2025.' },
  { id: 'cap', name: 'Athletico-PR', abbr: 'CAP', rarity: 'comum', colors: ['#D1121C', '#141414'], pattern: 'stripes',
    full: 'Club Athletico Paranaense', city: 'Curitiba · PR', founded: 1924, stadium: 'Ligga Arena', nickname: 'Furacão', mascot: 'Furacão',
    fact: 'Sua arena tem teto retrátil e gramado sintético, algo raro entre os estádios do país.',
    highlight: 'Campeão brasileiro em 2001 e bicampeão da Sul-Americana (2018 e 2021).' },
  { id: 'cha', name: 'Chapecoense', abbr: 'CHA', rarity: 'comum', colors: ['#0E8A3E', '#FFFFFF'], pattern: 'solid',
    full: 'Associação Chapecoense de Futebol', city: 'Chapecó · SC', founded: 1973, stadium: 'Arena Condá', nickname: 'Verdão do Oeste', mascot: 'Índio Condá',
    fact: 'Campeã da Sul-Americana de 2016, título concedido após a tragédia aérea que comoveu o mundo do futebol.',
    highlight: 'Símbolo mundial de solidariedade e reconstrução.' },
  { id: 'rem', name: 'Remo', abbr: 'REM', rarity: 'comum', colors: ['#0B2A63', '#FFFFFF'], pattern: 'solid',
    full: 'Clube do Remo', city: 'Belém · PA', founded: 1905, stadium: 'Baenão', nickname: 'Leão Azul', mascot: 'Leão',
    fact: 'Volta à Série A em 2026 após 32 anos e recoloca o futebol do Norte na elite depois de 21 anos.',
    highlight: 'Protagonista do Re-Pa, clássico com o Paysandu.' },
];

// ------------------------------------------------------------
//  Coleção 2 — Ídolos (dos mesmos clubes)
// ------------------------------------------------------------
const IDOLS = [
  { id: 'pele', name: 'Pelé', team: 'san', rarity: 'especial', shirt: 10, position: 'Atacante', era: '1956–1974',
    full: 'Edson Arantes do Nascimento',
    highlight: 'Único jogador tricampeão mundial (1958, 1962 e 1970).',
    fact: 'Marcou o milésimo gol da carreira em 1969, de pênalti, no Maracanã, contra o Vasco.' },
  { id: 'zico', name: 'Zico', team: 'fla', rarity: 'especial', shirt: 10, position: 'Meia', era: '1971–1989',
    full: 'Arthur Antunes Coimbra',
    highlight: 'Maior artilheiro da história do Flamengo.',
    fact: 'O "Galinho de Quintino" comandou o Flamengo no título mundial de 1981, contra o Liverpool, em Tóquio.' },
  { id: 'garrincha', name: 'Garrincha', team: 'bot', rarity: 'especial', shirt: 7, position: 'Ponta-direita', era: '1953–1965',
    full: 'Manoel Francisco dos Santos',
    highlight: 'Bicampeão mundial com a Seleção (1958 e 1962).',
    fact: 'Chamado de "Alegria do Povo" e "Anjo de Pernas Tortas", tinha uma perna mais curta que a outra.' },
  { id: 'socrates', name: 'Sócrates', team: 'cor', rarity: 'muito', shirt: 8, position: 'Meia', era: '1978–1984',
    full: 'Sócrates Brasileiro Sampaio de Souza Vieira de Oliveira',
    highlight: 'Líder da Democracia Corinthiana.',
    fact: 'Formado em Medicina, o "Doutor" ficou famoso pelos passes e gols de calcanhar.' },
  { id: 'ceni', name: 'Rogério Ceni', team: 'sao', rarity: 'muito', shirt: 1, position: 'Goleiro', era: '1990–2015',
    full: 'Rogério Mücke Ceni',
    highlight: 'Goleiro com mais gols na história do futebol: 131.',
    fact: 'Disputou mais de 1.200 partidas pelo São Paulo, recorde de jogos por um mesmo clube.' },
  { id: 'dinamite', name: 'Roberto Dinamite', team: 'vas', rarity: 'muito', shirt: 10, position: 'Atacante', era: '1971–1993',
    full: 'Carlos Roberto de Oliveira',
    highlight: 'Maior artilheiro da história do Campeonato Brasileiro.',
    fact: 'Depois de encerrar a carreira, também foi presidente do Vasco.' },
  { id: 'falcao', name: 'Falcão', team: 'int', rarity: 'muito', shirt: 5, position: 'Volante', era: '1973–1980',
    full: 'Paulo Roberto Falcão',
    highlight: 'Tricampeão brasileiro pelo Inter (1975, 1976 e 1979).',
    fact: 'Na Itália ganhou o apelido de "Rei de Roma" ao levar a Roma ao título italiano de 1983.' },
  { id: 'ademir', name: 'Ademir da Guia', team: 'pal', rarity: 'muito', shirt: 10, position: 'Meia', era: '1961–1977',
    full: 'Ademir da Guia',
    highlight: 'Jogador com mais partidas na história do Palmeiras.',
    fact: 'Apelidado de "Divino", é filho de Domingos da Guia, lenda da zaga brasileira.' },
  { id: 'renato', name: 'Renato Gaúcho', team: 'gre', rarity: 'rara', shirt: 7, position: 'Atacante', era: '1980–1986',
    full: 'Renato Portaluppi',
    highlight: 'Dois gols na final do Mundial de 1983 contra o Hamburgo.',
    fact: 'Anos depois, como técnico, levou o Grêmio ao título da Libertadores de 2017.' },
  { id: 'reinaldo', name: 'Reinaldo', team: 'cam', rarity: 'rara', shirt: 9, position: 'Atacante', era: '1973–1985',
    full: 'José Reinaldo de Lima',
    highlight: 'Maior artilheiro da história do Atlético-MG.',
    fact: 'Comemorava os gols com o punho cerrado, gesto que virou símbolo de resistência nos anos 70.' },
  { id: 'tostao', name: 'Tostão', team: 'cru', rarity: 'rara', shirt: 9, position: 'Atacante', era: '1963–1972',
    full: 'Eduardo Gonçalves de Andrade',
    highlight: 'Campeão mundial em 1970 e maior artilheiro da história do Cruzeiro.',
    fact: 'Após encerrar a carreira cedo, formou-se em Medicina e virou colunista esportivo.' },
  { id: 'fred', name: 'Fred', team: 'flu', rarity: 'rara', shirt: 9, position: 'Atacante', era: '2009–2022',
    full: 'Frederico Chaves Guedes',
    highlight: 'Bicampeão brasileiro pelo Fluminense (2010 e 2012).',
    fact: 'Um dos maiores artilheiros da história do Flu, com quase 200 gols pelo clube.' },
  { id: 'bebeto', name: 'Bebeto', team: 'vit', rarity: 'rara', shirt: 7, position: 'Atacante', era: '1982–1983',
    full: 'José Roberto Gama de Oliveira',
    highlight: 'Tetracampeão mundial com a Seleção em 1994.',
    fact: 'Revelado pelo Vitória, eternizou na Copa de 94 a comemoração "embalando o bebê".' },
  { id: 'alex', name: 'Alex', team: 'cfc', rarity: 'rara', shirt: 10, position: 'Meia', era: '1995–2014',
    full: 'Alexsandro de Souza',
    highlight: 'Revelado pelo Coxa, onde também encerrou a carreira.',
    fact: 'Virou ídolo ainda no Palmeiras, no Cruzeiro da Tríplice Coroa e no Fenerbahçe, da Turquia.' },
  { id: 'bobo', name: 'Bobô', team: 'bah', rarity: 'comum', shirt: 8, position: 'Meia', era: '1985–1989',
    full: 'Raimundo Nonato Tavares da Silva',
    highlight: 'Craque do título brasileiro de 1988.',
    fact: 'Comandou o Bahia na decisão contra o Internacional que deu ao clube seu segundo Brasileirão.' },
  { id: 'maurosilva', name: 'Mauro Silva', team: 'rbb', rarity: 'comum', shirt: 5, position: 'Volante', era: '1990–1992',
    full: 'Mauro da Silva Gomes',
    highlight: 'Tetracampeão mundial com a Seleção em 1994.',
    fact: 'Brilhou no Bragantino do início dos anos 90 antes de virar lenda do Deportivo La Coruña.' },
  { id: 'sicupira', name: 'Sicupira', team: 'cap', rarity: 'comum', shirt: 9, position: 'Atacante', era: '1965–1976',
    full: 'Barcímio Sicupira Júnior',
    highlight: 'Maior artilheiro da história do Athletico.',
    fact: 'Seus gols nos anos 60 e 70 fizeram dele a primeira grande lenda do Furacão.' },
  { id: 'ruschel', name: 'Alan Ruschel', team: 'cha', rarity: 'comum', shirt: 6, position: 'Lateral-esquerdo', era: '2016–2019',
    full: 'Alan Luciano Ruschel',
    highlight: 'Sobrevivente da tragédia de 2016.',
    fact: 'Voltou a jogar em 2017 e virou símbolo de superação e da reconstrução da Chape.' },
  { id: 'guanaes', name: 'Rafael Guanaes', team: 'mir', rarity: 'comum', shirt: null, position: 'Técnico', era: '2025–',
    full: 'Rafael Guanaes',
    highlight: 'Levou o estreante Mirassol à sua primeira Libertadores.',
    fact: 'Assumiu o time em março de 2025 e comandou a campanha histórica na estreia do clube na Série A.' },
  { id: 'alcino', name: 'Alcino', team: 'rem', rarity: 'comum', shirt: 9, position: 'Atacante', era: '1970–1978',
    full: 'Alcino Neves dos Santos Filho',
    highlight: 'Considerado o maior ídolo da história do Remo.',
    fact: 'Tricampeão paraense (1973, 1974 e 1975), foi artilheiro nas três edições.' },
];

const TEAM_BY_ID = Object.fromEntries(TEAMS.map(t => [t.id, t]));

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
      teamData: kind === 'idol' ? TEAM_BY_ID[c.team] : c,
    }));
}

export const COLLECTIONS = [
  {
    id: 'serie-a-2026',
    name: 'Série A 2026',
    short: 'Clubes',
    tagline: 'Os 20 clubes da elite do Brasileirão',
    theme: { c1: '#0F4C8A', c2: '#FF8A1F', glow: '#2E9BFF' },
    cards: build('serie-a-2026', 'sa', TEAMS, 'team'),
  },
  {
    id: 'idolos',
    name: 'Ídolos',
    short: 'Ídolos',
    tagline: 'Lendas que marcaram os clubes da Série A',
    theme: { c1: '#3B1670', c2: '#FFC940', glow: '#B866FF' },
    cards: build('idolos', 'id', IDOLS, 'idol'),
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
export const PRIZES = [
  { id: 'sa-25',  collection: 'serie-a-2026', at: 0.25, icon: 'ticket', title: 'Cupom 5% OFF',            desc: 'Em qualquer produto da loja.' },
  { id: 'sa-50',  collection: 'serie-a-2026', at: 0.50, icon: 'ticket', title: 'Cupom 10% OFF',           desc: 'Em camisas de clubes da Série A.' },
  { id: 'sa-75',  collection: 'serie-a-2026', at: 0.75, icon: 'mug',    title: 'Caneca Série A 2026',     desc: 'Caneca exclusiva da coleção.' },
  { id: 'sa-100', collection: 'serie-a-2026', at: 1.00, icon: 'shirt',  title: 'Camisa de clube',         desc: 'Uma camisa de time da Série A à sua escolha.' },
  { id: 'id-25',  collection: 'idolos',       at: 0.25, icon: 'ticket', title: 'Cupom 5% OFF',            desc: 'Em qualquer produto da loja.' },
  { id: 'id-50',  collection: 'idolos',       at: 0.50, icon: 'ticket', title: 'Cupom 15% OFF',           desc: 'Em camisas retrô.' },
  { id: 'id-75',  collection: 'idolos',       at: 0.75, icon: 'mug',    title: 'Caneca Ídolos',           desc: 'Caneca exclusiva da coleção.' },
  { id: 'id-100', collection: 'idolos',       at: 1.00, icon: 'shirt',  title: 'Camisa retrô de um ídolo', desc: 'Camisa retrô personalizada do seu ídolo.' },
  { id: 'master', collection: null,           at: 1.00, icon: 'trophy', title: 'Kit Lendário Versatte',   desc: 'Camisa + caneca + 25% OFF. Para quem completar as duas coleções.' },
];
