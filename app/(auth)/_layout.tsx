import { Stack } from "expo-router";
import { colors } from "@/lib/theme";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerTintColor: colors.accent, headerTitleStyle: { color: colors.text } }}>
      <Stack.Screen name="login" options={{ title: "Sign in" }} />
      <Stack.Screen name="register" options={{ title: "Create account" }} />
      <Stack.Screen name="verify" options={{ title: "Verify email" }} />
      <Stack.Screen name="forgot-password" options={{ title: "Forgot password" }} />
      <Stack.Screen name="reset-password" options={{ title: "Reset password" }} />
    </Stack>
  );
}