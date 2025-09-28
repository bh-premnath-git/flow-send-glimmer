import React, { useEffect, useMemo, useState } from 'react';
import TransferMap, { COUNTRY_COORDINATES } from './TransferMap';
import type { TransferHistoryEntry } from '../types/transfers';

const ErrorFallback = () => (
  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-background to-card">
    <div className="text-center space-y-4">
      <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
        <div className="text-3xl">🌍</div>
      </div>
      <h3 className="text-xl font-semibold text-foreground">Global Transfer Map</h3>
      <p className="text-muted-foreground max-w-md">
        Your transfer is being processed. The interactive map is temporarily unavailable.
      </p>
    </div>
  </div>
);

interface TransferAnimationProps {
  transferHistory: TransferHistoryEntry[];
}

const TransferAnimation: React.FC<TransferAnimationProps> = ({ transferHistory }) => {
  const [animationStep, setAnimationStep] = useState(0);

  const activeTransfer = useMemo(
    () => transferHistory.find((transfer) => transfer.status === 'active') ?? null,
    [transferHistory],
  );
  const pendingTransfer = useMemo(
    () => transferHistory.find((transfer) => transfer.status === 'pending') ?? null,
    [transferHistory],
  );
  const currentTransfer = activeTransfer ?? pendingTransfer ?? null;

  useEffect(() => {
    if (currentTransfer) {
      setAnimationStep(0);
      const timer1 = setTimeout(() => setAnimationStep(1), 500);
      const timer2 = setTimeout(() => setAnimationStep(2), 1500);
      const timer3 = setTimeout(() => setAnimationStep(3), 3000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }

    setAnimationStep(0);
    return undefined;
  }, [currentTransfer?.id]);

  const latestTransfer = transferHistory[transferHistory.length - 1] ?? null;
  const displayedTransfer = currentTransfer ?? latestTransfer;

  if (!displayedTransfer && transferHistory.length === 0) {
    return <ErrorFallback />;
  }

  const statusAccent: Record<TransferHistoryEntry['status'], string> = {
    pending: 'text-amber-300',
    active: 'text-sky-300',
    completed: 'text-emerald-400',
  };

  const statusLabel: Record<TransferHistoryEntry['status'], string> = {
    pending: 'Pending',
    active: 'In progress',
    completed: 'Completed',
  };

  const shouldShowFallback =
    currentTransfer &&
    (!COUNTRY_COORDINATES[currentTransfer.fromCountry] ||
      !COUNTRY_COORDINATES[currentTransfer.toCountry]);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-background to-card overflow-hidden rounded-2xl">
      {shouldShowFallback ? (
        <ErrorFallback />
      ) : (
        <div className="absolute inset-0">
          <TransferMap transferHistory={transferHistory} currentTransfer={currentTransfer} />
        </div>
      )}

      {currentTransfer && (
        <div className="absolute top-4 right-4 space-y-2 z-10">
          <div
            className={`px-4 py-2 rounded-lg bg-card/90 backdrop-blur-sm border text-sm transition-all duration-500 ${
              animationStep >= 1 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Initiating transfer...
            </div>
          </div>

          {animationStep >= 2 && (
            <div className="px-4 py-2 rounded-lg bg-card/90 backdrop-blur-sm border text-sm animate-slide-in-up">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                Processing payment...
              </div>
            </div>
          )}

          {animationStep >= 3 && (
            <div className="px-4 py-2 rounded-lg bg-accent/20 backdrop-blur-sm border-accent text-accent-foreground text-sm animate-slide-in-up">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full" />
                Transfer completed!
              </div>
            </div>
          )}
        </div>
      )}

      {displayedTransfer && (
        <div className="absolute bottom-4 right-4 bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl px-4 py-3 text-xs text-muted-foreground max-w-xs space-y-2 shadow-lg z-10">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">Latest transfer</div>
          <div className="text-sm font-semibold text-foreground">
            {displayedTransfer.fromCountry} → {displayedTransfer.toCountry}
          </div>
          <div className="text-xs text-muted-foreground">
            {displayedTransfer.fromCurrency} {displayedTransfer.amount.toLocaleString()} →{' '}
            {displayedTransfer.toCurrency} {Math.round(displayedTransfer.amount * 1.2).toLocaleString()}
          </div>
          <div className={`text-xs font-semibold ${statusAccent[displayedTransfer.status]}`}>
            {statusLabel[displayedTransfer.status]}
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-card/80 backdrop-blur-sm px-3 py-2 rounded-lg z-10">
        <div className="flex items-center gap-4">
          <span>️ Drag to pan</span>
          <span>🔍 Scroll to zoom</span>
        </div>
      </div>
    </div>
  );
};

export default TransferAnimation;
