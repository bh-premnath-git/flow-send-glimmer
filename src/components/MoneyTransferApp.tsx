import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Layer, Map, Marker, Source } from 'react-map-gl/maplibre';
import type { ViewState } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================
interface TransferHistoryEntry {
  id: string;
  fromCountry: string;
  toCountry: string;
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  status: 'active' | 'pending' | 'completed';
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

interface TransferData {
  fromCountry: string;
  toCountry: string;
  amount: number;
  fromCurrency: string;
  toCurrency: string;
}

type MapViewState = Pick<ViewState, 'longitude' | 'latitude' | 'zoom' | 'bearing' | 'pitch' | 'padding'>;

// =============================================================================
// CONSTANTS & CONFIGURATION
// =============================================================================
const STATUS_PRIORITY: Record<TransferHistoryEntry['status'], number> = {
  active: 0,
  pending: 1,
  completed: 2,
};

const STATUS_COLORS: Record<TransferHistoryEntry['status'], string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  completed: 'bg-slate-200 text-slate-600 dark:bg-slate-600/40 dark:text-slate-200',
};

const GRADIENT_EPSILON = 0.001;
const ANIMATION_SPEED = 0.0004;

const DEFAULT_VIEW_STATE: MapViewState = {
  longitude: 0,
  latitude: 0,
  zoom: 1,
  bearing: 0,
  pitch: 0,
  padding: { top: 0, bottom: 0, left: 0, right: 0 },
};

// =============================================================================
// MOCK DATA & UTILITIES
// =============================================================================
const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  US: [-95.7129, 37.0902],
  UK: [-3.4360, 55.3781],
  DE: [10.4515, 51.1657],
  FR: [2.2137, 46.2276],
  IN: [78.9629, 20.5937],
  MX: [-102.5528, 23.6345],
  CA: [-106.3468, 56.1304],
  SG: [103.8198, 1.3521],
  AU: [133.7751, -25.2744],
};

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  UK: 'United Kingdom',
  DE: 'Germany',
  FR: 'France',
  IN: 'India',
  MX: 'Mexico',
  CA: 'Canada',
  SG: 'Singapore',
  AU: 'Australia',
};

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'MXN', name: 'Mexican Peso' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
];

const getCountryCoordinates = (countryCode: string) => COUNTRY_COORDINATES[countryCode];
const getCountryName = (countryCode: string) => COUNTRY_NAMES[countryCode] || countryCode;
const getExchangeRate = (fromCurrency: string, toCurrency: string) => 1.2;

const now = Date.now();
const INITIAL_TRANSFERS: TransferHistoryEntry[] = [
  {
    id: 'trf-001',
    fromCountry: 'UK',
    toCountry: 'IN',
    amount: 1200,
    fromCurrency: 'GBP',
    toCurrency: 'INR',
    status: 'active',
    createdAt: now - 1000 * 60 * 35,
    updatedAt: now - 1000 * 60 * 2,
  },
  {
    id: 'trf-002',
    fromCountry: 'US',
    toCountry: 'MX',
    amount: 850,
    fromCurrency: 'USD',
    toCurrency: 'MXN',
    status: 'pending',
    createdAt: now - 1000 * 60 * 90,
    updatedAt: now - 1000 * 60 * 20,
  },
  {
    id: 'trf-003',
    fromCountry: 'DE',
    toCountry: 'FR',
    amount: 430,
    fromCurrency: 'EUR',
    toCurrency: 'EUR',
    status: 'completed',
    createdAt: now - 1000 * 60 * 480,
    updatedAt: now - 1000 * 60 * 320,
    completedAt: now - 1000 * 60 * 300,
  },
  {
    id: 'trf-004',
    fromCountry: 'CA',
    toCountry: 'US',
    amount: 2100,
    fromCurrency: 'CAD',
    toCurrency: 'USD',
    status: 'completed',
    createdAt: now - 1000 * 60 * 720,
    updatedAt: now - 1000 * 60 * 150,
    completedAt: now - 1000 * 60 * 140,
  },
  {
    id: 'trf-005',
    fromCountry: 'SG',
    toCountry: 'AU',
    amount: 560,
    fromCurrency: 'SGD',
    toCurrency: 'AUD',
    status: 'completed',
    createdAt: now - 1000 * 60 * 1440,
    updatedAt: now - 1000 * 60 * 600,
    completedAt: now - 1000 * 60 * 590,
  },
];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

