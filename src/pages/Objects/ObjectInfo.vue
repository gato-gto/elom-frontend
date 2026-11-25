<template>
  <div class="space-y-6">
      <!-- Loading state -->
      <div v-if="loading" class=" rounded shadow-sm">
        <div class="">
          <LoadingSpinner text="Загрузка информации об объекте..." :overlay="false" />
        </div>
      </div>

      <!-- Not found state -->
      <div v-else-if="!object" class=" rounded shadow-sm">
        <div class="text-center space-y-4">
          <svg class="w-16 h-16 mx-auto text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h2 class="text-2xl font-semibold">Объект не найден</h2>
          <p class="text-muted">
            Возможно объект был удалён или у вас нет доступа к его просмотру.
          </p>
          <button class="btn btn-primary" @click="router.push('/objects')">
            Список
          </button>
        </div>
      </div>

      <!-- Main content. D-030: без карточек-плиток и медных полос — шапка, факты списком, ссылки со счётчиками. -->
      <div v-else class="object-page">
        <header class="object-head">
          <div class="min-w-0">
            <h1 class="object-title">{{ object.name }}</h1>
            <p class="object-address">{{ object.address || 'Адрес не указан' }}</p>
            <div class="flex flex-wrap gap-2 mt-2">
              <span class="badge" :class="statusBadgeClass">{{ statusLabel }}</span>
              <span v-if="currentStageMeta" class="badge badge-ghost">{{ currentStageMeta.label }}</span>
            </div>
          </div>
          <div class="object-actions">
            <button v-if="canEdit" type="button" class="btn btn-primary btn-sm" @click="openEditModal">Редактировать</button>
            <button type="button" class="btn btn-ghost btn-sm" @click="router.push('/objects')">Назад</button>
          </div>
        </header>

        <section class="panel">
          <dl class="facts">
            <div class="fact">
              <dt>Ответственный</dt>
              <dd>{{ responsibleName }}</dd>
            </div>
            <div class="fact">
              <dt>Ключевое лицо</dt>
              <dd>
                {{ object.key_person_name || 'Не указано' }}
                <span v-if="object.key_person_contacts" class="fact-note">{{ object.key_person_contacts }}</span>
              </dd>
            </div>
            <div class="fact">
              <dt>Этап работ</dt>
              <dd>
                {{ currentStageMeta?.label || 'Не указан' }}
                <span v-if="currentStageMeta?.description" class="fact-note">{{ currentStageMeta.description }}</span>
              </dd>
            </div>
            <div class="fact">
              <dt>Сроки</dt>
              <dd>
                <span class="tabular-nums">{{ formatDate(object.date_start || null) }} — {{ formatDate(object.date_end || null) }}</span>
                <template v-if="projectProgress !== null">
                  <div class="term-bar" role="presentation"><div class="term-bar__value" :style="{ width: `${projectProgress}%` }" /></div>
                  <span class="fact-note">Прошло {{ projectProgress }} % срока</span>
                </template>
              </dd>
            </div>
            <div class="fact">
              <dt>Карта</dt>
              <dd>
                <a v-if="object.location_url" :href="object.location_url" target="_blank" rel="noopener noreferrer" class="link link-primary break-all">Открыть карту</a>
                <span v-else>Не указана</span>
              </dd>
            </div>
          </dl>
        </section>

        <section class="panel">
          <h2 class="panel-title">По объекту</h2>
          <ul class="object-links">
            <li v-for="action in quickActions" :key="action.key">
              <button type="button" class="object-link" :title="action.hint" @click="action.handler()">
                <span class="object-link__title">{{ action.title }}</span>
                <span v-if="action.count !== null" class="object-link__count">{{ action.count }}</span>
                <svg class="object-link__chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getIconPath('chevron_right')" />
                </svg>
              </button>
            </li>
          </ul>
        </section>

        <!-- F-1110 (ответ владельца 17): файлы проекта -->
        <ObjectFiles v-if="object" :object-id="object.id" :can-manage="canManageFiles" />
      </div>

    <!-- Modal for editing -->
    <Modal v-model="editModalOpen" title="Редактировать объект" size="lg" :closable="true">
      <ObjectForm :initial="object" @saved="onObjectSaved" @cancel="editModalOpen = false" />
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { STAGE_META } from '@/constants/stages'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { SiteObject as SiteObject } from '@/api/types'
import { useObjectsStore } from '@/stores/objects'
import { useAuthStore } from '@/stores/auth'
import { usePermissions } from '@/composables/usePermissions'
import { formatDate } from '@/utils/formatters'
import api from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { getIconPath } from '@/assets/icons'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { useErrorHandler } from '@/composables/useErrorHandler'
import Modal from '@/components/Modal.vue'
import ObjectForm from './ObjectForm.vue'
import ObjectFiles from '@/components/ObjectFiles.vue'
import { useUiStore } from '@/stores/ui'

