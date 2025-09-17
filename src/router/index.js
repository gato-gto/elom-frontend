import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
// Lazy load components
const Login = () => import('@/pages/Login.vue');
const Dashboard = () => import('@/pages/Dashboard.vue');
// Materials
const MaterialsList = () => import('@/pages/Materials/List.vue');
const MaterialForm = () => import('@/pages/Materials/MaterialForm.vue');
// Purchases
const PurchasesList = () => import('@/pages/Purchases/List.vue');
const PurchaseForm = () => import('@/pages/Purchases/PurchaseForm.vue');
// Objects
const ObjectsList = () => import('@/pages/Objects/List.vue');
const ObjectForm = () => import('@/pages/Objects/ObjectForm.vue');
// Units
const UnitsList = () => import('@/pages/Units/List.vue');
const UnitForm = () => import('@/pages/Units/UnitForm.vue');
// Employees
const EmployeesList = () => import('@/pages/Employees/List.vue');
const EmployeeForm = () => import('@/pages/Employees/EmployeeForm.vue');
// Stocks
const StocksList = () => import('@/pages/Stocks/List.vue');
// Archive
const ArchiveList = () => import('@/pages/Archive/List.vue');
// Reports
const ReportsIndex = () => import('@/pages/Reports/Index.vue');
const ReportByPeriod = () => import('@/pages/Reports/ByPeriod.vue');
const ReportByObject = () => import('@/pages/Reports/ByObject.vue');
const ReportByMaterial = () => import('@/pages/Reports/ByMaterial.vue');
const ReportByResponsible = () => import('@/pages/Reports/ByResponsible.vue');
// Import
const ImportPurchases = () => import('@/pages/Import/ImportPurchases.vue');
const routes = [
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: {
            public: true,
            title: 'Вход в систему'
        }
    },
    {
        path: '/',
        name: 'Dashboard',
        component: Dashboard,
        meta: {
            title: 'Панель управления',
            icon: 'dashboard'
        }
    },
    // Materials routes
    {
        path: '/materials',
        name: 'MaterialsList',
        component: MaterialsList,
        meta: {
            title: 'Материалы',
            icon: 'inventory',
            breadcrumb: 'Материалы'
        }
    },
    {
        path: '/materials/create',
        name: 'MaterialCreate',
        component: MaterialForm,
        meta: {
            title: 'Новый материал',
            breadcrumb: 'Материалы / Новый'
        }
    },
    {
        path: '/materials/:id/edit',
        name: 'MaterialEdit',
        component: MaterialForm,
        meta: {
            title: 'Редактировать материал',
            breadcrumb: 'Материалы / Редактировать'
        }
    },
    // Purchases routes
    {
        path: '/purchases',
        name: 'PurchasesList',
        component: PurchasesList,
        meta: {
            title: 'Закупки',
            icon: 'shopping_cart',
            breadcrumb: 'Закупки'
        }
    },
    {
        path: '/purchases/create',
        name: 'PurchaseCreate',
        component: PurchaseForm,
        meta: {
            title: 'Новая закупка',
            breadcrumb: 'Закупки / Новая'
        }
    },
    {
        path: '/purchases/:id/edit',
        name: 'PurchaseEdit',
        component: PurchaseForm,
        meta: {
            title: 'Редактировать закупку',
            breadcrumb: 'Закупки / Редактировать'
        }
    },
    // Objects routes
    {
        path: '/objects',
        name: 'ObjectsList',
        component: ObjectsList,
        meta: {
            title: 'Объекты',
            icon: 'location_on',
            breadcrumb: 'Объекты'
        }
    },
    {
        path: '/objects/create',
        name: 'ObjectCreate',
        component: ObjectForm,
        meta: {
            title: 'Новый объект',
            breadcrumb: 'Объекты / Новый'
        }
    },
    {
        path: '/objects/:id/edit',
        name: 'ObjectEdit',
        component: ObjectForm,
        meta: {
            title: 'Редактировать объект',
            breadcrumb: 'Объекты / Редактировать'
        }
    },
    // Units routes
    {
        path: '/units',
        name: 'UnitsList',
        component: UnitsList,
        meta: {
            title: 'Единицы измерения',
            icon: 'straighten',
            breadcrumb: 'Единицы измерения'
        }
    },
    {
        path: '/units/create',
        name: 'UnitCreate',
        component: UnitForm,
        meta: {
            title: 'Новая единица',
            breadcrumb: 'Единицы / Новая'
        }
    },
    {
        path: '/units/:id/edit',
        name: 'UnitEdit',
        component: UnitForm,
        meta: {
            title: 'Редактировать единицу',
            breadcrumb: 'Единицы / Редактировать'
        }
    },
    // Employees routes
    {
        path: '/employees',
        name: 'EmployeesList',
        component: EmployeesList,
        meta: {
            title: 'Сотрудники',
            icon: 'people',
            breadcrumb: 'Сотрудники'
        }
    },
    {
        path: '/employees/create',
        name: 'EmployeeCreate',
        component: EmployeeForm,
        meta: {
            title: 'Новый сотрудник',
            breadcrumb: 'Сотрудники / Новый'
        }
    },
    {
        path: '/employees/:id/edit',
        name: 'EmployeeEdit',
        component: EmployeeForm,
        meta: {
            title: 'Редактировать сотрудника',
            breadcrumb: 'Сотрудники / Редактировать'
        }
    },
    // Stocks routes
    {
        path: '/stocks',
        name: 'StocksList',
        component: StocksList,
        meta: {
            title: 'Остатки',
            icon: 'warehouse',
            breadcrumb: 'Остатки'
        }
    },
    // Archive routes
    {
        path: '/archive',
        name: 'ArchiveList',
        component: ArchiveList,
        meta: {
            title: 'Архив',
            icon: 'archive',
            breadcrumb: 'Архив'
        }
    },
    // Reports routes
    {
        path: '/reports',
        name: 'ReportsIndex',
        component: ReportsIndex,
        meta: {
            title: 'Отчеты',
            icon: 'assessment',
            breadcrumb: 'Отчеты'
        }
    },
    {
        path: '/reports/by-period',
        name: 'ReportByPeriod',
        component: ReportByPeriod,
        meta: {
            title: 'Отчет по периодам',
            breadcrumb: 'Отчеты / По периодам'
        }
    },
    {
        path: '/reports/by-object',
        name: 'ReportByObject',
        component: ReportByObject,
        meta: {
            title: 'Отчет по объектам',
            breadcrumb: 'Отчеты / По объектам'
        }
    },
    {
        path: '/reports/by-material',
        name: 'ReportByMaterial',
        component: ReportByMaterial,
        meta: {
            title: 'Отчет по материалам',
            breadcrumb: 'Отчеты / По материалам'
        }
    },
    {
        path: '/reports/by-responsible',
        name: 'ReportByResponsible',
        component: ReportByResponsible,
        meta: {
            title: 'Отчет по ответственным',
            breadcrumb: 'Отчеты / По ответственным'
        }
    },
    // Import routes
    {
        path: '/import',
        name: 'ImportPurchases',
        component: ImportPurchases,
        meta: {
            title: 'Импорт закупок',
            icon: 'upload',
            breadcrumb: 'Импорт'
        }
    },
    // 404 fallback
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        redirect: '/'
    }
];
const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition;
        }
        else {
            return { top: 0 };
        }
    }
});
// Auth guard
router.beforeEach(async (to, from, next) => {
    const auth = useAuthStore();
    // Public routes (no auth required)
    if (to.meta.public) {
        // If already authenticated, redirect to dashboard
        if (auth.isAuthenticated) {
            next('/');
        }
        else {
            next();
        }
        return;
    }
    // Protected routes
    if (!auth.isAuthenticated) {
        // Try to hydrate from localStorage
        try {
            await auth.tryHydrate();
        }
        catch (error) {
            console.warn('Auth hydration failed:', error);
        }
        // If still not authenticated, redirect to login
        if (!auth.isAuthenticated) {
            const redirect = encodeURIComponent(to.fullPath);
            next(`/login?redirect=${redirect}`);
            return;
        }
    }
    // Check role-based access if needed
    if (to.meta.requiresRole && !hasRequiredRole(auth.role, to.meta.requiresRole)) {
        next('/');
        return;
    }
    next();
});
// Helper function for role-based access
function hasRequiredRole(userRole, requiredRole) {
    if (!userRole)
        return false;
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(userRole);
}
// Set page title
router.afterEach((to) => {
    const title = to.meta.title;
    if (title) {
        document.title = `${title} - ELOM`;
    }
});
export default router;
