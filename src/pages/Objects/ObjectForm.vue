<!-- src/pages/Objects/ObjectForm.vue -->
<template>
  <form class="grid gap-3" @submit.prevent="submit">
    <FormField label="Название" :error="errors.name">
      <input v-model.trim="form.name" class="input" required/>
    </FormField>

    <FormField label="Адрес">
      <input v-model.trim="form.address" class="input" placeholder="Необязательно"/>
    </FormField>

    <label class="inline-flex items-center gap-2">
      <input type="checkbox" v-model="form.is_active" class="h-4 w-4"/>
      <span class="text-sm">Активен</span>
    </label>

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

type SiteObject = { id: number; name: string; address?: string | null; is_active: boolean }
const props = defineProps<{ initial: SiteObject | null }>()
const emit = defineEmits<{ (e: 'saved'): void; (e: 'cancel'): void }>()

const form = reactive<SiteObject>({id: 0, name: '', address: '', is_active: true})
const errors = reactive<{ name: string | null }>({name: null})
const submitting = ref(false)

watchEffect(() => {
  if (props.initial) {
    form.id = props.initial.id
    form.name = props.initial.name
    form.address = props.initial.address ?? ''
    form.is_active = !!props.initial.is_active
  } else {
    form.id = 0
    form.name = ''
    form.address = ''
    form.is_active = true
  }
  errors.name = null
})

async function submit() {
  submitting.value = true
  errors.name = null
  try {
    const payload = {name: form.name, address: form.address || null, is_active: form.is_active}
    if (props.initial) {
      await api.patch(`${endpoints.common.objects}${props.initial.id}/`, payload)
    } else {
      await api.post(endpoints.common.objects, payload)
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
