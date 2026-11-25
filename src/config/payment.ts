// Public receiving details only. These values are embedded in the mobile bundle.
const bankId = process.env.EXPO_PUBLIC_PAYMENT_BANK_ID?.trim();
const bankName = process.env.EXPO_PUBLIC_PAYMENT_BANK_NAME?.trim();
const accountNumber = process.env.EXPO_PUBLIC_PAYMENT_ACCOUNT_NUMBER?.trim();
const accountName = process.env.EXPO_PUBLIC_PAYMENT_ACCOUNT_NAME?.trim();

export const paymentBank = bankId && bankName && accountNumber && accountName ? {
    bankName,
    accountNumber,
    accountName,
    qrUrl: (amount: number | string | undefined, invoiceId: string) =>
        `https://img.vietqr.io/image/${encodeURIComponent(bankId)}-${encodeURIComponent(accountNumber)}-compact2.png?amount=${encodeURIComponent(String(amount ?? 0))}&accountName=${encodeURIComponent(accountName)}&addInfo=${encodeURIComponent(`HOCPHI ${invoiceId.slice(-8).toUpperCase()}`)}`,
} : null;
