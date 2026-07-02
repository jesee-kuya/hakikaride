import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

type Point = { latitude: number; longitude: number; recordedAt: string };

const INTERVAL_MS = 20000;

export function useLocationSharing(onSend: (latitude: number, longitude: number) => Promise<void>) {
  const [sharing, setSharing] = useState(false);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const sendOnce = useCallback(async () => {
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      await onSend(pos.coords.latitude, pos.coords.longitude);
      setLastPoint({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        recordedAt: new Date().toISOString(),
      });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send location');
    }
  }, [onSend]);

  const start = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setError('Location permission denied.');
      return;
    }
    setSharing(true);
    await sendOnce();
    timer.current = setInterval(sendOnce, INTERVAL_MS);
  }, [sendOnce]);

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setSharing(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  return { sharing, lastPoint, error, start, stop };
}
