import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FptErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <View accessibilityRole="alert" className="mx-5 my-3 rounded-2xl border border-red-100 bg-red-50 p-4">
            <View className="flex-row items-start">
                <Ionicons name="cloud-offline-outline" size={20} color="#B42318" />
                <Text className="ml-3 flex-1 text-sm leading-5 text-red-800">{message}</Text>
            </View>
            <TouchableOpacity accessibilityRole="button" onPress={onRetry} className="mt-2 min-h-[44px] justify-center self-start px-2">
                <Text className="text-sm font-bold text-red-800">Thử lại</Text>
            </TouchableOpacity>
        </View>
    );
}
