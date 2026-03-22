import React from 'react';
import { View, Text, FlatList, SafeAreaView, StyleSheet } from 'react-native';
import { ActivityItem } from '../components/ActivityItem';


const PAST_ACTIVITIES = [
  {
    id: '1',
    title: 'יוגה למתקדמים',
    time: '6:00',
    location: 'מתחם מנדלת הלב',
    day: '15',
    month: 'May',
    status: 'נוכח',
  },
  {
    id: '2',
    title: 'סדנת קרמיקה',
    time: '6:00',
    location: 'מתחם מנדלת הלב',
    day: '15',
    month: 'May',
    status: 'לא נוכח',
  },
];

export const PreviousActivitiesScreen = () => {
  
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>פעילויות קודמות</Text>
      </View>
      
      <FlatList
        data={PAST_ACTIVITIES}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { padding: 15 },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'right' }
});