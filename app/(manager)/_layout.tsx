import React from 'react';
import { Stack } from 'expo-router';

export default function ManagerLayout() {
    return <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="class/create" />
    </Stack>;
}
