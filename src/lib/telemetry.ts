// Gerenciador de Telemetria e Métricas do Site ON Eventos - DADOS 100% REAIS

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
  tempoMedioSegundos: number;
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

// Chaves de armazenamento versionadas para limpar instantaneamente dados fictícios anteriores
const STORAGE_KEY_METRICAS = 'on_site_telemetria_v3_metricas';
const STORAGE_KEY_CLIQUES = 'on_site_telemetria_v3_cliques';

export const HEATMAPS_BASE_ZERADOS: HeatmapItem[] = [
  {
    id: 'btn-orcamento-hero',
    nome: 'Botão "Solicitar Orçamento Oficial" (Hero)',
    secao: 'Topo / Hero Principal',
    cliques: 0,
    porcentagem: 0,
    taxaConversao: '0%',
    badgeCor: 'bg-rose-500 text-white',
  },
  {
    id: 'btn-whatsapp-flutuante',
    nome: 'Botão Flutuante "Falar no WhatsApp"',
    secao: 'Flutuante Global',
    cliques: 0,
    porcentagem: 0,
    taxaConversao: '0%',
    badgeCor: 'bg-emerald-500 text-white',
  },
  {
    id: 'btn-menu-fotos',
    nome: 'Card / Menu "Venda de Álbuns de Formatura"',
    secao: 'Módulos & Fotografia',
    cliques: 0,
    porcentagem: 0,
    taxaConversao: '0%',
    badgeCor: 'bg-fuchsia-500 text-white',
  },
  {
    id: 'btn-video-aftermovie',
    nome: 'Assistir Vídeo "Aftermovie Baile de Gala"',
    secao: 'Galeria Audiovisual',
    cliques: 0,
    porcentagem: 0,
    taxaConversao: '0%',
    badgeCor: 'bg-amber-500 text-white',
  },
  {
    id: 'btn-galeria-cenografia',
    nome: 'Ver Fotos de Cenografia & Espaços',
    secao: 'Portfólio de Eventos',
    cliques: 0,
    porcentagem: 0,
    taxaConversao: '0%',
    badgeCor: 'bg-blue-500 text-white',
  },
  {
    id: 'btn-portal-aluno',
    nome: 'Acesso ao Portal do Aluno / Boletos',
    secao: 'Área Restrita do Formando',
    cliques: 0,
    porcentagem: 0,
    taxaConversao: '0%',
    badgeCor: 'bg-purple-500 text-white',
  },
  {
    id: 'btn-simulador-planos',
    nome: 'Simulador de Planos e Parcelamento',
    secao: 'Planos & Custos',
    cliques: 0,
    porcentagem: 0,
    taxaConversao: '0%',
    badgeCor: 'bg-teal-500 text-white',
  },
  {
    id: 'btn-depoimentos-comissoes',
    nome: 'Depoimentos de Comissões de Formatura',
    secao: 'Depoimentos Reais',
    cliques: 0,
    porcentagem: 0,
    taxaConversao: '0%',
    badgeCor: 'bg-indigo-500 text-white',
  },
  {
    id: 'btn-outros-cliques',
    nome: 'Outros Links, Redes Sociais e Menus',
    secao: 'Navegação Diversa',
    cliques: 0,
    porcentagem: 0,
    taxaConversao: '0%',
    badgeCor: 'bg-slate-500 text-white',
  },
];

export const METRICAS_ZERADAS: TelemetryData = {
  totalVisitantes: 0,
  visitantesUnicos: 0,
  visitasHoje: 0,
  visitantesAtivosAgora: 1,
  tempoMedioSegundos: 0,
  totalCliques: 0,
  taxaCliquesPorSessao: 0,
  dispositivos: { mobile: 0, desktop: 0, tablet: 0 },
  origensTrafego: [
    { origem: 'Instagram (@onagenciadeeventos)', porcentagem: 0, visitas: 0 },
    { origem: 'Google / Busca Orgânica', porcentagem: 0, visitas: 0 },
    { origem: 'WhatsApp Direto', porcentagem: 0, visitas: 0 },
    { origem: 'Indicação de Comissões', porcentagem: 0, visitas: 0 },
    { origem: 'Acesso Direto ao Site', porcentagem: 0, visitas: 0 },
  ],
  heatmaps: HEATMAPS_BASE_ZERADOS,
  ultimosCliques: [],
  historicoDias: [],
};

