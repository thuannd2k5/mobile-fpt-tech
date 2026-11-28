import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useAppSelector } from '@/redux/hooks';
import { canUse } from '@/utils/permissions';
import { RoleHero, RoleScreen, RoleSection, RoleTile } from '@/components/common/RoleScreen';
import { FptButton } from '@/components/common/FptButton';
import { FptInput } from '@/components/common/FptInput';
import { FptEmptyState } from '@/components/common/FptEmptyState';
import { FptBadge } from '@/components/common/FptBadge';
import FptErrorBanner from '@/components/common/FptErrorBanner';
import {
    AccountantEnrollment, AccountantInvoice, AccountantPayment, accountingDate, accountingError,
    accountantPaymentStatus, createAccountantReceipt, enrollmentLabel, fetchAccountantEnrollments,
    fetchAccountantInvoices, fetchAccountantPayments, invoiceAmount, invoiceEnrollment,
    invoiceOutstanding, methodLabel, money, paymentAmount, refId, shortId, statusLabel,
    updateAccountantPayment,
} from '@/api/accountant';
import { printFinancialDocument } from '@/utils/financialDocuments';

const methods = ['BANK_TRANSFER', 'CASH', 'CARD', 'VNPAY'];
const paymentStatuses = ['ALL', 'WAITING_CONFIRMATION', 'APPROVED', 'REJECTED'];
const today = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; };

