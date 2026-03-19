import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';

interface ActivitiesScreenProps {
  onTempPress: () => void;
}

const ACTIVITIES = [
  {
    id: '1',
    title: 'סדנת צילום',
    date: '2025-05-28 10:00',
    duration: '2 שעות',
    location: 'מתחם מנדלת הלב',
    image: 'https://picsum.photos/seed/yoga/600/400', 
  },
  {
    id: '2',
    title: 'שיעור יוגה',
    date: '2025-05-29 10:00',
    duration: '1.5 שעות',
    location: 'מתחם מנדלת הלב',
    image: 'https://picsum.photos/seed/yoga/600/400',
  },
];

export const ActivitiesScreen = ({ onTempPress }: ActivitiesScreenProps) => {
  
  const renderItem = ({ item }: { item: typeof ACTIVITIES[0] }) => (
    <View>
      <Image source={{ uri: item.image }} style={{ width: 100, height: 100 }} />
      <View>
        <Text>{item.title}</Text>
        <Text>📅 {item.date}</Text>
        <Text>🕒 {item.duration}</Text>
        <Text>📍 {item.location}</Text>
        
        <TouchableOpacity>
          <Text>בקשת הרשמה</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView>
      <View>
        <Text>פעילויות זמינות בשבילך</Text>
        <TextInput 
          placeholder="חיפוש..." 
          textAlign="right" 
        />
      </View>

      <FlatList
        data={ACTIVITIES}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />

      <TouchableOpacity onPress={onTempPress}>
        <Text>עבור לפעילויות עתידיות (זמני)</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};