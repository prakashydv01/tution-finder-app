import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { api, apiErrorMessage } from "@/lib/api";
import { colors, radius, spacing } from "@/lib/theme";
import type { City, Level, TeachingMode, TutorDetail } from "@/lib/types";

const MODES: TeachingMode[] = ["HOME", "CENTER", "ONLINE"];

export default function EditTutorProfileScreen() {
  const router = useRouter();

  const [cities, setCities] = useState<City[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);

  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState("0");
  const [feeMin, setFeeMin] = useState("");
  const [feeMax, setFeeMax] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [cityId, setCityId] = useState<number | null>(null);
  const [localityName, setLocalityName] = useState("");
  const [subjectsText, setSubjectsText] = useState("");
  const [selectedLevels, setSelectedLevels] = useState<Set<number>>(new Set());
  const [modes, setModes] = useState<Set<TeachingMode>>(new Set());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

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
          setLoadError(
            "No cities/levels found on the server yet. Run `npm run db:seed` in the backend project, then come back to this screen.",
          );
        }
      } catch (e) {
        setLoadError(apiErrorMessage(e));
      }

      try {
        const existing = await api.get<{ data: TutorDetail }>("/api/tutors/me");
        const t = existing.data;
        setHeadline(t.headline);
        setBio(t.bio);
        setExperienceYears(String(t.experienceYears));
        setFeeMin(t.feeMin != null ? String(t.feeMin) : "");
        setFeeMax(t.feeMax != null ? String(t.feeMax) : "");
        setContactPhone(t.contactPhone ?? "");
        setCityId(t.city.id);
        setLocalityName(t.locality.name);
        setSubjectsText(t.subjects.map((s) => s.name).join(", "));
        setSelectedLevels(new Set(t.levels.map((x) => x.id)));
        setModes(new Set(t.modes));
      } catch {
        // No profile yet — that's fine, this is the create flow.
      }
      setLoading(false);
    }
    init();
  }, []);

  function toggleLevel(id: number) {
    const next = new Set(selectedLevels);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedLevels(next);
  }

  function toggleMode(m: TeachingMode) {
    const next = new Set(modes);
    next.has(m) ? next.delete(m) : next.add(m);
    setModes(next);
  }

  const missing: string[] = [];
  if (headline.trim().length < 5) missing.push("Headline needs at least 5 characters");
  if (bio.trim().length < 20) missing.push("About you needs at least 20 characters");
  if (contactPhone.trim().length < 7) missing.push("Enter a valid contact phone number");
  if (cityId == null) missing.push("Select a city");
  if (localityName.trim().length < 2) missing.push("Enter your locality / area");
  if (subjectsText.trim().length === 0) missing.push("Enter at least one subject");
  if (selectedLevels.size === 0) {
    missing.push(
      levels.length === 0 ? "No levels are available yet — ask the admin to seed the database" : "Select at least one level",
    );
  }
  if (modes.size === 0) missing.push("Select at least one teaching mode");

  const canSave = missing.length === 0;

  async function onSave() {
    if (cityId == null) return;
    setError(null);
    setSaving(true);
    try {
      // Locality and subjects are typed by the tutor, not picked from a list — resolve
      // each one to a real database row (creating it if it doesn't exist yet) before saving.
      const locality = await api.post<{ data: { id: number } }>(`/api/cities/${cityId}/localities`, {
        name: localityName.trim(),
      });

      const subjectNames = [...new Set(subjectsText.split(",").map((s) => s.trim()).filter(Boolean))];
      const resolvedSubjects = await api.post<{ data: { id: number }[] }>("/api/subjects/resolve", {
        names: subjectNames,
      });

      await api.put("/api/tutors/me", {
        headline: headline.trim(),
        bio: bio.trim(),
        experienceYears: Number(experienceYears) || 0,
        feeMin: feeMin ? Number(feeMin) : undefined,
        feeMax: feeMax ? Number(feeMax) : undefined,
        feeUnit: "MONTH",
        modes: Array.from(modes),
        contactPhone: contactPhone.trim(),
        cityId,
        localityId: locality.data.id,
        subjectIds: resolvedSubjects.data.map((s) => s.id),
        levelIds: Array.from(selectedLevels),
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

        <TextField label="Headline" value={headline} onChangeText={setHeadline} placeholder="e.g. Experienced Math & Science tutor" />
        <TextField label="About you" value={bio} onChangeText={setBio} placeholder="Your teaching style, qualifications..." multiline />
        <TextField label="Years of experience" value={experienceYears} onChangeText={setExperienceYears} keyboardType="number-pad" />

        <View style={styles.feeRow}>
          <View style={styles.feeField}>
            <TextField label="Fee min (Rs/month)" value={feeMin} onChangeText={setFeeMin} keyboardType="number-pad" />
          </View>
          <View style={styles.feeField}>
            <TextField label="Fee max (Rs/month)" value={feeMax} onChangeText={setFeeMax} keyboardType="number-pad" />
          </View>
        </View>

        <TextField label="Contact phone" value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" placeholder="98XXXXXXXX" />

        <Text style={styles.label}>City</Text>
        <View style={styles.pillWrap}>
          {cities.map((c) => (
            <Pill key={c.id} label={c.name} active={cityId === c.id} onPress={() => setCityId(c.id)} />
          ))}
        </View>

        <TextField
          label="Locality / area"
          value={localityName}
          onChangeText={setLocalityName}
          placeholder="e.g. Baneshwor"
        />

        <TextField
          label="Subjects you teach"
          value={subjectsText}
          onChangeText={setSubjectsText}
          placeholder="e.g. Math, Physics, Chemistry"
        />
        <Text style={styles.hint}>Separate multiple subjects with commas.</Text>

        <Text style={styles.label}>Levels you teach</Text>
        <View style={styles.pillWrap}>
          {levels.map((l) => (
            <Pill key={l.id} label={l.name} active={selectedLevels.has(l.id)} onPress={() => toggleLevel(l.id)} />
          ))}
        </View>

        <Text style={styles.label}>Teaching mode</Text>
        <View style={styles.pillWrap}>
          {MODES.map((m) => (
            <Pill key={m} label={m} active={modes.has(m)} onPress={() => toggleMode(m)} />
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!canSave && (
          <View style={styles.missingBox}>
            <Text style={styles.missingTitle}>Before you can save:</Text>
            {missing.map((m) => (
              <Text key={m} style={styles.missingItem}>
                • {m}
              </Text>
            ))}
          </View>
        )}

        <Button title="Save profile" onPress={onSave} loading={saving} disabled={!canSave} style={styles.save} />
        <Text style={styles.note}>Your profile is reviewed by an admin before it appears in search.</Text>
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
  hint: { fontSize: 12, color: colors.muted, marginTop: -spacing.sm, marginBottom: spacing.md },
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
  note: { fontSize: 12, color: colors.muted, textAlign: "center", marginTop: spacing.md },
}); 