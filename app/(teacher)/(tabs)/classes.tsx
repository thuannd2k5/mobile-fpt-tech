import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '@/redux/hooks';
import { callFetchMyTeachingClassrooms } from '@/api';
import { IClassroomWithDetails } from '@/types/backend';
import { FptCard, FptBadge, FptLoading, FptEmptyState } from '@/components/common';

import FptErrorBanner from '@/components/common/FptErrorBanner';

export default function TeacherClassesScreen() {
    const router = useRouter();
    const teacherId = useAppSelector((state) => state.account.user._id);

    const [loadError, setLoadError] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [classes, setClasses] = useState<IClassroomWithDetails[]>([]);
    const [search, setSearch] = useState('');

    const fetchClasses = useCallback(async () => {
        setLoadError('');
        try {
            if (!teacherId) throw new Error('Thiếu thông tin giảng viên');
            const res = await callFetchMyTeachingClassrooms(teacherId);
            if (res && res.data && Array.isArray(res.data.result)) {
                setClasses(res.data.result);
            }
        } catch {
            setLoadError('Không thể tải dữ liệu. Vui lòng kiểm tra kết nối và thử lại.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [teacherId]);

    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchClasses();
    };

    const filtered = classes.filter((item) => {
        const query = search.toLowerCase();
        return (
            (item.class_name || '').toLowerCase().includes(query) ||
            (item.course_id?.name || '').toLowerCase().includes(query) ||
            (item.room || '').toLowerCase().includes(query)
        );
    });

    return (
        <SafeAreaView className="flex-1 bg-fpt-grayBg" edges={['top']}>
            {loadError ? <FptErrorBanner message={loadError} onRetry={onRefresh} /> : null}
            <View className="bg-white px-5 pt-5 pb-4 border-b border-slate-100">
                <Text className="text-2xl font-bold text-gray-900">Danh sách Lớp học</Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                    Quản lý các lớp phụ trách giảng dạy
                </Text>

                <View className="mt-3 flex-row items-center rounded-xl bg-gray-100 px-3.5 py-2.5">
                    <Ionicons name="search" size={18} color="#718096" />
                    <TextInput
                        className="ml-2.5 flex-1 text-sm text-gray-900"
                        placeholder="Tìm theo tên lớp, môn học, phòng..."
                        placeholderTextColor="#A0AEC0"
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search ? (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={18} color="#A0AEC0" />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>

            {loading && !refreshing ? (
                <FptLoading message="Đang tải danh sách lớp học..." />
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item._id || Math.random().toString()}
                    contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#0050B3']}
                            tintColor="#0050B3"
                        />
                    }
                    ListEmptyComponent={loadError ? undefined :
                        <FptEmptyState
                            title="Không tìm thấy lớp học"
                            description={
                                search
                                    ? `Không có kết quả nào khớp với "${search}".`
                                    : 'Hiện chưa có lớp học nào được phân công cho bạn.'
                            }
                            icon="school-outline"
                        />
                    }
                    renderItem={({ item }) => (
                        <FptCard
                            className="mb-4"
                            onPress={() =>
                                item._id &&
                                router.push(`/(teacher)/class-detail/${item._id}` as any)
                            }
                        >
                            <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
                                <Text className="text-base font-bold text-gray-900 flex-1">
                                    {item.class_name || 'Lớp học'}
                                </Text>
                                <FptBadge status={item.status || 'OPEN'} size="sm" />
                            </View>

                            <View className="pt-3">
                                {item.course_id?.name && (
                                    <Text className="text-xs text-fpt-blue font-semibold mb-2">
                                        Môn: {item.course_id.name}
                                    </Text>
                                )}

                                <View className="space-y-1.5">
                                    <View className="flex-row items-center">
                                        <Ionicons name="location-outline" size={14} color="#718096" />
                                        <Text className="ml-1.5 text-xs text-gray-600">
                                            Phòng học: {item.room || 'Chưa xếp'}
                                        </Text>
                                    </View>

                                    <View className="flex-row items-center">
                                        <Ionicons name="time-outline" size={14} color="#718096" />
                                        <Text className="ml-1.5 text-xs text-gray-600">
                                            Ca học: {item.start_time || '08:00'} - {item.end_time || '10:00'}
                                        </Text>
                                    </View>

                                    <View className="flex-row items-center">
                                        <Ionicons name="calendar-outline" size={14} color="#718096" />
                                        <Text className="ml-1.5 text-xs text-gray-600">
                                            Thời gian: {item.start_date || 'N/A'} ~ {item.end_date || 'N/A'}
                                        </Text>
                                    </View>
                                </View>

                                <View className="mt-3 pt-3 border-t border-gray-100 flex-row items-center justify-between">
                                    <Text className="text-xs text-gray-500">
                                        Sĩ số: {item.max_student || 30} học viên
                                    </Text>
                                    <View className="flex-row items-center">
                                        <Text className="text-xs font-bold text-fpt-blue mr-1">
                                            Xem danh sách học viên
                                        </Text>
                                        <Ionicons name="chevron-forward" size={14} color="#0050B3" />
                                    </View>
                                </View>
                            </View>
                        </FptCard>
                    )}
                />
            )}
        </SafeAreaView>
    );
}
