'use client';

import { useEffect, useRef } from 'react';
import { recordPageView, recordClick, updateSessionDuration } from '@/lib/telemetry';

export default function SiteTelemetryTracker() {
  const tempoInicioRef = useRef<number>(Date.now());
  const segundosAtivosRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const pathname = window.location.pathname || '/';

    // 🛑 REGRA DE OURO DE PRECISÃO:
    // O rastreador mede EXCLUSIVAMENTE o Site Oficial Público (visitantes reais da vitrine).
    // NÃO mede páginas internas administrativas (/sistema, /metricas, /usuarios, /crm, /fotos, /login, /financeiro, etc.).
    const isPaginaPublica = pathname === '/' || pathname === '/site/' || pathname === '/site';
    if (!isPaginaPublica) {
      return; // Aborta e não conta cliques nem visitas internas da equipe!
    }

    // 1. Registra a visualização exclusivamente no site público
    recordPageView(pathname);
    try {
      const isUnique = typeof sessionStorage !== 'undefined' && !sessionStorage.getItem('on_session_recorded_' + pathname);
      fetch('/telemetria.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'view',
          pagina: pathname,
          isUnique,
          dispositivo: window.innerWidth < 768 ? 'Mobile (Smartphone)' : window.innerWidth < 1024 ? 'Tablet' : 'Desktop (Computador)',
          tempoNaPagina: 0,
        }),
      }).catch(() => {});
    } catch (err) {}

    // 2. Heartbeat de permanência cronometrada no site público
    const interval = setInterval(() => {
      segundosAtivosRef.current += 3;
      updateSessionDuration(segundosAtivosRef.current);
    }, 3000);

    // 3. Listener de cliques exclusivamente no site público
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const clicavel = target.closest(
        'button, a, input[type="submit"], [data-track], [role="button"], .clicavel-metrica'
      ) as HTMLElement | null;

      if (!clicavel) return;

      const texto =
        clicavel.getAttribute('data-track') ||
        clicavel.getAttribute('title') ||
        clicavel.getAttribute('aria-label') ||
        clicavel.innerText?.trim().replace(/\s+/g, ' ').slice(0, 48) ||
        clicavel.tagName.toLowerCase();

      const secaoElemento = target.closest('section, header, footer, [data-secao]');
      let secaoNome = 'Conteúdo Principal';
      if (secaoElemento) {
        secaoNome =
          secaoElemento.getAttribute('data-secao') ||
          secaoElemento.getAttribute('id') ||
          (secaoElemento.tagName === 'HEADER' ? 'Header Superior' :
           secaoElemento.tagName === 'FOOTER' ? 'Rodapé do Site' : 'Seção Principal');
      }

      const textoLower = texto.toLowerCase();
      let categoria = 'Navegação Geral';
      if (textoLower.includes('orçamento') || textoLower.includes('proposta') || textoLower.includes('quero')) {
        categoria = 'CTA Orçamento';
      } else if (textoLower.includes('whats') || textoLower.includes('zap') || textoLower.includes('conversa')) {
        categoria = 'WhatsApp';
      } else if (textoLower.includes('álbum') || textoLower.includes('album') || textoLower.includes('foto') || textoLower.includes('kit')) {
        categoria = 'Álbuns & Kits';
      } else if (textoLower.includes('vídeo') || textoLower.includes('video') || textoLower.includes('play')) {
        categoria = 'Audiovisual';
      } else if (textoLower.includes('aluno') || textoLower.includes('portal') || textoLower.includes('boleto')) {
        categoria = 'Portal do Aluno';
      }

      const largura = window.innerWidth;
      const isMobile = largura < 768;
      const isTablet = largura >= 768 && largura < 1024;
      const dispositivo = isMobile ? 'Mobile (Smartphone)' : isTablet ? 'Tablet' : 'Desktop (Computador)';

      // Dispara gravação
      recordClick({
        elemento: texto,
        categoria,
        secao: secaoNome,
        pagina: pathname,
        tempoNaPagina: Math.max(1, Math.round((Date.now() - tempoInicioRef.current) / 1000)),
        dispositivo,
        cidade: 'Visitante do Site',
      });

      // Sincroniza em segundo plano com o servidor PHP se disponível
      try {
        fetch('/telemetria.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: 'click',
            elemento: texto,
            categoria,
            secao: secaoNome,
            pagina: pathname,
            tempoNaPagina: Math.max(1, Math.round((Date.now() - tempoInicioRef.current) / 1000)),
            dispositivo,
          }),
        }).catch(() => {});
      } catch (err) {}
    };

    document.addEventListener('click', handleClick, { capture: true });

    return () => {
      clearInterval(interval);
      document.removeEventListener('click', handleClick, { capture: true });
    };
  }, []);

  return null;
}
