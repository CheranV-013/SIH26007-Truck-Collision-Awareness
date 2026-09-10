import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Truck } from './risk';

let supabase: SupabaseClient | null = null;
export function getRealtimeClient() {
  if (typeof window === 'undefined') return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return supabase ?? (supabase = createClient(url, key));
}

export function openTruckChannel(onTruck: (truck: Truck) => void) {
  if (typeof window === 'undefined') return () => {};
  const channel = new BroadcastChannel('trucksafe-local');
  const client = getRealtimeClient();
  channel.onmessage = event => onTruck(event.data as Truck);
  const realtime = client?.channel('trucksafe-live').on('broadcast', { event:'truck-update' }, ({payload}) => onTruck(payload as Truck)).subscribe();
  return () => { channel.close(); if (realtime && client) client.removeChannel(realtime); };
}

export function publishTruck(truck: Truck) {
  if (typeof window === 'undefined') return;
  const channel = new BroadcastChannel('trucksafe-local');
  channel.postMessage(truck);
  channel.close();
  const client = getRealtimeClient();
  if (client) void client.channel('trucksafe-live').send({type:'broadcast',event:'truck-update',payload:truck});
}
