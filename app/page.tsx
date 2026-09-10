'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowUpRight, ChevronRight, Crosshair, Gauge, LocateFixed, MapPin, Navigation, Radio, ShieldCheck, Siren, Truck as TruckIcon, X } from 'lucide-react';
import { calculateRisk, formatDistance, type RiskLevel, type Truck } from '../lib/risk';
import { createTruckId, getStoredTruckId } from '../lib/device';
import { openTruckChannel, publishTruck } from '../lib/realtime';

type View = 'landing' | 'permission' | 'dashboard';
type GPSState = 'idle' | 'watching' | 'denied' | 'unavailable';

const seedPosition = { lat: 13.0827, lng: 80.2707 };
const initialDemos: Truck[] = [
  { id:'TRUCK-41', lat:13.0839, lng:80.2730, accuracy:8, speed:31, heading:218, lastSeen:Date.now(), status:'ACTIVE', source:'DEMO', driver:'Arjun N.', vehicle:'Heavy hauler' },
  { id:'TRUCK-88', lat:13.0769, lng:80.2678, accuracy:12, speed:44, heading:34, lastSeen:Date.now(), status:'ACTIVE', source:'DEMO', driver:'Meera K.', vehicle:'Container truck' },
  { id:'TRUCK-12', lat:13.0914, lng:80.2838, accuracy:6, speed:0, heading:0, lastSeen:Date.now(), status:'ACTIVE', source:'DEMO', driver:'—', vehicle:'Tipper' },
];

export default function Home() {
  const [view, setView] = useState<View>('landing');
  const [gps, setGps] = useState<GPSState>('idle');
  const [demoMode, setDemoMode] = useState(false);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [driver, setDriver] = useState('');
  const [vehicle, setVehicle] = useState('');
  const watchRef = useRef<number | null>(null);
  const localId = useMemo(() => getStoredTruckId() ?? createTruckId(), []);
  const me = trucks.find(t => t.id === localId) ?? trucks[0];
  const selected = trucks.find(t => t.id === selectedId) ?? trucks[1] ?? me;
  const risk = me && selected && selected.id !== me.id ? calculateRisk(me, selected) : { level:'SAFE' as RiskLevel, distance:0, closingSpeed:0, uncertainty:false, rationale:'Monitoring your local safety envelope' };

  useEffect(() => () => { if (watchRef.current !== null) navigator.geolocation?.clearWatch(watchRef.current); }, []);
  useEffect(() => openTruckChannel(incoming => setTrucks(prev => {
    const without = prev.filter(t => t.id !== incoming.id);
    return [...without, incoming];
  })), []);

  const begin = (withLocation: boolean) => {
    setView('dashboard');
    const mine: Truck = { id:localId, lat:seedPosition.lat, lng:seedPosition.lng, accuracy:18, speed:0, heading:0, lastSeen:Date.now(), status:'ACTIVE', source:'GPS', driver, vehicle:vehicle || 'Heavy vehicle' };
    setTrucks([mine]);
    if (!withLocation || !('geolocation' in navigator)) { setGps('unavailable'); return; }
    setGps('watching');
    watchRef.current = navigator.geolocation.watchPosition(pos => {
      const c = pos.coords;
      setGps('watching');
      const updated = {...mine, lat:c.latitude, lng:c.longitude, accuracy:c.accuracy, speed:c.speed ? c.speed * 3.6 : 0, heading:c.heading ?? mine.heading, lastSeen:Date.now(), status:'ACTIVE' as const};
      setTrucks(prev => prev.map(t => t.id === localId ? updated : t));
      publishTruck(updated);
    }, err => setGps(err.code === 1 ? 'denied' : 'unavailable'), { enableHighAccuracy:true, maximumAge:2000, timeout:10000 });
  };

  const startDemo = () => { begin(false); setDemoMode(true); setTrucks([{...initialDemos[0], id:localId, source:'GPS'}, ...initialDemos.slice(1)]); setSelectedId(initialDemos[0].id); };
  useEffect(() => {
    if (!demoMode || view !== 'dashboard') return;
    const timer = setInterval(() => setTrucks(prev => { const next = prev.map((t, i) => i === 0 ? t : {...t, lat:t.lat + (i === 1 ? -0.00013 : 0.00004), lng:t.lng + (i === 1 ? -0.00007 : -0.00002), heading:i === 1 ? 215 : 20, lastSeen:Date.now()}); next.slice(1).forEach(publishTruck); return next; }), 1000);
    return () => clearInterval(timer);
  }, [demoMode, view]);

  if (view === 'landing') return <Landing onStart={() => setView('permission')} onDemo={startDemo} />;
  if (view === 'permission') return <Permission onAllow={() => begin(true)} onContinue={() => begin(false)} />;
  return <Dashboard trucks={trucks} me={me} selected={selected} selectedId={selectedId} setSelectedId={setSelectedId} risk={risk} gps={gps} demoMode={demoMode} setDemoMode={setDemoMode} onProfile={() => setProfileOpen(true)} onBack={() => setView('landing')} />;
}

