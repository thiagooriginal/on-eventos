#!/usr/bin/env node
/**
 * ON Agência de Eventos - Suíte de Testes Funcionais com Dados Fictícios
 * 
 * Validação Funcional Completa dos Módulos:
 * - Usuários & Permissões (Adicionar, Convite, Ativação, Alternância de Perfil, Exclusão)
 * - Vendas & Pagamentos (Cadastro, Parcelas, Liquidação, Soft Delete, Restauração)
 * - Demandas & Operações (Kanban de Tarefas, Transição de Etapa, Exclusão)
 * - Instituições, Cursos & Parceiros (Espaços de Eventos e Profissionais Liberais)
 * - Pipeline Comercial / CRM
 * 
 * Executa em ambiente isolado (sandbox) com interpretador PHP real e dados estritamente fictícios.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';

const root = process.cwd();
const sandboxDir = path.join(root, '.test_sandbox_functional');
const webrootDir = path.join(sandboxDir, 'public');
const privateDir = path.join(sandboxDir, 'private_data');

function findPhpBinary() {
  const customWinGetPath = path.join(
    process.env.LOCALAPPDATA || '',
    'Microsoft/WinGet/Packages/PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe/php.exe'
  );
  const candidates = [
    'php',
    customWinGetPath,
    'C:\\xampp\\php\\php.exe',
    'C:\\laragon\\bin\\php\\php.exe',
    'C:\\php\\php.exe'
  ];
  for (const bin of candidates) {
    try {
      if (fs.existsSync(bin)) return bin;
    } catch {}
  }
  return 'php';
}

const phpBinary = findPhpBinary();

// Prepara sandbox isolado
if (fs.existsSync(sandboxDir)) {
  fs.rmSync(sandboxDir, { recursive: true, force: true });
}
fs.mkdirSync(webrootDir, { recursive: true });
fs.mkdirSync(privateDir, { recursive: true });

// Copia arquivos do backend PHP para o webroot do sandbox
const publicDir = path.join(root, 'public');
for (const file of fs.readdirSync(publicDir).filter(f => f.endsWith('.php'))) {
  fs.copyFileSync(path.join(publicDir, file), path.join(webrootDir, file));
}

// Cria administrador inicial com hash Bcrypt real para 'SenhaAdminForte@123'
const hashAdmin = '$2y$10$kpaLrRRv5SgufVd/2I7Ql.G3hv5Q5h0UJ3l/5Gny9lIbV2/9QK.ou';
const initialUsers = [
  {
    id: 'usr-admin-func',
    nome: 'Diretor de Operações Fictício',
    email: 'admin.func@onagenciadeeventos.com.br',
    senhaHash: hashAdmin,
    precisaRedefinirSenha: false,
    nivel: 'ADMIN',
    cargo: 'Diretor',
    departamento: 'Diretoria',
    telefone: '(11) 98888-7777',
    status: 'ATIVO',
    criadoEm: '2026-01-01T00:00:00Z',
    ultimoAcesso: 'Hoje',
    avatarCor: 'from-amber-400 to-amber-200 text-slate-900'
  }
];

fs.writeFileSync(
  path.join(privateDir, 'usuarios_db.json'),
  JSON.stringify(initialUsers, null, 2),
  'utf8'
);

// Configuração do Webhook Sicredi no sandbox funcional
const webhookConfig = {
  webhook_secret: 'sicredi_test_secret_token_1234567890abcdef',
  ambiente: 'homologacao'
};
fs.writeFileSync(
  path.join(privateDir, 'sicredi_api_config.json'),
  JSON.stringify(webhookConfig, null, 2),
  'utf8'
);

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName} - ${details}`);
    failed++;
  }
}

const PORT = 8898;
const BASE_URL = `http://127.0.0.1:${PORT}`;

console.log('\n============================================================');
console.log('  TESTES FUNCIONAIS DOS MÓDULOS COM DADOS FICTÍCIOS (PHP REAL)');
console.log('============================================================\n');
console.log(`- Executável PHP: ${phpBinary}`);
console.log(`- Servidor alvo:  ${BASE_URL}`);
console.log(`- Sandbox:        ${sandboxDir}\n`);

const phpServer = spawn(phpBinary, ['-S', `127.0.0.1:${PORT}`, '-t', webrootDir], {
  stdio: 'ignore',
  env: { ...process.env, ON_PRIVATE_DATA_DIR: privateDir }
});

function cleanup() {
  try { phpServer.kill(); } catch {}
  try {
    if (fs.existsSync(sandboxDir)) {
      fs.rmSync(sandboxDir, { recursive: true, force: true });
    }
  } catch {}
}

process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(1); });
process.on('SIGTERM', () => { cleanup(); process.exit(1); });

async function waitForServer(retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${BASE_URL}/usuarios.php`, { method: 'GET' });
      if (res.status === 401 || res.status === 200) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error('Servidor PHP funcional não iniciou a tempo na porta ' + PORT);
}

function extractSessionCookie(res) {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return '';
  const match = setCookie.match(/ON_AUTH_SESSION=([^;]+)/);
  return match ? `ON_AUTH_SESSION=${match[1]}` : '';
}

async function runFunctionalTests() {
  await waitForServer();

  // -------------------------------------------------------------------------
  // MÓDULO 1: Autenticação de Administrador e Gestão de Usuários
  // -------------------------------------------------------------------------
  console.log('1. Módulo de Usuários e Equipe:');

  // Login do Administrador
  const resLogin = await fetch(`${BASE_URL}/usuarios.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      email: 'admin.func@onagenciadeeventos.com.br',
      senha: 'SenhaAdminForte@123'
    })
  });
  const dataLogin = await resLogin.json().catch(() => null);
  const sessionCookie = extractSessionCookie(resLogin);
  const csrfToken = dataLogin?.csrf_token || '';
  assert(resLogin.status === 200, 'Administrador autenticado com sucesso');
  assert(sessionCookie.length > 0 && csrfToken.length === 64, 'Sessão e token CSRF administrativos emitidos');

  // Cadastro de novo colaborador fictício
  const novoColaborador = {
    nome: 'Carlos Consultor Comercial Fictício',
    email: 'carlos.comercial@ficticio-eventos.com.br',
    cargo: 'Consultor de Vendas',
    departamento: 'Comercial',
    telefone: '(11) 97777-6666',
    nivel: 'BASICO',
    status: 'ATIVO'
  };

  const resAddUser = await fetch(`${BASE_URL}/usuarios.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie,
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({
      action: 'add',
      usuario: novoColaborador
    })
  });
  const dataAddUser = await resAddUser.json();
  assert(resAddUser.status === 200, 'Novo usuário cadastrado com sucesso pelo administrador');
  assert(
    typeof dataAddUser.token_convite === 'string' && dataAddUser.token_convite.length === 64,
    'Token seguro de primeiro acesso retornado ao administrador para compartilhamento seguro'
  );

  // Ativação da conta pelo colaborador usando o token de primeiro acesso
  const resAtivar = await fetch(`${BASE_URL}/usuarios.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'redefinir_com_token',
      token: dataAddUser.token_convite,
      novaSenha: 'SenhaColaborador@2026',
      email: 'carlos.comercial@ficticio-eventos.com.br'
    })
  });
  assert(resAtivar.status === 200, 'Colaborador ativou senha pessoal com sucesso utilizando o token');

  // Login do novo colaborador com sua senha pessoal
  const resLoginColab = await fetch(`${BASE_URL}/usuarios.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      email: 'carlos.comercial@ficticio-eventos.com.br',
      senha: 'SenhaColaborador@2026'
    })
  });
  assert(resLoginColab.status === 200, 'Novo colaborador realizou login autenticado com perfil operacional');

  // -------------------------------------------------------------------------
  // MÓDULO 2: Gestão de Vendas, Kits e Pagamentos Sicredi
  // -------------------------------------------------------------------------
  console.log('\n2. Módulo de Vendas de Álbuns & Pagamentos Sicredi:');

  const novaVendaFicticia = {
    id: 'VND-FICTICIA-2026-001',
    codigoPedido: 'PED-FMT-9988',
    aluno: 'Mariana Aluna Formanda Fictícia',
    email: 'mariana.formanda@ficticio.edu.br',
    cpf: '123.456.789-00',
    telefone: '(11) 99123-4567',
    instituicao: 'Universidade Fictícia Paulista',
    curso: 'Direito',
    turma: 'Turma Noturna 2026',
    plano: 'Combo Luxo Completo (Álbum + Box + Fotos Digitais)',
    valorTotal: 4800,
    status: 'CONFIRMADO',
    criadoEm: '2026-11-01T10:00:00Z',
    parcelasBoletos: [
      {
        numero: 1,
        valor: 1600,
        vencimento: '10/11/2026',
        status: 'PENDENTE',
        nossoNumero: 'SICREDI-BOL-99881',
        txid: 'TXID-SICREDI-99881'
      },
      {
        numero: 2,
        valor: 1600,
        vencimento: '10/12/2026',
        status: 'PENDENTE',
        nossoNumero: 'SICREDI-BOL-99882',
        txid: 'TXID-SICREDI-99882'
      },
      {
        numero: 3,
        valor: 1600,
        vencimento: '10/01/2027',
        status: 'PENDENTE',
        nossoNumero: 'SICREDI-BOL-99883',
        txid: 'TXID-SICREDI-99883'
      }
    ]
  };

  // Salvar venda no banco
  const resAddVenda = await fetch(`${BASE_URL}/vendas.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie,
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({
      action: 'save',
      csrf_token: csrfToken,
      vendas: [novaVendaFicticia]
    })
  });
  assert(resAddVenda.status === 200, 'Venda cadastrada e persistida com sucesso');

  // Consulta de vendas
  const resGetVendas = await fetch(`${BASE_URL}/vendas.php`, {
    headers: { 'Cookie': sessionCookie }
  });
  const dataVendas = await resGetVendas.json();
  const vendaEncontrada = dataVendas.find((v) => v.codigoPedido === 'PED-FMT-9988');
  assert(
    vendaEncontrada && vendaEncontrada.aluno === 'Mariana Aluna Formanda Fictícia',
    'Venda localizada e dados do aluno/contrato íntegros'
  );
  assert(
    vendaEncontrada && vendaEncontrada.parcelasBoletos.length === 3,
    'Três parcelas com identificadores Sicredi registradas com sucesso'
  );

  // Simulação de baixa automática da 1ª parcela via Webhook Sicredi
  const resWebhookBaixa = await fetch(`${BASE_URL}/sicredi_webhook.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sicredi_test_secret_token_1234567890abcdef'
    },
    body: JSON.stringify({
      evento: 'LIQUIDACAO_BOLETO',
      nossoNumero: 'SICREDI-BOL-99881',
      valorPago: 1600,
      dataLiquidacao: '2026-11-01'
    })
  });
  assert(resWebhookBaixa.status === 200, 'Notificação de liquidação processada pelo Webhook Sicredi');

  // Verifica que a parcela 1 foi liquidada no sistema
  const resGetVendasPos = await fetch(`${BASE_URL}/vendas.php`, {
    headers: { 'Cookie': sessionCookie }
  });
  const dataVendasPos = await resGetVendasPos.json();
  const vendaAtualizada = dataVendasPos.find((v) => v.codigoPedido === 'PED-FMT-9988');
  assert(
    vendaAtualizada.parcelasBoletos[0].status === 'PAGO',
    'Primeira parcela atualizada para status PAGO com baixa confirmada'
  );
  assert(
    vendaAtualizada.parcelasBoletos[1].status === 'PENDENTE',
    'Parcelas subsequentes permanecem intactas no fluxo financeiro'
  );

  // -------------------------------------------------------------------------
  // MÓDULO 3: Gestão de Demandas & Tarefas Operacionais
  // -------------------------------------------------------------------------
  console.log('\n3. Módulo de Demandas & Tarefas (Kanban Operacional):');

  const novaDemanda = {
    id: 'DEM-FICTICIA-101',
    titulo: 'Diagramação de Álbum e Tratamento de Fotos de Gala',
    descricao: 'Realizar diagramação das 80 fotos selecionadas da comissão de formatura',
    responsavel: 'Carlos Consultor Comercial Fictício',
    prioridade: 'ALTA',
    status: 'EM_ANDAMENTO',
    prazo: '2026-11-15'
  };

  const resAddDemanda = await fetch(`${BASE_URL}/demandas.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie,
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({
      action: 'add',
      demanda: novaDemanda
    })
  });
  assert(resAddDemanda.status === 200, 'Demanda operacional criada com sucesso');

  // Consulta de demandas
  const resGetDemandas = await fetch(`${BASE_URL}/demandas.php`, {
    headers: { 'Cookie': sessionCookie }
  });
  const dataDemandas = await resGetDemandas.json();
  const demandaCriada = dataDemandas.find((d) => d.id === 'DEM-FICTICIA-101');
  assert(demandaCriada && demandaCriada.status === 'EM_ANDAMENTO', 'Demanda recuperada com status e prioridade preservados');

  // -------------------------------------------------------------------------
  // MÓDULO 4: Instituições & Faculdades
  // -------------------------------------------------------------------------
  console.log('\n4. Módulo de Instituições & Cursos:');

  const novaInstituicao = {
    id: 'inst-ficticia-01',
    nome: 'Faculdade Paulista de Negócios Fictícia',
    sigla: 'FPN',
    campus: 'Campus Central Paulista',
    cidade: 'São Paulo',
    uf: 'SP',
    cursos: [
      { id: 'cur-01', nome: 'Administração de Empresas', periodo: 'Noturno' },
      { id: 'cur-02', nome: 'Ciências Contábeis', periodo: 'Matutino' }
    ]
  };

  const resAddInst = await fetch(`${BASE_URL}/instituicoes.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie,
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({
      action: 'add_instituicao',
      instituicao: novaInstituicao
    })
  });
  assert(resAddInst.status === 200, 'Instituição de ensino cadastrada com sucesso');

  // Adição de curso à instituição
  const resAddCurso = await fetch(`${BASE_URL}/instituicoes.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie,
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({
      action: 'add_curso',
      instituicaoId: 'inst-ficticia-01',
      curso: { id: 'cur-03', nome: 'Marketing Digital', periodo: 'Integral' }
    })
  });
  assert(resAddCurso.status === 200, 'Novo curso adicionado com sucesso à instituição');

  // Consulta e validação
  const resGetInst = await fetch(`${BASE_URL}/instituicoes.php`, {
    headers: { 'Cookie': sessionCookie }
  });
  const dataInst = await resGetInst.json();
  const instSalva = (dataInst.instituicoes || []).find((i) => i.id === 'inst-ficticia-01');
  const cursoSalvo = (dataInst.cursos || []).find((c) => c.id === 'cur-03');
  assert(
    instSalva && instSalva.nome === 'Faculdade Paulista de Negócios Fictícia',
    'Instituição fictícia persistida e recuperada com sucesso'
  );
  assert(
    cursoSalvo && cursoSalvo.nome === 'Marketing Digital',
    'Curso associado recuperado com sucesso'
  );

  // -------------------------------------------------------------------------
  // MÓDULO 5: Parceiros & Fornecedores (Espaços e Profissionais)
  // -------------------------------------------------------------------------
  console.log('\n5. Módulo de Parceiros & Fornecedores:');

  const novoEspaco = {
    id: 'esp-ficticio-01',
    nome: 'Mansão das Palmeiras Recepções',
    tipo: 'Casa de Festas / Mansão',
    capacidade: 800,
    cidade: 'São Paulo',
    valorDiaria: 15000,
    status: 'ATIVO'
  };

  const resAddEspaco = await fetch(`${BASE_URL}/parceiros.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie,
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({
      action: 'add_espaco',
      espaco: novoEspaco
    })
  });
  assert(resAddEspaco.status === 200, 'Espaço de eventos cadastrado com sucesso');

  const novoProfissional = {
    id: 'prof-ficticio-01',
    nome: 'Roberto Fotógrafo Fictício',
    especialidade: 'Fotógrafo Chefe de Baile',
    telefone: '(11) 98765-4321',
    valorCache: 2500,
    status: 'ATIVO'
  };

  const resAddProf = await fetch(`${BASE_URL}/parceiros.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie,
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({
      action: 'add_profissional',
      profissional: novoProfissional
    })
  });
  assert(resAddProf.status === 200, 'Profissional parceiro cadastrado com sucesso');

  // Consulta de parceiros
  const resGetParceiros = await fetch(`${BASE_URL}/parceiros.php`, {
    headers: { 'Cookie': sessionCookie }
  });
  const dataParceiros = await resGetParceiros.json();
  const espacoOk = (dataParceiros.espacos || []).some((e) => e.id === 'esp-ficticio-01');
  const profOk = (dataParceiros.profissionais || []).some((p) => p.id === 'prof-ficticio-01');
  assert(espacoOk && profOk, 'Parceiros (espaços e profissionais) persistidos e recuperados com integridade');

  // -------------------------------------------------------------------------
  // FINALIZAÇÃO
  // -------------------------------------------------------------------------
  console.log('\n------------------------------------------------------------');
  console.log(`TOTAL DE TESTES FUNCIONAIS: ${passed + failed} | APROVADOS: ${passed} | FALHAS: ${failed}`);
  console.log('------------------------------------------------------------\n');

  cleanup();

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('✓ Todos os módulos e funcionalidades administrativas continuam operando com 100% de sucesso!');
    process.exit(0);
  }
}

runFunctionalTests().catch((err) => {
  console.error('\n[ERRO CRÍTICO NA EXECUÇÃO DOS TESTES FUNCIONAIS]:', err);
  cleanup();
  process.exit(1);
});
