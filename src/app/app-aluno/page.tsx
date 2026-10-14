import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Smartphone, FileText, Barcode, Bell, ShieldCheck, Download, Sparkles, GraduationCap } from 'lucide-react';

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
    <div className="min-h-screen bg-[#F4F6FB] flex justify-center py-6 px-3 sm:px-6 antialiased font-sans">
      {/* Container simulando visual mobile-first PWA com cantos arredondados modernos */}
      <div className="w-full max-w-md bg-white min-h-[90vh] shadow-[0_16px_40px_rgba(79,57,246,0.08)] rounded-[32px] flex flex-col border border-slate-100 overflow-hidden">
        {/* Header Mobile do Aluno em Degradê Violeta Tátil */}
        <header className="bg-gradient-to-b from-[#5842BD] via-[#4833A8] to-[#36218A] text-white p-5 sticky top-0 z-10 shadow-md">
          <div className="flex items-center justify-between">
            <Link
              href="/sistema/index.html"
              className="text-xs font-bold text-purple-200 hover:text-white flex items-center bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 shadow-2xs hover:translate-y-[-1px] transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Painel Geral
            </Link>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
              Portal do Formando
            </span>
          </div>

          <div className="mt-4">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black">Olá, {aluno?.nome.split(' ')[0]}! 👋</h1>
            </div>
            <p className="text-xs text-purple-200 mt-0.5">
              {adesao?.cursoNome} &bull; {adesao?.instituicaoNome}
            </p>
            <div className="mt-2.5 inline-block px-3 py-1 bg-white/10 rounded-xl text-xs font-mono font-bold text-emerald-300 border border-white/15 shadow-2xs">
              Código Individual: {adesao?.codigoIndividualAluno}
            </div>
          </div>
        </header>

        {/* Informações do Projeto / Turma */}
        <div className="p-4 bg-[#FAF7FF] border-b border-purple-100 flex items-center justify-between text-xs">
          <div>
            <span className="text-purple-950 font-bold block">{adesao?.projeto.oportunidade.tituloTurma}</span>
            <span className="text-purple-700 text-[11px]">{adesao?.plano.nome}</span>
          </div>
          <span className="text-[#4F39F6] font-extrabold font-mono text-sm bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-2xs">
            R$ {adesao?.valorTotalContratado.toFixed(2)}
          </span>
        </div>

        {/* Abas e Seções do Aluno */}
        <main className="flex-1 p-4 space-y-5 overflow-y-auto bg-[#F4F6FB]/50">
          {/* Seção 1: Boletos Sicredi e Parcelas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center">
                <Barcode className="w-4 h-4 mr-1.5 text-emerald-600" />
                Minhas Parcelas & Boletos
              </h2>
              <span className="text-[10px] font-semibold text-slate-400">Sicredi Digital</span>
            </div>

            <div className="space-y-2.5">
              {adesao?.parcelas.map((parc) => {
                const isPaga = parc.status === 'PAGA';

                return (
                  <div
                    key={parc.id}
                    className="p-3.5 rounded-2xl border border-slate-100 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex items-center justify-between hover:border-slate-200 transition"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-800">
                          Parcela {parc.numero}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            isPaga
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {parc.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Vencimento: {new Date(parc.vencimento).toLocaleDateString('pt-BR')}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-xs text-slate-900">
                        R$ {parc.valor.toFixed(2)}
                      </div>
                      {!isPaga ? (
                        <button className="mt-1 text-[11px] text-[#4F39F6] font-bold hover:underline flex items-center justify-end">
                          <Download className="w-3 h-3 mr-0.5" /> 2ª Via / Pix
                        </button>
                      ) : (
                        <span className="mt-1 text-[10px] font-bold text-emerald-600 block">Liquidado</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Seção 2: Contrato Individual */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-1.5 text-blue-600" />
              Contrato Individual
            </h2>
            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Termo de Adesão & Regulamento
                </span>
                <span className="text-[11px] text-slate-400">
                  Assinatura Digital &bull; {adesao?.codigoIndividualAluno}
                </span>
              </div>
              <button className="px-3 py-1.5 bg-[#4F39F6] hover:bg-[#432CB8] text-white rounded-xl text-xs font-bold shadow-[0_2px_0_0_#3824B0] hover:translate-y-[-1px] active:translate-y-[1px] transition-all">
                Ver PDF
              </button>
            </div>
          </div>

          {/* Seção 3: Avisos da Turma */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center">
              <Bell className="w-4 h-4 mr-1.5 text-amber-600" />
              Comunicados da Formatura
            </h2>
            <div className="p-4 bg-[#FFFBEB] rounded-2xl border border-amber-200 text-xs text-slate-700 space-y-1.5">
              <span className="font-bold text-amber-900 block">
                Plantão de Prova de Becas e Fotos de Convite
              </span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                O plantão presencial ocorrerá no Campus Anália Franco entre os dias 15 e 18 do próximo mês.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
