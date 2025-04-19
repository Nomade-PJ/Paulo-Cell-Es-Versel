import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Printer, Check, AlertCircle, Bluetooth, Battery } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { 
  isBluetoothSupported, 
  scanForPrinters, 
  connectToPrinter, 
  disconnectPrinter,
  printText,
  printServiceReceipt,
  getPrinterStatus
} from "@/lib/bluetooth-printer";
import { toast } from "@/components/ui/use-toast";

interface BluetoothPrinterProps {
  serviceData?: {
    serviceName: string;
    customerName: string;
    deviceInfo: string;
    price: number;
    date: string;
    observations?: string;
    warrantyInfo?: string;
  };
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

const BluetoothPrinterComponent = ({ 
  serviceData, 
  onSuccess, 
  onError 
}: BluetoothPrinterProps) => {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [statusInterval, setStatusInterval] = useState<number | null>(null);
  
  const [printerStatus, setPrinterStatus] = useState<{
    connected: boolean;
    name?: string;
    batteryLevel?: number;
  }>({
    connected: false
  });
  
  // Verificar suporte ao Bluetooth na inicialização
  useEffect(() => {
    setIsSupported(isBluetoothSupported());
    
    return () => {
      // Limpar qualquer conexão quando o componente for desmontado
      if (statusInterval) {
        clearInterval(statusInterval);
      }
      disconnectPrinter().catch(console.error);
    };
  }, [statusInterval]);
  
  // Iniciar verificação periódica do status quando conectado
  useEffect(() => {
    if (printerStatus.connected && !statusInterval) {
      const interval = window.setInterval(async () => {
        try {
          const status = await getPrinterStatus();
          setPrinterStatus(status);
        } catch (error) {
          console.error("Erro ao obter status da impressora:", error);
        }
      }, 5000) as unknown as number;
      
      setStatusInterval(interval);
    } else if (!printerStatus.connected && statusInterval) {
      clearInterval(statusInterval);
      setStatusInterval(null);
    }
  }, [printerStatus.connected, statusInterval]);
  
  // Função para escanear impressoras
  const handleScan = async () => {
    if (!isSupported) {
      toast({
        title: "Bluetooth não suportado",
        description: "Seu navegador não suporta Bluetooth. Use um navegador compatível como Chrome ou Edge.",
        variant: "destructive"
      });
      return;
    }
    
    setIsScanning(true);
    
    try {
      const printers = await scanForPrinters();
      if (printers.length > 0) {
        setIsConnecting(true);
        await connectToPrinter(printers[0]);
        
        const status = await getPrinterStatus();
        setPrinterStatus(status);
        
        toast({
          title: "Impressora conectada",
          description: `Conectado com sucesso à impressora ${printers[0].name}`,
          variant: "default"
        });
      } else {
        toast({
          title: "Nenhuma impressora encontrada",
          description: "Verifique se sua impressora está ligada e no modo de pareamento.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao conectar impressora:", error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar à impressora. Tente novamente.",
        variant: "destructive"
      });
      
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setIsScanning(false);
      setIsConnecting(false);
    }
  };
  
  // Função para desconectar impressora
  const handleDisconnect = async () => {
    try {
      await disconnectPrinter();
      setPrinterStatus({ connected: false });
      
      toast({
        title: "Impressora desconectada",
        description: "A impressora foi desconectada com sucesso.",
        variant: "default"
      });
    } catch (error) {
      console.error("Erro ao desconectar impressora:", error);
      toast({
        title: "Erro ao desconectar",
        description: "Não foi possível desconectar da impressora.",
        variant: "destructive"
      });
    }
  };
  
  // Função para testar impressão
  const handleTestPrint = async () => {
    setIsPrinting(true);
    
    try {
      await printText(
        "=== TESTE DE IMPRESSÃO ===\n\n" +
        "PAULO CELL ASSISTÊNCIA TÉCNICA\n" +
        "Impressão térmica via Bluetooth\n" +
        "Funcionando corretamente!\n\n" +
        new Date().toLocaleString('pt-BR') + "\n\n" +
        "=====================",
        { centered: true, bold: true }
      );
      
      toast({
        title: "Teste enviado",
        description: "O teste de impressão foi enviado com sucesso.",
        variant: "default"
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Erro ao imprimir teste:", error);
      toast({
        title: "Erro de impressão",
        description: "Não foi possível imprimir o teste. Verifique a conexão.",
        variant: "destructive"
      });
      
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setIsPrinting(false);
    }
  };
  
  // Função para imprimir recibo de serviço
  const handlePrintReceipt = async () => {
    if (!serviceData) {
      toast({
        title: "Dados insuficientes",
        description: "Não há dados de serviço para imprimir.",
        variant: "destructive"
      });
      return;
    }
    
    setIsPrinting(true);
    
    try {
      await printServiceReceipt(serviceData);
      
      toast({
        title: "Comprovante impresso",
        description: "O comprovante de serviço foi impresso com sucesso.",
        variant: "default"
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      setDialogOpen(false);
    } catch (error) {
      console.error("Erro ao imprimir comprovante:", error);
      toast({
        title: "Erro de impressão",
        description: "Não foi possível imprimir o comprovante. Verifique a conexão.",
        variant: "destructive"
      });
      
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setIsPrinting(false);
    }
  };
  
  return (
    <>
      {/* Botão para abrir o diálogo */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setDialogOpen(true)}
        className="flex items-center gap-2"
      >
        <Printer className="h-4 w-4" />
        Imprimir via Bluetooth
      </Button>
      
      {/* Diálogo de impressão */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bluetooth className="h-5 w-5 text-primary" />
              Impressão Bluetooth
            </DialogTitle>
            <DialogDescription>
              Conecte-se a uma impressora térmica via Bluetooth para imprimir comprovantes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {!isSupported && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Bluetooth não suportado</AlertTitle>
                <AlertDescription>
                  Seu navegador não suporta Bluetooth. Use um navegador como Chrome ou Edge em um dispositivo compatível.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Status da impressora */}
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Status da Impressora</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${printerStatus.connected ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span>{printerStatus.connected ? 'Conectado' : 'Desconectado'}</span>
                  </div>
                  
                  {printerStatus.connected && printerStatus.name && (
                    <div className="text-sm text-muted-foreground">
                      {printerStatus.name}
                    </div>
                  )}
                </div>
                
                {printerStatus.connected && printerStatus.batteryLevel !== undefined && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Battery className="h-4 w-4" />
                    <span>{printerStatus.batteryLevel}%</span>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Ações de impressora */}
            <div className="space-y-3">
              {!printerStatus.connected ? (
                <Button 
                  onClick={handleScan} 
                  disabled={isScanning || !isSupported}
                  className="w-full"
                >
                  {isScanning ? 'Procurando...' : 'Conectar Impressora'}
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={handleTestPrint} 
                    disabled={isPrinting || !printerStatus.connected}
                    className="w-full"
                    variant="default"
                  >
                    {isPrinting ? 'Imprimindo...' : 'Imprimir Teste'}
                  </Button>
                  
                  {serviceData && (
                    <Button 
                      onClick={handlePrintReceipt} 
                      disabled={isPrinting || !printerStatus.connected}
                      className="w-full"
                      variant="default"
                    >
                      {isPrinting ? 'Imprimindo...' : 'Imprimir Comprovante'}
                    </Button>
                  )}
                  
                  <Button 
                    onClick={handleDisconnect} 
                    disabled={!printerStatus.connected}
                    className="w-full"
                    variant="outline"
                  >
                    Desconectar
                  </Button>
                </>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BluetoothPrinterComponent; 