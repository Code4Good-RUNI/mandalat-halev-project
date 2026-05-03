import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { ActivityItem } from './ActivityItem';
import {
  useRegistrationStatus,
  useUnregisterFromCampaign
} from '../api/hooks';
import type { GetFutureCampaignDto } from '@mandalat-halev-project/api-interfaces';

export function FutureCampaignItem({ campaign, onShowModal, onPressDetails }: { campaign: GetFutureCampaignDto; onShowModal: (msg: string) => void; onPressDetails: () => void }) {
  const queryClient = useQueryClient();
  const [isUnregistered, setIsUnregistered] = useState(false);

  // Extract isFetching to show a loading state during background refetches
  const {
    data: statusData,
    isPending: statusPending,
    isFetching,
    isError: isStatusError,
  } = useRegistrationStatus(campaign.id);
  const { mutate: unregister, isPending: isUnregistering } = useUnregisterFromCampaign();

  let statusText: string;
  if (statusPending || isFetching) {
    statusText = 'טוען...';
  } else if (statusData?.status === 200) {
    statusText = statusData.body.registrationStatus === 'approved' ? 'רשום' : 'מחכה לאישור';
  } else if (isStatusError || (statusData && statusData.status !== 200)) {
    statusText = 'שגיאה בטעינת הסטטוס';
  } else {
    statusText = 'לא ידוע';
  }

  // Override the status immediately after a successful cancellation
  if (isUnregistered) {
    statusText = 'בוטל';
  }

  const handleUnregister = () => {
    unregister(
      { campaignId: campaign.id, numOfParticipantsToUnregister: 1 },
      {
        onSuccess: (data) => {
          if (data.status === 200 && data.body?.requestReceivedSuccessfully) {
            setIsUnregistered(true);
            onShowModal('הרישום בוטל בהצלחה!');
            // Invalidate queries to sync the 'Activities' and 'My Activities' lists
            queryClient.invalidateQueries({ queryKey: ['campaigns', 'future'] });
            queryClient.invalidateQueries({ queryKey: ['campaigns', 'active'] });
          } else {
            // Handle API errors and extract backend message if available
            const errorMessage = (data.body as any)?.message || 'משהו השתבש בביטול ההרשמה. אנא נסה שוב.';
            onShowModal(errorMessage);
          }
        },
        onError: (error) => onShowModal('שגיאת תקשורת או מערכת. אנא בדוק את החיבור ונסה שוב.'),
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
