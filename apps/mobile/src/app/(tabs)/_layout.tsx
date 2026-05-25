import React from 'react';
import { Tabs } from 'expo-router';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { clearSession } from '../../api/session';

function LogoutButton() {
  return (
    <TouchableOpacity
      onPress={() => {
        void clearSession();
      }}
      style={styles.logout}
    >
      <Text style={styles.logoutText}>התנתק</Text>
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="activities"
      screenOptions={{ headerRight: () => <LogoutButton /> }}
    >
      <Tabs.Screen
        name="personal-data"
        options={{
          title: 'איזור אישי',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: 'פעילויות',
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

const styles = StyleSheet.create({
  logout: { marginHorizontal: 16 },
  logoutText: { color: '#FF8C00', fontWeight: 'bold', fontSize: 16 },
});
