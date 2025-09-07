import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Download, RefreshCw, FileText, Package2, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabaseClient';
import { format, subMonths, subDays, subHours, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { useOrganization } from '@/hooks/useOrganization';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Reports = () => {
  const [period, setPeriod] = useState('6');
  const [loading, setLoading] = useState(false);
  const [serviceData, setServiceData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [serviceTypeData, setServiceTypeData] = useState<any[]>([]);
  const [documentData, setDocumentData] = useState<any[]>([]);
  const [documentTypeData, setDocumentTypeData] = useState<any[]>([]);
  const [documentStatusData, setDocumentStatusData] = useState<any[]>([]);
  const [revenueByDocumentType, setRevenueByDocumentType] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('services');
  const [hasDocumentData, setHasDocumentData] = useState(false);
  const { organizationId, loading: orgLoading } = useOrganization();
  
  // Novo estado para o componente de Serviços Entregues
  const [deliveredPeriod, setDeliveredPeriod] = useState('24h');
  const [deliveredServicesData, setDeliveredServicesData] = useState<{
    count: number;
    totalValue: number;
  }>({ count: 0, totalValue: 0 });
  
  // Get query parameters
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const source = queryParams.get('source');
  const docType = queryParams.get('docType');
  const status = queryParams.get('status');
  const date = queryParams.get('date');
  
  // Inicializar gráficos vazios ao iniciar componente
  useEffect(() => {
    initializeEmptyGraphData();
  }, [period]);
  
  // Função para inicializar os gráficos com estrutura vazia
  const initializeEmptyGraphData = () => {
    // Dados para gráfico de meses
    const emptyMonthlyData: any[] = [];
    const monthsCount = parseInt(period);
    for (let i = monthsCount; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthYear = format(date, 'MMM yyyy', { locale: ptBR });
      emptyMonthlyData.push({
        month: monthYear,
        revenue: 0
      });
    }
    setDocumentData(emptyMonthlyData);
    
    // Dados para gráfico de tipos de documentos
    setDocumentTypeData([
      { type: 'NF-e', count: 0 },
      { type: 'NFC-e', count: 0 },
      { type: 'NFS-e', count: 0 }
    ]);
    
    // Dados para gráfico de status
    setDocumentStatusData([
      { status: 'Pendente', count: 0 },
      { status: 'Autorizada', count: 0 },
      { status: 'Cancelada', count: 0 }
    ]);
    
    // Dados para gráfico de receita por tipo
    setRevenueByDocumentType([
      { type: 'NF-e', revenue: 0 },
      { type: 'NFC-e', revenue: 0 },
      { type: 'NFS-e', revenue: 0 }
    ]);
  };
  
  useEffect(() => {
    // Set initial tab based on query params
    if (source === 'fiscal_documents') {
      setActiveTab('documents');
    }
    
    // Carrega os dados com base na aba ativa apenas quando a organização estiver carregada
    if (!orgLoading) {
      if (activeTab === 'documents') {
        fetchDocumentData();
      } else {
        fetchData();
      }
    }
  }, [period, source, activeTab, organizationId, orgLoading]);

  useEffect(() => {
    // Atualiza os dados de serviços entregues quando mudar o período selecionado ou quando carregar dados
    if (!orgLoading && activeTab === 'services') {
      fetchDeliveredServices();
    }
  }, [deliveredPeriod, organizationId, orgLoading, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Verificar se organizationId existe
      if (!organizationId) {
        console.warn("ID da organização não encontrado");
        setServiceData([]);
        setStatusData([]);
        setServiceTypeData([]);
        setLoading(false);
        return;
      }
      
      // Usar função RPC otimizada para buscar dados dos gráficos
      const { data: chartAnalytics, error: chartError } = await supabase.rpc('get_services_chart_data', {
        org_id: organizationId,
        months_period: parseInt(period)
      });
      
      if (chartError) throw chartError;
      
      // Processar dados dos gráficos diretamente da RPC
      if (chartAnalytics) {
        setServiceData(chartAnalytics.chartData || []);
        
        // Processar dados de status com tradução
        const statusDataTranslated = (chartAnalytics.statusData || []).map(item => ({
          status: getStatusLabel(item.status),
          count: item.count
        }));
        setStatusData(statusDataTranslated);
        
        // Processar dados de tipos de serviço com tradução
        const serviceTypeDataTranslated = (chartAnalytics.serviceTypeData || []).map(item => ({
          type: getServiceTypeLabel(item.type),
          count: item.count
        }));
        setServiceTypeData(serviceTypeDataTranslated);
      } else {
        setServiceData([]);
        setStatusData([]);
        setServiceTypeData([]);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados de serviços para os relatórios',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchDocumentData = async () => {
    setLoading(true);
    try {
      // Verificar se organizationId existe
      if (!organizationId) {
        console.warn("ID da organização não encontrado");
        initializeEmptyGraphData(); // Garantir que os gráficos vazios são exibidos
        setHasDocumentData(false);
        setLoading(false);
        return;
      }
      
      // Calculate date range based on selected period
      const endDate = new Date();
      const startDate = subMonths(endDate, parseInt(period));
      
      let documentsData: any[] = [];
      
      // Tentar carregar da tabela 'documentos' primeiro
      const { data: docs1, error: error1 } = await supabase
        .from('documentos')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('issue_date', startDate.toISOString())
        .lte('issue_date', endDate.toISOString());
      
      if (!error1 && docs1 && docs1.length > 0) {
        documentsData = docs1;
      } else {
        // Se não encontrar, tentar da tabela 'documentos_fiscais'
        const { data: docs2, error: error2 } = await supabase
          .from('documentos_fiscais')
          .select('*')
          .eq('organization_id', organizationId)
          .gte('issue_date', startDate.toISOString())
          .lte('issue_date', endDate.toISOString());
        
        if (!error2 && docs2 && docs2.length > 0) {
          documentsData = docs2;
        } else {
          // Por último, tentar da tabela 'documents' (em inglês)
          const { data: docs3, error: error3 } = await supabase
            .from('documents')
            .select('*')
            .eq('organization_id', organizationId)
            .order('date', { ascending: true });
          
          if (!error3 && docs3 && docs3.length > 0) {
            // Converter para o formato esperado
            documentsData = docs3.map(doc => ({
              id: doc.id,
              number: doc.number,
              type: doc.type,
              status: doc.status === "Emitido" ? "authorized" : "pending",
              customer_id: "unknown",
              customer_name: doc.customer_name,
              issue_date: doc.date,
              total_value: doc.value,
              created_at: doc.date,
              updated_at: doc.date,
              organization_id: organizationId
            }));
          } else {
            // Não exibir dados mockados, deixar vazio
            documentsData = [];
          }
        }
      }
      
      // Aplicar filtros adicionais dos parâmetros da URL
      let filteredData = [...documentsData];
      
      if (docType && docType !== 'all') {
        filteredData = filteredData.filter(doc => doc.type === docType);
      }
      
      if (status && status !== 'all') {
        filteredData = filteredData.filter(doc => doc.status === status);
      }
      
      if (date) {
        const filterDate = parseISO(date);
        const nextDay = new Date(filterDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        filteredData = filteredData.filter(doc => {
          const docDate = new Date(doc.issue_date);
          return docDate >= filterDate && docDate < nextDay;
        });
      }
      
      // Processar os dados para os gráficos
      if (filteredData.length > 0) {
        processDocumentData(filteredData);
        processDocumentTypeData(filteredData);
        processDocumentStatusData(filteredData);
        processRevenueByDocumentType(filteredData);
        setHasDocumentData(true);
      } else {
        // Inicializar os gráficos com dados vazios
        setDocumentData([]);
        setDocumentTypeData([]);
        setDocumentStatusData([]);
        setRevenueByDocumentType([]);
        setHasDocumentData(false);
      }
    } catch (error) {
      console.error('Error fetching document report data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados de documentos fiscais para os relatórios',
        variant: 'destructive'
      });
      
      // Inicializar os gráficos com dados vazios em caso de erro
      setDocumentData([]);
      setDocumentTypeData([]);
      setDocumentStatusData([]);
      setRevenueByDocumentType([]);
      setHasDocumentData(false);
    } finally {
      setLoading(false);
    }
  };
  
  // Processar dados de documentos fiscais por mês
  const processDocumentData = (data: any[]) => {
    const monthlyData: Record<string, number> = {};
    
    // Initialize all months in range
    const months = parseInt(period);
    for (let i = months; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthYear = format(date, 'MMM yyyy', { locale: ptBR });
      monthlyData[monthYear] = 0;
    }
    
    // Sum revenue by month
    data.forEach(doc => {
      if (doc.issue_date) {
        try {
          const date = new Date(doc.issue_date);
          if (!isNaN(date.getTime())) { // Verificar se a data é válida
            const monthYear = format(date, 'MMM yyyy', { locale: ptBR });
            
            // Só adicionar se o mês estiver dentro do período selecionado
            if (monthlyData[monthYear] !== undefined) {
              monthlyData[monthYear] += Number(doc.total_value || 0);
            }
          }
        } catch (error) {
          console.error('Erro ao processar data do documento:', error);
        }
      }
    });
    
    // Convert to array for chart
    const chartData = Object.entries(monthlyData).map(([month, revenue]) => ({
      month,
      revenue: Number(revenue.toFixed(2))
    }));
    
    console.log('Document Data processed:', chartData);
    setDocumentData(chartData);
  };
  
  // Processar dados por tipo de documento
  const processDocumentTypeData = (data: any[]) => {
    const typeCounts: Record<string, number> = {
      'nf': 0,
      'nfce': 0,
      'nfs': 0
    };
    
    data.forEach(doc => {
      const type = doc.type;
      if (typeCounts[type] !== undefined) {
        typeCounts[type]++;
      }
    });
    
    // Convert to array for chart with translated labels
    const chartData = Object.entries(typeCounts).map(([type, count]) => ({
      type: getDocumentTypeLabel(type),
      count
    }));
    
    console.log('Document Type Data processed:', chartData);
    setDocumentTypeData(chartData);
  };
  
  // Processar dados por status de documento
  const processDocumentStatusData = (data: any[]) => {
    const statusCounts: Record<string, number> = {
      'pending': 0,
      'authorized': 0,
      'canceled': 0
    };
    
    data.forEach(doc => {
      const status = doc.status;
      if (statusCounts[status] !== undefined) {
        statusCounts[status]++;
      }
    });
    
    // Convert to array for chart with translated labels
    const chartData = Object.entries(statusCounts).map(([status, count]) => ({
      status: getDocumentStatusLabel(status),
      count
    }));
    
    console.log('Document Status Data processed:', chartData);
    setDocumentStatusData(chartData);
  };
  
  // Processar receita por tipo de documento
  const processRevenueByDocumentType = (data: any[]) => {
    const typeRevenue: Record<string, number> = {
      'nf': 0,
      'nfce': 0,
      'nfs': 0
    };
    
    data.forEach(doc => {
      const type = doc.type;
      if (typeRevenue[type] !== undefined) {
        typeRevenue[type] += Number(doc.total_value || 0);
      }
    });
    
    // Convert to array for chart with translated labels
    const chartData = Object.entries(typeRevenue).map(([type, revenue]) => ({
      type: getDocumentTypeLabel(type),
      revenue: Number(revenue.toFixed(2))
    }));
    
    console.log('Revenue By Document Type processed:', chartData);
    setRevenueByDocumentType(chartData);
  };
  
  // Helper para traduzir tipo de documento
  const getDocumentTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'nf': 'NF-e',
      'nfce': 'NFC-e',
      'nfs': 'NFS-e'
    };
    
    return labels[type] || type;
  };
  
  // Helper para traduzir status de documento
  const getDocumentStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      'pending': 'Pendente',
      'authorized': 'Autorizada',
      'canceled': 'Cancelada'
    };
    
    return labels[status] || status;
  };

  // Process data for revenue by month chart
  const processServiceData = (data: any[]) => {
    const monthlyData: Record<string, number> = {};
    
    // Initialize all months in range
    const months = parseInt(period);
    for (let i = months; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthYear = format(date, 'MMM yyyy', { locale: ptBR });
      monthlyData[monthYear] = 0;
    }
    
    // Sum revenue by month
    data.forEach(service => {
      const date = new Date(service.created_at);
      const monthYear = format(date, 'MMM yyyy', { locale: ptBR });
      
      if (monthlyData[monthYear] !== undefined) {
        monthlyData[monthYear] += service.price || 0;
      }
    });
    
    // Convert to array for chart
    const chartData = Object.entries(monthlyData).map(([month, revenue]) => ({
      month,
      revenue
    }));
    
    setServiceData(chartData);
  };
  
  // Process data for status chart
  const processStatusData = (data: any[]) => {
    const statusCounts: Record<string, number> = {
      'pending': 0,
      'in_progress': 0,
      'waiting_parts': 0,
      'completed': 0,
      'delivered': 0
    };
    
    data.forEach(service => {
      const status = service.status;
      if (statusCounts[status] !== undefined) {
        statusCounts[status]++;
      }
    });
    
    // Convert to array for chart with translated labels
    const chartData = Object.entries(statusCounts).map(([status, count]) => ({
      status: getStatusLabel(status),
      count
    }));
    
    setStatusData(chartData);
  };
  
  // Process data for service type chart
  const processServiceTypeData = (data: any[]) => {
    const typeCounts: Record<string, number> = {};
    
    data.forEach(service => {
      const type = service.service_type;
      if (typeCounts[type] === undefined) {
        typeCounts[type] = 0;
      }
      typeCounts[type]++;
    });
    
    // Convert to array for chart with translated labels
    const chartData = Object.entries(typeCounts).map(([type, count]) => ({
      type: getServiceTypeLabel(type),
      count
    }));
    
    // Sort by count descending
    chartData.sort((a, b) => b.count - a.count);
    
    setServiceTypeData(chartData);
  };
  
  // Helper function to translate status
  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      'pending': 'Pendente',
      'in_progress': 'Em andamento',
      'waiting_parts': 'Aguardando peças',
      'completed': 'Concluído',
      'delivered': 'Entregue'
    };
    
    return labels[status] || status;
  };
  
  // Helper function to translate service type
  const getServiceTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'screen_repair': 'Troca de Tela',
      'battery_replacement': 'Troca de Bateria',
      'water_damage': 'Dano por Água',
      'software_issue': 'Problema de Software',
      'charging_port': 'Porta de Carregamento',
      'button_repair': 'Reparo de Botões',
      'camera_repair': 'Reparo de Câmera',
      'mic_speaker_repair': 'Reparo de Microfone/Alto-falante',
      'diagnostics': 'Diagnóstico',
      'unlocking': 'Desbloqueio',
      'data_recovery': 'Recuperação de Dados',
      'other': 'Outro'
    };
    
    return labels[type] || type;
  };

  // Função para exportar relatórios em PDF
  const handleExportReport = () => {
    toast({
      title: 'Preparando relatório',
      description: 'Gerando relatório para impressão...'
    });
    
    // Criar uma nova janela para impressão
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: 'Erro',
        description: 'Não foi possível abrir a janela de impressão. Verifique se o bloqueador de pop-ups está desabilitado.',
        variant: 'destructive'
      });
      return;
    }
    
    // Obter data atual para o relatório
    const currentDate = new Date().toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Gerar conteúdo HTML do relatório
    const reportContent = generateReportHTML(currentDate);
    
    // Configurar o documento para impressão
    printWindow.document.write(reportContent);
    printWindow.document.close();
    
    // Aguardar o carregamento e imprimir
    printWindow.onload = () => {
    setTimeout(() => {
        printWindow.print();
      toast({
          title: 'Relatório gerado',
          description: 'Use Ctrl+P ou Cmd+P para salvar como PDF ou imprimir.'
        });
      }, 500);
    };
  };
  
  // Função para gerar HTML do relatório
  const generateReportHTML = (currentDate: string) => {
    const periodLabel = {
      '1': 'Último mês',
      '3': 'Últimos 3 meses', 
      '6': 'Últimos 6 meses',
      '12': 'Último ano'
    }[period] || 'Período personalizado';
    
    const activeTabLabel = activeTab === 'services' ? 'Serviços' : 'Documentos Fiscais';
    
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório ${activeTabLabel} - Paulo Cell</title>
        <style>
          @media print {
            @page {
              margin: 2cm;
              size: A4;
            }
            body { -webkit-print-color-adjust: exact; }
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
          }
          
          .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 2px solid #e2e8f0;
            margin-bottom: 30px;
          }
          
          .header h1 {
            font-size: 28px;
            color: #1e293b;
            margin-bottom: 10px;
          }
          
          .header .subtitle {
            font-size: 16px;
            color: #64748b;
          }
          
          .info-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
          }
          
          .info-item {
            text-align: center;
          }
          
          .info-label {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
          }
          
          .info-value {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
          }
          
          .data-section {
            margin-bottom: 30px;
          }
          
          .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          .data-table th,
          .data-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .data-table th {
            background: #f1f5f9;
            font-weight: 600;
            color: #374151;
          }
          
          .data-table tr:hover {
            background: #f8fafc;
          }
          
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
          }
          
          .summary-card {
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
          }
          
          .card-title {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 8px;
          }
          
          .card-value {
            font-size: 24px;
            font-weight: 700;
            color: #1e293b;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 12px;
          }
          
          .no-print {
            display: none;
          }
          
          @media screen {
            .container {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Paulo Cell - Sistema de Gerenciamento</h1>
            <div class="subtitle">Relatório de ${activeTabLabel}</div>
          </div>
          
          <div class="info-section">
            <div class="info-item">
              <div class="info-label">Data do Relatório</div>
              <div class="info-value">${currentDate}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Período</div>
              <div class="info-value">${periodLabel}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Tipo</div>
              <div class="info-value">${activeTabLabel}</div>
            </div>
          </div>
          
          ${generateReportData()}
          
          <div class="footer">
            <p>Relatório gerado automaticamente pelo Sistema Paulo Cell</p>
            <p>Data de geração: ${new Date().toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };
  
  // Função para gerar dados específicos do relatório
  const generateReportData = () => {
    if (activeTab === 'services') {
      return generateServicesReportData();
    } else {
      return generateDocumentsReportData();
    }
  };
  
  // Gerar dados do relatório de serviços
  const generateServicesReportData = () => {
    const totalRevenue = serviceData.reduce((sum, item) => sum + (item.revenue || 0), 0);
    const totalServices = statusData.reduce((sum, item) => sum + (item.count || 0), 0);
    const completedServices = statusData.find(item => item.status === 'Concluído')?.count || 0;
    
    return `
      <div class="summary-grid">
        <div class="summary-card">
          <div class="card-title">Receita Total</div>
          <div class="card-value">R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="summary-card">
          <div class="card-title">Total de Serviços</div>
          <div class="card-value">${totalServices}</div>
        </div>
        <div class="summary-card">
          <div class="card-title">Serviços Concluídos</div>
          <div class="card-value">${completedServices}</div>
        </div>
        <div class="summary-card">
          <div class="card-title">Serviços Entregues</div>
          <div class="card-value">${deliveredServicesData.count}</div>
        </div>
      </div>
      
      <div class="data-section">
        <h2 class="section-title">Receita Mensal</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th>Mês</th>
              <th>Receita</th>
            </tr>
          </thead>
          <tbody>
            ${serviceData.map(item => `
              <tr>
                <td>${item.month}</td>
                <td>R$ ${(item.revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="data-section">
        <h2 class="section-title">Distribuição por Status</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Quantidade</th>
              <th>Percentual</th>
            </tr>
          </thead>
          <tbody>
            ${statusData.map(item => {
              const percentage = totalServices > 0 ? ((item.count / totalServices) * 100).toFixed(1) : '0';
              return `
                <tr>
                  <td>${item.status}</td>
                  <td>${item.count}</td>
                  <td>${percentage}%</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="data-section">
        <h2 class="section-title">Tipos de Serviço Mais Comuns</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th>Tipo de Serviço</th>
              <th>Quantidade</th>
            </tr>
          </thead>
          <tbody>
            ${serviceTypeData.slice(0, 10).map(item => `
              <tr>
                <td>${item.type}</td>
                <td>${item.count}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  };
  
  // Gerar dados do relatório de documentos
  const generateDocumentsReportData = () => {
    const totalRevenue = documentData.reduce((sum, item) => sum + (item.revenue || 0), 0);
    const totalDocuments = documentTypeData.reduce((sum, item) => sum + (item.count || 0), 0);
    const authorizedDocs = documentStatusData.find(item => item.status === 'Autorizada')?.count || 0;
    
    return `
      <div class="summary-grid">
        <div class="summary-card">
          <div class="card-title">Receita Total</div>
          <div class="card-value">R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="summary-card">
          <div class="card-title">Total de Documentos</div>
          <div class="card-value">${totalDocuments}</div>
        </div>
        <div class="summary-card">
          <div class="card-title">Documentos Autorizados</div>
          <div class="card-value">${authorizedDocs}</div>
        </div>
      </div>
      
      <div class="data-section">
        <h2 class="section-title">Receita Mensal por Documentos</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th>Mês</th>
              <th>Valor Total</th>
            </tr>
          </thead>
          <tbody>
            ${documentData.map(item => `
              <tr>
                <td>${item.month}</td>
                <td>R$ ${(item.revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="data-section">
        <h2 class="section-title">Distribuição por Tipo</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th>Tipo de Documento</th>
              <th>Quantidade</th>
              <th>Percentual</th>
            </tr>
          </thead>
          <tbody>
            ${documentTypeData.map(item => {
              const percentage = totalDocuments > 0 ? ((item.count / totalDocuments) * 100).toFixed(1) : '0';
              return `
                <tr>
                  <td>${item.type}</td>
                  <td>${item.count}</td>
                  <td>${percentage}%</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="data-section">
        <h2 class="section-title">Distribuição por Status</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Quantidade</th>
              <th>Percentual</th>
            </tr>
          </thead>
          <tbody>
            ${documentStatusData.map(item => {
              const percentage = totalDocuments > 0 ? ((item.count / totalDocuments) * 100).toFixed(1) : '0';
              return `
                <tr>
                  <td>${item.status}</td>
                  <td>${item.count}</td>
                  <td>${percentage}%</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  // Componente para exibir quando não há dados
  const NoDataMessage = () => (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">Nenhum documento encontrado</h3>
      <p className="text-sm text-muted-foreground max-w-md mt-2">
        Não há documentos fiscais cadastrados para esta organização. 
        Cadastre documentos fiscais para visualizar os relatórios.
      </p>
    </div>
  );

  // Componente de gráfico com mensagem quando vazio
  const EmptyChartWrapper = ({ children, title, description, data }: { 
    children: React.ReactNode, 
    title: string, 
    description: string,
    data: any[]
  }) => {
    const isEmpty = !data || data.length === 0 || (
      data.some(item => 'revenue' in item) && data.every(item => item.revenue === 0)
    ) || (
      data.some(item => 'count' in item) && data.every(item => item.count === 0)
    );
    
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <FileText className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="h-80 relative">
          {children}
          {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <div className="text-center p-4 bg-background/80 rounded-md shadow">
                <p className="text-muted-foreground">
                  Sem dados para exibir
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Nova função otimizada para buscar serviços entregues usando RPC
  const fetchDeliveredServices = async () => {
    try {
      // Verificar se organizationId existe
      if (!organizationId) {
        console.warn("ID da organização não encontrado");
        setDeliveredServicesData({ count: 0, totalValue: 0 });
        return;
      }
      
      // Usar função RPC otimizada
      const { data: analyticsData, error } = await supabase.rpc('get_delivered_services_analytics', {
        org_id: organizationId,
        time_period: deliveredPeriod
      });
      
      if (error) throw error;
      
      setDeliveredServicesData({
        count: analyticsData.count,
        totalValue: analyticsData.totalValue
      });
      
    } catch (error) {
      console.error('Error fetching delivered services data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados de serviços entregues',
        variant: 'destructive'
      });
      setDeliveredServicesData({ count: 0, totalValue: 0 });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Relatórios</h1>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select
            value={period}
            onValueChange={setPeriod}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Último mês</SelectItem>
              <SelectItem value="3">Últimos 3 meses</SelectItem>
              <SelectItem value="6">Últimos 6 meses</SelectItem>
              <SelectItem value="12">Último ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={activeTab === 'documents' ? fetchDocumentData : fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="documents">Documentos Fiscais</TabsTrigger>
        </TabsList>
        
        <TabsContent value="services" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card className="col-span-full">
              <CardHeader>
                <CardTitle>Receita Mensal de Serviços</CardTitle>
                <CardDescription>Receita total de serviços por mês no período selecionado</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={serviceData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis
                      tickFormatter={(value) => `R$ ${value}`}
                    />
                    <Tooltip 
                      formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Receita']}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8884d8" name="Receita" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Status</CardTitle>
                <CardDescription>Serviços por status no período selecionado</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="status"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Quantidade']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Service Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Tipos de Serviço</CardTitle>
                <CardDescription>Serviços mais comuns no período</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={serviceTypeData.slice(0, 5)} // Show top 5 only
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="type" type="category" width={120} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#82ca9d" name="Quantidade" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Novo componente: Serviços Entregues */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Serviços Entregues</CardTitle>
                  <CardDescription>Quantidade e valor total de serviços entregues</CardDescription>
                </div>
                <Package2 className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex justify-end mb-4">
                  <Select
                    value={deliveredPeriod}
                    onValueChange={(value) => {
                      setDeliveredPeriod(value);
                      fetchDeliveredServices();
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">Últimas 24 horas</SelectItem>
                      <SelectItem value="7d">Últimos 7 dias</SelectItem>
                      <SelectItem value="1m">Último mês</SelectItem>
                      <SelectItem value="3m">Últimos 3 meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                    <Package2 className="h-8 w-8 text-primary mb-2" />
                    <p className="text-sm text-muted-foreground mb-1">Quantidade</p>
                    <h3 className="text-3xl font-bold">{deliveredServicesData.count}</h3>
                    <p className="text-sm text-muted-foreground mt-1">serviços entregues</p>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                    <DollarSign className="h-8 w-8 text-primary mb-2" />
                    <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
                    <h3 className="text-3xl font-bold">
                      R$ {deliveredServicesData.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">receita gerada</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="documents" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Document Revenue Chart */}
            <Card className="col-span-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Receita Mensal por Documentos Fiscais</CardTitle>
                  <CardDescription>Valor total de documentos fiscais por mês no período selecionado</CardDescription>
                </div>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={documentData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis
                      tickFormatter={(value) => `R$ ${value}`}
                      domain={[0, 10]}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Valor Total']}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#4f46e5" name="Valor Total" minPointSize={5} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Document Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Tipo</CardTitle>
                <CardDescription>Documentos fiscais por tipo no período selecionado</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={documentTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={0}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={1}
                      dataKey="count"
                      nameKey="type"
                      minAngle={15}
                      labelLine={true}
                      label={({ name }) => name}
                    >
                      {documentTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#000" strokeWidth={0.5} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Quantidade']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Document Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Status</CardTitle>
                <CardDescription>Documentos fiscais por status no período selecionado</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={documentStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={0}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={1}
                      dataKey="count"
                      nameKey="status"
                      minAngle={15}
                      labelLine={true}
                      label={({ name }) => name}
                    >
                      {documentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#000" strokeWidth={0.5} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Quantidade']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Revenue by Document Type */}
            <Card className="col-span-full">
              <CardHeader>
                <CardTitle>Valor Total por Tipo de Documento</CardTitle>
                <CardDescription>Valor total emitido por tipo de documento no período</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={revenueByDocumentType}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis
                      tickFormatter={(value) => `R$ ${value}`}
                      domain={[0, 10]}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Valor Total']}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10b981" name="Valor Total" minPointSize={5} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
