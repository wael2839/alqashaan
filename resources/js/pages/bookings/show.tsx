import { AdminOnlyButton } from '@/components/admin-only-button';
import { BookingDatePicker, preventDialogDismissOnDatePicker } from '@/components/booking-date-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useConfirm } from '@/hooks/use-confirm';
import AppLayout from '@/layouts/app-layout';
import { bookingsApi, expensesApi, paymentsApi, type Booking, type Expense, type Payment } from '@/lib/api';
import {
    BOOKING_STATUS_LABELS,
    BOOKING_TYPE_LABELS,
    bookingStatusBadgeClass,
    contractNumberForForm,
    formatContractNumber,
    formatCurrency,
    formatDualDate,
} from '@/lib/dates';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight, Banknote, CalendarDays, CheckCircle2, CircleDollarSign, Pencil, Receipt, RotateCcw, Trash2, TrendingUp, Wallet, XCircle } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

interface Props {
    bookingId: number;
}

export default function BookingShow({ bookingId }: Props) {
    const { isAdmin } = useAuth();
    const { confirm, alert } = useConfirm();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [editOpen, setEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        contract_number: '',
        customer_name: '',
        phone: '',
        amount: '',
        booking_date: '',
        notes: '',
        type: 'full' as Booking['type'],
    });

    const notesFieldClass =
        'flex min-h-[88px] w-full rounded-xl border border-input bg-background px-4 py-2.5 text-base shadow-sm ring-offset-background transition-all duration-200 ease-in-out placeholder:text-muted-foreground hover:border-primary/30 focus-visible:border-ring focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm';
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [paymentForm, setPaymentForm] = useState({ amount: '', description: '', payment_date: new Date().toISOString().split('T')[0] });
    const [expenseForm, setExpenseForm] = useState({ amount: '', description: '', expense_date: new Date().toISOString().split('T')[0] });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'لوحة التحكم', href: '/dashboard' },
        { title: 'الحجوزات', href: '/bookings' },
        { title: booking ? formatContractNumber(booking.contract_number) : '...', href: `/bookings/${bookingId}` },
    ];

    const loadBooking = () => {
        setLoading(true);
        bookingsApi
            .get(bookingId)
            .then(setBooking)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadBooking();
    }, [bookingId]);

    const openEditDialog = () => {
        if (!booking) return;

        setEditForm({
            contract_number: contractNumberForForm(booking.contract_number),
            customer_name: booking.customer_name,
            phone: booking.phone,
            amount: String(booking.amount),
            booking_date: booking.booking_date,
            notes: booking.notes ?? '',
            type: booking.type,
        });
        setEditErrors({});
        setEditOpen(true);
    };

    const handleEdit = async (e: FormEvent) => {
        e.preventDefault();
        if (!booking) return;

        setEditSubmitting(true);
        setEditErrors({});

        try {
            const payload: Partial<Booking> = {
                contract_number: editForm.contract_number,
                customer_name: editForm.customer_name,
                phone: editForm.phone,
                amount: parseFloat(editForm.amount),
                notes: editForm.notes,
            };

            if (booking.status === 'active') {
                payload.booking_date = editForm.booking_date;
                payload.type = editForm.type;
            }

            await bookingsApi.update(bookingId, payload);
            setEditOpen(false);
            loadBooking();
        } catch (error: unknown) {
            if (error && typeof error === 'object' && 'response' in error) {
                const response = (error as { response?: { data?: { errors?: Record<string, string[]> } } }).response;
                const fieldErrors = response?.data?.errors ?? {};
                setEditErrors(Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [k, v[0]])));
            }
        } finally {
            setEditSubmitting(false);
        }
    };

    const handleComplete = async () => {
        const confirmed = await confirm({
            title: 'إنهاء الحجز',
            description: 'سيتم تحديد الحجز كمكتمل. لن يمكن إضافة مدفوعات أو مصروفات حتى إعادة التفعيل.',
            confirmLabel: 'إنهاء الحجز',
            variant: 'default',
        });

        if (!confirmed) {
            return;
        }

        await bookingsApi.complete(bookingId);
        loadBooking();
    };

    const handleCancel = async () => {
        const confirmed = await confirm({
            title: 'إلغاء الحجز',
            description: 'ستُحفظ البيانات المالية في الإحصائيات ويصبح التاريخ متاحاً للحجز.',
            confirmLabel: 'إلغاء الحجز',
            variant: 'warning',
        });

        if (!confirmed) {
            return;
        }

        await bookingsApi.cancel(bookingId);
        loadBooking();
    };

    const handleReactivate = async () => {
        const confirmed = await confirm({
            title: 'إعادة تفعيل الحجز',
            description: 'سيعود الحجز نشطاً ويمكن إضافة مدفوعات ومصروفات من جديد.',
            confirmLabel: 'إعادة التفعيل',
            variant: 'default',
        });

        if (!confirmed) {
            return;
        }

        try {
            await bookingsApi.reactivate(bookingId);
            loadBooking();
        } catch (error: unknown) {
            if (error && typeof error === 'object' && 'response' in error) {
                const response = (error as { response?: { data?: { errors?: Record<string, string[]> } } }).response;
                const message = response?.data?.errors?.booking_date?.[0] ?? response?.data?.errors?.status?.[0];

                if (message) {
                    await alert({ title: 'تعذّر إعادة التفعيل', description: message, variant: 'warning' });
                }
            }
        }
    };

    const handleDelete = async () => {
        const confirmed = await confirm({
            title: 'حذف الحجز نهائياً',
            description: 'سيتم حذف الحجز وجميع المدفوعات والمصروفات المرتبطة به. لا يمكن التراجع عن هذا الإجراء.',
            confirmLabel: 'حذف نهائي',
            variant: 'destructive',
        });

        if (!confirmed) {
            return;
        }

        await bookingsApi.delete(bookingId);
        router.visit('/bookings');
    };

    const handleAddPayment = async (e: FormEvent) => {
        e.preventDefault();
        await paymentsApi.create(bookingId, {
            amount: parseFloat(paymentForm.amount),
            description: paymentForm.description || null,
            payment_date: paymentForm.payment_date,
        });
        setPaymentForm({ amount: '', description: '', payment_date: new Date().toISOString().split('T')[0] });
        loadBooking();
    };

    const handleAddExpense = async (e: FormEvent) => {
        e.preventDefault();
        await expensesApi.create(bookingId, {
            amount: parseFloat(expenseForm.amount),
            description: expenseForm.description || null,
            expense_date: expenseForm.expense_date,
        });
        setExpenseForm({ amount: '', description: '', expense_date: new Date().toISOString().split('T')[0] });
        loadBooking();
    };

    const handleDeletePayment = async (payment: Payment) => {
        const confirmed = await confirm({
            title: 'حذف الدفعة',
            description: 'هل تريد حذف هذه الدفعة؟ لا يمكن التراجع عن هذا الإجراء.',
            confirmLabel: 'حذف الدفعة',
            variant: 'destructive',
        });

        if (!confirmed) {
            return;
        }

        await paymentsApi.delete(bookingId, payment.id);
        loadBooking();
    };

    const handleDeleteExpense = async (expense: Expense) => {
        const confirmed = await confirm({
            title: 'حذف المصروف',
            description: 'هل تريد حذف هذا المصروف؟ لا يمكن التراجع عن هذا الإجراء.',
            confirmLabel: 'حذف المصروف',
            variant: 'destructive',
        });

        if (!confirmed) {
            return;
        }

        await expensesApi.delete(bookingId, expense.id);
        loadBooking();
    };

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="تفاصيل الحجز" />
                <div className="flex items-center justify-center gap-2 p-6 text-muted-foreground">
                    <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    جاري التحميل...
                </div>
            </AppLayout>
        );
    }

    if (!booking) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="تفاصيل الحجز" />
                <div className="p-6 text-center text-muted-foreground">الحجز غير موجود</div>
            </AppLayout>
        );
    }

    const dates = formatDualDate(booking.booking_date, booking.hijri_date);
    const isActive = booking.status === 'active';
    const canModifyFinancials = isActive && isAdmin;

    const statCards = [
        {
            title: 'التاريخ',
            icon: CalendarDays,
            iconClass: 'icon-tile-primary',
            content: (
                <>
                    <p className="detail-card-value">{dates.weekday}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{dates.gregorian}</p>
                    <p className="cell-date-hijri mt-0.5">{dates.hijri}</p>
                </>
            ),
        },
        {
            title: 'النوع / الحالة',
            icon: CheckCircle2,
            iconClass: 'icon-tile-neutral',
            content: (
                <>
                    <span className="badge-type mb-1 inline-flex">{BOOKING_TYPE_LABELS[booking.type]}</span>
                    <p>
                        <span className={bookingStatusBadgeClass(booking.status)}>
                            {BOOKING_STATUS_LABELS[booking.status]}
                        </span>
                    </p>
                </>
            ),
        },
        {
            title: 'مبلغ الحجز',
            icon: Banknote,
            iconClass: 'icon-tile-primary',
            content: <p className="detail-card-value-lg finance-amount-primary">{formatCurrency(booking.amount)}</p>,
        },
        {
            title: 'المدفوع',
            icon: CircleDollarSign,
            iconClass: 'icon-tile-revenue',
            content: (
                <>
                    <p className="detail-card-value-lg finance-text-revenue">{formatCurrency(booking.amount_paid)}</p>
                    {booking.is_fully_paid && (
                        <span className="badge-completed mt-1 inline-flex">مكتمل الدفع</span>
                    )}
                </>
            ),
        },
        {
            title: 'المتبقي',
            icon: Wallet,
            iconClass: booking.amount_remaining > 0 ? 'icon-tile-expense' : 'icon-tile-revenue',
            content: (
                <p className={cn('detail-card-value-lg', booking.amount_remaining > 0 ? 'finance-text-expense' : 'finance-text-revenue')}>
                    {formatCurrency(booking.amount_remaining)}
                </p>
            ),
        },
        {
            title: 'صافي الربح',
            icon: TrendingUp,
            iconClass: 'icon-tile-neutral',
            content: (
                <>
                    <p className={cn('detail-card-value-lg', booking.net_profit >= 0 ? 'finance-text-profit' : 'finance-text-expense')}>
                        {formatCurrency(booking.net_profit)}
                    </p>
                    <p className="detail-card-meta mt-1">مصروفات: {formatCurrency(booking.total_expenses)}</p>
                </>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`حجز ${formatContractNumber(booking.contract_number)}`} />
            <div className="page-container">
                <div className="page-header flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <Button variant="ghost" size="sm" asChild className="mb-2 -me-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                            <Link href="/bookings">
                                <ArrowRight className="ms-1 size-4" />
                                العودة للحجوزات
                            </Link>
                        </Button>
                        <h1 className="page-title">{booking.customer_name}</h1>
                        <p className="page-subtitle">
                            {formatContractNumber(booking.contract_number)} — {booking.phone}
                        </p>
                    </div>
                    {isAdmin && (
                        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                            <AdminOnlyButton onClick={openEditDialog} variant="outline">
                                <Pencil className="ms-2 size-4" />
                                تعديل
                            </AdminOnlyButton>
                            {booking.status === 'active' && (
                                <>
                                    <AdminOnlyButton onClick={handleComplete} variant="outline">
                                        <CheckCircle2 className="ms-2 size-4" />
                                        إنهاء الحجز
                                    </AdminOnlyButton>
                                    <AdminOnlyButton onClick={handleCancel} variant="outline" className="text-warning hover:bg-warning/10">
                                        <XCircle className="ms-2 size-4" />
                                        إلغاء الحجز
                                    </AdminOnlyButton>
                                </>
                            )}
                            {(booking.status === 'completed' || booking.status === 'cancelled') && (
                                <AdminOnlyButton onClick={handleReactivate} variant="outline">
                                    <RotateCcw className="ms-2 size-4" />
                                    إعادة تفعيل
                                </AdminOnlyButton>
                            )}
                            <AdminOnlyButton onClick={handleDelete} variant="outline" className="text-destructive hover:bg-destructive/10">
                                <Trash2 className="ms-2 size-4" />
                                حذف
                            </AdminOnlyButton>
                        </div>
                    )}
                </div>

                {!isActive && (
                    <div className="alert-banner alert-banner-warning">
                        {booking.status === 'completed'
                            ? 'هذا الحجز مكتمل. لا يمكن إضافة مدفوعات أو مصروفات إلا بعد إعادة التفعيل.'
                            : 'هذا الحجز ملغى. البيانات المالية محفوظة في الإحصائيات والتاريخ متاح للحجز. أعد التفعيل لإضافة مدفوعات أو مصروفات.'}
                    </div>
                )}

                {booking.notes && (
                    <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
                        <p className="text-sm font-medium text-foreground">ملاحظات</p>
                        <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{booking.notes}</p>
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    {statCards.map((card) => (
                        <Card key={card.title} className="detail-card">
                            <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                                <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg ring-1', card.iconClass)}>
                                    <card.icon className="size-3.5" />
                                </span>
                                <CardTitle className="detail-card-label">{card.title}</CardTitle>
                            </CardHeader>
                            <CardContent >{card.content}</CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="panel-card">
                        <CardHeader className="panel-header-revenue">
                            <CardTitle className="section-title flex items-center gap-2">
                                <Receipt className="size-4 finance-text-revenue" />
                                المدفوعات (إيرادات)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            {canModifyFinancials && (
                                <form onSubmit={handleAddPayment} className="form-panel">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <Label>المبلغ</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                value={paymentForm.amount}
                                                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>التاريخ</Label>
                                            <Input
                                                type="date"
                                                value={paymentForm.payment_date}
                                                onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>الوصف</Label>
                                        <Input
                                            value={paymentForm.description}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                                        />
                                    </div>
                                    <AdminOnlyButton type="submit" size="sm">
                                        إضافة دفعة
                                    </AdminOnlyButton>
                                </form>
                            )}
                            <div className="space-y-2">
                                {(booking.payments ?? []).length === 0 ? (
                                    <p className="text-sm text-muted-foreground">لا توجد مدفوعات</p>
                                ) : (
                                    booking.payments?.map((payment) => (
                                        <div key={payment.id} className="list-item">
                                            <div>
                                                <p className="list-item-amount finance-text-revenue">{formatCurrency(Number(payment.amount))}</p>
                                                <p className="cell-secondary">
                                                    {payment.description || '—'} · {formatDualDate(payment.payment_date).gregorian}
                                                </p>
                                            </div>
                                            {canModifyFinancials && (
                                                <AdminOnlyButton
                                                    variant="ghost"
                                                    size="icon"
                                                    className="hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => handleDeletePayment(payment)}
                                                >
                                                    <Trash2 className="size-4" />
                                                </AdminOnlyButton>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="panel-card">
                        <CardHeader className="panel-header-expense">
                            <CardTitle className="section-title flex items-center gap-2">
                                <Receipt className="size-4 finance-text-expense" />
                                المصروفات
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            {canModifyFinancials && (
                                <form onSubmit={handleAddExpense} className="form-panel">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <Label>المبلغ</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                value={expenseForm.amount}
                                                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>التاريخ</Label>
                                            <Input
                                                type="date"
                                                value={expenseForm.expense_date}
                                                onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>الوصف</Label>
                                        <Input
                                            value={expenseForm.description}
                                            onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                                        />
                                    </div>
                                    <AdminOnlyButton type="submit" size="sm">
                                        إضافة مصروف
                                    </AdminOnlyButton>
                                </form>
                            )}
                            <div className="space-y-2">
                                {(booking.expenses ?? []).length === 0 ? (
                                    <p className="text-sm text-muted-foreground">لا توجد مصروفات</p>
                                ) : (
                                    booking.expenses?.map((expense) => (
                                        <div key={expense.id} className="list-item">
                                            <div>
                                                <p className="list-item-amount finance-text-expense">{formatCurrency(Number(expense.amount))}</p>
                                                <p className="cell-secondary">
                                                    {expense.description || '—'} · {formatDualDate(expense.expense_date).gregorian}
                                                </p>
                                            </div>
                                            {canModifyFinancials && (
                                                <AdminOnlyButton
                                                    variant="ghost"
                                                    size="icon"
                                                    className="hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => handleDeleteExpense(expense)}
                                                >
                                                    <Trash2 className="size-4" />
                                                </AdminOnlyButton>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent
                    className="max-h-[90vh] overflow-y-auto sm:max-w-md"
                    dir="rtl"
                    onPointerDownOutside={preventDialogDismissOnDatePicker}
                    onInteractOutside={preventDialogDismissOnDatePicker}
                >
                    <DialogHeader>
                        <DialogTitle>تعديل بيانات الحجز</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEdit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit_customer_name">اسم العميل</Label>
                            <Input
                                id="edit_customer_name"
                                value={editForm.customer_name}
                                onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit_phone">رقم الجوال</Label>
                            <Input
                                id="edit_phone"
                                value={editForm.phone}
                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                required
                            />
                        </div>
                        {booking.status === 'active' ? (
                            <div className="space-y-2">
                                <Label>نوع الحجز</Label>
                                <Select
                                    value={editForm.type}
                                    onValueChange={(v) => setEditForm({ ...editForm, type: v as Booking['type'], booking_date: editForm.booking_date })}
                                >
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
                        ) : (
                            <p className="rounded-xl border border-border bg-muted/60 px-3 py-2.5 text-sm text-muted-foreground">
                                لا يمكن تعديل التاريخ أو النوع إلا بعد إعادة تفعيل الحجز.
                            </p>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="edit_amount">مبلغ الحجز (ر.س)</Label>
                            <Input
                                id="edit_amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={editForm.amount}
                                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                                required
                            />
                            {editErrors.amount && <p className="text-sm text-destructive">{editErrors.amount}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit_contract_number">رقم العقد (اختياري)</Label>
                            <Input
                                id="edit_contract_number"
                                value={editForm.contract_number}
                                onChange={(e) => setEditForm({ ...editForm, contract_number: e.target.value })}
                                placeholder="0"
                            />
                            <p className="meta-text">اتركه فارغاً لعرض 0</p>
                            {editErrors.contract_number && <p className="text-sm text-destructive">{editErrors.contract_number}</p>}
                        </div>
                        {booking.status === 'active' && (
                            <div className="space-y-2">
                                <Label>تاريخ الحجز</Label>
                                <BookingDatePicker
                                    value={editForm.booking_date}
                                    onChange={(booking_date) => setEditForm({ ...editForm, booking_date })}
                                    type={editForm.type}
                                    excludeBookingId={bookingId}
                                    error={editErrors.booking_date}
                                />
                                <p className="meta-text">التاريخ المعتمد في النظام هو الميلادي؛ التاريخ الهجري للعرض فقط.</p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="edit_notes">ملاحظات (اختياري)</Label>
                            <textarea
                                id="edit_notes"
                                className={notesFieldClass}
                                value={editForm.notes}
                                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                placeholder="مثال: ثاني العيد، حفل نساء فقط..."
                                rows={3}
                                maxLength={500}
                            />
                            {editErrors.notes && <p className="text-sm text-destructive">{editErrors.notes}</p>}
                        </div>
                        <DialogFooter>
                            <AdminOnlyButton type="submit" disabled={editSubmitting}>
                                {editSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                            </AdminOnlyButton>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
