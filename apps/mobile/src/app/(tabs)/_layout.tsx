import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { syncAndroidPushNotifications } from '../../notifications/notification.service';

export default function TabsLayout() {
  useEffect(() => {
    // Fire-and-forget: the Android-only guard lives in the service; never block
    // render, never crash on failure.
    const sync = () => {
      syncAndroidPushNotifications().catch((err) => {
        console.warn('Push notification sync failed', err);
      });
    };

    // Initial sync on mount (after fresh login or cold-start redirect), so the
    // api client has a bearer token.
    sync();

    // Re-sync on return to foreground so a permission change made in Android
    // settings while backgrounded is picked up (the service unregisters the
    // stored token when permission is now denied). AppState's 'change' event
    // fires only on actual transitions, so this never double-fires the mount sync.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        sync();
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <Tabs initialRouteName="activities">
      <Tabs.Screen
        name="personal-data"
        options={{
          title: 'איזור אישי',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: 'פעילויות',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pulse-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-activities"
        options={{
          title: 'הפעילויות שלי',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkmark-done-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
