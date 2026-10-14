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
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';

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
  pacoteAlbum: string;
  detalhesPacote: string;
  valorTotal: number;
  formaPagamento: 'CARTAO' | 'BOLETO' | 'PIX';
  // Dados do Cartão
  cartaoQtdParcelas?: number;
  cartaoBandeira?: string;
  cartaoNsu?: string;
  cartaoStatus?: string;
  // Dados do Boleto
  boletoQtdParcelas?: number;
  parcelasBoletos?: ParcelaBoleto[];
  // Status de Produção do Álbum
  statusProducao: 'EM_DIAGRAMACAO' | 'EM_GRAFICA' | 'PRONTO_ENTREGA' | 'ENTREGUE';
  observacoes?: string;
}

const VENDAS_INICIAIS: VendaAlbum[] = [
  {
    id: 'venda-1',
    codigoPedido: 'ALB-2026-089',
    dataVenda: '12/10/2026',
    alunoNome: 'Mariana Silveira Ramos',
    alunoCpf: '384.920.198-44',
    alunoTelefone: '11987654321',
    alunoEmail: 'mariana.ramos@gmail.com',
    turmaNome: 'Direito Mackenzie 2027.1',
    pacoteAlbum: 'Álbum Luxo 50 Lâminas',
    detalhesPacote: 'Capa Acrílica Cristal, Estojo Box Revestido e Mini Álbum para Pais',
    valorTotal: 4200,
    formaPagamento: 'CARTAO',
    cartaoQtdParcelas: 10,
    cartaoBandeira: 'Mastercard',
    cartaoNsu: 'NSU-894210',
    cartaoStatus: 'Aprovado / Liquidado',
    statusProducao: 'EM_GRAFICA',
    observacoes: 'Inserir fotos da colação de grau nas primeiras 10 lâminas.',
  },
  {
    id: 'venda-2',
    codigoPedido: 'ALB-2026-090',
    dataVenda: '10/10/2026',
    alunoNome: 'Lucas Henrique Andrade',
    alunoCpf: '419.821.402-91',
    alunoTelefone: '11976543210',
    alunoEmail: 'lucas.andrade@usp.br',
    turmaNome: 'Medicina USP 2026.2',
    pacoteAlbum: 'Combo Master 60 Lâminas',
    detalhesPacote: 'Box em Madeira Nobre Maciça, Pen Drive Cristal 4K e Galeria Digital',
    valorTotal: 5800,
    formaPagamento: 'BOLETO',
    boletoQtdParcelas: 6,
    parcelasBoletos: [
      {
        numero: 1,
        vencimento: '15/10/2026',
        valor: 966.66,
        status: 'PAGO',
        linhaDigitavel: '74891.12003 40001.234508 12345.678901 1 98760000096666',
        codigoPix: '00020126580014br.gov.bcb.pix0136e4b8c9f0-1234-5678-90ab-cdef123456785204000053039865406966.665802BR5915ON EVENTOS LTDA6009SAO PAULO62070503***6304E5F2',
      },
      {
        numero: 2,
        vencimento: '15/11/2026',
        valor: 966.66,
        status: 'PAGO',
        linhaDigitavel: '74891.12003 40001.234508 12345.678902 2 98760000096666',
        codigoPix: '00020126580014br.gov.bcb.pix0136e4b8c9f0-1234-5678-90ab-cdef123456785204000053039865406966.665802BR5915ON EVENTOS LTDA6009SAO PAULO62070503***6304B7D1',
      },
      {
        numero: 3,
        vencimento: '15/12/2026',
        valor: 966.66,
        status: 'PENDENTE',
        linhaDigitavel: '74891.12003 40001.234508 12345.678903 3 98760000096666',
        codigoPix: '00020126580014br.gov.bcb.pix0136e4b8c9f0-1234-5678-90ab-cdef123456785204000053039865406966.665802BR5915ON EVENTOS LTDA6009SAO PAULO62070503***6304C8A9',
      },
      {
        numero: 4,
        vencimento: '15/01/2027',
        valor: 966.66,
        status: 'PENDENTE',
        linhaDigitavel: '74891.12003 40001.234508 12345.678904 4 98760000096666',
        codigoPix: '00020126580014br.gov.bcb.pix0136e4b8c9f0-1234-5678-90ab-cdef123456785204000053039865406966.665802BR5915ON EVENTOS LTDA6009SAO PAULO62070503***6304D9F0',
      },
      {
        numero: 5,
        vencimento: '15/02/2027',
        valor: 966.66,
        status: 'PENDENTE',
        linhaDigitavel: '74891.12003 40001.234508 12345.678905 5 98760000096666',
        codigoPix: '00020126580014br.gov.bcb.pix0136e4b8c9f0-1234-5678-90ab-cdef123456785204000053039865406966.665802BR5915ON EVENTOS LTDA6009SAO PAULO62070503***6304AA32',
      },
      {
        numero: 6,
        vencimento: '15/03/2027',
        valor: 966.70,
        status: 'PENDENTE',
        linhaDigitavel: '74891.12003 40001.234508 12345.678906 6 98760000096670',
        codigoPix: '00020126580014br.gov.bcb.pix0136e4b8c9f0-1234-5678-90ab-cdef123456785204000053039865406966.705802BR5915ON EVENTOS LTDA6009SAO PAULO62070503***6304BB44',
      },
    ],
    statusProducao: 'EM_DIAGRAMACAO',
    observacoes: 'Aprovou prévia digital via WhatsApp. Boletos emitidos via Sicredi.',
  },
  {
    id: 'venda-3',
    codigoPedido: 'ALB-2026-091',
    dataVenda: '08/10/2026',
    alunoNome: 'Beatriz Faria Camargo',
    alunoCpf: '312.450.890-12',
    alunoTelefone: '11965432109',
    alunoEmail: 'beatriz.camargo@fgv.br',
    turmaNome: 'Administração FGV 2026.2',
    pacoteAlbum: 'Álbum Premium 40 Lâminas',
    detalhesPacote: 'Capa Couro Sintético Nobre, Laminação UV Fosca e Estojo Box',
    valorTotal: 3600,
    formaPagamento: 'CARTAO',
    cartaoQtdParcelas: 6,
    cartaoBandeira: 'Visa',
    cartaoNsu: 'NSU-412093',
    cartaoStatus: 'Aprovado / Liquidado',
    statusProducao: 'ENTREGUE',
    observacoes: 'Entregue com termo assinado pela comissão.',
  },
  {
    id: 'venda-4',
    codigoPedido: 'ALB-2026-092',
    dataVenda: '05/10/2026',
    alunoNome: 'Gabriel Mendes Souza',
    alunoCpf: '501.230.981-67',
    alunoTelefone: '11954321098',
    alunoEmail: 'gabriel.souza@usp.br',
    turmaNome: 'Engenharia Civil Poli-USP 2027.1',
    pacoteAlbum: 'Álbum Luxo 50 Lâminas',
    detalhesPacote: 'Capa Acrílica Cristal, Estojo Box Revestido e Mini Álbum',
    valorTotal: 4200,
    formaPagamento: 'BOLETO',
    boletoQtdParcelas: 4,
    parcelasBoletos: [
      {
        numero: 1,
        vencimento: '10/10/2026',
        valor: 1050,
        status: 'PAGO',
        linhaDigitavel: '74891.12003 40002.345609 23456.789012 1 98760000105000',
        codigoPix: '00020126580014br.gov.bcb.pix0136e4b8c9f0-1234-5678-90ab-cdef1234567852040000530398654071050.005802BR5915ON EVENTOS LTDA6009SAO PAULO62070503***6304F1A2',
      },
      {
        numero: 2,
        vencimento: '10/11/2026',
        valor: 1050,
        status: 'PENDENTE',
        linhaDigitavel: '74891.12003 40002.345609 23456.789013 2 98760000105000',
        codigoPix: '00020126580014br.gov.bcb.pix0136e4b8c9f0-1234-5678-90ab-cdef1234567852040000530398654071050.005802BR5915ON EVENTOS LTDA6009SAO PAULO62070503***6304F2B3',
      },
      {
        numero: 3,
        vencimento: '10/12/2026',
        valor: 1050,
        status: 'PENDENTE',
        linhaDigitavel: '74891.12003 40002.345609 23456.789014 3 98760000105000',
        codigoPix: '00020126580014br.gov.bcb.pix0136e4b8c9f0-1234-5678-90ab-cdef1234567852040000530398654071050.005802BR5915ON EVENTOS LTDA6009SAO PAULO62070503***6304F3C4',
      },
      {
        numero: 4,
        vencimento: '10/01/2027',
        valor: 1050,
        status: 'PENDENTE',
        linhaDigitavel: '74891.12003 40002.345609 23456.789015 4 98760000105000',
        codigoPix: '00020126580014br.gov.bcb.pix0136e4b8c9f0-1234-5678-90ab-cdef1234567852040000530398654071050.005802BR5915ON EVENTOS LTDA6009SAO PAULO62070503***6304F4D5',
      },
    ],
    statusProducao: 'EM_DIAGRAMACAO',
    observacoes: 'Aguardando seleção das 30 fotos extras pelo portal do formando.',
  },
  {
    id: 'venda-5',
    codigoPedido: 'ALB-2026-093',
    dataVenda: '02/10/2026',
    alunoNome: 'Camila Toledo Vasconcelos',
    alunoCpf: '289.145.720-33',
    alunoTelefone: '11943210987',
    alunoEmail: 'camila.toledo@einstein.br',
    turmaNome: 'Enfermagem Albert Einstein 2026.2',
    pacoteAlbum: 'Pacote Digital + Álbum 30 Lâminas',
    detalhesPacote: 'Álbum Econômico Capa Dura Fosca + Pen Drive com Todas as Fotos',
    valorTotal: 2800,
    formaPagamento: 'PIX',
    statusProducao: 'PRONTO_ENTREGA',
    observacoes: 'Pago à vista via PIX Direto.',
  },
];

