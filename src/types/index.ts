export type MachineStatus = 'in_use' | 'idle' | 'maintenance';
export type MachineType = 'Tractor' | 'Harvester' | 'Baler' | 'Seeder' | 'Plough';
export type AlertType = 'error' | 'warning';

export interface CHCCenter {
  id: string;
  name: string;
  location_lat: number;
  location_lng: number;
  created_at: string;
}

export interface Machine {
  id: string;
  machine_id: string;
  name: string;
  type: MachineType;
  status: MachineStatus;
  fuel_level: number;
  total_hours: number;
  location_lat: number;
  location_lng: number;
  chc_id: string;
  last_active: string;
  created_at: string;
  updated_at: string;
  chc?: CHCCenter;
}

export interface Alert {
  id: string;
  machine_id: string;
  type: AlertType;
  message: string;
  is_read: boolean;
  created_at: string;
  machine?: Machine;
}

export interface MachineStats {
  total: number;
  in_use: number;
  idle: number;
  maintenance: number;
}

export interface CHCPerformance {
  chc_name: string;
  total_machines: number;
  utilization_percentage: number;
}