const formatRelativeTime = (timestamp: number) => {
  const minutesAgo = Math.max(1, Math.round((Date.now() - timestamp) / (1000 * 60)));
  if (minutesAgo < 60) {
    return `${minutesAgo} min ago`;
  }
  const hoursAgo = Math.round(minutesAgo / 60);
  if (hoursAgo < 24) {
    return `${hoursAgo} hr${hoursAgo > 1 ? 's' : ''} ago`;
  }
  const daysAgo = Math.round(hoursAgo / 24);
  return `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
};

const normalizeViewState = (prev: MapViewState, next: ViewState): MapViewState => ({
  ...prev,
  longitude: next.longitude ?? prev.longitude,
  latitude: next.latitude ?? prev.latitude,
  zoom: next.zoom ?? prev.zoom,
  bearing: next.bearing ?? prev.bearing,
  pitch: next.pitch ?? prev.pitch,
  padding: next.padding ?? prev.padding,
});

const areViewStatesEqual = (a: MapViewState, b: MapViewState) => {
  const eq = (x: number, y: number, eps: number) => Math.abs(x - y) <= eps;
  return (
    eq(a.longitude, b.longitude, 1e-6) &&
    eq(a.latitude, b.latitude, 1e-6) &&
    eq(a.zoom, b.zoom, 1e-3) &&
    eq(a.bearing ?? 0, b.bearing ?? 0, 1e-3) &&
    eq(a.pitch ?? 0, b.pitch ?? 0, 1e-3)
  );
};

const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

const interpolateLngLat = (from: [number, number], to: [number, number], t: number): [number, number] => [
  lerp(from[0], to[0], t),
  lerp(from[1], to[1], t),
];

// =============================================================================
// TRANSFER FORM COMPONENT
// =============================================================================
interface TransferFormProps {
  onTransferSubmit: (transfer: TransferData) => void;
  isTransferring: boolean;
}

const TransferForm: React.FC<TransferFormProps> = ({ onTransferSubmit, isTransferring }) => {
  const [formData, setFormData] = useState<TransferData>({
    fromCountry: 'US',
    toCountry: 'UK',
    amount: 1000,
    fromCurrency: 'USD',
    toCurrency: 'GBP',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTransferring && formData.amount > 0) {
      onTransferSubmit(formData);
    }
  };

  const countries = Object.keys(COUNTRY_COORDINATES);

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">From Country</label>
            <select
              value={formData.fromCountry}
              onChange={(e) => setFormData(prev => ({ ...prev, fromCountry: e.target.value }))}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
            >
              {countries.map(code => (
                <option key={code} value={code} className="bg-slate-800 text-white">
                  {getCountryName(code)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">To Country</label>
            <select
              value={formData.toCountry}
              onChange={(e) => setFormData(prev => ({ ...prev, toCountry: e.target.value }))}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
            >
              {countries.map(code => (
                <option key={code} value={code} className="bg-slate-800 text-white">
                  {getCountryName(code)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Amount</label>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
            className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
            min="1"
            step="0.01"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">From Currency</label>
            <select
              value={formData.fromCurrency}
              onChange={(e) => setFormData(prev => ({ ...prev, fromCurrency: e.target.value }))}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
            >
              {CURRENCIES.map(currency => (
                <option key={currency.code} value={currency.code} className="bg-slate-800 text-white">
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">To Currency</label>
            <select
              value={formData.toCurrency}
              onChange={(e) => setFormData(prev => ({ ...prev, toCurrency: e.target.value }))}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none"
            >
              {CURRENCIES.map(currency => (
                <option key={currency.code} value={currency.code} className="bg-slate-800 text-white">
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isTransferring || formData.amount <= 0}
        className="w-full rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white transition-all hover:from-sky-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isTransferring ? 'Processing...' : 'Start Transfer'}
      </button>
    </div>
  );
};

// =============================================================================
// STATS CARDS COMPONENT
// =============================================================================
interface StatsCardsProps {
  activeTransfer: TransferHistoryEntry | null;
  totalVolume: number;
  pendingVolume: number;
}

const StatsCards: React.FC<StatsCardsProps> = ({ activeTransfer, totalVolume, pendingVolume }) => (
  <section className="grid gap-6 md:grid-cols-3">
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
      <p className="text-sm uppercase tracking-wide text-slate-300">Active transfer</p>
      {activeTransfer ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">
              {activeTransfer.fromCountry} → {activeTransfer.toCountry}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[activeTransfer.status]}`}>
              {activeTransfer.status.toUpperCase()}
            </span>
          </div>
          <p className="text-2xl font-semibold">
            {formatCurrency(activeTransfer.amount, activeTransfer.fromCurrency)}
          </p>
          <p className="text-sm text-slate-300">
            Updated {formatRelativeTime(activeTransfer.updatedAt)} · {activeTransfer.fromCurrency} →{' '}
            {activeTransfer.toCurrency}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-300">No transfers in progress right now.</p>
      )}
    </div>
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
      <p className="text-sm uppercase tracking-wide text-slate-300">Completed today</p>
      <p className="mt-4 text-3xl font-semibold">
        {formatCurrency(totalVolume, 'USD')}
      </p>
      <p className="text-sm text-slate-300">Total volume settled across all corridors</p>
    </div>
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
      <p className="text-sm uppercase tracking-wide text-slate-300">Pending volume</p>
      <p className="mt-4 text-3xl font-semibold">
        {formatCurrency(pendingVolume, 'USD')}
      </p>
      <p className="text-sm text-slate-300">Awaiting confirmation from partner networks</p>
    </div>
  </section>
);

