import React from 'react';
import Sidebar from '@/components/Sidebar';
import { AlunosGerenciador } from './alunos-gerenciador';

export const metadata = {
  title: 'Alunos & Formandos | ON Agência de Eventos',
  description: 'Gestão cadastral, importação por Excel e controle de contratos de formandos.',
};

export default function AlunosPage() {
  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col lg:flex-row antialiased font-sans">
      {/* Sidebar Lateral Padrão SaaS */}
      <Sidebar paginaAtiva="alunos" />

      {/* Conteúdo Principal Direito */}
      <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 lg:pl-2">
        <AlunosGerenciador />
      </div>
    </div>
  );
}
