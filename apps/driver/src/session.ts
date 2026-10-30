import * as SecureStore from 'expo-secure-store';
import { ApiClient } from '@ride/shared';
export const api = new ApiClient(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000');
const key='ridehailing_driver_token';
export async function restoreSession(){const value=await SecureStore.getItemAsync(key);api.setToken(value||undefined);return value}
export async function saveSession(token:string){await SecureStore.setItemAsync(key,token);api.setToken(token)}
export async function clearSession(){await SecureStore.deleteItemAsync(key);api.setToken(undefined)}
