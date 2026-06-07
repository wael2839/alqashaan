import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
    withCredentials: true,
    withXSRFToken: true,
});

export default api;

export interface DashboardMonthlyTrend {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
}

export interface DashboardStats {
    from_date: string | null;
    to_date: string | null;
    total_revenue: number;
    collected_outside_period: number;
    total_expenses: number;
    net_profit: number;
    active_bookings: number;
    completed_bookings: number;
    cancelled_bookings: number;
    total_bookings: number;
    monthly_trends: DashboardMonthlyTrend[];
}

export interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

export interface PaginatedBookings {
    data: Booking[];
    meta: PaginationMeta;
}

export interface Booking {
    id: number;
    contract_number: string;
    customer_name: string;
    phone: string;
    amount: number;
    amount_paid: number;
    amount_remaining: number;
    is_fully_paid: boolean;
    booking_date: string;
    type: 'full' | 'men' | 'women';
    status: 'active' | 'completed' | 'cancelled';
    total_revenue: number;
    total_expenses: number;
    net_profit: number;
    created_at: string;
    updated_at: string;
    payments?: Payment[];
    expenses?: Expense[];
}

export interface Payment {
    id: number;
    booking_id: number;
    amount: number;
    description: string | null;
    payment_date: string;
}

export interface Expense {
    id: number;
    booking_id: number;
    amount: number;
    description: string | null;
    expense_date: string;
}

export interface BookedSlot {
    type: Booking['type'];
    customer_name: string;
}

export interface DateAvailability {
    date: string;
    available: boolean;
    booked_types: Booking['type'][];
    bookings: BookedSlot[];
}

export interface MonthAvailability {
    month: string;
    type: Booking['type'];
    dates: DateAvailability[];
}

export const dashboardApi = {
    stats: (params?: { from_date?: string; to_date?: string }) =>
        api.get<DashboardStats>('/dashboard/stats', { params }).then((r) => r.data),
};

export const bookingsApi = {
    list: (params?: { status?: string; search?: string; page?: number; per_page?: number }) =>
        api.get<PaginatedBookings>('/bookings', { params }).then((r) => r.data),
    availability: (params: { month: string; type: Booking['type']; exclude_booking_id?: number }) =>
        api.get<{ data: MonthAvailability }>('/bookings/availability', { params }).then((r) => r.data.data),
    get: (id: number) => api.get<{ data: Booking }>(`/bookings/${id}`).then((r) => r.data.data),
    create: (data: Omit<Booking, 'id' | 'total_revenue' | 'total_expenses' | 'net_profit' | 'created_at' | 'updated_at'>) =>
        api.post<{ data: Booking }>('/bookings', data).then((r) => r.data),
    update: (id: number, data: Partial<Booking>) => api.put<{ data: Booking }>(`/bookings/${id}`, data).then((r) => r.data),
    delete: (id: number) => api.delete(`/bookings/${id}`),
    complete: (id: number) => api.patch<{ data: Booking }>(`/bookings/${id}/complete`).then((r) => r.data),
    cancel: (id: number) => api.patch<{ data: Booking }>(`/bookings/${id}/cancel`).then((r) => r.data),
    reactivate: (id: number) => api.patch<{ data: Booking }>(`/bookings/${id}/reactivate`).then((r) => r.data),
};

export const paymentsApi = {
    list: (bookingId: number) => api.get<{ data: Payment[] }>(`/bookings/${bookingId}/payments`).then((r) => r.data.data),
    create: (bookingId: number, data: Omit<Payment, 'id' | 'booking_id'>) =>
        api.post<{ data: Payment }>(`/bookings/${bookingId}/payments`, data).then((r) => r.data),
    update: (bookingId: number, paymentId: number, data: Partial<Payment>) =>
        api.put<{ data: Payment }>(`/bookings/${bookingId}/payments/${paymentId}`, data).then((r) => r.data),
    delete: (bookingId: number, paymentId: number) => api.delete(`/bookings/${bookingId}/payments/${paymentId}`),
};

export const expensesApi = {
    list: (bookingId: number) => api.get<{ data: Expense[] }>(`/bookings/${bookingId}/expenses`).then((r) => r.data.data),
    create: (bookingId: number, data: Omit<Expense, 'id' | 'booking_id'>) =>
        api.post<{ data: Expense }>(`/bookings/${bookingId}/expenses`, data).then((r) => r.data),
    update: (bookingId: number, expenseId: number, data: Partial<Expense>) =>
        api.put<{ data: Expense }>(`/bookings/${bookingId}/expenses/${expenseId}`, data).then((r) => r.data),
    delete: (bookingId: number, expenseId: number) => api.delete(`/bookings/${bookingId}/expenses/${expenseId}`),
};
