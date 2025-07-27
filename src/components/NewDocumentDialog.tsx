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
import { FilePlus, Eye, FileEdit, SplitSquareHorizontal, Plus, Trash2, Search } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

// Interface para serviço selecionado
interface ServiceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  customer_name?: string; // Nome do cliente para facilitar o preenchimento automático
  device_info?: string; // Informação do dispositivo para a descrição
}

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
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [filteredServices, setFilteredServices] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  
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
      
      // Gerar dados fiscais usando a função existente
      const fiscalData = generateFiscalData(values.documentType);
      
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
          number: fiscalData.number, // Usar o número gerado pelos dados fiscais
          customer_name: values.customerName,
          customer_id: 'generic-customer',
          total_value: parseFloat(values.totalValue),
          description: values.description || null,
          issue_date: fiscalData.issue_date, // Usar a data gerada pelos dados fiscais
          access_key: fiscalData.access_key, // Incluir a chave de acesso
          authorization_date: fiscalData.authorization_date, // Incluir a data de autorização
          protocol_number: fiscalData.protocol_number, // Incluir o número de protocolo
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
        description: `${fiscalData.number} emitido com sucesso!`,
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
              <div className="flex gap-2">
                <FormControl>
                  <Input placeholder="0,00" {...field} />
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setServiceModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Serviços
                </Button>
              </div>
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

  // Buscar serviços
  useEffect(() => {
    if (serviceModalOpen && organizationId) {
      fetchServices();
    }
  }, [serviceModalOpen, organizationId]);
  
  // Filtrar serviços com base na busca
  useEffect(() => {
    if (services.length > 0) {
      const filtered = services.filter(service => {
        const serviceType = getServiceTypeName(service.service_type, service.other_service_description);
        const customerName = service.customers?.name || '';
        const deviceInfo = `${service.devices?.brand || ''} ${service.devices?.model || ''}`;
        
        const searchLower = searchTerm.toLowerCase();
        return serviceType.toLowerCase().includes(searchLower) || 
               customerName.toLowerCase().includes(searchLower) || 
               deviceInfo.toLowerCase().includes(searchLower);
      });
      
      setFilteredServices(filtered);
    }
  }, [searchTerm, services]);
  
  // Função para buscar serviços concluídos
  const fetchServices = async () => {
    try {
      setIsLoadingServices(true);
      
      const { data, error } = await supabase
        .from("services")
        .select(`
          *,
          customers (
            name
          ),
          devices (
            brand,
            model
          )
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'completed')
        .order('updated_at', { ascending: false });
        
      if (error) throw error;
      
      setServices(data || []);
      setFilteredServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os serviços.",
      });
    } finally {
      setIsLoadingServices(false);
    }
  };
  
  // Função para obter o nome do tipo de serviço
  const getServiceTypeName = (type: string, otherDescription?: string | null): string => {
    const serviceTypes: Record<string, string> = {
      screen_repair: "Troca de Tela",
      battery_replacement: "Troca de Bateria",
      water_damage: "Dano por Água",
      software_issue: "Problema de Software",
      charging_port: "Porta de Carregamento",
      button_repair: "Reparo de Botões",
      camera_repair: "Reparo de Câmera",
      mic_speaker_repair: "Reparo de Microfone/Alto-falante",
      diagnostics: "Diagnóstico Completo",
      unlocking: "Desbloqueio",
      data_recovery: "Recuperação de Dados",
    };
    
    return type === 'other' 
      ? otherDescription || 'Outro serviço'
      : serviceTypes[type] || type;
  };
  
  // Função para adicionar um serviço à lista de selecionados
  const addServiceToDocument = (service: any) => {
    const serviceItem: ServiceItem = {
      id: service.id,
      name: getServiceTypeName(service.service_type, service.other_service_description),
      description: `${service.devices?.brand || ''} ${service.devices?.model || ''} - ${service.customers?.name || ''}`,
      price: service.price || 0,
      customer_name: service.customers?.name || '',
      device_info: `${service.devices?.brand || ''} ${service.devices?.model || ''}`
    };
    
    setSelectedServices(prev => [...prev, serviceItem]);
    
    // Recalcular o valor total
    const newTotal = selectedServices.reduce((sum, item) => sum + item.price, 0) + serviceItem.price;
    setTotalValue(newTotal.toString());
    form.setValue("totalValue", newTotal.toString());
    
    // Atualizar a descrição
    updateDescriptionWithServices([...selectedServices, serviceItem]);
    
    toast({
      title: "Serviço adicionado",
      description: `${serviceItem.name} foi adicionado ao documento.`,
    });
  };
  
  // Função para remover um serviço da lista
  const removeServiceFromDocument = (serviceId: string) => {
    const serviceToRemove = selectedServices.find(s => s.id === serviceId);
    if (serviceToRemove) {
      setSelectedServices(prev => prev.filter(s => s.id !== serviceId));
      
      // Recalcular o valor total
      const newTotal = selectedServices.filter(s => s.id !== serviceId).reduce((sum, item) => sum + item.price, 0);
      setTotalValue(newTotal.toString());
      form.setValue("totalValue", newTotal.toString());
      
      // Atualizar a descrição
      updateDescriptionWithServices(selectedServices.filter(s => s.id !== serviceId));
      
      toast({
        title: "Serviço removido",
        description: `${serviceToRemove.name} foi removido do documento.`,
      });
    }
  };
  
  // Função para atualizar a descrição com os serviços selecionados
  const updateDescriptionWithServices = (services: ServiceItem[]) => {
    if (services.length === 0) {
      setDescription("");
      form.setValue("description", "");
      return;
    }
    
    let serviceText = "Serviços inclusos:\n";
    services.forEach((service, index) => {
      serviceText += `${index + 1}. ${service.name} - ${service.device_info || ''}\n`;
      if (service.price) {
        serviceText += `   Valor: R$ ${service.price.toFixed(2)}\n`;
      }
    });
    
    setDescription(serviceText);
    form.setValue("description", serviceText);
  };
  
  // Função para fechar o modal de serviços e atualizar o formulário principal
  const handleServiceModalClose = () => {
    // Se não há serviços selecionados, apenas fechamos o modal
    if (selectedServices.length === 0) {
      setServiceModalOpen(false);
      return;
    }
    
    // Extrair nome do cliente do primeiro serviço
    if (!customerName && selectedServices.length > 0) {
      const firstService = selectedServices[0];
      if (firstService.customer_name) {
        setCustomerName(firstService.customer_name);
        form.setValue("customerName", firstService.customer_name);
      }
    }
    
    // Selecionar automaticamente o tipo de documento se não estiver selecionado
    if (!form.getValues("documentType")) {
      // Se tiver apenas serviços, usar NFS (Nota Fiscal de Serviço)
      setDocumentType("nfs");
      form.setValue("documentType", "nfs");
    }
    
    // Calcular o valor total e preencher o campo (já fazemos isso ao adicionar serviços)
    // mas garantimos que esteja no formato correto
    const totalValue = selectedServices.reduce((total, service) => total + service.price, 0);
    setTotalValue(totalValue.toFixed(2));
    form.setValue("totalValue", totalValue.toFixed(2));
    
    // Atualizamos a pré-visualização
    updatePreview();
    
    // Fechamos o modal
    setServiceModalOpen(false);
  };

  return (
    <>
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
      
      {/* Modal de Serviços */}
      <Dialog open={serviceModalOpen} onOpenChange={setServiceModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Adicionar Serviços ao Documento</DialogTitle>
            <DialogDescription>
              Selecione os serviços que deseja incluir neste documento fiscal.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4">
            {/* Lista de serviços selecionados */}
            {selectedServices.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Serviços Selecionados</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Dispositivo</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedServices.map(service => (
                      <TableRow key={service.id}>
                        <TableCell>{service.name}</TableCell>
                        <TableCell>{service.customer_name || "-"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{service.device_info || "-"}</TableCell>
                        <TableCell className="text-right">R$ {service.price.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeServiceFromDocument(service.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={2} className="font-medium">Total</TableCell>
                      <TableCell className="text-right font-medium">
                        R$ {selectedServices.reduce((total, service) => total + service.price, 0).toFixed(2)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
            
            {/* Campo de busca de serviços */}
            <div>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar serviços..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            {/* Tabela de serviços disponíveis */}
            <ScrollArea className="h-[300px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Cliente/Dispositivo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingServices ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10">
                        Carregando serviços...
                      </TableCell>
                    </TableRow>
                  ) : filteredServices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10">
                        Nenhum serviço encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredServices.map(service => {
                      const isSelected = selectedServices.some(s => s.id === service.id);
                      return (
                        <TableRow key={service.id} className={isSelected ? "bg-muted" : ""}>
                          <TableCell>
                            {getServiceTypeName(service.service_type, service.other_service_description)}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div>{service.customers?.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {service.devices?.brand} {service.devices?.model}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            R$ {Number(service.price).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant={isSelected ? "ghost" : "secondary"}
                              size="sm"
                              className="w-full"
                              disabled={isSelected}
                              onClick={() => addServiceToDocument(service)}
                            >
                              {isSelected ? "Adicionado" : "Adicionar"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleServiceModalClose}>
              Concluído
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NewDocumentDialog;
