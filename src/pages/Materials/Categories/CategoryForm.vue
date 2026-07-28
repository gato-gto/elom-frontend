<template>
  <div class="form-container">
    <GenericForm
      :config="formConfig"
      :initial-data="initialData"
      :on-submit="handleSubmit"
      :on-cancel="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMaterialCategoriesStore } from '@/stores/materialCategories'
import GenericForm from '@/components/GenericForm.vue'
import type { GenericFormConfig } from '@/types/generic'
import type { MaterialCategory } from '@/api/types'
import { useErrorHandler } from '@/composables/useErrorHandler'

// FE-CRITICAL (F-067): форма используется И в модалке (List передаёт :initial и
// слушает @saved/@cancel), И по маршруту. Раньше режим определялся ТОЛЬКО по
// route.params.id, поэтому редактирование из модалки шло как СОЗДАНИЕ → дубликаты.
//
// F-509: у формы теперь ОДИН источник данных — prop `initial`. Маршрут `/…/:id/edit`
// больше не монтирует эту форму (F-505: он редиректит на список с ?edit=:id, модалку
// открывает useEditQuery), поэтому чтение route.params.id было вторым, всегда пустым
// источником. Роутом остаётся только `/material_categories/create` — режим создания.
const props = defineProps<{ initial?: MaterialCategory | null }>()
const emit = defineEmits<{ (e: 'saved', value?: unknown): void; (e: 'cancel'): void }>()

const router = useRouter()
const materialCategoriesStore = useMaterialCategoriesStore()
const { handleFormError } = useErrorHandler()

// Открыто в модалке, если prop `initial` передан (в т.ч. null — создание в модалке).
const isModal = computed(() => props.initial !== undefined)
const categoryId = computed(() => props.initial?.id ?? null)
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

// F-509: начальные данные — ровно из одного места, prop `initial` (null = создание).
// Поиска «той же записи» в сторе больше нет: сторовый items перетирается любым fetchList
// (stores/base.ts), поэтому он не был надёжным источником для формы.
const initialData = computed(() => {
  const src = props.initial
  return { name: src?.name || '', parent: (src as { parent?: number | string })?.parent || '' }
})

onMounted(async () => {
  // Категории нужны для селекта родителя.
  if (materialCategoriesStore.items.length === 0) {
    await materialCategoriesStore.fetchList()
  }
  // F-509: догрузки «по id из роута» больше нет — редактирование приходит только пропсом
  // `initial`, то есть запись уже загружена списком. Маршрутом открывается лишь создание.
})

async function handleSubmit(data: { name: string; parent?: number | string }) {
  try {
    const categoryData = {
      name: data.name,
      // F-260: очищенный родитель шлём как null (не undefined), иначе axios вырезает
      // ключ из PATCH и открепление категории молча теряется. Сериализатор принимает null.
      parent: data.parent ? Number(data.parent) : null,
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
    throw error  // F-873: пробрасываем наверх — иначе GenericForm не отрисует inline-ошибки полей
                 // (дубль имени, 403 и т.п.), как это делают остальные формы (напр. ObjectForm).
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
