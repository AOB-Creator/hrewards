import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HotelApi } from './api';
import { HttpApi } from './httpApi';
import { MockApi } from './mockApi';
import { useSettings } from '@/store/settings';

const baseUrl = process.env.EXPO_PUBLIC_API_URL;

/** Production backend when EXPO_PUBLIC_API_URL is set, otherwise the on-device demo backend. */
export const api: HotelApi = baseUrl
  ? new HttpApi(baseUrl, () => useSettings.getState().locale)
  : new MockApi(AsyncStorage);

export const isDemoBackend = !baseUrl;
export * from './api';
