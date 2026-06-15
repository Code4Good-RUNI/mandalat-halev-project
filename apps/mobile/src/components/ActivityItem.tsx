import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Status } from './Status';

interface ActivityItemProps {
  title: string;
  host?: string;
  date?: string;
  duration?: string;
  time?: string;
  location: string;
  status: string;
  onPressDetails?: () => void;
  children?: React.ReactNode;
}

export const ActivityItem = ({
  title,
  host,
  date,
  duration,
  location,
  status,
  onPressDetails,
  children,
}: ActivityItemProps) => (
  <View style={styles.container}>
    <View style={styles.cardRow}>
      {/* Details column on the left */}
      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>

        {(date || duration) && (
          <View style={styles.metaRow}>
            {duration && (
              <View style={[styles.metaItem, styles.durationItem]}>
                <Text style={styles.metaText}>{duration}</Text>
                <Ionicons name="time-outline" size={13} color="#888" />
              </View>
            )}
            {date && (
              <View style={styles.metaItem}>
                <Text style={styles.metaText}>{date}</Text>
                <Ionicons name="calendar-outline" size={13} color="#888" />
              </View>
            )}
          </View>
        )}

        <View style={[styles.metaItem, styles.locationItem]}>
          <Text style={styles.metaText}>{location}</Text>
          <Ionicons name="location-outline" size={13} color="#888" />
        </View>

        {host && <Text style={styles.host}>{host}</Text>}

        <TouchableOpacity onPress={onPressDetails} style={styles.detailsBtn}>
          <Text style={styles.detailsLink}>לפרטים נוספים</Text>
        </TouchableOpacity>
      </View>

      {/* Right column: status badge + photo */}
      <View style={styles.rightCol}>
        <Status label={status} />
        <View style={styles.photo} />
      </View>
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
  rightCol: {
    alignItems: 'flex-start',
    gap: 6,
    flexShrink: 0,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#ddd',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
    color: '#333',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  durationItem: {
    marginLeft: 20,
  },
  locationItem: {
    alignSelf: 'flex-end',
  },
  metaText: {
    fontSize: 13,
    color: '#666',
  },
  host: {
    fontSize: 13,
    color: '#888',
    textAlign: 'right',
  },
  detailsBtn: {
    alignSelf: 'flex-end',
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
