<!-- src/pages/Units/UnitForm.vue ! Проработать, недоделано !-->
<template>
  <form class="grid gap-3" @submit.prevent="submit">
    <FormField label="Название" :error="errors.name">
      <input v-model.trim="form.name" class="input" required/>
    </FormField>
    <div class="flex justify-end gap-2">
      <button type="button" class="btn btn-ghost" @click="$emit('cancel')">Отмена</button>
      <button type="submit" class="btn" :disabled="submitting">{{ submitting ? 'Сохранение…' : 'Сохранить' }}</button>
    </div>
  </form>
</template>

<script setup lang="ts">
import {reactive, ref, watchEffect} from 'vue'
import api from '@/api/client'
import {endpoints} from '@/api/endpoints'
import FormField from '@/components/FormField.vue'
import type {Unit} from '@/api/types';

const props = defineProps<{ initial: Unit | null }>()
const emit = defineEmits<{ (e: 'saved'): void; (e: 'cancel'): void }>()

const form = reactive<{  name: string }>({
  name: props.initial?.name ?? '',
})
const errors = reactive<{ name: string | null; short_name: string | null }>({name: null, short_name: null})
const submitting = ref(false)

watchEffect(() => {
  if (props.initial) {
    form.name = props.initial.name
  } else {
    form.name = ''
  }
  errors.name = null
})

async function submit() {
  submitting.value = true
  errors.name = null;
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
  } finally {
    submitting.value = false
  }
}
</script>
