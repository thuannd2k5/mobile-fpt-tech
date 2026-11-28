import React, { useCallback, useMemo, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "expo-router";
import {
  createManagerCourse,
  fetchManagerCourses,
  ManagerCourseInput,
  managerErrorMessage,
  updateManagerCourse,
} from "@/api/manager";
import { ICourse, IModelPaginate } from "@/types/backend";
import { FptButton } from "@/components/common/FptButton";
import { FptEmptyState } from "@/components/common/FptEmptyState";
import FptErrorBanner from "@/components/common/FptErrorBanner";
import { FptInput } from "@/components/common/FptInput";
import { FptLoading } from "@/components/common/FptLoading";
import {
  RoleHero,
  RoleScreen,
  RoleSection,
  RoleTile,
} from "@/components/common/RoleScreen";
import { useAppSelector } from "@/redux/hooks";
import { canUse } from "@/utils/permissions";
import { confirmAction } from "@/utils/confirmAction";

type CourseDraft = {
  name: string;
  description: string;
  level: string;
  duration: string;
  price: string;
  status: string;
};

const makeDraft = (course?: ICourse): CourseDraft => ({
  name: course?.name || "",
  description: course?.description || "",
  level: course?.level || "",
  duration: course?.duration || "",
  price: course?.price == null ? "" : String(course.price),
  status: course?.status || "ACTIVE",
});

export default function ManagerCourses() {
  const permissions = useAppSelector((state) => state.account.user.permissions);
  const canCreate = canUse(permissions, "POST", "/api/v1/courses");
  const canEdit = canUse(permissions, "PATCH", "/api/v1/courses/:id");
  const [data, setData] = useState<IModelPaginate<ICourse>>();
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ICourse | null>(null);
  const [draft, setDraft] = useState<CourseDraft>(makeDraft());
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await fetchManagerCourses(page));
    } catch (reason) {
      setError(managerErrorMessage(reason));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return (data?.result || []).filter((course) =>
      `${course.name} ${course.level || ""} ${course.description || ""} ${course.status || ""}`
        .toLocaleLowerCase()
        .includes(search),
    );
  }, [data, query]);

  const beginCreate = () => {
    setSelected(null);
    setDraft(makeDraft());
    setIsCreating(true);
    setIsEditing(true);
    setFormError("");
  };

  const save = async () => {
    if (saving || (!isCreating && !selected?._id)) return;
    if (!canCreate && isCreating) return;
    if (!canEdit && !isCreating) return;
    if (!draft.name.trim()) {
      setFormError("Tên khóa học không được để trống.");
      return;
    }
    const price = draft.price.trim();
    if (price && (!Number.isFinite(Number(price)) || Number(price) < 0)) {
      setFormError("Học phí phải là số không âm.");
      return;
    }
    const payload: ManagerCourseInput = {
      name: draft.name.trim(),
      description: draft.description.trim(),
      level: draft.level.trim(),
      duration: draft.duration.trim(),
      price,
      status: draft.status,
    };
    setSaving(true);
    setFormError("");
    try {
      if (isCreating) {
        await createManagerCourse(payload);
        setSelected(null);
        setIsCreating(false);
      } else if (selected?._id) {
        await updateManagerCourse(selected._id, payload);
        setSelected({ ...selected, ...payload });
      }
      setIsEditing(false);
      await load();
    } catch (reason) {
      setFormError(managerErrorMessage(reason, "Không thể lưu khóa học."));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = () => {
    if (!selected?._id || !canEdit) return;
    const nextStatus =
      selected.status?.toUpperCase() === "INACTIVE" ? "ACTIVE" : "INACTIVE";
    confirmAction(
      nextStatus === "INACTIVE" ? "Đóng khóa học?" : "Mở lại khóa học?",
      nextStatus === "INACTIVE"
        ? "Khóa học sẽ không còn được sử dụng để mở lớp mới."
        : "Khóa học sẽ được sử dụng trở lại.",
      nextStatus === "INACTIVE" ? "Đóng khóa học" : "Mở lại",
      () => {
        void (async () => {
          setSaving(true);
          setError("");
          try {
            await updateManagerCourse(selected._id!, {
              status: nextStatus,
            });
            setSelected({ ...selected, status: nextStatus });
            await load();
          } catch (reason) {
            setError(
              managerErrorMessage(
                reason,
                "Không thể cập nhật trạng thái khóa học.",
              ),
            );
          } finally {
            setSaving(false);
          }
        })();
      },
      nextStatus === "INACTIVE",
    );
  };

  const closeDetails = () => {
    if (saving) return;
    setSelected(null);
    setIsCreating(false);
    setIsEditing(false);
    setFormError("");
  };

  return (
    <RoleScreen
      eyebrow="Quản lý đào tạo"
      title={isCreating ? "Thêm khóa học" : selected?.name || "Khóa học"}
      subtitle={
        selected
          ? "Thông tin và trạng thái khóa học"
          : "Danh mục khóa học đang được đào tạo"
      }
      refreshing={loading || saving}
      onRefresh={() => {
        if (!saving) void load();
      }}
    >
      {error ? (
        <FptErrorBanner message={error} onRetry={() => void load()} />
      ) : null}
      {selected || isCreating ? (
        <>
          <FptButton
            title="Quay lại danh sách"
            variant="ghost"
            className="mb-4"
            disabled={saving}
            onPress={closeDetails}
          />
          <RoleHero
            eyebrow={isCreating ? "Thêm khóa học" : "Chi tiết khóa học"}
            title={selected?.name || "Thông tin khóa học"}
            description={selected?.status || "Nhập thông tin khóa học mới."}
          />
          {isEditing ? (
            <RoleSection
              title={isCreating ? "Thông tin khóa học" : "Chỉnh sửa thông tin"}
            >
              <FptInput
                label="Tên khóa học *"
                value={draft.name}
                onChangeText={(name) =>
                  setDraft((current) => ({ ...current, name }))
                }
                editable={!saving}
              />
              <FptInput
                label="Mô tả"
                value={draft.description}
                onChangeText={(description) =>
                  setDraft((current) => ({ ...current, description }))
                }
                multiline
                editable={!saving}
              />
              <FptInput
                label="Trình độ"
                value={draft.level}
                onChangeText={(level) =>
                  setDraft((current) => ({ ...current, level }))
                }
                editable={!saving}
              />
              <FptInput
                label="Thời lượng"
                value={draft.duration}
                onChangeText={(duration) =>
                  setDraft((current) => ({ ...current, duration }))
                }
                editable={!saving}
              />
              <FptInput
                label="Học phí"
                value={draft.price}
                onChangeText={(price) =>
                  setDraft((current) => ({ ...current, price }))
                }
                keyboardType="decimal-pad"
                editable={!saving}
              />
              <Text className="mb-2 mt-2 text-sm font-semibold text-slate-700">
                Trạng thái
              </Text>
              <View className="mb-4 flex-row gap-2">
                {["ACTIVE", "INACTIVE"].map((status) => (
                  <TouchableOpacity
                    key={status}
                    accessibilityRole="button"
                    accessibilityState={{ selected: draft.status === status }}
                    disabled={saving}
                    onPress={() =>
                      setDraft((current) => ({ ...current, status }))
                    }
                    className={`min-h-[44px] justify-center rounded-full border px-4 ${draft.status === status ? "border-fpt-orange bg-orange-50" : "border-slate-200 bg-white"}`}
                  >
                    <Text className="text-sm font-semibold text-slate-700">
                      {status === "ACTIVE" ? "Đang hoạt động" : "Đóng"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {formError ? (
                <Text
                  accessibilityRole="alert"
                  className="mb-3 text-sm text-red-700"
                >
                  {formError}
                </Text>
              ) : null}
              <FptButton
                title={isCreating ? "Thêm khóa học" : "Lưu thay đổi"}
                loading={saving}
                disabled={isCreating ? !canCreate : !canEdit}
                onPress={() => void save()}
              />
              <FptButton
                title="Hủy chỉnh sửa"
                variant="ghost"
                className="mt-2"
                disabled={saving}
                onPress={() => {
                  if (isCreating) closeDetails();
                  else if (selected) {
                    setDraft(makeDraft(selected));
                    setIsEditing(false);
                    setFormError("");
                  }
                }}
              />
            </RoleSection>
          ) : selected ? (
            <>
              <RoleSection title="Thông tin khóa học">
                <RoleTile
                  title="Mô tả"
                  subtitle={selected.description || "Chưa cập nhật"}
                />
                <RoleTile
                  title="Trình độ"
                  subtitle={selected.level || "Chưa cập nhật"}
                />
                <RoleTile
                  title="Thời lượng"
                  subtitle={selected.duration || "Chưa cập nhật"}
                />
                <RoleTile
                  title="Học phí"
                  subtitle={
                    selected.price == null
                      ? "Chưa cập nhật"
                      : `${Number(selected.price).toLocaleString("vi-VN")} ₫`
                  }
                />
                <RoleTile
                  title="Trạng thái"
                  subtitle={selected.status || "ACTIVE"}
                />
              </RoleSection>
              {canEdit ? (
                <>
                  <FptButton
                    title="Chỉnh sửa khóa học"
                    variant="outline"
                    className="mb-3"
                    disabled={saving}
                    onPress={() => {
                      setDraft(makeDraft(selected));
                      setIsEditing(true);
                      setFormError("");
                    }}
                  />
                  <FptButton
                    title={
                      selected.status?.toUpperCase() === "INACTIVE"
                        ? "Mở lại khóa học"
                        : "Đóng khóa học"
                    }
                    variant={
                      selected.status?.toUpperCase() === "INACTIVE"
                        ? "secondary"
                        : "danger"
                    }
                    disabled={saving}
                    onPress={toggleStatus}
                  />
                </>
              ) : (
                <Text className="text-sm leading-6 text-slate-500">
                  Tài khoản hiện chỉ có quyền xem khóa học.
                </Text>
              )}
            </>
          ) : null}
        </>
      ) : (
        <>
          <RoleHero
            eyebrow="Course catalog"
            title="Danh mục khóa học"
            description="Xem, thêm, chỉnh sửa và đóng/mở khóa học."
          />
          {canCreate ? (
            <FptButton
              title="Thêm khóa học"
              className="mb-4"
              onPress={beginCreate}
            />
          ) : null}
          <FptInput
            placeholder="Tìm tên, trình độ hoặc mô tả khóa học"
            value={query}
            onChangeText={setQuery}
          />
          <RoleSection title={`${filtered.length} khóa học`}>
            {loading ? <FptLoading message="Đang tải khóa học..." /> : null}
            {!loading && !error && !filtered.length ? (
              <FptEmptyState
                title="Chưa có khóa học phù hợp"
                description="Thử thay đổi nội dung tìm kiếm."
              />
            ) : null}
            {!loading
              ? filtered.map((course) => (
                  <RoleTile
                    key={course._id}
                    title={course.name}
                    subtitle={`${course.level || "Chưa phân cấp"} · ${course.status || "ACTIVE"}${course.price != null ? `\n${Number(course.price).toLocaleString("vi-VN")} ₫` : ""}`}
                    icon="book-outline"
                    onPress={() => {
                      setSelected(course);
                      setDraft(makeDraft(course));
                      setIsCreating(false);
                      setIsEditing(false);
                      setFormError("");
                    }}
                  />
                ))
              : null}
          </RoleSection>
          {data && data.meta.pages > 1 ? (
            <View className="mt-3 flex-row items-center justify-between">
              <FptButton
                title="Trước"
                size="sm"
                variant="outline"
                disabled={page <= 1 || loading}
                onPress={() => setPage((current) => current - 1)}
              />
              <Text className="text-xs text-slate-500">
                {page} / {data.meta.pages}
              </Text>
              <FptButton
                title="Sau"
                size="sm"
                variant="outline"
                disabled={page >= data.meta.pages || loading}
                onPress={() => setPage((current) => current + 1)}
              />
            </View>
          ) : null}
        </>
      )}
    </RoleScreen>
  );
}
