import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Status } from './Status';

interface ActivityItemProps {
  title: string;
  time: string;
  location: string;
  status: string;
  onPressDetails?: () => void;
  children?: React.ReactNode;
}

export const ActivityItem = ({ title, time, location, status, onPressDetails, children }: ActivityItemProps) => (
  <View style={styles.container}>
    <View style={styles.headerRow}>
      <Status label={status} />
    </View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.details}>{time} | {location}</Text>
    <View style={styles.footerRow}>
      <TouchableOpacity style={styles.button} onPress={onPressDetails}>
        <Text style={styles.buttonText}>לפרטים נוספים</Text>
      </TouchableOpacity>
      {children && (
        <View style={styles.actions}>
          {children}
        </View>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  headerRow: { alignItems: 'flex-end', marginBottom: 5 },
  title: { fontSize: 18, fontWeight: 'bold', textAlign: 'right', color: '#333' },
  details: { color: '#666', textAlign: 'right', marginTop: 5, fontSize: 14 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  button: { paddingVertical: 8 },
  buttonText: { color: '#FF8C00', fontWeight: 'bold', fontSize: 14 },
  actions: { alignItems: 'center' }
});