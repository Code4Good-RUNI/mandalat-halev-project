import React, { useState } from 'react';
import { LoginScreen } from '../screens/LogInScreen'; 
import { ProfileScreen } from '../screens/PersonalDataScreen';
import { ActivitiesScreen } from '../screens/ActivitiesScreen';
import { FutureActivitiesScreen } from '../screens/FutureActivitiesScreen';
import { PreviousActivitiesScreen } from '../screens/PreviousActivitiesScreen';

export const App = () => {
  /* 
    Change the string below to view a specific screen.
    Options: 'login', 'profile', 'activities', 'futureActivities', 'previousActivities'
  */
  const [currentScreen] = useState('previousActivities');

  if (currentScreen === 'profile') return <ProfileScreen />;
  if (currentScreen === 'activities') return <ActivitiesScreen />;
  if (currentScreen === 'futureActivities') return <FutureActivitiesScreen />;
  if (currentScreen === 'previousActivities') return <PreviousActivitiesScreen />;

  // Default fallback
  return <LoginScreen />;
};

export default App;