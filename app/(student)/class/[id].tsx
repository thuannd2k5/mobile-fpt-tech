import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    FlatList,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { callFetchClassroomById } from '@/api';
import { IClassroom } from '@/types/backend';
import { FptHeader, FptLoading, FptBadge, FptCard } from '@/components/common';

export default function ClassDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    const [loading, setLoading] = useState(true);
    const [classroom, setClassroom] = useState<IClassroom | null>(null);

    const loadData = useCallback(async () => {
        if (!id) return;
        try {
            const classRes = await callFetchClassroomById(id);

            if (classRes?.data) {
                setClassroom(classRes.data);
            }
        } catch {
            // handle error
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (loading) {
        return (
            <View className="flex-1 bg-white">
                <FptHeader title="Chi tiết lớp học" showBack />
                <FptLoading message="Đang tải thông tin lớp học..." />
            </View>
        );
    }

    if (!classroom) {
        return (
            <View className="flex-1 bg-white">
                <FptHeader title="Chi tiết lớp học" showBack />
                <View className="flex-1 items-center justify-center p-6">
                    <Text className="text-gray-500">Không tìm thấy thông tin lớp học.</Text>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <FptHeader title={classroom.class_name || 'Chi tiết lớp học'} showBack />

            <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 32 }}>
                {/* Classroom Overview Card */}
                <FptCard className="mb-4">
                    <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
                        <Text className="text-xl font-bold text-gray-900 flex-1">
                            {classroom.class_name || 'Lớp học'}
                        </Text>
                        <FptBadge status={classroom.status || 'OPEN'} size="sm" />
                    </View>

                    <View className="mt-3 space-y-2.5">
                        <View className="flex-row items-center justify-between">
                            <Text className="text-xs text-gray-500">Phòng học</Text>
                            <Text className="text-sm font-semibold text-gray-800">
                                {classroom.room || 'Chưa xếp phòng'}
                            </Text>
                        </View>

                        <View className="flex-row items-center justify-between">
                            <Text className="text-xs text-gray-500">Khung giờ học</Text>
                            <Text className="text-sm font-semibold text-gray-800">
                                {classroom.start_time || '08:00'} - {classroom.end_time || '10:00'}
                            </Text>
                        </View>

                        <View className="flex-row items-center justify-between">
                            <Text className="text-xs text-gray-500">Thời gian khóa học</Text>
                            <Text className="text-sm font-semibold text-gray-800">
                                {classroom.start_date || 'N/A'} ~ {classroom.end_date || 'N/A'}
                            </Text>
                        </View>

                        <View className="flex-row items-center justify-between">
                            <Text className="text-xs text-gray-500">Sĩ số tối đa</Text>
                            <Text className="text-sm font-semibold text-gray-800">
                                {classroom.max_student || '30'} sinh viên
                            </Text>
                        </View>
                    </View>
                </FptCard>

                {/* Privacy-safe class information */}
                <View className="mt-2">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-base font-bold text-gray-900">
                            Thông tin lớp học
                        </Text>
                    </View>
                    <View className="rounded-2xl bg-white p-5 border border-gray-100 items-center justify-center">
                        <Ionicons name="shield-checkmark-outline" size={30} color="#F26522" />
                        <Text className="mt-2 text-sm font-semibold text-gray-800">
                            Danh sách học viên được bảo mật
                        </Text>
                        <Text className="mt-1 text-center text-xs leading-5 text-gray-500">
                            Bạn vẫn có thể xem lịch học, phòng học và các thông tin cần thiết của lớp.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
