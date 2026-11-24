/**
 * B21: стек открытых модалок. Escape/Tab слушаются на document, и при вложенных окнах (подтверждение
 * новых материалов внутри формы закупки) их получали ОБЕ модалки — Escape закрывал и форму целиком.
 * Клавиатуру обрабатывает только верхняя (последняя открытая) модалка.
 */
const stack: symbol[] = []

export function pushModal(id: symbol): void {
  removeModal(id)
  stack.push(id)
}

export function removeModal(id: symbol): void {
  const i = stack.lastIndexOf(id)
  if (i >= 0) { stack.splice(i, 1) }
}

export function isTopModal(id: symbol): boolean {
  return stack.length > 0 && stack[stack.length - 1] === id
}
