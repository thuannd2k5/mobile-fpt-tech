import React, { useCallback, useState } from 'react';
import { Linking, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { callFetchLeadsForConsultants, callUpdateLead } from '@/api';
import { requireStaffResponse } from '@/api/staff';
import { ILead } from '@/types/backend';
import { useAppSelector } from '@/redux/hooks';
import { canUse } from '@/utils/permissions';
import { FptBadge, FptButton, FptEmptyState, FptInput, FptLoading } from '@/components/common';
import FptErrorBanner from '@/components/common/FptErrorBanner';
import { RoleHero, RoleScreen, RoleSection, RoleTile } from '@/components/common/RoleScreen';

const statuses = [['ALL', 'Tất cả trạng thái'], ['NEW', 'Mới'], ['CONTACTED', 'Đã liên hệ'], ['ENROLLED', 'Đã ghi danh'], ['CANCELLED', 'Đã hủy']];
const ownerId = (lead: ILead) => typeof lead.consultant_id === 'string' ? lead.consultant_id : lead.consultant_id?._id;

export default function ConsultantInboxScreen() {
    const router = useRouter();
    const user = useAppSelector(state => state.account.user);
    const canUpdate = canUse(user.permissions, 'PATCH', '/api/v1/leads/:id');
    const [leads, setLeads] = useState<ILead[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [assignment, setAssignment] = useState('MINE');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedId, setSelectedId] = useState<string>();
    const [newStatus, setNewStatus] = useState('NEW');
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [detailError, setDetailError] = useState('');
    const load = useCallback(async () => {
        setError('');
        try {
            const response = await callFetchLeadsForConsultants();
            if (!Array.isArray(response.data)) throw new Error('Invalid inbox');
            setLeads(response.data);
        } catch { setError('Không thể tải hộp tư vấn. Vui lòng thử lại.'); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);
    useFocusEffect(useCallback(() => { void load(); }, [load]));
    const filtered = leads.filter(item => {
        const assigned = ownerId(item);
        const matchesAssignment = assignment === 'ALL' || (assignment === 'MINE' ? assigned === user._id : !assigned);
        return matchesAssignment && (statusFilter === 'ALL' || item.status === statusFilter) && [item.full_name, item.name, item.email, item.phone, item.course_name].some(value => value?.toLowerCase().includes(search.trim().toLowerCase()));
    });
    const selected = leads.find(lead => lead._id === selectedId);
    const open = (lead: ILead) => { setSelectedId(lead._id); setNewStatus(lead.status || 'NEW'); setNote(lead.note || ''); setDetailError(''); };
    const contact = async (kind: 'tel' | 'mailto', value?: string) => {
        if (!value) return;
        setDetailError('');
        try { await Linking.openURL(`${kind}:${value.trim()}`); }
        catch { setDetailError('Không thể mở ứng dụng liên hệ trên thiết bị này.'); }
    };
    const save = async () => {
        if (!canUpdate || !selected?._id) return;
        setSaving(true); setDetailError('');
        try {
            requireStaffResponse(await callUpdateLead(selected._id, { status: newStatus, note: note.trim() }));
            setLeads(previous => previous.map(lead => lead._id === selected._id ? { ...lead, status: newStatus, note: note.trim() } : lead));
            setSelectedId(undefined);
        } catch { setDetailError('Không thể cập nhật yêu cầu. Vui lòng thử lại.'); }
        finally { setSaving(false); }
    };
    return <RoleScreen eyebrow="TƯ VẤN VIÊN" title="Hộp tư vấn" subtitle="Các yêu cầu cần bạn tiếp nhận" refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }}>
        <RoleHero eyebrow="ADMISSIONS DESK" title="Kết nối đúng nhu cầu." description="Đồng hành từ câu hỏi đầu tiên." />
        {error ? <FptErrorBanner message={error} onRetry={() => { void load(); }} /> : null}
        <View className="mb-4 flex-row flex-wrap gap-2">{[['MINE', 'Của tôi'], ['UNASSIGNED', 'Chưa phân công'], ['ALL', 'Tất cả']].map(([value, label]) => <TouchableOpacity key={value} accessibilityRole="button" accessibilityState={{ selected: assignment === value }} onPress={() => setAssignment(value)} className={`min-h-[44px] justify-center rounded-full px-4 ${assignment === value ? 'bg-slate-900' : 'bg-white'}`}><Text className={assignment === value ? 'text-white' : 'text-slate-600'}>{label}</Text></TouchableOpacity>)}</View>
        <FptInput placeholder="Tìm tên, số điện thoại, email, khóa học…" value={search} onChangeText={setSearch} />
        <View className="mb-5 flex-row flex-wrap gap-2">{statuses.map(([value, label]) => <TouchableOpacity key={value} accessibilityRole="button" accessibilityState={{ selected: statusFilter === value }} onPress={() => setStatusFilter(value)} className={`min-h-[44px] justify-center rounded-xl px-3 ${statusFilter === value ? 'bg-blue-100' : 'bg-white'}`}><Text className={statusFilter === value ? 'text-fpt-blue' : 'text-slate-500'}>{label}</Text></TouchableOpacity>)}</View>
        <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => { if (!saving) setSelectedId(undefined); }}><View className="flex-1 justify-end bg-black/50"><View className="max-h-[90%] rounded-t-3xl bg-white p-5"><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>{selected ? <RoleSection title="Thông tin khách hàng" action={<FptButton title="Đóng" size="sm" variant="ghost" disabled={saving} onPress={() => setSelectedId(undefined)} />}>
            <View className="rounded-2xl border border-slate-200 bg-white p-5">
                <Text className="text-xl font-bold text-slate-900">{selected.full_name || selected.name || 'Khách hàng'}</Text>
                <Text className="mt-2 text-sm leading-6 text-slate-500">{selected.course_name || 'Chưa cung cấp khóa học quan tâm'}</Text>
                <Text selectable className="mt-3 text-sm text-slate-700">{selected.phone || 'Chưa có số điện thoại'}</Text>
                <Text selectable className="mt-2 text-sm text-slate-700">{selected.email || 'Chưa có email'}</Text>
                <Text className="mt-3 text-xs text-slate-500">{ownerId(selected) === user._id ? 'Được phân công cho bạn' : 'Chưa phân công'}</Text>
                {selected.status ? <View className="mt-3 self-start"><FptBadge status={selected.status} /></View> : null}
                <Text className="my-4 text-sm leading-6 text-slate-600">{selected.note || 'Chưa có ghi chú tư vấn.'}</Text>
                <View className="mb-3 gap-2"><FptButton title="Gọi điện" variant="secondary" disabled={!selected.phone} onPress={() => { void contact('tel', selected.phone); }} /><FptButton title="Gửi email" variant="outline" disabled={!selected.email} onPress={() => { void contact('mailto', selected.email); }} /></View>
                {canUpdate ? <View className="mt-3 border-t border-slate-100 pt-4">
                    <Text className="mb-3 text-sm font-bold text-slate-800">Cập nhật kết quả tư vấn</Text>
                    <View className="mb-4 flex-row flex-wrap gap-2">{statuses.filter(([value]) => value !== 'ALL').map(([value, label]) => <FptButton key={value} size="sm" title={label} variant={newStatus === value ? 'secondary' : 'ghost'} disabled={saving} onPress={() => setNewStatus(value)} />)}</View>
                    <FptInput label="Ghi chú" multiline value={note} editable={!saving} onChangeText={setNote} />
                    <FptButton title="Lưu cập nhật" loading={saving} onPress={() => { void save(); }} />
                </View> : null}
                {detailError ? <Text accessibilityRole="alert" className="mt-3 text-sm text-red-600">{detailError}</Text> : null}
            </View>
        </RoleSection> : null}</ScrollView></View></View></Modal>
        <RoleSection title="Yêu cầu tư vấn">
            {loading ? <FptLoading /> : filtered.map((lead, index) => <RoleTile key={lead._id || index} title={lead.full_name || lead.name || 'Khách hàng'} subtitle={[lead.course_name || 'Chưa cung cấp khóa học', ownerId(lead) ? 'Được phân công cho bạn' : 'Chưa phân công'].join(' • ')} icon="person-outline" trailing={lead.status ? <FptBadge status={lead.status} size="sm" /> : undefined} onPress={lead._id ? () => open(lead) : undefined} />)}
            {!loading && !error && filtered.length === 0 ? <FptEmptyState title="Chưa có yêu cầu phù hợp" description="Chọn bộ lọc khác hoặc tạo yêu cầu tư vấn mới." icon="mail-outline" /> : null}
        </RoleSection>
        <FptButton title="Tạo yêu cầu tư vấn" onPress={() => router.push('/(consultant)/create-lead' as any)} />
    </RoleScreen>;
}
