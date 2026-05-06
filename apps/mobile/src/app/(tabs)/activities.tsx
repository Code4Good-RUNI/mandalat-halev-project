import React, { useState } from 'react';
import { View, Text, FlatList, SafeAreaView, TextInput, StyleSheet, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import { ActivityItem } from '../../components/ActivityItem';
import { useActiveCampaigns, useRegisterForCampaign, useUserContacts } from '../../api/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { CampaignDetailsModal } from '../../components/CampaignDetailsModal';
import { QueryErrorState } from '../../components/QueryErrorState';
import type { GetFutureCampaignDto, ContactDto } from '@mandalat-halev-project/api-interfaces';

// Props for a single campaign row in the list.
// contacts = the full list of contacts belonging to this user (fetched once at the screen level).
interface ActiveCampaignItemProps {
  item: GetFutureCampaignDto;
  contacts: ContactDto[];
  contactsLoading: boolean;
  onShowModal: (msg: string) => void;
  onPressDetails: () => void;
}

// Renders one active campaign card with a registration button.
// Manages its own registration state and the contact-selection modal.
function ActiveCampaignItem({ item, contacts, contactsLoading, onShowModal, onPressDetails }: ActiveCampaignItemProps) {
  // useQueryClient lets us manually invalidate (refetch) cached queries after a mutation succeeds.
  const queryClient = useQueryClient();

  // mutate = function to trigger the POST /campaigns/register request.
  // isPending = true while the request is in flight.
  const { mutate: register, isPending } = useRegisterForCampaign();

  // Tracks whether this specific card has already been registered in this session.
  const [isRegistered, setIsRegistered] = useState(false);

  // Controls whether the contact-selection bottom sheet is open.
  const [selectionVisible, setSelectionVisible] = useState(false);

  // The IDs of contacts currently checked in the selection modal.
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Sends the registration request to the server with the given contact IDs.
  const submitRegistration = (contactIds: string[]) => {
    register(
      { campaignId: item.id, contactIds },
      {
        onSuccess: (res) => {
          if (res.status === 200 && res.body?.requestReceivedSuccessfully) {
            setIsRegistered(true);
            onShowModal('בקשת ההרשמה נשלחה בהצלחה!');
            // Refresh the active and future campaign lists so both screens show up-to-date data.
            queryClient.invalidateQueries({ queryKey: ['campaigns', 'active'] });
            queryClient.invalidateQueries({ queryKey: ['campaigns', 'future'] });
          } else {
            const errorMessage = (res.body as any)?.message || 'אירעה שגיאה בהרשמה. אנא נסה שוב.';
            onShowModal(errorMessage);
          }
        },
        onError: () => onShowModal('שגיאת תקשורת או מערכת. אנא בדוק את החיבור ונסה שוב.'),
      }
    );
  };

  // Called when the user presses the register button.
  // If the user only has one contact (themselves), register immediately — no need to show a picker.
  // If the user has multiple contacts, open the selection modal so they can choose who to register.
  const handleRegister = () => {
    if (contacts.length <= 1) {
      submitRegistration(contacts.map((c) => c.salesforceUserId));
    } else {
      // Pre-select all contacts so the user can just confirm without extra taps.
      setSelectedIds(contacts.map((c) => c.salesforceUserId));
      setSelectionVisible(true);
    }
  };

  // Adds or removes a contact ID from the selection when the user taps a row.
  const toggleContact = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Called when the user presses "אישור" in the modal — closes the modal and submits.
  const confirmSelection = () => {
    setSelectionVisible(false);
    submitRegistration(selectedIds);
  };

  return (
    <>
      <ActivityItem
        title={item.name}
        host={`${item.host.firstName} ${item.host.lastName}`}
        time={`${item.startDate} (${item.durationInHours} שעות)`}
        location={`${item.locationAddress}, ${item.locationCity}`}
        status={isRegistered ? 'נרשמת בהצלחה' : 'פתוח להרשמה'}
        onPressDetails={onPressDetails}
      >
        <View style={styles.actionContainer}>
          {/* Button is greyed out and non-interactive while loading or after a successful registration. */}
          <TouchableOpacity
            style={[styles.registerButton, (isPending || isRegistered || contactsLoading) && styles.disabledButton]}
            onPress={handleRegister}
            disabled={isPending || isRegistered || contactsLoading}
          >
            <Text style={styles.registerButtonText}>
              {isPending ? 'נרשם...' : isRegistered ? 'נרשמת' : 'הרשמה לפעילות'}
            </Text>
          </TouchableOpacity>
        </View>
      </ActivityItem>

      {/* Contact selection bottom sheet — only shown when the user has multiple contacts. */}
      <Modal visible={selectionVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.selectionModal}>
            <Text style={styles.selectionTitle}>בחר משתתפים</Text>

            {/* One row per contact. Tapping toggles their checkbox. */}
            {contacts.map((contact) => {
              const selected = selectedIds.includes(contact.salesforceUserId);
              return (
                <TouchableOpacity
                  key={contact.salesforceUserId}
                  style={styles.contactRow}
                  onPress={() => toggleContact(contact.salesforceUserId)}
                >
                  {/* Visual checkbox: orange fill when selected, grey border when not. */}
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
              {/* Confirm is disabled when no contacts are selected to prevent an empty submission. */}
              <TouchableOpacity
                onPress={confirmSelection}
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

export default function ActivitiesScreen() {
  // Fetch the list of active campaigns available for registration.
  const { data, isPending, isError, refetch } = useActiveCampaigns();

  // Fetch the user's contacts once here and pass them down to each campaign item.
  // Fetching here (not inside each item) means we only make one network request
  // regardless of how many campaigns are shown.
  const { data: contactsData, isPending: contactsLoading } = useUserContacts();
  const contacts = contactsData?.status === 200 ? contactsData.body : [];

  // State for the post-registration notification popup.
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Tracks which campaign the user tapped "details" on, to show the details modal.
  const [selectedCampaign, setSelectedCampaign] = useState<GetFutureCampaignDto | null>(null);

  const showModal = (msg: string) => {
    setModalMessage(msg);
    setModalVisible(true);
  };

  if (isPending) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </SafeAreaView>
    );
  }

  if (isError || data?.status !== 200) {
    return <QueryErrorState onRetry={refetch} />;
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

      {/* Efficiently renders only the campaign cards currently visible on screen. */}
      <FlatList
        data={data.body}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ActiveCampaignItem
            item={item}
            contacts={contacts}
            contactsLoading={contactsLoading}
            onShowModal={showModal}
            onPressDetails={() => setSelectedCampaign(item)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>לא נמצאו פעילויות תואמות לחיפוש.</Text>
        }
      />

      {/* Generic notification popup shown after registration succeeds or fails. */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>{modalMessage}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>סגור</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Full-screen campaign details modal, shown when the user taps "details" on a card. */}
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
  header: { padding: 15 },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'right', marginBottom: 10 },
  searchInput: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 5 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 30, color: '#666', fontSize: 16 },
  actionContainer: { alignItems: 'center', marginTop: 10 },
  registerButton: { backgroundColor: '#FF8C00', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  disabledButton: { backgroundColor: '#ccc' },
  registerButtonText: { color: '#fff', fontWeight: 'bold' },
  // Notification modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '80%', alignItems: 'center' },
  modalText: { fontSize: 16, marginBottom: 20, textAlign: 'center' },
  closeButton: { backgroundColor: '#FF8C00', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  closeButtonText: { color: '#fff', fontWeight: 'bold' },
  // Contact selection bottom sheet
  selectionModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
    color: '#FF8C00',
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
    backgroundColor: '#FF8C00',
    borderColor: '#FF8C00',
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
    backgroundColor: '#FF8C00',
    alignItems: 'center',
  },
  confirmButtonText: { color: '#fff', fontWeight: 'bold' },
});
