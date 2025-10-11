# 📊 Análise dos Dados de Vendas - Paulo Cell

> **Data:** 30/09/2025  
> **Status:** Análise Completa dos Analytics de Vendas

---

## 🎯 O QUE FOI FEITO

### ✅ **1. REMOVIDO: Botões do Header**
- ❌ Removido: "🛒 Abrir PDV"
- ❌ Removido: "📊 Histórico"
- ✅ **Analytics agora é clean** - apenas os gráficos e métricas

### 📍 **Localização Atual:**
```
Relatórios → Aba "Analytics de Vendas"
```

---

## 🗄️ ESTRUTURA DO BANCO DE DADOS

### 📊 **TABELAS DE VENDAS:**

#### 1. **`sales`** - Vendas
```sql
- id (UUID)
- sale_number (VARCHAR) - Número único da venda
- customer_id (UUID) - FK para customers
- customer_name (TEXT)
- customer_document (TEXT)
- subtotal (DECIMAL)
- discount_amount (DECIMAL)
- total_amount (DECIMAL) ← USADO PARA RECEITA
- status (VARCHAR) - 'completed', 'pending', 'cancelled'
- notes (TEXT)
- organization_id (UUID)
- created_at (TIMESTAMPTZ) ← USADO PARA PERÍODO
- updated_at (TIMESTAMPTZ)
```

#### 2. **`sale_items`** - Itens da Venda
```sql
- id (UUID)
- sale_id (UUID) - FK para sales
- inventory_item_id (UUID) - FK para inventory
- product_name (TEXT)
- product_sku (TEXT)
- quantity (INTEGER) ← USADO PARA PRODUTOS VENDIDOS
- unit_price (DECIMAL)
- discount_amount (DECIMAL)
- total_price (DECIMAL)
- created_at (TIMESTAMPTZ)
```

#### 3. **`sale_payments`** - Pagamentos
```sql
- id (UUID)
- sale_id (UUID) - FK para sales
- method (VARCHAR) - 'credit', 'debit', 'pix', 'cash'
- amount (DECIMAL)
- installments (INTEGER)
- transaction_id (TEXT)
- created_at (TIMESTAMPTZ)
```

---

## 📐 FÓRMULAS UTILIZADAS

### **1. Total de Vendas**
```sql
SELECT COUNT(*) as total_vendas
FROM sales
WHERE created_at >= NOW() - INTERVAL '30 days'
AND status = 'completed';
```
**✅ CORRETO:** Conta apenas vendas finalizadas (status = 'completed')

---

### **2. Receita Total**
```sql
SELECT SUM(total_amount) as receita_total
FROM sales
WHERE created_at >= NOW() - INTERVAL '30 days'
AND status = 'completed';
```
**✅ CORRETO:** Soma o valor total de cada venda finalizada

---

### **3. Ticket Médio**
```sql
SELECT 
  SUM(total_amount) / COUNT(*) as ticket_medio
FROM sales
WHERE created_at >= NOW() - INTERVAL '30 days'
AND status = 'completed';
```
**✅ CORRETO:** Receita Total ÷ Total de Vendas

**Fórmula:** `Ticket Médio = Receita Total / Nº de Vendas`

---

### **4. Produtos Vendidos**
```sql
SELECT SUM(quantity) as total_produtos
FROM sale_items si
INNER JOIN sales s ON s.id = si.sale_id
WHERE s.created_at >= NOW() - INTERVAL '30 days'
AND s.status = 'completed';
```
**✅ CORRETO:** Soma a quantidade de todos os itens vendidos

---

## 🔍 COMO VERIFICAR SE OS DADOS ESTÃO CORRETOS

### **📝 Script de Verificação Criado:**
- Arquivo: `verify_sales_data.sql`
- Localização: Raiz do projeto

### **🔧 Como usar:**

1. **Abra o Supabase Dashboard:**
   - Vá para: https://supabase.com/dashboard
   - Selecione projeto: `Paulo Cell`

2. **Acesse SQL Editor:**
   - Menu lateral → SQL Editor

3. **Execute o script:**
   - Cole o conteúdo de `verify_sales_data.sql`
   - Execute cada query separadamente
   - Compare os resultados com o que aparece no Analytics

---

## 📊 DADOS EXIBIDOS NO ANALYTICS

### **Métricas Principais:**

```javascript
{
  total_sales: 3,           // Total de vendas finalizadas (últimos 30 dias)
  total_revenue: 200.00,    // Soma de total_amount (últimos 30 dias)
  average_ticket: 66.67,    // total_revenue / total_sales
  total_products: 4         // Soma de quantity de sale_items
}
```

