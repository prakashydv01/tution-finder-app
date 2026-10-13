import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useAuth } from "@/lib/auth-context";
import { colors, spacing } from "@/lib/theme";

export default function ProfileScreen() {
  const { user, tutorProfile, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>

        <Card>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.meta}>{user.email}</Text>
          {user.phone ? <Text style={styles.meta}>{user.phone}</Text> : null}
          <Text style={styles.role}>{user.role === "TUTOR" ? "Tutor" : "Looking for a tutor"}</Text>
        </Card>

        {user.role === "TUTOR" && (
          <Card>
            <Text style={styles.cardTitle}>Tutor profile</Text>
            <Text style={styles.meta}>
              {tutorProfile
                ? tutorProfile.isVerified
                  ? "Your profile is live and visible to students."
                  : "Your profile is waiting for admin approval."
                : "You haven't created your tutor profile yet."}
            </Text>
            <Button
              title={tutorProfile ? "Edit tutor profile" : "Create tutor profile"}
              variant="secondary"
              onPress={() => router.push("/tutor-profile/edit")}
              style={styles.cardButton}
            />
          </Card>
        )}

        <Button title="Log out" variant="danger" onPress={logout} style={styles.logout} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  title: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: spacing.lg },
  name: { fontSize: 17, fontWeight: "700", color: colors.text },
  meta: { fontSize: 14, color: colors.muted, marginTop: 4 },
  role: { fontSize: 13, color: colors.accent, fontWeight: "600", marginTop: spacing.sm },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: spacing.xs },
  cardButton: { marginTop: spacing.md },
  logout: { marginTop: spacing.md },
});
