import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, PagBankIntegration, type PagBankPaymentData } from '@/lib/pix-utils';

interface PagBankPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  orderId: string;
  onPaymentConfirmed?: (transactionId: string) => void;
  apiKey?: string;
}

export const PagBankPaymentDialog: React.FC<PagBankPaymentDialogProps> = ({
  open,
  onOpenChange,
  amount,
  orderId,
  onPaymentConfirmed,
  apiKey = ''
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'debit' | 'credit'>('credit');
  const [installments, setInstallments] = useState<number>(1);
  const [processing, setProcessing] = useState<boolean>(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [transactionId, setTransactionId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleProcessPayment = async () => {
    if (!apiKey) {
      toast({
        title: 'Configuração necessária',
        description: 'Configure a API Key do PagBank nas configurações',
        variant: 'destructive'
      });
      return;
    }

    try {
      setProcessing(true);
      setPaymentStatus('processing');
      setErrorMessage('');

      // Inicializar integração com PagBank
      const pagbank = new PagBankIntegration(apiKey);

      const paymentData: PagBankPaymentData = {
        amount: amount,
        orderId: orderId,
        installments: paymentMethod === 'credit' ? installments : 1,
        description: `Venda ${orderId}`
      };

      // Processar pagamento
      const result = await pagbank.createPayment(paymentData);

      if (result.success && result.transactionId) {
        setTransactionId(result.transactionId);
        setPaymentStatus('success');
        
        toast({
          title: 'Pagamento aprovado!',
          description: `Transação: ${result.transactionId}`
        });

        // Aguardar um momento e chamar callback
        setTimeout(() => {
          onPaymentConfirmed?.(result.transactionId!);
          onOpenChange(false);
          resetState();
        }, 2000);
      } else {
        throw new Error(result.error || 'Erro ao processar pagamento');
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      setPaymentStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Erro desconhecido');
      
      toast({
        title: 'Erro no pagamento',
        description: 'Não foi possível processar o pagamento. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const resetState = () => {
    setPaymentMethod('credit');
    setInstallments(1);
    setProcessing(false);
    setPaymentStatus('idle');
    setTransactionId('');
    setErrorMessage('');
  };

  const calculateInstallmentValue = (installment: number): number => {
    return amount / installment;
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetState();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pagamento via Maquininha PagBank
          </DialogTitle>
          <DialogDescription>
            ModerninhaPro2 - Processamento de cartões
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Valor */}
          <div className="text-center py-4 bg-primary/10 rounded-lg">
            <p className="text-sm text-muted-foreground">Valor total</p>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(amount)}
            </p>
          </div>

          {paymentStatus === 'idle' && (
            <>
              {/* Método de pagamento */}
              <div className="space-y-2">
                <Label htmlFor="payment-method">Método de Pagamento</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value: 'debit' | 'credit') => {
                    setPaymentMethod(value);
                    if (value === 'debit') setInstallments(1);
                  }}
                >
                  <SelectTrigger id="payment-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debit">Cartão de Débito</SelectItem>
                    <SelectItem value="credit">Cartão de Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Parcelas (somente crédito) */}
              {paymentMethod === 'credit' && (
                <div className="space-y-2">
                  <Label htmlFor="installments">Número de Parcelas</Label>
                  <Select
                    value={installments.toString()}
                    onValueChange={(value) => setInstallments(Number(value))}
                  >
                    <SelectTrigger id="installments">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}x de {formatCurrency(calculateInstallmentValue(num))}
                          {num === 1 ? ' à vista' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Instruções */}
              <Alert>
                <AlertDescription className="text-xs">
                  <strong>Instruções:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Certifique-se que a maquininha está ligada</li>
                    <li>Insira ou aproxime o cartão na maquininha</li>
                    <li>Clique em "Processar Pagamento"</li>
                    <li>Aguarde a confirmação</li>
                  </ol>
                </AlertDescription>
              </Alert>

              {/* Imagem ilustrativa da maquininha */}
              <div className="flex justify-center py-4">
                <div className="w-48 h-32 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center shadow-lg">
                  <div className="text-center text-white">
                    <CreditCard className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-xs font-bold">ModerninhaPro2</p>
                    <p className="text-xs">PagBank</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {paymentStatus === 'processing' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <p className="text-lg font-medium">Processando pagamento...</p>
              <p className="text-sm text-muted-foreground">
                Aguarde a confirmação da maquininha
              </p>
            </div>
          )}

          {paymentStatus === 'success' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <p className="text-lg font-medium">Pagamento aprovado!</p>
              <p className="text-sm text-muted-foreground">
                Transação: {transactionId}
              </p>
            </div>
          )}

          {paymentStatus === 'error' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <AlertCircle className="h-16 w-16 text-red-500" />
              <p className="text-lg font-medium">Pagamento recusado</p>
              <p className="text-sm text-muted-foreground text-center">
                {errorMessage}
              </p>
            </div>
          )}

          {/* Botões de ação */}
          {paymentStatus === 'idle' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleProcessPayment}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Processar Pagamento'
                )}
              </Button>
            </div>
          )}

          {paymentStatus === 'error' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setPaymentStatus('idle');
                  setErrorMessage('');
                }}
              >
                Tentar Novamente
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
            </div>
          )}

          {/* Nota importante */}
          <p className="text-xs text-center text-muted-foreground">
            * Esta funcionalidade requer pareamento da maquininha via Bluetooth e configuração da API do PagBank
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PagBankPaymentDialog;

