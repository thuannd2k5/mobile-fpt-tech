import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Modal,
    Image,
    Alert,
    RefreshControl,
    ScrollView,
} from 'react-native';
import {
    SafeAreaView,
    useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import dayjs from 'dayjs';
import {
    invoiceOutstandingAmount,
    invoicePaidAmount,
    invoiceTotalAmount,
    isInvoicePayable,
} from '@/utils/invoices';
import { paymentBank } from '@/config/payment';
import { RoleHero } from '@/components/common/RoleScreen';
import FptErrorBanner from '@/components/common/FptErrorBanner';
import {
    callCancelMyEnrollment,
    callFetchMyInvoices,
    callFetchMyPayments,
    callRequestPayment,
} from '@/api';
import { IPortalInvoice, IPortalPayment } from '@/types/backend';
import {
    FptCard,
    FptBadge,
    FptLoading,
    FptEmptyState,
    FptButton,
    FptInput,
} from '@/components/common';

const invoiceFilters = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'PENDING', label: 'Chưa thanh toán' },
    { key: 'WAITING_CONFIRMATION', label: 'Đang chờ kế toán duyệt' },
    { key: 'PARTIAL', label: 'Đã nộp một phần' },
    { key: 'PAID', label: 'Đã thanh toán' },
    { key: 'CANCELLED', label: 'Đã hủy' },
] as const;

