-- ============================================
-- CONFIGURAÇÃO RÁPIDA DE PAGAMENTOS
-- Paulo Cell Sistema
-- ============================================

-- 1️⃣ VERIFICAR ORGANIZAÇÕES EXISTENTES
SELECT id, name, created_at
FROM organizations
ORDER BY created_at DESC;

-- 2️⃣ CONFIGURAR CHAVE PIX
-- Substitua os valores conforme sua necessidade:
UPDATE organizations 
SET 
  pix_key = 'suachavepix@exemplo.com',           -- Sua chave PIX real
  pix_key_type = 'email',                        -- Tipo: 'cpf', 'cnpj', 'email', 'phone', 'random'
  merchant_name = 'PAULO CELL',                  -- Nome da empresa no PIX
  merchant_city = 'VITORIA'                      -- Cidade da empresa
WHERE name = 'Paulo Cell';  -- Nome da sua organização

-- 3️⃣ CONFIGURAR API DO PAGBANK (OPCIONAL)
-- Apenas se você vai usar a maquininha ModerninhaPro2
UPDATE organizations 
SET pagbank_api_key = 'SUA_API_KEY_PAGBANK'     -- Chave da API do PagSeguro
WHERE name = 'Paulo Cell';

-- 4️⃣ VERIFICAR CONFIGURAÇÃO
SELECT 
  id,
  name,
  pix_key,
  pix_key_type,
  merchant_name,
  merchant_city,
  CASE 
    WHEN pagbank_api_key IS NOT NULL THEN 'Configurado ✅' 
    ELSE 'Não configurado ❌' 
  END as status_pagbank
FROM organizations
WHERE name = 'Paulo Cell';

-- ============================================
-- QUERIES ÚTEIS PARA VERIFICAÇÃO
-- ============================================

-- 5️⃣ VERIFICAR VENDAS RECENTES
SELECT 
  sale_number,
  customer_name,
  final_amount,
  payment_method,
  payment_status,
  status,
  created_at
FROM sales
ORDER BY created_at DESC
LIMIT 10;

-- 6️⃣ VERIFICAR ITENS DE VENDA
SELECT 
  s.sale_number,
  si.product_name,
  si.quantity,
  si.unit_price,
  si.total_price
FROM sales s
JOIN sale_items si ON s.id = si.sale_id
ORDER BY s.created_at DESC
LIMIT 20;

-- 7️⃣ TESTAR FUNÇÃO DE ANALYTICS
SELECT get_sales_analytics(
  (SELECT id FROM organizations WHERE name = 'Paulo Cell'),
  'month'
) as analytics_resultado;

-- 8️⃣ VERIFICAR PRÓXIMO NÚMERO DE VENDA
SELECT generate_sale_number() as proximo_numero_venda;

-- ============================================
-- CONFIGURAÇÕES AVANÇADAS (OPCIONAL)
-- ============================================

-- 9️⃣ CONFIGURAR SETTINGS ADICIONAIS
-- Exemplo: configurar taxas, limites, etc.
UPDATE organizations 
SET payment_settings = jsonb_build_object(
  'pix_enabled', true,
  'credit_card_enabled', true,
  'debit_card_enabled', true,
  'max_installments', 12,
  'min_installment_value', 30.00,
  'auto_confirm_pix', false  -- Confirmação manual por padrão
)
WHERE name = 'Paulo Cell';

-- 🔟 VISUALIZAR TODAS AS CONFIGURAÇÕES
SELECT 
  name as organizacao,
  pix_key as chave_pix,
  pix_key_type as tipo_chave,
  merchant_name as nome_comercial,
  merchant_city as cidade,
  payment_settings as configuracoes_extras,
  CASE 
    WHEN pagbank_api_key IS NOT NULL THEN '🟢 Configurado' 
    ELSE '🔴 Não configurado' 
  END as status_pagbank,
  CASE 
    WHEN pix_key IS NOT NULL THEN '🟢 Configurado' 
    ELSE '🔴 Não configurado' 
  END as status_pix
FROM organizations;

-- ============================================
-- EXEMPLOS DE CHAVES PIX
-- ============================================

-- CPF (11 dígitos sem formatação)
-- UPDATE organizations SET pix_key = '12345678900', pix_key_type = 'cpf';

-- CNPJ (14 dígitos sem formatação)
-- UPDATE organizations SET pix_key = '12345678000100', pix_key_type = 'cnpj';

-- Email
-- UPDATE organizations SET pix_key = 'contato@paulocell.com', pix_key_type = 'email';

-- Telefone (com código do país e DDD)
-- UPDATE organizations SET pix_key = '+5527999999999', pix_key_type = 'phone';

-- Chave Aleatória (UUID gerado pelo banco)
-- UPDATE organizations SET pix_key = '123e4567-e89b-12d3-a456-426614174000', pix_key_type = 'random';

-- ============================================
-- RELATÓRIOS E ESTATÍSTICAS
-- ============================================

-- Vendas por método de pagamento (últimos 30 dias)
SELECT 
  payment_method,
  COUNT(*) as quantidade_vendas,
  SUM(final_amount) as valor_total,
  ROUND(AVG(final_amount), 2) as ticket_medio
FROM sales
WHERE created_at >= NOW() - INTERVAL '30 days'
AND status = 'confirmed'
GROUP BY payment_method
ORDER BY quantidade_vendas DESC;

-- Vendas por dia (última semana)
SELECT 
  DATE(created_at) as data,
  COUNT(*) as total_vendas,
  SUM(final_amount) as receita
FROM sales
WHERE created_at >= NOW() - INTERVAL '7 days'
AND status = 'confirmed'
GROUP BY DATE(created_at)
ORDER BY data DESC;

-- Produtos mais vendidos
SELECT 
  si.product_name,
  SUM(si.quantity) as total_vendido,
  SUM(si.total_price) as receita_gerada
FROM sale_items si
JOIN sales s ON s.id = si.sale_id
WHERE s.created_at >= NOW() - INTERVAL '30 days'
AND s.status = 'confirmed'
GROUP BY si.product_name
ORDER BY total_vendido DESC
LIMIT 10;

-- ============================================
-- LIMPEZA E MANUTENÇÃO (USE COM CUIDADO!)
-- ============================================

-- Resetar configurações de pagamento (se necessário)
-- UPDATE organizations SET 
--   pix_key = NULL,
--   pix_key_type = NULL,
--   pagbank_api_key = NULL,
--   payment_settings = '{}'::jsonb
-- WHERE name = 'Paulo Cell';

-- Cancelar vendas pendentes antigas (mais de 7 dias)
-- UPDATE sales 
-- SET status = 'cancelled'
-- WHERE status = 'draft'
-- AND created_at < NOW() - INTERVAL '7 days';

-- ============================================
-- FIM DO SCRIPT
-- ============================================

-- Mensagem de sucesso
SELECT '✅ Configuração concluída! Verifique os resultados acima.' as status;

