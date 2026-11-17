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
            className={`rounded-3xl border border-slate-100 bg-white p-4 shadow-sm ${className}`}
            style={[
                {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 12,
                    elevation: 3,
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
