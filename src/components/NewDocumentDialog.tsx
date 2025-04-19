import React, { useState, useRef, forwardRef, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilePlus, Eye, FileEdit, SplitSquareHorizontal } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabaseClient";
import DocumentPreview from "./DocumentPreview";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { format } from "date-fns";

interface NewDocumentDialogProps {
  onDocumentCreated?: () => void;
}

// Função auxiliar para obter o título do documento com base no tipo
const getDocumentTitle = (type: string): string => {
  switch (type) {
    case "nf":
      return "NOTA FISCAL ELETRÔNICA";
    case "nfce":
      return "NOTA FISCAL DE CONSUMIDOR ELETRÔNICA";
    case "nfs":
      return "NOTA FISCAL DE SERVIÇO ELETRÔNICA";
    default:
      return "DOCUMENTO FISCAL";
  }
};

const documentSchema = z.object({
  documentType: z.string().min(1, "Selecione o tipo de documento"),
  customerName: z.string().min(1, "Informe o nome do cliente"),
  totalValue: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Valor deve ser maior que zero",
  }),
  description: z.string().optional(),
});

type DocumentFormValues = z.infer<typeof documentSchema>;

const NewDocumentDialog = ({ onDocumentCreated }: NewDocumentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [documentType, setDocumentType] = useState<"nf" | "nfce" | "nfs">("nf");
  const [customerName, setCustomerName] = useState<string>("");
  const [totalValue, setTotalValue] = useState<string>("0");
  const [description, setDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("form");
  const [document, setDocument] = useState<any>(null);
  const [previewEnabled, setPreviewEnabled] = useState(false);
  const [viewMode, setViewMode] = useState<"tabs" | "split">("tabs");
  const documentPreviewRef = useRef<any>(null);
  const { user } = useAuth();
  const { organizationId } = useOrganization();
  
  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      documentType: "",
      customerName: "",
      totalValue: "",
      description: "",
    },
  });

  // Atualizar pré-visualização quando campos importantes mudam
  useEffect(() => {
    if (customerName || totalValue || documentType) {
      try {
        updatePreview();
        setPreviewEnabled(true);
      } catch (err) {
        // Silenciosamente ignore erros durante a atualização automática
        console.log("Não foi possível atualizar a pré-visualização automaticamente:", err);
      }
    }
  }, [customerName, totalValue, documentType, description]);

  // Função auxiliar para atualizar a pré-visualização
  const updatePreview = () => {
    // Criar um documento temporário para pré-visualização
    const fiscalData = generateFiscalData(documentType);
    const parsedValue = parseFloat(totalValue);
    
    const previewDoc = {
      type: documentType,
      number: fiscalData.number,
      customer_name: customerName || "Cliente",
      customer_id: "cliente-padrao", 
      total_value: isNaN(parsedValue) ? 0 : parsedValue,
      description: description,
      issue_date: fiscalData.issue_date,
      authorization_date: fiscalData.authorization_date,
      status: "draft",
      access_key: fiscalData.access_key
    };
    
    setDocument(previewDoc);
  };

  const validateDocument = () => {
    if (!documentType || !customerName || !totalValue) {
      throw new Error("Preencha todos os campos obrigatórios.");
    }

    const value = parseFloat(totalValue);
    if (isNaN(value)) {
      throw new Error("O valor total deve ser um número válido.");
    }
    
    if (value < 0) {
      throw new Error("O valor total não pode ser negativo.");
    }

    // Validações específicas por tipo de documento
    switch (documentType) {
      case 'nfce':
        if (customerName.trim().length < 2) {
          throw new Error("Nome do cliente inválido para NFC-e.");
        }
        break;
      case 'nf':
        const nameParts = customerName.trim().split(' ');
        if (nameParts.length < 2 || nameParts[0].length < 2) {
          throw new Error("Nome completo do cliente é obrigatório para NF-e.");
        }
        break;
    }
  };

  // Função para gerar dados fiscais
  const generateFiscalData = (type: string) => {
    const now = new Date();
    const timestamp = now.getTime();
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    // Gerar número de série baseado no tipo de documento
    const seriesNumber = type === 'nf' ? '001' : 
                          type === 'nfce' ? '002' : '003';
    
    // Gerar número de documento
    const documentNumber = `${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`;
    
    // Gerar chave de acesso de 44 dígitos (com estrutura apropriada)
    const uf = '35'; // São Paulo
    const aamm = `${now.getFullYear().toString().substring(2)}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const cnpj = '12345678901234';
    const modelo = type === 'nf' ? '55' : type === 'nfce' ? '65' : '57';
    const numero = documentNumber.padStart(9, '0');
    const chaveExtra = timestamp.toString().substring(0, 9);
    const dv = '0'; // Dígito verificador
    
    const accessKey = `${uf}${aamm}${cnpj}${modelo}${seriesNumber}${numero}${chaveExtra}${dv}`;
    
    // Retornar objeto com todos os dados fiscais
    return {
      number: `${type.toUpperCase()}-${seriesNumber}-${documentNumber}`,
      series: seriesNumber,
      access_key: accessKey,
      authorization_date: now.toISOString(),
      issue_date: now.toISOString(),
      protocol_number: `${now.getFullYear()}${randomPart}${timestamp.toString().substring(5, 13)}`
    };
  };

  const handleSubmit = async (values: DocumentFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Gerar número do documento com prefixo baseado no tipo
      const prefix = values.documentType === 'nf' ? 'NF-' : 
                    values.documentType === 'nfce' ? 'NFCe-' : 'NFS-';
      
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const documentNumber = `${prefix}${randomNum}`;
      
      // Verificar se o usuário está autenticado e tem organization_id
      const userId = user?.id;
      
      if (!userId) {
        throw new Error("Usuário não autenticado. Faça login novamente.");
      }
      
      if (!organizationId) {
        throw new Error("Não foi possível determinar a organização do usuário.");
      }
      
      // Criar o novo documento associado à organização do usuário
      const { error } = await supabase
        .from('documentos')
        .insert({
          id: crypto.randomUUID(),
          type: values.documentType,
          number: documentNumber,
          customer_name: values.customerName,
          customer_id: 'generic-customer',
          total_value: parseFloat(values.totalValue),
          description: values.description || null,
          issue_date: new Date().toISOString(),
          status: 'authorized',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: userId,
          organization_id: organizationId  // Associar à organização do usuário
        });
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Documento Emitido",
        description: `${documentNumber} emitido com sucesso!`,
      });
      
      form.reset();
      setOpen(false);
      
      if (onDocumentCreated) {
        onDocumentCreated();
      }
    } catch (error: any) {
      console.error('Erro ao emitir documento:', error);
      toast({
        variant: "destructive",
        title: "Erro ao emitir",
        description: error.message || "Não foi possível emitir o documento."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form function
  const resetForm = () => {
    setDocumentType("nf");
    setCustomerName("");
    setTotalValue("0");
    setDescription("");
    setDocument(null);
    setActiveTab("form");
    setPreviewEnabled(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset the form when dialog closes
      resetForm();
    }
  };

  // Renderizar a pré-visualização do documento
  const renderDocumentPreview = () => {
    if (!document) return null;

    return (
      <DocumentPreview
        ref={documentPreviewRef}
        type={document.type}
        number={document.number}
        customerName={document.customer_name}
        value={document.total_value}
        date={new Date(document.issue_date)}
        description={document.description}
        accessKey={document.access_key}
        status={document.status}
      />
    );
  };

  // Alternar entre modo de abas e modo dividido
  const toggleViewMode = () => {
    setViewMode(viewMode === "tabs" ? "split" : "tabs");
  };

  const renderFormContent = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="documentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Documento</FormLabel>
              <FormControl>
                <Select 
                  value={field.value} 
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nf">Nota Fiscal Eletrônica (NF-e)</SelectItem>
                    <SelectItem value="nfce">Nota Fiscal de Consumidor (NFC-e)</SelectItem>
                    <SelectItem value="nfs">Nota Fiscal de Serviço (NFS-e)</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="customerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Cliente</FormLabel>
              <FormControl>
                <Input placeholder="Digite o nome completo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="totalValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor Total (R$)</FormLabel>
              <FormControl>
                <Input placeholder="0,00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descrição ou observações do documento..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <DialogFooter className="pt-4">
          <Button 
            variant="outline" 
            type="button"
            onClick={toggleViewMode}
          >
            <SplitSquareHorizontal className="mr-2 h-4 w-4" />
            {viewMode === "tabs" ? "Visualização lado a lado" : "Visualização em abas"}
          </Button>
          
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="ml-auto"
          >
            {isSubmitting ? "Emitindo..." : "Emitir Documento"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-1">
          <FilePlus className="h-4 w-4" />
          Novo Documento
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Emitir Novo Documento Fiscal</DialogTitle>
          <DialogDescription>
            Preencha as informações para emitir um novo documento fiscal.
          </DialogDescription>
        </DialogHeader>
        
        {viewMode === "tabs" ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="form">
                <FileEdit className="mr-2 h-4 w-4" />
                Formulário
              </TabsTrigger>
              <TabsTrigger value="preview" disabled={!previewEnabled}>
                <Eye className="mr-2 h-4 w-4" />
                Pré-visualização
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="form" className="space-y-4 py-4">
              {renderFormContent()}
            </TabsContent>
            
            <TabsContent value="preview" className="py-4">
              {renderDocumentPreview()}
            </TabsContent>
          </Tabs>
        ) : (
          // Modo dividido (side-by-side)
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-md p-4">
              <h3 className="text-sm font-medium mb-2">Formulário</h3>
              {renderFormContent()}
            </div>
            
            <div className="border rounded-md p-4">
              <h3 className="text-sm font-medium mb-2">Pré-visualização</h3>
              {previewEnabled ? renderDocumentPreview() : (
                <div className="flex items-center justify-center h-64 text-gray-400">
                  Preencha o formulário para visualizar
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewDocumentDialog;
