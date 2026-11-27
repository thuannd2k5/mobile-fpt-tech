import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
    callFetchAccount,
    callFetchUsers,
    callFetchRoles,
    callFetchPermissions,
} from '@/api';
import { setUserLoginInfo } from '@/redux/slice/accountSlice';
import axios from '@/api/axios-customize';
import { canUse } from '@/utils/permissions';
import { RoleTile, RoleSection } from '@/components/common/RoleScreen';
import {
    FptHeader,
    FptInput,
    FptButton,
    FptLoading,
    FptEmptyState,
} from '@/components/common';
import FptErrorBanner from '@/components/common/FptErrorBanner';
export default function AccessDirectory({ kind }: { kind: 'users' | 'roles' }) {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((s) => s.account);
    const [items, setItems] = useState<any[]>([]),
        [roles, setRoles] = useState<any[]>([]),
        [permissions, setPermissions] = useState<any[]>([]),
        [query, setQuery] = useState(''),
        [busy, setBusy] = useState(true),
        [error, setError] = useState(''),
        [editing, setEditing] = useState<any>(null),
        [saving, setSaving] = useState(false),
        [selected, setSelected] = useState<string[]>([]),
        [roleId, setRoleId] = useState(''),
        [name, setName] = useState('');
    const allowed = canUse(user.permissions, 'GET', '/api/v1/' + kind);
    const editable = canUse(
        user.permissions,
        'PATCH',
        '/api/v1/' + kind + '/:id',
    );
    const load = useCallback(async () => {
        if (!allowed) {
            setBusy(false);
            return;
        }
        setBusy(true);
        setError('');
        try {
            const list = await (kind === 'users'
                ? callFetchUsers('pageSize=1000&populate=role')
                : callFetchRoles('pageSize=1000&populate=permissions'));
            setItems(list.data?.result || []);
            if (
                kind === 'users' &&
                canUse(user.permissions, 'GET', '/api/v1/roles')
            ) {
                const r = await callFetchRoles('pageSize=1000');
                setRoles(r.data?.result || []);
            }
            if (
                kind === 'roles' &&
                canUse(user.permissions, 'GET', '/api/v1/permissions')
            ) {
                const r = await callFetchPermissions('pageSize=1000');
                setPermissions(r.data?.result || []);
            }
        } catch {
            setError('Không tải được dữ liệu quản trị. Vui lòng thử lại.');
        } finally {
            setBusy(false);
        }
    }, [allowed, kind, user.permissions]);
    useEffect(() => {
        void load();
    }, [load]);
    const open = (item: any) => {
        setEditing(item);
        setName(item.name || '');
        setRoleId(
            typeof item.role === 'string' ? item.role : item.role?._id || '',
        );
        setSelected(
            (item.permissions || []).map((p: any) =>
                typeof p === 'string' ? p : p._id,
            ),
        );
    };
    const save = async () => {
        if (!editing?._id || !editable || !name.trim()) return;
        setSaving(true);
        setError('');
        try {
            const payload =
                kind === 'roles'
                    ? {
                          _id: editing._id,
                          name: name.trim(),
                          description: editing.description || '',
                          isActive: editing.isActive,
                          permissions: selected,
                      }
                    : {
                          _id: editing._id,
                          name: name.trim(),
                          email: editing.email,
                          age: editing.age || 0,
                          gender: editing.gender || '',
                          address: editing.address || '',
                          role: roleId,
                      };
            if (kind === 'users' && !roleId)
                throw new Error('Chọn vai trò cho tài khoản.');
            await axios.patch('/' + kind + '/' + editing._id, payload);
            setEditing(null);
            const account = await callFetchAccount();
            if (account.data?.user)
                dispatch(setUserLoginInfo(account.data.user));
            await load();
        } catch (e: any) {
            setError(e?.message || 'Không lưu được thay đổi.');
        } finally {
            setSaving(false);
        }
    };
    return (
        <View className="flex-1 bg-fpt-grayBg">
            <FptHeader
                title={kind === 'users' ? 'Người dùng' : 'Vai trò & quyền'}
                subtitle="Kiểm soát truy cập hệ thống"
                showBack
                onBack={() => router.replace('/admin')}
            />
            <ScrollView
                contentContainerStyle={{ padding: 20, paddingBottom: 36 }}
            >
                <FptInput
                    placeholder="Tìm theo tên hoặc email"
                    value={query}
                    onChangeText={setQuery}
                />
                {error ? (
                    <FptErrorBanner
                        message={error}
                        onRetry={() => void load()}
                    />
                ) : null}
                {!allowed ? (
                    <FptEmptyState title="Chưa được cấp quyền xem" />
                ) : busy ? (
                    <FptLoading fullScreen={false} />
                ) : (
                    <RoleSection
                        title={
                            kind === 'users'
                                ? 'Danh sách tài khoản'
                                : 'Vai trò trong hệ thống'
                        }
                    >
                        {items
                            .filter((i) =>
                                (i.name + ' ' + (i.email || ''))
                                    .toLowerCase()
                                    .includes(query.toLowerCase()),
                            )
                            .map((i) => (
                                <RoleTile
                                    key={i._id}
                                    icon={
                                        kind === 'users'
                                            ? 'person-outline'
                                            : 'shield-checkmark-outline'
                                    }
                                    title={i.name || i.email}
                                    subtitle={
                                        kind === 'users'
                                            ? i.email +
                                              ' · ' +
                                              (i.role?.name ||
                                                  'Chưa phân vai trò')
                                            : (i.permissions?.length || 0) +
                                              ' quyền · ' +
                                              (i.isActive
                                                  ? 'Đang hoạt động'
                                                  : 'Tạm dừng')
                                    }
                                    onPress={() => open(i)}
                                />
                            ))}
                    </RoleSection>
                )}
            </ScrollView>
            <Modal
                visible={!!editing}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    if (!saving) setEditing(null);
                }}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="max-h-[90%] rounded-t-3xl bg-white p-6">
                        <ScrollView keyboardShouldPersistTaps="handled">
                            <Text className="mb-4 text-xl font-bold text-slate-900">
                                {kind === 'users'
                                    ? 'Thông tin & vai trò'
                                    : 'Quyền của vai trò'}
                            </Text>
                            <FptInput
                                label="Tên hiển thị"
                                value={name}
                                onChangeText={setName}
                                editable={editable}
                            />
                            {kind === 'users' ? (
                                <>
                                    <Text className="mb-3 text-sm text-slate-500">
                                        {editing?.email}
                                    </Text>
                                    {roles.map((r) => (
                                        <TouchableOpacity
                                            key={r._id}
                                            disabled={!editable}
                                            accessibilityRole="radio"
                                            accessibilityState={{
                                                checked: roleId === r._id,
                                            }}
                                            onPress={() => setRoleId(r._id)}
                                            className={
                                                'mb-2 min-h-[44px] rounded-xl border p-3 ' +
                                                (roleId === r._id
                                                    ? 'border-fpt-orange bg-orange-50'
                                                    : 'border-slate-200')
                                            }
                                        >
                                            <Text>{r.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </>
                            ) : (
                                <>
                                    {permissions.map((p) => (
                                        <TouchableOpacity
                                            key={p._id}
                                            disabled={!editable}
                                            accessibilityRole="checkbox"
                                            accessibilityState={{
                                                checked: selected.includes(
                                                    p._id,
                                                ),
                                            }}
                                            onPress={() =>
                                                setSelected((old) =>
                                                    old.includes(p._id)
                                                        ? old.filter(
                                                              (id) =>
                                                                  id !== p._id,
                                                          )
                                                        : [...old, p._id],
                                                )
                                            }
                                            className={
                                                'mb-2 rounded-xl border p-3 ' +
                                                (selected.includes(p._id)
                                                    ? 'border-fpt-orange bg-orange-50'
                                                    : 'border-slate-200')
                                            }
                                        >
                                            <Text className="text-sm font-semibold">
                                                {p.name}
                                            </Text>
                                            <Text className="mt-1 text-xs text-slate-500">
                                                {p.method} · {p.path}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </>
                            )}
                            {error ? (
                                <Text className="mb-3 text-sm text-red-700">
                                    {error}
                                </Text>
                            ) : null}
                            {editable ? (
                                <FptButton
                                    title="Lưu thay đổi"
                                    loading={saving}
                                    disabled={
                                        kind === 'roles'
                                            ? !permissions.length
                                            : !roles.length
                                    }
                                    onPress={save}
                                />
                            ) : null}
                            <View className="mt-3">
                                <FptButton
                                    title="Đóng"
                                    variant="ghost"
                                    disabled={saving}
                                    onPress={() => setEditing(null)}
                                />
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
