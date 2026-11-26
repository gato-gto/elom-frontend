/**
 * F-1129 (найдено при гейтах F-1128): отложенный вызов debounce переживал компонент. Уход со страницы отчёта в
 * течение 300 мс после смены фильтра слал запрос уже «ничьего» отчёта; в тестах таймер прежнего экземпляра стрелял
 * внутри следующего теста (StockReport: нестабильный «переход оборотка → списания» под нагрузкой). Теперь debounce,
 * созданный в области эффектов (setup компонента, composable, setup-стор), снимает таймер при её уничтожении.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { effectScope } from 'vue'
import { debounce, cancellableDebounce } from '@/utils/debounce'

/** Создаёт значение внутри области (scope.run возвращает undefined только для остановленной области). */
function inScope<T>(scope: ReturnType<typeof effectScope>, make: () => T): T {
  const v = scope.run(make)
  if (v === undefined) { throw new Error('область остановлена') }
  return v
}

describe('debounce и область эффектов (F-1129)', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('создан в области — после её уничтожения отложенный вызов не срабатывает', () => {
    const fn = vi.fn()
    const scope = effectScope()
    const d = inScope(scope, () => debounce(fn, 300))
    d('a')
    scope.stop()
    vi.advanceTimersByTime(1000)
    expect(fn).not.toHaveBeenCalled()
  })

  it('создан в области — пока она жива, срабатывает один раз с последними аргументами', () => {
    const fn = vi.fn()
    const scope = effectScope()
    const d = inScope(scope, () => debounce(fn, 300))
    d('a'); d('b')
    vi.advanceTimersByTime(299)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(fn.mock.calls).toEqual([['b']])
    scope.stop()
  })

  it('создан вне области (уровень модуля) — работает как раньше', () => {
    const fn = vi.fn()
    const d = debounce(fn, 300)
    d(1)
    vi.advanceTimersByTime(300)
    expect(fn.mock.calls).toEqual([[1]])
  })

  it('cancellableDebounce: уничтожение области тоже снимает таймер, cancel() — как раньше', () => {
    const fn = vi.fn()
    const scope = effectScope()
    const { debounced } = inScope(scope, () => cancellableDebounce(fn, 300))
    debounced()
    scope.stop()
    vi.advanceTimersByTime(1000)
    expect(fn).not.toHaveBeenCalled()
    const { debounced: d2, cancel } = cancellableDebounce(fn, 300)
    d2(); cancel()
    vi.advanceTimersByTime(1000)
    expect(fn).not.toHaveBeenCalled()
  })
})
