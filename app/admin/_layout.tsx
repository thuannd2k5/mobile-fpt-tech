import React from 'react';
import { Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector } from '@/redux/hooks';
import FptLogoutButton from '@/components/common/FptLogoutButton';

export default function AdminLayout() {
    const name = useAppSelector((state) => state.account.user.name);
    return (
        <View className="flex-1 bg-fpt-grayBg">
            <SafeAreaView edges={['top']} className="border-b border-slate-100 bg-white">
                <View className="flex-row items-center justify-between px-5 py-3">
                    <View className="flex-1 pr-3">
                        <Text className="text-xs font-bold tracking-wider text-fpt-orange">FPT ADMIN</Text>
                        <Text numberOfLines={1} className="mt-1 text-sm font-semibold text-slate-800">{name || 'Quản trị viên'}</Text>
                    </View>
                    <FptLogoutButton />
                </View>
            </SafeAreaView>
            <Stack screenOptions={{ headerShown: false }} />
        </View>
    );
}
