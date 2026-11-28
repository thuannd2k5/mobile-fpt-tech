import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAppSelector } from '@/redux/hooks';
import { canUse } from '@/utils/permissions';
import { RoleHero, RoleScreen, RoleSection, RoleStat, RoleTile } from '@/components/common/RoleScreen';
import FptErrorBanner from '@/components/common/FptErrorBanner';
import {
    AccountantInvoice,
    AccountantPayment,
    accountantPaymentStatus,
    accountingError,
    fetchAccountantInvoices,
    fetchAccountantPayments,
    financeSummary,
    invoicePaid,
    methodLabel,
    money,
    monthlyRevenue,
    paymentAmount,
} from '@/api/accountant';

const monthLabels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
const paymentMethods = ['BANK_TRANSFER', 'CASH', 'CARD', 'VNPAY'];

export default function AccountingRevenueScreen() {
    const permissions = useAppSelector((state) => state.account.user.permissions);
    const readInvoices = canUse(permissions, 'GET', '/api/v1/invoices');
    const readPayments = canUse(permissions, 'GET', '/api/v1/payments');
    const [invoices, setInvoices] = useState<AccountantInvoice[]>([]);
    const [payments, setPayments] = useState<AccountantPayment[]>([]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const refresh = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [invoiceRows, paymentRows] = await Promise.all([
                readInvoices ? fetchAccountantInvoices() : Promise.resolve([]),
                readPayments ? fetchAccountantPayments() : Promise.resolve([]),
            ]);
            setInvoices(invoiceRows);
            setPayments(paymentRows);
        } catch (reason) {
            setError(accountingError(reason));
        } finally {
            setLoading(false);
        }
    }, [readInvoices, readPayments]);
    useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

    const monthly = useMemo(() => monthlyRevenue(payments, year), [payments, year]);
    const yearlyRevenue = monthly.reduce((total, amount) => total + amount, 0);
    const maxMonthly = Math.max(...monthly, 1);
    const paidTransactions = payments.filter((payment) => {
        const invoice = typeof payment.invoice_id === 'object' ? payment.invoice_id : undefined;
        return accountantPaymentStatus(payment, invoice) === 'APPROVED' &&
            new Date(payment.payment_date || payment.createdAt || '').getFullYear() === year;
    });
    const methodTotals = paymentMethods.map((method) => ({
        method,
        amount: paidTransactions
            .filter((payment) => payment.payment_method === method)
            .reduce((sum, payment) => {
                const invoice = typeof payment.invoice_id === 'object' ? payment.invoice_id : undefined;
                return sum + (paymentAmount(payment) || (invoice ? invoicePaid(invoice) : 0));
            }, 0),
    }));
    const totals = financeSummary(invoices);

    return (
        <RoleScreen
            title="Doanh thu"
            subtitle="Báo cáo các khoản học phí đã được kế toán xác nhận"
            eyebrow="Kế toán"
            refreshing={loading}
            onRefresh={() => void refresh()}
        >
            <RoleHero
                eyebrow="Revenue report"
                title={money(yearlyRevenue)}
                description={`Doanh thu thực thu trong năm ${year}. Các yêu cầu đang chờ duyệt chưa được tính vào doanh thu.`}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                {Array.from({ length: 5 }, (_, index) => new Date().getFullYear() - index).map((item) => (
                    <TouchableOpacity
                        key={item}
                        accessibilityRole="button"
                        accessibilityState={{ selected: item === year }}
                        onPress={() => setYear(item)}
                        className={`mr-2 min-h-[44px] justify-center rounded-full border px-4 ${item === year ? 'border-fpt-orange bg-orange-50' : 'border-slate-200 bg-white'}`}
                    >
                        <Text className={`text-xs font-semibold ${item === year ? 'text-fpt-orange' : 'text-slate-600'}`}>
                            {item}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            {error ? <FptErrorBanner message={error} onRetry={() => void refresh()} /> : loading ? (
                <ActivityIndicator color="#F26522" />
            ) : <>
                <View className="flex-row">
                    <RoleStat label="Giao dịch đã duyệt" value={paidTransactions.length} />
                    <RoleStat label="Công nợ còn lại" value={money(totals.outstanding)} />
                </View>
                <RoleSection title={`Doanh thu theo tháng • ${year}`}>
                    <View className="rounded-2xl border border-slate-200/70 bg-white p-4">
                        <View className="h-40 flex-row items-end justify-between">
                            {monthly.map((amount, index) => (
                                <View key={monthLabels[index]} className="mx-0.5 flex-1 items-center justify-end">
                                    <View
                                        className="w-full rounded-t-md bg-teal-600"
                                        style={{ height: amount > 0 ? Math.max((amount / maxMonthly) * 112, 6) : 2 }}
                                    />
                                    <Text className="mt-2 text-[10px] text-slate-500">{monthLabels[index]}</Text>
                                </View>
                            ))}
                        </View>
                        <Text className="mt-4 text-center text-sm font-bold text-slate-900">
                            Tổng năm: {money(yearlyRevenue)}
                        </Text>
                    </View>
                </RoleSection>
                <RoleSection title="Cơ cấu phương thức thanh toán">
                    {methodTotals.map(({ method, amount }) => (
                        <RoleTile
                            key={method}
                            title={money(amount)}
                            subtitle={methodLabel(method)}
                            icon={method === 'CASH' ? 'cash-outline' : 'card-outline'}
                        />
                    ))}
                </RoleSection>
                <RoleSection title="Công nợ toàn hệ thống">
                    <RoleTile title={money(totals.invoiced)} subtitle="Tổng giá trị hóa đơn đang hiệu lực" />
                    <RoleTile title={money(totals.settled)} subtitle="Đã thu, gồm cả khoản thanh toán một phần" icon="checkmark-circle-outline" />
                    <RoleTile title={money(totals.outstanding)} subtitle={`${totals.unpaidCount} hóa đơn còn số dư`} icon="time-outline" />
                </RoleSection>
            </>}
        </RoleScreen>
    );
}
