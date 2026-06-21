import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { syncAndroidPushNotifications } from '../../notifications/notification.service';

export default function TabsLayout() {
  useEffect(() => {
    // Runs once when the authenticated area mounts (after fresh login or
    // cold-start redirect), so the api client has a bearer token. The
    // Android-only guard lives in the service. Fire-and-forget: never block
    // render, never crash on failure.
    syncAndroidPushNotifications().catch((err) => {
      console.warn('Push notification sync failed', err);
    });
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
