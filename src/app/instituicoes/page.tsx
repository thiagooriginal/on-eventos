'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  GraduationCap,
  Plus,
  Search,
  Filter,
  School,
  BookOpen,
  MapPin,
  Phone,
  Mail,
  Users,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Building,
  Calendar,
  Layers,
  ArrowLeft,
  X,
  MessageCircle,
  AlertCircle,
  HelpCircle,
  Bookmark,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import {
  Instituicao,
  Curso,
  TipoInstituicao,
  GrauCurso,
  AreaCurso,
  PeriodoCurso,
  getInstituicoes,
  getCursos,
  adicionarInstituicao,
  atualizarInstituicao,
  removerInstituicao,
  adicionarCurso,
  atualizarCurso,
  removerCurso,
  sincronizarInstituicoesServidor,
} from '@/lib/instituicoes';

export default function InstituicoesPage() {
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<'instituicoes' | 'cursos'>('instituicoes');

  // Filtros e busca
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [filtroArea, setFiltroArea] = useState<string>('TODOS');
  const [instituicaoAbertaId, setInstituicaoAbertaId] = useState<string | null>(null);

  // Modais Instituição
  const [modalInstAberto, setModalInstAberto] = useState(false);
  const [instEditando, setInstEditando] = useState<Instituicao | null>(null);
  const [formInstNome, setFormInstNome] = useState('');
  const [formInstSigla, setFormInstSigla] = useState('');
  const [formInstTipo, setFormInstTipo] = useState<TipoInstituicao>('UNIVERSIDADE');
  const [formInstCampus, setFormInstCampus] = useState('');
  const [formInstCidade, setFormInstCidade] = useState('São Paulo');
  const [formInstUf, setFormInstUf] = useState('SP');
  const [formInstEndereco, setFormInstEndereco] = useState('');
  const [formInstResponsavel, setFormInstResponsavel] = useState('');
  const [formInstTelefone, setFormInstTelefone] = useState('');
  const [formInstWhatsapp, setFormInstWhatsapp] = useState('');
  const [formInstEmail, setFormInstEmail] = useState('');
  const [formInstStatus, setFormInstStatus] = useState<'ATIVO' | 'PROSPECCAO' | 'INATIVO'>('ATIVO');

  // Modais Curso
  const [modalCursoAberto, setModalCursoAberto] = useState(false);
  const [cursoEditando, setCursoEditando] = useState<Curso | null>(null);
  const [formCursoInstituicaoId, setFormCursoInstituicaoId] = useState('');
  const [formCursoNome, setFormCursoNome] = useState('');
  const [formCursoGrau, setFormCursoGrau] = useState<GrauCurso>('BACHARELADO');
  const [formCursoArea, setFormCursoArea] = useState<AreaCurso>('SAUDE');
  const [formCursoPeriodo, setFormCursoPeriodo] = useState<PeriodoCurso>('NOTURNO');
  const [formCursoTurmas, setFormCursoTurmas] = useState('2026.2');
  const [formCursoAlunos, setFormCursoAlunos] = useState(80);
  const [formCursoCoordenador, setFormCursoCoordenador] = useState('');
  const [formCursoContato, setFormCursoContato] = useState('');
  const [formCursoStatus, setFormCursoStatus] = useState<'ATIVO' | 'PROSPECCAO' | 'CONCLUIDO'>('ATIVO');

  // Toast / Mensagens de feedback
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [salvando, setSalvando] = useState(false);

  const carregarDados = async () => {
    try {
      const servidor = await sincronizarInstituicoesServidor();
      if (servidor) {
        setInstituicoes(servidor.instituicoes);
        setCursos(servidor.cursos);
        return;
      }
    } catch (e) {}
    setInstituicoes(getInstituicoes());
    setCursos(getCursos());
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const exibirFeedback = (texto: string, tipo: 'sucesso' | 'erro' = 'sucesso') => {
    setFeedback({ tipo, texto });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Handlers Instituição
  const handleAbrirNovaInst = () => {
    setInstEditando(null);
    setFormInstNome('');
    setFormInstSigla('');
    setFormInstTipo('UNIVERSIDADE');
    setFormInstCampus('');
    setFormInstCidade('São Paulo');
    setFormInstUf('SP');
    setFormInstEndereco('');
    setFormInstResponsavel('');
    setFormInstTelefone('');
    setFormInstWhatsapp('');
    setFormInstEmail('');
    setFormInstStatus('ATIVO');
    setModalInstAberto(true);
  };

  const handleEditarInst = (inst: Instituicao) => {
    setInstEditando(inst);
    setFormInstNome(inst.nome);
    setFormInstSigla(inst.sigla);
    setFormInstTipo(inst.tipo);
    setFormInstCampus(inst.campus);
    setFormInstCidade(inst.cidade);
    setFormInstUf(inst.uf);
    setFormInstEndereco(inst.endereco || '');
    setFormInstResponsavel(inst.contatoResponsavel);
    setFormInstTelefone(inst.telefone);
    setFormInstWhatsapp(inst.whatsapp);
    setFormInstEmail(inst.email);
    setFormInstStatus(inst.status);
    setModalInstAberto(true);
  };

  const handleSalvarInst = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formInstNome.trim()) {
      exibirFeedback('Preencha o nome da instituição.', 'erro');
      return;
    }

    setSalvando(true);
    const cores = [
      'from-purple-600 to-indigo-600',
      'from-blue-600 to-cyan-600',
      'from-rose-600 to-pink-600',
      'from-teal-600 to-emerald-600',
      'from-amber-600 to-orange-600',
      'from-indigo-600 to-violet-600',
    ];

    try {
      if (instEditando) {
        await atualizarInstituicao(instEditando.id, {
          nome: formInstNome.trim(),
          sigla: formInstSigla.trim().toUpperCase() || formInstNome.slice(0, 4).toUpperCase(),
          tipo: formInstTipo,
          campus: formInstCampus.trim() || 'Campus Central',
          cidade: formInstCidade.trim(),
          uf: formInstUf.trim().toUpperCase(),
          endereco: formInstEndereco.trim(),
          contatoResponsavel: formInstResponsavel.trim(),
          telefone: formInstTelefone.trim(),
          whatsapp: formInstWhatsapp.trim(),
          email: formInstEmail.trim(),
          status: formInstStatus,
        });
        exibirFeedback(`Instituição "${formInstNome}" atualizada com sucesso!`);
      } else {
        await adicionarInstituicao({
          nome: formInstNome.trim(),
          sigla: formInstSigla.trim().toUpperCase() || formInstNome.slice(0, 4).toUpperCase(),
          tipo: formInstTipo,
          campus: formInstCampus.trim() || 'Campus Principal',
          cidade: formInstCidade.trim(),
          uf: formInstUf.trim().toUpperCase(),
          endereco: formInstEndereco.trim(),
          contatoResponsavel: formInstResponsavel.trim(),
          telefone: formInstTelefone.trim(),
          whatsapp: formInstWhatsapp.trim(),
          email: formInstEmail.trim(),
          status: formInstStatus,
          cor: cores[Math.floor(Math.random() * cores.length)],
        });
        exibirFeedback(`Instituição "${formInstNome}" cadastrada com sucesso!`);
      }

      setModalInstAberto(false);
      await carregarDados();
    } catch (err: any) {
      exibirFeedback('Erro ao salvar instituição.', 'erro');
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluirInst = async (inst: Instituicao) => {
    const cursosVinculados = cursos.filter((c) => c.instituicaoId === inst.id);
    const aviso = cursosVinculados.length > 0
      ? `Atenção: Existem ${cursosVinculados.length} curso(s) vinculados a esta instituição. Ao excluir a instituição, esses cursos também serão removidos. Deseja continuar?`
      : `Deseja realmente remover a instituição "${inst.nome}"?`;

    if (confirm(aviso)) {
      setInstituicoes((prev) => prev.filter((i) => i.id !== inst.id));
      await removerInstituicao(inst.id);
      exibirFeedback(`Instituição "${inst.nome}" removida.`, 'sucesso');
      await carregarDados();
    }
  };

  // Handlers Cursos
  const handleAbrirNovoCurso = (instituicaoIdPreselecionada?: string) => {
    setCursoEditando(null);
    setFormCursoInstituicaoId(instituicaoIdPreselecionada || (instituicoes[0]?.id || ''));
    setFormCursoNome('');
    setFormCursoGrau('BACHARELADO');
    setFormCursoArea('SAUDE');
    setFormCursoPeriodo('NOTURNO');
    setFormCursoTurmas('2026.2');
    setFormCursoAlunos(80);
    setFormCursoCoordenador('');
    setFormCursoContato('');
    setFormCursoStatus('ATIVO');
    setModalCursoAberto(true);
  };

  const handleEditarCurso = (curso: Curso) => {
    setCursoEditando(curso);
    setFormCursoInstituicaoId(curso.instituicaoId);
    setFormCursoNome(curso.nome);
    setFormCursoGrau(curso.grau);
    setFormCursoArea(curso.area);
    setFormCursoPeriodo(curso.periodo);
    setFormCursoTurmas(curso.turmasAtivas.join(', '));
    setFormCursoAlunos(curso.estimativaAlunos);
    setFormCursoCoordenador(curso.coordenador);
    setFormCursoContato(curso.contato || '');
    setFormCursoStatus(curso.status);
    setModalCursoAberto(true);
  };

  const handleSalvarCurso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCursoNome.trim()) {
      exibirFeedback('Preencha o nome do curso.', 'erro');
      return;
    }

    const instSelecionada = instituicoes.find((i) => i.id === formCursoInstituicaoId);
    if (!instSelecionada) {
      exibirFeedback('Selecione uma instituição válida.', 'erro');
      return;
    }

    setSalvando(true);
    const turmasArray = formCursoTurmas
      .split(/[,;\/]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (cursoEditando) {
        await atualizarCurso(cursoEditando.id, {
          instituicaoId: instSelecionada.id,
          instituicaoNome: instSelecionada.nome,
          instituicaoSigla: instSelecionada.sigla,
          nome: formCursoNome.trim(),
          grau: formCursoGrau,
          area: formCursoArea,
          periodo: formCursoPeriodo,
          turmasAtivas: turmasArray.length > 0 ? turmasArray : ['2026.2'],
          estimativaAlunos: Number(formCursoAlunos) || 0,
          coordenador: formCursoCoordenador.trim(),
          contato: formCursoContato.trim(),
          status: formCursoStatus,
        });
        exibirFeedback(`Curso "${formCursoNome}" atualizado com sucesso!`);
      } else {
        await adicionarCurso({
          instituicaoId: instSelecionada.id,
          instituicaoNome: instSelecionada.nome,
          instituicaoSigla: instSelecionada.sigla,
          nome: formCursoNome.trim(),
          grau: formCursoGrau,
          area: formCursoArea,
          periodo: formCursoPeriodo,
          turmasAtivas: turmasArray.length > 0 ? turmasArray : ['2026.2'],
          estimativaAlunos: Number(formCursoAlunos) || 0,
          coordenador: formCursoCoordenador.trim(),
          contato: formCursoContato.trim(),
          status: formCursoStatus,
        });
        exibirFeedback(`Curso "${formCursoNome}" cadastrado para ${instSelecionada.sigla}!`);
      }

      setModalCursoAberto(false);
      await carregarDados();
    } catch (err: any) {
      exibirFeedback('Erro ao salvar curso.', 'erro');
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluirCurso = async (curso: Curso) => {
    if (confirm(`Deseja realmente remover o curso "${curso.nome}" (${curso.instituicaoSigla})?`)) {
      setCursos((prev) => prev.filter((c) => c.id !== curso.id));
      await removerCurso(curso.id);
      exibirFeedback(`Curso "${curso.nome}" removido com sucesso.`);
      await carregarDados();
    }
  };

  // Filtragens
  const instituicoesFiltradas = instituicoes.filter((inst) => {
    const q = busca.toLowerCase();
    const bateBusca =
      !busca ||
      inst.nome.toLowerCase().includes(q) ||
      inst.sigla.toLowerCase().includes(q) ||
      inst.campus.toLowerCase().includes(q) ||
      inst.cidade.toLowerCase().includes(q);

    const bateTipo = filtroTipo === 'TODOS' || inst.tipo === filtroTipo;
    return bateBusca && bateTipo;
  });

  const cursosFiltrados = cursos.filter((curso) => {
    const q = busca.toLowerCase();
    const bateBusca =
      !busca ||
      curso.nome.toLowerCase().includes(q) ||
      curso.instituicaoNome.toLowerCase().includes(q) ||
      curso.instituicaoSigla.toLowerCase().includes(q) ||
      curso.coordenador.toLowerCase().includes(q);

    const bateArea = filtroArea === 'TODOS' || curso.area === filtroArea;
    return bateBusca && bateArea;
  });

  // Métricas de topo
  const totalInstituicoesAtivas = instituicoes.filter((i) => i.status === 'ATIVO').length;
  const totalCursosAtivos = cursos.filter((c) => c.status === 'ATIVO').length;
  const totalFormandosEstimados = cursos.reduce((acc, c) => acc + (c.estimativaAlunos || 0), 0);
  const totalTurmasMapeadas = cursos.reduce((acc, c) => acc + c.turmasAtivas.length, 0);

  const formatarTipo = (tipo: TipoInstituicao) => {
    switch (tipo) {
      case 'UNIVERSIDADE':
        return 'Universidade';
      case 'CENTRO_UNIVERSITARIO':
        return 'Centro Universitário';
      case 'FACULDADE':
        return 'Faculdade';
      case 'COLEGIO':
        return 'Colégio / Ensino Médio';
      case 'ESCOLA_TECNICA':
        return 'Escola Técnica';
      default:
        return tipo;
    }
  };

  const formatarArea = (area: AreaCurso) => {
    switch (area) {
      case 'SAUDE':
        return 'Saúde & Biológicas';
      case 'HUMANAS':
        return 'Humanas & Sociais';
      case 'EXATAS':
        return 'Exatas & Tecnologia';
      case 'NEGOCIOS':
        return 'Negócios & Gestão';
      case 'COMUNICACAO_ARTES':
        return 'Comunicação & Artes';
      case 'EDUCACAO_BASICA':
        return 'Educação Básica';
      default:
        return area;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col lg:flex-row antialiased font-sans">
      {/* Sidebar Lateral */}
      <Sidebar paginaAtiva="instituicoes" />

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 lg:pl-2">
        {/* Header Superior Tátil */}
        <header className="bg-white/80 backdrop-blur-md rounded-[24px] p-4 lg:px-6 lg:py-4 mb-6 shadow-[0_8px_24px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#4F39F6] to-[#7928CA] text-white shadow-[0_6px_14px_rgba(79,57,246,0.28)] flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
                  Instituições & Cursos
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {instituicoes.length} faculdades / {cursos.length} cursos
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Gestão central de Faculdades, Universidades, Colégios e matriz curricular para propostas e turmas.
              </p>
            </div>
          </div>

          {/* Botões de Ação do Topo */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={handleAbrirNovaInst}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-[0_3px_0_0_#CBD5E1] border border-slate-200 hover:translate-y-[-1px] active:translate-y-[1px] transition-all"
            >
              <Building className="w-3.5 h-3.5 text-indigo-600" />
              <span>+ Nova Instituição</span>
            </button>

            <button
              onClick={() => handleAbrirNovoCurso()}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#4F39F6] to-[#7928CA] hover:brightness-110 text-white text-xs font-bold shadow-[0_3px_0_0_#3824B0,0_6px_12px_rgba(79,57,246,0.25)] hover:translate-y-[-1px] active:translate-y-[1px] transition-all"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>+ Novo Curso</span>
            </button>
          </div>
        </header>

        {/* Feedback Toast */}
        {feedback && (
          <div
            className={`mb-6 p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-sm transition-all animate-in fade-in slide-in-from-top-2 ${
              feedback.tipo === 'sucesso'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              {feedback.tipo === 'sucesso' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              <span>{feedback.texto}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 4 Cards de Métricas Táteis */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Instituições Cadastradas
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <School className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-slate-900">{instituicoes.length}</span>
              <span className="text-xs font-bold text-emerald-600">{totalInstituicoesAtivas} ativas</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Faculdades, centros e colégios</p>
          </div>

          <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Cursos Catalogados
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-slate-900">{cursos.length}</span>
              <span className="text-xs font-bold text-indigo-600">{totalCursosAtivos} no portfólio</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Saúde, Humanas, Exatas e outros</p>
          </div>

          <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Formandos Potenciais
              </span>
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-slate-900">
                {totalFormandosEstimados.toLocaleString('pt-BR')}
              </span>
              <span className="text-xs font-bold text-teal-600">alunos</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Estimativa total por turma ativa</p>
          </div>

          <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Turmas Mapeadas
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-slate-900">{totalTurmasMapeadas}</span>
              <span className="text-xs font-bold text-amber-600">semestres</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">2026.1, 2026.2, 2027.1</p>
          </div>
        </div>

        {/* Barra de Navegação entre Abas + Pesquisa */}
        <div className="bg-white rounded-[24px] p-4 lg:p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Alternador de Abas Tátil */}
          <div className="flex items-center p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60 w-fit">
            <button
              onClick={() => setAbaAtiva('instituicoes')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                abaAtiva === 'instituicoes'
                  ? 'bg-white text-indigo-700 shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Instituições & Faculdades ({instituicoesFiltradas.length})</span>
            </button>

            <button
              onClick={() => setAbaAtiva('cursos')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                abaAtiva === 'cursos'
                  ? 'bg-white text-indigo-700 shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Todos os Cursos ({cursosFiltrados.length})</span>
            </button>
          </div>

          {/* Campo de Busca & Filtro */}
          <div className="flex items-center flex-wrap gap-2.5 flex-1 max-w-md ml-auto">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={
                  abaAtiva === 'instituicoes'
                    ? 'Buscar faculdade, sigla, campus ou cidade...'
                    : 'Buscar curso, faculdade ou coordenador...'
                }
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
              {busca && (
                <button
                  onClick={() => setBusca('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {abaAtiva === 'instituicoes' ? (
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="TODOS">Todos os Tipos</option>
                <option value="UNIVERSIDADE">Universidade</option>
                <option value="CENTRO_UNIVERSITARIO">Centro Universitário</option>
                <option value="FACULDADE">Faculdade</option>
                <option value="COLEGIO">Colégio</option>
              </select>
            ) : (
              <select
                value={filtroArea}
                onChange={(e) => setFiltroArea(e.target.value)}
                className="px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="TODOS">Todas as Áreas</option>
                <option value="SAUDE">Saúde & Biológicas</option>
                <option value="HUMANAS">Humanas & Sociais</option>
                <option value="EXATAS">Exatas & Tecnologia</option>
                <option value="NEGOCIOS">Negócios & Gestão</option>
                <option value="COMUNICACAO_ARTES">Comunicação & Artes</option>
                <option value="EDUCACAO_BASICA">Educação Básica</option>
              </select>
            )}
          </div>
        </div>

        {/* CONTEÚDO DA ABA 1: INSTITUIÇÕES */}
        {abaAtiva === 'instituicoes' && (
          <div className="space-y-4">
            {instituicoesFiltradas.length === 0 ? (
              <div className="bg-white rounded-[24px] p-12 text-center border border-slate-100">
                <School className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700">Nenhuma instituição encontrada</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Tente ajustar a busca ou cadastre uma nova instituição para iniciar o mapeamento.
                </p>
                <button
                  onClick={handleAbrirNovaInst}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                >
                  + Cadastrar Instituição
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {instituicoesFiltradas.map((inst) => {
                  const cursosDaInst = cursos.filter((c) => c.instituicaoId === inst.id);
                  const totalAlunosInst = cursosDaInst.reduce((acc, c) => acc + (c.estimativaAlunos || 0), 0);
                  const isExpandido = instituicaoAbertaId === inst.id;

                  return (
                    <div
                      key={inst.id}
                      className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden group"
                    >
                      {/* Topo do Card com Gradiente Decorativo */}
                      <div className="p-5 pb-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center space-x-3 min-w-0">
                            <div
                              className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${inst.cor} text-white font-black text-base shadow-md flex items-center justify-center shrink-0 tracking-wider`}
                            >
                              {inst.sigla.slice(0, 4)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                  {formatarTipo(inst.tipo)}
                                </span>
                                <span
                                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                    inst.status === 'ATIVO'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}
                                >
                                  {inst.status === 'ATIVO' ? 'Parceira Ativa' : 'Em Prospecção'}
                                </span>
                              </div>
                              <h3 className="text-sm font-black text-slate-900 mt-1 truncate" title={inst.nome}>
                                {inst.nome}
                              </h3>
                              <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5 truncate">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>
                                  {inst.campus} • {inst.cidade}/{inst.uf}
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Ações Rápidas */}
                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              onClick={() => handleEditarInst(inst)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="Editar Instituição"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleExcluirInst(inst)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Remover Instituição"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Dados de Contato Institucional */}
                        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100/80 space-y-1.5 text-xs">
                          {inst.contatoResponsavel && (
                            <div className="flex items-center space-x-2 text-slate-600">
                              <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{inst.contatoResponsavel}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-slate-600 pt-0.5">
                            <div className="flex items-center space-x-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-medium">{inst.telefone || 'Não informado'}</span>
                            </div>
                            {inst.whatsapp && (
                              <a
                                href={`https://wa.me/55${inst.whatsapp.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center space-x-1 text-emerald-600 hover:underline font-bold text-[11px]"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Resumo de Cursos & Turmas */}
                        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-slate-400 text-[11px]">Cursos Cadastrados: </span>
                            <span className="font-extrabold text-slate-800">{cursosDaInst.length}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[11px]">Formandos Previstos: </span>
                            <span className="font-extrabold text-indigo-600">
                              {totalAlunosInst.toLocaleString('pt-BR')}
                            </span>
                          </div>
                        </div>

                        {/* Lista Prévia dos Cursos */}
                        <div className="mt-3 space-y-1.5">
                          {cursosDaInst.slice(0, 3).map((c) => (
                            <div
                              key={c.id}
                              className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-50/70 border border-slate-100 text-[11px]"
                            >
                              <div className="flex items-center space-x-1.5 truncate">
                                <GraduationCap className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                <span className="font-bold text-slate-700 truncate">{c.nome}</span>
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 shrink-0 ml-2">
                                {c.estimativaAlunos} alunos
                              </span>
                            </div>
                          ))}

                          {cursosDaInst.length > 3 && (
                            <p className="text-[10px] text-center text-slate-400 font-bold pt-1">
                              + {cursosDaInst.length - 3} outro(s) curso(s)
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Footer do Card com Botão de Adicionar Curso e CRM */}
                      <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleAbrirNovoCurso(inst.id)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-indigo-700 text-xs font-bold border border-slate-200 shadow-sm transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Adicionar Curso</span>
                        </button>

                        <Link
                          href="/crm/index.html"
                          className="flex items-center space-x-1 text-xs font-bold text-slate-600 hover:text-indigo-600 transition"
                        >
                          <span>Ver no CRM</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CONTEÚDO DA ABA 2: TODOS OS CURSOS */}
        {abaAtiva === 'cursos' && (
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
            {cursosFiltrados.length === 0 ? (
              <div className="p-12 text-center">
                <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700">Nenhum curso encontrado</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Ajuste seus filtros de busca ou adicione um novo curso vinculado a uma das instituições.
                </p>
                <button
                  onClick={() => handleAbrirNovoCurso()}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                >
                  + Cadastrar Novo Curso
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-black uppercase tracking-wider text-slate-400">
                      <th className="py-3.5 px-4 pl-6">Curso & Grau</th>
                      <th className="py-3.5 px-4">Instituição de Ensino</th>
                      <th className="py-3.5 px-4">Área do Conhecimento</th>
                      <th className="py-3.5 px-4">Período</th>
                      <th className="py-3.5 px-4">Turmas Ativas</th>
                      <th className="py-3.5 px-4">Alunos Estimados</th>
                      <th className="py-3.5 px-4">Coordenador / Contato</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 pr-6 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {cursosFiltrados.map((curso) => (
                      <tr key={curso.id} className="hover:bg-slate-50/60 transition group">
                        <td className="py-3.5 px-4 pl-6">
                          <div className="font-extrabold text-slate-900 text-sm">{curso.nome}</div>
                          <span className="text-[10px] font-bold text-slate-400 tracking-wide uppercase">
                            {curso.grau}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-indigo-700">{curso.instituicaoSigla}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[200px]" title={curso.instituicaoNome}>
                            {curso.instituicaoNome}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                            {formatarArea(curso.area)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-[11px] font-semibold text-slate-600">
                            {curso.periodo === 'INTEGRAL'
                              ? 'Integral'
                              : curso.periodo === 'MATUTINO'
                              ? 'Matutino'
                              : curso.periodo === 'NOTURNO'
                              ? 'Noturno'
                              : 'Vespertino'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {curso.turmasAtivas.map((turma, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100"
                              >
                                {turma}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-black text-slate-900">
                          {curso.estimativaAlunos}{' '}
                          <span className="text-[11px] font-normal text-slate-400">formandos</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800">{curso.coordenador || 'Não informado'}</div>
                          {curso.contato && (
                            <div className="text-[11px] text-slate-400">{curso.contato}</div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              curso.status === 'ATIVO'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : curso.status === 'PROSPECCAO'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {curso.status === 'ATIVO'
                              ? 'Ativo'
                              : curso.status === 'PROSPECCAO'
                              ? 'Prospecção'
                              : 'Concluído'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 pr-6 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleEditarCurso(curso)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="Editar Curso"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleExcluirCurso(curso)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Excluir Curso"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: CADASTRAR / EDITAR INSTITUIÇÃO */}
      {modalInstAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {instEditando ? 'Editar Instituição de Ensino' : 'Nova Instituição de Ensino'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Preencha os dados institucionais para compor o cadastro oficial.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalInstAberto(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarInst} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome da Instituição *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Universidade Anhembi Morumbi"
                    value={formInstNome}
                    onChange={(e) => setFormInstNome(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sigla *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: UAM, USP"
                    value={formInstSigla}
                    onChange={(e) => setFormInstSigla(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs uppercase font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo de Instituição
                  </label>
                  <select
                    value={formInstTipo}
                    onChange={(e) => setFormInstTipo(e.target.value as TipoInstituicao)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="UNIVERSIDADE">Universidade</option>
                    <option value="CENTRO_UNIVERSITARIO">Centro Universitário</option>
                    <option value="FACULDADE">Faculdade</option>
                    <option value="COLEGIO">Colégio / Ensino Médio</option>
                    <option value="ESCOLA_TECNICA">Escola Técnica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Campus / Unidade
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Vila Olímpia, Higienópolis"
                    value={formInstCampus}
                    onChange={(e) => setFormInstCampus(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: São Paulo"
                    value={formInstCidade}
                    onChange={(e) => setFormInstCidade(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    UF
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="SP"
                    value={formInstUf}
                    onChange={(e) => setFormInstUf(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs uppercase font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Endereço / Bairro
                </label>
                <input
                  type="text"
                  placeholder="Ex: R. Casa do Ator, 275 - Vila Olímpia"
                  value={formInstEndereco}
                  onChange={(e) => setFormInstEndereco(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                  Contatos Institucionais
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contato / Secretaria
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Coordenação de Eventos"
                      value={formInstResponsavel}
                      onChange={(e) => setFormInstResponsavel(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Telefone Fixo
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: (11) 3847-3000"
                      value={formInstTelefone}
                      onChange={(e) => setFormInstTelefone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      WhatsApp Institucional
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: (11) 98765-4321"
                      value={formInstWhatsapp}
                      onChange={(e) => setFormInstWhatsapp(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      E-mail Institucional
                    </label>
                    <input
                      type="email"
                      placeholder="eventos@instituicao.br"
                      value={formInstEmail}
                      onChange={(e) => setFormInstEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status da Instituição
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="statusInst"
                      value="ATIVO"
                      checked={formInstStatus === 'ATIVO'}
                      onChange={() => setFormInstStatus('ATIVO')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Parceira Ativa</span>
                  </label>
                  <label className="flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="statusInst"
                      value="PROSPECCAO"
                      checked={formInstStatus === 'PROSPECCAO'}
                      onChange={() => setFormInstStatus('PROSPECCAO')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Em Prospecção</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalInstAberto(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition"
                >
                  {instEditando ? 'Salvar Alterações' : 'Cadastrar Instituição'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CADASTRAR / EDITAR CURSO */}
      {modalCursoAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {cursoEditando ? 'Editar Curso' : 'Novo Curso de Graduação / Ensino'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Vincule o curso a uma instituição para alimentar CRM e Propostas.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalCursoAberto(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarCurso} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instituição de Ensino *
                </label>
                <select
                  required
                  value={formCursoInstituicaoId}
                  onChange={(e) => setFormCursoInstituicaoId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Selecione uma Instituição...</option>
                  {instituicoes.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.sigla} - {inst.nome} ({inst.campus})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome do Curso *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Medicina, Direito, Administração, Odontologia"
                  value={formCursoNome}
                  onChange={(e) => setFormCursoNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Grau Acadêmico
                  </label>
                  <select
                    value={formCursoGrau}
                    onChange={(e) => setFormCursoGrau(e.target.value as GrauCurso)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="BACHARELADO">Bacharelado</option>
                    <option value="LICENCIATURA">Licenciatura</option>
                    <option value="TECNOLOGO">Tecnólogo</option>
                    <option value="ENSINO_MEDIO">Ensino Médio</option>
                    <option value="POS_GRADUACAO">Pós-Graduação</option>
                    <option value="TECNICO">Técnico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Área
                  </label>
                  <select
                    value={formCursoArea}
                    onChange={(e) => setFormCursoArea(e.target.value as AreaCurso)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="SAUDE">Saúde & Biológicas</option>
                    <option value="HUMANAS">Humanas & Sociais</option>
                    <option value="EXATAS">Exatas & Tecnologia</option>
                    <option value="NEGOCIOS">Negócios & Gestão</option>
                    <option value="COMUNICACAO_ARTES">Comunicação & Artes</option>
                    <option value="EDUCACAO_BASICA">Educação Básica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Período
                  </label>
                  <select
                    value={formCursoPeriodo}
                    onChange={(e) => setFormCursoPeriodo(e.target.value as PeriodoCurso)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="NOTURNO">Noturno</option>
                    <option value="MATUTINO">Matutino</option>
                    <option value="INTEGRAL">Integral</option>
                    <option value="VESPERTINO">Vespertino</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Turmas / Semestres Ativos
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 2026.1, 2026.2, 2027.1"
                    value={formCursoTurmas}
                    onChange={(e) => setFormCursoTurmas(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Separe por vírgulas</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estimativa de Formandos
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formCursoAlunos}
                    onChange={(e) => setFormCursoAlunos(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Coordenador ou Representante
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Dr. Roberto Silveira"
                    value={formCursoCoordenador}
                    onChange={(e) => setFormCursoCoordenador(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contato do Curso / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: (11) 98222-3344"
                    value={formCursoContato}
                    onChange={(e) => setFormCursoContato(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status do Curso
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="statusCurso"
                      value="ATIVO"
                      checked={formCursoStatus === 'ATIVO'}
                      onChange={() => setFormCursoStatus('ATIVO')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Ativo</span>
                  </label>
                  <label className="flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="statusCurso"
                      value="PROSPECCAO"
                      checked={formCursoStatus === 'PROSPECCAO'}
                      onChange={() => setFormCursoStatus('PROSPECCAO')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Em Prospecção</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalCursoAberto(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4F39F6] to-[#7928CA] hover:brightness-110 text-white text-xs font-bold shadow-md transition"
                >
                  {cursoEditando ? 'Salvar Alterações' : 'Cadastrar Curso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
