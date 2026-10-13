import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { api, apiErrorMessage } from "@/lib/api";
import { colors, radius, spacing } from "@/lib/theme";
import type { City, Level } from "@/lib/types";

export default function NewRequirementScreen() {
  const router = useRouter();

  const [cities, setCities] = useState<City[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [cityId, setCityId] = useState<number | null>(null);
  const [localityName, setLocalityName] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [levelId, setLevelId] = useState<number | null>(null);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const [c, l] = await Promise.all([
          api.get<{ data: City[] }>("/api/cities"),
          api.get<{ data: Level[] }>("/api/levels"),
        ]);
        setCities(c.data);
        setLevels(l.data);
        if (c.data.length === 0 || l.data.length === 0) {
          setLoadError("No cities/levels found on the server yet. Ask the admin to run the seed script.");
        }
      } catch (e) {
        setLoadError(apiErrorMessage(e));
      }
      setLoading(false);
    }
    init();
  }, []);

  const missing: string[] = [];
  if (cityId == null) missing.push("Select a city");
  if (localityName.trim().length < 2) missing.push("Enter your locality / area");
  if (subjectName.trim().length === 0) missing.push("Enter a subject");
  if (levelId == null) missing.push(levels.length === 0 ? "No levels are available yet" : "Select a level");
  const canSave = missing.length === 0;

  async function onSave() {
    if (cityId == null || levelId == null) return;
    setError(null);
    setSaving(true);
    try {
      // Locality and subject are typed, not picked from a list — resolve each to a real
      // row (creating it if needed) before posting, same approach as the tutor profile form.
      const locality = await api.post<{ data: { id: number } }>(`/api/cities/${cityId}/localities`, {
        name: localityName.trim(),
      });
      const resolvedSubjects = await api.post<{ data: { id: number; name: string }[] }>("/api/subjects/resolve", {
        names: [subjectName.trim()],
      });

      await api.post("/api/requirements", {
        localityId: locality.data.id,
        subjectId: resolvedSubjects.data[0].id,
        levelId,
        budgetMin: budgetMin ? Number(budgetMin) : undefined,
        budgetMax: budgetMax ? Number(budgetMax) : undefined,
        description: description.trim() || undefined,
      });
      router.back();
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <View style={styles.loading} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {loadError ? <Text style={styles.loadError}>{loadError}</Text> : null}

        <Text style={styles.label}>City</Text>
        <View style={styles.pillWrap}>
          {cities.map((c) => (
            <Pill key={c.id} label={c.name} active={cityId === c.id} onPress={() => setCityId(c.id)} />
          ))}
        </View>

        <TextField label="Locality / area" value={localityName} onChangeText={setLocalityName} placeholder="e.g. Baneshwor" />
        <TextField label="Subject" value={subjectName} onChangeText={setSubjectName} placeholder="e.g. Math" />

        <Text style={styles.label}>Level</Text>
        <View style={styles.pillWrap}>
          {levels.map((l) => (
            <Pill key={l.id} label={l.name} active={levelId === l.id} onPress={() => setLevelId(l.id)} />
          ))}
        </View>

        <View style={styles.feeRow}>
          <View style={styles.feeField}>
            <TextField label="Budget min (Rs/month)" value={budgetMin} onChangeText={setBudgetMin} keyboardType="number-pad" />
          </View>
          <View style={styles.feeField}>
            <TextField label="Budget max (Rs/month)" value={budgetMax} onChangeText={setBudgetMax} keyboardType="number-pad" />
          </View>
        </View>

        <TextField
          label="Anything else tutors should know? (optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="e.g. Prefer weekend classes, exam prep focus..."
          multiline
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!canSave && (
          <View style={styles.missingBox}>
            <Text style={styles.missingTitle}>Before you can post:</Text>
            {missing.map((m) => (
              <Text key={m} style={styles.missingItem}>
                • {m}
              </Text>
            ))}
          </View>
        )}

        <Button title="Post request" onPress={onSave} loading={saving} disabled={!canSave} style={styles.save} />
      </ScrollView>
    </Screen>
  );
}

function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, active && styles.pillActive]}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  label: { fontSize: 13, color: colors.muted, marginTop: spacing.sm, marginBottom: spacing.xs },
  feeRow: { flexDirection: "row", gap: spacing.md },
  feeField: { flex: 1 },
  pillWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
  },
  pillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  pillText: { fontSize: 13, color: colors.text },
  pillTextActive: { color: "#fff", fontWeight: "600" },
  error: { color: colors.danger, fontSize: 13, marginTop: spacing.sm },
  loadError: {
    color: colors.danger,
    fontSize: 13,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  missingBox: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#f59e0b",
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  missingTitle: { fontSize: 13, fontWeight: "700", color: colors.text, marginBottom: spacing.xs },
  missingItem: { fontSize: 13, color: colors.text, marginTop: 2 },
  save: { marginTop: spacing.lg },
});