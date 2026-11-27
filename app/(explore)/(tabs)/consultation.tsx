import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { RoleScreen, RoleHero } from '@/components/common/RoleScreen';
import { FptInput, FptButton } from '@/components/common';
import { callCreateLead } from '@/api';
export default function Consultation() {
    const [form, setForm] = useState({
            full_name: '',
            phone: '',
            email: '',
            course_name: '',
            note: '',
        }),
        [busy, setBusy] = useState(false),
        [message, setMessage] = useState(''),
        [success, setSuccess] = useState(false);
    const submit = async () => {
        if (
            !form.full_name.trim() ||
            !form.phone.trim() ||
            !form.email.trim() ||
            !form.course_name.trim()
        ) {
            setSuccess(false);
            setMessage(
                'Vui lòng nhập họ tên, số điện thoại, email và khóa học.',
            );
            return;
        }
        setBusy(true);
        setMessage('');
        try {
            await callCreateLead(
                Object.fromEntries(
                    Object.entries(form).map(([k, v]) => [k, v.trim()]),
                ) as typeof form,
            );
            setSuccess(true);
            setMessage(
                'Đã gửi yêu cầu. Tư vấn viên sẽ liên hệ qua thông tin bạn cung cấp.',
            );
        } catch {
            setSuccess(false);
            setMessage('Chưa gửi được yêu cầu. Vui lòng thử lại.');
        } finally {
            setBusy(false);
        }
    };
    return (
        <RoleScreen
            eyebrow="Tài khoản mới · Tư vấn"
            title="Tư vấn lộ trình"
            subtitle="Chia sẻ nhu cầu để được hỗ trợ phù hợp."
        >
            <RoleHero
                eyebrow="ADMISSIONS"
                title="Chọn đúng bước đầu."
                description="Để lại thông tin liên hệ và khóa học bạn quan tâm."
            />
            <View className="rounded-2xl bg-white p-5">
                {Object.entries({
                    full_name: 'Họ và tên',
                    phone: 'Số điện thoại',
                    email: 'Email',
                    course_name: 'Khóa học quan tâm',
                    note: 'Mong muốn của bạn',
                }).map(([key, label]) => (
                    <FptInput
                        key={key}
                        label={label}
                        value={form[key as keyof typeof form]}
                        onChangeText={(v) => {
                            setSuccess(false);
                            setMessage('');
                            setForm({ ...form, [key]: v });
                        }}
                        autoCapitalize={key === 'email' ? 'none' : 'sentences'}
                        keyboardType={
                            key === 'email'
                                ? 'email-address'
                                : key === 'phone'
                                  ? 'phone-pad'
                                  : 'default'
                        }
                        multiline={key === 'note'}
                    />
                ))}
                {message ? (
                    <Text
                        accessibilityRole="alert"
                        className={
                            'mb-4 text-sm leading-6 ' +
                            (success ? 'text-emerald-700' : 'text-red-700')
                        }
                    >
                        {message}
                    </Text>
                ) : null}
                <FptButton
                    title={success ? 'Đã gửi yêu cầu' : 'Gửi yêu cầu tư vấn'}
                    loading={busy}
                    disabled={success}
                    onPress={submit}
                />
            </View>
        </RoleScreen>
    );
}
