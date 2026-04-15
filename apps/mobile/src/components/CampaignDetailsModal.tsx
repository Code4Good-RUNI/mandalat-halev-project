import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import type { CampaignDto } from '@mandalat-halev-project/api-interfaces';

interface CampaignDetailsModalProps {
  visible: boolean;
  campaign: CampaignDto | null;
  onClose: () => void;
}

export function CampaignDetailsModal({ visible, campaign, onClose }: CampaignDetailsModalProps) {
  if (!campaign) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{campaign.name}</Text>
            
            <Text style={styles.detailText}>תאריך: {campaign.startDate} {campaign.endDate && campaign.endDate !== campaign.startDate ? `- ${campaign.endDate}` : ''}</Text>
            <Text style={styles.detailText}>משך זמן: {campaign.durationInHours} שעות</Text>
            <Text style={styles.detailText}>מיקום: {campaign.locationAddress}, {campaign.locationCity}</Text>
            <Text style={styles.detailText}>מקומות פנויים: {campaign.numOfParticipants ? campaign.numOfParticipants - (campaign.numOfParticipantsRegistered || 0) : 'לא מוגבל'}</Text>
            
            {campaign.description ? (
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionTitle}>על הפעילות:</Text>
                <Text style={styles.descriptionText}>{campaign.description}</Text>
              </View>
            ) : null}
          </ScrollView>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>סגור</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  content: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 25, maxHeight: '80%' },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'right', marginBottom: 15, color: '#333' },
  detailText: { fontSize: 16, textAlign: 'right', marginBottom: 8, color: '#555' },
  descriptionContainer: { marginTop: 20, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 15 },
  descriptionTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'right', marginBottom: 5, color: '#333' },
  descriptionText: { fontSize: 16, textAlign: 'right', color: '#444', lineHeight: 24 },
  closeButton: { backgroundColor: '#FF8C00', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 25 },
  closeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
