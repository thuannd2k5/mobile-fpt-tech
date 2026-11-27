import React, { useCallback, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { fetchManagerClasses, managerErrorMessage } from '@/api/manager';
import { IClassroomWithDetails, IModelPaginate } from '@/types/backend';
import { RoleScreen, RoleTile } from '@/components/common/RoleScreen';
import { FptButton } from '@/components/common/FptButton';
import { FptEmptyState } from '@/components/common/FptEmptyState';
import FptErrorBanner from '@/components/common/FptErrorBanner';
import { FptLoading } from '@/components/common/FptLoading';
import { useAppSelector } from '@/redux/hooks';
import { canUse } from '@/utils/permissions';

const statuses = [{ value: '', label: 'Tất cả' }, { value: 'OPEN', label: 'Đang mở' }, { value: 'FULL', label: 'Đủ sĩ số' }, { value: 'COMPLETED', label: 'Hoàn thành' }, { value: 'CANCELLED', label: 'Đã hủy' }];

export default function ManagerClasses() {
    const router = useRouter();
    const permissions = useAppSelector((state) => state.account.user.permissions);
    const [data, setData] = useState<IModelPaginate<IClassroomWithDetails>>();
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState<IClassroomWithDetails>();
    const load = useCallback(async () => {
        setLoading(true); setError('');
        try { setData(await fetchManagerClasses(page, status)); }
        catch (err) { setError(managerErrorMessage(err)); }
        finally { setLoading(false); }
    }, [page, status]);
    useFocusEffect(useCallback(() => { void load(); }, [load]));

    return <RoleScreen eyebrow="Quản lý đào tạo" title={selected ? selected.class_name || 'Thông tin lớp' : 'Lớp học'} subtitle={selected ? 'Thông tin lớp và người phụ trách' : 'Tổ chức lớp và phân công giảng viên'} refreshing={loading} onRefresh={() => { setSelected(undefined); void load(); }}>
        {selected ? <>
            <FptButton title="Quay lại danh sách" variant="ghost" onPress={() => setSelected(undefined)} className="mb-4" />
            <RoleTile title="Khóa học" subtitle={selected.course_id?.name || 'Chưa có thông tin'} icon="book-outline" />
            <RoleTile title="Giảng viên" subtitle={selected.teacher_id?.name || 'Chưa phân công'} icon="person-outline" />
            {selected.teacher_id?.email ? <RoleTile title="Email giảng viên" subtitle={selected.teacher_id.email} icon="mail-outline" /> : null}
            <RoleTile title="Phòng học" subtitle={selected.room || 'Chưa cập nhật'} icon="location-outline" />
            <RoleTile title="Khung giờ" subtitle={`${selected.start_time || '—'} – ${selected.end_time || '—'}`} icon="time-outline" />
            <RoleTile title="Sĩ số tối đa" subtitle={String(selected.max_student ?? 'Chưa cập nhật')} icon="people-outline" />
            <RoleTile title="Trạng thái" subtitle={statuses.find((item) => item.value === selected.status)?.label || selected.status || 'Chưa cập nhật'} icon="information-circle-outline" />
        </> : <>
            {canUse(permissions, 'POST', '/api/v1/classrooms') ? <FptButton title="Tạo lớp học" className="mb-5" onPress={() => router.push('/(manager)/class/create' as never)} /> : null}
            <View className="mb-4 flex-row flex-wrap">{statuses.map((item) => <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: status === item.value }} key={item.value} onPress={() => { setStatus(item.value); setPage(1); setData(undefined); }} className={`mb-2 mr-2 min-h-[44px] justify-center rounded-full px-4 ${status === item.value ? 'bg-fpt-blue' : 'border border-slate-200 bg-white'}`}><Text className={`text-xs font-semibold ${status === item.value ? 'text-white' : 'text-slate-600'}`}>{item.label}</Text></TouchableOpacity>)}</View>
            {error ? <FptErrorBanner message={error} onRetry={() => void load()} /> : null}
            {loading ? <FptLoading message="Đang tải lớp học..." /> : !error && !data?.result.length ? <FptEmptyState title="Chưa có lớp học" description="Danh sách lớp sẽ xuất hiện khi có lớp phù hợp với bộ lọc." /> : null}
            {!loading && data?.result.map((item) => <RoleTile key={item._id} title={item.class_name || 'Lớp học'} subtitle={`${item.course_id?.name || 'Chưa có khóa học'}\n${item.teacher_id?.name || 'Chưa phân công'} • ${item.room || 'Chưa có phòng'}`} icon="school-outline" onPress={() => setSelected(item)} />)}
            {data && data.meta.pages > 1 ? <View className="mt-3 flex-row items-center justify-between"><FptButton title="Trước" size="sm" variant="outline" disabled={page <= 1 || loading} onPress={() => setPage(page - 1)} /><Text className="text-xs text-slate-500">{page} / {data.meta.pages}</Text><FptButton title="Sau" size="sm" variant="outline" disabled={page >= data.meta.pages || loading} onPress={() => setPage(page + 1)} /></View> : null}
        </>}
    </RoleScreen>;
}
