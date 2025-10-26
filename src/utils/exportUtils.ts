import { Machine } from '../types';
import { Alert, Share, Platform } from 'react-native';

export const exportMachinesToCSV = async (machines: Machine[]) => {
  try {
    const headers = 'Machine ID,Name,Type,Status,Fuel Level (%),Total Hours,CHC Center,Last Active\n';

    const rows = machines
      .map((machine) => {
        const chcName = machine.chc?.name || 'N/A';
        const lastActive = new Date(machine.last_active).toLocaleString();
        return `"${machine.machine_id}","${machine.name}","${machine.type}","${machine.status}",${machine.fuel_level},${machine.total_hours},"${chcName}","${lastActive}"`;
      })
      .join('\n');

    const csvContent = headers + rows;

    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const fileName = `crm_machines_${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return { success: true };
    } else {
      await Share.share({
        message: csvContent,
        title: 'CRM Machine Data',
      });
      return { success: true };
    }
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return { success: false, error: 'Failed to export CSV' };
  }
};
