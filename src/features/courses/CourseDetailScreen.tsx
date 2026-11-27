import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { canRegisterForCourse } from '@/types/portal';
import { setUserLoginInfo } from '@/redux/slice/accountSlice';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
    callFetchAccount,
    callFetchCourseById,
    callFetchOpenClassroomsForCourse,
    callRegisterForCourse,
} from '@/api';
import { ICourse, IClassroom } from '@/types/backend';
import { FptHeader, FptButton, FptLoading } from '@/components/common';

import FptErrorBanner from '@/components/common/FptErrorBanner';

export default function CourseDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [enrolled, setEnrolled] = useState(false);
    const [enrollmentError, setEnrollmentError] = useState('');
    const insets = useSafeAreaInsets();
    const { user } = useAppSelector((state) => state.account);

    const [loadError, setLoadError] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [course, setCourse] = useState<ICourse | null>(null);
    const [openClasses, setOpenClasses] = useState<IClassroom[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>('');

    const loadData = useCallback(async () => {
        setLoadError('');
        if (!id) return;
        try {
            const [courseRes, classesRes] = await Promise.allSettled([
                callFetchCourseById(id),
                callFetchOpenClassroomsForCourse(id),
            ]);

            if (
                [courseRes, classesRes].some(
                    (result) => result.status === 'rejected',
                )
            ) {
                setLoadError(
                    'Không thể tải đầy đủ thông tin. Vui lòng thử lại.',
                );
            }
            if (courseRes.status === 'fulfilled' && courseRes.value?.data) {
                setCourse(courseRes.value.data);
            }
            if (
                classesRes.status === 'fulfilled' &&
                Array.isArray(classesRes.value?.data)
            ) {
                setOpenClasses(classesRes.value.data);
                if (
                    classesRes.value.data.length > 0 &&
                    classesRes.value.data[0]._id
                ) {
                    setSelectedClassId(classesRes.value.data[0]._id);
                }
            }
        } catch {
            setLoadError(
                'Không thể tải đầy đủ thông tin. Vui lòng kiểm tra kết nối và thử lại.',
            );
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const formatPrice = (val?: string | number) => {
        if (!val) return 'Miễn phí';
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return isNaN(num) ? String(val) : `${num.toLocaleString('vi-VN')} ₫`;
    };

    const handleEnroll = async () => {
        if (enrolled) {
            setSubmitting(true);
            try {
                const account = await callFetchAccount();
                if (!account.data?.user) throw new Error();
                dispatch(setUserLoginInfo(account.data.user));
                router.replace('/(student)/(tabs)/invoices');
            } catch {
                setEnrollmentError(
                    'Bạn đã ghi danh. Vui lòng thử tải lại tài khoản để xem học phí.',
                );
            } finally {
                setSubmitting(false);
            }
            return;
        }
        setEnrollmentError('');
        if (
            !canRegisterForCourse(user.role?.name) ||
            loadError ||
            course?.status?.toUpperCase() === 'INACTIVE'
        )
            return;
        if (!selectedClassId) {
            Alert.alert('Thông báo', 'Vui lòng chọn một lớp học để đăng ký.');
            return;
        }

        if (!user._id) {
            Alert.alert(
                'Chưa đăng nhập',
                'Vui lòng đăng nhập để đăng ký khóa học.',
                [
                    {
                        text: 'Đăng nhập',
                        onPress: () => router.push('/(auth)/login'),
                    },
                    { text: 'Hủy' },
                ],
            );
            return;
        }

        setSubmitting(true);
        try {
            const res = await callRegisterForCourse({
                student_id: user._id,
                class_id: selectedClassId,
            });

            if (res && res.data) {
                setEnrolled(true);
                if (user.role?.name === 'NORMAL USER') {
                    const account = await callFetchAccount();
                    if (!account.data?.user)
                        throw new Error('Không tải được vai trò mới.');
                    dispatch(setUserLoginInfo(account.data.user));
                }
                router.replace('/(student)/(tabs)/invoices');
            } else {
                Alert.alert(
                    'Thất bại',
                    res?.message || 'Không thể đăng ký lớp học.',
                );
            }
        } catch (error: any) {
            const msg =
                error?.response?.data?.message ||
                error?.message ||
                'Có lỗi xảy ra trong quá trình đăng ký.';
            setEnrollmentError(Array.isArray(msg) ? msg.join(', ') : msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 bg-white">
                <FptHeader safeArea title="Chi tiết khóa học" showBack />
                {loadError ? (
                    <FptErrorBanner
                        message={loadError}
                        onRetry={() => {
                            void loadData();
                        }}
                    />
                ) : null}
                <FptLoading message="Đang tải thông tin khóa học..." />
            </View>
        );
    }

    if (!course) {
        return (
            <View className="flex-1 bg-white">
                <FptHeader safeArea title="Chi tiết khóa học" showBack />
                {loadError ? (
                    <FptErrorBanner
                        message={loadError}
                        onRetry={() => {
                            void loadData();
                        }}
                    />
                ) : null}
                <View className="flex-1 items-center justify-center p-6">
                    <Text className="text-gray-500">
                        Không tìm thấy thông tin khóa học.
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-fpt-grayBg">
            <FptHeader safeArea title={course.name} showBack />
            {loadError ? (
                <FptErrorBanner
                    message={loadError}
                    onRetry={() => {
                        void loadData();
                    }}
                />
            ) : null}

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Hero Header Banner */}
                <View className="bg-white p-5 border-b border-gray-100">
                    <View className="h-44 w-full rounded-2xl bg-orange-50 items-center justify-center mb-4">
                        <Ionicons
                            name="desktop-outline"
                            size={64}
                            color="#F26522"
                        />
                    </View>

                    <Text className="text-2xl font-bold text-gray-900 leading-tight">
                        {course.name}
                    </Text>

                    <View className="mt-3 flex-row items-center flex-wrap gap-2">
                        {course.level && (
                            <View className="rounded-lg bg-orange-50 px-2.5 py-1">
                                <Text className="text-xs font-bold text-fpt-orange">
                                    Cấp độ: {course.level}
                                </Text>
                            </View>
                        )}
                        {course.duration && (
                            <View className="rounded-lg bg-blue-50 px-2.5 py-1">
                                <Text className="text-xs font-bold text-blue-700">
                                    Thời lượng: {course.duration}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View className="mt-4 pt-4 border-t border-gray-100 flex-row items-center justify-between">
                        <Text className="text-sm text-gray-500">
                            Học phí trọn khóa
                        </Text>
                        <Text className="text-2xl font-bold text-fpt-orange">
                            {formatPrice(course.price)}
                        </Text>
                    </View>
                </View>

                {/* Course Description */}
                <View className="mt-3 bg-white p-5 border-y border-gray-100">
                    <Text className="text-base font-bold text-gray-900 mb-2">
                        Giới thiệu khóa học
                    </Text>
                    <Text className="text-sm text-gray-600 leading-relaxed">
                        {course.description ||
                            'Chương trình đào tạo chuyên sâu, bài bản theo dự án thực tế tại FPT. Cung cấp đầy đủ kiến thức từ cơ bản đến nâng cao, cam kết hỗ trợ việc làm sau khi tốt nghiệp.'}
                    </Text>
                </View>

                {/* Open Classrooms Section */}
                <View className="mt-3 bg-white p-5 border-y border-gray-100">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-base font-bold text-gray-900">
                            Lớp học đang mở tuyển sinh
                        </Text>
                        <Text className="text-xs text-gray-500">
                            {openClasses.length} lớp khả dụng
                        </Text>
                    </View>

                    {openClasses.length === 0 ? (
                        <View className="rounded-xl bg-fpt-grayBg p-5 items-center justify-center">
                            <Ionicons
                                name="alert-circle-outline"
                                size={28}
                                color="#A0AEC0"
                            />
                            <Text className="mt-2 text-xs font-medium text-gray-500 text-center">
                                Hiện chưa có lớp học nào đang mở cho khóa học
                                này. Vui lòng quay lại sau.
                            </Text>
                        </View>
                    ) : (
                        openClasses.map((cls) => {
                            const isSelected = selectedClassId === cls._id;
                            return (
                                <TouchableOpacity
                                    key={cls._id}
                                    activeOpacity={0.8}
                                    onPress={() =>
                                        cls._id && setSelectedClassId(cls._id)
                                    }
                                    className={`mb-3 rounded-2xl border p-4 ${
                                        isSelected
                                            ? 'border-fpt-orange bg-orange-50/20'
                                            : 'border-gray-200 bg-white'
                                    }`}
                                >
                                    <View className="flex-row items-center justify-between">
                                        <Text className="text-base font-bold text-gray-900 flex-1">
                                            {cls.class_name || 'Lớp học'}
                                        </Text>
                                        <View
                                            className={`h-5 w-5 rounded-full border items-center justify-center ${
                                                isSelected
                                                    ? 'border-fpt-orange bg-fpt-orange'
                                                    : 'border-gray-300'
                                            }`}
                                        >
                                            {isSelected && (
                                                <Ionicons
                                                    name="checkmark"
                                                    size={14}
                                                    color="#FFFFFF"
                                                />
                                            )}
                                        </View>
                                    </View>

                                    <View className="mt-2 space-y-1">
                                        {cls.room && (
                                            <View className="flex-row items-center">
                                                <Ionicons
                                                    name="location-outline"
                                                    size={14}
                                                    color="#718096"
                                                />
                                                <Text className="ml-1 text-xs text-gray-600">
                                                    Phòng học: {cls.room}
                                                </Text>
                                            </View>
                                        )}
                                        {(cls.start_time || cls.end_time) && (
                                            <View className="flex-row items-center">
                                                <Ionicons
                                                    name="time-outline"
                                                    size={14}
                                                    color="#718096"
                                                />
                                                <Text className="ml-1 text-xs text-gray-600">
                                                    Ca học:{' '}
                                                    {cls.start_time ||
                                                        'Chưa xếp giờ'}{' '}
                                                    -{' '}
                                                    {cls.end_time ||
                                                        'Chưa xếp giờ'}
                                                </Text>
                                            </View>
                                        )}
                                        {cls.start_date && (
                                            <View className="flex-row items-center">
                                                <Ionicons
                                                    name="calendar-outline"
                                                    size={14}
                                                    color="#718096"
                                                />
                                                <Text className="ml-1 text-xs text-gray-600">
                                                    Khai giảng: {cls.start_date}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>
            </ScrollView>

            {enrollmentError ? (
                <View className="absolute bottom-28 left-5 right-5 rounded-xl bg-red-50 p-3">
                    <Text
                        accessibilityRole="alert"
                        className="text-sm text-red-700"
                    >
                        {enrolled ? 'Đã ghi danh. ' : ''}
                        {enrollmentError}
                    </Text>
                </View>
            ) : null}
            {/* Bottom Action Floating Bar */}
            <View
                className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-lg"
                style={{ paddingBottom: Math.max(insets.bottom, 16) }}
            >
                <FptButton
                    title={
                        enrolled
                            ? 'Tải lại tài khoản và xem học phí'
                            : !canRegisterForCourse(user.role?.name)
                              ? 'Chỉ dành cho tài khoản học viên'
                              : 'Đăng ký ghi danh khóa học'
                    }
                    onPress={handleEnroll}
                    loading={submitting}
                    disabled={
                        openClasses.length === 0 ||
                        submitting ||
                        !!loadError ||
                        !canRegisterForCourse(user.role?.name) ||
                        course.status?.toUpperCase() === 'INACTIVE'
                    }
                    size="lg"
                />
            </View>
        </View>
    );
}
