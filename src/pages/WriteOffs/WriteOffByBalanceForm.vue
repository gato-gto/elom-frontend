<template>
  <Modal
    :size="'4xl'"
    :model-value="isOpen"
    title="Внести остатки (инвентаризация)"
    @close="$emit('close')"
  >
    <GenericForm
      :config="formConfig"
      :initial-data="initialFormData"
      :on-submit="handleSubmit"
      :on-cancel="() => $emit('close')"
      :reset-on-submit="true"
    />
  </Modal>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useObjectsStore } from '@/stores/objects'
import { useMaterialsStore } from '@/stores/materials'
import { useUnitsStore } from '@/stores/units'
import type { SiteObject, Material, Unit } from '@/api/types'
import type { GenericFormConfig } from '@/types/generic'
import GenericForm from '@/components/GenericForm.vue'
import Modal from '@/components/Modal.vue'
import { useFormErrorHandler } from '@/composables/useErrorHandler'
import api from '@/api/client'
import { endpoints } from '@/api/endpoints'

defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ close: []; success: [] }>()

const objectsStore = useObjectsStore()
const materialsStore = useMaterialsStore()
const unitsStore = useUnitsStore()
const { submitForm } = useFormErrorHandler()

const objectOptions = computed(() => objectsStore.items.map((o: SiteObject) => ({ value: o.id, label: o.name })))
const materialOptions = computed(() => materialsStore.items.map((m: Material) => ({ value: m.id, label: m.name })))
const unitOptions = computed(() => [
  { value: 0, label: '— выберите единицу —' },
  ...unitsStore.items.map((u: Unit) => ({ value: u.id, label: `${u.name} (${u.code})` }))
])

const formConfig = computed<GenericFormConfig>(() => ({
  title: '',
  subtitle: 'Введите ФАКТИЧЕСКИЙ остаток материала на объекте — система вычислит расход (книжный остаток − факт) и оформит списание на разницу.',
  fields: [
    {
      key: 'date', label: 'Дата инвентаризации', type: 'date' as const, required: true,
      validation: { custom: (v: any) => !v ? 'Дата обязательна' : null }
    },
    {
      key: 'object', label: 'Объект', type: 'select' as const, required: true,
      options: objectOptions.value, placeholder: '— выберите объект —',
      validation: { custom: (v: any) => !v || v === 0 ? 'Объект обязателен' : null }
    },
    {
      key: 'material', label: 'Материал', type: 'select' as const, required: true,
      options: materialOptions.value, placeholder: '— выберите материал —',
      validation: { custom: (v: any) => !v || v === 0 ? 'Материал обязателен' : null },
      onChange: (value: number | null) => {
        if (value === null || value === 0) return { unit: 0 }
        const m = materialsStore.items.find(x => x.id === value)
        return m && m.default_unit ? { unit: m.default_unit } : {}
      }
    },
    {
      key: 'unit', label: 'Единица измерения', type: 'select' as const, required: true,
      options: unitOptions.value, placeholder: '— выберите единицу —', disabled: true,
      validation: { custom: (v: any) => !v || v === 0 ? 'Единица обязательна' : null }
    },
    {
      key: 'actual_balance', label: 'Фактический остаток', type: 'number' as const, required: true, step: 0.000001,
      placeholder: 'Сколько материала фактически осталось на объекте',
      validation: {
        custom: (v: any) => {
          if (v === '' || v === null || v === undefined) return 'Укажите фактический остаток'
          return parseFloat(v) < 0 ? 'Остаток не может быть отрицательным' : null
        }
      }
    },
    {
      key: 'comment', label: 'Комментарий', type: 'textarea' as const, rows: 2,
      placeholder: 'Например: инвентаризация на конец месяца'
    }
  ],
  submitText: 'Оформить списание',
  cancelText: 'Отмена'
}))

const initialFormData = computed(() => ({
  date: new Date().toISOString().split('T')[0],
  object: 0,
  material: null as number | null,
  unit: 0,
  actual_balance: '',
  comment: ''
}))

async function handleSubmit(formData: Record<string, any>) {
  await submitForm(async () => {
    await api.post(endpoints.writeOffs.list + 'from-balance/', {
      object: formData.object,
      material: formData.material,
      unit: formData.unit,
      target_balance: formData.actual_balance,
      date: formData.date,
      comment: formData.comment || ''
    })
    emit('success')
    emit('close')
  }, { entity: 'stock-inventory' })
}

onMounted(() => {
  if (!objectsStore.items.length) objectsStore.fetchList?.()
  if (!materialsStore.items.length) materialsStore.fetchList?.()
  if (!unitsStore.items.length) unitsStore.fetchList?.()
})
</script>
