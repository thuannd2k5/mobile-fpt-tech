import { Stack } from 'expo-router';

export default function StudentLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="course/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="class/[id]" options={{ presentation: 'card' }} />
        </Stack>
    );
}
