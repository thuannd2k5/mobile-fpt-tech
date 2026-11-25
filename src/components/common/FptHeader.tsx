import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export interface FptHeaderProps {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    onBack?: () => void;
    rightAction?: React.ReactNode;
    className?: string;
    /** Enable when the screen is not already wrapped in a top SafeAreaView. */
    safeArea?: boolean;
}

export const FptHeader: React.FC<FptHeaderProps> = ({
    title,
    subtitle,
    showBack = false,
    onBack,
    rightAction,
    className = '',
    safeArea = false,
}) => {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

    return (
        <View
            style={{ paddingTop: (safeArea ? insets.top : 0) + 14 }}
            className={`flex-row items-center justify-between border-b border-gray-100 bg-white px-5 py-4 ${className}`}
        >
            <View className="flex-row items-center flex-1">
                {showBack && (
                    <TouchableOpacity
                        onPress={handleBack}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Quay lại"
                        className="mr-3 min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl bg-slate-50 border border-slate-100"
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
