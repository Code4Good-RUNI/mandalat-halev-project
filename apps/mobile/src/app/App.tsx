import React, { useState } from 'react';
import { LoginScreen } from '../screens/LogInScreen'; 
import { ProfileScreen } from '../screens/PersonalDataScreen';
import { ActivitiesScreen } from '../screens/ActivitiesScreen';
import { FutureActivitiesScreen } from '../screens/FutureActivitiesScreen';
import { PreviousActivitiesScreen } from '../screens/PreviousActivitiesScreen';

export const App = () => {
  /* MANUAL NAVIGATION SWITCH
    Change the string below to view different screens:
    'login' | 'profile' | 'activities' | 'futureActivities' | 'previousActivities'
  */
  const [currentScreen, setCurrentScreen] = useState('login');
  
  if (currentScreen === 'previousActivities') {
    return <PreviousActivitiesScreen onTempPress={() => setCurrentScreen('login')} />;
  }

  if (currentScreen === 'futureActivities') {
    return <FutureActivitiesScreen onTempPress={() => setCurrentScreen('previousActivities')} />;
  }

  if (currentScreen === 'activities') {
    return <ActivitiesScreen onTempPress={() => setCurrentScreen('futureActivities')} />;
  }

  if (currentScreen === 'profile') {
    return <ProfileScreen onTempPress={() => setCurrentScreen('activities')} />;
  }

  return <LoginScreen onTempPress={() => setCurrentScreen('profile')} />;
};

export default App;