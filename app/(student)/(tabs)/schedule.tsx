import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import FptErrorBanner from '@/components/common/FptErrorBanner';
import 'dayjs/locale/vi';
import { callFetchMyEnrollments } from '@/api';
import { IPortalEnrollment } from '@/types/backend';
import { FptCard, FptBadge, FptLoading, FptEmptyState } from '@/components/common';

dayjs.extend(isoWeek);
dayjs.locale('vi');


export default function StudentScheduleScreen() {
    const router = useRouter();

    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [loadError, setLoadError] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [enrollments, setEnrollments] = useState<IPortalEnrollment[]>([]);

    const fetchSchedule = useCallback(async () => {
        setLoadError('');
        try {
            const res = await callFetchMyEnrollments();
            if (res && res.data && Array.isArray(res.data)) {
                setEnrollments(res.data);
            }
        } catch {
            setLoadError('Không tải được khung giờ lớp. Vui lòng kiểm tra kết nối và thử lại.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchSchedule();
    }, [fetchSchedule]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchSchedule();
    };

    // Calculate current week days (Monday - Sunday)
    const weekDays = useMemo(() => {
        const startOfWeek = selectedDate.startOf('isoWeek'); // Monday
        return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));
    }, [selectedDate]);

    // Active enrollments studying
    const activeClasses = useMemo(() => {
        return enrollments.filter(
            (e) => (e.status || '').toUpperCase() === 'STUDYING' && e.class_id
        );
    }, [enrollments]);

    return (
        <SafeAreaView className="flex-1 bg-fpt-grayBg" edges={['top']}>
            {loadError ? <FptErrorBanner message={loadError} onRetry={onRefresh} /> : null}
            {/* Header */}
            <View className="bg-white px-5 pt-5 pb-4 border-b border-slate-100">
                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="text-2xl font-bold text-gray-900">Thời khóa biểu</Text>
                        <Text className="text-xs text-gray-500 mt-0.5">
                            Tháng {selectedDate.format('MM/YYYY')}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => setSelectedDate(dayjs())}
                        className="rounded-xl bg-orange-50 px-3 py-1.5 border border-orange-200"
                    >
                        <Text className="text-xs font-bold text-fpt-orange">Hôm nay</Text>
                    </TouchableOpacity>
                </View>

                {/* Week Selector Bar */}
                <View className="mt-3 flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => setSelectedDate((d) => d.subtract(1, 'week'))}
                        accessibilityRole="button" className="min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-slate-100"
                    >
                        <Ionicons name="chevron-back" size={18} color="#4A5568" />
                    </TouchableOpacity>

                    <Text className="text-xs font-semibold text-gray-700">
                        {weekDays[0].format('DD/MM')} - {weekDays[6].format('DD/MM/YYYY')}
                    </Text>

                    <TouchableOpacity
                        onPress={() => setSelectedDate((d) => d.add(1, 'week'))}
                        className="p-1 rounded-lg bg-gray-100"
                    >
                        <Ionicons name="chevron-forward" size={18} color="#4A5568" />
                    </TouchableOpacity>
                </View>

                {/* Day Strip */}
                <View className="mt-3 flex-row justify-between">
                    {weekDays.map((day) => {
                        const isSelected = day.isSame(selectedDate, 'day');
                        const isToday = day.isSame(dayjs(), 'day');

                        return (
                            <TouchableOpacity
                                key={day.toISOString()}
                                activeOpacity={0.8}
                                onPress={() => setSelectedDate(day)}
                                className={`w-11 items-center rounded-2xl py-2.5 ${
                                    isSelected
                                        ? 'bg-fpt-orange shadow-sm'
                                        : isToday
                                        ? 'bg-orange-50 border border-orange-200'
                                        : 'bg-white border border-gray-100'
                                }`}
                            >
                                <Text
                                    className={`text-[10px] font-bold uppercase ${
                                        isSelected
                                            ? 'text-white'
                                            : isToday
                                            ? 'text-fpt-orange'
                                            : 'text-gray-400'
                                    }`}
                                >
                                    {day.format('dd')}
                                </Text>
                                <Text
                                    className={`mt-1 text-base font-black ${
                                        isSelected
                                            ? 'text-white'
                                            : isToday
                                            ? 'text-fpt-orange'
                                            : 'text-gray-800'
                                    }`}
                                >
                                    {day.format('D')}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {loading && !refreshing ? (
                <FptLoading message="Đang tải lịch học của bạn..." />
            ) : (
                <ScrollView
                    className="flex-1 px-5 pt-4"
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
                    <View className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 p-4"><Text className="text-xs leading-5 text-blue-800">Danh sách dưới đây là khung giờ của lớp. Ngày học từng buổi chưa được cung cấp; vui lòng xác nhận với phòng đào tạo.</Text></View>
                    <View className="flex-row flex-wrap items-center justify-between mb-3">
                        <Text className="text-base font-bold text-gray-900">
                            Khung giờ các lớp đang học
                        </Text>
                        <Text className="text-xs text-gray-500">
                            {activeClasses.length} lớp đang theo học
                        </Text>
                    </View>

                    {activeClasses.length === 0 ? (
                        <FptEmptyState
                            title="Không có lịch học"
                            description="Bạn chưa có lớp đang học để hiển thị khung giờ."
                            icon="calendar-outline"
                        />
                    ) : (
                        activeClasses.map((item) => {
                            const cls = item.class_id;
                            if (!cls) return null;

                            return (
                                <FptCard
                                    key={item._id}
                                    className="mb-4"
                                    onPress={() =>
                                        cls._id && router.push(`/(student)/class/${cls._id}` as any)
                                    }
                                >
                                    <View className="flex-row items-center justify-between border-b border-gray-100 pb-3">
                                        <View className="flex-row items-center">
                                            <View className="h-8 w-8 items-center justify-center rounded-lg bg-orange-50 mr-2.5">
                                                <Ionicons name="time" size={16} color="#F26522" />
                                            </View>
                                            <Text className="text-sm font-bold text-gray-900">
                                                {cls.start_time || 'Chưa xếp giờ'} - {cls.end_time || 'Chưa xếp giờ'}
                                            </Text>
                                        </View>
                                        <FptBadge status="STUDYING" size="sm" />
                                    </View>

                                    <View className="pt-3">
                                        <Text className="text-base font-bold text-gray-900 leading-snug">
                                            {cls.class_name || cls.course_id?.name || 'Lớp học'}
                                        </Text>
                                        {cls.course_id?.name && (
                                            <Text className="text-xs text-gray-500 mt-0.5">
                                                Khóa học: {cls.course_id.name}
                                            </Text>
                                        )}

                                        <View className="mt-3 flex-row items-center justify-between pt-2 border-t border-gray-50">
                                            <View className="flex-row items-center">
                                                <Ionicons name="location-outline" size={14} color="#718096" />
                                                <Text className="ml-1 text-xs text-gray-600 font-medium">
                                                    Phòng: {cls.room || 'Online'}
                                                </Text>
                                            </View>

                                            <View className="flex-row items-center">
                                                <Ionicons name="person-outline" size={14} color="#718096" />
                                                <Text className="ml-1 text-xs text-gray-600 font-medium">
                                                    {cls.teacher_id?.name || 'Giảng viên FPT'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </FptCard>
                            );
                        })
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}
