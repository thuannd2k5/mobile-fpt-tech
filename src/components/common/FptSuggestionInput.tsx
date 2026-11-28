import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { FptInput } from "./FptInput";
import type { FptInputProps } from "./FptInput";

type FptSuggestionInputProps = Omit<FptInputProps, "onChangeText"> & {
  suggestions: string[];
  onChangeText: (value: string) => void;
  formatSuggestion?: (value: string) => string;
};

export const FptSuggestionInput: React.FC<FptSuggestionInputProps> = ({
  suggestions,
  onChangeText,
  formatSuggestion,
  ...inputProps
}) => {
  const options = [...new Set(suggestions.map((value) => value.trim()))]
    .filter(Boolean)
    .slice(0, 8);

  return (
    <View>
      <FptInput {...inputProps} onChangeText={onChangeText} />
      {options.length ? (
        <View className="-mt-2 mb-4">
          <Text className="mb-2 text-xs font-medium text-slate-500">
            Gợi ý chọn nhanh
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                accessibilityRole="button"
                onPress={() => onChangeText(option)}
                className="min-h-[40px] justify-center rounded-full border border-slate-200 bg-white px-3 py-2"
              >
                <Text className="text-sm text-slate-700">
                  {formatSuggestion ? formatSuggestion(option) : option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
};

export default FptSuggestionInput;
