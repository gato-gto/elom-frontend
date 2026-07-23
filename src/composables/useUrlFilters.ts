/**
 * F-506 — единый механизм «URL ↔ состояние списка».
 *
 * Проблема (измерена вживую, не выведена из кода): механизма синхронизации НЕ БЫЛО НИ В ОДНУ СТОРОНУ.
 *  - холодный заход на /writeoffs?object=347 → параметр не читался вообще: в запрос к API уходило
 *    `?page=1&page_size=20&ordering=-date` БЕЗ object, строк 11 (столько же, сколько без фильтра);
 *  - смена фильтра в UI → фильтр корректно уходил в API (строк 11 → 7), но URL оставался /writeoffs.
 * Поэтому deep-link и кнопки «назад/вперёд» не могли работать в принципе.
 *
 * Живёт в GenericList — через него идут ВСЕ 13 списочных экранов, поэтому одно место чинит класс.
 *
 * Порядок инициализации детерминированный:
 *   1) читаем query из URL;
 *   2) кладём значения прямо в store.filters БЕЗ запроса (Object.assign, не setFilters) —
 *      чтобы ПЕРВЫЙ же fetchList страницы ушёл уже отфильтрованным, без лишнего запроса
 *      и без гонки «пустой запрос → потом отфильтрованный»;
 *   3) список грузит сама страница (её onMounted), подхватывая filters из стора.
 * Затирания не происходит: base.fetchList собирает параметры как `...filters.value`,
 * поэтому любой последующий fetchList сохраняет применённый фильтр.
 *
 * Справочники ждать не требуется: значение фильтра применяется сразу (запрос уже верный),
 * а подпись в контроле появляется реактивно, когда справочник догрузится. Ждать справочник
 * ради отображения означало бы задержать сам отфильтрованный список.
 */
import { watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FilterConfig } from '@/types/generic'

/** Ключи состояния, которые синхронизируем помимо объявленных фильтров. */
const STATE_KEYS = ['search', 'ordering'] as const

/** Приведение значения из URL (всегда строка) к типу, который ждёт фильтр/бэкенд. */
export function coerceFilterValue(raw: string, cfg?: FilterConfig): unknown {
  if (raw === '') { return '' }
  if (!cfg) {
    // search/ordering — строки как есть
    return raw
  }
  switch (cfg.type) {
    case 'number':
      return Number.isNaN(Number(raw)) ? raw : Number(raw)
    case 'checkbox':
      return raw === 'true' || raw === '1'
    case 'multiselect':
      return raw.split(',').map(v => coerceOption(v, cfg))
    case 'select':
      return coerceOption(raw, cfg)
    default:
      // text, date — строка
      return raw
  }
}

/**
 * Для select/multiselect тип берём ИЗ ОПЦИЙ конфига: если их value числовые,
 * приводим к числу. Иначе строковое значение из URL не совпадёт со значением опции
 * и контрол покажется пустым, хотя фильтр применён.
 */
function coerceOption(raw: string, cfg: FilterConfig): unknown {
  const opts = cfg.options || []
  const hasNumericOption = opts.some(o => typeof o.value === 'number')
  if (hasNumericOption && raw !== '' && !Number.isNaN(Number(raw))) { return Number(raw) }
  return raw
}

function isEmpty(v: unknown): boolean {
  return v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)
}

/** Сериализация значения фильтра в query-строку. */
function serialize(v: unknown): string | undefined {
  if (isEmpty(v)) { return undefined }
  if (Array.isArray(v)) { return v.join(',') }
  if (typeof v === 'boolean') { return v ? 'true' : 'false' }
  return String(v)
}

/** Пустая заглушка, когда роутера нет (изолированное монтирование компонента, юнит-тесты). */
const NOOP_SYNC = {
  applyFromUrl: () => false,
  buildQuery: () => ({} as Record<string, string>),
  parseQuery: () => ({ patch: {} as Record<string, unknown>, page: undefined as number | undefined }),
}

