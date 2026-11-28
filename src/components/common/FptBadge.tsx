import React from "react";
import { View, Text } from "react-native";

export interface FptBadgeProps {
  status?: string;
  label?: string;
  size?: "sm" | "md";
}

export const FptBadge: React.FC<FptBadgeProps> = ({
  status = "",
  label,
  size = "md",
}) => {
  const normalized = (status || "").toUpperCase();

  const getBadgeConfig = () => {
    switch (normalized) {
      case "OPEN":
      case "ACTIVE":
        return {
          bg: "bg-emerald-50",
          text: "text-emerald-700",
          border: "border-emerald-200",
          defaultLabel: normalized === "ACTIVE" ? "Đang hoạt động" : "Đang mở",
        };
      case "STUDYING":
        return {
          bg: "bg-blue-50",
          text: "text-blue-700",
          border: "border-blue-200",
          defaultLabel: "Đang học",
        };
      case "WAITING_PAYMENT":
      case "UNPAID":
      case "PENDING":
      case "WAITING_CONFIRMATION":
        return {
          bg: "bg-amber-50",
          text: "text-amber-700",
          border: "border-amber-200",
          defaultLabel:
            normalized === "WAITING_CONFIRMATION"
              ? "Đang chờ duyệt"
              : "Chờ thanh toán",
        };
      case "PAID":
      case "COMPLETED":
        return {
          bg: "bg-green-50",
          text: "text-green-700",
          border: "border-green-200",
          defaultLabel: normalized === "PAID" ? "Đã thanh toán" : "Hoàn thành",
        };
      case "PARTIAL":
        return {
          bg: "bg-orange-50",
          text: "text-orange-700",
          border: "border-orange-200",
          defaultLabel: "Đã nộp một phần",
        };
      case "APPROVED":
        return {
          bg: "bg-green-50",
          text: "text-green-700",
          border: "border-green-200",
          defaultLabel: "Đã duyệt",
        };
      case "REJECTED":
        return {
          bg: "bg-rose-50",
          text: "text-rose-700",
          border: "border-rose-200",
          defaultLabel: "Bị từ chối",
        };
      case "CANCELLED":
      case "INACTIVE":
      case "FULL":
        return {
          bg: "bg-rose-50",
          text: "text-rose-700",
          border: "border-rose-200",
          defaultLabel:
            normalized === "FULL"
              ? "Đã đủ sĩ số"
              : normalized === "INACTIVE"
                ? "Đã đóng"
                : "Đã hủy",
        };
      case "NEW":
        return {
          bg: "bg-cyan-50",
          text: "text-cyan-700",
          border: "border-cyan-200",
          defaultLabel: "Mới",
        };
      case "CONTACTED":
        return {
          bg: "bg-purple-50",
          text: "text-purple-700",
          border: "border-purple-200",
          defaultLabel: "Đã liên hệ",
        };
      case "ENROLLED":
        return {
          bg: "bg-emerald-50",
          text: "text-emerald-700",
          border: "border-emerald-200",
          defaultLabel: "Đã ghi danh",
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-700",
          border: "border-gray-200",
          defaultLabel: status || "Không rõ",
        };
    }
  };

  const config = getBadgeConfig();
  const displayLabel = label || config.defaultLabel;
  const padding = size === "sm" ? "px-2.5 py-1" : "px-3 py-1.5";

  return (
    <View
      className={`self-start rounded-full border ${config.bg} ${config.border} ${padding}`}
    >
      <Text className={`text-xs font-semibold ${config.text}`}>
        {displayLabel}
      </Text>
    </View>
  );
};

export default FptBadge;
