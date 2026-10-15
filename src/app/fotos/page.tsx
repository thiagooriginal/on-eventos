'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Camera,
  CreditCard,
  Barcode,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Download,
  Printer,
  Copy,
  ExternalLink,
  Sparkles,
  Layers,
  ChevronRight,
  X,
  FileText,
  DollarSign,
  TrendingUp,
  User,
  Phone,
  Building2,
  Calendar,
  Share2,
  Check,
  Gift,
  Image as ImageIcon,
  Award,
  Link2,
  Package,
  Trash2,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import {
  getOpcoesTurmasFaculdades,
  sincronizarInstituicoesServidor,
  OpcaoTurmaFaculdade,
} from '@/lib/instituicoes';

export type ModeloAlbumTipo = 'Album premium' | 'Album Preto' | 'Album Slim' | 'Album Colégio';

export type BrindeTipo = 'Quadro 30x60' | 'Trio de quadros' | 'Link de fotos' | 'Diploma acrilico';

export interface BrindeItem {
  id: string;
  nome: BrindeTipo;
  descricao: string;
  selecionado: boolean;
  valorAdicional: number; // 0 = cortesia / incluso no kit
}

export interface ParcelaBoleto {
  numero: number;
  vencimento: string;
  valor: number;
  status: 'PENDENTE' | 'PAGO' | 'VENCIDO';
  linhaDigitavel: string;
  codigoPix: string;
}

export interface VendaAlbum {
  id: string;
  codigoPedido: string;
  dataVenda: string;
  alunoNome: string;
  alunoCpf: string;
  alunoTelefone: string;
  alunoEmail: string;
  turmaNome: string;
  // Configuração do Álbum
  modeloAlbum: ModeloAlbumTipo;
  valorAlbum: number;
  // Configuração dos Brindes do Kit
  brindes: BrindeItem[];
  valorTotalBrindes: number;
  // Soma Total do Kit
  valorTotalKit: number;
  // Pagamento
  formaPagamento: 'CARTAO' | 'BOLETO' | 'PIX';
  // Cartão
  cartaoQtdParcelas?: number;
  cartaoBandeira?: string;
  cartaoNsu?: string;
  cartaoStatus?: string;
  // Boleto
  boletoQtdParcelas?: number;
  parcelasBoletos?: ParcelaBoleto[];
  // Produção
  statusProducao: 'EM_DIAGRAMACAO' | 'EM_GRAFICA' | 'PRONTO_ENTREGA' | 'ENTREGUE';
  observacoes?: string;
}

