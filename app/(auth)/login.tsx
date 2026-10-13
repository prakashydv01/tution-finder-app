import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { useAuth, apiErrorMessage } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { colors, spacing } from "@/lib/theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (e) {
      if (e instanceof ApiError && e.code === "EMAIL_NOT_VERIFIED") {
        router.push({ pathname: "/verify", params: { email: email.trim().toLowerCase() } });
        return;
      }
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Tuition Finder</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="you@example.com"
      />
      <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />

      <Link href="/forgot-password" style={styles.forgotLink}>
        Forgot password?
      </Link>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button title="Sign in" onPress={onSubmit} loading={loading} disabled={!email || !password} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <Link href="/register" style={styles.link}>
          Create one
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: spacing.xl, justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "700", color: colors.text, marginBottom: spacing.xs },
  subtitle: { fontSize: 15, color: colors.muted, marginBottom: spacing.xl },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing.md },
  forgotLink: { color: colors.accent, fontSize: 13, textAlign: "right", marginBottom: spacing.lg },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.lg },
  footerText: { color: colors.muted, fontSize: 14 },
  link: { color: colors.accent, fontSize: 14, fontWeight: "600" },
});