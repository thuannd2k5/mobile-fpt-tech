import React, { useCallback, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createManagerClass, fetchManagerClassOptions, managerErrorMessage, ManagerTeacher } from '@/api/manager';
import { ICourse } from '@/types/backend';
import { useAppSelector } from '@/redux/hooks';
import { canUse } from '@/utils/permissions';
import { RoleScreen, RoleSection } from '@/components/common/RoleScreen';
import { FptInput } from '@/components/common/FptInput';
import { FptButton } from '@/components/common/FptButton';
import FptErrorBanner from '@/components/common/FptErrorBanner';
import { FptLoading } from '@/components/common/FptLoading';
import { FptEmptyState } from '@/components/common/FptEmptyState';

type Option = { id: string; title: string; subtitle?: string };

function Choice({ label, value, options, onSelect, disabled }: { label: string; value: string; options: Option[]; onSelect: (id: string) => void; disabled: boolean }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const filtered = options.filter((option) => `${option.title} ${option.subtitle || ''}`.toLocaleLowerCase().includes(search.toLocaleLowerCase().trim()));
    return <View className="mb-4">
        <Text className="mb-1.5 text-sm font-medium text-slate-700">{label}</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={() => { setSearch(''); setOpen(true); }} className="min-h-[52px] justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3"><Text className={value ? 'text-base text-slate-900' : 'text-base text-slate-500'}>{options.find((option) => option.id === value)?.title || 'Chọn từ danh sách'}</Text></TouchableOpacity>
        <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
            <SafeAreaView className="flex-1 bg-fpt-grayBg"><View className="p-5"><Text className="mb-4 text-xl font-bold text-slate-900">{label}</Text><FptButton title="Đóng" variant="ghost" onPress={() => setOpen(false)} /><FptInput label="Tìm kiếm" value={search} onChangeText={setSearch} placeholder="Nhập tên hoặc email" /></View>
                <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingTop: 0 }}>
                    {filtered.map((option) => <TouchableOpacity key={option.id} accessibilityRole="button" accessibilityState={{ selected: option.id === value }} onPress={() => { onSelect(option.id); setOpen(false); }} className={`mb-3 rounded-2xl border p-4 ${option.id === value ? 'border-fpt-orange bg-orange-50' : 'border-slate-200 bg-white'}`}><Text className="font-bold text-slate-900">{option.title}</Text>{option.subtitle ? <Text className="mt-2 text-xs leading-5 text-slate-500">{option.subtitle}</Text> : null}</TouchableOpacity>)}
                    {!filtered.length ? <FptEmptyState title="Không có lựa chọn phù hợp" description="Thử tìm bằng tên khác." /> : null}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    </View>;
}

