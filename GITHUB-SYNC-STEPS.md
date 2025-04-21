# Guia de Sincronização com GitHub

Este guia descreve os passos necessários para sincronizar as atualizações do sistema de autenticação com o repositório GitHub.

## Pré-requisitos

- Git instalado em seu computador
- Acesso ao repositório GitHub [Paulo-Cell-Es-Versel](https://github.com/Nomade-PJ/Paulo-Cell-Es-Versel)
- Permissões para fazer commit e push no repositório

## Passos para Sincronização

### 1. Clone o Repositório (Se ainda não tiver feito)

```bash
# Clone o repositório
git clone https://github.com/Nomade-PJ/Paulo-Cell-Es-Versel.git

# Entre na pasta do projeto
cd Paulo-Cell-Es-Versel
```

### 2. Verificar Alterações Atuais

```bash
# Verifique o status das alterações
git status
```

### 3. Adicionar Novos Arquivos

```bash
# Adicione os novos arquivos de autenticação
git add src/pages/auth/PasswordReset.tsx
git add src/pages/auth/ConfirmRegistration.tsx
git add src/pages/auth/MagicLink.tsx

# Adicione os arquivos de configuração do Supabase (exceto a pasta migrations)
git add supabase/config.toml
git add supabase/backup-config.json

# Adicione o script de reversão
git add DesfazerAutParaoestadoanterior.js

# Adicione os arquivos modificados
git add src/App.tsx
git add src/contexts/AuthContext.tsx
git add src/pages/Login.tsx

# Adicione a documentação
git add DOCUMENTATION.md
git add GITHUB-SYNC-STEPS.md
```

### 4. Fazer o Commit das Alterações

```bash
# Commit com mensagem descritiva
git commit -m "Implementação de sistema de autenticação aprimorado com páginas dedicadas para redefinição de senha, confirmação de cadastro e login com link mágico"
```

### 5. Enviar para o GitHub

```bash
# Push para o branch principal
git push origin main
```

### 6. Verificar no GitHub

1. Acesse [https://github.com/Nomade-PJ/Paulo-Cell-Es-Versel](https://github.com/Nomade-PJ/Paulo-Cell-Es-Versel)
2. Verifique se todas as alterações foram enviadas corretamente
3. Confirme que os novos arquivos estão presentes no repositório

## Resolução de Problemas Comuns

### Conflitos de Merge

Se houver conflitos durante o push:

```bash
# Puxe as alterações mais recentes
git pull origin main

# Resolva os conflitos manualmente
# Abra os arquivos com conflitos, edite-os e salve

# Adicione os arquivos resolvidos
git add .

# Complete o merge
git commit -m "Resolução de conflitos de merge"

# Faça o push novamente
git push origin main
```

### Ignorar Arquivos

Se precisar ignorar arquivos específicos:

```bash
# Edite o arquivo .gitignore
echo "supabase/migrations/" >> .gitignore
git add .gitignore
git commit -m "Atualizado .gitignore para excluir pasta migrations"
git push origin main
```

### Desfazer Commits Locais (Se Necessário)

```bash
# Desfazer o último commit (mantendo as alterações)
git reset --soft HEAD~1

# Desfazer o último commit (descartando as alterações)
git reset --hard HEAD~1
```

## Próximos Passos Sugeridos

1. **Verificar Deploy Automático**: Se o repositório estiver configurado com CI/CD na Vercel, verifique se o deploy foi realizado automaticamente após o push.

2. **Testar as Funcionalidades**: Após o deploy, teste todas as funcionalidades de autenticação para garantir que estão funcionando corretamente no ambiente de produção.

3. **Atualizar Documentação**: Se necessário, atualize a documentação com base nos resultados do deploy e testes.

4. **Comunicar Alterações**: Informe a equipe sobre as novas funcionalidades implementadas. 