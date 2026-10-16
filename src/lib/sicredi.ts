/**
 * Módulo de Integração Bancária Sicredi (Banco 748)
 * Configuração Oficial para ON AGÊNCIA DE EVENTOS LTDA
 * Padrão Homologado CNAB 400 (Versão 2.00 - Maio/2022) & FEBRABAN
 */

export interface SicrediConfig {
  bancoCodigo: string;
  bancoNome: string;
  agencia: string;
  posto: string;
  convenio: string; // Código do Beneficiário / Cedente (5 dígitos)
  contaCorrente: string;
  contaNumero: string;
  contaDigito: string;
  razaoSocial: string;
  cnpj: string;
  cnpjNumeros: string;
  cooperativa: string;
  carteira: string;
}

export const SICREDI_CONFIG_OFICIAL: SicrediConfig = {
  bancoCodigo: '748',
  bancoNome: 'Banco Cooperativo Sicredi S.A.',
  agencia: '0726',
  posto: '86',
  convenio: '04220',
  contaCorrente: '26102-1',
  contaNumero: '26102',
  contaDigito: '1',
  razaoSocial: 'ON AGENCIA DE EVENTOS LTDA',
  cnpj: '30.988.070/0001-60',
  cnpjNumeros: '30988070000160',
  cooperativa: 'Sicredi Vale do Piquiri Abcd PR/SP - Palotina PR',
  carteira: '1', // 1 = Com Registro
};

export interface BoletoHomologacaoDados {
  numeroDocumento: string;
  nossoNumeroSequencial: number;
  valor: number;
  dataEmissao: string; // YYYY-MM-DD
  dataVencimento: string; // YYYY-MM-DD
  sacadoNome: string;
  sacadoCpfCnpj: string;
  sacadoEndereco: string;
  sacadoCidade: string;
  sacadoUf: string;
  sacadoCep: string;
  instrucoes?: string[];
}

/**
 * Calcula o Dígito Verificador no Módulo 11 (Pesos de 2 a 9) padrão Sicredi / FEBRABAN
 */
export function modulo11Sicredi(base: string): string {
  let soma = 0;
  let peso = 2;

  for (let i = base.length - 1; i >= 0; i--) {
    const num = parseInt(base.charAt(i), 10);
    soma += num * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }

  const resto = soma % 11;
  const subtracao = 11 - resto;

  if (subtracao === 10 || subtracao === 11) {
    return '0';
  }
  return subtracao.toString();
}

/**
 * Formata o Nosso Número Sicredi: AA/BXXXXX-D
 * AA = Ano (2 dígitos, ex: 26)
 * B = Byte de geração (2 a 9: 2 = gerado pelo beneficiário)
 * XXXXX = Sequencial (5 dígitos)
 * D = Dígito Verificador Módulo 11 de (Agência + Posto + Convênio + Ano + Byte + Sequencial)
 */
export function gerarNossoNumeroSicredi(
  config: SicrediConfig,
  ano: number,
  sequencial: number,
  byteGeracao: number = 2
): {
  nossoNumeroFormatado: string;
  nossoNumeroSemFormatacao: string;
  nossoNumeroExibicaoBoleto: string;
  dv: string;
} {
  const aa = String(ano).slice(-2);
  const b = String(byteGeracao);
  const xxxxx = String(sequencial).padStart(5, '0');

  // Base para cálculo do DV do Nosso Número Sicredi (Item 4.5 do manual):
  // Cooperativa/Agência (4) + Posto (2) + Beneficiário (5) + Ano (2) + Byte (1) + Sequencial (5)
  const baseCalculo = `${config.agencia.padStart(4, '0')}${config.posto.padStart(2, '0')}${config.convenio.padStart(5, '0')}${aa}${b}${xxxxx}`;
  const dv = modulo11Sicredi(baseCalculo);

  const formatado = `${aa}/${b}${xxxxx}-${dv}`;
  const semFormatacao = `${aa}${b}${xxxxx}${dv}`;
  const exibicao = `${aa}/${b}${xxxxx}-${dv}`;

  return {
    nossoNumeroFormatado: formatado,
    nossoNumeroSemFormatacao: semFormatacao,
    nossoNumeroExibicaoBoleto: exibicao,
    dv,
  };
}

