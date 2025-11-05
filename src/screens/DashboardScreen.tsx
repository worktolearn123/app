import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../services/supabase';
import { StatCard } from '../components/StatCard';
import { getStatusColor } from '../utils/helpers';
import { Machine, CHCCenter } from '../types';

const { width } = Dimensions.get('window');

export const DashboardScreen = () => {
  const { machines, chcCenters, stats, setMachines, setCHCCenters, setSelectedMachine } =
    useAppStore();
  const [refreshing, setRefreshing] = useState(false);
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
        <Text style={styles.sectionTitle}>Machine Locations</Text>
        <MapView
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={region}
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
        </MapView>
      </View>

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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    padding: 16,
    paddingBottom: 12,
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
});
