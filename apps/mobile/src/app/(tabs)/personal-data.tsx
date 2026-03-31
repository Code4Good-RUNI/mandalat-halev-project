import React, { useState } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  ScrollView, 
  Switch, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet 
} from 'react-native';
import { useUserProfile } from '../../api/hooks';
import { TEMP_SALESFORCE_USER_ID } from '../../constants/auth';

export default function PersonalDataScreen() {
  // fetch the data using the hook
  const { data, isLoading, isError } = useUserProfile(Number(TEMP_SALESFORCE_USER_ID));
  
  // switch states
  const [activityUpdates, setActivityUpdates] = useState(true);
  const [futureActivities, setFutureActivities] = useState(true);
  const [orgMessages, setOrgMessages] = useState(true);

  // handeling loading
  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#FF8C00" />
        <Text>טוען נתונים...</Text>
      </SafeAreaView>
    );
  }

  // handling different errors
  if (isError || !data || data.status !== 200) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>משהו השתבש בטעינת הפרטים.</Text>
      </SafeAreaView>
    );
  }

  const user = data.body;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>איזור אישי</Text>

        {/* Personal Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>הפרטים שלי</Text>
          <View style={styles.row}><Text style={styles.label}>שם מלא</Text><Text style={styles.value}>{user.firstName} {user.lastName}</Text></View>
          <View style={styles.row}><Text style={styles.label}>מספר תעודת זהות</Text><Text style={styles.value}>{user.idNumber || 'לא הוזן'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>מספר טלפון</Text><Text style={styles.value}>{user.phoneNumber}</Text></View>
          <View style={styles.row}><Text style={styles.label}>כתובת דואר אלקטרוני</Text><Text style={styles.value}>{user.email}</Text></View>
          <View style={styles.row}><Text style={styles.label}>כתובת מגורים</Text><Text style={styles.value}>{user.address || 'ישראל'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>תאריך לידה</Text><Text style={styles.value}>{user.birthDate}</Text></View>
        </View>

        {/* Family Members */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>בני משפחה</Text>
          <View style={styles.card}><Text style={styles.cardName}>John Doe</Text><Text style={styles.cardDetail}>Husband</Text></View>
          <View style={styles.card}><Text style={styles.cardName}>Alice Doe</Text><Text style={styles.cardDetail}>Daughter</Text></View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>הגדרת התראות</Text>

          <View style={styles.switchRow}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchTitle}>עדכוני פעילויות</Text>
              <Text style={styles.switchSub}>קבל הודעות על שינויים בסטטוס הרישום</Text>
            </View>
            <Switch value={activityUpdates} onValueChange={setActivityUpdates} trackColor={{ true: '#FF8C00' }} />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchTitle}>פעילויות עתידיות</Text>
              <Text style={styles.switchSub}>קבל תזכורות לפני פעילויות מתוזמנות</Text>
            </View>
            <Switch value={futureActivities} onValueChange={setFutureActivities} trackColor={{ true: '#FF8C00' }} />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchTitle}>הודעות מהעמותה</Text>
              <Text style={styles.switchSub}>קבל עדכונים ישירות מהעמותה לאפליקציה</Text>
            </View>
            <Switch value={orgMessages} onValueChange={setOrgMessages} trackColor={{ true: '#FF8C00' }} />
          </View>
        </View>

        <TouchableOpacity style={styles.updateButton}>
          <Text style={styles.updateButtonText}>עדכון פרטים אישיים</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FF8C00', marginBottom: 10, textAlign: 'right' },
  row: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  label: { color: '#666' },
  value: { fontWeight: '500' },
  card: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 10 },
  cardName: { fontWeight: 'bold', textAlign: 'right' },
  cardDetail: { textAlign: 'right', color: '#666' },
  updateButton: { backgroundColor: '#FF8C00', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  updateButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  // ADDED MISSING STYLES:
  switchRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  switchTextContainer: { flex: 1, paddingRight: 10 },
  switchTitle: { fontWeight: 'bold', textAlign: 'right' },
  switchSub: { fontSize: 12, color: '#666', textAlign: 'right' },
});