/**
 * Calcula o Fator de Vencimento FEBRABAN
 * Atualizado conforme item 10.7 do manual Sicredi (ciclo 2025: 22/02/2025 = 1000)
 */
export function calcularFatorVencimento(dataVencimentoIso: string): string {
  const [ano, mes, dia] = dataVencimentoIso.split('-').map(Number);
  const dataVenc = new Date(ano, mes - 1, dia);

  // Ciclo 2 após 21/02/2025:
  const dataCiclo2 = new Date(2025, 1, 22); // 22/02/2025
  const diffDays = Math.round((dataVenc.getTime() - dataCiclo2.getTime()) / (1000 * 60 * 60 * 24));
  const fator = 1000 + diffDays;

  return String(fator).padStart(4, '0');
}

/**
 * Calcula o DV Módulo 10 para os campos 1, 2 e 3 da Linha Digitável
 * (Item 10.8.3 do manual)
 */
export function modulo10Sicredi(campo: string): string {
  let soma = 0;
  let peso = 2;

  for (let i = campo.length - 1; i >= 0; i--) {
    let mult = parseInt(campo.charAt(i), 10) * peso;
    if (mult > 9) {
      mult = Math.floor(mult / 10) + (mult % 10);
    }
    soma += mult;
    peso = peso === 2 ? 1 : 2;
  }

  const dezena = Math.ceil(soma / 10) * 10;
  const dv = dezena - soma;
  return String(dv === 10 ? 0 : dv);
}

/**
 * Gera Linha Digitável e Código de Barras no Padrão Oficial Sicredi
 * (Itens 10.1 a 10.9 do manual CNAB 400)
 */
