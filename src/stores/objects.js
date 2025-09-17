import { defineStore } from 'pinia';
import api from '@/api/client';
import { endpoints, buildQuery } from '@/api/endpoints';
export const useObjectsStore = defineStore('objects', {
    state: () => ({
        items: [],
        current: null,
        loading: false,
        error: null,
        pagination: {
            count: 0,
            page: 1,
            pageSize: 20,
            next: null,
            previous: null
        },
        filters: {
            search: '',
            name: '',
            is_active: null,
            ordering: 'name'
        }
    }),
    getters: {
        // Get object by ID
        getById: (state) => (id) => {
            return state.items.find(item => item.id === id);
        },
        // Get active objects only
        activeObjects: (state) => {
            return state.items.filter(item => item.is_active);
        },
        // Check if object exists
        exists: (state) => (id) => {
            return state.items.some(item => item.id === id);
        },
        // Get objects for select options
        selectOptions: (state) => {
            return state.items
                .filter(item => item.is_active)
                .map(obj => ({
                value: obj.id,
                label: obj.name
            }));
        }
    },
    actions: {
        // Fetch objects list
        async fetchList(params) {
            this.loading = true;
            this.error = null;
            try {
                const queryParams = {
                    page: params?.page || this.pagination.page,
                    page_size: this.pagination.pageSize,
                    search: params?.search ?? this.filters.search ?? undefined,
                    name: params?.name ?? this.filters.name ?? undefined,
                    is_active: params?.is_active ?? this.filters.is_active ?? undefined,
                    ordering: params?.ordering ?? this.filters.ordering
                };
                const query = buildQuery(queryParams);
                const { data } = await api.get(endpoints.objects.list + query);
                this.items = data.results;
                this.pagination = {
                    count: data.count,
                    page: queryParams.page,
                    pageSize: this.pagination.pageSize,
                    next: data.next,
                    previous: data.previous
                };
                // Update filters
                if (params) {
                    Object.assign(this.filters, params);
                }
                return data;
            }
            catch (error) {
                this.error = error?.response?.data?.detail || 'Ошибка загрузки объектов';
                throw error;
            }
            finally {
                this.loading = false;
            }
        },
        // Fetch single object
        async fetchOne(id) {
            this.loading = true;
            this.error = null;
            try {
                const { data } = await api.get(endpoints.objects.one(id));
                this.current = data;
                // Update in list if exists
                const index = this.items.findIndex(item => item.id === id);
                if (index !== -1) {
                    this.items[index] = data;
                }
                return data;
            }
            catch (error) {
                this.error = error?.response?.data?.detail || 'Ошибка загрузки объекта';
                throw error;
            }
            finally {
                this.loading = false;
            }
        },
        // Create new object
        async create(data) {
            this.loading = true;
            this.error = null;
            try {
                const { data: newObject } = await api.post(endpoints.objects.list, data);
                // Add to list
                this.items.unshift(newObject);
                this.pagination.count++;
                return newObject;
            }
            catch (error) {
                this.error = error?.response?.data?.detail || 'Ошибка создания объекта';
                throw error;
            }
            finally {
                this.loading = false;
            }
        },
        // Update object
        async update(id, data) {
            this.loading = true;
            this.error = null;
            try {
                const { data: updatedObject } = await api.patch(endpoints.objects.one(id), data);
                // Update in list
                const index = this.items.findIndex(item => item.id === id);
                if (index !== -1) {
                    this.items[index] = updatedObject;
                }
                // Update current if it's the same
                if (this.current?.id === id) {
                    this.current = updatedObject;
                }
                return updatedObject;
            }
            catch (error) {
                this.error = error?.response?.data?.detail || 'Ошибка обновления объекта';
                throw error;
            }
            finally {
                this.loading = false;
            }
        },
        // Delete object
        async delete(id) {
            this.loading = true;
            this.error = null;
            try {
                await api.delete(endpoints.objects.one(id));
                // Remove from list
                this.items = this.items.filter(item => item.id !== id);
                this.pagination.count--;
                // Clear current if it's the same
                if (this.current?.id === id) {
                    this.current = null;
                }
                return true;
            }
            catch (error) {
                this.error = error?.response?.data?.detail || 'Ошибка удаления объекта';
                throw error;
            }
            finally {
                this.loading = false;
            }
        },
        // Set filters
        setFilters(filters) {
            Object.assign(this.filters, filters);
        },
        // Reset filters
        resetFilters() {
            this.filters = {
                search: '',
                name: '',
                is_active: null,
                ordering: 'name'
            };
        },
        // Set current object
        setCurrent(obj) {
            this.current = obj;
        },
        // Clear error
        clearError() {
            this.error = null;
        }
    }
});
