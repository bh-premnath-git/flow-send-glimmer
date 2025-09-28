import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Layer, Map, Marker, Source } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

import type { TransferHistoryEntry } from '../types/transfers';
import TransferForm, { type TransferData } from './TransferForm';
import { getCountryCoordinates, getCountryName } from '../data/countryCoordinates';

const statusPriority: Record<TransferHistoryEntry['status'], number> = {
  active: 0,
  pending: 1,
  completed: 2,
};

const statusColors: Record<TransferHistoryEntry['status'], string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  completed: 'bg-slate-200 text-slate-600 dark:bg-slate-600/40 dark:text-slate-200',
};

const now = Date.now();

const initialTransfers: TransferHistoryEntry[] = [
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

const defaultViewState = {
  longitude: 0,
  latitude: 0,
  zoom: 1,
  bearing: 0,
  pitch: 0,
  padding: { top: 0, bottom: 0, left: 0, right: 0 },
};

const MoneyTransferApp: React.FC = () => {
  const [transferHistory, setTransferHistory] = useState<TransferHistoryEntry[]>(initialTransfers);
  const [animatingTransferId, setAnimatingTransferId] = useState<string | null>(() => {
    const firstActive = initialTransfers.find((transfer) => transfer.status === 'active');
    return firstActive?.id ?? initialTransfers[0]?.id ?? null;
  });
  const [animationProgress, setAnimationProgress] = useState(0);
  const [isTransferring, setIsTransferring] = useState(false);
  const [viewState, setViewState] = useState(defaultViewState);
  const initialViewStateRef = useRef(defaultViewState);

  const sortedHistory = useMemo(
    () =>
      [...transferHistory].sort(
        (a, b) => statusPriority[a.status] - statusPriority[b.status] || b.updatedAt - a.updatedAt,
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

  useEffect(() => {
    if (!animatingTransferId) {
      return;
    }

    let frameId: number;
    let lastTimestamp: number | null = null;

    const animate = (timestamp: number) => {
      if (lastTimestamp === null) {
        lastTimestamp = timestamp;
      }

      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      setAnimationProgress((prev) => {
        const progress = prev + delta * 0.0004;
        if (progress > 1) {
          return progress - 1;
        }
        return progress;
      });

      frameId = requestAnimationFrame(animate);
    };

    setAnimationProgress(0);
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [animatingTransferId]);

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

    setViewState((prev) => ({
      ...prev,
      longitude: centerLon,
      latitude: centerLat,
      zoom,
      bearing: prev.bearing,
      pitch: prev.pitch,
      padding: prev.padding,
    }));
  }, [animatingCoordinates]);

  const handleTransferSubmit = useCallback(
    (transfer: TransferData) => {
      if (isTransferring) {
        return;
      }

      setIsTransferring(true);

      const nowTimestamp = Date.now();
      const newTransferId = `trf-${Math.random().toString(36).slice(2, 8)}`;

      setTransferHistory((prev) => {
        const updatedHistory = prev.map((entry) =>
          entry.status === 'active'
            ? {
                ...entry,
                status: 'completed' as TransferHistoryEntry['status'],
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
          status: 'active',
          createdAt: nowTimestamp,
          updatedAt: nowTimestamp,
        };

        return [newEntry, ...updatedHistory];
      });

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

  const mapLineGradient = useMemo(
    () => [
      'interpolate',
      ['linear'],
      ['line-progress'],
      Math.max(animationProgress - 0.2, 0),
      'rgba(56,189,248,0)',
      animationProgress,
      'rgba(16,185,129,0.9)',
      Math.min(animationProgress + 0.2, 1),
      'rgba(56,189,248,0)',
    ],
    [animationProgress],
  );

  const activeCountryLabel = useMemo(() => {
    if (!animatingTransfer) {
      return 'No active corridor';
    }

    return `${getCountryName(animatingTransfer.fromCountry)} → ${getCountryName(animatingTransfer.toCountry)}`;
  }, [animatingTransfer]);

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

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
            <p className="text-sm uppercase tracking-wide text-slate-300">Active transfer</p>
            {activeTransfer ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">
                    {activeTransfer.fromCountry} → {activeTransfer.toCountry}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[activeTransfer.status]}`}>
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

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent shadow-2xl">
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
            <div className="relative h-[28rem] w-full">
              <Map
                initialViewState={initialViewStateRef.current}
                viewState={viewState}
                onMove={(event) => {
                  const vs = event.viewState;
                  setViewState({
                    longitude: vs.longitude,
                    latitude: vs.latitude,
                    zoom: vs.zoom,
                    bearing: vs.bearing,
                    pitch: vs.pitch,
                    padding: {
                      top: vs.padding?.top ?? 0,
                      bottom: vs.padding?.bottom ?? 0,
                      left: vs.padding?.left ?? 0,
                      right: vs.padding?.right ?? 0,
                    },
                  });
                }}
                mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json?key=i0YuPGkp6LqgrBbjaRPx"
                style={{ width: '100%', height: '100%' }}
              >
                {arcGeoJson && (
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
              </Map>
            </div>
          </section>

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

            <section className="flex flex-1 flex-col rounded-3xl border border-white/10 bg-white/5 shadow-xl backdrop-blur">
              <div className="border-b border-white/10 px-6 py-5">
                <p className="text-sm uppercase tracking-wide text-slate-300">Recent activity</p>
                <h2 className="text-xl font-semibold">Transfer history</h2>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto px-6 py-4">
                {sortedHistory.map((transfer) => (
                  <article
                    key={transfer.id}
                    onClick={() => handleHistoryClick(transfer.id)}
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
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[transfer.status]}`}>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoneyTransferApp;
