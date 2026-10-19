'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Barcode,
  CheckCircle2,
  RotateCcw,
  Copy,
  Check,
  Printer,
  Sparkles,
  Download,
  FileText,
  ShieldCheck,
  GraduationCap,
  Gift,
  Clock,
  Search,
  ChevronDown,
  X,
  Phone,
  QrCode,
  CreditCard,
  AlertCircle,
  Lock
} from 'lucide-react';

interface ParcelaBoleto {
  numero: number;
  vencimento: string;
  valor: number;
  status: 'PENDENTE' | 'PAGO' | 'ATRASADO';
  linhaDigitavel?: string;
  codigoPix?: string;
  codigoBarras?: string;
  nossoNumero?: string;
  txid?: string;
  registradoSicredi?: boolean;
  dataPagamento?: string;
  situacaoSicredi?: string;
}

interface VendaAlbum {
  id: string;
  codigoPedido: string;
  dataVenda: string;
  alunoNome: string;
  alunoCpf: string;
  alunoTelefone?: string;
  alunoEmail?: string;
  instituicaoNome: string;
  periodo?: string;
  turmaNome: string;
  modeloAlbum: string;
  valorTotalKit: number;
  formaPagamento: 'BOLETO' | 'CARTAO' | 'PIX' | 'DINHEIRO';
  boletoQtdParcelas?: number;
  parcelasBoletos?: ParcelaBoleto[];
  brindes?: { id?: string; nome: string; selecionado: boolean; valorAdicional: number }[];
  statusProducao?: string;
  observacoes?: string;
}