const MODELOS_DISPONIVEIS: { modelo: ModeloAlbumTipo; descricao: string; valorSugerido: number; badgeColor: string }[] = [
  {
    modelo: 'Album premium',
    descricao: 'Capa Acrílica Cristal de alta resistência, laminação UV especial e estojo nobre.',
    valorSugerido: 3800,
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    modelo: 'Album Preto',
    descricao: 'Design clássico em couro nobre preto, cantoneiras metálicas e gravação a laser.',
    valorSugerido: 3200,
    badgeColor: 'bg-slate-900 text-white border-slate-700',
  },
  {
    modelo: 'Album Slim',
    descricao: 'Lâminas ultrafinas e rígidas, abertura 180° panorâmica, leve e contemporâneo.',
    valorSugerido: 2400,
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    modelo: 'Album Colégio',
    descricao: 'Especial para formaturas escolares e ensino médio, diagramação alegre com fotos da turma.',
    valorSugerido: 1900,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
];

const BRINDES_DISPONIVEIS: { nome: BrindeTipo; descricao: string; valorPadrao: number; icone: any }[] = [
  {
    nome: 'Quadro 30x60',
    descricao: 'Moldura caixa alta com vidro antirreflexo e foto solene do formando',
    valorPadrao: 0,
    icone: ImageIcon,
  },
  {
    nome: 'Trio de quadros',
    descricao: 'Conjunto de 3 quadros decorativos 20x30 (beca, baile e família)',
    valorPadrao: 0,
    icone: Layers,
  },
  {
    nome: 'Link de fotos',
    descricao: 'Acesso vitalício à galeria digital com todas as fotos em alta resolução 4K',
    valorPadrao: 0,
    icone: Link2,
  },
  {
    nome: 'Diploma acrilico',
    descricao: 'Display de mesa em acrílico espelhado com gravação do nome e curso',
    valorPadrao: 0,
    icone: Award,
  },
];

const VENDAS_INICIAIS: VendaAlbum[] = [];

export default function VendasAlbunsPage() {
  const [vendas, setVendas] = useState<VendaAlbum[]>(VENDAS_INICIAIS);
  const [busca, setBusca] = useState('');
  const [filtroModelo, setFiltroModelo] = useState<string>('TODOS');
  const [filtroPagamento, setFiltroPagamento] = useState<'TODOS' | 'CARTAO' | 'BOLETO' | 'PIX'>('TODOS');
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Estados dos Modais
  const [modalNovaVendaAberto, setModalNovaVendaAberto] = useState(false);
  const [vendaSelecionadaBoletos, setVendaSelecionadaBoletos] = useState<VendaAlbum | null>(null);
  const [vendaSelecionadaCartao, setVendaSelecionadaCartao] = useState<VendaAlbum | null>(null);
  const [copiadoIdx, setCopiadoIdx] = useState<string | null>(null);

  // Formulário Nova Venda: Configuração do Kit
  const [formAbaAtiva, setFormAbaAtiva] = useState<'ALBUM' | 'BRINDES' | 'PAGAMENTO'>('ALBUM');
  const [formNome, setFormNome] = useState('');
  const [formCpf, setFormCpf] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formTurma, setFormTurma] = useState('Direito Mackenzie 2027.1');
  const [opcoesTurmas, setOpcoesTurmas] = useState<OpcaoTurmaFaculdade[]>([]);
  const [isOutraTurma, setIsOutraTurma] = useState(false);
  const [turmaManual, setTurmaManual] = useState('');

  // Seleção de Modelo de Álbum
  const [formModeloAlbum, setFormModeloAlbum] = useState<ModeloAlbumTipo>('Album premium');
  const [formValorAlbum, setFormValorAlbum] = useState('3800');

  // Seleção de Brindes do Kit
  const [formBrindes, setFormBrindes] = useState<BrindeItem[]>([
    { id: 'b1', nome: 'Quadro 30x60', descricao: 'Moldura caixa alta com foto solene', selecionado: true, valorAdicional: 0 },
    { id: 'b2', nome: 'Trio de quadros', descricao: 'Conjunto de 3 quadros decorativos 20x30', selecionado: false, valorAdicional: 0 },
    { id: 'b3', nome: 'Link de fotos', descricao: 'Acesso vitalício à galeria digital em 4K', selecionado: true, valorAdicional: 0 },
    { id: 'b4', nome: 'Diploma acrilico', descricao: 'Display em acrílico espelhado com gravação', selecionado: false, valorAdicional: 0 },
  ]);

  // Pagamento
  const [formFormaPagamento, setFormFormaPagamento] = useState<'CARTAO' | 'BOLETO' | 'PIX'>('CARTAO');
  const [formCartaoParcelas, setFormCartaoParcelas] = useState('10');
  const [formCartaoBandeira, setFormCartaoBandeira] = useState('Mastercard');
  const [formCartaoNsu, setFormCartaoNsu] = useState('');
  const [formBoletoParcelas, setFormBoletoParcelas] = useState('6');
  const [formPrimeiroVencimento, setFormPrimeiroVencimento] = useState('2026-11-15');
  const [formObservacoes, setFormObservacoes] = useState('');

  // Cálculo da Soma Total do Kit em Tempo Real
  const numValorAlbum = parseFloat(formValorAlbum) || 0;
  const numValorBrindes = formBrindes
    .filter((b) => b.selecionado)
    .reduce((acc, b) => acc + (b.valorAdicional || 0), 0);
  const somaTotalKit = numValorAlbum + numValorBrindes;

  // Carregar do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Limpa dados de teste anteriores caso ainda estejam no localStorage
        const jaLimpo = localStorage.getItem('on_vendas_albuns_zeradas_limpas_v1');
        if (!jaLimpo) {
          localStorage.removeItem('on_vendas_albuns_estado');
          localStorage.setItem('on_vendas_albuns_zeradas_limpas_v1', 'true');
          setVendas([]);
          return;
        }

        const salvo = localStorage.getItem('on_vendas_albuns_estado');
        if (salvo) {
          const parsed = JSON.parse(salvo);
          if (Array.isArray(parsed)) {
            setVendas(parsed);
          } else {
            setVendas([]);
          }
        } else {
          setVendas([]);
        }
      } catch (e) {
        setVendas([]);
      }
    }
  }, []);

  const salvarVendasLocal = (novas: VendaAlbum[]) => {
    setVendas(novas);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('on_vendas_albuns_estado', JSON.stringify(novas));
      } catch (e) {}
    }
  };

  const handleZerarVendas = () => {
    if (confirm('Tem certeza que deseja ZERAR todas as vendas de álbuns? Esta ação limpará todo o histórico para que você cadastre do zero.')) {
      salvarVendasLocal([]);
      showToast('Todas as vendas foram limpas com sucesso!');
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Carregar turmas e instituições cadastradas
  useEffect(() => {
    const listaInicial = getOpcoesTurmasFaculdades();
    setOpcoesTurmas(listaInicial);
    if (listaInicial.length > 0 && !formTurma) {
      setFormTurma(listaInicial[0].valor);
    }
    sincronizarInstituicoesServidor()
      .then(() => {
        const atualizadas = getOpcoesTurmasFaculdades();
        setOpcoesTurmas(atualizadas);
        if (atualizadas.length > 0 && !formTurma) {
          setFormTurma(atualizadas[0].valor);
        }
      })
      .catch(() => {});
  }, []);

  const abrirModalNovaVenda = () => {
    const atualizadas = getOpcoesTurmasFaculdades();
    setOpcoesTurmas(atualizadas);
    if (atualizadas.length > 0 && !formTurma) {
      setFormTurma(atualizadas[0].valor);
    }
    setFormAbaAtiva('ALBUM');
    setModalNovaVendaAberto(true);
  };

  const copiarTexto = (texto: string, idRef: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(texto);
      setCopiadoIdx(idRef);
      setTimeout(() => setCopiadoIdx(null), 2000);
      showToast('Copiado para a área de transferência!');
    }
  };

  // Alternar Brinde
  const toggleBrinde = (nome: BrindeTipo) => {
    setFormBrindes((prev) =>
      prev.map((b) => (b.nome === nome ? { ...b, selecionado: !b.selecionado } : b))
    );
  };

  // Alterar valor adicional do brinde
  const setBrindeValor = (nome: BrindeTipo, valor: number) => {
    setFormBrindes((prev) =>
      prev.map((b) => (b.nome === nome ? { ...b, valorAdicional: valor } : b))
    );
  };

  // Gerar Boletos Sicredi automáticos com base no Valor Total do Kit
  const gerarParcelasBoletos = (valorTotal: number, qtdParcelas: number, primeiroVenc: string): ParcelaBoleto[] => {
    const valorParcela = Math.floor((valorTotal / qtdParcelas) * 100) / 100;
    const diferencaCentavos = Number((valorTotal - (valorParcela * qtdParcelas)).toFixed(2));
    const parcelas: ParcelaBoleto[] = [];
    const baseDate = new Date(primeiroVenc || new Date());

    for (let i = 1; i <= qtdParcelas; i++) {
      const d = new Date(baseDate);
      d.setMonth(d.getMonth() + (i - 1));
      const vencStr = d.toLocaleDateString('pt-BR');
      const val = i === qtdParcelas ? Number((valorParcela + diferencaCentavos).toFixed(2)) : valorParcela;
      
      const dig1 = Math.floor(10000 + Math.random() * 90000);
      const dig2 = Math.floor(10000 + Math.random() * 90000);
      const linha = `74891.12003 ${dig1}.234508 ${dig2}.67890${i} ${i} 98760000${Math.floor(val * 100)}`;
      const pix = `00020126580014br.gov.bcb.pix0136e4b8c9f0-1234-5678-90ab-cdef12345678520400005303986540${val.toFixed(2).length}${val.toFixed(2)}5802BR5915ON EVENTOS LTDA6009SAO PAULO62070503***6304${dig1.toString().slice(0, 4)}`;

      parcelas.push({
        numero: i,
        vencimento: vencStr,
        valor: val,
        status: 'PENDENTE',
        linhaDigitavel: linha,
        codigoPix: pix,
      });
    }

    return parcelas;
  };

  // Submeter Criação de Nova Venda do Kit
  const handleSubmitNovaVenda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim() || !formCpf.trim()) {
      showToast('Por favor, preencha o nome e CPF do formando.');
      return;
    }

    const novoCodigo = `ALB-2026-${String(vendas.length + 90).padStart(3, '0')}`;
    const dataHoje = new Date().toLocaleDateString('pt-BR');

    let parcelasGeradas: ParcelaBoleto[] | undefined = undefined;
    if (formFormaPagamento === 'BOLETO') {
      parcelasGeradas = gerarParcelasBoletos(somaTotalKit, parseInt(formBoletoParcelas) || 1, formPrimeiroVencimento);
    }

    const nova: VendaAlbum = {
      id: `venda-${Date.now()}`,
      codigoPedido: novoCodigo,
      dataVenda: dataHoje,
      alunoNome: formNome.trim(),
      alunoCpf: formCpf.trim(),
      alunoTelefone: formTelefone.trim() || '(11) 99999-9999',
      alunoEmail: formEmail.trim(),
      turmaNome: formTurma,
      modeloAlbum: formModeloAlbum,
      valorAlbum: numValorAlbum,
      brindes: formBrindes,
      valorTotalBrindes: numValorBrindes,
      valorTotalKit: somaTotalKit,
      formaPagamento: formFormaPagamento,
      cartaoQtdParcelas: formFormaPagamento === 'CARTAO' ? parseInt(formCartaoParcelas) : undefined,
      cartaoBandeira: formFormaPagamento === 'CARTAO' ? formCartaoBandeira : undefined,
      cartaoNsu: formFormaPagamento === 'CARTAO' ? (formCartaoNsu.trim() || `NSU-${Math.floor(100000 + Math.random() * 900000)}`) : undefined,
      cartaoStatus: formFormaPagamento === 'CARTAO' ? 'Aprovado / Liquidado' : undefined,
      boletoQtdParcelas: formFormaPagamento === 'BOLETO' ? parseInt(formBoletoParcelas) : undefined,
      parcelasBoletos: parcelasGeradas,
      statusProducao: 'EM_DIAGRAMACAO',
      observacoes: formObservacoes.trim(),
    };

    const atualizadas = [nova, ...vendas];
    salvarVendasLocal(atualizadas);
    setModalNovaVendaAberto(false);
    showToast(`Venda ${novoCodigo} do ${formModeloAlbum} cadastrada com sucesso!`);

    // Reset
    setFormNome('');
    setFormCpf('');
    setFormTelefone('');
    setFormEmail('');
    setFormObservacoes('');
    setFormCartaoNsu('');
    setFormAbaAtiva('ALBUM');
  };

  // Alternar pagamento de parcela no boleto
  const alternarStatusParcela = (vendaId: string, parcelaNumero: number) => {
    const atualizadas = vendas.map((v) => {
      if (v.id === vendaId && v.parcelasBoletos) {
        const novasParcelas = v.parcelasBoletos.map((p) => {
          if (p.numero === parcelaNumero) {
            return {
              ...p,
              status: (p.status === 'PAGO' ? 'PENDENTE' : 'PAGO') as 'PENDENTE' | 'PAGO',
            };
          }
          return p;
        });
        return { ...v, parcelasBoletos: novasParcelas };
      }
      return v;
    });

    salvarVendasLocal(atualizadas);
    const atualizada = atualizadas.find((v) => v.id === vendaId);
    if (atualizada) setVendaSelecionadaBoletos(atualizada);
    showToast(`Status da parcela ${parcelaNumero} atualizado!`);
  };

  // Avançar status de produção
  const avancarStatusProducao = (vendaId: string) => {
    const ordem: VendaAlbum['statusProducao'][] = [
      'EM_DIAGRAMACAO',
      'EM_GRAFICA',
      'PRONTO_ENTREGA',
      'ENTREGUE',
    ];
    const atualizadas = vendas.map((v) => {
      if (v.id === vendaId) {
        const idx = ordem.indexOf(v.statusProducao);
        const proximo = idx < ordem.length - 1 ? ordem[idx + 1] : ordem[idx];
        return { ...v, statusProducao: proximo };
      }
      return v;
    });

    salvarVendasLocal(atualizadas);
    showToast('Etapa de produção do álbum avançada!');
  };

  // Métricas
  const totalFaturamento = vendas.reduce((acc, v) => acc + v.valorTotalKit, 0);
  const totalCartao = vendas
    .filter((v) => v.formaPagamento === 'CARTAO')
    .reduce((acc, v) => acc + v.valorTotalKit, 0);
  const totalBoleto = vendas
    .filter((v) => v.formaPagamento === 'BOLETO')
    .reduce((acc, v) => acc + v.valorTotalKit, 0);
  const totalEmProducao = vendas.filter(
    (v) => v.statusProducao === 'EM_DIAGRAMACAO' || v.statusProducao === 'EM_GRAFICA'
  ).length;

  // Filtragem
  const vendasFiltradas = vendas.filter((v) => {
    const matchBusca =
      v.alunoNome.toLowerCase().includes(busca.toLowerCase()) ||
      v.alunoCpf.includes(busca) ||
      v.codigoPedido.toLowerCase().includes(busca.toLowerCase()) ||
      v.turmaNome.toLowerCase().includes(busca.toLowerCase()) ||
      v.modeloAlbum.toLowerCase().includes(busca.toLowerCase());

    const matchModelo = filtroModelo === 'TODOS' || v.modeloAlbum === filtroModelo;
    const matchPagamento = filtroPagamento === 'TODOS' || v.formaPagamento === filtroPagamento;
    const matchStatus = filtroStatus === 'TODOS' || v.statusProducao === filtroStatus;

    return matchBusca && matchModelo && matchPagamento && matchStatus;
  });

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col lg:flex-row antialiased font-sans">
      {/* Sidebar Lateral Flutuante Roxa com Relevo Tátil e Logo Oficial */}
      <Sidebar paginaAtiva="fotos" />

      {/* Toast Flutuante */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#36218A] text-white px-5 py-3 rounded-2xl shadow-[0_10px_30px_rgba(54,33,138,0.45)] border border-purple-400/40 text-xs font-bold flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Conteúdo Principal Direito */}
      <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 lg:pl-2">
        {/* Header Superior com Relevo Tátil e Ação de Nova Venda */}
        <header className="bg-white/80 backdrop-blur-md rounded-[24px] p-4 lg:px-6 lg:py-4 mb-6 shadow-[0_8px_24px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-fuchsia-600 via-purple-600 to-indigo-600 text-white shadow-[0_6px_16px_rgba(192,38,211,0.25)] flex items-center justify-center shrink-0">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
                  Vendas de Álbuns & Kits Fotográficos
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200">
                  {vendas.length} pedidos
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Monte kits com <strong>Álbum Premium, Preto, Slim ou Colégio</strong> + brindes e emita cartão ou boletos Sicredi.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            {vendas.length > 0 && (
              <button
                onClick={handleZerarVendas}
                className="inline-flex items-center space-x-1.5 px-4 py-3 rounded-2xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold shadow-sm transition hover:translate-y-[-1px] active:translate-y-[1px]"
                title="Limpar todos os dados e começar do zero"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Vendas</span>
              </button>
            )}

            <button
              onClick={abrirModalNovaVenda}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#C026D3] text-white text-xs font-extrabold shadow-[0_4px_0_0_#581C87,0_8px_16px_rgba(147,51,234,0.3)] hover:brightness-110 hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Venda de Álbum</span>
            </button>
          </div>
        </header>

        {/* =========================================================================
            CARDS DE MÉTRICAS COM RELEVO TÁTIL 3D
            ========================================================================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Card 1: Total Vendido */}
          <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Vendido (Kits)
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              R$ {totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2 flex items-center text-[11px] text-emerald-600 font-semibold">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              <span>{vendas.length} kits contratados</span>
            </div>
          </div>

          {/* Card 2: Cartão de Crédito */}
          <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Cartão de Crédito
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              R$ {totalCartao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              {vendas.filter((v) => v.formaPagamento === 'CARTAO').length} vendas liquidadas
            </div>
          </div>

          {/* Card 3: Boleto / Carnê */}
          <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Boleto Bancário / Carnê
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Barcode className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              R$ {totalBoleto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2 text-[11px] text-amber-600 font-semibold">
              {vendas.filter((v) => v.formaPagamento === 'BOLETO').length} carnês emitidos Sicredi
            </div>
          </div>

          {/* Card 4: Em Produção */}
          <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Em Produção
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              {totalEmProducao} <span className="text-sm font-medium text-slate-500">álbuns</span>
            </div>
            <div className="mt-2 text-[11px] text-blue-600 font-semibold">
              Diagramação & Gráfica
            </div>
          </div>
        </section>

        {/* =========================================================================
            BARRA DE BUSCA E FILTROS RÁPIDOS
            ========================================================================= */}
        <div className="bg-white rounded-[24px] p-4 mb-6 border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Campo de Busca */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por formando, CPF, turma, modelo de álbum ou brinde..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-[#F4F6FB] text-slate-900 placeholder:text-slate-400 text-xs rounded-2xl pl-9 pr-4 py-2.5 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] shadow-inner transition"
            />
          </div>

          {/* Filtro por Modelo de Álbum */}
          <div className="flex items-center space-x-1.5">
            <select
              value={filtroModelo}
              onChange={(e) => setFiltroModelo(e.target.value)}
              className="bg-[#F4F6FB] text-slate-700 text-xs font-bold rounded-2xl px-3 py-2 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
            >
              <option value="TODOS">Todos os Modelos</option>
              <option value="Album premium">Album premium</option>
              <option value="Album Preto">Album Preto</option>
              <option value="Album Slim">Album Slim</option>
              <option value="Album Colégio">Album Colégio</option>
            </select>
          </div>

          {/* Filtros de Forma de Pagamento */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#F4F6FB] p-1 rounded-2xl border border-slate-200/60">
            <button
              onClick={() => setFiltroPagamento('TODOS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filtroPagamento === 'TODOS'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroPagamento('CARTAO')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${
                filtroPagamento === 'CARTAO'
                  ? 'bg-white text-emerald-700 shadow-2xs border border-emerald-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 mr-1" /> Cartão
            </button>
            <button
              onClick={() => setFiltroPagamento('BOLETO')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${
                filtroPagamento === 'BOLETO'
                  ? 'bg-white text-amber-700 shadow-2xs border border-amber-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Barcode className="w-3.5 h-3.5 mr-1" /> Boleto / Carnê
            </button>
            <button
              onClick={() => setFiltroPagamento('PIX')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filtroPagamento === 'PIX'
                  ? 'bg-white text-purple-700 shadow-2xs border border-purple-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              PIX
            </button>
          </div>
        </div>

        {/* =========================================================================
            TABELA DE VENDAS COM DETALHAMENTO DO KIT (ÁLBUM + BRINDES)
            ========================================================================= */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-[0_12px_32px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-4 px-5">Pedido</th>
                  <th className="py-4 px-5">Formando / Turma</th>
                  <th className="py-4 px-5">Modelo do Álbum</th>
                  <th className="py-4 px-5">Brindes do Kit</th>
                  <th className="py-4 px-5">Soma Total do Kit</th>
                  <th className="py-4 px-5">Forma de Pagamento</th>
                  <th className="py-4 px-5">Produção</th>
                  <th className="py-4 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto shadow-sm">
                          <Camera className="w-7 h-7" />
                        </div>
                        <h4 className="text-base font-black text-slate-800">Pronto para cadastrar suas vendas reais</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Todos os dados de teste foram limpos. Clique no botão abaixo para registrar a primeira venda de álbum, configurar o kit de brindes e emitir boletos ou cartão.
                        </p>
                        <button
                          onClick={abrirModalNovaVenda}
                          className="mt-2 inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md hover:translate-y-[-1px] active:translate-y-[1px] transition"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Cadastrar Primeira Venda</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  vendasFiltradas.map((venda) => {
                    const parcelasPagas = venda.parcelasBoletos?.filter((p) => p.status === 'PAGO').length || 0;
                    const totalParcelasBoleto = venda.parcelasBoletos?.length || 0;
                    const brindesAtivos = venda.brindes?.filter((b) => b.selecionado) || [];

                    return (
                      <tr key={venda.id} className="hover:bg-slate-50/60 transition">
                        {/* Pedido */}
                        <td className="py-4 px-5">
                          <span className="font-mono font-bold text-slate-900 block">
                            {venda.codigoPedido}
                          </span>
                          <span className="text-[10px] text-slate-400">{venda.dataVenda}</span>
                        </td>

                        {/* Formando / Turma */}
                        <td className="py-4 px-5">
                          <strong className="text-slate-900 block text-xs">{venda.alunoNome}</strong>
                          <span className="text-[11px] text-slate-500 block">{venda.turmaNome}</span>
                          <span className="text-[10px] text-slate-400 font-mono">CPF: {venda.alunoCpf}</span>
                        </td>

                        {/* Modelo de Álbum */}
                        <td className="py-4 px-5">
                          <span
                            className={`inline-block px-3 py-1 rounded-xl text-xs font-bold border ${
                              venda.modeloAlbum === 'Album premium'
                                ? 'bg-purple-50 text-purple-800 border-purple-200'
                                : venda.modeloAlbum === 'Album Preto'
                                ? 'bg-slate-900 text-white border-slate-700'
                                : venda.modeloAlbum === 'Album Slim'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {venda.modeloAlbum}
                          </span>
                          <span className="text-[11px] font-mono text-slate-600 block mt-1">
                            R$ {venda.valorAlbum.toFixed(2)}
                          </span>
                        </td>

                        {/* Brindes do Kit */}
                        <td className="py-4 px-5 max-w-[220px]">
                          {brindesAtivos.length === 0 ? (
                            <span className="text-slate-400 italic text-[11px]">Nenhum brinde incluso</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {brindesAtivos.map((b) => (
                                <span
                                  key={b.id || b.nome}
                                  className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200"
                                >
                                  <Gift className="w-2.5 h-2.5 mr-1 text-purple-500" />
                                  {b.nome}
                                  {b.valorAdicional > 0 && ` (+R$ ${b.valorAdicional})`}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Soma Total do Kit */}
                        <td className="py-4 px-5">
                          <span className="font-mono font-black text-slate-950 text-sm block">
                            R$ {venda.valorTotalKit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-semibold block">
                            Total do Kit
                          </span>
                        </td>

                        {/* Forma de Pagamento */}
                        <td className="py-4 px-5">
                          {venda.formaPagamento === 'CARTAO' && (
                            <div>
                              <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CreditCard className="w-3.5 h-3.5 mr-1" />
                                Cartão {venda.cartaoQtdParcelas}x de R${' '}
                                {(venda.valorTotalKit / (venda.cartaoQtdParcelas || 1)).toFixed(2)}
                              </span>
                              <div className="text-[10px] text-slate-500 mt-1 flex items-center space-x-1">
                                <span>{venda.cartaoBandeira}</span>
                                <span>&bull;</span>
                                <span className="font-mono">{venda.cartaoNsu}</span>
                              </div>
                            </div>
                          )}

                          {venda.formaPagamento === 'BOLETO' && (
                            <div>
                              <button
                                onClick={() => setVendaSelecionadaBoletos(venda)}
                                className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition shadow-2xs cursor-pointer"
                              >
                                <Barcode className="w-3.5 h-3.5 mr-1 text-amber-600" />
                                Carnê {venda.boletoQtdParcelas}x ({parcelasPagas}/{totalParcelasBoleto} pagas)
                              </button>
                              <span className="text-[10px] text-slate-500 block mt-1">
                                Banco Sicredi &bull; Clique para ver boletos
                              </span>
                            </div>
                          )}

                          {venda.formaPagamento === 'PIX' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <Sparkles className="w-3.5 h-3.5 mr-1" />
                              PIX À Vista
                            </span>
                          )}
                        </td>

                        {/* Status de Produção */}
                        <td className="py-4 px-5">
                          {venda.statusProducao === 'EM_DIAGRAMACAO' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <Clock className="w-3 h-3 mr-1" /> Em Diagramação
                            </span>
                          )}
                          {venda.statusProducao === 'EM_GRAFICA' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <Layers className="w-3 h-3 mr-1" /> Em Gráfica
                            </span>
                          )}
                          {venda.statusProducao === 'PRONTO_ENTREGA' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Pronto p/ Entrega
                            </span>
                          )}
                          {venda.statusProducao === 'ENTREGUE' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Entregue
                            </span>
                          )}
                        </td>

                        {/* Ações */}
                        <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap">
                          {venda.formaPagamento === 'BOLETO' && (
                            <button
                              onClick={() => setVendaSelecionadaBoletos(venda)}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-200 transition shadow-2xs"
                              title="Visualizar Carnê de Boletos Sicredi"
                            >
                              <Barcode className="w-3.5 h-3.5 inline mr-1" /> Boletos
                            </button>
                          )}

                          {venda.formaPagamento === 'CARTAO' && (
                            <button
                              onClick={() => setVendaSelecionadaCartao(venda)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 transition shadow-2xs"
                              title="Ver Comprovante da Transação no Cartão"
                            >
                              <CreditCard className="w-3.5 h-3.5 inline mr-1" /> Comprovante
                            </button>
                          )}

                          <button
                            onClick={() => avancarStatusProducao(venda.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] border border-slate-200 transition shadow-2xs hover:translate-y-[-1px]"
                            title="Avançar etapa de produção do álbum"
                          >
                            <span>Avançar</span>
                            <ChevronRight className="w-3.5 h-3.5 inline ml-0.5" />
                          </button>

                          <a
                            href={`https://wa.me/55${venda.alunoTelefone.replace(/\D/g, '')}?text=Olá%20${encodeURIComponent(
                              venda.alunoNome
                            )},%20seu%20Kit%20com%20${encodeURIComponent(venda.modeloAlbum)}%20está%20com%20status:%20${venda.statusProducao}.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white inline-flex items-center justify-center transition shadow-2xs"
                            title="Enviar status no WhatsApp"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* =========================================================================
          MODAL 1: MONTADOR DO KIT DE ÁLBUM & VENDA
          ========================================================================= */}
      {modalNovaVendaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-[32px] w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 lg:p-8 shadow-2xl border border-slate-100">
            {/* Header do Montador */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#C026D3] text-white flex items-center justify-center shadow-md">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Montagem do Kit de Álbum & Venda</h3>
                  <p className="text-xs text-slate-500">Escolha o modelo, configure os brindes e defina a forma de pagamento</p>
                </div>
              </div>
              <button
                onClick={() => setModalNovaVendaAberto(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Abas do Configurador */}
            <div className="flex items-center space-x-2 mt-5 p-1.5 bg-[#F4F6FB] rounded-2xl border border-slate-200/70">
              <button
                type="button"
                onClick={() => setFormAbaAtiva('ALBUM')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                  formAbaAtiva === 'ALBUM'
                    ? 'bg-white text-purple-900 shadow-2xs border border-purple-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-4 h-4 text-purple-600" />
                <span>1. Modelo do Álbum</span>
              </button>

              <button
                type="button"
                onClick={() => setFormAbaAtiva('BRINDES')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                  formAbaAtiva === 'BRINDES'
                    ? 'bg-white text-purple-900 shadow-2xs border border-purple-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Gift className="w-4 h-4 text-fuchsia-600" />
                <span>2. Brindes do Kit ({formBrindes.filter((b) => b.selecionado).length})</span>
              </button>

              <button
                type="button"
                onClick={() => setFormAbaAtiva('PAGAMENTO')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                  formAbaAtiva === 'PAGAMENTO'
                    ? 'bg-white text-purple-900 shadow-2xs border border-purple-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>3. Pagamento & Boletos</span>
              </button>
            </div>

            <form onSubmit={handleSubmitNovaVenda} className="mt-5 space-y-5">
              {/* ABA 1: MODELO DO ÁLBUM E DADOS DO ALUNO */}
              {formAbaAtiva === 'ALBUM' && (
                <div className="space-y-4">
                  {/* Dados Básicos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo do Formando *</label>
                      <input
                        type="text"
                        required
                        placeholder="ex: Rafaela Medeiros"
                        value={formNome}
                        onChange={(e) => setFormNome(e.target.value)}
                        className="w-full bg-[#F4F6FB] text-slate-900 text-xs rounded-xl p-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">CPF do Aluno *</label>
                      <input
                        type="text"
                        required
                        placeholder="000.000.000-00"
                        value={formCpf}
                        onChange={(e) => setFormCpf(e.target.value)}
                        className="w-full bg-[#F4F6FB] text-slate-900 text-xs rounded-xl p-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp / Telefone *</label>
                      <input
                        type="tel"
                        required
                        placeholder="(11) 90000-0000"
                        value={formTelefone}
                        onChange={(e) => setFormTelefone(e.target.value)}
                        className="w-full bg-[#F4F6FB] text-slate-900 text-xs rounded-xl p-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">Turma / Faculdade *</label>
                        <Link
                          href="/instituicoes"
                          className="text-[11px] font-bold text-[#7C3AED] hover:underline inline-flex items-center"
                          title="Cadastrar novas instituições ou cursos"
                        >
                          + Nova Faculdade / Curso
                        </Link>
                      </div>
                      <select
                        value={isOutraTurma ? '__OUTRA__' : formTurma}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '__OUTRA__') {
                            setIsOutraTurma(true);
                            setFormTurma(turmaManual || '');
                          } else {
                            setIsOutraTurma(false);
                            setFormTurma(val);
                          }
                        }}
                        className="w-full bg-[#F4F6FB] text-slate-900 text-xs rounded-xl p-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                      >
                        {opcoesTurmas.some((o) => o.categoria === 'CURSO_TURMA') && (
                          <optgroup label="🎓 Cursos & Turmas Cadastradas">
                            {opcoesTurmas
                              .filter((o) => o.categoria === 'CURSO_TURMA')
                              .map((o) => (
                                <option key={o.valor} value={o.valor}>
                                  {o.label}
                                </option>
                              ))}
                          </optgroup>
                        )}

                        {opcoesTurmas.some((o) => o.categoria === 'INSTITUICAO') && (
                          <optgroup label="🏛️ Instituições de Ensino Cadastradas">
                            {opcoesTurmas
                              .filter((o) => o.categoria === 'INSTITUICAO')
                              .map((o) => (
                                <option key={o.valor} value={o.valor}>
                                  {o.label}
                                </option>
                              ))}
                          </optgroup>
                        )}

                        {opcoesTurmas.some((o) => o.categoria === 'LEGADO') && (
                          <optgroup label="📌 Turmas de Referência">
                            {opcoesTurmas
                              .filter((o) => o.categoria === 'LEGADO')
                              .map((o) => (
                                <option key={o.valor} value={o.valor}>
                                  {o.label}
                                </option>
                              ))}
                          </optgroup>
                        )}

                        <optgroup label="✍️ Digitar Manualmente">
                          <option value="__OUTRA__">+ Digitar outra faculdade / turma...</option>
                        </optgroup>
                      </select>

                      {isOutraTurma && (
                        <div className="mt-2">
                          <input
                            type="text"
                            required
                            placeholder="Digite o nome da Faculdade / Turma (Ex: Medicina USP 2027.2)..."
                            value={turmaManual}
                            onChange={(e) => {
                              setTurmaManual(e.target.value);
                              setFormTurma(e.target.value);
                            }}
                            className="w-full bg-white text-slate-900 text-xs rounded-xl p-2.5 border-2 border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 font-medium"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Seleção do Modelo de Álbum */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      Selecione o Modelo de Álbum:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {MODELOS_DISPONIVEIS.map((item) => {
                        const isSelecionado = formModeloAlbum === item.modelo;

                        return (
                          <div
                            key={item.modelo}
                            onClick={() => {
                              setFormModeloAlbum(item.modelo);
                              setFormValorAlbum(item.valorSugerido.toString());
                            }}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                              isSelecionado
                                ? 'border-[#7C3AED] bg-purple-50/70 shadow-md ring-2 ring-purple-400'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <strong className="text-slate-900 text-sm font-extrabold">{item.modelo}</strong>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                                Sugerido: R$ {item.valorSugerido}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-snug">{item.descricao}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Campo para Definir o Valor que Foi Vendido */}
                  <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <strong className="text-slate-900 text-xs block font-bold">
                        Valor Negociado para o {formModeloAlbum}:
                      </strong>
                      <span className="text-[11px] text-slate-500">
                        Você pode editar livremente o valor acordado com o formando.
                      </span>
                    </div>
                    <div className="relative w-full sm:w-48">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formValorAlbum}
                        onChange={(e) => setFormValorAlbum(e.target.value)}
                        className="w-full bg-white text-slate-950 font-mono font-black text-base rounded-xl pl-9 pr-3 py-2 border border-purple-300 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setFormAbaAtiva('BRINDES')}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center space-x-1.5 transition"
                    >
                      <span>Avançar para Brindes do Kit</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ABA 2: BRINDES DO KIT */}
              {formAbaAtiva === 'BRINDES' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
                      Brindes & Opcionais do Kit
                    </h4>
                    <p className="text-xs text-slate-500 mb-4">
                      Marque os itens que acompanharão o álbum e defina se é cortesia (R$ 0,00) ou valor adicional.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {BRINDES_DISPONIVEIS.map((brindeDef) => {
                      const brindeAtual = formBrindes.find((b) => b.nome === brindeDef.nome);
                      const isAtivo = brindeAtual?.selecionado || false;
                      const Icone = brindeDef.icone;

                      return (
                        <div
                          key={brindeDef.nome}
                          className={`p-4 rounded-2xl border transition-all ${
                            isAtivo
                              ? 'bg-purple-50/70 border-purple-300 shadow-2xs'
                              : 'bg-white border-slate-200 opacity-75 hover:opacity-100'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => toggleBrinde(brindeDef.nome)}>
                              <input
                                type="checkbox"
                                checked={isAtivo}
                                onChange={() => toggleBrinde(brindeDef.nome)}
                                className="w-4 h-4 text-[#7C3AED] rounded-md focus:ring-purple-400"
                              />
                              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                                <Icone className="w-4 h-4" />
                              </div>
                              <div>
                                <strong className="text-slate-900 text-xs block font-bold">{brindeDef.nome}</strong>
                                <span className="text-[11px] text-slate-500">{brindeDef.descricao}</span>
                              </div>
                            </div>

                            {/* Valor Adicional / Cortesia */}
                            {isAtivo && (
                              <div className="flex items-center space-x-2 self-end sm:self-auto">
                                <span className="text-[11px] font-bold text-slate-600">Valor Adicional:</span>
                                <div className="relative w-28">
                                  <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">R$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={brindeAtual?.valorAdicional || 0}
                                    onChange={(e) => setBrindeValor(brindeDef.nome, parseFloat(e.target.value) || 0)}
                                    className="w-full bg-white text-slate-900 font-mono text-xs rounded-lg pl-7 pr-2 py-1.5 border border-purple-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                  />
                                </div>
                                <span className="text-[10px] text-purple-700 font-bold bg-purple-100 px-2 py-0.5 rounded-md">
                                  {(brindeAtual?.valorAdicional || 0) === 0 ? 'Cortesia' : 'Adicional'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => setFormAbaAtiva('ALBUM')}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                    >
                      Voltar ao Modelo
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormAbaAtiva('PAGAMENTO')}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center space-x-1.5 transition"
                    >
                      <span>Avançar para Pagamento</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ABA 3: RESUMO DO KIT & FORMA DE PAGAMENTO */}
              {formAbaAtiva === 'PAGAMENTO' && (
                <div className="space-y-4">
                  {/* Resumo do Kit Montado com a Soma Total */}
                  <div className="p-5 bg-gradient-to-r from-purple-50 via-fuchsia-50 to-indigo-50 rounded-2xl border-2 border-purple-200 shadow-sm">
                    <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-purple-900 mb-3">
                      <Sparkles className="w-4 h-4 text-fuchsia-600" />
                      <span>Resumo do Kit Montado:</span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-700 pb-3 border-b border-purple-200/80">
                      <div className="flex justify-between">
                        <span>
                          Modelo: <strong>{formModeloAlbum}</strong>
                        </span>
                        <span className="font-mono font-bold">R$ {numValorAlbum.toFixed(2)}</span>
                      </div>

                      {formBrindes
                        .filter((b) => b.selecionado)
                        .map((b) => (
                          <div key={b.nome} className="flex justify-between text-slate-600 text-[11px]">
                            <span>
                              &bull; Brinde: <strong>{b.nome}</strong>
                            </span>
                            <span className="font-mono">
                              {b.valorAdicional === 0 ? 'Cortesia (R$ 0,00)' : `+ R$ ${b.valorAdicional.toFixed(2)}`}
                            </span>
                          </div>
                        ))}
                    </div>

                    <div className="pt-3 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-slate-900 uppercase block">SOMA TOTAL DO KIT:</span>
                        <span className="text-[11px] text-purple-700 font-medium">
                          Valor que será cobrado no cartão ou parcelado no boleto
                        </span>
                      </div>
                      <div className="font-mono font-black text-2xl text-purple-950">
                        R$ {somaTotalKit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {/* Seleção da Forma de Pagamento */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Forma de Pagamento *</label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormFormaPagamento('CARTAO')}
                        className={`py-3 px-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition ${
                          formFormaPagamento === 'CARTAO'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm ring-2 ring-emerald-400'
                            : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <CreditCard className="w-5 h-5 text-emerald-600" />
                        <span>Cartão de Crédito</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormFormaPagamento('BOLETO')}
                        className={`py-3 px-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition ${
                          formFormaPagamento === 'BOLETO'
                            ? 'border-amber-500 bg-amber-50 text-amber-800 shadow-sm ring-2 ring-amber-400'
                            : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <Barcode className="w-5 h-5 text-amber-600" />
                        <span>Boleto / Carnê</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormFormaPagamento('PIX')}
                        className={`py-3 px-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition ${
                          formFormaPagamento === 'PIX'
                            ? 'border-purple-500 bg-purple-50 text-purple-800 shadow-sm ring-2 ring-purple-400'
                            : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <span>PIX À Vista</span>
                      </button>
                    </div>
                  </div>

                  {/* Detalhes do Cartão */}
                  {formFormaPagamento === 'CARTAO' && (
                    <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3">
                      <span className="text-xs font-extrabold text-emerald-900 block">Dados da Transação no Cartão:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Parcelamento do Kit</label>
                          <select
                            value={formCartaoParcelas}
                            onChange={(e) => setFormCartaoParcelas(e.target.value)}
                            className="w-full bg-white text-slate-900 text-xs rounded-xl p-2.5 border border-slate-200 font-mono font-bold"
                          >
                            {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((p) => (
                              <option key={p} value={p}>
                                {p}x de R$ {(somaTotalKit / p).toFixed(2)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Bandeira</label>
                          <select
                            value={formCartaoBandeira}
                            onChange={(e) => setFormCartaoBandeira(e.target.value)}
                            className="w-full bg-white text-slate-900 text-xs rounded-xl p-2.5 border border-slate-200"
                          >
                            <option value="Mastercard">Mastercard</option>
                            <option value="Visa">Visa</option>
                            <option value="Elo">Elo</option>
                            <option value="American Express">American Express</option>
                            <option value="Hipercard">Hipercard</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Código NSU / Autorização</label>
                          <input
                            type="text"
                            placeholder="ex: NSU-849102"
                            value={formCartaoNsu}
                            onChange={(e) => setFormCartaoNsu(e.target.value)}
                            className="w-full bg-white text-slate-900 text-xs rounded-xl p-2.5 border border-slate-200"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detalhes do Boleto */}
                  {formFormaPagamento === 'BOLETO' && (
                    <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-3">
                      <span className="text-xs font-extrabold text-amber-900 block flex items-center">
                        <Barcode className="w-4 h-4 mr-1.5" />
                        Emissão de Carnê Sicredi:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Parcelamento do Kit</label>
                          <select
                            value={formBoletoParcelas}
                            onChange={(e) => setFormBoletoParcelas(e.target.value)}
                            className="w-full bg-white text-slate-900 text-xs rounded-xl p-2.5 border border-slate-200 font-mono font-bold"
                          >
                            {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((p) => (
                              <option key={p} value={p}>
                                {p} parcelas de R$ {(somaTotalKit / p).toFixed(2)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">1º Vencimento</label>
                          <input
                            type="date"
                            required
                            value={formPrimeiroVencimento}
                            onChange={(e) => setFormPrimeiroVencimento(e.target.value)}
                            className="w-full bg-white text-slate-900 text-xs rounded-xl p-2.5 border border-slate-200"
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-amber-800">
                        O sistema gerará automaticamente a linha digitável e o QR Code PIX para cada parcela do carnê.
                      </p>
                    </div>
                  )}

                  {/* Observações */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Observações da Produção</label>
                    <textarea
                      rows={2}
                      placeholder="ex: Fotos com os avós nas páginas centrais, gravação personalizada..."
                      value={formObservacoes}
                      onChange={(e) => setFormObservacoes(e.target.value)}
                      className="w-full bg-[#F4F6FB] text-slate-900 text-xs rounded-xl p-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                    />
                  </div>

                  {/* Botões Finais de Confirmação */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setFormAbaAtiva('BRINDES')}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                    >
                      Voltar aos Brindes
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setModalNovaVendaAberto(false)}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#C026D3] text-white text-xs font-extrabold shadow-[0_4px_0_0_#581C87,0_8px_16px_rgba(147,51,234,0.3)] hover:brightness-110 active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center space-x-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Confirmar Venda do Kit (R$ {somaTotalKit.toFixed(2)})</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: VISUALIZADOR E EMISSOR DE BOLETOS / CARNÊ SICREDI
          ========================================================================= */}
      {vendaSelecionadaBoletos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-[32px] w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 lg:p-8 shadow-2xl border border-slate-100">
            {/* Header do Carnê */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                  <Barcode className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-black text-slate-900">
                      Carnê de Boletos Sicredi • {vendaSelecionadaBoletos.codigoPedido}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Sicredi 748-X
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Formando: <strong>{vendaSelecionadaBoletos.alunoNome}</strong> ({vendaSelecionadaBoletos.turmaNome})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setVendaSelecionadaBoletos(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informações Resumidas do Kit no Carnê */}
            <div className="my-4 p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-amber-950 font-extrabold text-sm block">
                  Kit: {vendaSelecionadaBoletos.modeloAlbum}
                </span>
                <div className="text-amber-800 text-[11px] mt-0.5">
                  Brindes Inclusos:{' '}
                  {vendaSelecionadaBoletos.brindes?.filter((b) => b.selecionado).map((b) => b.nome).join(', ') || 'Nenhum'}
                </div>
                <span className="text-amber-900 font-bold text-xs mt-1 block">
                  Soma Total do Kit: <strong>R$ {vendaSelecionadaBoletos.valorTotalKit.toFixed(2)}</strong> em{' '}
                  {vendaSelecionadaBoletos.parcelasBoletos?.length} parcelas
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs flex items-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Carnê</span>
                </button>
                <a
                  href={`https://wa.me/55${vendaSelecionadaBoletos.alunoTelefone.replace(
                    /\D/g,
                    ''
                  )}?text=Olá%20${encodeURIComponent(
                    vendaSelecionadaBoletos.alunoNome
                  )},%20seguem%20os%20dados%20do%20seu%20carnê%20de%20boletos%20do%20Kit%20(${encodeURIComponent(
                    vendaSelecionadaBoletos.modeloAlbum
                  )}%20-%20${encodeURIComponent(vendaSelecionadaBoletos.codigoPedido)}).`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs flex items-center space-x-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Enviar no WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Lista de Parcelas e Boletos */}
            <div className="space-y-3.5">
              {vendaSelecionadaBoletos.parcelasBoletos?.map((parcela) => {
                const isPaga = parcela.status === 'PAGO';

                return (
                  <div
                    key={parcela.numero}
                    className={`p-4 rounded-2xl border transition-all ${
                      isPaga
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-white border-slate-200/90 shadow-2xs hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                      <div className="flex items-center space-x-2.5">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isPaga ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {parcela.numero}
                        </span>
                        <div>
                          <strong className="text-slate-900 text-xs block">
                            Parcela {parcela.numero} de {vendaSelecionadaBoletos.parcelasBoletos?.length}
                          </strong>
                          <span className="text-[11px] text-slate-500">
                            Vencimento: <strong>{parcela.vencimento}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <span className="font-mono font-black text-slate-900 text-sm block">
                            R$ {parcela.valor.toFixed(2)}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                              isPaga
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isPaga ? 'Liquidado' : 'Aguardando Pagamento'}
                          </span>
                        </div>

                        {/* Botão de Dar Baixa / Alternar */}
                        <button
                          onClick={() => alternarStatusParcela(vendaSelecionadaBoletos.id, parcela.numero)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs ${
                            isPaga
                              ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {isPaga ? 'Desfazer Baixa' : 'Confirmar Pagamento'}
                        </button>
                      </div>
                    </div>

                    {/* Linha Digitável e PIX */}
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {/* Linha Digitável */}
                      <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-slate-200/70 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-slate-500 block uppercase">Linha Digitável:</span>
                          <code className="text-[11px] font-mono text-slate-800 truncate block select-all">
                            {parcela.linhaDigitavel}
                          </code>
                        </div>
                        <button
                          onClick={() => copiarTexto(parcela.linhaDigitavel, `linha-${parcela.numero}`)}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shrink-0"
                          title="Copiar Linha Digitável"
                        >
                          {copiadoIdx === `linha-${parcela.numero}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* PIX Copia e Cola */}
                      <div className="bg-[#FAF5FF] p-2.5 rounded-xl border border-purple-200/70 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-purple-700 block uppercase">PIX Copia e Cola:</span>
                          <code className="text-[11px] font-mono text-purple-900 truncate block select-all">
                            {parcela.codigoPix}
                          </code>
                        </div>
                        <button
                          onClick={() => copiarTexto(parcela.codigoPix, `pix-${parcela.numero}`)}
                          className="p-1.5 rounded-lg bg-white border border-purple-200 text-purple-700 hover:text-purple-900 shrink-0"
                          title="Copiar Código PIX"
                        >
                          {copiadoIdx === `pix-${parcela.numero}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: COMPROVANTE DE PAGAMENTO NO CARTÃO DO KIT
          ========================================================================= */}
      {vendaSelecionadaCartao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-[32px] w-full max-w-md p-6 lg:p-8 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Comprovante de Cartão</h3>
                  <p className="text-xs text-slate-500">{vendaSelecionadaCartao.codigoPedido}</p>
                </div>
              </div>
              <button
                onClick={() => setVendaSelecionadaCartao(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recibo Tátil da Maquininha */}
            <div className="my-5 p-5 bg-[#F8FAFC] rounded-2xl border border-slate-200/80 font-mono text-xs space-y-2.5">
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <span className="font-bold text-slate-900 text-sm block">ON AGÊNCIA DE EVENTOS</span>
                <span className="text-[10px] text-slate-500">CNPJ: 00.000.000/0001-00</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Formando:</span>
                <strong className="text-slate-900">{vendaSelecionadaCartao.alunoNome}</strong>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Turma:</span>
                <span className="text-slate-800">{vendaSelecionadaCartao.turmaNome}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Modelo:</span>
                <strong className="text-purple-900">{vendaSelecionadaCartao.modeloAlbum}</strong>
              </div>

              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Brindes do Kit:</span>
                <span className="text-right text-slate-800 max-w-[180px]">
                  {vendaSelecionadaCartao.brindes?.filter((b) => b.selecionado).map((b) => b.nome).join(', ') || 'Nenhum'}
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Bandeira:</span>
                <strong className="text-slate-900">{vendaSelecionadaCartao.cartaoBandeira}</strong>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Parcelamento:</span>
                <strong className="text-slate-900">
                  {vendaSelecionadaCartao.cartaoQtdParcelas}x de R${' '}
                  {(vendaSelecionadaCartao.valorTotalKit / (vendaSelecionadaCartao.cartaoQtdParcelas || 1)).toFixed(2)}
                </strong>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Autorização / NSU:</span>
                <span className="text-slate-900 font-bold">{vendaSelecionadaCartao.cartaoNsu}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Status da Transação:</span>
                <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                  {vendaSelecionadaCartao.cartaoStatus}
                </span>
              </div>

              <div className="pt-3 border-t border-dashed border-slate-300 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-900">SOMA TOTAL DO KIT:</span>
                <span className="font-black text-slate-900 text-base">
                  R$ {vendaSelecionadaCartao.valorTotalKit.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                window.print();
              }}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-2 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Recibo de Venda</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
