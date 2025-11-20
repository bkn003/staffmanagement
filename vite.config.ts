import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          pdf: ['jspdf', 'jspdf-autotable'],
          excel: ['xlsx'],
          supabase: ['@supabase/supabase-js'],
          icons: ['lucide-react'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  }
});
