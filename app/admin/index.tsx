import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppSelector } from '@/redux/hooks';
import { isBackofficeRole, getDefaultRouteForRole } from '@/types/portal';
import {
    callFetchClassroom,
    callFetchCourse,
    callFetchEnrollments,
    callFetchInvoices,
    callFetchLeads,
    callFetchPayments,
    callFetchPermissions,
    callFetchRoles,
    callFetchUsers,
} from '@/api';
import { FptEmptyState, FptLoading } from '@/components/common';

type AdminModule = 'users' | 'roles' | 'permissions' | 'courses' | 'classrooms' | 'enrollments' | 'invoices' | 'payments' | 'leads';

const moduleResource: Record<AdminModule, string> = {
    users: 'users', roles: 'roles', permissions: 'permissions', courses: 'courses',
    classrooms: 'classrooms', enrollments: 'enrollments', invoices: 'invoices',
    payments: 'payments', leads: 'leads',
};

const modules: { key: AdminModule; label: string; icon: keyof typeof Ionicons.glyphMap; color: string; background: string }[] = [
    { key: 'users', label: 'Người dùng', icon: 'people-outline', color: '#2563EB', background: '#EFF6FF' },
    { key: 'roles', label: 'Vai trò', icon: 'shield-checkmark-outline', color: '#7C3AED', background: '#F5F3FF' },
    { key: 'permissions', label: 'Phân quyền', icon: 'key-outline', color: '#9333EA', background: '#FAF5FF' },
    { key: 'courses', label: 'Khóa học', icon: 'book-outline', color: '#EA580C', background: '#FFF7ED' },
    { key: 'classrooms', label: 'Lớp học', icon: 'school-outline', color: '#0891B2', background: '#ECFEFF' },
    { key: 'enrollments', label: 'Ghi danh', icon: 'clipboard-outline', color: '#059669', background: '#ECFDF5' },
    { key: 'invoices', label: 'Hóa đơn', icon: 'receipt-outline', color: '#D97706', background: '#FFFBEB' },
    { key: 'payments', label: 'Thanh toán', icon: 'card-outline', color: '#16A34A', background: '#F0FDF4' },
    { key: 'leads', label: 'Khách hàng', icon: 'briefcase-outline', color: '#0284C7', background: '#F0F9FF' },
];

const requestByModule: Record<AdminModule, () => Promise<any>> = {
    users: () => callFetchUsers('pageSize=1'),
    roles: () => callFetchRoles('pageSize=1'),
    permissions: () => callFetchPermissions('pageSize=1'),
    courses: () => callFetchCourse('pageSize=1'),
    classrooms: () => callFetchClassroom('pageSize=1'),
    enrollments: () => callFetchEnrollments('pageSize=1'),
    invoices: () => callFetchInvoices('pageSize=1'),
    payments: () => callFetchPayments('pageSize=1'),
    leads: () => callFetchLeads('pageSize=1'),
};

export default function AdminDashboardScreen() {
    const router = useRouter();
    const { user, isAuthenticated } = useAppSelector((state) => state.account);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [counts, setCounts] = useState<Partial<Record<AdminModule, number>>>({});
    const visibleModules = useMemo(
        () => modules.filter((module) =>
            user.permissions?.some((permission) =>
                permission.method === 'GET' && permission.path === `/api/v1/${moduleResource[module.key]}`
            )
        ),
        [user.permissions]
    );

    const loadDashboard = useCallback(async () => {
        const responses = await Promise.allSettled(visibleModules.map((module) => requestByModule[module.key]()));
        const nextCounts: Partial<Record<AdminModule, number>> = {};
        responses.forEach((response, index) => {
            if (response.status === 'fulfilled') {
                nextCounts[visibleModules[index].key] = response.value?.data?.meta?.total ?? 0;
            }
        });
        setCounts(nextCounts);
        setLoading(false);
        setRefreshing(false);
    }, [visibleModules]);

    useEffect(() => {
        if (!isAuthenticated) {
            router.replace('/(auth)/login');
            return;
        }
        if (!isBackofficeRole(user.role?.name)) {
            router.replace(getDefaultRouteForRole(user.role?.name) as any);
            return;
        }
        loadDashboard();
    }, [isAuthenticated, loadDashboard, router, user.role?.name]);

    if (!isAuthenticated || !isBackofficeRole(user.role?.name)) return null;
    if (loading && !refreshing) return <FptLoading message="Đang tải hệ thống quản trị..." />;

    return (
        <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
            <ScrollView
                contentContainerStyle={{ padding: 20, paddingBottom: 36 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadDashboard(); }} colors={['#F26522']} />}
            >
                <View className="overflow-hidden rounded-[28px] bg-slate-900 p-6">
                    <View className="absolute -right-7 -top-7 h-28 w-28 rounded-full bg-orange-500/30" />
                    <Text className="text-xs font-bold tracking-[2px] text-orange-300">FPT EDUCATION / ADMIN</Text>
                    <Text className="mt-2 text-2xl font-black text-white">Xin chào, {user.name || 'Quản trị viên'}</Text>
                    <Text className="mt-2 text-sm leading-5 text-slate-300">Quản lý dữ liệu đào tạo, người dùng và vận hành hệ thống.</Text>
                </View>

                <View className="mt-6 flex-row items-center justify-between">
                    <View>
                        <Text className="text-lg font-black text-slate-900">Trung tâm quản trị</Text>
                        <Text className="mt-0.5 text-xs text-slate-500">Chọn một danh mục để xem dữ liệu</Text>
                    </View>
                    <TouchableOpacity onPress={() => Alert.alert('Quyền truy cập', `${user.permissions?.length || 0} quyền đã được cấp cho tài khoản.`)} className="rounded-xl bg-white p-2.5 border border-slate-100">
                        <Ionicons name="information-circle-outline" size={20} color="#475569" />
                    </TouchableOpacity>
                </View>

                <View className="mt-4 flex-row flex-wrap justify-between">
                    {visibleModules.map((module) => (
                        <TouchableOpacity
                            key={module.key}
                            activeOpacity={0.82}
                            onPress={() => router.push(`/admin/${module.key}` as any)}
                            className="mb-3 w-[48.5%] rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"
                        >
                            <View className="h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: module.background }}>
                                <Ionicons name={module.icon} size={21} color={module.color} />
                            </View>
                            <Text className="mt-4 text-2xl font-black text-slate-900">{counts[module.key] ?? '—'}</Text>
                            <Text className="mt-1 text-sm font-semibold text-slate-700">{module.label}</Text>
                            <View className="mt-3 flex-row items-center">
                                <Text className="text-xs font-bold" style={{ color: module.color }}>Mở quản lý</Text>
                                <Ionicons name="arrow-forward" size={13} color={module.color} style={{ marginLeft: 4 }} />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
                {visibleModules.length === 0 ? (
                    <FptEmptyState
                        title="Chưa được cấp quyền quản trị"
                        description="Tài khoản này là quản trị viên nhưng chưa có quyền xem module nào. Hãy cấp quyền trong phần Phân quyền của hệ thống web."
                        icon="lock-closed-outline"
                    />
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
}
