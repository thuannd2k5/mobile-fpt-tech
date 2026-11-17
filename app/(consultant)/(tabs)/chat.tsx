import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FptButton } from '@/components/common';

export default function ConsultantChatPlaceholder() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-white items-center justify-center p-6">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-sky-50 mb-4">
                <Ionicons name="chatbubbles" size={32} color="#0284C7" />
            </View>
            <Text className="text-xl font-bold text-gray-900">Chat tư vấn trực tuyến</Text>
            <Text className="mt-1 text-xs text-gray-500 text-center leading-relaxed max-w-[260px]">
                Trò chuyện và hỗ trợ tư vấn lộ trình học tập trực tiếp cho học viên tiềm năng.
            </Text>
            <View className="mt-6">
                <FptButton
                    title="Mở hộp thư tư vấn"
                    variant="secondary"
                    onPress={() => router.push('/(common)/chat' as any)}
                />
            </View>
        </SafeAreaView>
    );
}
