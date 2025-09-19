<template>
  <SmartUnitValue 
    :value="value" 
    :unit="unit" 
    :precision="precision" 
    :show-original="showOriginal" 
    :class-name="className"
    :use-api-value="false"
  />
</template>

<script setup lang="ts">
import SmartUnitValue from './SmartUnitValue.vue'

interface Props {
  value: number
  unit: string
  precision?: number
  showOriginal?: boolean
  className?: string
}

defineProps<Props>()
</script>
