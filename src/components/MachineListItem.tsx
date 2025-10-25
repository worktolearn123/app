import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Machine } from '../types';
import { getStatusColor, getTimeAgo } from '../utils/helpers';

interface MachineListItemProps {
  machine: Machine;
  onPress: () => void;
}

export const MachineListItem: React.FC<MachineListItemProps> = ({
  machine,
  onPress,
}) => {
  const statusColor = getStatusColor(machine.status);
  const statusLabel = machine.status.replace('_', ' ').toUpperCase();

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.leftSection}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <View style={styles.info}>
          <Text style={styles.name}>{machine.name}</Text>
          <Text style={styles.id}>{machine.machine_id}</Text>
          {machine.chc && <Text style={styles.chc}>{machine.chc.name}</Text>}
        </View>
      </View>
      <View style={styles.rightSection}>
        <Text style={[styles.status, { color: statusColor }]}>
          {statusLabel}
        </Text>
        <Text style={styles.time}>{getTimeAgo(machine.last_active)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  id: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  chc: {
    fontSize: 11,
    color: '#9ca3af',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  status: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  time: {
    fontSize: 10,
    color: '#9ca3af',
  },
});
