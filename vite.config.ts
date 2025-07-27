import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Configuração para resolver o problema de build na Vercel
  build: {
    rollupOptions: {
      // Tratar os pacotes da Vercel como externos para evitar problemas de build
      external: ['@vercel/analytics', '@vercel/speed-insights']
    }
  }
}));