export function gerarLinhaDigitavelECodigoBarrasSicredi(
  config: SicrediConfig,
  nossoNumeroSemDv: string, // 8 posições (AA + B + XXXXX)
  dvNossoNumero: string,    // 1 dígito
  valor: number,
  dataVencimentoIso: string
): {
  linhaDigitavel: string;
  codigoBarras: string;
  fatorVencimento: string;
  campoLivre: string;
  dvGeral: string;
} {
  const valorStr = Math.round(valor * 100)
    .toString()
    .padStart(10, '0');
  const fatorVenc = calcularFatorVencimento(dataVencimentoIso);

  // Composição do Campo Livre Sicredi (25 posições - Item 10.3 e 10.4):
  // 01: Tipo de cobrança = '1' (Com registro)
  // 01: Tipo de carteira = '1' (Simples)
  // 09: Nosso Número com DV (AA + B + XXXXX + D)
  // 04: Agência / Cooperativa (0726)
  // 02: Posto (86)
  // 05: Código do Beneficiário (04220)
  // 01: '1' se houver valor, '0' se zerado
  // 01: '0' (filler)
  // 01: DV do Campo Livre (Módulo 11)
  const nossoNum9 = `${nossoNumeroSemDv}${dvNossoNumero}`;
  const baseCampoLivre24 = `11${nossoNum9}${config.agencia.padStart(4, '0')}${config.posto.padStart(2, '0')}${config.convenio.padStart(5, '0')}10`;
  const dvCampoLivre = modulo11Sicredi(baseCampoLivre24);
  const campoLivre25 = `${baseCampoLivre24}${dvCampoLivre}`;

  // Composição do Código de Barras (44 posições - Item 10.2 e 10.5):
  // 01 a 03: Banco (748)
  // 04 a 04: Moeda (9 = Real)
  // 05 a 05: DV Geral do Código de Barras
  // 06 a 09: Fator de Vencimento (4)
  // 10 a 19: Valor Nominal (10)
  // 20 a 44: Campo Livre (25)
  const baseCodBarrasSemDv = `${config.bancoCodigo}9${fatorVenc}${valorStr}${campoLivre25}`;

  // Cálculo do DV Geral (Item 10.5):
  let soma = 0;
  let peso = 2;
  for (let i = baseCodBarrasSemDv.length - 1; i >= 0; i--) {
    soma += parseInt(baseCodBarrasSemDv.charAt(i), 10) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  const resto = soma % 11;
  let dvGeral = 11 - resto;
  if (dvGeral === 0 || dvGeral === 1 || dvGeral > 9) {
    dvGeral = 1;
  }
  const dvGeralStr = String(dvGeral);

  const codigoBarras = `${config.bancoCodigo}9${dvGeralStr}${fatorVenc}${valorStr}${campoLivre25}`;

  // Composição da Linha Digitável (47 posições formatadas - Item 10.8 e 10.9):
  // Campo 1: 7489 + campoLivre[0..4] (5 posições) + DV (Módulo 10)
  const parte1 = `${config.bancoCodigo}9${campoLivre25.slice(0, 5)}`;
  const dv1 = modulo10Sicredi(parte1);
  const campo1Formatado = `${parte1.slice(0, 5)}.${parte1.slice(5)}${dv1}`;

  // Campo 2: campoLivre[5..14] (10 posições) + DV (Módulo 10)
  const parte2 = campoLivre25.slice(5, 15);
  const dv2 = modulo10Sicredi(parte2);
  const campo2Formatado = `${parte2.slice(0, 5)}.${parte2.slice(5)}${dv2}`;

  // Campo 3: campoLivre[15..24] (10 posições) + DV (Módulo 10)
  const parte3 = campoLivre25.slice(15, 25);
  const dv3 = modulo10Sicredi(parte3);
  const campo3Formatado = `${parte3.slice(0, 5)}.${parte3.slice(5)}${dv3}`;

  // Campo 4: DV Geral do Código de Barras (1)
  const campo4Formatado = dvGeralStr;

  // Campo 5: Fator Vencimento (4) + Valor Nominal (10)
  const campo5Formatado = `${fatorVenc}${valorStr}`;

  const linhaDigitavel = `${campo1Formatado} ${campo2Formatado} ${campo3Formatado} ${campo4Formatado} ${campo5Formatado}`;

  return {
    linhaDigitavel,
    codigoBarras,
    fatorVencimento: fatorVenc,
    campoLivre: campoLivre25,
    dvGeral: dvGeralStr,
  };
}

/**
 * Gera o Nome Oficial do Arquivo de Remessa Sicredi
 * Nomenclatura oficial (Item 6.1 do manual): CCCCCMDD.XXX
 * CCCCC = Código Beneficiário (5 dígitos): 04220
 * M = Código do Mês: 1-9 (Jan-Set), O (Outubro), N (Novembro), D (Dezembro)
 * DD = Dia do Mês (2 dígitos, ex: 16)
 * Extensão: .REM ou .CRM ou .001
 */
export function gerarNomeArquivoRemessaSicredi(
  convenio: string = '04220',
  data: Date = new Date(),
  extensao: string = 'CRM'
): string {
  const ccccc = convenio.padStart(5, '0');
  const mesIndex = data.getMonth() + 1;
  const mesesCod: Record<number, string> = {
    1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6',
    7: '7', 8: '8', 9: '9', 10: 'O', 11: 'N', 12: 'D',
  };
  const m = mesesCod[mesIndex] || 'O';
  const dd = String(data.getDate()).padStart(2, '0');

  return `${ccccc}${m}${dd}.${extensao.toUpperCase()}`;
}

const STORAGE_KEY_SEQUENCIAL = 'on_sicredi_remessa_sequencial_v1';
export const SEQUENCIAL_OFICIAL_INICIAL = 123; // Determinado oficialmente pelo Sicredi na homologação

export function obterProximoSequencialRemessa(): number {
  if (typeof window === 'undefined') return SEQUENCIAL_OFICIAL_INICIAL;
  try {
    const salvo = localStorage.getItem(STORAGE_KEY_SEQUENCIAL);
    if (salvo) {
      const num = parseInt(salvo, 10);
      if (!isNaN(num) && num >= SEQUENCIAL_OFICIAL_INICIAL) {
        return num;
      }
    }
    localStorage.setItem(STORAGE_KEY_SEQUENCIAL, String(SEQUENCIAL_OFICIAL_INICIAL));
    return SEQUENCIAL_OFICIAL_INICIAL;
  } catch (e) {
    return SEQUENCIAL_OFICIAL_INICIAL;
  }
}

export function incrementarSequencialRemessa(): number {
  if (typeof window === 'undefined') return SEQUENCIAL_OFICIAL_INICIAL + 1;
  try {
    const atual = obterProximoSequencialRemessa();
    const proximo = atual + 1;
    localStorage.setItem(STORAGE_KEY_SEQUENCIAL, String(proximo));
    return proximo;
  } catch (e) {
    return SEQUENCIAL_OFICIAL_INICIAL + 1;
  }
}

/**
 * Gera o Arquivo de Remessa CNAB 400 Padrão Oficial Sicredi
 * (Capítulo 8 do manual - Versão 2.00)
 * Linhas de exatamente 400 caracteres cada, com terminação CRLF.
 */
export function gerarRemessaCnab400Oficial(
  config: SicrediConfig,
  boletos: BoletoHomologacaoDados[],
  numeroRemessa: number = 1
): string {
  const padEspacos = (texto: string, tamanho: number) => {
    return (texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .padEnd(tamanho, ' ')
      .slice(0, tamanho);
  };

  const padZeros = (num: number | string, tamanho: number) => {
    return String(num || 0).replace(/\D/g, '').padStart(tamanho, '0').slice(0, tamanho);
  };

  const hoje = new Date();
  const ddmmaaHoje = `${padZeros(hoje.getDate(), 2)}${padZeros(hoje.getMonth() + 1, 2)}${String(hoje.getFullYear()).slice(-2)}`;
  const aaaammddHoje = `${hoje.getFullYear()}${padZeros(hoje.getMonth() + 1, 2)}${padZeros(hoje.getDate(), 2)}`;

  const linhas: string[] = [];

  // ==========================================
  // REGISTRO HEADER (Tipo 0) - Item 8.1
  // ==========================================
  let header = '';
  header += '0';                          // 001-001 (1): Identificação do Registro Header
  header += '1';                          // 002-002 (1): Identificação do Arquivo Remessa
  header += 'REMESSA';                    // 003-009 (7): Literal Remessa
  header += '01';                         // 010-011 (2): Código do serviço de cobrança
  header += padEspacos('COBRANCA', 8);    // 012-019 (8): Literal Cobrança
  header += padEspacos('', 7);            // 020-026 (7): Filler (brancos)
  header += padZeros(config.convenio, 5); // 027-031 (5): Código do Beneficiário
  header += padZeros(config.cnpjNumeros, 14); // 032-045 (14): CPF/CNPJ do Beneficiário
  header += padEspacos('', 31);           // 046-076 (31): Filler (brancos)
  header += '748';                        // 077-079 (3): Código do Banco Sicredi
  header += padEspacos('SICREDI', 15);    // 080-094 (15): Literal Sicredi
  header += aaaammddHoje;                 // 095-102 (8): Data de geração AAAAMMDD
  header += padEspacos('', 8);            // 103-110 (8): Filler (brancos)
  header += padZeros(numeroRemessa, 7);   // 111-117 (7): Número sequencial da remessa
  header += padEspacos('', 273);          // 118-390 (273): Filler (brancos)
  header += '2.00';                       // 391-394 (4): Versão do sistema (com ponto)
  header += '000001';                     // 395-400 (6): Sequencial do registro

  linhas.push(header);

  // ==========================================
  // REGISTRO DETALHE (Tipo 1) - Item 8.2
  // ==========================================
  let seqRegistro = 2;

  boletos.forEach((b) => {
    const anoAtual = parseInt(String(hoje.getFullYear()).slice(-2), 10);
    const nn = gerarNossoNumeroSicredi(config, anoAtual, b.nossoNumeroSequencial);

    const [vAno, vMes, vDia] = b.dataVencimento.split('-');
    const ddmmaaVenc = `${vDia}${vMes}${vAno.slice(-2)}`;

    const [eAno, eMes, eDia] = b.dataEmissao.split('-');
    const ddmmaaEmissao = `${eDia}${eMes}${eAno.slice(-2)}`;

    const valorCentavos = Math.round(b.valor * 100);
    const cpfCnpjLimpo = b.sacadoCpfCnpj.replace(/\D/g, '');
    const tipoInscricao = cpfCnpjLimpo.length > 11 ? '2' : '1';

    let detalhe = '';
    detalhe += '1';                              // 001-001 (1): Registro Detalhe
    detalhe += 'A';                              // 002-002 (1): Tipo de Cobrança (A = Com Registro)
    detalhe += 'A';                              // 003-003 (1): Tipo de Carteira (A = Simples)
    detalhe += 'A';                              // 004-004 (1): Tipo de Impressão (A = Normal)
    detalhe += ' ';                              // 005-005 (1): Filler
    detalhe += ' ';                              // 006-006 (1): Tipo de Boleto (branco = tradicional)
    detalhe += padEspacos('', 10);               // 007-016 (10): Filler
    detalhe += 'A';                              // 017-017 (1): Moeda (A = Real)
    detalhe += 'A';                              // 018-018 (1): Desconto (A = Valor monetário)
    detalhe += 'A';                              // 019-019 (1): Juros (A = Valor monetário)
    detalhe += padEspacos('', 28);               // 020-047 (28): Filler
    detalhe += padZeros(nn.nossoNumeroSemFormatacao, 9); // 048-056 (9): Nosso Número (AA + B + XXXXX + D)
    detalhe += padEspacos('', 6);                // 057-062 (6): Filler
    detalhe += aaaammddHoje;                     // 063-070 (8): Data de Instrução AAAAMMDD
    detalhe += ' ';                              // 071-071 (1): Campo alterado instrução 31
    detalhe += 'N';                              // 072-072 (1): Postagem pelo beneficiário
    detalhe += ' ';                              // 073-073 (1): Filler
    detalhe += 'B';                              // 074-074 (1): Impressão realizada pelo Beneficiário
    detalhe += '00';                             // 075-076 (2): Número da parcela carnê
    detalhe += '00';                             // 077-078 (2): Total parcelas carnê
    detalhe += padEspacos('', 4);                // 079-082 (4): Filler
    detalhe += padZeros(0, 10);                  // 083-092 (10): Desconto antecipação
    detalhe += padZeros(200, 4);                 // 093-096 (4): % Multa (0200 = 2,00%)
    detalhe += padEspacos('', 12);               // 097-108 (12): Filler
    detalhe += '01';                             // 109-110 (2): Instrução (01 = Cadastro de Título)
    detalhe += padEspacos(b.numeroDocumento, 10);// 111-120 (10): Seu Número (sem espaço em branco)
    detalhe += ddmmaaVenc;                       // 121-126 (6): Vencimento DDMMAA (>= 7 dias após emissão)
    detalhe += padZeros(valorCentavos, 13);      // 127-139 (13): Valor do Título
    detalhe += padEspacos('', 2);                // 140-141 (2): Filler
    detalhe += padEspacos('', 7);                // 142-148 (7): Filler
    detalhe += 'A';                              // 149-149 (1): Espécie do Título (A = DMI)
    detalhe += 'N';                              // 150-150 (1): Aceite (N = Não)
    detalhe += ddmmaaEmissao;                    // 151-156 (6): Emissão DDMMAA
    detalhe += '00';                             // 157-158 (2): Protesto automático (00 = Não protestar)
    detalhe += '00';                             // 159-160 (2): Dias protesto
    detalhe += padZeros(0, 13);                  // 161-173 (13): Juros mora
    detalhe += padZeros(0, 6);                   // 174-179 (6): Data limite desconto
    detalhe += padZeros(0, 13);                  // 180-192 (13): Desconto
    detalhe += '00';                             // 193-194 (2): Negativação automática (00 = Não negativar)
    detalhe += '00';                             // 195-196 (2): Dias negativação
    detalhe += padZeros(0, 9);                   // 197-205 (9): Filler zeros
    detalhe += padZeros(0, 13);                  // 206-218 (13): Valor abatimento
    detalhe += tipoInscricao;                    // 219-219 (1): Inscrição pagador (1=CPF, 2=CNPJ)
    detalhe += '0';                              // 220-220 (1): Filler zero
    detalhe += padZeros(cpfCnpjLimpo, 14);       // 221-234 (14): CPF/CNPJ pagador
    detalhe += padEspacos(b.sacadoNome, 40);     // 235-274 (40): Nome do pagador
    detalhe += padEspacos(b.sacadoEndereco, 40); // 275-314 (40): Endereço do pagador
    detalhe += padZeros(0, 5);                   // 315-319 (5): Código pagador cooperativa
    detalhe += padZeros(0, 6);                   // 320-325 (6): Filler zeros
    detalhe += ' ';                              // 326-326 (1): Filler branco
    detalhe += padZeros(b.sacadoCep, 8);         // 327-334 (8): CEP pagador
    detalhe += padZeros(0, 5);                   // 335-339 (5): Código pagador junto ao cliente
    detalhe += padEspacos('', 14);               // 340-353 (14): CPF/CNPJ Beneficiário Final
    detalhe += padEspacos('', 41);               // 354-394 (41): Nome Beneficiário Final
    detalhe += padZeros(seqRegistro, 6);         // 395-400 (6): Sequencial registro

    linhas.push(detalhe);
    seqRegistro++;
  });

  // ==========================================
  // REGISTRO TRAILER (Tipo 9) - Item 8.8
  // ==========================================
  let trailer = '';
  trailer += '9';                          // 001-001 (1): Identificação Trailer
  trailer += '1';                          // 002-002 (1): Remessa ('1')
  trailer += '748';                        // 003-005 (3): Código Sicredi
  trailer += padZeros(config.convenio, 5); // 006-010 (5): Código do Beneficiário
  trailer += padEspacos('', 384);          // 011-394 (384): Filler
  trailer += padZeros(seqRegistro, 6);      // 395-400 (6): Sequencial registro

  linhas.push(trailer);

  return linhas.join('\r\n') + '\r\n';
}

/**
 * Dados Padrão para Boleto de Homologação Sicredi
 */
export const BOLETO_HOMOLOGACAO_PADRAO: BoletoHomologacaoDados = {
  numeroDocumento: 'HOMOLOG01',
  nossoNumeroSequencial: 1,
  valor: 50.00,
  dataEmissao: '2026-10-16',
  dataVencimento: '2026-10-31', // 15 dias após emissão (> 7 dias exigidos pelo manual)
  sacadoNome: 'ALUNO TESTE HOMOLOGACAO SICREDI',
  sacadoCpfCnpj: '297.073.600-46', // CPF formatado de teste
  sacadoEndereco: 'AVENIDA PAULISTA, 1000 - BELA VISTA',
  sacadoCidade: 'SAO PAULO',
  sacadoUf: 'SP',
  sacadoCep: '01310-100',
  instrucoes: [
    'PAGÁVEL PREFERENCIALMENTE NAS COOP. DE CRÉDITO DO SICREDI OU EM CANAIS ELETRÔNICOS',
    'APÓS O VENCIMENTO COBRAR MULTA DE 2,00% E JUROS DE MORA DE R$ 0,05 AO DIA',
    'TÍTULO EMITIDO PARA FINS DE HOMOLOGAÇÃO DE SISTEMA DE COBRANÇA',
    'NÃO RECEBER APÓS 30 DIAS DO VENCIMENTO',
  ],
};

/**
 * Gera as barras em formato SVG (Interleaved 2 of 5 - I25) com proporção 3:1
 * Conforme itens 10.1, 10.2 e 10.6 do manual Sicredi
 */
export function gerarSvgCodigoBarrasI25(codigo44Digitos: string): string {
  const I25_TABELA: Record<string, string> = {
    '0': '00110',
    '1': '10001',
    '2': '01001',
    '3': '11000',
    '4': '00101',
    '5': '10100',
    '6': '01100',
    '7': '00011',
    '8': '10010',
    '9': '01010',
  };

  const W_FINA = 1.3;
  const W_LARGA = 3.9;
  const ALTURA = 52;

  let elementosSvg = '';
  let posX = 0;

  // Início (Start Pattern): Barra estreita, espaço estreito, barra estreita, espaço estreito
  elementosSvg += `<rect x="${posX}" y="0" width="${W_FINA}" height="${ALTURA}" fill="black" />`;
  posX += W_FINA;
  posX += W_FINA; // espaço
  elementosSvg += `<rect x="${posX}" y="0" width="${W_FINA}" height="${ALTURA}" fill="black" />`;
  posX += W_FINA;
  posX += W_FINA; // espaço

  // Pares intercalados de 2 em 2 dígitos (44 dígitos = 22 pares)
  for (let i = 0; i < codigo44Digitos.length; i += 2) {
    const d1 = codigo44Digitos.charAt(i);
    const d2 = codigo44Digitos.charAt(i + 1);

    const b1 = I25_TABELA[d1] || '00110';
    const b2 = I25_TABELA[d2] || '00110';

    for (let bit = 0; bit < 5; bit++) {
      // Barra
      const larguraBarra = b1[bit] === '1' ? W_LARGA : W_FINA;
      elementosSvg += `<rect x="${posX}" y="0" width="${larguraBarra}" height="${ALTURA}" fill="black" />`;
      posX += larguraBarra;

      // Espaço
      const larguraEspaco = b2[bit] === '1' ? W_LARGA : W_FINA;
      posX += larguraEspaco;
    }
  }

  // Fim (Stop Pattern): Barra larga, espaço estreito, barra estreita
  elementosSvg += `<rect x="${posX}" y="0" width="${W_LARGA}" height="${ALTURA}" fill="black" />`;
  posX += W_LARGA;
  posX += W_FINA; // espaço
  elementosSvg += `<rect x="${posX}" y="0" width="${W_FINA}" height="${ALTURA}" fill="black" />`;
  posX += W_FINA;

  const larguraTotal = Math.ceil(posX);

  return `<svg viewBox="0 0 ${larguraTotal} ${ALTURA}" width="100%" height="${ALTURA}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">${elementosSvg}</svg>`;
}

export interface BoletoRetornoSicrediItem {
  nossoNumero: string;
  seuNumero: string;
  codigoOcorrencia: string;
  descricaoOcorrencia: string;
  dataOcorrencia: string; // DD/MM/AAAA
  dataVencimento: string; // DD/MM/AAAA
  valorTitulo: number;
  valorPago: number;
  juros: number;
  multa: number;
  desconto: number;
  tarifa: number;
  dataCredito: string;
  isLiquidado: boolean;
}

export interface RetornoSicrediResultado {
  cedente: string;
  dataGravacao: string;
  numeroRetorno: string;
  totalTitulos: number;
  totalLiquidados: number;
  valorTotalLiquidado: number;
  itens: BoletoRetornoSicrediItem[];
}

export const OCORRENCIAS_SICREDI: Record<string, string> = {
  '02': 'Entrada Confirmada no Banco',
  '03': 'Entrada Rejeitada',
  '06': 'Liquidação Normal (Título Pago)',
  '07': 'Intenção de Pagamento',
  '09': 'Baixado Automaticamente',
  '10': 'Baixado Conforme Instruções',
  '12': 'Abatimento Concedido',
  '13': 'Abatimento Cancelado',
  '14': 'Vencimento Alterado',
  '15': 'Liquidação em Cartório',
  '17': 'Liquidação Após Baixa',
  '19': 'Recebimento de Instrução de Protesto',
  '20': 'Recebimento de Sustação de Protesto',
  '23': 'Entrada de Título em Cartório',
  '24': 'Entrada Rejeitada por CEP Irregular',
  '27': 'Baixa Rejeitada',
  '28': 'Débito de Tarifas / Custas',
  '30': 'Alteração Rejeitada',
  '32': 'Instrução Rejeitada',
  '33': 'Confirmação de Alteração de Outros Dados',
  '61': 'Liquidação via PIX',
  'PX': 'Liquidação via QR Code PIX',
};

/**
 * Processa o arquivo de retorno CNAB 400 (.CRT / .RET) do Sicredi
 * Identifica títulos pagos e liquidados para baixa automática no sistema
 */
export function processarArquivoRetornoSicredi(conteudoTexto: string): RetornoSicrediResultado {
  const linhas = conteudoTexto.split(/\r?\n/).filter((l) => l.trim().length >= 400);

  let cedente = '04220';
  let dataGravacao = '';
  let numeroRetorno = '';
  const itens: BoletoRetornoSicrediItem[] = [];

  linhas.forEach((linha) => {
    const tipoRegistro = linha.charAt(0);

    // Header (Tipo 0)
    if (tipoRegistro === '0') {
      cedente = linha.slice(26, 31).trim();
      const rawData = linha.slice(94, 102); // AAAAMMDD
      if (rawData.length === 8) {
        dataGravacao = `${rawData.slice(6, 8)}/${rawData.slice(4, 6)}/${rawData.slice(0, 4)}`;
      }
      numeroRetorno = linha.slice(110, 117).trim();
    }

    // Detalhe (Tipo 1)
    if (tipoRegistro === '1') {
      const nossoNumero = linha.slice(47, 62).trim();
      const codigoOcorrencia = linha.slice(108, 110).trim();
      const rawDataOcorrencia = linha.slice(110, 116); // DDMMAA
      const seuNumero = linha.slice(116, 126).trim();
      const rawVenc = linha.slice(146, 152); // DDMMAA
      const valorTitulo = parseInt(linha.slice(152, 165), 10) / 100 || 0;
      const tarifa = parseInt(linha.slice(175, 188), 10) / 100 || 0;
      const desconto = parseInt(linha.slice(240, 253), 10) / 100 || 0;
      const valorPago = parseInt(linha.slice(253, 266), 10) / 100 || 0;
      const juros = parseInt(linha.slice(266, 279), 10) / 100 || 0;
      const multa = parseInt(linha.slice(279, 292), 10) / 100 || 0;
      const rawDataCredito = linha.slice(328, 336); // AAAAMMDD

      const dOcorrencia =
        rawDataOcorrencia.length === 6
          ? `${rawDataOcorrencia.slice(0, 2)}/${rawDataOcorrencia.slice(2, 4)}/20${rawDataOcorrencia.slice(4, 6)}`
          : '';

      const dVenc =
        rawVenc.length === 6
          ? `${rawVenc.slice(0, 2)}/${rawVenc.slice(2, 4)}/20${rawVenc.slice(4, 6)}`
          : '';

      const dCredito =
        rawDataCredito.length === 8
          ? `${rawDataCredito.slice(6, 8)}/${rawDataCredito.slice(4, 6)}/${rawDataCredito.slice(0, 4)}`
          : '';

      const isLiquidado =
        codigoOcorrencia === '06' ||
        codigoOcorrencia === '15' ||
        codigoOcorrencia === '17' ||
        codigoOcorrencia === '61' ||
        codigoOcorrencia === 'PX';

      itens.push({
        nossoNumero,
        seuNumero,
        codigoOcorrencia,
        descricaoOcorrencia: OCORRENCIAS_SICREDI[codigoOcorrencia] || `Ocorrência ${codigoOcorrencia}`,
        dataOcorrencia: dOcorrencia,
        dataVencimento: dVenc,
        valorTitulo,
        valorPago: valorPago > 0 ? valorPago : valorTitulo,
        juros,
        multa,
        desconto,
        tarifa,
        dataCredito: dCredito,
        isLiquidado,
      });
    }
  });

  const liquidados = itens.filter((i) => i.isLiquidado);
  const valorTotalLiquidado = liquidados.reduce((acc, i) => acc + i.valorPago, 0);

  return {
    cedente,
    dataGravacao,
    numeroRetorno,
    totalTitulos: itens.length,
    totalLiquidados: liquidados.length,
    valorTotalLiquidado,
    itens,
  };
}

