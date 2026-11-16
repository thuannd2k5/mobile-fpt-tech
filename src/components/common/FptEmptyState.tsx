import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FptButton from './FptButton';

export interface FptEmptyStateProps {
    title?: string;
    description?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    actionTitle?: string;
    onAction?: () => void;
}

export const FptEmptyState: React.FC<FptEmptyStateProps> = ({
    title = 'Chưa có dữ liệu',
    description = 'Hiện tại không có thông tin nào để hiển thị.',
    icon = 'file-tray-outline',
    actionTitle,
    onAction,
}) => {
    return (
        <View className="flex-1 items-center justify-center p-8">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Ionicons name={icon} size={32} color="#A0AEC0" />
            </View>
            <Text className="text-center text-lg font-bold text-gray-800">{title}</Text>
            <Text className="mt-1 text-center text-sm text-gray-500 leading-relaxed max-w-[260px]">
                {description}
            </Text>
            {actionTitle && onAction && (
                <View className="mt-5">
                    <FptButton title={actionTitle} onPress={onAction} size="sm" />
                </View>
            )}
        </View>
    );
};

export default FptEmptyState;
