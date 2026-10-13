import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/lib/theme";

export function Screen({ children }: { children: React.ReactNode }) {
  return <SafeAreaView style={styles.safe} edges={["bottom"]}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
});
