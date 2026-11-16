import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StudentProfileScreen() {
    return (
        <SafeAreaView className="flex-1 bg-white items-center justify-center p-6">
            <Text className="text-xl font-bold text-gray-900">Hồ sơ cá nhân</Text>
            <Text className="mt-2 text-sm text-gray-500">Đang chuẩn bị thông tin tài khoản...</Text>
        </SafeAreaView>
    );
}
