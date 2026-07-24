<template>
  <div v-if="modelValue" class="modal modal-open">
    <div
      ref="modalBox"
      class="modal-box w-full max-w-none mx-4 my-4"
      :class="sizeClass"
      role="dialog"
      aria-modal="true"
      :aria-label="title || undefined"
      tabindex="-1"
    >
      <div v-if="title || $slots.header" class="modal-header flex items-center justify-between mb-4 no-print">
        <h3 v-if="title" class="font-bold text-lg modal-title">{{ title }}</h3>
        <slot name="header" />
        <button
          v-if="closable"
          class="modal-close-btn"
          type="button"
          aria-label="Закрыть"
          title="Закрыть"
          @click="handleClose"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.25" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      
      <div class="modal-content">
        <slot />
      </div>
      
      <div v-if="$slots.footer" class="modal-action">
        <slot name="footer" />
      </div>
    </div>
    <!-- бэкдроп НЕ закрывает форму: закрытие только крестиком, чтобы не терять введённые данные -->
    <div v-if="backdrop" class="modal-backdrop"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref, nextTick, onBeforeUnmount } from 'vue'
import { lockBodyScroll, unlockBodyScroll } from '@/utils/scrollLock'

interface Props {
  modelValue: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl'
  closable?: boolean
  backdrop?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'update:modelValue', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closable: true,
  backdrop: true
})

const emit = defineEmits<Emits>()

const sizeClass = computed(() => {
  const sizeMap = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    '3xl': 'sm:max-w-3xl',
    '4xl': 'sm:max-w-4xl',
    '5xl': 'sm:max-w-5xl',
    '6xl': 'sm:max-w-6xl',
    '7xl': 'sm:max-w-7xl'
  }
  return sizeMap[props.size]
})

const handleClose = () => {
  emit('close')
  emit('update:modelValue', false)
}

// F-300 + F-508: закрытие крестиком И по Escape. Клик по фону (бэкдроп) НЕ закрывает.
// Почему так: случайный клик мимо формы — самая частая причина потери введённых данных,
// поэтому бэкдроп остаётся выключенным (F-300). Escape же — осознанное намеренное действие
// и стандартное ожидание от диалога, поэтому владелец вернул его (F-508, 2026-07-23).
// focus-trap (Tab) сохранён: модал остаётся доступным с клавиатуры.
const modalBox = ref<HTMLElement | null>(null)
let lastActive: HTMLElement | null = null

function focusables(): HTMLElement[] {
  if (!modalBox.value) { return [] }
  const sel = 'a[href], button:not([disabled]), textarea:not([disabled]), ' +
    'input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  return Array.from(modalBox.value.querySelectorAll<HTMLElement>(sel))
    .filter((el) => el.offsetParent !== null)
}

function onKeydown(e: KeyboardEvent) {
  // F-508: Escape закрывает форму (как крестик). Уважает prop `closable`: если закрытие
  // запрещено (напр. незавершённая операция), Escape тоже не закрывает.
  if (e.key === 'Escape') {
    if (props.closable) {
      e.preventDefault()
      handleClose()
    }
    return
  }
  if (e.key !== 'Tab') { return }
  const items = focusables()
  const active = document.activeElement as HTMLElement | null
  if (items.length === 0) {
    e.preventDefault()
    modalBox.value?.focus()
    return
  }
  const first = items[0]
  const last = items[items.length - 1]
  const inside = !!modalBox.value && !!active && modalBox.value.contains(active)
  if (e.shiftKey && (active === first || !inside)) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && active === last) {
    e.preventDefault()
    first.focus()
  }
}

// F-508: watch с `immediate` — иначе модалка, смонтированная СРАЗУ открытой, не вешала
// обработчик клавиш вообще: не работали ни Escape, ни focus-trap (watch без immediate
// не срабатывает, если значение не менялось). `wasOpen === undefined` — это первый
// (immediate) вызов: тогда ветку закрытия не выполняем, чтобы не увести фокус при монтировании.
let scrollLocked = false

