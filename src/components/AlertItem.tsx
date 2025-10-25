import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Alert } from '../types';
import { getTimeAgo } from '../utils/helpers';

interface AlertItemProps {
  alert: Alert;
  onPress: () => void;
}

export const AlertItem: React.FC<AlertItemProps> = ({ alert, onPress }) => {
  const isError = alert.type === 'error';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { borderLeftColor: isError ? '#ef4444' : '#f59e0b' },
        !alert.is_read && styles.unread,
      ]}
      onPress={onPress}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{isError ? '❌' : '⚠️'}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.message}>{alert.message}</Text>
        <Text style={styles.time}>{getTimeAgo(alert.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  unread: {
    backgroundColor: '#fef3c7',
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 4,
  },
  time: {
    fontSize: 11,
    color: '#9ca3af',
  },
});