function Landing({onStart,onDemo}:{onStart:()=>void;onDemo:()=>void}) { return <main className="landing"><div className="topbar"><div className="brand"><span className="brand-mark">TS</span><span>TRUCKSAFE</span></div><div className="eyebrow">SIH26007 / FIELD PROTOTYPE</div></div><div className="landing-grid"><div className="hero-copy"><div className="status-line"><span className="pulse"/> LIVE PROXIMITY INTELLIGENCE</div><h1>See the road.<br/><em>Before danger.</em></h1><p>Real-time proximity intelligence for connected heavy vehicles. A browser-first safety layer for every truck, every route.</p><div className="hero-actions"><button className="primary-btn" onClick={onStart}>START MONITORING <ArrowUpRight size={16}/></button><button className="text-btn" onClick={onDemo}>RUN SIMULATION <ChevronRight size={16}/></button></div><div className="hero-meta"><span><ShieldCheck size={15}/> Hardware-free prototype</span><span><LocateFixed size={15}/> Browser GPS</span></div></div><TruckVisual large/><div className="landing-foot"><span>01 / CONNECT</span><span>02 / UNDERSTAND</span><span>03 / RESPOND</span><span className="foot-right">LOCATION DATA STAYS MINIMAL <span className="dot"/></span></div></div></main> }

function Permission({onAllow,onContinue}:{onAllow:()=>void;onContinue:()=>void}) { return <main className="permission"><div className="permission-card"><div className="permission-icon"><Crosshair size={30}/></div><div className="eyebrow">SAFETY SYSTEM / STEP 01</div><h2>Location access<br/><em>required.</em></h2><p>Your GPS location is used only to detect nearby trucks and provide real-time collision awareness. Other drivers see your masked truck ID — never your device or IP.</p><div className="permission-actions"><button className="primary-btn" onClick={onAllow}>ALLOW LOCATION <LocateFixed size={16}/></button><button className="secondary-btn" onClick={onContinue}>CONTINUE WITHOUT LOCATION</button></div><div className="privacy-note"><ShieldCheck size={15}/> You can revoke access at any time in browser settings.</div></div></main> }

