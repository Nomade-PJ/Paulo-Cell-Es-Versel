# Como Remover Completamente o Banner de Manutenção

Este documento descreve todos os arquivos e alterações relacionados ao banner de manutenção programada para facilitar sua remoção completa e retornar o sistema ao estado anterior.

## Arquivos Criados

### 1. Componente Principal do Banner
**Arquivo:** `src/components/MaintenanceBanner.tsx`
- **Ação:** DELETAR este arquivo completamente
- **Descrição:** Contém o componente React do banner com cronômetro regressivo

## Arquivos Modificados

### 2. DesktopHeader (Header do Desktop)
**Arquivo:** `src/components/DesktopHeader.tsx`

**Alterações a reverter:**

**Linha ~20:** Remover o import
```typescript
import MaintenanceBanner from './MaintenanceBanner';
```

**Linhas ~187-194:** Reverter a estrutura do header
```typescript
// REMOVER ESTAS LINHAS:
return (
  <header className="h-16 bg-background border-b border-border flex items-center justify-end px-6 shadow-sm relative">
    {/* Banner de Manutenção - Posicionado absolutamente */}
    <div className="absolute top-0 left-0 right-0 z-50">
      <MaintenanceBanner />
    </div>
    
    {/* Right Side Actions */}
    <div className="flex items-center space-x-4">

// VOLTAR PARA:
return (
  <header className="h-16 bg-background border-b border-border flex items-center justify-end px-6 shadow-sm">
    {/* Right Side Actions */}
    <div className="flex items-center space-x-4">
```

**Observação:** O `relative` no header e o div wrapper com absolute do banner devem ser removidos.

### 3. Header (Header Mobile)
**Arquivo:** `src/components/Header.tsx`

**Alterações a reverter:**

**Linha ~22:** Remover o import
```typescript
import MaintenanceBanner from "./MaintenanceBanner";
```

**Linhas ~213-219:** Remover o banner do header mobile
```typescript
// REMOVER ESTAS LINHAS:
return (
  <header className="bg-background border-b border-border sticky top-0 z-10 relative">
    {/* Banner de Manutenção - Posicionado absolutamente */}
    <div className="absolute top-0 left-0 right-0 z-50">
      <MaintenanceBanner />
    </div>
    
    <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 md:px-6">

// VOLTAR PARA:
return (
  <header className="bg-background border-b border-border sticky top-0 z-10">
    <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 md:px-6">
```

**Observação:** O `relative` no header e o div wrapper com absolute do banner devem ser removidos.

### 4. Estilos CSS (OPCIONAL - mas recomendado limpar)
**Arquivo:** `src/index.css`

**Linhas 280-370:** Remover todos os estilos relacionados ao banner de manutenção
```css
/* Remover todo o bloco que começa com: */
/* Estilos para o banner de manutenção */

/* E termina em: */
@keyframes maintenance-progress {
  ...
}
```

Especificamente, remover:
- `.maintenance-banner` e animação `maintenance-slide-in`
- `.maintenance-pulse` e animação `maintenance-pulse-wave`
- `.maintenance-icon-bounce` e animação `maintenance-bounce`
- `.maintenance-text-glow` e animação `maintenance-text-pulse`
- `.maintenance-progress-bar` e animação `maintenance-progress`

## Resumo de Ações para Remoção Completa

1. ✅ **Deletar arquivo:** `src/components/MaintenanceBanner.tsx`
2. ✅ **Editar:** `src/components/DesktopHeader.tsx`
   - Remover import do MaintenanceBanner
   - Reverter estrutura do header para o estado original
3. ✅ **Editar:** `src/components/Header.tsx`
   - Remover import do MaintenanceBanner
   - Remover componente do JSX
4. ✅ **Editar (opcional):** `src/index.css`
   - Remover estilos CSS relacionados ao banner (linhas 280-370)

## Verificação

