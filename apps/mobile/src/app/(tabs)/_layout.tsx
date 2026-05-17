import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const headerOptions = {
  headerTitleAlign: 'center' as const,
  headerTitleStyle: { fontWeight: 'bold' as const },
};

export default function TabsLayout() {
  return (
    <Tabs initialRouteName="activities">
      <Tabs.Screen
        name="personal-data"
        options={{
          title: 'איזור אישי',
          ...headerOptions,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: 'פעילויות',
          ...headerOptions,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pulse-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-activities"
        options={{
          title: 'הפעילויות שלי',
          headerShown: true,
          ...headerOptions,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkmark-done-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
