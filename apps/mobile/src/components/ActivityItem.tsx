import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
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
  imageUrl?: string;
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
  imageUrl,
  onPressDetails,
  children,
}: ActivityItemProps) => (
  <View style={styles.container}>
    {imageUrl && (
      <Image source={{ uri: imageUrl }} style={styles.photo} resizeMode="cover" />
    )}

    <View style={styles.info}>
      <View style={styles.titleRow}>
        <Status label={status} />
        <Text style={styles.title}>{title}</Text>
      </View>

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
  photo: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 8,
    backgroundColor: '#ddd',
    marginBottom: 12,
  },
  info: {
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'auto',
    color: '#333',
    flex: 1,
    paddingRight: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationItem: {
    marginLeft: 20,
  },
  locationItem: {
    alignSelf: 'flex-start',
  },
  metaText: {
    fontSize: 13,
    color: '#666',
  },
  host: {
    fontSize: 13,
    color: '#888',
    textAlign: 'auto',
  },
  detailsBtn: {
    alignSelf: 'flex-start',
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
