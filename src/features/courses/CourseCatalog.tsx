import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { callFetchCourse } from '@/api';
import { ICourse } from '@/types/backend';
import {
    RoleScreen,
    RoleHero,
    RoleSection,
    RoleTile,
} from '@/components/common/RoleScreen';
import {
    FptInput,
    FptLoading,
    FptEmptyState,
    FptButton,
} from '@/components/common';
import FptErrorBanner from '@/components/common/FptErrorBanner';
export default function CourseCatalog({
    discovery = false,
}: {
    discovery?: boolean;
}) {
    const router = useRouter();
    const [courses, setCourses] = useState<ICourse[]>([]),
        [query, setQuery] = useState(''),
        [error, setError] = useState(''),
        [loading, setLoading] = useState(true),
        [page, setPage] = useState(1),
        [pages, setPages] = useState(1);
    const load = useCallback(async (next = 1) => {
        setLoading(true);
        setError('');
        try {
            const res = await callFetchCourse(
                'current=' + next + '&pageSize=30',
            );
            setCourses((old) =>
                next === 1
                    ? res.data?.result || []
                    : [...old, ...(res.data?.result || [])],
            );
            setPage(next);
            setPages(res.data?.meta.pages || 1);
        } catch {
            setError('Không thể tải khóa học. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        void load();
    }, [load]);
    const filtered = courses.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase().trim()),
    );
    return (
        <RoleScreen
            eyebrow={
                discovery ? 'Khám phá · Tài khoản mới' : 'Học viên · Khóa học'
            }
            title={discovery ? 'Bắt đầu từ đam mê' : 'Khám phá khóa học'}
            subtitle="Chọn lộ trình phù hợp với mục tiêu của bạn."
            refreshing={loading}
            onRefresh={() => void load()}
        >
            {discovery ? (
                <RoleHero
                    eyebrow="COURSE DISCOVERY"
                    title={'Tương lai bắt đầu\ntừ khóa học đầu tiên.'}
                    description="Khám phá chương trình và chọn lớp để ghi danh."
                />
            ) : null}
            <FptInput
                placeholder="Tìm khóa học…"
                accessibilityLabel="Tìm khóa học"
                value={query}
                onChangeText={setQuery}
            />
            {error ? (
                <FptErrorBanner message={error} onRetry={() => void load()} />
            ) : null}
            {loading && !courses.length ? (
                <FptLoading fullScreen={false} />
            ) : (
                <RoleSection title="Chương trình đào tạo">
                    {filtered.map((c) => (
                        <RoleTile
                            key={c._id}
                            icon="book-outline"
                            title={c.name}
                            subtitle={
                                (c.level || 'Lộ trình thực hành') +
                                ' · ' +
                                Number(c.price || 0).toLocaleString('vi-VN') +
                                ' đ'
                            }
                            onPress={() =>
                                router.push(
                                    ((discovery ? '/(explore)' : '/(student)') +
                                        '/course/' +
                                        c._id) as never,
                                )
                            }
                        />
                    ))}
                    {!filtered.length && !error ? (
                        <FptEmptyState
                            title="Chưa tìm thấy khóa học"
                            description="Thử từ khóa khác hoặc quay lại sau."
                        />
                    ) : null}
                </RoleSection>
            )}
            {page < pages ? (
                <FptButton
                    title="Tải thêm khóa học"
                    loading={loading}
                    onPress={() => void load(page + 1)}
                />
            ) : null}
            {discovery ? (
                <View className="mt-4">
                    <FptButton
                        title="Đăng ký tư vấn lộ trình"
                        onPress={() =>
                            router.push(
                                '/(explore)/(tabs)/consultation' as never,
                            )
                        }
                    />
                    <Text className="mt-3 text-xs leading-5 text-slate-500">
                        Sau lần ghi danh đầu tiên, bạn sẽ có không gian học viên
                        riêng để theo dõi lớp và học phí.
                    </Text>
                </View>
            ) : null}
        </RoleScreen>
    );
}
