import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setProfileAction } from '@/redux/slice/accountSlice';
import { callUpdateMyProfile } from '@/api';
import { getRoleLabel } from '@/types/portal';
import {
    RoleScreen,
    RoleHero,
    RoleSection,
    RoleTile,
} from '@/components/common/RoleScreen';
import { FptInput, FptButton } from '@/components/common';
export default function AccountProfile() {
    const router = useRouter(),
        dispatch = useAppDispatch();
    const { user } = useAppSelector((s) => s.account);
    const [name, setName] = useState(user.name),
        [busy, setBusy] = useState(false),
        [message, setMessage] = useState('');
    const save = async () => {
        if (!name.trim()) {
            setMessage('Vui lòng nhập họ tên.');
            return;
        }
        setBusy(true);
        setMessage('');
        try {
            await callUpdateMyProfile({ name: name.trim() });
            dispatch(setProfileAction({ name: name.trim() }));
            setMessage('Đã cập nhật tên hiển thị.');
        } catch {
            setMessage('Không cập nhật được thông tin. Vui lòng thử lại.');
        } finally {
            setBusy(false);
        }
    };
    return (
        <RoleScreen
            eyebrow={getRoleLabel(user.role?.name)}
            title="Tài khoản của tôi"
            subtitle="Quản lý thông tin cá nhân và bảo mật."
        >
            <RoleHero
                eyebrow={getRoleLabel(user.role?.name)}
                title={user.name || 'Tài khoản FPT'}
                description={user.email}
            />
            <RoleSection title="Thông tin cá nhân">
                <View className="rounded-2xl border border-slate-200 bg-white p-5">
                    <FptInput
                        label="Tên hiển thị"
                        value={name}
                        onChangeText={setName}
                    />
                    <Text className="mb-4 text-sm text-slate-500">
                        Vai trò: {getRoleLabel(user.role?.name)}
                    </Text>
                    {message ? (
                        <Text
                            accessibilityRole="alert"
                            className="mb-4 text-sm leading-5 text-fpt-blue"
                        >
                            {message}
                        </Text>
                    ) : null}
                    <FptButton
                        title="Lưu thông tin"
                        onPress={save}
                        loading={busy}
                    />
                </View>
            </RoleSection>
            <RoleSection title="Bảo mật">
                <RoleTile
                    icon="lock-closed-outline"
                    title="Đổi mật khẩu"
                    subtitle="Cập nhật mật khẩu đăng nhập"
                    onPress={() =>
                        router.push('/(common)/change-password' as never)
                    }
                />
            </RoleSection>
        </RoleScreen>
    );
}
