// F-1093 (T3; ответы владельца 1 и 2, 24.11): кнопка «Удалить» у закупок и списаний.
// Правило — то же, что на сервере (purchases.permissions.can_delete_purchase, stock WriteOffsPermission):
//   admin и manager (… .delete_all) — всё; бригадир (… .delete_own) — свои черновики закупок (статус «Новая»,
//   создал сам) и свои списания (создал сам); склад — ничего. Архив (закрытый период) не удаляется.
// Объект «свой» сервер проверяет сам; список и так показывает только доступные объекты.
import { formatNumberClean } from '@/utils/formatters'

export interface DeletePerms {
  isSuperuser: boolean
  has: (codename: string) => boolean
  meId: number | null | undefined
}

interface PurchaseLike {
  status?: string
  created_by?: number | null
  is_archived?: boolean
  purchase_no?: string | null
  id: number
  object_name?: string | null
}

interface WriteOffLike {
  created_by?: number | null
  is_archived?: boolean
  quantity?: string | number | null
  unit_code?: string | null
  material_name?: string | null
  object_name?: string | null
}

export function canDeletePurchase(p: PurchaseLike, a: DeletePerms): boolean {
  if (p.is_archived) { return false }
  if (a.isSuperuser || a.has('purchases.delete_all')) { return true }
  return a.has('purchases.delete_own') && p.status === 'new' && a.meId != null && p.created_by === a.meId
}

export function canDeleteWriteOff(w: WriteOffLike, a: DeletePerms): boolean {
  if (w.is_archived) { return false }
  if (a.isSuperuser || a.has('writeoffs.delete_all')) { return true }
  return a.has('writeoffs.delete_own') && a.meId != null && w.created_by === a.meId
}

/** Вопрос перед удалением закупки: что произойдёт с остатком. */
export function purchaseDeleteQuestion(p: PurchaseLike): string {
  const name = p.purchase_no || `№ ${p.id}`
  if (p.status === 'completed') {
    const where = p.object_name ? ` объекта «${p.object_name}»` : ' объекта'
    return `Удалить закупку ${name}? Её приход уйдёт с остатка${where}.`
  }
  return `Удалить закупку ${name}?`
}

/** Вопрос перед удалением списания: материал вернётся на остаток. */
export function writeOffDeleteQuestion(w: WriteOffLike): string {
  // «Остаток … увеличится на 5 м» — без согласования числа («1 м вернётся» / «5 м вернутся»)
  const qty = [formatNumberClean(w.quantity ?? null), w.unit_code || ''].join(' ').trim()
  const what = w.material_name ? ` «${w.material_name}»` : ''
  const where = w.object_name ? ` объекта «${w.object_name}»` : ' объекта'
  return `Удалить списание? Остаток${where} увеличится на ${qty}${what}.`
}
