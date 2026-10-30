'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Search,
  Plus,
  Building,
  Building2,
  School,
  MapPin,
  BookOpen,
  Calendar,
  Users,
  DollarSign,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  Instituicao,
  Curso,
  getInstituicoes,
  getCursos,
  INSTITUICOES_INICIAIS,
} from '@/lib/instituicoes';

export interface ProjetoItem {
  id: string;
  codigoAdesao: string;
  nomeProjeto?: string | null;
  tipo: string;
  semestre: string;
  faculdadeNome?: string | null;
  campusNome?: string | null;
  cursoNome?: string | null;
  status: string;
  quantidadePrevista: number;
  valorPrevistoAluno: number;
  dataContratoTurma?: string | Date | null;
  oportunidade?: {
    tituloTurma: string;
    vendedor?: { nome: string } | null;
    valorPrevistoAluno?: number | null;
    dataContratoTurma?: string | Date | null;
  } | null;
  planos: Array<{
    id: string;
    nome: string;
    descricao?: string | null;
    valorTotal: number;
  }>;
  adesoes: Array<{
    id: string;
    status: string;
    valorTotalContratado: number;
    aluno: { nome: string };
  }>;
  custos: Array<{
    id: string;
    descricao: string;
    valor: number;
  }>;
}

export function ProjetosGerenciador({ initialProjetos }: { initialProjetos: ProjetoItem[] }) {
  const [projetos, setProjetos] = useState<ProjetoItem[]>(initialProjetos);
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  // Formulário de Novo Projeto com suporte a MÚLTIPLAS Instituições e VÁRIOS Cursos
  const [form, setForm] = useState({
    nomeProjeto: '',
    tipo: 'BAILE',
    semestre: '2026.2',
    faculdadeNome: '',
    campusNome: '',
    cursoNome: '',
    quantidadePrevista: 100,
    valorPrevistoAluno: 5000,
    codigoAdesao: '',
    dataContratoTurma: '',
    planoInicialNome: 'Plano Principal Completo',
    planoInicialValor: 5000,
  });

  // Lista dinâmica de Instituições & Câmpus vinculados (suporte a mais de uma instituição)
  const [instituicoes, setInstituicoes] = useState<Array<{ faculdade: string; campus: string }>>([
    { faculdade: '', campus: '' },
  ]);

  // Lista dinâmica de Cursos associados à turma (suporte a vários cursos)
  const [cursos, setCursos] = useState<string[]>([]);
  const [novoCursoInput, setNovoCursoInput] = useState('');

  // Estados com Instituições e Cursos cadastrados no sistema (sincronizados com /instituicoes)
  const [instituicoesCadastradas, setInstituicoesCadastradas] = useState<Instituicao[]>([]);
  const [cursosCadastrados, setCursosCadastrados] = useState<Curso[]>([]);

  // Carrega e sincroniza instituições e cursos do storage/banco
  useEffect(() => {
    const carregarCadastros = () => {
      setInstituicoesCadastradas(getInstituicoes());
      setCursosCadastrados(getCursos());
    };

    carregarCadastros();

    if (typeof window !== 'undefined') {
      window.addEventListener('on_instituicoes_atualizadas', carregarCadastros);
      return () => window.removeEventListener('on_instituicoes_atualizadas', carregarCadastros);
    }
  }, []);

  // Sempre que o modal for aberto, recarrega para pegar cursos novos cadastrados recentemente
  useEffect(() => {
    if (modalAberto) {
      setInstituicoesCadastradas(getInstituicoes());
      setCursosCadastrados(getCursos());
    }
  }, [modalAberto]);

  const adicionarInstituicao = () => {
    setInstituicoes((prev) => [...prev, { faculdade: '', campus: '' }]);
  };

  const removerInstituicao = (index: number) => {
    if (instituicoes.length > 1) {
      setInstituicoes((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const atualizarInstituicao = (index: number, campo: 'faculdade' | 'campus', valor: string) => {
    setInstituicoes((prev) => {
      const nova = [...prev];
      nova[index] = { ...nova[index], [campo]: valor };

      // Se alterou a faculdade, tenta auto-preencher o campus caso exista no cadastro
      if (campo === 'faculdade' && valor.trim()) {
        const inst = instituicoesCadastradas.find(
          (i) =>
            i.nome.toLowerCase().trim() === valor.toLowerCase().trim() ||
            (i.sigla && i.sigla.toLowerCase().trim() === valor.toLowerCase().trim())
        );
        if (inst && inst.campus && !nova[index].campus) {
          nova[index].campus = inst.campus;
        }
      }

      return nova;
    });
  };

  const adicionarCurso = (nomeCurso?: string) => {
    const texto = (nomeCurso || novoCursoInput).trim();
    if (!texto) return;
    const partes = texto
      .split(/[,;\n]/)
      .map((p) => p.trim())
      .filter(Boolean);

    const novos = partes.filter((p) => !cursos.includes(p));
    if (novos.length > 0) {
      setCursos((prev) => [...prev, ...novos]);
    }
    setNovoCursoInput('');
  };

  const removerCurso = (index: number) => {
    setCursos((prev) => prev.filter((_, i) => i !== index));
  };

  // Cursos sugeridos dinamicamente priorizando as faculdades selecionadas + todos os cursos cadastrados
  const cursosSugeridos = useMemo(() => {
    const faculdadesPreenchidas = instituicoes
      .map((i) => i.faculdade.toLowerCase().trim())
      .filter(Boolean);

    // Cursos cadastrados vinculados a essas faculdades
    const cursosDaFaculdade = cursosCadastrados.filter((c) =>
      faculdadesPreenchidas.some(
        (f) =>
          c.instituicaoNome?.toLowerCase().includes(f) ||
          (c.instituicaoSigla && c.instituicaoSigla.toLowerCase().includes(f)) ||
          f.includes(c.instituicaoNome?.toLowerCase() || '')
      )
    );

    const outrosCursos = cursosCadastrados.filter(
      (c) => !cursosDaFaculdade.some((cf) => cf.id === c.id)
    );

    const listaNomes = [
      ...cursosDaFaculdade.map((c) => c.nome),
      ...outrosCursos.map((c) => c.nome),
      'Medicina',
      'Direito',
      'Enfermagem',
      'Administração',
      'Biomedicina',
      'Engenharia Civil',
      'Odontologia',
      'Psicologia',
    ];

    return Array.from(new Set(listaNomes.filter(Boolean)));
  }, [cursosCadastrados, instituicoes]);

  // Filtro Dinâmico abrangente por nome, código da turma, semestre, faculdade ou curso
  const projetosFiltrados = useMemo(() => {
    if (!busca.trim()) return projetos;
    const termo = busca.toLowerCase();

    return projetos.filter((proj) => {
      const matchNome = (proj.nomeProjeto || proj.oportunidade?.tituloTurma || '').toLowerCase().includes(termo);
      const matchCodigo = proj.codigoAdesao.toLowerCase().includes(termo);
      const matchSemestre = proj.semestre.toLowerCase().includes(termo);
      const matchFaculdade = (proj.faculdadeNome || '').toLowerCase().includes(termo);
      const matchCampus = (proj.campusNome || '').toLowerCase().includes(termo);
      const matchCurso = (proj.cursoNome || '').toLowerCase().includes(termo);

      return matchNome || matchCodigo || matchSemestre || matchFaculdade || matchCampus || matchCurso;
    });
  }, [projetos, busca]);

  const handleSubmitNovoProjeto = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setMensagemErro(null);

    try {
      // Agrega múltiplas faculdades e câmpus em strings estruturadas
      const faculdadesValidas = instituicoes.map((i) => i.faculdade.trim()).filter(Boolean);
      const faculdadeNomeFinal = faculdadesValidas.join(', ') || form.faculdadeNome || 'Instituição Unificada';

      const campusValidos = instituicoes
        .filter((i) => i.faculdade.trim() || i.campus.trim())
        .map((i) => (i.campus.trim() ? `${i.faculdade.trim() ? `${i.faculdade.trim()} - ` : ''}${i.campus.trim()}` : i.faculdade.trim()))
        .filter(Boolean);
      const campusNomeFinal = campusValidos.join(', ') || form.campusNome || 'Campus Principal';

      // Agrega os múltiplos cursos
      const cursoNomeFinal = cursos.length > 0 ? cursos.join(', ') : form.cursoNome || 'Geral';

      const payload = {
        ...form,
        faculdadeNome: faculdadeNomeFinal,
        campusNome: campusNomeFinal,
        cursoNome: cursoNomeFinal,
      };

      const res = await fetch('/api/projetos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao cadastrar projeto');
      }

      // Adiciona o novo projeto à lista local
      const novoFormatado: ProjetoItem = {
        ...data.projeto,
        faculdadeNome: faculdadeNomeFinal,
        campusNome: campusNomeFinal,
        cursoNome: cursoNomeFinal,
        planos: form.planoInicialNome
          ? [
              {
                id: 'p-temp',
                nome: form.planoInicialNome,
                valorTotal: Number(form.planoInicialValor),
                descricao: 'Plano inicial',
              },
            ]
          : [],
        adesoes: [],
        custos: [],
      };

      const novaLista = [novoFormatado, ...projetos];
      setProjetos(novaLista);
      setModalAberto(false);

      // Reset formulário
      setForm({
        nomeProjeto: '',
        tipo: 'BAILE',
        semestre: '2026.2',
        faculdadeNome: '',
        campusNome: '',
        cursoNome: '',
        quantidadePrevista: 100,
        valorPrevistoAluno: 5000,
        codigoAdesao: '',
        dataContratoTurma: '',
        planoInicialNome: 'Plano Principal Completo',
        planoInicialValor: 5000,
      });
      setInstituicoes([{ faculdade: '', campus: '' }]);
      setCursos([]);
      setNovoCursoInput('');
    } catch (err: any) {
      setMensagemErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div>
      {/* Barra de Ações: Pesquisa Objetiva + Botão de Novo Projeto */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar por nome do projeto, código da turma, semestre (ex: 2026.2), faculdade, campus ou curso..."
            className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <Link
            href="/alunos"
            className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-300 rounded-lg text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition shadow-2xs shrink-0 cursor-pointer"
            title="Importar lista de formandos via planilha Excel / CSV"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Importar Alunos Excel</span>
          </Link>

          <button
            onClick={() => setModalAberto(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-lg text-sm flex items-center justify-center transition shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            Cadastrar Novo Projeto
          </button>
        </div>
      </div>

      {/* Contador de Resultados */}
      <div className="mb-4 flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Exibindo <strong>{projetosFiltrados.length}</strong> de {projetos.length} projeto(s)
          {busca && ` para o termo "${busca}"`}
        </span>
      </div>

      {/* Lista de Projetos */}
      <div className="space-y-6">
        {projetosFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 shadow-xs">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Nenhum projeto encontrado</h3>
            <p className="text-xs text-slate-500 mt-1">
              Tente alterar os termos de busca por nome, código, semestre, faculdade ou campus.
            </p>
          </div>
        ) : (
          projetosFiltrados.map((proj) => {
            const quantidadeReal = proj.adesoes.filter((a) => a.status === 'ATIVA').length;
            const totalContratadoReal = proj.adesoes
              .filter((a) => a.status === 'ATIVA')
              .reduce((acc, a) => acc + a.valorTotalContratado, 0);

            const vlrPrevistoAluno = proj.valorPrevistoAluno || proj.oportunidade?.valorPrevistoAluno || 0;
            const valorPrevistoTotal = proj.quantidadePrevista * vlrPrevistoAluno;
            const totalCustos = proj.custos.reduce((acc, c) => acc + c.valor, 0);

            const nomeExibicao =
              proj.nomeProjeto ||
              proj.oportunidade?.tituloTurma ||
              `${proj.tipo === 'BAILE' ? 'Baile' : 'Colação'} ${proj.faculdadeNome || ''} ${proj.semestre}`;

            return (
              <div
                key={proj.id}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition"
              >
                {/* Cabeçalho do Card */}
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <GraduationCap className="w-6 h-6" />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-2xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase tracking-wider">
                            {proj.tipo === 'BAILE' ? 'Baile de Formatura' : 'Colação de Grau'}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 font-mono">
                            Semestre {proj.semestre}
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                            Código: {proj.codigoAdesao}
                          </span>
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 mt-1">
                          {nomeExibicao}
                        </h2>

                        {/* Dados Acadêmicos: Faculdade, Campus e Cursos */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1.5">
                          {proj.faculdadeNome && (
                            <span className="flex items-center">
                              <School className="w-3.5 h-3.5 mr-1 text-slate-400" />
                              {proj.faculdadeNome}
                            </span>
                          )}
                          {proj.campusNome && (
                            <span className="flex items-center">
                              <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                              Campus: <strong>{proj.campusNome}</strong>
                            </span>
                          )}
                          {proj.cursoNome && (
                            <span className="flex items-center">
                              <BookOpen className="w-3.5 h-3.5 mr-1 text-slate-400" />
                              Cursos: {proj.cursoNome}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-slate-500 shrink-0">
                    {proj.oportunidade?.vendedor && (
                      <span>
                        Vendedor: <strong className="text-slate-800">{proj.oportunidade.vendedor.nome}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Métricas: Previsto vs Real */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">
                      Alunos Previstos
                    </span>
                    <div className="mt-1 text-xl font-bold text-slate-700">
                      {proj.quantidadePrevista}
                    </div>
                    <span className="text-2xs text-slate-400 mt-1 block">Meta da turma</span>
                  </div>

                  <div className="p-4 bg-emerald-50/40 rounded-lg border border-emerald-200">
                    <span className="text-2xs font-bold text-emerald-700 uppercase tracking-wider block">
                      Adesões Reais Ativas
                    </span>
                    <div className="mt-1 text-xl font-bold text-emerald-700">
                      {quantidadeReal}
                    </div>
                    <span className="text-2xs text-emerald-600 mt-1 block">
                      {Math.round((quantidadeReal / (proj.quantidadePrevista || 1)) * 100)}% da meta
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">
                      Valor Previsto Total
                    </span>
                    <div className="mt-1 text-xl font-bold text-slate-700 font-mono">
                      R$ {valorPrevistoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <span className="text-2xs text-slate-400 mt-1 block">Qtde prevista × R$ {vlrPrevistoAluno.toFixed(2)}</span>
                  </div>

                  <div className="p-4 bg-emerald-50/40 rounded-lg border border-emerald-200">
                    <span className="text-2xs font-bold text-emerald-700 uppercase tracking-wider block">
                      Total Contratado Real
                    </span>
                    <div className="mt-1 text-xl font-bold text-emerald-700 font-mono">
                      R$ {totalContratadoReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <span className="text-2xs text-emerald-600 mt-1 block">Soma dos contratos ativos</span>
                  </div>
                </div>

                {/* Abas e Detalhes de Planos e Custos */}
                <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-white rounded-lg border border-slate-200">
                    <h3 className="text-2xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                      Planos Cadastrados no Projeto
                    </h3>
                    <div className="space-y-2">
                      {proj.planos.length === 0 ? (
                        <span className="text-xs text-slate-400">Nenhum plano cadastrado</span>
                      ) : (
                        proj.planos.map((plano) => (
                          <div
                            key={plano.id}
                            className="flex justify-between items-center text-sm p-2 rounded bg-slate-50 border border-slate-100"
                          >
                            <div>
                              <span className="font-semibold text-slate-800 text-xs">{plano.nome}</span>
                              {plano.descricao && <p className="text-2xs text-slate-500">{plano.descricao}</p>}
                            </div>
                            <span className="font-mono font-bold text-xs text-slate-900">
                              R$ {plano.valorTotal.toFixed(2)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-lg border border-slate-200">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-2xs font-bold text-slate-500 uppercase tracking-wider">
                        Custos Acumulados da Turma
                      </h3>
                      <span className="text-xs font-bold font-mono text-rose-600">
                        Total: R$ {totalCustos.toFixed(2)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {proj.custos.length === 0 ? (
                        <span className="text-xs text-slate-400">Nenhum custo lançado</span>
                      ) : (
                        proj.custos.map((c) => (
                          <div
                            key={c.id}
                            className="flex justify-between items-center text-sm p-2 rounded bg-rose-50/30 border border-rose-100"
                          >
                            <span className="text-slate-700 text-xs">{c.descricao}</span>
                            <span className="font-mono font-bold text-xs text-rose-700">
                              - R$ {c.valor.toFixed(2)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DE CRIAÇÃO DE NOVO PROJETO */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                  <GraduationCap className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-bold text-slate-900">Cadastrar Novo Projeto</h3>
              </div>
              <button
                onClick={() => setModalAberto(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {mensagemErro && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                {mensagemErro}
              </div>
            )}

            <form onSubmit={handleSubmitNovoProjeto} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nome Identificador do Projeto
                  </label>
                  <input
                    type="text"
                    required
                    value={form.nomeProjeto}
                    onChange={(e) => setForm({ ...form, nomeProjeto: e.target.value })}
                    placeholder="Ex: Baile de Gala Direito Mackenzie 2027.1"
                    className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Tipo do Projeto
                  </label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="BAILE">Baile de Formatura</option>
                    <option value="COLACAO">Colação de Grau</option>
                  </select>
                </div>
              </div>

              {/* Datalist com sugestões de Instituições Cadastradas */}
              <datalist id="sugestoes-faculdades">
                {(instituicoesCadastradas.length > 0 ? instituicoesCadastradas : INSTITUICOES_INICIAIS).map((inst) => (
                  <option key={inst.id} value={inst.nome}>
                    {inst.sigla ? `${inst.sigla} - ${inst.campus}` : inst.campus}
                  </option>
                ))}
              </datalist>

              {/* Datalist com sugestões de Cursos Cadastrados no Sistema */}
              <datalist id="sugestoes-cursos">
                {cursosCadastrados.map((curso) => (
                  <option key={curso.id} value={curso.nome}>
                    {curso.instituicaoSigla ? `${curso.instituicaoSigla} - ` : curso.instituicaoNome ? `${curso.instituicaoNome} - ` : ''}
                    {curso.nome} ({curso.periodo || curso.grau || 'Graduação'})
                  </option>
                ))}
              </datalist>

              {/* SEÇÃO 1: MÚLTIPLAS INSTITUIÇÕES E CÂMPUS */}
              <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold text-slate-800">
                      Faculdades / Instituições & Câmpus Vinculados
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {instituicoes.length} {instituicoes.length === 1 ? 'instituição' : 'instituições'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={adicionarInstituicao}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300 flex items-center space-x-1 transition cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Adicionar Outra Faculdade</span>
                  </button>
                </div>

                {instituicoes.map((inst, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs"
                  >
                    <div className="md:col-span-6">
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        {instituicoes.length > 1 ? `Instituição #${index + 1}` : 'Faculdade / Instituição *'}
                      </label>
                      <input
                        type="text"
                        list="sugestoes-faculdades"
                        required
                        value={inst.faculdade}
                        onChange={(e) => atualizarInstituicao(index, 'faculdade', e.target.value)}
                        placeholder="Ex: Universidade Mackenzie, USP, PUC..."
                        className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>

                    <div className={instituicoes.length > 1 ? 'md:col-span-5' : 'md:col-span-6'}>
                      <label className="text-[11px] font-bold text-emerald-800 block mb-1">
                        Campus Associado *
                      </label>
                      <input
                        type="text"
                        required
                        value={inst.campus}
                        onChange={(e) => atualizarInstituicao(index, 'campus', e.target.value)}
                        placeholder="Ex: Campus Higienópolis, Perdizes..."
                        className="w-full text-xs rounded-lg border border-emerald-300 bg-emerald-50/20 p-2.5 focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>

                    {instituicoes.length > 1 && (
                      <div className="md:col-span-1 flex justify-center pb-1">
                        <button
                          type="button"
                          onClick={() => removerInstituicao(index)}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Remover esta instituição"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* SEÇÃO 2: VÁRIOS CURSOS ASSOCIADOS À TURMA (COM PUXAMENTO AUTOMÁTICO DOS CURSOS CADASTRADOS) */}
              <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold text-slate-800">
                      Cursos Associados à Turma (Vários Cursos)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {cursos.length} {cursos.length === 1 ? 'curso incluído' : 'cursos incluídos'}
                    </span>
                  </div>

                  <Link
                    href="/instituicoes"
                    target="_blank"
                    className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center space-x-1"
                  >
                    <span>+ Gerenciar Cursos no Sistema</span>
                  </Link>
                </div>

                {/* Campo de Inclusão de Curso com Autocomplete */}
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    list="sugestoes-cursos"
                    value={novoCursoInput}
                    onChange={(e) => setNovoCursoInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        adicionarCurso();
                      }
                    }}
                    placeholder="Digite o curso ou escolha uma das sugestões cadastradas..."
                    className="flex-1 text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => adicionarCurso()}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 transition cursor-pointer shrink-0 shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Curso</span>
                  </button>
                </div>

                {/* Dropdown Seletor de Cursos Cadastrados no Sistema */}
                {cursosCadastrados.length > 0 && (
                  <div className="pt-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      ⚡ Selecionar curso cadastrado no sistema ({cursosCadastrados.length} disponíveis):
                    </label>
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        const nome = e.target.value;
                        if (nome) {
                          adicionarCurso(nome);
                        }
                        e.target.value = '';
                      }}
                      className="w-full text-xs rounded-lg border border-emerald-300 bg-emerald-50/40 p-2 text-slate-800 font-semibold cursor-pointer focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="" disabled>
                        Clique para escolher um curso já cadastrado...
                      </option>
                      {cursosCadastrados.map((c) => (
                        <option key={c.id} value={c.nome}>
                          {c.nome} {c.instituicaoSigla ? `(${c.instituicaoSigla})` : c.instituicaoNome ? `(${c.instituicaoNome})` : ''} - {c.periodo || c.grau || 'Graduação'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Chips com os Cursos Já Adicionados ao Projeto */}
                {cursos.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {cursos.map((c, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white border border-emerald-300 text-emerald-900 rounded-lg text-xs font-bold shadow-2xs"
                      >
                        <span>{c}</span>
                        <button
                          type="button"
                          onClick={() => removerCurso(i)}
                          className="text-emerald-500 hover:text-rose-600 transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    Nenhum curso incluído ainda. Digite acima ou clique nos atalhos rápidos abaixo:
                  </p>
                )}

                {/* Atalhos Rápidos Dinâmicos com os Cursos Cadastrados */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {cursosSugeridos.slice(0, 16).map((sugestao) => (
                    <button
                      key={sugestao}
                      type="button"
                      onClick={() => adicionarCurso(sugestao)}
                      className={`text-[10px] font-semibold border rounded-md px-2 py-0.5 transition cursor-pointer ${
                        cursos.includes(sugestao)
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border-slate-200'
                      }`}
                    >
                      {cursos.includes(sugestao) ? '✓ ' : '+ '}
                      {sugestao}
                    </button>
                  ))}
                </div>
              </div>

              {/* Semestre e Código de Adesão */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Semestre (Ano.Período) *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.semestre}
                    onChange={(e) => setForm({ ...form, semestre: e.target.value })}
                    placeholder="Ex: 2026.2, 2027.1, 2028.2"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Código Exclusivo de Adesão *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.codigoAdesao}
                    onChange={(e) => setForm({ ...form, codigoAdesao: e.target.value.toUpperCase() })}
                    placeholder="Ex: MACK-DIR-2027-1 ou UNIF-SAUDE-26"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 font-mono font-bold focus:ring-2 focus:ring-emerald-500 uppercase"
                  />
                </div>
              </div>

              {/* Quantidade e Valor Previsto por Aluno */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Quantidade Prevista de Alunos *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.quantidadePrevista}
                    onChange={(e) => setForm({ ...form, quantidadePrevista: Number(e.target.value) })}
                    className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Valor Previsto por Aluno (R$) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={form.valorPrevistoAluno}
                    onChange={(e) => setForm({ ...form, valorPrevistoAluno: Number(e.target.value) })}
                    className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Plano Inicial Pré-configurado */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 block mb-2">
                  Plano Inicial para Adesão dos Alunos
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-2xs font-semibold text-slate-500 block mb-1">Nome do Pacote</label>
                    <input
                      type="text"
                      value={form.planoInicialNome}
                      onChange={(e) => setForm({ ...form, planoInicialNome: e.target.value })}
                      placeholder="Ex: Pacote Ouro Gala"
                      className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-2xs font-semibold text-slate-500 block mb-1">Valor do Pacote (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.planoInicialValor}
                      onChange={(e) => setForm({ ...form, planoInicialValor: Number(e.target.value) })}
                      className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Botões do Rodapé */}
              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold flex items-center transition shadow-xs disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Criar Projeto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
