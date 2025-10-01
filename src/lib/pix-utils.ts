/**
 * Utilitários para geração de QR Code PIX e integração com PagBank
 */

// Interface para dados do PIX
export interface PixData {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
  txid?: string;
  description?: string;
}

// Interface para dados da maquininha PagBank
export interface PagBankPaymentData {
  amount: number;
  orderId: string;
  installments?: number;
  description?: string;
}

/**
 * Gera o payload do PIX no formato EMV (usado para QR Code)
 * Baseado no padrão do Banco Central do Brasil
 */
export function generatePixPayload(data: PixData): string {
  const {
    pixKey,
    merchantName,
    merchantCity,
    amount,
    txid = generateTxId(),
    description = 'Pagamento'
  } = data;

  // Função auxiliar para formatar campos EMV
  const formatEMV = (id: string, value: string): string => {
    const length = value.length.toString().padStart(2, '0');
    return `${id}${length}${value}`;
  };

  // Payload ID fixo (01 = Payload Format Indicator)
  let payload = formatEMV('00', '01');

  // Informação do PIX (26 = Merchant Account Information)
  let merchantAccount = formatEMV('00', 'BR.GOV.BCB.PIX'); // GUI do PIX
  merchantAccount += formatEMV('01', pixKey); // Chave PIX
  
  if (description) {
    merchantAccount += formatEMV('02', description);
  }

  payload += formatEMV('26', merchantAccount);

  // Categoria do comerciante (52 = Merchant Category Code)
  payload += formatEMV('52', '0000');

  // Moeda (53 = Transaction Currency) - 986 = BRL
  payload += formatEMV('53', '986');

  // Valor da transação (54 = Transaction Amount)
  if (amount > 0) {
    payload += formatEMV('54', amount.toFixed(2));
  }

  // País (58 = Country Code)
  payload += formatEMV('58', 'BR');

  // Nome do comerciante (59 = Merchant Name)
  payload += formatEMV('59', merchantName.substring(0, 25));

  // Cidade do comerciante (60 = Merchant City)
  payload += formatEMV('60', merchantCity.substring(0, 15));

  // Informação adicional (62 = Additional Data Field Template)
  let additionalData = formatEMV('05', txid); // Transaction ID
  payload += formatEMV('62', additionalData);

  // CRC16 (63 = CRC)
  payload += '6304';
  const crc = calculateCRC16(payload);
  payload += crc;

  return payload;
}

/**
 * Calcula o CRC16-CCITT para validação do payload PIX
 */
function calculateCRC16(str: string): string {
  let crc = 0xFFFF;
  const polynomial = 0x1021;

  for (let i = 0; i < str.length; i++) {
    crc ^= (str.charCodeAt(i) << 8);

    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Gera um Transaction ID único para o PIX
 */
function generateTxId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let txid = '';
  for (let i = 0; i < 25; i++) {
    txid += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return txid;
}

/**
 * Converte o payload PIX em Data URL do QR Code
 */
export async function generatePixQRCode(payload: string): Promise<string> {
  try {
    const QRCode = (await import('qrcode')).default;
    return await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    console.error('Erro ao gerar QR Code PIX:', error);
    throw new Error('Não foi possível gerar o QR Code PIX');
  }
}

/**
 * Valida uma chave PIX
 */
export function validatePixKey(key: string, type: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'): boolean {
  switch (type) {
    case 'cpf':
      return /^\d{11}$/.test(key.replace(/\D/g, ''));
    case 'cnpj':
      return /^\d{14}$/.test(key.replace(/\D/g, ''));
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key);
    case 'phone':
      return /^\+?55\d{10,11}$/.test(key.replace(/\D/g, ''));
    case 'random':
      return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(key);
    default:
      return false;
  }
}

/**
 * Formata valor monetário para exibição
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Interface para integração com PagBank ModerninhaPro2
 * A integração real depende da API oficial do PagBank
 */
export class PagBankIntegration {
  private apiKey: string;
  private apiUrl: string = 'https://api.pagseguro.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Cria uma cobrança via maquininha PagBank
   * NOTA: Esta é uma implementação simulada. A integração real requer:
   * 1. SDK oficial do PagBank
   * 2. Pareamento da maquininha via Bluetooth
   * 3. Credenciais de acesso à API do PagSeguro
   */
  async createPayment(data: PagBankPaymentData): Promise<{
    success: boolean;
    transactionId?: string;
    qrCode?: string;
    error?: string;
  }> {
    try {
      // Simulação de chamada à API do PagBank
      // Em produção, você precisaria usar o SDK oficial
      console.log('Criando pagamento PagBank:', data);

      // Aqui você faria a chamada real para a API do PagBank
      // const response = await fetch(`${this.apiUrl}/orders`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${this.apiKey}`
      //   },
      //   body: JSON.stringify({
      //     amount: Math.round(data.amount * 100), // Valor em centavos
      //     reference_id: data.orderId,
      //     payment_method: 'CREDIT_CARD',
      //     installments: data.installments || 1
      //   })
      // });

      // Simulação de resposta
      return {
        success: true,
        transactionId: `TXN-${Date.now()}`,
        qrCode: 'https://example.com/qrcode'
      };
    } catch (error) {
      console.error('Erro ao criar pagamento PagBank:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Verifica o status de uma transação
   */
  async checkPaymentStatus(transactionId: string): Promise<{
    success: boolean;
    status?: 'pending' | 'paid' | 'cancelled' | 'refunded';
    error?: string;
  }> {
    try {
      console.log('Verificando status do pagamento:', transactionId);

      // Simulação de resposta
      return {
        success: true,
        status: 'paid'
      };
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Cancela uma transação
   */
  async cancelPayment(transactionId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log('Cancelando pagamento:', transactionId);

      return {
        success: true
      };
    } catch (error) {
      console.error('Erro ao cancelar pagamento:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
}

/**
 * Configurações padrão para o sistema
 */
export const DEFAULT_PIX_CONFIG = {
  merchantName: 'PAULO CELL',
  merchantCity: 'VITORIA',
  pixKey: '', // Deve ser configurado pelo usuário
};

