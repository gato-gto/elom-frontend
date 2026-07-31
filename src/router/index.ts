import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

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
const PurchasePrint = () => import(/* webpackChunkName: "purchases" */ '@/pages/Purchases/PurchasePrint.vue')

// Objects
const ObjectsList = () => import(/* webpackChunkName: "objects" */ '@/pages/Objects/List.vue')
const ObjectForm = () => import(/* webpackChunkName: "objects" */ '@/pages/Objects/ObjectForm.vue')
const ObjectInfo = () => import(/* webpackChunkName: "objects" */ '@/pages/Objects/ObjectInfo.vue')

// Units
const UnitsList = () => import(/* webpackChunkName: "units" */ '@/pages/Units/List.vue')
const UnitForm = () => import(/* webpackChunkName: "units" */ '@/pages/Units/UnitForm.vue')

// Employees
const EmployeesList = () => import(/* webpackChunkName: "employees" */ '@/pages/Employees/List.vue')
const EmployeeForm = () => import(/* webpackChunkName: "employees" */ '@/pages/Employees/EmployeeForm.vue')

// RBAC
const RBACList = () => import(/* webpackChunkName: "rbac" */ '@/pages/RBAC/List.vue')
const RBACRoleForm = () => import(/* webpackChunkName: "rbac" */ '@/pages/RBAC/RoleForm.vue')

// Stocks
const StocksList = () => import(/* webpackChunkName: "stocks" */ '@/pages/Stocks/List.vue')
const StockBalances = () => import(/* webpackChunkName: "stocks" */ '@/pages/Stocks/Balances.vue')
const ArchivePeriods = () => import(/* webpackChunkName: "stocks" */ '@/pages/Stocks/ArchivePeriods.vue')

// WriteOffs
const WriteOffsList = () => import(/* webpackChunkName: "writeoffs" */ '@/pages/WriteOffs/List.vue')

// Estimates (сметы по объекту / отчёт цен)
const EstimateList = () => import(/* webpackChunkName: "estimates" */ '@/pages/Estimates/EstimateList.vue')
const EstimateForm = () => import(/* webpackChunkName: "estimates" */ '@/pages/Estimates/EstimateForm.vue')
const EstimateInfo = () => import(/* webpackChunkName: "estimates" */ '@/pages/Estimates/EstimateInfo.vue')
const EstimatesCatalog = () => import(/* webpackChunkName: "estimates" */ '@/pages/Estimates/Catalog.vue')

// Reports
const ReportByPeriod = () => import(/* webpackChunkName: "reports" */ '@/pages/Reports/ByPeriod.vue')
const ReportByObject = () => import(/* webpackChunkName: "reports" */ '@/pages/Reports/ByObject.vue')
const ReportByMaterial = () => import(/* webpackChunkName: "reports" */ '@/pages/Reports/ByMaterial.vue')
const ReportByResponsible = () => import(/* webpackChunkName: "reports" */ '@/pages/Reports/ByResponsible.vue')


// Suppliers
const SuppliersList = () => import(/* webpackChunkName: "suppliers" */ '@/pages/Suppliers/List.vue')
const SupplierForm = () => import(/* webpackChunkName: "suppliers" */ '@/pages/Suppliers/SupplierForm.vue')