export default function ManagerCreateClass() {
    const router = useRouter();
    const permissions = useAppSelector((state) => state.account.user.permissions);
    const allowed = canUse(permissions, 'POST', '/api/v1/classrooms');
    const [courses, setCourses] = useState<ICourse[]>([]);
    const [teachers, setTeachers] = useState<ManagerTeacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [formError, setFormError] = useState('');
    const [created, setCreated] = useState(false);
    const [courseId, setCourseId] = useState('');
    const [teacherId, setTeacherId] = useState('');
    const [name, setName] = useState('');
    const [room, setRoom] = useState('');
    const [capacity, setCapacity] = useState('');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const load = useCallback(async () => {
        if (!allowed) { setLoading(false); return; }
        setLoading(true); setError('');
        try { const options = await fetchManagerClassOptions(); setCourses(options.courses); setTeachers(options.teachers); }
        catch (err) { setError(managerErrorMessage(err)); }
        finally { setLoading(false); }
    }, [allowed]);
    useFocusEffect(useCallback(() => { void load(); }, [load]));

    const submit = async () => {
        if (!allowed || saving) return;
        setFormError('');
        if (!courses.some((course) => course._id === courseId) || !teachers.some((teacher) => teacher._id === teacherId) || !name.trim() || !room.trim()) {
            setFormError('Vui lòng chọn khóa học, giảng viên và điền tên lớp, phòng học.'); return;
        }
        if (!/^\d+$/.test(capacity) || !Number.isSafeInteger(Number(capacity)) || Number(capacity) <= 0) {
            setFormError('Sĩ số tối đa phải là số nguyên lớn hơn 0.'); return;
        }
        const time = /^([01]\d|2[0-3]):[0-5]\d$/;
        if (!time.test(start.trim()) || !time.test(end.trim()) || start.trim() >= end.trim()) {
            setFormError('Nhập giờ theo HH:mm (24 giờ), giờ kết thúc phải sau giờ bắt đầu.'); return;
        }
        setSaving(true);
        try {
            await createManagerClass({ course_id: courseId, teacher_id: teacherId, class_name: name.trim(), room: room.trim(), max_student: String(Number(capacity)), start_time: start.trim(), end_time: end.trim(), status: 'OPEN' });
            setCreated(true);
        } catch (err) { setFormError(managerErrorMessage(err, 'Không thể tạo lớp học. Vui lòng thử lại.')); }
        finally { setSaving(false); }
    };

    return <RoleScreen eyebrow="Quản lý đào tạo" title="Mở lớp học" subtitle="Thông tin lớp và người phụ trách">
        <FptButton title="Quay lại" variant="ghost" disabled={saving} className="mb-4" onPress={() => router.back()} />
        {!allowed ? <FptEmptyState title="Chưa có quyền tạo lớp" description="Tài khoản cần được cấp quyền tạo lớp học để thực hiện thao tác này." icon="lock-closed-outline" /> : created ? <FptEmptyState title="Đã tạo lớp học" description={`Lớp ${name.trim()} đã được mở thành công.`} icon="checkmark-circle-outline" actionTitle="Xem danh sách lớp" onAction={() => router.replace('/(manager)/(tabs)/classes' as never)} /> : <>
            {error ? <FptErrorBanner message={error} onRetry={() => void load()} /> : null}
            {loading ? <FptLoading message="Đang tải khóa học và giảng viên..." /> : error ? null : <>
                {!courses.length || !teachers.length ? <View className="mb-4 rounded-2xl bg-orange-50 p-4"><Text className="text-sm leading-6 text-orange-800">{!courses.length ? 'Chưa có khóa học có thể mở lớp. ' : ''}{!teachers.length ? 'Chưa có giảng viên đang hoạt động. Hãy phê duyệt giảng viên trước khi mở lớp.' : ''}</Text></View> : null}
                <RoleSection title="Thông tin lớp học">
                    <Choice label="Khóa học *" value={courseId} disabled={saving} options={courses.map((course) => ({ id: course._id!, title: course.name, subtitle: [course.level, course.duration].filter(Boolean).join(' • ') }))} onSelect={setCourseId} />
                    <FptInput label="Tên lớp *" value={name} onChangeText={setName} editable={!saving} placeholder="Nhập tên lớp" />
                    <FptInput label="Phòng học *" value={room} onChangeText={setRoom} editable={!saving} placeholder="Nhập phòng học" />
                    <FptInput label="Sĩ số tối đa *" value={capacity} onChangeText={setCapacity} editable={!saving} keyboardType="number-pad" placeholder="Nhập số học viên" />
                    <FptInput label="Giờ bắt đầu *" value={start} onChangeText={setStart} editable={!saving} placeholder="HH:mm" autoCapitalize="none" maxLength={5} />
                    <FptInput label="Giờ kết thúc *" value={end} onChangeText={setEnd} editable={!saving} placeholder="HH:mm" autoCapitalize="none" maxLength={5} />
                    <Choice label="Giảng viên *" value={teacherId} disabled={saving} options={teachers.map((teacher) => ({ id: teacher._id, title: teacher.name, subtitle: [teacher.subject, teacher.email].filter(Boolean).join(' • ') }))} onSelect={setTeacherId} />
                </RoleSection>
                {formError ? <Text accessibilityRole="alert" className="mb-4 text-sm leading-6 text-red-700">{formError}</Text> : null}
                <FptButton title="Tạo lớp học" loading={saving} disabled={saving || !courses.length || !teachers.length} onPress={() => void submit()} />
            </>}
        </>}
    </RoleScreen>;
}
