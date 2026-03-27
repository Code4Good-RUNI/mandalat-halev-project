import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginScreen } from '../screens/LogInScreen';
import { ProfileScreen } from '../screens/PersonalDataScreen';
import { ActivitiesScreen } from '../screens/ActivitiesScreen';
import { FutureActivitiesScreen } from '../screens/FutureActivitiesScreen';
import { PreviousActivitiesScreen } from '../screens/PreviousActivitiesScreen';

// One client for the whole app — required for useQuery / useMutation from hooks.ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
    },
  },
});

function AppContent() {
  /*
    Change the string below to view a specific screen.
    Options: 'login', 'profile', 'activities', 'futureActivities', 'previousActivities'
  */
  const [currentScreen] = useState('previousActivities');

  if (currentScreen === 'profile') return <ProfileScreen />;
  if (currentScreen === 'activities') return <ActivitiesScreen />;
  if (currentScreen === 'futureActivities') return <FutureActivitiesScreen />;
  if (currentScreen === 'previousActivities') return <PreviousActivitiesScreen />;

  return <LoginScreen />;
}

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppContent />
  </QueryClientProvider>
);

export default App;