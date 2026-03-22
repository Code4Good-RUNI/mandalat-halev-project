import React from 'react';
import { View, Text, FlatList, SafeAreaView, TouchableOpacity } from 'react-native';

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
  
  const renderItem = ({ item }: { item: typeof MY_ACTIVITIES[0] }) => (
    <View>
      <Text>{item.status}</Text>
      <View>
        <Text>{item.title}</Text>
        <Text>{item.time} 🕒</Text>
        <Text>{item.location} 📍</Text>
      </View>
      <View>
        <Text>{item.day}</Text>
        <Text>{item.month}</Text>
      </View>
      <TouchableOpacity>
        <Text>לפרטים נוספים</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView>
      <Text>פעילויות עתידיות</Text>
      <FlatList
        data={MY_ACTIVITIES}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />

      {/* COMMENTED THIS OUT TO PREVENT ERRORS DURING THE GIT PULL */}
      {/* <TouchableOpacity onPress={onTempPress}>
        <Text>עבור לפעילויות קודמות (זמני)</Text>
      </TouchableOpacity> 
      */}
    </SafeAreaView>
  );
};