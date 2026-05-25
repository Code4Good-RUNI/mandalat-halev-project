import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { getStoredToken, hydrateSession } from '../api/session';

export default function Index() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    hydrateSession().finally(() => setHydrated(true));
  }, []);

  if (!hydrated) return null;

  return (
    <Redirect href={getStoredToken() ? '/(tabs)/activities' : '/login'} />
  );
}
