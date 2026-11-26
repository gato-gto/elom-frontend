// D-2 (корзина, 26.11; docs/project-state/D2_TRASH_DESIGN.md в BE): «Удалить» → «В корзину» у закупок и списаний.
// Кто может — решает СЕРВЕР, поле `can_trash` в ответе (руководство — всё; ответственный и склад — своё в течение 3 ч
// с создания; свой черновик закупки — всегда; закрытый период — никто). Окно в часах считает только сервер, поэтому FE
// правило не дублирует (раньше дублировал — F-1093/F-1096 — и расходился бы с сервером на границе окна).
import { formatNumberClean } from '@/utils/formatters'

/** Сколько документ лежит в корзине до окончательной очистки — как TRASH_RETENTION_DAYS на сервере. */
export const TRASH_RETENTION_DAYS = 7

interface Trashable {
  can_trash?: boolean | null
  is_archived?: boolean
}

interface PurchaseLike {
  id: number
  status?: string
  purchase_no?: string | null
  object_name?: string | null
}

interface WriteOffLike {
  quantity?: string | number | null
  unit_code?: string | null
  material_name?: string | null
  object_name?: string | null
}

export function canTrash(doc: Trashable): boolean {
  return doc.can_trash === true && !doc.is_archived
}

const RETURN_HINT = `Руководство сможет вернуть {it} в течение ${TRASH_RETENTION_DAYS} дней.`

/** Вопрос перед отправкой закупки в корзину: что станет с остатком и что её можно вернуть. */
export function purchaseTrashQuestion(p: PurchaseLike): string {
  const name = p.purchase_no || `№ ${p.id}`
  const hint = RETURN_HINT.replace('{it}', 'её')
  if (p.status === 'completed') {
    const where = p.object_name ? ` объекта «${p.object_name}»` : ' объекта'
    return `Отправить закупку ${name} в корзину? Её приход уйдёт с остатка${where}. ${hint}`
  }
  return `Отправить закупку ${name} в корзину? ${hint}`
}

/** Вопрос перед отправкой списания в корзину: материал вернётся на остаток. */
export function writeOffTrashQuestion(w: WriteOffLike): string {
  // «Остаток … увеличится на 5 м» — без согласования числа («1 м вернётся» / «5 м вернутся»)
  const qty = [formatNumberClean(w.quantity ?? null), w.unit_code || ''].join(' ').trim()
  const what = w.material_name ? ` «${w.material_name}»` : ''
  const where = w.object_name ? ` объекта «${w.object_name}»` : ' объекта'
  return `Отправить списание в корзину? Остаток${where} увеличится на ${qty}${what}. ${RETURN_HINT.replace('{it}', 'его')}`
}
