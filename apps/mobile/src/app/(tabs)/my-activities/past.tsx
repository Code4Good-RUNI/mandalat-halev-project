import React, { useState } from 'react';
import { View, Text, FlatList, SafeAreaView, StyleSheet, ActivityIndicator } from 'react-native';
import { ActivityItem } from '../../../components/ActivityItem';
import { temporarySalesforceUserId } from '../../login';
import { usePastCampaigns } from '../../../api/hooks';
import { CampaignDetailsModal } from '../../../components/CampaignDetailsModal';
import type { GetPastCampaignDto } from '@mandalat-halev-project/api-interfaces';

export default function PreviousActivitiesScreen() {
  const userId = Number(temporarySalesforceUserId);
  const { data, isPending, isError } = usePastCampaigns(userId);
  const [selectedCampaign, setSelectedCampaign] = useState<GetPastCampaignDto | null>(null);

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
      <View style={styles.header}>
        <Text style={styles.title}>פעילויות קודמות</Text>
      </View>

      <FlatList
        data={data.body}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ActivityItem
            title={item.name}
            time={`${item.startDate} | ${item.durationInHours} שעות`}
            location={`${item.locationAddress}, ${item.locationCity}`}
            status={item.hasUserParticipated ? 'נוכח' : 'לא נוכח'}
            onPressDetails={() => setSelectedCampaign(item)}
          />
        )}
        contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 15 }}
      />

      <CampaignDetailsModal 
        visible={!!selectedCampaign} 
        campaign={selectedCampaign} 
        onClose={() => setSelectedCampaign(null)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { padding: 15 },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'right' },
  errorText: { color: 'red', textAlign: 'center', marginBottom: 5, fontSize: 12 },
});
