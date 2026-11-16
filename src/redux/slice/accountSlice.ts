import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { callFetchAccount } from '@/api';
import { clearAuthStorage, setUserId } from '@/utils/storage';

export const fetchAccount = createAsyncThunk(
    'account/fetchAccount',
    async (_, { rejectWithValue }) => {
        try {
            const res = await callFetchAccount();
            if (res && res.data) {
                return res.data;
            }
            return rejectWithValue('Không thể tải thông tin tài khoản');
        } catch (error: any) {
            return rejectWithValue(error?.message || 'Lỗi kết nối tài khoản');
        }
    }
);

interface UserState {
    _id: string;
    email: string;
    name: string;
    phone?: string;
    age?: number;
    gender?: string;
    address?: string;
    role: {
        _id: string;
        name: string;
    };
    permissions: {
        _id: string;
        name: string;
        path: string;
        method: string;
        module: string;
    }[];
}

interface AccountState {
    isAuthenticated: boolean;
    isLoading: boolean;
    isRefreshToken: boolean;
    errorRefreshToken: string;
    user: UserState;
}

const initialUser: UserState = {
    _id: '',
    email: '',
    name: '',
    phone: '',
    age: 0,
    gender: '',
    address: '',
    role: {
        _id: '',
        name: '',
    },
    permissions: [],
};

const initialState: AccountState = {
    isAuthenticated: false,
    isLoading: true,
    isRefreshToken: false,
    errorRefreshToken: '',
    user: initialUser,
};

export const accountSlice = createSlice({
    name: 'account',
    initialState,
    reducers: {
        setUserLoginInfo: (state, action: PayloadAction<any>) => {
            state.isAuthenticated = true;
            state.isLoading = false;
            state.user = {
                _id: action.payload?._id || '',
                email: action.payload?.email || '',
                name: action.payload?.name || '',
                phone: action.payload?.phone || '',
                age: action.payload?.age || 0,
                gender: action.payload?.gender || '',
                address: action.payload?.address || '',
                role: action.payload?.role || { _id: '', name: '' },
                permissions: action.payload?.permissions || [],
            };
            if (action.payload?._id) {
                setUserId(action.payload._id).catch(() => {});
            }
        },
        setLogoutAction: (state) => {
            clearAuthStorage().catch(() => {});
            state.isAuthenticated = false;
            state.isLoading = false;
            state.user = initialUser;
        },
        setProfileAction: (state, action: PayloadAction<Partial<UserState>>) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            }
        },
        setRefreshTokenAction: (
            state,
            action: PayloadAction<{ status: boolean; message?: string }>
        ) => {
            state.isRefreshToken = action.payload.status;
            state.errorRefreshToken = action.payload.message || '';
        },
        setLoadingAction: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAccount.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchAccount.fulfilled, (state, action: any) => {
                state.isLoading = false;
                if (action.payload && action.payload.user) {
                    state.isAuthenticated = true;
                    state.user = {
                        _id: action.payload.user._id || '',
                        email: action.payload.user.email || '',
                        name: action.payload.user.name || '',
                        phone: action.payload.user.phone || '',
                        age: action.payload.user.age || 0,
                        gender: action.payload.user.gender || '',
                        address: action.payload.user.address || '',
                        role: action.payload.user.role || { _id: '', name: '' },
                        permissions: action.payload.user.permissions || [],
                    };
                    if (action.payload.user._id) {
                        setUserId(action.payload.user._id).catch(() => {});
                    }
                }
            })
            .addCase(fetchAccount.rejected, (state) => {
                state.isLoading = false;
                state.isAuthenticated = false;
                state.user = initialUser;
            });
    },
});

export const {
    setUserLoginInfo,
    setLogoutAction,
    setProfileAction,
    setRefreshTokenAction,
    setLoadingAction,
} = accountSlice.actions;

export default accountSlice.reducer;
