/*
 * Path: C:/Users/HVC/WebstormProjects/elom-frontend/vite.config.ts
 * File: vite.config.ts
 * Project: elom-frontend
 *
 */
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig({
    plugins: [tailwindcss(), vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    server: { port: 5173, host: true },
});
