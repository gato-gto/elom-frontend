/**
 * B21 (аудит 23.11) — не терять введённое при случайном закрытии.
 *
 * Пока `isActive()` истинно (в форме что-то вводили и ещё не сохранили):
 *  - перезагрузка/закрытие вкладки — браузер спрашивает сам (beforeunload);
 *  - переход на другую страницу внутри приложения (в т.ч. жест «назад» на iPhone) — спрашиваем confirm.
 * Нативный confirm() — как во всех списках приложения (удаление и т.п.), своё окно не изобретаем.
 */
import { getCurrentInstance, onBeforeUnmount } from 'vue'
import type { Router } from 'vue-router'

export const DISCARD_MESSAGE = 'Закрыть без сохранения? Введённые данные пропадут.'

export function confirmDiscard(): boolean {
  return window.confirm(DISCARD_MESSAGE)
}

// Ревью B21 (R2): реестр смонтированных форм — для явных действий ухода (выход из системы), которые сначала
// меняют состояние (стирают токены), а потом переходят. Спрашивать нужно ДО действия и один раз.
const activeChecks = new Set<() => boolean>()
let discardConfirmed = false
const routersWithReset = new WeakSet<object>()

export function hasUnsavedChanges(): boolean {
  for (const check of activeChecks) { if (check()) { return true } }
  return false
}

/** Перед явным уходом (выход): нет несохранённого → true; иначе спросить. OK → следующий переход не
 *  спрашивает повторно (разово, сбрасывается после любой навигации). */
/** Ревью N2: явный уход не состоялся (выход упал до перехода) — снять разовый обход, иначе следующий
 *  уход с несохранённой формой прошёл бы без вопроса. */
export function resetLeaveBypass(): void {
  discardConfirmed = false
}

export function confirmLeaveIfUnsaved(): boolean {
  if (!hasUnsavedChanges()) { return true }
  if (!confirmDiscard()) { return false }
  discardConfirmed = true
  return true
}

export function useUnsavedGuard(isActive: () => boolean): void {
  activeChecks.add(isActive)
  onBeforeUnmount(() => { activeChecks.delete(isActive) })

  // Event, а не BeforeUnloadEvent: eslint-конфиг (no-undef) не знает DOM-типов (их проверяет TS).
  const onBeforeUnload = (e: Event) => {
    if (!isActive()) { return }
    e.preventDefault()
    // Старые Safari/Chrome показывают диалог только при заданном returnValue.
    ;(e as unknown as { returnValue: string }).returnValue = ''
  }
  window.addEventListener('beforeunload', onBeforeUnload)
  onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))

  // Роутер берём из приложения, а не через import { onBeforeRouteLeave }: компонент живёт и вне
  // <router-view> (юнит-тесты, где vue-router подменён целиком). Глобальный guard снимается вместе
  // с компонентом. Смена только query (фильтры списка) — не уход со страницы, не спрашиваем.
  const router = getCurrentInstance()?.appContext.config.globalProperties.$router as Router | undefined
  if (router && typeof router.beforeEach === 'function') {
    const removeGuard = router.beforeEach((to, from) => {
      if (to.path === from.path || !isActive()) { return true }
      return discardConfirmed ? true : confirmDiscard()
    })
    onBeforeUnmount(removeGuard)
    // разовый обход после confirmLeaveIfUnsaved гасим после любой навигации (один хук на роутер)
    if (!routersWithReset.has(router) && typeof router.afterEach === 'function') {
      routersWithReset.add(router)
      router.afterEach(() => { discardConfirmed = false })
    }
  }
}
