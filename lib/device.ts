const DEVICE_KEY = 'trucksafe-device-id';
const SESSION_KEY = 'trucksafe-session-id';
const TRUCK_KEY = 'trucksafe-session-truck-id';
function uuid() { return globalThis.crypto.randomUUID(); }
export type DeviceType = 'MOBILE' | 'TABLET' | 'DESKTOP';
export type DeviceMetadata = { deviceId: string; sessionId: string; truckId: string; deviceType: DeviceType; browser: string; ipAddress: string | null };
export function getOrCreateIdentity(): DeviceMetadata {
  if (typeof window === 'undefined') return { deviceId: 'server', sessionId: 'server', truckId: 'TRUCK-LOCAL', deviceType: 'DESKTOP', browser: 'Server', ipAddress: null };
  let deviceId = localStorage.getItem(DEVICE_KEY);
  if (!deviceId) { deviceId = uuid(); localStorage.setItem(DEVICE_KEY, deviceId); }
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) { sessionId = uuid(); sessionStorage.setItem(SESSION_KEY, sessionId); }
  let truckId = sessionStorage.getItem(TRUCK_KEY);
  if (!truckId) { truckId = `TRUCK-${sessionId.replaceAll('-', '').slice(-4).toUpperCase()}`; sessionStorage.setItem(TRUCK_KEY, truckId); }
  return { deviceId, sessionId, truckId, deviceType: detectDeviceType(), browser: detectBrowser(), ipAddress: null };
}
export function detectDeviceType(): DeviceType { const ua = navigator.userAgent.toLowerCase(); return /ipad|tablet|android(?!.*mobile)/.test(ua) ? 'TABLET' : /android|iphone|ipod|mobile/.test(ua) ? 'MOBILE' : 'DESKTOP'; }
export function detectBrowser() { const ua = navigator.userAgent; if (/edg/i.test(ua)) return 'Edge'; if (/chrome|crios/i.test(ua)) return 'Chrome'; if (/firefox|fxios/i.test(ua)) return 'Firefox'; if (/safari/i.test(ua)) return 'Safari'; return 'Browser'; }
export async function getPublicIp() { try { const response = await fetch('https://api64.ipify.org?format=json', { cache: 'no-store' }); if (!response.ok) return null; const data = await response.json() as { ip?: string }; return data.ip ?? null; } catch { return null; } }
