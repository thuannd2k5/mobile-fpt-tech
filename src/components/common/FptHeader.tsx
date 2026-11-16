import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export interface FptHeaderProps {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    onBack?: () => void;
    rightAction?: React.ReactNode;
    className?: string;
}

export const FptHeader: React.FC<FptHeaderProps> = ({
    title,
    subtitle,
    showBack = false,
    onBack,
    rightAction,
    className = '',
}) => {
    const router = useRouter();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

    return (
        <View
            className={`flex-row items-center justify-between border-b border-gray-100 bg-white px-4 py-3.5 ${className}`}
        >
            <View className="flex-row items-center flex-1">
                {showBack && (
                    <TouchableOpacity
                        onPress={handleBack}
                        activeOpacity={0.7}
                        className="mr-3 rounded-full bg-gray-50 p-2 border border-gray-200"
                    >
                        <Ionicons name="arrow-back" size={20} color="#262626" />
                    </TouchableOpacity>
                )}
                <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
                        {title}
                    </Text>
                    {subtitle && (
                        <Text className="text-xs text-gray-500" numberOfLines={1}>
                            {subtitle}
                        </Text>
                    )}
                </View>
            </View>
            {rightAction && <View className="ml-3">{rightAction}</View>}
        </View>
    );
};

export default FptHeader;
