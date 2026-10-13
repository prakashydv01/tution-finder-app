import { useCallback, useEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, apiErrorMessage } from "@/lib/api";
import { colors, spacing } from "@/lib/theme";
import type { Paginated, Review, TutorDetail } from "@/lib/types";

export default function TutorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [tutor, setTutor] = useState<TutorDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(1);
  const [loadingMoreReviews, setLoadingMoreReviews] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showInquiry, setShowInquiry] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const load = useCallback(async () => {
    const [t, r] = await Promise.all([
      api.get<{ data: TutorDetail }>(`/api/tutors/${id}`),
      api.get<Paginated<Review>>(`/api/tutors/${id}/reviews`),
    ]);
    setTutor(t.data);
    setReviews(r.data);
    setReviewsPage(1);
    setReviewsTotalPages(r.totalPages ?? 1);
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  async function loadMoreReviews() {
    if (loadingMoreReviews || reviewsPage >= reviewsTotalPages) return;
    setLoadingMoreReviews(true);
    try {
      const nextPage = reviewsPage + 1;
      const r = await api.get<Paginated<Review>>(`/api/tutors/${id}/reviews?page=${nextPage}`);
      setReviews((prev) => [...prev, ...r.data]);
      setReviewsPage(nextPage);
    } catch {
      // ignore; the button simply stays available to retry
    } finally {
      setLoadingMoreReviews(false);
    }
  }

  async function sendInquiry() {
    setSendError(null);
    setSending(true);
    try {
      await api.post("/api/inquiries", { tutorProfileId: id, message: message.trim() });
      setSent(true);
    } catch (e) {
      if (e instanceof ApiError && e.code === "UNAUTHORIZED") {
        setSendError("Please sign in to contact a tutor.");
      } else {
        setSendError(apiErrorMessage(e));
      }
    } finally {
      setSending(false);
    }
  }

  if (loading || !tutor) {
    return (
      <Screen>
        <View style={styles.loading} />
      </Screen>
    );
  }

  const isOwnProfile = user?.role === "TUTOR" && tutor.user.name === user.name;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.name}>{tutor.user.name}</Text>
        <Text style={styles.headline}>{tutor.headline}</Text>

        <View style={styles.row}>
          <Text style={styles.meta}>
            {tutor.city.name}, {tutor.locality.name}
          </Text>
          {tutor.averageRating != null && (
            <Text style={styles.rating}>★ {tutor.averageRating} ({tutor.reviewCount})</Text>
          )}
        </View>

        <Text style={styles.meta}>{tutor.experienceYears} years of experience</Text>
        {tutor.feeMin != null && (
          <Text style={styles.meta}>
            Rs. {tutor.feeMin}
            {tutor.feeMax ? `–${tutor.feeMax}` : "+"} / {tutor.feeUnit === "HOUR" ? "hour" : "month"}
          </Text>
        )}

        <View style={styles.tags}>
          {tutor.subjects.map((s) => (
            <Chip key={s.id} label={s.name} />
          ))}
          {tutor.levels.map((l) => (
            <Chip key={l.id} label={l.name} />
          ))}
        </View>

        <Card style={styles.bioCard}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>{tutor.bio}</Text>
        </Card>

        {tutor.contactVisible && tutor.contactPhone ? (
          <Text style={styles.phone}>Phone: {tutor.contactPhone}</Text>
        ) : (
          <Text style={styles.meta}>Sign in with a verified email to see the phone number.</Text>
        )}

        {!isOwnProfile && (
          <Button title="Contact this tutor" onPress={() => setShowInquiry(true)} style={styles.contactButton} />
        )}

        <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
        {reviews.length === 0 ? (
          <EmptyState message="No reviews yet." />
        ) : (
          reviews.map((r) => (
            <Card key={r.id}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewAuthor}>{r.author.name}</Text>
                <Text style={styles.reviewRating}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</Text>
              </View>
              {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
            </Card>
          ))
        )}
        {reviewsPage < reviewsTotalPages && (
          <Button
            title="Load more reviews"
            variant="secondary"
            loading={loadingMoreReviews}
            onPress={loadMoreReviews}
            style={styles.loadMoreReviews}
          />
        )}
      </ScrollView>

      <Modal visible={showInquiry} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {sent ? (
              <>
                <Text style={styles.sectionTitle}>Message sent</Text>
                <Text style={styles.meta}>The tutor can now see your message and contact details.</Text>
                <Button
                  title="Done"
                  onPress={() => {
                    setShowInquiry(false);
                    setSent(false);
                    setMessage("");
                  }}
                  style={styles.modalButton}
                />
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Message {tutor.user.name}</Text>
                <TextField
                  label="Your message"
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Tell them what you need help with..."
                  multiline
                />
                {sendError ? <Text style={styles.error}>{sendError}</Text> : null}
                <Button
                  title="Send"
                  onPress={sendInquiry}
                  loading={sending}
                  disabled={message.trim().length < 10}
                  style={styles.modalButton}
                />
                <Button title="Cancel" variant="link" onPress={() => setShowInquiry(false)} />
              </>
            )}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  name: { fontSize: 22, fontWeight: "700", color: colors.text },
  headline: { fontSize: 15, color: colors.text, marginTop: 2 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.sm },
  meta: { fontSize: 13, color: colors.muted, marginTop: 4 },
  rating: { fontSize: 13, color: colors.text, fontWeight: "600" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: spacing.sm },
  bioCard: { marginTop: spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  bio: { fontSize: 14, color: colors.text, lineHeight: 20 },
  phone: { fontSize: 14, color: colors.text, fontWeight: "600", marginTop: spacing.md },
  contactButton: { marginTop: spacing.lg },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between" },
  reviewAuthor: { fontSize: 14, fontWeight: "700", color: colors.text },
  reviewRating: { fontSize: 13, color: "#f59e0b" },
  reviewComment: { fontSize: 14, color: colors.text, marginTop: spacing.xs },
  loadMoreReviews: { marginTop: spacing.sm },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.xl },
  modalButton: { marginTop: spacing.sm },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing.sm },
});