import React, { useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch } from '@/redux/hooks';
import { setLogoutAction } from '@/redux/slice/accountSlice';
import { callLogout } from '@/api';
import { clearAuthStorage } from '@/utils/storage';
import { logoutSession } from '@/utils/logout';
import { FptButton } from './FptButton';

export default function FptLogoutButton() {
    const dispatch = useAppDispatch();
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const confirmLogout = async () => {
        if (loading) return;
        setLoading(true);
        setError('');
        try {
            await logoutSession({
                revoke: callLogout,
                clear: clearAuthStorage,
                reset: () => { dispatch(setLogoutAction()); },
            });
        } catch {
            setError('Chưa thể xóa phiên đăng nhập trên thiết bị. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return <>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Đăng xuất"
            onPress={() => { setError(''); setVisible(true); }}
            className="min-h-[44px] flex-row items-center rounded-xl border border-red-100 bg-red-50 px-3">
            <Ionicons name="log-out-outline" size={19} color="#B42318" />
            <Text className="ml-2 text-sm font-semibold text-red-700">Đăng xuất</Text>
        </TouchableOpacity>
        <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { if (!loading) setVisible(false); }}>
            <View className="flex-1 items-center justify-center bg-black/50 px-6">
                <View accessibilityViewIsModal className="w-full max-w-[400px] rounded-3xl bg-white p-6">
                    <Text accessibilityRole="header" className="text-xl font-bold text-slate-900">Đăng xuất tài khoản?</Text>
                    <Text className="mt-3 text-sm leading-6 text-slate-600">Bạn sẽ trở về màn hình đăng nhập và có thể dùng tài khoản khác.</Text>
                    {error ? <Text accessibilityRole="alert" className="mt-3 text-sm text-red-700">{error}</Text> : null}
                    <View className="mt-6">
                        <FptButton title="Xác nhận đăng xuất" variant="danger" loading={loading} onPress={confirmLogout} />
                        <View className="mt-2"><FptButton title="Ở lại" variant="ghost" disabled={loading} onPress={() => setVisible(false)} /></View>
                    </View>
                </View>
            </View>
        </Modal>
    </>;
}
