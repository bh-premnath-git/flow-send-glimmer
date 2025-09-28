import React, { useState, useEffect } from 'react';

interface TransferPoint {
  id: string;
  x: number;
  y: number;
  country: string;
  currency: string;
  amount: number;
}

interface TransferAnimationProps {
  isActive: boolean;
  fromCountry: string;
  toCountry: string;
  amount: number;
  fromCurrency: string;
  toCurrency: string;
}

const TransferAnimation: React.FC<TransferAnimationProps> = ({
  isActive,
  fromCountry,
  toCountry,
  amount,
  fromCurrency,
  toCurrency,
}) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);

  // Predefined transfer points for major countries
  const transferPoints: Record<string, TransferPoint> = {
    UK: { id: 'uk', x: 48, y: 25, country: 'United Kingdom', currency: 'GBP', amount: 0 },
    US: { id: 'us', x: 25, y: 35, country: 'United States', currency: 'USD', amount: 0 },
    IN: { id: 'in', x: 72, y: 45, country: 'India', currency: 'INR', amount: 0 },
    CA: { id: 'ca', x: 20, y: 28, country: 'Canada', currency: 'CAD', amount: 0 },
    AU: { id: 'au', x: 85, y: 70, country: 'Australia', currency: 'AUD', amount: 0 },
    DE: { id: 'de', x: 52, y: 30, country: 'Germany', currency: 'EUR', amount: 0 },
    FR: { id: 'fr', x: 50, y: 32, country: 'France', currency: 'EUR', amount: 0 },
    JP: { id: 'jp', x: 85, y: 38, country: 'Japan', currency: 'JPY', amount: 0 },
    SG: { id: 'sg', x: 78, y: 55, country: 'Singapore', currency: 'SGD', amount: 0 },
    AE: { id: 'ae', x: 65, y: 45, country: 'UAE', currency: 'AED', amount: 0 },
  };

  useEffect(() => {
    if (isActive) {
      setShowAnimation(true);
      setAnimationStep(0);
      
      const timer1 = setTimeout(() => setAnimationStep(1), 500);
      const timer2 = setTimeout(() => setAnimationStep(2), 1500);
      const timer3 = setTimeout(() => setAnimationStep(3), 2500);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    } else {
      setShowAnimation(false);
      setAnimationStep(0);
    }
  }, [isActive]);

  const fromPoint = transferPoints[fromCountry];
  const toPoint = transferPoints[toCountry];

  if (!fromPoint || !toPoint) return null;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Animated dotted world map background */}
      <div className="absolute inset-0 world-map-dots animate-pulse" />
      
      {/* Overlay gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/10 to-background/30" />

      {/* SVG for transfer paths and animations */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
        {/* Background world map outline (simplified) */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Transfer path animation */}
        {showAnimation && fromPoint && toPoint && (
          <>
            {/* Path line */}
            <line
              x1={fromPoint.x}
              y1={fromPoint.y}
              x2={toPoint.x}
              y2={toPoint.y}
              className={`transfer-path ${animationStep >= 1 ? 'animate-path-draw' : ''}`}
              filter="url(#glow)"
            />
            
            {/* Animated transfer dot */}
            {animationStep >= 2 && (
              <circle
                className="animate-transfer-dot"
                fill="hsl(var(--primary))"
                filter="url(#glow)"
                r="2"
              >
                <animateMotion
                  dur="2s"
                  repeatCount="indefinite"
                  path={`M${fromPoint.x},${fromPoint.y} L${toPoint.x},${toPoint.y}`}
                />
              </circle>
            )}
          </>
        )}

        {/* Source and destination points */}
        {Object.entries(transferPoints).map(([key, point]) => {
          const isSource = key === fromCountry && showAnimation;
          const isDestination = key === toCountry && showAnimation && animationStep >= 3;
          const isActive = isSource || isDestination;
          
          return (
            <g key={point.id}>
              <circle
                cx={point.x}
                cy={point.y}
                r="3"
                fill={isActive ? "hsl(var(--primary))" : "hsl(var(--map-dot))"}
                className={isActive ? "animate-pulse-glow" : ""}
                filter={isActive ? "url(#glow)" : "none"}
              />
              {/* Country label */}
              <text
                x={point.x}
                y={point.y - 8}
                textAnchor="middle"
                className="text-xs fill-muted-foreground font-medium"
              >
                {key}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating currency bubbles */}
      {showAnimation && fromPoint && toPoint && (
        <>
          {/* Source currency bubble */}
          <div
            className={`currency-bubble animate-currency-float ${animationStep >= 1 ? 'opacity-100' : 'opacity-0'}`}
            style={{
              left: `${fromPoint.x}%`,
              top: `${fromPoint.y - 10}%`,
              transform: 'translate(-50%, -100%)',
              transition: 'opacity 0.5s ease-in-out',
            }}
          >
            {fromCurrency} {amount.toLocaleString()}
          </div>

          {/* Destination currency bubble */}
          {animationStep >= 3 && (
            <div
              className="currency-bubble animate-currency-float"
              style={{
                left: `${toPoint.x}%`,
                top: `${toPoint.y - 10}%`,
                transform: 'translate(-50%, -100%)',
                animationDelay: '0.5s',
              }}
            >
              {toCurrency} {(amount * 1.2).toLocaleString()}
            </div>
          )}
        </>
      )}

      {/* Transfer status indicators */}
      {showAnimation && (
        <div className="absolute top-4 right-4 space-y-2">
          <div className={`px-3 py-2 rounded-lg bg-card border text-sm transition-all duration-500 ${
            animationStep >= 1 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
          }`}>
            🔄 Initiating transfer...
          </div>
          
          {animationStep >= 2 && (
            <div className="px-3 py-2 rounded-lg bg-card border text-sm animate-slide-in-up">
              ⚡ Processing payment...
            </div>
          )}
          
          {animationStep >= 3 && (
            <div className="px-3 py-2 rounded-lg bg-accent/20 border-accent text-accent-foreground text-sm animate-slide-in-up">
              ✅ Transfer completed!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransferAnimation;