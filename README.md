# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/d96b3d3b-e2df-4557-bb63-e4b171db47b7

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/d96b3d3b-e2df-4557-bb63-e4b171db47b7) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/d96b3d3b-e2df-4557-bb63-e4b171db47b7) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes it is!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Deployment na Vercel

### Pré-requisitos
- Conta na Vercel (você pode criar uma em [vercel.com](https://vercel.com))
- Projeto configurado no GitHub, GitLab ou Bitbucket

### Passos para deploy

1. **Faça login na Vercel**
   - Acesse [vercel.com](https://vercel.com) e faça login com sua conta
   - Você pode usar sua conta do GitHub, GitLab ou Bitbucket para login

2. **Crie um novo projeto**
   - Na dashboard, clique em "Add New" e depois em "Project"
   - Selecione o repositório que contém este projeto

3. **Configure o projeto**
   - **Framework Preset**: Selecione "Vite"
   - **Root Directory**: Deixe como está (raiz do projeto)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Configure as variáveis de ambiente**
   - Na seção "Environment Variables", adicione:
     - `VITE_SUPABASE_URL`: URL do seu projeto Supabase
     - `VITE_SUPABASE_ANON_KEY`: Chave anônima do Supabase

5. **Deploy**
   - Clique em "Deploy" e aguarde a conclusão do processo
   - A Vercel irá construir e implantar automaticamente seu aplicativo

### Atualizações

Para atualizar seu aplicativo após mudanças no código:
- Faça commit e push para o seu repositório
- A Vercel detectará automaticamente as mudanças e fará um novo deploy

### Alternativa: Deploy pela CLI

Você também pode fazer o deploy usando a Vercel CLI:

```bash
# Instalar a CLI
npm i -g vercel

# Login na sua conta
vercel login

# Deploy (na raiz do projeto)
vercel

# Para ambiente de produção
vercel --prod
```

### Monitoramento

Após o deploy, você pode monitorar:
- **Logs**: No dashboard do projeto, acesse a aba "Logs"
- **Analytics**: No dashboard do projeto, acesse a aba "Analytics"
- **Status**: No dashboard do projeto, veja o status geral do deploy

Lembre-se que o plano gratuito da Vercel tem algumas limitações, mas é suficiente para este projeto com poucos usuários.
