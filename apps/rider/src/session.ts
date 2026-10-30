import * as SecureStore from 'expo-secure-store';
import { ApiClient } from '@ride/shared';
export const api = new ApiClient(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000');
const key = 'ridehailing_rider_token';
export async function restoreSession() { const token = await SecureStore.getItemAsync(key); api.setToken(token || undefined); return token }
export async function saveSession(token: string) { await SecureStore.setItemAsync(key, token); api.setToken(token) }
export async function clearSession() { await SecureStore.deleteItemAsync(key); api.setToken(undefined) }
