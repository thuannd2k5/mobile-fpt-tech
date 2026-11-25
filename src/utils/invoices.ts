/** Status values returned by NestJS and retained legacy records. */
export const isInvoicePayable = (status?: string): boolean =>
    ['UNPAID', 'PENDING', 'WAITING_PAYMENT'].includes((status || '').trim().toUpperCase());
