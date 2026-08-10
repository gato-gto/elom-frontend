<!-- F-997 (FE-кнопка импорта, хендофф A/F-766): импорт «отчёта цен» из xlsx.
     2 шага (зеркало BE): выбрал файл → dry-run (разбор БЕЗ записи, превью) → выбрал объект → commit.
     Идемпотентность E7: повтор того же файла BE отвечает 200 «already imported» — показываем и не дублируем.
     D9-гейт BE: файл с новыми позициями каталога требует work_items.create — предупреждаем заранее. -->
<template>
  <Modal :model-value="modelValue" title="Импорт сметы из Excel" @update:model-value="close">
    <div class="grid gap-3">
      <!-- Шаг 1: файл -->
      <div>
        <label class="label py-1"><span class="label-text">Файл «отчёта цен» (.xlsx)</span></label>
        <input
          ref="fileInput" type="file" accept=".xlsx"
          class="file-input file-input-bordered w-full"
          :disabled="parsing || committing"
          aria-label="Файл сметы xlsx"
          @change="onFileChange"
        />
        <p class="text-xs text-muted mt-1">Формат — как у экспорта сметы (round-trip): разделы, позиции, «Итого».</p>
      </div>

      <div v-if="parsing" class="flex items-center gap-2 text-sm text-muted">
        <span class="loading loading-spinner loading-sm" /> Разбираем файл…
      </div>

      <!-- Шаг 2: превью dry-run -->
      <template v-if="preview && !parsing">
        <div class="bg-base-200/60 rounded-lg p-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <span class="text-muted">Разделов</span><span class="font-mono text-right">{{ preview.groups }}</span>
          <span class="text-muted">Позиций</span><span class="font-mono text-right">{{ preview.lines }}</span>
          <span class="text-muted">Коэффициентов</span><span class="font-mono text-right">{{ preview.coefficients }}</span>
          <span class="text-muted">Новых позиций каталога</span>
          <span class="font-mono text-right" :class="preview.would_create_items ? 'text-warning font-semibold' : ''">{{ preview.would_create_items }}</span>
        </div>

        <div v-if="preview.already_imported" class="alert alert-warning py-2 text-sm">
          Этот файл уже импортирован ранее — повторный импорт смету НЕ продублирует.
        </div>
        <div v-if="preview.would_create_items" class="text-xs text-warning">
          Файл создаст новые позиции каталога — нужно право каталога (руководство).
        </div>
        <ul v-if="preview.warnings.length" class="text-xs text-muted list-disc pl-4 max-h-24 overflow-y-auto">
          <li v-for="(w, i) in preview.warnings" :key="i" class="break-words">{{ w }}</li>
        </ul>

        <!-- Объект (обязателен) + название -->
        <div>
          <label class="label py-1"><span class="label-text">Объект <span class="text-error">*</span></span></label>
          <select v-model="objectId" class="select select-bordered w-full" :class="{ 'select-error': objectError }" aria-label="Целевой объект">
            <option value="" disabled>— выберите объект —</option>
            <option v-for="o in objectsStore.items" :key="o.id" :value="o.id">{{ o.name }}</option>
          </select>
          <p v-if="preview.object_hint" class="text-xs text-muted mt-1">В файле указан: «{{ preview.object_hint }}»{{ objectId ? '' : ' — совпадения нет, выберите вручную' }}</p>
          <p v-if="objectError" class="text-xs text-error mt-1">{{ objectError }}</p>
        </div>
        <div>
          <label class="label py-1"><span class="label-text">Название сметы</span></label>
          <input v-model="title" type="text" maxlength="256" class="input input-bordered w-full" placeholder="НЗ" aria-label="Название сметы" />
        </div>
      </template>

      <div v-if="error" class="alert alert-error py-2 text-sm break-words">{{ error }}</div>

      <div class="flex justify-end gap-2 mt-1">
        <button type="button" class="btn btn-outline" :disabled="committing" @click="close(false)">Отмена</button>
        <button
          type="button" class="btn btn-primary" :disabled="!preview || parsing || committing"
          @click="commit"
        >
          <span v-if="committing" class="loading loading-spinner loading-sm" />
          Импортировать
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '@/components/Modal.vue'
import { useObjectsStore } from '@/stores/objects'
import { useUiStore } from '@/stores/ui'
import { importEstimateDryRun, importEstimateCommit } from '@/stores/estimates'
import type { EstimateImportPreview } from '@/api/types/estimates'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  imported: [id: number]
}>()

const objectsStore = useObjectsStore()
const ui = useUiStore()

const fileInput = ref<HTMLInputElement | null>(null)
const file = ref<File | null>(null)
const preview = ref<EstimateImportPreview | null>(null)
const objectId = ref<number | ''>('')
const title = ref('')
const parsing = ref(false)
const committing = ref(false)
const error = ref('')
const objectError = ref('')

function resetState() {
  file.value = null; preview.value = null; objectId.value = ''; title.value = ''
  parsing.value = false; committing.value = false; error.value = ''; objectError.value = ''
  if (fileInput.value) { fileInput.value.value = '' }
}
watch(() => props.modelValue, open => { if (open) { resetState() } })

function close(v = false) {
  if (committing.value) { return }
  emit('update:modelValue', v)
}

/** DRF-ошибка → человекочитаемая строка (detail / first field error). */
function errText(e: unknown): string {
  const data = (e as { response?: { data?: Record<string, unknown> } })?.response?.data
  if (!data) { return 'Не удалось выполнить запрос' }
  if (typeof data.detail === 'string') { return data.detail }
  const first = Object.values(data)[0]
  if (Array.isArray(first)) { return String(first[0]) }
  return typeof first === 'string' ? first : 'Файл не разобран — проверьте формат'
}

async function onFileChange(ev: Event) {
  const f = (ev.target as HTMLInputElement).files?.[0] || null
  file.value = f; preview.value = null; error.value = ''; objectError.value = ''
  if (!f) { return }
  parsing.value = true
  try {
    const p = await importEstimateDryRun(f)
    preview.value = p
    title.value = p.title_hint || ''
    // Прематч объекта по хинту из шапки файла (точное имя; иначе ручной выбор).
    const hit = p.object_hint
      ? objectsStore.items.find(o => o.name.trim().toLowerCase() === p.object_hint.trim().toLowerCase())
      : undefined
    objectId.value = hit ? hit.id : ''
  } catch (e) {
    error.value = errText(e)
  } finally {
    parsing.value = false
  }
}

async function commit() {
  if (!file.value || !preview.value) { return }
  if (!objectId.value) { objectError.value = 'Выберите объект — смета привязывается к объекту.'; return }
  objectError.value = ''; error.value = ''
  committing.value = true
  try {
    const res = await importEstimateCommit(file.value, Number(objectId.value), title.value.trim() || undefined)
    if (res.id) {
      ui.toast({ type: 'success', text: `Смета импортирована (${res.lines} строк)` })
      emit('imported', res.id)
      emit('update:modelValue', false)
    } else {
      // 200 already imported (E7) — дубля нет, сообщаем и закрываем.
      ui.toast({ type: 'info', text: 'Этот файл уже был импортирован — дубль не создан' })
      emit('update:modelValue', false)
    }
  } catch (e) {
    error.value = errText(e)
  } finally {
    committing.value = false
  }
}
</script>
