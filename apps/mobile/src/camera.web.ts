/**
 * The web version has no in-page scanner: the phone's own camera opens the pairing code as this page's address. Not
 * importing expo-camera here also keeps its web QR worker (a blob script the page's CSP refuses) out of the bundle.
 */
import type { ComponentType } from 'react'
import type { CameraViewProps, PermissionResponse } from 'expo-camera'

export const CameraView: ComponentType<CameraViewProps> = () => null
export function useCameraPermissions(): [PermissionResponse | null, () => Promise<PermissionResponse>] {
  return [null, async () => ({ granted: false, canAskAgain: false, expires: 'never', status: 'denied' } as PermissionResponse)]
}
