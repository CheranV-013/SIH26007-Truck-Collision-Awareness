import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'TruckSafe — Real-time truck awareness', description: 'Proximity intelligence for connected heavy vehicles.' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
