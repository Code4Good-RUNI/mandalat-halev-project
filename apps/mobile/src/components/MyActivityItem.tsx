import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Status } from './Status';

interface MyActivityItemProps {
  title: string;
  date: string;
  location: string;
  status?: string;
  onPressDetails?: () => void;
  children?: React.ReactNode;
}

export const MyActivityItem = ({
  title,
  date,
  location,
  status,
  onPressDetails,
  children,
}: MyActivityItemProps) => (
  <View style={styles.container}>
    <View style={styles.cardRow}>
      {/* Details column on the left */}
      <View style={styles.info}>
        {/* Status on left, name on right */}
        <View style={styles.nameRow}>
          {status ? <Status label={status} /> : null}
          <Text style={styles.title}>{title}</Text>
        </View>

        {/* Date+time and location aligned to the right (photo side) */}
        <View style={styles.metaItem}>
          <Text style={styles.metaText}>{date}</Text>
          <Ionicons name="time-outline" size={13} color="#888" />
        </View>

        <View style={styles.metaItem}>
          <Text style={styles.metaText}>{location}</Text>
          <Ionicons name="location-outline" size={13} color="#888" />
        </View>

        <TouchableOpacity onPress={onPressDetails} style={styles.detailsBtn}>
          <Text style={styles.detailsLink}>לפרטים נוספים</Text>
        </TouchableOpacity>
      </View>

      {/* Photo on the right */}
      <View style={styles.photo} />
    </View>

    {children && <View style={styles.actions}>{children}</View>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  info: {
    flex: 1,
    gap: 6,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#ddd',
    flexShrink: 0,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
    flex: 1,
    paddingRight: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
  },
  metaText: {
    fontSize: 13,
    color: '#666',
  },
  detailsBtn: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  detailsLink: {
    color: '#FF8C00',
    fontWeight: 'bold',
    fontSize: 13,
  },
  actions: {
    marginTop: 10,
  },
});
