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

interface AccessTokenResponse {
    access_token: string;
}

const mutex = new Mutex();
const NO_RETRY_HEADER = 'x-no-retry';

const instance = axios.create({
    baseURL: BACKEND_URL,
    timeout: 15000,
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

        if (
            error.response &&
            error.response.status === 401 &&
            originalRequest &&
            !originalRequest.url?.includes('/auth/login') &&
            !originalRequest[NO_RETRY_HEADER]
        ) {
            originalRequest[NO_RETRY_HEADER] = true;

            return await mutex.runExclusive(async () => {
                try {
                    const currentRefreshToken = await getRefreshToken();
                    if (!currentRefreshToken) {
                        await clearAuthStorage();
                        return Promise.reject(error?.response?.data ?? error);
                    }

                    // Gọi endpoint refresh với Cookie header thủ công để tương thích NestJS backend
                    const refreshRes = await axios.get<IBackendRes<AccessTokenResponse>>(
                        `${BACKEND_URL}/auth/refresh`,
                        {
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
                } catch (refreshErr) {
                    await clearAuthStorage();
                    return Promise.reject(refreshErr);
                }
            });
        }

        return Promise.reject(error?.response?.data ?? error);
    }
);

export default instance;