function Dashboard({trucks,me,selected,selectedId,setSelectedId,risk,gps,demoMode,setDemoMode,onProfile,onBack}:{trucks:Truck[];me?:Truck;selected?:Truck;selectedId:string|null;setSelectedId:(id:string)=>void;risk:{level:RiskLevel;distance:number;closingSpeed:number;uncertainty:boolean;rationale:string};gps:GPSState;demoMode:boolean;setDemoMode:(v:boolean)=>void;onProfile:()=>void;onBack:()=>void}) {
  const nearby = trucks.filter(t => t.id !== me?.id).map(t => ({truck:t, risk:me ? calculateRisk(me,t) : null}));
  return <main className="dashboard"><header className="dash-header"><button className="brand mini" onClick={onBack}><span className="brand-mark">TS</span><span>TRUCKSAFE</span></button><div className="header-center"><span className="live-dot"/> NETWORK LIVE <span className="muted">/ {trucks.length} ACTIVE UNITS</span></div><div className="header-actions"><button className="icon-btn" onClick={onProfile}><span className="avatar">{me?.id.slice(-2)}</span><span className="hide-mobile">{me?.id}</span></button><button className="status-chip" onClick={()=>setDemoMode(!demoMode)}><span className={demoMode?'amber-dot':'green-dot'}/>{demoMode?'SIMULATION':'GPS '+(gps==='watching'?'ACTIVE':gps.toUpperCase())}</button></div></header><div className="dash-layout"><section className="map-wrap"><MapSurface trucks={trucks} me={me} selected={selected} onSelect={setSelectedId} risk={risk}/><div className="map-toolbar"><button className="toolbar-btn"><MapPin size={14}/> CHENNAI SECTOR</button><button className="toolbar-btn"><Navigation size={14}/> CENTER ON ME</button></div><div className="map-legend"><span><i className="legend-dot me-dot"/> YOUR VEHICLE</span><span><i className="legend-dot"/> ACTIVE UNITS</span><span><i className="legend-line"/> PROXIMITY VECTOR</span></div></section><aside className="side-panel"><div className="panel-intro"><div><div className="eyebrow">OPERATIONS / OVERVIEW</div><h2>Awareness<br/><em>dashboard.</em></h2></div><div className="signal-bars"><i/><i/><i/><i/></div></div><div className="metrics"><Metric label="ACTIVE TRUCKS" value={String(trucks.length).padStart(2,'0')} icon={<Radio size={15}/>}/><Metric label="NEARBY UNITS" value={String(nearby.length).padStart(2,'0')} icon={<Crosshair size={15}/>}/><Metric label="YOUR SPEED" value={`${Math.round(me?.speed ?? 0)} km/h`} icon={<Gauge size={15}/>}/><Metric label="GPS ACCURACY" value={`${Math.round(me?.accuracy ?? 0)} m`} icon={<LocateFixed size={15}/>}/></div><div className="risk-overview"><div className="section-label">CURRENT SAFETY ENVELOPE <span className={`risk-label ${risk.level.toLowerCase()}`}>{risk.level}</span></div><div className={`risk-meter ${risk.level.toLowerCase()}`}><span/><span/><span/><span/><span/></div><p>{risk.uncertainty ? 'GPS uncertainty is high. Maintain extra distance.' : risk.rationale}.</p></div><div className="truck-list"><div className="section-label">ACTIVE UNITS <span>{nearby.length + (me ? 1 : 0)}</span></div>{me && <TruckRow truck={me} risk={{level:'SAFE',distance:0}} isMe onClick={()=>setSelectedId(me.id)}/>} {nearby.map(({truck,risk:r}) => <TruckRow key={truck.id} truck={truck} risk={r!} active={truck.id===selectedId} onClick={()=>setSelectedId(truck.id)}/>)}</div><div className="panel-bottom"><button className="outline-btn" onClick={onProfile}>TRUCK PROFILE <ChevronRight size={15}/></button><span className="system-ok"><span className="green-dot"/> SYSTEM NOMINAL</span></div></aside></div>{risk.level==='HIGH'||risk.level==='CRITICAL' ? <Warning risk={risk} truck={selected} onDismiss={()=>{}}/> : null}</main>
}

