<!-- src/pages/Units/UnitForm.vue -->
<template>
  <form class="grid gap-3" @submit.prevent="submit">
    <FormField label="Код" :error="errors.code">
      <input v-model.trim="form.code" class="input input-bordered" maxlength="16" required/>
    </FormField>

    <FormField label="Название" :error="errors.name">
      <input v-model.trim="form.name" class="input input-bordered" required/>
    </FormField>

    <div class="flex justify-end gap-2">
      <button type="button" class="btn btn-ghost" @click="$emit('cancel')">Отмена</button>
      <button type="submit" class="btn btn-primary" :disabled="submitting">
        {{ submitting ? 'Сохранение…' : 'Сохранить' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import {reactive, ref, watchEffect} from 'vue'
import api from '@/api/client'
import endpoints from '@/api/endpoints'
import FormField from '@/components/FormField.vue'
import type {Unit} from '@/api/types'

const props = defineProps<{ initial: Unit | null }>()
const emit = defineEmits<{ (e: 'saved'): void; (e: 'cancel'): void }>()

const form = reactive<{ code: string; name: string }>({code: '', name: ''})
const errors = reactive<{ code: string | null; name: string | null }>({code: null, name: null})
const submitting = ref(false)

watchEffect(() => {
  form.code = props.initial?.code ?? ''
  form.name = props.initial?.name ?? ''
  errors.code = null
  errors.name = null
})

async function submit() {
  submitting.value = true
  errors.code = errors.name = null
  try {
    if (props.initial) {
      await api.patch(endpoints.units.one(props.initial.id), form)
    } else {
      await api.post(endpoints.units.list, form)
    }
    emit('saved')
  } catch (e: any) {
    const d = e?.response?.data || {}
    errors.code = d?.code?.[0] ?? null
    errors.name = d?.name?.[0] ?? null
  } finally {
    submitting.value = false
  }
}
</script>
