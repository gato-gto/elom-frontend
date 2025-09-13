<!-- src/pages/Units/UnitForm.vue -->
<template>
  <form class="grid gap-3" @submit.prevent="submit">
    <FormField label="Название" :error="errors.name">
      <input v-model.trim="form.name" class="input" required />
    </FormField>

    <FormField label="Сокращение" :error="errors.short_name">
      <input v-model.trim="form.short_name" class="input" required />
    </FormField>

    <div class="flex justify-end gap-2">
      <button type="button" class="btn btn-ghost" @click="$emit('cancel')">Отмена</button>
      <button type="submit" class="btn" :disabled="submitting">{{ submitting ? 'Сохранение…' : 'Сохранить' }}</button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { reactive, ref, watchEffect } from 'vue'
import api from '@/api/client'
import { endpoints } from '@/api/endpoints'
import FormField from '@/components/FormField.vue'

type Unit = { id: number; name: string; short_name: string }
const props = defineProps<{ initial: Unit | null }>()
const emit = defineEmits<{ (e: 'saved'): void; (e: 'cancel'): void }>()

const form = reactive({ name: '', short_name: '' })
const errors = reactive<{ name: string | null; short_name: string | null }>({ name: null, short_name: null })
const submitting = ref(false)

watchEffect(() => {
  if (props.initial) {
    form.name = props.initial.name
    form.short_name = props.initial.short_name
  } else {
    form.name = ''
    form.short_name = ''
  }
  errors.name = null
  errors.short_name = null
})

async function submit() {
  submitting.value = true
  errors.name = null; errors.short_name = null
  try {
    if (props.initial) {
      await api.patch(`${endpoints.common.units}${props.initial.id}/`, form)
    } else {
      await api.post(endpoints.common.units, form)
    }
    emit('saved')
  } catch (e: any) {
    const data = e?.response?.data || {}
    errors.name = data?.name?.[0] ?? null
    errors.short_name = data?.short_name?.[0] ?? null
  } finally {
    submitting.value = false
  }
}
</script>
