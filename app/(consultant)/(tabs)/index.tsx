import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    RefreshControl,
    Linking,
    Modal,
    Alert,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { callFetchLeadsForConsultants, callUpdateLead } from '@/api';
import { ILead } from '@/types/backend';
import { FptCard, FptBadge, FptLoading, FptEmptyState, FptButton, FptInput } from '@/components/common';

import FptErrorBanner from '@/components/common/FptErrorBanner';

export default function ConsultantLeadsScreen() {
    const [loadError, setLoadError] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [leads, setLeads] = useState<ILead[]>([]);
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'NEW' | 'CONTACTED' | 'ENROLLED' | 'CANCELLED'>('ALL');
    const [search, setSearch] = useState('');

    // Modal state for updating lead
    const [selectedLead, setSelectedLead] = useState<ILead | null>(null);
    const [newStatus, setNewStatus] = useState<string>('NEW');
    const [note, setNote] = useState<string>('');
    const [updating, setUpdating] = useState(false);

    const fetchLeads = useCallback(async () => {
        setLoadError('');
        try {
            const res = await callFetchLeadsForConsultants();
            if (res && res.data && Array.isArray(res.data)) {
                setLeads(res.data);
            }
        } catch {
            setLoadError('Không thể tải dữ liệu. Vui lòng kiểm tra kết nối và thử lại.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchLeads();
    };

    const handleCall = (phone?: string) => {
        if (!phone) {
            Alert.alert('Thông báo', 'Khách hàng không để lại số điện thoại.');
            return;
        }
        Linking.openURL(`tel:${phone}`);
    };

    const handleOpenUpdate = (lead: ILead) => {
        setSelectedLead(lead);
        setNewStatus(lead.status || 'NEW');
        setNote(lead.note || '');
    };

    const handleSaveUpdate = async () => {
        if (!selectedLead || !selectedLead._id) return;
        setUpdating(true);
        try {
            await callUpdateLead(selectedLead._id, {
                status: newStatus,
                note: note.trim(),
            });

            setLeads((prev) =>
                prev.map((item) =>
                    item._id === selectedLead._id
                        ? { ...item, status: newStatus, note: note.trim() }
                        : item
                )
            );

            setSelectedLead(null);
            Alert.alert('Thành công', 'Đã cập nhật trạng thái tư vấn cho khách hàng.');
        } catch (error: any) {
            Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể cập nhật.');
        } finally {
            setUpdating(false);
        }
    };

    const filtered = leads.filter((item) => {
        const matchesStatus =
            statusFilter === 'ALL' || (item.status || '').toUpperCase() === statusFilter;
        const q = search.toLowerCase();
        const matchesSearch =
            (item.full_name || item.name || '').toLowerCase().includes(q) ||
            (item.phone || '').toLowerCase().includes(q) ||
            (item.course_name || '').toLowerCase().includes(q);
        return matchesStatus && matchesSearch;
    });

    return (
        <SafeAreaView className="flex-1 bg-fpt-grayBg" edges={['top']}>
            {loadError ? <FptErrorBanner message={loadError} onRetry={onRefresh} /> : null}
            {/* Header */}
            <View className="bg-white px-5 pt-5 pb-4 border-b border-slate-100">
                <Text className="text-2xl font-bold text-gray-900">Khách hàng quan tâm</Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                    Hộp thư tiếp nhận khách hàng tiềm năng (Leads CRM)
                </Text>

                {/* Search Box */}
                <View className="mt-3 flex-row items-center rounded-xl bg-gray-100 px-3.5 py-2">
                    <Ionicons name="search" size={18} color="#718096" />
                    <TextInput
                        className="ml-2.5 flex-1 text-sm text-gray-900"
                        placeholder="Tìm theo tên, SĐT, khóa học..."
                        placeholderTextColor="#A0AEC0"
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search ? (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={18} color="#A0AEC0" />
                        </TouchableOpacity>
                    ) : null}
                </View>

                {/* Filter Pills */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mt-3"
                    contentContainerStyle={{ gap: 8 }}
                >
                    {[
                        { key: 'ALL', label: 'Tất cả' },
                        { key: 'NEW', label: 'Mới' },
                        { key: 'CONTACTED', label: 'Đã liên hệ' },
                        { key: 'ENROLLED', label: 'Đã ghi danh' },
                        { key: 'CANCELLED', label: 'Đã hủy' },
                    ].map((pill) => {
                        const isSelected = statusFilter === pill.key;
                        return (
                            <TouchableOpacity
                                key={pill.key}
                                onPress={() => setStatusFilter(pill.key as any)}
                                className={`rounded-full px-3 py-1 border ${
                                    isSelected
                                        ? 'bg-sky-600 border-sky-600'
                                        : 'bg-white border-gray-200'
                                }`}
                            >
                                <Text
                                    className={`text-xs font-semibold ${
                                        isSelected ? 'text-white' : 'text-gray-600'
                                    }`}
                                >
                                    {pill.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {loading && !refreshing ? (
                <FptLoading message="Đang tải danh sách khách hàng..." />
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item._id || Math.random().toString()}
                    contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#0284C7']}
                            tintColor="#0284C7"
                        />
                    }
                    ListEmptyComponent={
                        <FptEmptyState
                            title="Không có khách hàng"
                            description="Chưa có thông tin tư vấn nào trong hộp thư."
                            icon="people-outline"
                        />
                    }
                    renderItem={({ item }) => (
                        <FptCard className="mb-4">
                            <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
                                <View className="flex-row items-center flex-1">
                                    <View className="h-9 w-9 items-center justify-center rounded-full bg-sky-100 mr-2.5">
                                        <Text className="text-sm font-bold text-sky-700">
                                            {(item.full_name || item.name || 'KH')[0].toUpperCase()}
                                        </Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
                                            {item.full_name || item.name || 'Khách hàng'}
                                        </Text>
                                        <Text className="text-xs text-gray-500">
                                            {item.email || 'Chưa để lại email'}
                                        </Text>
                                    </View>
                                </View>
                                <FptBadge status={item.status || 'NEW'} size="sm" />
                            </View>

                            <View className="py-3 space-y-1.5">
                                <View className="flex-row items-center">
                                    <Ionicons name="book-outline" size={14} color="#718096" />
                                    <Text className="ml-1.5 text-xs text-gray-800 font-semibold">
                                        Khóa học quan tâm:{' '}
                                        <Text className="text-sky-700 font-bold">
                                            {item.course_name || 'Khóa học CNTT'}
                                        </Text>
                                    </Text>
                                </View>

                                {item.note && (
                                    <View className="mt-2 rounded-xl bg-fpt-grayBg p-2.5">
                                        <Text className="text-xs text-gray-600 italic">
                                            &quot;{item.note}&quot;
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <View className="mt-2 pt-3 border-t border-gray-100 flex-row items-center justify-end gap-2">
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => handleCall(item.phone)}
                                    className="flex-row items-center rounded-xl bg-gray-100 px-3 py-1.5"
                                >
                                    <Ionicons name="call-outline" size={14} color="#4A5568" />
                                    <Text className="ml-1 text-xs font-semibold text-gray-700">
                                        {item.phone || 'Gọi điện'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => handleOpenUpdate(item)}
                                    className="flex-row items-center rounded-xl bg-sky-50 px-3 py-1.5"
                                >
                                    <Ionicons name="create-outline" size={14} color="#0284C7" />
                                    <Text className="ml-1 text-xs font-semibold text-sky-700">
                                        Cập nhật
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </FptCard>
                    )}
                />
            )}

            {/* Update Lead Modal */}
            <Modal
                visible={!!selectedLead}
                animationType="slide"
                transparent
                onRequestClose={() => setSelectedLead(null)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="max-h-[85%] rounded-t-3xl bg-white p-6">
                        <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
                            <Text className="text-lg font-bold text-gray-900">
                                Cập nhật trạng thái khách hàng
                            </Text>
                            <TouchableOpacity onPress={() => setSelectedLead(null)}>
                                <Ionicons name="close" size={22} color="#718096" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
                            <Text className="mb-2 text-xs font-semibold text-gray-500">
                                Chọn trạng thái tư vấn:
                            </Text>
                            <View className="flex-row flex-wrap gap-2 mb-4">
                                {[
                                    { key: 'NEW', label: 'Mới nhận' },
                                    { key: 'CONTACTED', label: 'Đã liên hệ tư vấn' },
                                    { key: 'ENROLLED', label: 'Đã đăng ký ghi danh' },
                                    { key: 'CANCELLED', label: 'Từ chối / Hủy' },
                                ].map((s) => {
                                    const isSel = newStatus === s.key;
                                    return (
                                        <TouchableOpacity
                                            key={s.key}
                                            onPress={() => setNewStatus(s.key)}
                                            className={`rounded-xl px-3 py-2 border ${
                                                isSel
                                                    ? 'bg-sky-600 border-sky-600'
                                                    : 'bg-white border-gray-200'
                                            }`}
                                        >
                                            <Text
                                                className={`text-xs font-semibold ${
                                                    isSel ? 'text-white' : 'text-gray-700'
                                                }`}
                                            >
                                                {s.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <FptInput
                                label="Ghi chú kết quả tư vấn"
                                placeholder="Ghi chú nhu cầu, lịch hẹn gọi lại..."
                                value={note}
                                onChangeText={setNote}
                                multiline
                                numberOfLines={3}
                            />

                            <View className="mt-4 mb-6">
                                <FptButton
                                    title="Lưu cập nhật"
                                    onPress={handleSaveUpdate}
                                    loading={updating}
                                    variant="secondary"
                                    size="lg"
                                />
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
