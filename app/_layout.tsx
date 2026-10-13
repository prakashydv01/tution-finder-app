import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import type { PushData } from "@/lib/push-notifications";
import { colors } from "@/lib/theme";

// Same reasoning as lib/push-notifications.ts: expo-notifications must never be
// imported at the top level, because doing so throws inside Expo Go on Android
// (SDK 53+). It's only loaded dynamically below, and only outside Expo Go.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

function RootNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!user && !inAuthGroup) {
      router.replace("/login");
    } else if (user && inAuthGroup) {
      router.replace("/");
    }
  }, [user, loading, segments]);

  // Tapping a notification navigates to the tab it's about, instead of just opening the app.
  // No-op in Expo Go, where this feature isn't available anyway.
  useEffect(() => {
    if (isExpoGo) return;

    let subscription: { remove: () => void } | undefined;
    import("expo-notifications").then((Notifications) => {
      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as PushData;
        if (data.type === "inquiry_received" || data.type === "inquiry_contacted") {
          router.push("/(tabs)/inquiries");
        } else if (data.type === "new_review" || data.type === "tutor_verified") {
          router.push("/(tabs)/profile");
        }
      });
    });
    return () => subscription?.remove();
  }, [router]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerTintColor: colors.accent }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="tutor/[id]" options={{ title: "Tutor" }} />
      <Stack.Screen name="tutor-profile/edit" options={{ title: "My Tutor Profile" }} />
      <Stack.Screen name="requirement/new" options={{ title: "Post a Request" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <RootNav />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
});