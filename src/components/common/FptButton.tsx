import React from 'react';
import {
    TouchableOpacity,
    Text,
    ActivityIndicator,
    View,
    TouchableOpacityProps,
} from 'react-native';

export interface FptButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    iconLeft?: React.ReactNode;
    iconRight?: React.ReactNode;
    className?: string;
    textClassName?: string;
}

export const FptButton: React.FC<FptButtonProps> = ({
    title,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    iconLeft,
    iconRight,
    className = '',
    textClassName = '',
    ...props
}) => {
    const getVariantStyle = () => {
        if (disabled) {
            return 'bg-gray-200 border-gray-200';
        }
        switch (variant) {
            case 'primary':
                return 'bg-fpt-orange border-fpt-orange active:bg-fpt-orangeDark shadow-sm';
            case 'secondary':
                return 'bg-fpt-blue border-fpt-blue active:bg-fpt-blueDark';
            case 'outline':
                return 'bg-transparent border-fpt-orange border';
            case 'danger':
                return 'bg-red-500 border-red-500 active:bg-red-600';
            case 'ghost':
                return 'bg-transparent border-transparent';
            default:
                return 'bg-fpt-orange border-fpt-orange';
        }
    };

    const getTextStyle = () => {
        if (disabled) return 'text-gray-400';
        switch (variant) {
            case 'primary':
            case 'secondary':
            case 'danger':
                return 'text-white font-semibold';
            case 'outline':
                return 'text-fpt-orange font-semibold';
            case 'ghost':
                return 'text-gray-700 font-medium';
            default:
                return 'text-white font-semibold';
        }
    };

    const getSizeStyle = () => {
        switch (size) {
            case 'sm':
                return 'min-h-[44px] px-4 py-2 rounded-xl';
            case 'lg':
                return 'min-h-[56px] px-6 py-4 rounded-2xl';
            case 'md':
            default:
                return 'min-h-[48px] px-4 py-3 rounded-xl';
        }
    };

    const getTextSize = () => {
        switch (size) {
            case 'sm':
                return 'text-sm';
            case 'lg':
                return 'text-lg';
            case 'md':
            default:
                return 'text-base';
        }
    };

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            disabled={disabled || loading}
            accessibilityRole="button"
            accessibilityState={{ disabled: disabled || loading, busy: loading }}
            className={`flex-row items-center justify-center border ${getVariantStyle()} ${getSizeStyle()} ${className}`}
            {...props}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'outline' || variant === 'ghost' ? '#F26522' : '#FFFFFF'}
                    size="small"
                />
            ) : (
                <>
                    {iconLeft && <View className="mr-2">{iconLeft}</View>}
                    <Text className={`${getTextStyle()} ${getTextSize()} text-center ${textClassName}`}>
                        {title}
                    </Text>
                    {iconRight && <View className="ml-2">{iconRight}</View>}
                </>
            )}
        </TouchableOpacity>
    );
};

export default FptButton;
