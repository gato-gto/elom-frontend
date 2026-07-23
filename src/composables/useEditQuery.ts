/**
 * F-507 — открытие модалки редактирования по `?edit=:id`.
 *
 * Зачем: маршруты `/:id/edit` рендерили ПУСТУЮ форму (F-505) — формы получают данные только через
 * prop `:initial`, который передаёт список, открывая модалку. Поэтому такие маршруты ведут на список
 * с `?edit=:id`, а список открывает модалку уже с записью.
 *
 * Почему composable, а не копипаста в каждом списке: списков семь, и логика должна быть одинаковой —
 * в частности ожидание асинхронной загрузки. Наивный `find` сразу после монтирования промахивается,
 * потому что список ещё грузится; поэтому здесь есть одноразовый watch на `store.items`.
 *
 * Если записи нет на загруженной странице (другая страница пагинации, нет прав) — молча остаёмся на
 * списке: это лучше, чем пустая форма или ложная ошибка.
 */
import { watch } from 'vue'
import { useRoute } from 'vue-router'

export function useEditQuery<T extends { id: number }>(
  store: { items?: T[] },
  openEdit: (item: T) => void,
): void {
  const route = useRoute()
  // Компонент могут монтировать вне роутера (юнит-тесты) — тогда просто ничего не делаем.
  if (!route) { return }

  const raw = route.query?.edit
  const id = Number(Array.isArray(raw) ? raw[0] : raw)
  if (!Number.isFinite(id) || id <= 0) { return }

  let opened = false
  const tryOpen = () => {
    if (opened) { return }
    const found = (store.items || []).find(x => x.id === id)
    if (found) {
      opened = true
      openEdit(found)
    }
  }

  // Запись могла уже быть в сторе (переход внутри SPA) — пробуем сразу…
  tryOpen()
  // …иначе ждём первую загрузку списка (холодный заход по ссылке).
  const stop = watch(
    () => store.items,
    () => {
      tryOpen()
      if (opened) { stop() }
    },
    { deep: false },
  )
}
