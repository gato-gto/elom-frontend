import { defineStore } from 'pinia';
import api from '@/api/client';
import { endpoints, buildQuery } from '@/api/endpoints';
export const useMaterialsStore = defineStore('materials', {
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
            category: null,
            default_unit: null,
            ordering: 'name'
        }
    }),
    getters: {
        // Get material by ID
        getById: (state) => (id) => {
            return state.items.find(item => item.id === id);
        },
        // Get materials by category
        getByCategory: (state) => (categoryId) => {
            return state.items.filter(item => item.category === categoryId);
        },
        // Check if material exists
        exists: (state) => (id) => {
            return state.items.some(item => item.id === id);
        },
        // Select options for dropdowns
        selectOptions: (state) => {
            return state.items.map(item => ({
                value: item.id,
                label: item.name
            }));
        }
    },
    actions: {
        // Fetch materials list
        async fetchList(params) {
            this.loading = true;
            this.error = null;
            try {
                const queryParams = {
                    page: params?.page || this.pagination.page,
                    page_size: this.pagination.pageSize,
                    search: params?.search ?? this.filters.search ?? undefined,
                    category: params?.category ?? this.filters.category ?? undefined,
                    default_unit: params?.default_unit ?? this.filters.default_unit ?? undefined,
                    ordering: params?.ordering ?? this.filters.ordering
                };
                const query = buildQuery(queryParams);
                const { data } = await api.get(endpoints.materials.list + query);
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
                this.error = error?.response?.data?.detail || 'Ошибка загрузки материалов';
                throw error;
            }
            finally {
                this.loading = false;
            }
        },
        // Fetch single material
        async fetchOne(id) {
            this.loading = true;
            this.error = null;
            try {
                const { data } = await api.get(endpoints.materials.one(id));
                this.current = data;
                // Update in list if exists
                const index = this.items.findIndex(item => item.id === id);
                if (index !== -1) {
                    this.items[index] = data;
                }
                return data;
            }
            catch (error) {
                this.error = error?.response?.data?.detail || 'Ошибка загрузки материала';
                throw error;
            }
            finally {
                this.loading = false;
            }
        },
        // Create new material
        async create(data) {
            this.loading = true;
            this.error = null;
            try {
                const { data: newMaterial } = await api.post(endpoints.materials.list, data);
                // Add to list
                this.items.unshift(newMaterial);
                this.pagination.count++;
                return newMaterial;
            }
            catch (error) {
                this.error = error?.response?.data?.detail || 'Ошибка создания материала';
                throw error;
            }
            finally {
                this.loading = false;
            }
        },
        // Update material
        async update(id, data) {
            this.loading = true;
            this.error = null;
            try {
                const { data: updatedMaterial } = await api.patch(endpoints.materials.one(id), data);
                // Update in list
                const index = this.items.findIndex(item => item.id === id);
                if (index !== -1) {
                    this.items[index] = updatedMaterial;
                }
                // Update current if it's the same
                if (this.current?.id === id) {
                    this.current = updatedMaterial;
                }
                return updatedMaterial;
            }
            catch (error) {
                this.error = error?.response?.data?.detail || 'Ошибка обновления материала';
                throw error;
            }
            finally {
                this.loading = false;
            }
        },
        // Delete material
        async delete(id) {
            this.loading = true;
            this.error = null;
            try {
                await api.delete(endpoints.materials.one(id));
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
                this.error = error?.response?.data?.detail || 'Ошибка удаления материала';
                throw error;
            }
            finally {
                this.loading = false;
            }
        },
        // Upload photo
        async uploadPhoto(id, file) {
            this.loading = true;
            this.error = null;
            try {
                const formData = new FormData();
                formData.append('photo', file);
                await api.post(endpoints.materials.uploadPhoto(id), formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                // Refresh the material to get updated photo_url
                await this.fetchOne(id);
                return true;
            }
            catch (error) {
                this.error = error?.response?.data?.detail || 'Ошибка загрузки фото';
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
                category: null,
                default_unit: null,
                ordering: 'name'
            };
        },
        // Set current material
        setCurrent(material) {
            this.current = material;
        },
        // Clear error
        clearError() {
            this.error = null;
        }
    }
});
