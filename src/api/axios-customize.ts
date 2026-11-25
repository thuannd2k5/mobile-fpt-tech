import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Mutex } from 'async-mutex';
import { BACKEND_URL } from '@/config/env';
import {
    getAccessToken,
    setAccessToken,
    getRefreshToken,
    setRefreshToken,
    clearAuthStorage,
} from '@/utils/storage';
import { IBackendRes } from '@/types/backend';
import { notifySessionExpired } from '@/utils/session';

interface AccessTokenResponse {
    access_token: string;
}

const mutex = new Mutex();
const NO_RETRY_HEADER = 'x-no-retry';
const expireSession = async () => {
    try {
        await clearAuthStorage();
    } finally {
        notifySessionExpired();
    }
};

const instance = axios.create({
    baseURL: BACKEND_URL,
    timeout: 15000,
    // Required for the web build to persist the backend's HttpOnly refresh cookie.
    withCredentials: true,
});

instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const token = await getAccessToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        if (!config.headers.Accept) {
            config.headers.Accept = 'application/json';
        }
        if (!config.headers['Content-Type']) {
            config.headers['Content-Type'] = 'application/json; charset=utf-8';
        }
        return config;
    },
    (error) => Promise.reject(error)
);

instance.interceptors.response.use(
    async (response) => {
        // Trích xuất refresh_token từ header set-cookie nếu có
        try {
            const rawSetCookie = response.headers?.['set-cookie'];
            if (rawSetCookie) {
                const cookieStr = Array.isArray(rawSetCookie) ? rawSetCookie.join(';') : String(rawSetCookie);
                const match = cookieStr.match(/refresh_token=([^;]+)/);
                if (match && match[1]) {
                    await setRefreshToken(match[1]);
                }
            }
        } catch {
            // bỏ qua nếu lỗi parse cookie
        }
        return response.data;
    },
    async (error: AxiosError<any>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { [NO_RETRY_HEADER]?: boolean };

        if (error.response?.status === 401 && originalRequest?.[NO_RETRY_HEADER]) {
            await expireSession();
            return Promise.reject(error.response.data);
        }

        if (
            error.response &&
            error.response.status === 401 &&
            originalRequest &&
            !originalRequest.url?.includes('/auth/login') &&
            !originalRequest.url?.includes('/auth/register') &&
            !originalRequest.url?.includes('/auth/refresh') &&
            !originalRequest[NO_RETRY_HEADER]
        ) {
            originalRequest[NO_RETRY_HEADER] = true;

            return await mutex.runExclusive(async () => {
                try {
                    // Another failed request may already have refreshed this token.
                    const latestToken = await getAccessToken();
                    if (latestToken && originalRequest.headers.Authorization !== `Bearer ${latestToken}`) {
                        originalRequest.headers.Authorization = `Bearer ${latestToken}`;
                        return instance.request(originalRequest);
                    }
                    const currentRefreshToken = await getRefreshToken();
                    if (!currentRefreshToken) {
                        await expireSession();
                        return Promise.reject(error?.response?.data ?? error);
                    }

                    // Gọi endpoint refresh với Cookie header thủ công để tương thích NestJS backend
                    const refreshRes = await axios.get<IBackendRes<AccessTokenResponse>>(
                        `${BACKEND_URL}/auth/refresh`,
                        {
                            timeout: 15000,
                            withCredentials: true,
                            headers: {
                                Cookie: `refresh_token=${currentRefreshToken}`,
                            },
                        }
                    );

                    const newAccessToken = refreshRes?.data?.data?.access_token;
                    if (newAccessToken) {
                        await setAccessToken(newAccessToken);

                        // Cập nhật lại refresh_token mới nếu backend set-cookie lại
                        const newSetCookie = refreshRes.headers?.['set-cookie'];
                        if (newSetCookie) {
                            const cookieStr = Array.isArray(newSetCookie) ? newSetCookie.join(';') : String(newSetCookie);
                            const match = cookieStr.match(/refresh_token=([^;]+)/);
                            if (match && match[1]) {
                                await setRefreshToken(match[1]);
                            }
                        }

                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                        }
                        return instance.request(originalRequest);
                    }
                    await expireSession();
                    return Promise.reject(refreshRes.data);
                } catch (refreshErr) {
                    await expireSession();
                    return Promise.reject(refreshErr);
                }
            });
        }

        return Promise.reject(error?.response?.data ?? error);
    }
);

export default instance;
