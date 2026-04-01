import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useUserProfile } from '../../api/hooks';

export default function PersonalDataScreen() {
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
    <SafeAreaView>
      <ScrollView>
        {/* Header */}
        <Text>איזור אישי</Text>

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
        <View>
          <Text>בני משפחה</Text>

          {/* Family Card 1 */}
          <View>
            <Text>John Doe</Text>
            <Text>Husband</Text>
            <Text>Date of Birth: 1990-07-21</Text>
          </View>

          {/* Family Card 2 */}
          <View>
            <Text>Alice Doe</Text>
            <Text>Daughter</Text>
            <Text>Date of Birth: 2015-04-10</Text>
          </View>
        </View>

        {/* Notification Settings */}
        <View>
          <Text>הגדרת התראות</Text>

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

          <View>
            <Text>הודעות מהעמותה</Text>
            <Text>קבל עדכונים ישירות מהעמותה לאפליקציה</Text>
            <Switch value={orgMessages} onValueChange={setOrgMessages} />
          </View>
        </View>

        {/* Update Button */}
        <TouchableOpacity>
          <Text>עדכון פרטים אישיים</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
