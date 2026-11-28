import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAppSelector } from "@/redux/hooks";
import {
  callCreatePermission,
  callFetchClassroom,
  callFetchCourse,
  callFetchInvoices,
  callFetchLeads,
  callFetchPermissions,
  callFetchRoles,
  callFetchUsers,
} from "@/api";
import axios from "@/api/axios-customize";
import { IBackendRes, IModelPaginate } from "@/types/backend";
import { getDefaultRouteForRole, isBackofficeRole } from "@/types/portal";
import { canUse } from "@/utils/permissions";
import { confirmAction } from "@/utils/confirmAction";
import { FptSuggestionInput } from "@/components/common/FptSuggestionInput";
import {
  formatCoursePriceSuggestion,
  getCourseInputSuggestions,
} from "@/utils/courseSuggestions";
import {
  FptButton,
  FptEmptyState,
  FptHeader,
  FptInput,
  FptLoading,
} from "@/components/common";
import FptErrorBanner from "@/components/common/FptErrorBanner";

type AdminRecord = Record<string, any>;
type ModuleKey =
  | "users"
  | "roles"
  | "permissions"
  | "courses"
  | "classrooms"
  | "invoices"
  | "leads";
type EditableModule = "courses" | "classrooms" | "invoices" | "leads";
type FieldDefinition = {
  key: string;
  label: string;
  multiline?: boolean;
  keyboardType?:
    "default" | "numeric" | "decimal-pad" | "email-address" | "phone-pad";
};

const definitions: Record<
  ModuleKey,
  {
    title: string;
    request: () => Promise<IBackendRes<IModelPaginate<AdminRecord>>>;
    label: (item: AdminRecord) => string;
    detail: (item: AdminRecord) => string;
  }
> = {
  users: {
    title: "Người dùng",
    request: () => callFetchUsers("pageSize=100"),
    label: (item) => item.name || item.email,
    detail: (item) =>
      `${item.email || "Không có email"} · ${item.role?.name || "Chưa phân vai trò"}`,
  },
  roles: {
    title: "Vai trò",
    request: () => callFetchRoles("pageSize=100"),
    label: (item) => item.name || "Vai trò",
    detail: (item) =>
      item.description || `${item.permissions?.length || 0} quyền`,
  },
  permissions: {
    title: "Phân quyền",
    request: () => callFetchPermissions("pageSize=100"),
    label: (item) => item.name || item.path || "Quyền",
    detail: (item) =>
      `${item.method || "GET"} · ${item.module || item.path || ""}`,
  },
  courses: {
    title: "Khóa học",
    request: () => callFetchCourse("pageSize=100"),
    label: (item) => item.name || "Khóa học",
    detail: (item) =>
      `${item.level || "Chưa phân cấp"} · ${item.duration || "Chưa cập nhật"}`,
  },
  classrooms: {
    title: "Lớp học",
    request: () =>
      callFetchClassroom("pageSize=100&populate=course_id,teacher_id"),
    label: (item) => item.class_name || item.course_id?.name || "Lớp học",
    detail: (item) =>
      `${item.course_id?.name || "Chưa có khóa học"} · ${item.status || "N/A"}`,
  },
  invoices: {
    title: "Hóa đơn",
    request: () => callFetchInvoices("pageSize=100&populate=enrollment_id"),
    label: (item) => {
      const studentName = item.enrollment_id?.student_id?.name;
      const invoiceId = String(item._id || "").slice(-6);
      return `${studentName ? `${studentName} · ` : ""}Hóa đơn #${invoiceId}`;
    },
    detail: (item) =>
      `${Number(item.final_amount ?? item.amount ?? 0).toLocaleString("vi-VN")} ₫ · ${item.status || "N/A"}`,
  },
  leads: {
    title: "Khách hàng",
    request: () => callFetchLeads("pageSize=100&populate=consultant_id"),
    label: (item) => item.full_name || item.name || "Khách hàng",
    detail: (item) =>
      `${item.phone || item.email || "Chưa có liên hệ"} · ${item.status || "NEW"}`,
  },
};

