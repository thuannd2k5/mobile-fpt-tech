import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    FlatList,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { callFetchClassroomById, callFetchMyStudents } from '@/api';
import { IClassroom, IPortalEnrollment } from '@/types/backend';
import { FptHeader, FptLoading, FptBadge, FptCard } from '@/components/common';

export default function ClassDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    const [loading, setLoading] = useState(true);
    const [classroom, setClassroom] = useState<IClassroom | null>(null);
    const [students, setStudents] = useState<IPortalEnrollment[]>([]);

    const loadData = useCallback(async () => {
        if (!id) return;
        try {
            const [classRes, studentsRes] = await Promise.allSettled([
                callFetchClassroomById(id),
                callFetchMyStudents(id),
            ]);

            if (classRes.status === 'fulfilled' && classRes.value?.data) {
                setClassroom(classRes.value.data);
            }
            if (studentsRes.status === 'fulfilled' && studentsRes.value?.data?.result) {
                setStudents(studentsRes.value.data.result);
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

                {/* Classmates Section */}
                <View className="mt-2">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-base font-bold text-gray-900">
                            Danh sách học viên trong lớp
                        </Text>
                        <Text className="text-xs text-gray-500 font-semibold">
                            {students.length} thành viên
                        </Text>
                    </View>

                    {students.length === 0 ? (
                        <View className="rounded-2xl bg-white p-6 border border-gray-100 items-center justify-center">
                            <Ionicons name="people-outline" size={32} color="#A0AEC0" />
                            <Text className="mt-2 text-xs text-gray-500">
                                Chưa có danh sách học viên hoặc đang được bảo mật.
                            </Text>
                        </View>
                    ) : (
                        students.map((item, index) => (
                            <View
                                key={item._id || index}
                                className="mb-2 flex-row items-center justify-between rounded-xl bg-white p-3.5 border border-gray-100 shadow-sm"
                            >
                                <View className="flex-row items-center">
                                    <View className="h-9 w-9 items-center justify-center rounded-full bg-orange-100 mr-3">
                                        <Text className="text-xs font-bold text-fpt-orange">
                                            {(item.student_id?.name || 'HV')[0].toUpperCase()}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text className="text-sm font-bold text-gray-900">
                                            {item.student_id?.name || 'Học viên'}
                                        </Text>
                                        <Text className="text-xs text-gray-500">
                                            {item.student_id?.email || 'N/A'}
                                        </Text>
                                    </View>
                                </View>
                                <FptBadge status={item.status || 'STUDYING'} size="sm" />
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
