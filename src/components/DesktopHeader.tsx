import React, { useState, useEffect } from 'react';
import { Bell, User, Wrench, Package, DollarSign, FileText, Sparkles, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useCompanyInfo } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabaseClient';
import { toast } from 'sonner';

// Tipo para as notificações
type Notification = {
  id: string;
  user_id: string;
  type: 'service' | 'inventory' | 'payment' | 'document' | 'system';
  title: string;
  description: string;
  created_at: string;
  read: boolean;
  action_link?: string;
  related_id?: string;
};

const DesktopHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { companyInfo } = useCompanyInfo();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationOpen, setNotificationOpen] = useState(false);

  // Função para carregar notificações do usuário
  const loadNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Buscar notificações no Supabase
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      
      setNotifications(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar notificações:", error);
      toast.error("Não foi possível carregar as notificações");
    } finally {
      setLoading(false);
    }
  };

  // Função para marcar notificação como lida
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
        
      if (error) throw error;
      
      // Atualizar estado local
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error: any) {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  };

  // Função para marcar todas como lidas
  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
        
      if (error) throw error;
      
      // Atualizar estado local
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      
      toast.success("Todas as notificações foram marcadas como lidas");
    } catch (error: any) {
      console.error("Erro ao marcar todas como lidas:", error);
      toast.error("Não foi possível atualizar as notificações");
    }
  };

  // Carregar notificações ao iniciar
  useEffect(() => {
    if (user) {
      loadNotifications();
      
      // Assinar para atualizações em tempo real
      const subscription = supabase
        .channel('public:notifications')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${user.id}` 
          }, 
          (payload) => {
            // Adicionar nova notificação ao estado
            const newNotification = payload.new as Notification;
            setNotifications(prev => [newNotification, ...prev]);
            
            // Mostrar toast para notificação recebida
            toast.info(newNotification.title, {
              description: newNotification.description,
              position: 'top-right'
            });
          }
        )
        .subscribe();
        
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  // Contagem de notificações não lidas
  const unreadCount = notifications.filter(n => !n.read).length;

  // Renderizar ícone correspondente ao tipo de notificação
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'service':
        return <Wrench className="h-4 w-4 text-yellow-500" />;
      case 'inventory':
        return <Package className="h-4 w-4 text-red-500" />;
      case 'payment':
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'document':
        return <FileText className="h-4 w-4 text-orange-500" />;
      case 'system':
        return <Sparkles className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Agora mesmo';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m atrás`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`;
    return `${Math.floor(diffInSeconds / 86400)}d atrás`;
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <header className="h-16 bg-background border-b border-border flex items-center justify-end px-6 shadow-sm">
      {/* Right Side Actions */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <DropdownMenu open={notificationOpen} onOpenChange={setNotificationOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full flex items-center justify-center text-[10px] text-destructive-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between p-3 border-b">
              <DropdownMenuLabel className="p-0">Notificações</DropdownMenuLabel>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-6 px-2 text-xs"
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Marcar todas como lidas
                </Button>
              )}
            </div>
            
            <ScrollArea className="h-96">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Carregando notificações...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Nenhuma notificação
                </div>
              ) : (
                <div className="py-2">
                  {notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={`p-0 focus:bg-muted ${!notification.read ? 'bg-muted/50' : ''}`}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification.id);
                        }
                        if (notification.action_link) {
                          navigate(notification.action_link);
                          setNotificationOpen(false);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3 p-3 w-full">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium truncate">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <Badge variant="secondary" className="h-2 w-2 p-0 bg-blue-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDate(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
            </ScrollArea>
            
            {notifications.length > 0 && (
              <div className="border-t p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigate('/dashboard');
                    setNotificationOpen(false);
                  }}
                  className="w-full justify-center text-xs"
                >
                  Ver todas as notificações
                </Button>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="rounded-full h-10 w-10 p-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
              <User className="mr-2 h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default DesktopHeader;
