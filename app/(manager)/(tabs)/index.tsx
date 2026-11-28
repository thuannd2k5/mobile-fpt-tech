import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { fetchManagerClasses, fetchManagerCourses, managerErrorMessage } from '@/api/manager';
import { RoleHero, RoleScreen, RoleSection, RoleStat, RoleTile } from '@/components/common/RoleScreen';
import { FptButton } from '@/components/common/FptButton';
import FptErrorBanner from '@/components/common/FptErrorBanner';
import { useAppSelector } from '@/redux/hooks';
import { canUse } from '@/utils/permissions';

export default function ManagerDashboard() {
    const router = useRouter();
    const permissions = useAppSelector((state) => state.account.user.permissions);
    const canCreateClass = canUse(permissions, 'POST', '/api/v1/classrooms');
    const canCreateCourse = canUse(permissions, 'POST', '/api/v1/courses');
    const canEditClass = canUse(permissions, 'PATCH', '/api/v1/classrooms/:id');
    const canEditCourse = canUse(permissions, 'PATCH', '/api/v1/courses/:id');
    const [counts, setCounts] = useState<{ classes: number; courses: number }>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [classes, courses] = await Promise.all([
                fetchManagerClasses(1, 'OPEN'),
                fetchManagerCourses(1),
            ]);
            setCounts({
                classes: classes.meta.total,
                courses: courses.meta.total,
            });
        } catch (err) { setError(managerErrorMessage(err)); }
        finally { setLoading(false); }
    }, []);
    useFocusEffect(useCallback(() => { void load(); }, [load]));

    return <RoleScreen eyebrow="Quản lý đào tạo" title="Điều hành đào tạo" subtitle="Nhìn rõ việc cần xử lý" refreshing={loading} onRefresh={() => void load()}>
        <RoleHero eyebrow="Academic operations" title="Quản lý đào tạo" description="Theo dõi học viên, giảng viên, khóa học và lớp học." />
        {error ? <FptErrorBanner message={error} onRetry={() => void load()} /> : null}
        <View className="flex-row">
            <RoleStat label="Lớp đang mở" value={counts?.classes ?? '—'} />
            <RoleStat label="Khóa học" value={counts?.courses ?? '—'} />
        </View>
        <RoleSection title="Danh mục đào tạo">
            <RoleTile title="Quản lý học viên" subtitle="Tra cứu hồ sơ, cập nhật thông tin và trạng thái tài khoản" icon="person-outline" onPress={() => router.push('/(manager)/(tabs)/students' as never)} />
            <RoleTile title="Quản lý giảng viên" subtitle="Tra cứu hồ sơ giảng dạy và trạng thái tài khoản" icon="people-outline" onPress={() => router.push('/(manager)/(tabs)/teachers' as never)} />
            <RoleTile title="Quản lý khóa học" subtitle="Xem, thêm, chỉnh sửa và đóng/mở khóa học" icon="book-outline" onPress={() => router.push('/(manager)/(tabs)/courses' as never)} />
            <RoleTile title="Quản lý lớp học" subtitle="Xem, thêm, chỉnh sửa và đóng/mở lớp học" icon="school-outline" onPress={() => router.push('/(manager)/(tabs)/classes' as never)} />
        </RoleSection>
        {canCreateClass ? <FptButton title="Tạo lớp học" onPress={() => router.push('/(manager)/class/create' as never)} /> : null}
        {canCreateCourse ? <FptButton title="Tạo khóa học" variant="outline" className="mt-3" onPress={() => router.push('/(manager)/(tabs)/courses' as never)} /> : null}
        {!canCreateClass || !canEditClass || !canCreateCourse || !canEditCourse ? (
            <Text className="mt-3 text-sm leading-6 text-slate-500">
                Để thêm, chỉnh sửa và đóng/mở khóa học hoặc lớp học, vai trò Manager cần được cấp quyền POST và PATCH tương ứng trong phần Vai trò của Admin.
            </Text>
        ) : null}
    </RoleScreen>;
}
