<template>
  <nav class="px-2 py-1 grid gap-1">
    <RouterLink class="btn btn-ghost justify-start" active-class="btn-active" to="/dashboard" @click="emit('navigate')">
      Дашборд
    </RouterLink>
    <RouterLink class="btn btn-ghost justify-start" active-class="btn-active" to="/materials" @click="emit('navigate')">
      Материалы
    </RouterLink>
    <RouterLink class="btn btn-ghost justify-start" active-class="btn-active" to="/units" @click="emit('navigate')">
      Единицы
    </RouterLink>
    <RouterLink class="btn btn-ghost justify-start" active-class="btn-active" to="/objects" @click="emit('navigate')">
      Объекты
    </RouterLink>
    <RouterLink class="btn btn-ghost justify-start" active-class="btn-active" to="/purchases" @click="emit('navigate')">
      Закупки
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
const emit = defineEmits<{ (e: 'navigate'): void }>()
</script>
