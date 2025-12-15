/**
 * Типы для системы учёта инструментов
 * Синхронизировано с backend API (tools app)
 * Последнее обновление: 27 Ноября 2025
 */

// Варианты состояния инструмента
export type ToolCondition = 'new' | 'good' | 'after_repair' | 'needs_repair' | 'broken' | 'lost';

// Основная модель инструмента
export interface Tool {
  id: number;
  inventory_number: string;
  name: string;
  category: string;
  brand: string;
  current_holder: number | null;
  current_holder_name: string | null;
  current_object: number | null;
  current_object_name: string | null;
  condition: ToolCondition;
  condition_display: string;
  // Вычисляемые поля на frontend
  is_in_stock?: boolean;
  status_display?: string;
  created_at: string;
  updated_at: string;
}

// Запрос на создание/обновление инструмента
export interface ToolRequest {
  inventory_number: string;
  name: string;
  category?: string;
  brand?: string;
  condition?: ToolCondition;
}

// Модель выдачи инструмента
export interface ToolIssue {
  id: number;
  tool: number;
  tool_name: string;
  tool_inventory_number: string;
  tool_category: string | null;
  tool_brand: string | null;
  issued_by: number;
  issued_by_name: string;
  issued_to: number;
  issued_to_name: string;
  issued_at: string;
  object: number | null;
  object_name: string | null;
  // Соответствует backend полям issue_condition/return_condition
  issue_condition: ToolCondition;
  issue_condition_display: string;
  issue_comment: string;
  return_date: string | null;
  return_condition: ToolCondition | null;
  return_condition_display: string | null;
  return_comment: string;
  is_returned: boolean;
  is_open: boolean;
  duration_days: number;
  created_at: string;
  updated_at: string;
}

// Запрос на выдачу инструмента (POST /tool-issues/issue/)
export interface ToolIssueCreateRequest {
  tool: number;
  issued_to: number;
  object?: number | null;
  issue_condition: ToolCondition;  // Обязательное поле, соответствует backend полю issue_condition
}

// Запрос на возврат инструмента (POST /tool-issues/{id}/return/)
export interface ToolIssueReturnRequest {
  return_condition: ToolCondition;  // Соответствует backend полю return_condition
  return_comment?: string;
}

// Альтернативные имена для совместимости
export type ToolIssueRequest = ToolIssueCreateRequest;
export type ToolReturnRequest = ToolIssueReturnRequest;

// Категория инструмента (для автодополнения)
export interface ToolCategory {
  category: string;
}

// Элемент для массового создания инструментов
export interface ToolBulkItem {
  inventory_number: string;
  name: string;
  category?: string;
  brand?: string;
  condition?: ToolCondition;
  issue_condition?: ToolCondition;
}

// Альтернативное имя для совместимости
export type ToolBulkCreateItem = ToolBulkItem;

// Запрос на массовое создание инструментов
export interface ToolBulkCreateRequest {
  tools: ToolBulkItem[];
  auto_issue?: boolean;
  issued_to?: number;
  object?: number;
  issue_condition?: ToolCondition;
  issue_comment?: string;
}

// Ответ на массовое создание инструментов
export interface ToolBulkCreateResponse {
  tools: Tool[];
  created_count: number;
  issued_count: number;
}

// Фильтры для списка инструментов
export interface ToolListQuery {
  search?: string;
  inventory_number?: string;
  name?: string;
  category?: string;
  brand?: string;
  condition?: ToolCondition;
  current_holder?: number;
  current_object?: number;
  is_in_stock?: boolean | string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

// Фильтры для списка выдач
export interface ToolIssueListQuery {
  search?: string;
  tool?: number;
  issued_by?: number;
  issued_to?: number;
  object?: number;
  issued_condition?: ToolCondition;
  returned_condition?: ToolCondition;
  issued_at_after?: string;
  issued_at_before?: string;
  return_date_after?: string;
  return_date_before?: string;
  is_open?: boolean | string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

// Статистика инструментов
export interface ToolStats {
  total: number;
  in_stock: number;
  issued: number;
  by_condition?: Record<ToolCondition, number>;
}

// Опции для фильтров
export const TOOL_CONDITION_OPTIONS: Array<{ value: ToolCondition; label: string }> = [
  { value: 'new', label: 'Новый' },
  { value: 'good', label: 'Хорошее' },
  { value: 'after_repair', label: 'После ремонта' },
  { value: 'needs_repair', label: 'Требует ремонта' },
  { value: 'broken', label: 'Сломан' },
  { value: 'lost', label: 'Утерян' }
];

// Функция для получения отображаемого названия состояния
export function getConditionLabel(condition: ToolCondition): string {
  const option = TOOL_CONDITION_OPTIONS.find(opt => opt.value === condition);
  return option?.label || condition;
}
