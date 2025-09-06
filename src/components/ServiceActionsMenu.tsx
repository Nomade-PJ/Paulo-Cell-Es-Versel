import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { 
  Edit, 
  MoreHorizontal, 
  Trash2, 
  Eye, 
  Printer, 
  ClipboardList, 
  CheckCircle,
  Download,
  Send,
  Bluetooth
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { useOrganization } from '@/hooks/useOrganization';
import ServiceThermalPrinter from './ServiceThermalPrinter';
import BluetoothPrinterComponent from '@/components/BluetoothPrinter';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyInfo } from '@/contexts/CompanyContext';

interface ServiceActionsMenuProps {
  service: any;
  onUpdate?: () => void;
}

const ServiceActionsMenu = ({ service, onUpdate }: ServiceActionsMenuProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { companyInfo } = useCompanyInfo();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [showBluetoothDialog, setShowBluetoothDialog] = useState(false);
  const { organizationId } = useOrganization();


  const handleEdit = () => {
    navigate(`/dashboard/service-registration/${service.customer_id}/${service.device_id}?serviceId=${service.id}`);
  };

  const handleDelete = async () => {
    try {
      if (!organizationId) {
        throw new Error('ID da organização não encontrado');
      }
      
      const { error } = await supabase
        .from("services")
        .delete()
        .eq('id', service.id)
        .eq('organization_id', organizationId);
        
      if (error) throw error;
      
      setDeleteDialogOpen(false);
      
      toast({
        title: "Serviço excluído",
        description: "O serviço foi excluído com sucesso."
      });
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir o serviço."
      });
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      if (!organizationId) {
        throw new Error('ID da organização não encontrado');
      }
      
      // Usar a função RPC para atualizar o status
      const { data, error } = await supabase
        .rpc('update_service_status', {
          p_service_id: service.id,
          p_organization_id: organizationId,
          p_status: newStatus
        });
        
      if (error) {
        console.error("Erro detalhado:", error);
        throw error;
      }
      
      // Verificar se a operação foi bem-sucedida
      if (!data || data.success === false) {
        const errorMsg = data?.error || 'Falha ao atualizar o status';
        console.error("Erro retornado pela função:", errorMsg);
        throw new Error(errorMsg);
      }
      
      const statusNames = {
        pending: "Pendente",
        in_progress: "Em andamento",
        waiting_parts: "Aguardando peças",
        completed: "Concluído",
        delivered: "Entregue"
      };
      
      toast({
        title: "Status atualizado",
        description: `O serviço agora está ${statusNames[newStatus as keyof typeof statusNames]}.`
      });
      
      // Força a atualização da lista
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error('Error updating service status:', error);
      
      // Mensagem de erro mais detalhada
      let errorMessage = "Ocorreu um erro ao atualizar o status do serviço.";
      if (error?.message) {
        errorMessage += ` Detalhes: ${error.message}`;
      }
      if (error?.code) {
        errorMessage += ` (Código: ${error.code})`;
      }
      
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: errorMessage
      });
    }
  };

  const handleViewDetails = () => {
    setDetailsDialogOpen(true);
  };

  // Format values for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusName = (status: string) => {
    const statusNames = {
      pending: "Pendente",
      in_progress: "Em andamento",
      waiting_parts: "Aguardando peças",
      completed: "Concluído",
      delivered: "Entregue"
    };
    return statusNames[status as keyof typeof statusNames] || status;
  };

  const getServiceTypeName = (type: string) => {
    const serviceTypes = {
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
      ? service.other_service_description 
      : serviceTypes[type as keyof typeof serviceTypes] || type;
  };

  // Preparar dados do serviço para impressão Bluetooth
  const getPrintableServiceData = () => {
    if (!service) return undefined;
    
    // Mapear status para nomes amigáveis
    const statusNames = {
      pending: "Pendente",
      in_progress: "Em andamento",
      waiting_parts: "Aguardando peças",
      completed: "Concluído",
      delivered: "Entregue"
    };
    
    // Mapear métodos de pagamento para nomes amigáveis
    const paymentMethods = {
      pending: "Pagamento Pendente",
      credit: "Crédito",
      debit: "Débito",
      pix: "Pix",
      cash: "Espécie"
    };
    
    return {
      serviceName: service.service_type === 'other' 
        ? service.other_service_description || 'Serviço Personalizado'
        : getServiceTypeName(service.service_type),
      customerName: service.customers?.name || 'Cliente não identificado',
      deviceInfo: `${service.devices?.brand || ''} ${service.devices?.model || ''}`.trim() || 'Dispositivo não especificado',
      price: Number(service.price) || 0,
      date: new Date(service.updated_at).toLocaleDateString('pt-BR'),
      status: statusNames[service.status as keyof typeof statusNames] || service.status,
      paymentMethod: service.payment_method ? paymentMethods[service.payment_method as keyof typeof paymentMethods] || service.payment_method : undefined,
      observations: service.observations || undefined,
      warrantyInfo: service.warranty_period 
        ? `${service.warranty_period} ${parseInt(service.warranty_period) === 1 ? 'mês' : 'meses'}`
        : undefined,
      companyInfo: companyInfo
    };
  };

  // Disable status options that don't make sense (e.g., can't go backward from delivered)
  const canChangeToInProgress = service.status !== 'completed' && service.status !== 'delivered';
  const canChangeToWaitingParts = service.status !== 'completed' && service.status !== 'delivered';
  const canChangeToCompleted = service.status !== 'delivered';

  // Modificar a função do onClick para implementar a impressão Bluetooth diretamente
  const handleBluetoothPrint = () => {
    setShowBluetoothDialog(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleViewDetails}>
            <Eye className="mr-2 h-4 w-4" />
            <span>Visualizar</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Editar</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <ServiceThermalPrinter service={service}>
              <Printer className="mr-2 h-4 w-4" />
              <span>Imprimir térmica</span>
            </ServiceThermalPrinter>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleBluetoothPrint}>
            <Bluetooth className="mr-2 h-4 w-4" />
            <span>Imprimir via Bluetooth</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel>Alterar Status</DropdownMenuLabel>
          
          {service.status !== 'pending' && (
            <DropdownMenuItem onClick={() => handleUpdateStatus('pending')}>
              <ClipboardList className="mr-2 h-4 w-4" />
              <span>Marcar como Pendente</span>
            </DropdownMenuItem>
          )}
          
          {canChangeToInProgress && service.status !== 'in_progress' && (
            <DropdownMenuItem onClick={() => handleUpdateStatus('in_progress')}>
              <ClipboardList className="mr-2 h-4 w-4 text-blue-500" />
              <span>Marcar como Em Andamento</span>
            </DropdownMenuItem>
          )}
          
          {canChangeToWaitingParts && service.status !== 'waiting_parts' && (
            <DropdownMenuItem onClick={() => handleUpdateStatus('waiting_parts')}>
              <ClipboardList className="mr-2 h-4 w-4 text-purple-500" />
              <span>Marcar como Aguardando Peças</span>
            </DropdownMenuItem>
          )}
          
          {canChangeToCompleted && service.status !== 'completed' && (
            <DropdownMenuItem onClick={() => handleUpdateStatus('completed')}>
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              <span>Marcar como Concluído</span>
            </DropdownMenuItem>
          )}
          
          {service.status !== 'delivered' && (
            <DropdownMenuItem onClick={() => handleUpdateStatus('delivered')}>
              <CheckCircle className="mr-2 h-4 w-4 text-gray-500" />
              <span>Marcar como Entregue</span>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => setDeleteDialogOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Excluir</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Service Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Serviço</DialogTitle>
            <DialogDescription>
              Informações completas da ordem de serviço
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium">Informações do Serviço</h4>
                <div className="mt-2 space-y-1 text-sm">
                  <p><span className="font-medium">Tipo:</span> {getServiceTypeName(service.service_type)}</p>
                  <p><span className="font-medium">Status:</span> {getStatusName(service.status)}</p>
                  <p><span className="font-medium">Valor:</span> {formatCurrency(service.price)}</p>
                  <p><span className="font-medium">Data de Criação:</span> {formatDate(service.created_at)}</p>
                  {service.updated_at && (
                    <p><span className="font-medium">Última Atualização:</span> {formatDate(service.updated_at)}</p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium">Cliente e Dispositivo</h4>
                <div className="mt-2 space-y-1 text-sm">
                  <p><span className="font-medium">Cliente:</span> {service.customers?.name || "Cliente não encontrado"}</p>
                  <p>
                    <span className="font-medium">Dispositivo:</span> 
                    {service.devices ? `${service.devices.brand} ${service.devices.model}` : "Dispositivo não encontrado"}
                  </p>
                  {service.payment_method && (
                    <p>
                      <span className="font-medium">Método de Pagamento:</span> 
                      {service.payment_method === 'pending' ? 'Pagamento Pendente' : 
                       service.payment_method === 'credit' ? 'Crédito' :
                       service.payment_method === 'debit' ? 'Débito' :
                       service.payment_method === 'pix' ? 'Pix' :
                       service.payment_method === 'cash' ? 'Espécie' :
                       service.payment_method}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium">Histórico de Status</h4>
              <div className="mt-2 space-y-1 text-sm">
                {service.pending_date && (
                  <p><span className="font-medium">Registrado como Pendente:</span> {formatDate(service.pending_date)}</p>
                )}
                {service.in_progress_date && (
                  <p><span className="font-medium">Em Andamento desde:</span> {formatDate(service.in_progress_date)}</p>
                )}
                {service.waiting_parts_date && (
                  <p><span className="font-medium">Aguardando Peças desde:</span> {formatDate(service.waiting_parts_date)}</p>
                )}
                {service.completed_date && (
                  <p><span className="font-medium">Concluído em:</span> {formatDate(service.completed_date)}</p>
                )}
                {service.delivery_date && (
                  <p><span className="font-medium">Entregue em:</span> {formatDate(service.delivery_date)}</p>
                )}
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium">Descrição do Serviço</h4>
              <div className="mt-2">
                <p className="text-sm whitespace-pre-wrap">{service.description || "Sem descrição detalhada"}</p>
              </div>
            </div>

            {service.diagnosis && (
              <div className="border-t pt-4">
                <h4 className="font-medium">Diagnóstico</h4>
                <div className="mt-2">
                  <p className="text-sm whitespace-pre-wrap">{service.diagnosis}</p>
                </div>
              </div>
            )}
            
            {service.parts_used && (
              <div className="border-t pt-4">
                <h4 className="font-medium">Peças Utilizadas</h4>
                <div className="mt-2">
                  <p className="text-sm whitespace-pre-wrap">{service.parts_used}</p>
                </div>
              </div>
            )}
            
            {service.notes && (
              <div className="border-t pt-4">
                <h4 className="font-medium">Observações</h4>
                <div className="mt-2">
                  <p className="text-sm whitespace-pre-wrap">{service.notes}</p>
                </div>
              </div>
            )}
            
            <div className="border-t pt-4">
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setDetailsDialogOpen(false);
                    handleEdit();
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Serviço
                </Button>
                
                <div className="flex gap-2">
                  <ServiceThermalPrinter service={service}>
                    <Button variant="outline">
                      <Printer className="mr-2 h-4 w-4" />
                      Imprimir Comprovante
                    </Button>
                  </ServiceThermalPrinter>
                  
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setDetailsDialogOpen(false);
                      // Dar um pequeno tempo para o diálogo fechar antes de iniciar a impressão
                      setTimeout(() => handleBluetoothPrint(), 100);
                    }}
                  >
                    <Bluetooth className="mr-2 h-4 w-4" />
                    Imprimir via Bluetooth
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bluetooth Printer Dialog */}
      <Dialog open={showBluetoothDialog} onOpenChange={setShowBluetoothDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Impressão Bluetooth</DialogTitle>
            <DialogDescription>
              Conecte-se a uma impressora térmica Bluetooth para imprimir o comprovante.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <BluetoothPrinterComponent
              serviceData={getPrintableServiceData()}
              onSuccess={() => {
                setShowBluetoothDialog(false);
                toast({
                  title: "Impressão iniciada",
                  description: "O comprovante está sendo impresso via Bluetooth."
                });
              }}
              onError={(error) => {
                toast({
                  variant: "destructive",
                  title: "Erro na impressão",
                  description: `Não foi possível imprimir: ${error.message}`
                });
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ServiceActionsMenu;
