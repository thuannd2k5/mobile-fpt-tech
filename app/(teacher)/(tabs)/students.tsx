import React, { useCallback, useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { callFetchMyStudents } from '@/api';
import { IPortalEnrollment } from '@/types/backend';
import { FptBadge, FptEmptyState, FptInput, FptLoading } from '@/components/common';
import FptErrorBanner from '@/components/common/FptErrorBanner';
import { RoleScreen, RoleSection, RoleTile } from '@/components/common/RoleScreen';

export default function TeacherStudentsScreen() {
    const router = useRouter();
    const [students, setStudents] = useState<IPortalEnrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('ALL');
    const load = useCallback(async () => {
        setError('');
        try {
            const response = await callFetchMyStudents();
            if (!Array.isArray(response.data)) throw new Error('Invalid enrollments');
            setStudents(response.data);
        } catch { setError('Không thể tải học viên của bạn. Vui lòng thử lại.'); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);
    useEffect(() => { void load(); }, [load]);
    const filtered = students.filter(item => (status === 'ALL' || item.status === status) && [item.student_id?.name, item.student_id?.email, item.student_id?.phone, item.class_id?.class_name].some(value => value?.toLowerCase().includes(search.trim().toLowerCase())));
    return <RoleScreen eyebrow="GIẢNG VIÊN" title="Học viên của tôi" subtitle="Danh sách ghi danh từ các lớp bạn phụ trách" refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }}>
        {error ? <FptErrorBanner message={error} onRetry={() => { void load(); }} /> : null}
        <View className="mb-4 flex-row flex-wrap gap-2">{[['ALL', 'Tất cả'], ['STUDYING', 'Đang học'], ['WAITING_PAYMENT', 'Chờ học phí']].map(([value, label]) => <TouchableOpacity key={value} accessibilityRole="button" accessibilityState={{ selected: status === value }} onPress={() => setStatus(value)} className={`min-h-[44px] justify-center rounded-full px-4 ${status === value ? 'bg-slate-900' : 'bg-white'}`}><Text className={status === value ? 'text-white' : 'text-slate-600'}>{label}</Text></TouchableOpacity>)}</View>
        <FptInput placeholder="Tìm tên, email, số điện thoại hoặc lớp…" value={search} onChangeText={setSearch} />
        <RoleSection title="Học viên">
            {loading ? <FptLoading /> : filtered.map((item, index) => <RoleTile key={item._id || `${item.student_id?._id}-${index}`} title={item.student_id?.name || 'Học viên'} subtitle={[item.student_id?.email, item.class_id?.class_name].filter(Boolean).join('\n')} icon="person-outline" trailing={item.status ? <FptBadge status={item.status} size="sm" /> : undefined} onPress={item.class_id?._id ? () => router.push(`/(teacher)/class-detail/${item.class_id?._id}` as any) : undefined} />)}
            {!loading && !error && filtered.length === 0 ? <FptEmptyState title="Chưa có học viên phù hợp" description="Danh sách sẽ cập nhật khi có ghi danh trong lớp bạn phụ trách." icon="people-outline" /> : null}
        </RoleSection>
    </RoleScreen>;
}