const editableModules: EditableModule[] = [
  "courses",
  "classrooms",
  "invoices",
  "leads",
];

const editableFields: Record<EditableModule, FieldDefinition[]> = {
  courses: [
    { key: "name", label: "Tên khóa học" },
    { key: "description", label: "Mô tả", multiline: true },
    { key: "level", label: "Trình độ" },
    { key: "duration", label: "Thời lượng" },
    { key: "price", label: "Học phí", keyboardType: "decimal-pad" },
  ],
  classrooms: [
    { key: "class_name", label: "Tên lớp" },
    { key: "room", label: "Phòng học" },
    { key: "max_student", label: "Sĩ số tối đa", keyboardType: "numeric" },
    { key: "start_time", label: "Giờ bắt đầu (HH:mm)" },
    { key: "end_time", label: "Giờ kết thúc (HH:mm)" },
  ],
  invoices: [
    { key: "amount", label: "Học phí", keyboardType: "decimal-pad" },
    { key: "discount_amount", label: "Giảm trừ", keyboardType: "decimal-pad" },
  ],
  leads: [
    { key: "full_name", label: "Họ tên khách hàng" },
    { key: "phone", label: "Số điện thoại", keyboardType: "phone-pad" },
    { key: "email", label: "Email", keyboardType: "email-address" },
    { key: "course_name", label: "Khóa học quan tâm" },
    { key: "note", label: "Ghi chú", multiline: true },
  ],
};

const statusChoices: Record<EditableModule, string[]> = {
  courses: ["ACTIVE", "INACTIVE"],
  classrooms: ["OPEN", "FULL", "COMPLETED", "CANCELLED"],
  invoices: ["UNPAID", "WAITING_CONFIRMATION", "PARTIAL", "PAID", "CANCELLED"],
  leads: ["NEW", "CONTACTED", "ENROLLED", "CANCELLED"],
};

const closeStatus: Record<EditableModule, string> = {
  courses: "INACTIVE",
  classrooms: "CANCELLED",
  invoices: "CANCELLED",
  leads: "CANCELLED",
};

const reopenStatus: Record<EditableModule, string> = {
  courses: "ACTIVE",
  classrooms: "OPEN",
  invoices: "UNPAID",
  leads: "NEW",
};

const statusActionLabels: Record<EditableModule, [string, string]> = {
  courses: ["Đóng khóa học", "Mở lại khóa học"],
  classrooms: ["Đóng lớp học", "Mở lại lớp học"],
  invoices: ["Hủy hóa đơn", "Mở lại hóa đơn"],
  leads: ["Đóng khách hàng", "Mở lại khách hàng"],
};

const asId = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "_id" in value) {
    return String((value as { _id?: unknown })._id || "");
  }
  return "";
};

const displayValue = (value: unknown): string => {
  if (value == null || value === "") return "Chưa cập nhật";
  if (typeof value === "object") {
    if ("name" in value)
      return String((value as { name?: unknown }).name || asId(value));
    if ("_id" in value)
      return String((value as { _id?: unknown })._id || "Chưa cập nhật");
    return JSON.stringify(value);
  }
  return String(value);
};

