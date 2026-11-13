// Importador Inteligente de Planilhas de Vendas de Álbuns (.xlsx / .xls / .csv)
// Compatível com múltiplos formatos (Círculo Militar, Planilha Clientes, Padrão ON Eventos)

import * as XLSX from 'xlsx';

export interface VendaAlbumImportada {
  id: string;
  codigoPedido: string;
  dataVenda: string;
  alunoNome: string;
  alunoCpf: string;
  alunoTelefone: string;
  alunoEmail: string;
  instituicaoNome?: string;
  periodo?: string;
  turmaNome: string;
  modeloAlbum: 'Album premium' | 'Album Preto' | 'Album Slim' | 'Album Colégio';
  valorAlbum: number;
  brindes?: Array<{
    id: string;
    nome: string;
    descricao: string;
    selecionado: boolean;
    valorAdicional: number;
  }>;
  valorTotalBrindes: number;
  valorTotalKit: number;
  formaPagamento: 'CARTAO' | 'BOLETO' | 'A_VISTA' | 'PIX' | 'DINHEIRO' | 'COMBINADO';
  boletoQtdParcelas?: number;
  parcelasBoletos?: Array<{
    numero: number;
    vencimento: string;
    valor: number;
    status: 'PENDENTE' | 'PAGO' | 'VENCIDO';
  }>;
  statusProducao: 'EM_DIAGRAMACAO' | 'APROVACAO_CLIENTE' | 'EM_GRAFICA' | 'PRONTO_ENTREGA' | 'ENTREGUE';
  observacoes?: string;
  responsavelNome?: string;
  responsavelEmail?: string;
  prazoLayout?: string;
  prazoProducao?: string;
}

export function formatarTelefoneBR(telRaw: any): string {
  if (!telRaw) return '(11) 99999-9999';
  const digits = String(telRaw).replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  } else if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return String(telRaw);
}

export function formatarDataExcel(serial: any): string {
  if (!serial) return new Date().toLocaleDateString('pt-BR');
  if (typeof serial === 'number') {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    const d = String(date_info.getDate()).padStart(2, '0');
    const m = String(date_info.getMonth() + 1).padStart(2, '0');
    const y = date_info.getFullYear();
    return `${d}/${m}/${y}`;
  }
  return String(serial);
}

