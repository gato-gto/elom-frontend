import {createRouter, createWebHistory, type RouteRecordRaw} from 'vue-router'
import {useAuthStore} from '@/stores/auth'
import {useUiStore} from '@/stores/ui'

const routes: RouteRecordRaw[] = [
    {
        path: '/login',
        name: 'login',
        component: () => import('@/pages/Login.vue'),
        meta: {guestOnly: true, title: 'Вход'},
    },
    {
        path: '/',
        component: () => import('@/layouts/AppLayout.vue'),
        meta: {requiresAuth: true},
        children: [
            {path: '', redirect: '/dashboard'},
            {path: 'dashboard', name: 'dashboard', component: () => import('@/pages/Dashboard.vue'), meta: {title: 'Дашборд'}},
            {path: 'materials', name: 'materials', component: () => import('@/pages/Materials/List.vue'), meta: {title: 'Материалы'}},
            {path: 'units', name: 'units', component: () => import('@/pages/Units/List.vue'), meta: {title: 'Единицы'}},
            {path: 'objects', name: 'objects', component: () => import('@/pages/Objects/List.vue'), meta: {title: 'Объекты'}},
            {path: 'purchases', name: 'purchases', component: () => import('@/pages/Purchases/List.vue'), meta: {title: 'Закупки'}},
            {path: 'purchases/new', name: 'purchases.new', component: () => import('@/pages/Purchases/PurchaseForm.vue'), meta: {title: 'Новая закупка'}},
            {path: 'purchases/:id', name: 'purchases.edit', component: () => import('@/pages/Purchases/PurchaseForm.vue'), meta: {title: 'Редактировать закупку'}},
            {path: 'employees', name: 'employees', component: () => import('@/pages/Employees/List.vue'), meta: {title: 'Сотрудники'}},
            {path: 'stock', name: 'stock', component: () => import('@/pages/Stocks/List.vue'), meta: {title: 'Остатки'}},
            {path: 'archive', name: 'archive', component: () => import('@/pages/Archive/List.vue'), meta: {title: 'Архив периодов'}},

            {
                path: 'reports',
                component: () => import('@/pages/Reports/Index.vue'),
                meta: {title: 'Отчёты'},
                children: [
                    {path: '', redirect: {name: 'reports.period'}},
                    {path: 'period', name: 'reports.period', component: () => import('@/pages/Reports/ByPeriod.vue'), meta: {title: 'Отчёты — По периодам'}},
                    {path: 'object', name: 'reports.object', component: () => import('@/pages/Reports/ByObject.vue'), meta: {title: 'Отчёты — По объектам'}},
                    {path: 'responsible', name: 'reports.responsible', component: () => import('@/pages/Reports/ByResponsible.vue'), meta: {title: 'Отчёты — По ответственным'}},
                    {path: 'material', name: 'reports.material', component: () => import('@/pages/Reports/ByMaterial.vue'), meta: {title: 'Отчёты — По материалам'}},
                ],
            },
        ],
    },
    {path: '/:pathMatch(.*)*', redirect: '/dashboard'},
]

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior: () => ({left: 0, top: 0}),
})

router.beforeEach(async (to) => {
    const ui = useUiStore()
    ui.start()
    document.title = `ELOM — ${to.meta.title ?? ''}`

    const auth = useAuthStore()
    const isAuthed = auth.isAuthenticated
    if (to.meta.requiresAuth && !isAuthed) return {name: 'login', query: {redirect: to.fullPath}}
    if (to.meta.guestOnly && isAuthed) return {path: '/dashboard'}
})

router.afterEach(() => useUiStore().done())
export default router
