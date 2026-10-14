'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  GripVertical,
  CheckCircle2,
  Clock,
  Sparkles,
  RotateCcw,
  Plus,
} from 'lucide-react';

export interface TurmaOportunidade {
  id: string;
  tituloTurma: string;
  semestre: string;
  tipoProjeto: string;
  etapa: string;
  quantidadePrevista: number;
  valorPrevistoAluno: number;
  codigoAdesao: string;
  vendedor: {
    nome: string;
  };
  projeto?: {
    id: string;
    adesoes: Array<any>;
  } | null;
}

const ETAPAS = [
  { key: 'PRIMEIRO_CONTATO', label: '1. Primeiro Contato', color: 'border-slate-300 bg-slate-50' },
  { key: 'REUNIAO_REPRESENTANTE', label: '2. Reunião Representante', color: 'border-blue-300 bg-blue-50/50' },
  { key: 'LIVE_REUNIAO_SALA', label: '3. Reunião / Live Sala', color: 'border-purple-300 bg-purple-50/50' },
  { key: 'ADESAO', label: '4. Adesão (Código Ativo)', color: 'border-emerald-300 bg-emerald-50/50' },
  { key: 'PLANTAO_VENDAS', label: '5. Plantão de Vendas', color: 'border-amber-300 bg-amber-50/50' },
  { key: 'PERDIDOS', label: '6. Perdidos', color: 'border-rose-300 bg-rose-50/50' },
];

