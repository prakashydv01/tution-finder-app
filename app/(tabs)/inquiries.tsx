import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { usePaginatedList } from "@/lib/use-paginated-list";
import { colors, spacing } from "@/lib/theme";
import type { Inquiry, InquiryStatus, Paginated } from "@/lib/types";

const STATUS_COLOR: Record<InquiryStatus, string> = {
  NEW: colors.accent,
  CONTACTED: colors.ok,
  CLOSED: colors.muted,
};

export default function InquiriesScreen() {
  const { user } = useAuth();
  const isTutor = user?.role === "TUTOR";
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchPage = useCallback(
    (page: number, limit: number) => {
      const path = isTutor ? "/api/inquiries/received" : "/api/inquiries/sent";
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      return api.get<Paginated<Inquiry>>(`${path}?${params.toString()}`);
    },
    [isTutor],
  );

  const { items: inquiries, loading, loadingMore, refreshing, refresh, loadMore } = usePaginatedList(fetchPage);

  async function setStatus(id: string, status: InquiryStatus) {
    setUpdating(id);
    try {
      await api.patch(`/api/inquiries/${id}/status`, { status });
      refresh();
    } catch {
      // ignore; the list will just stay as-is
    } finally {
      setUpdating(null);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{isTutor ? "Inquiries received" : "My inquiries"}</Text>
      </View>

      <FlatList
        data={inquiries}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={refresh}
        onEndReachedThreshold={0.4}
        onEndReached={loadMore}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              message={isTutor ? "No one has reached out yet." : "You haven't contacted any tutors yet."}
            />
          ) : null
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footerLoader} color={colors.accent} /> : null}
        renderItem={({ item }) => (
          <Card>
            {isTutor ? (
              <>
                <Text style={styles.name}>{item.fromUser?.name}</Text>
                <Text style={styles.meta}>{item.fromUser?.email}{item.fromUser?.phone ? ` · ${item.fromUser.phone}` : ""}</Text>
              </>
            ) : (
              <>
                <Text style={styles.name}>{item.tutorProfile?.user.name}</Text>
                <Text style={styles.meta}>{item.tutorProfile?.headline}</Text>
              </>
            )}
            <Text style={styles.message}>{item.message}</Text>
            <View style={styles.footer}>
              <Text style={[styles.status, { color: STATUS_COLOR[item.status] }]}>{item.status}</Text>
              {isTutor && item.status !== "CLOSED" && (
                <View style={styles.actions}>
                  {item.status === "NEW" && (
                    <Button
                      title="Mark contacted"
                      variant="secondary"
                      loading={updating === item.id}
                      onPress={() => setStatus(item.id, "CONTACTED")}
                    />
                  )}
                  <Button
                    title="Close"
                    variant="link"
                    loading={updating === item.id}
                    onPress={() => setStatus(item.id, "CLOSED")}
                  />
                </View>
              )}
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { fontSize: 22, fontWeight: "700", color: colors.text },
  listContent: { padding: spacing.lg, paddingTop: spacing.sm },
  footerLoader: { marginVertical: spacing.lg },
  name: { fontSize: 15, fontWeight: "700", color: colors.text },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  message: { fontSize: 14, color: colors.text, marginTop: spacing.sm },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.md },
  status: { fontSize: 12, fontWeight: "700" },
  actions: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
});