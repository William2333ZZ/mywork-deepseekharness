/** Small values kept on this phone (the pairing, the theme, folded sections): the app's secure store (kv.web.ts: the browser's). */
import * as SecureStore from 'expo-secure-store'

export const kvGet = (key: string): Promise<string | null> => SecureStore.getItemAsync(key)
export const kvSet = (key: string, value: string): Promise<void> => SecureStore.setItemAsync(key, value)
export const kvDel = (key: string): Promise<void> => SecureStore.deleteItemAsync(key)