const route = useRoute()
const router = useRouter()
const objectsStore = useObjectsStore()
const _authStore = useAuthStore()
const { can } = usePermissions()
const { handleLoadingError } = useErrorHandler()

const loading = ref(true)
const object = ref<SiteObject | null>(null)
const editModalOpen = ref(false)
const ui = useUiStore()

const objectId = computed(() => Number(route.params.id))

// F-1033: подписи и описания этапов — из единого источника
const stageDictionary: Record<string, { label: string; description: string }> = STAGE_META

// ✅ RBAC: проверка через permissions вместо хардкода ролей
const canEdit = computed(() => can('objects', 'edit'))
// F-1110: файлы проекта загружают/удаляют руководство (objects.delete — как «В архив») и ответственный объекта
// (Object.responsible — EmployeeProfile.id, сравниваем с profile_id пользователя). Сервер проверяет то же.
const canManageFiles = computed(() => {
  const me = _authStore.me as { is_superuser?: boolean; profile_id?: number } | null
  return !!me?.is_superuser || can('objects', 'delete')
    || (!!object.value?.responsible && object.value.responsible === me?.profile_id)
})

const statusLabel = computed(() => (object.value?.is_active ? 'Активный' : 'Неактивный'))
const statusBadgeClass = computed(() => (object.value?.is_active ? 'badge-success' : 'badge-error'))
const currentStageMeta = computed(() => (object.value?.current_stage ? stageDictionary[object.value.current_stage] : null))

const responsibleName = computed(() => object.value?.responsible_name || 'Не назначен')

