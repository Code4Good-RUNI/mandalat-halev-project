import React from 'react';
import { FlatList, SafeAreaView, Text, StyleSheet } from 'react-native';
import { ActivityItem } from '../components/ActivityItem';

interface FutureActivitiesProps {
  onTempPress: () => void;
}

const MY_ACTIVITIES = [
  {
    id: '1',
    title: 'יוגה למתקדמים',
    time: '6:00',
    location: 'מתחם מנדלת הלב',
    day: '15',
    month: 'May',
    status: 'מאושר',
  },
  {
    id: '2',
    title: 'סדנת קרמיקה',
    time: '6:00',
    location: 'מתחם מנדלת הלב',
    day: '15',
    month: 'May',
    status: 'ממתין לאישור',
  },
];

export const FutureActivitiesScreen = ({ onTempPress }: FutureActivitiesProps) => {
  
  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>פעילויות עתידיות</Text>
      
      <FlatList
        data={MY_ACTIVITIES}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ActivityItem 
            title={item.title}
            time={item.time}
            location={item.location}
            status={item.status}
          />
        )}
      />

      {/* Navigation hidden for PR */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'right', padding: 15 }
});