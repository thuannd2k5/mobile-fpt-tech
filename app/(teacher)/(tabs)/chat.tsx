import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FptButton } from '@/components/common';

export default function TeacherChatPlaceholder() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-white items-center justify-center p-6">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-blue-50 mb-4">
                <Ionicons name="chatbubbles" size={32} color="#0050B3" />
            </View>
            <Text className="text-xl font-bold text-gray-900">Tin nhắn trao đổi</Text>
            <Text className="mt-1 text-xs text-gray-500 text-center leading-relaxed max-w-[260px]">
                Trao đổi và giải đáp thắc mắc trực tiếp cùng học viên trong các lớp học.
            </Text>
            <View className="mt-6">
                <FptButton
                    title="Mở hộp thư tin nhắn"
                    variant="secondary"
                    onPress={() => router.push('/(common)/chat' as any)}
                />
            </View>
        </SafeAreaView>
    );
}
