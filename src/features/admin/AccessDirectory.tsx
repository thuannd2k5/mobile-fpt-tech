import React, { useCallback, useEffect, useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  callFetchAccount,
  callFetchUsers,
  callFetchRoles,
  callFetchPermissions,
} from "@/api";
import { setLogoutAction, setUserLoginInfo } from "@/redux/slice/accountSlice";
import axios from "@/api/axios-customize";
import { IBackendRes } from "@/types/backend";
import { canUse } from "@/utils/permissions";
import { confirmAction } from "@/utils/confirmAction";
import { RoleTile, RoleSection } from "@/components/common/RoleScreen";
import {
  FptHeader,
  FptInput,
  FptButton,
  FptLoading,
  FptEmptyState,
} from "@/components/common";
import FptErrorBanner from "@/components/common/FptErrorBanner";

interface UserDraft {
  name: string;
  email: string;
  phone: string;
  age: string;
  gender: string;
  address: string;
  birthday: string;
  subject: string;
  experience_years: string;
  status: string;
}

const emptyUserDraft: UserDraft = {
  name: "",
  email: "",
  phone: "",
  age: "",
  gender: "",
  address: "",
  birthday: "",
  subject: "",
  experience_years: "",
  status: "ACTIVE",
};

export default function AccessDirectory({ kind }: { kind: "users" | "roles" }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.account);
  const [items, setItems] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [roleId, setRoleId] = useState("");
  const [name, setName] = useState("");
  const [profile, setProfile] = useState<UserDraft>(emptyUserDraft);
  const allowed = canUse(user.permissions, "GET", "/api/v1/" + kind);
  const editable = canUse(
    user.permissions,
    "PATCH",
    "/api/v1/" + kind + "/:id",
  );

  const load = useCallback(async () => {
    if (!allowed) {
      setBusy(false);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const list = await (kind === "users"
        ? callFetchUsers("pageSize=1000&populate=role")
        : callFetchRoles("pageSize=1000&populate=permissions"));
      setItems(list.data?.result || []);
      if (
        kind === "users" &&
        canUse(user.permissions, "GET", "/api/v1/roles")
      ) {
        const r = await callFetchRoles("pageSize=1000");
        setRoles(r.data?.result || []);
      }
      if (
        kind === "roles" &&
        canUse(user.permissions, "GET", "/api/v1/permissions")
      ) {
        const r = await callFetchPermissions("pageSize=1000");
        setPermissions(r.data?.result || []);
      }
    } catch {
      setError("Không tải được dữ liệu quản trị. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }, [allowed, kind, user.permissions]);

  useEffect(() => {
    void load();
  }, [load]);

  const open = (item: any) => {
    setEditing(item);
    setIsEditing(false);
    setError("");
    setName(item.name || "");
    setRoleId(typeof item.role === "string" ? item.role : item.role?._id || "");
    setSelected(
      (item.permissions || []).map((p: any) =>
        typeof p === "string" ? p : p._id,
      ),
    );
    setProfile({
      name: item.name || "",
      email: item.email || "",
      phone: item.phone || "",
      age: item.age == null ? "" : String(item.age),
      gender: item.gender || "",
      address: item.address || "",
      birthday: item.birthday ? String(item.birthday).slice(0, 10) : "",
      subject: item.subject || "",
      experience_years:
        item.experience_years == null ? "" : String(item.experience_years),
      status: item.status || "ACTIVE",
    });
  };

  const save = async (statusOverride?: string) => {
    if (!editing?._id || !editable || !name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const payload =
        kind === "roles"
          ? {
              _id: editing._id,
              name: name.trim(),
              description: editing.description || "",
              isActive: editing.isActive,
              permissions: selected,
            }
          : {
              _id: editing._id,
              name: profile.name.trim(),
              email: profile.email.trim(),
              phone: profile.phone.trim(),
              age: profile.age.trim() ? Number(profile.age) : undefined,
              gender: profile.gender.trim(),
              address: profile.address.trim(),
              birthday: profile.birthday.trim() || undefined,
              subject: profile.subject.trim(),
              experience_years: profile.experience_years.trim()
                ? Number(profile.experience_years)
                : undefined,
              status: statusOverride || profile.status,
              role: roleId,
            };
      if (kind === "users" && !roleId)
        throw new Error("Chọn vai trò cho tài khoản.");
      if (kind === "users" && (!profile.email.trim() || !profile.name.trim()))
        throw new Error("Họ tên và email không được để trống.");
      const response = await axios.patch<
        any,
        IBackendRes<{ matchedCount?: number }>
      >("/" + kind + "/" + editing._id, payload);
      if (!response.data || response.data.matchedCount === 0) {
        throw new Error(
          response.message || "Không tìm thấy bản ghi cần cập nhật.",
        );
      }
      setEditing({
        ...editing,
        ...payload,
        role:
          kind === "users"
            ? roles.find((item) => item._id === roleId) || editing.role
            : editing.role,
      });
      if (statusOverride) {
        setProfile((current) => ({ ...current, status: statusOverride }));
      }
      setIsEditing(false);
      if (kind === "users" && editing._id === user._id) {
        if (statusOverride === "INACTIVE") {
          dispatch(setLogoutAction());
          return;
        }
        const account = await callFetchAccount();
        if (account.data?.user) dispatch(setUserLoginInfo(account.data.user));
      }
      await load();
    } catch (e: any) {
      setError(e?.message || "Không lưu được thay đổi.");
    } finally {
      setSaving(false);
    }
  };

  const toggleAccountStatus = () => {
    const nextStatus =
      profile.status.toUpperCase() === "INACTIVE" ? "ACTIVE" : "INACTIVE";
    confirmAction(
      nextStatus === "INACTIVE" ? "Đóng tài khoản?" : "Mở lại tài khoản?",
      nextStatus === "INACTIVE"
        ? "Người dùng sẽ không thể đăng nhập hoặc tiếp tục sử dụng tài khoản."
        : "Người dùng sẽ có thể đăng nhập lại.",
      nextStatus === "INACTIVE" ? "Đóng tài khoản" : "Mở tài khoản",
      () => void save(nextStatus),
      nextStatus === "INACTIVE",
    );
  };

  const updateProfile = (field: keyof UserDraft, value: string) =>
    setProfile((current) => ({ ...current, [field]: value }));

  return (
    <View className="flex-1 bg-fpt-grayBg">
      <FptHeader
        title={kind === "users" ? "Người dùng" : "Vai trò & quyền"}
        subtitle="Kiểm soát truy cập hệ thống"
        showBack
        onBack={() => router.replace("/admin")}
      />
      <View className="flex-1">
        <View className="px-5 pt-4">
          <FptInput
            placeholder="Tìm theo tên hoặc email"
            value={query}
            onChangeText={setQuery}
          />
          {error ? (
            <FptErrorBanner message={error} onRetry={() => void load()} />
          ) : null}
        </View>
        {!allowed ? (
          <FptEmptyState title="Chưa được cấp quyền xem" />
        ) : busy ? (
          <FptLoading fullScreen={false} />
        ) : (
          <ScrollView
            className="flex-1 px-5"
            contentContainerStyle={{ paddingBottom: 32 }}
          >
            <RoleSection
              title={
                kind === "users"
                  ? "Danh sách tài khoản"
                  : "Vai trò trong hệ thống"
              }
            >
              {items
                .filter((i) =>
                  (i.name + " " + (i.email || ""))
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .map((i) => (
                  <RoleTile
                    key={i._id}
                    icon={
                      kind === "users"
                        ? "person-outline"
                        : "shield-checkmark-outline"
                    }
                    title={i.name || i.email}
                    subtitle={
                      kind === "users"
                        ? `${i.email || "Chưa có email"} · ${i.role?.name || "Chưa phân vai trò"} · ${i.status || "ACTIVE"}`
                        : (i.permissions?.length || 0) +
                          " quyền · " +
                          (i.isActive ? "Đang hoạt động" : "Tạm dừng")
                    }
                    onPress={() => open(i)}
                  />
                ))}
            </RoleSection>
          </ScrollView>
        )}
      </View>
      <Modal
        visible={!!editing}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!saving) setEditing(null);
        }}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="max-h-[92%] flex-1 rounded-t-3xl bg-white p-5">
            <View className="mb-4 flex-row gap-3">
              {editable && isEditing ? (
                <FptButton
                  title="Lưu thay đổi"
                  loading={saving}
                  disabled={kind === "roles" ? !permissions.length : !roleId}
                  className="flex-1"
                  onPress={() => void save()}
                />
              ) : editable ? (
                <FptButton
                  title="Chỉnh sửa"
                  disabled={saving}
                  className="flex-1"
                  onPress={() => setIsEditing(true)}
                />
              ) : null}
              <FptButton
                title={isEditing ? "Hủy chỉnh sửa" : "Xong"}
                variant="ghost"
                disabled={saving}
                className="flex-1"
                onPress={() => {
                  if (isEditing && editing) open(editing);
                  else setEditing(null);
                }}
              />
            </View>
            <ScrollView
              className="flex-1"
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              <Text className="mb-4 text-xl font-bold text-slate-900">
                {kind === "users"
                  ? "Thông tin người dùng"
                  : "Quyền của vai trò"}
              </Text>
              {kind === "users" ? (
                <>
                  <View className="mb-4 rounded-xl bg-slate-50 p-3">
                    <Text className="text-xs font-semibold text-slate-500">
                      Mã tài khoản
                    </Text>
                    <Text selectable className="mt-1 text-sm text-slate-900">
                      {editing?._id || "Chưa cập nhật"}
                    </Text>
                    <Text className="mt-3 text-xs font-semibold text-slate-500">
                      Ngày tạo · Cập nhật lần cuối
                    </Text>
                    <Text className="mt-1 text-sm text-slate-900">
                      {editing?.createdAt || "Chưa cập nhật"} ·{" "}
                      {editing?.updatedAt || "Chưa cập nhật"}
                    </Text>
                  </View>
                  {isEditing ? (
                    <>
                      <FptInput
                        label="Tên"
                        value={profile.name}
                        onChangeText={(value) => updateProfile("name", value)}
                        editable={editable}
                      />
                      <FptInput
                        label="Email"
                        value={profile.email}
                        onChangeText={(value) => updateProfile("email", value)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={editable}
                      />
                      <FptInput
                        label="Số điện thoại"
                        value={profile.phone}
                        onChangeText={(value) => updateProfile("phone", value)}
                        keyboardType="phone-pad"
                        editable={editable}
                      />
                      <FptInput
                        label="Tuổi"
                        value={profile.age}
                        onChangeText={(value) => updateProfile("age", value)}
                        keyboardType="numeric"
                        editable={editable}
                      />
                      <FptInput
                        label="Giới tính"
                        value={profile.gender}
                        onChangeText={(value) => updateProfile("gender", value)}
                        editable={editable}
                      />
                      <FptInput
                        label="Ngày sinh (YYYY-MM-DD)"
                        value={profile.birthday}
                        onChangeText={(value) =>
                          updateProfile("birthday", value)
                        }
                        editable={editable}
                      />
                      <FptInput
                        label="Địa chỉ"
                        value={profile.address}
                        onChangeText={(value) =>
                          updateProfile("address", value)
                        }
                        editable={editable}
                        multiline
                      />
                      <FptInput
                        label="Chuyên môn"
                        value={profile.subject}
                        onChangeText={(value) =>
                          updateProfile("subject", value)
                        }
                        editable={editable}
                      />
                      <FptInput
                        label="Số năm kinh nghiệm"
                        value={profile.experience_years}
                        onChangeText={(value) =>
                          updateProfile("experience_years", value)
                        }
                        keyboardType="numeric"
                        editable={editable}
                      />
                      <Text className="mb-3 text-sm font-semibold text-slate-700">
                        Chọn vai trò
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
                            "mb-2 min-h-[44px] rounded-xl border p-3 " +
                            (roleId === r._id
                              ? "border-fpt-orange bg-orange-50"
                              : "border-slate-200")
                          }
                        >
                          <Text>{r.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </>
                  ) : (
                    <>
                      {[
                        ["Tên", editing?.name],
                        ["Email", editing?.email],
                        ["Số điện thoại", editing?.phone],
                        ["Tuổi", editing?.age],
                        ["Giới tính", editing?.gender],
                        ["Ngày sinh", editing?.birthday],
                        ["Địa chỉ", editing?.address],
                        ["Chuyên môn", editing?.subject],
                        ["Kinh nghiệm (năm)", editing?.experience_years],
                        [
                          "Vai trò",
                          editing?.role?.name ||
                            roles.find((item) => item._id === roleId)?.name,
                        ],
                        ["Trạng thái", editing?.status],
                      ].map(([label, value]) => (
                        <View
                          key={label}
                          className="mb-3 rounded-xl bg-slate-50 p-3"
                        >
                          <Text className="text-xs font-semibold text-slate-500">
                            {label}
                          </Text>
                          <Text
                            selectable
                            className="mt-1 text-sm text-slate-900"
                          >
                            {value == null || value === ""
                              ? "Chưa cập nhật"
                              : String(value)}
                          </Text>
                        </View>
                      ))}
                    </>
                  )}
                </>
              ) : (
                <>
                  {isEditing ? (
                    <>
                      <FptInput
                        label="Tên vai trò"
                        value={name}
                        onChangeText={setName}
                        editable={editable}
                      />
                      <Text className="mb-3 text-sm text-slate-500">
                        Chọn các quyền được cấp cho vai trò này.
                      </Text>
                      {permissions.map((p) => (
                        <TouchableOpacity
                          key={p._id}
                          disabled={!editable}
                          accessibilityRole="checkbox"
                          accessibilityState={{
                            checked: selected.includes(p._id),
                          }}
                          onPress={() =>
                            setSelected((old) =>
                              old.includes(p._id)
                                ? old.filter((id) => id !== p._id)
                                : [...old, p._id],
                            )
                          }
                          className={
                            "mb-2 rounded-xl border p-3 " +
                            (selected.includes(p._id)
                              ? "border-fpt-orange bg-orange-50"
                              : "border-slate-200")
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
                  ) : (
                    <>
                      {[
                        ["Tên vai trò", editing?.name],
                        ["Mô tả", editing?.description],
                        [
                          "Trạng thái",
                          editing?.isActive ? "Đang hoạt động" : "Tạm dừng",
                        ],
                      ].map(([label, value]) => (
                        <View
                          key={label}
                          className="mb-3 rounded-xl bg-slate-50 p-3"
                        >
                          <Text className="text-xs font-semibold text-slate-500">
                            {label}
                          </Text>
                          <Text className="mt-1 text-sm text-slate-900">
                            {String(value || "Chưa cập nhật")}
                          </Text>
                        </View>
                      ))}
                      <Text className="mb-2 mt-3 text-sm font-semibold text-slate-700">
                        Quyền được cấp
                      </Text>
                      {permissions
                        .filter((permission) =>
                          selected.includes(permission._id),
                        )
                        .map((permission) => (
                          <View
                            key={permission._id}
                            className="mb-2 rounded-xl border border-slate-200 p-3"
                          >
                            <Text className="text-sm font-semibold">
                              {permission.name}
                            </Text>
                            <Text className="mt-1 text-xs text-slate-500">
                              {permission.method} · {permission.path}
                            </Text>
                          </View>
                        ))}
                    </>
                  )}
                </>
              )}
              {error ? (
                <Text
                  accessibilityRole="alert"
                  className="mb-3 mt-2 text-sm text-red-700"
                >
                  {error}
                </Text>
              ) : null}
            </ScrollView>
            {kind === "users" && editable ? (
              <View className="border-t border-slate-100 pt-3">
                <FptButton
                  title={
                    profile.status.toUpperCase() === "INACTIVE"
                      ? "Mở lại tài khoản"
                      : "Đóng tài khoản"
                  }
                  variant={
                    profile.status.toUpperCase() === "INACTIVE"
                      ? "secondary"
                      : "danger"
                  }
                  disabled={saving}
                  onPress={toggleAccountStatus}
                />
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}
