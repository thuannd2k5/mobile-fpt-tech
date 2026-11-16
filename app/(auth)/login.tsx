import React, { useState } from 'react';
import {
    View,
    Text,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    ScrollView,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch } from '@/redux/hooks';
import { setUserLoginInfo } from '@/redux/slice/accountSlice';
import { callLogin } from '@/api';
import { setAccessToken } from '@/utils/storage';
import { getDefaultRouteForRole } from '@/types/portal';
import { FptButton, FptInput } from '@/components/common';

export default function LoginScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            setErrorMessage('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
            return;
        }

        setErrorMessage('');
        setLoading(true);

        try {
            const res = await callLogin(username.trim(), password);
            if (res && res.data && res.data.access_token) {
                const { access_token, user } = res.data;
                await setAccessToken(access_token);
                dispatch(setUserLoginInfo(user));

                const nextRoute = getDefaultRouteForRole(user.role?.name);
                router.replace(nextRoute as any);
            } else {
                setErrorMessage(res?.message || 'Đăng nhập không thành công.');
            }
        } catch (error: any) {
            const msg =
                error?.response?.data?.message ||
                error?.message ||
                'Tên đăng nhập hoặc mật khẩu không chính xác.';
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
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                    className="px-6 py-10 justify-center"
                >
                    {/* Header Logo */}
                    <View className="items-center mb-8">
                        <View className="h-20 w-20 items-center justify-center rounded-3xl bg-orange-500 shadow-md mb-4">
                            <Ionicons name="school" size={44} color="#FFFFFF" />
                        </View>
                        <Text className="text-2xl font-black text-gray-900">
                            FPT TECH EDUCATION
                        </Text>
                        <Text className="text-sm text-gray-500 mt-1">
                            Đăng nhập hệ sinh thái đào tạo
                        </Text>
                    </View>

                    {/* Error Banner */}
                    {errorMessage ? (
                        <View className="mb-4 flex-row items-center rounded-xl bg-red-50 p-3.5 border border-red-200">
                            <Ionicons name="alert-circle" size={20} color="#EF4444" />
                            <Text className="ml-2.5 flex-1 text-xs font-medium text-red-700">
                                {errorMessage}
                            </Text>
                        </View>
                    ) : null}

                    {/* Inputs */}
                    <FptInput
                        label="Email hoặc Tên đăng nhập"
                        placeholder="admin@gmail.com, student@fpt.edu.vn..."
                        value={username}
                        onChangeText={(text) => {
                            setUsername(text);
                            if (errorMessage) setErrorMessage('');
                        }}
                        autoCapitalize="none"
                        icon={<Ionicons name="person-outline" size={18} color="#718096" />}
                    />

                    <FptInput
                        label="Mật khẩu"
                        placeholder="Nhập mật khẩu..."
                        value={password}
                        onChangeText={(text) => {
                            setPassword(text);
                            if (errorMessage) setErrorMessage('');
                        }}
                        isPassword
                        icon={<Ionicons name="lock-closed-outline" size={18} color="#718096" />}
                    />

                    {/* Submit Button */}
                    <View className="mt-4">
                        <FptButton
                            title="Đăng nhập"
                            onPress={handleLogin}
                            loading={loading}
                            size="lg"
                        />
                    </View>

                    {/* Register Link */}
                    <View className="mt-8 flex-row items-center justify-center">
                        <Text className="text-sm text-gray-500">Chưa có tài khoản? </Text>
                        <TouchableWithoutFeedback onPress={() => router.push('/(auth)/register')}>
                            <Text className="text-sm font-bold text-fpt-orange">Đăng ký ngay</Text>
                        </TouchableWithoutFeedback>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}
