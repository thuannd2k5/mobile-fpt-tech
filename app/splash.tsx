import React from 'react';
import { Redirect } from 'expo-router';
import { useAppSelector } from '@/redux/hooks';
import { getDefaultRouteForRole } from '@/types/portal';

export default function SplashScreen() {
    const { isAuthenticated, user } = useAppSelector((state) => state.account);
    return <Redirect href={(isAuthenticated ? getDefaultRouteForRole(user.role?.name) : '/(auth)/login') as never} />;
}
