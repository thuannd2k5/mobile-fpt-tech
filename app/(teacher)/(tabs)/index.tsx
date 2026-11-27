import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppSelector } from '@/redux/hooks';
import { callFetchMyTeachingClassrooms } from '@/api';
import { IClassroomWithDetails } from '@/types/backend';
import { FptBadge, FptButton, FptEmptyState, FptInput, FptLoading } from '@/components/common';
import FptErrorBanner from '@/components/common/FptErrorBanner';
import { RoleHero, RoleScreen, RoleSection, RoleTile } from '@/components/common/RoleScreen';

export default function TeachingWorkspace() {
    const router = useRouter();
    const teacherId = useAppSelector(state => state.account.user._id);
    const [classes, setClasses] = useState<IClassroomWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const load = useCallback(async () => {
        setError('');
        try {
            if (!teacherId) throw new Error('Missing teacher');
            const response = await callFetchMyTeachingClassrooms(teacherId);
            if (!Array.isArray(response.data?.result)) throw new Error('Invalid classrooms');
            setClasses(response.data.result);
        } catch { setError('Không thể tải các lớp phụ trách. Vui lòng thử lại.'); }
        finally { setLoading(false); setRefreshing(false); }
    }, [teacherId]);
    useEffect(() => { void load(); }, [load]);
    const filtered = classes.filter(item => [item.class_name, item.course_id?.name, item.room].some(value => value?.toLowerCase().includes(search.trim().toLowerCase())));

    return <RoleScreen eyebrow="GIẢNG VIÊN" title="Không gian giảng dạy" subtitle="Lớp phụ trách của bạn" refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }}>
        <RoleHero eyebrow="TEACHING WORKSPACE" title="Chia sẻ kiến thức." description="Đồng hành cùng từng học viên." />
        {error ? <FptErrorBanner message={error} onRetry={() => { void load(); }} /> : null}
        <FptInput placeholder="Tìm tên lớp, khóa học, phòng…" value={search} onChangeText={setSearch} />
        <RoleSection title="Lớp tôi phụ trách">
            {loading ? <FptLoading /> : filtered.map(item => <RoleTile key={item._id} title={item.class_name || item.course_id?.name || 'Lớp học'}
                subtitle={[item.course_id?.name, item.room ? `Phòng ${item.room}` : 'Chưa xếp phòng'].filter(Boolean).join(' • ')} icon="school-outline"
                onPress={item._id ? () => router.push(`/(teacher)/class-detail/${item._id}` as any) : undefined}
                trailing={item.status ? <FptBadge status={item.status} size="sm" /> : undefined} />)}
            {!loading && !error && filtered.length === 0 ? <FptEmptyState title="Chưa có lớp phù hợp" description={search ? 'Thử tìm bằng từ khóa khác.' : 'Các lớp được phân công sẽ xuất hiện tại đây.'} /> : null}
        </RoleSection>
        <View className="mb-5 rounded-2xl bg-blue-50 p-4"><Text className="text-xs leading-6 text-blue-800">Khung giờ của lớp nằm trong chi tiết. Lịch từng buổi cần xác nhận từ phòng đào tạo.</Text></View>
        <FptButton title="Xem học viên của tôi" onPress={() => router.push('/(teacher)/(tabs)/students' as any)} />
    </RoleScreen>;
}
