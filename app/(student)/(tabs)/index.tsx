import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StudentDashboardScreen() {
    return (
        <SafeAreaView className="flex-1 bg-white items-center justify-center p-6">
            <Text className="text-xl font-bold text-gray-900">Dashboard Học viên</Text>
            <Text className="mt-2 text-sm text-gray-500">Đang chuẩn bị dữ liệu tổng quan...</Text>
        </SafeAreaView>
    );
}
