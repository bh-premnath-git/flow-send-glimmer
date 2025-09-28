import React, { useMemo, useState } from 'react';
import { Map } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

import type { TransferHistoryEntry } from '../types/transfers';

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

const MoneyTransferApp: React.FC = () => {
  const [transferHistory] = useState<TransferHistoryEntry[]>(initialTransfers);

  const sortedHistory = useMemo(
    () =>
      [...transferHistory].sort(
        (a, b) => statusPriority[a.status] - statusPriority[b.status] || b.updatedAt - a.updatedAt,
      ),
    [transferHistory],
  );

  const activeTransfer = useMemo(
    () => sortedHistory.find((transfer) => transfer.status === 'active') ?? null,
    [sortedHistory],
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
              </div>
              <div className="text-right text-sm text-slate-300">
                <p>Base map: Carto Positron</p>
                <p>Zoom to inspect corridor performance</p>
              </div>
            </div>
            <div className="relative h-[28rem] w-full">
              <Map
                initialViewState={{ longitude: 0, latitude: 20, zoom: 1.5 }}
                mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </section>

          <section className="flex flex-col rounded-3xl border border-white/10 bg-white/5 shadow-xl backdrop-blur">
            <div className="border-b border-white/10 px-6 py-5">
              <p className="text-sm uppercase tracking-wide text-slate-300">Recent activity</p>
              <h2 className="text-xl font-semibold">Transfer history</h2>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto px-6 py-4">
              {sortedHistory.map((transfer) => (
                <article
                  key={transfer.id}
                  className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-4"
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
  );
};

export default MoneyTransferApp;
