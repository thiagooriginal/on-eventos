import type { Metadata } from 'next';
import './globals.css';
import SiteTelemetryTracker from '@/components/SiteTelemetryTracker';

export const metadata: Metadata = {
  title: 'SISTEMA DE GESTÃO ON EVENTOS',
  description: 'Gestão completa de bailes de formatura, colações de grau, CRM, comissões e área do aluno',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <SiteTelemetryTracker />
        {children}
      </body>
    </html>
  );
}
