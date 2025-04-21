/**
 * Script para reverter as configurações de autenticação do Supabase para o estado anterior
 * 
 * Este script deve ser executado para reverter as alterações feitas nos templates de e-mail
 * do Supabase. Ele remove o arquivo de configuração personalizado, restaurando o comportamento
 * padrão do Supabase.
 * 
 * Para usar: 
 * 1. Execute este script com Node.js: node DesfazerAutParaoestadoanterior.js
 * 2. Faça deploy das alterações para o Supabase
 */

const fs = require('fs');
const path = require('path');

console.log('Iniciando o processo de reversão para as configurações anteriores...');

try {
  // Verifica se o arquivo de configuração existe
  const configPath = path.join(__dirname, 'supabase', 'config.toml');
  
  if (fs.existsSync(configPath)) {
    // Remove o arquivo de configuração ou renomeia para backup
    fs.renameSync(configPath, path.join(__dirname, 'supabase', 'config.toml.bak'));
    console.log('Arquivo de configuração renomeado para config.toml.bak');
  } else {
    console.log('Arquivo de configuração não encontrado. Nada a reverter.');
  }
  
  console.log('\nReversão concluída com sucesso!');
  console.log('Para aplicar as alterações, faça deploy novamente para o Supabase.');
  
} catch (error) {
  console.error('Erro ao reverter configurações:', error);
  console.log('Por favor, remova manualmente o arquivo supabase/config.toml se necessário.');
} 