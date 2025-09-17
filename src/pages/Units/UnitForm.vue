<!-- src/pages/Units/UnitForm.vue -->
<template>
  <div class="card bg-white shadow-xl">
    <div class="card-body">
      <h2 class="card-title text-2xl mb-6">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        {{ props.initial ? 'Редактировать единицу' : 'Новая единица измерения' }}
      </h2>
      
      <form class="space-y-6" @submit.prevent="submit">
        <!-- Название -->
        <label class="grid gap-1">
          <span class="text-sm font-semibold">
            Название единицы
            <span class="text-error">*</span>
          </span>
          <input 
            v-model.trim="form.name" 
            type="text" 
            class="input input-bordered" 
            :class="{ 'input-error': errors.name }"
            placeholder="Введите название единицы измерения"
            required
          />
          <span v-if="errors.name" class="text-xs text-error">{{ errors.name }}</span>
        </label>

        <!-- Код -->
        <label class="grid gap-1">
          <span class="text-sm font-semibold">
            Код единицы
            <span class="text-error">*</span>
          </span>
          <input 
            v-model.trim="form.code" 
            type="text" 
            class="input input-bordered font-mono" 
            :class="{ 'input-error': errors.code }"
            placeholder="Введите код единицы (например: кг, м, шт)"
            required
          />
          <span v-if="errors.code" class="text-xs text-error">{{ errors.code }}</span>
          <span class="text-xs text-gray-700-500">Короткий код для использования в системе</span>
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
            :disabled="submitting || !form.name.trim() || !form.code.trim()"
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
import type {Unit, UnitRequest, PatchedUnitRequest} from '@/api/types'
import {useUiStore} from '@/stores/ui'

const props = defineProps<{ initial: Unit | null }>()
const emit = defineEmits<{ (e: 'saved'): void; (e: 'cancel'): void }>()

const ui = useUiStore()

const form = reactive<{ name: string; code: string }>({name: '', code: ''})
const errors = reactive<{ name: string | null; code: string | null }>({name: null, code: null})
const submitting = ref(false)

watchEffect(() => {
  if (props.initial) {
    form.name = props.initial.name
    form.code = props.initial.code
  } else {
    form.name = ''
    form.code = ''
  }
  errors.name = null
  errors.code = null
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
  errors.code = null
  
  try {
    if (props.initial) {
      const payload: PatchedUnitRequest = {
        name: form.name,
        code: form.code
      }
      await api.patch(endpoints.units.one(props.initial.id), payload)
      ui.toast({type: 'success', text: 'Единица измерения обновлена'})
    } else {
      const payload: UnitRequest = {
        name: form.name,
        code: form.code
      }
      await api.post(endpoints.units.list, payload)
      ui.toast({type: 'success', text: 'Единица измерения создана'})
    }
    emit('saved')
  } catch (e: any) {
    const data = e?.response?.data || {}
    errors.name = pickError(data, 'name')
    errors.code = pickError(data, 'code')
    
    if (!errors.name && !errors.code && data?.detail && typeof data.detail === 'string') {
      errors.name = data.detail
    }
    
    if (!errors.name && !errors.code) {
      ui.toast({type: 'error', text: 'Ошибка сохранения единицы измерения'})
    }
  } finally {
    submitting.value = false
  }
}
</script>
