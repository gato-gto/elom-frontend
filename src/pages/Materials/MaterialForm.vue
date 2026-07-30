<!-- src/pages/Materials/MaterialForm.vue -->
<template>
  <div class="material-form">
    <!-- Current photo preview -->
    <div v-if="currentPhotoUrl" class="rounded-lg mb-6">
      <div class="">
        <h3 class="text-lg font-semibold mb-4">Текущее фото</h3>
        <div class="flex items-center gap-4">
          <div class="relative">
            <img
                :src="currentPhotoUrl"
                alt="Текущее фото"
                class="h-24 w-24 object-cover rounded-lg border"
            />
            <button
                type="button"
                class="absolute -top-2 -right-2 btn btn-error btn-xs btn-circle"
                :disabled="deletingPhoto"
                @click="onDeletePhoto"
                aria-label="Удалить фото"
                title="Удалить фото"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div>
            <p class="text-sm text-muted">Текущее фото материала</p>
            <p class="text-xs text-subtle">Нажмите на крестик для удаления</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Generic Form -->
    <GenericForm
        :config="formConfig"
        :initial-data="initialFormData"
        :on-submit="handleSubmit"
        :on-cancel="handleCancel"
        :validate-on-change="true"
        :reset-on-submit="false"
        @cancelled="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from 'vue'
import { todayLocal } from '@/utils/formatters'
import {useMaterialsStore, uploadPhoto, deletePhoto} from '@/stores/materials'
import {useUnitsStore} from '@/stores/units'
import {useMaterialCategoriesStore} from '@/stores/materialCategories'
import type {Material, MaterialRequest} from '@/api/types'
import type {GenericFormConfig} from '@/types/generic'
import GenericForm from '@/components/GenericForm.vue'
import {useErrorHandler} from '@/composables/useErrorHandler'
import {useUiStore} from '@/stores/ui'

const props = defineProps<{
  initial?: Material | null
}>()

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const materialsStore = useMaterialsStore()
const unitsStore = useUnitsStore()
const materialCategoriesStore = useMaterialCategoriesStore()
const {handleFormError} = useErrorHandler()

const ui = useUiStore()
const deletingPhoto = ref(false)
const currentPhotoUrl = ref<string | null>(null)
// F-890: удаление текущего фото откладываем до сохранения — иначе «Отмена» не вернёт удалённое фото.
const photoMarkedForDeletion = ref(false)

// Form configuration
const formConfig = computed<GenericFormConfig<MaterialRequest & { photo?: File }>>(() => ({
  title: props.initial ? 'Редактировать материал' : 'Новый материал',
  subtitle: 'Заполните информацию о материале',

  fields: [
    {
      key: 'name',
      type: 'input',
      label: 'Название материала',
      placeholder: 'Введите название материала',
      required: true,
      order: 1,
      width: 'half',
      validation: {
        minLength: 2,
        maxLength: 200
      }
    },
    {
      key: 'sku',
      type: 'input',
      code: true, // A-08 (F-522): iOS не капитализирует/не исправляет код
      label: 'SKU (Артикул)',
      placeholder: 'Введите артикул или код материала',
      order: 2,
      width: 'half'
    },
    {
      key: 'category',
      type: 'select',
      label: 'Категория',
      placeholder: '— выберите категорию —',
      options: categoryOptions.value,
      order: 3,
      width: 'half'
    },
    {
      key: 'created_date',
      type: 'date',
      label: 'Дата создания',
      required: true,
      order: 4,
      width: 'half'
    },
    {
      key: 'manufacturer',
      type: 'input',
      label: 'Производитель/Бренд',
      placeholder: 'Введите название производителя',
      order: 5,
      width: 'half'
    },
    {
      key: 'is_active',
      type: 'checkbox',
      label: 'Статус',
      order: 6,
      width: 'half',
      checkboxLabel: 'Активен'
    },
    {
      key: 'description',
      type: 'textarea',
      label: 'Описание',
      placeholder: 'Введите описание материала',
      order: 7,
      width: 'full',
      validation: {
        maxLength: 1000
      }
    },
    {
      key: 'default_unit',
      type: 'select',
      label: 'Базовая единица измерения',
      placeholder: '— выберите единицу —',
      options: unitOptions.value,
      required: true,
      order: 8,
      width: 'full',
      help: 'Базовая единица будет использоваться для автоматического округления значений (например, 1000г → 1кг).',
      // F-250: раньше форма подставляла жёстко default_unit:1 — если единицы с id=1 нет,
      // create падал на 400, а если есть — навязывался произвольный неверный дефолт.
      validation: {
        custom: (v: any) => (!v || v === 0) ? 'Выберите базовую единицу измерения' : null
      }
    },
    {
      key: 'photo',
      type: 'file',
      label: 'Фото материала',
      accept: 'image/*',
      order: 10,
      width: 'full',
      help: 'Загрузите изображение материала (максимум 8 МБ)'
    }
  ],
  submitText: props.initial ? 'Обновить' : 'Создать',
  cancelText: 'Отмена',
  showCancel: true
}))

