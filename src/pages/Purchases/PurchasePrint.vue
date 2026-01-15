<template>
  <div class="print-page">
    <div class="no-print toolbar">
      <div class="actions">
        <router-link class="btn  btn-sm" :to="{ name: 'PurchasesList' }">
          ← К списку
        </router-link>
      </div>
      <div v-if="purchase" class="info">
        Накладная №{{ purchase.purchase_no || purchase.id }}
      </div>
    </div>

    <div v-if="loading" class="state">Загрузка накладной…</div>
    <div v-else-if="error" class="state error">Не удалось загрузить накладную: {{ error }}</div>
    <div v-else-if="purchase">
      <PurchaseInfo :purchase="purchase" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import PurchaseInfo from './PurchaseInfo.vue'
import { usePurchasesStore } from '@/stores/purchases'

const route = useRoute()
const purchasesStore = usePurchasesStore()

const loading = computed(() => purchasesStore.loading)
const error = computed(() => purchasesStore.error)
const purchase = computed(() => purchasesStore.current)

onMounted(async () => {
  const id = Number(route.params.id)
  if (!Number.isFinite(id)) {return}
  try {
    await purchasesStore.fetchOne(id)
  } catch (e) {
    // Ошибка уже сохранена в store.error
  }
})

function handlePrint() {
  window.print()
}
</script>

<style scoped>
.print-page {
  background: #f5f5f5;
  min-height: 100vh;
  padding: 1rem;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.info {
  font-size: 0.9rem;
  color: #4b5563;
}

.state {
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.state.error {
  color: #b91c1c;
  border: 1px solid #fecaca;
}

@media print {
  .no-print {
    display: none !important;
  }

  .print-page {
    position: static !important;
    display: block !important;
    background: white !important;
    padding: 0 !important;
  }

  /* Показываем только эту страницу, остальное скрываем */
  body * {
    visibility: hidden !important;
  }
  .print-page,
  .print-page * {
    visibility: visible !important;
  }
}
</style>
