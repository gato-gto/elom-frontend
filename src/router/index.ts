// src/router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const routes: RouteRecordRaw[] = [
    {
        path: '/login',
        name: 'login',
        component: () => import('@/pages/Login.vue'),
        meta: { guestOnly: true, title: 'Вход' },
    },
    {
        path: '/',
        component: () => import('@/layouts/AppLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            { path: '', redirect: '/dashboard' },
            { path: 'dashboard', name: 'dashboard', component: () => import('@/pages/Dashboard.vue'), meta: { title: 'Дашборд' } },
            { path: 'materials', name: 'materials', component: () => import('@/pages/Materials/List.vue'), meta: { title: 'Материалы' } },
            { path: 'purchases', name: 'purchases', component: () => import('@/pages/Purchases/List.vue'), meta: { title: 'Закупки' } },
            { path: 'purchases/new', name: 'purchases.new', component: () => import('@/pages/Purchases/PurchaseForm.vue'), meta: { title: 'Новая закупка' } },
            { path: 'purchases/:id', name: 'purchases.edit', component: () => import('@/pages/Purchases/PurchaseForm.vue'), meta: { title: 'Редактировать закупку' } },

            // зарезервировано:
            // { path: 'import', name: 'import', component: () => import('@/pages/Import/ImportPurchases.vue'), meta: { title: 'Импорт' } },
            // { path: 'stocks', name: 'stocks', component: () => import('@/pages/Stocks/List.vue'), meta: { title: 'Остатки' } },
            // { path: 'archive', name: 'archive', component: () => import('@/pages/Archive/List.vue'), meta: { title: 'Архив' } },
            // { path: 'reports', name: 'reports', component: () => import('@/pages/Reports/Index.vue'), meta: { title: 'Отчёты' } },
        ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach(async (to, from, next) => {
    const ui = useUiStore()
    const auth = useAuthStore()

    // старт прогресса
    ui.start()

    // гидратация me при первом заходе
    if (!auth.me && auth.isAuthenticated) {
        try { await auth.tryHydrate() } catch {}
    }

    if (to.meta?.guestOnly && auth.isAuthenticated) {
        next((to.query.redirect as string) || '/')
        return
    }
    if (to.meta?.requiresAuth && !auth.isAuthenticated) {
        next({ path: '/login', query: { redirect: to.fullPath } })
        return
    }
    next()
})

router.afterEach(() => {
    const ui = useUiStore()
    ui.done()
})

export default router