// =============================================================================
// MAP COMPONENT
// =============================================================================
interface MapComponentProps {
  viewState: MapViewState;
  onMove: (event: { viewState: ViewState; originalEvent?: unknown }) => void;
  animatingTransferId: string | null;
  arcGeoJson: any;
  mapLineGradient: any;
  animatingCoordinates: { from: [number, number]; to: [number, number] } | null;
  movingBadgeLngLat: [number, number] | null;
  animatingTransfer: TransferHistoryEntry | null;
  activeCountryLabel: string;
}

const MapComponent: React.FC<MapComponentProps> = ({
  viewState,
  onMove,
  animatingTransferId,
  arcGeoJson,
  mapLineGradient,
  animatingCoordinates,
  movingBadgeLngLat,
  animatingTransfer,
  activeCountryLabel,
}) => {
  const initialViewStateRef = useRef<MapViewState>(DEFAULT_VIEW_STATE);

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent shadow-2xl mx-auto w-11/12 max-w-3xl">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-300">Global corridors</p>
          <h2 className="text-2xl font-semibold">Live map view</h2>
          <p className="text-sm text-slate-300">{activeCountryLabel}</p>
        </div>
        <div className="text-right text-sm text-slate-300">
          <p>Base map: Carto Positron</p>
          <p>Zoom to inspect corridor performance</p>
        </div>
      </div>
      <div className="relative w-full h-[clamp(20rem,50vh,60vh)]">
        <Map
          initialViewState={initialViewStateRef.current as any}
          viewState={viewState as any}
          onMoveEnd={onMove}
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json?key=i0YuPGkp6LqgrBbjaRPx"
          style={{ width: '100%', height: '100%' }}
        >
          {animatingTransferId && arcGeoJson && (
            <Source id="transfer-arc" type="geojson" data={arcGeoJson} lineMetrics>
              <Layer
                id="transfer-arc-layer"
                type="line"
                layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                paint={{
                  'line-width': 6,
                  'line-opacity': 0.9,
                  'line-blur': 0.8,
                  'line-gradient': mapLineGradient as unknown as import('maplibre-gl').ExpressionSpecification,
                }}
              />
            </Source>
          )}

          {animatingCoordinates && (
            <>
              <Marker longitude={animatingCoordinates.from[0]} latitude={animatingCoordinates.from[1]}>
                <div className="relative flex h-6 w-6 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-300" />
                </div>
              </Marker>
              <Marker longitude={animatingCoordinates.to[0]} latitude={animatingCoordinates.to[1]}>
                <div className="relative flex h-6 w-6 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-sky-300" />
                </div>
              </Marker>
            </>
          )}

          {animatingTransferId && movingBadgeLngLat && animatingTransfer && (
            <Marker longitude={movingBadgeLngLat[0]} latitude={movingBadgeLngLat[1]} anchor="center">
              {(() => {
                const rate = getExchangeRate(animatingTransfer.fromCurrency, animatingTransfer.toCurrency);
                const recipientGets = animatingTransfer.amount * rate;
                return (
                  <div className="rounded-xl border border-white/20 bg-slate-900/85 px-3 py-2 text-[11px] font-medium text-white shadow-lg backdrop-blur">
                    <div className="flex items-center gap-2 text-[10px] font-semibold">
                      <span className={`rounded-full px-2 py-0.5 ${STATUS_COLORS['active']}`}>ACTIVE</span>
                    </div>
                    <div className="mt-1 leading-tight whitespace-nowrap">
                      <div>You send {animatingTransfer.amount.toFixed(2)} {animatingTransfer.fromCurrency}</div>
                      <div>Recipient gets {recipientGets.toFixed(2)} {animatingTransfer.toCurrency}</div>
                      <div className="text-slate-300">Exchange rate: 1 {animatingTransfer.fromCurrency} = {rate} {animatingTransfer.toCurrency}</div>
                    </div>
                  </div>
                );
              })()}
            </Marker>
          )}
        </Map>
      </div>
    </section>
  );
};

