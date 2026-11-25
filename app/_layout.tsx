import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from '@/redux/store';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchAccount, setLoadingAction, setLogoutAction } from '@/redux/slice/accountSlice';
import { getAccessToken } from '@/utils/storage';
import { onSessionExpired } from '@/utils/session';
import { getDefaultRouteForRole } from '@/types/portal';
import { FptLoading } from '@/components/common';
import '../global.css';

function RootNavigator() {
    const dispatch = useAppDispatch();
    const { isAuthenticated, isLoading, user } = useAppSelector((state) => state.account);

    useEffect(() => {
        const unsubscribe = onSessionExpired(() => dispatch(setLogoutAction()));
        const restoreSession = async () => {
            try {
                if (await getAccessToken()) {
                    await dispatch(fetchAccount());
                } else {
                    dispatch(setLoadingAction(false));
                }
            } catch {
                dispatch(setLogoutAction());
            }
        };
        void restoreSession();
        return unsubscribe;
    }, [dispatch]);

    if (isLoading) return <FptLoading message="Đang kết nối không gian học tập..." />;
    const destination = getDefaultRouteForRole(user.role?.name);
    const fallback = (isAuthenticated ? destination : '/(auth)/login') as never;

    return (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F4F6FA' } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="splash" />
            <Stack.Protected guard={!isAuthenticated} redirectTo={destination as never}>
                <Stack.Screen name="(auth)" />
            </Stack.Protected>
            <Stack.Protected guard={isAuthenticated && destination === '/(student)'} redirectTo={fallback}>
                <Stack.Screen name="(student)" />
            </Stack.Protected>
            <Stack.Protected guard={isAuthenticated && destination === '/(teacher)'} redirectTo={fallback}>
                <Stack.Screen name="(teacher)" />
            </Stack.Protected>
            <Stack.Protected guard={isAuthenticated && destination === '/(consultant)'} redirectTo={fallback}>
                <Stack.Screen name="(consultant)" />
            </Stack.Protected>
            <Stack.Protected guard={isAuthenticated && destination === '/admin'} redirectTo={fallback}>
                <Stack.Screen name="admin" />
            </Stack.Protected>
            <Stack.Protected guard={isAuthenticated} redirectTo="/(auth)/login">
                <Stack.Screen name="(common)" />
            </Stack.Protected>
        </Stack>
    );
}

export default function RootLayout() {
    return (
        <Provider store={store}>
            <SafeAreaProvider>
                <RootNavigator />
            </SafeAreaProvider>
        </Provider>
    );
}