Após realizar as alterações acima, verifique se:
- [ ] Não há erros de compilação
- [ ] O banner não aparece mais em nenhuma página do sistema
- [ ] O header voltou ao tamanho normal (sem espaço extra)
- [ ] Não há estilos CSS órfãos no arquivo index.css

## Como Reativar/Alterar a Data e Hora da Manutenção

### O Banner Some Automaticamente?

✅ **SIM!** O banner desaparece automaticamente quando o tempo expira e **não volta mais**.

### Como Fazer o Banner Voltar com Nova Data/Hora

Para reativar o banner ou alterar a data/hora da manutenção:

**Arquivo:** `src/components/MaintenanceBanner.tsx`

**Linhas 12-16:** Alterar a configuração da manutenção

```typescript
// *** CONFIGURAÇÃO DA MANUTENÇÃO ***
// Altere aqui a data e hora da manutenção programada
const maintenanceDate = new Date();
maintenanceDate.setFullYear(2025, 10, 25); // Ano, Mês (0-11, onde 10=Novembro), Dia
maintenanceDate.setHours(12, 15, 0, 0);    // Hora, Minuto, Segundo, Milissegundo
```

### Exemplos de Configuração:

**Exemplo 1:** Manutenção para 28 de Novembro de 2025 às 14:30
```typescript
maintenanceDate.setFullYear(2025, 10, 28); // 10 = Novembro (mês 0-11)
maintenanceDate.setHours(14, 30, 0, 0);    // 14:30:00
```

**Exemplo 2:** Manutenção para 1º de Dezembro de 2025 às 08:00
```typescript
maintenanceDate.setFullYear(2025, 11, 1);  // 11 = Dezembro (mês 0-11)
maintenanceDate.setHours(8, 0, 0, 0);      // 08:00:00
```

**Exemplo 3:** Manutenção para 15 de Janeiro de 2026 às 23:45
```typescript
maintenanceDate.setFullYear(2026, 0, 15);  // 0 = Janeiro (mês 0-11)
maintenanceDate.setHours(23, 45, 0, 0);    // 23:45:00
```

### ⚠️ IMPORTANTE: Meses no JavaScript

Os meses são numerados de **0 a 11**:
- 0 = Janeiro
- 1 = Fevereiro
- 2 = Março
- 3 = Abril
- 4 = Maio
- 5 = Junho
- 6 = Julho
- 7 = Agosto
- 8 = Setembro
- 9 = Outubro
- 10 = Novembro
- 11 = Dezembro

### Formato da Função setHours

```typescript
maintenanceDate.setHours(Hora, Minuto, Segundo, Milissegundo);
```

- **Hora:** 0-23 (formato 24 horas)
- **Minuto:** 0-59
- **Segundo:** 0-59 (geralmente deixar 0)
- **Milissegundo:** 0-999 (geralmente deixar 0)

### Como Alterar a Mensagem Exibida

**Linha 52:** Alterar o texto da manutenção
```typescript
<span className="font-semibold">⚠️ MANUTENÇÃO PROGRAMADA às 12:15</span>
```

**Linha 57:** Alterar a duração e descrição
```typescript
<span className="text-[10px]">Duração: ~38h | Sistema poderá ficar instável</span>
```

## Notas Importantes

- O banner foi implementado **APENAS** dentro das páginas autenticadas do sistema (dashboard)
- Páginas públicas (Landing, Login, Contato, etc.) **NÃO** foram modificadas
- Nenhum outro componente ou funcionalidade do sistema foi afetado
- A remoção é totalmente segura e não afetará outras funcionalidades
- **O banner desaparece automaticamente** quando a data/hora programada é atingida
- Para reativar, basta alterar a data no arquivo conforme instruções acima

---

**Data de criação deste documento:** 25/10/2025  
**Última atualização:** 25/10/2025  
**Versão do banner:** 1.2 (Banner com expiração automática e configuração simplificada)