export default function VendasAlbunsPage() {
  const [vendas, setVendas] = useState<VendaAlbum[]>(VENDAS_INICIAIS);
  const [busca, setBusca] = useState('');
  const [filtroPagamento, setFiltroPagamento] = useState<'TODOS' | 'CARTAO' | 'BOLETO' | 'PIX'>('TODOS');
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Estados dos Modais
  const [modalNovaVendaAberto, setModalNovaVendaAberto] = useState(false);
  const [vendaSelecionadaBoletos, setVendaSelecionadaBoletos] = useState<VendaAlbum | null>(null);
  const [vendaSelecionadaCartao, setVendaSelecionadaCartao] = useState<VendaAlbum | null>(null);
  const [copiadoIdx, setCopiadoIdx] = useState<string | null>(null);

  // Formulário Nova Venda
  const [formNome, setFormNome] = useState('');
  const [formCpf, setFormCpf] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTurma, setFormTurma] = useState('Direito Mackenzie 2027.1');
  const [formPacote, setFormPacote] = useState('Álbum Luxo 50 Lâminas');
  const [formValor, setFormValor] = useState('4200');
  const [formFormaPagamento, setFormFormaPagamento] = useState<'CARTAO' | 'BOLETO' | 'PIX'>('CARTAO');
  const [formCartaoParcelas, setFormCartaoParcelas] = useState('10');
  const [formCartaoBandeira, setFormCartaoBandeira] = useState('Mastercard');
  const [formCartaoNsu, setFormCartaoNsu] = useState('');
  const [formBoletoParcelas, setFormBoletoParcelas] = useState('6');
  const [formPrimeiroVencimento, setFormPrimeiroVencimento] = useState('2026-11-15');
  const [formObservacoes, setFormObservacoes] = useState('');

  // Carregar do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const salvo = localStorage.getItem('on_vendas_albuns_estado');
        if (salvo) {
          const parsed = JSON.parse(salvo);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setVendas(parsed);
          }
        }
      } catch (e) {}
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

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const copiarTexto = (texto: string, idRef: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(texto);
      setCopiadoIdx(idRef);
      setTimeout(() => setCopiadoIdx(null), 2000);
      showToast('Copiado para a área de transferência!');
    }
  };

  // Gerar Boletos Sicredi automáticos
  const gerarParcelasBoletos = (valorTotal: number, qtdParcelas: number, primeiroVenc: string): ParcelaBoleto[] => {
    const valorParcela = Math.floor((valorTotal / qtdParcelas) * 100) / 100;
    const diferencaCentavos = valorTotal - (valorParcela * qtdParcelas);
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

  // Criar nova venda
  const handleSubmitNovaVenda = (e: React.FormEvent) => {
    e.preventDefault();
    const vlr = parseFloat(formValor) || 0;
    const novoCodigo = `ALB-2026-${String(vendas.length + 90).padStart(3, '0')}`;
    const dataHoje = new Date().toLocaleDateString('pt-BR');

    let parcelasGeradas: ParcelaBoleto[] | undefined = undefined;
    if (formFormaPagamento === 'BOLETO') {
      parcelasGeradas = gerarParcelasBoletos(vlr, parseInt(formBoletoParcelas) || 1, formPrimeiroVencimento);
    }

    const nova: VendaAlbum = {
      id: `venda-${Date.now()}`,
      codigoPedido: novoCodigo,
      dataVenda: dataHoje,
      alunoNome: formNome.trim(),
      alunoCpf: formCpf.trim(),
      alunoTelefone: formTelefone.trim(),
      alunoEmail: formEmail.trim(),
      turmaNome: formTurma,
      pacoteAlbum: formPacote,
      detalhesPacote: formPacote.includes('Luxo')
        ? 'Capa Acrílica Cristal, Estojo Box Revestido e Mini Álbum Pais'
        : formPacote.includes('Master')
        ? 'Box Madeira Nobre, Pen Drive 4K e Galeria Digital'
        : 'Capa Couro Nobre e Laminação Especial',
      valorTotal: vlr,
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
    showToast(`Venda ${novoCodigo} cadastrada com sucesso!`);

    // Reset formulário
    setFormNome('');
    setFormCpf('');
    setFormTelefone('');
    setFormEmail('');
    setFormObservacoes('');
    setFormCartaoNsu('');
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
  const totalFaturamento = vendas.reduce((acc, v) => acc + v.valorTotal, 0);
  const totalCartao = vendas
    .filter((v) => v.formaPagamento === 'CARTAO')
    .reduce((acc, v) => acc + v.valorTotal, 0);
  const totalBoleto = vendas
    .filter((v) => v.formaPagamento === 'BOLETO')
    .reduce((acc, v) => acc + v.valorTotal, 0);
  const totalPix = vendas
    .filter((v) => v.formaPagamento === 'PIX')
    .reduce((acc, v) => acc + v.valorTotal, 0);
  const totalEmProducao = vendas.filter(
    (v) => v.statusProducao === 'EM_DIAGRAMACAO' || v.statusProducao === 'EM_GRAFICA'
  ).length;

  // Filtragem
  const vendasFiltradas = vendas.filter((v) => {
    const matchBusca =
      v.alunoNome.toLowerCase().includes(busca.toLowerCase()) ||
      v.alunoCpf.includes(busca) ||
      v.codigoPedido.toLowerCase().includes(busca.toLowerCase()) ||
      v.turmaNome.toLowerCase().includes(busca.toLowerCase());

    const matchPagamento =
      filtroPagamento === 'TODOS' || v.formaPagamento === filtroPagamento;

    const matchStatus =
      filtroStatus === 'TODOS' || v.statusProducao === filtroStatus;

    return matchBusca && matchPagamento && matchStatus;
  });

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col lg:flex-row antialiased font-sans">
      {/* Sidebar Lateral Flutuante Roxa com Relevo Tátil */}
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
        {/* Header Superior com Relevo Tátil e Logo Oficial */}
        <header className="bg-white/80 backdrop-blur-md rounded-[24px] p-4 lg:px-6 lg:py-4 mb-6 shadow-[0_8px_24px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-fuchsia-600 via-purple-600 to-indigo-600 text-white shadow-[0_6px_16px_rgba(192,38,211,0.25)] flex items-center justify-center shrink-0">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
                  Vendas de Álbuns & Fotografia
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200">
                  {vendas.length} pedidos
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Gestão comercial de álbuns, registro de compras no cartão e emissão de boletos com PIX.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setModalNovaVendaAberto(true)}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#C026D3] text-white text-xs font-extrabold shadow-[0_4px_0_0_#581C87,0_8px_16px_rgba(147,51,234,0.3)] hover:brightness-110 hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
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
                Total Vendido
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
              <span>{vendas.length} álbuns contratados</span>
            </div>
          </div>

          {/* Card 2: Vendas no Cartão */}
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
              {vendas.filter((v) => v.formaPagamento === 'CARTAO').length} pedidos liquidados
            </div>
          </div>

          {/* Card 3: Vendas no Boleto */}
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
              placeholder="Buscar por formando, CPF, turma ou código do pedido..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-[#F4F6FB] text-slate-900 placeholder:text-slate-400 text-xs rounded-2xl pl-9 pr-4 py-2.5 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] shadow-inner transition"
            />
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

          {/* Filtro Status Produção */}
          <div className="flex items-center space-x-2">
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="bg-[#F4F6FB] text-slate-700 text-xs font-semibold rounded-2xl px-3 py-2 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="EM_DIAGRAMACAO">Em Diagramação</option>
              <option value="EM_GRAFICA">Em Gráfica</option>
              <option value="PRONTO_ENTREGA">Pronto para Entrega</option>
              <option value="ENTREGUE">Entregue</option>
            </select>
          </div>
        </div>

        {/* =========================================================================
            TABELA DE VENDAS DE ÁLBUNS
            ========================================================================= */}
        <section className="bg-white rounded-[28px] border border-slate-100 shadow-[0_12px_32px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-4 px-5">Pedido</th>
                  <th className="py-4 px-5">Formando / Turma</th>
                  <th className="py-4 px-5">Pacote do Álbum</th>
                  <th className="py-4 px-5">Valor Total</th>
                  <th className="py-4 px-5">Forma de Pagamento</th>
                  <th className="py-4 px-5">Produção</th>
                  <th className="py-4 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Nenhuma venda de álbum encontrada com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  vendasFiltradas.map((venda) => {
                    const parcelasPagas = venda.parcelasBoletos?.filter((p) => p.status === 'PAGO').length || 0;
                    const totalParcelasBoleto = venda.parcelasBoletos?.length || 0;

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

                        {/* Pacote do Álbum */}
                        <td className="py-4 px-5">
                          <span className="font-bold text-slate-800 block text-xs">
                            {venda.pacoteAlbum}
                          </span>
                          <span className="text-[11px] text-slate-500 line-clamp-1">
                            {venda.detalhesPacote}
                          </span>
                        </td>

                        {/* Valor Total */}
                        <td className="py-4 px-5 font-mono font-black text-slate-900 text-sm">
                          R$ {venda.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Forma de Pagamento */}
                        <td className="py-4 px-5">
                          {venda.formaPagamento === 'CARTAO' && (
                            <div>
                              <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CreditCard className="w-3.5 h-3.5 mr-1" />
                                Cartão {venda.cartaoQtdParcelas}x de R${' '}
                                {(venda.valorTotal / (venda.cartaoQtdParcelas || 1)).toFixed(2)}
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
                          {/* Botão de Ver Boletos (se boleto) */}
                          {venda.formaPagamento === 'BOLETO' && (
                            <button
                              onClick={() => setVendaSelecionadaBoletos(venda)}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-200 transition shadow-2xs"
                              title="Visualizar e Emitir Boletos Sicredi"
                            >
                              <Barcode className="w-3.5 h-3.5 inline mr-1" /> Boletos
                            </button>
                          )}

                          {/* Botão de Comprovante de Cartão (se cartão) */}
                          {venda.formaPagamento === 'CARTAO' && (
                            <button
                              onClick={() => setVendaSelecionadaCartao(venda)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 transition shadow-2xs"
                              title="Ver Comprovante da Transação no Cartão"
                            >
                              <CreditCard className="w-3.5 h-3.5 inline mr-1" /> Comprovante
                            </button>
                          )}

                          {/* Botão Avançar Status */}
                          <button
                            onClick={() => avancarStatusProducao(venda.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] border border-slate-200 transition shadow-2xs hover:translate-y-[-1px]"
                            title="Avançar etapa de produção do álbum"
                          >
                            <span>Avançar Etapa</span>
                            <ChevronRight className="w-3.5 h-3.5 inline ml-0.5" />
                          </button>

                          {/* WhatsApp Aluno */}
                          <a
                            href={`https://wa.me/55${venda.alunoTelefone.replace(/\D/g, '')}?text=Olá%20${encodeURIComponent(
                              venda.alunoNome
                            )},%20informamos%20que%20o%20seu%20álbum%20de%20formatura%20(${encodeURIComponent(
                              venda.codigoPedido
                            )})%20está%20com%20status:%20${venda.statusProducao}.`}
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
          MODAL 1: CADASTRAR NOVA VENDA DE ÁLBUM
          ========================================================================= */}
      {modalNovaVendaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 lg:p-8 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#C026D3] text-white flex items-center justify-center shadow-md">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Nova Venda de Álbum</h3>
                  <p className="text-xs text-slate-500">Registre compras no cartão ou emita carnê de boletos</p>
                </div>
              </div>
              <button
                onClick={() => setModalNovaVendaAberto(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNovaVenda} className="mt-5 space-y-4">
              {/* Dados do Formando */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">E-mail do Aluno</label>
                  <input
                    type="email"
                    placeholder="aluno@email.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-[#F4F6FB] text-slate-900 text-xs rounded-xl p-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  />
                </div>
              </div>

              {/* Turma & Pacote */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Turma / Faculdade *</label>
                  <select
                    value={formTurma}
                    onChange={(e) => setFormTurma(e.target.value)}
                    className="w-full bg-[#F4F6FB] text-slate-900 text-xs rounded-xl p-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  >
                    <option value="Direito Mackenzie 2027.1">Direito Mackenzie 2027.1</option>
                    <option value="Medicina USP 2026.2">Medicina USP 2026.2</option>
                    <option value="Administração FGV 2026.2">Administração FGV 2026.2</option>
                    <option value="Engenharia Civil Poli-USP 2027.1">Engenharia Civil Poli-USP 2027.1</option>
                    <option value="Enfermagem Albert Einstein 2026.2">Enfermagem Albert Einstein 2026.2</option>
                    <option value="Odontologia UNIP 2027.1">Odontologia UNIP 2027.1</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pacote de Álbum *</label>
                  <select
                    value={formPacote}
                    onChange={(e) => {
                      setFormPacote(e.target.value);
                      if (e.target.value.includes('50')) setFormValor('4200');
                      else if (e.target.value.includes('Master')) setFormValor('5800');
                      else if (e.target.value.includes('Premium')) setFormValor('3600');
                      else setFormValor('2800');
                    }}
                    className="w-full bg-[#F4F6FB] text-slate-900 text-xs rounded-xl p-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  >
                    <option value="Álbum Luxo 50 Lâminas">Álbum Luxo 50 Lâminas (Capa Cristal + Estojo Box)</option>
                    <option value="Combo Master 60 Lâminas">Combo Master 60 Lâminas (Box Madeira + Pen Drive)</option>
                    <option value="Álbum Premium 40 Lâminas">Álbum Premium 40 Lâminas (Capa Couro Nobre)</option>
                    <option value="Pacote Digital + Álbum 30 Lâminas">Pacote Digital + Álbum 30 Lâminas</option>
                  </select>
                </div>
              </div>

              {/* Valor Total */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Valor Total do Álbum (R$) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-xs">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formValor}
                    onChange={(e) => setFormValor(e.target.value)}
                    className="w-full bg-[#F4F6FB] text-slate-900 font-mono font-bold text-sm rounded-xl pl-10 pr-3 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  />
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div className="pt-2 border-t border-slate-100">
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
                    <span>PIX Direto</span>
                  </button>
                </div>
              </div>

              {/* Detalhes do Cartão */}
              {formFormaPagamento === 'CARTAO' && (
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3">
                  <span className="text-xs font-extrabold text-emerald-900 block">Dados da Transação no Cartão:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Parcelamento</label>
                      <select
                        value={formCartaoParcelas}
                        onChange={(e) => setFormCartaoParcelas(e.target.value)}
                        className="w-full bg-white text-slate-900 text-xs rounded-xl p-2.5 border border-slate-200"
                      >
                        {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((p) => (
                          <option key={p} value={p}>
                            {p}x de R$ {(parseFloat(formValor || '0') / p).toFixed(2)}
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
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Quantidade de Parcelas</label>
                      <select
                        value={formBoletoParcelas}
                        onChange={(e) => setFormBoletoParcelas(e.target.value)}
                        className="w-full bg-white text-slate-900 text-xs rounded-xl p-2.5 border border-slate-200"
                      >
                        {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((p) => (
                          <option key={p} value={p}>
                            {p} parcelas de R$ {(parseFloat(formValor || '0') / p).toFixed(2)}
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Observações da Diagramação</label>
                <textarea
                  rows={2}
                  placeholder="ex: Preferência por fotos externas, fotos com avós..."
                  value={formObservacoes}
                  onChange={(e) => setFormObservacoes(e.target.value)}
                  className="w-full bg-[#F4F6FB] text-slate-900 text-xs rounded-xl p-3 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>

              {/* Botões do Modal */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalNovaVendaAberto(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#C026D3] text-white text-xs font-extrabold shadow-[0_4px_0_0_#581C87,0_8px_16px_rgba(147,51,234,0.3)] hover:brightness-110 active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar e Cadastrar Venda</span>
                </button>
              </div>
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

            {/* Informações Resumidas do Carnê */}
            <div className="my-4 p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-amber-900 font-bold block">{vendaSelecionadaBoletos.pacoteAlbum}</span>
                <span className="text-amber-700 text-[11px]">
                  Valor Total: <strong>R$ {vendaSelecionadaBoletos.valorTotal.toFixed(2)}</strong> em{' '}
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
                  )},%20seguem%20os%20dados%20do%20seu%20carnê%20de%20boletos%20do%20álbum%20(${encodeURIComponent(
                    vendaSelecionadaBoletos.codigoPedido
                  )}).`}
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
          MODAL 3: COMPROVANTE DE PAGAMENTO NO CARTÃO
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
                <span>Bandeira:</span>
                <strong className="text-slate-900">{vendaSelecionadaCartao.cartaoBandeira}</strong>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Parcelamento:</span>
                <strong className="text-slate-900">
                  {vendaSelecionadaCartao.cartaoQtdParcelas}x de R${' '}
                  {(vendaSelecionadaCartao.valorTotal / (vendaSelecionadaCartao.cartaoQtdParcelas || 1)).toFixed(2)}
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
                <span className="font-bold text-slate-900">VALOR TOTAL:</span>
                <span className="font-black text-slate-900 text-base">
                  R$ {vendaSelecionadaCartao.valorTotal.toFixed(2)}
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
