import axios from './axios-customize';
import type { IBackendRes, IModelPaginate, IInvoice, IPayment, IEnrollment, IUserSummary, IClassroomWithDetails } from '@/types/backend';

export type AccountantEnrollment = Omit<IEnrollment, 'student_id' | 'class_id'> & {
    student_id: string | IUserSummary;
    class_id: string | IClassroomWithDetails;
};
export type AccountantInvoice = Omit<IInvoice, 'enrollment_id'> & { enrollment_id: string | AccountantEnrollment };
export type AccountantPayment = Omit<IPayment, 'invoice_id'> & { invoice_id: string | AccountantInvoice };
export type InvoicePayload = { enrollment_id: string; amount: number; discount_amount: number; final_amount: number; status: string };
export type PaymentPayload = { invoice_id: string; amount: number; payment_method: string; payment_date: string };
export type PaymentReviewPayload = { status: 'APPROVED' | 'REJECTED'; approved_amount?: number };

const dataOf = <T>(response: IBackendRes<T>): T => {
    if (response.data === undefined || response.data === null || Number(response.statusCode) >= 400) {
        throw new Error(response.message || 'Không thể lưu hoặc tải chứng từ.');
    }
    return response.data;
};

async function allPages<T>(resource: string, populate: string): Promise<T[]> {
    const rows: T[] = [];
    let current = 1;
    let pages = 1;
    do {
        const response = await axios.get<unknown, IBackendRes<IModelPaginate<T>>>(
            `/${resource}?current=${current}&pageSize=100&sort=-createdAt&populate=${populate}`,
        );
        const page = dataOf(response);
        if (!Array.isArray(page.result)) throw new Error('Dữ liệu trả về không hợp lệ.');
        rows.push(...page.result);
        pages = Number(page.meta?.pages) || 1;
        current++;
    } while (current <= pages);
    return rows;
}

export const fetchAccountantInvoices = () => allPages<AccountantInvoice>('invoices', 'enrollment_id');
export const fetchAccountantPayments = () => allPages<AccountantPayment>('payments', 'invoice_id');
export const fetchAccountantEnrollments = () => allPages<AccountantEnrollment>('enrollments', 'student_id,class_id');
export const createAccountantInvoice = async (payload: InvoicePayload) => dataOf(await axios.post<unknown, IBackendRes<unknown>>('/invoices', payload));
export const updateAccountantInvoice = async (id: string, payload: Partial<InvoicePayload>) => dataOf(await axios.patch<unknown, IBackendRes<unknown>>(`/invoices/${id}`, { ...payload, _id: id }));
export const deleteAccountantInvoice = async (id: string) => dataOf(await axios.delete<unknown, IBackendRes<unknown>>(`/invoices/${id}`));
export const createAccountantPayment = async (payload: PaymentPayload) =>
    dataOf(await axios.post<unknown, IBackendRes<AccountantPayment>>('/payments', payload));
export const updateAccountantPayment = async (id: string, payload: Partial<PaymentPayload> | PaymentReviewPayload) => dataOf(await axios.patch<unknown, IBackendRes<unknown>>(`/payments/${id}`, { ...payload, _id: id }));
export const deleteAccountantPayment = async (id: string) => dataOf(await axios.delete<unknown, IBackendRes<unknown>>(`/payments/${id}`));

export async function createAccountantReceipt(payload: PaymentPayload): Promise<AccountantPayment> {
    return createAccountantPayment(payload);
}

export const refId = (value?: string | { _id?: string } | null): string => typeof value === 'string' ? value : value?._id || '';
export function uninvoicedEnrollments(enrollments: AccountantEnrollment[], invoices: AccountantInvoice[]): AccountantEnrollment[] {
    const existing = new Set(invoices.map(invoice => refId(invoice.enrollment_id)));
    return enrollments.filter(enrollment => !!enrollment._id && !existing.has(enrollment._id));
}
export const shortId = (value?: string) => value ? value.slice(-8).toUpperCase() : '—';
export const money = (value?: number) => `${Number(value ?? 0).toLocaleString('vi-VN')} đ`;
export const invoiceAmount = (invoice: Pick<IInvoice, 'amount' | 'final_amount'>) => Number(invoice.final_amount ?? invoice.amount ?? 0);
export const invoicePaid = (invoice: Pick<IInvoice, 'amount' | 'final_amount' | 'paid_amount' | 'status'>) => {
    if (invoice.paid_amount !== undefined) return Number(invoice.paid_amount);
    return invoice.status?.toUpperCase() === 'PAID' ? invoiceAmount(invoice) : 0;
};
export const invoiceOutstanding = (invoice: Pick<IInvoice, 'amount' | 'final_amount' | 'paid_amount' | 'status'>) =>
    Math.max(invoiceAmount(invoice) - invoicePaid(invoice), 0);
