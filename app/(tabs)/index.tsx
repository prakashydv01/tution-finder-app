import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { EmptyState } from "@/components/EmptyState";
import { api } from "@/lib/api";
import { usePaginatedList } from "@/lib/use-paginated-list";
import { colors, radius, spacing } from "@/lib/theme";
import type { City, Paginated, Subject, TutorListItem } from "@/lib/types";

export default function SearchScreen() {
  const router = useRouter();
  const [cities, setCities] = useState<City[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [cityId, setCityId] = useState<number | null>(null);
  const [subjectId, setSubjectId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([api.get<{ data: City[] }>("/api/cities"), api.get<{ data: Subject[] }>("/api/subjects")])
      .then(([c, s]) => {
        setCities(c.data);
        setSubjects(s.data);
      })
      .catch(() => {});
  }, []);

  const fetchPage = useCallback(
    (page: number, limit: number) => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (cityId) params.set("cityId", String(cityId));
      if (subjectId) params.set("subjectId", String(subjectId));
      return api.get<Paginated<TutorListItem>>(`/api/tutors?${params.toString()}`);
    },
    [cityId, subjectId],
  );

  const { items: tutors, loading, loadingMore, refreshing, refresh, loadMore } = usePaginatedList(fetchPage);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Find a tutor</Text>
      </View>

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

      <FlatList
        data={tutors}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={refresh}
        onEndReachedThreshold={0.4}
        onEndReached={loadMore}
        ListEmptyComponent={!loading ? <EmptyState message="No tutors match these filters yet." /> : null}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footerLoader} color={colors.accent} /> : null}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/tutor/${item.id}`)}>
            <Card>
              <Text style={styles.name}>{item.user.name}</Text>
              <Text style={styles.headline}>{item.headline}</Text>
              <Text style={styles.meta}>
                {item.city.name}, {item.locality.name} · {item.experienceYears} yrs experience
              </Text>
              {item.feeMin != null && (
                <Text style={styles.meta}>
                  Rs. {item.feeMin}
                  {item.feeMax ? `–${item.feeMax}` : "+"} / {item.feeUnit === "HOUR" ? "hour" : "month"}
                </Text>
              )}
              <View style={styles.tags}>
                {item.subjects.slice(0, 4).map((s) => (
                  <Chip key={s.id} label={s.name} />
                ))}
              </View>
            </Card>
          </Pressable>
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
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { fontSize: 24, fontWeight: "700", color: colors.text },
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
  name: { fontSize: 16, fontWeight: "700", color: colors.text },
  headline: { fontSize: 14, color: colors.text, marginTop: 2 },
  meta: { fontSize: 13, color: colors.muted, marginTop: 4 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: spacing.sm },
});