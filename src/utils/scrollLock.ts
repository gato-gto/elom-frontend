/**
 * A-02 (F-519) + APPLE-2 (F-996) — блокировка прокрутки фона при открытой модалке.
 *
 * История: F-519 фиксировал body (`position:fixed; top:-scrollY`) против iOS scroll-bleed. Но это —
 * известный триггер iOS-Safari-бага (репорты MUI#3638, angular/material#11382, OutSystems): нативный
 * поповер <select> якорится по ДОКУМЕНТНЫМ координатам, а смещённый на -scrollY body уводит меню к
 * верхней части экрана ровно на глубину прокрутки (владелец: «выпадающее меню прилипает к верху» на
 * iPhone; на Android бага нет). F-996: лок БЕЗ смещения координат — `overflow:hidden` на html И body
 * (современный iOS 15+ это лочит; scroll-bleed древних iOS ушёл вместе с ними — таргет проекта
 * iPhone 14/15) + `overscroll-behavior:none` против резинового прокрута. Позицию прокрутки помним и
 * восстанавливаем защитно (без смещения она и не должна теряться).
 *
 * Счётчик ссылок: вложенные/несколько модалок не должны разблокировать раньше времени —
 * реально снимаем лок только когда закрылась ПОСЛЕДНЯЯ.
 */
let lockCount = 0
let savedScrollY = 0

export function lockBodyScroll(): void {
  if (typeof document === 'undefined') { return }
  lockCount++
  if (lockCount > 1) { return } // уже заблокировано другой модалкой

  savedScrollY = window.scrollY || document.documentElement.scrollTop || 0
  // ВАЖНО (F-996): НИКАКОГО position:fixed/top на body — смещение координат ломает якорь
  // нативных iOS-поповеров (<select>). Только overflow-лок, на обоих корнях.
  document.documentElement.style.overflow = 'hidden'
  const body = document.body
  body.style.overflow = 'hidden'
  body.style.overscrollBehavior = 'none'
}

export function unlockBodyScroll(): void {
  if (typeof document === 'undefined') { return }
  if (lockCount === 0) { return }
  lockCount--
  if (lockCount > 0) { return } // ещё есть открытые модалки

  document.documentElement.style.overflow = ''
  const body = document.body
  body.style.overflow = ''
  body.style.overscrollBehavior = ''
  // Защитно вернуть прокрутку (при overflow-локе не сбрасывается; страховка от браузерных сюрпризов).
  // try/catch: в jsdom (тесты) window.scrollTo кидает «Not implemented».
  try { window.scrollTo(0, savedScrollY) } catch { /* среда без реального скролла */ }
}

/** Только для тестов: сбросить состояние между кейсами. */
export function _resetScrollLock(): void {
  lockCount = 0
  savedScrollY = 0
}
