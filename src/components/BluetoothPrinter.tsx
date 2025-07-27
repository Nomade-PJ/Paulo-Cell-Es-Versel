import { useState, useEffect, forwardRef } from "react";
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
import { FiscalDocument } from "@/types";

interface BluetoothPrinterComponentProps {
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

interface BluetoothPrinterProps {
  document: FiscalDocument;
  children?: React.ReactNode;
}

// Componente principal para configurar e gerenciar impressoras Bluetooth
const BluetoothPrinterComponent = ({ 
  serviceData, 
  onSuccess, 
  onError 
}: BluetoothPrinterComponentProps) => {
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
        description: "O teste de impressão foi enviado com sucesso."
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
        description: "O comprovante de serviço foi impresso com sucesso."
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
      <Button 
        onClick={() => setDialogOpen(true)}
        variant="outline"
        className="w-full flex justify-center items-center gap-2"
        disabled={isPrinting}
      >
        <Bluetooth className="h-4 w-4" />
        Impressora Bluetooth
      </Button>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Impressora Bluetooth</DialogTitle>
            <DialogDescription>
              Configurar e imprimir via impressora térmica Bluetooth
            </DialogDescription>
          </DialogHeader>
          
          {!isSupported && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Bluetooth não suportado</AlertTitle>
              <AlertDescription>
                Seu navegador não suporta Bluetooth. Use um navegador compatível como Chrome ou Edge.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            {printerStatus.connected ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    Impressora Conectada
                  </CardTitle>
                  <CardDescription>
                    {printerStatus.name || "Impressora Térmica"}
                    {printerStatus.batteryLevel !== undefined && (
                      <span className="flex items-center ml-2">
                        <Battery className="h-4 w-4 mr-1" />
                        {printerStatus.batteryLevel}%
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-2">
                  <Button 
                    onClick={handleTestPrint}
                    disabled={isPrinting}
                    className="w-full"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir teste
                  </Button>
                  
                  {serviceData && (
                    <Button 
                      onClick={handlePrintReceipt}
                      disabled={isPrinting}
                      className="w-full"
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Imprimir comprovante
                    </Button>
                  )}
                </CardContent>
                
                <CardFooter>
                  <Button 
                    onClick={handleDisconnect}
                    variant="outline"
                    className="w-full"
                    disabled={isPrinting}
                  >
                    Desconectar
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Conectar Impressora</CardTitle>
                  <CardDescription>
                    Certifique-se que sua impressora térmica esteja ligada e em modo de descoberta.
                  </CardDescription>
                </CardHeader>
                
                <CardFooter>
                  <Button 
                    onClick={handleScan} 
                    disabled={isScanning || isConnecting || !isSupported}
                    className="w-full"
                  >
                    {(isScanning || isConnecting) ? "Procurando..." : "Procurar impressoras"}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
          
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Componente auxiliar para imprimir documentos fiscais via Bluetooth
// utilizando o componente BluetoothPrinter configurado corretamente
export const BluetoothPrinter = forwardRef<HTMLButtonElement, BluetoothPrinterProps>(
  ({ document, children }, ref) => {
    // Formatar para moeda brasileira
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    };

    const printFiscalDocument = async () => {
      try {
        // Título do documento com base no tipo
        const documentTitle = document.type === 'nf' 
          ? 'NOTA FISCAL ELETRÔNICA'
          : document.type === 'nfce' 
            ? 'NOTA FISCAL DE CONSUMIDOR' 
            : 'NOTA FISCAL DE SERVIÇO';
        
        // Gerar conteúdo para impressão
        let content = [];
        
        // Cabeçalho
        content.push({ text: "PAULO CELL", align: "center", bold: true });
        content.push({ text: documentTitle, align: "center", bold: true });
        content.push({ text: "------------------------", align: "center" });
        
        content.push({ text: `Documento: ${document.number}` });
        content.push({ text: `Tipo: ${document.type.toUpperCase()}` });
        content.push({ text: `Data: ${new Date(document.issue_date).toLocaleDateString('pt-BR')}` });
        content.push({ text: `Status: ${document.status === 'authorized' ? 'Autorizado' : document.status === 'pending' ? 'Pendente' : 'Cancelado'}` });
        content.push({ text: "------------------------", align: "center" });
        
        // Cliente
        content.push({ text: `Cliente: ${document.customer_name}` });
        
        // Descrição (se existir)
        if (document.description) {
          content.push({ text: "------------------------", align: "center" });
          content.push({ text: "Descrição:" });
          content.push({ text: document.description });
        }
        
        // Valores
        content.push({ text: "------------------------", align: "center" });
        content.push({ text: `Total: ${formatCurrency(document.total_value)}`, bold: true });
        
        // Chave de acesso
        content.push({ text: "------------------------", align: "center" });
        content.push({ text: "Chave de Acesso:" });
        content.push({ text: document.access_key });
        content.push({ text: "------------------------", align: "center" });
        content.push({ text: "Consulte pela chave de acesso em:", align: "center" });
        content.push({ text: "www.nfe.fazenda.gov.br", align: "center", bold: true });
        
        // Rodapé
        content.push({ text: "------------------------", align: "center" });
        content.push({ 
          text: `Documento emitido em ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 
          align: "center" 
        });
        
        // Imprimir usando a função printText
        await printText(content.map(item => {
          if (item.align === "center") {
            return { text: item.text, centered: true, bold: item.bold || false };
          }
          return { text: item.text, bold: item.bold || false };
        }).map(item => item.text).join('\n'));
        
        toast({
          title: "Impressão Bluetooth iniciada",
          description: `O documento ${document.number} está sendo impresso via Bluetooth.`,
        });
      } catch (error) {
        console.error("Erro ao imprimir via Bluetooth:", error);
        toast({
          title: "Erro de impressão",
          description: "Não foi possível imprimir via Bluetooth. Verifique se a impressora está conectada.",
          variant: "destructive",
        });
      }
    };

    return (
      <Button 
        ref={ref}
        variant="ghost" 
        size="sm"
        onClick={printFiscalDocument} 
        className="flex items-center gap-2 w-full justify-start px-2 py-1.5 h-9"
      >
        {children}
      </Button>
    );
  }
);

BluetoothPrinter.displayName = "BluetoothPrinter";

export default BluetoothPrinterComponent; 