export const paymentAmount = (payment: Pick<IPayment, 'amount' | 'approved_amount'>) =>
    Number(payment.approved_amount ?? payment.amount ?? 0);
export const accountingDate = (value?: string) => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa cập nhật';
export const accountingError = (error: unknown) => {
    const message = (error as { message?: string | string[] })?.message;
    return Array.isArray(message) ? message.join('\n') : message || 'Không thể tải dữ liệu. Vui lòng thử lại.';
};
export function enrollmentLabel(enrollment: AccountantEnrollment): string {
    const student = typeof enrollment.student_id === 'object' && enrollment.student_id
        ? enrollment.student_id.name || enrollment.student_id.email || refId(enrollment.student_id)
        : enrollment.student_id;
    const classroom = typeof enrollment.class_id === 'object' && enrollment.class_id
        ? enrollment.class_id.class_name || refId(enrollment.class_id) : enrollment.class_id;
    return `${student || 'Học viên chưa cập nhật'} • ${classroom || 'Lớp chưa cập nhật'}`;
}
export function invoiceEnrollment(invoice: AccountantInvoice, enrollments: AccountantEnrollment[]): AccountantEnrollment | undefined {
    return enrollments.find((item) => item._id === refId(invoice.enrollment_id)) ||
        (typeof invoice.enrollment_id === 'object' ? invoice.enrollment_id : undefined);
}
export const statusLabel = (status?: string) => ({ UNPAID: 'Chưa thanh toán', PAID: 'Đã thanh toán', CANCELLED: 'Đã hủy', PENDING: 'Chờ thanh toán', WAITING_PAYMENT: 'Chờ thanh toán', WAITING_CONFIRMATION: 'Đang chờ duyệt', PARTIAL: 'Đã nộp một phần', APPROVED: 'Đã duyệt', REJECTED: 'Bị từ chối', UNKNOWN: 'Chưa đối soát' }[status || ''] || status || 'Chưa cập nhật');
export const methodLabel = (method?: string) => ({ BANK_TRANSFER: 'Chuyển khoản ngân hàng', CASH: 'Tiền mặt', CARD: 'Thẻ', VNPAY: 'VNPay' }[method || ''] || method || 'Chưa cập nhật');

export function accountantPaymentStatus(payment: AccountantPayment, invoice?: AccountantInvoice) {
    if (payment.status) return payment.status.toUpperCase();
    const invoiceStatus = invoice?.status?.toUpperCase();
    if (invoiceStatus === 'WAITING_CONFIRMATION') return 'WAITING_CONFIRMATION';
    if (invoiceStatus === 'PAID' || invoiceStatus === 'PARTIAL') return 'APPROVED';
    return 'UNKNOWN';
}

/** Summarize actual paid amounts without counting pending requests as revenue. */
export function financeSummary(invoices: Pick<IInvoice, 'amount' | 'final_amount' | 'paid_amount' | 'status'>[]) {
    return invoices.reduce((total, invoice) => {
        const status = invoice.status?.toUpperCase();
        if (status === 'CANCELLED') return total;
        const amount = invoiceAmount(invoice);
        const paid = Math.min(invoicePaid(invoice), amount);
        total.invoiced += amount;
        total.settled += paid;
        total.outstanding += Math.max(amount - paid, 0);
        if (amount > paid) total.unpaidCount++;
        if (paid > 0 && paid < amount) total.partialCount++;
        if (status === 'WAITING_CONFIRMATION') total.pendingCount++;
        return total;
    }, { invoiced: 0, settled: 0, outstanding: 0, unpaidCount: 0, partialCount: 0, pendingCount: 0 });
}

export function monthlyRevenue(payments: AccountantPayment[], year: number) {
    const monthly = Array.from({ length: 12 }, () => 0);
    for (const payment of payments) {
        const date = new Date(payment.payment_date || payment.createdAt || '');
        const status = payment.status?.toUpperCase();
        if (!Number.isFinite(date.getTime()) || date.getFullYear() !== year) continue;
        if (status !== 'APPROVED' && status !== undefined) continue;
        const invoice = typeof payment.invoice_id === 'object' ? payment.invoice_id : undefined;
        const amount = paymentAmount(payment) ||
            (status === undefined && invoice ? invoicePaid(invoice) : 0);
        if (amount > 0) monthly[date.getMonth()] += amount;
    }
    return monthly;
}
