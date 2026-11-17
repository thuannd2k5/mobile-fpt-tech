import { Stack } from 'expo-router';

export default function CommonLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="chat" />
            <Stack.Screen name="chat-room/[id]" />
            <Stack.Screen name="change-password" />
        </Stack>
    );
}
