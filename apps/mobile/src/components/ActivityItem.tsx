import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Status } from './Status';

interface ActivityItemProps {
  title: string;
  time: string;
  location: string;
  status: string;
}

export const ActivityItem = ({ title, time, location, status }: ActivityItemProps) => (
  <View style={styles.container}>
    <Status label={status} />
    <Text style={styles.title}>{title}</Text>
    <Text>{time} | {location}</Text>
    <TouchableOpacity style={styles.button}>
      <Text style={styles.buttonText}>לפרטים נוספים</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: { padding: 15, borderBottomWidth: 1, borderColor: '#ccc' },
  title: { fontSize: 18, fontWeight: 'bold' },
  button: { marginTop: 10 },
  buttonText: { color: 'blue' }
});