export default function AppAlunoPage() {
  const [vendas, setVendas] = useState<VendaAlbum[]>([]);
  const [vendaAtual, setVendaAtual] = useState<VendaAlbum | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [boletoModal, setBoletoModal] = useState<ParcelaBoleto | null>(null);
  const [buscaCpf, setBuscaCpf] = useState('');
  const [mostrarSeletor, setMostrarSeletor] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const copiarTexto = (texto: string | undefined, id: string, msg: string) => {
    if (!texto) return;
    navigator.clipboard.writeText(texto);
    setCopiadoId(id);
    showToast(msg);
    setTimeout(() => setCopiadoId(null), 2500);
  };

  // Carregar dados e sincronizar com a API do Sicredi
  const carregarDados = async (silencioso = false) => {
    if (!silencioso) setCarregando(true);
    try {
      // 1. Chama sincronização automática com Sicredi
      let listaVendas: VendaAlbum[] = [];
      try {
        const resSync = await fetch('/sicredi_api.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sincronizar_baixas' }),
        });
        const dataSync = await resSync.json();
        if (dataSync.sucesso && Array.isArray(dataSync.vendas)) {
          listaVendas = dataSync.vendas;
          if (dataSync.baixasEfetuadas > 0 && !silencioso) {
            showToast(`🎉 ${dataSync.baixasEfetuadas} parcela(s) liquidada(s) no Sicredi!`);
          }
        }
      } catch (e) {}

      // 2. Se a API de sincronização não retornou a lista, busca do vendas.php
      if (!listaVendas || listaVendas.length === 0) {
        try {
          const resVendas = await fetch('/vendas.php');
          const dataVendas = await resVendas.json();
          if (Array.isArray(dataVendas)) {
            listaVendas = dataVendas;
          }
        } catch (e) {}
      }

      // 3. Fallback de localStorage se offline
      if (!listaVendas || listaVendas.length === 0) {
        try {
          const local = localStorage.getItem('on_vendas_albuns_estado');
          if (local) listaVendas = JSON.parse(local);
        } catch (e) {}
      }

      // Filtra apenas vendas reais
      const validas = (listaVendas || []).filter((v) => {
        const n = (v.alunoNome || '').toLowerCase();
        return !n.includes('gabriel santos') && !n.includes('amanda oliveira') && !n.includes('leonardo castro');
      });

      setVendas(validas);

      // Determina qual venda exibir
      // Verifica parâmetros na URL (?cpf=... ou ?pedido=... ou ?id=...)
      let vendaEncontrada: VendaAlbum | null = null;
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const urlCpf = (params.get('cpf') || '').replace(/\D/g, '');
        const urlPedido = (params.get('pedido') || '').toLowerCase();
        const urlId = params.get('id');

        if (urlCpf) {
          vendaEncontrada = validas.find((v) => (v.alunoCpf || '').replace(/\D/g, '') === urlCpf) || null;
        }
        if (!vendaEncontrada && urlPedido) {
          vendaEncontrada = validas.find((v) => (v.codigoPedido || '').toLowerCase() === urlPedido) || null;
        }
        if (!vendaEncontrada && urlId) {
          vendaEncontrada = validas.find((v) => v.id === urlId) || null;
        }

        // Se ainda não achou, checa CPF salvo
        if (!vendaEncontrada) {
          const salvoCpf = localStorage.getItem('on_aluno_ultimo_cpf');
          if (salvoCpf) {
            vendaEncontrada = validas.find((v) => (v.alunoCpf || '').replace(/\D/g, '') === salvoCpf) || null;
          }
        }
      }

      // Se ainda não encontrou, pega a primeira com boletos ou a primeira válida
      if (!vendaEncontrada && validas.length > 0) {
        vendaEncontrada = validas.find((v) => v.formaPagamento === 'BOLETO' && (v.parcelasBoletos?.length || 0) > 0) || validas[0];
      }

      if (vendaEncontrada) {
        setVendaAtual(vendaEncontrada);
        if (typeof window !== 'undefined' && vendaEncontrada.alunoCpf) {
          localStorage.setItem('on_aluno_ultimo_cpf', vendaEncontrada.alunoCpf.replace(/\D/g, ''));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Forçar atualização com Sicredi manual
  const handleAtualizarSicredi = async () => {
    setSincronizando(true);
    try {
      const res = await fetch('/sicredi_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sincronizar_baixas' }),
      });
      const data = await res.json();
      if (data.sucesso && Array.isArray(data.vendas)) {
        setVendas(data.vendas);
        if (vendaAtual) {
          const atualizada = data.vendas.find((v: VendaAlbum) => v.id === vendaAtual.id);
          if (atualizada) setVendaAtual(atualizada);
        }
        if (data.baixasEfetuadas > 0) {
          showToast(`🎉 ${data.baixasEfetuadas} parcela(s) liquidada(s) com sucesso!`);
        } else {
          showToast('Status sincronizado em tempo real com o Sicredi!');
        }
      } else {
        showToast('Status atualizado.');
      }
    } catch (e) {
      showToast('Status verificado.');
    } finally {
      setSincronizando(false);
    }
  };

  // Buscar por CPF digitado
  const handleBuscarPorCpf = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = buscaCpf.replace(/\D/g, '');
    if (!clean) return;
    const encontrada = vendas.find((v) => (v.alunoCpf || '').replace(/\D/g, '') === clean);
    if (encontrada) {
      setVendaAtual(encontrada);
      setMostrarSeletor(false);
      setBuscaCpf('');
      showToast(`Área de ${encontrada.alunoNome} carregada!`);
    } else {
      showToast('Nenhum contrato encontrado para este CPF.');
    }
  };

  // Cálculo de parcelas
  const parcelas = vendaAtual?.parcelasBoletos || [];
  const parcelasPagas = parcelas.filter((p) => p.status === 'PAGO').length;
  const totalParcelas = parcelas.length;
  const percentualPago = totalParcelas > 0 ? Math.round((parcelasPagas / totalParcelas) * 100) : 0;
  const todasPagas = totalParcelas > 0 && parcelasPagas === totalParcelas;

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex justify-center py-4 px-3 sm:py-8 sm:px-6 antialiased font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white text-xs sm:text-sm font-bold px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center space-x-2 border border-white/10 animate-fade-in">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Container Mobile PWA Tátil Moderno */}
      <div className="w-full max-w-lg bg-white min-h-[92vh] shadow-[0_20px_50px_rgba(79,57,246,0.12)] rounded-[32px] sm:rounded-[36px] flex flex-col border border-slate-100 overflow-hidden relative">
        {/* Header Superior Mobile em Degradê Violeta */}
        <header className="bg-gradient-to-br from-[#5842BD] via-[#4833A8] to-[#2E187D] text-white p-5 sm:p-6 sticky top-0 z-20 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center shrink-0">
                <Image
                  src="/images/logo-on-agencia.png"
                  alt="ON Agência Oficial"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
              <div>
                <span className="font-black text-xs tracking-wider text-white block leading-tight">
                  ON AGÊNCIA
                </span>
                <span className="text-[10px] text-purple-200/90 font-medium">Portal do Formando</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setMostrarSeletor(!mostrarSeletor)}
                className="text-[11px] font-bold text-purple-200 hover:text-white flex items-center bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 shadow-2xs hover:bg-white/20 transition cursor-pointer"
                title="Trocar aluno ou buscar por CPF"
              >
                <Search className="w-3 h-3 mr-1" />
                <span>Localizar CPF</span>
              </button>
            </div>
          </div>

          {/* Modal / Gaveta de Seleção por CPF */}
          {mostrarSeletor && (
            <div className="mt-4 p-4 bg-white/15 rounded-2xl border border-white/20 backdrop-blur-md animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">Buscar meus boletos por CPF:</span>
                <button
                  onClick={() => setMostrarSeletor(false)}
                  className="text-white/70 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <form onSubmit={handleBuscarPorCpf} className="flex gap-2">
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={buscaCpf}
                  onChange={(e) => setBuscaCpf(e.target.value)}
                  className="flex-1 bg-white text-slate-900 text-xs px-3 py-2 rounded-xl border-none outline-none font-mono font-bold placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md"
                >
                  Acessar
                </button>
              </form>
              {vendas.length > 1 && (
                <div className="mt-3 pt-3 border-t border-white/15">
                  <span className="text-[10px] font-semibold text-purple-200 block mb-1.5">
                    Ou selecione um formando cadastrado:
                  </span>
                  <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                    {vendas.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => {
                          setVendaAtual(v);
                          setMostrarSeletor(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition flex items-center justify-between ${
                          vendaAtual?.id === v.id
                            ? 'bg-white text-purple-900 font-bold'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        <span className="truncate">{v.alunoNome}</span>
                        <span className="text-[10px] opacity-80 shrink-0 ml-2">{v.codigoPedido}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dados do Aluno Logado */}
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  Olá, {vendaAtual?.alunoNome ? vendaAtual.alunoNome.split(' ')[0] : 'Formando'}! 👋
                </h1>
                <p className="text-xs text-purple-200 mt-1 flex items-center">
                  <GraduationCap className="w-3.5 h-3.5 mr-1 text-purple-300 shrink-0" />
                  <span className="truncate">
                    {vendaAtual?.turmaNome || 'Turma de Formatura'}
                  </span>
                </p>
              </div>

              {/* Botão Sincronizar em Tempo Real */}
              <button
                onClick={handleAtualizarSicredi}
                disabled={sincronizando}
                className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-bold border border-white/20 shadow-2xs flex items-center space-x-1.5 transition cursor-pointer shrink-0 disabled:opacity-50"
                title="Checar na API do Sicredi se o pagamento já foi recebido"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${sincronizando ? 'animate-spin text-emerald-400' : ''}`} />
                <span className="text-[11px]">{sincronizando ? 'Checando...' : 'Atualizar'}</span>
              </button>
            </div>

            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 bg-white/10 rounded-xl text-[11px] font-mono font-bold text-emerald-300 border border-white/15 shadow-2xs flex items-center">
                Pedido: {vendaAtual?.codigoPedido || '---'}
              </span>
              <span className="px-2.5 py-1 bg-white/10 rounded-xl text-[11px] font-semibold text-purple-200 border border-white/15">
                CPF: {vendaAtual?.alunoCpf || '---'}
              </span>
            </div>
          </div>
        </header>

        {/* Card Resumo do Kit & Status do Pagamento */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#FAF7FF] to-white border-b border-purple-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">
                Kit Contratado
              </span>
              <strong className="text-slate-900 text-sm font-black block">
                {vendaAtual?.modeloAlbum || 'Álbum Oficial de Formatura'}
              </strong>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Valor Total
              </span>
              <span className="text-[#4F39F6] font-black font-mono text-base sm:text-lg">
                R$ {(vendaAtual?.valorTotalKit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Barra de Progresso do Pagamento */}
          {totalParcelas > 0 && (
            <div className="pt-2 border-t border-purple-50">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-slate-700 flex items-center">
                  {todasPagas ? (
                    <span className="text-emerald-700 flex items-center font-black">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      100% Quitado / Liquidado
                    </span>
                  ) : (
                    <span>
                      Progresso:{' '}
                      <strong className="text-purple-700">
                        {parcelasPagas} de {totalParcelas} parcelas pagas
                      </strong>
                    </span>
                  )}
                </span>
                <span className="font-mono font-bold text-purple-700">{percentualPago}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    todasPagas
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600'
                  }`}
                  style={{ width: `${percentualPago}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Conteúdo Principal do Aluno */}
        <main className="flex-1 p-4 sm:p-5 space-y-6 overflow-y-auto bg-[#F4F6FB]/40">
          {carregando ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <RotateCcw className="w-8 h-8 mx-auto animate-spin text-purple-600" />
              <p className="text-xs font-semibold">Consultando parcelas e boletos no Sicredi...</p>
            </div>
          ) : !vendaAtual ? (
            <div className="py-12 px-4 text-center bg-white rounded-3xl border border-slate-200/80 p-6 space-y-3">
              <AlertCircle className="w-10 h-10 mx-auto text-amber-500" />
              <h3 className="text-sm font-bold text-slate-800">Nenhum contrato localizado</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Não localizamos compras ativas com o CPF informado. Clique em &quot;Localizar CPF&quot; no topo para consultar seu cadastro.
              </p>
            </div>
          ) : (
            <>
              {/* SEÇÃO 1: BOLETOS SICREDI & PARCELAS */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center">
                    <Barcode className="w-4 h-4 mr-1.5 text-emerald-600" />
                    Minhas Parcelas & Boletos
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center">
                    <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                    Sicredi Cobrança Oficial
                  </span>
                </div>

                {parcelas.length === 0 ? (
                  <div className="p-4 bg-white rounded-2xl border border-slate-100 text-center text-xs text-slate-500">
                    Forma de pagamento à vista ({vendaAtual.formaPagamento}). Não há boletos parcelados.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {parcelas.map((parc) => {
                      const isPaga = parc.status === 'PAGO';

                      return (
                        <div
                          key={parc.numero}
                          className={`p-4 rounded-2xl border transition-all ${
                            isPaga
                              ? 'bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40 border-emerald-300 shadow-sm'
                              : 'bg-white border-slate-200/90 shadow-2xs hover:border-purple-200'
                          }`}
                        >
                          {/* Cabeçalho da Parcela */}
                          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center space-x-2.5">
                              <span
                                className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                                  isPaga
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-purple-100 text-purple-800'
                                }`}
                              >
                                {isPaga ? <Check className="w-4 h-4 stroke-[3]" /> : parc.numero}
                              </span>
                              <div>
                                <span className="text-xs font-black text-slate-900 block">
                                  Parcela {parc.numero} de {totalParcelas}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  Vencimento: <strong>{parc.vencimento}</strong>
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="font-mono font-black text-slate-900 text-sm sm:text-base block">
                                R$ {parc.valor.toFixed(2)}
                              </span>
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center space-x-1 ${
                                  isPaga
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {isPaga ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>LIQUIDADO / PAGO</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    <span>AGUARDANDO PAGAMENTO</span>
                                  </>
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Se LIQUIDADO: Confirmação e dados de baixa */}
                          {isPaga ? (
                            <div className="mt-3 p-3 rounded-xl bg-emerald-100/60 border border-emerald-200 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <div className="flex items-center space-x-2 font-bold">
                                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                                <span>Pagamento compensado e baixado no Banco Sicredi!</span>
                              </div>
                              {parc.dataPagamento && (
                                <span className="text-[11px] font-semibold text-emerald-800">
                                  Pago em: {parc.dataPagamento}
                                </span>
                              )}
                            </div>
                          ) : (
                            /* Se PENDENTE: Ações de Pix, Linha Digitável e 2ª Via */
                            <div className="mt-3 space-y-2.5">
                              {parc.nossoNumero && (
                                <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                                  <span>Sicredi Nosso Número:</span>
                                  <strong className="text-slate-700">{parc.nossoNumero}</strong>
                                </div>
                              )}

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {/* Botão Copiar PIX */}
                                {parc.codigoPix && (
                                  <button
                                    onClick={() =>
                                      copiarTexto(
                                        parc.codigoPix,
                                        `pix-${parc.numero}`,
                                        'Código PIX copiado! Cole no app do seu banco para pagar.'
                                      )
                                    }
                                    className="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-bold text-xs flex items-center justify-between transition cursor-pointer"
                                  >
                                    <div className="flex items-center space-x-1.5 min-w-0">
                                      <QrCode className="w-4 h-4 text-purple-600 shrink-0" />
                                      <span className="truncate">Copiar PIX Copia e Cola</span>
                                    </div>
                                    {copiadoId === `pix-${parc.numero}` ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                                    )}
                                  </button>
                                )}

                                {/* Botão Copiar Linha Digitável */}
                                {parc.linhaDigitavel && (
                                  <button
                                    onClick={() =>
                                      copiarTexto(
                                        parc.linhaDigitavel,
                                        `linha-${parc.numero}`,
                                        'Linha digitável copiada com sucesso!'
                                      )
                                    }
                                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-between transition cursor-pointer"
                                  >
                                    <div className="flex items-center space-x-1.5 min-w-0">
                                      <Barcode className="w-4 h-4 text-slate-600 shrink-0" />
                                      <span className="truncate">Copiar Linha Digitável</span>
                                    </div>
                                    {copiadoId === `linha-${parc.numero}` ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                    )}
                                  </button>
                                )}
                              </div>

                              {/* Botão Ver Boleto Completo / Imprimir */}
                              <button
                                onClick={() => setBoletoModal(parc)}
                                className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-105 text-white font-extrabold text-xs rounded-xl shadow-2xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Visualizar Boleto / 2ª Via em PDF</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SEÇÃO 2: DETALHES DO KIT & BRINDES */}
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2 flex items-center">
                  <Gift className="w-4 h-4 mr-1.5 text-purple-600" />
                  Itens Inclusos no Meu Kit
                </h2>
                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)] space-y-2.5 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-800">Modelo do Álbum:</span>
                    <span className="font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-lg border border-purple-200">
                      {vendaAtual.modeloAlbum}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-800 block mb-1">Brindes Adicionais:</span>
                    {vendaAtual.brindes && vendaAtual.brindes.filter((b) => b.selecionado).length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {vendaAtual.brindes
                          .filter((b) => b.selecionado)
                          .map((b, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px] inline-flex items-center"
                            >
                              <Check className="w-3 h-3 mr-1 text-emerald-600" />
                              {b.nome}
                            </span>
                          ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Nenhum brinde extra selecionado</span>
                    )}
                  </div>
                </div>
              </div>

              {/* SEÇÃO 3: SUPORTE & ATENDIMENTO */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-200/80 flex items-center justify-between text-xs">
                <div>
                  <strong className="text-purple-950 font-black block">Dúvidas sobre seu carnê?</strong>
                  <span className="text-purple-700 text-[11px]">Fale com o suporte da ON Agência</span>
                </div>
                <a
                  href="https://wa.me/5511999999999?text=Olá,%20sou%20formando%20e%20gostaria%20de%20tirar%20uma%20dúvida%20sobre%20meu%20carnê%20de%20boletos."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-2xs flex items-center space-x-1.5 transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>

              {/* Rodapé Seguro com Link Discreto para Admin */}
              <div className="pt-3 pb-1 text-center border-t border-slate-100/80">
                <Link
                  href="/admin"
                  className="text-[11px] text-slate-400 hover:text-purple-700 font-semibold inline-flex items-center space-x-1.5 transition py-1 px-3 rounded-xl hover:bg-purple-50"
                  title="Área exclusiva para colaboradores e administradores"
                >
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Acesso Restrito da Equipe</span>
                </Link>
              </div>
            </>
          )}
        </main>
      </div>

      {/* MODAL: VISUALIZAÇÃO E IMPRESSÃO DO BOLETO / 2ª VIA */}
      {boletoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
            {/* Topo do Boleto */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  748
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Banco Sicredi 748-X</h3>
                  <p className="text-[11px] text-slate-500">
                    Boleto Cobrança Registrada &bull; Parcela {boletoModal.numero}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBoletoModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informações Bancárias */}
            <div className="my-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Beneficiário:</span>
                <strong className="text-slate-900">ON AGÊNCIA DE EVENTOS LTDA</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CNPJ:</span>
                <span className="font-mono text-slate-800">30.988.070/0001-60</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Agência / Posto / Beneficiário:</span>
                <span className="font-mono text-slate-800">0726 / 86 / 04220</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nosso Número:</span>
                <span className="font-mono font-bold text-purple-700">
                  {boletoModal.nossoNumero || 'Registrado via API'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vencimento:</span>
                <strong className="text-slate-900">{boletoModal.vencimento}</strong>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-bold">Valor do Documento:</span>
                <strong className="text-emerald-700 font-mono text-base font-black">
                  R$ {boletoModal.valor.toFixed(2)}
                </strong>
              </div>
            </div>

            {/* Linha Digitável */}
            {boletoModal.linhaDigitavel && (
              <div className="mb-4 p-3 bg-purple-50/70 rounded-2xl border border-purple-200">
                <span className="text-[10px] font-bold text-purple-900 uppercase block mb-1">
                  Linha Digitável:
                </span>
                <code className="text-xs font-mono font-bold text-purple-950 block select-all break-all leading-relaxed">
                  {boletoModal.linhaDigitavel}
                </code>
                <button
                  onClick={() =>
                    copiarTexto(
                      boletoModal.linhaDigitavel,
                      'modal-linha',
                      'Linha digitável copiada com sucesso!'
                    )
                  }
                  className="mt-2 text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center space-x-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>
                    {copiadoId === 'modal-linha' ? 'Copiado!' : 'Copiar Linha Digitável'}
                  </span>
                </button>
              </div>
            )}

            {/* Pix Copia e Cola */}
            {boletoModal.codigoPix && (
              <div className="mb-4 p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-900 uppercase block mb-1">
                  PIX Copia e Cola (Boleto Híbrido):
                </span>
                <code className="text-[11px] font-mono text-emerald-950 block select-all break-all max-h-16 overflow-y-auto leading-relaxed">
                  {boletoModal.codigoPix}
                </code>
                <button
                  onClick={() =>
                    copiarTexto(
                      boletoModal.codigoPix,
                      'modal-pix',
                      'Código PIX copiado! Cole no app do banco para pagar.'
                    )
                  }
                  className="mt-2 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>
                    {copiadoId === 'modal-pix' ? 'Copiado!' : 'Copiar Chave PIX Copia e Cola'}
                  </span>
                </button>
              </div>
            )}

            {/* Botões de Ação do Modal */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Salvar PDF</span>
              </button>
              <button
                onClick={() => setBoletoModal(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