const projectProgress = computed(() => {
  if (!object.value?.date_start || !object.value?.date_end) {
    return null
  }
  const start = new Date(object.value.date_start)
  const end = new Date(object.value.date_end)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return null
  }
  const now = new Date()
  if (now <= start) {return 0}
  if (now >= end) {return 100}
  return Math.min(100, Math.max(0, Math.round(((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100)))
})

// Статистика по объекту
// F-1073 (ревью D-030): число у ссылки = число строк в списке, который она открывает. «Закупки» — все
// закупки объекта, как в /purchases?object= (отменённые тоже — сколько их, сказано в подсказке);
// «Списания» — как в /writeoffs?object=. У «Остатков» числа нет: на клиенте нет числа строк остатков,
// а «материалов из закупок» — не то же самое (F-06).
// F-1074 (ревью): счётчики — отдельными запросами с ЯВНЫМИ параметрами (только object/status) и count с BE.
// Раньше fetchList общего стора подмешивал фильтры, оставшиеся от списка закупок (поиск, статус, даты), и
// число не совпадало со списком по ссылке; заодно ушёл потолок page_size=1000.
const objectStats = ref({ purchasesCount: 0, cancelledCount: 0, writeoffsCount: 0 })

async function countOf(url: string, params: Record<string, unknown>): Promise<number> {
  const { data } = await api.get(url, { params: { ...params, page_size: 1 } })
  return Number((data as { count?: number })?.count ?? 0)
}

async function loadStats(id: number) {
  const [purchasesCount, cancelledCount, writeoffsCount] = await Promise.all([
    countOf(endpoints.purchases.list, { object: id }),
    countOf(endpoints.purchases.list, { object: id, status: 'cancelled' }),
    countOf(endpoints.writeOffs.list, { object: id }),
  ])
  objectStats.value = { purchasesCount, cancelledCount, writeoffsCount }
}

type QuickAction = { key: string; title: string; count: number | null; hint?: string; handler: () => void }
const quickActions = computed<QuickAction[]>(() => [
  {
    key: 'purchases',
    title: 'Закупки',
    count: objectStats.value.purchasesCount,
    hint: objectStats.value.cancelledCount ? `В том числе отменённых: ${objectStats.value.cancelledCount}` : undefined,
    handler: () => { router.push({ path: '/purchases', query: { object: String(objectId.value) } }) }
  },
  {
    key: 'balances',
    title: 'Остатки материалов',
    count: null,
    handler: () => { router.push({ path: '/balances', query: { object: String(objectId.value) } }) }
  },
  {
    key: 'writeoffs',
    title: 'Списания',
    count: objectStats.value.writeoffsCount,
    handler: () => { router.push({ path: '/writeoffs', query: { object: String(objectId.value) } }) }
  }
])

async function loadObject(id: number) {
  loading.value = true
  try {
    const data = await objectsStore.fetchOne(id)
    object.value = data
    
    await loadStats(id)
  } catch (error) {
    await handleLoadingError(error, 'object')
    router.push('/objects')
  } finally {
    loading.value = false
  }
}

watch(
  objectId,
  (id) => {
    if (!id || Number.isNaN(id)) {
      router.push('/objects')
      return
    }
    loadObject(id)
  },
  { immediate: true }
)

function openEditModal() {
  editModalOpen.value = true
}

async function onObjectSaved() {
  editModalOpen.value = false
  ui.toast({ type: 'success', text: 'Объект обновлен' })
  // Перезагружаем данные объекта
  await loadObject(objectId.value)
}

onBeforeUnmount(() => {
  // Cleanup if needed
})
</script>

<style scoped>
/* D-030: страница объекта — шапка на фоне страницы, одна плоская панель на блок, без медных полос. */
.object-page { display: flex; flex-direction: column; gap: 1rem; }

.object-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}
.object-title { font-size: 1.375rem; font-weight: 600; line-height: 1.25; color: hsl(var(--bc)); margin: 0; overflow-wrap: anywhere; }
.object-address { margin: 0.25rem 0 0; color: hsl(var(--tx-2)); font-size: 0.875rem; overflow-wrap: anywhere; }
.object-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }

.panel {
  background: hsl(var(--b1));
  border: 1px solid hsl(var(--b3));
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
}
.panel-title { font-size: 0.9375rem; font-weight: 600; margin: 0 0 0.25rem; color: hsl(var(--bc)); }

.facts { display: grid; grid-template-columns: 1fr; margin: 0; }
.fact {
  display: grid;
  grid-template-columns: 9.5rem minmax(0, 1fr);
  gap: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid hsl(var(--b3));
}
.fact:last-child { border-bottom: 0; }
.fact dt { color: hsl(var(--tx-2)); font-size: 0.875rem; }
.fact dd { margin: 0; color: hsl(var(--bc)); font-size: 0.9375rem; overflow-wrap: anywhere; }
.fact-note { display: block; margin-top: 0.125rem; color: hsl(var(--tx-2)); font-size: 0.8125rem; }
@media (max-width: 639px) {
  .fact { grid-template-columns: 1fr; gap: 0.125rem; }
}

.term-bar { margin-top: 0.375rem; height: 4px; max-width: 16rem; border-radius: 2px; background: hsl(var(--b3)); overflow: hidden; }
.term-bar__value { height: 100%; background: hsl(var(--tx-2)); }

.object-links { list-style: none; margin: 0; padding: 0; }
.object-links li + li { border-top: 1px solid hsl(var(--b3)); }
.object-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  min-height: 44px;
  padding: 0.5rem 0;
  background: none;
  border: 0;
  text-align: left;
  cursor: pointer;
  color: hsl(var(--bc));
}
.object-link:hover .object-link__title { text-decoration: underline; text-underline-offset: 2px; }
.object-link:focus-visible { outline: 2px solid hsl(var(--p) / 0.5); outline-offset: 2px; border-radius: 4px; }
.object-link__title { flex: 1; font-size: 0.9375rem; }
.object-link__count { color: hsl(var(--tx-2)); font-variant-numeric: tabular-nums; }
.object-link__chevron { width: 1rem; height: 1rem; color: hsl(var(--tx-3)); flex-shrink: 0; }
</style>
