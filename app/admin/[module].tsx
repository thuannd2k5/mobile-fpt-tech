import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppSelector } from '@/redux/hooks';
import { getDefaultRouteForRole, isBackofficeRole } from '@/types/portal';
import { callFetchClassroom, callFetchCourse, callFetchEnrollments, callFetchInvoices, callFetchLeads, callFetchPayments, callFetchPermissions, callFetchRoles, callFetchUsers } from '@/api';
import { FptEmptyState, FptHeader, FptLoading } from '@/components/common';

const definitions = {
    users: { title: 'Người dùng', request: () => callFetchUsers('pageSize=100'), label: (item: any) => item.name || item.email, detail: (item: any) => `${item.email || 'Không có email'} · ${item.role?.name || 'Chưa phân vai trò'}` },
    roles: { title: 'Vai trò', request: () => callFetchRoles('pageSize=100'), label: (item: any) => item.name || 'Vai trò', detail: (item: any) => item.description || `${item.permissions?.length || 0} quyền` },
    permissions: { title: 'Phân quyền', request: () => callFetchPermissions('pageSize=100'), label: (item: any) => item.name || item.path || 'Quyền', detail: (item: any) => `${item.method || 'GET'} · ${item.module || item.path || ''}` },
    courses: { title: 'Khóa học', request: () => callFetchCourse('pageSize=100'), label: (item: any) => item.name || 'Khóa học', detail: (item: any) => `${item.level || 'Chưa phân cấp'} · ${item.duration || 'Chưa cập nhật'}` },
    classrooms: { title: 'Lớp học', request: () => callFetchClassroom('pageSize=100'), label: (item: any) => item.class_name || item.course_id?.name || 'Lớp học', detail: (item: any) => `${item.room || 'Chưa xếp phòng'} · ${item.status || 'N/A'}` },
    enrollments: { title: 'Ghi danh', request: () => callFetchEnrollments('pageSize=100'), label: (item: any) => item.student_id?.name || 'Học viên', detail: (item: any) => `${item.class_id?.class_name || 'Lớp học'} · ${item.status || 'N/A'}` },
    invoices: { title: 'Hóa đơn', request: () => callFetchInvoices('pageSize=100'), label: (item: any) => `Hóa đơn #${String(item._id || '').slice(-6)}`, detail: (item: any) => `${Number(item.final_amount ?? item.amount ?? 0).toLocaleString('vi-VN')} ₫ · ${item.status || 'N/A'}` },
    payments: { title: 'Thanh toán', request: () => callFetchPayments('pageSize=100'), label: (item: any) => item.payment_method || 'Thanh toán', detail: (item: any) => `${item.invoice_id?._id ? `HĐ #${String(item.invoice_id._id).slice(-6)}` : 'Chưa có hóa đơn'} · ${item.payment_date || 'Chưa cập nhật'}` },
    leads: { title: 'Khách hàng', request: () => callFetchLeads('pageSize=100'), label: (item: any) => item.full_name || item.name || 'Khách hàng', detail: (item: any) => `${item.phone || item.email || 'Chưa có liên hệ'} · ${item.status || 'NEW'}` },
} as const;

type ModuleKey = keyof typeof definitions;

export default function AdminModuleScreen() {
    const router = useRouter();
    const { module } = useLocalSearchParams<{ module: string }>();
    const { user, isAuthenticated } = useAppSelector((state) => state.account);
    const key = (module in definitions ? module : 'users') as ModuleKey;
    const definition = definitions[key];
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            const response = await definition.request();
            setItems(response?.data?.result || []);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [definition]);

    useEffect(() => {
        if (!isAuthenticated) { router.replace('/(auth)/login'); return; }
        if (!isBackofficeRole(user.role?.name)) { router.replace(getDefaultRouteForRole(user.role?.name) as any); return; }
        load();
    }, [isAuthenticated, load, router, user.role?.name]);

    const subtitle = useMemo(() => `${items.length} bản ghi hiển thị`, [items.length]);
    if (!isAuthenticated || !isBackofficeRole(user.role?.name)) return null;
    if (loading && !refreshing) return <FptLoading message={`Đang tải ${definition.title.toLowerCase()}...`} />;

    return (
        <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
            <FptHeader title={definition.title} subtitle={subtitle} showBack onBack={() => router.replace('/admin')} />
            <FlatList
                data={items}
                keyExtractor={(item, index) => item._id || String(index)}
                contentContainerStyle={{ padding: 16, paddingBottom: 32, flexGrow: 1 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#F26522']} />}
                ListEmptyComponent={<FptEmptyState title="Chưa có dữ liệu" description={`Chưa tìm thấy bản ghi ${definition.title.toLowerCase()}.`} icon="file-tray-outline" />}
                renderItem={({ item }) => (
                    <View className="mb-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                        <View className="flex-row items-start justify-between">
                            <View className="mr-3 h-10 w-10 items-center justify-center rounded-2xl bg-orange-50">
                                <Ionicons name="document-text-outline" size={19} color="#F26522" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>{definition.label(item)}</Text>
                                <Text className="mt-1 text-xs leading-5 text-slate-500" numberOfLines={2}>{definition.detail(item)}</Text>
                            </View>
                        </View>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}
