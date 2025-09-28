import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import Globe3D from './Globe3D';
import TransferArc from './TransferArc';
import type { TransferHistoryEntry } from '../types/transfers';

// Error boundary component for 3D content
class ThreeErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Three.js Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Loading fallback component
const LoadingFallback = () => (
  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-background to-card">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading 3D Globe...</p>
    </div>
  </div>
);

// Error fallback component
const ErrorFallback = () => (
  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-background to-card">
    <div className="text-center space-y-4">
      <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
        <div className="text-3xl">🌍</div>
      </div>
      <h3 className="text-xl font-semibold text-foreground">Global Transfer Map</h3>
      <p className="text-muted-foreground max-w-md">
        Your transfer is being processed. The 3D visualization is temporarily unavailable.
      </p>
    </div>
  </div>
);

interface TransferPoint {
  id: string;
  position: [number, number, number];
  country: string;
  currency: string;
}

interface TransferAnimationProps {
  transferHistory: TransferHistoryEntry[];
}

const TransferAnimation: React.FC<TransferAnimationProps> = ({ transferHistory }) => {
  const [animationStep, setAnimationStep] = useState(0);

  const transferPoints = useMemo<Record<string, TransferPoint>>(
    () => ({
      UK: { id: 'uk', position: [0.5, 1.2, 1.5], country: 'United Kingdom', currency: 'GBP' },
      US: { id: 'us', position: [-1.5, 0.8, 1.2], country: 'United States', currency: 'USD' },
      IN: { id: 'in', position: [1.2, 0.5, -1.5], country: 'India', currency: 'INR' },
      CA: { id: 'ca', position: [-1.8, 1.0, 0.8], country: 'Canada', currency: 'CAD' },
      AU: { id: 'au', position: [1.5, -1.2, 1.0], country: 'Australia', currency: 'AUD' },
      DE: { id: 'de', position: [0.8, 1.0, 1.7], country: 'Germany', currency: 'EUR' },
      FR: { id: 'fr', position: [0.3, 1.1, 1.8], country: 'France', currency: 'EUR' },
      JP: { id: 'jp', position: [1.8, 0.8, -0.5], country: 'Japan', currency: 'JPY' },
      SG: { id: 'sg', position: [1.4, -0.3, -1.4], country: 'Singapore', currency: 'SGD' },
      AE: { id: 'ae', position: [1.0, 0.2, -1.8], country: 'UAE', currency: 'AED' },
    }),
    [],
  );

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

  const activeCountries = useMemo(() => {
    const highlighted = new Set<string>();
    transferHistory.forEach((transfer) => {
      if (transfer.status === 'active' || transfer.status === 'pending') {
        highlighted.add(transfer.fromCountry);
        highlighted.add(transfer.toCountry);
      }
    });
    return Array.from(highlighted);
  }, [transferHistory]);

  const transferCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    transferHistory.forEach((transfer) => {
      counts[transfer.fromCountry] = (counts[transfer.fromCountry] || 0) + 1;
      counts[transfer.toCountry] = (counts[transfer.toCountry] || 0) + 1;
    });
    return counts;
  }, [transferHistory]);

  if (currentTransfer) {
    const fromPoint = transferPoints[currentTransfer.fromCountry];
    const toPoint = transferPoints[currentTransfer.toCountry];

    if (!fromPoint || !toPoint) {
      return <ErrorFallback />;
    }
  }

  const sortedHistory = useMemo(() => {
    const statusPriority: Record<TransferHistoryEntry['status'], number> = {
      completed: 0,
      pending: 1,
      active: 2,
    };

    return [...transferHistory].sort((a, b) => statusPriority[a.status] - statusPriority[b.status]);
  }, [transferHistory]);

  const arcs = useMemo(
    () =>
      sortedHistory
        .map((transfer) => {
          const fromPoint = transferPoints[transfer.fromCountry];
          const toPoint = transferPoints[transfer.toCountry];

          if (!fromPoint || !toPoint) {
            return null;
          }

          const arcColor =
            transfer.status === 'completed'
              ? '#22c55e'
              : transfer.status === 'pending'
              ? '#f59e0b'
              : '#3b82f6';

          return (
            <TransferArc
              key={transfer.id}
              startPoint={fromPoint.position}
              endPoint={toPoint.position}
              status={transfer.status}
              color={arcColor}
              currency={transfer.toCurrency}
              amount={Math.round(transfer.amount * 1.2)}
            />
          );
        })
        .filter((arc): arc is JSX.Element => arc !== null),
    [sortedHistory, transferPoints],
  );

  const latestTransfer = transferHistory[transferHistory.length - 1] ?? null;
  const displayedTransfer = currentTransfer ?? latestTransfer;

  if (!displayedTransfer && arcs.length === 0) {
    return <ErrorFallback />;
  }

  const isAnimating = Boolean(currentTransfer);

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

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-background to-card">
      <ThreeErrorBoundary fallback={<ErrorFallback />}>
        <Suspense fallback={<LoadingFallback />}>
          <Canvas className="w-full h-full">
            <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />

            {/* Globe */}
            <Globe3D
              autoRotate={!isAnimating}
              rotationSpeed={0.003}
              activeCountries={activeCountries}
              transferCounts={transferCounts}
            />

            {/* Transfer Arcs */}
            {arcs}

            {/* Camera controls */}
            <OrbitControls
              enablePan={false}
              enableZoom={true}
              minDistance={5}
              maxDistance={15}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI - Math.PI / 6}
              autoRotate={!isAnimating}
              autoRotateSpeed={0.5}
            />
          </Canvas>
        </Suspense>
      </ThreeErrorBoundary>

      {/* Transfer status overlay */}
      {currentTransfer && (
        <div className="absolute top-4 right-4 space-y-2 z-10">
          <div className={`px-4 py-2 rounded-lg bg-card/90 backdrop-blur-sm border text-sm transition-all duration-500 ${
            animationStep >= 1 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
          }`}>
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

      {/* Latest transfer summary */}
      {displayedTransfer && (
        <div className="absolute bottom-4 right-4 bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl px-4 py-3 text-xs text-muted-foreground max-w-xs space-y-2 shadow-lg">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
            Latest transfer
          </div>
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

      {/* 3D Globe Instructions */}
      <div className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-card/80 backdrop-blur-sm px-3 py-2 rounded-lg">
        <div className="flex items-center gap-4">
          <span>🖱️ Drag to rotate</span>
          <span>🔍 Scroll to zoom</span>
        </div>
      </div>
    </div>
  );
};

export default TransferAnimation;
