<template>
  <div class="grid gap-4">
    <h1 class="text-lg font-semibold">Отчёты</h1>
    <div role="tablist" class="tabs tabs-bordered">
      <RouterLink role="tab" class="tab" active-class="tab-active" :to="{ name: 'reports.period' }">По периодам</RouterLink>
      <RouterLink role="tab" class="tab" active-class="tab-active" :to="{ name: 'reports.object' }">По объектам</RouterLink>
      <RouterLink role="tab" class="tab" active-class="tab-active" :to="{ name: 'reports.responsible' }">По ответственным</RouterLink>
      <RouterLink role="tab" class="tab" active-class="tab-active" :to="{ name: 'reports.material' }">По материалам</RouterLink>
    </div>
    <RouterView/>
  </div>
</template>

<script setup lang="ts">
// пусто
</script>
