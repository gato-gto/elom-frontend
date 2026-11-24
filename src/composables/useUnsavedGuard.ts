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

export function useUnsavedGuard(isActive: () => boolean): void {
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
    const removeGuard = router.beforeEach((to, from) => (
      to.path !== from.path && isActive() ? confirmDiscard() : true
    ))
    onBeforeUnmount(removeGuard)
  }
}
