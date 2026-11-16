import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ConsultantIndex() {
    return (
        <SafeAreaView className="flex-1 bg-white items-center justify-center p-6">
            <Text className="text-xl font-bold text-gray-900">Cổng thông tin Tư vấn viên</Text>
        </SafeAreaView>
    );
}
