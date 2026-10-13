import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { usePaginatedList } from "@/lib/use-paginated-list";
import { colors, radius, spacing } from "@/lib/theme";
import type { City, Paginated, Requirement, Subject } from "@/lib/types";

function formatBudget(r: Requirement) {
  if (r.budgetMin == null && r.budgetMax == null) return null;
  if (r.budgetMin != null && r.budgetMax != null) return `Rs. ${r.budgetMin}–${r.budgetMax} / month`;
  if (r.budgetMin != null) return `Rs. ${r.budgetMin}+ / month`;
  return `Up to Rs. ${r.budgetMax} / month`;
}

export default function RequirementsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const isTutor = user?.role === "TUTOR";
  const [updating, setUpdating] = useState<string | null>(null);

  // Tutor-only filters
  const [cities, setCities] = useState<City[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [cityId, setCityId] = useState<number | null>(null);
  const [subjectId, setSubjectId] = useState<number | null>(null);

  useEffect(() => {
    if (!isTutor) return;
    Promise.all([api.get<{ data: City[] }>("/api/cities"), api.get<{ data: Subject[] }>("/api/subjects")])
      .then(([c, s]) => {
        setCities(c.data);
        setSubjects(s.data);
      })
      .catch(() => {});
  }, [isTutor]);

  const fetchPage = useCallback(
    (page: number, limit: number) => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (isTutor) {
        if (cityId) params.set("cityId", String(cityId));
        if (subjectId) params.set("subjectId", String(subjectId));
        return api.get<Paginated<Requirement>>(`/api/requirements?${params.toString()}`);
      }
      return api.get<Paginated<Requirement>>(`/api/requirements/mine?${params.toString()}`);
    },
    [isTutor, cityId, subjectId],
  );

  const { items: requirements, meta, loading, loadingMore, refreshing, refresh, loadMore } = usePaginatedList(fetchPage);
  const contactVisible = meta?.contactVisible ?? false;

  // Re-fetch "my requests" whenever this tab regains focus (e.g. after posting a new one).
  useFocusEffect(
    useCallback(() => {
      if (!isTutor) refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isTutor]),
  );

  async function toggleActive(r: Requirement) {
    setUpdating(r.id);
    try {
      await api.patch(`/api/requirements/${r.id}`, { isActive: !r.isActive });
      refresh();
    } catch {
      // ignore; list stays as-is
    } finally {
      setUpdating(null);
    }
  }

  async function remove(r: Requirement) {
    setUpdating(r.id);
    try {
      await api.delete(`/api/requirements/${r.id}`);
      refresh();
    } catch {
      // ignore
    } finally {
      setUpdating(null);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{isTutor ? "Tutoring requests" : "My requests"}</Text>
        {!isTutor && <Button title="Post a request" onPress={() => router.push("/requirement/new")} />}
      </View>

      {isTutor && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterRowContent}>
            <FilterPill label="All cities" active={cityId === null} onPress={() => setCityId(null)} />
            {cities.map((c) => (
              <FilterPill key={c.id} label={c.name} active={cityId === c.id} onPress={() => setCityId(c.id)} />
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterRowContent}>
            <FilterPill label="All subjects" active={subjectId === null} onPress={() => setSubjectId(null)} />
            {subjects.map((s) => (
              <FilterPill key={s.id} label={s.name} active={subjectId === s.id} onPress={() => setSubjectId(s.id)} />
            ))}
          </ScrollView>
        </>
      )}

      <FlatList
        data={requirements}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={refresh}
        onEndReachedThreshold={0.4}
        onEndReached={loadMore}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              message={isTutor ? "No open requests match these filters yet." : "You haven't posted a request yet."}
            />
          ) : null
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footerLoader} color={colors.accent} /> : null}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.cardTop}>
              <Text style={styles.subject}>
                {item.subject.name} · {item.level.name}
              </Text>
              {!isTutor && (
                <Text style={[styles.status, { color: item.isActive ? colors.ok : colors.muted }]}>
                  {item.isActive ? "Active" : "Closed"}
                </Text>
              )}
            </View>
            <Text style={styles.meta}>
              {item.locality.name}, {item.locality.city.name}
            </Text>
            {formatBudget(item) && <Text style={styles.meta}>{formatBudget(item)}</Text>}
            {item.description ? <Text style={styles.description}>{item.description}</Text> : null}

            {isTutor && item.user && (
              <View style={styles.contactBox}>
                {contactVisible ? (
                  <Text style={styles.contact}>
                    {item.user.name} · {item.user.phone ?? item.user.email}
                  </Text>
                ) : (
                  <Text style={styles.meta}>Posted by {item.user.name} — sign in as a verified tutor to see contact info.</Text>
                )}
              </View>
            )}

            {!isTutor && (
              <View style={styles.actions}>
                <Button
                  title={item.isActive ? "Mark as closed" : "Reopen"}
                  variant="secondary"
                  loading={updating === item.id}
                  onPress={() => toggleActive(item)}
                />
                <Button title="Delete" variant="danger" loading={updating === item.id} onPress={() => remove(item)} />
              </View>
            )}
          </Card>
        )}
      />
    </Screen>
  );
}

function FilterPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, active && styles.pillActive]}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 22, fontWeight: "700", color: colors.text },
  filterRow: { flexGrow: 0, marginBottom: spacing.sm },
  filterRowContent: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    backgroundColor: "#fff",
  },
  pillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  pillText: { fontSize: 13, color: colors.text },
  pillTextActive: { color: "#fff", fontWeight: "600" },
  listContent: { padding: spacing.lg, paddingTop: spacing.sm },
  footerLoader: { marginVertical: spacing.lg },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  subject: { fontSize: 15, fontWeight: "700", color: colors.text },
  status: { fontSize: 12, fontWeight: "700" },
  meta: { fontSize: 13, color: colors.muted, marginTop: 4 },
  description: { fontSize: 14, color: colors.text, marginTop: spacing.sm },
  contactBox: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  contact: { fontSize: 13, color: colors.text, fontWeight: "600" },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
});