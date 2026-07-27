// Types for GenericList and GenericForm components

export interface ColumnConfig<T = any> {
  key: string
  label: string
  sortable?: boolean
  sortKey?: string  // F-224: backend ?ordering= key when it differs from the column key (e.g. tool__inventory_number)
  component?: any
  formatter?: (value: any, item: T) => string
  path?: string // для вложенных свойств типа 'user.name'
  width?: string
  align?: 'left' | 'center' | 'right'
  mono?: boolean // D-020: данные (кол-во/цена/id/дата/№) моноширинным Plex Mono
}

export type FilterType = 'text' | 'number' | 'select' | 'date' | 'multiselect' | 'checkbox'

export interface FilterConfig {
  key: string
  type: FilterType
  label: string
  placeholder?: string
  options?: Array<{ value: any; label: string }>
  required?: boolean
  multiple?: boolean
  min?: number
  max?: number
  step?: number
}

export interface ActionConfig<T = any> {
  key: string
  label: string
  class?: string
  icon?: string
  disabled?: (item: T) => boolean
  /** A11y: причина недоступности — идёт в title/aria-label, когда disabled(item) === true. */
  disabledTooltip?: string | ((item: T) => string)
  visible?: (item: T) => boolean
  confirm?: string | ((item: T) => string)
  /**
   * ✅ RBAC: Разрешение для этого действия
   * Если указано, действие будет скрыто, если у пользователя нет этого разрешения
   * Пример: 'materials.edit', 'purchases.delete', 'employees.view'
   */
  permission?: string
  /**
   * ✅ RBAC: Массив разрешений (для сложных проверок)
   * Если указано, действие будет показано, если есть хотя бы одно из разрешений
   */
  anyPermission?: string[]
  /**
   * ✅ RBAC: Все разрешения должны быть (AND логика)
   * Если указано, действие будет показано только если есть все разрешения
   */
  allPermissions?: string[]
}

export interface GenericListConfig<T = any> {
  title: string
  subtitle?: string
  icon?: string
  showCreate?: boolean
  createText?: string
  canCreate?: boolean
  showStats?: boolean
  exportable?: boolean
  exportFilename?: string
  exportUrl?: string // URL для backend экспорта
  loadingText?: string
  emptyText?: string
  emptyTitle?: string
  emptySubtitle?: string
  filterColumns?: number
  columns: ColumnConfig<T>[]
  filters?: FilterConfig[]
  actions?: ActionConfig<T>[]
  mobileCardComponent?: any
  mobileCardProp?: string
  defaultSort?: string
  defaultSortOrder?: 'asc' | 'desc'
  /**
   * ✅ RBAC: Ресурс для автоматического определения permissions
   * Если указано, стандартные действия (view, edit, delete, export) будут
   * автоматически проверяться по permissions: {resource}.view, {resource}.edit, и т.д.
   * Пример: 'materials', 'purchases', 'employees', 'stock'
   */
  resource?: string
  /**
   * ✅ RBAC: Разрешение для просмотра (View)
   * Если не указано, будет использовано {resource}.view
   */
  viewPermission?: string
  /**
   * ✅ RBAC: Разрешение для создания (Create)
   * Если не указано, будет использовано {resource}.create
   */
  createPermission?: string
  /**
   * F-517: RBAC — кнопка создания разрешена, если есть ЛЮБОЕ из этих прав.
   * Для случаев, когда одно действие покрывается разными правами: закупки создаёт роль с
   * `purchases.create`, а заявку — роль с `purchases.create_request` (бэкенд на POST принимает
   * оба). Задаётся ЯВНО и только там, где нужно — обычные списки продолжают работать по
   * одиночному {resource}.create, поведение остальных экранов не меняется.
   */
  createPermissionAny?: string[]
  /**
   * ✅ RBAC: Разрешение для редактирования (Edit)
   * Если не указано, будет использовано {resource}.edit
   */
  editPermission?: string
  /**
   * ✅ RBAC: Разрешение для удаления (Delete)
   * Если не указано, будет использовано {resource}.delete
   */
  deletePermission?: string
  /**
   * ✅ RBAC: Разрешение для экспорта (Export)
   * Если не указано, будет использовано reports.export или {resource}.export
   */
  exportPermission?: string
}

