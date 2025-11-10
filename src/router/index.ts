import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { UserRole } from '@/api/types/common'
import type { RouteMeta } from '@/types/router'

// Lazy load components with webpack chunk names for better caching
const Login = () => import(/* webpackChunkName: "auth" */ '@/pages/Login.vue')

// Materials
const MaterialsList = () => import(/* webpackChunkName: "materials" */ '@/pages/Materials/List.vue')
const MaterialForm = () => import(/* webpackChunkName: "materials" */ '@/pages/Materials/MaterialForm.vue')

// Material Categories
const MaterialCategoriesList = () => import(/* webpackChunkName: "materials" */ '@/pages/Materials/Categories/List.vue')
const MaterialCategoryForm = () => import(/* webpackChunkName: "materials" */ '@/pages/Materials/Categories/CategoryForm.vue')
const MaterialCategoryInfo = () => import(/* webpackChunkName: "materials" */ '@/pages/Materials/Categories/CategoryInfo.vue')

// Purchases
const PurchasesList = () => import(/* webpackChunkName: "purchases" */ '@/pages/Purchases/List.vue')
const PurchaseForm = () => import(/* webpackChunkName: "purchases" */ '@/pages/Purchases/PurchaseForm.vue')

// Objects
const ObjectsList = () => import(/* webpackChunkName: "objects" */ '@/pages/Objects/List.vue')
const ObjectForm = () => import(/* webpackChunkName: "objects" */ '@/pages/Objects/ObjectForm.vue')

// Units
const UnitsList = () => import(/* webpackChunkName: "units" */ '@/pages/Units/List.vue')
const UnitForm = () => import(/* webpackChunkName: "units" */ '@/pages/Units/UnitForm.vue')

// Employees
const EmployeesList = () => import(/* webpackChunkName: "employees" */ '@/pages/Employees/List.vue')
const EmployeeForm = () => import(/* webpackChunkName: "employees" */ '@/pages/Employees/EmployeeForm.vue')

// Stocks
const StocksList = () => import(/* webpackChunkName: "stocks" */ '@/pages/Stocks/List.vue')
const StockBalances = () => import(/* webpackChunkName: "stocks" */ '@/pages/Stocks/Balances.vue')

// WriteOffs
const WriteOffsList = () => import(/* webpackChunkName: "writeoffs" */ '@/pages/WriteOffs/List.vue')
const WriteOffForm = () => import(/* webpackChunkName: "writeoffs" */ '@/pages/WriteOffs/WriteOffForm.vue')

// Archive
const ArchiveList = () => import(/* webpackChunkName: "archive" */ '@/pages/Archive/ListWorking.vue')

// Reports
const ReportByPeriod = () => import(/* webpackChunkName: "reports" */ '@/pages/Reports/ByPeriod.vue')
const ReportByObject = () => import(/* webpackChunkName: "reports" */ '@/pages/Reports/ByObject.vue')
const ReportByMaterial = () => import(/* webpackChunkName: "reports" */ '@/pages/Reports/ByMaterial.vue')
const ReportByResponsible = () => import(/* webpackChunkName: "reports" */ '@/pages/Reports/ByResponsible.vue')


// Suppliers
const SuppliersList = () => import(/* webpackChunkName: "suppliers" */ '@/pages/Suppliers/List.vue')
const SupplierForm = () => import(/* webpackChunkName: "suppliers" */ '@/pages/Suppliers/SupplierForm.vue')

