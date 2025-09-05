import React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { generateTrackingId } from "@/lib/qrcode-utils";
import { supabase } from "@/integrations/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

interface ServiceThermalPrinterProps {
  service: any; // Service data structure
  children?: React.ReactNode;
}

export const ServiceThermalPrinter = React.forwardRef<HTMLButtonElement, ServiceThermalPrinterProps>(
  ({ service, children }, ref) => {
  const { user } = useAuth();
  const [companyInfo, setCompanyInfo] = React.useState<any>(null);

  // Buscar informações da empresa para impressão
  React.useEffect(() => {
    const fetchCompanyInfo = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('company_name, document, document_type, phone, cep, state, city, neighborhood, street, number, complement')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao buscar informações da empresa:', error);
          return;
        }

        if (data) {
          setCompanyInfo({
            companyName: data.company_name,
            document: data.document,
            documentType: data.document_type,
            phone: data.phone,
            address: {
              street: data.street,
              number: data.number,
              neighborhood: data.neighborhood,
              city: data.city,
              state: data.state,
              cep: data.cep,
              complement: data.complement,
            }
          });
        }
      } catch (error) {
        console.error('Erro ao carregar informações da empresa:', error);
      }
    };

    fetchCompanyInfo();
  }, [user?.id]);

  // Função para garantir que o serviço tenha um public_tracking_id
  const ensureTrackingId = async (serviceId: string) => {
    if (!service.public_tracking_id) {
      try {
        // Gerar um novo tracking ID
        const trackingId = generateTrackingId();
        console.log('Gerando novo trackingId para serviço:', serviceId, trackingId);
        
        // Buscar definição de público atual primeiro
        let serviceResponse = null;
        try {
          // Verificar o serviço atual
          const { data, error } = await supabase
            .from('services')
            .select('public_tracking_id')
            .eq('id', serviceId)
            .single();
            
          if (!error && data && data.public_tracking_id) {
            console.log('Serviço já possui tracking ID:', data.public_tracking_id);
            return data.public_tracking_id;
          }
        } catch (checkError) {
          console.warn('Erro ao verificar tracking ID existente:', checkError);
        }
        
        // Atualizar o serviço no banco de dados
        try {
          const { data, error } = await supabase
            .from('services')
            .update({ public_tracking_id: trackingId })
            .eq('id', serviceId)
            .select('public_tracking_id');
            
          if (error) {
            console.error('Erro ao atualizar tracking ID:', error);
            
            // Tentar abordagem alternativa com mutate() para RLS
            try {
              const { data: rpcResult, error: rpcError } = await supabase.rpc('update_service_tracking_id', {
                p_service_id: serviceId,
                p_tracking_id: trackingId
              });
              
              if (rpcError) {
                console.error('Erro ao atualizar via RPC:', rpcError);
              } else {
                console.log('Atualizado via RPC:', rpcResult);
                return trackingId;
              }
            } catch (rpcException) {
              console.error('Exceção ao atualizar via RPC:', rpcException);
            }
            
            return null;
          }
          
          console.log('Tracking ID atualizado:', data);
          return data?.[0]?.public_tracking_id || trackingId;
        } catch (updateError) {
          console.error('Exceção ao atualizar tracking ID:', updateError);
          return null;
        }
      } catch (error) {
        console.error('Erro ao gerar tracking ID:', error);
        return null;
      }
    }
    return service.public_tracking_id;
  };

  const printServiceReceipt = async () => {
    // Garantir que o serviço tenha um public_tracking_id
    const trackingId = await ensureTrackingId(service.id);
    
    // Use trackingId no QR code, se disponível
    const effectiveTrackingId = trackingId || service.public_tracking_id;

    // Prepare formatted data
    const status = {
      pending: "Pendente",
      in_progress: "Em andamento",
      waiting_parts: "Aguardando peças",
      completed: "Concluído",
      delivered: "Entregue"
    };

    // Métodos de pagamento
    const paymentMethods = {
      pending: "Pagamento Pendente",
      credit: "Crédito",
      debit: "Débito",
      pix: "Pix",
      cash: "Espécie"
    };

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

    const serviceName = service.service_type === 'other' 
      ? service.other_service_description 
      : serviceTypes[service.service_type] || service.service_type;

    const price = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(service.price || 0);
    
    // Formatar as datas
    const createdDate = new Date(service.created_at).toLocaleDateString('pt-BR');
    
    // Formatar data de previsão de entrega se existir
    let estimatedDate = "Não informada";
    if (service.estimated_completion_date) {
      try {
        estimatedDate = new Date(service.estimated_completion_date).toLocaleDateString('pt-BR');
      } catch (error) {
        console.error("Erro ao formatar data de previsão:", error);
      }
    }
    
    // Gerar ID de ordem formatado para exibição
    const orderNumber = service.id ? service.id.substring(0, 8).toUpperCase() : "N/A";
    
    // Processar observações para formatação adequada (quebras de linha, remoção de caracteres especiais)
    const formattedObservations = service.observations 
      ? service.observations
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>')
      : "";

    const receipt = `
      <html>
      <head>
        <title>Comprovante de Serviço</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            font-family: 'Arial', sans-serif;
            width: 80mm;
            margin: 0 auto;
            padding: 4mm 2mm;
            font-size: 10pt;
            background-color: white;
            color: black;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            text-align: center;
          }
          .header {
            text-align: center;
            margin-bottom: 3mm;
            padding: 2mm 0;
            border-bottom: 2px solid #000;
          }
          .company-name {
            font-weight: bold;
            font-size: 14pt;
            margin-bottom: 1mm;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .company-doc {
            font-size: 10pt;
            font-weight: bold;
            margin-bottom: 1mm;
            color: #333;
          }
          .company-phone {
            font-size: 10pt;
            font-weight: bold;
            margin-bottom: 2mm;
          }
          .company-address {
            font-size: 9pt;
            line-height: 1.2;
            margin-bottom: 2mm;
            color: #444;
          }
          .service-title {
            text-align: center;
            font-weight: bold;
            font-size: 12pt;
            margin: 3mm 0;
            padding: 2mm 0;
            background-color: #f0f0f0;
            border: 1px solid #ccc;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .info {
            margin-bottom: 2mm;
            line-height: 1.3;
            text-align: left;
            padding: 0 2mm;
          }
          .divider {
            border-top: 1px dashed black;
            margin: 3mm auto;
            clear: both;
            width: 90%;
          }
          .bold {
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 3mm;
            font-size: 8pt;
          }
          .align-right {
            text-align: right;
            padding-right: 5mm;
          }
          .observations {
            white-space: pre-wrap;
            font-size: 9pt;
            margin-top: 2mm;
            padding: 2mm;
            border-left: 1px solid black;
            max-width: 90%;
            margin-left: 4mm;
            word-break: break-word;
          }
          .order-number {
            font-weight: bold;
            font-size: 14pt;
            text-align: center;
            margin: 2mm 0;
            letter-spacing: 1px;
          }
          .small-text {
            font-size: 8pt;
            margin: 1mm 0;
          }
          .centered {
            text-align: center;
            margin: 0 auto;
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .qr-container {
            margin: 3mm auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            border: 1px dashed #ccc;
            padding: 2mm;
            border-radius: 2mm;
            background-color: #fff;
            width: 85%;
          }
          .qr-placeholder {
            margin: 3mm auto;
            width: 25mm;
            height: 25mm;
            border: 1px solid black;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8pt;
            text-align: center;
          }
          .section-title {
            font-weight: bold;
            text-align: center;
            font-size: 10pt;
            background-color: #f0f0f0;
            padding: 1mm 0;
            margin: 2mm 0;
            width: 100%;
            border-top: 1px solid #ddd;
            border-bottom: 1px solid #ddd;
          }
          .valor-total {
            font-weight: bold;
            font-size: 12pt;
            padding: 2mm 0;
            background-color: #f9f9f9;
            border-radius: 2mm;
            margin: 2mm auto;
          }
          /* Otimizações específicas para impressoras térmicas */
          @media print {
            html, body {
              width: 80mm;
              height: auto;
              margin: 0 auto !important;
              padding: 2mm 0 !important;
            }
            * {
              box-shadow: none !important;
              text-shadow: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${companyInfo?.companyName ? `
          <div class="company-name">${companyInfo.companyName}</div>
          ${companyInfo.document ? `<div class="company-doc">${companyInfo.documentType?.toUpperCase() || 'DOC'}: ${companyInfo.document}</div>` : ''}
          <div class="company-phone">Tel: ${companyInfo.phone || '(98) 12345-6789'}</div>
          ${companyInfo.address && (companyInfo.address.street || companyInfo.address.city) ? `
          <div class="company-address">
            ${companyInfo.address.street ? `${companyInfo.address.street}${companyInfo.address.number ? `, ${companyInfo.address.number}` : ''}` : ''}${companyInfo.address.complement ? ` - ${companyInfo.address.complement}` : ''}
            ${companyInfo.address.neighborhood ? `<br />${companyInfo.address.neighborhood}` : ''}
            ${companyInfo.address.city && companyInfo.address.state ? `<br />${companyInfo.address.city} - ${companyInfo.address.state}` : ''}
            ${companyInfo.address.cep ? `<br />CEP: ${companyInfo.address.cep}` : ''}
          </div>` : ''}
          ` : `
          <div class="company-name">PAULO CELL - ASSISTÊNCIA TÉCNICA</div>
          <div class="company-phone">Tel: (98) 12345-6789</div>
          `}
        </div>
        
        <div class="service-title">ORDEM DE SERVIÇO</div>
        
        <div class="order-number">OS: ${orderNumber}</div>
        
        <div class="divider"></div>
        
        <div class="section-title">DADOS DO CLIENTE</div>
        <div class="info">
          <span class="bold">Cliente:</span> ${service.customers?.name || "Cliente não encontrado"}
        </div>
        
        <div class="section-title">DADOS DO DISPOSITIVO</div>
        <div class="info">
          <span class="bold">Dispositivo:</span> ${service.devices ? `${service.devices.brand} ${service.devices.model}` : "Dispositivo não encontrado"}
        </div>
        <div class="info">
          <span class="bold">Data de Registro:</span> ${createdDate}
        </div>
        <div class="info">
          <span class="bold">Previsão de Entrega:</span> ${estimatedDate}
        </div>
        <div class="info">
          <span class="bold">Status:</span> ${status[service.status] || service.status}
        </div>
        <div class="info">
          <span class="bold">Método de Pagamento:</span> ${service.payment_method ? paymentMethods[service.payment_method] || service.payment_method : "Não informado"}
        </div>
        
        <div class="divider"></div>
        
        <div class="section-title">SERVIÇO</div>
        <div class="info">
          <span class="bold">Tipo:</span> ${serviceName}
        </div>
        
        ${service.observations ? `
        <div class="info">
          <span class="bold">Observações:</span>
          <div class="observations">${formattedObservations}</div>
        </div>
        ` : ''}
        
        <div class="divider"></div>
        
        <div class="valor-total">
          <span class="bold">Valor Total:</span> ${price}
        </div>
        
        <div class="divider"></div>
        
        <div className="centered">
          ${effectiveTrackingId ? `
            <div class="qr-container">
              <p class="small-text"><strong>Acompanhe seu serviço online</strong></p>
              <p class="small-text">Escaneie o QR Code abaixo:</p>
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/status/${effectiveTrackingId}`)}" 
                width="120" 
                height="120" 
                alt="QR Code para acompanhamento"
                style="margin: 2mm auto;"
              />
              <p class="small-text">Ou acesse:</p>
              <p class="small-text"><strong>${window.location.origin}/status/${effectiveTrackingId.substring(0, 8)}</strong></p>
            </div>
          ` : `
            <div class="qr-placeholder">
              OS: ${orderNumber}
            </div>
          `}
        </div>
        
        <div class="footer">
          * Obrigado pela preferência *
          <br />
          ${companyInfo?.companyName || 'Paulo Cell - Assistência Técnica'}
          <br />
          <span class="small-text">${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</span>
        </div>
      </body>
      </html>
    `;

    // Create a hidden iframe for printing
    const printFrame = window.document.createElement('iframe');
    printFrame.style.display = 'none';
    window.document.body.appendChild(printFrame);
    
    // Access the document of the iframe
    const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
    
    if (frameDoc) {
      frameDoc.write(receipt);
      frameDoc.close();
      
      // Wait for content to load before printing
      printFrame.onload = () => {
        try {
          // Configurar impressão para papel térmico
          const printOptions = {
            scale: 1,
            silent: true  // Omitir diálogo de impressão se suportado
          };
          
          printFrame.contentWindow?.print();
          
          // Remove the iframe after printing
          setTimeout(() => {
            if (window.document.body.contains(printFrame)) {
              window.document.body.removeChild(printFrame);
            }
          }, 1000);
          
          toast({
            title: "Impressão iniciada",
            description: "A ordem de serviço está sendo impressa.",
          });
        } catch (error) {
          console.error("Erro ao imprimir:", error);
          toast({
            variant: "destructive",
            title: "Erro na impressão",
            description: "Não foi possível imprimir o comprovante.",
          });
          
          // Certifique-se de remover o iframe mesmo em caso de erro
          if (window.document.body.contains(printFrame)) {
            window.document.body.removeChild(printFrame);
          }
        }
      };
    }
  };

    return (
      <Button 
        ref={ref}
        variant="ghost" 
        size="sm"
        onClick={async () => await printServiceReceipt()} 
        className="flex items-center gap-2 w-full justify-start px-2 py-1.5 h-9"
      >
        {children}
      </Button>
    );
  }
);

ServiceThermalPrinter.displayName = "ServiceThermalPrinter";

export default ServiceThermalPrinter; 