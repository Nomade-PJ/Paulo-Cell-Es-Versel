# Módulo de Acompanhamento de Status via QR Code

## Visão Geral

Este módulo permite que clientes acompanhem o status de seus serviços escaneando um QR Code, sem necessidade de login ou contato direto com a assistência técnica. O sistema gera um código QR único para cada serviço, que é incluído no comprovante entregue ao cliente.

## Tabelas e Estrutura do Banco de Dados

A implementação requer as seguintes alterações no banco de dados:

```sql
-- Adicionar campos para tracking público na tabela services
ALTER TABLE services ADD COLUMN IF NOT EXISTS public_tracking_id UUID DEFAULT uuid_generate_v4();
ALTER TABLE services ADD COLUMN IF NOT EXISTS public_notes TEXT;

-- Criar índice para consultas mais rápidas
CREATE INDEX IF NOT EXISTS idx_services_public_tracking_id ON services(public_tracking_id);

-- Criar tabela para rastreamento de visualizações
CREATE TABLE IF NOT EXISTS service_status_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  client_ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar índice para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_service_status_views_service_id ON service_status_views(service_id);
CREATE INDEX IF NOT EXISTS idx_service_status_views_viewed_at ON service_status_views(viewed_at);

-- Verificar se a extensão uuid-ossp está disponível (necessária para uuid_generate_v4())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Preencher UUIDs para registros existentes que não têm
UPDATE services SET public_tracking_id = uuid_generate_v4() WHERE public_tracking_id IS NULL;
```

## Componentes Necessários

1. **Dependências de Pacotes**
   - `qrcode.react` - Para renderização dos QR codes
   - `uuid` - Para geração de identificadores únicos

   Instalação:
   ```bash
   npm install qrcode.react uuid
   ```

