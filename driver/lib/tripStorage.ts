import { getJSON, setJSON, remove } from './storage';

export type ActiveTrip = {
  id: string;
  status: string;
  startedAt: string;
  kind: 'private' | 'school';
  label: string;
};

const KEY = 'hakikaride_driver_active_trip';

export const getActiveTrip = () => getJSON<ActiveTrip>(KEY);
export const setActiveTrip = (trip: ActiveTrip) => setJSON(KEY, trip);
export const clearActiveTrip = () => remove(KEY);