const recordDetails = (module: ModuleKey, item: AdminRecord) => {
  const common = [
    ["Mã bản ghi", item._id],
    ["Ngày tạo", item.createdAt],
    ["Cập nhật lần cuối", item.updatedAt],
  ];
  const byModule: Record<ModuleKey, [string, unknown][]> = {
    users: [
      ["Họ tên", item.name],
      ["Email", item.email],
      ["Số điện thoại", item.phone],
      ["Tuổi", item.age],
      ["Giới tính", item.gender],
      ["Ngày sinh", item.birthday],
      ["Địa chỉ", item.address],
      ["Chuyên môn", item.subject],
      ["Kinh nghiệm (năm)", item.experience_years],
      ["Vai trò", item.role],
      ["Trạng thái", item.status],
    ],
    roles: [
      ["Tên vai trò", item.name],
      ["Mô tả", item.description],
      ["Trạng thái", item.isActive ? "Đang hoạt động" : "Tạm dừng"],
      ["Quyền", item.permissions],
    ],
    permissions: [
      ["Tên quyền", item.name],
      ["Phương thức", item.method],
      ["Đường dẫn", item.path],
      ["Phân hệ", item.module],
    ],
    courses: [
      ["Tên khóa học", item.name],
      ["Mô tả", item.description],
      ["Trình độ", item.level],
      ["Thời lượng", item.duration],
      ["Học phí", item.price],
      ["Trạng thái", item.status],
    ],
    classrooms: [
      ["Tên lớp", item.class_name],
      ["Khóa học", item.course_id],
      ["Giảng viên", item.teacher_id],
      ["Phòng học", item.room],
      ["Sĩ số tối đa", item.max_student],
      ["Giờ bắt đầu", item.start_time],
      ["Giờ kết thúc", item.end_time],
      ["Trạng thái", item.status],
    ],
    invoices: [
      ["Học viên", item.enrollment_id?.student_id?.name],
      ["Ghi danh", item.enrollment_id],
      ["Học phí", item.amount],
      ["Giảm trừ", item.discount_amount],
      ["Thành tiền", item.final_amount],
      ["Trạng thái", item.status],
    ],
    leads: [
      ["Họ tên", item.full_name || item.name],
      ["Số điện thoại", item.phone],
      ["Email", item.email],
      ["Khóa học quan tâm", item.course_name],
      ["Tư vấn viên", item.consultant_id],
      ["Trạng thái", item.status],
      ["Ghi chú", item.note],
    ],
  };
  return [...byModule[module], ...common];
};

const parseDraft = (item: AdminRecord, module: EditableModule) => {
  const draft: Record<string, string> = {};
  editableFields[module].forEach(({ key }) => {
    const value = item[key];
    draft[key] = value == null ? "" : String(value);
  });
  if (module === "classrooms") {
    draft.course_id = asId(item.course_id);
    draft.teacher_id = asId(item.teacher_id);
  }
  if (module === "invoices") {
    draft.status = item.status || "UNPAID";
    draft.enrollment_id = asId(item.enrollment_id);
  }
  if (module === "leads") {
    draft.status = item.status || "NEW";
    draft.consultant_id = asId(item.consultant_id);
  }
  if (module === "courses") draft.status = item.status || "ACTIVE";
  if (module === "classrooms") draft.status = item.status || "OPEN";
  return draft;
};

const currentStatus = (module: EditableModule, status: string) =>
  status.toUpperCase() === closeStatus[module];

