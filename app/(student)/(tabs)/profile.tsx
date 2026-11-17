import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setLogoutAction, setProfileAction } from '@/redux/slice/accountSlice';
import { callLogout, callUpdateMyProfile } from '@/api';
import { FptCard, FptBadge, FptButton, FptInput } from '@/components/common';

export default function StudentProfileScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.account);

    // Edit profile state
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [name, setName] = useState(user.name || '');
    const [saving, setSaving] = useState(false);

    const handleOpenEdit = () => {
        setName(user.name || '');
        setEditModalVisible(true);
    };

    const handleSaveProfile = async () => {
        if (!name.trim()) {
            Alert.alert('Lỗi', 'Họ tên không được để trống.');
            return;
        }

        setSaving(true);
        try {
            await callUpdateMyProfile({
                name: name.trim(),
            });

            dispatch(
                setProfileAction({
                    name: name.trim(),
                })
            );

            setEditModalVisible(false);
            Alert.alert('Thành công', 'Thông tin cá nhân đã được cập nhật.');
        } catch (error: any) {
            Alert.alert(
                'Lỗi cập nhật',
                error?.response?.data?.message || 'Không thể cập nhật thông tin lúc này.'
            );
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Xác nhận đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Đăng xuất',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await callLogout();
                        } catch {}
                        dispatch(setLogoutAction());
                        router.replace('/(auth)/login');
                    },
                },
            ]
        );
    };

    const initial = (user.name || 'U')[0].toUpperCase();

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
            {/* Header */}
            <View className="bg-white px-5 pt-3 pb-3 border-b border-gray-100">
                <Text className="text-2xl font-black text-gray-900">Tài khoản cá nhân</Text>
            </View>

            <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 32 }}>
                {/* Profile Card */}
                <FptCard className="mb-4 items-center p-6">
                    <View className="h-20 w-20 items-center justify-center rounded-full bg-orange-100 mb-3 border-2 border-orange-200">
                        <Text className="text-3xl font-black text-fpt-orange">{initial}</Text>
                    </View>
                    <Text className="text-xl font-bold text-gray-900">{user.name || 'Học viên'}</Text>
                    <Text className="text-xs text-gray-500 mt-0.5">{user.email || 'N/A'}</Text>

                    <View className="mt-2.5">
                        <FptBadge
                            status={user.role?.name || 'STUDENT'}
                            label={user.role?.name || 'Học viên'}
                            size="sm"
                        />
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleOpenEdit}
                        className="mt-4 rounded-xl border border-gray-200 px-4 py-2 flex-row items-center"
                    >
                        <Ionicons name="pencil-outline" size={14} color="#4A5568" />
                        <Text className="ml-1.5 text-xs font-semibold text-gray-700">
                            Chỉnh sửa tên hiển thị
                        </Text>
                    </TouchableOpacity>
                </FptCard>

                {/* Account information returned by the authenticated backend endpoint */}
                <View className="mb-4 rounded-3xl bg-white border border-gray-100 p-5 shadow-sm">
                    <View className="mb-4 flex-row items-center justify-between">
                        <Text className="text-sm font-bold text-gray-900">Thông tin tài khoản</Text>
                        <View className="rounded-full bg-emerald-50 px-2.5 py-1">
                            <Text className="text-[10px] font-bold text-emerald-700">ĐANG HOẠT ĐỘNG</Text>
                        </View>
                    </View>

                    <View className="space-y-3">
                        <View className="flex-row items-center justify-between">
                            <Text className="text-xs text-gray-500">Email đăng nhập</Text>
                            <Text className="ml-6 flex-1 text-right text-xs font-semibold text-gray-800" numberOfLines={1}>
                                {user.email || 'Chưa cập nhật'}
                            </Text>
                        </View>

                        <View className="flex-row items-center justify-between pt-2 border-t border-gray-50">
                            <Text className="text-xs text-gray-500">Vai trò</Text>
                            <Text className="text-xs font-semibold text-gray-800">
                                {user.role?.name || 'Học viên'}
                            </Text>
                        </View>

                    </View>
                </View>

                {/* Settings & Actions List */}
                <View className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm mb-6">
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => router.push('/(common)/change-password' as any)}
                        className="flex-row items-center justify-between p-4 border-b border-gray-100"
                    >
                        <View className="flex-row items-center">
                            <View className="h-8 w-8 items-center justify-center rounded-lg bg-orange-50 mr-3">
                                <Ionicons name="key-outline" size={16} color="#F26522" />
                            </View>
                            <Text className="text-sm font-semibold text-gray-800">Đổi mật khẩu</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#A0AEC0" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() =>
                            Alert.alert(
                                'Điều khoản sử dụng',
                                'FPT Education cam kết bảo vệ thông tin cá nhân và cung cấp môi trường học tập công nghệ hiện đại nhất.'
                            )
                        }
                        className="flex-row items-center justify-between p-4 border-b border-gray-100"
                    >
                        <View className="flex-row items-center">
                            <View className="h-8 w-8 items-center justify-center rounded-lg bg-blue-50 mr-3">
                                <Ionicons name="shield-checkmark-outline" size={16} color="#0050B3" />
                            </View>
                            <Text className="text-sm font-semibold text-gray-800">
                                Điều khoản & Bảo mật
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#A0AEC0" />
                    </TouchableOpacity>

                    <View className="flex-row items-center justify-between p-4">
                        <View className="flex-row items-center">
                            <View className="h-8 w-8 items-center justify-center rounded-lg bg-gray-100 mr-3">
                                <Ionicons name="information-circle-outline" size={16} color="#718096" />
                            </View>
                            <Text className="text-sm font-semibold text-gray-800">Phiên bản ứng dụng</Text>
                        </View>
                        <Text className="text-xs font-semibold text-gray-400">v1.0.0 (Expo)</Text>
                    </View>
                </View>

                {/* Logout Button */}
                <FptButton
                    title="Đăng xuất tài khoản"
                    variant="danger"
                    onPress={handleLogout}
                    iconLeft={<Ionicons name="log-out-outline" size={18} color="#FFFFFF" />}
                    size="lg"
                />
            </ScrollView>

            {/* Edit Profile Modal */}
            <Modal
                visible={editModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setEditModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1 justify-end bg-black/50"
                >
                    <View className="max-h-[90%] rounded-t-3xl bg-white p-6">
                            <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
                                <Text className="text-lg font-bold text-gray-900">
                                    Cập nhật tên hiển thị
                                </Text>
                                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                    <Ionicons name="close" size={22} color="#718096" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
                                <FptInput
                                    label="Họ và tên *"
                                    value={name}
                                    onChangeText={setName}
                                />
                                <View className="mb-5 rounded-2xl bg-orange-50 p-3">
                                    <Text className="text-xs leading-5 text-orange-800">
                                        Tên hiển thị sẽ được đồng bộ trực tiếp với tài khoản của bạn.
                                    </Text>
                                </View>

                                <View className="mt-4 mb-6">
                                    <FptButton
                                        title="Lưu thông tin"
                                        onPress={handleSaveProfile}
                                        loading={saving}
                                        size="lg"
                                    />
                                </View>
                            </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}
