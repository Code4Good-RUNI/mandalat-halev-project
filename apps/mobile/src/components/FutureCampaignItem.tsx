import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { MyActivityItem } from './MyActivityItem';
import { useRegistrationStatus, useUnregisteredContacts, useUnregisterFromCampaign, useRegisterForCampaign } from '../api/hooks';
import { Status } from './Status';
import type { GetFutureCampaignDto, ApprovalStatus } from '@mandalat-halev-project/api-interfaces';

const approvalStatusLabel = (status: ApprovalStatus): string => {
  if (status === 'approved') return 'אושר';
  if (status === 'rejected') return 'נדחה';
  return 'מחכה לאישור';
};

export function FutureCampaignItem({ campaign, onShowModal, onPressDetails }: {
  campaign: GetFutureCampaignDto;
  onShowModal: (msg: string) => void;
  onPressDetails: () => void;
}) {
  const queryClient = useQueryClient();
  const [selectionVisible, setSelectionVisible] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [registerSelectedIds, setRegisterSelectedIds] = useState<string[]>([]);

  const {
    data: membersData,
    isPending: membersLoading,
    isError: isMembersError,
    refetch: refetchMembers,
  } = useRegistrationStatus(campaign.id);

  const { mutate: unregister, isPending: isUnregistering } = useUnregisterFromCampaign();
  const { mutate: register, isPending: isRegistering } = useRegisterForCampaign();

  const {
    data: unregisteredData,
    isPending: unregisteredLoading,
    isError: isUnregisteredError,
    refetch: refetchUnregistered,
  } = useUnregisteredContacts(campaign.id);

  const unregisteredContacts = (unregisteredData?.status === 200 ? unregisteredData.body : undefined)?.contacts ?? [];
  const members = (membersData?.status === 200 ? membersData.body : undefined)?.registeredMembers ?? [];

  let statusText: string;
  if (membersLoading) {
    statusText = 'טוען...';
  } else if (isMembersError || membersData?.status !== 200) {
    statusText = 'שגיאה בטעינת הסטטוס';
  } else if (members.length > 0) {
    statusText = members.every((m) => m.registrationStatus === 'approved') ? 'רשום' : 'מחכה לאישור';
  } else {
    statusText = 'לא ידוע';
  }

  const performUnregister = (contactIds: string[]) => {
    unregister(
      { campaignId: campaign.id, contactIds },
      {
        onSuccess: (data) => {
          if (data.status === 200 && data.body?.requestReceivedSuccessfully) {
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

  const handleUnregister = () => {
    if (members.length <= 1) {
      performUnregister(members.map((m) => m.salesforceUserId));
    } else {
      setSelectedIds([]);
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

  const performRegister = (contactIds: string[]) => {
    register(
      { campaignId: campaign.id, contactIds },
      {
        onSuccess: (data) => {
          if (data.status === 200 && data.body?.requestReceivedSuccessfully) {
            onShowModal('בקשת ההרשמה נשלחה בהצלחה!');
            queryClient.invalidateQueries({ queryKey: ['campaigns', 'future'] });
            queryClient.invalidateQueries({ queryKey: ['campaigns', 'active'] });
            queryClient.invalidateQueries({ queryKey: ['campaigns', 'registrationStatus', campaign.id] });
            queryClient.invalidateQueries({ queryKey: ['campaigns', 'unregisteredContacts', campaign.id] });
          } else {
            const errorMessage = (data.body as any)?.message || 'אירעה שגיאה בהרשמה. אנא נסה שוב.';
            onShowModal(errorMessage);
          }
        },
        onError: () => onShowModal('שגיאת תקשורת או מערכת. אנא בדוק את החיבור ונסה שוב.'),
      }
    );
  };

  const handleRegisterMore = () => {
    setRegisterSelectedIds([]);
    setRegisterModalVisible(true);
  };

  const toggleRegisterContact = (id: string) => {
    setRegisterSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const confirmRegister = () => {
    setRegisterModalVisible(false);
    performRegister(registerSelectedIds);
  };

  const renderRegisterAction = () => {
    if (unregisteredLoading) {
      return <ActivityIndicator size="small" color="#FF8C00" />;
    }
    if (isUnregisteredError || unregisteredData?.status !== 200) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>שגיאה בטעינת הנתונים</Text>
          <TouchableOpacity onPress={() => refetchUnregistered()}>
            <Text style={styles.retryText}>נסה שוב</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <TouchableOpacity
        style={[styles.registerButton, (isRegistering || unregisteredContacts.length === 0) && styles.disabledButton]}
        onPress={handleRegisterMore}
        disabled={isRegistering || unregisteredContacts.length === 0}
      >
        <Text style={styles.registerButtonText}>
          {isRegistering ? 'נרשם...' : 'רישום משתתפים נוספים'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderAction = () => {
    if (membersLoading) {
      return <ActivityIndicator size="small" color="#ff4444" />;
    }
    if (isMembersError || membersData?.status !== 200) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>שגיאה בטעינת הנתונים</Text>
          <TouchableOpacity onPress={() => refetchMembers()}>
            <Text style={styles.retryText}>נסה שוב</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (members.length === 0) return null;
    return (
      <TouchableOpacity
        style={[styles.unregisterButton, isUnregistering && styles.disabledButton]}
        onPress={handleUnregister}
        disabled={isUnregistering}
      >
        <Text style={styles.unregisterButtonText}>
          {isUnregistering ? 'מבטל...' : 'ביטול רישום'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <MyActivityItem
        title={campaign.name}
        date={`${campaign.startDate} | ${campaign.durationInHours} שעות`}
        location={`${campaign.locationAddress}, ${campaign.locationCity}`}
        status={members.length > 1 ? undefined : statusText}
        onPressDetails={onPressDetails}
      >
        {members.length > 1 && (
          <View style={styles.memberStatusList}>
            {members.map((m) => (
              <View key={m.salesforceUserId} style={styles.memberStatusRow}>
                <Status label={approvalStatusLabel(m.registrationStatus)} />
                <Text style={styles.memberName}>{m.firstName} {m.lastName}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.actionContainer}>
          {renderRegisterAction()}
          {renderAction()}
        </View>
      </MyActivityItem>

      <Modal visible={registerModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.selectionModal}>
            <Text style={[styles.selectionTitle, styles.registerSelectionTitle]}>בחר משתתפים לרישום</Text>

            {unregisteredContacts.map((contact) => {
              const selected = registerSelectedIds.includes(contact.salesforceUserId);
              return (
                <TouchableOpacity
                  key={contact.salesforceUserId}
                  style={styles.contactRow}
                  onPress={() => toggleRegisterContact(contact.salesforceUserId)}
                >
                  <Text style={styles.contactName}>
                    {contact.firstName} {contact.lastName}
                  </Text>
                  <View style={[styles.checkbox, selected && styles.registerCheckboxSelected]}>
                    {selected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}

            <View style={styles.selectionButtons}>
              <TouchableOpacity
                onPress={() => setRegisterModalVisible(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmRegister}
                disabled={registerSelectedIds.length === 0}
                style={[styles.registerConfirmButton, registerSelectedIds.length === 0 && styles.disabledButton]}
              >
                <Text style={styles.confirmButtonText}>אישור</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={selectionVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.selectionModal}>
            <Text style={styles.selectionTitle}>בחר משתתפים לביטול</Text>

            {members.map((member) => {
              const selected = selectedIds.includes(member.salesforceUserId);
              return (
                <TouchableOpacity
                  key={member.salesforceUserId}
                  style={styles.contactRow}
                  onPress={() => toggleContact(member.salesforceUserId)}
                >
                  <Text style={styles.contactName}>
                    {member.firstName} {member.lastName}
                  </Text>
                  <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                    {selected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
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
  memberStatusList: { gap: 6, marginBottom: 4 },
  memberStatusRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8 },
  memberName: { fontSize: 14, color: '#333', textAlign: 'right' },
  actionContainer: { alignItems: 'flex-end', gap: 8 },
  registerButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  registerButtonText: { color: '#fff', fontWeight: 'bold' },
  registerSelectionTitle: { color: '#FF8C00' },
  registerCheckboxSelected: { backgroundColor: '#FF8C00', borderColor: '#FF8C00' },
  registerConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FF8C00',
    alignItems: 'center' as const,
  },
  unregisterButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  disabledButton: { opacity: 0.6 },
  unregisterButtonText: { color: '#fff', fontWeight: 'bold' },
  errorContainer: { alignItems: 'flex-end', gap: 4 },
  errorText: { color: '#ff4444', fontSize: 13 },
  retryText: { color: '#FF8C00', fontSize: 13, fontWeight: 'bold' },
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
  contactName: { fontSize: 16, textAlign: 'right', flex: 1, paddingLeft: 12 },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
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