// Route configuration with enhanced meta
const routes = [
    {
        path: '/login',
    name: 'Login',
    component: Login,
    meta: { 
      public: true,
      auth: false,
      title: 'Вход в систему',
      description: 'Страница входа в систему ELOM',
      category: 'auth'
    }
    },
    {
        path: '/',
    redirect: '/purchases'
  },
  
  // Materials routes
  {
    path: '/materials',
    name: 'MaterialsList',
    component: MaterialsList,
    meta: { 
      title: 'Материалы',
      icon: 'inventory',
      breadcrumb: 'Материалы',
      description: 'Управление материалами и номенклатурой',
      category: 'inventory',
      order: 2,
      roles: ['admin', 'director', 'coordinator', 'site_manager', 'brigadier', 'buyer']
    }
  },
  {
    path: '/materials/create',
    name: 'MaterialCreate',
    component: MaterialForm,
    meta: { 
      title: 'Новый материал',
      breadcrumb: 'Материалы / Новый',
      description: 'Создание нового материала',
      category: 'inventory',
      roles: ['admin', 'director', 'coordinator', 'site_manager']
    }
  },
  {
    path: '/materials/:id/edit',
    name: 'MaterialEdit',
    component: MaterialForm,
    meta: { 
      title: 'Редактировать материал',
      breadcrumb: 'Материалы / Редактировать',
      description: 'Редактирование существующего материала',
      category: 'inventory',
      roles: ['admin', 'director', 'coordinator', 'site_manager']
    }
  },
  
  // Material Categories routes
  {
    path: '/materials/categories',
    name: 'MaterialCategoriesList',
    component: MaterialCategoriesList,
    meta: { 
      title: 'Категории материалов',
      breadcrumb: 'Материалы / Категории',
      description: 'Управление категориями материалов',
      category: 'inventory',
      roles: ['admin', 'director', 'coordinator', 'site_manager']
    }
  },
  {
    path: '/materials/categories/create',
    name: 'MaterialCategoryCreate',
    component: MaterialCategoryForm,
    meta: { 
      title: 'Новая категория',
      breadcrumb: 'Материалы / Категории / Новая',
      description: 'Создание новой категории материалов',
      category: 'inventory',
      roles: ['admin', 'director', 'coordinator', 'site_manager']
    }
  },
  {
    path: '/materials/categories/:id',
    name: 'MaterialCategoryInfo',
    component: MaterialCategoryInfo,
    meta: { 
      title: 'Информация о категории',
      breadcrumb: 'Материалы / Категории / Просмотр',
      description: 'Просмотр информации о категории материалов',
      category: 'inventory',
      roles: ['admin', 'director', 'coordinator', 'site_manager']
    }
  },
  {
    path: '/materials/categories/:id/edit',
    name: 'MaterialCategoryEdit',
    component: MaterialCategoryForm,
    meta: { 
      title: 'Редактировать категорию',
      breadcrumb: 'Материалы / Категории / Редактировать',
      description: 'Редактирование категории материалов',
      category: 'inventory',
      roles: ['admin', 'director', 'coordinator', 'site_manager']
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
      breadcrumb: 'Закупки',
      description: 'Управление закупками и поставками',
      category: 'purchases',
      order: 3,
      roles: ['admin', 'director', 'coordinator', 'site_manager', 'brigadier', 'buyer']
    }
  },
  {
    path: '/purchases/create',
    name: 'PurchaseCreate',
    component: PurchaseForm,
    meta: { 
      title: 'Новая закупка',
      breadcrumb: 'Закупки / Новая',
      description: 'Создание новой закупки',
      category: 'purchases',
      roles: ['admin', 'director', 'coordinator', 'site_manager', 'brigadier', 'buyer']
    }
  },
  {
    path: '/purchases/:id/edit',
    name: 'PurchaseEdit',
    component: PurchaseForm,
    meta: { 
      title: 'Редактировать закупку',
      breadcrumb: 'Закупки / Редактировать',
      description: 'Редактирование существующей закупки',
      category: 'purchases',
      roles: ['admin', 'director', 'coordinator', 'site_manager', 'brigadier', 'buyer']
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
      breadcrumb: 'Объекты',
      description: 'Управление объектами строительства',
      category: 'objects',
      order: 4,
      roles: ['admin', 'director', 'coordinator', 'site_manager']
    }
  },
  {
    path: '/objects/create',
    name: 'ObjectCreate',
    component: ObjectForm,
    meta: { 
      title: 'Новый объект',
      breadcrumb: 'Объекты / Новый',
      description: 'Создание нового объекта',
      category: 'objects',
      roles: ['admin', 'director', 'coordinator', 'site_manager']
    }
  },
  {
    path: '/objects/:id/edit',
    name: 'ObjectEdit',
    component: ObjectForm,
    meta: { 
      title: 'Редактировать объект',
      breadcrumb: 'Объекты / Редактировать',
      description: 'Редактирование существующего объекта',
      category: 'objects',
      roles: ['admin', 'director', 'coordinator', 'site_manager']
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
      breadcrumb: 'Единицы измерения',
      description: 'Управление единицами измерения',
      category: 'reference_data',
      order: 8,
      roles: ['admin', 'director']
    }
  },
  {
    path: '/units/create',
    name: 'UnitCreate',
    component: UnitForm,
    meta: { 
      title: 'Новая единица',
      breadcrumb: 'Единицы / Новая',
      description: 'Создание новой единицы измерения',
      category: 'reference_data',
      roles: ['admin', 'director']
    }
  },
  {
    path: '/units/:id/edit',
    name: 'UnitEdit',
    component: UnitForm,
    meta: { 
      title: 'Редактировать единицу',
      breadcrumb: 'Единицы / Редактировать',
      description: 'Редактирование существующей единицы измерения',
      category: 'reference_data',
      roles: ['admin', 'director']
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
      breadcrumb: 'Сотрудники',
      description: 'Управление сотрудниками и пользователями',
      category: 'reference_data',
      order: 7,
      roles: ['admin', 'director']
    }
  },
  {
    path: '/employees/create',
    name: 'EmployeeCreate',
    component: EmployeeForm,
    meta: { 
      title: 'Новый сотрудник',
      breadcrumb: 'Сотрудники / Новый',
      description: 'Создание нового сотрудника',
      category: 'reference_data',
      roles: ['admin', 'director']
    }
  },
  {
    path: '/employees/:id/edit',
    name: 'EmployeeEdit',
    component: EmployeeForm,
    meta: { 
      title: 'Редактировать сотрудника',
      breadcrumb: 'Сотрудники / Редактировать',
      description: 'Редактирование существующего сотрудника',
      category: 'reference_data',
      roles: ['admin', 'director']
    }
  },

  // Suppliers routes
  {
    path: '/suppliers',
    name: 'SuppliersList',
    component: SuppliersList,
    meta: { 
      title: 'Поставщики',
      icon: 'truck',
      breadcrumb: 'Поставщики',
      description: 'Управление поставщиками',
      category: 'reference_data',
      order: 5,
      roles: ['admin', 'director']
    }
  },
  {
    path: '/suppliers/create',
    name: 'SupplierCreate',
    component: SupplierForm,
    meta: { 
      title: 'Новый поставщик',
      breadcrumb: 'Поставщики / Новый',
      description: 'Создание нового поставщика',
      category: 'reference_data',
      roles: ['admin', 'director']
    }
  },
  {
    path: '/suppliers/:id/edit',
    name: 'SupplierEdit',
    component: SupplierForm,
    meta: { 
      title: 'Редактировать поставщика',
      breadcrumb: 'Поставщики / Редактировать',
      description: 'Редактирование существующего поставщика',
      category: 'reference_data',
      roles: ['admin', 'director']
    }
  },
  
  // Stocks routes
  {
    path: '/stocks',
    name: 'StocksList',
    component: StocksList,
    meta: { 
      title: 'Движения',
      icon: 'warehouse',
      breadcrumb: 'Движения',
      description: 'Журнал движений материалов',
      category: 'inventory',
      order: 6,
      roles: ['admin', 'director', 'coordinator', 'site_manager', 'brigadier']
    }
  },
  {
    path: '/stocks/balances',
    name: 'StockBalances',
    component: StockBalances,
    meta: { 
      title: 'Остатки',
      icon: 'inventory_2',
      breadcrumb: 'Остатки',
      description: 'Текущие остатки материалов по объектам',
      category: 'inventory',
      order: 7,
      roles: ['admin', 'director', 'coordinator', 'site_manager', 'brigadier', 'buyer']
    }
  },

  // WriteOffs routes
  {
    path: '/writeoffs',
    name: 'WriteOffsList',
    component: WriteOffsList,
    meta: { 
      title: 'Списания',
      icon: 'minus-circle',
      breadcrumb: 'Списания',
      description: 'Управление списаниями материалов',
      category: 'writeoffs',
      order: 3,
      roles: ['admin', 'director', 'coordinator', 'site_manager', 'brigadier']
    }
  },
  {
    path: '/writeoffs/create',
    name: 'WriteOffCreate',
    component: WriteOffForm,
    meta: { 
      title: 'Новое списание',
      breadcrumb: 'Списания / Новое',
      description: 'Создание нового списания',
      category: 'writeoffs',
      roles: ['admin', 'director', 'coordinator', 'site_manager', 'brigadier']
    }
  },
  {
    path: '/writeoffs/:id/edit',
    name: 'WriteOffEdit',
    component: WriteOffForm,
    meta: { 
      title: 'Редактировать списание',
      breadcrumb: 'Списания / Редактировать',
      description: 'Редактирование существующего списания',
      category: 'writeoffs',
      roles: ['admin', 'director', 'coordinator', 'site_manager', 'brigadier']
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
      breadcrumb: 'Архив',
      description: 'Архивные данные и отчеты',
      category: 'archive',
      order: 10,
      roles: ['admin', 'director', 'coordinator', 'site_manager', 'brigadier', 'buyer']
    }
  },
  
  // Reports routes
  {
    path: '/reports/by-period',
    name: 'ReportByPeriod',
    component: ReportByPeriod,
    meta: { 
      title: 'Отчет по периодам',
      breadcrumb: 'Отчеты / По периодам',
      description: 'Отчеты по периодам времени',
      category: 'reports',
      order: 11,
      roles: ['admin', 'director', 'coordinator', 'site_manager']
    }
  },
  {
    path: '/reports/by-object',
    name: 'ReportByObject',
    component: ReportByObject,
    meta: { 
      title: 'Отчет по объектам',
      breadcrumb: 'Отчеты / По объектам',
      description: 'Отчеты по объектам строительства',
      category: 'reports',
      order: 12,
      roles: ['admin', 'director', 'coordinator', 'site_manager']
    }
  },
  {
    path: '/reports/by-material',
    name: 'ReportByMaterial',
    component: ReportByMaterial,
    meta: { 
      title: 'Отчет по материалам',
      breadcrumb: 'Отчеты / По материалам',
      description: 'Отчеты по материалам и номенклатуре',
      category: 'reports',
      order: 13,
      roles: ['admin', 'director', 'coordinator', 'site_manager']
    }
  },
  {
    path: '/reports/by-responsible',
    name: 'ReportByResponsible',
    component: ReportByResponsible,
    meta: { 
      title: 'Отчет по ответственным',
      breadcrumb: 'Отчеты / По ответственным',
      description: 'Отчеты по ответственным лицам',
      category: 'reports',
      order: 14,
      roles: ['admin', 'director', 'coordinator', 'site_manager']
    }
  },
  
  
  // 404 fallback
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/purchases',
    meta: {
      public: true,
      title: 'Страница не найдена'
    }
  }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Simple auth guard