export default function AccountingPaymentsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ invoiceId?: string }>();
    const permissions = useAppSelector((state) => state.account.user.permissions);
    const allowed = useCallback((method: string, path = '/api/v1/payments') => canUse(permissions, method, path), [permissions]);
    const read = allowed('GET');
    const readInvoices = allowed('GET', '/api/v1/invoices');
    const readEnrollments = allowed('GET', '/api/v1/enrollments');
    const [rows, setRows] = useState<AccountantPayment[]>([]);
    const [invoices, setInvoices] = useState<AccountantInvoice[]>([]);
    const [enrollments, setEnrollments] = useState<AccountantEnrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [visible, setVisible] = useState(false);
    const [selected, setSelected] = useState<AccountantPayment | null>(null);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [invoiceId, setInvoiceId] = useState('');
    const [referenceSearch, setReferenceSearch] = useState('');
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
    const [date, setDate] = useState(today());
    const refresh = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const [paymentRows, invoiceRows, enrollmentRows] = await Promise.all([
                read ? fetchAccountantPayments() : Promise.resolve([]),
                readInvoices ? fetchAccountantInvoices() : Promise.resolve([]),
                readEnrollments ? fetchAccountantEnrollments() : Promise.resolve([]),
            ]);
            setRows(paymentRows); setInvoices(invoiceRows); setEnrollments(enrollmentRows);
        } catch (reason) { setError(accountingError(reason)); }
        finally { setLoading(false); }
    }, [read, readInvoices, readEnrollments]);
    useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
    const describeInvoice = useCallback((invoice: AccountantInvoice) => {
        const enrollment = invoiceEnrollment(invoice, enrollments);
        return `HĐ ${shortId(invoice._id)} • ${money(invoiceAmount(invoice))}${enrollment ? `\n${enrollmentLabel(enrollment)}` : ''}`;
    }, [enrollments]);
    const linkedInvoice = useCallback((row: AccountantPayment) => invoices.find((item) => item._id === refId(row.invoice_id)) || (typeof row.invoice_id === 'object' ? row.invoice_id : undefined), [invoices]);
    const filtered = useMemo(() => rows.filter((row) => {
        const invoice = linkedInvoice(row);
        const status = accountantPaymentStatus(row, invoice);
        return (filter === 'ALL' || row.payment_method === filter) &&
            (statusFilter === 'ALL' || status === statusFilter) &&
            `${row._id} ${refId(row.invoice_id)} ${invoice ? describeInvoice(invoice) : ''} ${methodLabel(row.payment_method)}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
    }), [rows, filter, statusFilter, search, linkedInvoice, describeInvoice]);
    const availableInvoices = invoices.filter((item) => {
        const status = item.status?.toUpperCase();
        const isCurrentInvoice = !!selected && item._id === invoiceId;
        const hasPendingPayment = rows.some((row) =>
            refId(row.invoice_id) === item._id &&
            accountantPaymentStatus(row, item) === 'WAITING_CONFIRMATION',
        );
        return isCurrentInvoice || (
            !hasPendingPayment && status !== 'PAID' && status !== 'CANCELLED' &&
            invoiceOutstanding(item) > 0
        );
    });
    const invoiceOptions = availableInvoices.filter((item) => `${item._id} ${describeInvoice(item)}`.toLocaleLowerCase().includes(referenceSearch.trim().toLocaleLowerCase()));
    const open = useCallback((row: AccountantPayment | null, edit = false, forInvoice = '') => {
        setSelected(row); setEditing(edit); setFormError(''); setReferenceSearch('');
        setInvoiceId(row ? refId(row.invoice_id) : forInvoice);
        const targetInvoice = row ? linkedInvoice(row) : invoices.find((item) => item._id === forInvoice);
        setAmount(row ? String(paymentAmount(row)) : targetInvoice ? String(invoiceOutstanding(targetInvoice)) : '');
        setPaymentMethod(row?.payment_method || 'BANK_TRANSFER'); setDate(row?.payment_date?.slice(0, 10) || today());
        setVisible(true);
    }, [invoices, linkedInvoice]);
    useFocusEffect(useCallback(() => {
        if (!params.invoiceId || loading || error) return;
        const existingPayment = rows.find((item) =>
            refId(item.invoice_id) === params.invoiceId &&
            accountantPaymentStatus(item, linkedInvoice(item)) === 'WAITING_CONFIRMATION',
        );
        if (existingPayment) {
            open(existingPayment);
        } else if (allowed('POST') && readInvoices && invoices.some((item) => item._id === params.invoiceId)) {
            open(null, true, params.invoiceId);
        }
        router.setParams({ invoiceId: '' });
    }, [params.invoiceId, loading, error, allowed, readInvoices, invoices, rows, linkedInvoice, open, router]));
    const close = () => { if (!saving) setVisible(false); };
    const save = async () => {
        if (!allowed('POST')) return;
        const parsedDate = new Date(`${date}T00:00:00.000Z`);
        const invoice = invoices.find((item) => item._id === invoiceId);
        const paymentAmountValue = Number(amount);
        if (!invoiceId || !availableInvoices.some((item) => item._id === invoiceId) || !paymentMethod.trim() ||
            !Number.isFinite(paymentAmountValue) || paymentAmountValue <= 0 ||
            paymentAmountValue > (invoice ? invoiceOutstanding(invoice) : 0) ||
            !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
            setFormError('Chọn hóa đơn, nhập số tiền không vượt công nợ, phương thức và ngày hợp lệ.'); return;
        }
        setSaving(true); setFormError('');
        try {
            const payload = { invoice_id: invoiceId, amount: paymentAmountValue, payment_method: paymentMethod, payment_date: parsedDate.toISOString() };
            const payment = await createAccountantReceipt(payload);
            setSelected(payment);
            setEditing(false);
            await refresh();
        } catch (reason) { setFormError(accountingError(reason)); }
        finally { setSaving(false); }
    };
    const selectedInvoice = selected ? linkedInvoice(selected) : undefined;
    const selectedPaymentStatus = selected
        ? accountantPaymentStatus(selected, selectedInvoice)
        : '';
    const confirmPayment = async () => {
        const confirmedAmount = Number(amount);
        if (!selected?._id || !selectedInvoice?._id || !allowed('PATCH', '/api/v1/payments/:id')) return;
        if (!Number.isFinite(confirmedAmount) || confirmedAmount <= 0 || confirmedAmount > invoiceOutstanding(selectedInvoice)) {
            setFormError('Số tiền duyệt phải lớn hơn 0 và không vượt quá công nợ còn lại.');
            return;
        }
        setSaving(true); setFormError('');
        try {
            await updateAccountantPayment(selected._id, {
                status: 'APPROVED',
                approved_amount: confirmedAmount,
            });
            setVisible(false);
            await refresh();
        } catch (reason) { setFormError(accountingError(reason)); }
        finally { setSaving(false); }
    };
    const rejectPayment = async () => {
        if (!selected?._id || !allowed('PATCH', '/api/v1/payments/:id')) return;
        setSaving(true); setFormError('');
        try {
            await updateAccountantPayment(selected._id, { status: 'REJECTED' });
            setVisible(false);
            await refresh();
        } catch (reason) { setFormError(accountingError(reason)); }
        finally { setSaving(false); }
    };
    const printReceipt = async () => {
        if (!selected) return;
        const enrollment = selectedInvoice ? invoiceEnrollment(selectedInvoice, enrollments) : undefined;
        const student = typeof enrollment?.student_id === 'object' ? enrollment.student_id : undefined;
        const classroom = typeof enrollment?.class_id === 'object' ? enrollment.class_id : undefined;
        const course = typeof classroom?.course_id === 'object' ? classroom.course_id : undefined;
        try {
            await printFinancialDocument({
                title: 'BIÊN LAI THU HỌC PHÍ',
                documentCode: `PT-${shortId(selected._id)}`,
                invoiceCode: `HĐ-${shortId(selectedInvoice?._id || refId(selected.invoice_id))}`,
                studentName: student?.name || student?.email || 'Chưa cập nhật',
                studentEmail: student?.email,
                courseName: course?.name || 'Chưa cập nhật',
                className: classroom?.class_name || 'Chưa cập nhật',
                amount: Number(selected.amount || 0),
                discountAmount: Number(selectedInvoice?.discount_amount || 0),
                finalAmount: paymentAmount(selected),
                status: statusLabel(selectedPaymentStatus),
                paymentMethod: methodLabel(selected.payment_method),
                date: accountingDate(selected.payment_date || selected.createdAt),
            });
        } catch (reason) {
            Alert.alert('Không thể in phiếu thu', accountingError(reason));
        }
    };
    return <>
        <RoleScreen title="Phiếu thu" subtitle="Chứng từ thanh toán và giao dịch học phí" eyebrow="Kế toán" refreshing={loading} onRefresh={() => void refresh()}>
            <RoleHero eyebrow="Payment records" title="Duyệt và ghi nhận học phí" description="Kiểm tra yêu cầu đang chờ, xác nhận số tiền thực thu hoặc từ chối giao dịch." />
            {allowed('POST') && readInvoices ? <FptButton title="Lập phiếu thu tại quầy" className="mb-5" disabled={loading || !!error} onPress={() => open(null, true)} /> : null}
            {error ? <FptErrorBanner message={error} onRetry={() => void refresh()} /> : null}
            {!read ? <FptEmptyState title="Chưa được cấp quyền" description="Tài khoản chưa có quyền xem danh sách phiếu thu." /> : <>
                <FptInput placeholder="Tìm mã phiếu, hóa đơn, học viên…" value={search} onChangeText={setSearch} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                    {paymentStatuses.map((item) => <TouchableOpacity key={item} accessibilityRole="button" accessibilityState={{ selected: item === statusFilter }} onPress={() => setStatusFilter(item)} className={`mr-2 min-h-[44px] justify-center rounded-full border px-4 ${item === statusFilter ? 'border-fpt-orange bg-orange-50' : 'border-slate-200 bg-white'}`}><Text className={`text-xs font-semibold ${item === statusFilter ? 'text-fpt-orange' : 'text-slate-600'}`}>{item === 'ALL' ? 'Mọi trạng thái' : statusLabel(item)}</Text></TouchableOpacity>)}
                </ScrollView>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
                    {['ALL', ...new Set([...methods, ...rows.map((row) => row.payment_method).filter((item): item is string => !!item)])].map((item) => <TouchableOpacity key={item} accessibilityRole="button" accessibilityState={{ selected: item === filter }} onPress={() => setFilter(item)} className={`mr-2 min-h-[44px] justify-center rounded-full border px-4 ${item === filter ? 'border-fpt-orange bg-orange-50' : 'border-slate-200 bg-white'}`}><Text className={`text-xs font-semibold ${item === filter ? 'text-fpt-orange' : 'text-slate-600'}`}>{item === 'ALL' ? 'Tất cả' : methodLabel(item)}</Text></TouchableOpacity>)}
                </ScrollView>
                {loading ? <ActivityIndicator color="#F26522" /> : !error && !filtered.length ? <FptEmptyState title="Chưa có phiếu thu phù hợp" description="Thử thay đổi tìm kiếm hoặc bộ lọc." /> : <RoleSection title={`${filtered.length} giao dịch`}>
                    {filtered.map((row) => {
                        const invoice = linkedInvoice(row);
                        const paymentStatus = accountantPaymentStatus(row, invoice);
                        return <RoleTile key={row._id} icon="wallet-outline" title={`PT ${shortId(row._id)} • ${money(paymentAmount(row))}`} subtitle={`HĐ ${shortId(refId(row.invoice_id))} • ${methodLabel(row.payment_method)} • ${accountingDate(row.payment_date)}`} onPress={() => open(row)} trailing={<FptBadge status={paymentStatus} label={statusLabel(paymentStatus)} size="sm" />} />;
                    })}
                </RoleSection>}
            </>}
        </RoleScreen>
        <Modal visible={visible} animationType="slide" onRequestClose={close}>
            <SafeAreaView className="flex-1 bg-fpt-grayBg">
                <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
                        <FptButton title="Đóng" variant="ghost" className="mb-3 self-start" disabled={saving} onPress={close} />
                        <Text className="mb-2 text-2xl font-bold text-slate-900">{editing ? 'Lập phiếu thu tại quầy' : 'Chi tiết thanh toán'}</Text>
                        <Text selectable className="mb-5 text-xs leading-5 text-slate-500">{selected?._id || 'Ghi nhận chứng từ cho một hóa đơn có sẵn.'}</Text>
                        {formError ? <Text accessibilityRole="alert" className="mb-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{formError}</Text> : null}
                        {editing ? <>
                            <RoleSection title="Hóa đơn liên quan">
                                <Text className="mb-3 text-sm leading-6 text-slate-600">{invoices.find((item) => item._id === invoiceId) ? describeInvoice(invoices.find((item) => item._id === invoiceId)!) : invoiceId ? `Hóa đơn ${invoiceId}` : 'Chưa chọn hóa đơn'}</Text>
                                {readInvoices ? <>
                                    <FptInput placeholder="Tìm hóa đơn, học viên, lớp…" value={referenceSearch} onChangeText={setReferenceSearch} editable={!saving} />
                                    <ScrollView nestedScrollEnabled style={{ maxHeight: 240 }}>
                                        {invoiceOptions.map((item) => <TouchableOpacity key={item._id} accessibilityRole="button" accessibilityState={{ selected: item._id === invoiceId }} disabled={saving} onPress={() => { setInvoiceId(item._id || ''); setAmount(String(invoiceOutstanding(item))); }} className={`mb-2 rounded-xl border p-3 ${item._id === invoiceId ? 'border-fpt-orange bg-orange-50' : 'border-slate-200 bg-white'}`}><Text className="text-sm font-semibold leading-6 text-slate-900">{describeInvoice(item)}</Text><Text className="mt-1 text-xs text-slate-500">{statusLabel(item.status)} • Còn nợ {money(invoiceOutstanding(item))}</Text></TouchableOpacity>)}
                                        {!invoiceOptions.length ? <Text className="mb-3 text-sm text-slate-500">Không có hóa đơn phù hợp.</Text> : null}
                                    </ScrollView>
                                </> : null}
                            </RoleSection>
                            <FptInput label="Số tiền thực thu (đ)" placeholder="Nhập số tiền đã nhận" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} editable={!saving} />
                            <RoleSection title="Phương thức thanh toán">
                                {[...new Set([...methods, paymentMethod])].map((item) => <TouchableOpacity key={item} accessibilityRole="button" accessibilityState={{ selected: item === paymentMethod }} disabled={saving} onPress={() => setPaymentMethod(item)} className={`mb-2 min-h-[44px] justify-center rounded-xl border px-4 py-3 ${item === paymentMethod ? 'border-fpt-orange bg-orange-50' : 'border-slate-200 bg-white'}`}><Text className="text-sm text-slate-800">{methodLabel(item)}</Text></TouchableOpacity>)}
                            </RoleSection>
                            <FptInput label="Ngày thanh toán (YYYY-MM-DD)" placeholder="YYYY-MM-DD" autoCapitalize="none" value={date} onChangeText={setDate} editable={!saving} />
                            <Text className="mb-5 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-slate-700">Phiếu thu tại quầy sẽ cộng vào số tiền đã nộp và tự cập nhật hóa đơn thành “Đã nộp” hoặc “Đã nộp một phần”.</Text>
                            <FptButton title="Ghi nhận phiếu thu" loading={saving} onPress={() => void save()} />
                        </> : selected ? <>
                            <RoleHero eyebrow="Chứng từ thanh toán" title={money(paymentAmount(selected))} description={`Hóa đơn ${shortId(refId(selected.invoice_id))} • ${statusLabel(selectedPaymentStatus)}`} />
                            <RoleSection title="Thông tin chứng từ">
                                <RoleTile title="Hóa đơn liên quan" subtitle={selectedInvoice ? describeInvoice(selectedInvoice) : refId(selected.invoice_id)} />
                                {selectedInvoice ? <RoleTile title="Trạng thái hóa đơn" subtitle={statusLabel(selectedInvoice.status)} icon="document-text-outline" /> : null}
                                <RoleTile title="Số tiền giao dịch" subtitle={money(paymentAmount(selected))} icon="cash-outline" />
                                {selectedInvoice ? <RoleTile title="Còn phải thu" subtitle={money(invoiceOutstanding(selectedInvoice))} icon="wallet-outline" /> : null}
                                <RoleTile title="Trạng thái giao dịch" subtitle={statusLabel(selectedPaymentStatus)} icon="checkmark-circle-outline" />
                                <RoleTile title="Ngày thanh toán" subtitle={accountingDate(selected.payment_date)} icon="calendar-outline" />
                                <RoleTile title="Phương thức" subtitle={methodLabel(selected.payment_method)} icon="wallet-outline" />
                                <RoleTile title="Ngày lập phiếu" subtitle={accountingDate(selected.createdAt)} icon="calendar-outline" />
                            </RoleSection>
                            {selectedPaymentStatus === 'WAITING_CONFIRMATION' && selectedInvoice && allowed('PATCH', '/api/v1/payments/:id') ? <>
                                <RoleSection title="Đối soát khoản nộp">
                                    <Text className="mb-3 text-sm leading-6 text-slate-600">Nhập số tiền thực nhận sau khi kiểm tra giao dịch. Có thể duyệt một phần nếu học viên chưa nộp đủ.</Text>
                                    <FptInput label="Số tiền xác nhận (đ)" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} editable={!saving} />
                                </RoleSection>
                                <FptButton title="Duyệt khoản nộp" className="mb-3" loading={saving} onPress={() => void confirmPayment()} />
                                <FptButton title="Từ chối yêu cầu" variant="danger" className="mb-3" loading={saving} onPress={() => void rejectPayment()} />
                            </> : null}
                            <FptButton title="In phiếu thu" variant="outline" className="mb-3" onPress={() => void printReceipt()} />
                        </> : null}
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    </>;
}
