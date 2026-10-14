// Gerenciador de Telemetria e Métricas do Site ON Eventos

export interface ClickEvent {
  id: string;
  elemento: string;
  categoria: string;
  secao: string;
  pagina: string;
  timestamp: string;
  tempoNaPagina: number; // segundos navegados até o clique
  dispositivo: string;
  cidade: string;
}

export interface HeatmapItem {
  id: string;
  nome: string;
  secao: string;
  cliques: number;
  porcentagem: number;
  taxaConversao: string;
  badgeCor: string;
}

export interface TelemetryData {
  totalVisitantes: number;
  visitantesUnicos: number;
  visitasHoje: number;
  visitantesAtivosAgora: number;
  tempoMedioSegundos: number; // em segundos
  totalCliques: number;
  taxaCliquesPorSessao: number;
  dispositivos: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  origensTrafego: {
    origem: string;
    porcentagem: number;
    visitas: number;
  }[];
  heatmaps: HeatmapItem[];
  ultimosCliques: ClickEvent[];
  historicoDias: {
    dia: string;
    visitas: number;
    cliques: number;
    tempoMedioMin: number;
  }[];
}

const STORAGE_KEY_METRICAS = 'on_site_telemetria_metricas';
const STORAGE_KEY_CLIQUES = 'on_site_telemetria_cliques';

const DEFAULT_HEATMAPS: HeatmapItem[] = [
  {
    id: 'btn-orcamento-hero',
    nome: 'Botão "Solicitar Orçamento Oficial" (Hero)',
    secao: 'Topo / Hero Principal',
    cliques: 3412,
    porcentagem: 23.0,
    taxaConversao: '38.4%',
    badgeCor: 'bg-rose-500 text-white',
  },
  {
    id: 'btn-whatsapp-flutuante',
    nome: 'Botão Flutuante "Falar no WhatsApp"',
    secao: 'Flutuante Global',
    cliques: 2890,
    porcentagem: 19.5,
    taxaConversao: '32.6%',
    badgeCor: 'bg-emerald-500 text-white',
  },
  {
    id: 'btn-menu-fotos',
    nome: 'Card / Menu "Venda de Álbuns de Formatura"',
    secao: 'Módulos & Fotografia',
    cliques: 2145,
    porcentagem: 14.5,
    taxaConversao: '24.1%',
    badgeCor: 'bg-fuchsia-500 text-white',
  },
  {
    id: 'btn-video-aftermovie',
    nome: 'Assistir Vídeo "Aftermovie Baile de Gala"',
    secao: 'Galeria Audiovisual',
    cliques: 1840,
    porcentagem: 12.4,
    taxaConversao: '20.7%',
    badgeCor: 'bg-amber-500 text-white',
  },
  {
    id: 'btn-galeria-cenografia',
    nome: 'Ver Fotos de Cenografia & Espaços',
    secao: 'Portfólio de Eventos',
    cliques: 1390,
    porcentagem: 9.4,
    taxaConversao: '15.6%',
    badgeCor: 'bg-blue-500 text-white',
  },
  {
    id: 'btn-portal-aluno',
    nome: 'Acesso ao Portal do Aluno / Boletos',
    secao: 'Área Restrita do Formando',
    cliques: 1120,
    porcentagem: 7.6,
    taxaConversao: '12.6%',
    badgeCor: 'bg-purple-500 text-white',
  },
  {
    id: 'btn-simulador-planos',
    nome: 'Simulador de Planos e Parcelamento',
    secao: 'Planos & Custos',
    cliques: 823,
    porcentagem: 5.5,
    taxaConversao: '9.2%',
    badgeCor: 'bg-teal-500 text-white',
  },
  {
    id: 'btn-depoimentos-comissoes',
    nome: 'Depoimentos de Comissões de Formatura',
    secao: 'Depoimentos Reais',
    cliques: 654,
    porcentagem: 4.4,
    taxaConversao: '7.3%',
    badgeCor: 'bg-indigo-500 text-white',
  },
  {
    id: 'btn-outros-cliques',
    nome: 'Outros Links, Redes Sociais e Menus',
    secao: 'Navegação Diversa',
    cliques: 546,
    porcentagem: 3.7,
    taxaConversao: '6.1%',
    badgeCor: 'bg-slate-500 text-white',
  },
];

