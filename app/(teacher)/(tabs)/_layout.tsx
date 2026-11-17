import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function TeacherTabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#0050B3', // Teacher uses FPT Blue accent
                tabBarInactiveTintColor: '#8C8C8C',
                tabBarStyle: {
                    backgroundColor: '#FFFFFF',
                    borderTopColor: '#F0F0F0',
                    borderTopWidth: 1,
                    height: Platform.OS === 'ios' ? 88 : 64,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
                    paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Lịch dạy',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="calendar-outline" size={size} color={color as string} />
                    ),
                }}
            />
            <Tabs.Screen
                name="classes"
                options={{
                    title: 'Lớp học',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="school-outline" size={size} color={color as string} />
                    ),
                }}
            />
            <Tabs.Screen
                name="chat"
                options={{
                    title: 'Tin nhắn',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="chatbubbles-outline" size={size} color={color as string} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Cá nhân',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color as string} />
                    ),
                }}
            />
        </Tabs>
    );
}