export default function AdminModuleScreen() {
  const router = useRouter();
  const { module } = useLocalSearchParams<{ module: string }>();
  const { user, isAuthenticated } = useAppSelector((state) => state.account);
  const isValidModule = Object.prototype.hasOwnProperty.call(
    definitions,
    module,
  );
  const key = (isValidModule ? module : "users") as ModuleKey;
  const definition = definitions[key];
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [items, setItems] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState<AdminRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [permissionDraft, setPermissionDraft] = useState({
    name: "",
    path: "",
    method: "GET",
    module: "",
  });
  const [showPermissionForm, setShowPermissionForm] = useState(false);
  const [courses, setCourses] = useState<AdminRecord[]>([]);
  const [teachers, setTeachers] = useState<AdminRecord[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [editorError, setEditorError] = useState("");
  const [statusError, setStatusError] = useState("");
  const courseSuggestions = useMemo(
    () =>
      getCourseInputSuggestions(
        items.map((item) => ({
          level: item.level,
          duration: item.duration,
          price: item.price,
        })),
      ),
    [items],
  );
  const canRead = canUse(user.permissions, "GET", `/api/v1/${key}`);
  const canCreatePermission =
    key === "permissions" &&
    canUse(user.permissions, "POST", "/api/v1/permissions");
  const canEdit = (recordModule: EditableModule) =>
    canUse(user.permissions, "PATCH", `/api/v1/${recordModule}/:id`);

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await definition.request();
      setItems(response?.data?.result || []);
    } catch {
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [definition]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/(auth)/login");
      return;
    }
    if (!isBackofficeRole(user.role?.name)) {
      router.replace(getDefaultRouteForRole(user.role?.name) as never);
      return;
    }
    if (!isValidModule) {
      router.replace("/admin");
      return;
    }
    if (canRead) void load();
    else setLoading(false);
  }, [canRead, isAuthenticated, isValidModule, load, router, user.role?.name]);

  const visibleItems = useMemo(
    () =>
      items.filter((item) =>
        (definition.label(item) + " " + definition.detail(item))
          .toLowerCase()
          .includes(query.toLowerCase().trim()),
      ),
    [definition, items, query],
  );

  const openRecord = async (item: AdminRecord) => {
    setEditing(item);
    setIsEditing(false);
    setEditorError("");
    setStatusError("");
    if (editableModules.includes(key as EditableModule)) {
      const editKey = key as EditableModule;
      setDraft(parseDraft(item, editKey));
      if (editKey === "classrooms") {
        setLoadingOptions(true);
        try {
          const [courseResponse, userResponse] = await Promise.all([
            callFetchCourse("pageSize=1000"),
            callFetchUsers("pageSize=1000&populate=role"),
          ]);
          setCourses(courseResponse.data?.result || []);
          const availableTeachers = (userResponse.data?.result || []).filter(
            (candidate: AdminRecord) =>
              candidate.role?.name?.toUpperCase() === "TEACHER" &&
              candidate.status?.toUpperCase() === "ACTIVE",
          );
          if (
            item.teacher_id?._id &&
            !availableTeachers.some(
              (candidate: AdminRecord) => candidate._id === item.teacher_id._id,
            )
          ) {
            availableTeachers.unshift(item.teacher_id);
          }
          setTeachers(availableTeachers);
        } catch {
          setEditorError(
            "Không tải được danh sách khóa học hoặc giảng viên. Vui lòng đóng và thử lại.",
          );
        } finally {
          setLoadingOptions(false);
        }
      }
    }
  };

  const saveRecord = async () => {
    if (!editing?._id || !editableModules.includes(key as EditableModule))
      return;
    const editKey = key as EditableModule;
    if (!canEdit(editKey)) {
      setEditorError("Tài khoản chưa được cấp quyền chỉnh sửa bản ghi này.");
      return;
    }

    const payload: Record<string, unknown> = { _id: editing._id };
    editableFields[editKey].forEach(({ key: field }) => {
      payload[field] = draft[field]?.trim() || "";
    });
    payload.status = draft.status || statusChoices[editKey][0];

    if (editKey === "classrooms") {
      if (!draft.course_id || !draft.teacher_id) {
        setEditorError("Vui lòng chọn khóa học và giảng viên.");
        return;
      }
      payload.course_id = draft.course_id;
      payload.teacher_id = draft.teacher_id;
      if (!draft.class_name?.trim() || !draft.room?.trim()) {
        setEditorError("Tên lớp và phòng học không được để trống.");
        return;
      }
    }
    if (editKey === "courses" && !draft.name?.trim()) {
      setEditorError("Tên khóa học không được để trống.");
      return;
    }
    if (editKey === "leads") {
      if (
        !draft.full_name?.trim() ||
        !draft.phone?.trim() ||
        !draft.email?.trim() ||
        !draft.course_name?.trim()
      ) {
        setEditorError(
          "Vui lòng nhập họ tên, số điện thoại, email và khóa học.",
        );
        return;
      }
      payload.consultant_id = draft.consultant_id || undefined;
    }
    if (editKey === "invoices") {
      const amount = Number(draft.amount);
      const discount = Number(draft.discount_amount);
      if (
        !draft.amount?.trim() ||
        !draft.discount_amount?.trim() ||
        !Number.isFinite(amount) ||
        !Number.isFinite(discount) ||
        amount < 0 ||
        discount < 0 ||
        discount > amount
      ) {
        setEditorError(
          "Học phí và giảm trừ phải hợp lệ, giảm trừ không vượt quá học phí.",
        );
        return;
      }
      payload.amount = amount;
      payload.discount_amount = discount;
      payload.final_amount = amount - discount;
      payload.enrollment_id = asId(editing.enrollment_id);
    }
    setSaving(true);
    setEditorError("");
    try {
      const response = await axios.patch<
        any,
        IBackendRes<{ matchedCount?: number }>
      >(`/${editKey}/${editing._id}`, payload);
      if (!response.data || response.data.matchedCount === 0) {
        throw new Error(
          response.message || "Không tìm thấy bản ghi cần cập nhật.",
        );
      }
      setEditing((current) => (current ? { ...current, ...payload } : current));
      setIsEditing(false);
      await load();
    } catch (reason: any) {
      setEditorError(
        reason?.message || "Không thể lưu thay đổi. Vui lòng thử lại.",
      );
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = (item: AdminRecord, editKey: EditableModule) => {
    if (!item._id || !canEdit(editKey)) return;
    const nextStatus = currentStatus(editKey, item.status || "")
      ? reopenStatus[editKey]
      : closeStatus[editKey];
    const action = nextStatus === closeStatus[editKey] ? "đóng" : "mở lại";
    confirmAction(
      `${action[0].toUpperCase()}${action.slice(1)} bản ghi?`,
      `Trạng thái sẽ chuyển thành ${nextStatus}.`,
      action,
      () => {
        void (async () => {
          const isCurrentRecord = editing?._id === item._id;
          if (isCurrentRecord) setStatusError("");
          else setError("");
          try {
            const response = await axios.patch<
              any,
              IBackendRes<{ matchedCount?: number }>
            >(`/${editKey}/${item._id}`, {
              _id: item._id,
              status: nextStatus,
            });
            if (!response.data || response.data.matchedCount === 0) {
              throw new Error(
                response.message || "Không tìm thấy bản ghi cần cập nhật.",
              );
            }
            await load();
            if (isCurrentRecord) {
              setEditing({
                ...item,
                status: nextStatus,
              });
              setDraft((current) => ({
                ...current,
                status: nextStatus,
              }));
            }
          } catch (reason: any) {
            const message =
              reason?.message || "Không cập nhật được trạng thái.";
            if (isCurrentRecord) setStatusError(message);
            else setError(message);
          }
        })();
      },
      action === "đóng",
    );
  };

  const createPermission = async () => {
    if (!canCreatePermission) return;
    const payload = {
      name: permissionDraft.name.trim(),
      path: permissionDraft.path.trim(),
      method: permissionDraft.method.trim().toUpperCase(),
      module: permissionDraft.module.trim(),
    };
    if (!payload.name || !payload.path || !payload.module) {
      setEditorError("Vui lòng nhập tên quyền, đường dẫn và phân hệ.");
      return;
    }
    if (!["GET", "POST", "PATCH", "PUT", "DELETE"].includes(payload.method)) {
      setEditorError("Phương thức phải là GET, POST, PATCH, PUT hoặc DELETE.");
      return;
    }
    setSaving(true);
    setEditorError("");
    try {
      const response = await callCreatePermission(payload);
      if (!response.data) {
        throw new Error(response.message || "Không tạo được quyền mới.");
      }
      setShowPermissionForm(false);
      setPermissionDraft({
        name: "",
        path: "",
        method: "GET",
        module: "",
      });
      await load();
    } catch (reason: any) {
      setEditorError(
        reason?.message || "Không thể tạo quyền. Vui lòng thử lại.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated || !isBackofficeRole(user.role?.name)) return null;
  if (loading && !refreshing)
    return (
      <FptLoading message={`Đang tải ${definition.title.toLowerCase()}...`} />
    );

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["bottom"]}>
      <FptHeader
        title={definition.title}
        subtitle={`${items.length} bản ghi hiển thị`}
        showBack
        onBack={() => router.replace("/admin")}
      />
      <View className="px-5 pt-3">
        <FptInput
          accessibilityLabel="Tìm bản ghi"
          placeholder="Tìm tên, mã hoặc trạng thái…"
          value={query}
          onChangeText={setQuery}
        />
        {canCreatePermission ? (
          <FptButton
            title="Thêm quyền"
            className="mb-3"
            onPress={() => {
              setEditorError("");
              setShowPermissionForm(true);
            }}
          />
        ) : null}
        {error ? (
          <FptErrorBanner message={error} onRetry={() => void load()} />
        ) : null}
      </View>
      {!canRead ? (
        <FptEmptyState title="Chưa được cấp quyền xem" />
      ) : (
        <FlatList
          data={visibleItems}
          keyExtractor={(item, index) => item._id || String(index)}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 32,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              colors={["#F26522"]}
            />
          }
          ListEmptyComponent={
            error ? undefined : (
              <FptEmptyState
                title="Chưa có dữ liệu"
                description={`Chưa tìm thấy bản ghi ${definition.title.toLowerCase()}.`}
                icon="file-tray-outline"
              />
            )
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => void openRecord(item)}
              className="mb-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <Text className="text-sm font-bold text-slate-900">
                {definition.label(item)}
              </Text>
              <Text className="mt-1 text-xs leading-5 text-slate-500">
                {definition.detail(item)}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

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
              {editing &&
              isEditing &&
              editableModules.includes(key as EditableModule) &&
              canEdit(key as EditableModule) ? (
                <FptButton
                  title="Lưu thay đổi"
                  loading={saving}
                  className="flex-1"
                  onPress={() => void saveRecord()}
                />
              ) : editing &&
                editableModules.includes(key as EditableModule) &&
                canEdit(key as EditableModule) ? (
                <FptButton
                  title="Chỉnh sửa"
                  disabled={saving}
                  className="flex-1"
                  onPress={() => {
                    setEditorError("");
                    setIsEditing(true);
                  }}
                />
              ) : null}
              <FptButton
                title={isEditing ? "Hủy chỉnh sửa" : "Xong"}
                variant="ghost"
                disabled={saving}
                className="flex-1"
                onPress={() => {
                  if (isEditing) {
                    setIsEditing(false);
                    setDraft(
                      editing && editableModules.includes(key as EditableModule)
                        ? parseDraft(editing, key as EditableModule)
                        : {},
                    );
                    setEditorError("");
                  } else {
                    setEditing(null);
                  }
                }}
              />
            </View>
            <ScrollView
              className="flex-1"
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              <Text className="mb-4 text-xl font-bold text-slate-900">
                {definition.title} · Chi tiết
              </Text>
              {!isEditing && editing
                ? recordDetails(key, editing).map(([label, value]) => (
                    <View
                      key={label}
                      className="mb-3 rounded-xl bg-slate-50 p-3"
                    >
                      <Text className="text-xs font-semibold text-slate-500">
                        {label}
                      </Text>
                      <Text selectable className="mt-1 text-sm text-slate-900">
                        {displayValue(value)}
                      </Text>
                    </View>
                  ))
                : null}
              {editing &&
              isEditing &&
              editableModules.includes(key as EditableModule) &&
              canEdit(key as EditableModule) ? (
                <>
                  <Text className="mb-3 mt-4 text-base font-bold text-slate-900">
                    Chỉnh sửa thông tin
                  </Text>
                  {editableFields[key as EditableModule].map((field) => {
                    const inputProps = {
                      label: field.label,
                      value: draft[field.key] || "",
                      onChangeText: (value: string) =>
                        setDraft((current) => ({
                          ...current,
                          [field.key]: value,
                        })),
                      keyboardType: field.keyboardType,
                      multiline: field.multiline,
                      editable: !saving,
                    };
                    if (
                      key === "courses" &&
                      ["level", "duration", "price"].includes(field.key)
                    ) {
                      const suggestionKey = field.key as
                        "level" | "duration" | "price";
                      return (
                        <FptSuggestionInput
                          key={field.key}
                          {...inputProps}
                          suggestions={courseSuggestions[suggestionKey]}
                          formatSuggestion={
                            suggestionKey === "price"
                              ? formatCoursePriceSuggestion
                              : undefined
                          }
                        />
                      );
                    }
                    return <FptInput key={field.key} {...inputProps} />;
                  })}
                  {key === "classrooms" ? (
                    <>
                      <Text className="mb-2 mt-2 text-sm font-semibold text-slate-700">
                        Khóa học
                      </Text>
                      {loadingOptions ? (
                        <FptLoading fullScreen={false} />
                      ) : (
                        courses.map((course) => (
                          <TouchableOpacity
                            key={course._id}
                            disabled={saving}
                            accessibilityRole="radio"
                            accessibilityState={{
                              checked: draft.course_id === course._id,
                            }}
                            onPress={() =>
                              setDraft((current) => ({
                                ...current,
                                course_id: course._id,
                              }))
                            }
                            className={`mb-2 rounded-xl border p-3 ${draft.course_id === course._id ? "border-fpt-orange bg-orange-50" : "border-slate-200"}`}
                          >
                            <Text className="text-sm">{course.name}</Text>
                          </TouchableOpacity>
                        ))
                      )}
                      <Text className="mb-2 mt-3 text-sm font-semibold text-slate-700">
                        Giảng viên phụ trách
                      </Text>
                      {teachers.map((teacher) => (
                        <TouchableOpacity
                          key={teacher._id}
                          disabled={saving}
                          accessibilityRole="radio"
                          accessibilityState={{
                            checked: draft.teacher_id === teacher._id,
                          }}
                          onPress={() =>
                            setDraft((current) => ({
                              ...current,
                              teacher_id: teacher._id,
                            }))
                          }
                          className={`mb-2 rounded-xl border p-3 ${draft.teacher_id === teacher._id ? "border-fpt-orange bg-orange-50" : "border-slate-200"}`}
                        >
                          <Text className="text-sm font-semibold">
                            {teacher.name}
                          </Text>
                          <Text className="mt-1 text-xs text-slate-500">
                            {teacher.email}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      {!loadingOptions && teachers.length === 0 ? (
                        <Text className="mb-3 text-sm text-amber-700">
                          Không có giảng viên đang hoạt động.
                        </Text>
                      ) : null}
                    </>
                  ) : null}
                  {key === "leads" ? (
                    <>
                      <FptInput
                        label="Mã tư vấn viên (không bắt buộc)"
                        value={draft.consultant_id || ""}
                        onChangeText={(value) =>
                          setDraft((current) => ({
                            ...current,
                            consultant_id: value,
                          }))
                        }
                        editable={!saving}
                      />
                    </>
                  ) : null}
                  <Text className="mb-2 mt-2 text-sm font-semibold text-slate-700">
                    Trạng thái
                  </Text>
                  <View className="mb-4 flex-row flex-wrap gap-2">
                    {statusChoices[key as EditableModule].map((status) => (
                      <TouchableOpacity
                        key={status}
                        disabled={saving}
                        accessibilityRole="button"
                        accessibilityState={{
                          selected:
                            (draft.status || "").toUpperCase() === status,
                        }}
                        onPress={() =>
                          setDraft((current) => ({
                            ...current,
                            status,
                          }))
                        }
                        className={`min-h-[44px] justify-center rounded-full border px-4 ${(draft.status || "").toUpperCase() === status ? "border-fpt-orange bg-orange-50" : "border-slate-200 bg-white"}`}
                      >
                        <Text className="text-xs font-semibold text-slate-700">
                          {status}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {key === "invoices" ? (
                    <Text className="mb-3 text-xs leading-5 text-slate-500">
                      Thành tiền được tính tự động bằng học phí trừ giảm trừ.
                    </Text>
                  ) : null}
                </>
              ) : null}
              {isEditing && editorError ? (
                <FptErrorBanner
                  message={editorError}
                  onRetry={() => void saveRecord()}
                />
              ) : null}
            </ScrollView>
            {editing &&
            editableModules.includes(key as EditableModule) &&
            canEdit(key as EditableModule) ? (
              <View className="border-t border-slate-100 pt-3">
                {statusError ? (
                  <Text
                    accessibilityRole="alert"
                    className="mb-3 text-sm text-red-700"
                  >
                    {statusError}
                  </Text>
                ) : null}
                <FptButton
                  title={
                    currentStatus(key as EditableModule, editing.status || "")
                      ? statusActionLabels[key as EditableModule][1]
                      : statusActionLabels[key as EditableModule][0]
                  }
                  variant={
                    currentStatus(key as EditableModule, editing.status || "")
                      ? "secondary"
                      : "danger"
                  }
                  disabled={saving}
                  onPress={() => changeStatus(editing, key as EditableModule)}
                />
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPermissionForm}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!saving) setShowPermissionForm(false);
        }}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-5">
            <View className="mb-4 flex-row gap-3">
              <FptButton
                title="Lưu quyền"
                loading={saving}
                className="flex-1"
                onPress={() => void createPermission()}
              />
              <FptButton
                title="Đóng"
                variant="ghost"
                disabled={saving}
                className="flex-1"
                onPress={() => setShowPermissionForm(false)}
              />
            </View>
            <Text className="mb-4 text-xl font-bold text-slate-900">
              Thêm quyền truy cập
            </Text>
            <FptInput
              label="Tên quyền"
              value={permissionDraft.name}
              onChangeText={(name) =>
                setPermissionDraft((current) => ({
                  ...current,
                  name,
                }))
              }
              editable={!saving}
            />
            <FptInput
              label="Đường dẫn API (ví dụ /api/v1/courses/:id)"
              value={permissionDraft.path}
              onChangeText={(path) =>
                setPermissionDraft((current) => ({
                  ...current,
                  path,
                }))
              }
              autoCapitalize="none"
              editable={!saving}
            />
            <Text className="mb-2 text-sm font-semibold text-slate-700">
              Phương thức
            </Text>
            <View className="mb-4 flex-row flex-wrap gap-2">
              {["GET", "POST", "PATCH", "PUT", "DELETE"].map((method) => (
                <TouchableOpacity
                  key={method}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: permissionDraft.method === method,
                  }}
                  onPress={() =>
                    setPermissionDraft((current) => ({
                      ...current,
                      method,
                    }))
                  }
                  className={`min-h-[44px] justify-center rounded-full border px-4 ${permissionDraft.method === method ? "border-fpt-orange bg-orange-50" : "border-slate-200 bg-white"}`}
                >
                  <Text className="text-xs font-semibold">{method}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <FptInput
              label="Phân hệ"
              value={permissionDraft.module}
              onChangeText={(moduleName) =>
                setPermissionDraft((current) => ({
                  ...current,
                  module: moduleName,
                }))
              }
              editable={!saving}
            />
            {editorError ? (
              <FptErrorBanner
                message={editorError}
                onRetry={() => void createPermission()}
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
