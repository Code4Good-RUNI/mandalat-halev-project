import React from 'react';
import { View, Text, FlatList, SafeAreaView, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { ActivityItem } from '../../components/ActivityItem';
import { useActiveCampaigns } from '../../api/hooks';
import { temporarySalesforceUserId } from '../login';

export default function ActivitiesScreen() {
  const userId = Number(temporarySalesforceUserId);
  const { data, isPending, isError } = useActiveCampaigns(userId);

  if (isPending) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </SafeAreaView>
    );
  }

  if (isError || (data && data.status !== 200)) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Text style={styles.errorText}>שגיאה בטעינת הפעילויות. נסה שוב מאוחר יותר.</Text>
      </SafeAreaView>
    );
  }

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
        data={data.body}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ActivityItem
            title={item.name}
            time={`${item.startDate} (${item.durationInHours} שעות)`}
            location={`${item.locationAddress}, ${item.locationCity}`}
            status="פתוח להרשמה"
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'red', textAlign: 'center', marginTop: 20 },
});
