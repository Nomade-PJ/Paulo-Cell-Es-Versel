import React, { useState, useEffect } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, CheckCircle2, QrCode as QrCodeIcon, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  generatePixPayload,
  generatePixQRCode,
  formatCurrency,
  DEFAULT_PIX_CONFIG,
  type PixData
} from '@/lib/pix-utils';

interface PixPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  orderId: string;
  onPaymentConfirmed?: () => void;
  pixKey?: string;
}

export const PixPaymentDialog: React.FC<PixPaymentDialogProps> = ({
  open,
  onOpenChange,
  amount,
  orderId,
  onPaymentConfirmed,
  pixKey = DEFAULT_PIX_CONFIG.pixKey
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [pixPayload, setPixPayload] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState<boolean>(false);

  useEffect(() => {
    if (open && pixKey) {
      generateQRCode();
    }
  }, [open, amount, orderId, pixKey]);

  const generateQRCode = async () => {
    try {
      setLoading(true);

      const pixData: PixData = {
        pixKey: pixKey,
        merchantName: DEFAULT_PIX_CONFIG.merchantName,
        merchantCity: DEFAULT_PIX_CONFIG.merchantCity,
        amount: amount,
        txid: orderId,
        description: `Venda ${orderId}`
      };

      const payload = generatePixPayload(pixData);
      setPixPayload(payload);

      const qrCodeUrl = await generatePixQRCode(payload);
      setQrCodeDataUrl(qrCodeUrl);
    } catch (error) {
      console.error('Erro ao gerar QR Code PIX:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o QR Code PIX. Verifique as configurações.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(pixPayload);
      setCopied(true);
      toast({
        title: 'Copiado!',
        description: 'Código PIX copiado para a área de transferência'
      });

      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o código',
        variant: 'destructive'
      });
    }
  };

  const handleConfirmPayment = () => {
    setPaymentConfirmed(true);
    toast({
      title: 'Pagamento confirmado!',
      description: 'O pagamento foi registrado com sucesso'
    });

    setTimeout(() => {
      onPaymentConfirmed?.();
      onOpenChange(false);
      // Reset state
      setPaymentConfirmed(false);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCodeIcon className="h-5 w-5" />
            Pagamento via PIX
          </DialogTitle>
          <DialogDescription>
            Escaneie o QR Code ou copie o código PIX para realizar o pagamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Valor */}
          <div className="text-center py-4 bg-primary/10 rounded-lg">
            <p className="text-sm text-muted-foreground">Valor a pagar</p>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(amount)}
            </p>
          </div>

          {/* QR Code */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : qrCodeDataUrl ? (
            <div className="flex justify-center py-4">
              <img
                src={qrCodeDataUrl}
                alt="QR Code PIX"
                className="w-64 h-64 border-4 border-primary rounded-lg"
              />
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                Configure a chave PIX nas configurações para gerar o QR Code
              </AlertDescription>
            </Alert>
          )}

          {/* Código PIX Copia e Cola */}
          {pixPayload && (
            <div className="space-y-2">
              <Label htmlFor="pix-code">PIX Copia e Cola</Label>
              <div className="flex gap-2">
                <Input
                  id="pix-code"
                  value={pixPayload}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyPixCode}
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Instruções */}
          <Alert>
            <AlertDescription className="text-xs">
              <strong>Como pagar:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Abra o app do seu banco</li>
                <li>Escolha pagar com PIX</li>
                <li>Escaneie o QR Code ou cole o código</li>
                <li>Confirme o pagamento</li>
              </ol>
            </AlertDescription>
          </Alert>

          {/* Botões de ação */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={paymentConfirmed}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirmPayment}
              disabled={paymentConfirmed || loading}
            >
              {paymentConfirmed ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirmado!
                </>
              ) : (
                'Confirmar Pagamento'
              )}
            </Button>
          </div>

          {/* Nota de verificação manual */}
          <p className="text-xs text-center text-muted-foreground">
            * Após o pagamento, clique em "Confirmar Pagamento" para registrar a venda
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PixPaymentDialog;