watch(
  () => props.modelValue,
  async (isOpen, wasOpen) => {
    if (isOpen) {
      lastActive = document.activeElement as HTMLElement | null
      document.addEventListener('keydown', onKeydown)
      // A-02 (F-519): блокируем прокрутку фона — иначе на iOS он ползёт под модалкой.
      lockBodyScroll()
      scrollLocked = true
      await nextTick()
      const items = focusables()
      ;(items[0] || modalBox.value)?.focus()
    } else if (wasOpen !== undefined) {
      document.removeEventListener('keydown', onKeydown)
      if (scrollLocked) { unlockBodyScroll(); scrollLocked = false }
      lastActive?.focus?.()
      lastActive = null
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  // страховка: если модалку размонтировали открытой — снять блокировку.
  if (scrollLocked) { unlockBodyScroll(); scrollLocked = false }
})
</script>

<style scoped>
/* F-300: чётко заметный крестик закрытия (был btn-ghost — почти невидим).
   Обведённый, с ховером и copper-фокусом, по дизайн-языку. */
.modal-close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  /* A-03 (F-520): на тач-устройствах тач-цель ≥44pt (Apple HIG). На десктопе 36px — мыши хватает. */
  border-radius: 0.375rem;
  border: 1px solid hsl(var(--bc) / 0.25);
  background: hsl(var(--b2));
  color: hsl(var(--bc));
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  cursor: pointer;
}
@media (pointer: coarse) {
  .modal-close-btn {
    width: 2.75rem;  /* 44px — тач-цель Apple HIG */
    height: 2.75rem;
  }
}
.modal-close-btn:hover {
  background: color-mix(in oklab, var(--color-error) 12%, hsl(var(--b1)));
  border-color: var(--color-error);
  color: var(--color-error);
}
.modal-close-btn:focus-visible {
  outline: none;
  border-color: hsl(var(--p));
  box-shadow: 0 0 0 2px hsl(var(--p) / 0.4);
}

@media print {
  /* КРИТИЧНО: Показываем модальное окно с максимальной специфичностью */
  html body .modal,
  html body .modal.modal-open,
  body #app .modal,
  body #app .modal.modal-open,
  #app .modal,
  #app .modal.modal-open,
  body .modal,
  body .modal.modal-open,
  .modal.modal-open,
  .modal {
    position: static !important;
    background: transparent !important;
    display: block !important;
    visibility: visible !important;
    padding: 0 !important;
    margin: 0 !important;
    inset: auto !important;
    z-index: auto !important;
    opacity: 1 !important;
    height: auto !important;
    width: 100% !important;
  }

  /* Показываем modal-box с максимальной специфичностью */
  html body .modal .modal-box,
  html body .modal.modal-open .modal-box,
  body #app .modal .modal-box,
  body #app .modal.modal-open .modal-box,
  #app .modal .modal-box,
  #app .modal.modal-open .modal-box,
  body .modal .modal-box,
  body .modal.modal-open .modal-box,
  .modal.modal-open .modal-box,
  .modal .modal-box,
  .modal-box {
    position: static !important;
    background: white !important;
    box-shadow: none !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
    max-width: 100% !important;
    width: 100% !important;
    display: block !important;
    visibility: visible !important;
    height: auto !important;
    overflow: visible !important;
  }

  /* Показываем modal-content с максимальной специфичностью */
  html body .modal .modal-box .modal-content,
  html body .modal.modal-open .modal-box .modal-content,
  body #app .modal .modal-box .modal-content,
  body #app .modal.modal-open .modal-box .modal-content,
  #app .modal .modal-box .modal-content,
  #app .modal.modal-open .modal-box .modal-content,
  body .modal .modal-box .modal-content,
  body .modal.modal-open .modal-box .modal-content,
  .modal.modal-open .modal-box .modal-content,
  .modal .modal-box .modal-content,
  .modal-box .modal-content,
  .modal-content {
    display: block !important;
    visibility: visible !important;
    padding: 0 !important;
    margin: 0 !important;
    height: auto !important;
    width: 100% !important;
    overflow: visible !important;
  }

  .no-print {
    display: none !important;
    visibility: hidden !important;
  }
}
</style>
