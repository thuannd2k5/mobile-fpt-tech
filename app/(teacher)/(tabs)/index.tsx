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
import 'dayjs/locale/vi';
import { callFetchMyTeachingClassrooms } from '@/api';
import { IClassroomWithDetails } from '@/types/backend';
import { FptCard, FptBadge, FptLoading, FptEmptyState } from '@/components/common';

dayjs.locale('vi');

export default function TeacherScheduleScreen() {
    const router = useRouter();

    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [classrooms, setClassrooms] = useState<IClassroomWithDetails[]>([]);

    const fetchTeachingClasses = useCallback(async () => {
        try {
            const res = await callFetchMyTeachingClassrooms();
            if (res && res.data && Array.isArray(res.data.result)) {
                setClassrooms(res.data.result);
            }
        } catch {
            // handle error
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchTeachingClasses();
    }, [fetchTeachingClasses]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTeachingClasses();
    };

    const weekDays = useMemo(() => {
        const startOfWeek = selectedDate.startOf('week').add(1, 'day'); // Monday
        return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));
    }, [selectedDate]);

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
            {/* Header */}
            <View className="bg-white px-5 pt-3 pb-3 border-b border-gray-100">
                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="text-2xl font-black text-gray-900">Lịch giảng dạy</Text>
                        <Text className="text-xs text-gray-500 mt-0.5">
                            Cổng thông tin Giảng viên FPT Education
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => setSelectedDate(dayjs())}
                        className="rounded-xl bg-blue-50 px-3 py-1.5 border border-blue-200"
                    >
                        <Text className="text-xs font-bold text-fpt-blue">Hôm nay</Text>
                    </TouchableOpacity>
                </View>

                {/* Week Selector */}
                <View className="mt-3 flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => setSelectedDate((d) => d.subtract(1, 'week'))}
                        className="p-1 rounded-lg bg-gray-100"
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
                                        ? 'bg-fpt-blue shadow-sm'
                                        : isToday
                                        ? 'bg-blue-50 border border-blue-200'
                                        : 'bg-white border border-gray-100'
                                }`}
                            >
                                <Text
                                    className={`text-[10px] font-bold uppercase ${
                                        isSelected
                                            ? 'text-white'
                                            : isToday
                                            ? 'text-fpt-blue'
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
                                            ? 'text-fpt-blue'
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
                <FptLoading message="Đang tải lịch dạy..." />
            ) : (
                <ScrollView
                    className="flex-1 px-5 pt-4"
                    contentContainerStyle={{ paddingBottom: 32 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#0050B3']}
                            tintColor="#0050B3"
                        />
                    }
                >
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-base font-bold text-gray-900">
                            Ca dạy {selectedDate.format('dddd, DD/MM/YYYY')}
                        </Text>
                        <Text className="text-xs text-gray-500">
                            {classrooms.length} lớp phụ trách
                        </Text>
                    </View>

                    {classrooms.length === 0 ? (
                        <FptEmptyState
                            title="Không có ca dạy"
                            description="Hôm nay bạn không có lịch lên lớp. Chúc bạn một ngày làm việc hiệu quả!"
                            icon="calendar-outline"
                        />
                    ) : (
                        classrooms.map((cls) => (
                            <FptCard
                                key={cls._id}
                                className="mb-4"
                                onPress={() =>
                                    cls._id &&
                                    router.push(`/(teacher)/class-detail/${cls._id}` as any)
                                }
                            >
                                <View className="flex-row items-center justify-between border-b border-gray-100 pb-3">
                                    <View className="flex-row items-center">
                                        <View className="h-8 w-8 items-center justify-center rounded-lg bg-blue-50 mr-2.5">
                                            <Ionicons name="time" size={16} color="#0050B3" />
                                        </View>
                                        <Text className="text-sm font-bold text-gray-900">
                                            {cls.start_time || '08:00'} - {cls.end_time || '10:00'}
                                        </Text>
                                    </View>
                                    <FptBadge status={cls.status || 'OPEN'} size="sm" />
                                </View>

                                <View className="pt-3">
                                    <Text className="text-base font-bold text-gray-900 leading-snug">
                                        {cls.class_name || cls.course_id?.name || 'Lớp học'}
                                    </Text>
                                    {cls.course_id?.name && (
                                        <Text className="text-xs text-gray-500 mt-0.5">
                                            Môn: {cls.course_id.name}
                                        </Text>
                                    )}

                                    <View className="mt-3 flex-row items-center justify-between pt-2 border-t border-gray-50">
                                        <View className="flex-row items-center">
                                            <Ionicons name="location-outline" size={14} color="#718096" />
                                            <Text className="ml-1 text-xs text-gray-600 font-medium">
                                                Phòng {cls.room || 'Online'}
                                            </Text>
                                        </View>

                                        <View className="flex-row items-center">
                                            <Ionicons name="people-outline" size={14} color="#718096" />
                                            <Text className="ml-1 text-xs text-gray-600 font-medium">
                                                Tối đa {cls.max_student || '30'} SV
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </FptCard>
                        ))
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}
