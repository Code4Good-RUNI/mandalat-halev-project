import React from 'react';
import { FlatList, SafeAreaView, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { temporarySalesforceUserId } from '../../login';
import { useFutureCampaigns } from '../../../api/hooks';
import { FutureCampaignItem } from '../../../components/FutureCampaignItem';

export default function FutureActivitiesScreen() {
  const userId = Number(temporarySalesforceUserId);
  const { data, isPending, isError } = useFutureCampaigns(userId);

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
        <Text style={styles.errorText}>משהו השתבש בטעינת הפעילויות. אנא נסה שוב.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>פעילויות עתידיות</Text>

      <FlatList
        data={data.body}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <FutureCampaignItem campaign={item} userId={userId} />}
        contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 15 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'right', padding: 15 },
  errorText: { color: 'red', textAlign: 'center', marginBottom: 5, fontSize: 12 },
});
