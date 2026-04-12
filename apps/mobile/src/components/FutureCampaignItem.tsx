import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { ActivityItem } from './ActivityItem';
import { 
  useRegistrationStatus, 
  useUnregisterFromCampaign 
} from '../api/hooks';

export function FutureCampaignItem({ campaign, userId }: { campaign: any, userId: number }) {
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Ensure campaign.id is a number so TanStack Query keys match strictly
  const campaignId = Number(campaign.id);

  // Extract isFetching to show a loading state during background refetches
  const { data: statusData, isPending: statusPending, isFetching } = useRegistrationStatus(campaignId, userId);
  const { mutate: unregister, isPending: isUnregistering } = useUnregisterFromCampaign();

  let statusText = (statusPending || isFetching) ? 'טוען...' : 'לא ידוע';
  if (!statusPending && !isFetching && statusData?.status === 200) {
    if (statusData.body.registrationStatus === 'approved') statusText = 'רשום';
    else statusText = 'מחכה לאישור';
  }

  // Override the status immediately after a successful cancellation
  if (successMsg !== '') {
    statusText = 'בוטל';
  }

  const handleUnregister = () => {
    setErrorMsg('');
    setSuccessMsg('');
    unregister(
      { campaignId, salesforceUserId: userId, numOfParticipantsToUnregister: 1 },
      {
        onSuccess: (data) => {
          if (data.status === 200) {
            setSuccessMsg('הרישום בוטל בהצלחה!');
            // refresh campaigns list
            queryClient.invalidateQueries({ queryKey: ['campaigns', 'future', userId] });
            // refresh status
            queryClient.invalidateQueries({ queryKey: ['campaigns', 'registrationStatus', campaignId, userId] });
          } else {
            setErrorMsg('משהו השתבש בביטול ההרשמה.');
          }
        },
        onError: () => setErrorMsg('שגיאת תקשורת. אנא נסה שוב.'),
      }
    );
  };

  return (
    <ActivityItem
      title={campaign.name}
      time={`${campaign.startDate} | ${campaign.durationInHours} שעות`}
      location={`${campaign.locationAddress}, ${campaign.locationCity}`}
      status={statusText}
    >
      <View style={styles.actionContainer}>
        {errorMsg !== '' && <Text style={styles.errorText}>{errorMsg}</Text>}
        {successMsg !== '' && <Text style={styles.successText}>{successMsg}</Text>}
        
        {successMsg === '' && (
          <TouchableOpacity 
            style={[styles.unregisterButton, isUnregistering && { opacity: 0.6 }]}
            onPress={handleUnregister}
            disabled={isUnregistering}
          >
            <Text style={styles.unregisterButtonText}>
              {isUnregistering ? 'מבטל רישום...' : 'ביטול רישום'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ActivityItem>
  );
}

const styles = StyleSheet.create({
  actionContainer: { alignItems: 'center' },
  unregisterButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  unregisterButtonText: { color: '#fff', fontWeight: 'bold' },
  errorText: { color: 'red', textAlign: 'center', marginBottom: 5, fontSize: 12 },
  successText: { color: 'green', textAlign: 'center', marginBottom: 5, fontSize: 14, fontWeight: 'bold' },
});
