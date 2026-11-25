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
import { callFetchCourse } from '@/api';
import { ICourse } from '@/types/backend';
import { FptCard, FptLoading, FptEmptyState } from '@/components/common';

import FptErrorBanner from '@/components/common/FptErrorBanner';

export default function StudentCoursesScreen() {
    const router = useRouter();

    const [loadError, setLoadError] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [courses, setCourses] = useState<ICourse[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchCourses = useCallback(async () => {
        setLoadError('');
        try {
            const res = await callFetchCourse('pageSize=50');
            if (res && res.data && Array.isArray(res.data.result)) {
                setCourses(res.data.result);
            }
        } catch {
            setLoadError('Không thể tải dữ liệu. Vui lòng kiểm tra kết nối và thử lại.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchCourses();
    };

    const formatPrice = (val?: string | number) => {
        if (!val) return 'Miễn phí';
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return isNaN(num) ? String(val) : `${num.toLocaleString('vi-VN')} ₫`;
    };

    const filteredCourses = courses.filter((c) =>
        (c.name || '').toLowerCase().includes(searchQuery.toLowerCase().trim())
    );

    return (
        <SafeAreaView className="flex-1 bg-fpt-grayBg" edges={['top']}>
            {loadError ? <FptErrorBanner message={loadError} onRetry={onRefresh} /> : null}
            {/* Header & Search */}
            <View className="bg-white px-5 pt-3 pb-4 border-b border-gray-100">
                <Text className="text-2xl font-bold text-gray-900">Khám phá Khóa học</Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                    Chương trình đào tạo công nghệ chuẩn quốc tế FPT
                </Text>

                {/* Search Box */}
                <View className="mt-3 flex-row items-center rounded-xl bg-gray-100 px-3.5 py-2.5">
                    <Ionicons name="search" size={18} color="#718096" />
                    <TextInput
                        className="ml-2.5 flex-1 text-sm text-gray-900"
                        placeholder="Tìm kiếm khóa học (React, Java, Python...)"
                        placeholderTextColor="#A0AEC0"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery ? (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color="#A0AEC0" />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>

            {loading && !refreshing ? (
                <FptLoading message="Đang tải danh sách khóa học..." />
            ) : (
                <FlatList
                    data={filteredCourses}
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
                    ListEmptyComponent={loadError ? undefined :
                        <FptEmptyState
                            title="Không tìm thấy khóa học"
                            description={
                                searchQuery
                                    ? `Không có kết quả nào khớp với "${searchQuery}".`
                                    : 'Hiện chưa có khóa học nào được đăng tải.'
                            }
                            icon="search-outline"
                        />
                    }
                    renderItem={({ item }) => (
                        <FptCard
                            className="mb-4 overflow-hidden p-0"
                            onPress={() => router.push(`/(student)/course/${item._id}` as any)}
                        >
                            <View className="h-32 bg-orange-50 items-center justify-center border-b border-orange-100">
                                <Ionicons name="code-slash" size={48} color="#F26522" />
                                {item.level ? (
                                    <View className="absolute top-3 right-3 rounded-md bg-white/90 px-2 py-0.5">
                                        <Text className="text-[10px] font-bold text-gray-700">
                                            {item.level}
                                        </Text>
                                    </View>
                                ) : null}
                            </View>

                            <View className="p-4">
                                <Text className="text-lg font-bold text-gray-900" numberOfLines={2}>
                                    {item.name}
                                </Text>
                                {item.description ? (
                                    <Text className="mt-1 text-xs text-gray-500 leading-relaxed" numberOfLines={2}>
                                        {item.description}
                                    </Text>
                                ) : null}

                                <View className="mt-3.5 flex-row items-center justify-between border-t border-gray-100 pt-3">
                                    <View className="flex-row items-center">
                                        <Ionicons name="time-outline" size={14} color="#718096" />
                                        <Text className="ml-1 text-xs text-gray-600 font-medium">
                                            {item.duration || '3 tháng'}
                                        </Text>
                                    </View>
                                    <Text className="text-base font-black text-fpt-orange">
                                        {formatPrice(item.price)}
                                    </Text>
                                </View>
                            </View>
                        </FptCard>
                    )}
                />
            )}
        </SafeAreaView>
    );
}
