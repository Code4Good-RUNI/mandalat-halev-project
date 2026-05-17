import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Redirect, router } from 'expo-router';
import { getAccessToken, hydrateSession } from '../api/session';

export default function Index() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    hydrateSession().finally(() => setHydrated(true));
  }, []);

  if (!hydrated) return null;

  if (__DEV__) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Dev Navigator</Text>
        {[
          { label: 'Login', href: '/login' },
          { label: 'Activities', href: '/(tabs)/activities' },
          { label: 'My Activities', href: '/(tabs)/my-activities' },
          { label: 'Personal Data', href: '/(tabs)/personal-data' },
        ].map(({ label, href }) => (
          <TouchableOpacity
            key={href}
            style={styles.button}
            onPress={() => router.push(href as any)}
          >
            <Text style={styles.buttonText}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <Redirect href={getAccessToken() ? '/(tabs)/activities' : '/login'} />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  button: { backgroundColor: '#FF8C00', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8, width: 220, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