export function zerarMetricas(): TelemetryData {
  if (typeof window !== 'undefined') {
    try {
      // Limpa dados legados e atuais
      localStorage.removeItem('on_site_telemetria_metricas');
      localStorage.removeItem('on_site_telemetria_cliques');
      localStorage.removeItem(STORAGE_KEY_METRICAS);
      localStorage.removeItem(STORAGE_KEY_CLIQUES);

      // Limpa chaves de sessões gravadas
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('on_session_recorded_')) {
          sessionStorage.removeItem(key);
        }
      });

      const novoEstado = { ...METRICAS_ZERADAS, heatmaps: JSON.parse(JSON.stringify(HEATMAPS_BASE_ZERADOS)) };
      localStorage.setItem(STORAGE_KEY_METRICAS, JSON.stringify(novoEstado));
      localStorage.setItem(STORAGE_KEY_CLIQUES, JSON.stringify([]));
      return novoEstado;
    } catch (e) {
      console.error('Erro ao zerar métricas:', e);
    }
  }
  return METRICAS_ZERADAS;
}

export function getTelemetryData(): TelemetryData {
  if (typeof window === 'undefined') {
    return METRICAS_ZERADAS;
  }

  try {
    // Se ainda existirem chaves antigas com dados fictícios, remove imediatamente
    if (localStorage.getItem('on_site_telemetria_metricas')) {
      localStorage.removeItem('on_site_telemetria_metricas');
      localStorage.removeItem('on_site_telemetria_cliques');
    }

    const salvoMetricas = localStorage.getItem(STORAGE_KEY_METRICAS);
    const salvoCliques = localStorage.getItem(STORAGE_KEY_CLIQUES);

    let baseData: TelemetryData;
    if (salvoMetricas) {
      baseData = JSON.parse(salvoMetricas);
    } else {
      baseData = {
        ...METRICAS_ZERADAS,
        heatmaps: JSON.parse(JSON.stringify(HEATMAPS_BASE_ZERADOS)),
      };
      localStorage.setItem(STORAGE_KEY_METRICAS, JSON.stringify(baseData));
    }

    if (salvoCliques) {
      const parsedCliques: ClickEvent[] = JSON.parse(salvoCliques);
      baseData.ultimosCliques = parsedCliques;
    } else {
      baseData.ultimosCliques = [];
    }

    return baseData;
  } catch (err) {
    return METRICAS_ZERADAS;
  }
}

export function recordClick(click: Omit<ClickEvent, 'id' | 'timestamp'>): void {
  if (typeof window === 'undefined') return;

  // Garante que só mede interações do Site Oficial Público
  const pathname = window.location.pathname || '/';
  if (pathname !== '/' && pathname !== '/site/' && pathname !== '/site') {
    return;
  }

  try {
    const data = getTelemetryData();
    const novoClique: ClickEvent = {
      ...click,
      id: 'clk-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
    };

    // Incrementa contadores reais
    data.totalCliques += 1;
    data.ultimosCliques = [novoClique, ...data.ultimosCliques.slice(0, 49)]; // salva até os últimos 50 cliques

    // Atualiza heatmap correspondente
    const termo = click.elemento.toLowerCase();
    const indexHeatmap = data.heatmaps.findIndex(
      (h) => h.nome.toLowerCase().includes(termo.slice(0, 15)) ||
             termo.includes(h.nome.toLowerCase().slice(0, 15))
    );

    if (indexHeatmap >= 0) {
      data.heatmaps[indexHeatmap].cliques += 1;
    } else {
      // Procura categoria
      if (click.categoria.includes('Orçamento')) {
        data.heatmaps[0].cliques += 1;
      } else if (click.categoria.includes('WhatsApp')) {
        data.heatmaps[1].cliques += 1;
      } else if (click.categoria.includes('Álbuns')) {
        data.heatmaps[2].cliques += 1;
      } else if (click.categoria.includes('Audiovisual')) {
        data.heatmaps[3].cliques += 1;
      } else {
        data.heatmaps[data.heatmaps.length - 1].cliques += 1;
      }
    }

    // Recalcula percentuais do heatmap
    const somaCliquesHeatmap = data.heatmaps.reduce((acc, h) => acc + h.cliques, 0);
    if (somaCliquesHeatmap > 0) {
      data.heatmaps.forEach((h) => {
        h.porcentagem = Number(((h.cliques / somaCliquesHeatmap) * 100).toFixed(1));
        h.taxaConversao = `${Number(((h.cliques / Math.max(1, data.totalVisitantes)) * 100).toFixed(1))}%`;
      });
    }

    // Média de cliques por visitante
    data.taxaCliquesPorSessao = Number(
      (data.totalCliques / Math.max(1, data.totalVisitantes)).toFixed(1)
    );

    localStorage.setItem(STORAGE_KEY_METRICAS, JSON.stringify(data));
    localStorage.setItem(STORAGE_KEY_CLIQUES, JSON.stringify(data.ultimosCliques));
  } catch (e) {
    // Silencia
  }
}

