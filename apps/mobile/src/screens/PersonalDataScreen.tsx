import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, Switch, TouchableOpacity} from 'react-native';


export const ProfileScreen = () => {
  // toggle switches for the notifications
  const [activityUpdates, setActivityUpdates] = useState(true);
  const [futureActivities, setFutureActivities] = useState(true);
  const [orgMessages, setOrgMessages] = useState(true);

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
            <Text>ישראל ישראלי</Text>
          </View>

          <View>
            <Text>מספר תעודת זהות</Text>
            <Text>000000000</Text>
          </View>

          <View>
            <Text>מספר טלפון</Text>
            <Text>050-0000000</Text>
          </View>
          
          <View>
            <Text>כתובת דואר אלקטרוני</Text>
            <Text>aaaaaaaa@gmail.com</Text>
          </View>

          <View>
            <Text>כתובת מגורים</Text>
            <Text>ישראל</Text>
          </View>

          <View>
            <Text>תאריך לידה</Text>
            <Text>1/1/2000</Text>
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
            <Switch 
              value={orgMessages} 
              onValueChange={setOrgMessages} 
            />
          </View>
        </View>

        {/* Update Button */}
        <TouchableOpacity>
          <Text>עדכון פרטים אישיים</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};