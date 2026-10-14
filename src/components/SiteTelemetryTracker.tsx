'use client';

import { useEffect, useRef } from 'react';
import { recordPageView, recordClick, updateSessionDuration } from '@/lib/telemetry';

export default function SiteTelemetryTracker() {
  const tempoInicioRef = useRef<number>(Date.now());
  const segundosAtivosRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const pathname = window.location.pathname || '/';

    // 1. Registra a visualização da página atual
    recordPageView(pathname);

    // 2. Timer de heartbeat da sessão ativa (a cada 3s)
    const interval = setInterval(() => {
      segundosAtivosRef.current += 3;
      updateSessionDuration(segundosAtivosRef.current);
    }, 3000);

    // 3. Listener global de cliques com identificação inteligente do elemento
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Procura o elemento clicável mais próximo
      const clicavel = target.closest(
        'button, a, input[type="submit"], [data-track], [role="button"], .clicavel-metrica'
      ) as HTMLElement | null;

      if (!clicavel) return;

      // Obtém texto ou rótulo descritivo do elemento
      const texto =
        clicavel.getAttribute('data-track') ||
        clicavel.getAttribute('title') ||
        clicavel.getAttribute('aria-label') ||
        clicavel.innerText?.trim().replace(/\s+/g, ' ').slice(0, 48) ||
        clicavel.tagName.toLowerCase();

      // Identifica a seção onde o clique ocorreu
      const secaoElemento = target.closest('section, header, footer, [data-secao], aside');
      let secaoNome = 'Conteúdo Geral';
      if (secaoElemento) {
        secaoNome =
          secaoElemento.getAttribute('data-secao') ||
          secaoElemento.getAttribute('id') ||
          (secaoElemento.tagName === 'HEADER' ? 'Header Superior' :
           secaoElemento.tagName === 'FOOTER' ? 'Rodapé do Site' :
           secaoElemento.tagName === 'ASIDE' ? 'Menu Lateral' : 'Seção Principal');
      }

      // Classifica a categoria do elemento
      const textoLower = texto.toLowerCase();
      let categoria = 'Navegação Geral';
      if (textoLower.includes('orçamento') || textoLower.includes('proposta') || textoLower.includes('quero')) {
        categoria = 'CTA Orçamento';
      } else if (textoLower.includes('whats') || textoLower.includes('zap') || textoLower.includes('conversa')) {
        categoria = 'WhatsApp';
      } else if (textoLower.includes('álbum') || textoLower.includes('album') || textoLower.includes('foto') || textoLower.includes('kit') || textoLower.includes('brinde')) {
        categoria = 'Álbuns & Kits';
      } else if (textoLower.includes('vídeo') || textoLower.includes('video') || textoLower.includes('play') || textoLower.includes('assistir')) {
        categoria = 'Audiovisual';
      } else if (textoLower.includes('aluno') || textoLower.includes('boleto') || textoLower.includes('portal')) {
        categoria = 'Portal do Aluno';
      } else if (textoLower.includes('plano') || textoLower.includes('custo') || textoLower.includes('preço')) {
        categoria = 'Planos & Preços';
      }

      // Identifica tipo de dispositivo
      const largura = window.innerWidth;
      const isMobile = largura < 768;
      const isTablet = largura >= 768 && largura < 1024;
      const dispositivo = isMobile ? 'Mobile (Smartphone)' : isTablet ? 'Tablet' : 'Desktop (Computador)';

      // Dispara o registro do clique
      recordClick({
        elemento: texto,
        categoria,
        secao: secaoNome,
        pagina: pathname,
        tempoNaPagina: Math.max(1, Math.round((Date.now() - tempoInicioRef.current) / 1000)),
        dispositivo,
        cidade: 'São Paulo/SP (Ao Vivo)',
      });
    };

    document.addEventListener('click', handleClick, { capture: true });

    // Salva na saída da página
    const handleBeforeUnload = () => {
      updateSessionDuration(segundosAtivosRef.current);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener('click', handleClick, { capture: true });
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return null;
}
