import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

export interface FptLoadingProps {
    message?: string;
    fullScreen?: boolean;
}

export const FptLoading: React.FC<FptLoadingProps> = ({
    message = 'Đang tải dữ liệu...',
    fullScreen = true,
}) => {
    return (
        <View
            className={`items-center justify-center ${
                fullScreen ? 'flex-1 bg-white p-6' : 'py-8'
            }`}
        >
            <View className="mb-3 h-12 w-12 items-center justify-center rounded-2xl bg-orange-50">
                <ActivityIndicator size="large" color="#F26522" />
            </View>
            <Text className="text-sm font-medium text-gray-600">{message}</Text>
        </View>
    );
};

export default FptLoading;
