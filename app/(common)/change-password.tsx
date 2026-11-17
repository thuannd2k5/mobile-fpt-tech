import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { callUpdateMyProfile, callLogout } from '@/api';
import { useAppDispatch } from '@/redux/hooks';
import { setLogoutAction } from '@/redux/slice/accountSlice';
import { FptHeader, FptInput, FptButton } from '@/components/common';

export default function ChangePasswordScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleChangePassword = async () => {
        if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
            setErrorMessage('Vui lòng điền đầy đủ các thông tin mật khẩu.');
            return;
        }

        if (newPassword.length < 8) {
            setErrorMessage('Mật khẩu mới phải có ít nhất 8 ký tự.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage('Mật khẩu mới và xác nhận mật khẩu không trùng khớp.');
            return;
        }

        setErrorMessage('');
        setLoading(true);

        try {
            await callUpdateMyProfile({
                currentPassword,
                newPassword,
            });

            Alert.alert(
                'Đổi mật khẩu thành công',
                'Mật khẩu của bạn đã được thay đổi. Vui lòng đăng nhập lại bằng mật khẩu mới.',
                [
                    {
                        text: 'Đăng nhập lại',
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
        } catch (error: any) {
            const msg =
                error?.response?.data?.message ||
                error?.message ||
                'Có lỗi xảy ra khi cập nhật mật khẩu.';
            setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white"
        >
            <FptHeader title="Đổi mật khẩu" showBack />
            <ScrollView
                className="flex-1 px-6 py-6"
                keyboardShouldPersistTaps="always"
            >
                    <Text className="text-xl font-bold text-gray-900 mb-1">
                        Bảo mật tài khoản
                    </Text>
                    <Text className="text-xs text-gray-500 mb-6">
                        Đổi mật khẩu định kỳ để nâng cao an toàn cho tài khoản học tập của bạn.
                    </Text>

                    {errorMessage ? (
                        <View className="mb-4 flex-row items-center rounded-xl bg-red-50 p-3.5 border border-red-200">
                            <Ionicons name="alert-circle" size={20} color="#EF4444" />
                            <Text className="ml-2.5 flex-1 text-xs font-medium text-red-700">
                                {errorMessage}
                            </Text>
                        </View>
                    ) : null}

                    <FptInput
                        label="Mật khẩu hiện tại *"
                        placeholder="Nhập mật khẩu đang sử dụng"
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        isPassword
                        icon={<Ionicons name="lock-closed-outline" size={18} color="#718096" />}
                    />

                    <FptInput
                        label="Mật khẩu mới *"
                        placeholder="Tối thiểu 8 ký tự..."
                        value={newPassword}
                        onChangeText={setNewPassword}
                        isPassword
                        icon={<Ionicons name="key-outline" size={18} color="#718096" />}
                    />

                    <FptInput
                        label="Xác nhận mật khẩu mới *"
                        placeholder="Nhập lại mật khẩu mới..."
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        isPassword
                        icon={<Ionicons name="checkmark-circle-outline" size={18} color="#718096" />}
                    />

                    <View className="mt-6">
                        <FptButton
                            title="Cập nhật mật khẩu"
                            onPress={handleChangePassword}
                            loading={loading}
                            size="lg"
                        />
                    </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
