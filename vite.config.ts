/*
 * Path: C:/Users/HVC/WebstormProjects/elom-frontend/vite.config.ts
 * File: vite.config.ts
 * Project: elom-frontend
 *
 */

import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'

import {fileURLToPath, URL} from 'node:url'

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    server: {port: 5173, host: true},
    build: {
        target: ['es2020', 'chrome90', 'firefox88', 'safari14', 'edge90'],
        cssTarget: ['chrome90', 'firefox88', 'safari14', 'edge90'],
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['vue', 'vue-router', 'pinia'],
                    charts: ['chart.js', 'vue-chartjs'],
                    utils: ['axios']
                }
            }
        },
        // Минификация с учетом Safari
        minify: 'esbuild',
        cssMinify: true
    },
    esbuild: {
        target: 'es2020'
    }
})
