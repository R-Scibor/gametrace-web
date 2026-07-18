/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const BACKEND = process.env.VITE_BACKEND_ORIGIN ?? 'http://homelab:8010';
const WEB_STATIC = process.env.VITE_WEB_STATIC_ORIGIN ?? 'http://localhost:8020';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts')) return 'recharts';
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': { target: BACKEND, changeOrigin: true },
      '/covers': { target: BACKEND, changeOrigin: true },
      // Exact APK only — must not steal SPA route `/download`
      '/download/gametrace.apk': { target: WEB_STATIC, changeOrigin: true },

    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    css: true,
    // Discord invites used by WelcomeOnboarding / LandingPage
    env: {
      VITE_DISCORD_SERVER_INVITE_URL: 'https://discord.gg/test-invite',
      VITE_DISCORD_BOT_INVITE_URL:
        'https://discord.com/oauth2/authorize?client_id=test&permissions=2048&integration_type=0&scope=bot+applications.commands',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/main.tsx'],
      thresholds: {
        lines: 70,
      },
    },
  },
});