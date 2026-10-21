/**
 * iGyan App - Secure Session Token Storage
 *
 * Session tokens live in expo-secure-store (Keychain / Keystore) instead of
 * plaintext AsyncStorage. On first read, any legacy AsyncStorage token is
 * migrated into SecureStore and the plaintext copy is deleted.
 *
 * Requires: `npx expo install expo-secure-store`
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'session_token';

export async function getSessionToken() {
  try {
    const secure = await SecureStore.getItemAsync(KEY);
    if (secure) return secure;
  } catch (_e) {
    // Secure hardware may be unavailable (e.g. some simulators);
    // fall through to the legacy store below.
  }
  // One-way migration path for tokens written before SecureStore existed.
  try {
    const legacy = await AsyncStorage.getItem(KEY);
    if (legacy) {
      await SecureStore.setItemAsync(KEY, legacy);
      await AsyncStorage.removeItem(KEY);
      return legacy;
    }
  } catch (_e) {
    // Both stores failed; caller treats a null token as signed-out.
  }
  return null;
}

export async function setSessionToken(token) {
  await SecureStore.setItemAsync(KEY, token);
  // Never leave a plaintext copy behind.
  await AsyncStorage.removeItem(KEY);
}

export async function removeSessionToken() {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch (_e) {
    // Missing key or locked store: still clear the legacy copy below.
  }
  await AsyncStorage.removeItem(KEY);
}
