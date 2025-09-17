import { defineStore } from 'pinia';
import api from '@/api/client';
import { endpoints, buildQuery } from '@/api/endpoints';
export const useUnitsStore = defineStore('units', {
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
            code: '',
            name: '',
            ordering: 'code'
        }
    }),
    getters: {
        // Get unit by ID
        getById: (state) => (id) => {
            return state.items.find(item => item.id === id);
        },
        // Get unit by code
        getByCode: (state) => (code) => {
            return state.items.find(item => item.code === code);
        },
        // Check if unit exists
        exists: (state) => (id) => {
            return state.items.some(item => item.id === id);
        },
        // Get units for select options
        selectOptions: (state) => {
            return state.items.map(unit => ({
                value: unit.id,
                label: `${unit.name} (${unit.code})`
            }));
        }
    },
    actions: {
        // Fetch units list
        async fetchList(params) {
            this.loading = true;
            this.error = null;
            try {
                const queryParams = {
                    page: params?.page || this.pagination.page,
                    page_size: this.pagination.pageSize,
                    search: params?.search ?? this.filters.search ?? undefined,
                    code: params?.code ?? this.filters.code ?? undefined,
                    name: params?.name ?? this.filters.name ?? undefined,
                    ordering: params?.ordering ?? this.filters.ordering
                };
                const query = buildQuery(queryParams);
                const { data } = await api.get(endpoints.units.list + query);
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
                this.error = error?.response?.data?.detail || 'Ошибка загрузки единиц измерения';
                throw error;
            }
            finally {
                this.loading = false;
            }
        },
        // Fetch single unit
        async fetchOne(id) {
            this.loading = true;
            this.error = null;
            try {
                const { data } = await api.get(endpoints.units.one(id));
                this.current = data;
                // Update in list if exists
                const index = this.items.findIndex(item => item.id === id);
                if (index !== -1) {
                    this.items[index] = data;
                }
                return data;
            }
            catch (error) {
                this.error = error?.response?.data?.detail || 'Ошибка загрузки единицы измерения';
                throw error;
            }
            finally {
                this.loading = false;
            }
        },
        // Create new unit
        async create(data) {
            this.loading = true;
            this.error = null;
            try {
                const { data: newUnit } = await api.post(endpoints.units.list, data);
                // Add to list
                this.items.unshift(newUnit);
                this.pagination.count++;
                return newUnit;
            }
            catch (error) {
                this.error = error?.response?.data?.detail || 'Ошибка создания единицы измерения';
                throw error;
            }
            finally {
                this.loading = false;
            }
        },
        // Update unit
        async update(id, data) {
            this.loading = true;
            this.error = null;
            try {
                const { data: updatedUnit } = await api.patch(endpoints.units.one(id), data);
                // Update in list
                const index = this.items.findIndex(item => item.id === id);
                if (index !== -1) {
                    this.items[index] = updatedUnit;
                }
                // Update current if it's the same
                if (this.current?.id === id) {
                    this.current = updatedUnit;
                }
                return updatedUnit;
            }
            catch (error) {
                this.error = error?.response?.data?.detail || 'Ошибка обновления единицы измерения';
                throw error;
            }
            finally {
                this.loading = false;
            }
        },
        // Delete unit
        async delete(id) {
            this.loading = true;
            this.error = null;
            try {
                await api.delete(endpoints.units.one(id));
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
                this.error = error?.response?.data?.detail || 'Ошибка удаления единицы измерения';
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
                code: '',
                name: '',
                ordering: 'code'
            };
        },
        // Set current unit
        setCurrent(unit) {
            this.current = unit;
        },
        // Clear error
        clearError() {
            this.error = null;
        }
    }
});
