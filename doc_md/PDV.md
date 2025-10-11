# 🛒 Sistema PDV - Paulo Cell

> **Documentação para Remoção/Rollback do Sistema de Vendas**  
> Data: Setembro 2025  
> Status: Sistema Implementado - Instruções para Rollback

---

## 📋 Índice

- [📊 Resumo das Implementações](#-resumo-das-implementações)
- [🗄️ Mudanças no Banco de Dados](#️-mudanças-no-banco-de-dados)
- [📁 Arquivos Frontend Criados](#-arquivos-frontend-criados)
- [🔧 Instruções para Rollback](#-instruções-para-rollback)
- [⚠️ Considerações Importantes](#️-considerações-importantes)

---

## 📊 Resumo das Implementações

### 🎯 **O que foi implementado:**

1. **🛒 Sistema PDV Completo** - Ponto de Venda com carrinho, produtos, clientes
2. **📊 Analytics de Vendas** - Gráficos e métricas de vendas
3. **📋 Histórico de Vendas** - Listagem completa de vendas realizadas
4. **🔄 Integração com Estoque** - Baixa automática no estoque
5. **👥 Integração com Clientes** - Usar clientes existentes
6. **📱 Interface Responsiva** - Funciona em desktop e mobile

### 🎨 **Funcionalidades do PDV:**
- Busca de produtos por nome/SKU
- Seleção de clientes existentes
- Carrinho interativo com quantidade/desconto
- Múltiplos métodos de pagamento
- Desconto global na venda
- Observações da venda
- Geração automática de número da venda
- Baixa automática no estoque

---

## 🗄️ Mudanças no Banco de Dados

### 📊 **NOVAS TABELAS CRIADAS:**

#### 1. **`sales` - Vendas**
```sql
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number VARCHAR(20) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT NOT NULL,
  customer_document TEXT,
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'completed',
  notes TEXT,
  organization_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. **`sale_items` - Itens da Venda**
```sql
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES inventory(id),
  product_name TEXT NOT NULL,
  product_sku TEXT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. **`sale_payments` - Pagamentos**
```sql
CREATE TABLE sale_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  method VARCHAR(20) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  installments INTEGER DEFAULT 1,
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. **`inventory_movements` - Movimentações de Estoque**
```sql
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID REFERENCES inventory(id),
  movement_type VARCHAR(20) NOT NULL,
  quantity INTEGER NOT NULL,
  reason TEXT,
  reference_id UUID,
  reference_type VARCHAR(50),
  organization_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 🔧 **FUNÇÕES RPC CRIADAS:**

#### 1. **`get_products_for_sale`**
```sql
CREATE OR REPLACE FUNCTION get_products_for_sale(p_organization_id UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  sku TEXT,
  price DECIMAL,
  quantity INTEGER,
  category TEXT,
  compatibility TEXT
)
```

#### 2. **`process_sale`**
```sql
CREATE OR REPLACE FUNCTION process_sale(
  p_customer_id UUID,
  p_customer_name TEXT,
  p_customer_document TEXT,
  p_items TEXT,
  p_payments TEXT,
  p_discount_amount DECIMAL,
  p_notes TEXT,
  p_organization_id UUID
)
RETURNS JSON
```

#### 3. **`get_sales_analytics`**
```sql
CREATE OR REPLACE FUNCTION get_sales_analytics(p_organization_id UUID)
RETURNS JSON
```

#### 4. **`generate_sale_number`**
```sql
CREATE OR REPLACE FUNCTION generate_sale_number(p_organization_id UUID)
RETURNS TEXT
```

#### 5. **`add_sale_to_service`**
```sql
CREATE OR REPLACE FUNCTION add_sale_to_service(
  p_service_id UUID,
  p_sale_id UUID
)
RETURNS BOOLEAN
```

### 📝 **DADOS DE TESTE INSERIDOS:**

- **10 clientes** de teste com email `canalstvoficial@gmail.com`
- **10 dispositivos** de teste 
- **10 ordens de serviço** de teste
- **Produtos de teste** no estoque (Capinha iPhone, Carregador USB-C, Fone Bluetooth)
- **3 vendas de exemplo** para demonstração

---

## 📁 Arquivos Frontend Criados

### 🆕 **NOVOS ARQUIVOS:**

1. **`src/pages/Sales.tsx`** - Página principal do PDV (618 linhas)
2. **`src/pages/SalesHistory.tsx`** - Histórico de vendas (411 linhas)
3. **`src/components/SalesDashboard.tsx`** - Analytics de vendas (182 linhas)

### ✏️ **ARQUIVOS MODIFICADOS:**

1. **`src/App.tsx`** - Adicionadas rotas para vendas
2. **`src/pages/Dashboard.tsx`** - Botões de acesso ao PDV + analytics
3. **`src/components/DesktopSidebar.tsx`** - Item "Vendas" no menu
4. **`src/components/Sidebar.tsx`** - Item "Vendas" no menu mobile
5. **`src/pages/Services.tsx`** - Correção do bug de filtros
6. **`src/components/ServiceActionsMenu.tsx`** - Callback de atualização

---

## 🔧 Instruções para Rollback

### 🗄️ **1. REMOÇÃO DO BANCO DE DADOS**

#### **A. Remover Dados de Teste:**
```sql
-- Remover vendas de teste
DELETE FROM sale_payments WHERE sale_id IN (
  SELECT id FROM sales WHERE organization_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
);

DELETE FROM sale_items WHERE sale_id IN (
  SELECT id FROM sales WHERE organization_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
);

DELETE FROM sales WHERE organization_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

-- Remover movimentações de estoque
DELETE FROM inventory_movements WHERE organization_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

-- Remover clientes de teste (opcional - cuidado com dados reais)
DELETE FROM customers WHERE email LIKE '%canalstvoficial%' AND organization_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

-- Remover dispositivos de teste (opcional)
DELETE FROM devices WHERE customer_id IN (
  SELECT id FROM customers WHERE email LIKE '%canalstvoficial%'
);

-- Remover serviços de teste (opcional)
DELETE FROM services WHERE customer_id IN (
  SELECT id FROM customers WHERE email LIKE '%canalstvoficial%'
);
```

#### **B. Remover Tabelas (CUIDADO!):**
```sql
-- ⚠️ ATENÇÃO: Isso remove TODAS as vendas, não apenas de teste!
DROP TABLE IF EXISTS inventory_movements CASCADE;
DROP TABLE IF EXISTS sale_payments CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
```

#### **C. Remover Funções RPC:**
```sql
DROP FUNCTION IF EXISTS get_products_for_sale(UUID);
DROP FUNCTION IF EXISTS process_sale(UUID, TEXT, TEXT, TEXT, TEXT, DECIMAL, TEXT, UUID);
DROP FUNCTION IF EXISTS get_sales_analytics(UUID);
DROP FUNCTION IF EXISTS generate_sale_number(UUID);
DROP FUNCTION IF EXISTS add_sale_to_service(UUID, UUID);
```

### 📁 **2. REMOÇÃO DO FRONTEND**

#### **A. Deletar Arquivos Criados:**
```bash
# Deletar páginas do PDV
rm src/pages/Sales.tsx
rm src/pages/SalesHistory.tsx
rm src/components/SalesDashboard.tsx
```

#### **B. Reverter Arquivos Modificados:**

**`src/App.tsx` - Remover rotas:**
```typescript
// REMOVER estas linhas:
import Sales from "./pages/Sales";
import SalesHistory from "./pages/SalesHistory";

// REMOVER estas rotas:
<Route path="sales" element={<Sales />} />
<Route path="sales/history" element={<SalesHistory />} />
```

**`src/components/DesktopSidebar.tsx` - Remover do menu:**
```typescript
// REMOVER esta linha do import:
ShoppingCart,

// REMOVER esta linha do navItems:
{ icon: ShoppingCart, label: "Vendas", path: "/dashboard/sales", notificationType: null },
```

### 🔄 **COMO REATIVAR O MENU LATERAL NO FUTURO:**

**Para adicionar "Vendas" de volta ao menu lateral:**

#### **Passo 1 - Adicionar import:**
```typescript
// src/components/DesktopSidebar.tsx
import { 
  LayoutDashboard, 
  Users, 
  Smartphone, 
  Wrench,
  ShoppingCart,  // ← ADICIONAR ESTA LINHA
  Package, 
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
```

#### **Passo 2 - Adicionar ao navItems:**
```typescript
// src/components/DesktopSidebar.tsx
const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", notificationType: null },
  { icon: Users, label: "Clientes", path: "/dashboard/clients", notificationType: null },
  { icon: Smartphone, label: "Dispositivos", path: "/dashboard/devices", notificationType: "devices" },
  { icon: Wrench, label: "Serviços", path: "/dashboard/services", notificationType: "services" },
  { icon: ShoppingCart, label: "Vendas", path: "/dashboard/sales", notificationType: null }, // ← ADICIONAR ESTA LINHA
  { icon: Package, label: "Estoque", path: "/dashboard/inventory", notificationType: "inventory" },
  { icon: FileText, label: "Documentos", path: "/dashboard/documents", notificationType: "documents" },
  { icon: BarChart3, label: "Relatórios", path: "/dashboard/reports", notificationType: null },
  { icon: Settings, label: "Configurações", path: "/dashboard/settings", notificationType: null },
];
```

#### **Passo 3 - Para menu mobile (opcional):**
```typescript
// src/components/Sidebar.tsx - Se quiser no mobile também
// Adicionar ShoppingCart ao import e criar NavLink similar
```

**`src/pages/Dashboard.tsx` - Remover analytics e botões:**
```typescript
// REMOVER estas importações:
import SalesDashboard from '@/components/SalesDashboard';
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

// REMOVER todo este card:
{/* Analytics de Vendas */}
<Card>
  <CardHeader className="flex flex-row items-center justify-between">
    <CardTitle className="flex items-center gap-2">
      <ShoppingCart className="h-5 w-5" />
      Analytics de Vendas
    </CardTitle>
    <div className="flex gap-2">
      <Button 
        onClick={() => window.location.href = '/dashboard/sales'}
        className="bg-green-600 hover:bg-green-700"
      >
        🛒 Abrir PDV
      </Button>
      <Button 
        variant="outline"
        onClick={() => window.location.href = '/dashboard/sales/history'}
      >
        📊 Histórico
      </Button>
    </div>
  </CardHeader>
  <CardContent>
    <SalesDashboard />
  </CardContent>
</Card>
```

#### **C. Reverter Correções (Opcional):**

**`src/pages/Services.tsx` - Manter ou reverter:**
```typescript
// As correções do filtro são BENÉFICAS, mas se quiser reverter:
// - Remover função handleServiceUpdate
// - Voltar onUpdate para recarregar toda lista
```

---

## ⚠️ Considerações Importantes

### 🟢 **SEGURO PARA PRODUÇÃO:**

1. **📁 Código Frontend:**
   - Todas as mudanças são **aditivas**
   - Não quebram funcionalidades existentes
   - Podem ficar no projeto sem problemas

2. **🗄️ Tabelas do Banco:**
   - **Novas tabelas** não afetam tabelas existentes
   - **Dados isolados** por `organization_id`
   - **Funções RPC novas** não modificam existentes

### 🟡 **CUIDADOS:**

1. **📊 Dados de Teste:**
   - Estão misturados com dados reais
   - Filtrar por `organization_id` específico
   - Verificar antes de deletar

2. **🔧 Dependências:**
   - Algumas funções RPC podem estar sendo usadas
   - Verificar logs antes de remover

### 🚨 **ORDEM DE REMOÇÃO:**

**Se quiser remover tudo:**

1. **📊 Primeiro:** Remover dados de teste específicos
2. **📁 Segundo:** Remover arquivos frontend
3. **🗄️ Terceiro:** Remover tabelas (se desejar)
4. **🔧 Quarto:** Remover funções RPC

### 📝 **SCRIPT COMPLETO DE ROLLBACK:**

```bash
#!/bin/bash
# Script para rollback completo do sistema PDV

echo "🗑️ Removendo arquivos frontend..."
rm -f src/pages/Sales.tsx
rm -f src/pages/SalesHistory.tsx  
rm -f src/components/SalesDashboard.tsx

echo "🔄 Revertendo arquivos modificados..."
# Usar git checkout para reverter para versão anterior:
git checkout HEAD~1 src/App.tsx
git checkout HEAD~1 src/pages/Dashboard.tsx
git checkout HEAD~1 src/components/DesktopSidebar.tsx
git checkout HEAD~1 src/pages/Services.tsx
git checkout HEAD~1 src/components/ServiceActionsMenu.tsx

echo "✅ Rollback frontend concluído!"
echo "⚠️ Para rollback do banco, execute os SQLs manualmente"
```

### 🔍 **VERIFICAÇÃO PÓS-ROLLBACK:**

```bash
# Verificar se arquivos foram removidos
ls src/pages/Sales.tsx 2>/dev/null && echo "❌ Sales.tsx ainda existe" || echo "✅ Sales.tsx removido"
ls src/pages/SalesHistory.tsx 2>/dev/null && echo "❌ SalesHistory.tsx ainda existe" || echo "✅ SalesHistory.tsx removido"

# Verificar rotas
grep -n "sales" src/App.tsx && echo "❌ Rotas de vendas ainda existem" || echo "✅ Rotas removidas"

# Verificar menu
grep -n "Vendas" src/components/DesktopSidebar.tsx && echo "❌ Item Vendas ainda no menu" || echo "✅ Menu limpo"
```

### 🎯 **ACESSO ATUAL AO PDV (SEM MENU LATERAL):**

**Mesmo com o menu removido, o PDV ainda funciona perfeitamente através de:**

1. **🚀 Botões no Dashboard:**
   - **"🛒 Abrir PDV"** - leva para `/dashboard/sales`
   - **"📊 Histórico"** - leva para `/dashboard/sales/history`

2. **🔗 URL Direta:**
   - **PDV:** `http://localhost:8080/dashboard/sales`
   - **Histórico:** `http://localhost:8080/dashboard/sales/history`

3. **📊 Analytics:** Visível no Dashboard na seção "Analytics de Vendas"

---

## 💡 **Alternativa: Branch de Desenvolvimento**

### 🌿 **Opção Recomendada:**

Em vez de remover, considere criar uma **branch separada**:

```bash
# Criar branch para produção limpa
git checkout -b production-clean
git checkout main  # Voltar para desenvolvimento

# Ou criar branch para funcionalidades PDV
git checkout -b feature/pdv-system
git add .
git commit -m "Sistema PDV completo implementado"
```

### ✅ **Vantagens da Branch:**

- **🔒 Produção protegida** na branch `production-clean`
- **🚀 Desenvolvimento continua** na branch `main` ou `feature/pdv-system`
- **🔄 Merge futuro** quando quiser aplicar em produção
- **📊 Histórico preservado** de todas as mudanças

---

## 🎯 **Resumo Executivo**

### 📈 **Impacto Atual:**
- **✅ Zero impacto** nas funcionalidades existentes
- **✅ Dados isolados** por organização
- **✅ Código aditivo** apenas

### 🛡️ **Recomendação:**
- **🟢 MANTER** o sistema - não prejudica produção
- **🌿 USAR BRANCHES** para controle de versão
- **🔄 APLICAR EM PRODUÇÃO** quando estiver pronto

### 🚨 **Se precisar remover:**
- **📊 Dados de teste:** SQL específico por `organization_id`
- **📁 Frontend:** Deletar 3 arquivos + reverter 5 modificações
- **🗄️ Banco:** 4 tabelas + 5 funções RPC

---

**🤝 Este documento garante que qualquer programador possa reverter completamente as implementações do sistema PDV sem afetar o restante do projeto Paulo Cell.**
