<!-- F-1021 · Self-service смена пароля (BE F-777, POST /users/me/password).
     Два режима: обычный (из меню пользователя, закрываемый) и forced (auth.me.must_change_password=true —
     временный пароль от админа: модалка не закрывается, пока пароль не сменён; выйти можно).
     Ошибки BE раскладываются по полям (общий формат {detail, errors}), политика зеркалит F-727:
     ≥6 символов, ≠ текущему, ≠ логину; подтверждение — на FE. -->
<template>
  <Modal :model-value="modelValue" :title="forced ? 'Смените временный пароль' : 'Сменить пароль'"
         size="sm" :closable="!forced" @update:model-value="onClose">
    <p v-if="forced" class="text-sm text-muted mb-4">
      Вам выдан временный пароль. Для продолжения работы задайте свой — не короче 6 символов и не совпадающий с логином.
    </p>
    <form class="space-y-3" novalidate @submit.prevent="submit">
      <div class="form-control">
        <label class="label py-1" for="cp-old"><span class="label-text font-medium">Текущий пароль</span></label>
        <input id="cp-old" v-model="oldPassword" type="password" autocomplete="current-password"
               class="input input-bordered w-full" :class="{ 'input-error': errors.old_password }" required />
        <p v-if="errors.old_password" class="text-error text-xs mt-1">{{ errors.old_password }}</p>
      </div>
      <div class="form-control">
        <label class="label py-1" for="cp-new"><span class="label-text font-medium">Новый пароль</span></label>
        <input id="cp-new" v-model="newPassword" type="password" autocomplete="new-password" minlength="6"
               class="input input-bordered w-full" :class="{ 'input-error': errors.new_password }" required />
        <p v-if="errors.new_password" class="text-error text-xs mt-1">{{ errors.new_password }}</p>
      </div>
      <div class="form-control">
        <label class="label py-1" for="cp-confirm"><span class="label-text font-medium">Повторите новый пароль</span></label>
        <input id="cp-confirm" v-model="confirm" type="password" autocomplete="new-password"
               class="input input-bordered w-full" :class="{ 'input-error': errors.confirm }" required />
        <p v-if="errors.confirm" class="text-error text-xs mt-1">{{ errors.confirm }}</p>
      </div>
      <p v-if="errors.detail" class="text-error text-sm">{{ errors.detail }}</p>
      <div class="flex justify-end gap-2 pt-2">
        <button v-if="forced" type="button" class="btn btn-ghost btn-sm" :disabled="loading" @click="$emit('logout')">Выйти</button>
        <button v-else type="button" class="btn btn-ghost btn-sm" :disabled="loading" @click="onClose(false)">Отмена</button>
        <button type="submit" class="btn btn-primary btn-sm" :disabled="loading || !canSubmit">
          <span v-if="loading" class="loading loading-spinner loading-xs"></span>
          Сменить
        </button>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import Modal from '@/components/Modal.vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { parseApiError } from '@/utils/errorHandler'

const props = defineProps<{ modelValue: boolean; forced?: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'changed'): void; (e: 'logout'): void }>()

const auth = useAuthStore()
const ui = useUiStore()
const oldPassword = ref(''); const newPassword = ref(''); const confirm = ref('')
const loading = ref(false)
const errors = reactive<{ old_password?: string; new_password?: string; confirm?: string; detail?: string }>({})

const canSubmit = computed(() => oldPassword.value.length > 0 && newPassword.value.length >= 6 && confirm.value.length > 0)

function reset() {
  oldPassword.value = ''; newPassword.value = ''; confirm.value = ''
  errors.old_password = errors.new_password = errors.confirm = errors.detail = undefined
}
watch(() => props.modelValue, v => { if (v) { reset() } })

function onClose(v: boolean) {
  if (props.forced) { return }  // forced: закрыть нельзя (только сменить или выйти)
  if (!v) { emit('update:modelValue', false) }
}

/** Локальная политика — зеркало BE F-727/F-777, чтобы не гонять заведомый 400. */
function validateLocal(): boolean {
  errors.old_password = errors.new_password = errors.confirm = errors.detail = undefined
  let ok = true
  if (newPassword.value.length < 6) { errors.new_password = 'Пароль должен быть не короче 6 символов'; ok = false }
  else if (newPassword.value === oldPassword.value) { errors.new_password = 'Новый пароль должен отличаться от текущего'; ok = false }
  else if (auth.me?.username && newPassword.value.toLowerCase() === auth.me.username.toLowerCase()) { errors.new_password = 'Пароль не должен совпадать с логином'; ok = false }
  if (confirm.value !== newPassword.value) { errors.confirm = 'Пароли не совпадают'; ok = false }
  return ok
}

async function submit() {
  if (!validateLocal()) { return }
  loading.value = true
  try {
    await auth.changePassword(oldPassword.value, newPassword.value)
    ui.toast({ type: 'success', text: 'Пароль изменён' })
    emit('changed')
    emit('update:modelValue', false)
  } catch (e: unknown) {
    const parsed = parseApiError(e)
    const fe = parsed.fieldErrors || {}
    errors.old_password = fe.old_password?.[0]
    errors.new_password = fe.new_password?.[0]
    if (!errors.old_password && !errors.new_password) {
      errors.detail = (e as { response?: { status?: number } })?.response?.status === 429 ? 'Слишком много попыток — подождите минуту' : parsed.detail
    }
  } finally {
    loading.value = false
  }
}
</script>
