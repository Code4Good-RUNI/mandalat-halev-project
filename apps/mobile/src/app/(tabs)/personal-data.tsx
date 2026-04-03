import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useUserProfile } from '../../api/hooks';

export default function PersonalDataScreen() {
  // switch states
  const [activityUpdates, setActivityUpdates] = useState(true);
  const [futureActivities, setFutureActivities] = useState(true);
  const [orgMessages, setOrgMessages] = useState(true);

  // TODO: get salesforceUserId from auth state after login
  const { data, isPending, isError } = useUserProfile(1);
  const profile = data?.status === 200 ? data.body : undefined;

  if (isPending) {
    return (
      <SafeAreaView>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView>
        <Text>שגיאה בטעינת הנתונים</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>איזור אישי</Text>

        {/* My Details */}
        <View>
          <Text>הפרטים שלי</Text>

          <View>
            <Text>שם מלא</Text>
            <Text>
              {profile?.firstName} {profile?.lastName}
            </Text>
          </View>

          <View>
            <Text>מספר תעודת זהות</Text>
            <Text>{profile?.idNumber}</Text>
          </View>

          <View>
            <Text>מספר טלפון</Text>
            <Text>{profile?.phoneNumber}</Text>
          </View>

          <View>
            <Text>כתובת דואר אלקטרוני</Text>
            <Text>{profile?.email}</Text>
          </View>

          <View>
            <Text>כתובת מגורים</Text>
            <Text>
              {profile?.address}, {profile?.city}
            </Text>
          </View>

          <View>
            <Text>תאריך לידה</Text>
            <Text>{profile?.birthDate}</Text>
          </View>
        </View>

        {/* Family Members */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>בני משפחה</Text>
          <View style={styles.card}>
            <Text style={styles.cardName}>John Doe</Text>
            <Text style={styles.cardDetail}>Husband</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardName}>Alice Doe</Text>
            <Text style={styles.cardDetail}>Daughter</Text>
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>הגדרת התראות</Text>

          <View>
            <Text>עדכוני פעילויות</Text>
            <Text>קבל הודעות על שינויים בסטטוס הרישום</Text>
            <Switch
              value={activityUpdates}
              onValueChange={setActivityUpdates}
            />
          </View>

          <View>
            <Text>פעילויות עתידיות</Text>
            <Text>קבל תזכורות לפני פעילויות מתוזמנות</Text>
            <Switch
              value={futureActivities}
              onValueChange={setFutureActivities}
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
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: { color: '#666' },
  value: { fontWeight: '500' },
  card: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  cardName: { fontWeight: 'bold', textAlign: 'right' },
  cardDetail: { textAlign: 'right', color: '#666' },
  updateButton: {
    backgroundColor: '#FF8C00',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  updateButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  // ADDED MISSING STYLES:
  switchRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  switchTextContainer: { flex: 1, paddingRight: 10 },
  switchTitle: { fontWeight: 'bold', textAlign: 'right' },
  switchSub: { fontSize: 12, color: '#666', textAlign: 'right' },
});