function Metric({label,value,icon}:{label:string;value:string;icon:React.ReactNode}) { return <div className="metric"><div className="metric-icon">{icon}</div><div><div className="metric-label">{label}</div><div className="metric-value">{value}</div></div></div> }
function TruckRow({truck,risk,isMe,active,onClick}:{truck:Truck;risk:{level:RiskLevel;distance:number};isMe?:boolean;active?:boolean;onClick:()=>void}) { return <button className={`truck-row ${active?'active':''}`} onClick={onClick}><span className={`row-signal ${risk.level.toLowerCase()}`}/><span className="row-id">{isMe?'YOU / ':''}{truck.id}<small>{truck.source==='DEMO'?'SIMULATION':'ONLINE'} · {Math.round(truck.speed)} km/h</small></span><span className={`row-risk ${risk.level.toLowerCase()}`}>{isMe?'—':risk.level}<small>{isMe?'LOCAL':formatDistance(risk.distance)}</small></span><ChevronRight size={15}/></button> }
function MapSurface({trucks,me,selected,onSelect,risk}:{trucks:Truck[];me?:Truck;selected?:Truck;onSelect:(id:string)=>void;risk:{level:RiskLevel;distance:number}}) { const center=me ?? seedPosition; const points=trucks.map(t=>({...t,x:50+(t.lng-center.lng)*7000,y:50-(t.lat-center.lat)*7000})); return <div className="map-surface"><div className="map-noise"/><div className="road road-a"/><div className="road road-b"/><div className="road road-c"/><div className="map-label label-a">ANNA SALAI</div><div className="map-label label-b">MOUNT ROAD</div><div className="map-label label-c">SECTOR 04 / CHENNAI</div>{selected && selected.id!==me?.id && <><div className={`risk-ring ${risk.level.toLowerCase()}`} style={{left:`${50+(selected.lng-center.lng)*7000}%`,top:`${50-(selected.lat-center.lat)*7000}%`}}/><svg className="vector"><line x1="50%" y1="50%" x2={`${50+(selected.lng-center.lng)*7000}%`} y2={`${50-(selected.lat-center.lat)*7000}%`}/></svg><div className="distance-badge" style={{left:`calc(${50+(selected.lng-center.lng)*3500}% + 8px)`,top:`calc(${50-(selected.lat-center.lat)*3500}% - 18px)`}}>{formatDistance(risk.distance)} <span>{risk.level}</span></div></>}{points.map(t=><button key={t.id} className={`map-marker ${t.id===me?.id?'current':''} ${t.id===selected?.id?'selected':''}`} style={{left:`${Math.max(8,Math.min(92,t.x))}%`,top:`${Math.max(14,Math.min(86,t.y))}%`}} onClick={()=>onSelect(t.id)}><span className="marker-pulse"/><span className="marker-arrow" style={{transform:`rotate(${t.heading}deg)`}}><ArrowDown size={12}/></span><span className="marker-truck"><TruckIcon size={19}/></span><span className="marker-label">{t.id}<small>{t.id===me?.id?'YOU':'ACTIVE'}</small></span></button>)}</div> }
function TruckVisual({large=false}:{large?:boolean}) { return <div className={`truck-visual ${large?'large':''}`}><div className="truck-shadow"/><div className="truck-model"><div className="trailer"><span/><span/><span/></div><div className="cab"><div className="window"/><div className="grille"/><div className="headlight h1"/><div className="headlight h2"/></div><div className="wheel w1"/><div className="wheel w2"/><div className="wheel w3"/></div><div className="truck-caption">TS / HEAVY HAULER <span>01</span></div></div> }
function Warning({risk,truck,onDismiss}:{risk:{level:RiskLevel;distance:number;closingSpeed:number};truck?:Truck;onDismiss:()=>void}) { return <AnimatePresence><motion.div initial={{y:100,opacity:0}} animate={{y:0,opacity:1}} className="warning"><div className="warning-icon"><Siren size={20}/></div><div><div className="warning-kicker">COLLISION RISK / {risk.level}</div><strong>{truck?.id ?? 'NEARBY TRUCK'} <span>· {formatDistance(risk.distance)}</span></strong><p>{risk.closingSpeed>2?'Closing distance elevated. ':'Maintain safe distance. '}Reduce speed and stay alert.</p></div><button onClick={onDismiss}><X size={17}/></button></motion.div></AnimatePresence> }
