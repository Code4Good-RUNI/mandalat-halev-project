import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const Status = ({ label }: { label: string }) => {
  let badgeStyle = styles.defaultBadge;
  let textStyle = styles.defaultText;

  if (label === 'רשום' || label === 'נוכח') {
    badgeStyle = styles.registeredBadge;
    textStyle = styles.registeredText;
  } else if (label === 'מחכה לאישור') {
    badgeStyle = styles.pendingBadge;
    textStyle = styles.pendingText;
  } else if (label === 'בוטל' || label === 'לא רשום' || label === 'לא נוכח') {
    badgeStyle = styles.cancelledBadge;
    textStyle = styles.cancelledText;
  }

  return (
    <View style={[styles.badge, badgeStyle]}>
      <Text style={[styles.text, textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12 },
  text: { fontSize: 12, fontWeight: 'bold' },
  defaultBadge: { backgroundColor: '#eee' },
  defaultText: { color: '#333' },
  registeredBadge: { backgroundColor: '#d4edda' },
  registeredText: { color: '#155724' },
  pendingBadge: { backgroundColor: '#fff3cd' },
  pendingText: { color: '#856404' },
  cancelledBadge: { backgroundColor: '#f8d7da' },
  cancelledText: { color: '#721c24' }
});