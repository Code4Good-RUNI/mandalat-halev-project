import React from 'react';
import { View, Text, FlatList, SafeAreaView, TextInput, StyleSheet } from 'react-native';
import { ActivityItem } from '../../components/ActivityItem';

const ACTIVITIES = [
  {
    id: '1',
    title: 'סדנת צילום',
    date: '2025-05-28 10:00',
    duration: '2 שעות',
    location: 'מתחם מנדלת הלב',
    status: 'פתוח להרשמה',
  },
  {
    id: '2',
    title: 'שיעור יוגה',
    date: '2025-05-29 10:00',
    duration: '1.5 שעות',
    location: 'מתחם מנדלת הלב',
    status: 'פתוח להרשמה',
  },
];

export default function ActivitiesScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>פעילויות זמינות בשבילך</Text>
        <TextInput
          placeholder="חיפוש..."
          textAlign="right"
          style={styles.searchInput}
        />
      </View>

      <FlatList
        data={ACTIVITIES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ActivityItem
            title={item.title}
            time={`${item.date} (${item.duration})`}
            location={item.location}
            status={item.status}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { padding: 15 },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'right', marginBottom: 10 },
  searchInput: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 5 },
});
