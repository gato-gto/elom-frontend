<!-- src/App.vue -->
<template>
  <TopbarProgress/>
  <ToastCenter/>
  <router-view/>
</template>

<script setup lang="ts">
import TopbarProgress from '@/components/TopbarProgress.vue'
import ToastCenter from '@/components/ToastCenter.vue'
</script>
