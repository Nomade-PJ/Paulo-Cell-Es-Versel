import { AlertTriangle, Clock } from "lucide-react";
import { useState, useEffect } from "react";

const MaintenanceBanner = () => {
  const [timeRemaining, setTimeRemaining] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      
      // *** CONFIGURAÇÃO DA MANUTENÇÃO ***
      // Altere aqui a data e hora da manutenção programada
      const maintenanceDate = new Date();
      maintenanceDate.setFullYear(2025, 10, 25); // Ano, Mês (0-11, onde 10=Novembro), Dia
      maintenanceDate.setHours(12, 15, 0, 0);    // Hora, Minuto, Segundo, Milissegundo
      
      const diff = maintenanceDate.getTime() - now.getTime();
      
      // Se já passou da data/hora programada, marca como expirado
      if (diff <= 0) {
        setIsExpired(true);
        return "EXPIRADO";
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    // Atualiza o cronômetro a cada segundo
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    // Calcula imediatamente na primeira renderização
    setTimeRemaining(calculateTimeRemaining());

    return () => clearInterval(interval);
  }, []);

  // Se o banner expirou, não renderiza nada
  if (isExpired) {
    return null;
  }

  return (
    <div className="bg-transparent text-orange-600 px-2 py-0.5 text-xs flex items-center justify-center gap-2 flex-wrap">
      <AlertTriangle className="h-3 w-3 flex-shrink-0" />
      <span className="font-semibold">⚠️ MANUTENÇÃO PROGRAMADA às 12:15</span>
      <div className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        <span className="font-mono font-bold text-xs">{timeRemaining}</span>
      </div>
      <span className="text-[10px]">Duração: ~38h | Sistema poderá ficar instável</span>
    </div>
  );
};

export default MaintenanceBanner;

