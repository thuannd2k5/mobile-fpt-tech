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
                fullScreen ? 'flex-1 bg-fpt-grayBg p-6' : 'py-8'
            }`}
        >
            <View className="mb-3 h-16 w-16 items-center justify-center rounded-3xl border border-orange-100 bg-white">
                <ActivityIndicator size="large" color="#F26522" />
            </View>
            <Text className="text-sm font-medium text-gray-600">{message}</Text>
        </View>
    );
};

export default FptLoading;