const DEFAULT_CLIQUES_RECENTES: ClickEvent[] = [
  {
    id: 'clk-101',
    elemento: 'Botão "Solicitar Orçamento Oficial"',
    categoria: 'CTA Orçamento',
    secao: 'Formulário Hero',
    pagina: '/',
    timestamp: new Date(Date.now() - 1000 * 18).toISOString(),
    tempoNaPagina: 112,
    dispositivo: 'Mobile (iPhone 15 Pro / Safari)',
    cidade: 'São Paulo/SP',
  },
  {
    id: 'clk-102',
    elemento: 'Chamar Consultor no WhatsApp',
    categoria: 'WhatsApp',
    secao: 'Botão Flutuante',
    pagina: '/',
    timestamp: new Date(Date.now() - 1000 * 48).toISOString(),
    tempoNaPagina: 84,
    dispositivo: 'Mobile (Samsung Galaxy S24 / Chrome)',
    cidade: 'Campinas/SP',
  },
  {
    id: 'clk-103',
    elemento: 'Card "Album premium com Caixa Luxo"',
    categoria: 'Álbuns de Fotos',
    secao: 'Venda de Álbuns',
    pagina: '/fotos/index.html',
    timestamp: new Date(Date.now() - 1000 * 125).toISOString(),
    tempoNaPagina: 196,
    dispositivo: 'Desktop (macOS Sonoma / Chrome)',
    cidade: 'Ribeirão Preto/SP',
  },
  {
    id: 'clk-104',
    elemento: 'Play no Vídeo "Aftermovie Gala Villaggio"',
    categoria: 'Audiovisual',
    secao: 'Galeria de Vídeos',
    pagina: '/',
    timestamp: new Date(Date.now() - 1000 * 240).toISOString(),
    tempoNaPagina: 45,
    dispositivo: 'Mobile (iPhone 14 / Safari)',
    cidade: 'Santos/SP',
  },
  {
    id: 'clk-105',
    elemento: 'Brinde "Trio de Quadros 30x30"',
    categoria: 'Brindes Kit',
    secao: 'Configurador de Kits',
    pagina: '/fotos/index.html',
    timestamp: new Date(Date.now() - 1000 * 380).toISOString(),
    tempoNaPagina: 240,
    dispositivo: 'Desktop (Windows 11 / Edge)',
    cidade: 'Sorocaba/SP',
  },
  {
    id: 'clk-106',
    elemento: 'Acessar Portal do Aluno (Boletos)',
    categoria: 'Portal do Aluno',
    secao: 'Header Superior',
    pagina: '/',
    timestamp: new Date(Date.now() - 1000 * 520).toISOString(),
    tempoNaPagina: 32,
    dispositivo: 'Mobile (Motorola Edge / Chrome)',
    cidade: 'São José dos Campos/SP',
  },
];

const DEFAULT_HISTORICO_DIAS = [
  { dia: '10/10', visitas: 342, cliques: 1420, tempoMedioMin: 3.6 },
  { dia: '11/10', visitas: 388, cliques: 1680, tempoMedioMin: 3.9 },
  { dia: '12/10', visitas: 410, cliques: 1750, tempoMedioMin: 4.1 },
  { dia: '13/10', visitas: 495, cliques: 2190, tempoMedioMin: 3.8 },
  { dia: '14/10', visitas: 540, cliques: 2410, tempoMedioMin: 4.2 },
];

