import React from 'react';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs initialRouteName="activities">
      <Tabs.Screen
        name="my-activities"
        options={{ title: 'הפעילויות שלי', headerShown: false }}
      />
      <Tabs.Screen
        name="personal-data"
        options={{ title: 'נתונים אישיים' }}
      />
      <Tabs.Screen
        name="activities"
        options={{ title: 'פעילויות' }}
      />
    </Tabs>
  );
}
