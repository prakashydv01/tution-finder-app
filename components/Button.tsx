import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from "react-native";
import { colors, radius, spacing } from "@/lib/theme";

type Variant = "primary" | "secondary" | "danger" | "link";

export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" || variant === "link" ? colors.text : "#fff"} />
      ) : (
        <Text style={[styles.text, textVariantStyles[variant]]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  text: { fontSize: 15, fontWeight: "600" },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
});

const variantStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: colors.accent, borderColor: colors.accent },
  secondary: { backgroundColor: "#fff", borderColor: colors.border },
  danger: { backgroundColor: "#fff", borderColor: colors.danger },
  link: { backgroundColor: "transparent", borderColor: "transparent", paddingHorizontal: 0 },
};

const textVariantStyles: Record<Variant, { color: string }> = {
  primary: { color: "#fff" },
  secondary: { color: colors.text },
  danger: { color: colors.danger },
  link: { color: colors.accent },
};