// =============================================================================
// TRANSFER HISTORY COMPONENT
// =============================================================================
interface TransferHistoryProps {
  sortedHistory: TransferHistoryEntry[];
  animatingTransferId: string | null;
  onHistoryClick: (transferId: string) => void;
}

const TransferHistory: React.FC<TransferHistoryProps> = ({ sortedHistory, animatingTransferId, onHistoryClick }) => (
  <section className="flex flex-1 flex-col rounded-3xl border border-white/10 bg-white/5 shadow-xl backdrop-blur">
    <div className="border-b border-white/10 px-6 py-5">
      <p className="text-sm uppercase tracking-wide text-slate-300">Recent activity</p>
      <h2 className="text-xl font-semibold">Transfer history</h2>
    </div>
    <div className="flex-1 space-y-2 overflow-y-auto px-6 py-4">
      {sortedHistory.map((transfer) => (
        <article
          key={transfer.id}
          onClick={() => onHistoryClick(transfer.id)}
          className={`cursor-pointer rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-4 transition-transform duration-200 hover:-translate-y-1 hover:border-sky-400/50 ${
            transfer.id === animatingTransferId ? 'ring-2 ring-sky-400/60' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-300">{transfer.id}</p>
              <h3 className="text-lg font-semibold">
                {transfer.fromCountry} → {transfer.toCountry}
              </h3>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[transfer.status]}`}>
              {transfer.status.toUpperCase()}
            </span>
          </div>
          <p className="mt-3 text-2xl font-semibold">
            {formatCurrency(transfer.amount, transfer.fromCurrency)}
          </p>
          <p className="mt-1 text-sm text-slate-300">
            {transfer.fromCurrency} → {transfer.toCurrency}
          </p>
          <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">
            Updated {formatRelativeTime(transfer.updatedAt)}
          </p>
        </article>
      ))}
    </div>
  </section>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const MoneyTransferApp: React.FC = () => {
  const [transferHistory, setTransferHistory] = useState<TransferHistoryEntry[]>(INITIAL_TRANSFERS);
  const [animatingTransferId, setAnimatingTransferId] = useState<string | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [isTransferring, setIsTransferring] = useState(false);
  const [viewState, setViewState] = useState<MapViewState>(DEFAULT_VIEW_STATE);
  const isProgrammaticViewChange = useRef(false);

  const setViewStateProgrammatically = useCallback(
    (updater: (prev: MapViewState) => MapViewState) => {
      isProgrammaticViewChange.current = true;
      setViewState((prev) => updater(prev));
      requestAnimationFrame(() => {
        isProgrammaticViewChange.current = false;
      });
    },
    [],
  );

  const handleMove = useCallback((event: { viewState: ViewState; originalEvent?: unknown }) => {
    if (isProgrammaticViewChange.current) return;
    if (!event.originalEvent) return;
    setViewState((prev) => {
      const next = normalizeViewState(prev, event.viewState);
      return areViewStatesEqual(prev, next) ? prev : next;
    });
  }, []);

  const sortedHistory = useMemo(
    () =>
      [...transferHistory].sort(
        (a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status] || b.updatedAt - a.updatedAt,
      ),
    [transferHistory],
  );

  const activeTransfer = useMemo(() => transferHistory.find((transfer) => transfer.status === 'active') ?? null, [
    transferHistory,
  ]);

  const animatingTransfer = useMemo(
    () => transferHistory.find((transfer) => transfer.id === animatingTransferId) ?? activeTransfer ?? null,
    [activeTransfer, animatingTransferId, transferHistory],
  );

  const totalVolume = useMemo(
    () =>
      transferHistory.reduce((sum, transfer) => {
        if (transfer.status === 'completed') {
          return sum + transfer.amount;
        }
        return sum;
      }, 0),
    [transferHistory],
  );

  const pendingVolume = useMemo(
    () =>
      transferHistory.reduce((sum, transfer) => {
        if (transfer.status === 'pending') {
          return sum + transfer.amount;
        }
        return sum;
      }, 0),
    [transferHistory],
  );

  const animatingCoordinates = useMemo(() => {
    if (!animatingTransfer) {
      return null;
    }

    const from = getCountryCoordinates(animatingTransfer.fromCountry);
    const to = getCountryCoordinates(animatingTransfer.toCountry);

    if (!from || !to) {
      return null;
    }

    return { from, to };
  }, [animatingTransfer]);

  const arcGeoJson = useMemo(() => {
    if (!animatingTransfer || !animatingCoordinates) {
      return null;
    }

    return {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          properties: {
            id: animatingTransfer.id,
            status: animatingTransfer.status,
          },
          geometry: {
            type: 'LineString' as const,
            coordinates: [animatingCoordinates.from, animatingCoordinates.to],
          },
        },
      ],
    };
  }, [animatingCoordinates, animatingTransfer]);

  const mapLineGradient = useMemo(() => {
    const lowerStop = Math.max(animationProgress - 0.2, 0);
    const middleStop = Math.max(animationProgress, lowerStop + GRADIENT_EPSILON);
    const upperStop = Math.min(animationProgress + 0.2, 1);

    return [
      'interpolate',
      ['linear'],
      ['line-progress'],
      lowerStop,
      'rgba(56,189,248,0)',
      middleStop,
      'rgba(16,185,129,0.9)',
      upperStop,
      'rgba(56,189,248,0)',
    ];
  }, [animationProgress]);

  const movingBadgeLngLat = useMemo(() => {
    if (!animatingCoordinates) {
      return null;
    }

    const clampedProgress = Math.min(Math.max(animationProgress, 0), 1);
    return interpolateLngLat(animatingCoordinates.from, animatingCoordinates.to, clampedProgress);
  }, [animatingCoordinates, animationProgress]);

  const activeCountryLabel = useMemo(() => {
    if (!animatingTransfer) {
      return 'No active corridor';
    }

    return `${getCountryName(animatingTransfer.fromCountry)} → ${getCountryName(animatingTransfer.toCountry)}`;
  }, [animatingTransfer]);

  // Animation effect
  useEffect(() => {
    if (!animatingTransferId) {
      return;
    }

    setAnimationProgress(GRADIENT_EPSILON);

    let frameId = 0;
    let lastTimestamp: number | null = null;
    let done = false;

    const finishTransfer = () => {
      if (done) {
        return;
      }
      done = true;
      cancelAnimationFrame(frameId);

      const completionTime = Date.now();
      let nextAnimatingId: string | null = null;
      let didComplete = false;

      setTransferHistory((prev) => {
        const updated = prev.map<TransferHistoryEntry>((entry) => {
          if (entry.id === animatingTransferId && entry.status === 'active') {
            didComplete = true;
            return {
              ...entry,
              status: 'completed' as const,
              updatedAt: completionTime,
              completedAt: completionTime,
            };
          }
          return entry;
        });

        if (didComplete) {
          nextAnimatingId = updated.find((entry) => entry.status === 'active')?.id ?? null;
        }

        return updated;
      });

      setAnimationProgress(1);

      if (didComplete) {
        setAnimatingTransferId(nextAnimatingId);
      } else {
        setAnimatingTransferId((current) => (current === animatingTransferId ? null : current));
      }
    };

    const animate = (timestamp: number) => {
      if (done) {
        return;
      }

      if (lastTimestamp === null) {
        lastTimestamp = timestamp;
      }

      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      let reachedEnd = false;
      setAnimationProgress((prev) => {
        const next = Math.min(1, prev + delta * ANIMATION_SPEED);
        if (next >= 1) {
          reachedEnd = true;
        }
        return next;
      });

      if (reachedEnd) {
        finishTransfer();
        return;
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      done = true;
      cancelAnimationFrame(frameId);
    };
  }, [animatingTransferId, setAnimatingTransferId, setTransferHistory]);

  // Camera positioning effect
  useEffect(() => {
    if (!animatingCoordinates) {
      return;
    }

    const [fromLon, fromLat] = animatingCoordinates.from;
    const [toLon, toLat] = animatingCoordinates.to;

    const centerLon = (fromLon + toLon) / 2;
    const centerLat = (fromLat + toLat) / 2;
    const lonDistance = Math.abs(fromLon - toLon);
    const latDistance = Math.abs(fromLat - toLat);
    const maxDistance = Math.max(lonDistance, latDistance);
    const zoom = Math.max(1, 4 - maxDistance / 40);

    setViewStateProgrammatically((prev) => {
      const next: MapViewState = {
        ...prev,
        longitude: centerLon,
        latitude: centerLat,
        zoom,
      };
      return areViewStatesEqual(prev, next) ? prev : next;
    });
  }, [animatingCoordinates, setViewStateProgrammatically]);

  const handleTransferSubmit = useCallback(
    (transfer: TransferData) => {
      if (isTransferring) {
        return;
      }

      setIsTransferring(true);

      const nowTimestamp = Date.now();
      const newTransferId = `trf-${Math.random().toString(36).slice(2, 8)}`;

      setTransferHistory((prev) => {
        const updatedHistory = prev.map<TransferHistoryEntry>((entry) =>
          entry.status === 'active'
            ? {
                ...entry,
                status: 'completed' as const,
                updatedAt: nowTimestamp,
                completedAt: nowTimestamp,
              }
            : entry,
        );

        const newEntry: TransferHistoryEntry = {
          id: newTransferId,
          fromCountry: transfer.fromCountry,
          toCountry: transfer.toCountry,
          amount: transfer.amount,
          fromCurrency: transfer.fromCurrency,
          toCurrency: transfer.toCurrency,
          status: 'active' as const,
          createdAt: nowTimestamp,
          updatedAt: nowTimestamp,
        };

        return [newEntry, ...updatedHistory];
      });

      setAnimationProgress(GRADIENT_EPSILON);
      setAnimatingTransferId(newTransferId);

      setTimeout(() => {
        setIsTransferring(false);
      }, 450);
    },
    [isTransferring],
  );

  const handleHistoryClick = useCallback((transferId: string) => {
    setAnimatingTransferId(transferId);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-10 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3">
          <p className="text-sm font-medium uppercase tracking-widest text-sky-400">FlowSend</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Global transfer overview</h1>
          <p className="max-w-3xl text-base text-slate-300">
            Monitor live payment activity, track cross-border transfers, and keep an eye on the geographies that
            matter most to your business.
          </p>
        </header>

        <StatsCards 
          activeTransfer={activeTransfer}
          totalVolume={totalVolume}
          pendingVolume={pendingVolume}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <MapComponent
            viewState={viewState}
            onMove={handleMove}
            animatingTransferId={animatingTransferId}
            arcGeoJson={arcGeoJson}
            mapLineGradient={mapLineGradient}
            animatingCoordinates={animatingCoordinates}
            movingBadgeLngLat={movingBadgeLngLat}
            animatingTransfer={animatingTransfer}
            activeCountryLabel={activeCountryLabel}
          />

          <div className="flex flex-col gap-6">
            <section className="rounded-3xl border border-white/10 bg-white/5 shadow-xl backdrop-blur">
              <div className="border-b border-white/10 px-6 py-5">
                <p className="text-sm uppercase tracking-wide text-slate-300">Initiate transfer</p>
                <h2 className="text-xl font-semibold">Send money</h2>
              </div>
              <div className="px-6 py-5">
                <TransferForm onTransferSubmit={handleTransferSubmit} isTransferring={isTransferring} />
              </div>
            </section>

            <TransferHistory
              sortedHistory={sortedHistory}
              animatingTransferId={animatingTransferId}
              onHistoryClick={handleHistoryClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoneyTransferApp;