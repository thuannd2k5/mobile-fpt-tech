import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'fpt_access_token';
const REFRESH_TOKEN_KEY = 'fpt_refresh_token';
const USER_ID_KEY = 'fpt_user_id';

const isSecureStoreAvailable = Platform.OS !== 'web';

const setItem = async (key: string, value: string): Promise<void> => {
    try {
        if (isSecureStoreAvailable) {
            await SecureStore.setItemAsync(key, value);
        } else {
            await AsyncStorage.setItem(key, value);
        }
    } catch {
        await AsyncStorage.setItem(key, value);
    }
};

const getItem = async (key: string): Promise<string | null> => {
    try {
        if (isSecureStoreAvailable) {
            return await SecureStore.getItemAsync(key);
        }
        return await AsyncStorage.getItem(key);
    } catch {
        return await AsyncStorage.getItem(key);
    }
};

const deleteItem = async (key: string): Promise<void> => {
    try {
        if (isSecureStoreAvailable) {
            await SecureStore.deleteItemAsync(key);
        } else {
            await AsyncStorage.removeItem(key);
        }
    } catch {
        await AsyncStorage.removeItem(key);
    }
};

export const getAccessToken = () => getItem(ACCESS_TOKEN_KEY);
export const setAccessToken = (token: string) => setItem(ACCESS_TOKEN_KEY, token);

export const getRefreshToken = () => getItem(REFRESH_TOKEN_KEY);
export const setRefreshToken = (token: string) => setItem(REFRESH_TOKEN_KEY, token);

export const getUserId = () => getItem(USER_ID_KEY);
export const setUserId = (id: string) => setItem(USER_ID_KEY, id);

export const clearAuthStorage = async () => {
    await Promise.all([
        deleteItem(ACCESS_TOKEN_KEY),
        deleteItem(REFRESH_TOKEN_KEY),
        deleteItem(USER_ID_KEY),
    ]);
};

export default {
    getAccessToken,
    setAccessToken,
    getRefreshToken,
    setRefreshToken,
    getUserId,
    setUserId,
    clearAuthStorage,
};