2. **Componentes React**

   a. **QRCodeGenerator.tsx** - Componente para geração de QR codes:
   ```tsx
   import React from 'react';
   import { QRCodeSVG } from 'qrcode.react';

   interface QRCodeGeneratorProps {
     serviceId: string;
     size?: number;
     includeMargin?: boolean;
     colorScheme?: 'default' | 'success' | 'warning' | 'error';
     showBorder?: boolean;
   }

   /**
    * Componente para geração de QR Codes para serviços
    * 
    * @param serviceId - ID do serviço ou tracking ID público
    * @param size - Tamanho do QR code em pixels (default: 128)
    * @param includeMargin - Se deve incluir margem ao redor do QR code (default: true)
    * @param colorScheme - Esquema de cores baseado no status (default: 'default')
    * @param showBorder - Se deve mostrar borda ao redor do QR code (default: true)
    */
   const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
     serviceId,
     size = 128,
     includeMargin = true,
     colorScheme = 'default',
     showBorder = true,
   }) => {
     // URL base para a página de status de serviço
     const baseUrl = window.location.origin;
     const trackingUrl = `${baseUrl}/status/${serviceId}`;
     
     // Definir cores baseadas no esquema
     const getColors = () => {
       switch (colorScheme) {
         case 'success':
           return { fgColor: '#10b981', bgColor: '#ecfdf5' }; // Verde
         case 'warning':
           return { fgColor: '#f59e0b', bgColor: '#fffbeb' }; // Amarelo
         case 'error':
           return { fgColor: '#ef4444', bgColor: '#fef2f2' }; // Vermelho
         default:
           return { fgColor: '#3b82f6', bgColor: '#eff6ff' }; // Azul (padrão)
       }
     };
     
     const { fgColor, bgColor } = getColors();
     
     return (
       <div className={`qr-code-container ${showBorder ? 'border rounded p-2' : ''}`}
            style={{ backgroundColor: bgColor, display: 'inline-block' }}>
         <QRCodeSVG
           value={trackingUrl}
           size={size}
           bgColor={bgColor}
           fgColor={fgColor}
           level="M" // QR Code error correction level: L, M, Q, H
           includeMargin={includeMargin}
         />
         <div className="text-xs text-center mt-1" style={{ color: fgColor }}>
           Escaneie para verificar o status
         </div>
       </div>
     );
   };

   export default QRCodeGenerator;
   ```

   b. **ServiceStatusCard.tsx** - Cartão para exibir informações de status:
   ```tsx
   import React from 'react';
   import { formatEstimatedDate, statusToColorScheme, translateStatusForPublic } from '../lib/qrcode-utils';
   import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
   import { Badge } from './ui/badge';
   import { CalendarIcon, PhoneIcon, InfoIcon, WrenchIcon } from 'lucide-react';

   interface ServiceStatusInfo {
     id: string;
     deviceType?: string;
     deviceBrand?: string;
     deviceModel?: string;
     status: string;
     createdAt: string;
     estimatedCompletionDate?: string | null;
     publicNotes?: string;
     technician?: string;
   }

   interface ServiceStatusCardProps {
     serviceInfo: ServiceStatusInfo;
     showQrCode?: boolean;
   }

   /**
    * Componente para exibir informações de status de serviço em um cartão
    * Usado principalmente na página pública de status acessada via QR Code
    */
   const ServiceStatusCard: React.FC<ServiceStatusCardProps> = ({
     serviceInfo,
     showQrCode = false,
   }) => {
     // Determinar esquema de cores baseado no status
     const colorScheme = statusToColorScheme(serviceInfo.status);
     const statusText = translateStatusForPublic(serviceInfo.status);
     
     // Classes para o status baseadas no esquema de cores
     const getStatusClasses = () => {
       switch (colorScheme) {
         case 'success':
           return 'bg-green-100 text-green-800 border-green-200';
         case 'warning':
           return 'bg-yellow-100 text-yellow-800 border-yellow-200';
         case 'error':
           return 'bg-red-100 text-red-800 border-red-200';
         default:
           return 'bg-blue-100 text-blue-800 border-blue-200';
       }
     };
     
     // Obter a data de criação formatada
     const formattedCreationDate = new Date(serviceInfo.createdAt).toLocaleDateString('pt-BR');
     
     // Obter a data estimada de conclusão formatada
     const estimatedDate = formatEstimatedDate(serviceInfo.estimatedCompletionDate || null);
     
     // Descrição do dispositivo
     const deviceDescription = [
       serviceInfo.deviceType,
       serviceInfo.deviceBrand,
       serviceInfo.deviceModel
     ].filter(Boolean).join(' • ');

     return (
       <Card className="w-full max-w-md mx-auto shadow-md">
         <CardHeader className="pb-2">
           <div className="flex justify-between items-start">
             <div>
               <CardTitle className="text-xl">Status do Serviço</CardTitle>
               <CardDescription>
                 Ordem #{serviceInfo.id.substring(0, 8)}
               </CardDescription>
             </div>
             <Badge
               variant="outline"
               className={`${getStatusClasses()} px-3 py-1 font-medium`}
             >
               {statusText}
             </Badge>
           </div>
         </CardHeader>
         
         <CardContent className="space-y-4">
           {deviceDescription && (
             <div className="flex items-center gap-2 text-sm">
               <WrenchIcon className="w-4 h-4 text-muted-foreground" />
               <span className="font-medium">{deviceDescription}</span>
             </div>
           )}
           
           <div className="flex items-center gap-2 text-sm">
             <CalendarIcon className="w-4 h-4 text-muted-foreground" />
             <div>
               <span className="text-muted-foreground">Recebido em:</span>{' '}
               <span className="font-medium">{formattedCreationDate}</span>
             </div>
           </div>
           
           {serviceInfo.estimatedCompletionDate && (
             <div className="flex items-center gap-2 text-sm">
               <CalendarIcon className="w-4 h-4 text-muted-foreground" />
               <div>
                 <span className="text-muted-foreground">Previsão:</span>{' '}
                 <span className="font-medium">{estimatedDate}</span>
               </div>
             </div>
           )}
           
           {serviceInfo.technician && (
             <div className="flex items-center gap-2 text-sm">
               <WrenchIcon className="w-4 h-4 text-muted-foreground" />
               <div>
                 <span className="text-muted-foreground">Técnico:</span>{' '}
                 <span className="font-medium">{serviceInfo.technician}</span>
               </div>
             </div>
           )}
           
           {serviceInfo.publicNotes && (
             <div className="bg-gray-50 p-3 rounded-md border mt-3">
               <div className="flex gap-2 text-sm mb-1">
                 <InfoIcon className="w-4 h-4 text-muted-foreground" />
                 <span className="font-medium">Observações:</span>
               </div>
               <p className="text-sm">{serviceInfo.publicNotes}</p>
             </div>
           )}
         </CardContent>
         
         <CardFooter className="flex-col items-start pt-2 border-t">
           <p className="text-sm text-muted-foreground mb-2">
             Para mais informações, entre em contato conosco.
           </p>
           <div className="flex items-center gap-2">
             <PhoneIcon className="w-4 h-4 text-muted-foreground" />
             <a href="tel:+5500000000000" className="text-sm text-primary hover:underline">
               (00) 00000-0000
             </a>
           </div>
         </CardFooter>
       </Card>
     );
   };

   export default ServiceStatusCard;
   ```

   c. **qrcode-utils.ts** - Funções utilitárias para o módulo:
   ```typescript
   import { v4 as uuidv4 } from 'uuid';

   /**
    * Gera um novo ID de rastreamento público para um serviço
    * 
    * @returns UUID v4 para uso como tracking ID
    */
   export const generateTrackingId = (): string => {
     return uuidv4();
   };

   /**
    * Valida se um tracking ID tem formato válido (UUID v4)
    * 
    * @param trackingId ID de rastreamento a ser validado
    * @returns true se o ID for um UUID v4 válido
    */
   export const isValidTrackingId = (trackingId: string): boolean => {
     const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
     return uuidRegex.test(trackingId);
   };

   /**
    * Converte o status do serviço para um esquema de cores do QR code
    * 
    * @param status Status do serviço
    * @returns Esquema de cores correspondente ao status
    */
   export const statusToColorScheme = (
     status: string
   ): 'default' | 'success' | 'warning' | 'error' => {
     switch (status.toLowerCase()) {
       case 'concluído':
       case 'concluido':
       case 'finalizado':
       case 'pronto para entrega':
         return 'success';
       case 'em andamento':
       case 'em análise':
       case 'em analise':
       case 'aguardando peças':
       case 'aguardando pecas':
         return 'warning';
       case 'cancelado':
       case 'sem reparo':
       case 'desistência':
       case 'desistencia':
         return 'error';
       default:
         return 'default';
     }
   };

   /**
    * Formata uma data estimada de conclusão para exibição
    * 
    * @param estimatedDate Data estimada de conclusão (string ou Date)
    * @returns Data formatada em formato amigável (ex: "15 de junho de 2024")
    */
   export const formatEstimatedDate = (estimatedDate: string | Date | null): string => {
     if (!estimatedDate) return 'Data não disponível';
     
     const date = typeof estimatedDate === 'string' ? new Date(estimatedDate) : estimatedDate;
     
     // Verifica se a data é válida
     if (isNaN(date.getTime())) return 'Data inválida';
     
     // Formata a data em PT-BR
     return date.toLocaleDateString('pt-BR', {
       day: 'numeric',
       month: 'long',
       year: 'numeric'
     });
   };

   /**
    * Traduz o status do serviço para um formato amigável ao cliente
    * 
    * @param status Status original do serviço
    * @returns Status traduzido para exibição pública
    */
   export const translateStatusForPublic = (status: string): string => {
     const statusMap: Record<string, string> = {
       'pendente': 'Aguardando análise técnica',
       'em análise': 'Em análise técnica',
       'em analise': 'Em análise técnica',
       'aguardando aprovação': 'Aguardando sua aprovação',
       'aguardando aprovacao': 'Aguardando sua aprovação',
       'aguardando peças': 'Aguardando peças para reparo',
       'aguardando pecas': 'Aguardando peças para reparo',
       'em andamento': 'Reparo em andamento',
       'concluído': 'Serviço concluído ✅',
       'concluido': 'Serviço concluído ✅',
       'pronto para entrega': 'Pronto para retirada ✅',
       'cancelado': 'Serviço cancelado',
       'sem reparo': 'Sem possibilidade de reparo',
       'desistência': 'Cancelado pelo cliente',
       'desistencia': 'Cancelado pelo cliente'
     };
     
     return statusMap[status.toLowerCase()] || status;
   };
   ```

   d. **PublicServiceStatus.tsx** - Página pública para visualização do status:
   ```tsx
   import React, { useEffect, useState } from 'react';
   import { useParams } from 'react-router-dom';
   import ServiceStatusCard from '../components/ServiceStatusCard';
   import { isValidTrackingId } from '../lib/qrcode-utils';
   import { supabase } from '../integrations/supabase/client';

   const PublicServiceStatus: React.FC = () => {
     const { serviceId } = useParams<{ serviceId: string }>();
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState<string | null>(null);
     const [serviceData, setServiceData] = useState<any>(null);
     
     useEffect(() => {
       const fetchServiceStatus = async () => {
         setLoading(true);
         setError(null);
         
         // Validar o ID do serviço
         if (!serviceId || !isValidTrackingId(serviceId)) {
           setError('ID de serviço inválido ou não encontrado');
           setLoading(false);
           return;
         }
         
         try {
           // Buscar dados do serviço
           const { data: service, error: serviceError } = await supabase
             .from('services')
             .select(`
               id,
               status,
               created_at,
               estimated_completion_date,
               public_notes,
               device:device_id (
                 type,
                 brand,
                 model
               ),
               technician:technician_id (
                 name
               )
             `)
             .eq('public_tracking_id', serviceId)
             .single();
           
           if (serviceError) throw serviceError;
           
           if (!service) {
             setError('Serviço não encontrado');
             setLoading(false);
             return;
           }
           
           // Registrar visualização (opcional, para métricas)
           await supabase
             .from('service_status_views')
             .insert([
               {
                 service_id: service.id,
                 viewed_at: new Date().toISOString()
               }
             ]);
           
           // Formatar dados para o componente
           const formattedData = {
             id: service.id,
             status: service.status,
             createdAt: service.created_at,
             estimatedCompletionDate: service.estimated_completion_date,
             publicNotes: service.public_notes,
             deviceType: service.device?.type || '',
             deviceBrand: service.device?.brand || '',
             deviceModel: service.device?.model || '',
             technician: service.technician?.name || ''
           };
           
           setServiceData(formattedData);
         } catch (err: any) {
           console.error('Erro ao buscar status do serviço:', err);
           setError('Não foi possível obter informações do serviço');
         } finally {
           setLoading(false);
         }
       };
       
       fetchServiceStatus();
     }, [serviceId]);
     
     return (
       <div className="min-h-screen bg-gray-50 flex flex-col">
         <header className="bg-primary text-white p-4 text-center">
           <h1 className="text-xl font-semibold">Paulo Cell</h1>
           <p className="text-sm">Assistência Técnica de Celulares</p>
         </header>
         
         <main className="flex-1 p-4 flex flex-col items-center justify-center">
           {loading ? (
             <div className="text-center py-8">
               <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
               <p>Carregando informações do serviço...</p>
             </div>
           ) : error ? (
             <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md text-center">
               <svg
                 xmlns="http://www.w3.org/2000/svg"
                 className="h-12 w-12 text-red-500 mx-auto mb-4"
                 fill="none"
                 viewBox="0 0 24 24"
                 stroke="currentColor"
               >
                 <path
                   strokeLinecap="round"
                   strokeLinejoin="round"
                   strokeWidth={2}
                   d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                 />
               </svg>
               <h2 className="text-xl font-semibold text-gray-800 mb-2">Erro</h2>
               <p className="text-gray-600">{error}</p>
               <p className="mt-4 text-sm text-gray-500">
                 Se você acredita que isso é um erro, entre em contato conosco.
               </p>
             </div>
           ) : serviceData ? (
             <ServiceStatusCard serviceInfo={serviceData} />
           ) : null}
         </main>
         
         <footer className="bg-gray-100 border-t p-4 text-center text-sm text-gray-600">
           <p>&copy; {new Date().getFullYear()} Paulo Cell - Todos os direitos reservados</p>
         </footer>
       </div>
     );
   };

   export default PublicServiceStatus;
   ```

