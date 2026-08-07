// Типы фичи «Смета по объекту (отчёт цен)» — этап 1.
// Контракт: elom-backend/estimates/serializers.py (хендофф ESTIMATES_FE_HANDOFF.md).
// Конвенция: model-DecimalField сериализуется как СТРОКА (COERCE_DECIMAL_TO_STRING=default);
// SerializerMethodField с float() (amount/total) — number.

export type WorkItemKind = 'work' | 'material' | 'equipment' | 'coefficient'

// ─────────────────────────── Прайс-каталог ───────────────────────────

export interface WorkCategory {
  id: number
  name: string
  parent: number | null
  parent_name: string | null
  order: number
  is_active: boolean
  children_count: number
  items_count: number
}

export interface WorkCategoryRequest {
  name: string
  parent?: number | null
  order?: number
  is_active?: boolean
}

export interface WorkItem {
  id: number
  category: number
  category_name: string
  name: string
  kind: WorkItemKind
  kind_display: string
  unit: string
  default_price: string | null // decimal as string; NULL = нет каталожной цены (договорная ИЛИ драфт — различает is_draft)
  // A7 (F-762): BE ТЕПЕРЬ отдаёт авторитетный is_draft на WorkItem/WorkItemLite сериализаторах
  // (read_only BooleanField, всегда присутствует). is_draft = (default_price is None И proposed_by задан):
  // договорная позиция без цены (proposed_by=NULL) — НЕ драфт. Больше НЕ выводим драфт из default_price==null.
  proposed_by?: number | null // manual→catalog: кто предложил драфт (провенанс)
  is_draft: boolean // A7: авторитетный флаг от BE — читать напрямую, не переопределять по default_price
  order: number
  is_active: boolean
}

export interface WorkItemRequest {
  category: number
  name: string
  kind?: WorkItemKind
  unit?: string
  default_price?: string | null
  order?: number
  is_active?: boolean
}

/** Лёгкая позиция для автоподсказки (`work-items/search`). */
export interface WorkItemLite {
  id: number
  name: string
  kind: WorkItemKind
  kind_display: string
  unit: string
  default_price: string | null // decimal as string
  // #65: цепочка категории позиции — FE авто-подставляет путь без ручного каскада.
  category: number // id подраздела (leaf)
  section_name: string // раздел (верхний уровень)
  subcategory_name: string // подраздел
  is_draft: boolean // A7 (F-762): BE-search отдаёт авторитетный флаг (read_only BooleanField, всегда присутствует)
}

// ─────────────────────────── Смета (read) ───────────────────────────

export interface EstimateLine {
  id: number
  work_item: number | null
  position_no: string
  name: string
  kind: WorkItemKind
  kind_display: string
  unit: string
  section_name: string // #65: раздел (снапшот) — для группировки
  subcategory_name: string // #65: подраздел (снапшот)
  coeff_scope: string // Фаза 1/2: зона ('section'|'subcategory'|'selection'|''); '' у не-коэфф
  coeff_scope_name: string // section-зона: раздел; subcategory-зона: подраздел
  coeff_scope_section: string // M4: раздел подраздела-зоны (квалификатор)
  uid: string // Фаза 2: стабильный id строки
  coeff_targets: string[] // Фаза 2 (selection): uid выбранных работ
  quantity: string // decimal as string
  unit_price: string // decimal as string
  amount: number | null // qty×price; null у коэффициента (не в total)
  contribution: number | null // #65 Фаза 1: вклад коэффициента (calc); null у не-коэфф/не-применённого
  is_draft: boolean // manual→catalog: строка ссылается на драфт-позицию (без цены; unit_price=0, ждёт руководства)
  order: number
}

export interface Estimate {
  id: number
  object: number
  object_name: string
  title: string
  date: string | null
  currency: string
  note: string
  source_ref: string
  created_by: number | null
  created_by_name: string
  total: number // Σ amount без коэффициентов (драфт-строки дают 0)
  unpriced_lines: number // manual→catalog: сколько строк-драфтов без цены → «предварительный итог»
  lines: EstimateLine[]
  created_at: string
  updated_at: string
}

// ─────────────────────────── Смета (write, nested) ───────────────────────────

/** Строка сметы на запись — три режима: (а) work_item, (б) category+name (добавить в каталог), (в) свободная name. */
export interface EstimateLineWrite {
  work_item?: number | null
  category?: number | null // режим «б»: добавить позицию в каталог
  name?: string
  kind?: WorkItemKind
  unit?: string
  default_price?: string | null
  // D8: снапшот пути с фронта → BE хранит его (историчность на правке, не ре-деривит из каталога).
  section_name?: string
  subcategory_name?: string
  // #65 Фаза 1/2: зона коэффициента (для kind=coefficient).
  coeff_scope?: string
  coeff_scope_name?: string
  coeff_scope_section?: string
  uid?: string
  coeff_targets?: string[]
  quantity: string
  unit_price?: string
  position_no?: string
  order?: number
}

export interface EstimateWriteRequest {
  object: number
  title?: string
  date?: string | null
  currency?: string
  note?: string
  lines: EstimateLineWrite[]
}