// GenericForm types
export interface FieldConfig {
  key: string
  type: 'input' | 'textarea' | 'select' | 'date' | 'number' | 'checkbox' | 'file' | 'multiselect' | 'password' | 'email' | 'text' | 'switch' | 'search' | 'tel' | 'custom'
  label: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  multiple?: boolean // for file and multiselect fields
  options?: Array<{ value: any; label: string }>
  rows?: number // for textarea
  step?: number // for number input
  accept?: string // for file input
  checkboxLabel?: string // for checkbox fields
  switchLabel?: string // for switch fields
  validation?: {
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
    pattern?: RegExp
    step?: number
    custom?: (value: any) => string | null
  }
  help?: string
  group?: string
  order?: number
  width?: 'full' | 'half' | 'third' | 'quarter'
  condition?: () => boolean // Условие для отображения поля
  customClass?: string // Дополнительные CSS классы для поля
  autocomplete?: string // Значение атрибута autocomplete для браузера
  // A-05 (F-522): iOS-клавиатура. По типу выводится автоматически (number→decimal, tel→tel…),
  // это — явное перекрытие.
  inputmode?: 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url' | 'none'
  // A-08 (F-522): поле-код (артикул/№/инвентарный) — iOS не капитализирует/не исправляет.
  code?: boolean
}

export interface FormSection {
  title: string
  description?: string
  fields: string[] // field keys
  order?: number
}

export interface GenericFormConfig<_T = any> {
  title: string
  subtitle?: string
  sections?: FormSection[]
  fields: FieldConfig[]
  submitText?: string
  cancelText?: string
  showCancel?: boolean
  validateOnChange?: boolean
  resetOnSubmit?: boolean
  mode?: 'create' | 'edit'
}

export interface FormState<T = any> {
  data: T
  errors: Record<string, string>
  isSubmitting: boolean
  isDirty: boolean
  isValid: boolean
}

// Store types
export interface BaseStoreState<T = any> {
  items: T[]
  current: T | null
  loading: boolean
  error: string | null
  pagination: {
    count: number
    page: number
    pageSize: number
    next: string | null
    previous: string | null
  }
  filters: Record<string, any>
}

export interface BaseStoreActions<T = any> {
  // State
  items: T[]
  loading: boolean
  error: string | null
  pagination: BaseStoreState<T>['pagination']
  filters: Record<string, any>
  
  // Actions
  fetchList: (params?: any) => Promise<void>
  fetchOne: (id: number) => Promise<T | null>
  create: (data: Partial<T>) => Promise<T>
  update: (id: number, data: Partial<T>) => Promise<T>
  delete: (id: number) => Promise<void>
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setFilters: (filters: Partial<Record<string, any>>) => void
  resetFilters: () => void
  setCurrent: (item: T | null) => void
  clearError: () => void
}

// Composable types
export interface UseGenericListOptions<T = any> {
  store: BaseStoreActions<T>
  config: GenericListConfig<T>
  autoFetch?: boolean
  debounceMs?: number
}

export interface UseGenericFormOptions<T = any> {
  initialData?: Partial<T>
  config: GenericFormConfig<T>
  onSubmit: (data: T) => Promise<void>
  onCancel?: () => void
  validateOnChange?: boolean
  resetOnSubmit?: boolean
}

export interface UseGenericListReturn<T = any> {
  // State
  items: Ref<T[]>
  loading: Ref<boolean>
  error: Ref<string | null>
  pagination: Ref<BaseStoreState<T>['pagination']>
  filters: Ref<Record<string, any>>
  
  // Actions
  fetchList: () => Promise<void>
  handleSort: (key: string) => void
  handlePageChange: (page: number) => void
  handlePageSizeChange: (size: number) => void
  handleResetFilters: () => void
  handleAction: (action: string, item: T) => void
  handleExport: (format: 'csv' | 'excel' | 'pdf') => Promise<void>
}

export interface UseGenericFormReturn<T = any> {
  // State
  form: Ref<T>
  errors: Ref<Record<string, string>>
  isSubmitting: Ref<boolean>
  isDirty: Ref<boolean>
  isValid: Ref<boolean>
  
  // Actions
  submit: () => Promise<void>
  reset: () => void
  validate: () => boolean
  setFieldValue: (key: string, value: any) => void
  setFieldError: (key: string, error: string) => void
  clearErrors: () => void
  getFieldValue: (key: string) => any
  getFieldError: (key: string) => string | null
  isFieldTouched: (key: string) => boolean
  setFormData: (data: Partial<T>) => void
}

// Import Vue types
import type { Ref } from 'vue'
