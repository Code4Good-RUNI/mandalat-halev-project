import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { ActivityItem } from './ActivityItem';
import { 
  useRegistrationStatus, 
  useUnregisterFromCampaign 
} from '../api/hooks';

export function FutureCampaignItem({ campaign, userId, onShowModal, onPressDetails }: { campaign: any; userId: number; onShowModal: (msg: string) => void; onPressDetails: () => void }) {
  const queryClient = useQueryClient();
  const [isUnregistered, setIsUnregistered] = useState(false);
  
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
  if (isUnregistered) {
    statusText = 'בוטל';
  }

  const handleUnregister = () => {
    unregister(
      { campaignId, salesforceUserId: userId, numOfParticipantsToUnregister: 1 },
      {
        onSuccess: (data) => {
          if (data.status === 200) {
            setIsUnregistered(true);
            onShowModal('הרישום בוטל בהצלחה!');
            // refresh campaigns list
            queryClient.invalidateQueries({ queryKey: ['campaigns', 'future', userId] });
            // refresh status
            queryClient.invalidateQueries({ queryKey: ['campaigns', 'registrationStatus', campaignId, userId] });
          } else {
            onShowModal('משהו השתבש בביטול ההרשמה.');
          }
        },
        onError: () => onShowModal('שגיאת תקשורת. אנא נסה שוב.'),
      }
    );
  };

  return (
    <ActivityItem
      title={campaign.name}
      time={`${campaign.startDate} | ${campaign.durationInHours} שעות`}
      location={`${campaign.locationAddress}, ${campaign.locationCity}`}
      status={statusText}
      onPressDetails={onPressDetails}
    >
      <View style={styles.actionContainer}>
        {!isUnregistered && (
          <TouchableOpacity 
            style={[styles.unregisterButton, isUnregistering && styles.disabledButton]}
            onPress={handleUnregister}
            disabled={isUnregistering}
          >
            <Text style={styles.unregisterButtonText}>
              {isUnregistering ? 'מבטל...' : 'ביטול רישום'}
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
  disabledButton: { opacity: 0.6 },
  unregisterButtonText: { color: '#fff', fontWeight: 'bold' },
});
