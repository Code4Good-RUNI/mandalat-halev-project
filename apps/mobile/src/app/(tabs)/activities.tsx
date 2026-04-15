import React, { useState } from 'react';
import { View, Text, FlatList, SafeAreaView, TextInput, StyleSheet, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import { ActivityItem } from '../../components/ActivityItem';
import { useActiveCampaigns, useRegisterForCampaign } from '../../api/hooks';
import { temporarySalesforceUserId } from '../login';

interface CampaignData {
  id: number | string;
  name: string;
  startDate: string;
  durationInHours: number;
  locationAddress: string;
  locationCity: string;
}

interface ActiveCampaignItemProps {
  item: CampaignData;
  userId: number;
  onShowModal: (msg: string) => void;
}

function ActiveCampaignItem({ item, userId, onShowModal }: ActiveCampaignItemProps) {
  const { mutate: register, isPending } = useRegisterForCampaign();
  const [isRegistered, setIsRegistered] = useState(false);

  const handleRegister = () => {
    register(
      {
        campaignId: Number(item.id),
        salesforceUserId: userId,
        numOfParticipantsToRegister: 1,
      },
      {
        onSuccess: (res) => {
          if (res.status === 200 && res.body.requestReceivedSuccessfully) {
            setIsRegistered(true);
            onShowModal('בקשת ההרשמה נשלחה בהצלחה!');
          } else {
            onShowModal('אירעה שגיאה בהרשמה.');
          }
        },
        onError: () => {
          onShowModal('שגיאת תקשורת. אנא נסה שוב.');
        },
      }
    );
  };

  return (
    <ActivityItem
      title={item.name}
      time={`${item.startDate} (${item.durationInHours} שעות)`}
      location={`${item.locationAddress}, ${item.locationCity}`}
      status={isRegistered ? 'נרשמת בהצלחה' : 'פתוח להרשמה'}
    >
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.registerButton, (isPending || isRegistered) && styles.disabledButton]}
          onPress={handleRegister}
          disabled={isPending || isRegistered}
        >
          <Text style={styles.registerButtonText}>
            {isPending ? 'נרשם...' : isRegistered ? 'נרשמת' : 'הרשמה לפעילות'}
          </Text>
        </TouchableOpacity>
      </View>
    </ActivityItem>
  );
}

export default function ActivitiesScreen() {
  const userId = Number(temporarySalesforceUserId);
  const { data, isPending, isError } = useActiveCampaigns(userId);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

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
          <ActiveCampaignItem item={item} userId={userId} onShowModal={showModal} />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>לא נמצאו פעילויות תואמות לחיפוש.</Text>
        }
      />

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
  emptyText: { textAlign: 'center', marginTop: 30, color: '#666', fontSize: 16 },
  actionContainer: { alignItems: 'center', marginTop: 10 },
  registerButton: { backgroundColor: '#FF8C00', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  disabledButton: { backgroundColor: '#ccc' },
  registerButtonText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '80%', alignItems: 'center' },
  modalText: { fontSize: 16, marginBottom: 20, textAlign: 'center' },
  closeButton: { backgroundColor: '#FF8C00', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  closeButtonText: { color: '#fff', fontWeight: 'bold' },
});
