# 🚀 Guia de Configuração de Pagamentos - Paulo Cell

## 📋 Visão Geral

Este sistema agora suporta múltiplos métodos de pagamento:
- 💵 Dinheiro
- 💳 Cartão de Crédito (via Maquininha PagBank)
- 💳 Cartão de Débito (via Maquininha PagBank)
- 📱 PIX com QR Code

---

## 🔧 Configuração Inicial

### 1️⃣ Configurar Chave PIX

Para receber pagamentos via PIX, você precisa configurar sua chave PIX no banco de dados:

```sql
-- Conecte-se ao Supabase e execute:
UPDATE organizations 
SET 
  pix_key = 'suachavepix@exemplo.com',  -- Sua chave PIX real
  pix_key_type = 'email',                -- Tipo: 'cpf', 'cnpj', 'email', 'phone', 'random'
  merchant_name = 'PAULO CELL',          -- Nome da sua empresa
  merchant_city = 'VITORIA'              -- Cidade
WHERE id = 'SEU_ORGANIZATION_ID';
```

**Tipos de Chave PIX suportados:**
- `cpf` - CPF (11 dígitos)
- `cnpj` - CNPJ (14 dígitos)
- `email` - E-mail
- `phone` - Telefone (+5527999999999)
- `random` - Chave aleatória (UUID)

### 2️⃣ Configurar Maquininha PagBank (Opcional)

Para usar a maquininha ModerninhaPro2 do PagBank:

1. **Obter credenciais do PagBank:**
   - Acesse: https://pagseguro.uol.com.br
   - Crie uma conta de vendedor
   - Acesse "Integrações" > "Chaves de API"
   - Copie sua API Key

2. **Configurar no sistema:**
```sql
UPDATE organizations 
SET 
  pagbank_api_key = 'SUA_API_KEY_PAGBANK'
WHERE id = 'SEU_ORGANIZATION_ID';
```

3. **Parear a maquininha:**
   - Ligue a maquininha ModerninhaPro2
   - No celular/computador, ative o Bluetooth
   - A integração será feita automaticamente pelo app do PagBank

---

## 📱 Como Usar

### Pagamento em Dinheiro

1. Adicione produtos ao carrinho
2. Clique em "Finalizar Venda"
3. Selecione "💵 Dinheiro"
4. Informe o valor recebido
5. O sistema calcula o troco automaticamente
6. Confirme a venda

### Pagamento via PIX

1. Adicione produtos ao carrinho
2. Clique em "Finalizar Venda"
3. Selecione "📱 PIX"
4. Clique em "Gerar QR Code PIX"
5. O cliente escaneia o QR Code ou copia o código
6. Após o pagamento, clique em "Confirmar Pagamento"

### Pagamento via Cartão (Maquininha)

1. Adicione produtos ao carrinho
2. Clique em "Finalizar Venda"
3. Selecione "💳 Cartão de Crédito" ou "💳 Cartão de Débito"
4. Escolha o número de parcelas (apenas crédito)
5. Clique em "Processar com Maquininha PagBank"
6. Insira ou aproxime o cartão na maquininha
7. Aguarde a confirmação
8. Confirme a venda no sistema

---

## 🔐 Segurança

### Chave PIX
- ✅ Armazenada de forma segura no banco de dados
- ✅ Criptografada em trânsito
- ✅ Apenas usuários autorizados podem configurar

### API do PagBank
- ✅ Chave API armazenada de forma segura
- ✅ Comunicação HTTPS
- ✅ Tokens de acesso com expiração

---

## 🛠️ Tecnologias Utilizadas

### PIX
- **Padrão EMV**: Formato oficial do Banco Central
- **QR Code**: Biblioteca `qrcode` para geração
- **Validação**: CRC16-CCITT para integridade

### PagBank
- **API REST**: Comunicação com servidores do PagSeguro
- **Bluetooth**: Pareamento com maquininha ModerninhaPro2
- **Webhook**: Notificações de status em tempo real (a implementar)

---

## 📊 Funcionalidades Implementadas

✅ Geração de QR Code PIX dinâmico  
✅ Copia e cola do código PIX  
✅ Integração básica com PagBank  
✅ Suporte a múltiplas formas de pagamento  
✅ Cálculo automático de parcelas  
✅ Histórico de transações  
✅ Impressão de comprovante  

---

## 🚧 Próximos Passos

### Melhorias Futuras

1. **Webhook PIX**
   - Confirmação automática de pagamento
   - Notificações em tempo real

2. **SDK PagBank**
   - Integração oficial via SDK
   - Suporte a todas as funcionalidades da maquininha

3. **Relatórios de Pagamento**
   - Dashboard de vendas por método de pagamento
   - Análise de taxas e custos

4. **Conciliação Bancária**
   - Importação de extratos
   - Comparação automática

---

## 🆘 Suporte

### Problemas Comuns

**1. QR Code não é gerado**
- Verifique se a chave PIX está configurada
- Confirme que o tipo da chave está correto
- Veja os logs do console para erros

**2. Maquininha não conecta**
- Certifique-se que o Bluetooth está ativado
- Verifique se a maquininha está carregada
- Confirme a API Key do PagBank

**3. Pagamento não é confirmado**
- Verifique a conexão com internet
- Confirme os dados do pagamento
- Entre em contato com o suporte do PagBank

### Contatos

- **Desenvolvedor**: Paulo Cell Sistema
- **Suporte Técnico**: Através do sistema
- **PagBank**: 0800 721 8000

---

## 📄 Licença

Sistema proprietário - Paulo Cell © 2025

---

**Última atualização**: Outubro 2025  
**Versão**: 2.0

