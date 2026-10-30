'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Upload,
  Download,
  Plus,
  FileSpreadsheet,
  Building2,
  GraduationCap,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Trash2,
  Edit3,
  Calendar,
  Layers,
  Sparkles,
  ClipboardPaste,
} from 'lucide-react';
import {
  AlunoCliente,
  getAlunosCadastrados,
  salvarAlunosCadastrados,
  processarArquivoExcel,
  processarTextoCopiado,
  baixarPlanilhaModeloXlsx,
  exportarAlunosParaXlsx,
  COLUNAS_EXCEL_PADRAO,
} from '@/lib/alunos';

export function AlunosGerenciador() {
  const [alunos, setAlunos] = useState<AlunoCliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroInstituicao, setFiltroInstituicao] = useState('TODAS');
  const [filtroTurma, setFiltroTurma] = useState('TODAS');

  // Estados dos Modais
  const [modalImportarAberto, setModalImportarAberto] = useState(false);
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [alunoEditando, setAlunoEditando] = useState<AlunoCliente | null>(null);

  // Estados do Modal de Importação
  const [abaImportacao, setAbaImportacao] = useState<'ARQUIVO' | 'COLAR'>('ARQUIVO');
  const [textoColado, setTextoColado] = useState('');
  const [alunosPrevia, setAlunosPrevia] = useState<AlunoCliente[]>([]);
  const [processandoArquivo, setProcessandoArquivo] = useState(false);
  const [erroImportacao, setErroImportacao] = useState<string | null>(null);
  const [toastMensagem, setToastMensagem] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Estado do Formulário Manual
  const [formManual, setFormManual] = useState<Partial<AlunoCliente>>({
    nome: '',
    cpf: '',
    celular: '',
    email: '',
    instituicao: '',
    campus: '',
    curso: '',
    turma: '',
    semestre: '2026.2',
    projeto: '',
    plano: 'Plano Principal Completo',
    logradouro: '',
    numero: '',
    complemento: '',
    cidade: 'São Paulo',
    uf: 'SP',
    cep: '',
  });

  // Carrega alunos do storage local
  useEffect(() => {
    const lista = getAlunosCadastrados();
    setAlunos(lista);
    setCarregando(false);

    const handleAtualizacao = () => {
      setAlunos(getAlunosCadastrados());
    };
    window.addEventListener('on_alunos_atualizados', handleAtualizacao);
    return () => window.removeEventListener('on_alunos_atualizados', handleAtualizacao);
  }, []);

  const exibirToast = (msg: string) => {
    setToastMensagem(msg);
    setTimeout(() => setToastMensagem(null), 4000);
  };

  // Opções únicas para filtros
  const instituicoesDisponiveis = useMemo(() => {
    const set = new Set(alunos.map((a) => a.instituicao).filter(Boolean));
    return Array.from(set);
  }, [alunos]);

  const turmasDisponiveis = useMemo(() => {
    const set = new Set(alunos.map((a) => a.turma).filter(Boolean));
    return Array.from(set);
  }, [alunos]);

  // Alunos Filtrados pela busca e selects
  const alunosFiltrados = useMemo(() => {
    return alunos.filter((aluno) => {
      const matchInst = filtroInstituicao === 'TODAS' || aluno.instituicao === filtroInstituicao;
      const matchTurma = filtroTurma === 'TODAS' || aluno.turma === filtroTurma;

      if (!matchInst || !matchTurma) return false;

      if (!busca.trim()) return true;
      const termo = busca.toLowerCase();

      return (
        aluno.nome.toLowerCase().includes(termo) ||
        aluno.cpf.toLowerCase().includes(termo) ||
        aluno.email.toLowerCase().includes(termo) ||
        aluno.celular.toLowerCase().includes(termo) ||
        aluno.curso.toLowerCase().includes(termo) ||
        aluno.campus.toLowerCase().includes(termo) ||
        aluno.codigoContrato.toLowerCase().includes(termo) ||
        aluno.projeto.toLowerCase().includes(termo) ||
        aluno.cidade.toLowerCase().includes(termo)
      );
    });
  }, [alunos, busca, filtroInstituicao, filtroTurma]);

  // Manipulador de Upload de Arquivo
  const handleUploadArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessandoArquivo(true);
    setErroImportacao(null);

    try {
      const listaParseada = await processarArquivoExcel(file);
      if (listaParseada.length === 0) {
        throw new Error('Nenhum formando válido encontrado no arquivo. Verifique os cabeçalhos das colunas.');
      }
      setAlunosPrevia(listaParseada);
    } catch (err: any) {
      setErroImportacao(err.message || 'Erro ao processar o arquivo Excel.');
      setAlunosPrevia([]);
    } finally {
      setProcessandoArquivo(false);
    }
  };

  // Processa texto colado
  const handleProcessarColagem = () => {
    setErroImportacao(null);
    if (!textoColado.trim()) {
      setErroImportacao('Por favor, cole o conteúdo das células do Excel na caixa de texto.');
      return;
    }

    try {
      const listaParseada = processarTextoCopiado(textoColado);
      if (listaParseada.length === 0) {
        throw new Error('Não foi possível identificar registros válidos no texto colado.');
      }
      setAlunosPrevia(listaParseada);
    } catch (err: any) {
      setErroImportacao(err.message || 'Erro ao processar o texto colado.');
      setAlunosPrevia([]);
    }
  };

  // Confirmação e Salvamento da Importação
  const handleConfirmarImportacao = () => {
    if (alunosPrevia.length === 0) return;

    // Evita duplicar CPFs caso já existam
    const cpfsExistentes = new Set(alunos.map((a) => a.cpf.replace(/\D/g, '')));
    const novosUnicos: AlunoCliente[] = [];

    alunosPrevia.forEach((alunoNovo) => {
      const cpfLimpo = alunoNovo.cpf.replace(/\D/g, '');
      if (!cpfLimpo || !cpfsExistentes.has(cpfLimpo)) {
        novosUnicos.push(alunoNovo);
        if (cpfLimpo) cpfsExistentes.add(cpfLimpo);
      }
    });

    const listaAtualizada = [...novosUnicos, ...alunos];
    salvarAlunosCadastrados(listaAtualizada);
    setAlunos(listaAtualizada);

    exibirToast(`✓ Sucesso! ${novosUnicos.length} formandos importados e cadastrados no sistema.`);
    setModalImportarAberto(false);
    setAlunosPrevia([]);
    setTextoColado('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Salvar Aluno Manual (Criar ou Editar)
  const handleSalvarManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formManual.nome || !formManual.cpf) {
      alert('Nome e CPF são campos obrigatórios.');
      return;
    }

    if (alunoEditando) {
      // Edição
      const atualizados = alunos.map((a) => (a.id === alunoEditando.id ? ({ ...a, ...formManual } as AlunoCliente) : a));
      salvarAlunosCadastrados(atualizados);
      setAlunos(atualizados);
      exibirToast('✓ Dados do aluno atualizados com sucesso!');
    } else {
      // Criação
      const novo: AlunoCliente = {
        id: `alu-${Date.now()}`,
        codigoContrato: `ALU-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
        nome: formManual.nome || '',
        cpf: formManual.cpf || '',
        celular: formManual.celular || '',
        email: formManual.email || '',
        instituicao: formManual.instituicao || '',
        campus: formManual.campus || '',
        curso: formManual.curso || '',
        turma: formManual.turma || '',
        semestre: formManual.semestre || '2026.2',
        projeto: formManual.projeto || '',
        plano: formManual.plano || 'Plano Principal Completo',
        logradouro: formManual.logradouro || '',
        numero: formManual.numero || '',
        complemento: formManual.complemento || '',
        cidade: formManual.cidade || 'São Paulo',
        uf: formManual.uf || 'SP',
        cep: formManual.cep || '',
        status: 'ATIVO',
        valorTotal: 5000,
        parcelasPagas: 0,
        totalParcelas: 10,
        criadoEm: new Date().toISOString(),
      };
      const atualizados = [novo, ...alunos];
      salvarAlunosCadastrados(atualizados);
      setAlunos(atualizados);
      exibirToast('✓ Novo formando cadastrado com sucesso!');
    }

    setModalNovoAberto(false);
    setAlunoEditando(null);
  };

  const handleExcluirAluno = (id: string) => {
    if (confirm('Tem certeza que deseja excluir o cadastro deste formando?')) {
      const atualizados = alunos.filter((a) => a.id !== id);
      salvarAlunosCadastrados(atualizados);
      setAlunos(atualizados);
      exibirToast('Aluno removido com sucesso.');
    }
  };

  const abrirEdicao = (aluno: AlunoCliente) => {
    setAlunoEditando(aluno);
    setFormManual(aluno);
    setModalNovoAberto(true);
  };

  const abrirNovo = () => {
    setAlunoEditando(null);
    setFormManual({
      nome: '',
      cpf: '',
      celular: '',
      email: '',
      instituicao: '',
      campus: '',
      curso: '',
      turma: '',
      semestre: '2026.2',
      projeto: '',
      plano: 'Plano Principal Completo',
      logradouro: '',
      numero: '',
      complemento: '',
      cidade: 'São Paulo',
      uf: 'SP',
      cep: '',
    });
    setModalNovoAberto(true);
  };

  return (
    <div className="space-y-6">
      {/* Toast Flutuante de Notificação */}
      {toastMensagem && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMensagem}</span>
        </div>
      )}

      {/* Header Superior Limpo */}
      <header className="bg-white rounded-2xl p-4 lg:px-6 lg:py-5 shadow-xs border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
                Gestão de Alunos & Contratos
              </h1>
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {alunos.length} formandos
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Base oficial de formandos, contratos de turmas, importação por Excel e controle cadastral.
            </p>
          </div>
        </div>

        {/* Ações do Topo */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Botão Baixar Modelo */}
          <button
            onClick={baixarPlanilhaModeloXlsx}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition cursor-pointer"
            title="Baixar planilha modelo vazia para preenchimento com as 17 colunas"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Baixar Modelo</span>
          </button>

          {/* Botão Exportar XLSX */}
          <button
            onClick={() => exportarAlunosParaXlsx(alunos)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition cursor-pointer"
            title="Exportar todos os alunos cadastrados para uma planilha Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Exportar Excel</span>
          </button>

          {/* Botão Importar Excel (Destaque Verde) */}
          <button
            onClick={() => {
              setAlunosPrevia([]);
              setErroImportacao(null);
              setModalImportarAberto(true);
            }}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold shadow-sm shadow-emerald-600/30 transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Importar Planilha Excel</span>
          </button>

          {/* Botão Novo Aluno Individual */}
          <button
            onClick={abrirNovo}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-98 text-white text-xs font-bold shadow-sm shadow-purple-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Aluno</span>
          </button>
        </div>
      </header>

      {/* Cards de Métricas Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Total de Formandos</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{alunos.length}</span>
            <span className="text-[11px] font-bold text-blue-600">clientes</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Turmas Mapeadas</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{turmasDisponiveis.length}</span>
            <span className="text-[11px] font-bold text-purple-600">turmas</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Instituições Ativas</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{instituicoesDisponiveis.length}</span>
            <span className="text-[11px] font-bold text-teal-600">faculdades</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Contratos no Prazo</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-600">
              {alunos.filter((a) => a.status === 'ATIVO').length}
            </span>
            <span className="text-[11px] font-bold text-emerald-600">100% ativos</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Pesquisa */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar por Nome, CPF, Código Contrato (ALU-XXX), Curso, Campus ou Projeto..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-purple-600 focus:outline-none transition"
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

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Filtro por Instituição */}
          <select
            value={filtroInstituicao}
            onChange={(e) => setFiltroInstituicao(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 py-2.5 px-3 focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="TODAS">Todas as Instituições</option>
            {instituicoesDisponiveis.map((inst) => (
              <option key={inst} value={inst}>
                {inst}
              </option>
            ))}
          </select>

          {/* Filtro por Turma */}
          <select
            value={filtroTurma}
            onChange={(e) => setFiltroTurma(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 py-2.5 px-3 focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="TODAS">Todas as Turmas</option>
            {turmasDisponiveis.map((turma) => (
              <option key={turma} value={turma}>
                Turma: {turma}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela de Alunos e Contratos */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {alunosFiltrados.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">Nenhum formando encontrado</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Você pode importar uma planilha Excel do seu sistema anterior com o botão acima ou cadastrar um novo aluno individualmente.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Formando / Contrato</th>
                  <th className="py-3 px-4">Contato & Documento</th>
                  <th className="py-3 px-4">Instituição & Campus</th>
                  <th className="py-3 px-4">Curso / Turma</th>
                  <th className="py-3 px-4">Projeto & Plano</th>
                  <th className="py-3 px-4">Endereço / Localidade</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alunosFiltrados.map((aluno) => (
                  <tr key={aluno.id} className="hover:bg-slate-50/60 transition group">
                    {/* Nome e Código do Contrato */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 font-extrabold flex items-center justify-center text-xs shrink-0 border border-purple-200">
                          {aluno.nome.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-purple-700 transition">
                            {aluno.nome}
                          </p>
                          <span className="inline-block font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 mt-0.5">
                            {aluno.codigoContrato}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contato & Documento */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <p className="font-semibold text-slate-800">{aluno.cpf}</p>
                      <p className="text-[11px] text-slate-500">{aluno.celular || 'Sem celular'}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{aluno.email}</p>
                    </td>

                    {/* Instituição & Campus */}
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800 truncate max-w-[200px]" title={aluno.instituicao}>
                        {aluno.instituicao}
                      </p>
                      <p className="text-[11px] text-emerald-700 font-medium flex items-center mt-0.5">
                        <MapPin className="w-3 h-3 mr-1 shrink-0" />
                        <span className="truncate max-w-[180px]" title={aluno.campus}>
                          {aluno.campus}
                        </span>
                      </p>
                    </td>

                    {/* Curso / Turma / Semestre */}
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800">{aluno.curso}</p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Turma: <strong className="text-slate-700">{aluno.turma}</strong> &bull; {aluno.semestre}
                      </p>
                    </td>

                    {/* Projeto & Plano */}
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800 truncate max-w-[180px]" title={aluno.projeto}>
                        {aluno.projeto}
                      </p>
                      <p className="text-[11px] text-purple-700 font-bold">{aluno.plano}</p>
                    </td>

                    {/* Endereço */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <p className="text-xs truncate max-w-[180px]" title={`${aluno.logradouro}, ${aluno.numero} ${aluno.complemento ? `- ${aluno.complemento}` : ''}`}>
                        {aluno.logradouro ? `${aluno.logradouro}, ${aluno.numero}` : '—'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {aluno.cidade ? `${aluno.cidade}/${aluno.uf}` : '—'} {aluno.cep && `• ${aluno.cep}`}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {aluno.status}
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => abrirEdicao(aluno)}
                          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                          title="Editar dados do formando"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExcluirAluno(aluno.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Excluir aluno"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* ========================================================================= */}
      {/* MODAL 1: IMPORTAR FORMANDOS POR EXCEL (.XLSX, .XLS, .CSV) OU COLAGEM      */}
      {/* ========================================================================= */}
      {modalImportarAberto && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            {/* Topo do Modal */}
            <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 p-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Importador Inteligente de Alunos via Excel</h3>
                  <p className="text-xs text-emerald-100">
                    Suba a lista do outro sistema e importe todos os clientes com dados acadêmicos e contratuais.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalImportarAberto(false)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Abas: Arquivo vs Colar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setAbaImportacao('ARQUIVO')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    abaImportacao === 'ARQUIVO'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Enviar Arquivo (.xlsx / .csv)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAbaImportacao('COLAR')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    abaImportacao === 'COLAR'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Colar Células Direto do Excel</span>
                </button>
              </div>

              <button
                type="button"
                onClick={baixarPlanilhaModeloXlsx}
                className="text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl flex items-center space-x-1 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>Baixar Modelo Vazio (.xlsx)</span>
              </button>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Alerta de Colunas Reconhecidas */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-900">
                <span className="font-bold block mb-1">Colunas Reconhecidas Automaticamente pelo Sistema:</span>
                <div className="flex flex-wrap gap-1">
                  {COLUNAS_EXCEL_PADRAO.map((col) => (
                    <span key={col} className="bg-white border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-semibold text-emerald-800">
                      {col}
                    </span>
                  ))}
                </div>
              </div>

              {/* Mensagem de Erro */}
              {erroImportacao && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{erroImportacao}</span>
                </div>
              )}

              {/* ABA 1: UPLOAD DE ARQUIVO */}
              {abaImportacao === 'ARQUIVO' && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/30 rounded-2xl p-8 text-center cursor-pointer transition group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleUploadArquivo}
                    className="hidden"
                  />
                  <FileSpreadsheet className="w-12 h-12 text-slate-400 group-hover:text-emerald-600 mx-auto mb-3 transition" />
                  <p className="text-sm font-bold text-slate-800">
                    {processandoArquivo ? 'Processando arquivo Excel...' : 'Clique para selecionar ou arraste sua planilha aqui'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Formatos aceitos: Microsoft Excel (.xlsx, .xls) ou Valores Separados por Vírgula (.csv)
                  </p>
                </div>
              )}

              {/* ABA 2: COLAR CÉLULAS DO EXCEL */}
              {abaImportacao === 'COLAR' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 font-medium">
                    No seu Excel, selecione as linhas com os dados dos formandos, pressione <kbd className="px-1.5 py-0.5 bg-slate-200 rounded font-mono text-[10px]">Ctrl+C</kbd> e cole abaixo:
                  </p>
                  <textarea
                    rows={6}
                    value={textoColado}
                    onChange={(e) => setTextoColado(e.target.value)}
                    placeholder="Cole aqui os dados copiados do Excel (com ou sem a linha de cabeçalho)..."
                    className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleProcessarColagem}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Processar Dados Colados</span>
                  </button>
                </div>
              )}

              {/* TABELA DE PRÉ-VISUALIZAÇÃO */}
              {alunosPrevia.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <h4 className="text-sm font-black text-slate-900">
                        Pré-visualização da Planilha ({alunosPrevia.length} formandos prontos para importação)
                      </h4>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      Mostrando os primeiros registros
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 sticky top-0 text-[10px] uppercase font-bold text-slate-600">
                        <tr>
                          <th className="p-2">Nome</th>
                          <th className="p-2">CPF</th>
                          <th className="p-2">Celular</th>
                          <th className="p-2">E-mail</th>
                          <th className="p-2">Instituição</th>
                          <th className="p-2">Unidade/Campus</th>
                          <th className="p-2">Curso</th>
                          <th className="p-2">Turma</th>
                          <th className="p-2">Projeto</th>
                          <th className="p-2">Cidade/UF</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {alunosPrevia.slice(0, 50).map((aluno, i) => (
                          <tr key={i} className="hover:bg-emerald-50/40">
                            <td className="p-2 font-bold text-slate-900">{aluno.nome}</td>
                            <td className="p-2 font-mono text-[11px]">{aluno.cpf}</td>
                            <td className="p-2 text-[11px]">{aluno.celular}</td>
                            <td className="p-2 text-[11px] text-slate-500 truncate max-w-[120px]">{aluno.email}</td>
                            <td className="p-2 truncate max-w-[120px]">{aluno.instituicao}</td>
                            <td className="p-2 truncate max-w-[120px] text-emerald-800 font-semibold">{aluno.campus}</td>
                            <td className="p-2 truncate max-w-[100px]">{aluno.curso}</td>
                            <td className="p-2 font-semibold">{aluno.turma}</td>
                            <td className="p-2 truncate max-w-[120px]">{aluno.projeto}</td>
                            <td className="p-2 text-[11px]">{aluno.cidade}/{aluno.uf}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé do Modal com Ações */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setModalImportarAberto(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={alunosPrevia.length === 0}
                onClick={handleConfirmarImportacao}
                className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white shadow-md shadow-emerald-600/30 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar e Cadastrar {alunosPrevia.length} Formandos</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CADASTRO / EDIÇÃO MANUAL DE ALUNO COM TODOS OS 17 CAMPOS          */}
      {/* ========================================================================= */}
      {modalNovoAberto && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            {/* Topo do Modal */}
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                  <GraduationCap className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {alunoEditando ? 'Editar Cadastro do Formando' : 'Cadastrar Novo Formando'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Preencha os dados completos do aluno, dados acadêmicos e endereço.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalNovoAberto(false)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulário com Scroll */}
            <form onSubmit={handleSalvarManual} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Seção 1: Dados Pessoais */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-purple-700 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 mr-2" />
                  1. Dados Pessoais do Formando
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      value={formManual.nome || ''}
                      onChange={(e) => setFormManual({ ...formManual, nome: e.target.value })}
                      placeholder="Ex: Mariana Silva Santos"
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">CPF *</label>
                    <input
                      type="text"
                      required
                      value={formManual.cpf || ''}
                      onChange={(e) => setFormManual({ ...formManual, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Celular / WhatsApp</label>
                    <input
                      type="text"
                      value={formManual.celular || ''}
                      onChange={(e) => setFormManual({ ...formManual, celular: e.target.value })}
                      placeholder="(11) 90000-0000"
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">E-mail</label>
                    <input
                      type="email"
                      value={formManual.email || ''}
                      onChange={(e) => setFormManual({ ...formManual, email: e.target.value })}
                      placeholder="aluno@email.com"
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 2: Dados Acadêmicos & Contrato */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <h4 className="text-xs font-black uppercase tracking-wider text-purple-700 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 mr-2" />
                  2. Instituição, Campus & Turma
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Instituição / Faculdade</label>
                    <input
                      type="text"
                      value={formManual.instituicao || ''}
                      onChange={(e) => setFormManual({ ...formManual, instituicao: e.target.value })}
                      placeholder="Ex: Universidade Mackenzie, USP, PUC..."
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1 text-emerald-800">
                      Unidade / Campus *
                    </label>
                    <input
                      type="text"
                      value={formManual.campus || ''}
                      onChange={(e) => setFormManual({ ...formManual, campus: e.target.value })}
                      placeholder="Ex: Campus Higienópolis, Perdizes..."
                      className="w-full text-xs rounded-xl border border-emerald-300 bg-emerald-50/20 p-2.5 focus:border-emerald-600 focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Curso</label>
                    <input
                      type="text"
                      value={formManual.curso || ''}
                      onChange={(e) => setFormManual({ ...formManual, curso: e.target.value })}
                      placeholder="Ex: Direito, Medicina, Administração..."
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Turma</label>
                    <input
                      type="text"
                      value={formManual.turma || ''}
                      onChange={(e) => setFormManual({ ...formManual, turma: e.target.value })}
                      placeholder="Ex: DIR-MAT-A, Turma 26"
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Semestre</label>
                    <input
                      type="text"
                      value={formManual.semestre || '2026.2'}
                      onChange={(e) => setFormManual({ ...formManual, semestre: e.target.value })}
                      placeholder="2026.2"
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Projeto</label>
                    <input
                      type="text"
                      value={formManual.projeto || ''}
                      onChange={(e) => setFormManual({ ...formManual, projeto: e.target.value })}
                      placeholder="Ex: Baile Unificado Direito 2026"
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1">Plano Escolhido</label>
                    <input
                      type="text"
                      value={formManual.plano || 'Plano Principal Completo'}
                      onChange={(e) => setFormManual({ ...formManual, plano: e.target.value })}
                      placeholder="Ex: Plano Ouro Completo"
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 3: Endereço do Formando */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <h4 className="text-xs font-black uppercase tracking-wider text-purple-700 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 mr-2" />
                  3. Endereço Completo
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-8">
                    <label className="text-xs font-bold text-slate-700 block mb-1">Logradouro (Rua / Av)</label>
                    <input
                      type="text"
                      value={formManual.logradouro || ''}
                      onChange={(e) => setFormManual({ ...formManual, logradouro: e.target.value })}
                      placeholder="Ex: Rua da Consolação"
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="text-xs font-bold text-slate-700 block mb-1">Número</label>
                    <input
                      type="text"
                      value={formManual.numero || ''}
                      onChange={(e) => setFormManual({ ...formManual, numero: e.target.value })}
                      placeholder="1200"
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="text-xs font-bold text-slate-700 block mb-1">Complemento</label>
                    <input
                      type="text"
                      value={formManual.complemento || ''}
                      onChange={(e) => setFormManual({ ...formManual, complemento: e.target.value })}
                      placeholder="Apto 42B"
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="text-xs font-bold text-slate-700 block mb-1">Cidade</label>
                    <input
                      type="text"
                      value={formManual.cidade || 'São Paulo'}
                      onChange={(e) => setFormManual({ ...formManual, cidade: e.target.value })}
                      placeholder="São Paulo"
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1">UF</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={formManual.uf || 'SP'}
                      onChange={(e) => setFormManual({ ...formManual, uf: e.target.value.toUpperCase() })}
                      placeholder="SP"
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none uppercase"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1">CEP</label>
                    <input
                      type="text"
                      value={formManual.cep || ''}
                      onChange={(e) => setFormManual({ ...formManual, cep: e.target.value })}
                      placeholder="00000-000"
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:border-purple-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalNovoAberto(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition cursor-pointer"
                >
                  {alunoEditando ? 'Salvar Alterações' : 'Cadastrar Formando'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
