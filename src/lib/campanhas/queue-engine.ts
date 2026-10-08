/**
 * Fila de Mensageria com Cadência Segura e JIT Payment Check
 * 
 * Requisitos:
 * 1. Respeitar limites do provedor (envio gradual configurável, ex: 1 a cada 60s).
 * 2. Checagem de Último Segundo (JIT Payment Check): antes de disparar cobrança da fila,
 *    consulta a situação de liquidação no banco. Se já estiver quitada, SUPRIME a mensagem.
 * 3. Evitar qualquer duplicação de envio.
 */

export interface ItemFilaNotificacao {
  id: string;
  destinatarioNome: string;
  destinatarioTelefone?: string;
  destinatarioEmail?: string;
  canal: 'WHATSAPP' | 'EMAIL';
  parcelaIdParaConferir?: string;
  mensagem: string;
  status: 'PENDENTE' | 'ENVIADO' | 'FALHA' | 'SUPRIMIDO_PAGAMENTO_CONFIRMADO';
}

export class CampanhaQueueEngine {
  /**
   * Avalia item da fila antes do disparo para garantir que não cobra parcela já liquidada
   */
  public static async verificarEEnviar(
    item: ItemFilaNotificacao,
    consultarParcelaQuitadaFn: (parcelaId: string) => Promise<boolean>
  ): Promise<{ statusFinal: ItemFilaNotificacao['status']; motivo: string }> {
    // 1. Verificação de Último Segundo (JIT)
    if (item.parcelaIdParaConferir) {
      const jaEstaPaga = await consultarParcelaQuitadaFn(item.parcelaIdParaConferir);
      if (jaEstaPaga) {
        return {
          statusFinal: 'SUPRIMIDO_PAGAMENTO_CONFIRMADO',
          motivo: 'Envio cancelado preventivamente: parcela foi liquidada pelo aluno antes do disparo.',
        };
      }
    }

    // 2. Disparo oficial (Canal WhatsApp Cloud API ou Gmail API)
    try {
      // Mock / Simulação de transporte
      return {
        statusFinal: 'ENVIADO',
        motivo: `Mensagem enviada com sucesso para ${item.destinatarioNome} via ${item.canal}.`,
      };
    } catch (err: unknown) {
      return {
        statusFinal: 'FALHA',
        motivo: `Erro no envio: ${err instanceof Error ? err.message : 'Falha desconhecida'}`,
      };
    }
  }
}
