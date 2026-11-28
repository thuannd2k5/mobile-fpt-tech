import React, { useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FptButton } from '@/components/common/FptButton';
import { FptEmptyState } from '@/components/common/FptEmptyState';
import { FptInput } from '@/components/common/FptInput';

export type ManagerChoiceOption = {
    id: string;
    title: string;
    subtitle?: string;
};

export function ManagerChoice({
    label,
    value,
    options,
    onSelect,
    disabled,
}: {
    label: string;
    value: string;
    options: ManagerChoiceOption[];
    onSelect: (id: string) => void;
    disabled: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const filtered = options.filter((option) =>
        `${option.title} ${option.subtitle || ''}`
            .toLocaleLowerCase()
            .includes(search.toLocaleLowerCase().trim()),
    );

    return (
        <View className="mb-4">
            <Text className="mb-1.5 text-sm font-medium text-slate-700">
                {label}
            </Text>
            <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={label}
                disabled={disabled}
                onPress={() => {
                    setSearch('');
                    setOpen(true);
                }}
                className="min-h-[52px] justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3"
            >
                <Text className={value ? 'text-base text-slate-900' : 'text-base text-slate-500'}>
                    {options.find((option) => option.id === value)?.title ||
                        'Chọn từ danh sách'}
                </Text>
            </TouchableOpacity>
            <Modal
                visible={open}
                animationType="slide"
                onRequestClose={() => setOpen(false)}
            >
                <SafeAreaView className="flex-1 bg-fpt-grayBg">
                    <View className="p-5">
                        <Text className="mb-4 text-xl font-bold text-slate-900">
                            {label}
                        </Text>
                        <FptButton
                            title="Đóng"
                            variant="ghost"
                            onPress={() => setOpen(false)}
                        />
                        <FptInput
                            label="Tìm kiếm"
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Nhập tên hoặc email"
                        />
                    </View>
                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ padding: 20, paddingTop: 0 }}
                    >
                        {filtered.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                accessibilityRole="button"
                                accessibilityState={{
                                    selected: option.id === value,
                                }}
                                onPress={() => {
                                    onSelect(option.id);
                                    setOpen(false);
                                }}
                                className={`mb-3 rounded-2xl border p-4 ${option.id === value ? 'border-fpt-orange bg-orange-50' : 'border-slate-200 bg-white'}`}
                            >
                                <Text className="font-bold text-slate-900">
                                    {option.title}
                                </Text>
                                {option.subtitle ? (
                                    <Text className="mt-2 text-xs leading-5 text-slate-500">
                                        {option.subtitle}
                                    </Text>
                                ) : null}
                            </TouchableOpacity>
                        ))}
                        {!filtered.length ? (
                            <FptEmptyState
                                title="Không có lựa chọn phù hợp"
                                description="Thử tìm bằng tên khác."
                            />
                        ) : null}
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </View>
    );
}
