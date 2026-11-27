import React from 'react';
import { Text } from 'react-native';
import { RoleScreen } from '@/components/common/RoleScreen';
export default function UnsupportedRole() {
    return (
        <RoleScreen
            eyebrow="Tài khoản"
            title="Vai trò chưa được cấu hình"
            subtitle="Vui lòng liên hệ quản trị viên để được cấp vai trò phù hợp."
        >
            <Text className="text-sm leading-6 text-slate-600">
                Bạn có thể đăng xuất để sử dụng tài khoản khác.
            </Text>
        </RoleScreen>
    );
}
