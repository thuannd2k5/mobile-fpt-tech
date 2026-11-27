import React, { useCallback, useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { FptButton, FptEmptyState, FptInput, FptLoading } from '@/components/common';
import { RoleScreen, RoleSection, RoleTile } from '@/components/common/RoleScreen';
import FptErrorBanner from '@/components/common/FptErrorBanner';
import { createOwnSchedule, deleteOwnSchedule, fetchOwnSchedules, OwnSchedule, ScheduleInput, scheduleDays, scheduleValidation, updateOwnSchedule } from '@/api/staff';

const blank: ScheduleInput = { day_of_week: 'Monday', start_time: '', end_time: '', status: 'available', note: '' };

export default function TeacherAvailabilityScreen() {
    const [slots, setSlots] = useState<OwnSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState<ScheduleInput | null>(null);
    const [editingId, setEditingId] = useState<string>();
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(false);
    const load = useCallback(async () => {
        setError('');
        try {
            const response = await fetchOwnSchedules();
            if (!Array.isArray(response.data)) throw new Error('Invalid schedules');
            setSlots(response.data);
        } catch { setError('Không thể tải lịch của bạn. Vui lòng thử lại.'); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);
    useEffect(() => { void load(); }, [load]);
    const open = (slot?: OwnSchedule) => {
        setEditingId(slot?._id); setForm(slot ? { ...slot } : { ...blank }); setFormError(''); setConfirmDelete(false);
    };
    const save = async () => {
        if (!form) return;
        const validation = scheduleValidation(form, slots, editingId);
        if (validation) { setFormError(validation); return; }
        if (editingId && !slots.some(slot => slot._id === editingId)) return;
        setSaving(true); setFormError('');
        try {
            const value = { day_of_week: form.day_of_week, start_time: form.start_time, end_time: form.end_time, status: form.status, note: form.note?.trim() };
            if (editingId) {
                const response = await updateOwnSchedule(editingId, value);
                if (response.data?.matchedCount === 0) throw new Error('Slot no longer available');
            } else await createOwnSchedule(value);
            setForm(null); await load();
        } catch { setFormError('Không thể lưu lịch. Vui lòng kiểm tra khung giờ và thử lại.'); }
        finally { setSaving(false); }
    };
    const remove = async () => {
        // Only ids returned by the authenticated /schedules/me endpoint are actionable.
        if (!editingId || !slots.some(slot => slot._id === editingId)) return;
        setSaving(true); setFormError('');
        try { await deleteOwnSchedule(editingId); setForm(null); await load(); }
        catch { setFormError('Không thể xóa khung giờ. Vui lòng thử lại.'); }
        finally { setSaving(false); }
    };
    const sorted = [...slots].sort((a, b) => scheduleDays.findIndex(day => day[0] === a.day_of_week) - scheduleDays.findIndex(day => day[0] === b.day_of_week) || a.start_time.localeCompare(b.start_time));
    return <RoleScreen eyebrow="GIẢNG VIÊN" title="Lịch rảnh của tôi" subtitle="Đăng ký thời gian có thể nhận lớp" refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }}>
        {error ? <FptErrorBanner message={error} onRetry={() => { void load(); }} /> : null}
        <Modal visible={!!form} transparent animationType="slide" onRequestClose={() => { if (!saving) setForm(null); }}><View className="flex-1 justify-end bg-black/50"><View className="max-h-[90%] rounded-t-3xl bg-white p-5"><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>{form ? <RoleSection title={editingId ? 'Chỉnh sửa khung giờ' : 'Thêm khung giờ'}>
            <View className="rounded-2xl border border-slate-200 bg-white p-4">
                <Text className="mb-2 text-sm font-semibold text-slate-700">Ngày trong tuần</Text>
                <View className="mb-4 flex-row flex-wrap gap-2">{scheduleDays.map(([value, label]) => <TouchableOpacity key={value} disabled={saving} accessibilityRole="button" accessibilityState={{ selected: form.day_of_week === value }} onPress={() => setForm({ ...form, day_of_week: value })} className={`min-h-[44px] justify-center rounded-xl px-3 ${form.day_of_week === value ? 'bg-fpt-blue' : 'bg-slate-100'}`}><Text className={form.day_of_week === value ? 'text-white' : 'text-slate-600'}>{label}</Text></TouchableOpacity>)}</View>
                <FptInput label="Giờ bắt đầu (HH:mm)" placeholder="08:00" value={form.start_time} editable={!saving} onChangeText={value => setForm({ ...form, start_time: value })} maxLength={5} />
                <FptInput label="Giờ kết thúc (HH:mm)" placeholder="10:00" value={form.end_time} editable={!saving} onChangeText={value => setForm({ ...form, end_time: value })} maxLength={5} />
                <View className="mb-4 flex-row gap-2">{(['available', 'busy'] as const).map(status => <FptButton key={status} title={status === 'available' ? 'Rảnh' : 'Bận'} size="sm" disabled={saving} variant={form.status === status ? 'secondary' : 'ghost'} onPress={() => setForm({ ...form, status })} />)}</View>
                <FptInput label="Ghi chú" value={form.note} editable={!saving} onChangeText={note => setForm({ ...form, note })} multiline />
                {formError ? <Text accessibilityRole="alert" className="mb-3 text-sm text-red-600">{formError}</Text> : null}
                <FptButton title="Lưu khung giờ" loading={saving} onPress={() => { void save(); }} />
                <FptButton title="Hủy chỉnh sửa" variant="ghost" disabled={saving} onPress={() => setForm(null)} />
                {editingId ? <FptButton title={confirmDelete ? 'Xác nhận xóa khung giờ này' : 'Xóa khung giờ'} variant="danger" disabled={saving} onPress={() => confirmDelete ? void remove() : setConfirmDelete(true)} /> : null}
            </View>
        </RoleSection> : null}</ScrollView></View></View></Modal>
        <FptButton title="Thêm khung giờ rảnh" className="mb-5" disabled={loading || !!error} onPress={() => open()} />
        <RoleSection title="Tuần làm việc">
            {loading ? <FptLoading /> : sorted.map(slot => <RoleTile key={slot._id} title={`${scheduleDays.find(day => day[0] === slot.day_of_week)?.[1] || slot.day_of_week} · ${slot.start_time} – ${slot.end_time}`} subtitle={[slot.status === 'available' ? 'Rảnh · Có thể nhận lớp' : 'Bận', slot.note].filter(Boolean).join('\n')} icon="time-outline" onPress={() => open(slot)} />)}
            {!loading && !error && slots.length === 0 ? <FptEmptyState title="Bạn chưa đăng ký lịch" description="Thêm khung giờ để phòng đào tạo biết khi nào bạn có thể nhận lớp." icon="calendar-outline" /> : null}
        </RoleSection>
        <View className="rounded-2xl bg-blue-50 p-4"><Text className="text-xs leading-6 text-blue-800">Lịch rảnh là khung giờ nhận lớp hàng tuần của bạn. Quản lý đào tạo dùng thông tin này để sắp xếp giảng viên phù hợp.</Text></View>
    </RoleScreen>;
}
