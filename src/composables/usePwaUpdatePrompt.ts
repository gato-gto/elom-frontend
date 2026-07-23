import { ref, computed, type Ref } from 'vue'

/**
 * F-511 — «Позже» для баннера обновления PWA должно ПЕРЕЖИВАТЬ перезагрузку.
 *
 * Было: dismiss() лишь ставил needRefresh=false. Ждущий service worker при этом никуда не
 * девался, и на СЛЕДУЮЩЕМ заходе useRegisterSW снова видел его и поднимал needRefresh — баннер
 * «Доступна новая версия» лез опять и опять. На iOS-PWA (standalone) это особенно заметно: ОС
 * часто перезапускает приложение, каждый перезапуск = свежая загрузка = баннер снова.
 *
 * Стало: откладывание запоминается в sessionStorage. В пределах сессии (в т.ч. через reload
 * той же вкладки и SPA-навигацию) баннер больше не показывается. Новый запуск приложения
 * (закрыли/открыли PWA) спросит ОДИН раз — так пользователь всё же узнаёт про обновление, но
 * его не долбит постоянно. Молча обновление НЕ ставим — это осознанный выбор владельца
 * (registerType: 'prompt'); «Обновить» по-прежнему требует явного действия.
 *
 * Логика вынесена из компонента, чтобы её можно было проверить юнит-тестом: сам PwaStatus.vue
 * тянет virtual:pwa-register/vue, который в vitest не резолвится.
 */
const POSTPONE_KEY = 'elom_pwa_update_postponed'

function readPostponed(): boolean {
  // Safari в приватном режиме исторически кидает на доступе к Storage — не роняем UI.
  try {
    return sessionStorage.getItem(POSTPONE_KEY) === '1'
  } catch {
    return false
  }
}

export function usePwaUpdatePrompt(needRefresh: Ref<boolean>, onApply: () => void) {
  const postponed = ref(readPostponed())

  // Баннер виден только если есть новая версия И пользователь её не отложил в этой сессии.
  const showUpdate = computed(() => needRefresh.value && !postponed.value)

  function applyUpdate() {
    try {
      sessionStorage.removeItem(POSTPONE_KEY)
    } catch {
      // приватный режим — откладывание жило только в памяти, снимать нечего
    }
    onApply()
  }

  function dismiss() {
    // Прячем сразу (в памяти на сессию) даже если Storage недоступен…
    postponed.value = true
    try {
      // …и переживаем reload, если доступен.
      sessionStorage.setItem(POSTPONE_KEY, '1')
    } catch {
      // приватный режим: остаётся только in-memory подавление до конца сессии
    }
  }

  return { showUpdate, applyUpdate, dismiss }
}
