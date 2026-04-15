import React, { useState } from 'react';
import { FlatList, SafeAreaView, Text, StyleSheet, ActivityIndicator, Modal, TouchableOpacity, View } from 'react-native';
import { temporarySalesforceUserId } from '../../login';
import { useFutureCampaigns } from '../../../api/hooks';
import { FutureCampaignItem } from '../../../components/FutureCampaignItem';
import { CampaignDetailsModal } from '../../../components/CampaignDetailsModal';
import type { GetFutureCampaignDto } from '@mandalat-halev-project/api-interfaces';

export default function FutureActivitiesScreen() {
  const userId = Number(temporarySalesforceUserId);
  const { data, isPending, isError } = useFutureCampaigns(userId);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
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
        renderItem={({ item }) => (
          <FutureCampaignItem 
            campaign={item} 
            userId={userId} 
            onShowModal={showModal} 
            onPressDetails={() => setSelectedCampaign(item)}
          />
        )}
        contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 15 }}
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
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'right', padding: 15 },
  errorText: { color: 'red', textAlign: 'center', marginBottom: 5, fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '80%', alignItems: 'center' },
  modalText: { fontSize: 16, marginBottom: 20, textAlign: 'center' },
  closeButton: { backgroundColor: '#FF8C00', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  closeButtonText: { color: '#fff', fontWeight: 'bold' },
});
