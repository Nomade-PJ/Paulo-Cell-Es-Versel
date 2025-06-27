import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PageHeader } from "@/components/PageHeader";
import { Wrench, Search, Plus, CalendarIcon, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabaseClient";
import { useOrganization } from '@/hooks/useOrganization';
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import ServiceActionsMenu from "@/components/ServiceActionsMenu";
import BluetoothPrinterComponent from "@/components/BluetoothPrinter";

// Status badge colors
const statusColors = {
  pending: "bg-yellow-500",
  in_progress: "bg-blue-500",
  waiting_parts: "bg-purple-500",
  completed: "bg-green-500",
  delivered: "bg-gray-500"
};

// Status display names
const statusNames = {
  pending: "Pendente",
  in_progress: "Em andamento",
  waiting_parts: "Aguardando peças",
  completed: "Concluído",
  delivered: "Entregue"
};

const Services = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // Using "all" instead of empty string
  const [loading, setLoading] = useState(true);
  const { organizationId, loading: orgLoading } = useOrganization();
  const [calendarDate, setCalendarDate] = useState(null);
  const [showCalendarFilter, setShowCalendarFilter] = useState(false);

  // Fetch services on component mount
  useEffect(() => {
    if (!orgLoading) {
      fetchServices();
    }
  }, [organizationId, orgLoading]);

  // Fetch services from the database
  const fetchServices = async () => {
    try {
      setLoading(true);
      
      if (!organizationId) {
        console.warn("ID da organização não encontrado");
        setServices([]);
        setFilteredServices([]);
        return;
      }
      
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
        .order('created_at', { ascending: false });
        
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
      setLoading(false);
    }
  };
  
  // Apply filters when search term, status filter, or calendar date changes
  useEffect(() => {
    let filtered = services;
    
    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(service => 
        service.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${service.devices?.brand} ${service.devices?.model}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(service => service.status === statusFilter);
    }
    
    // Apply calendar date filter 
    if (calendarDate && isValid(calendarDate)) {
      const selectedDate = format(calendarDate, 'yyyy-MM-dd');
      filtered = filtered.filter(service => {
        // Determine which date field to use based on status
        let dateField = 'updated_at';
        
        // Função auxiliar para verificar se um campo de data existe
        const hasField = (field: string) => service[field] && service[field] !== null;
        
        // Use specific date fields based on service status or selected status filter
        if (statusFilter !== 'all') {
          // Use the date field corresponding to the filtered status
          switch (statusFilter) {
            case 'pending':
              dateField = hasField('pending_date') ? 'pending_date' : 'updated_at';
              break;
            case 'in_progress':
              dateField = hasField('in_progress_date') ? 'in_progress_date' : 'updated_at';
              break;
            case 'waiting_parts':
              dateField = hasField('waiting_parts_date') ? 'waiting_parts_date' : 'updated_at';
              break;
            case 'completed':
              dateField = hasField('completed_date') ? 'completed_date' : 'updated_at';
              break;
            case 'delivered':
              dateField = hasField('delivery_date') ? 'delivery_date' : 'updated_at';
              break;
          }
        } else {
          // If no status filter, use the date field corresponding to the service's current status
          switch (service.status) {
            case 'pending':
              dateField = hasField('pending_date') ? 'pending_date' : 'updated_at';
              break;
            case 'in_progress':
              dateField = hasField('in_progress_date') ? 'in_progress_date' : 'updated_at';
              break;
            case 'waiting_parts':
              dateField = hasField('waiting_parts_date') ? 'waiting_parts_date' : 'updated_at';
              break;
            case 'completed':
              dateField = hasField('completed_date') ? 'completed_date' : 'updated_at';
              break;
            case 'delivered':
              dateField = hasField('delivery_date') ? 'delivery_date' : 'updated_at';
              break;
          }
        }
        
        // Skip if the required date field is still missing
        if (!service[dateField]) return false;
        
        try {
          const serviceDate = format(new Date(service[dateField]), 'yyyy-MM-dd');
          return serviceDate === selectedDate;
        } catch (e) {
          // If there's an error parsing the date, skip this record
          console.error(`Error parsing date for service ${service.id}:`, e);
          return false;
        }
      });
    }
    
    setFilteredServices(filtered);
  }, [searchTerm, statusFilter, services, calendarDate]);
  
  // Format price as currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Handle service edit
  const handleEdit = (service) => {
    navigate(`/dashboard/service-registration/${service.customer_id}/${service.device_id}?serviceId=${service.id}`);
  };
  
  // Clear date filter
  const clearDateFilter = () => {
    setCalendarDate(null);
    setShowCalendarFilter(false);
  };
  
  // Render status badge with appropriate color
  const renderStatusBadge = (status) => {
    return (
      <Badge className={statusColors[status]}>
        {statusNames[status] || status}
      </Badge>
    );
  };

  // Adicionar função getServiceTypeName baseada no que vimos no componente ServiceActionsMenu
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

  // Atualizar a função getPrintableServiceData
  const getPrintableServiceData = (service: any) => {
    if (!service) return undefined;
    
    return {
      serviceName: service.service_type === 'other' 
        ? service.other_service_description || 'Serviço Personalizado'
        : getServiceTypeName(service.service_type),
      customerName: service.customers?.name || 'Cliente não identificado',
      deviceInfo: `${service.devices?.brand || ''} ${service.devices?.model || ''}`.trim() || 'Dispositivo não especificado',
      price: Number(service.price) || 0,
      date: new Date(service.updated_at).toLocaleDateString('pt-BR'),
      observations: service.observations || undefined,
      warrantyInfo: service.warranty_period 
        ? `${service.warranty_period} ${parseInt(service.warranty_period) === 1 ? 'mês' : 'meses'}`
        : undefined
    };
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Serviços" 
        description="Gerenciamento de ordens de serviço"
      >
        <Wrench className="h-6 w-6" />
      </PageHeader>
      
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar serviços..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="in_progress">Em andamento</SelectItem>
                <SelectItem value="waiting_parts">Aguardando peças</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2">
              <Popover open={showCalendarFilter} onOpenChange={setShowCalendarFilter}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={`w-full sm:w-auto flex gap-2 ${calendarDate ? 'text-primary' : ''}`}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    {calendarDate ? (
                      format(calendarDate, "dd/MM/yyyy")
                    ) : (
                      "Filtrar por data"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={calendarDate}
                    onSelect={date => {
                      setCalendarDate(date);
                      setShowCalendarFilter(false);
                    }}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              
              {calendarDate && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={clearDateFilter}
                  title="Limpar filtro de data"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          <Button className="w-full sm:w-auto" onClick={() => navigate("/dashboard/user-registration")}>
            <Plus className="h-4 w-4 mr-2" /> Novo Serviço
          </Button>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Dispositivo</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableCaption>
              {calendarDate && (
                <div className="text-sm text-muted-foreground">
                  Filtrando serviços por data: {format(calendarDate, "dd/MM/yyyy")}
                  {statusFilter !== 'all' && ` (Status: ${statusNames[statusFilter]})`}
                </div>
              )}
            </TableCaption>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Carregando serviços...
                  </TableCell>
                </TableRow>
              ) : filteredServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Nenhum serviço encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>{service.customers?.name || "Cliente não encontrado"}</TableCell>
                    <TableCell>
                      {service.devices ? 
                        `${service.devices.brand} ${service.devices.model}` : 
                        "Dispositivo não encontrado"
                      }
                    </TableCell>
                    <TableCell>
                      {service.service_type === 'other' 
                        ? service.other_service_description 
                        : getServiceLabel(service.service_type)}
                    </TableCell>
                    <TableCell>{formatCurrency(service.price || 0)}</TableCell>
                    <TableCell>{renderStatusBadge(service.status)}</TableCell>
                    <TableCell className="text-right">
                      <ServiceActionsMenu 
                        service={service}
                        onUpdate={fetchServices}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

// Helper function to get human-readable service types
const getServiceLabel = (serviceType) => {
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
  
  return serviceTypes[serviceType] || serviceType;
};

export default Services;
