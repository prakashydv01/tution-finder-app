import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { useAuth, apiErrorMessage } from "@/lib/auth-context";
import { colors, spacing } from "@/lib/theme";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      await forgotPassword(cleanEmail);
      router.push({ pathname: "/reset-password", params: { email: cleanEmail } });
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot your password?</Text>
      <Text style={styles.subtitle}>Enter your email and we'll send you a code to reset it.</Text>

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="you@example.com"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button title="Send reset code" onPress={onSubmit} loading={loading} disabled={!email.includes("@")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: spacing.xl, lineHeight: 20 },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing.md },
});