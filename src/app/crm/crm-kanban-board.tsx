'use client';

import React, { useState } from 'react';
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

  // Mover etapa via API
  const moverEtapa = async (oportunidadeId: string, novaEtapa: string) => {
    setCarregandoId(oportunidadeId);
    // Atualização otimista
    setTurmas((prev) =>
      prev.map((t) => (t.id === oportunidadeId ? { ...t, etapa: novaEtapa } : t))
    );

    try {
      const res = await fetch('/api/crm/etapa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oportunidadeId,
          novaEtapa,
          responsavelNome: 'Equipe Comercial',
        }),
      });

      if (!res.ok) {
        throw new Error('Falha ao atualizar etapa');
      }
    } catch (err) {
      console.error(err);
      // Reverter em caso de falha
      setTurmas(initialTurmas);
      alert('Não foi possível movimentar o cartão. Tente novamente.');
    } finally {
      setCarregandoId(null);
    }
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

  return (
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
            className={`w-80 flex flex-col rounded-xl border transition-all ${
              isDragOver
                ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-400'
                : 'border-slate-200 bg-slate-50/70 shadow-xs'
            }`}
          >
            {/* Cabeçalho da Etapa */}
            <div
              className={`p-3.5 border-b font-semibold text-xs text-slate-800 flex items-center justify-between rounded-t-xl ${etapa.color}`}
            >
              <span className="font-bold">{etapa.label}</span>
              <span className="text-xs bg-white/90 font-mono font-bold px-2 py-0.5 rounded-full text-slate-700 border border-slate-200 shadow-2xs">
                {turmasNaEtapa.length}
              </span>
            </div>

            {/* Lista de Cartões da Coluna */}
            <div className="p-3 flex-1 space-y-3 min-h-[350px]">
              {turmasNaEtapa.length === 0 ? (
                <div className="h-40 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-xs text-slate-400 p-4 text-center">
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
                      className={`bg-white rounded-lg border border-slate-200 p-4 shadow-xs hover:shadow-md transition cursor-grab active:cursor-grabbing relative group ${
                        isCarregando ? 'opacity-60 pointer-events-none' : ''
                      } ${draggedId === turma.id ? 'opacity-40 ring-2 ring-emerald-500' : ''}`}
                    >
                      {/* Ícone Indicador de Arrastar */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-1.5">
                          <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition" />
                          <span className="text-2xs uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
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
                      <div className="mt-3 p-2 bg-emerald-50/80 rounded border border-emerald-200 text-xs">
                        <span className="text-emerald-800 text-2xs font-semibold block">
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
                        <span className="text-slate-500 text-2xs">
                          Vendedor:{' '}
                          <strong className="text-slate-700">{turma.vendedor.nome.split(' ')[0]}</strong>
                        </span>
                        {jaCriouProjeto ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Projeto Ativo ({totalAdesoes})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3 mr-1" />
                            Oportunidade
                          </span>
                        )}
                      </div>

                      {/* BOTÕES DE AVANÇAR E RECUAR RÁPIDOS */}
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          disabled={!podeVoltar}
                          onClick={() => moverEtapa(turma.id, ETAPAS[index - 1].key)}
                          title={podeVoltar ? `Voltar para: ${ETAPAS[index - 1].label}` : 'Primeira etapa'}
                          className={`flex-1 py-1.5 px-2 rounded text-xs font-semibold flex items-center justify-center transition border ${
                            podeVoltar
                              ? 'border-slate-200 text-slate-600 hover:bg-slate-100 active:scale-95'
                              : 'opacity-30 border-transparent text-slate-300 cursor-not-allowed'
                          }`}
                        >
                          <ChevronLeft className="w-3.5 h-3.5 mr-0.5" /> Voltar
                        </button>

                        <button
                          type="button"
                          disabled={!podeAvancar}
                          onClick={() => moverEtapa(turma.id, ETAPAS[index + 1].key)}
                          title={podeAvancar ? `Avançar para: ${ETAPAS[index + 1].label}` : 'Última etapa'}
                          className={`flex-1 py-1.5 px-2 rounded text-xs font-semibold flex items-center justify-center transition border ${
                            podeAvancar
                              ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-2xs'
                              : 'opacity-30 border-transparent text-slate-300 cursor-not-allowed'
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
  );
}
