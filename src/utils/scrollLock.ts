/**
 * A-02 (F-519) — блокировка прокрутки фона при открытой модалке.
 *
 * Зачем: на iOS `overflow:hidden` на body НЕ останавливает инерционный скролл — фон продолжает
 * ползти под открытой модалкой (scroll-bleed). Надёжный приём для iOS — зафиксировать body
 * (`position:fixed`) со смещением на текущую прокрутку и вернуть её при разблокировке.
 *
 * Счётчик ссылок: вложенные/несколько модалок не должны разблокировать раньше времени —
 * реально снимаем фиксацию только когда закрылась ПОСЛЕДНЯЯ.
 */
let lockCount = 0
let savedScrollY = 0

export function lockBodyScroll(): void {
  if (typeof document === 'undefined') { return }
  lockCount++
  if (lockCount > 1) { return } // уже заблокировано другой модалкой

  savedScrollY = window.scrollY || document.documentElement.scrollTop || 0
  const body = document.body
  body.style.position = 'fixed'
  body.style.top = `-${savedScrollY}px`
  body.style.left = '0'
  body.style.right = '0'
  body.style.width = '100%'
  body.style.overflow = 'hidden'
}

export function unlockBodyScroll(): void {
  if (typeof document === 'undefined') { return }
  if (lockCount === 0) { return }
  lockCount--
  if (lockCount > 0) { return } // ещё есть открытые модалки

  const body = document.body
  body.style.position = ''
  body.style.top = ''
  body.style.left = ''
  body.style.right = ''
  body.style.width = ''
  body.style.overflow = ''
  // Вернуть прокрутку туда, где пользователь был до открытия.
  // try/catch: в jsdom (тесты) window.scrollTo кидает «Not implemented».
  try { window.scrollTo(0, savedScrollY) } catch { /* среда без реального скролла */ }
}

/** Только для тестов: сбросить состояние между кейсами. */
export function _resetScrollLock(): void {
  lockCount = 0
  savedScrollY = 0
}
