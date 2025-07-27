import { useState, useEffect } from "react";
import { 
  Facebook,
  Instagram, 
  Mail, 
  MapPin, 
  Phone, 
  Clock, 
  MessageSquare,
  Share2, 
  Smartphone,
  Star,
  ChevronRight,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Home,
  HeartPulse,
  Info,
  Settings,
  CreditCard,
  Copy,
  Wrench
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QRCodeGenerator from "@/components/QRCodeGenerator";

// Definição das redes sociais
const socialLinks = [
  { 
    name: "WhatsApp",
    icon: MessageSquare, 
    url: "https://wa.me/5598984031640", 
    color: "#25D366",
    bgColor: "from-green-500/20 to-green-600/20",
    hoverColor: "hover:bg-green-500/30"
  },
  { 
    name: "Instagram",
    icon: Instagram, 
    url: "https://www.instagram.com/paullocell?igsh=b3V3NTBydjBvemR5", 
    color: "#E1306C",
    bgColor: "from-pink-500/20 to-purple-500/20",
    hoverColor: "hover:bg-pink-500/30"
  },
  { 
    name: "Facebook",
    icon: Facebook, 
    url: "https://facebook.com/paulocell", // Mantido temporariamente
    color: "#1877F2",
    bgColor: "from-blue-500/20 to-blue-600/20",
    hoverColor: "hover:bg-blue-500/30"
  },
  { 
    name: "Email",
    icon: Mail, 
    url: "mailto:paullo.celullar2020@gmail.com", 
    color: "#2563eb",
    bgColor: "from-blue-400/20 to-blue-500/20",
    hoverColor: "hover:bg-blue-400/30"
  }
];

// Informações de contato
const infoItems = [
  { 
    icon: Phone, 
    label: "Telefone", 
    value: "(98) 98403-1640",
    color: "#38bdf8", // Azul claro do projeto
    action: "tel:+5598984031640",
    actionText: "Ligar agora"
  },
  { 
    icon: MapPin, 
    label: "Endereço", 
    value: "Rua Dr. Paulo Ramos, S/n - Centro, Coelho Neto - MA",
    color: "#f87171", // Vermelho suave
    action: "https://www.google.com/maps/place/Paulo+Cell/@-4.2571575,-43.0142153,17z/data=!3m1!4b1!4m22!1m15!4m14!1m6!1m2!1s0x78da73f33fdacdd:0x68795f500e3b3944!2sPaulo+Cell+-+Rua+Doutor+Paulo+Ramos+-+Centro,+Coelho+Neto+-+State+of+Maranh%C3%A3o!2m2!1d-43.0116404!2d-4.2571629!1m6!1m2!1s0x78da73f33fdacdd:0x68795f500e3b3944!2sR.+Dr.+Paulo+Ramos+-+Centro,+Coelho+Neto+-+MA,+65620-000!2m2!1d-43.0116404!2d-4.2571629!3m5!1s0x78da73f33fdacdd:0x68795f500e3b3944!8m2!3d-4.2571629!4d-43.0116404!16s%2Fg%2F11lkyz69tw",
    actionText: "Ver no mapa"
  },
  { 
    icon: Clock, 
    label: "Horário", 
    value: "Seg-Sex: 9h às 18h | Sáb: 9h às 13h", // Substitua pelo horário correto
    color: "#818cf8", // Roxo suave
    action: "#horarios",
    actionText: "Ver detalhes"
  }
];

// Depoimentos de clientes
const avaliacoes = [
  { name: "Carlos Silva", service: "Troca de Tela", date: "há 2 semanas", rating: 5, comment: "Excelente atendimento! Meu celular estava com a tela quebrada e em menos de 1 hora já estava pronto. Super recomendo!" },
  { name: "Mariana Costa", service: "Reparo de Placa", date: "há 1 mês", rating: 5, comment: "Serviço de qualidade e preço justo. O Paulo é muito atencioso e explica tudo o que está fazendo. Meu iPhone voltou a funcionar perfeitamente." },
  { name: "Roberto Almeida", service: "Especialista em Micro soldagens", date: "há 3 meses", rating: 4, comment: "Conseguiram recuperar todos os meus dados que eu achava que tinha perdido. Profissionais muito competentes!" },
  { name: "Juliana Mendes", service: "Troca de Bateria", date: "há 1 semana", rating: 5, comment: "A bateria do meu celular estava durando apenas 2 horas. Após a troca, está durando o dia todo! Muito obrigada!" },
  { name: "Fernando Gomes", service: "Troca de Tela", date: "há 2 meses", rating: 5, comment: "Atendimento rápido e eficiente. Preço justo e qualidade no serviço. Recomendo a todos!" },
  { name: "Amanda Souza", service: "Reparo de Placa", date: "há 1 mês", rating: 4, comment: "Meu celular caiu na água e achei que tinha perdido tudo. O Paulo conseguiu recuperar e está funcionando normalmente. Excelente trabalho!" }
];

// Horários detalhados
const scheduleDetails = [
  { day: "Segunda-feira", hours: "09:00 - 18:00" },
  { day: "Terça-feira", hours: "09:00 - 18:00" },
  { day: "Quarta-feira", hours: "09:00 - 18:00" },
  { day: "Quinta-feira", hours: "09:00 - 18:00" },
  { day: "Sexta-feira", hours: "09:00 - 18:00" },
  { day: "Sábado", hours: "09:00 - 13:00" },
  { day: "Domingo", hours: "Fechado" }
];

// Serviços oferecidos
const services = [
  { name: "Troca de Tela", icon: Smartphone },
  { name: "Reparo de Placa", icon: CheckCircle2 },
  { name: "Troca de Bateria", icon: CheckCircle2 },
  { name: "Especialista em Micro soldagens", icon: CheckCircle2 }
];

// Adicionar após as constantes existentes, antes do componente Contact
const navigationItems = [
  { icon: Home, label: "Início", value: "contato" },
  { icon: Smartphone, label: "Serviços", value: "servicos" },
  { icon: Star, label: "Avaliações", value: "avaliacoes" },
  { icon: Info, label: "Sobre", value: "sobre" }
];

const Contact = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("contato");
  const [isOpen, setIsOpen] = useState(false);
  
  // Verificar se o horário atual está dentro do horário de funcionamento
  const [isOpen24h] = useState(false); // Se for 24h, mude para true
  const [isCurrentlyOpen, setIsCurrentlyOpen] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    
    // Verificar se está aberto agora
    const checkIfOpen = () => {
      if (isOpen24h) return true;
      
      const now = new Date();
      const day = now.getDay(); // 0 = domingo, 1 = segunda, etc.
      const hour = now.getHours();
      
      // Fechado aos domingos
      if (day === 0) return false;
      
      // Sábado: aberto das 9h às 13h
      if (day === 6) return hour >= 9 && hour < 13;
      
      // Segunda a sexta: aberto das 9h às 18h
      return hour >= 9 && hour < 18;
    };
    
    setIsCurrentlyOpen(checkIfOpen());
    
    // Atualizar a cada minuto
    const interval = setInterval(() => {
      setIsCurrentlyOpen(checkIfOpen());
    }, 60000);
    
    return () => clearInterval(interval);
  }, [isOpen24h]);
  
  // Animações
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 100 
      }
    }
  };

  const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.6 }
    }
  };
  
  // Função para navegar para uma seção específica
  const scrollToSection = (sectionId: string) => {
    // Atualiza a aba ativa
    setActiveTab(sectionId);
    
    // Pequeno atraso para garantir que a aba foi alterada antes de rolar
    setTimeout(() => {
      // Rolar para o topo da página primeiro
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Se for a aba de contato, podemos rolar para o topo
      if (sectionId === "contato") {
        const headerElement = document.querySelector("header");
        if (headerElement) {
          headerElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }, 100);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0D1B2A] to-[#1A2C42] text-white">
      {/* Menu superior fixo para desktop */}
      <div className="hidden md:flex items-center justify-between bg-[#112244] py-3 px-4 fixed top-0 left-0 right-0 z-50 shadow-lg">
        <div className="flex items-center gap-6 ml-0">
          <button 
            onClick={() => scrollToSection("contato")}
            className={cn(
              "text-white hover:text-blue-300 transition-colors py-2 px-4 rounded-md",
              activeTab === "contato" ? "bg-blue-800" : "hover:bg-blue-900/50"
            )}
          >
            Contato
          </button>
          <button 
            onClick={() => scrollToSection("servicos")}
            className={cn(
              "text-white hover:text-blue-300 transition-colors py-2 px-4 rounded-md",
              activeTab === "servicos" ? "bg-blue-800" : "hover:bg-blue-900/50"
            )}
          >
            Serviços
          </button>
          <button 
            onClick={() => scrollToSection("avaliacoes")}
            className={cn(
              "text-white hover:text-blue-300 transition-colors py-2 px-4 rounded-md",
              activeTab === "avaliacoes" ? "bg-blue-800" : "hover:bg-blue-900/50"
            )}
          >
            Avaliações
          </button>
          <button 
            onClick={() => scrollToSection("sobre")}
            className={cn(
              "text-white hover:text-blue-300 transition-colors py-2 px-4 rounded-md",
              activeTab === "sobre" ? "bg-blue-800" : "hover:bg-blue-900/50"
            )}
          >
            Sobre
          </button>
        </div>
        
        <div className="flex-1"></div>
        
        <div className="flex items-center gap-3">
          <span className={cn(
            "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5",
            isCurrentlyOpen 
              ? "bg-green-500/20 text-green-400 border border-green-500/30" 
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          )}>
            <span className={cn(
              "h-2 w-2 rounded-full",
              isCurrentlyOpen ? "bg-green-400" : "bg-red-400"
            )}></span>
            {isCurrentlyOpen ? "Aberto agora" : "Fechado"}
          </span>
          
          <button 
            onClick={() => window.open("https://wa.me/5598984031640", "_blank")} 
            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-transform hover:scale-105"
          >
            <MessageSquare className="h-4 w-4" />
            Contato Rápido
          </button>
        </div>
      </div>
      
      {/* Adicionar espaço apenas para desktop para compensar o menu fixo */}
      <div className="hidden md:block h-16"></div>

      {/* Header - Logo e Título */}
      <header className="pt-12 pb-8 px-4">
        <motion.div 
          className="text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={isMounted ? { scale: 1, opacity: 1 } : {}}
          transition={{ type: "spring", stiffness: 100 }}
        >
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ boxShadow: "0 0 0px #38bdf8" }}
              animate={isMounted ? { boxShadow: "0 0 40px 0 rgba(56, 189, 248, 0.5)" } : {}}
              transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
              className="rounded-full relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full blur-xl opacity-30"></div>
              <Avatar className="h-32 w-32 border-4 border-blue-500 shadow-lg bg-gradient-to-br from-blue-900 to-blue-800 relative z-10">
                <AvatarImage src="/logo-paulo-cell.png" alt="Paulo Cell" />
                <AvatarFallback className="bg-blue-700 text-5xl font-bold text-blue-200">PC</AvatarFallback>
              </Avatar>
            </motion.div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300 mb-2">
            Paulo Cell
          </h1>
          <p className="text-blue-200 text-lg md:text-xl max-w-md mx-auto">
            Assistência técnica especializada em smartphones
          </p>
          
          {/* Badge de status (aberto/fechado) - visível apenas no mobile */}
          <motion.div 
            className="mt-4 inline-flex items-center md:hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <span className={cn(
              "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5",
              isCurrentlyOpen 
                ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            )}>
              <span className={cn(
                "h-2 w-2 rounded-full",
                isCurrentlyOpen ? "bg-green-400" : "bg-red-400"
              )}></span>
              {isCurrentlyOpen ? "Aberto agora" : "Fechado"}
            </span>
          </motion.div>
        </motion.div>
      </header>

      {/* Navegação por Tabs - visível apenas no mobile */}
      <motion.div 
        className="px-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        id="contato"
      >
        {/* Tabs visíveis apenas no mobile */}
        <div className="md:hidden">
        <Tabs 
          defaultValue="contato" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full max-w-md mx-auto"
        >
          <TabsList className="grid grid-cols-4 bg-blue-900/50 backdrop-blur-sm border border-blue-800">
            <TabsTrigger value="contato" className="data-[state=active]:bg-blue-700">Contato</TabsTrigger>
            <TabsTrigger value="servicos" className="data-[state=active]:bg-blue-700">Serviços</TabsTrigger>
            <TabsTrigger value="avaliacoes" className="data-[state=active]:bg-blue-700">Avaliações</TabsTrigger>
            <TabsTrigger value="sobre" className="data-[state=active]:bg-blue-700">Sobre</TabsTrigger>
          </TabsList>
          </Tabs>
        </div>
        
        {/* Conteúdo das abas - visível em todas as telas */}
        <Tabs value={activeTab} className="w-full mx-auto">
          {/* Mantendo os TabsTrigger invisíveis para desktop, mas necessários para o funcionamento */}
          <div className="hidden">
            <TabsList>
              <TabsTrigger value="contato" className="data-[state=active]:bg-blue-700">Contato</TabsTrigger>
              <TabsTrigger value="servicos" className="data-[state=active]:bg-blue-700">Serviços</TabsTrigger>
              <TabsTrigger value="avaliacoes" className="data-[state=active]:bg-blue-700">Avaliações</TabsTrigger>
              <TabsTrigger value="sobre" className="data-[state=active]:bg-blue-700">Sobre</TabsTrigger>
            </TabsList>
          </div>
          
          {/* Conteúdo da Tab Contato */}
          <TabsContent value="contato" className="mt-6 md:max-w-6xl md:mx-auto">
            {/* Layout para desktop - grid principal */}
            <div className="hidden md:grid md:grid-cols-12 md:gap-8">
              {/* Coluna da esquerda - 8 colunas */}
              <div className="md:col-span-8 space-y-8">
                {/* Redes sociais */}
                <Card className="p-6 shadow-xl bg-gradient-to-br from-[#1A2C42] to-[#15253A] border border-blue-800/50">
                  <h2 className="text-xl font-semibold mb-4 text-blue-300">Redes Sociais</h2>
                  <div className="grid grid-cols-4 gap-4">
                    {socialLinks.map((social) => (
              <motion.div
                        key={social.name} 
                        whileHover={{ y: -4, scale: 1.03 }} 
                        whileTap={{ scale: 0.97 }}
                      >
                        <a 
                          href={social.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="w-full"
                        >
                          <Button 
                            variant="outline" 
                            className={cn(
                              "w-full h-14 relative overflow-hidden group",
                              "transition-all flex items-center justify-center gap-2 shadow-lg",
                              {
                                "bg-green-600 hover:bg-green-500 border-green-500 text-white": social.name === "WhatsApp",
                                "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-pink-300 text-white": social.name === "Instagram",
                                "bg-blue-600 hover:bg-blue-500 border-blue-400 text-white": social.name === "Facebook",
                                "bg-blue-500 hover:bg-blue-400 border-blue-300 text-white": social.name === "Email"
                              }
                            )}
                            style={{ fontWeight: 600, fontSize: "1.05rem" }}
                          >
                            <div className="absolute inset-0 w-full h-full transition-all duration-300 transform translate-x-full bg-white/10 group-hover:translate-x-0 opacity-20"></div>
                            <social.icon className="h-5 w-5" />
                            <span>{social.name}</span>
                          </Button>
                        </a>
                      </motion.div>
                    ))}
                  </div>
                </Card>
                
                {/* Informações de Contato */}
                <Card className="p-6 shadow-xl bg-gradient-to-br from-[#1A2C42] to-[#15253A] border border-blue-800/50">
                  <h2 className="text-xl font-semibold mb-6 flex items-center text-blue-300 gap-2">
                    <Smartphone className="h-5 w-5 text-blue-400" />
                    Informações de Contato
                  </h2>
                  <div className="space-y-6">
                    {infoItems.map((item, idx) => (
                      <div key={item.label} className="flex items-start border-b border-blue-800/50 pb-4 last:border-0">
                        <div className="p-3 rounded-full mr-4 flex-shrink-0 bg-gradient-to-br from-blue-900/50 to-blue-800/50 border border-blue-700/30">
                          <item.icon className="h-5 w-5" style={{ color: item.color }} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-blue-200 text-base">{item.label}</p>
                          <p className="text-blue-100 text-sm mb-2">{item.value}</p>
                          <a 
                            href={item.action} 
                            target={item.action.startsWith('http') ? "_blank" : undefined}
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            {item.actionText}
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
                
                {/* Mapa */}
                <Card className="p-6 shadow-xl bg-gradient-to-br from-[#1A2C42] to-[#15253A] border border-blue-800/50">
                  <h2 className="text-xl font-semibold mb-4 flex items-center text-blue-300 gap-2">
                    <MapPin className="h-5 w-5 text-blue-400" />
                    Localização
                  </h2>
                  <div className="mb-4">
                    <div className="relative w-full overflow-hidden rounded-md">
                      <iframe 
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3979.0074129395103!2d-43.01421532545933!3d-4.257157546754798!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x78da73f33fdacdd%3A0x68795f500e3b3944!2sPaulo%20Cell!5e0!3m2!1spt-BR!2sbr!4v1688146528097!5m2!1spt-BR!2sbr"
                        width="100%" 
                        height="220" 
                        style={{ border: 0 }}
                        allowFullScreen 
                        loading="lazy" 
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Localização da Paulo Cell"
                        className="rounded-md"
                      ></iframe>
                    </div>
                  </div>
                  <div className="text-blue-300 text-sm py-3 text-center">
                    Paulo Cell - Assistência Técnica em Smartphones
                  </div>
                </Card>
              </div>
              
              {/* Coluna da direita - 4 colunas */}
              <div className="md:col-span-4 space-y-8">
                {/* Horários Detalhados */}
                <Card className="p-6 shadow-xl bg-gradient-to-br from-[#1A2C42] to-[#15253A] border border-blue-800/50">
                  <h2 className="text-xl font-semibold mb-4 flex items-center text-blue-300 gap-2">
                    <Calendar className="h-5 w-5 text-blue-400" />
                    Horário de Funcionamento
                  </h2>
                  <div className="space-y-2">
                    {scheduleDetails.map((schedule, idx) => (
                      <div 
                        key={schedule.day} 
                        className={cn(
                          "flex justify-between py-2 px-3 rounded-md",
                          idx === new Date().getDay() ? "bg-blue-800/30 border border-blue-700/30" : ""
                        )}
                      >
                        <span className="text-blue-200">{schedule.day}</span>
                        <span className={cn(
                          "font-medium",
                          schedule.hours === "Fechado" ? "text-red-400" : "text-blue-100"
                        )}>
                          {schedule.hours}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
                
                {/* Card de PIX */}
                <Card className="p-6 shadow-xl bg-gradient-to-br from-[#1A2C42] to-[#15253A] border border-blue-800/50">
                  <h2 className="text-xl font-semibold mb-6 flex items-center text-blue-300 gap-2">
                    <CreditCard className="h-5 w-5 text-blue-400" />
                    Pagamento via PIX
                  </h2>
                  <div className="flex flex-col items-center mb-4">
                    <div className="bg-white p-3 rounded-lg mb-4">
                      <QRCodeGenerator 
                        value="00020126360014BR.GOV.BCB.PIX0114420544530001405204000053039865802BR5914Paulo da Silva6011Coelho neto62070503***63049DE8" 
                        size={150}
                        showBorder={false}
                      />
                    </div>
                    <div className="space-y-3 w-full">
                      <div className="p-3 bg-blue-900/30 rounded-md flex flex-col">
                        <span className="text-blue-300 text-sm mb-1">Chave PIX (CNPJ):</span>
                        <div className="flex items-center justify-between">
                          <span className="text-blue-100 font-medium">42.054.453/0001-40</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-blue-400"
                            onClick={() => {
                              navigator.clipboard.writeText("42054453000140");
                            }}
              >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-3 bg-blue-900/30 rounded-md">
                        <span className="text-blue-300 text-sm mb-1">Favorecido:</span>
                        <p className="text-blue-100 font-medium">Paulo da Silva</p>
                      </div>
                    </div>
                  </div>
                </Card>
                
                {/* Botão de compartilhar */}
                <button 
                  className="w-full bg-blue-800/30 hover:bg-blue-700/40 border border-blue-700/30 text-white p-3 rounded-md flex items-center justify-center gap-2"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'Paulo Cell - Localização',
                        text: 'Venha nos visitar na Paulo Cell!',
                        url: 'https://www.google.com/maps/place/Paulo+Cell/@-4.2571575,-43.0142153,17z',
                      });
                    }
                  }}
                >
                  <Share2 className="h-5 w-5" />
                  Compartilhar
                </button>
              </div>
            </div>

            {/* Layout para mobile - mantém o layout original */}
            <div className="md:hidden">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <div className="grid grid-cols-1 gap-4">
                <motion.div 
                      className="grid grid-cols-2 gap-4 w-full max-w-md md:grid-cols-2 md:max-w-full"
                  variants={containerVariants}
                  initial="hidden"
                  animate={isMounted ? "visible" : "hidden"}
                >
                  {socialLinks.map((social) => (
                    <motion.div 
                      key={social.name} 
                      variants={itemVariants} 
                      whileHover={{ y: -4, scale: 1.03 }} 
                      whileTap={{ scale: 0.97 }}
                    >
                      <a 
                        href={social.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-full"
                      >
                        <Button 
                          variant="outline" 
                          className={cn(
                            "w-full h-14 relative overflow-hidden group",
                            "transition-all flex items-center justify-center gap-2 shadow-lg",
                            {
                              "bg-green-600 hover:bg-green-500 border-green-500 text-white": social.name === "WhatsApp",
                              "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-pink-300 text-white": social.name === "Instagram",
                              "bg-blue-600 hover:bg-blue-500 border-blue-400 text-white": social.name === "Facebook",
                              "bg-blue-500 hover:bg-blue-400 border-blue-300 text-white": social.name === "Email"
                            }
                          )}
                          style={{ fontWeight: 600, fontSize: "1.05rem" }}
                        >
                          <div className="absolute inset-0 w-full h-full transition-all duration-300 transform translate-x-full bg-white/10 group-hover:translate-x-0 opacity-20"></div>
                          <social.icon className="h-5 w-5" />
                          <span>{social.name}</span>
                        </Button>
                      </a>
                    </motion.div>
                  ))}
                </motion.div>
                
                    {/* Espaçamento adicional - área amarela na terceira imagem */}
                  </div>
                </div>
                
                {/* Coluna Direita - Horários */}
                <div className="md:w-1/2 md:pl-4 mt-8 md:mt-0">
                  {/* Horários Detalhados */}
                <motion.div 
                  className="w-full"
                    initial={{ opacity: 0 }}
                    animate={isMounted ? { opacity: 1 } : {}}
                    transition={{ delay: 0.6 }}
                    id="horarios"
                  >
                    <Card className="p-6 shadow-xl bg-gradient-to-br from-[#1A2C42] to-[#15253A] border border-blue-800/50">
                      <h2 className="text-xl font-semibold mb-4 flex items-center text-blue-300 gap-2">
                        <motion.div
                          animate={{ 
                            rotate: 360 
                          }}
                          transition={{ 
                            repeat: Infinity, 
                            duration: 10,
                            ease: "linear" 
                          }}
                        >
                          <Calendar className="h-5 w-5 text-blue-400" />
                        </motion.div>
                        Horário de Funcionamento
                      </h2>
                      <div className="space-y-2">
                        {scheduleDetails.map((schedule, idx) => (
                          <div 
                            key={schedule.day} 
                            className={cn(
                              "flex justify-between py-2 px-3 rounded-md",
                              idx === new Date().getDay() ? "bg-blue-800/30 border border-blue-700/30" : ""
                            )}
                          >
                            <span className="text-blue-200">{schedule.day}</span>
                            <span className={cn(
                              "font-medium",
                              schedule.hours === "Fechado" ? "text-red-400" : "text-blue-100"
                            )}>
                              {schedule.hours}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </motion.div>
                </div>
              </div>
              
              {/* Espaçamento adicional na área destacada em amarelo */}
              <div className="mt-6"></div>
              
              {/* Cartão de Informações */}
              <motion.div 
                className="w-full mt-8 md:max-w-3xl md:mx-auto"
                  initial={{ y: 20, opacity: 0 }}
                  animate={isMounted ? { y: 0, opacity: 1 } : {}}
                  transition={{ delay: 0.4, type: "spring" }}
                >
                  <Card className="p-6 shadow-xl bg-gradient-to-br from-[#1A2C42] to-[#15253A] border border-blue-800/50">
                    <h2 
                      className="text-xl font-semibold mb-6 flex items-center text-blue-300 gap-2"
                    >
                      <motion.div
                        animate={{ 
                          rotate: [-10, 10, -10] 
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 2.5,
                          ease: "easeInOut" 
                        }}
                      >
                        <Smartphone className="h-5 w-5 text-blue-400" />
                      </motion.div>
                      Informações de Contato
                    </h2>
                    <div className="space-y-6">
                      {infoItems.map((item, idx) => (
                        <div key={item.label} className="flex items-start border-b border-blue-800/50 pb-4 last:border-0">
                          <div className="p-3 rounded-full mr-4 flex-shrink-0 bg-gradient-to-br from-blue-900/50 to-blue-800/50 border border-blue-700/30">
                            <item.icon className="h-5 w-5" style={{ color: item.color }} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-blue-200 text-base">{item.label}</p>
                            <p className="text-blue-100 text-sm mb-2">{item.value}</p>
                            <a 
                              href={item.action} 
                              target={item.action.startsWith('http') ? "_blank" : undefined}
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              {item.actionText}
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
                
              {/* Espaçamento adicional - área amarela */}
              <div className="mt-6"></div>
              
              {/* Card de PIX - Largura total */}
                <motion.div 
                className="mt-6 w-full md:max-w-2xl md:mx-auto"
                  initial={{ opacity: 0 }}
                  animate={isMounted ? { opacity: 1 } : {}}
                  transition={{ delay: 0.5 }}
                >
                  <Card className="p-6 shadow-xl bg-gradient-to-br from-[#1A2C42] to-[#15253A] border border-blue-800/50">
                    <h2 className="text-xl font-semibold mb-6 flex items-center text-blue-300 gap-2">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.2, 1] 
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 2,
                          ease: "easeInOut" 
                        }}
                      >
                        <CreditCard className="h-5 w-5 text-blue-400" />
                      </motion.div>
                      Pagamento via PIX
                    </h2>
                    <div className="flex flex-col items-center mb-4">
                      <div className="bg-white p-3 rounded-lg mb-4">
                        <QRCodeGenerator 
                          value="00020126360014BR.GOV.BCB.PIX0114420544530001405204000053039865802BR5914Paulo da Silva6011Coelho neto62070503***63049DE8" 
                          size={180}
                          showBorder={false}
                        />
                      </div>
                      <div className="space-y-3 w-full">
                        <div className="p-3 bg-blue-900/30 rounded-md flex flex-col">
                          <span className="text-blue-300 text-sm mb-1">Chave PIX (CNPJ):</span>
                          <div className="flex items-center justify-between">
                            <span className="text-blue-100 font-medium">42.054.453/0001-40</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-blue-400"
                              onClick={() => {
                                navigator.clipboard.writeText("42054453000140");
                                // Aqui você poderia adicionar um toast de confirmação
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="p-3 bg-blue-900/30 rounded-md">
                          <span className="text-blue-300 text-sm mb-1">Favorecido:</span>
                          <p className="text-blue-100 font-medium">Paulo da Silva</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
                
              {/* Espaçamento adicional - área amarela */}
              <div className="mt-6"></div>
              
              {/* Mapa - Largura total */}
                <motion.div 
                className="mt-6 w-full md:max-w-4xl md:mx-auto mb-8"
                  initial={{ opacity: 0 }}
                  animate={isMounted ? { opacity: 1 } : {}}
                  transition={{ delay: 0.7 }}
                >
                  <Card className="p-6 shadow-xl bg-gradient-to-br from-[#1A2C42] to-[#15253A] border border-blue-800/50">
                    <h2 className="text-xl font-semibold mb-4 flex items-center text-blue-300 gap-2">
                      <motion.div
                        animate={{ 
                          y: [-2, 2, -2] 
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 1,
                          ease: "easeInOut" 
                        }}
                      >
                        <MapPin className="h-5 w-5 text-blue-400" />
                      </motion.div>
                      Localização
                    </h2>
                    <div className="mb-4">
                      <div className="relative w-full overflow-hidden rounded-md">
                        <iframe 
                          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3979.0074129395103!2d-43.01421532545933!3d-4.257157546754798!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x78da73f33fdacdd%3A0x68795f500e3b3944!2sPaulo%20Cell!5e0!3m2!1spt-BR!2sbr!4v1688146528097!5m2!1spt-BR!2sbr"
                          width="100%" 
                          height="220" 
                          style={{ border: 0 }}
                          allowFullScreen 
                          loading="lazy" 
                          referrerPolicy="no-referrer-when-downgrade"
                          title="Localização da Paulo Cell"
                          className="rounded-md"
                        ></iframe>
                      </div>
                    </div>
                    <div className="text-blue-300 text-sm py-3 text-center">
                      Paulo Cell - Assistência Técnica em Smartphones
                    </div>
                  </Card>
                </motion.div>
              
              {/* Espaçamento adicional - área amarela */}
              <div className="mt-6"></div>
                
                {/* Botão de compartilhar separado */}
                <motion.div 
                className="px-4 mt-8 mb-8 md:max-w-md md:mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.75 }}
                >
                  <button 
                    className="w-full bg-blue-800/30 hover:bg-blue-700/40 border border-blue-700/30 text-white p-3 rounded-md flex items-center justify-center gap-2"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: 'Paulo Cell - Localização',
                          text: 'Venha nos visitar na Paulo Cell!',
                          url: 'https://www.google.com/maps/place/Paulo+Cell/@-4.2571575,-43.0142153,17z',
                        });
                      }
                    }}
                  >
                    <Share2 className="h-5 w-5" />
                    Compartilhar
                  </button>
                </motion.div>
            </div>
          </TabsContent>
          
          {/* Conteúdo da Tab Serviços */}
          <TabsContent value="servicos" className="mt-6">
            <Card className="p-6 shadow-xl bg-gradient-to-br from-[#0D1B2A] to-[#15253A] border border-blue-800/50">
              <h2 className="text-xl font-semibold mb-6 flex items-center text-blue-300 gap-2">
                <Smartphone className="h-5 w-5 text-blue-400" />
                Nossos Serviços
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {services.map((service, idx) => (
                  <motion.div 
                    key={service.name}
                    className="p-4 rounded-lg bg-blue-900/30 border border-blue-800/50 flex flex-col items-center md:items-start gap-3 hover:bg-blue-800/40 transition-colors cursor-pointer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="p-3 rounded-full bg-blue-800/50 mb-2">
                      <service.icon className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="text-center md:text-left">
                      <h3 className="font-medium text-blue-200 mb-1">{service.name}</h3>
                      <p className="text-xs text-blue-300/70">
                        {service.name === "Troca de Tela" && "Conserto para telas quebradas ou com defeito"}
                        {service.name === "Reparo de Placa" && "Reparo de componentes eletrônicos"}
                        {service.name === "Troca de Bateria" && "Substituição de baterias desgastadas"}
                        {service.name === "Especialista em Micro soldagens" && "Reparo preciso de componentes minúsculos"}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-8 p-4 rounded-lg bg-blue-800/20 border border-blue-700/30 md:max-w-md md:mx-auto">
                <h3 className="text-lg font-medium text-blue-300 mb-2">Precisa de um orçamento?</h3>
                <p className="text-blue-200 text-sm mb-4">Entre em contato conosco pelo WhatsApp para um orçamento rápido e sem compromisso.</p>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-500 text-white"
                  onClick={() => window.open("https://wa.me/5598984031640", "_blank")}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Solicitar Orçamento
                </Button>
              </div>
            </Card>
          </TabsContent>
          
          {/* Conteúdo da Tab Avaliações */}
          <TabsContent value="avaliacoes" className="mt-6">
            <Card className="p-6 shadow-xl bg-gradient-to-br from-[#1A2C42] to-[#15253A] border border-blue-800/50">
              <h2 className="text-xl font-semibold mb-6 flex items-center text-blue-300 gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                Avaliações dos Clientes
              </h2>
              <div className="flex flex-col items-center mb-8">
                <div className="text-4xl font-bold text-white mb-2">4.8</div>
                <div className="flex items-center mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={cn(
                        "h-5 w-5 mr-1", 
                        star <= 4 ? "text-yellow-400 fill-yellow-400" : "text-yellow-400"
                      )} 
                    />
                  ))}
                </div>
                <div className="text-sm text-blue-300">Baseado em 127 avaliações</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {avaliacoes.map((review, idx) => (
                  <motion.div 
                    key={idx}
                    className="p-4 rounded-lg bg-blue-900/30 border border-blue-800/50"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * idx }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-blue-100">{review.name}</h3>
                        <p className="text-xs text-blue-400">{review.service}</p>
                      </div>
                      <span className="text-xs text-blue-300/70">{review.date}</span>
                    </div>
                    <div className="flex mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={cn(
                            "h-3.5 w-3.5 mr-0.5", 
                            star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-blue-800"
                          )} 
                        />
                      ))}
                    </div>
                    <p className="text-sm text-blue-200">{review.comment}</p>
                  </motion.div>
                ))}
              </div>
              <div className="mt-8 flex justify-center">
                <Button 
                  className="bg-blue-600 hover:bg-blue-500 text-white"
                  onClick={() => window.open("https://g.page/r/CXX_XXXXXXXX", "_blank")}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Deixe sua avaliação no Google
                </Button>
              </div>
            </Card>
          </TabsContent>
          
          {/* Conteúdo da Tab Sobre */}
          <TabsContent value="sobre" className="mt-6">
            <Card className="p-6 shadow-xl bg-gradient-to-br from-[#1A2C42] to-[#15253A] border border-blue-800/50">
              <h2 className="text-xl font-semibold mb-6 flex items-center text-blue-300 gap-2">
                <Info className="h-5 w-5 text-blue-400" />
                Sobre a Paulo Cell
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium text-blue-200 mb-3">Nossa História</h3>
                  <p className="text-blue-100 text-sm leading-relaxed">
                    Fundada em 2015 por Paulo da Silva, a Paulo Cell nasceu com a missão de oferecer serviços de qualidade em reparos de smartphones em Coelho Neto - MA. Com mais de 8 anos de experiência, nos tornamos referência na região, atendendo clientes de toda a cidade e municípios vizinhos.
                  </p>
                  <h3 className="text-lg font-medium text-blue-200 mb-3 mt-6">Nossa Missão</h3>
                  <p className="text-blue-100 text-sm leading-relaxed">
                    Proporcionar soluções rápidas e eficientes para problemas em dispositivos móveis, com atendimento personalizado e preços justos, garantindo a satisfação total dos nossos clientes.
                  </p>
                  <h3 className="text-lg font-medium text-blue-200 mb-3 mt-6">Nossos Valores</h3>
                  <ul className="text-blue-100 text-sm space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <span>Transparência e honestidade em todos os serviços</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <span>Compromisso com a qualidade e durabilidade dos reparos</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <span>Atendimento personalizado e respeitoso</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <span>Preços justos e competitivos</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-blue-200 mb-3">Nosso Diferencial</h3>
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-blue-900/30 border border-blue-800/50 flex items-start gap-3">
                      <div className="p-2 rounded-full bg-blue-800/50 mt-1">
                        <HeartPulse className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-200 mb-1">Garantia em todos os serviços</h4>
                        <p className="text-xs text-blue-300/70">Oferecemos garantia de 90 dias para todos os reparos realizados.</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-900/30 border border-blue-800/50 flex items-start gap-3">
                      <div className="p-2 rounded-full bg-blue-800/50 mt-1">
                        <Wrench className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-200 mb-1">Técnicos especializados</h4>
                        <p className="text-xs text-blue-300/70">Nossa equipe é constantemente treinada nas mais recentes tecnologias.</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-900/30 border border-blue-800/50 flex items-start gap-3">
                      <div className="p-2 rounded-full bg-blue-800/50 mt-1">
                        <Clock className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-200 mb-1">Rapidez no atendimento</h4>
                        <p className="text-xs text-blue-300/70">Muitos serviços são realizados na hora, enquanto você espera.</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-900/30 border border-blue-800/50 flex items-start gap-3">
                      <div className="p-2 rounded-full bg-blue-800/50 mt-1">
                        <CreditCard className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-200 mb-1">Facilidade no pagamento</h4>
                        <p className="text-xs text-blue-300/70">Aceitamos diversas formas de pagamento, incluindo cartão e PIX.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
      
      {/* Rodapé */}
      <motion.footer 
        className="py-8 px-4 text-center text-sm text-blue-300 bg-blue-900/30 border-t border-blue-800/50"
        initial={{ opacity: 0 }}
        animate={isMounted ? { opacity: 1 } : {}}
        transition={{ delay: 0.9 }}
      >
        <div className="max-w-md mx-auto">
          <p>© {new Date().getFullYear()} Paulo Cell - Todos os direitos reservados</p>
          <p className="mt-1 text-blue-400">Qualidade e atendimento de excelência</p>
          <div className="mt-4 flex justify-center gap-4 text-xs text-blue-400">
            <a href="/politica-de-privacidade" className="hover:text-blue-300 transition-colors">Política de Privacidade</a>
            <span>|</span>
            <a href="/termos-de-uso" className="hover:text-blue-300 transition-colors">Termos de Uso</a>
          </div>
        </div>
      </motion.footer>
      
      {/* Botão flutuante de WhatsApp - ajustado para ficar acima da navegação mobile */}
      <motion.div
        className="fixed bottom-20 right-6 z-50 md:bottom-6 md:hidden"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring" }}
      >
        <motion.a 
          href="https://wa.me/5598984031640"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-600 hover:bg-green-500 text-white p-3.5 md:p-4 rounded-full shadow-lg flex items-center justify-center transition-all group"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="absolute inset-0 bg-white rounded-full opacity-10 scale-0 group-hover:scale-100 transition-transform duration-300"></div>
          <MessageSquare className="h-6 w-6" />
        </motion.a>
      </motion.div>
    </div>
  );
};

export default Contact; 