import React, { forwardRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FiscalDocument } from "@/types";
import { toast } from "@/hooks/use-toast";
import { formatPhone, formatCEP } from "@/lib/validators";
import { supabase } from "@/integrations/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyInfo } from "@/contexts/CompanyContext";

interface ThermalPrinterProps {
  document: FiscalDocument;
  children?: React.ReactNode;
}

// Convertendo para forwardRef para resolver o erro de ref
export const ThermalPrinter = forwardRef<HTMLButtonElement, ThermalPrinterProps>(
  ({ document, children }, ref) => {
    const { user } = useAuth();
    const { companyInfo, loading, refreshCompanyInfo } = useCompanyInfo();
    
    
    // Formatar para moeda brasileira
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    };

    const printFiscalDocument = async () => {
      // Garantir que as informações da empresa estejam carregadas
      if (!companyInfo && !loading) {
        console.log('Tentando recarregar informações da empresa...');
        await refreshCompanyInfo();
        // Aguardar um pouco para o estado atualizar
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log('Estado das informações da empresa na impressão fiscal:', {
        companyInfo,
        loading,
        hasCompanyName: companyInfo?.companyName,
        hasPhone: companyInfo?.phone,
        hasDocument: companyInfo?.document
      });
      // Título do documento com base no tipo
      const documentTitle = document.type === 'nf' 
        ? 'NOTA FISCAL ELETRÔNICA'
        : document.type === 'nfce' 
          ? 'NOTA FISCAL DE CONSUMIDOR' 
          : 'NOTA FISCAL DE SERVIÇO';
      
      const receipt = `
        <html>
        <head>
          <title>Comprovante Fiscal</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              width: 80mm;
              margin: 0;
              padding: 10px;
              font-size: 10pt;
            }
            .header {
              text-align: center;
              font-weight: bold;
              margin-bottom: 10px;
              font-size: 12pt;
            }
            .info {
              margin-bottom: 5px;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 10px 0;
              width: 100%;
            }
            .bold {
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 10px;
              font-size: 9pt;
            }
            .align-right {
              text-align: right;
            }
            .break-all {
              word-break: break-all;
            }
            .description {
              margin: 8px 0;
              white-space: pre-wrap;
              font-size: 9pt;
            }
            .values {
              margin: 10px 0;
            }
            .total-value {
              font-weight: bold;
              font-size: 12pt;
              text-align: center;
              margin: 10px 0;
              padding: 5px;
              border-top: 1px solid #000;
              border-bottom: 1px solid #000;
            }
            /* Hide useless items for printing */
            @media print {
              html, body {
                width: 80mm;
                height: auto;
                overflow: hidden;
              }
              @page {
                margin: 0;
                size: 80mm auto;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${companyInfo && companyInfo.companyName ? companyInfo.companyName : 'PAULO CELL'}
            <br />
            ${companyInfo?.document ? `${companyInfo.documentType?.toUpperCase() || 'DOC'}: ${companyInfo.document}` : ''}
            ${companyInfo?.phone ? `<br />Tel: ${formatPhone(companyInfo.phone)}` : ''}
            ${companyInfo?.address && (companyInfo.address.street || companyInfo.address.city) ? `
            <br />
            ${companyInfo.address.street ? `${companyInfo.address.street}${companyInfo.address.number ? `, ${companyInfo.address.number}` : ''}` : ''}${companyInfo.address.complement ? ` - ${companyInfo.address.complement}` : ''}
            ${companyInfo.address.neighborhood ? `<br />${companyInfo.address.neighborhood}` : ''}
            ${companyInfo.address.city && companyInfo.address.state ? `<br />${companyInfo.address.city} - ${companyInfo.address.state}` : ''}
            ${companyInfo.address.cep ? `<br />CEP: ${formatCEP(companyInfo.address.cep)}` : ''}` : ''}
            <br />
            ${documentTitle}
          </div>
          
          <div class="divider"></div>
          
          <div class="info">
            <span class="bold">Documento:</span> ${document.number}
          </div>
          <div class="info">
            <span class="bold">Tipo:</span> ${document.type.toUpperCase()}
          </div>
          <div class="info">
            <span class="bold">Data:</span> ${new Date(document.issue_date).toLocaleDateString('pt-BR')}
          </div>
          <div class="info">
            <span class="bold">Status:</span> ${document.status === 'authorized' ? 'Autorizado' : document.status === 'pending' ? 'Pendente' : 'Cancelado'}
          </div>
          
          <div class="divider"></div>
          
          <div class="info">
            <span class="bold">Cliente:</span> ${document.customer_name}
          </div>
          
          ${document.description ? `
          <div class="divider"></div>
          
          <div class="description">
            <span class="bold">Descrição:</span><br />
            ${document.description}
          </div>
          ` : ''}
          
          <div class="divider"></div>
          
          <div class="total-value">
            Total: ${formatCurrency(document.total_value)}
          </div>
          
          ${document.qr_code ? `
          <div class="divider"></div>
          
          <div style="text-align: center; margin: 10px 0;">
            <img src="${document.qr_code}" style="width: 100px; height: 100px;" />
          </div>
          ` : ''}
          
          <div class="divider"></div>
          
          <div class="bold">Chave de Acesso:</div>
          <div class="break-all" style="font-size: 8pt; margin-top: 5px;">
            ${document.access_key}
          </div>
          
          <div class="divider"></div>
          
          <div class="center small">
            Consulte pela chave de acesso em:
            <br/>
            <span class="bold">www.nfe.fazenda.gov.br</span>
          </div>
          
          <div class="divider"></div>
          
          <div class="footer">
            Documento emitido eletronicamente
            <br />
            ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}
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
            printFrame.contentWindow?.print();
            
            // Remove the iframe after printing
            setTimeout(() => {
              window.document.body.removeChild(printFrame);
            }, 1000);
            
            toast({
              title: "Impressão iniciada",
              description: "O documento está sendo impresso.",
            });
          } catch (error) {
            toast({
              variant: "destructive",
              title: "Erro na impressão",
              description: "Não foi possível imprimir o documento.",
            });
            
            // Remove the iframe in case of error
            window.document.body.removeChild(printFrame);
          }
        };
      }
    };

    return (
      <Button 
        ref={ref}
        variant="ghost" 
        size="sm"
        onClick={async () => await printFiscalDocument()} 
        className="flex items-center gap-2 w-full justify-start px-2 py-1.5 h-9"
      >
        {children}
      </Button>
    );
  }
);

ThermalPrinter.displayName = "ThermalPrinter";

export default ThermalPrinter;
