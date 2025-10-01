import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Smartphone, 
  Wrench,
  ShoppingCart,
  Package, 
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";

// Tipos para notificações
type NotificationCounts = {
  documents: number;
  inventory: number;
  services: number;
  devices: number;
};

// Todos os itens de navegação
const navItems = [
  { icon: ShoppingCart, label: "PDV - Vendas", path: "/dashboard", notificationType: null },
  { icon: Users, label: "Clientes", path: "/dashboard/clients", notificationType: null },
  { icon: Smartphone, label: "Dispositivos", path: "/dashboard/devices", notificationType: "devices" },
  { icon: Wrench, label: "Serviços", path: "/dashboard/services", notificationType: "services" },
  { icon: Package, label: "Estoque", path: "/dashboard/inventory", notificationType: "inventory" },
  { icon: FileText, label: "Documentos", path: "/dashboard/documents", notificationType: "documents" },
  { icon: BarChart3, label: "Relatórios", path: "/dashboard/reports", notificationType: null },
  { icon: Settings, label: "Configurações", path: "/dashboard/settings", notificationType: null },
];

const DesktopSidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [notificationCounts, setNotificationCounts] = useState<NotificationCounts>({
    documents: 0,
    inventory: 0,
    services: 0,
    devices: 0
  });

  // Verificar se a localização atual corresponde a um caminho (incluindo subcaminhos)
  const isActiveRoute = (path: string) => {
    if (path === "/dashboard" && location.pathname === "/dashboard") {
      return true;
    }
    return location.pathname.startsWith(path) && path !== "/dashboard";
  };

  // Carregar contagem de notificações
  useEffect(() => {
    if (!user) return;

    const fetchNotificationCounts = async () => {
      try {
        // Contar notificações não lidas por tipo
        const { data, error } = await supabase
          .from('notifications')
          .select('type')
          .eq('user_id', user.id)
          .eq('read', false)
          .gt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Últimos 7 dias

        if (error) {
          console.error('Erro ao buscar notificações:', error);
          return;
        }

        // Contar manualmente as notificações por tipo
        const counts: NotificationCounts = { documents: 0, inventory: 0, services: 0, devices: 0 };
        data?.forEach(item => {
          if (item.type in counts) {
            counts[item.type as keyof NotificationCounts]++;
          }
        });

        setNotificationCounts(counts);
      } catch (error) {
        console.error("Erro ao carregar contagem de notificações:", error);
      }
    };

    fetchNotificationCounts();

    // Inscrever para atualizações em tempo real
    const subscription = supabase
      .channel('public:notifications')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}` 
        }, 
        () => {
          // Ao receber qualquer mudança, atualizar contagens
          fetchNotificationCounts();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);


  return (
    <aside className={cn(
      "fixed left-0 top-0 h-full bg-slate-900 border-r border-slate-700/50 transition-all duration-300 z-40 flex flex-col shadow-lg",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header da Sidebar */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
              <Smartphone className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">Paulo Cell</h2>
              <p className="text-slate-400 text-xs">Sistema de Gerenciamento</p>
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="text-slate-400 hover:text-white hover:bg-slate-800 p-1 h-8 w-8"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center px-3 py-2.5 rounded-lg transition-colors group relative",
                  isActiveRoute(item.path)
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                )
              }
              end={item.path === "/dashboard"}
            >
              <div className="relative flex items-center">
                <item.icon className={cn(
                  "flex-shrink-0",
                  isCollapsed ? "h-5 w-5" : "h-5 w-5 mr-3"
                )} />
                
                {item.notificationType && notificationCounts[item.notificationType as keyof NotificationCounts] > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
                  >
                    {notificationCounts[item.notificationType as keyof NotificationCounts]}
                  </Badge>
                )}
              </div>
              
              {!isCollapsed && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
              
              {/* Tooltip para modo collapsed */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer da Sidebar */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-700/50">
          <div className="text-xs text-slate-400 text-center">
            Sistema Desenvolvido por{" "}
            <span className="text-blue-400">Nomade-PJ</span>
          </div>
        </div>
      )}
    </aside>
  );
};

export default DesktopSidebar;
