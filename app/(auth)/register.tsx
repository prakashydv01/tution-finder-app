import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { useAuth, apiErrorMessage } from "@/lib/auth-context";
import { colors, spacing } from "@/lib/theme";
import type { Role } from "@/lib/types";

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("SEEKER");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = name.length >= 2 && email.includes("@") && password.length >= 8;

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      await register({ name: name.trim(), email: cleanEmail, password, role, phone: phone.trim() || undefined });
      router.push({ pathname: "/verify", params: { email: cleanEmail } });
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Create your account</Text>

      <View style={styles.roleRow}>
        <RoleOption label="Find a tutor" active={role === "SEEKER"} onPress={() => setRole("SEEKER")} />
        <RoleOption label="I'm a tutor" active={role === "TUTOR"} onPress={() => setRole("TUTOR")} />
      </View>

      <TextField label="Full name" value={name} onChangeText={setName} placeholder="Your name" />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="you@example.com"
      />
      <TextField
        label="Phone (optional)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="98XXXXXXXX"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="At least 8 characters"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button title="Create account" onPress={onSubmit} loading={loading} disabled={!canSubmit} />
    </ScrollView>
  );
}

function RoleOption({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Text
      onPress={onPress}
      style={[styles.roleOption, active && styles.roleOptionActive]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: spacing.xl },
  title: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: spacing.lg },
  roleRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  roleOption: {
    flex: 1,
    textAlign: "center",
    paddingVertical: spacing.sm + 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 13,
    overflow: "hidden",
  },
  roleOptionActive: { backgroundColor: colors.accent, borderColor: colors.accent, color: "#fff", fontWeight: "600" },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing.md },
});
