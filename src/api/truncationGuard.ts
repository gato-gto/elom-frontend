/**
 * F-1031 · центральный детектор усечённых «грузим всё» ответов (класс F-510 / F-1028-L).
 *
 * 57 мест в 28 файлах грузят справочники `page_size: 1000` и считают ответ ПОЛНЫМ. Когда записей станет
 * больше лимита, DRF молча отдаст первую страницу + `next` — селект покажет не все материалы/объекты,
 * колонка вместо названия напечатает ID, и никто этого не заметит: F-510-алярм в base.ts работает только в dev
 * и только для 3 точек. Здесь — ОДИН перехватчик на все вызовы клиента: если запрос был с намерением
 * «всё сразу» (page_size ≥ LOAD_ALL_THRESHOLD) и в ответе есть `next`, это не пагинация, а усечение →
 * console.error всегда (и в проде) + один тост-предупреждение на эндпоинт за сессию (не спамим).
 *
 * Это сигнализация, а не лечение: лечение — серверный поиск/lazy-select (F-787/F-1028-L), отложено
 * владельцем до роста данных. Детектор гарантирует, что рост данных не пройдёт незамеченным.
 */
export const LOAD_ALL_THRESHOLD = 500

const notified = new Set<string>()

/** Только для тестов: сброс дедупа «один тост на эндпоинт». */
export function _resetTruncationGuard(): void {
  notified.clear()
}

function requestedPageSize(config: { url?: string; params?: unknown }): number {
  const p = config.params as Record<string, unknown> | undefined
  const fromParams = p && p.page_size !== undefined ? Number(p.page_size) : NaN
  if (Number.isFinite(fromParams)) { return fromParams }
  const m = (config.url ?? '').match(/[?&]page_size=(\d+)/)
  return m ? Number(m[1]) : NaN
}

function endpointPath(url: string | undefined): string {
  return (url ?? '').split('?')[0]
}

/**
 * @returns true, если ответ распознан как усечённый «грузим всё» (и сигнал выдан).
 */
export function detectTruncation(
  config: { url?: string; params?: unknown; method?: string },
  data: unknown,
  notify: (text: string) => void,
  // eslint-disable-next-line no-console -- намеренно: сигнал в прод-консоль (см. докстринг)
  log: (msg: string) => void = (m) => console.error(m),
): boolean {
  if (config.method && config.method.toLowerCase() !== 'get') { return false }
  const pageSize = requestedPageSize(config)
  if (!Number.isFinite(pageSize) || pageSize < LOAD_ALL_THRESHOLD) { return false }
  if (!data || typeof data !== 'object' || Array.isArray(data)) { return false }
  const d = data as { next?: unknown; count?: unknown; results?: unknown }
  if (!d.next || !Array.isArray(d.results)) { return false }
  const path = endpointPath(config.url)
  const shown = d.results.length
  const total = Number(d.count)
  const msg = `[F-1031] ${path}: справочник УСЕЧЁН — показано ${shown} из ${Number.isFinite(total) ? total : '?'} ` +
    `(page_size=${pageSize}, есть next). Экран считает этот список полным. Нужен серверный поиск (F-787/F-1028-L).`
  log(msg)
  if (!notified.has(path)) {
    notified.add(path)
    notify(`Список «${path}» показан не полностью (${shown} из ${Number.isFinite(total) ? total : '?'}). ` +
      'Сообщите администратору: справочник перерос лимит загрузки.')
  }
  return true
}
