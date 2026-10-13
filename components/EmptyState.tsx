import { StyleSheet, Text } from "react-native";
import { colors, spacing } from "@/lib/theme";

export function EmptyState({ message }: { message: string }) {
  return <Text style={styles.text}>{message}</Text>;
}

const styles = StyleSheet.create({
  text: { textAlign: "center", color: colors.muted, paddingVertical: spacing.xl * 2, fontSize: 14 },
});
