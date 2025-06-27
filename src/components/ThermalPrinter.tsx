import React, { forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { FiscalDocument } from "@/types";
import { toast } from "@/hooks/use-toast";

interface ThermalPrinterProps {
  document: FiscalDocument;
  children?: React.ReactNode;
}

// Convertendo para forwardRef para resolver o erro de ref
export const ThermalPrinter = forwardRef<HTMLButtonElement, ThermalPrinterProps>(
  ({ document, children }, ref) => {
    // Função para calcular impostos fictícios
    const calculateTaxes = () => {
      const total = document.total_value;
      let taxes = {
        icms: 0,
        ipi: 0,
        iss: 0,
        total: 0
      };
      
      // Aplicar impostos baseados no tipo de documento
      if (document.type === 'nf') {
        taxes.icms = total * 0.18; // 18% de ICMS
        taxes.ipi = total * 0.05; // 5% de IPI
        taxes.total = taxes.icms + taxes.ipi;
      } else if (document.type === 'nfce') {
        taxes.icms = total * 0.18; // 18% de ICMS
        taxes.total = taxes.icms;
      } else if (document.type === 'nfs') {
        taxes.iss = total * 0.05; // 5% de ISS
        taxes.total = taxes.iss;
      }
      
      return taxes;
    };
    
    // Formatar para moeda brasileira
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    };

    const printFiscalDocument = () => {
      // Calcular impostos
      const taxes = calculateTaxes();
      const totalWithTaxes = document.total_value + taxes.total;
      
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
            .values table {
              width: 100%;
              border-collapse: collapse;
            }
            .values td {
              padding: 2px 0;
            }
            .values .total-row {
              font-weight: bold;
              border-top: 1px solid #000;
              margin-top: 5px;
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
            PAULO CELL
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
          
          <div class="info">
            <span class="bold">Descrição:</span>
            <div class="description">${document.description}</div>
          </div>
          ` : ''}
          
          <div class="divider"></div>
          
          <div class="values">
            <table>
              <tr>
                <td class="bold">Subtotal:</td>
                <td class="align-right">${formatCurrency(document.total_value)}</td>
              </tr>
              ${document.type === 'nf' ? `
                <tr>
                  <td>ICMS (18%):</td>
                  <td class="align-right">${formatCurrency(taxes.icms)}</td>
                </tr>
                <tr>
                  <td>IPI (5%):</td>
                  <td class="align-right">${formatCurrency(taxes.ipi)}</td>
                </tr>
              ` : document.type === 'nfce' ? `
                <tr>
                  <td>ICMS (18%):</td>
                  <td class="align-right">${formatCurrency(taxes.icms)}</td>
                </tr>
              ` : document.type === 'nfs' ? `
                <tr>
                  <td>ISS (5%):</td>
                  <td class="align-right">${formatCurrency(taxes.iss)}</td>
                </tr>
              ` : ''}
              <tr class="total-row">
                <td class="bold">Total com impostos:</td>
                <td class="align-right bold">${formatCurrency(totalWithTaxes)}</td>
              </tr>
            </table>
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
          printFrame.contentWindow?.print();
          // Remove the iframe after printing
          setTimeout(() => {
            window.document.body.removeChild(printFrame);
          }, 1000);
          
          toast({
            title: "Impressão iniciada",
            description: `O documento ${document.number} está sendo impresso.`,
          });
        };
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

ThermalPrinter.displayName = "ThermalPrinter";
