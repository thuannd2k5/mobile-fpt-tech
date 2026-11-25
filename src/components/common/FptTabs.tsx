import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabItem = { name: string; title: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap };

export default function FptTabs({ items }: { items: TabItem[] }) {
    const insets = useSafeAreaInsets();
    return (
        <Tabs screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#E35B1A',
            tabBarInactiveTintColor: '#64748B',
            tabBarStyle: {
                backgroundColor: '#FFFFFF', borderTopColor: '#E2E8F0',
                height: 62 + Math.max(insets.bottom, 10),
                paddingBottom: Math.max(insets.bottom, 10), paddingTop: 8,
            },
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
            tabBarHideOnKeyboard: true,
        }}>
            {items.map(({ name, title, icon, activeIcon }) => (
                <Tabs.Screen key={name} name={name} options={{
                    title,
                    tabBarIcon: ({ focused, color }) => <Ionicons name={focused ? activeIcon : icon} color={color as string} size={23} />,
                }} />
            ))}
        </Tabs>
    );
}
