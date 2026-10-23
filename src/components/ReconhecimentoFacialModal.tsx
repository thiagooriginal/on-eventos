'use strict';
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Camera,
  Upload,
  UserCheck,
  CheckCircle2,
  X,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Layers,
  Download,
  Eye,
  ShieldCheck,
  Check,
  ChevronRight,
  Info,
  ExternalLink,
  Cpu
} from 'lucide-react';

interface FotoItem {
  id: string;
  file: File;
  preview: string;
  nome: string;
  tamanho: number;
  status: 'pendente' | 'processando' | 'encontrado' | 'nao_encontrado' | 'erro';
  similaridade?: number;
  erro?: string;
}

interface ConfigAws {
  configurado: boolean;
  ativo: boolean;
  aws_access_key_id_mascarada: string;
  aws_region: string;
  limiar_similaridade: number;
}

interface Props {
  aberto: boolean;
  onFechar: () => void;
  alunosCadastrados?: Array<{ nome: string; cpf?: string; fotoUrl?: string }>;
}

export default function ReconhecimentoFacialModal({ aberto, onFechar, alunosCadastrados = [] }: Props) {
  // Aba ativa: 'ANALISE' ou 'CONFIG'
  const [abaAtiva, setAbaAtiva] = useState<'ANALISE' | 'CONFIG'>('ANALISE');

  // Motor de IA: 'LOCAL' (Navegador / 100% Grátis sem Cartão) ou 'AWS' (Nuvem Rekognition)
  const [motorIa, setMotorIa] = useState<'LOCAL' | 'AWS'>('LOCAL');
  const [modelosCarregados, setModelosCarregados] = useState(false);
  const [carregandoModelos, setCarregandoModelos] = useState(false);
  const [statusCarregamento, setStatusCarregamento] = useState<string>('');

  // Configurações AWS
  const [configAws, setConfigAws] = useState<ConfigAws>({
    configurado: false,
    ativo: false,
    aws_access_key_id_mascarada: '',
    aws_region: 'us-east-1',
    limiar_similaridade: 80,
  });
  const [formAccessKey, setFormAccessKey] = useState('');
  const [formSecretKey, setFormSecretKey] = useState('');
  const [formRegiao, setFormRegiao] = useState('us-east-1');
  const [formLimiar, setFormLimiar] = useState(80);
  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [testandoConexao, setTestandoConexao] = useState(false);
  const [msgFeedback, setMsgFeedback] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Foto de Referência (Rosto do Formando)
  const [fotoReferencia, setFotoReferencia] = useState<{
    file: File | null;
    preview: string;
    nome: string;
  } | null>(null);
  const [alunoSelecionadoNome, setAlunoSelecionadoNome] = useState('');

  // Lote de Fotos do Evento
  const [fotosLote, setFotosLote] = useState<FotoItem[]>([]);
  const [filtroResultado, setFiltroResultado] = useState<'TODAS' | 'ENCONTRADAS' | 'NAO_ENCONTRADAS'>('TODAS');

  // Processamento
  const [processando, setProcessando] = useState(false);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [fotoZoom, setFotoZoom] = useState<FotoItem | null>(null);

  const inputRefFoto = useRef<HTMLInputElement>(null);
  const inputLoteRef = useRef<HTMLInputElement>(null);

  // Carregar Configurações e Inicializar IA ao Abrir
  useEffect(() => {
    if (aberto) {
      carregarConfigAws();
      if (motorIa === 'LOCAL' && !modelosCarregados) {
        inicializarModelosLocais();
      }
    }
  }, [aberto, motorIa]);

  const carregarConfigAws = async () => {
    try {
      const res = await fetch('/aws_rekognition.php?action=obter_config');
      if (res.ok) {
        const dados = await res.json();
        if (dados.sucesso) {
          setConfigAws(dados);
          setFormRegiao(dados.aws_region || 'us-east-1');
          setFormLimiar(dados.limiar_similaridade || 80);
        }
      }
    } catch {
      // Se não carregar via PHP em dev local, mantém padrão
    }
  };

  const salvarConfiguracoes = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoConfig(true);
    setMsgFeedback(null);

    try {
      const res = await fetch('/aws_rekognition.php?action=salvar_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aws_access_key_id: formAccessKey,
          aws_secret_access_key: formSecretKey,
          aws_region: formRegiao,
          limiar_similaridade: formLimiar,
        }),
      });
      const data = await res.json();
      if (data.sucesso) {
        setMsgFeedback({ tipo: 'sucesso', texto: 'Configurações salvas! Validando conexão com a AWS...' });
        setFormAccessKey('');
        setFormSecretKey('');
        await carregarConfigAws();

        // Validação automática imediata com a AWS
        try {
          const resTest = await fetch('/aws_rekognition.php?action=testar_conexao');
          const dataTest = await resTest.json();
          if (dataTest.sucesso) {
            setMsgFeedback({
              tipo: 'sucesso',
              texto: `✅ Credenciais validadas com sucesso na AWS Rekognition (${formRegiao})! O serviço está 100% ativo.`
            });
          } else {
            setMsgFeedback({
              tipo: 'erro',
              texto: `Chaves salvas, mas a AWS retornou erro: ${dataTest.erro || 'Verifique as permissões da chave.'}`
            });
          }
        } catch {
          setMsgFeedback({ tipo: 'sucesso', texto: 'Configurações salvas com sucesso!' });
        }
      } else {
        setMsgFeedback({ tipo: 'erro', texto: data.erro || 'Erro ao salvar configurações.' });
      }
    } catch {
      setMsgFeedback({ tipo: 'erro', texto: 'Falha de comunicação com o servidor.' });
    } finally {
      setSalvandoConfig(false);
    }
  };

  const testarConexaoAws = async () => {
    setTestandoConexao(true);
    setMsgFeedback(null);

    try {
      const res = await fetch('/aws_rekognition.php?action=testar_conexao');
      const data = await res.json();
      if (data.sucesso) {
        setMsgFeedback({ tipo: 'sucesso', texto: `Conexão validada! ${data.mensagem}` });
      } else {
        setMsgFeedback({ tipo: 'erro', texto: data.erro || 'Falha ao autenticar com a AWS Rekognition.' });
      }
    } catch {
      setMsgFeedback({ tipo: 'erro', texto: 'Falha de rede ao conectar com a API da AWS.' });
    } finally {
      setTestandoConexao(false);
    }
  };

  // Upload da Foto de Referência (Selfie)
  const handleUploadReferencia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setFotoReferencia({
        file,
        preview: reader.result as string,
        nome: alunoSelecionadoNome || file.name.replace(/\.[^/.]+$/, ''),
      });
    };
    reader.readAsDataURL(file);
  };

  // Upload das Fotos do Evento (Lote Múltiplo)
  const handleUploadLote = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const novasFotos: FotoItem[] = [];
    let carregadas = 0;

    files.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = () => {
        novasFotos.push({
          id: `foto_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
          file,
          preview: reader.result as string,
          nome: file.name,
          tamanho: file.size,
          status: 'pendente',
        });

        carregadas++;
        if (carregadas === files.length) {
          setFotosLote((prev) => [...prev, ...novasFotos]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Converter File/Preview para base64 limpa
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        resolve(res);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Carrega o script Face-API no navegador se ainda não estiver presente
  const carregarScriptFaceApi = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') return resolve();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).faceapi) return resolve();

      const scriptExistente = document.getElementById('face-api-script') as HTMLScriptElement;
      if (scriptExistente) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).faceapi) return resolve();
        scriptExistente.addEventListener('load', () => resolve());
        scriptExistente.addEventListener('error', (err) => reject(err));
        return;
      }

      const script = document.createElement('script');
      script.id = 'face-api-script';
      script.src = '/js/face-api.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        // Fallback CDN caso necessário
        const scriptCdn = document.createElement('script');
        scriptCdn.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js';
        scriptCdn.onload = () => resolve();
        scriptCdn.onerror = reject;
        document.body.appendChild(scriptCdn);
      };
      document.body.appendChild(script);
    });
  };

  // Inicializa modelos neurais faciais (SSD MobileNet, Landmarks 68 e Face Recognition)
  const inicializarModelosLocais = async (): Promise<boolean> => {
    if (modelosCarregados) return true;
    setCarregandoModelos(true);
    setStatusCarregamento('Carregando biblioteca de IA no navegador...');

    try {
      await carregarScriptFaceApi();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const faceapi = (window as any).faceapi;
      if (!faceapi) {
        throw new Error('Face-API não foi carregado corretamente.');
      }

      setStatusCarregamento('Inicializando redes neurais biométricas...');
      const LOCAL_PATH = '/models/face-api';
      const CDN_PATH = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(LOCAL_PATH),
          faceapi.nets.faceLandmark68Net.loadFromUri(LOCAL_PATH),
          faceapi.nets.faceRecognitionNet.loadFromUri(LOCAL_PATH),
        ]);
      } catch {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(CDN_PATH),
          faceapi.nets.faceLandmark68Net.loadFromUri(CDN_PATH),
          faceapi.nets.faceRecognitionNet.loadFromUri(CDN_PATH),
        ]);
      }

      setModelosCarregados(true);
      setStatusCarregamento('');
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao carregar modelos';
      setStatusCarregamento('');
      setMsgFeedback({
        tipo: 'erro',
        texto: `Não foi possível carregar a IA local: ${msg}. Verifique sua conexão.`
      });
      return false;
    } finally {
      setCarregandoModelos(false);
    }
  };

  // Carrega e redimensiona imagem para o Canvas para máxima performance de IA
  const carregarImagemOtimizada = (src: string, maxDim: number = 1280): Promise<HTMLCanvasElement | HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas);
            return;
          }
        }
        resolve(img);
      };
      img.onerror = (err) => reject(err);
      img.src = src;
    });
  };

  // Processamento 1: IA Nativa Local no Navegador (Face-API / TensorFlow)
  const executarIaNativaLocal = async () => {
    if (!fotoReferencia) return;

    setProcessando(true);
    setIndiceAtual(0);

    // Reseta status para pendente
    setFotosLote((prev) =>
      prev.map((f) => ({ ...f, status: 'pendente', similaridade: undefined, erro: undefined }))
    );

    const prontos = await inicializarModelosLocais();
    if (!prontos) {
      setProcessando(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const faceapi = (window as any).faceapi;
    if (!faceapi) {
      setMsgFeedback({ tipo: 'erro', texto: 'Biblioteca Face-API não está disponível.' });
      setProcessando(false);
      return;
    }

    try {
      setStatusCarregamento('Mapeando rosto de referência do formando...');
      const canvasRef = await carregarImagemOtimizada(fotoReferencia.preview, 800);

      const refDetection = await faceapi
        .detectSingleFace(canvasRef, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.35 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!refDetection) {
        alert('Nenhum rosto foi identificado com clareza na foto de referência (selfie). Por favor, use uma foto nítida e iluminada.');
        setProcessando(false);
        setStatusCarregamento('');
        return;
      }

      setStatusCarregamento('Comparando biometricamente com as fotos do evento...');
      // Limiar: distância máxima 0.58 (~80% similaridade)
      const maxDistance = 0.58;
      const faceMatcher = new faceapi.FaceMatcher(refDetection, maxDistance);

      const total = fotosLote.length;
      for (let i = 0; i < total; i++) {
        const item = fotosLote[i];
        setIndiceAtual(i + 1);

        setFotosLote((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: 'processando' } : f))
        );

        try {
          const canvasAlvo = await carregarImagemOtimizada(item.preview, 1280);
          const detections = await faceapi
            .detectAllFaces(canvasAlvo, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.35 }))
            .withFaceLandmarks()
            .withFaceDescriptors();

          let matchEncontrado = false;
          let melhorSimilaridade = 0;

          for (const det of detections) {
            const match = faceMatcher.findBestMatch(det.descriptor);
            if (match.label !== 'unknown') {
              matchEncontrado = true;
              // Converte distância para porcentagem de similaridade
              const simPct = Math.max(55, Math.min(99, Math.round((1 - (match.distance * 0.75)) * 100)));
              if (simPct > melhorSimilaridade) {
                melhorSimilaridade = simPct;
              }
            }
          }

          setFotosLote((prev) =>
            prev.map((f, idx) =>
              idx === i
                ? {
                    ...f,
                    status: matchEncontrado ? 'encontrado' : 'nao_encontrado',
                    similaridade: matchEncontrado ? melhorSimilaridade : undefined,
                  }
                : f
            )
          );
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : 'Falha na foto';
          setFotosLote((prev) =>
            prev.map((f, idx) =>
              idx === i ? { ...f, status: 'erro', erro: errorMsg } : f
            )
          );
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Falha no processamento';
      setMsgFeedback({ tipo: 'erro', texto: `Erro no processamento da IA: ${errorMsg}` });
    } finally {
      setProcessando(false);
      setIndiceAtual(fotosLote.length);
      setFiltroResultado('ENCONTRADAS');
      setStatusCarregamento('');
    }
  };

  // Processamento 2: AWS Rekognition (Nuvem SigV4)
  const executarAwsRekognition = async () => {
    if (!fotoReferencia) return;

    setProcessando(true);
    setIndiceAtual(0);

    const base64Ref = fotoReferencia.preview;
    const tamanhoPacote = 4;
    const totalFotos = fotosLote.length;

    setFotosLote((prev) =>
      prev.map((f) => ({ ...f, status: 'pendente', similaridade: undefined, erro: undefined }))
    );

    for (let i = 0; i < totalFotos; i += tamanhoPacote) {
      const grupo = fotosLote.slice(i, i + tamanhoPacote);
      setIndiceAtual(i + 1);

      setFotosLote((prev) =>
        prev.map((f) => (grupo.some((g) => g.id === f.id) ? { ...f, status: 'processando' } : f))
      );

      try {
        const lotePayload = await Promise.all(
          grupo.map(async (item) => ({
            id: item.id,
            nome: item.nome,
            base64: await fileToBase64(item.file),
          }))
        );

        const res = await fetch('/aws_rekognition.php?action=comparar_rosto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fotoReferencia: base64Ref,
            fotosLote: lotePayload,
            limiarSimilaridade: formLimiar,
          }),
        });

        const data = await res.json();

        if (data.sucesso && Array.isArray(data.resultados)) {
          setFotosLote((prev) =>
            prev.map((item) => {
              const resItem = data.resultados.find((r: { id: string }) => r.id === item.id);
              if (!resItem) return item;

              return {
                ...item,
                status: resItem.encontrado ? 'encontrado' : 'nao_encontrado',
                similaridade: resItem.similaridade,
                erro: resItem.erro,
              };
            })
          );
        } else {
          setFotosLote((prev) =>
            prev.map((item) =>
              grupo.some((g) => g.id === item.id)
                ? { ...item, status: 'erro', erro: data.erro || 'Falha na IA' }
                : item
            )
          );
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Erro de rede';
        setFotosLote((prev) =>
          prev.map((item) =>
            grupo.some((g) => g.id === item.id)
              ? { ...item, status: 'erro', erro: errorMsg }
              : item
          )
        );
      }
    }

    setProcessando(false);
    setIndiceAtual(totalFotos);
    setFiltroResultado('ENCONTRADAS');
  };

  // Executar Reconhecimento Facial (escolhe o motor ativo)
  const iniciarReconhecimento = async () => {
    if (!fotoReferencia) {
      alert('Selecione primeiro a foto de referência (o rosto do formando).');
      return;
    }
    if (fotosLote.length === 0) {
      alert('Adicione as fotos do evento para a IA analisar.');
      return;
    }

    if (motorIa === 'AWS') {
      if (!configAws.configurado) {
        setMsgFeedback({
          tipo: 'erro',
          texto: 'Por favor, configure as credenciais da AWS Rekognition na aba "Configurações" antes de iniciar a análise.'
        });
        setAbaAtiva('CONFIG');
        return;
      }
      return executarAwsRekognition();
    } else {
      return executarIaNativaLocal();
    }
  };

  // Contadores
  const totalEncontradas = fotosLote.filter((f) => f.status === 'encontrado').length;
  const totalNaoEncontradas = fotosLote.filter((f) => f.status === 'nao_encontrado').length;
  const totalAnalisadas = fotosLote.filter((f) => f.status === 'encontrado' || f.status === 'nao_encontrado').length;

  // Filtragem visual
  const fotosExibidas = fotosLote.filter((f) => {
    if (filtroResultado === 'ENCONTRADAS') return f.status === 'encontrado';
    if (filtroResultado === 'NAO_ENCONTRADAS') return f.status === 'nao_encontrado' || f.status === 'pendente';
    return true;
  });

  // Download individual
  const baixarFoto = (foto: FotoItem) => {
    const a = document.createElement('a');
    a.href = foto.preview;
    a.download = `ON_EVENTOS_${foto.nome}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Baixar todas as encontradas
  const baixarTodasEncontradas = () => {
    const encontradas = fotosLote.filter((f) => f.status === 'encontrado');
    if (encontradas.length === 0) return;

    encontradas.forEach((f, idx) => {
      setTimeout(() => {
        baixarFoto(f);
      }, idx * 250);
    });
  };

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in duration-150">
        {/* Topo do Modal */}
        <header className="px-6 py-4 bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white flex items-center justify-between border-b border-purple-800/40">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
              motorIa === 'LOCAL'
                ? 'bg-gradient-to-tr from-emerald-400 via-teal-500 to-indigo-500 shadow-emerald-900/50'
                : 'bg-gradient-to-tr from-amber-400 via-purple-500 to-indigo-500 shadow-purple-900/50'
            }`}>
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-base tracking-tight text-white flex items-center">
                  IA Facial: Separação Automática por Rosto
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 shadow-xs ${
                  motorIa === 'LOCAL'
                    ? 'bg-emerald-400 text-slate-950'
                    : 'bg-amber-400 text-slate-950'
                }`}>
                  <Sparkles className="w-3 h-3 text-slate-950" />
                  <span>{motorIa === 'LOCAL' ? 'IA Nativa (Grátis / Sem Cartão)' : 'AWS Rekognition'}</span>
                </span>
              </div>
              <p className="text-xs text-purple-200 mt-0.5">
                Envie o rosto do formando e a IA encontra todas as fotos dele no evento com precisão biométrica neural.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Seletor Rápido de Motor */}
            <div className="hidden sm:flex items-center bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setMotorIa('LOCAL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 cursor-pointer ${
                  motorIa === 'LOCAL'
                    ? 'bg-emerald-500 text-white shadow-xs font-black'
                    : 'text-purple-200 hover:text-white'
                }`}
                title="Modo gratuito que roda direto no navegador sem precisar de cartão ou contas externas"
              >
                <span>🤖 IA Nativa (Grátis)</span>
              </button>
              <button
                type="button"
                onClick={() => setMotorIa('AWS')}
                className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 cursor-pointer ${
                  motorIa === 'AWS'
                    ? 'bg-amber-400 text-slate-950 shadow-xs font-black'
                    : 'text-purple-200 hover:text-white'
                }`}
                title="Modo em nuvem via AWS Rekognition (requer credenciais da AWS)"
              >
                <span>☁️ AWS</span>
              </button>
            </div>

            <button
              onClick={() => setAbaAtiva(abaAtiva === 'ANALISE' ? 'CONFIG' : 'ANALISE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                abaAtiva === 'CONFIG'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{abaAtiva === 'CONFIG' ? 'Voltar à IA' : 'Configurações'}</span>
            </button>
            <button
              onClick={onFechar}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* FEEDBACK MSG */}
        {msgFeedback && (
          <div
            className={`px-6 py-2.5 text-xs font-bold flex items-center justify-between ${
              msgFeedback.tipo === 'sucesso'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-b border-rose-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {msgFeedback.tipo === 'sucesso' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              )}
              <span>{msgFeedback.texto}</span>
            </div>
            <button onClick={() => setMsgFeedback(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ABA: CONFIGURAÇÕES */}
        {abaAtiva === 'CONFIG' && (
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Escolha do Motor de Inteligência Artificial */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 rounded-2xl p-5 border border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Cpu className="w-4 h-4 text-emerald-600" />
                  <span>Escolha do Motor de Inteligência Artificial</span>
                </h4>
                <span className="text-[11px] font-bold text-slate-500">
                  Ativo: <strong className={motorIa === 'LOCAL' ? 'text-emerald-700' : 'text-purple-700'}>{motorIa === 'LOCAL' ? 'IA Nativa (Grátis)' : 'AWS Rekognition'}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => setMotorIa('LOCAL')}
                  className={`p-3.5 rounded-xl border text-left transition flex items-start space-x-3 cursor-pointer ${
                    motorIa === 'LOCAL'
                      ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-white/60 border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <strong className="text-xs text-slate-900 font-black">IA Nativa (Recomendada)</strong>
                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-black text-[9px] rounded-sm">100% GRÁTIS</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                      Processamento neural no próprio navegador. <strong>Não requer cartão de crédito</strong> nem conta na AWS.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMotorIa('AWS')}
                  className={`p-3.5 rounded-xl border text-left transition flex items-start space-x-3 cursor-pointer ${
                    motorIa === 'AWS'
                      ? 'bg-white border-purple-500 shadow-md ring-2 ring-purple-500/20'
                      : 'bg-white/60 border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <strong className="text-xs text-slate-900 font-black">AWS Rekognition</strong>
                      <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 font-black text-[9px] rounded-sm">NUVEM</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                      Processamento na nuvem da AWS. Requer par de chaves Access Key configurados abaixo.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Status Atual da Conexão */}
            <div className={`rounded-2xl p-4 border flex items-center justify-between ${
              configAws.configurado
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  configAws.configurado ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                }`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <strong className="text-xs font-black uppercase tracking-wider">
                      Status da IA Facial:
                    </strong>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      configAws.configurado
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'bg-amber-200 text-amber-900'
                    }`}>
                      {configAws.configurado ? '🟢 Conectado e Operacional' : '⚠️ Aguardando Chaves AWS'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {configAws.configurado
                      ? `Chave ativa: ${configAws.aws_access_key_id_mascarada} • Região: ${configAws.aws_region} • Limiar: ${formLimiar}%`
                      : 'Insira suas credenciais da AWS Rekognition abaixo para habilitar a separação automática.'}
                  </p>
                </div>
              </div>

              {configAws.configurado && (
                <button
                  type="button"
                  onClick={testarConexaoAws}
                  disabled={testandoConexao}
                  className="px-3 py-1.5 rounded-xl bg-white text-emerald-800 text-xs font-bold border border-emerald-300 hover:bg-emerald-100 transition shadow-xs flex items-center space-x-1 cursor-pointer"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${testandoConexao ? 'animate-spin' : ''}`} />
                  <span>{testandoConexao ? 'Testando...' : 'Re-testar Conexão'}</span>
                </button>
              )}
            </div>

            {/* Passo a Passo Rápido para Gerar as Chaves */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Info className="w-4 h-4 text-purple-600" />
                  <span>Como obter suas Chaves Gratuitas da AWS (5.000 fotos/mês grátis)</span>
                </h4>
                <a
                  href="https://console.aws.amazon.com/iam/home#/users"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center space-x-1 underline"
                >
                  <span>Abrir AWS Console (IAM)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 font-black text-[10px] inline-flex items-center justify-center mb-1">
                    1
                  </span>
                  <strong className="block text-slate-900 font-bold mb-0.5">Criar Usuário</strong>
                  <p className="text-[11px] text-slate-600">
                    Acesse o IAM no AWS Console e clique em <strong>Create user</strong> (ex: <code>on-eventos-facial</code>).
                  </p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 font-black text-[10px] inline-flex items-center justify-center mb-1">
                    2
                  </span>
                  <strong className="block text-slate-900 font-bold mb-0.5">Anexar Permissão</strong>
                  <p className="text-[11px] text-slate-600">
                    Selecione <em>Attach policies directly</em> e marque a política <code>AmazonRekognitionFullAccess</code>.
                  </p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 font-black text-[10px] inline-flex items-center justify-center mb-1">
                    3
                  </span>
                  <strong className="block text-slate-900 font-bold mb-0.5">Gerar Access Key</strong>
                  <p className="text-[11px] text-slate-600">
                    Vá na aba <em>Security credentials</em> do usuário e clique em <strong>Create access key</strong> (Outside AWS).
                  </p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 font-black text-[10px] inline-flex items-center justify-center mb-1">
                    4
                  </span>
                  <strong className="block text-slate-900 font-bold mb-0.5">Salvar e Ativar</strong>
                  <p className="text-[11px] text-slate-600">
                    Copie a <strong>Access Key ID</strong> e o <strong>Secret Access Key</strong> e cole no formulário abaixo.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={salvarConfiguracoes} className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  AWS Access Key ID
                </label>
                <input
                  type="text"
                  placeholder={configAws.aws_access_key_id_mascarada || 'Ex: AKIAIOSFODNN7EXAMPLE'}
                  value={formAccessKey}
                  onChange={(e) => setFormAccessKey(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  AWS Secret Access Key
                </label>
                <input
                  type="password"
                  placeholder={configAws.configurado ? '••••••••••••••••••••••••••••••••' : 'Cole sua chave secreta da AWS'}
                  value={formSecretKey}
                  onChange={(e) => setFormSecretKey(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Região AWS
                  </label>
                  <select
                    value={formRegiao}
                    onChange={(e) => setFormRegiao(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="us-east-1">us-east-1 (N. Virginia - Recomendado)</option>
                    <option value="sa-east-1">sa-east-1 (São Paulo - Brasil)</option>
                    <option value="us-east-2">us-east-2 (Ohio)</option>
                    <option value="us-west-2">us-west-2 (Oregon)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Limiar de Similaridade Mínima ({formLimiar}%)
                  </label>
                  <div className="flex items-center space-x-3 pt-1.5">
                    <input
                      type="range"
                      min={60}
                      max={98}
                      step={1}
                      value={formLimiar}
                      onChange={(e) => setFormLimiar(parseInt(e.target.value))}
                      className="flex-1 accent-purple-600"
                    />
                    <span className="font-mono font-black text-xs px-2.5 py-1 bg-purple-100 text-purple-900 rounded-lg">
                      {formLimiar}%
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    80% é o padrão ideal para evitar falsos positivos mantendo alta precisão.
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="submit"
                  disabled={salvandoConfig}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{salvandoConfig ? 'Salvando...' : 'Salvar Configurações'}</span>
                </button>

                <button
                  type="button"
                  onClick={testarConexaoAws}
                  disabled={testandoConexao}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${testandoConexao ? 'animate-spin' : ''}`} />
                  <span>{testandoConexao ? 'Validando...' : 'Testar Conexão com AWS'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ABA: ANÁLISE DE FOTOS COM IA */}
        {abaAtiva === 'ANALISE' && (
          <div className="p-6 overflow-y-auto flex-1 flex flex-col space-y-6">
            {/* ETAPA 1 E 2: SELEÇÃO DA REFERÊNCIA E DO LOTE */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Rosto do Formando (Referência) */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center space-x-1">
                    <UserCheck className="w-4 h-4 text-purple-600" />
                    <span>1. Rosto do Formando</span>
                  </span>
                  {fotoReferencia && (
                    <button
                      onClick={() => setFotoReferencia(null)}
                      className="text-[11px] text-rose-600 hover:underline font-bold"
                    >
                      Trocar foto
                    </button>
                  )}
                </div>

                {fotoReferencia ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-purple-200 shadow-inner">
                    <div className="relative group">
                      <img
                        src={fotoReferencia.preview}
                        alt="Rosto Referência"
                        className="w-28 h-28 object-cover rounded-2xl border-2 border-purple-600 shadow-md"
                      />
                      <div className="absolute -bottom-2 -right-2 bg-purple-600 text-white rounded-full p-1 shadow">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>
                    <strong className="text-xs text-slate-900 mt-3 font-bold text-center truncate max-w-[200px]">
                      {fotoReferencia.nome}
                    </strong>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
                      ✓ Rosto carregado para busca
                    </span>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-between">
                    {/* Atalho para selecionar aluno da lista */}
                    {alunosCadastrados.length > 0 && (
                      <div className="mb-2">
                        <select
                          value={alunoSelecionadoNome}
                          onChange={(e) => setAlunoSelecionadoNome(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-medium"
                        >
                          <option value="">Buscar em alunos cadastrados...</option>
                          {alunosCadastrados.map((aluno, i) => (
                            <option key={i} value={aluno.nome}>
                              {aluno.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div
                      onClick={() => inputRefFoto.current?.click()}
                      className="border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-xl p-5 text-center cursor-pointer transition bg-white/70 hover:bg-purple-50/50 flex flex-col items-center justify-center h-40"
                    >
                      <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mb-2">
                        <Camera className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 block">Enviar Foto / Selfie</span>
                      <span className="text-[11px] text-slate-500 mt-0.5">Clique para carregar o rosto</span>
                    </div>
                    <input
                      ref={inputRefFoto}
                      type="file"
                      accept="image/*"
                      onChange={handleUploadReferencia}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* Card 2: Lote de Fotos do Evento */}
              <div className="md:col-span-2 bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center space-x-1">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>2. Fotos do Evento ({fotosLote.length} selecionadas)</span>
                  </span>
                  {fotosLote.length > 0 && (
                    <button
                      onClick={() => setFotosLote([])}
                      className="text-[11px] text-rose-600 hover:underline font-bold"
                    >
                      Limpar Lote
                    </button>
                  )}
                </div>

                {fotosLote.length === 0 ? (
                  <div
                    onClick={() => inputLoteRef.current?.click()}
                    className="flex-1 border-2 border-dashed border-indigo-300 hover:border-indigo-500 rounded-xl p-6 text-center cursor-pointer transition bg-white/70 hover:bg-indigo-50/50 flex flex-col items-center justify-center min-h-[140px]"
                  >
                    <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mb-2">
                      <Upload className="w-5 h-5" />
                    </div>
                    <strong className="text-xs text-slate-900 block font-bold">
                      Clique para selecionar as fotos do evento
                    </strong>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      Você pode selecionar dezenas ou centenas de fotos de uma vez (JPG, PNG).
                    </span>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col">
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-36 overflow-y-auto p-1 bg-white rounded-xl border border-slate-200">
                      {fotosLote.slice(0, 32).map((item) => (
                        <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200">
                          <img src={item.preview} alt={item.nome} className="w-full h-full object-cover" />
                          {item.status === 'encontrado' && (
                            <div className="absolute inset-0 bg-emerald-500/30 border-2 border-emerald-500 flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4 text-emerald-950 bg-emerald-400 rounded-full" />
                            </div>
                          )}
                        </div>
                      ))}
                      {fotosLote.length > 32 && (
                        <div className="aspect-square rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600 border border-slate-200">
                          +{fotosLote.length - 32}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <button
                        onClick={() => inputLoteRef.current?.click()}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Adicionar mais fotos</span>
                      </button>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {(fotosLote.reduce((acc, f) => acc + f.tamanho, 0) / (1024 * 1024)).toFixed(1)} MB no total
                      </span>
                    </div>
                  </div>
                )}
                <input
                  ref={inputLoteRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleUploadLote}
                  className="hidden"
                />
              </div>
            </div>

            {/* BARRA DE AÇÃO PRINCIPAL E PROGRESSO */}
            <div className={`rounded-2xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
              motorIa === 'LOCAL'
                ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border-emerald-200'
                : 'bg-gradient-to-r from-purple-50 via-indigo-50 to-slate-50 border-purple-200/80'
            }`}>
              <div>
                <strong className="text-slate-900 text-xs font-black block uppercase tracking-wide flex items-center space-x-1.5">
                  <span className={`w-2 h-2 rounded-full ${motorIa === 'LOCAL' ? 'bg-emerald-500' : 'bg-purple-600'} animate-pulse`} />
                  <span>
                    {motorIa === 'LOCAL'
                      ? 'Motor: IA Facial Nativa (100% Gratuito & Ilimitado)'
                      : 'Motor: AWS Rekognition (Nuvem)'}
                  </span>
                </strong>
                <span className="text-[11px] text-slate-600 mt-0.5 block">
                  {motorIa === 'LOCAL'
                    ? (statusCarregamento || '🟢 IA Nativa Ativa! Processamento biométrico neural direto no navegador sem cartão de crédito.')
                    : (configAws.configurado
                        ? `🟢 Conectado à AWS (${configAws.aws_region}) • Limiar: ${formLimiar}% de similaridade`
                        : '⚠️ Nenhuma chave AWS configurada ainda. Clique em "Configurar Chaves AWS" ao lado.')}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                {motorIa === 'AWS' && !configAws.configurado && (
                  <button
                    type="button"
                    onClick={() => setAbaAtiva('CONFIG')}
                    className="px-4 py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Sliders className="w-4 h-4 text-slate-950" />
                    <span>Configurar Chaves AWS</span>
                  </button>
                )}

                <button
                  onClick={iniciarReconhecimento}
                  disabled={processando || !fotoReferencia || fotosLote.length === 0 || carregandoModelos}
                  className={`px-6 py-3 rounded-2xl hover:brightness-110 text-white font-black text-xs shadow-lg transition disabled:opacity-50 flex items-center space-x-2 cursor-pointer ${
                    motorIa === 'LOCAL'
                      ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 shadow-emerald-600/30'
                      : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 shadow-purple-600/30'
                  }`}
                >
                  <Sparkles className={`w-4 h-4 ${processando || carregandoModelos ? 'animate-spin' : ''}`} />
                  <span>
                    {processando
                      ? `Analisando foto ${indiceAtual} de ${fotosLote.length}...`
                      : carregandoModelos
                      ? 'Carregando IA...'
                      : '🔍 Iniciar Separação Facial com IA'}
                  </span>
                </button>
              </div>
            </div>

            {/* BARRA DE PROGRESSO EM TEMPO REAL */}
            {processando && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center space-x-1.5">
                    <span className={`w-2 h-2 rounded-full ${motorIa === 'LOCAL' ? 'bg-emerald-600' : 'bg-purple-600'} animate-ping`} />
                    <span>
                      {motorIa === 'LOCAL'
                        ? 'Processando biometricamente via IA Nativa...'
                        : 'Processando via AWS Rekognition...'}
                    </span>
                  </span>
                  <span>{Math.round((indiceAtual / Math.max(1, fotosLote.length)) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      motorIa === 'LOCAL'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600'
                    }`}
                    style={{ width: `${Math.round((indiceAtual / Math.max(1, fotosLote.length)) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* RESULTADOS DA SEPARAÇÃO */}
            {totalAnalisadas > 0 && (
              <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setFiltroResultado('ENCONTRADAS')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                        filtroResultado === 'ENCONTRADAS'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Fotos Encontradas ({totalEncontradas})</span>
                    </button>

                    <button
                      onClick={() => setFiltroResultado('NAO_ENCONTRADAS')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                        filtroResultado === 'NAO_ENCONTRADAS'
                          ? 'bg-slate-700 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>Outras Fotos ({totalNaoEncontradas})</span>
                    </button>

                    <button
                      onClick={() => setFiltroResultado('TODAS')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                        filtroResultado === 'TODAS'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                      }`}
                    >
                      <span>Todas ({fotosLote.length})</span>
                    </button>
                  </div>

                  {totalEncontradas > 0 && (
                    <button
                      onClick={baixarTodasEncontradas}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar Todas do Aluno ({totalEncontradas})</span>
                    </button>
                  )}
                </div>

                {/* Grid das fotos filtradas */}
                {fotosExibidas.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                    Nenhuma foto encontrada para este filtro.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                    {fotosExibidas.map((item) => (
                      <div
                        key={item.id}
                        className={`group relative rounded-2xl overflow-hidden border transition-all ${
                          item.status === 'encontrado'
                            ? 'border-emerald-300 bg-emerald-50/40 shadow-xs'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="aspect-square overflow-hidden bg-slate-100 relative">
                          <img
                            src={item.preview}
                            alt={item.nome}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <button
                            onClick={() => setFotoZoom(item)}
                            className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                            title="Ver Foto Ampliada"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="p-2.5">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-bold text-slate-800 truncate max-w-[100px]">{item.nome}</span>
                            {item.status === 'encontrado' && (
                              <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono font-black text-[10px]">
                                {item.similaridade}%
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                            {item.status === 'encontrado' ? (
                              <span className="text-[10px] font-bold text-emerald-700 flex items-center space-x-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Rosto Identificado</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">Não identificado</span>
                            )}
                            <button
                              onClick={() => baixarFoto(item)}
                              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition"
                              title="Baixar esta foto"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE ZOOM / VISUALIZAÇÃO AMPLIADA */}
      {fotoZoom && (
        <div
          onClick={() => setFotoZoom(null)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl">
            <img src={fotoZoom.preview} alt={fotoZoom.nome} className="max-w-full max-h-[85vh] object-contain rounded-2xl" />
            <div className="absolute bottom-4 left-4 right-4 bg-slate-900/80 backdrop-blur-md text-white p-3 rounded-xl flex items-center justify-between text-xs">
              <div>
                <strong>{fotoZoom.nome}</strong>
                {fotoZoom.similaridade && (
                  <span className="ml-2 font-mono text-emerald-400 font-black">
                    Similaridade Biométrica: {fotoZoom.similaridade}%
                  </span>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  baixarFoto(fotoZoom);
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
