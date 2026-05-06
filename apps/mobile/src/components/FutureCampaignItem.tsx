import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { ActivityItem } from './ActivityItem';
import {
  useRegistrationStatus,
  useUnregisterFromCampaign
} from '../api/hooks';
import type { GetFutureCampaignDto, ContactDto } from '@mandalat-halev-project/api-interfaces';

export function FutureCampaignItem({ campaign, contacts, contactsLoading, onShowModal, onPressDetails }: {
  campaign: GetFutureCampaignDto;
  contacts: ContactDto[];
  contactsLoading: boolean;
  onShowModal: (msg: string) => void;
  onPressDetails: () => void;
}) {
  const queryClient = useQueryClient();
  const [isUnregistered, setIsUnregistered] = useState(false);
  const [selectionVisible, setSelectionVisible] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
  } else if (isStatusError || statusData) {
    statusText = 'שגיאה בטעינת הסטטוס';
  } else {
    statusText = 'לא ידוע';
  }

  if (isUnregistered) {
    statusText = 'בוטל';
  }

  // Sends the unregistration request with the given contact IDs.
  const performUnregister = (contactIds: string[]) => {
    unregister(
      { campaignId: campaign.id, contactIds },
      {
        onSuccess: (data) => {
          if (data.status === 200 && data.body?.requestReceivedSuccessfully) {
            setIsUnregistered(true);
            onShowModal('הרישום בוטל בהצלחה!');
            queryClient.invalidateQueries({ queryKey: ['campaigns', 'future'] });
            queryClient.invalidateQueries({ queryKey: ['campaigns', 'active'] });
            queryClient.invalidateQueries({ queryKey: ['campaigns', 'registrationStatus', campaign.id] });
          } else {
            const errorMessage = (data.body as any)?.message || 'משהו השתבש בביטול ההרשמה. אנא נסה שוב.';
            onShowModal(errorMessage);
          }
        },
        onError: () => onShowModal('שגיאת תקשורת או מערכת. אנא בדוק את החיבור ונסה שוב.'),
      }
    );
  };

  // If the user has only one contact (themselves), unregister immediately.
  // If they have multiple contacts, open the selection modal.
  const handleUnregister = () => {
    if (contacts.length <= 1) {
      performUnregister(contacts.map((c) => c.salesforceUserId));
    } else {
      setSelectedIds(contacts.map((c) => c.salesforceUserId));
      setSelectionVisible(true);
    }
  };

  const toggleContact = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const confirmUnregister = () => {
    setSelectionVisible(false);
    performUnregister(selectedIds);
  };

  return (
    <>
      <ActivityItem
        title={campaign.name}
        host={`${campaign.host.firstName} ${campaign.host.lastName}`}
        time={`${campaign.startDate} | ${campaign.durationInHours} שעות`}
        location={`${campaign.locationAddress}, ${campaign.locationCity}`}
        status={statusText}
        onPressDetails={onPressDetails}
      >
        <View style={styles.actionContainer}>
          {!isUnregistered && (
            <TouchableOpacity
              style={[styles.unregisterButton, (isUnregistering || contactsLoading) && styles.disabledButton]}
              onPress={handleUnregister}
              disabled={isUnregistering || contactsLoading}
            >
              <Text style={styles.unregisterButtonText}>
                {isUnregistering ? 'מבטל...' : 'ביטול רישום'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ActivityItem>

      {/* Contact selection bottom sheet — only shown when the user has multiple contacts. */}
      <Modal visible={selectionVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.selectionModal}>
            <Text style={styles.selectionTitle}>בחר משתתפים לביטול</Text>

            {contacts.map((contact) => {
              const selected = selectedIds.includes(contact.salesforceUserId);
              return (
                <TouchableOpacity
                  key={contact.salesforceUserId}
                  style={styles.contactRow}
                  onPress={() => toggleContact(contact.salesforceUserId)}
                >
                  <View style={[styles.checkbox, selected && styles.checkboxSelected]} />
                  <Text style={styles.contactName}>
                    {contact.firstName} {contact.lastName}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <View style={styles.selectionButtons}>
              <TouchableOpacity
                onPress={() => setSelectionVisible(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>ביטול</Text>
              </TouchableOpacity>
              {/* Confirm is disabled when no contacts are selected. */}
              <TouchableOpacity
                onPress={confirmUnregister}
                disabled={selectedIds.length === 0}
                style={[styles.confirmButton, selectedIds.length === 0 && styles.disabledButton]}
              >
                <Text style={styles.confirmButtonText}>אישור</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  // Contact selection bottom sheet
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  selectionModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    width: '100%',
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
    color: '#ff4444',
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ccc',
  },
  checkboxSelected: {
    backgroundColor: '#ff4444',
    borderColor: '#ff4444',
  },
  contactName: { fontSize: 16, textAlign: 'right', flex: 1, paddingRight: 12 },
  selectionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  cancelButtonText: { color: '#666', fontWeight: 'bold' },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#ff4444',
    alignItems: 'center',
  },
  confirmButtonText: { color: '#fff', fontWeight: 'bold' },
});
