import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const Status = ({ label }: { label: string }) => (
  <View style={styles.badge}>
    <Text style={styles.text}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: { padding: 4, backgroundColor: '#eee', borderRadius: 4, alignSelf: 'flex-start' },
  text: { fontSize: 12 }
});