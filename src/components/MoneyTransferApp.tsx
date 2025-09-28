import React, { useEffect, useMemo, useRef, useState } from 'react';
import TransferForm, { TransferData } from './TransferForm';
import TransferAnimation from './TransferAnimation';
import type { TransferHistoryEntry, TransferStatus } from '../types/transfers';

const MoneyTransferApp: React.FC = () => {
  const [transferHistory, setTransferHistory] = useState<TransferHistoryEntry[]>([]);
  const [isTransferring, setIsTransferring] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const registerTimeout = (timeout: ReturnType<typeof setTimeout>) => {
    timeoutsRef.current.push(timeout);
  };

  const clearScheduledTimeouts = () => {
    timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    timeoutsRef.current = [];
  };

  useEffect(() => () => clearScheduledTimeouts(), []);

  const currentTransfer = useMemo(() => {
    return transferHistory.find((transfer) => transfer.status === 'active' || transfer.status === 'pending') ?? null;
  }, [transferHistory]);

  const updateTransferStatus = (id: string, status: TransferStatus) => {
    setTransferHistory((prev) =>
      prev.map((transfer) =>
        transfer.id === id
          ? {
              ...transfer,
              status,
              updatedAt: Date.now(),
              completedAt: status === 'completed' ? Date.now() : transfer.completedAt,
            }
          : transfer,
      ),
    );
  };

  const handleTransferSubmit = async (transferData: TransferData) => {
    const now = Date.now();
    const transferId = `${now}-${Math.random().toString(36).slice(2, 8)}`;

    setIsTransferring(true);
    clearScheduledTimeouts();

    setTransferHistory((prev) => {
      const timestamp = Date.now();
      const completedPrev = prev.map((transfer) =>
        transfer.status === 'active' || transfer.status === 'pending'
          ? { ...transfer, status: 'completed', updatedAt: timestamp, completedAt: timestamp }
          : transfer,
      );

      return [
        ...completedPrev,
        {
          id: transferId,
          status: 'pending',
          createdAt: now,
          updatedAt: now,
          completedAt: undefined,
          ...transferData,
        },
      ];
    });

    registerTimeout(
      setTimeout(() => {
        setTransferHistory((prev) =>
          prev.map((transfer) => {
            if (transfer.id === transferId && transfer.status === 'pending') {
              return { ...transfer, status: 'active', updatedAt: Date.now() };
            }

            return transfer;
          }),
        );
      }, 400),
    );

    registerTimeout(
      setTimeout(() => {
        updateTransferStatus(transferId, 'completed');
        setIsTransferring(false);
      }, 4000),
    );
  };

  const resetTransfer = () => {
    clearScheduledTimeouts();
    const timestamp = Date.now();
    setTransferHistory((prev) =>
      prev.map((transfer) =>
        transfer.status === 'completed'
          ? transfer
          : { ...transfer, status: 'completed', updatedAt: timestamp, completedAt: timestamp },
      ),
    );
    setIsTransferring(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card relative overflow-hidden">
      {/* Background pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      
      <div className="relative z-10 flex flex-col lg:flex-row min-h-screen">
        {/* Left side - Transfer Form */}
        <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  Global
                </span>
                <br />
                <span className="text-foreground">Money Transfer</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Send money to anyone, anywhere in the world with zero hassle
              </p>
            </div>
            
            <TransferForm 
              onTransferSubmit={handleTransferSubmit}
              isTransferring={isTransferring}
            />
            
            {currentTransfer && (
              <div className="mt-6 text-center">
                <button
                  onClick={resetTransfer}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors underline"
                >
                  Start new transfer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Transfer Animation */}
        <div className="lg:w-1/2 relative min-h-[400px] lg:min-h-screen">
          <div className="absolute inset-0 bg-gradient-to-bl from-primary/5 via-transparent to-accent/5" />
          
          {transferHistory.length > 0 ? (
            <TransferAnimation
              transferHistory={transferHistory}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4 max-w-md px-6">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                  <div className="text-3xl">🌍</div>
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Watch Your Money Travel
                </h3>
                <p className="text-muted-foreground">
                  See real-time visualization of your transfer as it moves across the globe with our interactive world map
                </p>
                <div className="flex items-center justify-center gap-6 pt-4">
                  <div className="text-center">
                    <div className="text-primary font-bold text-lg">195+</div>
                    <div className="text-xs text-muted-foreground">Countries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-accent font-bold text-lg">150+</div>
                    <div className="text-xs text-muted-foreground">Currencies</div>
                  </div>
                  <div className="text-center">
                    <div className="text-primary font-bold text-lg">{"<1min"}</div>
                    <div className="text-xs text-muted-foreground">Average time</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background/80 to-transparent backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>🔒 Bank-level security</span>
            <span>⚡ Instant transfers</span>
            <span>🌍 Global coverage</span>
          </div>
          <div className="text-xs">
            Licensed and regulated financial service
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoneyTransferApp;