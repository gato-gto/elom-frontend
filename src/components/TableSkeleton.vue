<template>
  <tbody>
    <tr v-for="n in rows" :key="n" class="skeleton-row">
      <td v-for="col in columns" :key="col" class="skeleton-cell">
        <div class="skeleton-content" :class="getSkeletonClass(col)"></div>
      </td>
    </tr>
  </tbody>
</template>

<script setup lang="ts">
interface Props {
  rows?: number
  columns?: number
  variant?: 'default' | 'compact'
}

const props = withDefaults(defineProps<Props>(), {
  rows: 5,
  columns: 6,
  variant: 'default'
})
void props

function getSkeletonClass(column: number) {
  // Разные типы скелетонов для разных колонок
  const types = ['text', 'text-short', 'badge', 'number', 'date', 'actions']
  return types[column % types.length]
}
</script>

<style scoped>
.skeleton-row {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-cell {
  padding: 1rem 0.75rem;
  border-bottom: 1px solid hsl(var(--b3));
}

/* shimmer placeholder — token-based so it tracks light/dark automatically */
.skeleton-content {
  background: linear-gradient(90deg, hsl(var(--b2)) 25%, hsl(var(--b3)) 50%, hsl(var(--b2)) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 0.25rem;
  height: 1rem;
}

/* Разные размеры для разных типов контента */
.skeleton-content.text {
  width: 100%;
  height: 1rem;
}

.skeleton-content.text-short {
  width: 60%;
  height: 1rem;
}

.skeleton-content.badge {
  width: 4rem;
  height: 1.5rem;
  border-radius: 3px;
}

.skeleton-content.number {
  width: 3rem;
  height: 1rem;
}

.skeleton-content.date {
  width: 5rem;
  height: 1rem;
}

.skeleton-content.actions {
  width: 6rem;
  height: 2rem;
  border-radius: 0.5rem;
}

@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes skeleton-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>
