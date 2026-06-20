import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) return 'vendor';
          if (id.includes('@tanstack/react-query')) return 'query';
          if (id.includes('framer-motion')) return 'motion';
          if (id.includes('recharts')) return 'charts';
          if (id.includes('@dnd-kit')) return 'dnd';
          if (id.includes('zustand')) return 'store';
        },
      },
    },
  },
});
