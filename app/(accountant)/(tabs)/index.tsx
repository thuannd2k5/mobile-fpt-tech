import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAppSelector } from '@/redux/hooks';
import { canUse } from '@/utils/permissions';
import { RoleHero, RoleScreen, RoleSection, RoleStat, RoleTile } from '@/components/common/RoleScreen';
import { FptButton } from '@/components/common/FptButton';
import FptErrorBanner from '@/components/common/FptErrorBanner';
import {
    AccountantEnrollment,
    AccountantInvoice,
    AccountantPayment,
    accountantPaymentStatus,
    accountingError,
    enrollmentLabel,
    fetchAccountantEnrollments,
    fetchAccountantInvoices,
    fetchAccountantPayments,
    financeSummary,
    invoiceEnrollment,
    invoiceOutstanding,
    money,
} from '@/api/accountant';

export default function FinanceScreen() {
    const router = useRouter();
    const permissions = useAppSelector((state) => state.account.user.permissions);
    const readInvoices = canUse(permissions, 'GET', '/api/v1/invoices');
    const readPayments = canUse(permissions, 'GET', '/api/v1/payments');
    const readEnrollments = canUse(permissions, 'GET', '/api/v1/enrollments');
    const [invoices, setInvoices] = useState<AccountantInvoice[]>([]);
    const [payments, setPayments] = useState<AccountantPayment[]>([]);
    const [enrollments, setEnrollments] = useState<AccountantEnrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const refresh = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const [invoiceRows, paymentRows, enrollmentRows] = await Promise.all([
                readInvoices ? fetchAccountantInvoices() : Promise.resolve([]),
                readPayments ? fetchAccountantPayments() : Promise.resolve([]),
                readEnrollments ? fetchAccountantEnrollments() : Promise.resolve([]),
            ]);
            setInvoices(invoiceRows); setPayments(paymentRows);
            setEnrollments(enrollmentRows);
        } catch (reason) { setError(accountingError(reason)); }
        finally { setLoading(false); }
    }, [readInvoices, readPayments, readEnrollments]);
    useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
    const totals = financeSummary(invoices);
    const pendingPayments = payments.filter((payment) =>
        accountantPaymentStatus(
            payment,
            typeof payment.invoice_id === 'object' ? payment.invoice_id : undefined,
        ) === 'WAITING_CONFIRMATION',
    ).length;
    const collectionRate = totals.invoiced > 0
        ? `${Math.round((totals.settled / totals.invoiced) * 100)}%`
        : '0%';
    const debtors = invoices
        .filter((invoice) => invoiceOutstanding(invoice) > 0 && invoice.status?.toUpperCase() !== 'CANCELLED')
        .sort((left, right) => invoiceOutstanding(right) - invoiceOutstanding(left))
        .slice(0, 5);
    return <RoleScreen title="Điều hành tài chính" subtitle="Kiểm soát hóa đơn và chứng từ thu học phí" eyebrow="Kế toán" refreshing={loading} onRefresh={() => void refresh()}>
        <RoleHero eyebrow="Financial operations" title="Tổng quan kế toán" description="Theo dõi tiền đã thu, công nợ còn lại và các yêu cầu đang chờ duyệt." />
        {error ? <FptErrorBanner message={error} onRetry={() => void refresh()} /> : loading ? <ActivityIndicator color="#F26522" /> : <>
            <View className="flex-row">
                <RoleStat label="Tổng hóa đơn" value={readInvoices ? invoices.length : '—'} />
                <RoleStat label="Giao dịch chờ duyệt" value={readPayments ? pendingPayments : '—'} />
            </View>
            {readInvoices ? <RoleSection title="Tình hình học phí">
                <RoleTile title={money(totals.settled)} subtitle="Tiền đã được kế toán xác nhận" icon="cash-outline" />
                <RoleTile title={money(totals.outstanding)} subtitle={`${totals.unpaidCount} hóa đơn còn công nợ`} icon="time-outline" />
                <RoleTile title={collectionRate} subtitle={`${totals.partialCount} hóa đơn đã nộp một phần`} icon="pie-chart-outline" />
            </RoleSection> : null}
            {pendingPayments > 0 && readPayments ? <FptButton title={`Duyệt ${pendingPayments} yêu cầu thanh toán`} className="mb-5" onPress={() => router.push('/(accountant)/(tabs)/payments')} /> : null}
            {readInvoices ? <RoleSection title="Học viên còn công nợ">
                {debtors.length ? debtors.map((invoice) => {
                    const enrollment = invoiceEnrollment(invoice, enrollments);
                    return <RoleTile
                        key={invoice._id}
                        title={money(invoiceOutstanding(invoice))}
                        subtitle={`${enrollment ? enrollmentLabel(enrollment) : `HĐ ${invoice._id?.slice(-8)}`} • ${invoice.status === 'PARTIAL' ? 'Đã nộp một phần' : 'Chưa hoàn tất'}`}
                        icon="person-outline"
                        onPress={() => router.push('/(accountant)/(tabs)/invoices')}
                    />;
                }) : <Text className="text-sm text-slate-500">Không có công nợ cần thu.</Text>}
            </RoleSection> : null}
        </>}
        <RoleSection title="Quản lý chứng từ">
            {readInvoices ? <RoleTile title="Hóa đơn & công nợ" subtitle="Tra cứu, lập và cập nhật hóa đơn" onPress={() => router.push('/(accountant)/(tabs)/invoices')} /> : null}
            {readPayments ? <RoleTile title="Thanh toán & phiếu thu" subtitle="Duyệt khoản nộp, ghi nhận tiền thực thu và in biên lai" icon="wallet-outline" onPress={() => router.push('/(accountant)/(tabs)/payments')} /> : null}
            {readInvoices && readPayments ? <RoleTile title="Báo cáo doanh thu" subtitle="Phân tích tiền thu theo tháng và phương thức" icon="bar-chart-outline" onPress={() => router.push('/(accountant)/(tabs)/revenue')} /> : null}
            {!readInvoices && !readPayments ? <Text className="text-sm text-slate-500">Tài khoản chưa được cấp quyền xem chứng từ tài chính.</Text> : null}
        </RoleSection>
    </RoleScreen>;
}
