import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

export interface CompanyAddress {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
  complement?: string;
}

export interface CompanyInfo {
  companyName?: string;
  document?: string;
  documentType?: string;
  phone?: string;
  address?: CompanyAddress;
}

interface CompanyContextType {
  companyInfo: CompanyInfo | null;
  loading: boolean;
  error: string | null;
  refreshCompanyInfo: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [refreshTimeout, setRefreshTimeout] = useState<NodeJS.Timeout | null>(null);

  const fetchCompanyInfo = async () => {
    if (!user?.id) {
      setLoading(false);
      setIsInitialized(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('company_name, document, document_type, phone, cep, state, city, neighborhood, street, number, complement')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Erro ao buscar informações da empresa:', fetchError);
        setError('Erro ao buscar informações da empresa');
        return;
      }

      if (data) {
        const newCompanyInfo = {
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
        };
        
        // console.log('Informações da empresa carregadas:', newCompanyInfo);
        setCompanyInfo(newCompanyInfo);
      } else {
        // console.log('Nenhum dado da empresa encontrado para o usuário:', user.id);
        setCompanyInfo(null);
      }
    } catch (error) {
      console.error('Erro ao carregar informações da empresa:', error);
      setError('Erro ao carregar informações da empresa');
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  };

  const refreshCompanyInfo = async () => {
    // Debounce para evitar múltiplas chamadas
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
    
    const timeout = setTimeout(async () => {
      // console.log('Forçando refresh das informações da empresa...');
      setIsInitialized(false); // Reset initialization flag to force refetch
      await fetchCompanyInfo();
    }, 300);
    
    setRefreshTimeout(timeout);
  };

  useEffect(() => {
    if (user?.id && !isInitialized) {
      fetchCompanyInfo();
    }
  }, [user?.id]);

  // Escutar mudanças em tempo real na tabela profiles (apenas se inicializado)
  useEffect(() => {
    if (!user?.id || !isInitialized) return;

    const channelName = `profiles_changes_${user.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          // Atualizar as informações quando houver mudanças (com debounce)
          refreshCompanyInfo();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [user?.id, isInitialized]);

  return (
    <CompanyContext.Provider value={{ companyInfo, loading, error, refreshCompanyInfo }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompanyInfo = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompanyInfo deve ser usado dentro de um CompanyProvider');
  }
  return context;
};
