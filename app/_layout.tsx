import React from 'react';
import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from '@/redux/store';
import '../global.css';

export default function RootLayout() {
    return (
        <Provider store={store}>
            <SafeAreaProvider>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="splash" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(student)" />
                    <Stack.Screen name="(teacher)" />
                    <Stack.Screen name="(consultant)" />
                    <Stack.Screen name="admin" />
                    <Stack.Screen name="(common)" />
                </Stack>
            </SafeAreaProvider>
        </Provider>
    );
}
