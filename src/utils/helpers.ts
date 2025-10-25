import { formatDistanceToNow } from 'date-fns';
import { Machine } from '../types';

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'in_use':
      return '#10b981';
    case 'idle':
      return '#f59e0b';
    case 'maintenance':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

export const getTimeAgo = (dateString: string): string => {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return 'Unknown';
  }
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const findNearestIdleMachine = (
  machines: Machine[],
  userLat: number,
  userLon: number
): Machine | null => {
  const idleMachines = machines.filter((m) => m.status === 'idle');

  if (idleMachines.length === 0) return null;

  let nearest: Machine | null = null;
  let minDistance = Infinity;

  idleMachines.forEach((machine) => {
    const distance = calculateDistance(
      userLat,
      userLon,
      machine.location_lat,
      machine.location_lng
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearest = machine;
    }
  });

  return nearest;
};