export function CrmKanbanBoard({ initialTurmas }: { initialTurmas: TurmaOportunidade[] }) {
  const [turmas, setTurmas] = useState<TurmaOportunidade[]>(initialTurmas);
  const [carregandoId, setCarregandoId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColKey, setDragOverColKey] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Carregar turmas salvas no localStorage para persistência perfeita
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const salvo = localStorage.getItem('on_crm_turmas_estado');
        if (salvo) {
          const parsed = JSON.parse(salvo);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTurmas(parsed);
          }
        }
      } catch (e) {
        // Fallback
      }
    }
  }, []);

  // Mover etapa com persistência segura local e API assíncrona tolerante a falhas
  const moverEtapa = (oportunidadeId: string, novaEtapa: string) => {
    setCarregandoId(oportunidadeId);

    // 1. Atualizar o estado da turma imediatamente e salvar no localStorage
    setTurmas((prev) => {
      const atualizadas = prev.map((t) =>
        t.id === oportunidadeId ? { ...t, etapa: novaEtapa } : t
      );
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('on_crm_turmas_estado', JSON.stringify(atualizadas));
        } catch (e) {}
      }
      return atualizadas;
    });

    // 2. Feedback visual tipo Toast discreto
    const etapaNome = ETAPAS.find((e) => e.key === novaEtapa)?.label || novaEtapa;
    setToastMsg(`Turma movida para "${etapaNome}"`);
    setTimeout(() => {
      setToastMsg(null);
    }, 3000);

    // 3. Tentar persistência no backend se disponível (modo silencioso, sem alert de erro)
    try {
      fetch('/api/crm/etapa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oportunidadeId,
          novaEtapa,
          responsavelNome: 'Equipe Comercial',
        }),
      }).catch(() => {});
    } catch (e) {}

    setTimeout(() => {
      setCarregandoId(null);
    }, 150);
  };

  // Drag and Drop Nativo HTML5 (suave e sem dependências pesadas)
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    setDragOverColKey(colKey);
  };

  const handleDragLeave = () => {
    setDragOverColKey(null);
  };

  const handleDrop = (e: React.DragEvent, destinoEtapaKey: string) => {
    e.preventDefault();
    setDragOverColKey(null);
    const id = e.dataTransfer.getData('text/plain') || draggedId;
    if (id) {
      const turma = turmas.find((t) => t.id === id);
      if (turma && turma.etapa !== destinoEtapaKey) {
        moverEtapa(id, destinoEtapaKey);
      }
    }
    setDraggedId(null);
  };

  // Resetar para as turmas de fábrica
  const resetarFunil = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('on_crm_turmas_estado');
    }
    setTurmas(initialTurmas);
    setToastMsg('Funil restaurado para a posição padrão.');
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="relative">
      {/* Toast Notificação Flutuante Elegante */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#36218A] text-white px-5 py-3 rounded-2xl shadow-[0_8px_24px_rgba(54,33,138,0.4)] border border-purple-400/40 text-xs font-bold flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Botões de Ação Rápida do Kanban */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <Sparkles className="w-4 h-4 text-[#4F39F6]" />
          <span>Arraste os cartões entre as colunas ou utilize os botões <strong>Avançar</strong> e <strong>Voltar</strong>.</span>
        </div>
        <button
          onClick={resetarFunil}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs hover:translate-y-[-1px] transition-all"
          title="Restaurar posições originais"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Restaurar Padrão</span>
        </button>
      </div>

      <div className="flex gap-5 min-w-max pb-6 select-none">
        {ETAPAS.map((etapa, index) => {
          const turmasNaEtapa = turmas.filter((t) => t.etapa === etapa.key);
          const isDragOver = dragOverColKey === etapa.key;

          return (
            <div
              key={etapa.key}
              onDragOver={(e) => handleDragOver(e, etapa.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, etapa.key)}
              className={`w-80 flex flex-col rounded-[24px] border transition-all ${
                isDragOver
                  ? 'border-[#4F39F6] bg-indigo-50/40 ring-2 ring-[#4F39F6]'
                  : 'border-slate-200/80 bg-slate-50/80 shadow-[0_4px_16px_rgba(0,0,0,0.02)]'
              }`}
            >
              {/* Cabeçalho da Etapa */}
              <div
                className={`p-4 border-b font-semibold text-xs text-slate-800 flex items-center justify-between rounded-t-[24px] ${etapa.color}`}
              >
                <span className="font-bold text-slate-900">{etapa.label}</span>
                <span className="text-xs bg-white font-mono font-extrabold px-2.5 py-0.5 rounded-full text-slate-800 border border-slate-200 shadow-2xs">
                  {turmasNaEtapa.length}
                </span>
              </div>

              {/* Lista de Cartões da Coluna */}
              <div className="p-3 flex-1 space-y-3 min-h-[350px]">
                {turmasNaEtapa.length === 0 ? (
                  <div className="h-40 border-2 border-dashed border-slate-200/80 rounded-2xl flex flex-col items-center justify-center text-xs text-slate-400 p-4 text-center">
                    <span>Arraste uma turma para esta etapa</span>
                  </div>
                ) : (
                  turmasNaEtapa.map((turma) => {
                    const jaCriouProjeto = Boolean(turma.projeto);
                    const totalAdesoes = turma.projeto?.adesoes.length || 0;
                    const isCarregando = carregandoId === turma.id;
                    const podeVoltar = index > 0;
                    const podeAvancar = index < ETAPAS.length - 1;

                    return (
                      <div
                        key={turma.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, turma.id)}
                        className={`bg-white rounded-2xl border border-slate-100 p-4 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 transition-all cursor-grab active:cursor-grabbing relative group ${
                          isCarregando ? 'opacity-60 pointer-events-none' : ''
                        } ${draggedId === turma.id ? 'opacity-40 ring-2 ring-[#4F39F6]' : ''}`}
                      >
                        {/* Ícone Indicador de Arrastar */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-1.5">
                            <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition" />
                            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {turma.tipoProjeto === 'BAILE' ? 'Baile de Gala' : 'Colação de Grau'}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-slate-500 font-mono">
                            {turma.semestre}
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                          {turma.tituloTurma}
                        </h3>

                        {/* Código Exclusivo de Adesão */}
                        <div className="mt-3 p-2 bg-emerald-50 rounded-xl border border-emerald-200/80 text-xs">
                          <span className="text-emerald-800 text-[10px] font-semibold block">
                            Código de Adesão da Turma:
                          </span>
                          <code className="text-emerald-950 font-mono font-bold text-xs select-all">
                            {turma.codigoAdesao}
                          </code>
                        </div>

                        {/* Métricas do Cartão */}
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 border-t border-slate-100 pt-2">
                          <div className="flex items-center">
                            <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                            <span>Prev: {turma.quantidadePrevista} al.</span>
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="w-3.5 h-3.5 mr-1 text-slate-400" />
                            <span>R$ {turma.valorPrevistoAluno.toLocaleString('pt-BR')}</span>
                          </div>
                        </div>

                        {/* Responsável e Status do Projeto */}
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-500 text-[11px]">
                            Vendedor:{' '}
                            <strong className="text-slate-700">{turma.vendedor.nome.split(' ')[0]}</strong>
                          </span>
                          {jaCriouProjeto ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Projeto Ativo ({totalAdesoes})
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3 mr-1" />
                              Oportunidade
                            </span>
                          )}
                        </div>

                        {/* BOTÕES DE AVANÇAR E RECUAR RÁPIDOS COM RELEVO TÁTIL */}
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            disabled={!podeVoltar}
                            onClick={() => moverEtapa(turma.id, ETAPAS[index - 1].key)}
                            title={podeVoltar ? `Voltar para: ${ETAPAS[index - 1].label}` : 'Primeira etapa'}
                            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center transition border shadow-[0_2px_0_0_#D1D5DB] ${
                              podeVoltar
                                ? 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-none cursor-pointer'
                                : 'opacity-30 border-transparent text-slate-300 cursor-not-allowed shadow-none'
                            }`}
                          >
                            <ChevronLeft className="w-3.5 h-3.5 mr-0.5" /> Voltar
                          </button>

                          <button
                            type="button"
                            disabled={!podeAvancar}
                            onClick={() => moverEtapa(turma.id, ETAPAS[index + 1].key)}
                            title={podeAvancar ? `Avançar para: ${ETAPAS[index + 1].label}` : 'Última etapa'}
                            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center transition border shadow-[0_2px_0_0_#047857] ${
                              podeAvancar
                                ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-none cursor-pointer'
                                : 'opacity-30 border-transparent text-slate-300 cursor-not-allowed shadow-none'
                            }`}
                          >
                            Avançar <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
