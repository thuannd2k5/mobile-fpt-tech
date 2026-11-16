import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '@/redux/hooks';
import { callFetchCourse, callFetchMyEnrollments, callFetchMyInvoices } from '@/api';
import { ICourse, IPortalEnrollment, IPortalInvoice } from '@/types/backend';
import { FptCard, FptBadge, FptLoading } from '@/components/common';

export default function StudentDashboardScreen() {
    const router = useRouter();
    const { user } = useAppSelector((state) => state.account);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [courses, setCourses] = useState<ICourse[]>([]);
    const [myEnrollments, setMyEnrollments] = useState<IPortalEnrollment[]>([]);
    const [myInvoices, setMyInvoices] = useState<IPortalInvoice[]>([]);

    const loadData = useCallback(async () => {
        try {
            const [coursesRes, enrollmentsRes, invoicesRes] = await Promise.allSettled([
                callFetchCourse('pageSize=6'),
                callFetchMyEnrollments(),
                callFetchMyInvoices(),
            ]);

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
            // handle error silently
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
        (i) => (i.status || '').toUpperCase() === 'PENDING' || (i.status || '').toUpperCase() === 'WAITING_PAYMENT'
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
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
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
                {/* Header Profile Greeting */}
                <View className="bg-white px-5 py-4 border-b border-gray-100 flex-row items-center justify-between">
                    <View className="flex-1">
                        <Text className="text-xs font-semibold uppercase tracking-wider text-fpt-orange">
                            FPT TECH EDUCATION
                        </Text>
                        <Text className="text-xl font-black text-gray-900 mt-0.5" numberOfLines={1}>
                            Xin chào, {user.name || 'Học viên'}!
                        </Text>
                    </View>
                    <View className="flex-row items-center">
                        <FptBadge status="STUDYING" label="Học viên" size="sm" />
                    </View>
                </View>

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
                            <Text className="text-2xl font-black text-gray-900">
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
                            <Text className="text-2xl font-black text-gray-900">
                                {pendingInvoices.length}
                            </Text>
                            <Text className="text-xs text-gray-500 mt-0.5">Hóa đơn cần đóng</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Banner Promotion */}
                <View className="px-5 py-3">
                    <View className="rounded-2xl bg-gradient-to-r bg-orange-500 p-5 shadow-sm">
                        <Text className="text-xs font-bold uppercase tracking-wider text-orange-100">
                            Cơ hội học bổng
                        </Text>
                        <Text className="text-lg font-black text-white mt-1 leading-snug">
                            Trở thành Kỹ sư phần mềm chuyên nghiệp cùng FPT
                        </Text>
                        <Text className="text-xs text-orange-100 mt-1">
                            Lộ trình chuẩn doanh nghiệp - Hỗ trợ thực tập tại FPT Software
                        </Text>
                    </View>
                </View>

                {/* Featured Courses Section */}
                <View className="mt-4">
                    <View className="flex-row items-center justify-between px-5 mb-3">
                        <Text className="text-lg font-bold text-gray-900">Khóa học nổi bật</Text>
                        <TouchableOpacity onPress={() => router.push('/(student)/(tabs)/courses')}>
                            <Text className="text-xs font-bold text-fpt-orange">Xem tất cả</Text>
                        </TouchableOpacity>
                    </View>

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
