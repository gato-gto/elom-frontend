<template>
  <section class="panel">
    <div class="flex items-center justify-between gap-2 mb-3">
      <h2 class="panel-title mb-0">Файлы проекта</h2>
      <label v-if="canManage" class="btn btn-sm btn-outline" :class="{ 'btn-disabled': busy }">
        <span v-if="busy" class="loading loading-spinner loading-xs"></span>
        Загрузить файл
        <input type="file" class="hidden" :accept="ACCEPT" :disabled="busy" @change="onPick" />
      </label>
    </div>
    <p v-if="canManage" class="text-xs text-muted mb-3">PDF или изображение (JPEG, PNG, WebP), до 50 МБ.</p>

    <div v-if="loading" class="text-sm text-subtle py-4">Загрузка…</div>
    <div v-else-if="files.length === 0" class="text-sm text-subtle py-4">Файлов пока нет</div>
    <ul v-else class="divide-y divide-base-300">
      <li v-for="f in files" :key="f.id" data-test="file-row" class="py-2 flex items-start gap-3">
        <div class="flex-1 min-w-0">
          <a :href="f.url || undefined" target="_blank" rel="noopener" class="link link-primary break-words">{{ f.name }}</a>
          <div class="text-xs text-muted">
            {{ formatSize(f.size) }} · {{ f.uploaded_by_name || '—' }} · {{ formatDateTime(f.created_at) }}
          </div>
        </div>
        <button v-if="canManage" data-test="file-delete" class="btn btn-ghost btn-xs text-error" :disabled="busy"
                :aria-label="`Удалить файл ${f.name}`" @click="remove(f)">
          Удалить
        </button>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
// F-1110 (ответ владельца 17): файлы проекта в карточке объекта. Ссылки — подписанные и временные (сервер, F-029);
// загружают и удаляют руководство и ответственный объекта (canManage), видят участники объекта (сервер — 404 чужим).
import { onMounted, onUnmounted, ref, watch } from 'vue'
import api from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { useUiStore } from '@/stores/ui'
import { parseApiError } from '@/utils/errorHandler'
import { formatDateTime } from '@/utils/formatters'

interface ObjectFileRow {
  id: number
  name: string
  size: number
  content_type: string
  uploaded_by_name: string | null
  created_at: string
  url: string | null
}

const props = defineProps<{ objectId: number; canManage: boolean }>()
const ui = useUiStore()
const ACCEPT = 'application/pdf,image/jpeg,image/png,image/webp'
const MAX_SIZE = 50 * 1024 * 1024

const files = ref<ObjectFileRow[]>([])
const loading = ref(false)
const busy = ref(false)

function formatSize(bytes: number): string {
  const fmt = (n: number) => n.toLocaleString('ru-RU', { maximumFractionDigits: 1 })
  if (bytes < 1024) { return `${bytes} Б` }
  if (bytes < 1024 * 1024) { return `${fmt(bytes / 1024)} КБ` }
  return `${fmt(bytes / (1024 * 1024))} МБ`
}

// F-1116 (ревью F-1110, LOW): ссылки на файлы подписаны на 1 час — карточка, открытая дольше, давала по клику
// «Срок действия ссылки истёк». Список (а с ним ссылки) обновляется, если он старше LINK_REFRESH_MS: по таймеру и
// при возвращении на вкладку (на iOS таймеры фоновой вкладки спят).
const LINK_REFRESH_MS = 45 * 60 * 1000
let loadedAt = 0
let timer: ReturnType<typeof setInterval> | undefined

function refreshIfStale() {
  if (document.visibilityState !== 'hidden' && Date.now() - loadedAt >= LINK_REFRESH_MS) { load() }
}

async function load() {
  loading.value = true
  try {
    const { data } = await api.get<ObjectFileRow[]>(endpoints.objects.files(props.objectId))
    files.value = Array.isArray(data) ? data : []
    loadedAt = Date.now()
  } catch (e) {
    ui.toast({ type: 'error', text: parseApiError(e).detail || 'Не удалось загрузить список файлов' })
  } finally {
    loading.value = false
  }
}

async function onPick(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) { return }
  try {
    if (file.size > MAX_SIZE) {
      ui.toast({ type: 'error', text: 'Файл больше 50 МБ.' })
      return
    }
    busy.value = true
    const fd = new FormData()
    fd.append('file', file)
    await api.post(endpoints.objects.files(props.objectId), fd)
    ui.toast({ type: 'success', text: `Файл «${file.name}» загружен` })
    await load()
  } catch (e) {
    ui.toast({ type: 'error', text: parseApiError(e).detail || 'Не удалось загрузить файл' })
  } finally {
    busy.value = false
    try { input.value = '' } catch { /* jsdom/старые браузеры */ }
  }
}

async function remove(f: ObjectFileRow) {
  if (!confirm(`Удалить файл «${f.name}»?`)) { return }
  busy.value = true
  try {
    await api.delete(endpoints.objects.file(props.objectId, f.id))
    files.value = files.value.filter(x => x.id !== f.id)
    ui.toast({ type: 'success', text: 'Файл удалён' })
  } catch (e) {
    ui.toast({ type: 'error', text: parseApiError(e).detail || 'Не удалось удалить файл' })
  } finally {
    busy.value = false
  }
}

watch(() => props.objectId, load)
onMounted(() => {
  load()
  timer = setInterval(refreshIfStale, 60 * 1000)
  document.addEventListener('visibilitychange', refreshIfStale)
})
onUnmounted(() => {
  if (timer) { clearInterval(timer) }
  document.removeEventListener('visibilitychange', refreshIfStale)
})
</script>
