import React, { useCallback, useEffect, useState } from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { callFetchCourse } from '@/api';
import { ICourse } from '@/types/backend';
import { FptButton, FptEmptyState, FptInput, FptLoading } from '@/components/common';
import { RoleScreen, RoleSection, RoleTile } from '@/components/common/RoleScreen';
import FptErrorBanner from '@/components/common/FptErrorBanner';

export default function ConsultantCoursesScreen() {
    const router = useRouter();
    const [courses, setCourses] = useState<ICourse[]>([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [selected, setSelected] = useState<ICourse | null>(null);
    const load = useCallback(async (next = 1) => {
        setLoading(true); setError('');
        try {
            const response = await callFetchCourse(`current=${next}&pageSize=30`);
            if (!response.data || !Array.isArray(response.data.result)) throw new Error('Invalid courses');
            setCourses(previous => next === 1 ? response.data!.result : [...previous, ...response.data!.result]);
            setPage(next); setPages(response.data.meta.pages);
        } catch { setError('Không thể tải khóa học. Vui lòng thử lại.'); }
        finally { setLoading(false); }
    }, []);
    useEffect(() => { void load(); }, [load]);
    const filtered = courses.filter(course => course.name.toLowerCase().includes(query.trim().toLowerCase()));
    const price = (course: ICourse) => course.price === undefined || course.price === '' ? 'Chưa cập nhật học phí' : `${Number(course.price).toLocaleString('vi-VN')} ₫`;
    return <RoleScreen eyebrow="TƯ VẤN VIÊN" title="Khóa học tư vấn" subtitle="Tra cứu chương trình trước khi trao đổi với khách hàng" refreshing={loading} onRefresh={() => { void load(); }}>
        <FptInput placeholder="Tìm tên khóa học…" value={query} onChangeText={setQuery} />
        {error ? <FptErrorBanner message={error} onRetry={() => { void load(); }} /> : null}
        <RoleSection title="Chương trình đào tạo">
            {loading && !courses.length ? <FptLoading /> : filtered.map(course => <RoleTile key={course._id} title={course.name} subtitle={[course.level, price(course)].filter(Boolean).join(' • ')} icon="book-outline" onPress={() => setSelected(course)} />)}
            {!loading && !error && !filtered.length ? <FptEmptyState title="Chưa tìm thấy khóa học" description="Thử từ khóa khác hoặc tải thêm chương trình." /> : null}
        </RoleSection>
        {page < pages ? <FptButton title="Tải thêm khóa học" loading={loading} onPress={() => { void load(page + 1); }} /> : null}
        <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}><View className="flex-1 justify-end bg-black/50"><View className="max-h-[90%] rounded-t-3xl bg-white p-5"><ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            <Text className="mb-3 text-2xl font-bold text-slate-900">{selected?.name}</Text>
            <Text className="mb-3 text-sm font-semibold text-fpt-orange">{selected ? price(selected) : ''}</Text>
            <Text className="mb-3 text-sm leading-6 text-slate-500">{[selected?.level, selected?.duration].filter(Boolean).join(' • ')}</Text>
            <Text className="mb-5 text-sm leading-7 text-slate-700">{selected?.description || 'Nội dung chi tiết chưa được cập nhật.'}</Text>
            <FptButton title="Tạo yêu cầu cho khóa học này" onPress={() => { const name = selected?.name || ''; setSelected(null); router.push({ pathname: '/(consultant)/create-lead', params: { course: name } } as any); }} />
            <FptButton title="Đóng" variant="ghost" onPress={() => setSelected(null)} />
        </ScrollView></View></View></Modal>
    </RoleScreen>;
}