export function useUrlFilters(store: any, getFilterConfigs: () => FilterConfig[] | undefined) {
  const route = useRoute()
  const router = useRouter()

  // GenericList — общий компонент, его монтируют и вне роутера (юнит-тесты, изолированный рендер).
  // Жёстко требовать роутер он не должен: без него просто нет синхронизации с URL.
  if (!route || !router) { return NOOP_SYNC }

  // защита от цикла «пишем URL → срабатывает watch на query → применяем → снова пишем URL»
  let syncing = false

  const configByKey = (): Record<string, FilterConfig> => {
    const map: Record<string, FilterConfig> = {}
    for (const f of getFilterConfigs() || []) { map[f.key] = f }
    return map
  }

  /** Разобрать query URL в патч для store.filters (+ страница). */
  function parseQuery(): { patch: Record<string, unknown>; page?: number } {
    const cfgs = configByKey()
    const patch: Record<string, unknown> = {}
    for (const [key, rawVal] of Object.entries(route.query)) {
      const raw = Array.isArray(rawVal) ? rawVal[0] : rawVal
      if (raw === null || raw === undefined) { continue }
      const isKnown = key in cfgs || (STATE_KEYS as readonly string[]).includes(key)
      if (!isKnown) { continue }   // чужие/служебные параметры (напр. ?edit=) не трогаем
      patch[key] = coerceFilterValue(String(raw), cfgs[key])
    }
    const page = route.query.page ? Number(route.query.page) : undefined
    return { patch, page: Number.isFinite(page) && (page as number) > 0 ? page : undefined }
  }

  /** Собрать query из текущего состояния стора. */
  function buildQuery(): Record<string, string> {
    const cfgs = configByKey()
    const q: Record<string, string> = {}
    const filters = store.filters || {}
    for (const key of Object.keys(filters)) {
      const known = key in cfgs || (STATE_KEYS as readonly string[]).includes(key)
      if (!known) { continue }
      const s = serialize(filters[key])
      if (s !== undefined) { q[key] = s }
    }
    const page = store.pagination?.page
    if (page && page > 1) { q.page = String(page) }
    // сохраняем чужие параметры (напр. ?edit=), чтобы не потерять их при синхронизации
    for (const [k, v] of Object.entries(route.query)) {
      if (!(k in q) && !(k in cfgs) && !(STATE_KEYS as readonly string[]).includes(k) && k !== 'page') {
        q[k] = Array.isArray(v) ? String(v[0]) : String(v)
      }
    }
    return q
  }

  /** Применить состояние из URL к стору БЕЗ запроса (запрос сделает страница/следующий fetch). */
  function applyFromUrl(triggerFetch: boolean) {
    const { patch, page } = parseQuery()
    if (Object.keys(patch).length === 0 && !page) { return false }
    syncing = true
    Object.assign(store.filters, patch)
    if (page && store.pagination) { store.pagination.page = page }
    syncing = false
    if (triggerFetch && typeof store.fetchList === 'function') { store.fetchList() }
    return true
  }

  // 1) ИНИЦИАЛИЗАЦИЯ: применяем URL синхронно на setup — до того, как страница вызовет fetchList,
  //    чтобы первый же запрос ушёл отфильтрованным.
  applyFromUrl(false)

  // 2) СОСТОЯНИЕ → URL: любое изменение фильтров/страницы отражаем в адресной строке
  //    (replace, чтобы не засорять историю на каждый чих; переходы «назад/вперёд» по страницам
  //    остаются рабочими за счёт watch на route.query ниже).
  onMounted(() => {
    watch(
      () => [JSON.stringify(store.filters), store.pagination?.page],
      () => {
        if (syncing) { return }
        const q = buildQuery()
        const current = JSON.stringify(route.query)
        if (JSON.stringify(q) === current) { return }
        syncing = true
        router.replace({ query: q }).catch(() => { /* навигация могла быть прервана — не критично */ })
        // снимаем флаг после того, как роутер обновит query
        Promise.resolve().then(() => { syncing = false })
      },
      { deep: true },
    )

    // 3) URL → СОСТОЯНИЕ: кнопки «назад/вперёд» и внешняя смена ссылки
    watch(
      () => route.query,
      () => {
        if (syncing) { return }
        applyFromUrl(true)
      },
      { deep: true },
    )
  })

  return { applyFromUrl, buildQuery, parseQuery }
}
