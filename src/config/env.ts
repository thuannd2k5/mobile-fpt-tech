import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getFallbackBackendUrl = () => {
    // Nếu chạy Android Emulator
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:8000/api/v1';
    }
    // Mặc định LAN IP máy chủ cho iOS Expo Go
    return 'http://192.168.1.7:8000/api/v1';
};

export const BACKEND_URL =
    process.env.EXPO_PUBLIC_BACKEND_URL ||
    Constants.expoConfig?.extra?.backendUrl ||
    getFallbackBackendUrl();

export default {
    BACKEND_URL,
};
