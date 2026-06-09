import { AdminOnlyButton } from '@/components/admin-only-button';
import { BookingDatePicker, preventDialogDismissOnDatePicker } from '@/components/booking-date-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import AppLayout from '@/layouts/app-layout';
import { bookingsApi, type Booking, type PaginationMeta } from '@/lib/api';
import {
    BOOKING_STATUS_LABELS,
    BOOKING_TYPE_LABELS,
    bookingStatusBadgeClass,
    formatContractNumber,
    formatCurrency,
    formatDualDate,
} from '@/lib/dates';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, CalendarDays, Plus, Search } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'لوحة التحكم', href: '/dashboard' },
    { title: 'الحجوزات', href: '/bookings' },
];

const emptyForm = {
    contract_number: '',
    customer_name: '',
    phone: '',
    amount: '',
    booking_date: '',
    notes: '',
    type: 'full' as Booking['type'],
};

const notesFieldClass =
    'flex min-h-[88px] w-full rounded-xl border border-input bg-background px-4 py-2.5 text-base shadow-sm ring-offset-background transition-all duration-200 ease-in-out placeholder:text-muted-foreground hover:border-primary/30 focus-visible:border-ring focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm';

const statusTabs: { value: Booking['status']; label: string }[] = [
    { value: 'active', label: 'نشطة' },
    { value: 'completed', label: 'مكتملة' },
];

