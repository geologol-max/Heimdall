import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    optimizeDeps: {
      esbuildOptions: {
        target: 'es2022',
      },
    },
    esbuild: {
      target: 'es2022',
    },
    build: {
      target: 'es2022',
      // Incrementar el límite de advertencia para chunks grandes
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          // Separar dependencias de terceros en chunks cacheables
          manualChunks: {
            // React core — se cachea por separado
            'vendor-react': ['react', 'react-dom'],
            // Animaciones — Framer Motion es grande, se carga solo si se necesita
            'vendor-motion': ['motion'],
            // Iconos — Lucide-react cargado aparte
            'vendor-icons': ['lucide-react'],
          },
        },
      },
    },
  };
});
