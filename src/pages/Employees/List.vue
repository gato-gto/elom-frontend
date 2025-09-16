<template>
  <div class="grid gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-lg font-semibold">Сотрудники</h1>
    </div>

    <div class="card bg-base-100 border">
      <div class="card-body">
        <div class="overflow-auto">
          <table class="table table-zebra w-full">
            <thead>
            <tr>
              <th>ID</th>
              <th>Логин</th>
              <th>Имя</th>
              <th>Фамилия</th>
              <th>E-mail</th>
              <th>Роль</th>
              <th>Активен</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="e in rows" :key="e.id">
              <td>{{ e.id }}</td>
              <td>{{ e.username }}</td>
              <td>{{ e.first_name || '—' }}</td>
              <td>{{ e.last_name || '—' }}</td>
              <td>{{ e.email || '—' }}</td>
              <td>{{ e.role || '—' }}</td>
              <td>
                  <span class="badge" :class="e.is_active ? 'badge-success' : 'badge-ghost'">
                    {{ e.is_active ? 'Да' : 'Нет' }}
                  </span>
              </td>
            </tr>
            <tr v-if="!loading && rows.length===0">
              <td colspan="7" class="text-center text-base-content/60">Нет данных</td>
            </tr>
            </tbody>
          </table>
        </div>

        <!-- Пагинация (простая) -->
        <div class="mt-4 join self-end">
          <button class="btn btn-sm join-item" :disabled="page<=1" @click="reload(1)">«</button>
          <button class="btn btn-sm join-item" :disabled="page<=1" @click="reload(page-1)">Назад</button>
          <button class="btn btn-sm join-item btn-ghost no-animation">Стр. {{ page }}</button>
          <button class="btn btn-sm join-item" :disabled="page*pageSize>=count" @click="reload(page+1)">Вперёд</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue'
import api from '@/api/client'
import endpoints, {buildQuery} from '@/api/endpoints'
import type {PageResponse, EmployeeListItem} from '@/api/types'

const rows = ref<EmployeeListItem[]>([])
const count = ref(0)
const page = ref(1)
const pageSize = 20
const loading = ref(false)

async function fetchList() {
  loading.value = true
  try {
    const {data} = await api.get<PageResponse<EmployeeListItem>>(
        endpoints.employees.list + buildQuery({page: page.value, page_size: pageSize, ordering: 'username'})
    )
    rows.value = data.results
    count.value = data.count
  } finally {
    loading.value = false
  }
}

function reload(p = page.value) {
  page.value = p;
  fetchList()
}

onMounted(fetchList)
</script>
