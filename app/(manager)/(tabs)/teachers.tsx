import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { fetchPendingTeachers, ManagerTeacher, managerErrorMessage, reviewManagerTeacher } from '@/api/manager';
import { IModelPaginate } from '@/types/backend';
import { RoleHero, RoleScreen, RoleSection, RoleTile } from '@/components/common/RoleScreen';
import { FptButton } from '@/components/common/FptButton';
import { FptEmptyState } from '@/components/common/FptEmptyState';
import FptErrorBanner from '@/components/common/FptErrorBanner';
import { FptLoading } from '@/components/common/FptLoading';

export default function ManagerTeachers() {
    const [data, setData] = useState<IModelPaginate<ManagerTeacher>>();
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<ManagerTeacher>();
    const [confirmation, setConfirmation] = useState<'approve' | 'reject'>();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const load = useCallback(async () => {
        setLoading(true); setError('');
        try { setData(await fetchPendingTeachers(page)); }
        catch (err) { setError(managerErrorMessage(err)); }
        finally { setLoading(false); }
    }, [page]);
    useFocusEffect(useCallback(() => { void load(); }, [load]));

    const review = async () => {
        if (!selected || !confirmation || saving) return;
        setSaving(true); setError('');
        try {
            await reviewManagerTeacher(selected._id, confirmation);
            setSuccess(confirmation === 'approve' ? `Đã phê duyệt hồ sơ ${selected.name}.` : `Đã từ chối hồ sơ ${selected.name}.`);
            setSelected(undefined); setConfirmation(undefined);
            if (data?.result.length === 1 && page > 1) setPage(page - 1);
            else await load();
        } catch (err) { setError(managerErrorMessage(err, 'Không thể cập nhật hồ sơ. Vui lòng thử lại.')); }
        finally { setSaving(false); }
    };

    return <RoleScreen eyebrow="Quản lý đào tạo" title="Duyệt giảng viên" subtitle={selected ? 'Xem thông tin trước khi quyết định' : 'Hồ sơ đăng ký đang chờ'} refreshing={loading} onRefresh={() => { if (!saving) { setSelected(undefined); setConfirmation(undefined); void load(); } }}>
        {success ? <View accessibilityRole="alert" className="mb-4 rounded-2xl bg-emerald-50 p-4"><Text className="text-sm leading-6 text-emerald-800">{success}</Text></View> : null}
        {error ? <FptErrorBanner message={error} onRetry={() => { setError(''); if (!selected) void load(); }} /> : null}
        {selected ? <>
            <FptButton title="Quay lại hồ sơ chờ duyệt" variant="ghost" disabled={saving} className="mb-4" onPress={() => { setSelected(undefined); setConfirmation(undefined); setError(''); }} />
            <RoleHero eyebrow="Academic operations" title={selected.full_name || selected.name} description={`${selected.subject || 'Chưa cập nhật chuyên môn'} • Hồ sơ chờ duyệt`} />
            <RoleSection title="Thông tin đăng ký">
                <RoleTile title="Chuyên môn" subtitle={selected.subject || 'Chưa cập nhật'} icon="school-outline" />
                <RoleTile title="Kinh nghiệm" subtitle={selected.experience_years == null ? 'Chưa cập nhật' : `${selected.experience_years} năm`} icon="briefcase-outline" />
                <RoleTile title="Email" subtitle={selected.email || 'Chưa cập nhật'} icon="mail-outline" />
                <RoleTile title="Điện thoại" subtitle={selected.phone || 'Chưa cập nhật'} icon="call-outline" />
                {selected.address ? <RoleTile title="Địa chỉ" subtitle={selected.address} icon="location-outline" /> : null}
            </RoleSection>
            {confirmation ? <View className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
                <Text className="mb-4 text-sm leading-6 text-slate-800">{confirmation === 'approve' ? `Phê duyệt ${selected.name} trở thành giảng viên?` : `Từ chối hồ sơ đăng ký của ${selected.name}?`}</Text>
                <FptButton title={confirmation === 'approve' ? 'Xác nhận phê duyệt' : 'Xác nhận từ chối'} variant={confirmation === 'approve' ? 'primary' : 'danger'} loading={saving} disabled={saving} onPress={() => void review()} />
                <FptButton title="Hủy" variant="ghost" disabled={saving} onPress={() => setConfirmation(undefined)} />
            </View> : <>
                <FptButton title="Phê duyệt hồ sơ" onPress={() => setConfirmation('approve')} />
                <FptButton title="Từ chối hồ sơ" variant="ghost" className="mt-2" onPress={() => setConfirmation('reject')} />
            </>}
        </> : <>
            {loading ? <FptLoading message="Đang tải hồ sơ..." /> : !error && !data?.result.length ? <FptEmptyState title="Đã xử lý hết hồ sơ" description="Không có hồ sơ giảng viên nào đang chờ phê duyệt." icon="checkmark-circle-outline" /> : null}
            {!loading && data?.result.map((teacher) => <RoleTile key={teacher._id} title={teacher.full_name || teacher.name} subtitle={`${teacher.subject || 'Chưa cập nhật chuyên môn'}\n${teacher.email || ''}`} icon="person-outline" onPress={() => { setSelected(teacher); setConfirmation(undefined); setSuccess(''); }} />)}
            {data && data.meta.pages > 1 ? <View className="mt-3 flex-row items-center justify-between"><FptButton title="Trước" size="sm" variant="outline" disabled={page <= 1 || loading} onPress={() => setPage(page - 1)} /><Text className="text-xs text-slate-500">{page} / {data.meta.pages}</Text><FptButton title="Sau" size="sm" variant="outline" disabled={page >= data.meta.pages || loading} onPress={() => setPage(page + 1)} /></View> : null}
        </>}
    </RoleScreen>;
}
