/** Status values returned by NestJS and retained legacy records. */
export const isInvoicePayable = (status?: string): boolean =>
    ['UNPAID', 'PENDING', 'WAITING_PAYMENT', 'PARTIAL'].includes((status || '').trim().toUpperCase());

type InvoiceBalance = {
    amount?: number;
    final_amount?: number;
    paid_amount?: number;
    status?: string;
};

export const invoiceTotalAmount = (invoice: InvoiceBalance): number =>
    Number(invoice.final_amount ?? invoice.amount ?? 0);

export const invoicePaidAmount = (invoice: InvoiceBalance): number => {
    if (invoice.paid_amount !== undefined) return Number(invoice.paid_amount);
    return invoice.status?.toUpperCase() === 'PAID'
        ? invoiceTotalAmount(invoice)
        : 0;
};

export const invoiceOutstandingAmount = (invoice: InvoiceBalance): number =>
    Math.max(invoiceTotalAmount(invoice) - invoicePaidAmount(invoice), 0);
