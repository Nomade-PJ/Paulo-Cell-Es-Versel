import { supabase } from '@/integrations/supabaseClient';

/**
 * Serviço para gerenciar organizações no Supabase
 */
export const organizationService = {
  /**
   * Obtém a organização do usuário atual
   */
  async getCurrentUserOrganization() {
    try {
      // Primeiro tentamos obter a organização do perfil do usuário atual
      const { data: profileData, error: profileError } = await supabase.auth.getUser();
      
      if (profileError) throw profileError;
      
      if (!profileData.user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Obter o perfil completo com organization_id
      const { data: profile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', profileData.user.id)
        .single();
      
      if (profileFetchError) throw profileFetchError;
      
      if (!profile?.organization_id) {
        return null;
      }
      
      // Agora obtemos os detalhes da organização
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .single();
      
      if (orgError) throw orgError;
      
      return organization;
    } catch (error) {
      console.error('Erro ao buscar organização do usuário:', error);
      throw error;
    }
  },
  
  /**
   * Cria uma nova organização para o usuário atual (caso ele ainda não tenha)
   */
  async createOrganizationForCurrentUser(name: string) {
    try {
      // Obter o usuário atual
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      if (!userData.user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Verificar se o usuário já tem uma organização
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userData.user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      
      if (profile?.organization_id) {
        throw new Error('Usuário já possui uma organização');
      }
      
      // Criar nova organização
      const { data: newOrg, error: createError } = await supabase
        .from('organizations')
        .insert([
          { name }
        ])
        .select()
        .single();
      
      if (createError) throw createError;
      
      // Atualizar o perfil do usuário com a nova organização
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ organization_id: newOrg.id })
        .eq('id', userData.user.id);
      
      if (updateError) throw updateError;
      
      return newOrg;
    } catch (error) {
      console.error('Erro ao criar organização:', error);
      throw error;
    }
  }
}; 