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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../services/supabase';
import { MachineListItem } from '../components/MachineListItem';
import { Machine, CHCCenter, MachineType } from '../types';
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
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [chcCenters, setChcCenters] = useState<CHCCenter[]>([]);
  const [newMachine, setNewMachine] = useState({
    name: '',
    type: 'Tractor' as MachineType,
    status: 'idle' as 'in_use' | 'idle' | 'maintenance',
    fuel_level: 100,
    total_hours: 0,
    location_lat: 30.3752,
    location_lng: 76.7821,
    chc_id: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    fetchCHCCenters();
  }, []);

  const fetchCHCCenters = async () => {
    try {
      const { data, error } = await supabase.from('chc_centers').select('*');
      if (error) throw error;
      if (data) setChcCenters(data);
    } catch (error) {
      console.error('Error fetching CHC centers:', error);
    }
  };

  const generateMachineId = async () => {
    const { data, error } = await supabase
      .from('machines')
      .select('machine_id')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return 'CRM-2024-0001';
    }

    const lastId = data[0].machine_id;
    const match = lastId.match(/CRM-2024-(\d+)/);
    if (match) {
      const nextNum = parseInt(match[1]) + 1;
      return `CRM-2024-${nextNum.toString().padStart(4, '0')}`;
    }
    return 'CRM-2024-0001';
  };

  const handleAddMachine = async () => {
    if (!newMachine.name.trim()) {
      Alert.alert('Error', 'Please enter a machine name');
      return;
    }

    if (!newMachine.chc_id) {
      Alert.alert('Error', 'Please select a CHC center');
      return;
    }

    setIsSubmitting(true);

    try {
      const machineId = await generateMachineId();

      const { error } = await supabase.from('machines').insert([
        {
          machine_id: machineId,
          name: newMachine.name,
          type: newMachine.type,
          status: newMachine.status,
          fuel_level: newMachine.fuel_level,
          total_hours: newMachine.total_hours,
          location_lat: newMachine.location_lat,
          location_lng: newMachine.location_lng,
          chc_id: newMachine.chc_id,
        },
      ]);

      if (error) throw error;

      Alert.alert('Success', 'Machine added successfully');
      setAddModalVisible(false);
      setNewMachine({
        name: '',
        type: 'Tractor',
        status: 'idle',
        fuel_level: 100,
        total_hours: 0,
        location_lat: 30.3752,
        location_lng: 76.7821,
        chc_id: '',
      });
      fetchMachines();
    } catch (error) {
      console.error('Error adding machine:', error);
      Alert.alert('Error', 'Failed to add machine');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <View>
          <Text style={styles.title}>Machine Fleet</Text>
          <Text style={styles.subtitle}>
            {filteredMachines.length} machines available
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setAddModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
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

      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Machine</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailsScroll}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Machine Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Harvester #8"
                  value={newMachine.name}
                  onChangeText={(text) =>
                    setNewMachine({ ...newMachine, name: text })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Machine Type *</Text>
                <View style={styles.pickerContainer}>
                  {(['Tractor', 'Harvester', 'Baler', 'Seeder', 'Plough'] as MachineType[]).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeOption,
                        newMachine.type === type && styles.typeOptionActive,
                      ]}
                      onPress={() =>
                        setNewMachine({ ...newMachine, type })
                      }
                    >
                      <Text
                        style={[
                          styles.typeOptionText,
                          newMachine.type === type && styles.typeOptionTextActive,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>CHC Center *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {chcCenters.map((chc) => (
                    <TouchableOpacity
                      key={chc.id}
                      style={[
                        styles.chcOption,
                        newMachine.chc_id === chc.id && styles.chcOptionActive,
                      ]}
                      onPress={() =>
                        setNewMachine({ ...newMachine, chc_id: chc.id })
                      }
                    >
                      <Text
                        style={[
                          styles.chcOptionText,
                          newMachine.chc_id === chc.id && styles.chcOptionTextActive,
                        ]}
                      >
                        {chc.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Initial Status</Text>
                <View style={styles.statusContainer}>
                  {(['idle', 'in_use', 'maintenance'] as const).map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusOption,
                        newMachine.status === status && styles.statusOptionActive,
                      ]}
                      onPress={() =>
                        setNewMachine({ ...newMachine, status })
                      }
                    >
                      <Text
                        style={[
                          styles.statusOptionText,
                          newMachine.status === status && styles.statusOptionTextActive,
                        ]}
                      >
                        {status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isSubmitting && styles.submitButtonDisabled,
                ]}
                onPress={handleAddMachine}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitButtonText}>Add Machine</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
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
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  typeOption: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  typeOptionActive: {
    backgroundColor: '#3b82f6',
  },
  typeOptionText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  typeOptionTextActive: {
    color: '#ffffff',
  },
  chcOption: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  chcOptionActive: {
    backgroundColor: '#10b981',
  },
  chcOptionText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  chcOptionTextActive: {
    color: '#ffffff',
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  statusOption: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  statusOptionActive: {
    backgroundColor: '#f59e0b',
  },
  statusOptionText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  statusOptionTextActive: {
    color: '#ffffff',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