3. **Integração com os Componentes de Impressão**

   a. **ServicePrinter.tsx** - Adição do QR Code no comprovante:
   ```tsx
   // Adicionar dentro do template HTML do comprovante:
   ${service.public_tracking_id && (
     <div className="mt-4 border-t pt-4 text-center">
       <p className="text-sm font-medium mb-2">Acompanhe o status do seu serviço</p>
       <div className="flex justify-center">
         <QRCodeGenerator 
           serviceId={service.public_tracking_id} 
           size={100} 
           colorScheme={service.status === 'Concluído' ? 'success' : 'default'}
         />
       </div>
       <p className="text-xs mt-2">Escaneie o código QR acima para acompanhar o status do seu serviço online.</p>
     </div>
   )}
   ```

   b. **ServiceThermalPrinter.tsx** - Adição do QR Code na impressão térmica:
   ```tsx
   // Adicionar dentro do template HTML do comprovante térmico:
   <div className="centered">
     ${service.public_tracking_id ? `
       <div>
         <p class="small-text">Escaneie para acompanhar o status:</p>
         <img 
           src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/status/${service.public_tracking_id}`)}" 
           width="100" 
           height="100" 
           alt="QR Code para acompanhamento"
         />
         <p class="small-text">Acesse: ${window.location.origin}/status/${service.public_tracking_id.substring(0, 8)}</p>
       </div>
     ` : `
       <div class="qr-placeholder">
         OS: ${orderNumber}
       </div>
     `}
   </div>
   ```

4. **Configuração de Rotas**

   Adicionar ao arquivo **App.tsx**:
   ```tsx
   // Adicionar a importação
   import PublicServiceStatus from './pages/PublicServiceStatus';

   // Adicionar a rota pública
   <Route path="/status/:serviceId" element={<PublicServiceStatus />} />
   
   // Ou dentro de uma estrutura de rotas existente
   <Route path="status/:serviceId" element={<PublicServiceStatus />} />
   ```

## Implementação Passo a Passo

1. **Preparação do Banco de Dados**
   - Execute o script SQL mencionado acima no Supabase
   - Certifique-se de que a extensão `uuid-ossp` está habilitada

2. **Instalação das Dependências**
   ```bash
   npm install qrcode.react uuid
   ```

3. **Criação dos Componentes**
   - Crie o arquivo `src/lib/qrcode-utils.ts` com as funções utilitárias
   - Crie o componente `src/components/QRCodeGenerator.tsx`
   - Crie o componente `src/components/ServiceStatusCard.tsx`
   - Crie a página `src/pages/PublicServiceStatus.tsx`

4. **Atualização dos Componentes de Impressão**
   - Modifique `ServicePrinter.tsx` para incluir o QR code nos comprovantes
   - Modifique `ServiceThermalPrinter.tsx` para incluir o QR code na impressão térmica

5. **Adicionar a Rota Pública**
   - Atualize `App.tsx` para incluir a rota `/status/:serviceId`

6. **Atualizar os Formulários de Serviço**
   - Adicione um campo para `public_notes` no formulário de edição de serviços
   - Certifique-se de que cada serviço tenha um `public_tracking_id` gerado ao ser criado

7. **Teste da Implementação**
   - Crie um serviço de teste
   - Verifique se o QR code é gerado corretamente
   - Escaneie o QR code para verificar se a página de status é exibida
   - Atualize o status do serviço e verifique se a página de status é atualizada

## Considerações de Segurança

- Os UUIDs são praticamente impossíveis de adivinhar, tornando o sistema seguro
- Apenas informações não-sensíveis são exibidas na página pública (sem dados pessoais detalhados)
- As visualizações são registradas para monitoramento e detecção de abusos
- A página pública não permite modificação dos dados, apenas visualização

## Possíveis Extensões

1. **Notificações por Email**
   - Envio automatizado de emails com QR codes para os clientes

2. **Integração com WhatsApp**
   - Envio do link de status diretamente via WhatsApp

3. **Estatísticas de Visualização**
   - Dashboard para análise de quantas vezes um serviço foi verificado

4. **Personalização Avançada**
   - Opções para personalizar a página pública com logo e cores da empresa

## Solução de Problemas

1. **QR Code não aparece nos comprovantes**
   - Verifique se o serviço possui um `public_tracking_id` válido
   - Confirme que a biblioteca `qrcode.react` está instalada corretamente

2. **Erro ao acessar a página de status**
   - Verifique se a rota `/status/:serviceId` está configurada corretamente
   - Confirme que o UUID é válido e existe no banco de dados

3. **Tipo incorreto no banco de dados**
   - Certifique-se de que o campo `public_tracking_id` é do tipo UUID

4. **Estilização inadequada**
   - Ajuste o CSS dos componentes `QRCodeGenerator` e `ServiceStatusCard` conforme necessário

5. **Erros no console relacionados a tipos**
   - Atualize o arquivo de definição de tipos do Supabase para incluir os novos campos
</rewritten_file> 