import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface FptInputProps extends TextInputProps {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    isPassword?: boolean;
    containerClassName?: string;
}

export const FptInput: React.FC<FptInputProps> = ({
    label,
    error,
    icon,
    isPassword = false,
    containerClassName = '',
    secureTextEntry,
    onFocus,
    onBlur,
    accessibilityLabel,
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View className={`mb-4 w-full ${containerClassName}`}>
            {label && (
                <Text className="mb-1.5 text-sm font-medium text-gray-700">
                    {label}
                </Text>
            )}
            <View
                className={`flex-row items-center min-h-[52px] rounded-2xl border bg-slate-50 px-4 py-3 ${
                    error
                        ? 'border-red-500 bg-red-50/20'
                        : isFocused
                        ? 'border-fpt-orange'
                        : 'border-gray-200'
                }`}
            >
                {icon && <View className="mr-2.5">{icon}</View>}
                <TextInput
                    className="flex-1 text-base text-gray-900"
                    placeholderTextColor="#A0AEC0"
                    secureTextEntry={isPassword ? !showPassword : secureTextEntry}
                    accessibilityLabel={accessibilityLabel || label || props.placeholder}
                    onFocus={(event) => { setIsFocused(true); onFocus?.(event); }}
                    onBlur={(event) => { setIsFocused(false); onBlur?.(event); }}
                    {...props}
                />
                {isPassword && (
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setShowPassword(!showPassword)}
                        accessibilityRole="button"
                        accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        className="min-h-[44px] min-w-[44px] items-center justify-center"
                    >
                        <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color="#718096"
                        />
                    </TouchableOpacity>
                )}
            </View>
            {error ? (
                <Text className="mt-1 text-xs text-red-500">{error}</Text>
            ) : null}
        </View>
    );
};

export default FptInput;
