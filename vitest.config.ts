import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Ambiente di test
    environment: 'jsdom',
    
    // Setup files
    setupFiles: ['./src/test/setup.ts'],
    
    // Glob patterns per i file di test
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    
    // Esclude node_modules e build
    exclude: [
      'node_modules',
      'dist',
      '.next',
      '.nuxt',
      '.vercel',
      '.turbo'
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/dist/**',
        '**/.{idea,git,cache,output,temp}/**'
      ],
      // Soglie di coverage
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        },
        // Soglie più alte per utility functions critiche
        'src/utils/moodEnhancements.ts': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        },
        'src/utils/taskSuggestions.ts': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      }
    },
    
    // Timeout per i test
    testTimeout: 10000,
    
    // Reporter
    reporter: ['verbose', 'json', 'html'],
    
    // Globals (per evitare import di describe, it, expect)
    globals: true,
    
    // Mock configuration
    deps: {
      inline: ['@testing-library/jest-dom']
    }
  },
  
  // Resolve aliases (stesso di vite.config.ts)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/styles': path.resolve(__dirname, './src/styles')
    }
  },
  
  // Define per environment variables nei test
  define: {
    'process.env.NODE_ENV': '"test"'
  }
});