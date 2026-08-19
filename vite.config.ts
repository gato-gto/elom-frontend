/*
 * Path: C:/Users/HVC/WebstormProjects/elom-frontend/vite.config.ts
 * File: vite.config.ts
 * Project: elom-frontend
 *
 */

import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {VitePWA} from 'vite-plugin-pwa'

import {fileURLToPath, URL} from 'node:url'

export default defineConfig({
    plugins: [
        vue(),
        VitePWA({
            // 'prompt': не обновляемся молча — показываем пользователю кнопку «Обновить»
            registerType: 'prompt',
            includeAssets: [
                'favicon.svg', 'favicon-16x16.svg', 'favicon-32x32.svg', 'apple-touch-icon.svg',
            ],
            manifest: {
                name: 'ELOM — Учёт материалов',
                short_name: 'ELOM',
                description: 'Система учёта материалов и закупок для строительных объектов',
                start_url: '/',
                display: 'standalone',
                // A-09 (F-521): разрешаем ландшафт (бриф требует его поддержки; на объекте телефон
                // держат боком). Раньше portrait-primary блокировал ротацию в standalone.
                orientation: 'any',
                background_color: '#F4F7F8', // graphite-50 (светлый фон приложения)
                theme_color: '#B0500F',      // copper-600 — фирменный акцент
                lang: 'ru',
                categories: ['business', 'productivity'],
                icons: [
                    // APPLE-2 (F-514): PNG-иконки первыми — iOS/часть Android плохо берут SVG-maskable.
                    // Квадратные без прозрачности → корректно работают как purpose 'any' и 'maskable'.
                    {src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any'},
                    {src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any'},
                    {src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable'},
                    {src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable'},
                    {src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml'},
                ],
            },
            workbox: {
                // App-shell: прекэшируем сборку (cache-first по хэшу — файлы неизменяемы)
                globPatterns: ['**/*.{js,css,html,svg,woff2,woff,ttf,ico,png}'],
                // F-1027: splash-PNG (84 шт, ~1 МБ) iOS берёт сам при установке на экран «Домой» —
                // в precache SW им не место (каждый клиент качал бы весь набор при каждом обновлении).
                globIgnores: ['**/splash/**'],
                // Офлайн-загрузка SPA: навигации отдаём закэшированный index.html …
                navigateFallback: '/index.html',
                // … но НЕ для API — бизнес-данные никогда не подменяем оболочкой
                navigateFallbackDenylist: [/^\/api\//],
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                runtimeCaching: [
                    {
                        // БИЗНЕС-ДАННЫЕ (балансы, закупки, списания) — ТОЛЬКО сеть.
                        // Никогда не кэшируем и не отдаём устаревшее как актуальное:
                        // офлайн эти запросы падают → приложение показывает баннер.
                        urlPattern: ({url}) => url.pathname.startsWith('/api/'),
                        handler: 'NetworkOnly',
                    },
                ],
            },
            devOptions: {enabled: false},
        }),
    ],
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
        cssMinify: true,
        // Подавляем предупреждения CSS для @property (используется в daisyUI)
        cssCodeSplit: true
    },
    css: {
        // Предупреждение о @property из daisyUI можно игнорировать - это валидное CSS правило
        // которое поддерживается современными браузерами (Chrome 85+, Firefox 75+, Safari 14+)
        devSourcemap: true
    },
    esbuild: {
        target: 'es2020'
    }
})
