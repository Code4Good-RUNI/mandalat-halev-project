import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Status } from './Status';

interface MyActivityItemProps {
  title: string;
  date: string;
  location: string;
  status?: string;
  imageUrl?: string;
  onPressDetails?: () => void;
  children?: React.ReactNode;
}

export const MyActivityItem = ({
  title,
  date,
  location,
  status,
  imageUrl,
  onPressDetails,
  children,
}: MyActivityItemProps) => {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <View style={styles.container}>
      {imageUrl && !imageFailed && (
        <Image
          source={{ uri: imageUrl }}
          style={styles.photo}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        />
      )}

      <View style={styles.info}>
        {/* Name on the right (same side as the details link), status on the left */}
        <View style={styles.nameRow}>
          <Text style={styles.title}>{title}</Text>
          {status ? <Status label={status} /> : null}
        </View>

        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={13} color="#888" />
          <Text style={styles.metaText}>{date}</Text>
        </View>

        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={13} color="#888" />
          <Text style={styles.metaText}>{location}</Text>
        </View>

        <TouchableOpacity onPress={onPressDetails} style={styles.detailsBtn}>
          <Text style={styles.detailsLink}>לפרטים נוספים</Text>
        </TouchableOpacity>
      </View>

      {children && <View style={styles.actions}>{children}</View>}
    </View>
  );
};

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
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'auto',
    flex: 1,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  metaText: {
    fontSize: 13,
    color: '#666',
  },
  detailsBtn: {
    alignSelf: 'flex-start',
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
