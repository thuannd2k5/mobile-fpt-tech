import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAppSelector } from '@/redux/hooks';
import { canUse } from '@/utils/permissions';
import { RoleHero, RoleScreen, RoleSection, RoleTile } from '@/components/common/RoleScreen';
import { FptButton } from '@/components/common/FptButton';
import { FptInput } from '@/components/common/FptInput';
import { FptBadge } from '@/components/common/FptBadge';
import { FptEmptyState } from '@/components/common/FptEmptyState';
import FptErrorBanner from '@/components/common/FptErrorBanner';
import {
    AccountantEnrollment, AccountantInvoice, accountingDate, accountingError, createAccountantInvoice,
    enrollmentLabel, fetchAccountantEnrollments, fetchAccountantInvoices,
    invoiceAmount, invoiceEnrollment, invoiceOutstanding, invoicePaid, money, refId, shortId,
    statusLabel, updateAccountantInvoice, uninvoicedEnrollments,
} from '@/api/accountant';
import { printFinancialDocument } from '@/utils/financialDocuments';

const statuses = ['UNPAID', 'PAID', 'CANCELLED', 'WAITING_CONFIRMATION', 'PARTIAL'];

export default function AccountingInvoicesScreen() {
    const router = useRouter();
    const permissions = useAppSelector((state) => state.account.user.permissions);
    const allowed = useCallback((method: string, path = '/api/v1/invoices') => canUse(permissions, method, path), [permissions]);
    const read = allowed('GET');
    const readEnrollments = allowed('GET', '/api/v1/enrollments');
    const [rows, setRows] = useState<AccountantInvoice[]>([]);
    const [enrollments, setEnrollments] = useState<AccountantEnrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('ALL');
    const [visible, setVisible] = useState(false);
    const [selected, setSelected] = useState<AccountantInvoice | null>(null);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [enrollmentId, setEnrollmentId] = useState('');
    const [referenceSearch, setReferenceSearch] = useState('');
    const [amount, setAmount] = useState('');
    const [discount, setDiscount] = useState('0');
    const [status, setStatus] = useState('UNPAID');
    const refresh = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const [invoiceRows, enrollmentRows] = await Promise.all([
                read ? fetchAccountantInvoices() : Promise.resolve([]),
                readEnrollments ? fetchAccountantEnrollments() : Promise.resolve([]),
            ]);
            setRows(invoiceRows); setEnrollments(enrollmentRows);
        } catch (reason) { setError(accountingError(reason)); }
        finally { setLoading(false); }
    }, [read, readEnrollments]);
    useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
    const describe = useCallback((row: AccountantInvoice) => {
        const enrollment = invoiceEnrollment(row, enrollments);
        return enrollment ? enrollmentLabel(enrollment) : `Ghi danh ${refId(row.enrollment_id) || 'chưa cập nhật'}`;
    }, [enrollments]);
    const filtered = useMemo(() => rows.filter((row) =>
        (filter === 'ALL' || (filter === 'UNPAID' ? ['UNPAID', 'PENDING', 'WAITING_PAYMENT'].includes(row.status || '') : row.status === filter)) &&
        `${row._id} ${describe(row)}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())), [rows, filter, search, describe]);
    const eligibleEnrollments = uninvoicedEnrollments(enrollments, rows);
    const enrollmentOptions = (selected ? enrollments.filter(item => item._id === refId(selected.enrollment_id)) : eligibleEnrollments)
        .filter((item) => `${item._id} ${enrollmentLabel(item)}`.toLocaleLowerCase().includes(referenceSearch.trim().toLocaleLowerCase()));
    const currentStatus = selected?.status?.toUpperCase() || 'UNPAID';
    const canCancelInvoice = !!selected &&
        !['PAID', 'PARTIAL', 'WAITING_CONFIRMATION', 'CANCELLED'].includes(currentStatus) &&
        invoicePaid(selected) === 0;
    const close = () => { if (!saving) setVisible(false); };
    const open = (row: AccountantInvoice | null, edit = false) => {
        setSelected(row); setEditing(edit); setFormError(''); setReferenceSearch('');
        setEnrollmentId(row ? refId(row.enrollment_id) : '');
        setAmount(row ? String(row.amount ?? 0) : ''); setDiscount(String(row?.discount_amount ?? 0));
        setStatus(row?.status || 'UNPAID'); setVisible(true);
    };
    const save = async () => {
        const method = selected ? 'PATCH' : 'POST';
        if (!allowed(method, selected ? '/api/v1/invoices/:id' : '/api/v1/invoices')) return;
        if (selected && status !== currentStatus && !(status === 'CANCELLED' && canCancelInvoice)) {
            setFormError('Trạng thái đã nộp chỉ được thay đổi khi kế toán duyệt phiếu thu.');
            return;
        }
        if (!selected && !eligibleEnrollments.some(item => item._id === enrollmentId)) {
            setFormError('Ghi danh này đã có hóa đơn hoặc không còn hợp lệ. Vui lòng tải lại danh sách.'); return;
        }
        const base = Number(amount), reduction = Number(discount);
        if (!enrollmentId || !amount.trim() || !discount.trim() || !Number.isFinite(base) || !Number.isFinite(reduction) || base < 0 || reduction < 0 || reduction > base) {
            setFormError('Chọn ghi danh, nhập học phí và giảm trừ hợp lệ (0 ≤ giảm trừ ≤ học phí).'); return;
        }
        setSaving(true); setFormError('');
        try {
            const payload = { enrollment_id: enrollmentId, amount: base, discount_amount: reduction, final_amount: base - reduction, status };
            if (selected?._id) await updateAccountantInvoice(selected._id, payload);
            else await createAccountantInvoice(payload);
            setVisible(false); await refresh();
        } catch (reason) { setFormError(accountingError(reason)); }
        finally { setSaving(false); }
    };
    const printInvoice = async () => {
        if (!selected) return;
        const enrollment = invoiceEnrollment(selected, enrollments);
        const student = typeof enrollment?.student_id === 'object' ? enrollment.student_id : undefined;
        const classroom = typeof enrollment?.class_id === 'object' ? enrollment.class_id : undefined;
        const course = typeof classroom?.course_id === 'object' ? classroom.course_id : undefined;
        try {
            await printFinancialDocument({
                title: 'HÓA ĐƠN THU HỌC PHÍ',
                documentCode: `INV-${shortId(selected._id)}`,
                invoiceCode: `INV-${shortId(selected._id)}`,
                studentName: student?.name || student?.email || 'Chưa cập nhật',
                studentEmail: student?.email,
                courseName: course?.name || 'Chưa cập nhật',
                className: classroom?.class_name || 'Chưa cập nhật',
                amount: Number(selected.amount || 0),
                discountAmount: Number(selected.discount_amount || 0),
                finalAmount: invoiceAmount(selected),
                status: statusLabel(selected.status),
                date: accountingDate(selected.createdAt),
            });
        } catch (reason) {
            Alert.alert('Không thể in hóa đơn', accountingError(reason));
        }
    };
    return <>
        <RoleScreen title="Hóa đơn & công nợ" subtitle="Quản lý học phí theo từng ghi danh" eyebrow="Kế toán" refreshing={loading} onRefresh={() => void refresh()}>
            <RoleHero eyebrow="Invoice management" title="Chứng từ học phí" description="Tra cứu số tiền, ghi danh và trạng thái thanh toán." />
            {allowed('POST') && readEnrollments && read ? <FptButton title="Lập hóa đơn" className="mb-5" onPress={() => open(null, true)} disabled={loading || !!error || !eligibleEnrollments.length} /> : null}
            {allowed('POST') && readEnrollments && read && !loading && !error && !eligibleEnrollments.length ? <Text className="mb-4 text-xs leading-5 text-slate-500">Các ghi danh hiện tại đều đã có hóa đơn. Bạn có thể xem hoặc cập nhật hóa đơn hiện có.</Text> : null}
            {error ? <FptErrorBanner message={error} onRetry={() => void refresh()} /> : null}
            {!read ? <FptEmptyState title="Chưa được cấp quyền" description="Tài khoản chưa có quyền xem danh sách hóa đơn." /> : <>
                <FptInput placeholder="Tìm mã hóa đơn, học viên, lớp…" value={search} onChangeText={setSearch} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
                    {['ALL', ...statuses].map((item) => <TouchableOpacity key={item} accessibilityRole="button" accessibilityState={{ selected: filter === item }} onPress={() => setFilter(item)} className={`mr-2 min-h-[44px] justify-center rounded-full border px-4 ${filter === item ? 'border-fpt-orange bg-orange-50' : 'border-slate-200 bg-white'}`}><Text className={`text-xs font-semibold ${filter === item ? 'text-fpt-orange' : 'text-slate-600'}`}>{item === 'ALL' ? 'Tất cả' : statusLabel(item)}</Text></TouchableOpacity>)}
                </ScrollView>
                {loading ? <ActivityIndicator color="#F26522" /> : !error && !filtered.length ? <FptEmptyState title="Chưa có hóa đơn phù hợp" description="Thử thay đổi tìm kiếm hoặc trạng thái lọc." /> : <RoleSection title={`${filtered.length} hóa đơn`}>
                    {filtered.map((row) => <RoleTile key={row._id} title={`HĐ ${shortId(row._id)} • ${money(invoiceAmount(row))}`} subtitle={`${describe(row)}\nĐã nộp ${money(invoicePaid(row))} • Còn nợ ${money(invoiceOutstanding(row))}`} onPress={() => open(row)} trailing={<FptBadge status={row.status} label={statusLabel(row.status)} size="sm" />} />)}
                </RoleSection>}
            </>}
        </RoleScreen>
        <Modal visible={visible} animationType="slide" onRequestClose={close}>
            <SafeAreaView className="flex-1 bg-fpt-grayBg">
                <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
                        <FptButton title="Đóng" variant="ghost" className="mb-3 self-start" onPress={close} disabled={saving} />
                        <Text className="mb-2 text-2xl font-bold text-slate-900">{editing ? selected ? 'Chỉnh sửa hóa đơn' : 'Lập hóa đơn' : 'Chi tiết hóa đơn'}</Text>
                        <Text selectable className="mb-5 text-xs leading-5 text-slate-500">{selected?._id || 'Chọn ghi danh và xác nhận số tiền học phí.'}</Text>
                        {formError ? <Text accessibilityRole="alert" className="mb-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{formError}</Text> : null}
                        {editing ? <>
                            <RoleSection title="Ghi danh liên quan">
                                <Text className="mb-3 text-xs leading-5 text-slate-500">{enrollments.find((item) => item._id === enrollmentId) ? enrollmentLabel(enrollments.find((item) => item._id === enrollmentId)!) : enrollmentId ? `Ghi danh ${enrollmentId}` : 'Chưa chọn ghi danh'}</Text>
                                {readEnrollments ? <>
                                    <FptInput placeholder="Tìm học viên, lớp hoặc mã ghi danh…" value={referenceSearch} onChangeText={setReferenceSearch} editable={!saving} />
                                    <ScrollView nestedScrollEnabled style={{ maxHeight: 220 }}>
                                        {enrollmentOptions.map((item) => <TouchableOpacity key={item._id} accessibilityRole="button" accessibilityState={{ selected: item._id === enrollmentId }} disabled={saving} onPress={() => setEnrollmentId(item._id || '')} className={`mb-2 rounded-xl border p-3 ${item._id === enrollmentId ? 'border-fpt-orange bg-orange-50' : 'border-slate-200 bg-white'}`}><Text className="text-sm font-semibold text-slate-900">{enrollmentLabel(item)}</Text><Text className="mt-1 text-xs text-slate-500">{item._id}</Text></TouchableOpacity>)}
                                        {!enrollmentOptions.length ? <Text className="mb-3 text-sm text-slate-500">Không có ghi danh phù hợp.</Text> : null}
                                    </ScrollView>
                                </> : null}
                            </RoleSection>
                            <FptInput label="Học phí (đ)" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} editable={!saving} />
                            <FptInput label="Giảm trừ (đ)" keyboardType="decimal-pad" value={discount} onChangeText={setDiscount} editable={!saving} />
                            <RoleTile title={money(Number(amount) - Number(discount))} subtitle="Thành tiền = học phí − giảm trừ" />
                            <RoleSection title="Trạng thái hóa đơn">
                                <Text className="mb-3 text-sm leading-6 text-slate-500">Trạng thái thanh toán được cập nhật tự động khi duyệt phiếu thu. Chỉ có thể hủy hóa đơn tại đây.</Text>
                                {[...new Set([status, ...(canCancelInvoice ? ['CANCELLED'] : [])])].map((item) => <TouchableOpacity key={item} accessibilityRole="button" accessibilityState={{ selected: item === status }} disabled={saving} onPress={() => setStatus(item)} className={`mb-2 min-h-[44px] justify-center rounded-xl border px-4 py-3 ${item === status ? 'border-fpt-orange bg-orange-50' : 'border-slate-200 bg-white'}`}><Text className="text-sm text-slate-800">{statusLabel(item)}</Text></TouchableOpacity>)}
                            </RoleSection>
                            <FptButton title={selected ? 'Lưu hóa đơn' : 'Tạo hóa đơn'} loading={saving} onPress={() => void save()} />
                        </> : selected ? <>
                            <RoleHero eyebrow="Học phí phải thu" title={money(invoiceOutstanding(selected))} description={`${statusLabel(selected.status)} • Đã nộp ${money(invoicePaid(selected))}`} />
                            <RoleSection title="Thông tin chứng từ">
                                <RoleTile title="Học viên / Lớp" subtitle={describe(selected)} />
                                <RoleTile title="Ghi danh" subtitle={refId(selected.enrollment_id)} />
                                <RoleTile title="Học phí" subtitle={money(selected.amount)} />
                                <RoleTile title="Giảm trừ" subtitle={money(selected.discount_amount)} />
                                <RoleTile title="Ngày tạo" subtitle={accountingDate(selected.createdAt)} icon="calendar-outline" />
                            </RoleSection>
                            <FptButton title="In hóa đơn" variant="outline" className="mb-3" onPress={() => void printInvoice()} />
                            {invoiceOutstanding(selected) > 0 && !['PAID', 'CANCELLED'].includes(selected.status?.toUpperCase() || '') && allowed('POST', '/api/v1/payments') && allowed('GET', '/api/v1/payments') && allowed('PATCH', '/api/v1/payments/:id') ? <FptButton title={selected.status?.toUpperCase() === 'WAITING_CONFIRMATION' ? 'Mở yêu cầu chờ duyệt' : 'Ghi nhận / duyệt thanh toán'} className="mb-3" onPress={() => { close(); router.push({ pathname: '/(accountant)/(tabs)/payments', params: { invoiceId: selected._id } }); }} /> : null}
                            {allowed('PATCH', '/api/v1/invoices/:id') ? <FptButton title="Chỉnh sửa hóa đơn" variant="outline" className="mb-3" onPress={() => setEditing(true)} /> : null}
                        </> : null}
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    </>;
}
