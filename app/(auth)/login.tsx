import React, { useState } from 'react';
import {
    View,
    Text,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    TouchableOpacity,
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
            className="flex-1 bg-slate-50"
        >
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                keyboardShouldPersistTaps="always"
                className="px-6 py-10"
            >
                    <View className="items-center mb-7">
                        <View className="h-20 w-20 items-center justify-center rounded-[28px] bg-orange-500 shadow-md mb-5 border-4 border-orange-100">
                            <Ionicons name="school" size={44} color="#FFFFFF" />
                        </View>
                        <Text className="text-[11px] font-extrabold tracking-[2px] text-fpt-orange">
                            FPT EDUCATION PORTAL
                        </Text>
                        <Text className="mt-1 text-3xl font-black text-slate-900">
                            FPT TECH EDUCATION
                        </Text>
                        <Text className="text-sm text-slate-500 mt-2">
                            Không gian học tập dành riêng cho bạn
                        </Text>
                    </View>

                    <View className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
                    {errorMessage ? (
                        <View className="mb-4 flex-row items-center rounded-2xl bg-red-50 p-3.5 border border-red-100">
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
                    </View>

                    {/* Register Link */}
                    <View className="mt-7 flex-row items-center justify-center">
                        <Text className="text-sm text-gray-500">Chưa có tài khoản? </Text>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => router.push('/(auth)/register')}
                        >
                            <Text className="text-sm font-bold text-fpt-orange">Đăng ký ngay</Text>
                        </TouchableOpacity>
                    </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
