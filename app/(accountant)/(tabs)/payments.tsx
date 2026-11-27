import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useAppSelector } from '@/redux/hooks';
import { canUse } from '@/utils/permissions';
import { RoleHero, RoleScreen, RoleSection, RoleTile } from '@/components/common/RoleScreen';
import { FptButton } from '@/components/common/FptButton';
import { FptInput } from '@/components/common/FptInput';
import { FptEmptyState } from '@/components/common/FptEmptyState';
import FptErrorBanner from '@/components/common/FptErrorBanner';
import {
    AccountantEnrollment, AccountantInvoice, AccountantPayment, accountingDate, accountingError, createAccountantPayment,
    deleteAccountantPayment, enrollmentLabel, fetchAccountantEnrollments, fetchAccountantInvoices, fetchAccountantPayments,
    invoiceAmount, invoiceEnrollment, methodLabel, money, refId, shortId, statusLabel, updateAccountantPayment,
} from '@/api/accountant';

const methods = ['BANK_TRANSFER', 'CASH', 'CARD', 'VNPAY'];
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
    const [visible, setVisible] = useState(false);
    const [selected, setSelected] = useState<AccountantPayment | null>(null);
    const [editing, setEditing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [invoiceId, setInvoiceId] = useState('');
    const [referenceSearch, setReferenceSearch] = useState('');
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
        return (filter === 'ALL' || row.payment_method === filter) && `${row._id} ${refId(row.invoice_id)} ${invoice ? describeInvoice(invoice) : ''} ${methodLabel(row.payment_method)}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
    }), [rows, filter, search, linkedInvoice, describeInvoice]);
    const invoiceOptions = invoices.filter((item) => `${item._id} ${describeInvoice(item)}`.toLocaleLowerCase().includes(referenceSearch.trim().toLocaleLowerCase()));
    const open = useCallback((row: AccountantPayment | null, edit = false, forInvoice = '') => {
        setSelected(row); setEditing(edit); setConfirmDelete(false); setFormError(''); setReferenceSearch('');
        setInvoiceId(row ? refId(row.invoice_id) : forInvoice);
        setPaymentMethod(row?.payment_method || 'BANK_TRANSFER'); setDate(row?.payment_date?.slice(0, 10) || today());
        setVisible(true);
    }, []);
    useFocusEffect(useCallback(() => {
        if (!params.invoiceId || loading || error) return;
        if (allowed('POST') && readInvoices && invoices.some((item) => item._id === params.invoiceId)) open(null, true, params.invoiceId);
        router.setParams({ invoiceId: '' });
    }, [params.invoiceId, loading, error, allowed, readInvoices, invoices, open, router]));
    const close = () => { if (!saving) { setVisible(false); setConfirmDelete(false); } };
    const save = async () => {
        if (!allowed(selected ? 'PATCH' : 'POST', selected ? '/api/v1/payments/:id' : '/api/v1/payments')) return;
        const parsedDate = new Date(`${date}T00:00:00.000Z`);
        if (!invoiceId || !paymentMethod.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
            setFormError('Chọn hóa đơn, phương thức và ngày thanh toán hợp lệ (YYYY-MM-DD).'); return;
        }
        setSaving(true); setFormError('');
        try {
            const payload = { invoice_id: invoiceId, payment_method: paymentMethod, payment_date: parsedDate.toISOString() };
            if (selected?._id) await updateAccountantPayment(selected._id, payload);
            else await createAccountantPayment(payload);
            setVisible(false); await refresh();
        } catch (reason) { setFormError(accountingError(reason)); }
        finally { setSaving(false); }
    };
    const remove = async () => {
        if (!selected?._id || !allowed('DELETE', '/api/v1/payments/:id')) return;
        setSaving(true); setFormError('');
        try { await deleteAccountantPayment(selected._id); setVisible(false); await refresh(); }
        catch (reason) { setFormError(accountingError(reason)); }
        finally { setSaving(false); }
    };
    const selectedInvoice = selected ? linkedInvoice(selected) : undefined;
    return <>
        <RoleScreen title="Phiếu thu" subtitle="Chứng từ thanh toán và giao dịch học phí" eyebrow="Kế toán" refreshing={loading} onRefresh={() => void refresh()}>
            <RoleHero eyebrow="Payment records" title="Theo dõi giao dịch" description="Kiểm tra hóa đơn liên quan, phương thức và ngày thanh toán." />
            {allowed('POST') && readInvoices ? <FptButton title="Lập phiếu thu" className="mb-5" disabled={loading || !!error} onPress={() => open(null, true)} /> : null}
            {error ? <FptErrorBanner message={error} onRetry={() => void refresh()} /> : null}
            {!read ? <FptEmptyState title="Chưa được cấp quyền" description="Tài khoản chưa có quyền xem danh sách phiếu thu." /> : <>
                <FptInput placeholder="Tìm mã phiếu, hóa đơn, học viên…" value={search} onChangeText={setSearch} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
                    {['ALL', ...new Set([...methods, ...rows.map((row) => row.payment_method).filter((item): item is string => !!item)])].map((item) => <TouchableOpacity key={item} accessibilityRole="button" accessibilityState={{ selected: item === filter }} onPress={() => setFilter(item)} className={`mr-2 min-h-[44px] justify-center rounded-full border px-4 ${item === filter ? 'border-fpt-orange bg-orange-50' : 'border-slate-200 bg-white'}`}><Text className={`text-xs font-semibold ${item === filter ? 'text-fpt-orange' : 'text-slate-600'}`}>{item === 'ALL' ? 'Tất cả' : methodLabel(item)}</Text></TouchableOpacity>)}
                </ScrollView>
                {loading ? <ActivityIndicator color="#F26522" /> : !error && !filtered.length ? <FptEmptyState title="Chưa có phiếu thu phù hợp" description="Thử thay đổi tìm kiếm hoặc bộ lọc phương thức." /> : <RoleSection title={`${filtered.length} phiếu thu`}>
                    {filtered.map((row) => <RoleTile key={row._id} icon="wallet-outline" title={`PT ${shortId(row._id)} • ${methodLabel(row.payment_method)}`} subtitle={`HĐ ${shortId(refId(row.invoice_id))} • ${accountingDate(row.payment_date)}`} onPress={() => open(row)} />)}
                </RoleSection>}
            </>}
        </RoleScreen>
        <Modal visible={visible} animationType="slide" onRequestClose={close}>
            <SafeAreaView className="flex-1 bg-fpt-grayBg">
                <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
                        <FptButton title="Đóng" variant="ghost" className="mb-3 self-start" disabled={saving} onPress={close} />
                        <Text className="mb-2 text-2xl font-bold text-slate-900">{confirmDelete ? 'Xác nhận xóa phiếu thu' : editing ? selected ? 'Chỉnh sửa phiếu thu' : 'Lập phiếu thu' : 'Chi tiết phiếu thu'}</Text>
                        <Text selectable className="mb-5 text-xs leading-5 text-slate-500">{selected?._id || 'Ghi nhận chứng từ cho một hóa đơn có sẵn.'}</Text>
                        {formError ? <Text accessibilityRole="alert" className="mb-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{formError}</Text> : null}
                        {confirmDelete && selected ? <>
                            <RoleHero eyebrow="Kiểm tra chứng từ" title={`PT ${shortId(selected._id)}`} description={`HĐ ${shortId(refId(selected.invoice_id))} • ${methodLabel(selected.payment_method)}`} />
                            <Text className="mb-5 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-slate-700">Thao tác này xóa bản ghi phiếu thu. Không thực hiện hoàn tiền ngân hàng và không tự cập nhật hóa đơn.</Text>
                            <FptButton title="Xác nhận xóa phiếu thu" variant="danger" loading={saving} onPress={() => void remove()} />
                            <FptButton title="Giữ lại chứng từ" variant="ghost" disabled={saving} onPress={() => setConfirmDelete(false)} />
                        </> : editing ? <>
                            <RoleSection title="Hóa đơn liên quan">
                                <Text className="mb-3 text-sm leading-6 text-slate-600">{invoices.find((item) => item._id === invoiceId) ? describeInvoice(invoices.find((item) => item._id === invoiceId)!) : invoiceId ? `Hóa đơn ${invoiceId}` : 'Chưa chọn hóa đơn'}</Text>
                                {readInvoices ? <>
                                    <FptInput placeholder="Tìm hóa đơn, học viên, lớp…" value={referenceSearch} onChangeText={setReferenceSearch} editable={!saving} />
                                    <ScrollView nestedScrollEnabled style={{ maxHeight: 240 }}>
                                        {invoiceOptions.map((item) => <TouchableOpacity key={item._id} accessibilityRole="button" accessibilityState={{ selected: item._id === invoiceId }} disabled={saving} onPress={() => setInvoiceId(item._id || '')} className={`mb-2 rounded-xl border p-3 ${item._id === invoiceId ? 'border-fpt-orange bg-orange-50' : 'border-slate-200 bg-white'}`}><Text className="text-sm font-semibold leading-6 text-slate-900">{describeInvoice(item)}</Text><Text className="mt-1 text-xs text-slate-500">{statusLabel(item.status)} • {item._id}</Text></TouchableOpacity>)}
                                        {!invoiceOptions.length ? <Text className="mb-3 text-sm text-slate-500">Không có hóa đơn phù hợp.</Text> : null}
                                    </ScrollView>
                                </> : null}
                            </RoleSection>
                            <RoleSection title="Phương thức thanh toán">
                                {[...new Set([...methods, paymentMethod])].map((item) => <TouchableOpacity key={item} accessibilityRole="button" accessibilityState={{ selected: item === paymentMethod }} disabled={saving} onPress={() => setPaymentMethod(item)} className={`mb-2 min-h-[44px] justify-center rounded-xl border px-4 py-3 ${item === paymentMethod ? 'border-fpt-orange bg-orange-50' : 'border-slate-200 bg-white'}`}><Text className="text-sm text-slate-800">{methodLabel(item)}</Text></TouchableOpacity>)}
                            </RoleSection>
                            <FptInput label="Ngày thanh toán (YYYY-MM-DD)" placeholder="YYYY-MM-DD" autoCapitalize="none" value={date} onChangeText={setDate} editable={!saving} />
                            <Text className="mb-5 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-slate-700">Lưu phiếu thu không tự thay đổi trạng thái hóa đơn. Sau đối soát, cập nhật trạng thái tại mục Hóa đơn.</Text>
                            <FptButton title={selected ? 'Lưu phiếu thu' : 'Tạo phiếu thu'} loading={saving} onPress={() => void save()} />
                        </> : selected ? <>
                            <RoleHero eyebrow="Chứng từ thanh toán" title={methodLabel(selected.payment_method)} description={`Hóa đơn ${shortId(refId(selected.invoice_id))}`} />
                            <RoleSection title="Thông tin chứng từ">
                                <RoleTile title="Hóa đơn liên quan" subtitle={selectedInvoice ? describeInvoice(selectedInvoice) : refId(selected.invoice_id)} />
                                {selectedInvoice ? <RoleTile title="Trạng thái hóa đơn" subtitle={statusLabel(selectedInvoice.status)} icon="document-text-outline" /> : null}
                                <RoleTile title="Ngày thanh toán" subtitle={accountingDate(selected.payment_date)} icon="calendar-outline" />
                                <RoleTile title="Phương thức" subtitle={methodLabel(selected.payment_method)} icon="wallet-outline" />
                                <RoleTile title="Ngày lập phiếu" subtitle={accountingDate(selected.createdAt)} icon="calendar-outline" />
                            </RoleSection>
                            {allowed('PATCH', '/api/v1/payments/:id') ? <FptButton title="Chỉnh sửa phiếu thu" className="mb-3" onPress={() => setEditing(true)} /> : null}
                            {allowed('DELETE', '/api/v1/payments/:id') ? <FptButton title="Xóa phiếu thu" variant="ghost" onPress={() => setConfirmDelete(true)} /> : null}
                        </> : null}
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    </>;
}