// Tools
const ToolsList = () => import(/* webpackChunkName: "tools" */ '@/pages/Tools/List.vue')
const ToolIssuesList = () => import(/* webpackChunkName: "tools" */ '@/pages/Tools/Issues/List.vue')

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
      permissions: ['materials.view']  // RBAC
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
      permissions: ['materials.create'],  // RBAC
      category: 'inventory'
    }
  },
  {
    path: '/materials/:id/edit',
    name: 'MaterialEdit',
    // F-505: форма получает данные ТОЛЬКО через prop :initial (её открывает список модалкой).
    // Роутом она монтировалась без пропса → ПУСТАЯ форма редактирования, которую можно отправить.
    // Ведём на список с ?edit=:id — там модалка открывается уже с записью.
    redirect: (to: { params: Record<string, unknown> }) => ({ path: '/materials', query: { edit: String(to.params.id) } }),
    meta: { 
      title: 'Редактировать материал',
      breadcrumb: 'Материалы / Редактировать',
      description: 'Редактирование существующего материала',
      category: 'inventory',
      permissions: ['materials.edit']
    }
  },
  
  // Material Categories routes
  {
    path: '/material_categories',
    name: 'MaterialCategoriesList',
    component: MaterialCategoriesList,
    meta: { 
      title: 'Категории материалов',
      icon: 'category',
      breadcrumb: 'Категории материалов',
      description: 'Управление категориями материалов',
      category: 'reference_data',
      order: 9,
      permissions: ['material_categories.view']
    }
  },
  {
    path: '/material_categories/create',
    name: 'MaterialCategoryCreate',
    component: MaterialCategoryForm,
    meta: { 
      title: 'Новая категория',
      breadcrumb: 'Категории материалов / Новая',
      description: 'Создание новой категории материалов',
      category: 'reference_data',
      permissions: ['material_categories.create']
    }
  },
  {
    path: '/material_categories/:id',
    name: 'MaterialCategoryInfo',
    component: MaterialCategoryInfo,
    meta: { 
      title: 'Информация о категории',
      breadcrumb: 'Категории материалов / Просмотр',
      description: 'Просмотр информации о категории материалов',
      category: 'reference_data',
      permissions: ['material_categories.view']
    }
  },
  {
    path: '/material_categories/:id/edit',
    name: 'MaterialCategoryEdit',
    // F-505: форма получает данные ТОЛЬКО через prop :initial (её открывает список модалкой).
    // Роутом она монтировалась без пропса → ПУСТАЯ форма редактирования, которую можно отправить.
    // Ведём на список с ?edit=:id — там модалка открывается уже с записью.
    redirect: (to: { params: Record<string, unknown> }) => ({ path: '/material_categories', query: { edit: String(to.params.id) } }),
    meta: { 
      title: 'Редактировать категорию',
      breadcrumb: 'Категории материалов / Редактировать',
      description: 'Редактирование категории материалов',
      category: 'reference_data',
      permissions: ['material_categories.edit']
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
      // F-512: заявитель имеет purchases.view_own (не .view) и бэкенд пускает его на список
      // (PurchasesPermission: SAFE_METHODS → view ИЛИ view_own, queryset скоупит по объектам).
      // Без view_own этот пункт исчезал из меню и роут-гард не пускал — роль оставалась без
      // своих главных экранов. Показываем ссылку тем, у кого доступ реально есть.
      permissions: ['purchases.view', 'purchases.view_own']
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
      permissions: ['purchases.create']  // RBAC
    }
  },
  {
    path: '/purchases/:id/edit',
    name: 'PurchaseEdit',
    // F-505: форма получает данные ТОЛЬКО через prop :initial (её открывает список модалкой).
    // Роутом она монтировалась без пропса → ПУСТАЯ форма редактирования, которую можно отправить.
    // Ведём на список с ?edit=:id — там модалка открывается уже с записью.
    redirect: (to: { params: Record<string, unknown> }) => ({ path: '/purchases', query: { edit: String(to.params.id) } }),
    meta: { 
      title: 'Редактировать закупку',
      breadcrumb: 'Закупки / Редактировать',
      description: 'Редактирование существующей закупки',
      category: 'purchases',
      permissions: ['purchases.edit']
    }
  },
  {
    path: '/purchases/:id/print',
    name: 'PurchasePrint',
    component: PurchasePrint,
    meta: { 
      title: 'Печать накладной',
      breadcrumb: 'Закупки / Печать накладной',
      description: 'Отдельная страница для печати накладной',
      category: 'purchases',
      // F-882: было ['purchases.view'] — заявитель (view_own, без .view) открывал свою закупку и жал
      // «Печать», но гард отбрасывал его на /purchases (печать не работала для всех *_own-ролей).
      // Совпадает с маршрутом списка /purchases (F-512), бэкенд скоупит доступ по объектам.
      permissions: ['purchases.view', 'purchases.view_own']
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
      permissions: ['objects.view']
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
      permissions: ['objects.create']
    }
  },
  {
    path: '/objects/:id',
    name: 'ObjectInfo',
    component: ObjectInfo,
    meta: {
      title: 'Информация об объекте',
      breadcrumb: 'Объекты / Просмотр',
      description: 'Просмотр статуса объекта, контактов и связанных данных',
      category: 'objects',
      permissions: ['objects.view']
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
      permissions: ['units.view']
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
      permissions: ['units.create']
    }
  },
  {
    path: '/units/:id/edit',
    name: 'UnitEdit',
    // F-505: форма получает данные ТОЛЬКО через prop :initial (её открывает список модалкой).
    // Роутом она монтировалась без пропса → ПУСТАЯ форма редактирования, которую можно отправить.
    // Ведём на список с ?edit=:id — там модалка открывается уже с записью.
    redirect: (to: { params: Record<string, unknown> }) => ({ path: '/units', query: { edit: String(to.params.id) } }),
    meta: { 
      title: 'Редактировать единицу',
      breadcrumb: 'Единицы / Редактировать',
      description: 'Редактирование существующей единицы измерения',
      category: 'reference_data',
      permissions: ['units.edit']
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
      category: 'administration',
      order: 10,
      permissions: ['employees.view']
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
      category: 'administration',
      permissions: ['employees.create']
    }
  },
  {
    path: '/employees/:id/edit',
    name: 'EmployeeEdit',
    // F-505: форма получает данные ТОЛЬКО через prop :initial (её открывает список модалкой).
    // Роутом она монтировалась без пропса → ПУСТАЯ форма редактирования, которую можно отправить.
    // Ведём на список с ?edit=:id — там модалка открывается уже с записью.
    redirect: (to: { params: Record<string, unknown> }) => ({ path: '/employees', query: { edit: String(to.params.id) } }),
    meta: { 
      title: 'Редактировать сотрудника',
      breadcrumb: 'Сотрудники / Редактировать',
      description: 'Редактирование существующего сотрудника',
      category: 'administration',
      permissions: ['employees.edit']
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
      permissions: ['suppliers.view']
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
      permissions: ['suppliers.create']
    }
  },
  {
    path: '/suppliers/:id/edit',
    name: 'SupplierEdit',
    // F-505: форма получает данные ТОЛЬКО через prop :initial (её открывает список модалкой).
    // Роутом она монтировалась без пропса → ПУСТАЯ форма редактирования, которую можно отправить.
    // Ведём на список с ?edit=:id — там модалка открывается уже с записью.
    redirect: (to: { params: Record<string, unknown> }) => ({ path: '/suppliers', query: { edit: String(to.params.id) } }),
    meta: { 
      title: 'Редактировать поставщика',
      breadcrumb: 'Поставщики / Редактировать',
      description: 'Редактирование существующего поставщика',
      category: 'reference_data',
      permissions: ['suppliers.edit']
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
      // F-512: stock.view_own достаточно — StockViewSet скоупит движения по назначенным объектам.
      permissions: ['stock.view', 'stock.view_own']
    }
  },
  {
    path: '/balances',
    name: 'StockBalances',
    component: StockBalances,
    meta: { 
      title: 'Остатки',
      icon: 'inventory_2',
      breadcrumb: 'Остатки',
      description: 'Текущие остатки материалов по объектам',
      category: 'inventory',
      order: 7,
      // F-512: заявитель с stock.view_own видит свои остатки (queryset скоупит по объектам).
      permissions: ['stock.view', 'stock.view_own']
    }
  },
  {
    path: '/archive-periods',
    name: 'ArchivePeriods',
    component: ArchivePeriods,
    meta: {
      title: 'Архив',
      icon: 'archive',
      breadcrumb: 'Архивные периоды',
      description: 'Закрытие и открытие месяцев по объектам',
      category: 'inventory',
      order: 8,
      permissions: ['stock.view']
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
      // F-512: заявитель имеет writeoffs.view_own; бэкенд WriteOffViewSet гейтит через
      // StockPermission (stock.view/stock.view_own) и скоупит queryset по назначенным объектам.
      permissions: ['writeoffs.view', 'writeoffs.view_own']
    }
  },
  {
    // F-502: WriteOffForm — МОДАЛКА (корень <Modal :model-value="isOpen">), а не страница.
    // Смонтированная роутером без is-open она рендерила ПУСТОЙ экран. Ведём на список,
    // который открывает модалку по query. (PurchaseForm — обычная страница, его роуты не трогаем.)
    path: '/writeoffs/create',
    name: 'WriteOffCreate',
    redirect: () => ({ path: '/writeoffs', query: { new: '1' } }),
    meta: {
      title: 'Новое списание',
      breadcrumb: 'Списания / Новое',
      description: 'Создание нового списания',
      category: 'writeoffs',
      permissions: ['writeoffs.create']
    }
  },
  {
    path: '/writeoffs/:id/edit',
    name: 'WriteOffEdit',
    redirect: (to: { params: Record<string, unknown> }) => ({ path: '/writeoffs', query: { edit: String(to.params.id) } }),
    meta: {
      title: 'Редактировать списание',
      breadcrumb: 'Списания / Редактировать',
      description: 'Редактирование существующего списания',
      category: 'writeoffs',
      permissions: ['writeoffs.edit']
    }
  },

  // Estimates routes (сметы по объекту). Статические пути (new) — ПЕРЕД динамическим :id.
  {
    path: '/estimates',
    name: 'EstimatesList',
    component: EstimateList,
    meta: {
      title: 'Сметы',
      icon: 'clipboard',
      breadcrumb: 'Сметы',
      description: 'Сметы по объекту (отчёт цен)',
      category: 'estimates',
      order: 6,
      permissions: ['estimates.view', 'estimates.view_own', 'estimates.view_all'],
    },
  },
  {
    path: '/work-catalog',
    name: 'EstimatesCatalog',
    component: EstimatesCatalog,
    meta: {
      title: 'Прайс-каталог',
      icon: 'book',
      breadcrumb: 'Прайс-каталог',
      description: 'Разделы работ и позиции для смет',
      category: 'estimates',
      order: 7,
      permissions: ['work_categories.view', 'work_items.view'],
    },
  },
  {
    path: '/estimates/new',
    name: 'EstimateCreate',
    component: EstimateForm,
    meta: {
      title: 'Новая смета',
      breadcrumb: 'Сметы / Новая',
      description: 'Создание сметы',
      category: 'estimates',
      permissions: ['estimates.create'],
    },
  },
  {
    path: '/estimates/:id/edit',
    name: 'EstimateEdit',
    component: EstimateForm,
    meta: {
      title: 'Редактировать смету',
      breadcrumb: 'Сметы / Редактировать',
      description: 'Редактирование сметы',
      category: 'estimates',
      permissions: ['estimates.edit', 'estimates.edit_own', 'estimates.edit_all'],
    },
  },
  {
    path: '/estimates/:id',
    name: 'EstimateInfo',
    component: EstimateInfo,
    meta: {
      title: 'Смета',
      breadcrumb: 'Сметы / Просмотр',
      description: 'Просмотр сметы',
      category: 'estimates',
      permissions: ['estimates.view', 'estimates.view_own', 'estimates.view_all'],
    },
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
      permissions: ['reports.view']
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
      permissions: ['reports.view']
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
      permissions: ['reports.view']
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
      permissions: ['reports.view']
    }
  },
  
  // RBAC routes
  {
    path: '/rbac/roles',
    name: 'RBACList',
    component: RBACList,
    meta: { 
      title: 'Управление ролями',
      icon: 'shield',
      breadcrumb: 'Управление ролями',
      description: 'Создание и редактирование ролей с назначением разрешений',
      category: 'administration',
      order: 20,
      permissions: ['rbac.manage_roles']
    }
  },
  {
    path: '/rbac/roles/create',
    name: 'RBACRoleCreate',
    component: RBACRoleForm,
    meta: { 
      title: 'Создать роль',
      breadcrumb: 'Управление ролями / Создать',
      description: 'Создание новой роли с назначением разрешений',
      category: 'administration',
      permissions: ['rbac.manage_roles']
    }
  },
  {
    path: '/rbac/roles/:id/edit',
    name: 'RBACRoleEdit',
    // F-888 (класс F-505): RoleForm получает данные ТОЛЬКО через prop :initial (её открывает список
    // модалкой). Роутом монтировалась БЕЗ пропса → ПУСТАЯ форма «Создать роль», сабмит создавал НОВУЮ
    // роль вместо редактирования. Ведём на список с ?edit=:id — там модалка откроется уже с ролью.
    redirect: (to: { params: Record<string, unknown> }) => ({ path: '/rbac/roles', query: { edit: String(to.params.id) } }),
    meta: {
      title: 'Редактировать роль',
      breadcrumb: 'Управление ролями / Редактировать',
      description: 'Редактирование роли и её разрешений',
      category: 'administration',
      permissions: ['rbac.manage_roles']
    }
  },
  
  // Tools routes
  {
    path: '/tools_index',
    name: 'ToolsList',
    component: ToolsList,
    meta: { 
      title: 'Инструменты',
      icon: 'build',
      breadcrumb: 'Инструменты',
      description: 'Учёт и управление инструментами',
      category: 'tools',
      order: 15,
      permissions: ['tools.view']
    }
  },
  {
    path: '/tools_issues',
    name: 'ToolIssuesList',
    component: ToolIssuesList,
    meta: { 
      title: 'Выдачи инструментов',
      icon: 'assignment',
      breadcrumb: 'Выдачи инструментов',
      description: 'Журнал выдач и возвратов инструментов',
      category: 'tools',
      order: 16,
      permissions: ['tools.view']
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

// Simple auth guard with RBAC support
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
  
  // ✅ RBAC: Проверка через permissions (приоритет)
  const requiredPermissions = to.meta.permissions as string[] | undefined
  if (requiredPermissions && requiredPermissions.length > 0) {
    const { usePermissionsStore } = await import('@/stores/permissions')
    const permissionsStore = usePermissionsStore()
    
    // Загружаем разрешения, если еще не загружены
    if (permissionsStore.permissions.length === 0) {
      await permissionsStore.fetchPermissions()
    }
    
    // Проверяем, есть ли хотя бы одно из требуемых разрешений
    const hasAccess = permissionsStore.hasAnyPermission(...requiredPermissions)
    if (!hasAccess) {
      console.warn(`[RBAC] Access denied to ${to.path}. Required permissions:`, requiredPermissions)
      next('/purchases')
      return
    }
  }
  // ⚠️ DEPRECATED: meta.roles больше не поддерживается
  // Все маршруты должны использовать meta.permissions
  // Если маршрут использует meta.roles, доступ запрещен до миграции на permissions
  if (to.meta.roles && Array.isArray(to.meta.roles) && to.meta.roles.length > 0) {
    console.error(`[RBAC] Route ${to.path} uses deprecated meta.roles. Migrate to meta.permissions.`)
      next('/purchases')
      return
  }
  
  next()
})

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