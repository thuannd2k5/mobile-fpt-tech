import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { fetchManagerClasses, fetchPendingTeachers, managerErrorMessage } from '@/api/manager';
import { RoleHero, RoleScreen, RoleSection, RoleStat, RoleTile } from '@/components/common/RoleScreen';
import { FptButton } from '@/components/common/FptButton';
import FptErrorBanner from '@/components/common/FptErrorBanner';
import { useAppSelector } from '@/redux/hooks';
import { canUse } from '@/utils/permissions';

export default function ManagerDashboard() {
    const router = useRouter();
    const permissions = useAppSelector((state) => state.account.user.permissions);
    const [counts, setCounts] = useState<{ classes: number; pending: number }>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [classes, pending] = await Promise.all([fetchManagerClasses(1, 'OPEN'), fetchPendingTeachers(1, 1)]);
            setCounts({ classes: classes.meta.total, pending: pending.meta.total });
        } catch (err) { setError(managerErrorMessage(err)); }
        finally { setLoading(false); }
    }, []);
    useFocusEffect(useCallback(() => { void load(); }, [load]));

    return <RoleScreen eyebrow="Quản lý đào tạo" title="Điều hành đào tạo" subtitle="Nhìn rõ việc cần xử lý" refreshing={loading} onRefresh={() => void load()}>
        <RoleHero eyebrow="Academic operations" title="Sẵn sàng cho lớp mới" description="Theo dõi lớp học và kết nối đội ngũ giảng viên." />
        {error ? <FptErrorBanner message={error} onRetry={() => void load()} /> : null}
        <View className="flex-row">
            <RoleStat label="Lớp đang mở" value={counts?.classes ?? '—'} />
            <RoleStat label="Hồ sơ chờ duyệt" value={counts?.pending ?? '—'} />
        </View>
        <RoleSection title="Cần bạn xử lý">
            <RoleTile title="Duyệt giảng viên mới" subtitle={counts ? `${counts.pending} hồ sơ đang chờ phản hồi` : 'Xem hồ sơ đăng ký giảng dạy'} icon="person-add-outline" onPress={() => router.push('/(manager)/(tabs)/teachers' as never)} />
            <RoleTile title="Quản lý lớp học" subtitle="Khóa học, giảng viên và thông tin lớp" icon="school-outline" onPress={() => router.push('/(manager)/(tabs)/classes' as never)} />
        </RoleSection>
        {canUse(permissions, 'POST', '/api/v1/classrooms')
            ? <FptButton title="Tạo lớp học" onPress={() => router.push('/(manager)/class/create' as never)} />
            : <Text className="text-sm leading-6 text-slate-500">Tài khoản cần quyền tạo lớp để mở lớp học mới.</Text>}
    </RoleScreen>;
}
