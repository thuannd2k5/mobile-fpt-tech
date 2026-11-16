import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppDispatch } from '@/redux/hooks';
import { fetchAccount } from '@/redux/slice/accountSlice';
import { getAccessToken } from '@/utils/storage';
import { getDefaultRouteForRole } from '@/types/portal';
import { Ionicons } from '@expo/vector-icons';

export default function SplashScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();

    useEffect(() => {
        const bootstrap = async () => {
            try {
                const token = await getAccessToken();
                if (!token) {
                    router.replace('/(auth)/login');
                    return;
                }

                const result = await dispatch(fetchAccount()).unwrap();
                if (result && result.user) {
                    const targetRoute = getDefaultRouteForRole(result.user.role?.name);
                    router.replace(targetRoute as any);
                } else {
                    router.replace('/(auth)/login');
                }
            } catch {
                router.replace('/(auth)/login');
            }
        };

        const timer = setTimeout(() => {
            bootstrap();
        }, 1200);

        return () => clearTimeout(timer);
    }, [dispatch, router]);

    return (
        <View className="flex-1 items-center justify-center bg-white px-6">
            <View className="mb-4 h-24 w-24 items-center justify-center rounded-3xl bg-orange-500 shadow-md">
                <Ionicons name="school" size={54} color="#FFFFFF" />
            </View>
            <Text className="text-2xl font-black text-gray-900 tracking-tight">
                FPT EDUCATION
            </Text>
            <Text className="mt-1 text-sm text-gray-500 font-medium">
                Hệ sinh thái đào tạo công nghệ
            </Text>

            <View className="absolute bottom-16 items-center">
                <ActivityIndicator size="small" color="#F26522" />
                <Text className="mt-3 text-xs text-gray-400">Đang khởi động hệ thống...</Text>
            </View>
        </View>
    );
}
