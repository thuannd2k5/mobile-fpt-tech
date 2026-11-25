import React, { useState } from 'react';
import {
    View,
    Text,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { callRegister } from '@/api';
import { FptButton, FptInput, FptHeader } from '@/components/common';

export default function RegisterScreen() {
    const router = useRouter();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('MALE');
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleRegister = async () => {
        if (!name.trim() || !email.trim() || !password.trim()) {
            setErrorMessage('Vui lòng điền họ tên, email và mật khẩu.');
            return;
        }

        if (password.length < 6) {
            setErrorMessage('Mật khẩu phải chứa ít nhất 6 ký tự.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setErrorMessage('Định dạng email không hợp lệ.');
            return;
        }

        setErrorMessage('');
        setLoading(true);

        try {
            const parsedAge = parseInt(age, 10) || 20;
            const res = await callRegister(
                name.trim(),
                email.trim(),
                password,
                parsedAge,
                gender,
                address.trim() || 'Hà Nội'
            );

            if (res && res.data) {
                Alert.alert(
                    'Đăng ký thành công',
                    'Tài khoản của bạn đã được tạo thành công! Hãy đăng nhập để bắt đầu học tập.',
                    [
                        {
                            text: 'Đăng nhập ngay',
                            onPress: () => router.replace('/(auth)/login'),
                        },
                    ]
                );
            } else {
                setErrorMessage(res?.message || 'Đăng ký không thành công.');
            }
        } catch (error: any) {
            const msg =
                error?.response?.data?.message ||
                error?.message ||
                'Có lỗi xảy ra khi tạo tài khoản.';
            setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white"
        >
            <FptHeader safeArea title="Tạo tài khoản học viên" showBack />
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="always"
                className="px-6 py-6"
            >
                    <Text className="text-xl font-bold text-gray-900 mb-1">
                        Chào mừng bạn!
                    </Text>
                    <Text className="text-sm text-gray-500 mb-6">
                        Đăng ký tài khoản để tham gia các khóa học tại FPT Education.
                    </Text>

                    {errorMessage ? (
                        <View className="mb-4 flex-row items-center rounded-xl bg-red-50 p-3.5 border border-red-200">
                            <Ionicons name="alert-circle" size={20} color="#EF4444" />
                            <Text className="ml-2.5 flex-1 text-xs font-medium text-red-700">
                                {errorMessage}
                            </Text>
                        </View>
                    ) : null}

                    <FptInput
                        label="Họ và tên *"
                        placeholder="Nguyễn Văn A"
                        value={name}
                        onChangeText={setName}
                        icon={<Ionicons name="person-outline" size={18} color="#718096" />}
                    />

                    <FptInput
                        label="Email *"
                        placeholder="example@gmail.com"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        icon={<Ionicons name="mail-outline" size={18} color="#718096" />}
                    />

                    <FptInput
                        label="Mật khẩu *"
                        placeholder="Tối thiểu 6 ký tự..."
                        value={password}
                        onChangeText={setPassword}
                        isPassword
                        icon={<Ionicons name="lock-closed-outline" size={18} color="#718096" />}
                    />

                    <View className="flex-row justify-between">
                        <View className="w-[48%]">
                            <FptInput
                                label="Tuổi"
                                placeholder="20"
                                value={age}
                                onChangeText={setAge}
                                keyboardType="numeric"
                            />
                        </View>
                        <View className="w-[48%]">
                            <Text className="mb-1.5 text-sm font-medium text-gray-700">Giới tính</Text>
                            <View className="flex-row rounded-xl border border-gray-200 bg-white p-1">
                                <TouchableOpacity
                                    onPress={() => setGender('MALE')}
                                    className={`flex-1 py-2 rounded-lg items-center ${
                                        gender === 'MALE' ? 'bg-orange-500' : 'bg-transparent'
                                    }`}
                                >
                                    <Text
                                        className={`text-xs font-semibold ${
                                            gender === 'MALE' ? 'text-white' : 'text-gray-600'
                                        }`}
                                    >
                                        Nam
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setGender('FEMALE')}
                                    className={`flex-1 py-2 rounded-lg items-center ${
                                        gender === 'FEMALE' ? 'bg-orange-500' : 'bg-transparent'
                                    }`}
                                >
                                    <Text
                                        className={`text-xs font-semibold ${
                                            gender === 'FEMALE' ? 'text-white' : 'text-gray-600'
                                        }`}
                                    >
                                        Nữ
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <FptInput
                        label="Địa chỉ"
                        placeholder="Hà Nội, TP.HCM..."
                        value={address}
                        onChangeText={setAddress}
                        icon={<Ionicons name="location-outline" size={18} color="#718096" />}
                    />

                    <View className="mt-4 mb-8">
                        <FptButton
                            title="Đăng ký tài khoản"
                            onPress={handleRegister}
                            loading={loading}
                            size="lg"
                        />
                    </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
