# TruckSafe

TruckSafe is a browser-first SIH26007 prototype for real-time truck-to-truck proximity awareness. Every browser session represents a truck. It uses the device GPS as the primary location source, keeps identity masked in the UI, and includes a clearly separated simulation mode for demos without multiple devices.

## What is included

- Premium, mobile-first automotive safety interface
- Explicit GPS consent flow and graceful denied/unavailable states
- Continuous `watchPosition()` tracking with high accuracy requested
- Haversine distance and movement-aware risk estimation
- Accuracy-aware uncertainty handling
- Animated map surface with truck markers, direction, vectors, distance, and risk envelope
- Active truck list, telemetry, profile-ready identity, and warning card
- Simulation mode with approaching, moving-away, and stationary virtual trucks
- Optional Supabase schema and Realtime-ready data model
- No hardware, camera, paid map key, or raw IP exposure required

The built-in map is a lightweight keyless prototype surface so the project runs immediately. It can be replaced with MapLibre/OpenStreetMap or Mapbox without changing the risk engine.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. For real GPS, use HTTPS in production or a browser's localhost exception. On a phone, deploy to Vercel or use a secure local tunnel.

## Environment variables

Copy `.env.example` to `.env.local`.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
```

The current prototype does not require any of these values to boot. Supabase values are placeholders for wiring the persistence/realtime adapter; never place a service-role key in the browser.

## Supabase setup

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](./supabase/schema.sql) in the SQL editor.
3. Confirm `trucks` is enabled under Database → Replication.
4. Add the public project URL and anon key to `.env.local`.
5. In production, replace the permissive prototype policies with policies tied to authenticated or short-lived anonymous sessions, and add server-side rate limiting.

Recommended production flow: create a session row, hash any network identifier server-side if needed, upsert a truck heartbeat every 2–5 seconds, subscribe to `trucks` changes, and mark rows offline when `last_seen` exceeds the configured timeout (for example, 15 seconds).

## Demonstrate with multiple phones

1. Open the deployed URL on Phone 1 and choose **Start monitoring**.
2. Allow location and keep the page open. This phone becomes your masked truck ID.
3. Open the same URL on Phone 2, allow location, and repeat.
4. With the Supabase adapter connected, both units appear to all subscribed sessions. Move the phones closer to observe risk changes.

For an immediate judge demo with no second phone, choose **Run simulation** on the landing screen. The three virtual units are labelled `SIMULATION`, move on distinct paths, and remain separate from production GPS mode.

## Testing the risk engine

The prototype calculates Haversine distance, estimated closing speed from heading, and combined GPS uncertainty. Fixed distance bands are used as a baseline, then reduced when units are stationary or moving apart. High uncertainty prevents a confident critical classification. This is a prototype awareness estimate, not a certified collision avoidance system.

```bash
npm run build
```

## Deploy to Vercel

Import the repository into Vercel, keep the default Next.js build settings, add the environment variables, and deploy. Use the HTTPS URL for mobile GPS. If replacing the built-in map, add the selected provider token as a Vercel environment variable.

## Structure

```text
app/                 Next.js route, responsive UI, global styling
lib/risk.ts          Distance, bearing, closing-speed, and risk engine
lib/device.ts        Persistent masked truck identity helpers
supabase/schema.sql  Realtime-ready trucks table and prototype policies
```

The application intentionally keeps raw IP addresses out of the client and does not display device fingerprints to other trucks.
