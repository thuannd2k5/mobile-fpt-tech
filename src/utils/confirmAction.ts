import { Alert, Platform } from "react-native";

export const confirmAction = (
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void,
  destructive = true,
) => {
  if (Platform.OS === "web") {
    if (
      typeof window !== "undefined" &&
      window.confirm(`${title}\n\n${message}`)
    ) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: "Hủy", style: "cancel" },
    {
      text: confirmLabel,
      style: destructive ? "destructive" : "default",
      onPress: onConfirm,
    },
  ]);
};
