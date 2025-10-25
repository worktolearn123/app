import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { MachinesScreen } from './src/screens/MachinesScreen';
import { AlertsScreen } from './src/screens/AlertsScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { StyleSheet, Text, View } from 'react-native';

const Tab = createBottomTabNavigator();

const TabBarIcon = ({ focused, label }: { focused: boolean; label: string }) => {
  const icons: Record<string, string> = {
    Dashboard: '🏠',
    Machines: '🚜',
    Alerts: '🔔',
    Analytics: '📊',
  };

  return (
    <View style={styles.tabIconContainer}>
      <Text style={styles.tabIcon}>{icons[label]}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  );
};

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarShowLabel: false,
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabBarIcon focused={focused} label="Dashboard" />
            ),
          }}
        />
        <Tab.Screen
          name="Machines"
          component={MachinesScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabBarIcon focused={focused} label="Machines" />
            ),
          }}
        />
        <Tab.Screen
          name="Alerts"
          component={AlertsScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabBarIcon focused={focused} label="Alerts" />
            ),
          }}
        />
        <Tab.Screen
          name="Analytics"
          component={AnalyticsScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabBarIcon focused={focused} label="Analytics" />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    height: 70,
    paddingBottom: 10,
    paddingTop: 10,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
});
