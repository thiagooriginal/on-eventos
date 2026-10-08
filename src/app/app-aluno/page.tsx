import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Smartphone, FileText, Barcode, Bell, ShieldCheck, Download } from 'lucide-react';

export default async function AppAlunoPage() {
  // Simulando a sessão do Aluno autenticado: Carlos Eduardo Silva
  const aluno = await prisma.usuario.findFirst({
    where: { email: 'carlos.aluno@gmail.com' },
    include: {
      adesoesAluno: {
        include: {
          projeto: {
            include: {
              oportunidade: true,
            },
          },
          plano: true,
          parcelas: {
            orderBy: { numero: 'asc' },
          },
        },
      },
    },
  });

  const adesao = aluno?.adesoesAluno[0];

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center">
      {/* Container simulando visual mobile-first PWA */}
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl flex flex-col border-x border-slate-200">
        {/* Header Mobile do Aluno */}
        <header className="bg-slate-900 text-white p-5 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Voltar ao Painel
            </Link>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
              PWA Instalável
            </span>
          </div>

          <div className="mt-4">
            <h1 className="text-lg font-bold">Olá, {aluno?.nome.split(' ')[0]}!</h1>
            <p className="text-xs text-slate-400">
              {adesao?.cursoNome} &bull; {adesao?.instituicaoNome}
            </p>
            <div className="mt-2 inline-block px-2.5 py-1 bg-slate-800 rounded text-xs font-mono text-emerald-400 border border-slate-700">
              Seu Código: {adesao?.codigoIndividualAluno}
            </div>
          </div>
        </header>

        {/* Informações do Projeto / Turma */}
        <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between text-xs">
          <div>
            <span className="text-emerald-800 font-bold block">{adesao?.projeto.oportunidade.tituloTurma}</span>
            <span className="text-emerald-700">{adesao?.plano.nome}</span>
          </div>
          <span className="text-emerald-800 font-bold font-mono text-sm">
            R$ {adesao?.valorTotalContratado.toFixed(2)}
          </span>
        </div>

        {/* Abas e Seções do Aluno */}
        <main className="flex-1 p-4 space-y-6 overflow-y-auto">
          {/* Seção 1: Boletos Sicredi e Parcelas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-800 flex items-center">
                <Barcode className="w-4 h-4 mr-1.5 text-emerald-600" />
                Minhas Parcelas & Boletos
              </h2>
              <span className="text-xs text-slate-500">Cobrança Integrada Sicredi</span>
            </div>

            <div className="space-y-3">
              {adesao?.parcelas.map((parc) => {
                const isPaga = parc.status === 'PAGA';

                return (
                  <div
                    key={parc.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-700">
                          Parcela {parc.numero}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-semibold ${
                            isPaga
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {parc.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Vencimento: {new Date(parc.vencimento).toLocaleDateString('pt-BR')}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-sm text-slate-900">
                        R$ {parc.valor.toFixed(2)}
                      </div>
                      {!isPaga ? (
                        <button className="mt-1 text-xs text-emerald-600 font-semibold hover:underline flex items-center justify-end">
                          <Download className="w-3 h-3 mr-0.5" /> 2ª Via / Pix
                        </button>
                      ) : (
                        <span className="mt-1 text-xs text-slate-400 block">Liquidado</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Seção 2: Contrato Individual */}
          <div>
            <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
              <FileText className="w-4 h-4 mr-1.5 text-blue-600" />
              Contrato Individual de Adesão
            </h2>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  Termo de Adesão e Regulamento
                </span>
                <span className="text-xs text-slate-500">
                  Assinado digitalmente &bull; Código {adesao?.codigoIndividualAluno}
                </span>
              </div>
              <button className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 transition">
                Visualizar PDF
              </button>
            </div>
          </div>

          {/* Seção 3: Avisos da Turma */}
          <div>
            <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
              <Bell className="w-4 h-4 mr-1.5 text-amber-600" />
              Comunicados da Formatura
            </h2>
            <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 text-xs text-slate-700 space-y-2">
              <span className="font-bold text-amber-900 block">
                Plantão de Prova de Becas e Fotos de Convite
              </span>
              <p>
                O plantão presencial ocorrerá no Campus Anália Franco entre os dias 15 e 18 do próximo mês.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
