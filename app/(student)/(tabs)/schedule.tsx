import React, { useCallback, useEffect, useState } from 'react';
import { Text, View, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { callFetchMyEnrollments, callCancelMyEnrollment } from '@/api';
import { IPortalEnrollment } from '@/types/backend';
import {
    RoleScreen,
    RoleSection,
    RoleTile,
} from '@/components/common/RoleScreen';
import {
    FptButton,
    FptBadge,
    FptEmptyState,
    FptLoading,
} from '@/components/common';
import FptErrorBanner from '@/components/common/FptErrorBanner';
export default function MyClasses() {
    const router = useRouter();
    const [items, setItems] = useState<IPortalEnrollment[]>([]),
        [busy, setBusy] = useState(true),
        [error, setError] = useState(''),
        [selected, setSelected] = useState<IPortalEnrollment | null>(null),
        [saving, setSaving] = useState(false);
    const load = useCallback(async () => {
        setBusy(true);
        setError('');
        try {
            const r = await callFetchMyEnrollments();
            setItems(r.data || []);
        } catch {
            setError('Không tải được danh sách lớp.');
        } finally {
            setBusy(false);
        }
    }, []);
    useEffect(() => {
        void load();
    }, [load]);
    const cancel = async () => {
        if (!selected?._id) return;
        setSaving(true);
        try {
            await callCancelMyEnrollment(selected._id);
            setSelected(null);
            await load();
        } catch (e: any) {
            setError(
                e?.message ||
                    'Không thể hủy ghi danh này. Vui lòng kiểm tra học phí.',
            );
            setSelected(null);
        } finally {
            setSaving(false);
        }
    };
    return (
        <RoleScreen
            eyebrow="Học viên · Lớp học"
            title="Lớp học của tôi"
            subtitle="Thông tin ghi danh và khung giờ của lớp, không phải lịch học từng buổi."
            refreshing={busy}
            onRefresh={() => void load()}
        >
            {error ? (
                <FptErrorBanner message={error} onRetry={() => void load()} />
            ) : null}
            {busy ? (
                <FptLoading fullScreen={false} />
            ) : (
                <RoleSection title="Các lớp đã ghi danh">
                    {items.map((e) => (
                        <View key={e._id} className="mb-4">
                            <RoleTile
                                icon="school-outline"
                                title={
                                    e.class_id?.course_id?.name ||
                                    e.class_id?.class_name ||
                                    'Lớp học'
                                }
                                subtitle={
                                    (e.class_id?.room || 'Chưa xếp phòng') +
                                    ' · ' +
                                    (e.class_id?.start_time || 'Chưa xếp giờ') +
                                    ' – ' +
                                    (e.class_id?.end_time || '')
                                }
                                trailing={
                                    <FptBadge status={e.status} size="sm" />
                                }
                                onPress={() =>
                                    e.class_id?._id &&
                                    router.push(
                                        ('/(student)/class/' +
                                            e.class_id._id) as never,
                                    )
                                }
                            />
                            {e.status === 'WAITING_PAYMENT' ? (
                                <FptButton
                                    title="Hủy ghi danh"
                                    variant="ghost"
                                    size="sm"
                                    onPress={() => setSelected(e)}
                                />
                            ) : null}
                        </View>
                    ))}
                    {!items.length && !error ? (
                        <FptEmptyState title="Chưa có lớp học" />
                    ) : null}
                </RoleSection>
            )}
            <Modal
                visible={!!selected}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    if (!saving) setSelected(null);
                }}
            >
                <View className="flex-1 items-center justify-center bg-black/50 px-6">
                    <View className="w-full max-w-[400px] rounded-3xl bg-white p-6">
                        <Text className="mb-3 text-xl font-bold text-slate-900">
                            Hủy ghi danh?
                        </Text>
                        <Text className="mb-5 text-sm leading-6 text-slate-500">
                            Hệ thống chỉ cho phép hủy khi trạng thái ghi danh và
                            hóa đơn đáp ứng điều kiện.
                        </Text>
                        <FptButton
                            title="Xác nhận hủy ghi danh"
                            variant="danger"
                            loading={saving}
                            onPress={cancel}
                        />
                        <View className="mt-3">
                            <FptButton
                                title="Giữ lại"
                                variant="ghost"
                                disabled={saving}
                                onPress={() => setSelected(null)}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </RoleScreen>
    );
}
