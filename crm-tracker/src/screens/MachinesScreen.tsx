import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../services/supabase';
import { MachineListItem } from '../components/MachineListItem';
import { Machine } from '../types';
import { getTimeAgo } from '../utils/helpers';

export const MachinesScreen = () => {
  const {
    machines,
    searchQuery,
    statusFilter,
    selectedMachine,
    setMachines,
    setSearchQuery,
    setStatusFilter,
    setSelectedMachine,
  } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);

  const fetchMachines = async () => {
    try {
      const { data, error } = await supabase
        .from('machines')
        .select('*, chc:chc_centers(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setMachines(data as Machine[]);
    } catch (error) {
      console.error('Error fetching machines:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMachines();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  const filteredMachines = machines.filter((machine) => {
    const matchesSearch =
      machine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      machine.machine_id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      statusFilter === 'all' || machine.status === statusFilter;

    return matchesSearch && matchesFilter;
  });

  const handleMachinePress = (machine: Machine) => {
    setSelectedMachine(machine);
    setDetailsVisible(true);
  };

  const closeDetails = () => {
    setDetailsVisible(false);
    setSelectedMachine(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Machine Fleet</Text>
        <Text style={styles.subtitle}>
          {filteredMachines.length} machines available
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or ID..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        <TouchableOpacity
          style={[
            styles.filterButton,
            statusFilter === 'all' && styles.filterButtonActive,
          ]}
          onPress={() => setStatusFilter('all')}
        >
          <Text
            style={[
              styles.filterText,
              statusFilter === 'all' && styles.filterTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            statusFilter === 'in_use' && styles.filterButtonActive,
          ]}
          onPress={() => setStatusFilter('in_use')}
        >
          <Text
            style={[
              styles.filterText,
              statusFilter === 'in_use' && styles.filterTextActive,
            ]}
          >
            In Use
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            statusFilter === 'idle' && styles.filterButtonActive,
          ]}
          onPress={() => setStatusFilter('idle')}
        >
          <Text
            style={[
              styles.filterText,
              statusFilter === 'idle' && styles.filterTextActive,
            ]}
          >
            Idle
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            statusFilter === 'maintenance' && styles.filterButtonActive,
          ]}
          onPress={() => setStatusFilter('maintenance')}
        >
          <Text
            style={[
              styles.filterText,
              statusFilter === 'maintenance' && styles.filterTextActive,
            ]}
          >
            Maintenance
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <FlatList
        data={filteredMachines}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MachineListItem
            machine={item}
            onPress={() => handleMachinePress(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No machines found</Text>
          </View>
        }
      />

      <Modal
        visible={detailsVisible}
        animationType="slide"
        transparent
        onRequestClose={closeDetails}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Machine Details</Text>
              <TouchableOpacity onPress={closeDetails}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedMachine && (
              <ScrollView style={styles.detailsScroll}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Machine ID</Text>
                  <Text style={styles.detailValue}>
                    {selectedMachine.machine_id}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Name</Text>
                  <Text style={styles.detailValue}>{selectedMachine.name}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <Text style={styles.detailValue}>{selectedMachine.type}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      styles.statusText,
                      { color: selectedMachine.status === 'in_use' ? '#10b981' : selectedMachine.status === 'idle' ? '#f59e0b' : '#ef4444' },
                    ]}
                  >
                    {selectedMachine.status.toUpperCase().replace('_', ' ')}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Fuel Level</Text>
                  <Text style={styles.detailValue}>
                    {selectedMachine.fuel_level}%
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Total Hours</Text>
                  <Text style={styles.detailValue}>
                    {selectedMachine.total_hours} hrs
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Last Active</Text>
                  <Text style={styles.detailValue}>
                    {getTimeAgo(selectedMachine.last_active)}
                  </Text>
                </View>

                {selectedMachine.chc && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Assigned CHC</Text>
                    <Text style={styles.detailValue}>
                      {selectedMachine.chc.name}
                    </Text>
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>
                    {selectedMachine.location_lat.toFixed(4)}°,{' '}
                    {selectedMachine.location_lng.toFixed(4)}°
                  </Text>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#1f2937',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#d1d5db',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
  },
  filtersContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
  },
  filterText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    fontSize: 24,
    color: '#6b7280',
  },
  detailsScroll: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#111827',
  },
  statusText: {
    fontWeight: '600',
  },
});
