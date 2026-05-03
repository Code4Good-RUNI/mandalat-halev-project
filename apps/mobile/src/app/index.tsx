import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { getAccessToken, hydrateSession } from '../api/session';

export default function Index() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    hydrateSession().finally(() => setHydrated(true));
  }, []);

  if (!hydrated) return null;

  return (
    <Redirect href={getAccessToken() ? '/(tabs)/activities' : '/login'} />
  );
}
