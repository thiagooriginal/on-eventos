'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Handshake,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  X,
  Phone,
  Mail,
  Instagram,
  Globe,
  DollarSign,
  Star,
  Check,
  Edit3,
  Trash2,
  MapPin,
  Building,
  Home,
  Palmtree,
  PartyPopper,
  Mic,
  Camera,
  Users,
  Sparkles,
  Layers,
  Copy,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  Upload,
  Maximize2,
  Calendar,
  Briefcase,
  UserCheck,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import {
  ProfissionalLiberal,
  EspacoEvento,
  CategoriaProfissional,
  TipoEspaco,
  CATEGORIAS_PROFISSIONAIS,
  TIPOS_ESPACOS,
  INFRAESTRUTURAS_DISPONIVEIS,
  getProfissionais,
  getEspacos,
  salvarParceirosServidor,
  sincronizarParceirosServidor,
} from '@/lib/parceiros';

export default function ParceirosPage() {
  const [abaAtiva, setAbaAtiva] = useState<'profissionais' | 'espacos'>('profissionais');
  const [profissionais, setProfissionais] = useState<ProfissionalLiberal[]>([]);
  const [espacos, setEspacos] = useState<EspacoEvento[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Estados de Filtro e Busca
  const [busca, setBusca] = useState('');
  const [filtroCategoriaProf, setFiltroCategoriaProf] = useState<string>('TODAS');
  const [filtroTipoEspaco, setFiltroTipoEspaco] = useState<string>('TODOS');
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [filtroCidade, setFiltroCidade] = useState<string>('TODAS');

  // Toasts e Feedbacks
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // Modais de Criação e Edição
  const [modalProfissionalAberto, setModalProfissionalAberto] = useState(false);
  const [profissionalEditando, setProfissionalEditando] = useState<ProfissionalLiberal | null>(null);

  const [modalEspacoAberto, setModalEspacoAberto] = useState(false);
  const [espacoEditando, setEspacoEditando] = useState<EspacoEvento | null>(null);

  // Modal de Detalhes / Ficha Completa
  const [itemDetalhe, setItemDetalhe] = useState<{ tipo: 'prof' | 'espaco'; dados: any } | null>(null);

  // Formulário Profissional
  const [formProfNome, setFormProfNome] = useState('');
  const [formProfCategoria, setFormProfCategoria] = useState<string>('Recepcionista');
  const [formProfEspecialidade, setFormProfEspecialidade] = useState('');
  const [formProfTelefone, setFormProfTelefone] = useState('');
  const [formProfWhatsapp, setFormProfWhatsapp] = useState('');
  const [formProfEmail, setFormProfEmail] = useState('');
  const [formProfCidade, setFormProfCidade] = useState('São Paulo');
  const [formProfUf, setFormProfUf] = useState('SP');
  const [formProfRegiao, setFormProfRegiao] = useState('São Paulo e Grande ABC');
  const [formProfCache, setFormProfCache] = useState<string>('300');
  const [formProfUnidade, setFormProfUnidade] = useState<'POR_EVENTO' | 'POR_HORA' | 'POR_DIA' | 'A_COMBINAR'>('POR_EVENTO');
  const [formProfPix, setFormProfPix] = useState('');
  const [formProfTipoPix, setFormProfTipoPix] = useState<'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'ALEATORIA'>('EMAIL');
  const [formProfBancoPix, setFormProfBancoPix] = useState('');
  const [formProfCpfCnpj, setFormProfCpfCnpj] = useState('');
  const [formProfInstagram, setFormProfInstagram] = useState('');
  const [formProfPortfolio, setFormProfPortfolio] = useState('');
  const [formProfAvaliacao, setFormProfAvaliacao] = useState<number>(5);
  const [formProfStatus, setFormProfStatus] = useState<'DISPONIVEL' | 'EM_EVENTO' | 'INDISPONIVEL' | 'AVALIANDO'>('DISPONIVEL');
  const [formProfFotoUrl, setFormProfFotoUrl] = useState('');
  const [formProfHabilidades, setFormProfHabilidades] = useState('');
  const [formProfObservacoes, setFormProfObservacoes] = useState('');

  // Formulário Espaço
  const [formEspacoNome, setFormEspacoNome] = useState('');
  const [formEspacoTipo, setFormEspacoTipo] = useState<TipoEspaco>('SITIO');
  const [formEspacoCapacidade, setFormEspacoCapacidade] = useState<string>('500');
  const [formEspacoCapacidadeSentadas, setFormEspacoCapacidadeSentadas] = useState<string>('300');
  const [formEspacoEndereco, setFormEspacoEndereco] = useState('');
  const [formEspacoBairro, setFormEspacoBairro] = useState('');
  const [formEspacoCidade, setFormEspacoCidade] = useState('São Paulo');
  const [formEspacoUf, setFormEspacoUf] = useState('SP');
  const [formEspacoCep, setFormEspacoCep] = useState('');
  const [formEspacoMaps, setFormEspacoMaps] = useState('');
  const [formEspacoResponsavel, setFormEspacoResponsavel] = useState('');
  const [formEspacoTelefone, setFormEspacoTelefone] = useState('');
  const [formEspacoWhatsapp, setFormEspacoWhatsapp] = useState('');
  const [formEspacoEmail, setFormEspacoEmail] = useState('');
  const [formEspacoValor, setFormEspacoValor] = useState<string>('5000');
  const [formEspacoPeriodo, setFormEspacoPeriodo] = useState<'DIARIA' | 'FIM_DE_SEMANA' | 'POR_HORA' | 'PACOTE_EVENTO'>('DIARIA');
  const [formEspacoTaxaLimpeza, setFormEspacoTaxaLimpeza] = useState<string>('400');
  const [formEspacoFotoPrincipal, setFormEspacoFotoPrincipal] = useState('');
  const [formEspacoFotosAdicionais, setFormEspacoFotosAdicionais] = useState('');
  const [formEspacoInfra, setFormEspacoInfra] = useState<string[]>(['Piscina', 'Área com Churrasqueira', 'Estacionamento Próprio']);
  const [formEspacoAvaliacao, setFormEspacoAvaliacao] = useState<number>(5);
  const [formEspacoStatus, setFormEspacoStatus] = useState<'DISPONIVEL' | 'RESERVADO' | 'EM_REFORMA' | 'INATIVO'>('DISPONIVEL');
  const [formEspacoRegras, setFormEspacoRegras] = useState('');
  const [formEspacoHorarioSom, setFormEspacoHorarioSom] = useState('04:00');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const copiarTexto = (texto: string, id: string) => {
    navigator.clipboard.writeText(texto);
    setCopiadoId(id);
    showToast('✓ Copiado para a área de transferência!');
    setTimeout(() => setCopiadoId(null), 2500);
  };

  // Carregar dados iniciais e sincronizar com servidor
  useEffect(() => {
    const carregar = async () => {
      setCarregando(true);
      // Checa se veio com parâmetro na URL (?aba=espacos ou ?aba=profissionais)
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const urlAba = params.get('aba');
        if (urlAba === 'espacos') setAbaAtiva('espacos');
        if (urlAba === 'profissionais') setAbaAtiva('profissionais');
      }

      try {
        const servidor = await sincronizarParceirosServidor();
        if (servidor) {
          setProfissionais(servidor.profissionais);
          setEspacos(servidor.espacos);
        } else {
          setProfissionais(getProfissionais());
          setEspacos(getEspacos());
        }
      } catch (e) {
        setProfissionais(getProfissionais());
        setEspacos(getEspacos());
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, []);

  // Salvar alterações e persistir
  const persistirDados = (novosProfs: ProfissionalLiberal[], novosEspacos: EspacoEvento[]) => {
    setProfissionais(novosProfs);
    setEspacos(novosEspacos);
    salvarParceirosServidor(novosProfs, novosEspacos);
  };

  // Cidades únicas para o filtro
  const cidadesDisponiveis = useMemo(() => {
    const lista = abaAtiva === 'profissionais'
      ? profissionais.map((p) => p.cidade).filter(Boolean)
      : espacos.map((e) => e.cidade).filter(Boolean);
    return Array.from(new Set(lista)).sort();
  }, [abaAtiva, profissionais, espacos]);

  // Filtragem Profissionais
  const profissionaisFiltrados = useMemo(() => {
    return profissionais.filter((p) => {
      const q = busca.toLowerCase().trim();
      const matchBusca =
        !q ||
        p.nome.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q) ||
        (p.especialidade && p.especialidade.toLowerCase().includes(q)) ||
        p.cidade.toLowerCase().includes(q) ||
        p.telefone.includes(q) ||
        (p.instagram && p.instagram.toLowerCase().includes(q)) ||
        p.habilidades.some((h) => h.toLowerCase().includes(q));

      const matchCat = filtroCategoriaProf === 'TODAS' || p.categoria === filtroCategoriaProf;
      const matchStatus = filtroStatus === 'TODOS' || p.status === filtroStatus;
      const matchCidade = filtroCidade === 'TODAS' || p.cidade.toLowerCase() === filtroCidade.toLowerCase();

      return matchBusca && matchCat && matchStatus && matchCidade;
    });
  }, [profissionais, busca, filtroCategoriaProf, filtroStatus, filtroCidade]);

  // Filtragem Espaços
  const espacosFiltrados = useMemo(() => {
    return espacos.filter((e) => {
      const q = busca.toLowerCase().trim();
      const matchBusca =
        !q ||
        e.nome.toLowerCase().includes(q) ||
        e.tipoLabel.toLowerCase().includes(q) ||
        e.endereco.toLowerCase().includes(q) ||
        e.bairro.toLowerCase().includes(q) ||
        e.cidade.toLowerCase().includes(q) ||
        e.responsavelNome.toLowerCase().includes(q) ||
        e.infraestrutura.some((inf) => inf.toLowerCase().includes(q));

      const matchTipo = filtroTipoEspaco === 'TODOS' || e.tipo === filtroTipoEspaco;
      const matchStatus = filtroStatus === 'TODOS' || e.status === filtroStatus;
      const matchCidade = filtroCidade === 'TODAS' || e.cidade.toLowerCase() === filtroCidade.toLowerCase();

      return matchBusca && matchTipo && matchStatus && matchCidade;
    });
  }, [espacos, busca, filtroTipoEspaco, filtroStatus, filtroCidade]);

  // Handlers Profissionais
  const handleAbrirNovoProfissional = () => {
    setProfissionalEditando(null);
    setFormProfNome('');
    setFormProfCategoria('Recepcionista');
    setFormProfEspecialidade('');
    setFormProfTelefone('');
    setFormProfWhatsapp('');
    setFormProfEmail('');
    setFormProfCidade('São Paulo');
    setFormProfUf('SP');
    setFormProfRegiao('São Paulo e Grande ABC');
    setFormProfCache('300');
    setFormProfUnidade('POR_EVENTO');
    setFormProfPix('');
    setFormProfTipoPix('EMAIL');
    setFormProfBancoPix('');
    setFormProfCpfCnpj('');
    setFormProfInstagram('');
    setFormProfPortfolio('');
    setFormProfAvaliacao(5);
    setFormProfStatus('DISPONIVEL');
    setFormProfFotoUrl('');
    setFormProfHabilidades('');
    setFormProfObservacoes('');
    setModalProfissionalAberto(true);
  };

  const handleEditarProfissional = (prof: ProfissionalLiberal) => {
    setProfissionalEditando(prof);
    setFormProfNome(prof.nome);
    setFormProfCategoria(prof.categoria);
    setFormProfEspecialidade(prof.especialidade || '');
    setFormProfTelefone(prof.telefone);
    setFormProfWhatsapp(prof.whatsapp);
    setFormProfEmail(prof.email || '');
    setFormProfCidade(prof.cidade);
    setFormProfUf(prof.uf);
    setFormProfRegiao(prof.regiaoAtendimento || '');
    setFormProfCache(String(prof.valorDiariaOuCache || ''));
    setFormProfUnidade(prof.unidadeCobranca || 'POR_EVENTO');
    setFormProfPix(prof.chavePix || '');
    setFormProfTipoPix(prof.tipoChavePix || 'EMAIL');
    setFormProfBancoPix(prof.bancoPix || '');
    setFormProfCpfCnpj(prof.cpfOuCnpj || '');
    setFormProfInstagram(prof.instagram || '');
    setFormProfPortfolio(prof.portfolioUrl || '');
    setFormProfAvaliacao(prof.avaliacaoEstrelas);
    setFormProfStatus(prof.status);
    setFormProfFotoUrl(prof.fotoUrl || '');
    setFormProfHabilidades(prof.habilidades.join(', '));
    setFormProfObservacoes(prof.observacoes || '');
    setModalProfissionalAberto(true);
  };

  const handleSalvarProfissional = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProfNome.trim() || !formProfTelefone.trim()) {
      showToast('⚠️ Preencha pelo menos o nome e telefone de contato.');
      return;
    }

    const whatsLimpo = formProfWhatsapp.replace(/\D/g, '') || formProfTelefone.replace(/\D/g, '');
    const habilidadesArray = formProfHabilidades
      .split(/[,;\n]+/)
      .map((h) => h.trim())
      .filter(Boolean);

    const novoProf: ProfissionalLiberal = {
      id: profissionalEditando ? profissionalEditando.id : `prof-${Date.now()}`,
      nome: formProfNome.trim(),
      categoria: formProfCategoria,
      especialidade: formProfEspecialidade.trim() || undefined,
      telefone: formProfTelefone.trim(),
      whatsapp: whatsLimpo,
      email: formProfEmail.trim() || undefined,
      cidade: formProfCidade.trim(),
      uf: formProfUf.trim().toUpperCase(),
      regiaoAtendimento: formProfRegiao.trim() || undefined,
      valorDiariaOuCache: parseFloat(formProfCache) || 0,
      unidadeCobranca: formProfUnidade,
      chavePix: formProfPix.trim() || undefined,
      tipoChavePix: formProfTipoPix,
      bancoPix: formProfBancoPix.trim() || undefined,
      cpfOuCnpj: formProfCpfCnpj.trim() || undefined,
      instagram: formProfInstagram.trim() || undefined,
      portfolioUrl: formProfPortfolio.trim() || undefined,
      avaliacaoEstrelas: formProfAvaliacao,
      status: formProfStatus,
      fotoUrl: formProfFotoUrl.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      habilidades: habilidadesArray,
      observacoes: formProfObservacoes.trim() || undefined,
      totalEventosRealizados: profissionalEditando?.totalEventosRealizados || 1,
      criadoEm: profissionalEditando?.criadoEm || new Date().toISOString().split('T')[0],
    };

    let atualizados: ProfissionalLiberal[];
    if (profissionalEditando) {
      atualizados = profissionais.map((p) => (p.id === profissionalEditando.id ? novoProf : p));
      showToast(`✓ Profissional "${novoProf.nome}" atualizado com sucesso!`);
    } else {
      atualizados = [novoProf, ...profissionais];
      showToast(`✓ Profissional "${novoProf.nome}" cadastrado com sucesso!`);
    }

    persistirDados(atualizados, espacos);
    setModalProfissionalAberto(false);
  };

  const handleExcluirProfissional = (prof: ProfissionalLiberal) => {
    if (confirm(`Deseja realmente remover o profissional "${prof.nome}" (${prof.categoria})?`)) {
      const atualizados = profissionais.filter((p) => p.id !== prof.id);
      persistirDados(atualizados, espacos);
      showToast(`Profissional "${prof.nome}" removido.`);
      if (itemDetalhe?.dados?.id === prof.id) setItemDetalhe(null);
    }
  };

  // Handlers Espaços
  const handleAbrirNovoEspaco = () => {
    setEspacoEditando(null);
    setFormEspacoNome('');
    setFormEspacoTipo('SITIO');
    setFormEspacoCapacidade('500');
    setFormEspacoCapacidadeSentadas('300');
    setFormEspacoEndereco('');
    setFormEspacoBairro('');
    setFormEspacoCidade('São Paulo');
    setFormEspacoUf('SP');
    setFormEspacoCep('');
    setFormEspacoMaps('');
    setFormEspacoResponsavel('');
    setFormEspacoTelefone('');
    setFormEspacoWhatsapp('');
    setFormEspacoEmail('');
    setFormEspacoValor('5000');
    setFormEspacoPeriodo('DIARIA');
    setFormEspacoTaxaLimpeza('400');
    setFormEspacoFotoPrincipal('');
    setFormEspacoFotosAdicionais('');
    setFormEspacoInfra(['Piscina', 'Área com Churrasqueira', 'Estacionamento Próprio']);
    setFormEspacoAvaliacao(5);
    setFormEspacoStatus('DISPONIVEL');
    setFormEspacoRegras('');
    setFormEspacoHorarioSom('04:00');
    setModalEspacoAberto(true);
  };

  const handleEditarEspaco = (esp: EspacoEvento) => {
    setEspacoEditando(esp);
    setFormEspacoNome(esp.nome);
    setFormEspacoTipo(esp.tipo);
    setFormEspacoCapacidade(String(esp.capacidadePessoas));
    setFormEspacoCapacidadeSentadas(String(esp.capacidadeSentadas || ''));
    setFormEspacoEndereco(esp.endereco);
    setFormEspacoBairro(esp.bairro);
    setFormEspacoCidade(esp.cidade);
    setFormEspacoUf(esp.uf);
    setFormEspacoCep(esp.cep || '');
    setFormEspacoMaps(esp.linkGoogleMaps || '');
    setFormEspacoResponsavel(esp.responsavelNome);
    setFormEspacoTelefone(esp.telefone);
    setFormEspacoWhatsapp(esp.whatsapp);
    setFormEspacoEmail(esp.email || '');
    setFormEspacoValor(String(esp.valorLocacao || ''));
    setFormEspacoPeriodo(esp.periodoLocacao || 'DIARIA');
    setFormEspacoTaxaLimpeza(String(esp.taxaLimpeza || ''));
    setFormEspacoFotoPrincipal(esp.fotoPrincipal || '');
    setFormEspacoFotosAdicionais(esp.fotos.slice(1).join('\n'));
    setFormEspacoInfra(esp.infraestrutura);
    setFormEspacoAvaliacao(esp.avaliacaoEstrelas);
    setFormEspacoStatus(esp.status);
    setFormEspacoRegras(esp.regrasObservacoes || '');
    setFormEspacoHorarioSom(esp.horarioLimiteSom || '04:00');
    setModalEspacoAberto(true);
  };

  const handleSalvarEspaco = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEspacoNome.trim() || !formEspacoTelefone.trim()) {
      showToast('⚠️ Preencha o nome do espaço e telefone do responsável.');
      return;
    }

    const whatsLimpo = formEspacoWhatsapp.replace(/\D/g, '') || formEspacoTelefone.replace(/\D/g, '');
    const fotosArray: string[] = [];
    if (formEspacoFotoPrincipal.trim()) fotosArray.push(formEspacoFotoPrincipal.trim());
    if (formEspacoFotosAdicionais.trim()) {
      const extras = formEspacoFotosAdicionais
        .split(/[\n,;]+/)
        .map((f) => f.trim())
        .filter(Boolean);
      fotosArray.push(...extras);
    }
    if (fotosArray.length === 0) {
      fotosArray.push('https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&auto=format&fit=crop&q=80');
    }

    const achouTipo = TIPOS_ESPACOS.find((t) => t.id === formEspacoTipo);
    const tipoLabelFinal = achouTipo ? achouTipo.label : 'Espaço';

    const novoEspaco: EspacoEvento = {
      id: espacoEditando ? espacoEditando.id : `espaco-${Date.now()}`,
      nome: formEspacoNome.trim(),
      tipo: formEspacoTipo,
      tipoLabel: tipoLabelFinal,
      capacidadePessoas: parseInt(formEspacoCapacidade) || 100,
      capacidadeSentadas: parseInt(formEspacoCapacidadeSentadas) || undefined,
      endereco: formEspacoEndereco.trim(),
      bairro: formEspacoBairro.trim(),
      cidade: formEspacoCidade.trim(),
      uf: formEspacoUf.trim().toUpperCase(),
      cep: formEspacoCep.trim() || undefined,
      linkGoogleMaps: formEspacoMaps.trim() || undefined,
      responsavelNome: formEspacoResponsavel.trim() || 'Administração do Local',
      telefone: formEspacoTelefone.trim(),
      whatsapp: whatsLimpo,
      email: formEspacoEmail.trim() || undefined,
      valorLocacao: parseFloat(formEspacoValor) || 0,
      periodoLocacao: formEspacoPeriodo,
      taxaLimpeza: parseFloat(formEspacoTaxaLimpeza) || undefined,
      fotos: fotosArray,
      fotoPrincipal: fotosArray[0],
      infraestrutura: formEspacoInfra,
      avaliacaoEstrelas: formEspacoAvaliacao,
      status: formEspacoStatus,
      regrasObservacoes: formEspacoRegras.trim() || undefined,
      horarioLimiteSom: formEspacoHorarioSom.trim() || undefined,
      criadoEm: espacoEditando?.criadoEm || new Date().toISOString().split('T')[0],
    };

    let atualizados: EspacoEvento[];
    if (espacoEditando) {
      atualizados = espacos.map((e) => (e.id === espacoEditando.id ? novoEspaco : e));
      showToast(`✓ Espaço "${novoEspaco.nome}" atualizado com sucesso!`);
    } else {
      atualizados = [novoEspaco, ...espacos];
      showToast(`✓ Espaço "${novoEspaco.nome}" cadastrado com sucesso!`);
    }

    persistirDados(profissionais, atualizados);
    setModalEspacoAberto(false);
  };

  const handleExcluirEspaco = (esp: EspacoEvento) => {
    if (confirm(`Deseja realmente remover o espaço "${esp.nome}"?`)) {
      const atualizados = espacos.filter((e) => e.id !== esp.id);
      persistirDados(profissionais, atualizados);
      showToast(`Espaço "${esp.nome}" removido.`);
      if (itemDetalhe?.dados?.id === esp.id) setItemDetalhe(null);
    }
  };

  // Alternar checkbox de infraestrutura
  const toggleInfra = (item: string) => {
    if (formEspacoInfra.includes(item)) {
      setFormEspacoInfra(formEspacoInfra.filter((i) => i !== item));
    } else {
      setFormEspacoInfra([...formEspacoInfra, item]);
    }
  };

  // Cores por categoria de profissional
  const getBadgeCorCategoria = (cat: string) => {
    switch (cat) {
      case 'Recepcionista':
        return 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200';
      case 'Fotógrafo':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Mestre de Cerimônias':
        return 'bg-amber-50 text-amber-900 border-amber-200';
      case 'Barman / Bartender':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'DJ / Sonorização':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'Segurança':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Garçom':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // Cores por tipo de espaço
  const getBadgeCorTipoEspaco = (tipo: TipoEspaco) => {
    switch (tipo) {
      case 'SITIO':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'CASA_PISCINA':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200';
      case 'MANSAO':
        return 'bg-amber-50 text-amber-900 border-amber-200';
      case 'BAR':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'ESPACO_EVENTO':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'ROOFTOP':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // Métricas
  const totalProfsDisponiveis = profissionais.filter((p) => p.status === 'DISPONIVEL').length;
  const totalEspacosDisponiveis = espacos.filter((e) => e.status === 'DISPONIVEL').length;
  const capacidadeTotalEspacos = espacos.reduce((acc, e) => acc + (e.capacidadePessoas || 0), 0);
  const mediaCacheProfissional = profissionais.length > 0
    ? profissionais.reduce((acc, p) => acc + (p.valorDiariaOuCache || 0), 0) / profissionais.length
    : 0;

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col lg:flex-row antialiased font-sans">
      {/* Sidebar Lateral */}
      <Sidebar paginaAtiva="parceiros" />

      {/* Toast Flutuante */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#36218A] text-white px-5 py-3 rounded-2xl shadow-[0_10px_30px_rgba(54,33,138,0.45)] border border-purple-400/40 text-xs font-bold flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Conteúdo Principal Direito */}
      <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 lg:pl-2">
        {/* Header Superior com Relevo Tátil e Ações Rápidas */}
        <header className="bg-white/80 backdrop-blur-md rounded-[24px] p-4 lg:px-6 lg:py-4 mb-6 shadow-[0_8px_24px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 text-white shadow-[0_6px_16px_rgba(16,185,129,0.25)] flex items-center justify-center shrink-0">
              <Handshake className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
                  PARCEIROS & ESPAÇOS
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {profissionais.length} profissionais &bull; {espacos.length} locais
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cadastro e contratação de <strong>profissionais liberais</strong> (recepcionistas, fotógrafos, mestres de cerimônias...) e <strong>espaços para eventos</strong> (sítios, casas com piscina, mansões, bares e salões).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleAbrirNovoProfissional}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-black shadow-xs transition hover:translate-y-[-1px] active:translate-y-[1px] cursor-pointer"
            >
              <Users className="w-4 h-4 text-purple-600" />
              <span>+ Novo Profissional</span>
            </button>

            <button
              onClick={handleAbrirNovoEspaco}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:brightness-110 text-white text-xs font-black shadow-[0_3px_0_0_#065F46,0_8px_16px_rgba(16,185,129,0.25)] transition hover:translate-y-[-1px] active:translate-y-[1px] cursor-pointer"
            >
              <Palmtree className="w-4 h-4" />
              <span>+ Novo Espaço</span>
            </button>
          </div>
        </header>

        {/* 4 Cards de Métricas com Relevo Tátil */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Profissionais Liberais
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight font-mono">
              {profissionais.length}
            </div>
            <div className="mt-2 text-[11px] text-emerald-600 font-bold flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              <span>{totalProfsDisponiveis} disponíveis para escala</span>
            </div>
          </div>

          <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Espaços & Locais
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Palmtree className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight font-mono">
              {espacos.length}
            </div>
            <div className="mt-2 text-[11px] text-teal-700 font-bold flex items-center">
              <Building className="w-3.5 h-3.5 mr-1 text-teal-600" />
              <span>{totalEspacosDisponiveis} disponíveis para locação</span>
            </div>
          </div>

          <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Capacidade dos Locais
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <PartyPopper className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight font-mono">
              {capacidadeTotalEspacos.toLocaleString('pt-BR')} <span className="text-sm font-semibold text-slate-500">convidados</span>
            </div>
            <div className="mt-2 text-[11px] text-indigo-600 font-semibold">
              Sítios, mansões, casas e lounges
            </div>
          </div>

          <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Cachê Médio de Equipe
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight font-mono">
              R$ {mediaCacheProfissional.toFixed(0)} <span className="text-xs font-semibold text-slate-500">/evento</span>
            </div>
            <div className="mt-2 text-[11px] text-amber-700 font-semibold">
              Média ponderada por diária
            </div>
          </div>
        </section>

        {/* Barra de Navegação entre Submenus / Abas */}
        <div className="bg-white rounded-[24px] p-4 lg:p-5 border border-slate-100 shadow-[0_8px_24px_rgba(0,0,0,0.02)] mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Alternador de Abas */}
          <div className="flex items-center p-1 bg-slate-100/90 rounded-2xl border border-slate-200/70 w-fit">
            <button
              onClick={() => {
                setAbaAtiva('profissionais');
                setBusca('');
              }}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                abaAtiva === 'profissionais'
                  ? 'bg-white text-purple-900 shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-purple-600" />
              <span>Profissionais Liberais ({profissionais.length})</span>
            </button>

            <button
              onClick={() => {
                setAbaAtiva('espacos');
                setBusca('');
              }}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                abaAtiva === 'espacos'
                  ? 'bg-white text-emerald-900 shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Palmtree className="w-4 h-4 text-emerald-600" />
              <span>Espaços para Evento ({espacos.length})</span>
            </button>
          </div>

          {/* Busca e Filtros Rápidos */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder={
                  abaAtiva === 'profissionais'
                    ? 'Buscar recepcionista, fotógrafo, nome...'
                    : 'Buscar sítio, mansão, casa com piscina...'
                }
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-[#F4F6FB] text-slate-800 text-xs font-bold rounded-2xl pl-10 pr-4 py-2.5 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#4F39F6]"
              />
              {busca && (
                <button
                  onClick={() => setBusca('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filtro por Categoria de Profissional */}
            {abaAtiva === 'profissionais' && (
              <select
                value={filtroCategoriaProf}
                onChange={(e) => setFiltroCategoriaProf(e.target.value)}
                className="bg-[#F4F6FB] text-slate-800 text-xs font-bold rounded-2xl px-3 py-2.5 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#4F39F6]"
              >
                <option value="TODAS">Especialidades (Todas)</option>
                {CATEGORIAS_PROFISSIONAIS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            {/* Filtro por Tipo de Espaço */}
            {abaAtiva === 'espacos' && (
              <select
                value={filtroTipoEspaco}
                onChange={(e) => setFiltroTipoEspaco(e.target.value)}
                className="bg-[#F4F6FB] text-slate-800 text-xs font-bold rounded-2xl px-3 py-2.5 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#4F39F6]"
              >
                <option value="TODOS">Tipos de Espaço (Todos)</option>
                {TIPOS_ESPACOS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            )}

            {/* Filtro por Cidade */}
            {cidadesDisponiveis.length > 0 && (
              <select
                value={filtroCidade}
                onChange={(e) => setFiltroCidade(e.target.value)}
                className="bg-[#F4F6FB] text-slate-800 text-xs font-bold rounded-2xl px-3 py-2.5 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#4F39F6]"
              >
                <option value="TODAS">📍 Todas as Cidades</option>
                {cidadesDisponiveis.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            {/* Filtro por Status */}
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="bg-[#F4F6FB] text-slate-800 text-xs font-bold rounded-2xl px-3 py-2.5 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#4F39F6]"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="DISPONIVEL">✅ Disponível</option>
              <option value="EM_EVENTO">⚡ Em Evento / Ocupado</option>
              <option value="RESERVADO">📅 Reservado</option>
              <option value="INDISPONIVEL">⛔ Indisponível</option>
            </select>
          </div>
        </div>

        {/* =========================================================================
            ABA 1: PROFISSIONAIS LIBERAIS (RECEPCIONISTAS, FOTÓGRAFOS, MESTRES DE CERIMÔNIAS...)
            ========================================================================= */}
        {abaAtiva === 'profissionais' && (
          <div>
            {profissionaisFiltrados.length === 0 ? (
              <div className="bg-white rounded-[28px] p-12 text-center border border-slate-100 shadow-sm space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-slate-800">Nenhum profissional localizado</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Não encontramos nenhum profissional correspondente à busca. Clique no botão abaixo para cadastrar um novo profissional liberal.
                </p>
                <button
                  onClick={handleAbrirNovoProfissional}
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition"
                >
                  + Cadastrar Novo Profissional
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profissionaisFiltrados.map((prof) => (
                  <div
                    key={prof.id}
                    className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Topo do Card: Foto, Nome e Categoria */}
                      <div className="flex items-start space-x-3.5 mb-3.5">
                        <div className="relative shrink-0">
                          {prof.fotoUrl ? (
                            <img
                              src={prof.fotoUrl}
                              alt={prof.nome}
                              className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-100 shadow-xs"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-xs">
                              {prof.nome.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span
                            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                              prof.status === 'DISPONIVEL'
                                ? 'bg-emerald-500'
                                : prof.status === 'EM_EVENTO'
                                ? 'bg-amber-500 animate-pulse'
                                : 'bg-slate-400'
                            }`}
                            title={`Status: ${prof.status}`}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${getBadgeCorCategoria(
                                prof.categoria
                              )}`}
                            >
                              {prof.categoria}
                            </span>
                            <div className="flex items-center text-amber-500 text-xs font-bold shrink-0">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-0.5" />
                              <span>{prof.avaliacaoEstrelas.toFixed(1)}</span>
                            </div>
                          </div>
                          <h3 className="text-sm font-black text-slate-900 mt-1 truncate">
                            {prof.nome}
                          </h3>
                          <p className="text-[11px] text-slate-500 truncate">
                            {prof.especialidade || `${prof.categoria} Profissional`}
                          </p>
                        </div>
                      </div>

                      {/* Informações de Local e Valores */}
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5 mb-3">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="flex items-center text-[11px]">
                            <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                            {prof.cidade}/{prof.uf}
                          </span>
                          <span className="font-mono font-black text-purple-900 text-xs">
                            {prof.valorDiariaOuCache
                              ? `R$ ${prof.valorDiariaOuCache.toFixed(2)}`
                              : 'A Combinar'}
                          </span>
                        </div>

                        {prof.chavePix && (
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                            <span className="truncate">PIX: {prof.chavePix}</span>
                            <button
                              onClick={() => copiarTexto(prof.chavePix || '', `pix-${prof.id}`)}
                              className="text-purple-600 hover:text-purple-800 font-bold ml-1 shrink-0"
                              title="Copiar Chave PIX"
                            >
                              {copiadoId === `pix-${prof.id}` ? 'Copiado!' : 'Copiar'}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Habilidades e Tags */}
                      {prof.habilidades && prof.habilidades.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3.5">
                          {prof.habilidades.slice(0, 3).map((hab, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 text-[10px] font-bold"
                            >
                              {hab}
                            </span>
                          ))}
                          {prof.habilidades.length > 3 && (
                            <span className="text-[10px] text-slate-400 self-center font-bold">
                              +{prof.habilidades.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Botões de Ação do Card */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                      <a
                        href={`https://wa.me/55${prof.whatsapp}?text=Ol%C3%A1%20${encodeURIComponent(
                          prof.nome
                        )},%20sou%20da%20ON%20Ag%C3%AAncia%20de%20Eventos.%20Gostaria%20de%20consultar%20sua%20disponibilidade%20para%20uma%20formatura/evento.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center justify-center space-x-1 transition cursor-pointer shadow-2xs"
                        title="Abrir WhatsApp direto para contratação"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </a>

                      <button
                        onClick={() => setItemDetalhe({ tipo: 'prof', dados: prof })}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-900 border border-slate-200 transition cursor-pointer"
                        title="Ver Ficha Completa & Detalhes"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-purple-700" />
                      </button>

                      <button
                        onClick={() => handleEditarProfissional(prof)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 transition cursor-pointer"
                        title="Editar Dados do Profissional"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                      </button>

                      <button
                        onClick={() => handleExcluirProfissional(prof)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
                        title="Excluir Profissional"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            ABA 2: ESPAÇOS & LOCAIS PARA EVENTOS (SÍTIOS, CASAS COM PISCINA, MANSÕES, BARES...)
            ========================================================================= */}
        {abaAtiva === 'espacos' && (
          <div>
            {espacosFiltrados.length === 0 ? (
              <div className="bg-white rounded-[28px] p-12 text-center border border-slate-100 shadow-sm space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <Palmtree className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-slate-800">Nenhum espaço localizado</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Não encontramos nenhum local correspondente à busca. Cadastre sítios, casas com piscina, mansões, bares ou espaços de eventos para enriquecer sua lista.
                </p>
                <button
                  onClick={handleAbrirNovoEspaco}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition"
                >
                  + Cadastrar Novo Espaço
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {espacosFiltrados.map((esp) => (
                  <div
                    key={esp.id}
                    className="bg-white rounded-[26px] overflow-hidden border border-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Imagem de Capa do Espaço */}
                      <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                        <img
                          src={esp.fotoPrincipal || esp.fotos[0]}
                          alt={esp.nome}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Badges Flutuantes sobre a Foto */}
                        <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                          <span
                            className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-xl border backdrop-blur-md ${getBadgeCorTipoEspaco(
                              esp.tipo
                            )}`}
                          >
                            {esp.tipoLabel}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-1 rounded-xl bg-black/60 text-white border border-white/20 backdrop-blur-md">
                            👥 Até {esp.capacidadePessoas} pessoas
                          </span>
                        </div>

                        <div className="absolute bottom-3 left-3 right-3 text-white">
                          <h3 className="text-base font-black drop-shadow-md truncate">
                            {esp.nome}
                          </h3>
                          <p className="text-xs text-white/90 drop-shadow-sm flex items-center mt-0.5 truncate">
                            <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-400 shrink-0" />
                            {esp.bairro ? `${esp.bairro}, ` : ''}{esp.cidade}/{esp.uf}
                          </p>
                        </div>
                      </div>

                      {/* Corpo do Card: Valores e Infraestrutura */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Locação {esp.periodoLocacao === 'DIARIA' ? 'Diária' : esp.periodoLocacao === 'FIM_DE_SEMANA' ? 'Fim de Semana' : 'Pacote'}
                            </span>
                            <span className="text-base font-black font-mono text-emerald-800">
                              {esp.valorLocacao
                                ? `R$ ${esp.valorLocacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                : 'Sob Consulta'}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Avaliação
                            </span>
                            <div className="flex items-center justify-end text-amber-500 font-bold text-xs">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                              <span>{esp.avaliacaoEstrelas.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Pílulas de Infraestrutura */}
                        {esp.infraestrutura && esp.infraestrutura.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-100">
                            {esp.infraestrutura.slice(0, 4).map((inf, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-bold"
                              >
                                {inf}
                              </span>
                            ))}
                            {esp.infraestrutura.length > 4 && (
                              <span className="text-[10px] text-slate-400 self-center font-bold">
                                +{esp.infraestrutura.length - 4} mais
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botões de Ação do Espaço */}
                    <div className="p-4 pt-0 flex items-center justify-between gap-1.5">
                      <a
                        href={`https://wa.me/55${esp.whatsapp}?text=Ol%C3%A1%20${encodeURIComponent(
                          esp.responsavelNome || esp.nome
                        )},%20sou%20da%20ON%20Ag%C3%AAncia%20de%20Eventos.%20Gostaria%20de%20consultar%20valores%20e%20datas%20dispon%C3%ADveis%20para%20loca%C3%A7%C3%A3o%20do%20${encodeURIComponent(
                          esp.nome
                        )}.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-xs"
                        title="Conversar direto no WhatsApp"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Falar com Local</span>
                      </a>

                      {esp.linkGoogleMaps && (
                        <a
                          href={esp.linkGoogleMaps}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-900 border border-slate-200 transition cursor-pointer"
                          title="Ver localização no Google Maps"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-blue-700" />
                        </a>
                      )}

                      <button
                        onClick={() => setItemDetalhe({ tipo: 'espaco', dados: esp })}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 border border-slate-200 transition cursor-pointer"
                        title="Ver Fotos e Ficha Completa do Espaço"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-emerald-700" />
                      </button>

                      <button
                        onClick={() => handleEditarEspaco(esp)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 transition cursor-pointer"
                        title="Editar Dados do Espaço"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                      </button>

                      <button
                        onClick={() => handleExcluirEspaco(esp)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
                        title="Excluir Espaço"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL 1: CADASTRAR / EDITAR PROFISSIONAL LIBERAL
          ========================================================================= */}
      {modalProfissionalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 lg:p-8 shadow-2xl border border-slate-100 my-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {profissionalEditando ? 'Editar Profissional Liberal' : 'Novo Profissional Liberal'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cadastre recepcionistas, fotógrafos, mestres de cerimônias, barman, DJ e equipe técnica.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalProfissionalAberto(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarProfissional} className="space-y-4 my-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Juliana Mendes"
                    value={formProfNome}
                    onChange={(e) => setFormProfNome(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200 font-bold focus:bg-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoria / Especialidade *</label>
                  <select
                    value={formProfCategoria}
                    onChange={(e) => setFormProfCategoria(e.target.value)}
                    className="w-full bg-white text-slate-900 rounded-xl p-2.5 border border-slate-200 font-bold"
                  >
                    {CATEGORIAS_PROFISSIONAIS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subtítulo / Descrição Rápida</label>
                <input
                  type="text"
                  placeholder="ex: Fotógrafo com equipamento Sony 4K para colação e bailes de gala"
                  value={formProfEspecialidade}
                  onChange={(e) => setFormProfEspecialidade(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefone Principal *</label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 99999-9999"
                    value={formProfTelefone}
                    onChange={(e) => setFormProfTelefone(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">WhatsApp (DDD + Número)</label>
                  <input
                    type="text"
                    placeholder="11999999999"
                    value={formProfWhatsapp}
                    onChange={(e) => setFormProfWhatsapp(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="contato@gmail.com"
                    value={formProfEmail}
                    onChange={(e) => setFormProfEmail(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={formProfCidade}
                    onChange={(e) => setFormProfCidade(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">UF</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={formProfUf}
                    onChange={(e) => setFormProfUf(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200 uppercase font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Região de Atendimento</label>
                  <input
                    type="text"
                    placeholder="ex: Capital, Litoral e Interior"
                    value={formProfRegiao}
                    onChange={(e) => setFormProfRegiao(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 bg-purple-50/70 rounded-2xl border border-purple-200">
                <div>
                  <label className="block font-bold text-purple-950 mb-1">Valor Médio do Cachê (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formProfCache}
                    onChange={(e) => setFormProfCache(e.target.value)}
                    className="w-full bg-white text-slate-900 rounded-xl p-2.5 border border-purple-200 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-purple-950 mb-1">Unidade de Cobrança</label>
                  <select
                    value={formProfUnidade}
                    onChange={(e) => setFormProfUnidade(e.target.value as any)}
                    className="w-full bg-white text-slate-900 rounded-xl p-2.5 border border-purple-200 font-bold"
                  >
                    <option value="POR_EVENTO">Por Evento Completo</option>
                    <option value="POR_DIA">Por Diária</option>
                    <option value="POR_HORA">Por Hora</option>
                    <option value="A_COMBINAR">A Combinar</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chave PIX</label>
                  <input
                    type="text"
                    placeholder="ex: chave@gmail.com"
                    value={formProfPix}
                    onChange={(e) => setFormProfPix(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo da Chave</label>
                  <select
                    value={formProfTipoPix}
                    onChange={(e) => setFormProfTipoPix(e.target.value as any)}
                    className="w-full bg-white text-slate-900 rounded-xl p-2.5 border border-slate-200"
                  >
                    <option value="EMAIL">E-mail</option>
                    <option value="TELEFONE">Telefone</option>
                    <option value="CPF">CPF</option>
                    <option value="CNPJ">CNPJ</option>
                    <option value="ALEATORIA">Chave Aleatória</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Banco do PIX</label>
                  <input
                    type="text"
                    placeholder="ex: Nubank / Itaú"
                    value={formProfBancoPix}
                    onChange={(e) => setFormProfBancoPix(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Instagram (@)</label>
                  <input
                    type="text"
                    placeholder="@profissional"
                    value={formProfInstagram}
                    onChange={(e) => setFormProfInstagram(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Link de Portfólio / Site</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formProfPortfolio}
                    onChange={(e) => setFormProfPortfolio(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Avaliação (1 a 5 estrelas)</label>
                  <select
                    value={formProfAvaliacao}
                    onChange={(e) => setFormProfAvaliacao(parseFloat(e.target.value) || 5)}
                    className="w-full bg-white text-slate-900 rounded-xl p-2.5 border border-slate-200 font-bold"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5.0 Excelente)</option>
                    <option value={4.5}>⭐⭐⭐⭐½ (4.5 Muito Bom)</option>
                    <option value={4}>⭐⭐⭐⭐ (4.0 Bom)</option>
                    <option value={3}>⭐⭐⭐ (3.0 Regular)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Foto de Perfil (URL)</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={formProfFotoUrl}
                  onChange={(e) => setFormProfFotoUrl(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Habilidades / Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  placeholder="ex: Bilingue, Carro Próprio, Câmera 4K, Uniforme Social"
                  value={formProfHabilidades}
                  onChange={(e) => setFormProfHabilidades(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observações Internas</label>
                <textarea
                  rows={2}
                  placeholder="Anotações internas sobre desempenho em formaturas anteriores..."
                  value={formProfObservacoes}
                  onChange={(e) => setFormProfObservacoes(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalProfissionalAberto(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black shadow-md transition"
                >
                  Salvar Profissional
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: CADASTRAR / EDITAR ESPAÇO PARA EVENTOS (SÍTIOS, MANSÕES, BARES...)
          ========================================================================= */}
      {modalEspacoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 lg:p-8 shadow-2xl border border-slate-100 my-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                  <Palmtree className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {espacoEditando ? 'Editar Espaço de Eventos' : 'Novo Espaço para Eventos'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cadastre sítios, casas com piscina, mansões, bares, salões e rooftops para eventos.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalEspacoAberto(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarEspaco} className="space-y-4 my-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome do Espaço / Local *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Sítio Paraíso das Palmeiras"
                    value={formEspacoNome}
                    onChange={(e) => setFormEspacoNome(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200 font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Espaço *</label>
                  <select
                    value={formEspacoTipo}
                    onChange={(e) => setFormEspacoTipo(e.target.value as TipoEspaco)}
                    className="w-full bg-white text-slate-900 rounded-xl p-2.5 border border-slate-200 font-bold"
                  >
                    {TIPOS_ESPACOS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Capacidade Total de Pessoas *</label>
                  <input
                    type="number"
                    required
                    placeholder="ex: 800"
                    value={formEspacoCapacidade}
                    onChange={(e) => setFormEspacoCapacidade(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Capacidade Pessoas Sentadas (opcional)</label>
                  <input
                    type="number"
                    placeholder="ex: 450"
                    value={formEspacoCapacidadeSentadas}
                    onChange={(e) => setFormEspacoCapacidadeSentadas(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Endereço Completo</label>
                  <input
                    type="text"
                    placeholder="Rua / Estrada, número"
                    value={formEspacoEndereco}
                    onChange={(e) => setFormEspacoEndereco(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bairro</label>
                  <input
                    type="text"
                    placeholder="ex: Granja Viana"
                    value={formEspacoBairro}
                    onChange={(e) => setFormEspacoBairro(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={formEspacoCidade}
                    onChange={(e) => setFormEspacoCidade(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">UF</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={formEspacoUf}
                    onChange={(e) => setFormEspacoUf(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200 uppercase font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Link Google Maps (opcional)</label>
                  <input
                    type="text"
                    placeholder="https://maps.google.com/..."
                    value={formEspacoMaps}
                    onChange={(e) => setFormEspacoMaps(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200 text-[11px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome do Contato / Proprietário</label>
                  <input
                    type="text"
                    placeholder="ex: Dr. Cláudio Ferreira"
                    value={formEspacoResponsavel}
                    onChange={(e) => setFormEspacoResponsavel(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefone Principal *</label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 99999-9999"
                    value={formEspacoTelefone}
                    onChange={(e) => setFormEspacoTelefone(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">WhatsApp de Reservas</label>
                  <input
                    type="text"
                    placeholder="11999999999"
                    value={formEspacoWhatsapp}
                    onChange={(e) => setFormEspacoWhatsapp(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200">
                <div>
                  <label className="block font-bold text-emerald-950 mb-1">Valor de Locação (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formEspacoValor}
                    onChange={(e) => setFormEspacoValor(e.target.value)}
                    className="w-full bg-white text-slate-900 rounded-xl p-2.5 border border-emerald-200 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-950 mb-1">Período de Locação</label>
                  <select
                    value={formEspacoPeriodo}
                    onChange={(e) => setFormEspacoPeriodo(e.target.value as any)}
                    className="w-full bg-white text-slate-900 rounded-xl p-2.5 border border-emerald-200 font-bold"
                  >
                    <option value="DIARIA">Diária (24h)</option>
                    <option value="FIM_DE_SEMANA">Fim de Semana (Sex a Dom)</option>
                    <option value="POR_HORA">Por Hora</option>
                    <option value="PACOTE_EVENTO">Pacote de Evento</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-emerald-950 mb-1">Taxa de Limpeza (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formEspacoTaxaLimpeza}
                    onChange={(e) => setFormEspacoTaxaLimpeza(e.target.value)}
                    className="w-full bg-white text-slate-900 rounded-xl p-2.5 border border-emerald-200 font-mono"
                  />
                </div>
              </div>

              {/* Infraestrutura do Local */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Infraestrutura Inclusa (Selecione o que o espaço oferece):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  {INFRAESTRUTURAS_DISPONIVEIS.map((inf) => {
                    const marcado = formEspacoInfra.includes(inf);
                    return (
                      <button
                        type="button"
                        key={inf}
                        onClick={() => toggleInfra(inf)}
                        className={`text-left p-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-between cursor-pointer ${
                          marcado
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate mr-1">{inf}</span>
                        {marcado && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Foto Principal de Capa (URL)</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={formEspacoFotoPrincipal}
                  onChange={(e) => setFormEspacoFotoPrincipal(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Fotos Adicionais da Galeria (uma por linha)</label>
                <textarea
                  rows={2}
                  placeholder="https://...&#10;https://..."
                  value={formEspacoFotosAdicionais}
                  onChange={(e) => setFormEspacoFotosAdicionais(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200 font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Horário Limite para Som Alto</label>
                  <input
                    type="text"
                    placeholder="ex: 04:00 da manhã ou Sem Restrição"
                    value={formEspacoHorarioSom}
                    onChange={(e) => setFormEspacoHorarioSom(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Avaliação do Local</label>
                  <select
                    value={formEspacoAvaliacao}
                    onChange={(e) => setFormEspacoAvaliacao(parseFloat(e.target.value) || 5)}
                    className="w-full bg-white text-slate-900 rounded-xl p-2.5 border border-slate-200 font-bold"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5.0 Padrão Ouro)</option>
                    <option value={4.8}>⭐⭐⭐⭐½ (4.8 Excelente)</option>
                    <option value={4}>⭐⭐⭐⭐ (4.0 Muito Bom)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Regras e Observações da Locação</label>
                <textarea
                  rows={2}
                  placeholder="Restrições, regras de caução, segurança obrigatória, capacidade de estacionamento..."
                  value={formEspacoRegras}
                  onChange={(e) => setFormEspacoRegras(e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 rounded-xl p-2.5 border border-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalEspacoAberto(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md transition"
                >
                  Salvar Espaço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: FICHA COMPLETA / DETALHES AMPLIADOS
          ========================================================================= */}
      {itemDetalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 lg:p-8 shadow-2xl border border-slate-100 my-6 animate-in zoom-in-95 duration-150">
            {itemDetalhe.tipo === 'prof' ? (
              // Ficha do Profissional
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3.5">
                    <img
                      src={itemDetalhe.dados.fotoUrl}
                      alt={itemDetalhe.dados.nome}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-200 shadow-sm"
                    />
                    <div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                        {itemDetalhe.dados.categoria}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 mt-1">
                        {itemDetalhe.dados.nome}
                      </h3>
                      <p className="text-xs text-slate-500">{itemDetalhe.dados.especialidade}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setItemDetalhe(null)}
                    className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="my-5 space-y-4 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Cachê / Diária</span>
                      <strong className="text-sm font-mono text-purple-900">
                        {itemDetalhe.dados.valorDiariaOuCache
                          ? `R$ ${itemDetalhe.dados.valorDiariaOuCache.toFixed(2)}`
                          : 'A Combinar'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Localização</span>
                      <strong className="text-slate-800">{itemDetalhe.dados.cidade}/{itemDetalhe.dados.uf}</strong>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Avaliação</span>
                      <strong className="text-amber-600 flex items-center">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                        {itemDetalhe.dados.avaliacaoEstrelas.toFixed(1)} / 5.0
                      </strong>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-2">
                    <span className="text-xs font-black text-purple-950 uppercase block">Contatos Oficiais</span>
                    <div className="flex flex-wrap items-center gap-4 text-slate-700">
                      <div>
                        <span className="text-slate-400 text-[10px] block font-bold">Telefone:</span>
                        <strong>{itemDetalhe.dados.telefone}</strong>
                      </div>
                      {itemDetalhe.dados.email && (
                        <div>
                          <span className="text-slate-400 text-[10px] block font-bold">E-mail:</span>
                          <strong>{itemDetalhe.dados.email}</strong>
                        </div>
                      )}
                      {itemDetalhe.dados.chavePix && (
                        <div>
                          <span className="text-slate-400 text-[10px] block font-bold">Chave PIX:</span>
                          <strong className="font-mono">{itemDetalhe.dados.chavePix} ({itemDetalhe.dados.bancoPix || 'PIX'})</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {itemDetalhe.dados.habilidades && itemDetalhe.dados.habilidades.length > 0 && (
                    <div>
                      <span className="text-xs font-black text-slate-800 uppercase block mb-1.5">
                        Diferenciais & Habilidades
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {itemDetalhe.dados.habilidades.map((hab: string, i: number) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 font-bold"
                          >
                            ✓ {hab}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {itemDetalhe.dados.observacoes && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Histórico / Observações Internas
                      </span>
                      <p className="text-slate-700 leading-relaxed">{itemDetalhe.dados.observacoes}</p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                  <a
                    href={`https://wa.me/55${itemDetalhe.dados.whatsapp}?text=Ol%C3%A1%20${encodeURIComponent(
                      itemDetalhe.dados.nome
                    )},%20sou%20da%20ON%20Ag%C3%AAncia%20de%20Eventos.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center space-x-2 transition"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Chamar no WhatsApp</span>
                  </a>
                </div>
              </div>
            ) : (
              // Ficha do Espaço
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {itemDetalhe.dados.tipoLabel}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-1">
                      {itemDetalhe.dados.nome}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center mt-0.5">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      {itemDetalhe.dados.endereco}, {itemDetalhe.dados.bairro} &bull; {itemDetalhe.dados.cidade}/{itemDetalhe.dados.uf}
                    </p>
                  </div>
                  <button
                    onClick={() => setItemDetalhe(null)}
                    className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="my-5 space-y-4 text-xs">
                  {/* Galeria de Fotos */}
                  {itemDetalhe.dados.fotos && itemDetalhe.dados.fotos.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {itemDetalhe.dados.fotos.map((ft: string, i: number) => (
                        <img
                          key={i}
                          src={ft}
                          alt="Foto do Espaço"
                          className="w-full h-36 object-cover rounded-2xl border border-slate-200 shadow-xs"
                        />
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Capacidade Total</span>
                      <strong className="text-sm font-mono text-emerald-900">
                        {itemDetalhe.dados.capacidadePessoas} pessoas
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Valor de Locação</span>
                      <strong className="text-sm font-mono text-emerald-900">
                        {itemDetalhe.dados.valorLocacao
                          ? `R$ ${itemDetalhe.dados.valorLocacao.toFixed(2)}`
                          : 'Sob Consulta'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Horário Limite de Som</span>
                      <strong className="text-slate-800">{itemDetalhe.dados.horarioLimiteSom || 'Sem Restrição'}</strong>
                    </div>
                  </div>

                  {itemDetalhe.dados.infraestrutura && itemDetalhe.dados.infraestrutura.length > 0 && (
                    <div>
                      <span className="text-xs font-black text-slate-800 uppercase block mb-1.5">
                        Infraestrutura Inclusa
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {itemDetalhe.dados.infraestrutura.map((inf: string, i: number) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold"
                          >
                            ✓ {inf}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {itemDetalhe.dados.regrasObservacoes && (
                    <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200">
                      <span className="text-[10px] font-bold text-amber-900 uppercase block mb-1">
                        Regras & Observações do Local
                      </span>
                      <p className="text-amber-950 leading-relaxed">{itemDetalhe.dados.regrasObservacoes}</p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                  <a
                    href={`https://wa.me/55${itemDetalhe.dados.whatsapp}?text=Ol%C3%A1%20${encodeURIComponent(
                      itemDetalhe.dados.responsavelNome || itemDetalhe.dados.nome
                    )},%20sou%20da%20ON%20Ag%C3%AAncia%20de%20Eventos.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center space-x-2 transition"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Falar com Responsável</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