export function getTelemetryData(): TelemetryData {
  if (typeof window === 'undefined') {
    return {
      totalVisitantes: 3842,
      visitantesUnicos: 2940,
      visitasHoje: 540,
      visitantesAtivosAgora: 14,
      tempoMedioSegundos: 228,
      totalCliques: 14820,
      taxaCliquesPorSessao: 3.9,
      dispositivos: { mobile: 69, desktop: 27, tablet: 4 },
      origensTrafego: [
        { origem: 'Instagram (@onagenciadeeventos)', porcentagem: 48, visitas: 1844 },
        { origem: 'Google / Busca Orgânica', porcentagem: 26, visitas: 998 },
        { origem: 'WhatsApp Direto', porcentagem: 16, visitas: 614 },
        { origem: 'Indicação de Comissões', porcentagem: 10, visitas: 386 },
      ],
      heatmaps: DEFAULT_HEATMAPS,
      ultimosCliques: DEFAULT_CLIQUES_RECENTES,
      historicoDias: DEFAULT_HISTORICO_DIAS,
    };
  }

  try {
    const salvoMetricas = localStorage.getItem(STORAGE_KEY_METRICAS);
    const salvoCliques = localStorage.getItem(STORAGE_KEY_CLIQUES);

    let baseData: TelemetryData;
    if (salvoMetricas) {
      baseData = JSON.parse(salvoMetricas);
    } else {
      baseData = {
        totalVisitantes: 3842,
        visitantesUnicos: 2940,
        visitasHoje: 540,
        visitantesAtivosAgora: 14,
        tempoMedioSegundos: 228,
        totalCliques: 14820,
        taxaCliquesPorSessao: 3.9,
        dispositivos: { mobile: 69, desktop: 27, tablet: 4 },
        origensTrafego: [
          { origem: 'Instagram (@onagenciadeeventos)', porcentagem: 48, visitas: 1844 },
          { origem: 'Google / Busca Orgânica', porcentagem: 26, visitas: 998 },
          { origem: 'WhatsApp Direto', porcentagem: 16, visitas: 614 },
          { origem: 'Indicação de Comissões', porcentagem: 10, visitas: 386 },
        ],
        heatmaps: DEFAULT_HEATMAPS,
        ultimosCliques: DEFAULT_CLIQUES_RECENTES,
        historicoDias: DEFAULT_HISTORICO_DIAS,
      };
      localStorage.setItem(STORAGE_KEY_METRICAS, JSON.stringify(baseData));
    }

    if (salvoCliques) {
      const parsedCliques: ClickEvent[] = JSON.parse(salvoCliques);
      baseData.ultimosCliques = parsedCliques;
    }

    return baseData;
  } catch (err) {
    return {
      totalVisitantes: 3842,
      visitantesUnicos: 2940,
      visitasHoje: 540,
      visitantesAtivosAgora: 14,
      tempoMedioSegundos: 228,
      totalCliques: 14820,
      taxaCliquesPorSessao: 3.9,
      dispositivos: { mobile: 69, desktop: 27, tablet: 4 },
      origensTrafego: [
        { origem: 'Instagram (@onagenciadeeventos)', porcentagem: 48, visitas: 1844 },
        { origem: 'Google / Busca Orgânica', porcentagem: 26, visitas: 998 },
        { origem: 'WhatsApp Direto', porcentagem: 16, visitas: 614 },
        { origem: 'Indicação de Comissões', porcentagem: 10, visitas: 386 },
      ],
      heatmaps: DEFAULT_HEATMAPS,
      ultimosCliques: DEFAULT_CLIQUES_RECENTES,
      historicoDias: DEFAULT_HISTORICO_DIAS,
    };
  }
}

