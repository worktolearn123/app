import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../services/supabase';
import { CHCPerformance, MachineType } from '../types';

const { width } = Dimensions.get('window');

export const AnalyticsScreen = () => {
  const { machines, stats } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [chcPerformance, setChcPerformance] = useState<CHCPerformance[]>([]);
  const [typeData, setTypeData] = useState<Record<MachineType, { inUse: number; idle: number }>>({
    Tractor: { inUse: 0, idle: 0 },
    Harvester: { inUse: 0, idle: 0 },
    Baler: { inUse: 0, idle: 0 },
    Seeder: { inUse: 0, idle: 0 },
    Plough: { inUse: 0, idle: 0 },
  });

  const calculateAnalytics = () => {
    const typeStats: Record<MachineType, { inUse: number; idle: number }> = {
      Tractor: { inUse: 0, idle: 0 },
      Harvester: { inUse: 0, idle: 0 },
      Baler: { inUse: 0, idle: 0 },
      Seeder: { inUse: 0, idle: 0 },
      Plough: { inUse: 0, idle: 0 },
    };

    machines.forEach((machine) => {
      if (machine.status === 'in_use') {
        typeStats[machine.type].inUse++;
      } else if (machine.status === 'idle') {
        typeStats[machine.type].idle++;
      }
    });

    setTypeData(typeStats);

    const chcMap = new Map<string, { total: number; inUse: number; name: string }>();

    machines.forEach((machine) => {
      if (machine.chc) {
        const existing = chcMap.get(machine.chc.id) || {
          total: 0,
          inUse: 0,
          name: machine.chc.name,
        };
        existing.total++;
        if (machine.status === 'in_use') {
          existing.inUse++;
        }
        chcMap.set(machine.chc.id, existing);
      }
    });

    const performance: CHCPerformance[] = Array.from(chcMap.values())
      .map((item) => ({
        chc_name: item.name,
        total_machines: item.total,
        utilization_percentage: Math.round((item.inUse / item.total) * 100),
      }))
      .sort((a, b) => b.utilization_percentage - a.utilization_percentage);

    setChcPerformance(performance);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    calculateAnalytics();
    setRefreshing(false);
  };

  useEffect(() => {
    calculateAnalytics();
  }, [machines]);

  const maxValue = Math.max(
    ...Object.values(typeData).map((d) => d.inUse + d.idle),
    1
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Machine utilization insights</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Usage by Type</Text>
        <View style={styles.chartContainer}>
          {(Object.keys(typeData) as MachineType[]).map((type) => {
            const data = typeData[type];
            const total = data.inUse + data.idle;
            const inUseWidth = total > 0 ? (data.inUse / maxValue) * 100 : 0;
            const idleWidth = total > 0 ? (data.idle / maxValue) * 100 : 0;

            return (
              <View key={type} style={styles.chartRow}>
                <Text style={styles.chartLabel}>{type}</Text>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      styles.barInUse,
                      { width: `${inUseWidth}%` },
                    ]}
                  >
                    {data.inUse > 0 && (
                      <Text style={styles.barText}>{data.inUse}</Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.bar,
                      styles.barIdle,
                      { width: `${idleWidth}%` },
                    ]}
                  >
                    {data.idle > 0 && (
                      <Text style={styles.barText}>{data.idle}</Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText}>In Use</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.legendText}>Idle</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CHC Performance</Text>
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>CHC NAME</Text>
            <Text style={styles.tableHeaderText}>MACHINES</Text>
            <Text style={styles.tableHeaderText}>UTILIZATION</Text>
          </View>
          {chcPerformance.map((item, index) => (
            <View
              key={index}
              style={[
                styles.tableRow,
                index % 2 === 0 && styles.tableRowEven,
              ]}
            >
              <Text style={[styles.tableCell, { flex: 2 }]}>
                {item.chc_name}
              </Text>
              <Text style={styles.tableCell}>{item.total_machines}</Text>
              <View style={[styles.tableCell, styles.utilizationCell]}>
                <Text style={styles.utilizationText}>
                  {item.utilization_percentage}%
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${item.utilization_percentage}%` },
                    ]}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overall Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Machines</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#10b981' }]}>
              {stats.total > 0 ? Math.round((stats.in_use / stats.total) * 100) : 0}%
            </Text>
            <Text style={styles.statLabel}>Utilization Rate</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>
              {stats.idle}
            </Text>
            <Text style={styles.statLabel}>Idle Machines</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#ef4444' }]}>
              {stats.maintenance}
            </Text>
            <Text style={styles.statLabel}>Need Maintenance</Text>
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
  section: {
    margin: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
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
    marginBottom: 16,
  },
  chartContainer: {
    marginBottom: 16,
  },
  chartRow: {
    marginBottom: 16,
  },
  chartLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
    fontWeight: '500',
  },
  barContainer: {
    flexDirection: 'row',
    height: 32,
  },
  bar: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  barInUse: {
    backgroundColor: '#10b981',
  },
  barIdle: {
    backgroundColor: '#f59e0b',
  },
  barText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '600',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableRowEven: {
    backgroundColor: '#f9fafb',
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
  },
  utilizationCell: {
    flexDirection: 'column',
  },
  utilizationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  statBox: {
    width: '50%',
    padding: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
});
