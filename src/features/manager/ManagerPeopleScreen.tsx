import React, { useCallback, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import {
  fetchManagerPeople,
  ManagerPerson,
  managerErrorMessage,
  updateManagerPerson,
} from "@/api/manager";
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

type PersonDraft = {
  name: string;
  email: string;
  phone: string;
  age: string;
  gender: string;
  birthday: string;
  address: string;
  subject: string;
  experience_years: string;
};

const makeDraft = (person: ManagerPerson): PersonDraft => ({
  name: person.name || "",
  email: person.email || "",
  phone: person.phone || "",
  age: person.age == null ? "" : String(person.age),
  gender: person.gender || "",
  birthday: person.birthday ? String(person.birthday).slice(0, 10) : "",
  address: person.address || "",
  subject: person.subject || "",
  experience_years:
    person.experience_years == null ? "" : String(person.experience_years),
});

export default function ManagerPeopleScreen({
  personRole,
}: {
  personRole: "STUDENT" | "TEACHER";
}) {
  const permissions = useAppSelector((state) => state.account.user.permissions);
  const title = personRole === "STUDENT" ? "Học viên" : "Giảng viên";
  const description =
    personRole === "STUDENT"
      ? "Tra cứu và quản lý hồ sơ học viên."
      : "Tra cứu và quản lý hồ sơ giảng viên.";
  const canEdit = canUse(permissions, "PATCH", "/api/v1/users/:id");
  const [people, setPeople] = useState<ManagerPerson[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ManagerPerson | null>(null);
  const [draft, setDraft] = useState<PersonDraft | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setPeople(await fetchManagerPeople(personRole));
    } catch (reason) {
      setError(managerErrorMessage(reason));
    } finally {
      setLoading(false);
    }
  }, [personRole]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return people.filter((person) =>
      `${person.full_name || ""} ${person.name} ${person.email || ""} ${person.phone || ""}`
        .toLocaleLowerCase()
        .includes(search),
    );
  }, [people, query]);

  const save = async () => {
    if (!selected || !draft || saving) return;
    if (
      !draft.name.trim() ||
      !draft.email.trim() ||
      !draft.email.includes("@")
    ) {
      setFormError("Vui lòng nhập tên và địa chỉ email hợp lệ.");
      return;
    }
    const age = draft.age.trim() ? Number(draft.age) : undefined;
    const experience = draft.experience_years.trim()
      ? Number(draft.experience_years)
      : undefined;
    if (
      (age !== undefined && (!Number.isInteger(age) || age < 0 || age > 130)) ||
      (experience !== undefined &&
        (!Number.isInteger(experience) || experience < 0))
    ) {
      setFormError("Tuổi và số năm kinh nghiệm phải là số nguyên hợp lệ.");
      return;
    }
    const payload: Partial<Omit<ManagerPerson, "_id" | "role">> = {
      name: draft.name.trim(),
      full_name: draft.name.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      age,
      gender: draft.gender.trim(),
      birthday: draft.birthday.trim() || undefined,
      address: draft.address.trim(),
      subject: draft.subject.trim(),
      experience_years: experience,
    };
    setSaving(true);
    setFormError("");
    try {
      await updateManagerPerson(selected, payload);
      const updated = { ...selected, ...payload };
      setSelected(updated);
      setPeople((current) =>
        current.map((person) =>
          person._id === updated._id ? updated : person,
        ),
      );
      setDraft(makeDraft(updated));
      setIsEditing(false);
    } catch (reason) {
      setFormError(managerErrorMessage(reason, "Không thể cập nhật hồ sơ."));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = () => {
    if (!selected || !canEdit) return;
    const nextStatus =
      selected.status?.toUpperCase() === "INACTIVE" ? "ACTIVE" : "INACTIVE";
    confirmAction(
      nextStatus === "INACTIVE"
        ? `Đóng tài khoản ${title.toLowerCase()}?`
        : "Mở lại tài khoản?",
      nextStatus === "INACTIVE"
        ? "Tài khoản sẽ không thể đăng nhập cho đến khi được mở lại."
        : "Tài khoản sẽ có thể đăng nhập trở lại.",
      nextStatus === "INACTIVE" ? "Đóng tài khoản" : "Mở tài khoản",
      () => {
        void (async () => {
          setSaving(true);
          setFormError("");
          try {
            await updateManagerPerson(selected, {
              status: nextStatus,
            });
            const updated = { ...selected, status: nextStatus };
            setSelected(updated);
            setPeople((current) =>
              current.map((person) =>
                person._id === updated._id ? updated : person,
              ),
            );
          } catch (reason) {
            setFormError(
              managerErrorMessage(
                reason,
                "Không thể cập nhật trạng thái tài khoản.",
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

  return (
    <RoleScreen
      eyebrow="Quản lý đào tạo"
      title={
        selected
          ? selected.full_name || selected.name
          : `Quản lý ${title.toLowerCase()}`
      }
      subtitle={
        selected ? "Thông tin hồ sơ và trạng thái tài khoản" : description
      }
      refreshing={loading || saving}
      onRefresh={() => {
        if (!saving) void load();
      }}
    >
      {error ? (
        <FptErrorBanner message={error} onRetry={() => void load()} />
      ) : null}
      {selected ? (
        <>
          <FptButton
            title="Quay lại danh sách"
            variant="ghost"
            disabled={saving}
            className="mb-4"
            onPress={() => {
              setSelected(null);
              setDraft(null);
              setIsEditing(false);
              setError("");
              setFormError("");
            }}
          />
          <RoleHero
            eyebrow={title}
            title={selected.full_name || selected.name}
            description={`${selected.email || "Chưa có email"} · ${selected.status || "ACTIVE"}`}
          />
          {formError ? (
            <Text
              accessibilityRole="alert"
              className="mb-3 text-sm text-red-700"
            >
              {formError}
            </Text>
          ) : null}
          {isEditing && draft ? (
            <RoleSection title="Chỉnh sửa thông tin">
              <FptInput
                label="Tên"
                value={draft.name}
                onChangeText={(name) =>
                  setDraft((current) =>
                    current ? { ...current, name } : current,
                  )
                }
                editable={!saving}
              />
              <FptInput
                label="Email"
                value={draft.email}
                onChangeText={(email) =>
                  setDraft((current) =>
                    current ? { ...current, email } : current,
                  )
                }
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!saving}
              />
              <FptInput
                label="Số điện thoại"
                value={draft.phone}
                onChangeText={(phone) =>
                  setDraft((current) =>
                    current ? { ...current, phone } : current,
                  )
                }
                keyboardType="phone-pad"
                editable={!saving}
              />
              <FptInput
                label="Tuổi"
                value={draft.age}
                onChangeText={(age) =>
                  setDraft((current) =>
                    current ? { ...current, age } : current,
                  )
                }
                keyboardType="numeric"
                editable={!saving}
              />
              <FptInput
                label="Giới tính"
                value={draft.gender}
                onChangeText={(gender) =>
                  setDraft((current) =>
                    current ? { ...current, gender } : current,
                  )
                }
                editable={!saving}
              />
              <FptInput
                label="Ngày sinh (YYYY-MM-DD)"
                value={draft.birthday}
                onChangeText={(birthday) =>
                  setDraft((current) =>
                    current ? { ...current, birthday } : current,
                  )
                }
                editable={!saving}
              />
              <FptInput
                label="Địa chỉ"
                value={draft.address}
                onChangeText={(address) =>
                  setDraft((current) =>
                    current ? { ...current, address } : current,
                  )
                }
                multiline
                editable={!saving}
              />
              {personRole === "TEACHER" ? (
                <>
                  <FptInput
                    label="Chuyên môn"
                    value={draft.subject}
                    onChangeText={(subject) =>
                      setDraft((current) =>
                        current ? { ...current, subject } : current,
                      )
                    }
                    editable={!saving}
                  />
                  <FptInput
                    label="Số năm kinh nghiệm"
                    value={draft.experience_years}
                    onChangeText={(experience_years) =>
                      setDraft((current) =>
                        current ? { ...current, experience_years } : current,
                      )
                    }
                    keyboardType="numeric"
                    editable={!saving}
                  />
                </>
              ) : null}
              <View className="mt-2 flex-row gap-3">
                <FptButton
                  title="Lưu thay đổi"
                  loading={saving}
                  className="flex-1"
                  onPress={() => void save()}
                />
                <FptButton
                  title="Hủy"
                  variant="ghost"
                  disabled={saving}
                  className="flex-1"
                  onPress={() => {
                    setDraft(makeDraft(selected));
                    setIsEditing(false);
                    setFormError("");
                  }}
                />
              </View>
            </RoleSection>
          ) : (
            <RoleSection title="Thông tin hồ sơ">
              <RoleTile
                title="Tên"
                subtitle={selected.full_name || selected.name}
              />
              <RoleTile
                title="Email"
                subtitle={selected.email || "Chưa cập nhật"}
                icon="mail-outline"
              />
              <RoleTile
                title="Số điện thoại"
                subtitle={selected.phone || "Chưa cập nhật"}
                icon="call-outline"
              />
              <RoleTile
                title="Tuổi · Giới tính"
                subtitle={`${selected.age ?? "—"} · ${selected.gender || "—"}`}
              />
              <RoleTile
                title="Ngày sinh"
                subtitle={
                  selected.birthday
                    ? String(selected.birthday).slice(0, 10)
                    : "Chưa cập nhật"
                }
              />
              <RoleTile
                title="Địa chỉ"
                subtitle={selected.address || "Chưa cập nhật"}
                icon="location-outline"
              />
              {personRole === "TEACHER" ? (
                <>
                  <RoleTile
                    title="Chuyên môn"
                    subtitle={selected.subject || "Chưa cập nhật"}
                    icon="school-outline"
                  />
                  <RoleTile
                    title="Kinh nghiệm"
                    subtitle={
                      selected.experience_years == null
                        ? "Chưa cập nhật"
                        : `${selected.experience_years} năm`
                    }
                    icon="briefcase-outline"
                  />
                </>
              ) : null}
              <RoleTile
                title="Trạng thái tài khoản"
                subtitle={selected.status || "ACTIVE"}
                icon="information-circle-outline"
              />
            </RoleSection>
          )}
          {canEdit && !isEditing ? (
            <FptButton
              title="Chỉnh sửa thông tin"
              variant="outline"
              className="mb-3"
              disabled={saving}
              onPress={() => {
                setDraft(makeDraft(selected));
                setIsEditing(true);
                setFormError("");
              }}
            />
          ) : null}
          {canEdit && !isEditing ? (
            <FptButton
              title={
                selected.status?.toUpperCase() === "INACTIVE"
                  ? "Mở lại tài khoản"
                  : "Đóng tài khoản"
              }
              variant={
                selected.status?.toUpperCase() === "INACTIVE"
                  ? "secondary"
                  : "danger"
              }
              disabled={saving}
              onPress={toggleStatus}
            />
          ) : null}
          {!canEdit ? (
            <Text className="text-sm leading-6 text-slate-500">
              Tài khoản hiện chỉ có quyền xem hồ sơ.
            </Text>
          ) : null}
        </>
      ) : (
        <>
          <RoleHero
            eyebrow="Academic operations"
            title={`Danh sách ${title.toLowerCase()}`}
            description={description}
          />
          <FptInput
            placeholder="Tìm theo tên, email hoặc số điện thoại"
            value={query}
            onChangeText={setQuery}
          />
          <RoleSection title={`${filtered.length} ${title.toLowerCase()}`}>
            {loading ? <FptLoading message="Đang tải hồ sơ..." /> : null}
            {!loading && !error && !filtered.length ? (
              <FptEmptyState
                title={`Chưa có ${title.toLowerCase()} phù hợp`}
                description="Thử thay đổi nội dung tìm kiếm."
              />
            ) : null}
            {!loading
              ? filtered.map((person) => (
                  <RoleTile
                    key={person._id}
                    title={person.full_name || person.name}
                    subtitle={`${person.email || "Chưa có email"} · ${person.status || "ACTIVE"}${person.phone ? `\n${person.phone}` : ""}`}
                    icon={
                      personRole === "TEACHER"
                        ? "school-outline"
                        : "person-outline"
                    }
                    onPress={() => {
                      setSelected(person);
                      setDraft(makeDraft(person));
                      setIsEditing(false);
                      setError("");
                      setFormError("");
                    }}
                  />
                ))
              : null}
          </RoleSection>
        </>
      )}
    </RoleScreen>
  );
}
