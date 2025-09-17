<!-- src/pages/Objects/ObjectForm.vue -->
<template>
  <div class="card bg-white shadow-xl">
    <div class="card-body">
      <h2 class="card-title text-2xl mb-6">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
        </svg>
        {{ props.initial ? 'Редактировать объект' : 'Новый объект' }}
      </h2>
      
      <form class="space-y-6" @submit.prevent="submit">
        <!-- Название -->
        <label class="grid gap-1">
          <span class="text-sm font-semibold">
            Название объекта
            <span class="text-error">*</span>
          </span>
          <input 
            v-model.trim="form.name" 
            type="text" 
            class="input input-bordered" 
            :class="{ 'input-error': errors.name }"
            placeholder="Введите название объекта"
            required
          />
          <span v-if="errors.name" class="text-xs text-error">{{ errors.name }}</span>
        </label>

        <!-- Адрес -->
        <label class="grid gap-1">
          <span class="text-sm font-semibold">Адрес</span>
          <textarea 
            v-model.trim="form.address" 
            class="textarea textarea-bordered resize-none" 
            placeholder="Введите адрес объекта"
            rows="3"
          ></textarea>
          <span class="text-xs text-gray-700-60">Необязательно</span>
        </label>

        <!-- Статус активности -->
        <label class="grid gap-1">
          <span class="text-sm font-semibold">Статус</span>
          <div class="flex items-center gap-3">
            <input 
              type="checkbox" 
              v-model="form.is_active" 
              class="checkbox checkbox-primary" 
            />
            <div>
              <span class="font-medium">Объект активен</span>
              <div class="text-xs text-gray-700-60">
                Активные объекты доступны для выбора в закупках и отчетах
              </div>
            </div>
          </div>
        </label>

        <!-- Кнопки действий -->
        <div class="flex justify-end gap-2 mt-6">
          <button 
            type="button" 
            class="btn btn-ghost" 
            @click="$emit('cancel')"
            :disabled="submitting"
          >
            Отмена
          </button>
          <button 
            type="submit" 
            class="btn btn-primary" 
            :disabled="submitting || !form.name.trim()"
          >
            {{ submitting ? 'Сохранение...' : (props.initial ? 'Обновить' : 'Создать') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import {reactive, ref, watchEffect} from 'vue'
import api from '@/api/client'
import {endpoints} from '@/api/endpoints'
import type {SiteObject, ObjectRequest, PatchedObjectRequest} from '@/api/types'
import {useUiStore} from '@/stores/ui'

const props = defineProps<{ initial: SiteObject | null }>()
const emit = defineEmits<{ (e: 'saved'): void; (e: 'cancel'): void }>()

const ui = useUiStore()

const form = reactive<{ name: string; address: string; is_active: boolean }>({name: '', address: '', is_active: true})
const errors = reactive<{ name: string | null }>({name: null})
const submitting = ref(false)

watchEffect(() => {
  if (props.initial) {
    form.name = props.initial.name
    form.address = props.initial.address ?? ''
    form.is_active = !!props.initial.is_active
  } else {
    form.name = ''
    form.address = ''
    form.is_active = true
  }
  errors.name = null
})

function pickError(payload: any, key: string): string | null {
  const v = payload?.[key]
  if (Array.isArray(v) && v.length) return String(v[0])
  if (typeof v === 'string') return v

  const nested = payload?.errors?.[key]
  if (Array.isArray(nested) && nested.length) return String(nested[0])
  if (typeof nested === 'string') return nested

  return null
}

async function submit() {
  submitting.value = true
  errors.name = null
  
  try {
    if (props.initial) {
      const payload: PatchedObjectRequest = {
        name: form.name,
        address: form.address || undefined,
        is_active: form.is_active
      }
      await api.patch(endpoints.objects.one(props.initial.id), payload)
      ui.toast({type: 'success', text: 'Объект обновлен'})
    } else {
      const payload: ObjectRequest = {
        name: form.name,
        address: form.address || undefined,
        is_active: form.is_active
      }
      await api.post(endpoints.objects.list, payload)
      ui.toast({type: 'success', text: 'Объект создан'})
    }
    emit('saved')
  } catch (e: any) {
    const data = e?.response?.data || {}
    errors.name = pickError(data, 'name')
    
    if (!errors.name && data?.detail && typeof data.detail === 'string') {
      errors.name = data.detail
    }
    
    if (!errors.name) {
      ui.toast({type: 'error', text: 'Ошибка сохранения объекта'})
    }
  } finally {
    submitting.value = false
  }
}
</script>