function BookingStatusBadges({ booking, layout }: { booking: Booking; layout: 'mobile' | 'desktop' }) {
    const statusBadge = (
        <span className={bookingStatusBadgeClass(booking.status)}>{BOOKING_STATUS_LABELS[booking.status]}</span>
    );

    const notesBadge = booking.notes ? (
        <span className="badge-notes" title={booking.notes}>
            {booking.notes}
        </span>
    ) : null;

    if (layout === 'mobile') {
        return (
            <div className="flex flex-wrap items-center justify-end gap-1.5">
                {notesBadge}
                {statusBadge}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-start gap-1.5">
            {statusBadge}
            {notesBadge}
        </div>
    );
}

export default function BookingsIndex() {
    const { isAdmin } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<Booking['status']>('active');
    const [page, setPage] = useState(1);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const loadBookings = useCallback(() => {
        setLoading(true);
        bookingsApi
            .list({
                status: statusFilter,
                search: appliedSearch || undefined,
                page,
            })
            .then((response) => {
                setBookings(response.data);
                setMeta(response.meta);
            })
            .finally(() => setLoading(false));
    }, [statusFilter, appliedSearch, page]);

    useEffect(() => {
        loadBookings();
    }, [loadBookings]);

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        setPage(1);
        setAppliedSearch(search);
    };

    const handleStatusChange = (status: Booking['status']) => {
        setStatusFilter(status);
        setPage(1);
    };

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();

        if (!form.booking_date) {
            setErrors({ booking_date: 'يرجى اختيار تاريخ الحجز' });
            return;
        }

        setSubmitting(true);
        setErrors({});

        try {
            await bookingsApi.create({
                ...form,
                amount: parseFloat(form.amount),
            });
            setDialogOpen(false);
            setForm(emptyForm);
            loadBookings();
        } catch (error: unknown) {
            if (error && typeof error === 'object' && 'response' in error) {
                const response = (error as { response?: { data?: { errors?: Record<string, string[]> } } }).response;
                const fieldErrors = response?.data?.errors ?? {};
                setErrors(Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [k, v[0]])));
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="الحجوزات" />
            <div className="page-container">
                <div className="page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="page-title">إدارة الحجوزات</h1>
                        <p className="page-subtitle">عرض وإدارة حجوزات القاعة</p>
                    </div>

                    {isAdmin && (
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <AdminOnlyButton className="w-full sm:w-auto">
                                    <Plus className="ms-2 size-4" />
                                    حجز جديد
                                </AdminOnlyButton>
                            </DialogTrigger>
                            <DialogContent
                                className="max-h-[90vh] overflow-y-auto sm:max-w-md"
                                dir="rtl"
                                onPointerDownOutside={preventDialogDismissOnDatePicker}
                                onInteractOutside={preventDialogDismissOnDatePicker}
                            >
                                <DialogHeader>
                                    <DialogTitle>إضافة حجز جديد</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleCreate} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="customer_name">اسم العميل</Label>
                                        <Input
                                            id="customer_name"
                                            value={form.customer_name}
                                            onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">رقم الجوال</Label>
                                        <Input
                                            id="phone"
                                            value={form.phone}
                                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>نوع الحجز</Label>
                                        <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as Booking['type'], booking_date: '' })}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="full">كامل</SelectItem>
                                                <SelectItem value="men">رجال</SelectItem>
                                                <SelectItem value="women">نساء</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">مبلغ الحجز (ر.س)</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            placeholder="0.00"
                                            value={form.amount}
                                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                            required
                                        />
                                        {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contract_number">رقم العقد (اختياري)</Label>
                                        <Input
                                            id="contract_number"
                                            value={form.contract_number}
                                            onChange={(e) => setForm({ ...form, contract_number: e.target.value })}
                                            placeholder="0"
                                        />
                                        <p className="meta-text">اتركه فارغاً لعرض 0</p>
                                        {errors.contract_number && <p className="text-sm text-destructive">{errors.contract_number}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="booking_date">تاريخ الحجز</Label>
                                        <BookingDatePicker
                                            value={form.booking_date}
                                            onChange={(booking_date) => setForm({ ...form, booking_date })}
                                            type={form.type}
                                            error={errors.booking_date}
                                        />
                                        <p className="meta-text">التاريخ المعتمد في النظام هو الميلادي؛ التاريخ الهجري للعرض فقط.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="notes">ملاحظات (اختياري)</Label>
                                        <textarea
                                            id="notes"
                                            className={notesFieldClass}
                                            value={form.notes}
                                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                            placeholder="مثال: ثاني العيد، حفل نساء فقط..."
                                            rows={3}
                                            maxLength={500}
                                        />
                                        {errors.notes && <p className="text-sm text-destructive">{errors.notes}</p>}
                                    </div>
                                    <DialogFooter>
                                        <AdminOnlyButton type="submit" disabled={submitting}>
                                            {submitting ? 'جاري الحفظ...' : 'حفظ الحجز'}
                                        </AdminOnlyButton>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                <Card className="panel-card min-w-0 overflow-hidden">
                    <CardHeader className="border-b border-border bg-muted/40 px-4 py-4 sm:px-6">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <CardTitle className="section-title flex items-center gap-2">
                                    <span className="icon-tile-primary flex size-8 shrink-0 items-center justify-center rounded-xl">
                                        <CalendarDays className="size-4" />
                                    </span>
                                    قائمة الحجوزات
                                </CardTitle>
                                <form onSubmit={handleSearch} className="flex w-full min-w-0 gap-2 sm:w-auto">
                                    <Input
                                        placeholder="بحث بالاسم أو العقد..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="min-w-0 flex-1 bg-background sm:w-48 sm:flex-none"
                                    />
                                    <Button type="submit" variant="outline" size="icon" className="shrink-0">
                                        <Search className="size-4" />
                                    </Button>
                                </form>
                            </div>
                            <div className="flex gap-1 rounded-lg bg-muted p-1">
                                {statusTabs.map((tab) => (
                                    <button
                                        key={tab.value}
                                        type="button"
                                        onClick={() => handleStatusChange(tab.value)}
                                        className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors sm:flex-none ${
                                            statusFilter === tab.value
                                                ? 'bg-background text-foreground shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        {tab.label}
                                        {meta && statusFilter === tab.value && (
                                            <span className="ms-1.5 text-xs text-muted-foreground">({meta.total})</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="min-w-0 p-0!">
                        {loading ? (
                            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                                <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                جاري التحميل...
                            </div>
                        ) : bookings.length === 0 ? (
                            <div className="py-16 text-center text-muted-foreground">لا توجد حجوزات</div>
                        ) : (
                            <>
                                <div className="divide-y divide-border md:hidden">
                                    {bookings.map((booking) => {
                                        const dates = formatDualDate(booking.booking_date, booking.hijri_date);

                                        return (
                                            <button
                                                key={booking.id}
                                                type="button"
                                                className="booking-mobile-card"
                                                onClick={() => router.visit(`/bookings/${booking.id}`)}
                                            >
                                                <div className="booking-mobile-card-header">
                                                    <div className="min-w-0">
                                                        <div className="truncate text-base font-semibold text-foreground">{booking.customer_name}</div>
                                                        <div className="mt-0.5 text-xs text-muted-foreground">{booking.phone}</div>
                                                    </div>
                                                    <BookingStatusBadges booking={booking} layout="mobile" />
                                                </div>

                                                <div className="booking-mobile-card-grid">
                                                    <div>
                                                        <div className="booking-mobile-card-label">العقد</div>
                                                        <div className="booking-mobile-card-value">{formatContractNumber(booking.contract_number)}</div>
                                                    </div>
                                                    <div>
                                                        <div className="booking-mobile-card-label">النوع</div>
                                                        <div className="mt-0.5">
                                                            <span className="badge-type">{BOOKING_TYPE_LABELS[booking.type]}</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="booking-mobile-card-label">التاريخ</div>
                                                        <div className="booking-mobile-card-value">{dates.weekday}</div>
                                                        <div className="text-xs text-muted-foreground">{dates.gregorian}</div>
                                                        <div className="cell-date-hijri text-xs">{dates.hijri}</div>
                                                    </div>
                                                    <div>
                                                        <div className="booking-mobile-card-label">المبلغ</div>
                                                        <div className="booking-mobile-card-value">{formatCurrency(booking.amount)}</div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-muted/50 px-3 py-2 text-xs">
                                                    <span>
                                                        مدفوع:{' '}
                                                        <span className="font-medium finance-text-revenue">{formatCurrency(booking.amount_paid)}</span>
                                                    </span>
                                                    <span>
                                                        متبقي:{' '}
                                                        <span
                                                            className={
                                                                booking.amount_remaining > 0 ? 'font-medium finance-text-expense' : 'font-medium finance-text-revenue'
                                                            }
                                                        >
                                                            {formatCurrency(booking.amount_remaining)}
                                                        </span>
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="hidden md:block table-scroll">
                                    <table className="data-table min-w-[720px]">
                                        <thead>
                                            <tr>
                                                <th>العقد</th>
                                                <th>العميل</th>
                                                <th>التاريخ</th>
                                                <th>المبلغ / الدفع</th>
                                                <th>النوع</th>
                                                <th>الحالة</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bookings.map((booking) => {
                                                const dates = formatDualDate(booking.booking_date, booking.hijri_date);

                                                return (
                                                    <tr
                                                        key={booking.id}
                                                        className="cursor-pointer"
                                                        onClick={() => router.visit(`/bookings/${booking.id}`)}
                                                    >
                                                        <td className="cell-primary">{formatContractNumber(booking.contract_number)}</td>
                                                        <td>
                                                            <div className="cell-primary">{booking.customer_name}</div>
                                                            <div className="cell-secondary">{booking.phone}</div>
                                                        </td>
                                                        <td>
                                                            <div className="cell-primary">{dates.weekday}</div>
                                                            <div className="cell-secondary">{dates.gregorian}</div>
                                                            <div className="cell-date-hijri">{dates.hijri}</div>
                                                        </td>
                                                        <td>
                                                            <div className="cell-primary">{formatCurrency(booking.amount)}</div>
                                                            <div className="cell-secondary">
                                                                مدفوع: <span className="finance-text-revenue">{formatCurrency(booking.amount_paid)}</span>
                                                            </div>
                                                            <div className="cell-secondary">
                                                                متبقي:{' '}
                                                                <span className={booking.amount_remaining > 0 ? 'finance-text-expense' : 'finance-text-revenue'}>
                                                                    {formatCurrency(booking.amount_remaining)}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="badge-type">{BOOKING_TYPE_LABELS[booking.type]}</span>
                                                        </td>
                                                        <td>
                                                            <BookingStatusBadges booking={booking} layout="desktop" />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                        {meta && meta.last_page > 1 && (
                            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="meta-text text-center sm:text-start">
                                    {meta.from !== null && meta.to !== null
                                        ? `عرض ${meta.from}–${meta.to} من ${meta.total} حجز`
                                        : `${meta.total} حجز`}
                                </p>
                                <div className="flex items-center justify-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={meta.current_page <= 1}
                                        onClick={() => setPage((current) => current - 1)}
                                    >
                                        <ChevronRight className="size-4" />
                                        السابق
                                    </Button>
                                    <span className="min-w-16 text-center text-sm text-muted-foreground">
                                        {meta.current_page} / {meta.last_page}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={meta.current_page >= meta.last_page}
                                        onClick={() => setPage((current) => current + 1)}
                                    >
                                        التالي
                                        <ChevronLeft className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
