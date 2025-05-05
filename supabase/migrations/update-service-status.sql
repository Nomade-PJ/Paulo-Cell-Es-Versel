-- Função RPC para atualizar status de serviços
CREATE OR REPLACE FUNCTION update_service_status(
  p_service_id UUID,
  p_organization_id UUID,
  p_status TEXT
) 
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com os privilégios do criador da função
AS $$
DECLARE
  v_current_date TIMESTAMP WITH TIME ZONE := NOW();
  v_result JSONB;
BEGIN
  -- Verificar se o serviço existe e pertence à organização
  IF NOT EXISTS (
    SELECT 1 FROM services 
    WHERE id = p_service_id AND organization_id = p_organization_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Serviço não encontrado ou não pertence à organização especificada'
    );
  END IF;

  -- Atualizar status e data correspondente
  UPDATE services
  SET 
    status = p_status,
    updated_at = v_current_date,
    -- Atualizar campos de data específicos com base no status
    pending_date = CASE WHEN p_status = 'pending' THEN v_current_date ELSE pending_date END,
    in_progress_date = CASE WHEN p_status = 'in_progress' THEN v_current_date ELSE in_progress_date END,
    waiting_parts_date = CASE WHEN p_status = 'waiting_parts' THEN v_current_date ELSE waiting_parts_date END,
    completed_date = CASE WHEN p_status = 'completed' THEN v_current_date ELSE completed_date END,
    delivery_date = CASE WHEN p_status = 'delivered' THEN v_current_date ELSE delivery_date END
  WHERE 
    id = p_service_id AND 
    organization_id = p_organization_id
  RETURNING jsonb_build_object(
    'id', id,
    'status', status,
    'updated_at', updated_at
  ) INTO v_result;

  -- Retornar resultado
  RETURN jsonb_build_object(
    'success', true,
    'data', v_result
  );
END;
$$; 
