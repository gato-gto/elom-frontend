<template>
  <div class="form-container">
    <GenericForm
      :config="formConfig"
      :initial-data="initialData"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMaterialCategoriesStore } from '@/stores/materialCategories'
import GenericForm from '@/components/GenericForm.vue'
import type { GenericFormConfig } from '@/types/generic'
import type { MaterialCategory } from '@/api/types'
import { useErrorHandler } from '@/composables/useErrorHandler'

// FE-CRITICAL (F-067): форма используется И в модалке (List передаёт :initial и
// слушает @saved/@cancel), И по маршруту. Раньше режим определялся ТОЛЬКО по
// route.params.id, поэтому редактирование из модалки шло как СОЗДАНИЕ → дубликаты.
const props = defineProps<{ initial?: MaterialCategory | null }>()
const emit = defineEmits<{ (e: 'saved', value?: unknown): void; (e: 'cancel'): void }>()

const router = useRouter()
const route = useRoute()
const materialCategoriesStore = useMaterialCategoriesStore()
const { handleFormError } = useErrorHandler()

// Открыто в модалке, если prop `initial` передан (в т.ч. null — создание в модалке).
const isModal = computed(() => props.initial !== undefined)
const routeId = computed(() => (route.params.id ? Number(route.params.id) : null))
const categoryId = computed(() => props.initial?.id ?? routeId.value)
const isEdit = computed(() => categoryId.value != null)

// Конфигурация формы — computed, чтобы реагировать на загрузку категорий (иначе
// селект родителя оставался пустым) и на режим создание/редактирование.
const formConfig = computed<GenericFormConfig>(() => ({
  title: isEdit.value ? 'Редактировать категорию' : 'Новая категория',
  subtitle: 'Заполните информацию о категории материалов',
  fields: [
    {
      key: 'name',
      type: 'input',
      label: 'Название категории',
      placeholder: 'Введите название категории',
      required: true,
      order: 1,
      validation: { minLength: 2, maxLength: 128 },
    },
    {
      key: 'parent',
      type: 'select',
      label: 'Родительская категория',
      placeholder: '— выберите родительскую категорию (необязательно) —',
      required: false,
      options: [
        { value: '', label: 'Без родительской категории' },
        ...materialCategoriesStore.selectOptions.filter(
          (option: { value: number | string }) => !isEdit.value || option.value !== categoryId.value,
        ),
      ],
      order: 2,
      help: 'Выберите родительскую категорию для создания иерархии',
    },
  ],
  submitText: isEdit.value ? 'Сохранить изменения' : 'Создать категорию',
  cancelText: 'Отмена',
  showCancel: true,
}))

// Начальные данные: из prop (модалка) либо из стора (маршрут).
const initialData = computed(() => {
  const src =
    props.initial ??
    (isEdit.value ? materialCategoriesStore.items.find((c) => c.id === categoryId.value) : null)
  return { name: src?.name || '', parent: (src as { parent?: number | string })?.parent || '' }
})

onMounted(async () => {
  // Категории нужны для селекта родителя.
  if (materialCategoriesStore.items.length === 0) {
    await materialCategoriesStore.fetchList()
  }
  // При маршрутном редактировании подгружаем конкретную категорию.
  if (!isModal.value && isEdit.value && categoryId.value) {
    try {
      await materialCategoriesStore.fetchOne(categoryId.value)
    } catch (error) {
      await handleFormError(error, 'category')
      router.push('/material_categories')
    }
  }
})

async function handleSubmit(data: { name: string; parent?: number | string }) {
  try {
    const categoryData = {
      name: data.name,
      parent: data.parent ? Number(data.parent) : undefined,
    }
    if (isEdit.value && categoryId.value) {
      await materialCategoriesStore.update(categoryId.value, categoryData)
    } else {
      await materialCategoriesStore.create(categoryData)
    }
    if (isModal.value) {
      emit('saved')
    } else {
      router.push('/material_categories')
    }
  } catch (error) {
    await handleFormError(error, 'category')
  }
}

function handleCancel() {
  if (isModal.value) {
    emit('cancel')
  } else {
    router.push('/material_categories')
  }
}
</script>

<style scoped>
.form-container {
  padding: 1rem;
}
</style>