export async function processarArquivoVendasXlsx(file: File): Promise<VendaAlbumImportada[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          resolve([]);
          return;
        }

        const wb = XLSX.read(data, { type: 'binary' });
        const sheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        if (!rows || rows.length === 0) {
          resolve([]);
          return;
        }

        const hoje = new Date().toLocaleDateString('pt-BR');
        const listaConvertida: VendaAlbumImportada[] = [];

        rows.forEach((r, index) => {
          // Extrai chaves normalizadas
          const getVal = (...keys: string[]): any => {
            for (const k of Object.keys(r)) {
              const kNorm = k.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
              for (const search of keys) {
                const sNorm = search.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                if (kNorm === sNorm || kNorm.includes(sNorm)) {
                  const val = r[k];
                  if (val !== undefined && val !== null && String(val).trim() !== '') {
                    return val;
                  }
                }
              }
            }
            return undefined;
          };

          const nome = (getVal('cliente', 'nome', 'alunonome', 'formando', 'aluno') || '').toString().trim();
          if (!nome || nome.toLowerCase().includes('total') || nome.toLowerCase().includes('relatorio')) {
            return; // Ignora cabeçalhos ou rodapés vazios
          }

          const codRaw = getVal('cod. cliente', 'cod cliente', 'codigo', 'cod', 'id', 'pedido') || (index + 90);
          const codFormatado = String(codRaw).padStart(3, '0');
          const codigoPedido = `ALB-2026-${codFormatado}`;
          
          const rawData = getVal('data/hora', 'data', 'data venda', 'datavenda', 'emissao');
          const dataVenda = formatarDataExcel(rawData) || hoje;

          const telefone = formatarTelefoneBR(getVal('telefone', 'celular', 'tel', 'whatsapp', 'contato'));
          const email = (getVal('e-mail', 'email', 'correio') || '').toString().trim().toLowerCase();
          const cpf = (getVal('cpf', 'documento') || '000.000.000-00').toString().trim();

          const instRaw = (getVal('instituicao', 'faculdade', 'escola', 'colegio', 'local') || 'Círculo Militar').toString().trim();
          const descTurma = (getVal('descricao', 'turma', 'evento', 'curso') || 'Baile Unificados 2025.2').toString().trim();
          const periodo = descTurma.includes('2025.2') ? '2025.2' : descTurma.includes('2026.1') ? '2026.1' : '2026.2';
          const turmaNome = `${descTurma} - ${instRaw} (${periodo})`;

          const valorRaw = parseFloat(String(getVal('valor', 'total', 'valortotalkit', 'preco') || '1500').replace(/[^0-9,.]/g, '').replace(',', '.')) || 1500;

          // Modelo do álbum
          const modeloRaw = (getVal('modelo', 'album', 'modeloalbum') || '').toString().toLowerCase();
          let modeloAlbum: VendaAlbumImportada['modeloAlbum'] = 'Album Slim';
          if (modeloRaw.includes('premium')) modeloAlbum = 'Album premium';
          else if (modeloRaw.includes('preto')) modeloAlbum = 'Album Preto';
          else if (modeloRaw.includes('colegio') || modeloRaw.includes('colegial')) modeloAlbum = 'Album Colégio';

          // Forma de pagamento
          const formaRaw = (getVal('pagamento', 'formapagamento', 'forma') || '').toString().toUpperCase();
          let formaPagamento: VendaAlbumImportada['formaPagamento'] = 'BOLETO';
          if (formaRaw.includes('PIX') || formaRaw.includes('VISTA')) formaPagamento = 'PIX';
          else if (formaRaw.includes('CARTAO')) formaPagamento = 'CARTAO';
          else if (formaRaw.includes('COMBINADO')) formaPagamento = 'COMBINADO';

          const endereco = getVal('endereco', 'localizacao', 'cidade');
          const observacoes = endereco ? `Local / Endereço: ${endereco}` : undefined;

          // Gerar parcelas se for boleto
          const parcelasCount = 10;
          const valorParcela = Math.round((valorRaw / parcelasCount) * 100) / 100;
          const parcelasBoletos = formaPagamento === 'BOLETO' ? Array.from({ length: parcelasCount }, (_, pIdx) => ({
            numero: pIdx + 1,
            vencimento: `15/${String((pIdx + 11) % 12 + 1).padStart(2, '0')}/${2026 + Math.floor((pIdx + 11) / 12)}`,
            valor: valorParcela,
            status: 'PENDENTE' as const
          })) : undefined;

          listaConvertida.push({
            id: `venda-import-${Date.now()}-${index}`,
            codigoPedido,
            dataVenda,
            alunoNome: nome,
            alunoCpf: cpf,
            alunoTelefone: telefone,
            alunoEmail: email,
            instituicaoNome: instRaw,
            periodo,
            turmaNome,
            modeloAlbum,
            valorAlbum: valorRaw,
            brindes: [
              { id: 'b1', nome: 'Quadro 30x60', descricao: 'Moldura solene', selecionado: false, valorAdicional: 0 },
              { id: 'b2', nome: 'Trio de quadros', descricao: 'Quadros 20x30', selecionado: false, valorAdicional: 0 },
              { id: 'b3', nome: 'Link de fotos', descricao: 'Galeria 4K vitalícia', selecionado: true, valorAdicional: 0 }
            ],
            valorTotalBrindes: 0,
            valorTotalKit: valorRaw,
            formaPagamento,
            boletoQtdParcelas: formaPagamento === 'BOLETO' ? parcelasCount : undefined,
            parcelasBoletos,
            statusProducao: 'EM_DIAGRAMACAO',
            observacoes,
            responsavelNome: 'Thiago Renê',
            responsavelEmail: 'thiagooriginal2002@gmail.com',
            prazoLayout: '2026-11-30',
            prazoProducao: '2026-11-30'
          });
        });

        resolve(listaConvertida);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error('Falha ao ler o arquivo selecionado.'));
    };

    reader.readAsBinaryString(file);
  });
}
