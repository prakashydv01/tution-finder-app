import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { useAuth, apiErrorMessage } from "@/lib/auth-context";
import { colors, spacing } from "@/lib/theme";

export default function VerifyScreen() {
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const { verifyEmail, resendCode } = useAuth();

  const [email] = useState(emailParam ?? "");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function onVerify() {
    setError(null);
    setLoading(true);
    try {
      await verifyEmail(email, code.trim());
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
      await resendCode(email);
      setInfo("A new code has been sent to your email.");
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setResending(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Check your email</Text>
      <Text style={styles.subtitle}>
        We sent a 6-digit code to{"\n"}
        <Text style={styles.email}>{email}</Text>
      </Text>

      <TextField
        label="Verification code"
        value={code}
        onChangeText={(v) => setCode(v.replace(/[^0-9]/g, "").slice(0, 6))}
        keyboardType="number-pad"
        placeholder="123456"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {info ? <Text style={styles.info}>{info}</Text> : null}

      <Button title="Verify" onPress={onVerify} loading={loading} disabled={code.length !== 6} />
      <Button title="Resend code" onPress={onResend} variant="link" loading={resending} style={styles.resend} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: spacing.xl, lineHeight: 20 },
  email: { color: colors.text, fontWeight: "600" },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing.md },
  info: { color: colors.ok, fontSize: 13, marginBottom: spacing.md },
  resend: { marginTop: spacing.sm, alignSelf: "center" },
});
