import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Linking,
} from 'react-native';
import { clearSession } from '../../api/session';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserProfile, useUserContacts } from '../../api/hooks';
import { QueryErrorState } from '../../components/QueryErrorState';

export default function PersonalDataScreen() {
  // switch states
  const [activityUpdates, setActivityUpdates] = useState(true);
  const [futureActivities, setFutureActivities] = useState(true);
  const [orgMessages, setOrgMessages] = useState(true);

  const { data, isPending, isError, refetch } = useUserProfile();
  const profile = data?.status === 200 ? data.body : undefined;

  const { data: contactsData } = useUserContacts();
  const contacts = contactsData?.status === 200 ? contactsData.body : [];
  const familyContacts = contacts.filter((c) => c.salesforceUserId !== profile?.salesforceUserId);

  if (isPending) {
    return (
      <SafeAreaView>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (isError || data?.status !== 200) {
    return <QueryErrorState onRetry={refetch} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>איזור אישי</Text>

        {/* My Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>הפרטים שלי</Text>

          <View style={styles.row}>
            <Text style={styles.label}>שם מלא</Text>
            <Text style={styles.value}>{profile?.firstName} {profile?.lastName}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>מספר תעודת זהות</Text>
            <Text style={styles.value}>{profile?.idNumber}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>מספר טלפון</Text>
            <Text style={styles.value}>{profile?.phoneNumber}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>כתובת דואר אלקטרוני</Text>
            <Text style={styles.value}>{profile?.email}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>כתובת מגורים</Text>
            <Text style={styles.value}>{profile?.address}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>עיר</Text>
            <Text style={styles.value}>{profile?.city}</Text>
          </View>

          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.label}>תאריך לידה</Text>
            <Text style={styles.value}>{profile?.birthDate}</Text>
          </View>
        </View>

        {/* Family Members */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>בני משפחה</Text>
          {familyContacts.length === 0 ? (
            <Text style={styles.cardDetail}>אין בני משפחה רשומים</Text>
          ) : (
            familyContacts.map((contact) => (
              <View key={contact.salesforceUserId} style={styles.card}>
                <Text style={styles.cardName}>{contact.firstName} {contact.lastName}</Text>
                <Text style={styles.cardDetail}>ת.ז. {contact.idNumber}</Text>
              </View>
            ))
          )}
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>הגדרת התראות</Text>

          <View style={styles.switchRow}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchTitle}>עדכוני פעילויות</Text>
              <Text style={styles.switchSub}>קבל הודעות על שינויים בסטטוס הרישום</Text>
            </View>
            <Switch
              value={activityUpdates}
              onValueChange={setActivityUpdates}
              trackColor={{ true: '#FF8C00' }}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchTitle}>פעילויות עתידיות</Text>
              <Text style={styles.switchSub}>קבל תזכורות לפני פעילויות מתוזמנות</Text>
            </View>
            <Switch
              value={futureActivities}
              onValueChange={setFutureActivities}
              trackColor={{ true: '#FF8C00' }}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchTitle}>הודעות מהעמותה</Text>
              <Text style={styles.switchSub}>
                קבל עדכונים ישירות מהעמותה לאפליקציה
              </Text>
            </View>
            <Switch
              value={orgMessages}
              onValueChange={setOrgMessages}
              trackColor={{ true: '#FF8C00' }}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.updateButton}
          onPress={() => void Linking.openURL('mailto:mandalatlev@gmail.com')}
        >
          <Text style={styles.updateButtonText}>עדכון פרטים אישיים</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => void clearSession()} style={styles.logoutButton}>
          <Text style={styles.logoutText}>התנתק</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20 },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: { marginBottom: 30 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF8C00',
    marginBottom: 10,
    textAlign: 'auto',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowLast: { borderBottomWidth: 0 },
  label: { color: '#666' },
  value: { fontWeight: '500' },
  card: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  cardName: { fontWeight: 'bold', textAlign: 'auto' },
  cardDetail: { textAlign: 'auto', color: '#666' },
  updateButton: {
    backgroundColor: '#FF8C00',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  updateButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  logoutButton: { marginTop: 16, alignItems: 'center' },
  logoutText: { color: 'red', fontSize: 16 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  switchTextContainer: { flex: 1, paddingRight: 10 },
  switchTitle: { fontWeight: 'bold', textAlign: 'auto' },
  switchSub: { fontSize: 12, color: '#666', textAlign: 'auto' },
});