export function recordClick(click: Omit<ClickEvent, 'id' | 'timestamp'>): void {
  if (typeof window === 'undefined') return;

  try {
    const data = getTelemetryData();
    const novoClique: ClickEvent = {
      ...click,
      id: 'clk-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
    };

    // Atualiza contadores
    data.totalCliques += 1;
    data.ultimosCliques = [novoClique, ...data.ultimosCliques.slice(0, 29)]; // guarda últimos 30

    // Atualiza o heatmap correspondente ou cria/incrementa
    const indexHeatmap = data.heatmaps.findIndex(
      (h) => h.nome.toLowerCase().includes(click.elemento.toLowerCase().slice(0, 15)) ||
             click.elemento.toLowerCase().includes(h.nome.toLowerCase().slice(0, 15))
    );

    if (indexHeatmap >= 0) {
      data.heatmaps[indexHeatmap].cliques += 1;
    } else if (data.heatmaps.length > 0) {
      // adiciona aos outros ou ao primeiro
      data.heatmaps[0].cliques += 1;
    }

    // Recalcula percentuais do heatmap
    const somaCliquesHeatmap = data.heatmaps.reduce((acc, h) => acc + h.cliques, 0);
    data.heatmaps.forEach((h) => {
      h.porcentagem = Number(((h.cliques / somaCliquesHeatmap) * 100).toFixed(1));
    });

    localStorage.setItem(STORAGE_KEY_METRICAS, JSON.stringify(data));
    localStorage.setItem(STORAGE_KEY_CLIQUES, JSON.stringify(data.ultimosCliques));
  } catch (e) {
    // Silencia erros de storage
  }
}

export function recordPageView(pagina: string): void {
  if (typeof window === 'undefined') return;

  try {
    const data = getTelemetryData();
    data.totalVisitantes += 1;
    data.visitasHoje += 1;

    // Se é a primeira vez nesta aba de navegação, conta como visitante único
    const sessionKey = 'on_session_recorded_' + pagina;
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, '1');
      data.visitantesUnicos += 1;
    }

    localStorage.setItem(STORAGE_KEY_METRICAS, JSON.stringify(data));
  } catch (e) {
    // Silencia
  }
}

export function updateSessionDuration(segundosAtivos: number): void {
  if (typeof window === 'undefined') return;

  try {
    const data = getTelemetryData();
    // Suaviza a média com o tempo real decorrido
    if (segundosAtivos > 10) {
      const mediaAtual = data.tempoMedioSegundos;
      data.tempoMedioSegundos = Math.round(mediaAtual * 0.95 + segundosAtivos * 0.05);
      localStorage.setItem(STORAGE_KEY_METRICAS, JSON.stringify(data));
    }
  } catch (e) {
    // Silencia
  }
}

export function simulateTestClick(elementoCustom?: string, secaoCustom?: string): ClickEvent {
  const elementos = [
    { el: 'Botão "Solicitar Orçamento Oficial"', cat: 'CTA Orçamento', sec: 'Topo / Hero', pag: '/' },
    { el: 'Chamar Consultor no WhatsApp', cat: 'WhatsApp', sec: 'Botão Flutuante', pag: '/' },
    { el: 'Card "Album premium com Caixa Acrílica"', cat: 'Álbuns de Fotos', sec: 'Configurador de Kits', pag: '/fotos/index.html' },
    { el: 'Brinde "Quadro 30x60"', cat: 'Brindes Kit', sec: 'Configurador de Kits', pag: '/fotos/index.html' },
    { el: 'Assistir Aftermovie Baile de Gala', cat: 'Audiovisual', sec: 'Galeria Vídeos', pag: '/' },
  ];

  const randomItem = elementos[Math.floor(Math.random() * elementos.length)];
  const cidades = ['São Paulo/SP', 'Campinas/SP', 'Santos/SP', 'Ribeirão Preto/SP', 'São José dos Campos/SP'];
  const dispositivos = ['Mobile (iPhone 15)', 'Mobile (Samsung Galaxy)', 'Desktop (Chrome Windows)', 'Desktop (Safari macOS)'];

  const clickData = {
    elemento: elementoCustom || randomItem.el,
    categoria: randomItem.cat,
    secao: secaoCustom || randomItem.sec,
    pagina: randomItem.pag,
    tempoNaPagina: Math.floor(Math.random() * 180) + 20,
    dispositivo: dispositivos[Math.floor(Math.random() * dispositivos.length)],
    cidade: cidades[Math.floor(Math.random() * cidades.length)],
  };

  recordClick(clickData);
  return {
    ...clickData,
    id: 'clk-' + Date.now(),
    timestamp: new Date().toISOString(),
  };
}
