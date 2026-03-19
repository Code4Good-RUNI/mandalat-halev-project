import React from 'react';
import { View, Text, FlatList, SafeAreaView, TouchableOpacity } from 'react-native';

interface PreviousActivitiesProps {
  onTempPress: () => void;
}

const PAST_ACTIVITIES = [
  {
    id: '1',
    title: 'יוגה למתקדמים',
    time: '6:00',
    location: 'מתחם מנדלת הלב',
    day: '15',
    month: 'May',
    status: 'נוכח', // Mode 1
  },
  {
    id: '2',
    title: 'סדנת קרמיקה',
    time: '6:00',
    location: 'מתחם מנדלת הלב',
    day: '15',
    month: 'May',
    status: 'לא נוכח', // Mode 2
  },
];

export const PreviousActivitiesScreen = ({ onTempPress }: PreviousActivitiesProps) => {
  
  const renderItem = ({ item }: { item: typeof PAST_ACTIVITIES[0] }) => (
    <View>
      {/* Attendance Mode */}
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
      <View>
        <Text>פעילויות קודמות</Text>
      </View>
      
      <FlatList
        data={PAST_ACTIVITIES}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />

      <TouchableOpacity onPress={onTempPress}>
        <Text>חזור להתחלה (זמני)</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};