export default function StudentInvoicesScreen() {
    const insets = useSafeAreaInsets();
    const [loadError, setLoadError] = useState('');
    const [tab, setTab] = useState<'INVOICES' | 'PAYMENTS'>('INVOICES');
    const [statusFilter, setStatusFilter] = useState<(typeof invoiceFilters)[number]['key']>('ALL');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [invoices, setInvoices] = useState<IPortalInvoice[]>([]);
    const [payments, setPayments] = useState<IPortalPayment[]>([]);
    const [selectedInvoice, setSelectedInvoice] =
        useState<IPortalInvoice | null>(null);
    const [search, setSearch] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'CASH'>('BANK_TRANSFER');
    const [submittingPayment, setSubmittingPayment] = useState(false);
    const [paymentError, setPaymentError] = useState('');
    const [cancelingEnrollmentId, setCancelingEnrollmentId] = useState('');

    const loadData = useCallback(async () => {
        setLoadError('');
        try {
            const [invoicesRes, paymentsRes] = await Promise.allSettled([
                callFetchMyInvoices(),
                callFetchMyPayments(),
            ]);

            if (
                [invoicesRes, paymentsRes].some(
                    (result) => result.status === 'rejected',
                )
            ) {
                setLoadError(
                    'Không tải được đầy đủ thông tin học phí. Dữ liệu đang hiển thị có thể chưa cập nhật.',
                );
            }
            if (
                invoicesRes.status === 'fulfilled' &&
                Array.isArray(invoicesRes.value?.data)
            ) {
                setInvoices(invoicesRes.value.data);
            }
            if (
                paymentsRes.status === 'fulfilled' &&
                Array.isArray(paymentsRes.value?.data)
            ) {
                setPayments(paymentsRes.value.data);
            }
        } catch {
            setLoadError('Không thể kết nối để tải học phí. Vui lòng thử lại.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const submitPaymentRequest = async () => {
        const invoice = selectedInvoice;
        if (!invoice?._id) {
            setPaymentError('Không xác định được hóa đơn cần thanh toán.');
            return;
        }
        const amount = Number(paymentAmount);
        const outstanding = invoiceOutstandingAmount(invoice);
        if (!Number.isFinite(amount) || amount <= 0 || amount > outstanding) {
            setPaymentError(
                'Nhập số tiền lớn hơn 0 và không vượt quá công nợ còn lại.',
            );
            return;
        }

        setSubmittingPayment(true);
        setPaymentError('');
        try {
            await callRequestPayment({
                invoice_id: invoice._id,
                payment_method: paymentMethod,
                amount,
            });
            setSelectedInvoice(null);
            Alert.alert(
                'Đã gửi yêu cầu',
                'Hóa đơn đã chuyển sang trạng thái đang chờ kế toán duyệt. Số tiền đã nộp sẽ được cập nhật sau khi đối soát.',
            );
            await loadData();
        } catch (reason) {
            const error = reason as {
                message?: string;
                response?: { data?: { message?: string | string[] } };
            };
            const message = error.response?.data?.message || error.message;
            setPaymentError(
                Array.isArray(message)
                    ? message.join('\n')
                    : message || 'Không thể gửi yêu cầu thanh toán. Vui lòng thử lại.',
            );
        } finally {
            setSubmittingPayment(false);
        }
    };

    const cancelEnrollment = (invoice: IPortalInvoice) => {
        const enrollmentId =
            typeof invoice.enrollment_id === 'string'
                ? invoice.enrollment_id
                : invoice.enrollment_id?._id;
        if (!enrollmentId) {
            Alert.alert('Không thể hủy', 'Không tìm thấy thông tin ghi danh.');
            return;
        }
        Alert.alert(
            'Hủy ghi danh?',
            'Hóa đơn liên quan cũng sẽ bị hủy và bạn sẽ không còn giữ chỗ trong lớp.',
            [
                { text: 'Giữ lại', style: 'cancel' },
                {
                    text: 'Hủy ghi danh',
                    style: 'destructive',
                    onPress: () => {
                        setCancelingEnrollmentId(enrollmentId);
                        void callCancelMyEnrollment(enrollmentId)
                            .then(async () => {
                                Alert.alert('Đã hủy', 'Ghi danh và hóa đơn liên quan đã được hủy.');
                                await loadData();
                            })
                            .catch((reason: unknown) => {
                                const message = (reason as { message?: string })?.message;
                                setLoadError(
                                    message || 'Không thể hủy ghi danh. Vui lòng kiểm tra trạng thái hóa đơn.',
                                );
                            })
                            .finally(() => setCancelingEnrollmentId(''));
                    },
                },
            ],
        );
    };

    const formatPrice = (val?: string | number) => {
        if (!val) return '0 ₫';
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return isNaN(num) ? String(val) : `${num.toLocaleString('vi-VN')} ₫`;
    };

    const copyToClipboard = async (text: string, label: string) => {
        await Clipboard.setStringAsync(text);
        Alert.alert('Đã sao chép', `Đã sao chép ${label} vào bộ nhớ tạm.`);
    };

    const filteredInvoices = invoices.filter((item) => {
        const s = (item.status || '').toUpperCase();
        const courseName =
            item.enrollment_id?.class_id?.course_id?.name ||
            item.enrollment_id?.class_id?.class_name ||
            '';
        const className = item.enrollment_id?.class_id?.class_name || '';
        const matchesSearch = `${item._id || ''} ${courseName} ${className}`
            .toLocaleLowerCase()
            .includes(search.trim().toLocaleLowerCase());
        const matchesStatus =
            statusFilter === 'ALL' ||
            (statusFilter === 'PENDING' &&
                isInvoicePayable(item.status) &&
                s !== 'PARTIAL') ||
            (statusFilter === 'WAITING_CONFIRMATION' && s === 'WAITING_CONFIRMATION') ||
            (statusFilter === 'PARTIAL' && s === 'PARTIAL') ||
            (statusFilter === 'PAID' && s === 'PAID') ||
            (statusFilter === 'CANCELLED' && s === 'CANCELLED');
        return matchesSearch && matchesStatus;
    });
    const outstandingAmount = invoices
        .filter((invoice) => !['PAID', 'CANCELLED'].includes((invoice.status || '').toUpperCase()))
        .reduce((sum, invoice) => sum + invoiceOutstandingAmount(invoice), 0);

    return (
        <SafeAreaView className="flex-1 bg-fpt-grayBg" edges={['top']}>
            {/* Header */}
            <View className="bg-white px-5 pt-5 pb-4 border-b border-slate-100">
                <Text className="text-2xl font-bold text-gray-900">
                    Học phí của tôi
                </Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                    Quản lý các khoản học phí và lịch sử thanh toán
                </Text>

                <View className="mt-4">
                    <RoleHero
                        eyebrow="Học phí chưa nộp"
                        title={formatPrice(outstandingAmount)}
                        description="Theo dõi hóa đơn và giao dịch thuộc tài khoản của bạn."
                    />
                </View>
                {/* Main Tabs Segment */}
                <View className="mt-3 flex-row rounded-xl bg-gray-100 p-1">
                    <TouchableOpacity
                        onPress={() => setTab('INVOICES')}
                        className={`flex-1 py-2 rounded-lg items-center ${
                            tab === 'INVOICES'
                                ? 'bg-white shadow-sm'
                                : 'bg-transparent'
                        }`}
                    >
                        <Text
                            className={`text-xs font-bold ${
                                tab === 'INVOICES'
                                    ? 'text-fpt-orange'
                                    : 'text-gray-600'
                            }`}
                        >
                            Hóa đơn học phí ({invoices.length})
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setTab('PAYMENTS')}
                        className={`flex-1 py-2 rounded-lg items-center ${
                            tab === 'PAYMENTS'
                                ? 'bg-white shadow-sm'
                                : 'bg-transparent'
                        }`}
                    >
                        <Text
                            className={`text-xs font-bold ${
                                tab === 'PAYMENTS'
                                    ? 'text-fpt-orange'
                                    : 'text-gray-600'
                            }`}
                        >
                            Lịch sử thanh toán ({payments.length})
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Sub filter for invoices */}
                {tab === 'INVOICES' && (
                    <View className="mt-2.5 flex-row gap-2">
                        {invoiceFilters.map(({ key, label }) => {
                            const isSelected = statusFilter === key;
                            return (
                                <TouchableOpacity
                                    key={key}
                                    onPress={() => setStatusFilter(key)}
                                    className={`rounded-full px-3 py-1 border ${
                                        isSelected
                                            ? 'bg-fpt-orange border-fpt-orange'
                                            : 'bg-white border-gray-200'
                                    }`}
                                >
                                    <Text
                                        className={`text-xs font-semibold ${
                                            isSelected
                                                ? 'text-white'
                                                : 'text-gray-600'
                                        }`}
                                    >
                                        {label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
                {tab === 'INVOICES' ? (
                    <View className="mt-3">
                        <FptInput
                            placeholder="Tìm mã hóa đơn, khóa học hoặc lớp…"
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                ) : null}
            </View>

            {loadError ? (
                <FptErrorBanner message={loadError} onRetry={onRefresh} />
            ) : null}
            {loading && !refreshing ? (
                <FptLoading message="Đang tải dữ liệu học phí..." />
            ) : tab === 'INVOICES' ? (
                <FlatList
                    data={filteredInvoices}
                    keyExtractor={(item) =>
                        item._id || Math.random().toString()
                    }
                    contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#F26522']}
                            tintColor="#F26522"
                        />
                    }
                    ListEmptyComponent={
                        loadError ? undefined : (
                            <FptEmptyState
                                title="Không có hóa đơn"
                                description="Không có hóa đơn phù hợp với bộ lọc hiện tại."
                                icon="receipt-outline"
                            />
                        )
                    }
                    renderItem={({ item }) => {
                        const isPending = isInvoicePayable(item.status);
                        const courseName =
                            item.enrollment_id?.class_id?.course_id?.name ||
                            item.enrollment_id?.class_id?.class_name ||
                            'Khóa học FPT Education';

                        return (
                            <FptCard className="mb-4">
                                <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
                                    <View className="flex-row items-center">
                                        <View className="h-7 w-7 rounded-lg bg-orange-50 items-center justify-center mr-2">
                                            <Ionicons
                                                name="document-text"
                                                size={14}
                                                color="#F26522"
                                            />
                                        </View>
                                        <Text className="text-xs font-bold text-gray-500">
                                            #
                                            {item._id
                                                ?.slice(-8)
                                                .toUpperCase() || 'INV'}
                                        </Text>
                                    </View>
                                    <FptBadge
                                        status={item.status || 'PENDING'}
                                        size="sm"
                                    />
                                </View>

                                <View className="py-3">
                                    <Text className="text-base font-bold text-gray-900 leading-snug">
                                        {courseName}
                                    </Text>
                                    <Text className="text-xs text-gray-400 mt-1">
                                        Ngày lập:{' '}
                                        {item.createdAt
                                            ? dayjs(item.createdAt).format(
                                                  'DD/MM/YYYY HH:mm',
                                              )
                                            : 'N/A'}
                                    </Text>

                                    <View className="mt-3 rounded-xl bg-fpt-grayBg p-3">
                                        <View className="flex-row items-center justify-between">
                                            <Text className="text-xs text-gray-500">
                                                Số tiền gốc
                                            </Text>
                                            <Text className="text-xs font-medium text-gray-800">
                                                {formatPrice(item.amount)}
                                            </Text>
                                        </View>
                                        {item.discount_amount ? (
                                            <View className="mt-1 flex-row items-center justify-between">
                                                <Text className="text-xs text-emerald-600">
                                                    Ưu đãi giảm giá
                                                </Text>
                                                <Text className="text-xs font-medium text-emerald-600">
                                                    -
                                                    {formatPrice(
                                                        item.discount_amount,
                                                    )}
                                                </Text>
                                            </View>
                                        ) : null}
                                        <View className="mt-2 pt-2 border-t border-gray-200 flex-row items-center justify-between">
                                            <Text className="text-xs font-bold text-gray-900">
                                                Tổng học phí
                                            </Text>
                                            <Text className="text-base font-black text-fpt-orange">
                                                {formatPrice(
                                                    item.final_amount ??
                                                        item.amount,
                                                )}
                                            </Text>
                                        </View>
                                        {invoicePaidAmount(item) > 0 ? (
                                            <View className="mt-2 border-t border-gray-200 pt-2">
                                                <View className="flex-row items-center justify-between">
                                                    <Text className="text-xs text-emerald-700">Đã nộp</Text>
                                                    <Text className="text-xs font-semibold text-emerald-700">
                                                        {formatPrice(invoicePaidAmount(item))}
                                                    </Text>
                                                </View>
                                                <View className="mt-1 flex-row items-center justify-between">
                                                    <Text className="text-xs font-bold text-gray-900">Còn phải nộp</Text>
                                                    <Text className="text-sm font-bold text-fpt-orange">
                                                        {formatPrice(invoiceOutstandingAmount(item))}
                                                    </Text>
                                                </View>
                                            </View>
                                        ) : null}
                                    </View>
                                </View>

                                {isPending && (
                                    <View className="pt-2 border-t border-gray-100">
                                        <FptButton
                                            title="Thanh toán / gửi yêu cầu"
                                            size="sm"
                                            onPress={() => {
                                                setPaymentError('');
                                                setPaymentMethod('BANK_TRANSFER');
                                                setPaymentAmount(
                                                    String(invoiceOutstandingAmount(item)),
                                                );
                                                setSelectedInvoice(item)
                                            }}
                                            iconLeft={
                                                <Ionicons
                                                    name="qr-code-outline"
                                                    size={16}
                                                    color="#FFFFFF"
                                                />
                                            }
                                        />
                                        {invoicePaidAmount(item) === 0 &&
                                        item.status?.toUpperCase() !== 'PARTIAL' &&
                                        item.enrollment_id?.status !== 'COMPLETED' &&
                                        item.enrollment_id?.status !== 'CANCELLED' ? (
                                            <FptButton
                                                title="Hủy ghi danh"
                                                variant="ghost"
                                                size="sm"
                                                loading={
                                                    cancelingEnrollmentId ===
                                                    (typeof item.enrollment_id === 'string'
                                                        ? item.enrollment_id
                                                        : item.enrollment_id?._id)
                                                }
                                                onPress={() => cancelEnrollment(item)}
                                            />
                                        ) : null}
                                    </View>
                                )}
                            </FptCard>
                        );
                    }}
                />
            ) : (
                /* Payments list */
                <FlatList
                    data={payments}
                    keyExtractor={(item) =>
                        item._id || Math.random().toString()
                    }
                    contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#F26522']}
                            tintColor="#F26522"
                        />
                    }
                    ListEmptyComponent={
                        <FptEmptyState
                            title="Chưa có giao dịch"
                            description="Yêu cầu thanh toán và các khoản đã được kế toán xác nhận sẽ hiển thị tại đây."
                            icon="card-outline"
                        />
                    }
                    renderItem={({ item }) => {
                        const invoiceStatus = item.invoice_id?.status?.toUpperCase();
                        const paymentStatus = item.status?.toUpperCase() ||
                            (invoiceStatus === 'WAITING_CONFIRMATION'
                                ? 'WAITING_CONFIRMATION'
                                : invoiceStatus === 'PAID' || invoiceStatus === 'PARTIAL'
                                  ? 'APPROVED'
                                  : 'WAITING_CONFIRMATION');
                        const receiptLabel =
                            paymentStatus === 'APPROVED'
                                ? 'Đã duyệt'
                                : paymentStatus === 'REJECTED'
                                  ? 'Bị từ chối'
                                  : 'Đang chờ duyệt';
                        const invoiceId = item.invoice_id?._id;
                        const paidAmount = Number(
                            item.approved_amount ??
                                item.amount ??
                                (invoiceStatus === 'PAID' && item.invoice_id
                                    ? invoiceTotalAmount(item.invoice_id)
                                    : 0),
                        );
                        return (
                            <FptCard className="mb-3">
                            <View className="flex-row items-center justify-between pb-2 border-b border-gray-100">
                                <Text className="text-xs font-bold text-gray-500">
                                    Phiếu thu: #
                                    {item._id?.slice(-8).toUpperCase()}
                                </Text>
                                <FptBadge
                                    status={paymentStatus}
                                    label={receiptLabel}
                                    size="sm"
                                />
                            </View>
                            <View className="pt-2">
                                <Text className="text-sm font-bold text-gray-900">
                                    Phương thức:{' '}
                                    {item.payment_method === 'BANK_TRANSFER'
                                        ? 'Chuyển khoản ngân hàng'
                                        : item.payment_method === 'CASH'
                                          ? 'Tiền mặt'
                                          : item.payment_method || 'Chưa cập nhật'}
                                </Text>
                                {invoiceId ? (
                                    <Text className="text-xs text-gray-500 mt-1">
                                        Hóa đơn: #{invoiceId.slice(-8).toUpperCase()}
                                    </Text>
                                ) : null}
                                <Text className="text-sm font-semibold text-fpt-orange mt-1">
                                    Số tiền: {formatPrice(paidAmount)}
                                </Text>
                                <Text className="text-xs text-gray-400 mt-0.5">
                                    Thời gian:{' '}
                                    {item.payment_date || item.createdAt
                                        ? dayjs(
                                              item.payment_date ||
                                                  item.createdAt,
                                          ).format('DD/MM/YYYY HH:mm')
                                        : 'N/A'}
                                </Text>
                            </View>
                            </FptCard>
                        );
                    }}
                />
            )}

            {/* Payment Guide Modal */}
            <Modal
                visible={!!selectedInvoice}
                animationType="slide"
                transparent
                onRequestClose={() => setSelectedInvoice(null)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View
                        className="max-h-[90%] rounded-t-3xl bg-white p-6"
                        style={{ paddingBottom: Math.max(insets.bottom, 24) }}
                    >
                        <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
                            <Text className="flex-1 pr-2 text-lg font-bold text-gray-900">
                                Hướng dẫn thanh toán học phí
                            </Text>
                            <TouchableOpacity
                                onPress={() => setSelectedInvoice(null)}
                                accessibilityRole="button"
                                accessibilityLabel="Đóng hướng dẫn"
                                className="min-h-[44px] min-w-[44px] items-center justify-center"
                            >
                                <Ionicons
                                    name="close"
                                    size={22}
                                    color="#718096"
                                />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            className="mt-4"
                            showsVerticalScrollIndicator={false}
                        >
                            {selectedInvoice && (
                                <>
                                    <Text className="mb-3 text-sm leading-6 text-slate-600">
                                        Hóa đơn #{selectedInvoice._id?.slice(-8).toUpperCase()} ·{' '}
                                        {formatPrice(invoiceOutstandingAmount(selectedInvoice))} còn phải nộp
                                    </Text>
                                    <FptInput
                                        label="Số tiền nộp (đ)"
                                        placeholder="Nhập số tiền đã chuyển/nộp"
                                        keyboardType="decimal-pad"
                                        value={paymentAmount}
                                        onChangeText={setPaymentAmount}
                                        editable={!submittingPayment}
                                    />
                                    <View className="mb-4 flex-row gap-2">
                                        {(['BANK_TRANSFER', 'CASH'] as const).map((method) => (
                                            <TouchableOpacity
                                                key={method}
                                                accessibilityRole="button"
                                                accessibilityState={{ selected: paymentMethod === method }}
                                                onPress={() => setPaymentMethod(method)}
                                                className={`flex-1 rounded-xl border p-3 ${
                                                    paymentMethod === method
                                                        ? 'border-fpt-orange bg-orange-50'
                                                        : 'border-slate-200 bg-white'
                                                }`}
                                            >
                                                <Text className={`text-center text-xs font-semibold ${
                                                    paymentMethod === method
                                                        ? 'text-fpt-orange'
                                                        : 'text-slate-600'
                                                }`}>
                                                    {method === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt'}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    {paymentMethod === 'BANK_TRANSFER' ? (
                                        paymentBank ? (
                                            <View className="mb-4 items-center rounded-2xl border border-slate-100 bg-fpt-grayBg p-4">
                                                <Image
                                                    source={{
                                                        uri: paymentBank.qrUrl(
                                                            Number(paymentAmount) || 0,
                                                            selectedInvoice._id || '',
                                                        ),
                                                    }}
                                                    accessibilityLabel="Mã QR chuyển khoản học phí"
                                                    onError={() =>
                                                        Alert.alert(
                                                            'Không tải được QR',
                                                            'Vui lòng dùng thông tin chuyển khoản bên dưới hoặc liên hệ phòng đào tạo.',
                                                        )
                                                    }
                                                    style={{
                                                        width: 220,
                                                        height: 220,
                                                        resizeMode: 'contain',
                                                    }}
                                                />
                                                <Text className="mt-3 text-center text-xs leading-5 text-slate-500">
                                                    Kiểm tra người nhận và số tiền trong ứng dụng ngân hàng trước khi chuyển khoản.
                                                </Text>
                                            </View>
                                        ) : (
                                            <View className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                                <Ionicons
                                                    name="information-circle-outline"
                                                    size={24}
                                                    color="#B45309"
                                                />
                                                <Text className="mt-2 text-base font-bold text-amber-900">
                                                    Liên hệ phòng đào tạo để nộp học phí
                                                </Text>
                                                <Text className="mt-2 text-sm leading-6 text-amber-800">
                                                    Thông tin tài khoản nhận học phí chưa được thiết lập. Bạn có thể cung cấp mã hóa đơn bên dưới để được hướng dẫn.
                                                </Text>
                                            </View>
                                        )
                                    ) : (
                                        <View className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                                            <Text className="text-sm font-bold text-blue-900">
                                                Nộp tiền mặt tại trung tâm
                                            </Text>
                                            <Text className="mt-2 text-sm leading-6 text-blue-800">
                                                Vui lòng nộp học phí trực tiếp. Yêu cầu sẽ ở trạng thái chờ xác nhận cho đến khi kế toán ghi nhận.
                                            </Text>
                                        </View>
                                    )}
                                    {paymentError ? (
                                        <Text accessibilityRole="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                                            {paymentError}
                                        </Text>
                                    ) : null}
                                    {paymentMethod === 'BANK_TRANSFER' ? (
                                        <View className="rounded-2xl border border-slate-100 bg-white p-4">
                                            {paymentBank ? (
                                                <>
                                                    <View className="mb-3">
                                                        <Text className="text-xs text-slate-500">Ngân hàng</Text>
                                                        <Text className="mt-1 text-sm font-bold text-slate-900">
                                                            {paymentBank.bankName}
                                                        </Text>
                                                    </View>
                                                    <TouchableOpacity
                                                        accessibilityRole="button"
                                                        accessibilityLabel="Sao chép số tài khoản"
                                                        onPress={() =>
                                                            paymentBank &&
                                                            copyToClipboard(paymentBank.accountNumber, 'Số tài khoản')
                                                        }
                                                        className="mb-3 min-h-[44px] flex-row items-center justify-between"
                                                    >
                                                        <View className="flex-1 pr-3">
                                                            <Text className="text-xs text-slate-500">Số tài khoản</Text>
                                                            <Text className="mt-1 text-base font-bold text-fpt-orange">
                                                                {paymentBank.accountNumber}
                                                            </Text>
                                                        </View>
                                                        <Ionicons name="copy-outline" size={18} color="#F26522" />
                                                    </TouchableOpacity>
                                                    <View className="mb-3">
                                                        <Text className="text-xs text-slate-500">Chủ tài khoản</Text>
                                                        <Text className="mt-1 text-sm font-bold text-slate-900">
                                                            {paymentBank.accountName}
                                                        </Text>
                                                    </View>
                                                </>
                                            ) : null}
                                            <View className="flex-row items-center justify-between pt-2 border-t border-gray-50">
                                                <Text className="text-xs text-gray-500">Số tiền</Text>
                                                <TouchableOpacity
                                                    onPress={() =>
                                                        copyToClipboard(
                                                                paymentAmount,
                                                            'Số tiền',
                                                        )
                                                    }
                                                    className="flex-row items-center"
                                                >
                                                    <Text className="mr-1 text-base font-black text-fpt-orange">
                                                        {formatPrice(Number(paymentAmount) || 0)}
                                                    </Text>
                                                    <Ionicons name="copy-outline" size={14} color="#F26522" />
                                                </TouchableOpacity>
                                            </View>
                                            <View className="flex-row items-center justify-between pt-2 border-t border-gray-50">
                                                <Text className="text-xs text-gray-500">Nội dung CK</Text>
                                                <TouchableOpacity
                                                    onPress={() =>
                                                        copyToClipboard(
                                                            `HOCPHI ${selectedInvoice._id?.slice(-8).toUpperCase()}`,
                                                            'Nội dung chuyển khoản',
                                                        )
                                                    }
                                                    className="flex-row items-center"
                                                >
                                                    <Text className="mr-1 text-xs font-bold text-fpt-orange">
                                                        HOCPHI {selectedInvoice._id?.slice(-8).toUpperCase()}
                                                    </Text>
                                                    <Ionicons name="copy-outline" size={14} color="#F26522" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ) : null}

                                    <View className="mt-4 mb-6">
                                        <View className="mb-2">
                                            <FptButton
                                                title="Thanh toán sau"
                                                variant="ghost"
                                                onPress={() => setSelectedInvoice(null)}
                                            />
                                        </View>
                                        <FptButton
                                            title="Thanh toán ngay"
                                            loading={submittingPayment}
                                            disabled={submittingPayment}
                                            onPress={() => void submitPaymentRequest()}
                                            size="lg"
                                        />
                                    </View>
                                </>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