// Initial form data
const initialFormData = computed<MaterialRequest & { photo?: File }>(() => {
  if (props.initial) {
    return {
      name: props.initial.name,
      sku: props.initial.sku || '',
      category: props.initial.category,
      default_unit: props.initial.default_unit,
      created_date: props.initial.created_date || todayLocal(),
      description: props.initial.description || '',
      manufacturer: props.initial.manufacturer || '',
      is_active: props.initial.is_active ?? true,
      photo: undefined // Photo will be handled separately
    }
  }

  return {
    name: '',
    sku: '',
    category: undefined,
    default_unit: 0,  // F-250: пусто → пользователь обязан выбрать (см. validation.custom выше)
    created_date: todayLocal(),
    description: '',
    manufacturer: '',
    is_active: true,
    photo: undefined // Photo will be handled separately
  }
})

// Computed options
const categoryOptions = computed(() => materialCategoriesStore.selectOptions)
const unitOptions = computed(() => unitsStore.selectOptions)

// Methods
function onDeletePhoto() {
  // F-890: НЕ удаляем на сервере немедленно — иначе «Отмена»/закрытие модалки не вернёт фото (потеря
  // данных, а фото — единственное доказательство закупки). Помечаем к удалению + чистим превью;
  // фактический DELETE выполняется в handleSubmit ТОЛЬКО при сохранении.
  photoMarkedForDeletion.value = true
  currentPhotoUrl.value = null
}

async function handleSubmit(formData: MaterialRequest & { photo?: File }) {
  try {
    let materialId: number

    // Extract photo file from form data
    const photoFile = formData.photo
    delete formData.photo // Remove photo from form data before saving

    // First, save the material data (without photo)
    if (props.initial) {
      await materialsStore.update(props.initial.id, formData)
      materialId = props.initial.id
    } else {
      const newMaterial = await materialsStore.create(formData)
      materialId = newMaterial.id
    }

    // F-890: применяем ОТЛОЖЕННОЕ удаление фото только при сохранении (edit). Ошибка удаления —
    // не фатальна (материал уже сохранён), просто логируем.
    if (photoMarkedForDeletion.value && props.initial?.id) {
      try { await deletePhoto(props.initial.id) } catch (e) { console.error('Photo delete failed (non-fatal):', e) }
      photoMarkedForDeletion.value = false
    }

    // F-889: фото — НЕ фатально. Материал УЖЕ сохранён; если POST фото падает (HEIC/большой файл/сеть),
    // НЕ бросаем ошибку — иначе форма остаётся открытой и повтор «Создать» плодит ДУБЛЬ материала
    // (SKU авто-генерится, имена не уникальны). Показываем предупреждение и закрываем (как PurchaseForm).
    if (photoFile) {
      try {
        await uploadPhoto(materialId, photoFile)
      } catch (photoErr) {
        console.error('Photo upload failed (non-fatal):', photoErr)
        ui.toast({ type: 'info', text: 'Материал сохранён, но фото не загрузилось — можно догрузить позже через «Редактировать»' })
      }
    }

    emit('saved')
  } catch (error) {
    await handleFormError(error, 'material')
    throw error
  }
}

function handleCancel() {
  photoMarkedForDeletion.value = false  // F-890: отменяем отложенное удаление фото
  emit('cancel')
}

// Load data on mount
onMounted(async () => {
  // Load initial photo URL
  photoMarkedForDeletion.value = false  // F-890: свежий монтаж — сбрасываем отложенное удаление
  if (props.initial?.photo_url) {
    currentPhotoUrl.value = props.initial.photo_url
  }

  // Load units and categories
  // F-718: units=14 > мобильного page_size 10 → на МОБИЛЕ дропдаун default_unit резался до 10 (нет
  // метров). Грузим единицы полным списком БЕЗУСЛОВНО (guard length===0 оставлял усечённый стор).
  const promises: Promise<unknown>[] = [unitsStore.fetchList({ page_size: 1000 })]
  if (materialCategoriesStore.items.length === 0) {
    promises.push(materialCategoriesStore.fetchList())
  }

  if (promises.length > 0) {
    await Promise.all(promises)
  }
})
</script>