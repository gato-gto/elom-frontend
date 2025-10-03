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
import type { MaterialCategoryLite } from '@/api/types'
import { useErrorHandler } from '@/composables/useErrorHandler'

const router = useRouter()
const route = useRoute()
const materialCategoriesStore = useMaterialCategoriesStore()

// Используем новый композабл для обработки ошибок
const { handleFormError } = useErrorHandler()

const isEdit = computed(() => !!route.params.id)
const categoryId = computed(() => isEdit.value ? Number(route.params.id) : null)

// Конфигурация формы
const formConfig: GenericFormConfig = {
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
      validation: {
        minLength: 2,
        maxLength: 128
      }
    },
    {
      key: 'parent',
      type: 'select',
      label: 'Родительская категория',
      placeholder: '— выберите родительскую категорию (необязательно) —',
      required: false,
      options: [
        { value: '', label: 'Без родительской категории' },
        ...materialCategoriesStore.selectOptions.filter(option => 
          !isEdit.value || option.value !== categoryId.value
        )
      ],
      order: 2,
      help: 'Выберите родительскую категорию для создания иерархии'
    }
  ],
  
  submitText: isEdit.value ? 'Сохранить изменения' : 'Создать категорию',
  cancelText: 'Отмена',
  showCancel: true
}

// Начальные данные
const initialData = computed(() => {
  if (isEdit.value && materialCategoriesStore.items.length > 0) {
    const category = materialCategoriesStore.items.find(c => c.id === categoryId.value)
    return {
      name: category?.name || '',
      parent: category?.parent || ''
    }
  }
  return {
    name: '',
    parent: ''
  }
})

// Загрузка данных
onMounted(async () => {
  // Загружаем список категорий для выбора родительской категории
  if (materialCategoriesStore.items.length === 0) {
    await materialCategoriesStore.fetchList()
  }
  
  // Если редактируем, загружаем данные категории
  if (isEdit.value && categoryId.value) {
    try {
      await materialCategoriesStore.fetchOne(categoryId.value)
    } catch (error) {
      await handleFormError(error, 'category')
      router.push('/materials/categories')
    }
  }
})

// Обработка отправки формы
async function handleSubmit(data: any) {
  try {
    const categoryData = {
      name: data.name,
      parent: data.parent ? Number(data.parent) : undefined
    }
    
    if (isEdit.value && categoryId.value) {
      await materialCategoriesStore.update(categoryId.value, categoryData)
    } else {
      await materialCategoriesStore.create(categoryData)
    }
    
    router.push('/materials/categories')
  } catch (error) {
    await handleFormError(error, 'category')
  }
}

// Отмена
function handleCancel() {
  router.push('/materials/categories')
}
</script>

<style scoped>
.form-container {
  padding: 1rem;
}
</style>