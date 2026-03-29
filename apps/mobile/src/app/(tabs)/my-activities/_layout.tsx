import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import FutureScreen from './future';
import PastScreen from './past';

const TopTabs = createMaterialTopTabNavigator();

export default function MyActivitiesLayout() {
  return (
    <TopTabs.Navigator>
      <TopTabs.Screen
        name="future"
        component={FutureScreen}
        options={{ title: 'פעילויות עתידיות' }}
      />
      <TopTabs.Screen
        name="past"
        component={PastScreen}
        options={{ title: 'פעילויות קודמות' }}
      />
    </TopTabs.Navigator>
  );
}
