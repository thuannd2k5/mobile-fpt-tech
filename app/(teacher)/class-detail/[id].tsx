import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Linking,
    Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { callFetchClassroomById, callFetchMyStudents } from '@/api';
import { IClassroom, IPortalEnrollment } from '@/types/backend';
import { FptHeader, FptLoading, FptBadge, FptCard } from '@/components/common';

import FptErrorBanner from '@/components/common/FptErrorBanner';

export default function TeacherClassDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    const [loadError, setLoadError] = useState('');
    const [loading, setLoading] = useState(true);
    const [classroom, setClassroom] = useState<IClassroom | null>(null);
    const [students, setStudents] = useState<IPortalEnrollment[]>([]);

    const loadData = useCallback(async () => {
        setLoadError('');
        if (!id) return;
        try {
            const [classRes, studentsRes] = await Promise.allSettled([
                callFetchClassroomById(id),
                callFetchMyStudents(),
            ]);

            if ([classRes, studentsRes].some((result) => result.status === 'rejected')) {
                setLoadError('Không thể tải đầy đủ thông tin. Vui lòng thử lại.');
            }
            if (classRes.status === 'fulfilled' && classRes.value?.data) {
                setClassroom(classRes.value.data);
            }
            if (studentsRes.status === 'fulfilled' && Array.isArray(studentsRes.value?.data)) {
                setStudents(
                    studentsRes.value.data.filter((item) => item.class_id?._id === id)
                );
            }
        } catch {
            setLoadError('Không thể tải đầy đủ thông tin. Vui lòng kiểm tra kết nối và thử lại.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCall = (phone?: string) => {
        if (!phone) {
            Alert.alert('Thông báo', 'Học viên chưa cập nhật số điện thoại.');
            return;
        }
        Linking.openURL(`tel:${phone}`);
    };

    const handleEmail = (email?: string) => {
        if (!email) {
            Alert.alert('Thông báo', 'Học viên chưa cập nhật email.');
            return;
        }
        Linking.openURL(`mailto:${email}`);
    };

    if (loading) {
        return (
            <View className="flex-1 bg-white">
                <FptHeader safeArea title="Chi tiết lớp giảng dạy" showBack />
                {loadError ? <FptErrorBanner message={loadError} onRetry={() => { void loadData(); }} /> : null}
                <FptLoading message="Đang tải dữ liệu lớp học..." />
            </View>
        );
    }

    if (!classroom) {
        return (
            <View className="flex-1 bg-white">
                <FptHeader safeArea title="Chi tiết lớp giảng dạy" showBack />
                {loadError ? <FptErrorBanner message={loadError} onRetry={() => { void loadData(); }} /> : null}
                <View className="flex-1 items-center justify-center p-6">
                    <Text className="text-gray-500">Không tìm thấy thông tin lớp học.</Text>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-fpt-grayBg">
            <FptHeader safeArea title={classroom.class_name || 'Chi tiết lớp học'} showBack />
                {loadError ? <FptErrorBanner message={loadError} onRetry={() => { void loadData(); }} /> : null}

            <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 32 }}>
                {/* Classroom Overview */}
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
                            <Text className="text-xs text-gray-500">Khung giờ dạy</Text>
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
                            <Text className="text-xs text-gray-500">Sĩ số hiện tại</Text>
                            <Text className="text-sm font-bold text-fpt-blue">
                                {students.length} / {classroom.max_student || '30'} sinh viên
                            </Text>
                        </View>
                    </View>
                </FptCard>

                {/* Students Management */}
                <View className="mt-2">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-base font-bold text-gray-900">
                            Danh sách học viên trong lớp
                        </Text>
                        <Text className="text-xs text-gray-500 font-semibold">
                            {students.length} học viên
                        </Text>
                    </View>

                    {students.length === 0 ? (
                        <View className="rounded-2xl bg-white p-6 border border-gray-100 items-center justify-center">
                            <Ionicons name="people-outline" size={32} color="#A0AEC0" />
                            <Text className="mt-2 text-xs text-gray-500">
                                Chưa có học viên nào ghi danh vào lớp này.
                            </Text>
                        </View>
                    ) : (
                        students.map((item, index) => (
                            <View
                                key={item._id || index}
                                className="mb-2.5 rounded-2xl bg-white p-4 border border-gray-100 shadow-sm"
                            >
                                <View className="flex-row items-center justify-between pb-2 border-b border-gray-50">
                                    <View className="flex-row items-center flex-1">
                                        <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-100 mr-3">
                                            <Text className="text-sm font-bold text-fpt-blue">
                                                {(item.student_id?.name || 'HV')[0].toUpperCase()}
                                            </Text>
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
                                                {item.student_id?.name || 'Học viên'}
                                            </Text>
                                            <Text className="text-xs text-gray-500" numberOfLines={1}>
                                                {item.student_id?.email || 'N/A'}
                                            </Text>
                                        </View>
                                    </View>
                                    <FptBadge status={item.status || 'STUDYING'} size="sm" />
                                </View>

                                {/* Contact Actions */}
                                <View className="mt-3 flex-row items-center justify-end gap-2">
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() => handleCall(item.student_id?.phone)}
                                        className="flex-row items-center rounded-xl bg-gray-100 px-3 py-1.5"
                                    >
                                        <Ionicons name="call-outline" size={14} color="#4A5568" />
                                        <Text className="ml-1 text-xs font-semibold text-gray-700">
                                            {item.student_id?.phone || 'Gọi điện'}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() => handleEmail(item.student_id?.email)}
                                        className="flex-row items-center rounded-xl bg-blue-50 px-3 py-1.5"
                                    >
                                        <Ionicons name="mail-outline" size={14} color="#0050B3" />
                                        <Text className="ml-1 text-xs font-semibold text-fpt-blue">
                                            Gửi Email
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
