<template>
  <nav class="flex" aria-label="Breadcrumb">
    <ol class="flex items-center space-x-2">
      <li v-for="breadcrumb in breadcrumbs" :key="breadcrumb.path || breadcrumb.title" class="flex items-center">
        <!-- Separator -->
        <i v-if="breadcrumbs.indexOf(breadcrumb) > 0" class="material-icons text-gray-400 text-sm mx-2">
          chevron_right
        </i>
        
        <!-- Breadcrumb item -->
        <div class="flex items-center">
          <!-- Link breadcrumb -->
          <router-link
            v-if="breadcrumb.path && breadcrumbs.indexOf(breadcrumb) < breadcrumbs.length - 1"
            :to="breadcrumb.path"
            class="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            {{ breadcrumb.title }}
          </router-link>
          
          <!-- Current page breadcrumb -->
          <span
            v-else
            class="text-sm font-medium text-gray-900 dark:text-white"
            aria-current="page"
          >
            {{ breadcrumb.title }}
          </span>
        </div>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { useAppRouter } from '@/composables/useRouter'

const { breadcrumbs } = useAppRouter()
</script>



