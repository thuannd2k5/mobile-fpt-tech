import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useAppSelector } from "@/redux/hooks";
import { callFetchMyEnrollments, callFetchMyInvoices } from "@/api";
import { IPortalEnrollment, IPortalInvoice } from "@/types/backend";
import {
  RoleScreen,
  RoleHero,
  RoleSection,
  RoleTile,
  RoleStat,
} from "@/components/common/RoleScreen";
import {
  FptBadge,
  FptEmptyState,
  FptLoading,
  FptButton,
} from "@/components/common";
import FptErrorBanner from "@/components/common/FptErrorBanner";
export default function StudentHome() {
  const router = useRouter();
  const { user } = useAppSelector((s) => s.account);
  const [enrollments, setEnrollments] = useState<IPortalEnrollment[]>([]),
    [invoices, setInvoices] = useState<IPortalInvoice[]>([]),
    [busy, setBusy] = useState(true),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const [a, b] = await Promise.allSettled([
        callFetchMyEnrollments(),
        callFetchMyInvoices(),
      ]);
      if (a.status === "fulfilled") setEnrollments(a.value.data || []);
      if (b.status === "fulfilled") setInvoices(b.value.data || []);
      if (a.status === "rejected" || b.status === "rejected")
        setError("Chưa tải được đầy đủ lớp học và học phí. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const active = enrollments.filter((e) =>
    ["STUDYING", "WAITING_PAYMENT", "WAITING_CONFIRMATION", "PARTIAL"].includes(
      e.status || "",
    ),
  );
  return (
    <RoleScreen
      eyebrow="Học viên · Hành trình học tập"
      title="Hành trình học tập"
      subtitle={"Chào " + (user.name || "bạn") + ", cùng tiến bộ mỗi ngày."}
      refreshing={busy}
      onRefresh={() => void load()}
    >
      <RoleHero
        eyebrow="LEARNING JOURNEY"
        title={"Học điều mới.\nTiến gần hơn đến mục tiêu."}
        description="Theo dõi lớp đã ghi danh và học phí của riêng bạn."
      />
      {error ? (
        <FptErrorBanner message={error} onRetry={() => void load()} />
      ) : null}
      {busy && !enrollments.length ? <FptLoading fullScreen={false} /> : null}
      <View className="flex-row">
        <RoleStat
          label="Lớp đang học"
          value={enrollments.filter((e) => e.status === "STUDYING").length}
        />
        <RoleStat
          label="Học phí chưa hoàn tất"
          value={
            invoices.filter(
              (invoice) =>
                !["PAID", "CANCELLED"].includes(
                  (invoice.status || "").toUpperCase(),
                ),
            ).length
          }
        />
      </View>
      <RoleSection
        title="Lớp học của tôi"
        action={
          <FptButton
            title="Tất cả"
            size="sm"
            variant="ghost"
            onPress={() => router.push("/(student)/(tabs)/schedule")}
          />
        }
      >
        {active.slice(0, 4).map((e) => (
          <RoleTile
            key={e._id}
            icon="school-outline"
            title={
              e.class_id?.course_id?.name || e.class_id?.class_name || "Lớp học"
            }
            subtitle={
              (e.class_id?.class_name || "") +
              " · " +
              (e.class_id?.start_time || "Chưa xếp giờ") +
              " – " +
              (e.class_id?.end_time || "")
            }
            trailing={<FptBadge status={e.status} size="sm" />}
            onPress={() =>
              e.class_id?._id &&
              router.push(("/(student)/class/" + e.class_id._id) as never)
            }
          />
        ))}
        {!active.length && !busy && !error ? (
          <FptEmptyState
            title="Bạn chưa có lớp đang học"
            description="Khám phá khóa học để bắt đầu lộ trình của mình."
          />
        ) : null}
      </RoleSection>
      <FptButton
        title="Khám phá khóa học"
        onPress={() => router.push("/(student)/(tabs)/courses")}
      />
      <View className="mt-4">
        <RoleTile
          icon="receipt-outline"
          title="Học phí của tôi"
          subtitle="Hóa đơn và lịch sử thanh toán"
          onPress={() => router.push("/(student)/(tabs)/invoices")}
        />
      </View>
    </RoleScreen>
  );
}