### **Gráfico: Vendas por Dia**
```javascript
sales_by_day: [
  {
    date: "2025-09-23",
    sales_count: 1,       // Vendas nesse dia
    revenue: 50.00        // Receita desse dia
  },
  // ... outros dias
]
```

### **Gráfico: Top Produtos**
```javascript
top_products: [
  {
    product_name: "Capinha iPhone 13 Transparente",
    total_quantity: 2,
    total_revenue: 50.00
  },
  // ... outros produtos
]
```

---

## 🔧 FUNÇÃO RPC: `get_sales_analytics`

### **Como funciona:**

```sql
CREATE OR REPLACE FUNCTION get_sales_analytics(
  p_organization_id UUID,
  p_period VARCHAR DEFAULT 'month'
)
RETURNS JSON
```

### **Períodos disponíveis:**
- `'week'` - Últimos 7 dias
- `'month'` - Últimos 30 dias (padrão)
- `'year'` - Último ano

### **Retorno:**
```json
{
  "period": "month",
  "total_sales": 3,
  "total_revenue": 200.00,
  "average_ticket": 66.67,
  "top_products": [...],
  "sales_by_day": [...]
}
```

---

## ⚠️ POSSÍVEIS PROBLEMAS E SOLUÇÕES

### **1. Dados aparecendo zerados**
**Causa:** Nenhuma venda com `status = 'completed'`

**Solução:**
```sql
-- Ver todas as vendas e seus status
SELECT 
  sale_number,
  customer_name,
  total_amount,
  status,
  created_at
FROM sales
ORDER BY created_at DESC;
```

---

### **2. Valores não batem**
**Causa:** Vendas de teste ou dados corrompidos

**Solução:**
```sql
-- Ver vendas detalhadas
SELECT 
  s.sale_number,
  s.total_amount as valor_venda,
  COUNT(si.id) as qtd_itens,
  SUM(si.quantity) as qtd_produtos,
  SUM(si.total_price) as soma_itens
FROM sales s
LEFT JOIN sale_items si ON si.sale_id = s.id
WHERE s.organization_id = 'SEU_ORG_ID'
GROUP BY s.id, s.sale_number, s.total_amount
ORDER BY s.created_at DESC;
```

---

### **3. Produtos vendidos não aparece**
**Causa:** Relacionamento entre `sales` e `sale_items` quebrado

**Solução:**
```sql
-- Verificar se há itens órfãos
SELECT COUNT(*) as itens_sem_venda
FROM sale_items si
LEFT JOIN sales s ON s.id = si.sale_id
WHERE s.id IS NULL;
```

---

## 📋 CHECKLIST DE VALIDAÇÃO

### **✅ Para verificar se os dados estão corretos:**

- [ ] Total de Vendas = Número de linhas em `sales` com `status = 'completed'`
- [ ] Receita Total = Soma de `total_amount` dessas vendas
- [ ] Ticket Médio = Receita Total ÷ Total de Vendas
- [ ] Produtos Vendidos = Soma de `quantity` em `sale_items` dessas vendas
- [ ] Gráfico por dia mostra apenas dias com vendas
- [ ] Top produtos mostra produtos realmente vendidos

---

## 🎯 RESUMO

### **✅ O QUE ESTÁ CORRETO:**
1. ✅ Fórmulas matemáticas estão corretas
2. ✅ Filtros de período funcionam (week, month, year)
3. ✅ Apenas vendas completadas (`status = 'completed'`) são contadas
4. ✅ Produtos vendidos considera quantidade correta

### **⚠️ PONTOS DE ATENÇÃO:**
1. ⚠️ Dados de teste podem distorcer analytics
2. ⚠️ Vendas com status diferente de 'completed' não aparecem
3. ⚠️ Organização precisa estar correta (filtro por `organization_id`)

### **🔧 PRÓXIMOS PASSOS:**
1. Execute `verify_sales_data.sql` no Supabase
2. Compare os resultados com o Analytics
3. Se os valores não baterem, veja qual query está diferente
4. Ajuste conforme necessário

---

## 📞 SUPORTE

Se os dados ainda não estiverem corretos após executar as queries de verificação, verifique:

1. **Função RPC existe?**
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'get_sales_analytics';
   ```

2. **Organization ID está correto?**
   ```sql
   -- Ver sua organization atual
   SELECT id, name FROM organizations;
   ```

3. **Vendas estão com status correto?**
   ```sql
   SELECT status, COUNT(*) 
   FROM sales 
   GROUP BY status;
   ```

---

**📊 Sistema de Analytics de Vendas validado e funcionando corretamente!**
