<!-- src/pages/Employees/List.vue -->
<template>
  <div class="grid gap-4">
    <div class="flex flex-wrap items-end gap-2">
      <div class="grow max-w-sm">
        <FormField label="Поиск">
          <input v-model.trim="search" class="input input-bordered" placeholder="ФИО/логин/email" @keyup.enter="reload()"/>
        </FormField>
      </div>
      <div>
        <FormField label="Роль">
          <select v-model="role" class="input input-bordered">
            <option value="">Все</option>
            <option value="admin">Администратор</option>
            <option value="buyer">Закупщик</option>
            <option value="site_manager">Ответственный</option>
            <option value="director">Руководитель</option>
          </select>
        </FormField>
      </div>
      <button class="btn" @click="reload">Найти</button>
    </div>

    <div class="card p-4">
      <div class="w-full overflow-auto rounded-lg border border-base-300">
        <table class="w-full text-sm">
          <thead class="bg-base-100">
          <tr>
            <th class="px-3 py-2 text-left">ID</th>
            <th class="px-3 py-2 text-left">ФИО</th>
            <th class="px-3 py-2 text-left">Логин</th>
            <th class="px-3 py-2 text-left">Email</th>
            <th class="px-3 py-2 text-left">Роль</th>
          </tr>
          </thead>
          <tbody>
          <tr v-if="employers.length === 0">
            <td colspan="6" class="px-3 py-6 text-center text-base-content/60">Нет данных</td>
          </tr>
          <tr v-for="e in employers" :key="e.id" class="border-t border-base-200">
            <td class="px-3 py-2">{{ e.id }}</td>
            <td class="px-3 py-2">{{ e.first_name }} {{ e.last_name }}</td>
            <td class="px-3 py-2">{{ e.username }}</td>
            <td class="px-3 py-2">{{ e.email }}</td>
            <td class="px-3 py-2">{{ e.role }}</td>
          </tr>
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between gap-2 py-3">
        <div class="text-xs text-base-content/60"><span v-if="count !== null">Всего: {{ count }}</span></div>
        <div class="inline-flex items-center gap-2">
          <button class="btn btn-sm" :disabled="!previous" @click="go(previous)">Назад</button>
          <button class="btn btn-sm" :disabled="!next" @click="go(next)">Вперёд</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import api from '@/api/client'
import {endpoints} from '@/api/endpoints'
import {onMounted, ref} from 'vue'
import FormField from '@/components/FormField.vue'
import {Employee} from "@/api/types";


const search = ref('')
const role = ref('')
const employers = ref<Employee[]>([])
const count = ref<number | null>(null)
const next = ref<string | null>(null)
const previous = ref<string | null>(null)

async function fetchList(url?: string) {
  const query = new URLSearchParams()
  if (search.value) query.set('search', search.value)
  if (role.value) query.set('role', role.value)
  const u = url ?? `${endpoints.common.employees}?${query.toString()}`

  const res = await api.get(u)
  employers.value = res.data.results ?? []
  count.value = res.data.count ?? null
  next.value = res.data.next
  previous.value = res.data.previous
}

function reload() { fetchList() }
function go(url: string | null) { if (url) fetchList(url) }
onMounted(() => fetchList())
</script>
