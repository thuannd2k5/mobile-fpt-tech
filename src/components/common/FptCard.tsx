import React from 'react';
import { View, ViewProps, TouchableOpacity } from 'react-native';

export interface FptCardProps extends ViewProps {
    children: React.ReactNode;
    onPress?: () => void;
    className?: string;
}

export const FptCard: React.FC<FptCardProps> = ({
    children,
    onPress,
    className = '',
    style,
    ...props
}) => {
    const cardContent = (
        <View
            className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ${className}`}
            style={[
                {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 6,
                    elevation: 2,
                },
                style,
            ]}
            {...props}
        >
            {children}
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
                {cardContent}
            </TouchableOpacity>
        );
    }

    return cardContent;
};

export default FptCard;
