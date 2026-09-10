const TRUCK_KEY = 'trucksafe-truck-id';
const SESSION_KEY = 'trucksafe-session-id';
function uuid() { return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
export function getOrCreateIdentity() {
  if (typeof window === 'undefined') return { truckId: 'TRUCK-LOCAL', sessionId: 'LOCAL' };
  let truckId = localStorage.getItem(TRUCK_KEY);
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!truckId) { truckId = `TRUCK-${uuid().replaceAll('-', '').slice(-4).toUpperCase()}`; localStorage.setItem(TRUCK_KEY, truckId); }
  if (!sessionId) { sessionId = uuid(); sessionStorage.setItem(SESSION_KEY, sessionId); }
  return { truckId, sessionId };
}
export function createTruckId() { return getOrCreateIdentity().truckId; }
export function getStoredTruckId() { return typeof window === 'undefined' ? null : localStorage.getItem(TRUCK_KEY); }
