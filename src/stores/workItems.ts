/**
 * Store позиций прайс-каталога. Добавляет вводящий смету (RBAC work_items.create);
 * правку/удаление — руководство.
 */
import api from '@/api/client'
import { endpoints, buildQuery } from '@/api/endpoints'
import { createBaseStore } from './base'
import { handleApiErrorAsync } from '@/utils/errorHandler'
import type { WorkItem, WorkItemRequest, WorkItemLite } from '@/api/types/estimates'

export const useWorkItemsStore = createBaseStore<
  WorkItem,
  WorkItemRequest,
  Partial<WorkItemRequest>
>({
  endpoint: endpoints.workItems,
  entityName: 'workItems',
  entityNamePlural: 'позиции прайса',
  defaultOrdering: 'order',
})

/**
 * Автоподсказка позиций (зеркало searchMaterials): `?q=&category=&limit=`.
 * Сбой поиска → тост + [] (иначе сбой выглядит как «ничего не найдено», F-552).
 */
export const searchWorkItems = async (
  q: string,
  category?: number | null,
  limit = 10,
): Promise<WorkItemLite[]> => {
  try {
    const { data } = await api.get<WorkItemLite[]>(
      endpoints.workItems.search + buildQuery({ q, category: category ?? undefined, limit }),
    )
    return Array.isArray(data) ? data : ((data as any)?.results || [])
  } catch (error: any) {
    await handleApiErrorAsync(error, { operation: 'search', entity: 'позиции прайса' })
    return []
  }
}
