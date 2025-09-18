<template>
  <div class="grid gap-4">
    <h1 class="text-lg font-semibold">Отчёты</h1>
    <div role="tablist" class="tabs tabs-bordered">
      <RouterLink role="tab" class="tab" active-class="tab-active" :to="{ name: 'ReportByPeriod' }">По периодам</RouterLink>
      <RouterLink role="tab" class="tab" active-class="tab-active" :to="{ name: 'ReportByObject' }">По объектам</RouterLink>
      <RouterLink role="tab" class="tab" active-class="tab-active" :to="{ name: 'ReportByResponsible' }">По ответственным</RouterLink>
      <RouterLink role="tab" class="tab" active-class="tab-active" :to="{ name: 'ReportByMaterial' }">По материалам</RouterLink>
    </div>
    <RouterView/>
  </div>
</template>

<script setup lang="ts">
// пусто
</script>

