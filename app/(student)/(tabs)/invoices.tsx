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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import dayjs from 'dayjs';
import { callFetchMyInvoices, callFetchMyPayments } from '@/api';
import { IPortalInvoice, IPortalPayment } from '@/types/backend';
import { FptCard, FptBadge, FptLoading, FptEmptyState, FptButton } from '@/components/common';

export default function StudentInvoicesScreen() {
    const [tab, setTab] = useState<'INVOICES' | 'PAYMENTS'>('INVOICES');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [invoices, setInvoices] = useState<IPortalInvoice[]>([]);
    const [payments, setPayments] = useState<IPortalPayment[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<IPortalInvoice | null>(null);

    const loadData = useCallback(async () => {
        try {
            const [invoicesRes, paymentsRes] = await Promise.allSettled([
                callFetchMyInvoices(),
                callFetchMyPayments(),
            ]);

            if (invoicesRes.status === 'fulfilled' && Array.isArray(invoicesRes.value?.data)) {
                setInvoices(invoicesRes.value.data);
            }
            if (paymentsRes.status === 'fulfilled' && Array.isArray(paymentsRes.value?.data)) {
                setPayments(paymentsRes.value.data);
            }
        } catch {
            // handle error
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
        if (statusFilter === 'PENDING') return s === 'PENDING' || s === 'WAITING_PAYMENT';
        if (statusFilter === 'PAID') return s === 'PAID' || s === 'COMPLETED';
        return true;
    });

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
            {/* Header */}
            <View className="bg-white px-5 pt-3 pb-3 border-b border-gray-100">
                <Text className="text-2xl font-black text-gray-900">Học phí & Hóa đơn</Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                    Quản lý các khoản học phí và lịch sử thanh toán
                </Text>

                {/* Main Tabs Segment */}
                <View className="mt-3 flex-row rounded-xl bg-gray-100 p-1">
                    <TouchableOpacity
                        onPress={() => setTab('INVOICES')}
                        className={`flex-1 py-2 rounded-lg items-center ${
                            tab === 'INVOICES' ? 'bg-white shadow-sm' : 'bg-transparent'
                        }`}
                    >
                        <Text
                            className={`text-xs font-bold ${
                                tab === 'INVOICES' ? 'text-fpt-orange' : 'text-gray-600'
                            }`}
                        >
                            Hóa đơn học phí ({invoices.length})
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setTab('PAYMENTS')}
                        className={`flex-1 py-2 rounded-lg items-center ${
                            tab === 'PAYMENTS' ? 'bg-white shadow-sm' : 'bg-transparent'
                        }`}
                    >
                        <Text
                            className={`text-xs font-bold ${
                                tab === 'PAYMENTS' ? 'text-fpt-orange' : 'text-gray-600'
                            }`}
                        >
                            Lịch sử thanh toán ({payments.length})
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Sub filter for invoices */}
                {tab === 'INVOICES' && (
                    <View className="mt-2.5 flex-row gap-2">
                        {(['ALL', 'PENDING', 'PAID'] as const).map((key) => {
                            const isSelected = statusFilter === key;
                            const label =
                                key === 'ALL'
                                    ? 'Tất cả'
                                    : key === 'PENDING'
                                    ? 'Chờ nộp'
                                    : 'Đã hoàn tất';
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
                                            isSelected ? 'text-white' : 'text-gray-600'
                                        }`}
                                    >
                                        {label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </View>

            {loading && !refreshing ? (
                <FptLoading message="Đang tải dữ liệu học phí..." />
            ) : tab === 'INVOICES' ? (
                <FlatList
                    data={filteredInvoices}
                    keyExtractor={(item) => item._id || Math.random().toString()}
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
                            title="Không có hóa đơn"
                            description="Bạn hiện không có khoản học phí nào cần thanh toán."
                            icon="receipt-outline"
                        />
                    }
                    renderItem={({ item }) => {
                        const isPending =
                            (item.status || '').toUpperCase() === 'PENDING' ||
                            (item.status || '').toUpperCase() === 'WAITING_PAYMENT';
                        const courseName =
                            item.enrollment_id?.class_id?.course_id?.name ||
                            item.enrollment_id?.class_id?.class_name ||
                            'Khóa học FPT Education';

                        return (
                            <FptCard className="mb-4">
                                <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
                                    <View className="flex-row items-center">
                                        <View className="h-7 w-7 rounded-lg bg-orange-50 items-center justify-center mr-2">
                                            <Ionicons name="document-text" size={14} color="#F26522" />
                                        </View>
                                        <Text className="text-xs font-bold text-gray-500">
                                            #{item._id?.slice(-8).toUpperCase() || 'INV'}
                                        </Text>
                                    </View>
                                    <FptBadge status={item.status || 'PENDING'} size="sm" />
                                </View>

                                <View className="py-3">
                                    <Text className="text-base font-bold text-gray-900 leading-snug">
                                        {courseName}
                                    </Text>
                                    <Text className="text-xs text-gray-400 mt-1">
                                        Ngày lập:{' '}
                                        {item.createdAt
                                            ? dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')
                                            : 'N/A'}
                                    </Text>

                                    <View className="mt-3 rounded-xl bg-gray-50 p-3">
                                        <View className="flex-row items-center justify-between">
                                            <Text className="text-xs text-gray-500">Số tiền gốc</Text>
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
                                                    -{formatPrice(item.discount_amount)}
                                                </Text>
                                            </View>
                                        ) : null}
                                        <View className="mt-2 pt-2 border-t border-gray-200 flex-row items-center justify-between">
                                            <Text className="text-xs font-bold text-gray-900">
                                                Cần thanh toán
                                            </Text>
                                            <Text className="text-base font-black text-fpt-orange">
                                                {formatPrice(item.final_amount ?? item.amount)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {isPending && (
                                    <View className="pt-2 border-t border-gray-100">
                                        <FptButton
                                            title="Hướng dẫn nộp học phí"
                                            size="sm"
                                            onPress={() => setSelectedInvoice(item)}
                                            iconLeft={
                                                <Ionicons name="qr-code-outline" size={16} color="#FFFFFF" />
                                            }
                                        />
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
                    keyExtractor={(item) => item._id || Math.random().toString()}
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
                            description="Lịch sử các lần nộp học phí thành công sẽ hiển thị tại đây."
                            icon="card-outline"
                        />
                    }
                    renderItem={({ item }) => (
                        <FptCard className="mb-3">
                            <View className="flex-row items-center justify-between pb-2 border-b border-gray-100">
                                <Text className="text-xs font-bold text-gray-500">
                                    Phiếu thu: #{item._id?.slice(-8).toUpperCase()}
                                </Text>
                                <FptBadge status="PAID" label="Thành công" size="sm" />
                            </View>
                            <View className="pt-2">
                                <Text className="text-sm font-bold text-gray-900">
                                    Phương thức: {item.payment_method || 'Chuyển khoản VietQR'}
                                </Text>
                                <Text className="text-xs text-gray-400 mt-0.5">
                                    Thời gian:{' '}
                                    {item.payment_date || item.createdAt
                                        ? dayjs(item.payment_date || item.createdAt).format(
                                              'DD/MM/YYYY HH:mm'
                                          )
                                        : 'N/A'}
                                </Text>
                            </View>
                        </FptCard>
                    )}
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
                    <View className="max-h-[90%] rounded-t-3xl bg-white p-6">
                        <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
                            <Text className="text-lg font-bold text-gray-900">
                                Hướng dẫn thanh toán học phí
                            </Text>
                            <TouchableOpacity onPress={() => setSelectedInvoice(null)} className="p-1">
                                <Ionicons name="close" size={22} color="#718096" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
                            {selectedInvoice && (
                                <>
                                    {/* VietQR Code Image */}
                                    <View className="items-center justify-center p-4 rounded-2xl bg-gray-50 border border-gray-100 mb-4">
                                        <Image
                                            source={{
                                                uri: `https://img.vietqr.io/image/970423-123456789-compact2.png?amount=${
                                                    selectedInvoice.final_amount ?? selectedInvoice.amount
                                                }&addInfo=HOCPHI%20${selectedInvoice._id?.slice(-8).toUpperCase()}`,
                                            }}
                                            style={{ width: 220, height: 220, resizeMode: 'contain' }}
                                        />
                                        <Text className="mt-2 text-xs text-gray-500 font-medium">
                                            Quét mã QR bằng App Ngân hàng bất kỳ
                                        </Text>
                                    </View>

                                    {/* Bank Details */}
                                    <View className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4">
                                        <View className="flex-row items-center justify-between">
                                            <Text className="text-xs text-gray-500">Ngân hàng</Text>
                                            <Text className="text-sm font-bold text-gray-900">
                                                TPBank (Tiên Phong Bank)
                                            </Text>
                                        </View>

                                        <View className="flex-row items-center justify-between pt-2 border-t border-gray-50">
                                            <Text className="text-xs text-gray-500">Số tài khoản</Text>
                                            <TouchableOpacity
                                                onPress={() => copyToClipboard('123456789', 'Số tài khoản')}
                                                className="flex-row items-center"
                                            >
                                                <Text className="text-sm font-bold text-fpt-orange mr-1">
                                                    123456789
                                                </Text>
                                                <Ionicons name="copy-outline" size={14} color="#F26522" />
                                            </TouchableOpacity>
                                        </View>

                                        <View className="flex-row items-center justify-between pt-2 border-t border-gray-50">
                                            <Text className="text-xs text-gray-500">Chủ tài khoản</Text>
                                            <Text className="text-sm font-bold text-gray-900">
                                                FPT TECH EDUCATION
                                            </Text>
                                        </View>

                                        <View className="flex-row items-center justify-between pt-2 border-t border-gray-50">
                                            <Text className="text-xs text-gray-500">Số tiền</Text>
                                            <TouchableOpacity
                                                onPress={() =>
                                                    copyToClipboard(
                                                        String(
                                                            selectedInvoice.final_amount ??
                                                                selectedInvoice.amount
                                                        ),
                                                        'Số tiền'
                                                    )
                                                }
                                                className="flex-row items-center"
                                            >
                                                <Text className="text-base font-black text-fpt-orange mr-1">
                                                    {formatPrice(
                                                        selectedInvoice.final_amount ??
                                                            selectedInvoice.amount
                                                    )}
                                                </Text>
                                                <Ionicons name="copy-outline" size={14} color="#F26522" />
                                            </TouchableOpacity>
                                        </View>

                                        <View className="flex-row items-center justify-between pt-2 border-t border-gray-50">
                                            <Text className="text-xs text-gray-500">Nội dung CK</Text>
                                            <TouchableOpacity
                                                onPress={() =>
                                                    copyToClipboard(
                                                        `HOCPHI ${selectedInvoice._id
                                                            ?.slice(-8)
                                                            .toUpperCase()}`,
                                                        'Nội dung chuyển khoản'
                                                    )
                                                }
                                                className="flex-row items-center"
                                            >
                                                <Text className="text-xs font-bold text-fpt-orange mr-1">
                                                    HOCPHI {selectedInvoice._id?.slice(-8).toUpperCase()}
                                                </Text>
                                                <Ionicons name="copy-outline" size={14} color="#F26522" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <View className="mt-4 mb-6">
                                        <FptButton
                                            title="Đã hoàn tất chuyển khoản"
                                            onPress={() => {
                                                setSelectedInvoice(null);
                                                Alert.alert(
                                                    'Cảm ơn bạn',
                                                    'Hệ thống sẽ đối soát và cập nhật trạng thái hóa đơn ngay khi nhận được tiền.'
                                                );
                                            }}
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
