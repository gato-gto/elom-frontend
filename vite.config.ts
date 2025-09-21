/*
 * Path: C:/Users/HVC/WebstormProjects/elom-frontend/vite.config.ts
 * File: vite.config.ts
 * Project: elom-frontend
 *
 */

import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

import {fileURLToPath, URL} from 'node:url'

export default defineConfig({
    plugins: [tailwindcss(), vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    server: {port: 5173, host: true},
    build: {
        target: ['es2020', 'chrome80', 'firefox78', 'safari13.1', 'edge80'],
        cssTarget: ['chrome80', 'firefox78', 'safari13.1', 'edge80'],
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['vue', 'vue-router', 'pinia'],
                    charts: ['chart.js', 'vue-chartjs'],
                    utils: ['axios', '@vueuse/core']
                }
            }
        }
    },
    esbuild: {
        target: 'es2020'
    }
})