export function recordPageView(pagina: string): void {
  if (typeof window === 'undefined') return;

  // Garante que só mede acessos do Site Oficial Público
  const pathname = window.location.pathname || '/';
  if (pathname !== '/' && pathname !== '/site/' && pathname !== '/site') {
    return;
  }

  try {
    const data = getTelemetryData();
    data.totalVisitantes += 1;
    data.visitasHoje += 1;

    // Detecta dispositivo real
    const largura = window.innerWidth;
    if (largura < 768) {
      data.dispositivos.mobile += 1;
    } else if (largura < 1024) {
      data.dispositivos.tablet += 1;
    } else {
      data.dispositivos.desktop += 1;
    }

    // Se é a primeira vez nesta aba de navegação, conta como visitante único
    const sessionKey = 'on_session_recorded_' + pagina;
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, '1');
      data.visitantesUnicos += 1;

      // Detecta origem real do tráfego através de document.referrer
      const ref = (document.referrer || '').toLowerCase();
      if (ref.includes('instagram')) {
        data.origensTrafego[0].visitas += 1;
      } else if (ref.includes('google')) {
        data.origensTrafego[1].visitas += 1;
      } else if (ref.includes('whatsapp') || ref.includes('wa.me')) {
        data.origensTrafego[2].visitas += 1;
      } else {
        data.origensTrafego[4].visitas += 1;
      }

      // Recalcula porcentagens de origens
      const totalOrigens = data.origensTrafego.reduce((acc, o) => acc + o.visitas, 0);
      if (totalOrigens > 0) {
        data.origensTrafego.forEach((o) => {
          o.porcentagem = Math.round((o.visitas / totalOrigens) * 100);
        });
      }
    }

    // Recalcula taxa de cliques
    data.taxaCliquesPorSessao = Number(
      (data.totalCliques / Math.max(1, data.totalVisitantes)).toFixed(1)
    );

    localStorage.setItem(STORAGE_KEY_METRICAS, JSON.stringify(data));
  } catch (e) {
    // Silencia
  }
}

export function updateSessionDuration(segundosAtivos: number): void {
  if (typeof window === 'undefined') return;

  try {
    const data = getTelemetryData();
    if (segundosAtivos > 3) {
      if (data.tempoMedioSegundos === 0) {
        data.tempoMedioSegundos = segundosAtivos;
      } else {
        data.tempoMedioSegundos = Math.round(data.tempoMedioSegundos * 0.9 + segundosAtivos * 0.1);
      }
      localStorage.setItem(STORAGE_KEY_METRICAS, JSON.stringify(data));
    }
  } catch (e) {
    // Silencia
  }
}

export function simulateTestClick(elementoCustom?: string, secaoCustom?: string): ClickEvent {
  const elementos = [
    { el: 'Botão "Solicitar Orçamento Oficial"', cat: 'CTA Orçamento', sec: 'Topo / Hero Principal', pag: '/' },
    { el: 'Botão Flutuante "Falar no WhatsApp"', cat: 'WhatsApp', sec: 'Flutuante Global', pag: '/' },
    { el: 'Card / Menu "Venda de Álbuns de Formatura"', cat: 'Álbuns & Kits', sec: 'Módulos & Fotografia', pag: '/fotos/index.html' },
    { el: 'Assistir Vídeo "Aftermovie Baile de Gala"', cat: 'Audiovisual', sec: 'Galeria Audiovisual', pag: '/' },
    { el: 'Ver Fotos de Cenografia & Espaços', cat: 'Navegação Geral', sec: 'Portfólio de Eventos', pag: '/' },
  ];

  const randomItem = elementos[Math.floor(Math.random() * elementos.length)];
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const clickData = {
    elemento: elementoCustom || randomItem.el,
    categoria: randomItem.cat,
    secao: secaoCustom || randomItem.sec,
    pagina: randomItem.pag,
    tempoNaPagina: Math.floor(Math.random() * 60) + 10,
    dispositivo: isMobile ? 'Mobile (Smartphone)' : 'Desktop (Computador)',
    cidade: 'São Paulo/SP (Ao Vivo)',
  };

  recordClick(clickData);
  return {
    ...clickData,
    id: 'clk-' + Date.now(),
    timestamp: new Date().toISOString(),
  };
}
