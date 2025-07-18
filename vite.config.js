import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)), // 🟡 이거 중요!
    },
  },
  preview: {
    port: 4173,
    host: true,
    allowedHosts: ['arc.baeksung.kr'], // ✅ 여기에 추가
  }, 
});
