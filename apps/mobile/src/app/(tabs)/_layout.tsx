import React from 'react';
import { Tabs } from 'expo-router';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
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
        name="my-activities"
        options={{ title: 'הפעילויות שלי', headerShown: false }}
      />
      <Tabs.Screen name="personal-data" options={{ title: 'נתונים אישיים' }} />
      <Tabs.Screen name="activities" options={{ title: 'פעילויות' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  logout: { marginHorizontal: 16 },
  logoutText: { color: '#FF8C00', fontWeight: 'bold', fontSize: 16 },
});
