import Link from 'next/link';
import {
  GraduationCap,
  Users,
  Kanban,
  BadgePercent,
  CalendarDays,
  FileBarChart2,
  Megaphone,
  Smartphone,
  ShieldCheck,
  Building2,
  Globe,
} from 'lucide-react';

const modulos = [
  {
    titulo: 'CRM de Turmas & Oportunidades',
    descricao: 'Funil comercial por turma em negociação. Converte automaticamente a oportunidade em projeto na 1ª adesão.',
    href: '/crm/index.html',
    icone: Kanban,
    tag: 'Comercial',
    cor: 'border-blue-500 text-blue-600 bg-blue-50',
  },
  {
    titulo: 'Gestão de Projetos & Turmas',
    descricao: 'Controle de bailes e colações, planos, adesões ativas, cálculo de valores previstos vs contratados.',
    href: '/projetos/index.html',
    icone: GraduationCap,
    tag: 'Operacional',
    cor: 'border-emerald-500 text-emerald-600 bg-emerald-50',
  },
  {
    titulo: 'Comissões de Vendedores (Regra 4%)',
    descricao: 'Livro-razão imutável: 4% liberados na 1ª parcela, garantia com 3 parcelas pagas e controle de estornos.',
    href: '/comissoes/index.html',
    icone: BadgePercent,
    tag: 'Prioridade Máxima',
    cor: 'border-amber-500 text-amber-600 bg-amber-50',
  },
  {
    titulo: 'Pesquisa Restrita de Alunos',
    descricao: 'Busca por CPF, nome ou código exclusivo ALU-XXX com isolamento rigoroso de permissões.',
    href: '/alunos/index.html',
    icone: Users,
    tag: 'Administrativo',
    cor: 'border-purple-500 text-purple-600 bg-purple-50',
  },
  {
    titulo: 'Financeiro, Contas a Pagar & Custos',
    descricao: 'Separação estrita de despesas gerais vs custos específicos de projetos (cervejadas, fornecedores).',
    href: '/financeiro/index.html',
    icone: CalendarDays,
    tag: 'Financeiro',
    cor: 'border-indigo-500 text-indigo-600 bg-indigo-50',
  },
  {
    titulo: 'Relatórios & Inadimplência Temporal',
    descricao: 'Visão histórica no fechamento do período vs posição atualizada hoje das pendências.',
    href: '/relatorios/index.html',
    icone: FileBarChart2,
    tag: 'Gerencial',
    cor: 'border-rose-500 text-rose-600 bg-rose-50',
  },
  {
    titulo: 'Campanhas, E-mail & WhatsApp',
    descricao: 'Fila de disparos com ritmo seguro e cancelamento instantâneo se a parcela foi quitada.',
    href: '/campanhas/index.html',
    icone: Megaphone,
    tag: 'Comunicação',
    cor: 'border-cyan-500 text-cyan-600 bg-cyan-50',
  },
  {
    titulo: 'Site Institucional On Agência',
    descricao: 'Landing page oficial com fotos, serviços, captação de orçamentos e direcionamento ao portal.',
    href: '/',
    icone: Globe,
    tag: 'Institucional',
    cor: 'border-fuchsia-500 text-fuchsia-600 bg-fuchsia-50',
  },
];

export default function SistemaPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Corporativo */}
      <header className="bg-slate-900 border-b border-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">SISTEMA DE GESTÃO ON EVENTOS</h1>
              <p className="text-xs text-slate-400">Plataforma Completa de Gestão de Bailes & Colações de Grau</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Ambiente Seguro Ativo
            </span>
            <a
              href="/"
              className="inline-flex items-center px-4 py-2 border border-purple-700/60 rounded-md text-sm font-semibold text-purple-200 bg-purple-950/50 hover:bg-purple-900 transition shadow-xs"
            >
              <Globe className="w-4 h-4 mr-2 text-fuchsia-400" />
              Ver Site Institucional
            </a>
            <a
              href="/app-aluno/index.html"
              className="inline-flex items-center px-4 py-2 border border-slate-700 rounded-md text-sm font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 transition"
            >
              <Smartphone className="w-4 h-4 mr-2 text-teal-400" />
              Abrir App do Aluno
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Visão Geral do Sistema</h2>
          <p className="text-slate-600 mt-1">
            Interface limpa e objetiva para controle operacional, comercial e financeiro.
          </p>
        </div>

        {/* Grade de Módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modulos.map((mod) => {
            const Icon = mod.icone;
            return (
              <a
                key={mod.href}
                href={mod.href}
                className="group relative bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg border ${mod.cor}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {mod.tag}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-emerald-700 transition">
                    {mod.titulo}
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-3">
                    {mod.descricao}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center text-sm font-medium text-emerald-600 group-hover:text-emerald-700">
                  Acessar módulo &rarr;
                </div>
              </a>
            );
          })}
        </div>
      </main>
    </div>
  );
}
