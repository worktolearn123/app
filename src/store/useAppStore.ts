import { create } from 'zustand';
import { Machine, Alert, CHCCenter, MachineStats } from '../types';

interface AppState {
  machines: Machine[];
  alerts: Alert[];
  chcCenters: CHCCenter[];
  selectedMachine: Machine | null;
  searchQuery: string;
  statusFilter: string;
  stats: MachineStats;

  setMachines: (machines: Machine[]) => void;
  setAlerts: (alerts: Alert[]) => void;
  setCHCCenters: (centers: CHCCenter[]) => void;
  setSelectedMachine: (machine: Machine | null) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: string) => void;
  updateMachine: (machine: Machine) => void;
  calculateStats: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  machines: [],
  alerts: [],
  chcCenters: [],
  selectedMachine: null,
  searchQuery: '',
  statusFilter: 'all',
  stats: { total: 0, in_use: 0, idle: 0, maintenance: 0 },

  setMachines: (machines) => {
    set({ machines });
    get().calculateStats();
  },

  setAlerts: (alerts) => set({ alerts }),

  setCHCCenters: (centers) => set({ chcCenters: centers }),

  setSelectedMachine: (machine) => set({ selectedMachine: machine }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setStatusFilter: (filter) => set({ statusFilter: filter }),

  updateMachine: (updatedMachine) => {
    set((state) => ({
      machines: state.machines.map((m) =>
        m.id === updatedMachine.id ? updatedMachine : m
      ),
    }));
    get().calculateStats();
  },

  calculateStats: () => {
    const machines = get().machines;
    const stats: MachineStats = {
      total: machines.length,
      in_use: machines.filter((m) => m.status === 'in_use').length,
      idle: machines.filter((m) => m.status === 'idle').length,
      maintenance: machines.filter((m) => m.status === 'maintenance').length,
    };
    set({ stats });
  },
}));
