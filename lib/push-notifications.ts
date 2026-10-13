import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { api, apiErrorMessage } from "./api";

// Remote push notifications were removed from Expo Go on Android as of SDK 53 —
// merely importing expo-notifications there throws immediately. So this module
// never imports it statically; it's only loaded dynamically, and only when we're
// NOT running inside Expo Go, so the throwing code is never evaluated there.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export type PushData = {
  type?: "inquiry_received" | "inquiry_contacted" | "new_review" | "tutor_verified";
};

/**
 * Requests permission, gets this device's Expo push token, and registers it with
 * the backend. Call this once the user is signed in. Safe to call repeatedly, and
 * a no-op in Expo Go, on simulators/emulators, if permission is denied, or if the
 * project has no EAS project ID yet (see README) — it never throws.
 */
export async function registerForPushNotifications(): Promise<void> {
  if (isExpoGo) {
    console.warn(
      "Push notifications are unavailable in Expo Go (removed on Android since SDK 53). " +
        "Use a development build to test them — see the README.",
    );
    return;
  }

  const [Device, Notifications] = await Promise.all([import("expo-device"), import("expo-notifications")]);

  if (!Device.isDevice) {
    // Push tokens don't work on simulators/emulators.
    return;
  }

  // Foreground behavior: show the notification even while the app is open.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== "granted") return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    console.warn("No EAS projectId found — run `eas init` to enable push notifications.");
    return;
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await api.post("/api/auth/push-token", { token });
  } catch (e) {
    console.warn("Failed to register push token:", apiErrorMessage(e));
  }
}