import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '@/redux/hooks';
import { callFetchCourse, callFetchMyEnrollments, callFetchMyInvoices } from '@/api';
import { ICourse, IPortalEnrollment, IPortalInvoice } from '@/types/backend';
import { FptCard, FptBadge, FptLoading } from '@/components/common';

import { isInvoicePayable } from '@/utils/invoices';
import FptErrorBanner from '@/components/common/FptErrorBanner';

export default function StudentDashboardScreen() {
    const router = useRouter();
    const { user } = useAppSelector((state) => state.account);

    const [loadError, setLoadError] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [courses, setCourses] = useState<ICourse[]>([]);
    const [myEnrollments, setMyEnrollments] = useState<IPortalEnrollment[]>([]);
    const [myInvoices, setMyInvoices] = useState<IPortalInvoice[]>([]);

    const loadData = useCallback(async () => {
        setLoadError('');
        try {
            const [coursesRes, enrollmentsRes, invoicesRes] = await Promise.allSettled([
                callFetchCourse('pageSize=6'),
                callFetchMyEnrollments(),
                callFetchMyInvoices(),
            ]);

            if ([coursesRes, enrollmentsRes, invoicesRes].some((result) => result.status === 'rejected')) {
                setLoadError('Chưa tải được đầy đủ dữ liệu. Vui lòng kiểm tra kết nối và thử lại.');
            }
            if (coursesRes.status === 'fulfilled' && coursesRes.value?.data?.result) {
                setCourses(coursesRes.value.data.result);
            }
            if (enrollmentsRes.status === 'fulfilled' && Array.isArray(enrollmentsRes.value?.data)) {
                setMyEnrollments(enrollmentsRes.value.data);
            }
            if (invoicesRes.status === 'fulfilled' && Array.isArray(invoicesRes.value?.data)) {
                setMyInvoices(invoicesRes.value.data);
            }
        } catch {
            setLoadError('Không thể tải tổng quan. Vui lòng thử lại.');
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

    const activeEnrollments = myEnrollments.filter(
        (e) => (e.status || '').toUpperCase() === 'STUDYING'
    );
    const pendingInvoices = myInvoices.filter(
        (i) => isInvoicePayable(i.status)
    );

    const formatPrice = (val?: string | number) => {
        if (!val) return 'Miễn phí';
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return isNaN(num) ? String(val) : `${num.toLocaleString('vi-VN')} ₫`;
    };

    if (loading && !refreshing) {
        return <FptLoading message="Đang tải dữ liệu trang chủ..." />;
    }

    return (
        <SafeAreaView className="flex-1 bg-fpt-grayBg" edges={['top']}>
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 32 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#F26522']}
                        tintColor="#F26522"
                    />
                }
            >
                <View className="px-5 pt-5">
                    <View className="mb-5 flex-row items-center justify-between">
                        <View className="flex-1 pr-3">
                            <Text className="text-xs font-bold tracking-widest text-fpt-orange">FPT EDUCATION</Text>
                            <Text className="mt-1 text-xl font-bold text-slate-900" numberOfLines={2}>Xin chào, {user.name || 'bạn'}!</Text>
                        </View>
                        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Mở hồ sơ cá nhân" onPress={() => router.push('/(student)/(tabs)/profile')}
                            className="h-12 w-12 items-center justify-center rounded-2xl border border-orange-100 bg-orange-50">
                            <Text className="text-lg font-bold text-fpt-orange">{(user.name || 'U').charAt(0).toUpperCase()}</Text>
                        </TouchableOpacity>
                    </View>
                    <View className="rounded-3xl bg-fpt-blue p-5">
                        <Text className="text-xs font-semibold tracking-wider text-blue-100">HÀNH TRÌNH HỌC TẬP</Text>
                        <Text className="mt-2 text-2xl font-bold text-white">Mỗi ngày, tiến xa hơn.</Text>
                        <Text className="mt-2 text-sm leading-6 text-blue-100">Theo dõi lịch học và tiếp tục chinh phục mục tiêu của bạn.</Text>
                        <TouchableOpacity accessibilityRole="button" onPress={() => router.push('/(student)/(tabs)/schedule')}
                            className="mt-4 min-h-[44px] flex-row items-center self-start rounded-xl bg-white px-4 py-3">
                            <Text className="mr-3 text-sm font-bold text-fpt-blue">Xem lịch học</Text>
                            <Ionicons name="arrow-forward" size={17} color="#0050B3" />
                        </TouchableOpacity>
                    </View>
                </View>
                {loadError ? <FptErrorBanner message={loadError} onRetry={onRefresh} /> : null}

                {/* Quick Stats Grid */}
                <View className="px-5 pt-5 pb-2">
                    <View className="flex-row justify-between">
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => router.push('/(student)/(tabs)/schedule')}
                            className="w-[48%] rounded-2xl bg-white p-4 border border-gray-100 shadow-sm"
                        >
                            <View className="h-10 w-10 items-center justify-center rounded-xl bg-orange-50 mb-3">
                                <Ionicons name="book" size={22} color="#F26522" />
                            </View>
                            <Text className="text-2xl font-bold text-gray-900">
                                {activeEnrollments.length}
                            </Text>
                            <Text className="text-xs text-gray-500 mt-0.5">Khóa học đang học</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => router.push('/(student)/(tabs)/invoices')}
                            className="w-[48%] rounded-2xl bg-white p-4 border border-gray-100 shadow-sm"
                        >
                            <View className="h-10 w-10 items-center justify-center rounded-xl bg-amber-50 mb-3">
                                <Ionicons name="receipt" size={22} color="#D97706" />
                            </View>
                            <Text className="text-2xl font-bold text-gray-900">
                                {pendingInvoices.length}
                            </Text>
                            <Text className="text-xs text-gray-500 mt-0.5">Hóa đơn cần đóng</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Featured Courses Section */}
                <View className="mt-4">
                    <View className="flex-row items-center justify-between px-5 mb-3">
                        <Text className="text-lg font-bold text-gray-900">Khám phá khóa học</Text>
                        <TouchableOpacity onPress={() => router.push('/(student)/(tabs)/courses')}>
                            <Text className="text-xs font-bold text-fpt-orange">Xem tất cả</Text>
                        </TouchableOpacity>
                    </View>

                    {!courses.length && !loadError ? <Text className="px-5 py-6 text-sm text-slate-500">Chưa có khóa học để hiển thị.</Text> : null}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 20 }}
                    >
                        {courses.map((course) => (
                            <TouchableOpacity
                                key={course._id}
                                activeOpacity={0.85}
                                onPress={() => router.push(`/(student)/course/${course._id}` as any)}
                                className="mr-4 w-64 rounded-2xl bg-white border border-gray-100 p-4 shadow-sm"
                            >
                                <View className="h-28 w-full rounded-xl bg-orange-50 items-center justify-center mb-3">
                                    <Ionicons name="code-slash" size={40} color="#F26522" />
                                </View>
                                <Text
                                    className="text-base font-bold text-gray-900 leading-snug"
                                    numberOfLines={2}
                                >
                                    {course.name}
                                </Text>
                                <View className="mt-2 flex-row items-center justify-between">
                                    <Text className="text-xs text-gray-500">
                                        {course.duration || '3 tháng'}
                                    </Text>
                                    <Text className="text-sm font-black text-fpt-orange">
                                        {formatPrice(course.price)}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* My Active Classes List */}
                <View className="mt-6 px-5">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-lg font-bold text-gray-900">Lớp học gần đây</Text>
                        <TouchableOpacity onPress={() => router.push('/(student)/(tabs)/schedule')}>
                            <Text className="text-xs font-bold text-fpt-orange">Chi tiết</Text>
                        </TouchableOpacity>
                    </View>

                    {activeEnrollments.length === 0 ? (
                        <View className="rounded-2xl bg-white p-6 border border-gray-100 items-center justify-center">
                            <Ionicons name="calendar-outline" size={36} color="#CBD5E0" />
                            <Text className="mt-2 text-sm font-semibold text-gray-700">
                                Bạn chưa đăng ký lớp học nào
                            </Text>
                            <TouchableOpacity
                                onPress={() => router.push('/(student)/(tabs)/courses')}
                                className="mt-3 rounded-xl bg-orange-500 px-4 py-2"
                            >
                                <Text className="text-xs font-bold text-white">Khám phá khóa học</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        activeEnrollments.slice(0, 3).map((enrollment) => (
                            <FptCard
                                key={enrollment._id}
                                className="mb-3"
                                onPress={() => router.push('/(student)/(tabs)/schedule')}
                            >
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-base font-bold text-gray-900 flex-1">
                                        {enrollment.class_id?.class_name ||
                                            enrollment.class_id?.course_id?.name ||
                                            'Lớp học'}
                                    </Text>
                                    <FptBadge status="STUDYING" size="sm" />
                                </View>
                                <View className="mt-2 flex-row items-center text-gray-500">
                                    <Ionicons name="location-outline" size={14} color="#718096" />
                                    <Text className="ml-1 text-xs text-gray-600">
                                        Phòng {enrollment.class_id?.room || 'Online'}
                                    </Text>
                                    <Text className="mx-2 text-gray-300">•</Text>
                                    <Ionicons name="person-outline" size={14} color="#718096" />
                                    <Text className="ml-1 text-xs text-gray-600">
                                        GV: {enrollment.class_id?.teacher_id?.name || 'Đang cập nhật'}
                                    </Text>
                                </View>
                            </FptCard>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
