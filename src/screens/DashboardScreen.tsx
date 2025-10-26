import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../services/supabase';
import { StatCard } from '../components/StatCard';
import { getStatusColor, findNearestIdleMachine, calculateDistance } from '../utils/helpers';
import { Machine, CHCCenter } from '../types';

const { width } = Dimensions.get('window');

export const DashboardScreen = () => {
  const { machines, chcCenters, stats, setMachines, setCHCCenters, setSelectedMachine } =
    useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [nearestMachine, setNearestMachine] = useState<Machine | null>(null);
  const [showNearestModal, setShowNearestModal] = useState(false);
  const [region, setRegion] = useState({
    latitude: 30.3752,
    longitude: 76.7821,
    latitudeDelta: 0.2,
    longitudeDelta: 0.2,
  });

  const fetchData = async () => {
    try {
      const [machinesRes, chcRes] = await Promise.all([
        supabase
          .from('machines')
          .select('*, chc:chc_centers(*)')
          .order('created_at', { ascending: false }),
        supabase.from('chc_centers').select('*'),
      ]);

      if (machinesRes.data) {
        setMachines(machinesRes.data as Machine[]);
      }
      if (chcRes.data) {
        setCHCCenters(chcRes.data as CHCCenter[]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();

    const machineSubscription = supabase
      .channel('machines_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'machines' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      machineSubscription.unsubscribe();
    };
  }, []);

  const handleMarkerPress = (machine: Machine) => {
    setSelectedMachine(machine);
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to find nearest machines');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  };

  const getUserLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(coords);
      return coords;
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  };

  const findNearestIdle = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    const location = await getUserLocation();
    if (!location) {
      Alert.alert('Error', 'Unable to get your location');
      return;
    }

    const nearest = findNearestIdleMachine(machines, location.latitude, location.longitude);

    if (!nearest) {
      Alert.alert('No Idle Machines', 'There are no idle machines available at the moment');
      return;
    }

    setNearestMachine(nearest);
    setShowNearestModal(true);

    setRegion({
      latitude: nearest.location_lat,
      longitude: nearest.location_lng,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>CRM Machine Tracker</Text>
        <Text style={styles.subtitle}>
          Real-time Monitoring for Crop Residue Management
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <StatCard
          title="Total Machines"
          value={stats.total}
          color="#3b82f6"
          icon="grid"
        />
        <StatCard
          title="In Use"
          value={stats.in_use}
          color="#10b981"
          icon="activity"
        />
      </View>

      <View style={[styles.statsContainer, { marginTop: 8 }]}>
        <StatCard
          title="Idle"
          value={stats.idle}
          color="#f59e0b"
          icon="clock"
        />
        <StatCard
          title="Maintenance"
          value={stats.maintenance}
          color="#ef4444"
          icon="tool"
        />
      </View>

      <View style={styles.mapContainer}>
        <View style={styles.mapHeader}>
          <Text style={styles.sectionTitle}>Machine Locations</Text>
          <TouchableOpacity style={styles.findButton} onPress={findNearestIdle}>
            <Text style={styles.findButtonText}>Find Nearest Idle</Text>
          </TouchableOpacity>
        </View>
        <MapView
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={region}
          region={region}
          onRegionChangeComplete={setRegion}
        >
          {machines.map((machine) => (
            <Marker
              key={machine.id}
              coordinate={{
                latitude: machine.location_lat,
                longitude: machine.location_lng,
              }}
              pinColor={getStatusColor(machine.status)}
              onPress={() => handleMarkerPress(machine)}
              title={machine.name}
              description={`${machine.machine_id} - ${machine.status}`}
            />
          ))}

          {chcCenters.map((chc) => (
            <Marker
              key={chc.id}
              coordinate={{
                latitude: chc.location_lat,
                longitude: chc.location_lng,
              }}
              pinColor="#6366f1"
              title={chc.name}
              description="CHC Center"
            />
          ))}

          {userLocation && (
            <Marker
              coordinate={userLocation}
              pinColor="#2563eb"
              title="Your Location"
            />
          )}
        </MapView>
      </View>

      <Modal
        visible={showNearestModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNearestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nearest Idle Machine</Text>
              <TouchableOpacity onPress={() => setShowNearestModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {nearestMachine && userLocation && (
              <View style={styles.modalBody}>
                <Text style={styles.machineNameText}>{nearestMachine.name}</Text>
                <Text style={styles.machineIdText}>{nearestMachine.machine_id}</Text>

                <View style={styles.distanceContainer}>
                  <Text style={styles.distanceLabel}>Distance:</Text>
                  <Text style={styles.distanceValue}>
                    {calculateDistance(
                      userLocation.latitude,
                      userLocation.longitude,
                      nearestMachine.location_lat,
                      nearestMachine.location_lng
                    ).toFixed(2)} km
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailText}>{nearestMachine.type}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Fuel:</Text>
                  <Text style={styles.detailText}>{nearestMachine.fuel_level}%</Text>
                </View>

                {nearestMachine.chc && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>CHC:</Text>
                    <Text style={styles.detailText}>{nearestMachine.chc.name}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.viewOnMapButton}
                  onPress={() => {
                    setShowNearestModal(false);
                    handleMarkerPress(nearestMachine);
                  }}
                >
                  <Text style={styles.viewOnMapText}>View on Map</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Status Legend:</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText}>In Use</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.legendText}>Idle</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>Maintenance</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#6366f1' }]} />
            <Text style={styles.legendText}>CHC Center</Text>
          </View>
        </View>
      </View>
    </ScrollView>
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  mapContainer: {
    margin: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  findButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  findButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  map: {
    width: width - 32,
    height: 400,
  },
  legendContainer: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
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
    maxHeight: '70%',
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
  modalBody: {
    padding: 20,
  },
  machineNameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  machineIdText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  distanceContainer: {
    backgroundColor: '#dbeafe',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  distanceLabel: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '500',
  },
  distanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  viewOnMapButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  viewOnMapText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
