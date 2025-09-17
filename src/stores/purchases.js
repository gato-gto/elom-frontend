import { defineStore } from 'pinia';
import api from '@/api/client';
import { endpoints, buildQuery } from '@/api/endpoints';
export const usePurchasesStore = defineStore('purchases', {
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
            date_from: '',
            date_to: '',
            object: null,
            material: null,
            responsible: null,
            search: '',
            is_archived: false,
            ordering: '-date'
        }
    }),
    getters: {
        // Get purchase by ID
        getById: (state) => (id) => {
            return state.items.find(item => item.id === id);
        },
        // Get purchases by object
        getByObject: (state) => (objectId) => {
            return state.items.filter(item => item.object === objectId);
        },
        // Get purchases by responsible
        getByResponsible: (state) => (responsibleId) => {
            return state.items.filter(item => item.responsible === responsibleId);
        },
        // Get active purchases (not archived)
        activePurchases: (state) => {
            return state.items.filter(item => !item.is_archived);
        },
        // Get archived purchases
        archivedPurchases: (state) => {
            return state.items.filter(item => item.is_archived);
        },
        // Check if purchase exists
        exists: (state) => (id) => {
            return state.items.some(item => item.id === id);
        },
        // Calculate total amount for current purchases
        totalAmount: (state) => {
            return state.items.reduce((sum, purchase) => {
                return sum + parseFloat(purchase.total_amount || '0');
            }, 0);
        }
    },
    actions: {
        // Fetch purchases list
        async fetchList(params) {
            this.loading = true;
            this.error = null;
            try {
                const queryParams = {
                    page: params?.page || this.pagination.page,
                    page_size: this.pagination.pageSize,
                    date_from: params?.date_from ?? this.filters.date_from ?? undefined,
                    date_to: params?.date_to ?? this.filters.date_to ?? undefined,
                    object: params?.object ?? this.filters.object ?? undefined,
                    material: params?.material ?? this.filters.material ?? undefined,
                    responsible: params?.responsible ?? this.filters.responsible ?? undefined,
                    search: params?.search ?? this.filters.search ?? undefined,
                    is_archived: params?.is_archived ?? this.filters.is_archived ?? undefined,
                    ordering: params?.ordering ?? this.filters.ordering
                };
                const query = buildQuery(queryParams);
                const { data } = await api.get(endpoints.purchases.list + query);
                this.items = data.results;
                this.pagination = {
                    count: data.count,
                    page: queryParams.page || 1,
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
                this.error = error?.response?.data?.detail || 'Ошибка загрузки закупок';
                throw error;
            }
            finally {
                this.loading = false;
            }
        },
        // Fetch single purchase
        async fetchOne(id) {
            this.loading = true;
            this.error = null;
            try {
                const { data } = await api.get(endpoints.purchases.one(id));
                this.current = data;
                // Update in list if exists
                const index = this.items.findIndex(item => item.id === id);
                if (index !== -1) {
                    this.items[index] = data;
                }
                return data;
            }
            catch (error) {
                this.error = error?.response?.data?.detail || 'Ошибка загрузки закупки';
                throw error;
            }
            finally {
                this.loading = false;
            }
        },
        // Create new purchase
        async create(data) {
            this.loading = true;
            this.error = null;
            try {
                const { data: newPurchase } = await api.post(endpoints.purchases.list, data);
                // Add to list
                this.items.unshift(newPurchase);
                this.pagination.count++;
                return newPurchase;
            }
            catch (error) {
                this.error = error?.response?.data?.detail || 'Ошибка создания закупки';
                throw error;
            }
            finally {
                this.loading = false;
            }
        },
        // Update purchase
        async update(id, data) {
            this.loading = true;
            this.error = null;
            try {
                const { data: updatedPurchase } = await api.patch(endpoints.purchases.one(id), data);
                // Update in list
                const index = this.items.findIndex(item => item.id === id);
                if (index !== -1) {
                    this.items[index] = updatedPurchase;
                }
                // Update current if it's the same
                if (this.current?.id === id) {
                    this.current = updatedPurchase;
                }
                return updatedPurchase;
            }
            catch (error) {
                this.error = error?.response?.data?.detail || 'Ошибка обновления закупки';
                throw error;
            }
            finally {
                this.loading = false;
            }
        },
        // Delete purchase
        async delete(id) {
            this.loading = true;
            this.error = null;
            try {
                await api.delete(endpoints.purchases.one(id));
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
                this.error = error?.response?.data?.detail || 'Ошибка удаления закупки';
                throw error;
            }
            finally {
                this.loading = false;
            }
        },
        // Upload photo for purchase
        async uploadPhoto(id, data) {
            this.loading = true;
            this.error = null;
            try {
                const formData = new FormData();
                formData.append('photo', data.photo);
                if (data.is_cover !== undefined) {
                    formData.append('is_cover', data.is_cover.toString());
                }
                await api.post(endpoints.purchases.uploadPhoto(id), formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                // Refresh the purchase to get updated photos
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
        // Export purchases to Excel
        async exportToExcel(params) {
            this.loading = true;
            this.error = null;
            try {
                const queryParams = {
                    ...this.filters,
                    ...params,
                    export: 'xlsx'
                };
                const query = buildQuery(queryParams);
                const response = await api.get(endpoints.purchases.list + query, {
                    responseType: 'blob'
                });
                // Create download link
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `purchases_${new Date().toISOString().split('T')[0]}.xlsx`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                return true;
            }
            catch (error) {
                this.error = error?.response?.data?.detail || 'Ошибка экспорта закупок';
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
                date_from: '',
                date_to: '',
                object: null,
                material: null,
                responsible: null,
                search: '',
                is_archived: false,
                ordering: '-date'
            };
        },
        // Set current purchase
        setCurrent(purchase) {
            this.current = purchase;
        },
        // Clear error
        clearError() {
            this.error = null;
        }
    }
});
