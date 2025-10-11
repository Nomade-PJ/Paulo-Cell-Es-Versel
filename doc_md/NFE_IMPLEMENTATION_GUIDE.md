# 📄 Guia de Implementação NFe/NFCe - Paulo Cell

> **Documentação Técnica para Implementação de Emissão de Notas Fiscais Eletrônicas**  
> Projeto: Paulo Cell - Sistema de Gerenciamento  
> Data: Janeiro 2025  
> Status: Pronto para Implementação  

---

## 📋 Índice

- [🎯 Objetivo](#-objetivo)
- [🔍 Análise de Soluções](#-análise-de-soluções)
- [🏆 Solução Recomendada](#-solução-recomendada)
- [🏗️ Arquitetura Proposta](#️-arquitetura-proposta)
- [📦 Implementação do Microserviço](#-implementação-do-microserviço)
- [🔗 Integração com Frontend](#-integração-com-frontend)
- [🗄️ Modificações no Banco de Dados](#️-modificações-no-banco-de-dados)
- [⚙️ Configuração e Deploy](#️-configuração-e-deploy)
- [🧪 Testes e Homologação](#-testes-e-homologação)
- [📊 Interface do Usuário](#-interface-do-usuário)
- [🚀 Roadmap de Implementação](#-roadmap-de-implementação)
- [📞 Suporte e Manutenção](#-suporte-e-manutenção)

---

## 🎯 Objetivo

Implementar um sistema completo de **emissão de NFe/NFCe gratuito** para o projeto Paulo Cell, permitindo:

- ✅ **Emissão automática** de NFCe ao finalizar serviços
- ✅ **Geração de DANFE** em PDF para impressão
- ✅ **Consulta de status** na SEFAZ
- ✅ **Armazenamento seguro** de XMLs
- ✅ **Integração total** com o sistema existente
- ✅ **Custo zero** em APIs de terceiros

---

## 🔍 Análise de Soluções

### 📊 **Comparativo de Opções**

| Solução | Custo | Facilidade | Manutenção | Recomendação |
|---------|--------|------------|------------|--------------|
| **NFePHP.org** | 🟢 Gratuito | 🟡 Moderada | 🟡 Manual | ⭐⭐⭐⭐⭐ |
| **APIs Pagas** | 🔴 R$ 0,30-1,00/NFe | 🟢 Fácil | 🟢 Automática | ⭐⭐⭐ |
| **NotaFiscalNet** | 🟢 Gratuito | 🟡 Moderada | 🟡 Manual | ⭐⭐⭐⭐ |
| **Desenvolvimento Próprio** | 🔴 Alto | 🔴 Difícil | 🔴 Complexa | ⭐⭐ |

### 🏆 **Vencedor: NFePHP.org**

**Motivos da Escolha:**
- ✅ **100% Gratuito** - Sem custos por NFe
- ✅ **Mais usado no Brasil** - Comunidade ativa
- ✅ **Constantemente atualizado** - Acompanha legislação
- ✅ **Documentação completa** - Fácil implementação
- ✅ **Suporte a todos os tipos** - NFe, NFCe, NFS-e

---

## 🏆 Solução Recomendada

### 📋 **Stack Tecnológica**

```yaml
Frontend: React + TypeScript (existente)
Backend NFe: PHP 8.1+ com NFePHP.org
Banco de Dados: PostgreSQL (Supabase existente)
Hospedagem: Railway.app ou VPS
Comunicação: REST API + WebHooks
```

### 🔗 **Bibliotecas Principais**

```bash
# Bibliotecas NFePHP.org
nfephp-org/sped-nfe      # Emissão de NFe/NFCe
nfephp-org/sped-da       # Geração de DANFE (PDF)
nfephp-org/sped-common   # Funções comuns
```

---

## 🏗️ Arquitetura Proposta

### 🎨 **Diagrama da Arquitetura**

```mermaid
graph TB
    A[Paulo Cell React] --> B[API Gateway]
    B --> C[Microserviço NFe PHP]
    C --> D[NFePHP.org]
    C --> E[Banco PostgreSQL]
    D --> F[SEFAZ]
    C --> G[Geração DANFE]
    G --> H[Storage PDF]
    H --> A
    
    subgraph "Fluxo de Emissão"
        I[Finalizar Serviço] --> J[Gerar NFCe]
        J --> K[Enviar SEFAZ]
        K --> L[Salvar XML]
        L --> M[Gerar DANFE]
        M --> N[Cliente Recebe]
    end
```

### 📦 **Estrutura do Microserviço**

```
api-nfe/
├── composer.json
├── config/
│   ├── certificado.pfx          # Certificado Digital A1
│   ├── config.json             # Configurações gerais
│   └── homologacao.json        # Config ambiente de teste
├── src/
│   ├── Controllers/
│   │   ├── NFeController.php   # Controle de NFe
│   │   ├── NFCeController.php  # Controle de NFCe
│   │   └── DANFEController.php # Geração de DANFE
│   ├── Services/
│   │   ├── EmissorService.php  # Lógica de emissão
│   │   ├── ConsultaService.php # Consultas SEFAZ
│   │   └── DANFEService.php    # Geração PDF
│   ├── Models/
│   │   ├── NFe.php            # Modelo NFe
│   │   └── Empresa.php        # Dados da empresa
│   └── Utils/
│       ├── Validator.php      # Validações
│       └── Logger.php         # Logs de operação
├── storage/
│   ├── xmls/                  # XMLs gerados
│   ├── pdfs/                  # DANFEs gerados
│   └── logs/                  # Logs de operação
├── public/
│   └── index.php             # Entry point
└── tests/
    ├── NFeTest.php           # Testes unitários
    └── IntegrationTest.php   # Testes de integração
```

---

## 📦 Implementação do Microserviço

### 🔧 **1. Configuração Inicial**

#### **composer.json**
```json
{
    "name": "paulo-cell/api-nfe",
    "description": "API NFe para Paulo Cell",
    "require": {
        "php": ">=8.1",
        "nfephp-org/sped-nfe": "^6.0",
        "nfephp-org/sped-da": "^2.0",
        "slim/slim": "^4.0",
        "monolog/monolog": "^3.0",
        "vlucas/phpdotenv": "^5.0"
    },
    "autoload": {
        "psr-4": {
            "PauloCell\\NFe\\": "src/"
        }
    }
}
```

#### **config/config.json**
```json
{
    "empresa": {
        "razao_social": "Paulo Cell LTDA",
        "nome_fantasia": "Paulo Cell",
        "cnpj": "00.000.000/0001-00",
        "ie": "000000000",
        "endereco": {
            "logradouro": "Rua Principal",
            "numero": "123",
            "bairro": "Centro",
            "cidade": "Vitória",
            "uf": "ES",
            "cep": "29000-000"
        },
        "telefone": "(27) 3000-0000",
        "email": "nfe@paulocell.com.br"
    },
    "certificado": {
        "arquivo": "certificado.pfx",
        "senha": "${CERT_PASSWORD}"
    },
    "ambiente": "producao",
    "serie_nfce": "1",
    "proximo_numero": 1
}
```

### 🔧 **2. Controller Principal**

#### **src/Controllers/NFCeController.php**
```php
<?php

namespace PauloCell\NFe\Controllers;

use NFePHP\NFe\Make;
use NFePHP\NFe\Tools;
use NFePHP\DA\NFe\Danfe;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class NFCeController
{
    private $tools;
    private $config;
    
    public function __construct()
    {
        $this->config = json_decode(file_get_contents(__DIR__ . '/../../config/config.json'), true);
        $this->tools = new Tools(json_encode($this->config));
    }
    
    /**
     * Emitir NFCe a partir de um serviço finalizado
     */
    public function emitirNFCe(Request $request, Response $response): Response
    {
        try {
            $data = json_decode($request->getBody(), true);
            
            // Validar dados de entrada
            $this->validarDados($data);
            
            // Criar NFCe
            $nfce = $this->criarNFCe($data);
            
            // Assinar XML
            $xmlAssinado = $this->tools->signNFe($nfce);
            
            // Enviar para SEFAZ
            $resultado = $this->tools->sefazEnviaLote([$xmlAssinado], 1);
            
            // Processar retorno
            $retorno = $this->processarRetorno($resultado, $xmlAssinado);
            
            // Salvar no banco
            $this->salvarNFe($retorno, $data['service_id']);
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'nfce' => $retorno
            ]));
            
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]));
            
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
    }
    
    /**
     * Gerar DANFE em PDF
     */
    public function gerarDANFE(Request $request, Response $response): Response
    {
        try {
            $chave = $request->getAttribute('chave');
            
            // Buscar XML da NFCe
            $xml = $this->buscarXML($chave);
            
            // Gerar PDF
            $danfe = new Danfe($xml);
            $danfe->montaDANFE();
            $pdf = $danfe->render();
            
            // Salvar PDF
            $pdfPath = $this->salvarPDF($pdf, $chave);
            
            $response->getBody()->write($pdf);
            
            return $response
                ->withHeader('Content-Type', 'application/pdf')
                ->withHeader('Content-Disposition', 'inline; filename="danfe_' . $chave . '.pdf"');
                
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]));
            
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
    }
    
    /**
     * Consultar status na SEFAZ
     */
    public function consultarStatus(Request $request, Response $response): Response
    {
        try {
            $chave = $request->getAttribute('chave');
            
            // Consultar na SEFAZ
            $resultado = $this->tools->sefazConsultaChave($chave);
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'status' => $this->processarStatusConsulta($resultado)
            ]));
            
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]));
            
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
    }
    
    private function criarNFCe(array $data): string
    {
        $nfce = new Make();
        
        // Identificação da NFCe
        $nfce->taginfNFe([
            'versao' => '4.00',
            'Id' => null,
            'pk_nItem' => null
        ]);
        
        // Dados da NFCe
        $nfce->tagide([
            'cUF' => 32, // Espírito Santo
            'cNF' => rand(10000000, 99999999),
            'natOp' => 'Prestação de Serviços',
            'mod' => 65, // NFCe
            'serie' => $this->config['serie_nfce'],
            'nNF' => $this->getProximoNumero(),
            'dhEmi' => date('Y-m-d\TH:i:sP'),
            'tpNF' => 1, // Saída
            'idDest' => 1, // Operação interna
            'cMunFG' => 3205309, // Vitória - ES
            'tpImp' => 4, // NFCe em papel
            'tpEmis' => 1, // Emissão normal
            'tpAmb' => $this->config['ambiente'] === 'producao' ? 1 : 2,
            'finNFe' => 1, // NFCe normal
            'indFinal' => 1, // Consumidor final
            'indPres' => 1, // Operação presencial
            'procEmi' => 0, // Emissão por aplicativo do contribuinte
            'verProc' => '1.0.0'
        ]);
        
        // Emitente
        $nfce->tagemit([
            'CNPJ' => $this->config['empresa']['cnpj'],
            'xNome' => $this->config['empresa']['razao_social'],
            'xFant' => $this->config['empresa']['nome_fantasia'],
            'IE' => $this->config['empresa']['ie'],
            'CRT' => 3 // Regime Normal
        ]);
        
        // Endereço do emitente
        $nfce->tagenderEmit([
            'xLgr' => $this->config['empresa']['endereco']['logradouro'],
            'nro' => $this->config['empresa']['endereco']['numero'],
            'xBairro' => $this->config['empresa']['endereco']['bairro'],
            'cMun' => 3205309, // Vitória - ES
            'xMun' => $this->config['empresa']['endereco']['cidade'],
            'UF' => $this->config['empresa']['endereco']['uf'],
            'CEP' => preg_replace('/\D/', '', $this->config['empresa']['endereco']['cep']),
            'cPais' => 1058,
            'xPais' => 'Brasil',
            'fone' => preg_replace('/\D/', '', $this->config['empresa']['telefone'])
        ]);
        
        // Destinatário (se houver)
        if (!empty($data['customer'])) {
            $this->adicionarDestinatario($nfce, $data['customer']);
        }
        
        // Itens da NFCe
        $this->adicionarItens($nfce, $data['items']);
        
        // Totais
        $this->calcularTotais($nfce, $data['items']);
        
        // Forma de pagamento
        $this->adicionarPagamento($nfce, $data['payment']);
        
        // Informações adicionais
        $nfce->taginfAdic([
            'infCpl' => 'Serviço realizado na Paulo Cell - Assistência Técnica'
        ]);
        
        return $nfce->getXML();
    }
    
    private function adicionarItens(Make $nfce, array $items): void
    {
        foreach ($items as $index => $item) {
            $nItem = $index + 1;
            
            // Produto/Serviço
            $nfce->tagprod([
                'nItem' => $nItem,
                'cProd' => $item['codigo'],
                'cEAN' => 'SEM GTIN',
                'xProd' => $item['descricao'],
                'NCM' => $item['ncm'] ?? '95030000', // Serviços de reparo
                'CFOP' => $item['cfop'] ?? '5933', // Prestação de serviços
                'uCom' => 'UN',
                'qCom' => $item['quantidade'],
                'vUnCom' => number_format($item['valor_unitario'], 2, '.', ''),
                'vProd' => number_format($item['quantidade'] * $item['valor_unitario'], 2, '.', ''),
                'cEANTrib' => 'SEM GTIN',
                'uTrib' => 'UN',
                'qTrib' => $item['quantidade'],
                'vUnTrib' => number_format($item['valor_unitario'], 2, '.', ''),
                'indTot' => 1
            ]);
            
            // Impostos
            $nfce->tagimposto([
                'nItem' => $nItem
            ]);
            
            // ICMS
            $nfce->tagICMSSN([
                'nItem' => $nItem,
                'orig' => 0,
                'CSOSN' => '500', // ICMS cobrado anteriormente por substituição tributária
                'pCredSN' => '',
                'vCredICMSSN' => ''
            ]);
            
            // PIS
            $nfce->tagPISNT([
                'nItem' => $nItem,
                'CST' => '07' // Operação isenta da contribuição
            ]);
            
            // COFINS
            $nfce->tagCOFINSNT([
                'nItem' => $nItem,
                'CST' => '07' // Operação isenta da contribuição
            ]);
        }
    }
    
    private function calcularTotais(Make $nfce, array $items): void
    {
        $vBC = 0;
        $vICMS = 0;
        $vProd = 0;
        $vNF = 0;
        
        foreach ($items as $item) {
            $vProd += $item['quantidade'] * $item['valor_unitario'];
        }
        
        $vNF = $vProd;
        
        // Totais dos produtos
        $nfce->tagICMSTot([
            'vBC' => number_format($vBC, 2, '.', ''),
            'vICMS' => number_format($vICMS, 2, '.', ''),
            'vICMSDeson' => '0.00',
            'vFCP' => '0.00',
            'vBCST' => '0.00',
            'vST' => '0.00',
            'vFCPST' => '0.00',
            'vFCPSTRet' => '0.00',
            'vProd' => number_format($vProd, 2, '.', ''),
            'vFrete' => '0.00',
            'vSeg' => '0.00',
            'vDesc' => '0.00',
            'vII' => '0.00',
            'vIPI' => '0.00',
            'vIPIDevol' => '0.00',
            'vPIS' => '0.00',
            'vCOFINS' => '0.00',
            'vOutro' => '0.00',
            'vNF' => number_format($vNF, 2, '.', ''),
            'vTotTrib' => '0.00'
        ]);
    }
    
    private function adicionarPagamento(Make $nfce, array $payment): void
    {
        $nfce->tagpag([
            'vTroco' => '0.00'
        ]);
        
        $nfce->tagdetPag([
            'indPag' => 0, // Pagamento à vista
            'tPag' => $this->getCodigoPagamento($payment['method']),
            'vPag' => number_format($payment['amount'], 2, '.', '')
        ]);
    }
    
    private function getCodigoPagamento(string $method): string
    {
        $map = [
            'money' => '01',      // Dinheiro
            'credit' => '03',     // Cartão de Crédito
            'debit' => '04',      // Cartão de Débito
            'pix' => '17',        // PIX
            'check' => '02',      // Cheque
            'bank_transfer' => '05' // Transferência bancária
        ];
        
        return $map[$method] ?? '99'; // Outros
    }
    
    private function validarDados(array $data): void
    {
        if (empty($data['service_id'])) {
            throw new \InvalidArgumentException('ID do serviço é obrigatório');
        }
        
        if (empty($data['items']) || !is_array($data['items'])) {
            throw new \InvalidArgumentException('Itens são obrigatórios');
        }
        
        if (empty($data['payment'])) {
            throw new \InvalidArgumentException('Informações de pagamento são obrigatórias');
        }
    }
    
    private function processarRetorno(string $resultado, string $xmlAssinado): array
    {
        // Processar XML de retorno da SEFAZ
        $dom = new \DOMDocument();
        $dom->loadXML($resultado);
        
        // Extrair informações importantes
        $protNFe = $dom->getElementsByTagName('protNFe')->item(0);
        $chave = $dom->getElementsByTagName('chNFe')->item(0)->nodeValue;
        $protocolo = $dom->getElementsByTagName('nProt')->item(0)->nodeValue;
        $dhRecbto = $dom->getElementsByTagName('dhRecbto')->item(0)->nodeValue;
        
        return [
            'chave' => $chave,
            'protocolo' => $protocolo,
            'data_autorizacao' => $dhRecbto,
            'xml' => $xmlAssinado,
            'xml_protocolo' => $resultado,
            'status' => 'autorizado'
        ];
    }
    
    private function salvarNFe(array $nfe, string $serviceId): void
    {
        // Salvar XML
        $xmlPath = __DIR__ . '/../../storage/xmls/' . $nfe['chave'] . '.xml';
        file_put_contents($xmlPath, $nfe['xml']);
        
        // Aqui você integraria com o banco do Supabase
        // Por exemplo, fazendo uma requisição HTTP para uma Edge Function
    }
    
    private function getProximoNumero(): int
    {
        // Implementar lógica para obter próximo número sequencial
        // Pode ser via banco de dados ou arquivo de controle
        return 1; // Placeholder
    }
}
```

---

## 🔗 Integração com Frontend

### 🎯 **Service de NFe**

#### **src/services/nfeService.ts**
```typescript
interface NFeItem {
  codigo: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  ncm?: string;
  cfop?: string;
}

interface NFePayment {
  method: 'money' | 'credit' | 'debit' | 'pix' | 'check' | 'bank_transfer';
  amount: number;
}

interface NFeCustomer {
  nome?: string;
  cpf?: string;
  cnpj?: string;
  email?: string;
}

interface NFeData {
  service_id: string;
  items: NFeItem[];
  payment: NFePayment;
  customer?: NFeCustomer;
}

interface NFeResponse {
  success: boolean;
  nfce?: {
    chave: string;
    protocolo: string;
    data_autorizacao: string;
    status: string;
  };
  error?: string;
}

class NFeService {
  private apiUrl: string;
  
  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_NFE_API_URL || 'https://api-nfe.paulo-cell.com';
  }
  
  /**
   * Emitir NFCe para um serviço
   */
  async emitirNFCe(data: NFeData): Promise<NFeResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/nfce/emitir`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getApiToken()}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao emitir NFCe:', error);
      throw error;
    }
  }
  
  /**
   * Gerar DANFE em PDF
   */
  async gerarDANFE(chave: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.apiUrl}/danfe/${chave}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getApiToken()}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.blob();
    } catch (error) {
      console.error('Erro ao gerar DANFE:', error);
      throw error;
    }
  }
  
  /**
   * Consultar status da NFCe
   */
  async consultarStatus(chave: string): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/nfce/status/${chave}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getApiToken()}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao consultar status:', error);
      throw error;
    }
  }
  
  /**
   * Download direto do DANFE
   */
  async downloadDANFE(chave: string, nomeArquivo?: string): Promise<void> {
    try {
      const blob = await this.gerarDANFE(chave);
      
      // Criar URL temporária para download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nomeArquivo || `danfe_${chave}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar DANFE:', error);
      throw error;
    }
  }
  
  private getApiToken(): string {
    // Implementar lógica de autenticação
    return localStorage.getItem('nfe_api_token') || '';
  }
}

export const nfeService = new NFeService();
export type { NFeData, NFeResponse, NFeItem, NFePayment, NFeCustomer };
```

### 🎨 **Componente de Emissão NFCe**

#### **src/components/EmissaoNFCe.tsx**
```typescript
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { nfeService, type NFeData } from '@/services/nfeService';

interface EmissaoNFCeProps {
  serviceId: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalAmount: number;
  paymentMethod: string;
  customer?: {
    name?: string;
    document?: string;
    email?: string;
  };
}

export const EmissaoNFCe: React.FC<EmissaoNFCeProps> = ({
  serviceId,
  items,
  totalAmount,
  paymentMethod,
  customer
}) => {
  const [isEmitting, setIsEmitting] = useState(false);
  const [nfceData, setNfceData] = useState<any>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  const handleEmitirNFCe = async () => {
    try {
      setIsEmitting(true);
      
      // Preparar dados para emissão
      const nfeData: NFeData = {
        service_id: serviceId,
        items: items.map((item, index) => ({
          codigo: `SERV-${index + 1}`,
          descricao: item.description,
          quantidade: item.quantity,
          valor_unitario: item.unitPrice,
          ncm: '95030000', // Serviços de reparo
          cfop: '5933' // Prestação de serviços
        })),
        payment: {
          method: mapPaymentMethod(paymentMethod),
          amount: totalAmount
        },
        customer: customer ? {
          nome: customer.name,
          cpf: customer.document?.length === 11 ? customer.document : undefined,
          cnpj: customer.document?.length === 14 ? customer.document : undefined,
          email: customer.email
        } : undefined
      };
      
      // Emitir NFCe
      const response = await nfeService.emitirNFCe(nfeData);
      
      if (response.success && response.nfce) {
        setNfceData(response.nfce);
        toast({
          title: 'NFCe emitida com sucesso!',
          description: `Chave: ${response.nfce.chave}`,
        });
      } else {
        throw new Error(response.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao emitir NFCe:', error);
      toast({
        title: 'Erro ao emitir NFCe',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    } finally {
      setIsEmitting(false);
    }
  };
  
  const handleGerarDANFE = async () => {
    if (!nfceData?.chave) return;
    
    try {
      setIsGeneratingPDF(true);
      await nfeService.downloadDANFE(nfceData.chave, `NFCe_${nfceData.chave}.pdf`);
      
      toast({
        title: 'DANFE gerado com sucesso!',
        description: 'O arquivo PDF foi baixado automaticamente.',
      });
    } catch (error) {
      console.error('Erro ao gerar DANFE:', error);
      toast({
        title: 'Erro ao gerar DANFE',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  
  const handleConsultarStatus = async () => {
    if (!nfceData?.chave) return;
    
    try {
      const status = await nfeService.consultarStatus(nfceData.chave);
      
      toast({
        title: 'Status consultado',
        description: `Status atual: ${status.status}`,
      });
    } catch (error) {
      console.error('Erro ao consultar status:', error);
      toast({
        title: 'Erro ao consultar status',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    }
  };
  
  const mapPaymentMethod = (method: string): any => {
    const map: Record<string, any> = {
      'cash': 'money',
      'credit_card': 'credit',
      'debit_card': 'debit',
      'pix': 'pix',
      'bank_transfer': 'bank_transfer',
      'check': 'check'
    };
    return map[method] || 'money';
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Nota Fiscal Eletrônica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumo do Serviço */}
        <div className="space-y-2">
          <h4 className="font-medium">Resumo da Emissão</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Valor Total:</span>
              <span className="ml-2 font-medium">
                R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Forma de Pagamento:</span>
              <span className="ml-2 font-medium">{paymentMethod}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Itens:</span>
              <span className="ml-2 font-medium">{items.length}</span>
            </div>
            {customer?.name && (
              <div>
                <span className="text-muted-foreground">Cliente:</span>
                <span className="ml-2 font-medium">{customer.name}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Status da NFCe */}
        {nfceData ? (
          <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <Badge variant="default" className="bg-green-600">
                NFCe Autorizada
              </Badge>
              <div className="text-sm text-muted-foreground">
                {new Date(nfceData.data_autorizacao).toLocaleString('pt-BR')}
              </div>
            </div>
            
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-muted-foreground">Chave:</span>
                <span className="ml-2 font-mono text-xs">{nfceData.chave}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Protocolo:</span>
                <span className="ml-2 font-mono text-xs">{nfceData.protocolo}</span>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={handleGerarDANFE}
                disabled={isGeneratingPDF}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isGeneratingPDF ? 'Gerando...' : 'Baixar DANFE'}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleConsultarStatus}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Consultar Status
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleEmitirNFCe}
            disabled={isEmitting}
            className="w-full flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            {isEmitting ? 'Emitindo NFCe...' : 'Emitir NFCe'}
          </Button>
        )}
        
        {/* Lista de Itens */}
        <div className="space-y-2">
          <h4 className="font-medium">Itens da NFCe</h4>
          <div className="space-y-1 text-sm">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between py-1 border-b border-gray-100">
                <span>{item.description}</span>
                <span>
                  {item.quantity}x R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

---

## 🗄️ Modificações no Banco de Dados

### 📊 **Novas Tabelas e Campos**

```sql
-- Adicionar campos NFCe na tabela fiscal_documents existente
ALTER TABLE fiscal_documents ADD COLUMN IF NOT EXISTS nfce_chave VARCHAR(44);
ALTER TABLE fiscal_documents ADD COLUMN IF NOT EXISTS nfce_protocolo VARCHAR(20);
ALTER TABLE fiscal_documents ADD COLUMN IF NOT EXISTS nfce_xml_content TEXT;
ALTER TABLE fiscal_documents ADD COLUMN IF NOT EXISTS danfe_url TEXT;
ALTER TABLE fiscal_documents ADD COLUMN IF NOT EXISTS nfce_environment VARCHAR(10) DEFAULT 'producao';

-- Tabela para controle de numeração
CREATE TABLE IF NOT EXISTS nfce_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  serie INTEGER DEFAULT 1,
  proximo_numero INTEGER DEFAULT 1,
  ambiente VARCHAR(10) DEFAULT 'producao',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, serie, ambiente)
);

-- Tabela para log de operações NFCe
CREATE TABLE IF NOT EXISTS nfce_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  service_id UUID REFERENCES services(id),
  chave_nfce VARCHAR(44),
  operacao VARCHAR(50), -- 'emissao', 'consulta', 'cancelamento'
  status VARCHAR(20),   -- 'sucesso', 'erro', 'pendente'
  detalhes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Função para obter próximo número da NFCe
CREATE OR REPLACE FUNCTION get_next_nfce_number(
  p_organization_id UUID,
  p_serie INTEGER DEFAULT 1,
  p_ambiente VARCHAR DEFAULT 'producao'
)
RETURNS INTEGER AS $$
DECLARE
  v_proximo_numero INTEGER;
BEGIN
  -- Inserir ou atualizar controle de numeração
  INSERT INTO nfce_control (organization_id, serie, ambiente, proximo_numero)
  VALUES (p_organization_id, p_serie, p_ambiente, 1)
  ON CONFLICT (organization_id, serie, ambiente)
  DO UPDATE SET 
    proximo_numero = nfce_control.proximo_numero + 1,
    updated_at = NOW()
  RETURNING proximo_numero INTO v_proximo_numero;
  
  RETURN v_proximo_numero;
END;
$$ LANGUAGE plpgsql;

-- Função para salvar NFCe emitida
CREATE OR REPLACE FUNCTION save_nfce_data(
  p_service_id UUID,
  p_organization_id UUID,
  p_chave VARCHAR,
  p_protocolo VARCHAR,
  p_xml_content TEXT,
  p_ambiente VARCHAR DEFAULT 'producao'
)
RETURNS UUID AS $$
DECLARE
  v_document_id UUID;
BEGIN
  -- Inserir documento fiscal
  INSERT INTO fiscal_documents (
    type,
    number,
    status,
    customer_id,
    customer_name,
    issue_date,
    total_value,
    organization_id,
    user_id,
    nfce_chave,
    nfce_protocolo,
    nfce_xml_content,
    nfce_environment
  )
  SELECT 
    'nfce',
    EXTRACT(EPOCH FROM NOW())::TEXT, -- Número temporário
    'authorized',
    s.customer_id,
    c.name,
    NOW(),
    s.price,
    p_organization_id,
    auth.uid(),
    p_chave,
    p_protocolo,
    p_xml_content,
    p_ambiente
  FROM services s
  LEFT JOIN customers c ON s.customer_id = c.id
  WHERE s.id = p_service_id
  RETURNING id INTO v_document_id;
  
  -- Log da operação
  INSERT INTO nfce_logs (
    organization_id,
    service_id,
    chave_nfce,
    operacao,
    status,
    detalhes
  ) VALUES (
    p_organization_id,
    p_service_id,
    p_chave,
    'emissao',
    'sucesso',
    jsonb_build_object(
      'protocolo', p_protocolo,
      'ambiente', p_ambiente
    )
  );
  
  RETURN v_document_id;
END;
$$ LANGUAGE plpgsql;
```

### 🔄 **Edge Function para Integração**

#### **supabase/functions/nfce-webhook/index.ts**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { method, url } = req
    const urlObj = new URL(url)
    const path = urlObj.pathname

    if (method === 'POST' && path === '/nfce-webhook') {
      // Webhook para receber dados da API NFCe
      const body = await req.json()
      
      const { data, error } = await supabase.rpc('save_nfce_data', {
        p_service_id: body.service_id,
        p_organization_id: body.organization_id,
        p_chave: body.chave,
        p_protocolo: body.protocolo,
        p_xml_content: body.xml_content,
        p_ambiente: body.ambiente
      })

      if (error) {
        throw error
      }

      return new Response(
        JSON.stringify({ success: true, document_id: data }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    if (method === 'GET' && path.startsWith('/nfce-number/')) {
      // Obter próximo número da NFCe
      const organizationId = urlObj.searchParams.get('organization_id')
      const serie = parseInt(urlObj.searchParams.get('serie') || '1')
      const ambiente = urlObj.searchParams.get('ambiente') || 'producao'

      const { data, error } = await supabase.rpc('get_next_nfce_number', {
        p_organization_id: organizationId,
        p_serie: serie,
        p_ambiente: ambiente
      })

      if (error) {
        throw error
      }

      return new Response(
        JSON.stringify({ next_number: data }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders })

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
```

---

## ⚙️ Configuração e Deploy

### 🐳 **Dockerfile para API NFCe**

```dockerfile
FROM php:8.1-apache

# Instalar extensões necessárias
RUN apt-get update && apt-get install -y \
    libzip-dev \
    zip \
    unzip \
    git \
    libxml2-dev \
    libcurl4-openssl-dev \
    && docker-php-ext-install \
    zip \
    xml \
    curl \
    soap

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Configurar diretório de trabalho
WORKDIR /var/www/html

# Copiar arquivos
COPY . .

# Instalar dependências
RUN composer install --no-dev --optimize-autoloader

# Configurar permissões
RUN chown -R www-data:www-data /var/www/html
RUN chmod -R 755 /var/www/html

# Expor porta
EXPOSE 80

CMD ["apache2-foreground"]
```

### 🚀 **Deploy no Railway.app**

#### **railway.json**
```json
{
  "build": {
    "builder": "DOCKERFILE"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### **Variáveis de Ambiente**
```bash
# Certificado Digital
CERT_PASSWORD=sua_senha_certificado

# Ambiente SEFAZ
NFE_AMBIENTE=producao  # ou homologacao

# Banco de Dados
DATABASE_URL=postgresql://user:pass@host:port/db

# Supabase Integration
SUPABASE_URL=https://sua-url.supabase.co
SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# API Security
API_SECRET_KEY=sua_chave_secreta
```

### 📋 **Checklist de Deploy**

```markdown
## Pré-Deploy
- [ ] Certificado Digital A1 configurado
- [ ] Credenciais SEFAZ validadas
- [ ] Ambiente de homologação testado
- [ ] Banco de dados configurado
- [ ] Variáveis de ambiente definidas

## Deploy
- [ ] Build da imagem Docker
- [ ] Deploy no Railway/Heroku/VPS
- [ ] Teste de conectividade SEFAZ
- [ ] Teste de emissão em homologação
- [ ] Validação de webhook/callbacks

## Pós-Deploy
- [ ] Monitoramento de logs ativo
- [ ] Backup de certificados
- [ ] Documentação atualizada
- [ ] Treinamento da equipe
```

---

## 🧪 Testes e Homologação

### 🔬 **Testes Unitários**

#### **tests/NFeTest.php**
```php
<?php

use PHPUnit\Framework\TestCase;
use PauloCell\NFe\Controllers\NFCeController;

class NFeTest extends TestCase
{
    private $controller;
    
    protected function setUp(): void
    {
        $this->controller = new NFCeController();
    }
    
    public function testEmissaoNFCeBasica()
    {
        $dados = [
            'service_id' => 'uuid-test',
            'items' => [
                [
                    'codigo' => 'SERV-001',
                    'descricao' => 'Troca de Tela iPhone',
                    'quantidade' => 1,
                    'valor_unitario' => 200.00,
                    'ncm' => '95030000',
                    'cfop' => '5933'
                ]
            ],
            'payment' => [
                'method' => 'money',
                'amount' => 200.00
            ]
        ];
        
        // Simular emissão em ambiente de homologação
        $resultado = $this->controller->emitirNFCeHomologacao($dados);
        
        $this->assertTrue($resultado['success']);
        $this->assertNotEmpty($resultado['nfce']['chave']);
        $this->assertEquals(44, strlen($resultado['nfce']['chave']));
    }
    
    public function testValidacaoDados()
    {
        $this->expectException(\InvalidArgumentException::class);
        
        $dados = []; // Dados inválidos
        
        $this->controller->emitirNFCe($dados);
    }
    
    public function testGeracaoDANFE()
    {
        $chave = '32250114200166000177650010000000051123456789';
        
        $pdf = $this->controller->gerarDANFE($chave);
        
        $this->assertNotEmpty($pdf);
        $this->assertStringStartsWith('%PDF', $pdf);
    }
}
```

### 🎯 **Testes de Integração**

#### **tests/IntegrationTest.php**
```php
<?php

use PHPUnit\Framework\TestCase;

class IntegrationTest extends TestCase
{
    public function testFluxoCompletoNFCe()
    {
        // 1. Emitir NFCe
        $nfce = $this->emitirNFCeTeste();
        $this->assertNotEmpty($nfce['chave']);
        
        // 2. Consultar status
        $status = $this->consultarStatus($nfce['chave']);
        $this->assertEquals('autorizado', $status['situacao']);
        
        // 3. Gerar DANFE
        $pdf = $this->gerarDANFE($nfce['chave']);
        $this->assertNotEmpty($pdf);
        
        // 4. Verificar salvamento no banco
        $documento = $this->buscarDocumento($nfce['chave']);
        $this->assertNotNull($documento);
    }
    
    public function testIntegracaoSupabase()
    {
        // Testar webhook de integração
        $dados = [
            'service_id' => 'test-uuid',
            'organization_id' => 'org-uuid',
            'chave' => '32250114200166000177650010000000051123456789',
            'protocolo' => '123456789012345',
            'xml_content' => '<xml>...</xml>',
            'ambiente' => 'homologacao'
        ];
        
        $response = $this->chamarWebhookSupabase($dados);
        
        $this->assertTrue($response['success']);
        $this->assertNotEmpty($response['document_id']);
    }
}
```

---

## 📊 Interface do Usuário

### 🎨 **Integração na Página de Serviços**

#### **Modificação em src/pages/Services.tsx**
```typescript
// Adicionar importação do componente NFCe
import { EmissaoNFCe } from '@/components/EmissaoNFCe';

// Adicionar estado para controle da NFCe
const [showNFCeDialog, setShowNFCeDialog] = useState(false);
const [selectedServiceForNFCe, setSelectedServiceForNFCe] = useState<any>(null);

// Função para emitir NFCe
const handleEmitirNFCe = (service: any) => {
  setSelectedServiceForNFCe(service);
  setShowNFCeDialog(true);
};

// Adicionar botão na action menu dos serviços
<DropdownMenuItem onClick={() => handleEmitirNFCe(service)}>
  <FileText className="mr-2 h-4 w-4" />
  Emitir NFCe
</DropdownMenuItem>

// Dialog para emissão de NFCe
<Dialog open={showNFCeDialog} onOpenChange={setShowNFCeDialog}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Emissão de NFCe</DialogTitle>
      <DialogDescription>
        Emitir Nota Fiscal Eletrônica para o serviço
      </DialogDescription>
    </DialogHeader>
    
    {selectedServiceForNFCe && (
      <EmissaoNFCe
        serviceId={selectedServiceForNFCe.id}
        items={[
          {
            description: selectedServiceForNFCe.service_type,
            quantity: 1,
            unitPrice: selectedServiceForNFCe.price
          }
        ]}
        totalAmount={selectedServiceForNFCe.price}
        paymentMethod={selectedServiceForNFCe.payment_method || 'cash'}
        customer={selectedServiceForNFCe.customers ? {
          name: selectedServiceForNFCe.customers.name,
          document: selectedServiceForNFCe.customers.document,
          email: selectedServiceForNFCe.customers.email
        } : undefined}
      />
    )}
  </DialogContent>
</Dialog>
```

### 📄 **Nova Aba no Módulo Documentos**

#### **Modificação em src/pages/Documents.tsx**
```typescript
// Adicionar nova aba para NFCe
<Tabs value={currentTab} onValueChange={setCurrentTab}>
  <TabsList>
    <TabsTrigger value="all">Todos</TabsTrigger>
    <TabsTrigger value="nfce">NFCe</TabsTrigger>
    <TabsTrigger value="nfe">NFe</TabsTrigger>
    <TabsTrigger value="nfs">NFS-e</TabsTrigger>
  </TabsList>
  
  <TabsContent value="nfce">
    <NFCeList 
      documents={documents.filter(doc => doc.type === 'nfce')}
      onRefresh={forceRefresh}
    />
  </TabsContent>
</Tabs>
```

### 🎯 **Dashboard NFCe**

#### **src/components/NFCeDashboard.tsx**
```typescript
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

interface NFCeStats {
  total_emitidas: number;
  autorizadas: number;
  canceladas: number;
  receita_total: number;
  receita_mes: number;
}

export const NFCeDashboard: React.FC = () => {
  const [stats, setStats] = useState<NFCeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchNFCeStats();
  }, []);
  
  const fetchNFCeStats = async () => {
    try {
      // Buscar estatísticas via Supabase
      const { data, error } = await supabase.rpc('get_nfce_stats');
      
      if (error) throw error;
      
      setStats(data);
    } catch (error) {
      console.error('Erro ao buscar estatísticas NFCe:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return <div>Carregando estatísticas...</div>;
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">NFCe Emitidas</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.total_emitidas || 0}</div>
          <p className="text-xs text-muted-foreground">Total no período</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Autorizadas</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats?.autorizadas || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats?.total_emitidas ? 
              ((stats.autorizadas / stats.total_emitidas) * 100).toFixed(1) : 0}% 
            do total
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {(stats?.receita_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">Via NFCe</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {(stats?.receita_mes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">Receita do mês</p>
        </CardContent>
      </Card>
    </div>
  );
};
```

---

## 🚀 Roadmap de Implementação

### 📅 **Cronograma Detalhado (8 semanas)**

#### **🔥 Semana 1-2: Preparação e Setup**
- [ ] **Configurar ambiente de desenvolvimento**
  - Instalar PHP 8.1+ e dependências
  - Configurar NFePHP.org
  - Setup ambiente de homologação SEFAZ
- [ ] **Obter certificado digital A1**
- [ ] **Criar estrutura do microserviço**
  - Configurar Composer
  - Implementar controllers básicos
  - Setup de logs e monitoramento

#### **🛠️ Semana 3-4: Desenvolvimento Core**
- [ ] **Implementar emissão de NFCe**
  - Controller de emissão
  - Validações de dados
  - Integração com SEFAZ
- [ ] **Desenvolver geração de DANFE**
  - Geração de PDF
  - Storage de arquivos
  - Download automático
- [ ] **Criar testes unitários**
  - Testes de emissão
  - Testes de validação
  - Testes de integração

#### **🔗 Semana 5-6: Integração Frontend**
- [ ] **Desenvolver serviço NFCe no React**
  - API client
  - Hooks customizados
  - Tratamento de erros
- [ ] **Criar componentes de UI**
  - Componente de emissão
  - Dashboard NFCe
  - Lista de documentos
- [ ] **Integrar com páginas existentes**
  - Modificar página de serviços
  - Atualizar página de documentos
  - Adicionar no dashboard principal

#### **🗄️ Semana 7: Banco de Dados e Deploy**
- [ ] **Implementar mudanças no banco**
  - Criar novas tabelas
  - Implementar RPC functions
  - Configurar Edge Functions
- [ ] **Deploy da aplicação**
  - Configurar Railway.app/VPS
  - Setup de variáveis de ambiente
  - Configurar domínio e SSL
- [ ] **Testes em produção**
  - Teste de conectividade
  - Emissão em homologação
  - Validação de webhooks

#### **✅ Semana 8: Testes e Ajustes Finais**
- [ ] **Testes completos**
  - Teste de fluxo completo
  - Testes de performance
  - Validação com usuários
- [ ] **Documentação final**
  - Manual do usuário
  - Documentação técnica
  - Treinamento da equipe
- [ ] **Go-live**
  - Migração para ambiente de produção
  - Monitoramento inicial
  - Suporte ativo

---

## 📞 Suporte e Manutenção

### 🔧 **Checklist de Manutenção**

#### **🔄 Manutenção Mensal**
- [ ] **Atualizar bibliotecas NFePHP.org**
- [ ] **Verificar certificado digital (validade)**
- [ ] **Backup de XMLs e logs**
- [ ] **Verificar conectividade SEFAZ**
- [ ] **Análise de logs de erro**

#### **📊 Monitoramento Contínuo**
- [ ] **Taxa de sucesso na emissão**
- [ ] **Tempo de resposta da SEFAZ**
- [ ] **Espaço em disco (XMLs/PDFs)**
- [ ] **Performance da API**
- [ ] **Alertas de falha**

#### **🚨 Plano de Contingência**
```markdown
## Em Caso de Falha na SEFAZ

1. **Verificar Status SEFAZ**
   - Consultar site oficial
   - Verificar comunicados

2. **Ativar Modo Contingência**
   - Emissão offline
   - Envio posterior
   - Numeração sequencial

3. **Comunicação com Clientes**
   - Informar sobre falha temporária
   - Fornecer comprovantes alternativos
   - Reagendar emissões se necessário

## Em Caso de Erro de Certificado

1. **Verificar Validade**
   - Data de expiração
   - Integridade do arquivo

2. **Renovar Certificado**
   - Contatar AC (Autoridade Certificadora)
   - Instalar novo certificado
   - Testar emissão

3. **Backup de Segurança**
   - Manter certificado sobressalente
   - Documentar processo de renovação
```

### 📚 **Recursos de Aprendizado**

#### **🔗 Links Úteis**
- **NFePHP.org Documentação:** https://nfephp.readthedocs.io/
- **SEFAZ ES Portal:** https://www.sefaz.es.gov.br/
- **Manual NFCe SEFAZ:** [Link oficial]
- **Comunidade NFePHP:** https://github.com/nfephp-org

#### **📖 Cursos Recomendados**
- Curso NFePHP.org Básico
- Certificação SEFAZ para NFCe
- PHP para Integração Fiscal

#### **👥 Suporte Técnico**
- **Comunidade NFePHP:** GitHub Issues
- **SEFAZ ES:** Canal de suporte técnico
- **Consultoria Especializada:** Se necessário

---

## 💰 Custo-Benefício

### 📊 **Análise Financeira**

#### **💸 Custos Iniciais**
- **Certificado Digital A1:** R$ 200-400/ano
- **Desenvolvimento:** 40-60 horas
- **Hospedagem API:** R$ 50-200/mês
- **Testes e Homologação:** 10-20 horas

#### **💰 Economia vs APIs Pagas**
```
NFCe Emitidas/Mês: 1.000
Custo API Paga: R$ 0,50/NFCe
Economia Mensal: R$ 500
Economia Anual: R$ 6.000

ROI: Retorno do investimento em 2-3 meses
```

#### **📈 Benefícios Adicionais**
- ✅ **Controle Total** - Sem dependência de terceiros
- ✅ **Customização** - Adaptado às necessidades específicas
- ✅ **Escalabilidade** - Sem limite de NFCe
- ✅ **Integração Nativa** - Perfeita com o sistema existente
- ✅ **Conhecimento Interno** - Equipe aprende tecnologia fiscal

---

## 🔚 Conclusão

Este guia fornece um **roadmap completo** para implementação de emissão de NFe/NFCe **gratuita** no projeto Paulo Cell. A solução proposta oferece:

1. **💰 Economia Significativa** - Sem custos por NFCe emitida
2. **🔧 Controle Total** - Customização completa do processo
3. **⚡ Performance** - Integração direta com SEFAZ
4. **🛡️ Confiabilidade** - Base sólida do NFePHP.org
5. **📈 Escalabilidade** - Cresce com o negócio

### 🚀 **Próximos Passos**

1. **Aprovar implementação** e definir cronograma
2. **Obter certificado digital** A1
3. **Configurar ambiente** de desenvolvimento
4. **Iniciar desenvolvimento** seguindo este guia

### 📞 **Suporte**

Para dúvidas sobre implementação, consulte:
- Este documento
- Documentação NFePHP.org  
- Comunidade GitHub

---

> **📄 Documento Técnico - Paulo Cell NFCe Implementation**  
> **Versão:** 1.0  
> **Data:** Janeiro 2025  
> **Status:** Pronto para Implementação  
> **Próxima Revisão:** Após conclusão da Fase 1  

**🔒 Confidencial - Uso Interno Apenas**
