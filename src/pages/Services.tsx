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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Wrench, Search, Plus, CalendarIcon, X, CreditCard, QrCode, Banknote, Clock, ChevronDown, Check, User, Smartphone, MapPin, DollarSign } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabaseClient";
import { useOrganization } from '@/hooks/useOrganization';
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import ServiceActionsMenu from "@/components/ServiceActionsMenu";
import BluetoothPrinterComponent from "@/components/BluetoothPrinter";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
  const [paymentFilter, setPaymentFilter] = useState("all"); // Filtro de pagamentos
  const [loading, setLoading] = useState(true);
  const { organizationId, loading: orgLoading } = useOrganization();
  const [calendarDate, setCalendarDate] = useState(null);
  const [showCalendarFilter, setShowCalendarFilter] = useState(false);
  const [activePaymentMethod, setActivePaymentMethod] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 20; // Carregar 20 serviços por vez

  // Scroll infinito
  const [isNearBottom, setIsNearBottom] = useState(false);

  // Fetch services on component mount
  useEffect(() => {
    if (!orgLoading) {
      fetchServices();
    }
  }, [organizationId, orgLoading]);

  // Fetch services from the database with pagination
  const fetchServices = async (page = 1, resetData = true) => {
    try {
      if (resetData) {
        setLoading(true);
        setCurrentPage(1);
      } else {
        setLoadingMore(true);
      }
      
      if (!organizationId) {
        console.warn("ID da organização não encontrado");
        setServices([]);
        setFilteredServices([]);
        return;
      }

      // Calcular offset para paginação
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // Buscar dados com paginação
      const { data, error, count } = await supabase
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
        `, { count: 'exact' })
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .range(from, to);
        
      if (error) throw error;
      
      // Atualizar estados
      setTotalCount(count || 0);
      setHasMore((data?.length || 0) === ITEMS_PER_PAGE);
      
      if (resetData) {
        // Primeira carga ou reset
        setServices(data || []);
        setCurrentPage(1);
      } else {
        // Carregamento adicional (scroll infinito)
        setServices(prev => [...prev, ...(data || [])]);
        setCurrentPage(page);
      }
      
    } catch (error) {
      console.error("Error fetching services:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os serviços.",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Função para carregar mais serviços (com filtros aplicados)
  const loadMoreServices = async () => {
    if (!hasMore || loadingMore) return;
    
    const nextPage = currentPage + 1;
    await searchServices(searchTerm, statusFilter, paymentFilter, calendarDate, nextPage, false);
  };

  // Função de busca otimizada usando RPC
  const searchServices = async (term = "", status = "all", payment = "all", date = null, page = 1, resetData = true) => {
    try {
      if (resetData) {
        setLoading(true);
        setCurrentPage(1);
      } else {
        setLoadingMore(true);
      }
      
      if (!organizationId) {
        setServices([]);
        setFilteredServices([]);
        return;
      }

      // Calcular offset para paginação
      const offset = (page - 1) * ITEMS_PER_PAGE;

      // Usar a função RPC para busca
      const { data, error } = await supabase.rpc('search_services', {
        search_term: term || null,
        org_id: organizationId,
        status_filter: status,
        payment_filter: payment,
        date_filter: date ? date.toISOString() : null,
        page_offset: offset,
        page_limit: ITEMS_PER_PAGE
      });
        
      if (error) throw error;
      
      // Transformar os dados para o formato esperado pelo componente
      const transformedData = data?.map(service => ({
        ...service,
        customers: { name: service.customer_name },
        devices: { brand: service.device_brand, model: service.device_model }
      })) || [];
      
      // Para calcular o total, fazer uma busca separada apenas com count
      const { count } = await supabase.rpc('search_services', {
        search_term: term || null,
        org_id: organizationId,
        status_filter: status,
        payment_filter: payment,
        date_filter: date ? date.toISOString() : null,
        page_offset: 0,
        page_limit: 999999
      });
      
      setTotalCount(count || transformedData.length);
      setHasMore((transformedData?.length || 0) === ITEMS_PER_PAGE);
      
      if (resetData) {
        // Primeira carga ou reset
        setServices(transformedData);
        setCurrentPage(1);
      } else {
        // Carregamento adicional (scroll infinito)
        setServices(prev => [...prev, ...transformedData]);
        setCurrentPage(page);
      }
      
    } catch (error) {
      console.error("Error searching services:", error);
      toast({
        variant: "destructive",
        title: "Erro na busca",
        description: "Não foi possível buscar os serviços.",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };
  
  // Apply filters when search term, status filter, or calendar date changes
  useEffect(() => {
    // Debounce para evitar muitas consultas
    const timeoutId = setTimeout(() => {
      searchServices(searchTerm, statusFilter, paymentFilter, calendarDate);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, paymentFilter, calendarDate, organizationId]);

  // Sincronizar filteredServices quando services mudar (para atualizações em tempo real)
  useEffect(() => {
    setFilteredServices(services);
  }, [services]);

  // Função para atualizar um serviço específico mantendo o filtro
  const handleServiceUpdate = async (serviceId: string, newStatus?: string) => {
    try {
      // Buscar o serviço atualizado
      const { data: updatedService, error } = await supabase
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
        .eq('id', serviceId)
        .eq('organization_id', organizationId)
        .single();

      if (error) throw error;

      // Verificar se o serviço ainda se encaixa no filtro atual
      const shouldRemoveFromCurrentFilter = () => {
        if (statusFilter === 'all') return false;
        return updatedService.status !== statusFilter;
      };

      if (shouldRemoveFromCurrentFilter()) {
        // Remover da lista atual se não se encaixar mais no filtro
        setServices(prev => prev.filter(s => s.id !== serviceId));
        setFilteredServices(prev => prev.filter(s => s.id !== serviceId));
        setTotalCount(prev => prev - 1);
      } else {
        // Atualizar o item na lista
        setServices(prev => prev.map(s => s.id === serviceId ? updatedService : s));
        setFilteredServices(prev => prev.map(s => s.id === serviceId ? updatedService : s));
      }

    } catch (error) {
      console.error('Error updating service in list:', error);
      // Em caso de erro, recarregar a lista mantendo os filtros
      searchServices(searchTerm, statusFilter, paymentFilter, calendarDate);
    }
  };

  // Scroll infinito - detectar quando usuário está próximo do final
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      
      // Carrega mais quando está a 200px do final
      const nearBottom = scrollTop + clientHeight >= scrollHeight - 200;
      setIsNearBottom(nearBottom);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Carregar mais dados automaticamente quando próximo do final
  useEffect(() => {
    if (isNearBottom && hasMore && !loading && !loadingMore && filteredServices.length > 0) {
      loadMoreServices();
    }
  }, [isNearBottom, hasMore, loading, loadingMore, filteredServices.length]);
  
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

  // Métodos de pagamento
  const paymentMethods = {
    pending: "Pagamento Pendente",
    credit: "Crédito",
    debit: "Débito",
    pix: "Pix",
    cash: "Espécie",
  };

  const updatePaymentMethod = async (serviceId: string, method: string) => {
    try {
      // Atualizar apenas o método de pagamento, sem alterar o status
      const updateData = { payment_method: method };
      
      const { error } = await supabase
        .from("services")
        .update(updateData)
        .eq("id", serviceId)
        .eq('organization_id', organizationId); // Adicionando filtro por organization_id para RLS

      if (error) throw error;

      setActivePaymentMethod(null);
      
      toast({
        title: "Serviço atualizado",
        description: `Método de pagamento atualizado para ${paymentMethods[method]}.`,
      });
      
      fetchServices();
    } catch (error) {
      console.error("Error updating payment method:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar serviço",
        description: "Não foi possível atualizar o método de pagamento.",
      });
    }
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

  // Componente para renderizar serviço em card (mobile)
  const ServiceCard = ({ service }) => {
    const getPaymentIcon = (paymentMethod) => {
      switch (paymentMethod) {
        case 'pix': return <QrCode className="h-4 w-4" />;
        case 'cash': return <Banknote className="h-4 w-4" />;
        case 'credit':
        case 'debit': return <CreditCard className="h-4 w-4" />;
        default: return <Clock className="h-4 w-4 text-yellow-500" />;
      }
    };

    const paymentMethods = {
      pending: "Pendente",
      credit: "Crédito",
      debit: "Débito",
      pix: "Pix",
      cash: "Espécie"
    };

    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Wrench className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base">
                  OS #{service.id ? service.id.substring(0, 8).toUpperCase() : "N/A"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {service.customers?.name || "Cliente não encontrado"}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge className={`${statusColors[service.status]} text-white text-xs`}>
                {statusNames[service.status]}
              </Badge>
              <span className="text-sm font-medium">
                {formatCurrency(service.price || 0)}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">
                {service.devices ? 
                  `${service.devices.brand} ${service.devices.model}` : 
                  "Dispositivo não encontrado"
                }
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">
                {service.service_type === 'other' 
                  ? service.other_service_description 
                  : getServiceLabel(service.service_type)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 text-sm hover:bg-muted p-2 rounded-md transition-colors">
                    {getPaymentIcon(service.payment_method)}
                    <span>
                      {service.payment_method ? 
                        (service.payment_method === 'pending' ? 
                          "Selecionar Pagamento" : 
                          paymentMethods[service.payment_method]
                        ) : 
                        "Selecionar Pagamento"
                      }
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-48" align="start">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm font-medium border-b">Cartão</div>
                    <button
                      className="w-full text-left px-8 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                      onClick={() => updatePaymentMethod(service.id, 'credit')}
                    >
                      Crédito
                    </button>
                    <button
                      className="w-full text-left px-8 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                      onClick={() => updatePaymentMethod(service.id, 'debit')}
                    >
                      Débito
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center"
                      onClick={() => updatePaymentMethod(service.id, 'pix')}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Pix
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center"
                      onClick={() => updatePaymentMethod(service.id, 'cash')}
                    >
                      <Banknote className="h-4 w-4 mr-2" />
                      Espécie
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
              <ServiceActionsMenu 
                service={service}
                onUpdate={fetchServices}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 w-full overflow-hidden">
      <PageHeader 
        title="Serviços" 
        description="Gerenciamento de ordens de serviço"
      >
        <Wrench className="h-6 w-6" />
      </PageHeader>
      
      <Card className="p-4 lg:p-6">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
          <div className="w-full flex flex-col sm:flex-row gap-3 flex-wrap">
            <div className="relative w-full sm:w-48 lg:w-56">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar serviços..."
                className="pl-8 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full sm:w-[160px] lg:w-[170px]">
                <SelectValue placeholder="Todos os status" />
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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className={`w-full sm:w-[160px] lg:w-[170px] justify-between text-sm ${paymentFilter !== "all" ? "border-primary text-primary" : ""}`}
                >
                  {paymentFilter === "all" && "Buscar Pagamentos"}
                  {paymentFilter === "pending" && (
                    <>
                      <Clock className="h-4 w-4 mr-1" />
                      Pendentes
                    </>
                  )}
                  {paymentFilter === "paid" && (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Pagos
                    </>
                  )}
                  {paymentFilter === "pix" && (
                    <>
                      <QrCode className="h-4 w-4 mr-1" />
                      Pix
                    </>
                  )}
                  {paymentFilter === "cash" && (
                    <>
                      <Banknote className="h-4 w-4 mr-1" />
                      Espécie
                    </>
                  )}
                  {paymentFilter === "card" && (
                    <>
                      <CreditCard className="h-4 w-4 mr-1" />
                      Cartão
                    </>
                  )}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[170px]">
                <DropdownMenuItem onClick={() => setPaymentFilter("all")}>
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPaymentFilter("pending")}>
                  <Clock className="h-4 w-4 mr-2 text-yellow-500" />
                  Pendentes
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    Pagos
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => setPaymentFilter("paid")}>
                        <Check className="h-4 w-4 mr-2 text-green-500" />
                        Todos Pagos
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPaymentFilter("pix")}>
                        <QrCode className="h-4 w-4 mr-2" />
                        Pix
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPaymentFilter("cash")}>
                        <Banknote className="h-4 w-4 mr-2" />
                        Espécie
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPaymentFilter("card")}>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Cartão
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Popover open={showCalendarFilter} onOpenChange={setShowCalendarFilter}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={`w-full sm:w-auto flex gap-2 text-sm ${calendarDate ? 'text-primary' : ''}`}
                    size="sm"
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
                  size="sm" 
                  onClick={clearDateFilter}
                  title="Limpar filtro de data"
                  className="p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          <div className="w-full xl:w-auto flex justify-end">
            <Button 
              className="w-full sm:w-auto min-w-[140px] flex-shrink-0" 
              onClick={() => navigate("/dashboard/clients")}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" /> {isMobile ? 'Novo' : 'Novo Serviço'}
            </Button>
          </div>
        </div>
        
        {/* Renderização condicional: Cards no mobile, tabela no desktop */}
        {isMobile ? (
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum serviço encontrado.</p>
                {(calendarDate || statusFilter !== 'all' || paymentFilter !== 'all') && (
                  <p className="text-sm mt-2">
                    Filtros ativos: 
                    {calendarDate && ` Data: ${format(calendarDate, "dd/MM/yyyy")}`}
                    {statusFilter !== 'all' && ` Status: ${statusNames[statusFilter]}`}
                    {paymentFilter !== 'all' && ` Pagamento: ${
                      paymentFilter === 'pending' ? 'Pendentes' :
                      paymentFilter === 'paid' ? 'Todos Pagos' :
                      paymentFilter === 'pix' ? 'Pix' :
                      paymentFilter === 'cash' ? 'Espécie' :
                      paymentFilter === 'card' ? 'Cartão' : ''
                    }`}
                  </p>
                )}
              </div>
            ) : (
              <>
                {filteredServices.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
                
                {/* Indicador de Loading Infinito para Mobile */}
                {loadingMore && (
                  <div className="flex justify-center items-center p-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2 text-muted-foreground">Carregando mais serviços...</span>
                  </div>
                )}
                
                {/* Indicador de fim dos resultados */}
                {!hasMore && filteredServices.length > 0 && (
                  <div className="text-center p-4 text-muted-foreground text-sm">
                    Todos os serviços foram carregados ({filteredServices.length} de {totalCount})
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Método de Pagamento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
            <TableCaption>
              {(calendarDate || statusFilter !== 'all' || paymentFilter !== 'all') && (
                <div className="text-sm text-muted-foreground">
                  {calendarDate && (
                    <>Filtrando serviços por data: {format(calendarDate, "dd/MM/yyyy")}</>
                  )}
                  {statusFilter !== 'all' && (
                    <> (Status: {statusNames[statusFilter]})</>
                  )}
                  {paymentFilter !== 'all' && (
                    <> (Pagamento: {
                      paymentFilter === 'pending' ? 'Pendentes' :
                      paymentFilter === 'paid' ? 'Todos Pagos' :
                      paymentFilter === 'pix' ? 'Pix' :
                      paymentFilter === 'cash' ? 'Espécie' :
                      paymentFilter === 'card' ? 'Cartão' : ''
                    })</>
                  )}
                </div>
              )}
              {filteredServices.length === 0 && (
                <div className="py-4 text-center">
                  Nenhum serviço encontrado com os filtros atuais.
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
                    <TableCell>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button 
                            className="flex items-center text-sm hover:underline cursor-pointer"
                          >
                            {service.payment_method === 'pix' ? (
                              <QrCode className="h-4 w-4 mr-1" />
                            ) : service.payment_method === 'cash' ? (
                              <Banknote className="h-4 w-4 mr-1" />
                            ) : service.payment_method === 'credit' || service.payment_method === 'debit' ? (
                              <CreditCard className="h-4 w-4 mr-1" />
                            ) : (
                              <Clock className="h-4 w-4 mr-1 text-yellow-500" />
                            )}
                            {service.payment_method ? 
                              (service.payment_method === 'pending' ? 
                                "Selecionar Pagamento" : 
                                paymentMethods[service.payment_method]
                              ) : 
                              "Selecionar Pagamento"
                            }
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-48" align="start">
                          <div className="py-1">
                            <div className="px-4 py-2 text-sm font-medium border-b">Cartão</div>
                            <button
                              className="w-full text-left px-8 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                              onClick={() => updatePaymentMethod(service.id, 'credit')}
                            >
                              Crédito
                            </button>
                            <button
                              className="w-full text-left px-8 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                              onClick={() => updatePaymentMethod(service.id, 'debit')}
                            >
                              Débito
                            </button>
                            <button
                              className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center"
                              onClick={() => updatePaymentMethod(service.id, 'pix')}
                            >
                              <QrCode className="h-4 w-4 mr-2" />
                              Pix
                            </button>
                            <button
                              className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center"
                              onClick={() => updatePaymentMethod(service.id, 'cash')}
                            >
                              <Banknote className="h-4 w-4 mr-2" />
                              Espécie
                            </button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell className="text-right">
                      <ServiceActionsMenu 
                        service={service}
                        onUpdate={() => handleServiceUpdate(service.id)}
                        onDelete={fetchServices}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* Indicador de Loading Infinito para Desktop */}
          {loadingMore && (
            <div className="flex justify-center items-center p-6 border-t">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-muted-foreground">Carregando mais serviços...</span>
            </div>
          )}
          
          {/* Indicador de fim dos resultados */}
          {!hasMore && filteredServices.length > 0 && (
            <div className="text-center p-4 border-t text-muted-foreground text-sm">
              Todos os serviços foram carregados ({filteredServices.length} de {totalCount})
            </div>
          )}
        </div>
        )}
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