router.beforeEach(async (to, from, next) => {
    const auth = useAuthStore()
    
  // Wait for auth store to be initialized
  if (!auth.initialized) {
    try {
      await auth.tryHydrate()
    } catch (error) {
      console.warn('Auth hydration failed:', error)
    }
  }
  
  // Public routes (login page)
  if (to.meta.public) {
    if (auth.isAuthenticated) {
      next('/purchases')
    } else {
      next()
    }
    return
  }
  
  // Protected routes
        if (!auth.isAuthenticated) {
    const redirect = encodeURIComponent(to.fullPath)
    next(`/login?redirect=${redirect}`)
    return
  }
  
  // Check role-based access
  if (to.meta.roles && Array.isArray(to.meta.roles) && to.meta.roles.length > 0) {
    if (!auth.role || !to.meta.roles.includes(auth.role)) {
      next('/purchases')
      return
    }
  }
  
  next()
})

// Helper function for role-based access
function hasRequiredRole(userRole: UserRole | null, requiredRoles: UserRole[]): boolean {
  if (!userRole || !requiredRoles.length) {return false}
  
  return requiredRoles.includes(userRole)
}

// Set page title and meta
router.afterEach((to) => {
  const title = to.meta.title as string
  if (title) {
    document.title = `${title} - ELOM`
  }
  
  // Set meta description if available
  const description = to.meta.description as string
  if (description) {
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', description)
    } else {
      const meta = document.createElement('meta')
      meta.name = 'description'
      meta.content = description
      document.head.appendChild(meta)
    }
  }
})

export default router