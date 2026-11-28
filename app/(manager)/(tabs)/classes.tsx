import React, { useCallback, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import {
  fetchManagerClassOptions,
  fetchManagerClasses,
  managerErrorMessage,
  ManagerPerson,
  updateManagerClassroom,
} from "@/api/manager";
import {
  IClassroomWithDetails,
  ICourse,
  IModelPaginate,
} from "@/types/backend";
import {
  RoleHero,
  RoleScreen,
  RoleSection,
  RoleTile,
} from "@/components/common/RoleScreen";
import { FptButton } from "@/components/common/FptButton";
import { FptEmptyState } from "@/components/common/FptEmptyState";
import FptErrorBanner from "@/components/common/FptErrorBanner";
import { FptInput } from "@/components/common/FptInput";
import { FptLoading } from "@/components/common/FptLoading";
import { ManagerChoice } from "@/features/manager/ManagerChoice";
import { useAppSelector } from "@/redux/hooks";
import { canUse } from "@/utils/permissions";
import { confirmAction } from "@/utils/confirmAction";

const statuses = [
  { value: "", label: "Tất cả" },
  { value: "OPEN", label: "Đang mở" },
  { value: "FULL", label: "Đủ sĩ số" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã đóng" },
];

type ClassDraft = {
  course_id: string;
  teacher_id: string;
  class_name: string;
  room: string;
  max_student: string;
  start_time: string;
  end_time: string;
  status: "OPEN" | "FULL" | "COMPLETED" | "CANCELLED";
};

const makeDraft = (classroom: IClassroomWithDetails): ClassDraft => ({
  course_id:
    typeof classroom.course_id === "object"
      ? classroom.course_id?._id || ""
      : classroom.course_id || "",
  teacher_id:
    typeof classroom.teacher_id === "object"
      ? classroom.teacher_id?._id || ""
      : classroom.teacher_id || "",
  class_name: classroom.class_name || "",
  room: classroom.room || "",
  max_student: String(classroom.max_student ?? ""),
  start_time: classroom.start_time || "",
  end_time: classroom.end_time || "",
  status: ["OPEN", "FULL", "COMPLETED", "CANCELLED"].includes(
    classroom.status || "",
  )
    ? (classroom.status as ClassDraft["status"])
    : "OPEN",
});

export default function ManagerClasses() {
  const router = useRouter();
  const permissions = useAppSelector((state) => state.account.user.permissions);
  const canCreate = canUse(permissions, "POST", "/api/v1/classrooms");
  const canEdit = canUse(permissions, "PATCH", "/api/v1/classrooms/:id");
  const [data, setData] = useState<IModelPaginate<IClassroomWithDetails>>();
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [selected, setSelected] = useState<IClassroomWithDetails>();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ClassDraft>();
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [teachers, setTeachers] = useState<ManagerPerson[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await fetchManagerClasses(page, status));
    } catch (reason) {
      setError(managerErrorMessage(reason));
    } finally {
      setLoading(false);
    }
  }, [page, status]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const beginEdit = async () => {
    if (!selected || !canEdit) return;
    setLoadingOptions(true);
    setFormError("");
    try {
      const options = await fetchManagerClassOptions();
      const courseId =
        typeof selected.course_id === "object"
          ? selected.course_id?._id
          : selected.course_id;
      const teacherId =
        typeof selected.teacher_id === "object"
          ? selected.teacher_id?._id
          : selected.teacher_id;
      if (
        selected.course_id &&
        typeof selected.course_id === "object" &&
        !options.courses.some((course) => course._id === courseId)
      ) {
        options.courses.unshift(selected.course_id as ICourse);
      }
      if (
        selected.teacher_id &&
        typeof selected.teacher_id === "object" &&
        !options.teachers.some((teacher) => teacher._id === teacherId)
      ) {
        options.teachers.unshift({
          _id: selected.teacher_id._id || "",
          name: selected.teacher_id.name || "Giảng viên hiện tại",
          email: selected.teacher_id.email,
          status: "INACTIVE",
        });
      }
      setCourses(options.courses);
      setTeachers(options.teachers);
      setDraft(makeDraft(selected));
      setIsEditing(true);
    } catch (reason) {
      setFormError(
        managerErrorMessage(reason, "Không tải được khóa học và giảng viên."),
      );
    } finally {
      setLoadingOptions(false);
    }
  };

  const save = async () => {
    if (!selected?._id || !draft || !canEdit || saving) return;
    const capacity = Number(draft.max_student);
    const time = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (
      !draft.course_id ||
      !draft.teacher_id ||
      !draft.class_name.trim() ||
      !draft.room.trim()
    ) {
      setFormError("Vui lòng chọn khóa học, giảng viên, tên lớp và phòng học.");
      return;
    }
    if (
      !/^\d+$/.test(draft.max_student) ||
      !Number.isSafeInteger(capacity) ||
      capacity <= 0
    ) {
      setFormError("Sĩ số tối đa phải là số nguyên lớn hơn 0.");
      return;
    }
    if (
      !time.test(draft.start_time.trim()) ||
      !time.test(draft.end_time.trim()) ||
      draft.start_time.trim() >= draft.end_time.trim()
    ) {
      setFormError("Nhập giờ theo HH:mm và giờ kết thúc phải sau giờ bắt đầu.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      await updateManagerClassroom({
        _id: selected._id,
        course_id: draft.course_id,
        teacher_id: draft.teacher_id,
        class_name: draft.class_name.trim(),
        room: draft.room.trim(),
        max_student: String(capacity),
        start_time: draft.start_time.trim(),
        end_time: draft.end_time.trim(),
        status: draft.status,
      });
      const course = courses.find((item) => item._id === draft.course_id);
      const teacher = teachers.find((item) => item._id === draft.teacher_id);
      setSelected({
        ...selected,
        ...draft,
        course_id: course
          ? { _id: course._id, name: course.name }
          : selected.course_id,
        teacher_id: teacher
          ? { _id: teacher._id, name: teacher.name, email: teacher.email }
          : selected.teacher_id,
      });
      setIsEditing(false);
      await load();
    } catch (reason) {
      setFormError(managerErrorMessage(reason, "Không thể cập nhật lớp học."));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = () => {
    if (!selected?._id || !canEdit || saving) return;
    const nextStatus = selected.status === "CANCELLED" ? "OPEN" : "CANCELLED";
    confirmAction(
      nextStatus === "CANCELLED" ? "Đóng lớp học?" : "Mở lại lớp học?",
      nextStatus === "CANCELLED"
        ? "Lớp sẽ không còn nhận đăng ký mới. Dữ liệu lớp vẫn được giữ lại."
        : "Lớp sẽ được mở lại theo trạng thái sĩ số hiện tại.",
      nextStatus === "CANCELLED" ? "Đóng lớp" : "Mở lại",
      () => {
        void (async () => {
          setSaving(true);
          setFormError("");
          try {
            const courseId =
              typeof selected.course_id === "object"
                ? selected.course_id?._id
                : selected.course_id;
            const teacherId =
              typeof selected.teacher_id === "object"
                ? selected.teacher_id?._id
                : selected.teacher_id;
            await updateManagerClassroom({
              _id: selected._id!,
              course_id: courseId || "",
              teacher_id: teacherId || "",
              class_name: selected.class_name || "",
              room: selected.room || "",
              max_student: String(selected.max_student || ""),
              start_time: selected.start_time || "",
              end_time: selected.end_time || "",
              status: nextStatus,
            });
            setSelected({ ...selected, status: nextStatus });
            await load();
          } catch (reason) {
            setFormError(
              managerErrorMessage(
                reason,
                "Không thể cập nhật trạng thái lớp học.",
              ),
            );
          } finally {
            setSaving(false);
          }
        })();
      },
      nextStatus === "CANCELLED",
    );
  };

  const closeDetails = () => {
    if (saving) return;
    setSelected(undefined);
    setDraft(undefined);
    setIsEditing(false);
    setFormError("");
  };

  return (
    <RoleScreen
      eyebrow="Quản lý đào tạo"
      title={selected ? selected.class_name || "Thông tin lớp" : "Lớp học"}
      subtitle={
        selected
          ? "Thông tin lớp và người phụ trách"
          : "Tổ chức lớp và phân công giảng viên"
      }
      refreshing={loading || saving}
      onRefresh={() => {
        if (!saving) {
          if (selected) closeDetails();
          void load();
        }
      }}
    >
      {selected ? (
        <>
          <FptButton
            title="Quay lại danh sách"
            variant="ghost"
            disabled={saving}
            onPress={closeDetails}
            className="mb-4"
          />
          {formError ? (
            <Text
              accessibilityRole="alert"
              className="mb-3 text-sm text-red-700"
            >
              {formError}
            </Text>
          ) : null}
          <RoleHero
            eyebrow="Class management"
            title={selected.class_name || "Lớp học"}
            description={`${selected.status || "OPEN"} · ${selected.room || "Chưa có phòng"}`}
          />
          {isEditing && draft ? (
            <RoleSection title="Chỉnh sửa lớp học">
              {loadingOptions ? (
                <FptLoading message="Đang tải khóa học và giảng viên..." />
              ) : (
                <>
                  <ManagerChoice
                    label="Khóa học *"
                    value={draft.course_id}
                    disabled={saving}
                    options={courses
                      .filter((course) => course._id)
                      .map((course) => ({
                        id: course._id!,
                        title: course.name,
                        subtitle: [course.level, course.duration]
                          .filter(Boolean)
                          .join(" · "),
                      }))}
                    onSelect={(course_id) =>
                      setDraft((current) =>
                        current ? { ...current, course_id } : current,
                      )
                    }
                  />
                  <ManagerChoice
                    label="Giảng viên *"
                    value={draft.teacher_id}
                    disabled={saving}
                    options={teachers.map((teacher) => ({
                      id: teacher._id,
                      title: teacher.full_name || teacher.name,
                      subtitle: [teacher.subject, teacher.email]
                        .filter(Boolean)
                        .join(" · "),
                    }))}
                    onSelect={(teacher_id) =>
                      setDraft((current) =>
                        current ? { ...current, teacher_id } : current,
                      )
                    }
                  />
                  <FptInput
                    label="Tên lớp *"
                    value={draft.class_name}
                    onChangeText={(class_name) =>
                      setDraft((current) =>
                        current ? { ...current, class_name } : current,
                      )
                    }
                    editable={!saving}
                  />
                  <FptInput
                    label="Phòng học *"
                    value={draft.room}
                    onChangeText={(room) =>
                      setDraft((current) =>
                        current ? { ...current, room } : current,
                      )
                    }
                    editable={!saving}
                  />
                  <FptInput
                    label="Sĩ số tối đa *"
                    value={draft.max_student}
                    onChangeText={(max_student) =>
                      setDraft((current) =>
                        current ? { ...current, max_student } : current,
                      )
                    }
                    keyboardType="number-pad"
                    editable={!saving}
                  />
                  <FptInput
                    label="Giờ bắt đầu *"
                    value={draft.start_time}
                    onChangeText={(start_time) =>
                      setDraft((current) =>
                        current ? { ...current, start_time } : current,
                      )
                    }
                    placeholder="HH:mm"
                    maxLength={5}
                    editable={!saving}
                  />
                  <FptInput
                    label="Giờ kết thúc *"
                    value={draft.end_time}
                    onChangeText={(end_time) =>
                      setDraft((current) =>
                        current ? { ...current, end_time } : current,
                      )
                    }
                    placeholder="HH:mm"
                    maxLength={5}
                    editable={!saving}
                  />
                  <Text className="mb-2 mt-2 text-sm font-semibold text-slate-700">
                    Trạng thái
                  </Text>
                  <View className="mb-4 flex-row flex-wrap gap-2">
                    {statuses
                      .filter((item) => item.value)
                      .map((item) => (
                        <TouchableOpacity
                          key={item.value}
                          accessibilityRole="button"
                          accessibilityState={{
                            selected: draft.status === item.value,
                          }}
                          disabled={saving}
                          onPress={() =>
                            setDraft((current) =>
                              current
                                ? {
                                    ...current,
                                    status: item.value as ClassDraft["status"],
                                  }
                                : current,
                            )
                          }
                          className={`min-h-[44px] justify-center rounded-full border px-4 ${draft.status === item.value ? "border-fpt-orange bg-orange-50" : "border-slate-200 bg-white"}`}
                        >
                          <Text className="text-xs font-semibold text-slate-700">
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                </>
              )}
              {formError ? (
                <Text
                  accessibilityRole="alert"
                  className="mb-3 text-sm text-red-700"
                >
                  {formError}
                </Text>
              ) : null}
              <FptButton
                title="Lưu thay đổi"
                loading={saving}
                disabled={loadingOptions}
                onPress={() => void save()}
              />
              <FptButton
                title="Hủy chỉnh sửa"
                variant="ghost"
                className="mt-2"
                disabled={saving}
                onPress={() => {
                  setDraft(makeDraft(selected));
                  setIsEditing(false);
                  setFormError("");
                }}
              />
            </RoleSection>
          ) : (
            <>
              <RoleSection title="Thông tin lớp học">
                <RoleTile
                  title="Khóa học"
                  subtitle={selected.course_id?.name || "Chưa có thông tin"}
                  icon="book-outline"
                />
                <RoleTile
                  title="Giảng viên"
                  subtitle={selected.teacher_id?.name || "Chưa phân công"}
                  icon="person-outline"
                />
                {selected.teacher_id?.email ? (
                  <RoleTile
                    title="Email giảng viên"
                    subtitle={selected.teacher_id.email}
                    icon="mail-outline"
                  />
                ) : null}
                <RoleTile
                  title="Phòng học"
                  subtitle={selected.room || "Chưa cập nhật"}
                  icon="location-outline"
                />
                <RoleTile
                  title="Khung giờ"
                  subtitle={`${selected.start_time || "—"} – ${selected.end_time || "—"}`}
                  icon="time-outline"
                />
                <RoleTile
                  title="Sĩ số tối đa"
                  subtitle={String(selected.max_student ?? "Chưa cập nhật")}
                  icon="people-outline"
                />
                <RoleTile
                  title="Trạng thái"
                  subtitle={
                    statuses.find((item) => item.value === selected.status)
                      ?.label ||
                    selected.status ||
                    "Chưa cập nhật"
                  }
                  icon="information-circle-outline"
                />
              </RoleSection>
              {canEdit ? (
                <>
                  <FptButton
                    title="Chỉnh sửa lớp học"
                    variant="outline"
                    className="mb-3"
                    disabled={saving || loadingOptions}
                    onPress={() => void beginEdit()}
                  />
                  <FptButton
                    title={
                      selected.status === "CANCELLED"
                        ? "Mở lại lớp học"
                        : "Đóng lớp học"
                    }
                    variant={
                      selected.status === "CANCELLED" ? "secondary" : "danger"
                    }
                    disabled={saving}
                    onPress={toggleStatus}
                  />
                </>
              ) : (
                <Text className="text-sm leading-6 text-slate-500">
                  Tài khoản hiện chỉ có quyền xem lớp học.
                </Text>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <RoleHero
            eyebrow="Class management"
            title="Quản lý lớp học"
            description="Xem, thêm, chỉnh sửa và đóng/mở lớp học."
          />
          {canCreate ? (
            <FptButton
              title="Tạo lớp học"
              className="mb-5"
              onPress={() => router.push("/(manager)/class/create" as never)}
            />
          ) : null}
          <View className="mb-4 flex-row flex-wrap">
            {statuses.map((item) => (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ selected: status === item.value }}
                key={item.value}
                onPress={() => {
                  setStatus(item.value);
                  setPage(1);
                  setData(undefined);
                }}
                className={`mb-2 mr-2 min-h-[44px] justify-center rounded-full px-4 ${status === item.value ? "bg-fpt-blue" : "border border-slate-200 bg-white"}`}
              >
                <Text
                  className={`text-xs font-semibold ${status === item.value ? "text-white" : "text-slate-600"}`}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {error ? (
            <FptErrorBanner message={error} onRetry={() => void load()} />
          ) : null}
          {loading ? (
            <FptLoading message="Đang tải lớp học..." />
          ) : !error && !data?.result.length ? (
            <FptEmptyState
              title="Chưa có lớp học"
              description="Danh sách lớp sẽ xuất hiện khi có lớp phù hợp với bộ lọc."
            />
          ) : null}
          {!loading &&
            data?.result.map((item) => (
              <RoleTile
                key={item._id}
                title={item.class_name || "Lớp học"}
                subtitle={`${item.course_id?.name || "Chưa có khóa học"}\n${item.teacher_id?.name || "Chưa phân công"} • ${item.room || "Chưa có phòng"}`}
                icon="school-outline"
                onPress={() => {
                  setSelected(item);
                  setIsEditing(false);
                  setDraft(makeDraft(item));
                  setFormError("");
                }}
              />
            ))}
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
