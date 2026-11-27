import React from 'react';
import {
    ScrollView,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import FptLogoutButton from './FptLogoutButton';

export function RoleScreen({
    title,
    subtitle,
    eyebrow,
    children,
    refreshing = false,
    onRefresh,
}: {
    title: string;
    subtitle?: string;
    eyebrow: string;
    children: React.ReactNode;
    refreshing?: boolean;
    onRefresh?: () => void;
}) {
    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-fpt-grayBg">
            <ScrollView
                automaticallyAdjustKeyboardInsets
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ padding: 20, paddingBottom: 36 }}
                refreshControl={
                    onRefresh ? (
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#F26522"
                        />
                    ) : undefined
                }
            >
                <View className="mb-6 flex-row items-center justify-between">
                    <View className="flex-1 pr-3">
                        <Text className="text-sm font-extrabold tracking-widest text-fpt-orange">
                            FPT EDUCATION
                        </Text>
                        <Text className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            {eyebrow}
                        </Text>
                    </View>
                    <FptLogoutButton />
                </View>
                <Text className="text-2xl font-bold text-slate-900">
                    {title}
                </Text>
                {subtitle ? (
                    <Text className="mb-5 mt-2 text-sm leading-6 text-slate-500">
                        {subtitle}
                    </Text>
                ) : (
                    <View className="h-5" />
                )}
                {children}
            </ScrollView>
        </SafeAreaView>
    );
}

export function RoleHero({
    eyebrow,
    title,
    description,
}: {
    eyebrow: string;
    title: string;
    description?: string;
}) {
    return (
        <View className="mb-5 rounded-3xl bg-fpt-blue p-6">
            <Text className="text-[10px] font-bold uppercase tracking-widest text-blue-200">
                {eyebrow}
            </Text>
            <Text className="mt-3 text-2xl font-bold leading-9 text-white">
                {title}
            </Text>
            {description ? (
                <Text className="mt-3 text-sm leading-6 text-blue-100">
                    {description}
                </Text>
            ) : null}
        </View>
    );
}

export function RoleSection({
    title,
    children,
    action,
}: {
    title: string;
    children: React.ReactNode;
    action?: React.ReactNode;
}) {
    return (
        <View className="mb-5">
            <View className="mb-3 flex-row items-center justify-between">
                <Text className="flex-1 text-base font-bold text-slate-900">
                    {title}
                </Text>
                {action}
            </View>
            {children}
        </View>
    );
}

export function RoleTile({
    title,
    subtitle,
    icon = 'document-text-outline',
    onPress,
    trailing,
}: {
    title: string;
    subtitle?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    onPress?: () => void;
    trailing?: React.ReactNode;
}) {
    const content = (
        <>
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-orange-50">
                <Ionicons name={icon} size={22} color="#F26522" />
            </View>
            <View className="flex-1">
                <Text className="text-sm font-bold text-slate-900">
                    {title}
                </Text>
                {subtitle ? (
                    <Text className="mt-1 text-xs leading-5 text-slate-500">
                        {subtitle}
                    </Text>
                ) : null}
            </View>
            {trailing ||
                (onPress ? (
                    <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#94A3B8"
                    />
                ) : null)}
        </>
    );
    return onPress ? (
        <TouchableOpacity
            accessibilityRole="button"
            onPress={onPress}
            className="mb-3 min-h-[76px] flex-row items-center rounded-2xl border border-slate-200/70 bg-white p-4"
        >
            {content}
        </TouchableOpacity>
    ) : (
        <View className="mb-3 min-h-[76px] flex-row items-center rounded-2xl border border-slate-200/70 bg-white p-4">
            {content}
        </View>
    );
}

export function RoleStat({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) {
    return (
        <View className="mr-3 mb-4 flex-1 rounded-2xl border border-slate-200/70 bg-white p-4">
            <Text className="text-2xl font-bold text-slate-900">{value}</Text>
            <Text className="mt-2 text-xs text-slate-500">{label}</Text>
        </View>
    );
}
