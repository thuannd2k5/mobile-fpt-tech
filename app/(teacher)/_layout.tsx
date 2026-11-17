import { Stack } from 'expo-router';

export default function TeacherLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="class-detail/[id]" options={{ presentation: 'card' }} />
        </Stack>
    );
}
