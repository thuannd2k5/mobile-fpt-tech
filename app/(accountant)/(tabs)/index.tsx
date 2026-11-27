import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAppSelector } from '@/redux/hooks';
import { canUse } from '@/utils/permissions';
import { RoleHero, RoleScreen, RoleSection, RoleStat, RoleTile } from '@/components/common/RoleScreen';
import { FptButton } from '@/components/common/FptButton';
import FptErrorBanner from '@/components/common/FptErrorBanner';
import { AccountantInvoice, AccountantPayment, accountingError, fetchAccountantInvoices, fetchAccountantPayments, financeSummary, money } from '@/api/accountant';

export default function FinanceScreen() {
    const router = useRouter();
    const permissions = useAppSelector((state) => state.account.user.permissions);
    const readInvoices = canUse(permissions, 'GET', '/api/v1/invoices');
    const readPayments = canUse(permissions, 'GET', '/api/v1/payments');
    const [invoices, setInvoices] = useState<AccountantInvoice[]>([]);
    const [payments, setPayments] = useState<AccountantPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const refresh = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const [invoiceRows, paymentRows] = await Promise.all([
                readInvoices ? fetchAccountantInvoices() : Promise.resolve([]),
                readPayments ? fetchAccountantPayments() : Promise.resolve([]),
            ]);
            setInvoices(invoiceRows); setPayments(paymentRows);
        } catch (reason) { setError(accountingError(reason)); }
        finally { setLoading(false); }
    }, [readInvoices, readPayments]);
    useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
    const totals = financeSummary(invoices);
    return <RoleScreen title="Điều hành tài chính" subtitle="Kiểm soát hóa đơn và chứng từ thu học phí" eyebrow="Kế toán" refreshing={loading} onRefresh={() => void refresh()}>
        <RoleHero eyebrow="Financial operations" title="Dữ liệu thu học phí" description="Theo dõi hóa đơn, công nợ và phiếu thu tại một nơi." />
        {error ? <FptErrorBanner message={error} onRetry={() => void refresh()} /> : loading ? <ActivityIndicator color="#F26522" /> : <>
            <View className="flex-row"><RoleStat label="Hóa đơn" value={readInvoices ? invoices.length : '—'} /><RoleStat label="Phiếu thu" value={readPayments ? payments.length : '—'} /></View>
            {readInvoices ? <RoleSection title="Tình hình học phí">
                <RoleTile title={money(totals.invoiced)} subtitle="Tổng giá trị hóa đơn đang hiệu lực" icon="document-text-outline" />
                <RoleTile title={money(totals.settled)} subtitle="Giá trị hóa đơn có trạng thái đã thanh toán" icon="checkmark-circle-outline" />
                <RoleTile title={money(totals.outstanding)} subtitle={`${totals.unpaidCount} hóa đơn chưa được đánh dấu đã thanh toán`} icon="time-outline" />
            </RoleSection> : null}
        </>}
        <RoleSection title="Quản lý chứng từ">
            {readInvoices ? <RoleTile title="Hóa đơn & công nợ" subtitle="Tra cứu, lập và cập nhật hóa đơn" onPress={() => router.push('/(accountant)/(tabs)/invoices')} /> : null}
            {readPayments ? <RoleTile title="Phiếu thu" subtitle="Theo dõi giao dịch và chứng từ thanh toán" icon="wallet-outline" onPress={() => router.push('/(accountant)/(tabs)/payments')} /> : null}
            {!readInvoices && !readPayments ? <Text className="text-sm text-slate-500">Tài khoản chưa được cấp quyền xem chứng từ tài chính.</Text> : null}
        </RoleSection>
        {readPayments ? <FptButton title="Mở danh sách phiếu thu" onPress={() => router.push('/(accountant)/(tabs)/payments')} /> : null}
    </RoleScreen>;
}
