import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { useAuth, apiErrorMessage } from "@/lib/auth-context";
import { colors, spacing } from "@/lib/theme";

export default function ResetPasswordScreen() {
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const router = useRouter();
  const { resetPassword, forgotPassword } = useAuth();

  const [email] = useState(emailParam ?? "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit = code.length === 6 && newPassword.length >= 8 && passwordsMatch;

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await resetPassword(email, code.trim(), newPassword);
      // On success, the root layout's auth guard redirects into the app automatically.
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    setError(null);
    setInfo(null);
    setResending(true);
    try {
      await forgotPassword(email);
      setInfo("A new code has been sent to your email.");
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setResending(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Reset your password</Text>
      <Text style={styles.subtitle}>
        Enter the 6-digit code sent to{"\n"}
        <Text style={styles.email}>{email}</Text>
      </Text>

      <TextField
        label="Reset code"
        value={code}
        onChangeText={(v) => setCode(v.replace(/[^0-9]/g, "").slice(0, 6))}
        keyboardType="number-pad"
        placeholder="123456"
      />
      <TextField
        label="New password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        placeholder="At least 8 characters"
      />
      <TextField
        label="Confirm new password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        placeholder="Re-enter new password"
        error={confirmPassword.length > 0 && !passwordsMatch ? "Passwords don't match" : undefined}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {info ? <Text style={styles.info}>{info}</Text> : null}

      <Button title="Reset password" onPress={onSubmit} loading={loading} disabled={!canSubmit} />
      <Button title="Resend code" onPress={onResend} variant="link" loading={resending} style={styles.resend} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: spacing.xl, justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: spacing.xl, lineHeight: 20 },
  email: { color: colors.text, fontWeight: "600" },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing.md },
  info: { color: colors.ok, fontSize: 13, marginBottom: spacing.md },
  resend: { marginTop: spacing.sm, alignSelf: "center" },
});