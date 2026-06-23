import { useEffect } from 'react';
import { I18nManager, View, Text, TouchableOpacity, StyleSheet, AppState } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { registerQueryClient } from '../api/session';

// The app is Hebrew-only, so force RTL layout regardless of the device's
// system locale (some users keep their OS in English but use Hebrew apps).
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

// Display incoming notifications visibly (banner + list + sound) instead of
// only updating the badge. Set once at app startup, before any notification
// can be delivered.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Hand the QueryClient to the session module so clearSession() (triggered on
// 401) can wipe cached responses for the previous user before navigating to
// /login.
registerQueryClient(queryClient);

export default function RootLayout() {
  // Reset the local app badge to 0 whenever the app opens or returns to the
  // foreground, so the counter doesn't accumulate. This is a device-local
  // action only — there is no backend "mark as read".
  useEffect(() => {
    const clearBadge = () => {
      Notifications.setBadgeCountAsync(0).catch(() => {
        // Best-effort: badge APIs are unavailable on web and may no-op.
      });
    };

    clearBadge(); // initial startup

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') clearBadge();
    });

    return () => subscription.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="verify-sms" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      {__DEV__ && (
        <View style={styles.devButton}>
          <TouchableOpacity onPress={() => router.replace('/')}>
            <Text style={styles.devButtonText}>DEV</Text>
          </TouchableOpacity>
        </View>
      )}
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  devButton: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    backgroundColor: '#333',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    opacity: 0.75,
  },
  devButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});
