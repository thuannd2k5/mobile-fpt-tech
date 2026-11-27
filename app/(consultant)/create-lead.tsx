import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { callCreateLead } from '@/api';
import { requireStaffResponse } from '@/api/staff';
import { FptButton, FptInput } from '@/components/common';
import { RoleScreen, RoleSection } from '@/components/common/RoleScreen';

export default function CreateConsultationScreen() {
    const router = useRouter();
    const { course: initialCourse } = useLocalSearchParams<{ course?: string }>();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [course, setCourse] = useState(initialCourse || '');
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [created, setCreated] = useState(false);
    const save = async () => {
        setError('');
        if (![name, phone, email, course].every(value => value.trim())) { setError('Vui lòng nhập họ tên, số điện thoại, email và khóa học quan tâm.'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Email chưa đúng định dạng.'); return; }
        if (phone.replace(/\D/g, '').length < 8) { setError('Vui lòng nhập số điện thoại hợp lệ.'); return; }
        setSaving(true);
        try {
            requireStaffResponse(await callCreateLead({ full_name: name.trim(), phone: phone.trim(), email: email.trim(), course_name: course.trim(), note: note.trim() || undefined }));
            setCreated(true);
        } catch { setError('Không thể tạo yêu cầu tư vấn. Vui lòng thử lại.'); }
        finally { setSaving(false); }
    };
    return <RoleScreen eyebrow="TƯ VẤN VIÊN" title={created ? 'Đã tiếp nhận yêu cầu' : 'Tạo yêu cầu tư vấn'} subtitle={created ? 'Yêu cầu mới đã được gửi đến hộp tư vấn chưa phân công.' : 'Ghi nhận thông tin liên hệ và nhu cầu học tập'}>
        {created ? <FptButton title="Về hộp tư vấn" onPress={() => router.back()} /> : <RoleSection title="Thông tin yêu cầu">
            <View className="rounded-2xl border border-slate-200 bg-white p-4">
                <FptInput label="Họ và tên *" value={name} onChangeText={setName} editable={!saving} autoComplete="name" />
                <FptInput label="Số điện thoại *" value={phone} onChangeText={setPhone} editable={!saving} keyboardType="phone-pad" autoComplete="tel" />
                <FptInput label="Email *" value={email} onChangeText={setEmail} editable={!saving} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
                <FptInput label="Khóa học quan tâm *" value={course} onChangeText={setCourse} editable={!saving} />
                <FptInput label="Ghi chú nhu cầu" value={note} onChangeText={setNote} editable={!saving} multiline />
                {error ? <Text accessibilityRole="alert" className="mb-4 text-sm text-red-600">{error}</Text> : null}
                <FptButton title="Gửi yêu cầu tư vấn" loading={saving} onPress={() => { void save(); }} />
                <FptButton title="Quay lại hộp tư vấn" variant="ghost" disabled={saving} onPress={() => router.back()} />
            </View>
        </RoleSection>}
    </RoleScreen>;
}
