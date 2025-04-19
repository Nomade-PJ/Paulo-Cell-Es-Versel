import React from 'react';

interface QRCodeGeneratorProps {
  serviceId: string;
  size?: number;
  includeMargin?: boolean;
  colorScheme?: 'default' | 'success' | 'warning' | 'error';
  showBorder?: boolean;
}

/**
 * Componente para geração de QR Codes para serviços
 * Usando API externa para gerar o QR code
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
        return { fgColor: '10b981', bgColor: 'ecfdf5' }; // Verde
      case 'warning':
        return { fgColor: 'f59e0b', bgColor: 'fffbeb' }; // Amarelo
      case 'error':
        return { fgColor: 'ef4444', bgColor: 'fef2f2' }; // Vermelho
      default:
        return { fgColor: '3b82f6', bgColor: 'eff6ff' }; // Azul (padrão)
    }
  };
  
  const { fgColor, bgColor } = getColors();
  
  // Usar API do QR Server para gerar QR code
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(trackingUrl)}&color=${fgColor}&bgcolor=${bgColor}&margin=${includeMargin ? 1 : 0}`;
  
  return (
    <div className={`qr-code-container ${showBorder ? 'border rounded p-2' : ''}`}
         style={{ backgroundColor: `#${bgColor}`, display: 'inline-block' }}>
      <img 
        src={qrApiUrl}
        alt="QR Code para acompanhamento do serviço"
        width={size}
        height={size}
      />
      <div className="text-xs text-center mt-1" style={{ color: `#${fgColor}` }}>
        Escaneie para verificar o status
      </div>
    </div>
  );
};

export default QRCodeGenerator; 