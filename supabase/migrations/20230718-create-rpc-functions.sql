-- Verificar e criar a função RPC para atualizar o tracking ID de um serviço
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_proc 
    WHERE proname = 'update_service_tracking_id'
  ) THEN
    -- Criar função RPC para atualizar o tracking ID de um serviço
    EXECUTE $FUNCTION$
    CREATE FUNCTION update_service_tracking_id(p_service_id UUID, p_tracking_id UUID)
    RETURNS BOOLEAN
    LANGUAGE plpgsql
    SECURITY DEFINER -- Executa com permissões do criador, não do chamador
    AS $INNER$
    BEGIN
      -- Atualizar o tracking ID do serviço
      UPDATE services
      SET public_tracking_id = p_tracking_id
      WHERE id = p_service_id
      AND (public_tracking_id IS NULL OR public_tracking_id != p_tracking_id);
      
      -- Retornar true se a atualização foi realizada com sucesso
      RETURN FOUND;
    END;
    $INNER$;
    $FUNCTION$;
    
    RAISE NOTICE 'Função update_service_tracking_id criada com sucesso';
  ELSE
    RAISE NOTICE 'Função update_service_tracking_id já existe';
  END IF;
END $$;

-- Garantir acesso à função para usuários anônimos
GRANT EXECUTE ON FUNCTION update_service_tracking_id(UUID, UUID) TO anon;

-- Verificar e criar a função RPC para verificar se um serviço existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_proc 
    WHERE proname = 'check_service_tracking_id'
  ) THEN
    -- Criar função RPC para verificar se um serviço existe com um determinado tracking ID
    EXECUTE $FUNCTION$
    CREATE FUNCTION check_service_tracking_id(p_tracking_id UUID)
    RETURNS BOOLEAN
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $INNER$
    DECLARE
      service_exists BOOLEAN;
    BEGIN
      -- Verificar se existe um serviço com o tracking ID fornecido
      SELECT EXISTS (
        SELECT 1
        FROM services
        WHERE public_tracking_id = p_tracking_id
      ) INTO service_exists;
      
      -- Retornar o resultado
      RETURN service_exists;
    END;
    $INNER$;
    $FUNCTION$;
    
    RAISE NOTICE 'Função check_service_tracking_id criada com sucesso';
  ELSE
    RAISE NOTICE 'Função check_service_tracking_id já existe';
  END IF;
END $$;

-- Garantir acesso à função para usuários anônimos
GRANT EXECUTE ON FUNCTION check_service_tracking_id(UUID) TO anon; 