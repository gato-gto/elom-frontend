import { defineStore } from 'pinia';
import api from '@/api/client';
import { endpoints, buildQuery } from '@/api/endpoints';
export const useEmployeesStore = defineStore('employees', {
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
            role: null,
            is_active: null,
            object: null,
            ordering: 'username'
        }
    }),
    getters: {
        // Get employee by ID
        getById: (state) => (id) => {
            return state.items.find(item => item.id === id);
        },
        // Get employees by role
        getByRole: (state) => (role) => {
            return state.items.filter(item => item.role === role);
        },
        // Get active employees only
        activeEmployees: (state) => {
            return state.items.filter(item => item.is_active);
        },
        // Check if employee exists
        exists: (state) => (id) => {
            return state.items.some(item => item.id === id);
        },
        // Get employees for select options
        selectOptions: (state) => {
            return state.items
                .filter(item => item.is_active)
                .map(emp => ({
                value: emp.id,
                label: `${emp.username}${emp.first_name ? ` (${emp.first_name})` : ''}`
            }));
        },
        // Get employees by object
        getByObject: (state) => (objectId) => {
            return state.items.filter(item => item.assigned_object_ids.includes(objectId));
        }
    },
    actions: {
        // Fetch employees list
        async fetchList(params) {
            this.loading = true;
            this.error = null;
            try {
                const queryParams = {
                    page: params?.page || this.pagination.page,
                    page_size: this.pagination.pageSize,
                    search: params?.search ?? this.filters.search ?? undefined,
                    role: params?.role ?? this.filters.role ?? undefined,
                    is_active: params?.is_active ?? this.filters.is_active ?? undefined,
                    object: params?.object ?? this.filters.object ?? undefined,
                    ordering: params?.ordering ?? this.filters.ordering
                };
                const query = buildQuery(queryParams);
                const { data } = await api.get(endpoints.employees.list + query);
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
                this.error = error?.response?.data?.detail || 'Ошибка загрузки сотрудников';
                throw error;
            }
            finally {
                this.loading = false;
            }
        },
        // Fetch single employee
        async fetchOne(id) {
            this.loading = true;
            this.error = null;
            try {
                const { data } = await api.get(endpoints.employees.one(id));
                this.current = data;
                // Update in list if exists
                const index = this.items.findIndex(item => item.id === id);
                if (index !== -1) {
                    this.items[index] = data;
                }
                return data;
            }
            catch (error) {
                this.error = error?.response?.data?.detail || 'Ошибка загрузки сотрудника';
                throw error;
            }
            finally {
                this.loading = false;
            }
        },
        // Create new employee
        async create(data) {
            this.loading = true;
            this.error = null;
            try {
                const { data: newEmployee } = await api.post(endpoints.employees.list, data);
                // Add to list
                this.items.unshift(newEmployee);
                this.pagination.count++;
                return newEmployee;
            }
            catch (error) {
                this.error = error?.response?.data?.detail || 'Ошибка создания сотрудника';
                throw error;
            }
            finally {
                this.loading = false;
            }
        },
        // Update employee
        async update(id, data) {
            this.loading = true;
            this.error = null;
            try {
                const { data: updatedEmployee } = await api.patch(endpoints.employees.one(id), data);
                // Update in list
                const index = this.items.findIndex(item => item.id === id);
                if (index !== -1) {
                    this.items[index] = updatedEmployee;
                }
                // Update current if it's the same
                if (this.current?.id === id) {
                    this.current = updatedEmployee;
                }
                return updatedEmployee;
            }
            catch (error) {
                this.error = error?.response?.data?.detail || 'Ошибка обновления сотрудника';
                throw error;
            }
            finally {
                this.loading = false;
            }
        },
        // Delete employee
        async delete(id) {
            this.loading = true;
            this.error = null;
            try {
                await api.delete(endpoints.employees.one(id));
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
                this.error = error?.response?.data?.detail || 'Ошибка удаления сотрудника';
                throw error;
            }
            finally {
                this.loading = false;
            }
        },
        // Set password for employee
        async setPassword(id, password) {
            this.loading = true;
            this.error = null;
            try {
                await api.post(endpoints.employees.setPassword(id), { password });
                return true;
            }
            catch (error) {
                this.error = error?.response?.data?.detail || 'Ошибка установки пароля';
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
                role: null,
                is_active: null,
                object: null,
                ordering: 'username'
            };
        },
        // Set current employee
        setCurrent(employee) {
            this.current = employee;
        },
        // Clear error
        clearError() {
            this.error = null;
        }
    }
});
