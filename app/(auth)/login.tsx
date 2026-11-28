import React, { useState } from 'react';
import {
    View,
    Text,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
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
        <SafeAreaView className="flex-1 bg-fpt-grayBg">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }} keyboardShouldPersistTaps="handled">
                    <View className="w-full max-w-[440px] self-center">
                        <View className="mb-8 flex-row items-center">
                            <View className="mr-3 h-12 w-12 items-center justify-center rounded-2xl bg-fpt-orange">
                                <Ionicons name="school" size={26} color="#FFFFFF" />
                            </View>
                            <View>
                                <Text className="text-lg font-bold tracking-wider text-slate-900">FPT EDUCATION</Text>
                                <Text className="mt-0.5 text-xs text-slate-500">Kết nối tri thức · Kiến tạo tương lai</Text>
                            </View>
                        </View>
                      
                        <View className="rounded-3xl border border-slate-200/70 bg-white p-5">
                            <Text className="mb-1 text-xl font-bold text-slate-900">Đăng nhập</Text>
                            <Text className="mb-6 text-sm leading-5 text-slate-500">Sử dụng tài khoản FPT Education của bạn.</Text>
                            {errorMessage ? (
                                <View accessibilityRole="alert" className="mb-5 rounded-2xl border border-red-100 bg-red-50 p-3">
                                    <Text className="text-sm leading-5 text-red-700">{errorMessage}</Text>
                                </View>
                            ) : null}
                            <FptInput label="Email hoặc tên đăng nhập" placeholder="Nhập email của bạn" value={username}
                                onChangeText={(text) => { setUsername(text); setErrorMessage(''); }}
                                autoCapitalize="none" autoCorrect={false} autoComplete="username" textContentType="username"
                                returnKeyType="next" editable={!loading}
                                icon={<Ionicons name="person-outline" size={19} color="#64748B" />} />
                            <FptInput label="Mật khẩu" placeholder="Nhập mật khẩu" value={password}
                                onChangeText={(text) => { setPassword(text); setErrorMessage(''); }}
                                isPassword autoCapitalize="none" autoComplete="current-password" textContentType="password"
                                returnKeyType="go" onSubmitEditing={() => { if (!loading) void handleLogin(); }} editable={!loading}
                                icon={<Ionicons name="lock-closed-outline" size={19} color="#64748B" />} />
                            <View className="mt-2">
                                <FptButton title="Đăng nhập" onPress={handleLogin} loading={loading} size="lg"
                                    iconRight={<Ionicons name="arrow-forward" size={20} color="#FFFFFF" />} />
                            </View>
                        </View>
                        <View className="mt-5 flex-row flex-wrap items-center justify-center">
                            <Text className="text-sm text-slate-500">Bạn mới đến FPT Education? </Text>
                            <TouchableOpacity accessibilityRole="button" className="min-h-[44px] justify-center" onPress={() => router.push('/(auth)/register')}>
                                <Text className="text-sm font-bold text-fpt-orange">Tạo tài khoản</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
