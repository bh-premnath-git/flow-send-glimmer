import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import Globe3D from './Globe3D';
import TransferArc from './TransferArc';

interface TransferPoint {
  id: string;
  position: [number, number, number];
  country: string;
  currency: string;
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
  const [animationStep, setAnimationStep] = useState(0);

  // 3D positions for countries on the globe (radius = 2)
  const transferPoints: Record<string, TransferPoint> = {
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
  };

  useEffect(() => {
    if (isActive) {
      setAnimationStep(0);
      const timer1 = setTimeout(() => setAnimationStep(1), 500);
      const timer2 = setTimeout(() => setAnimationStep(2), 1500);
      const timer3 = setTimeout(() => setAnimationStep(3), 3000);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    } else {
      setAnimationStep(0);
    }
  }, [isActive]);

  const fromPoint = transferPoints[fromCountry];
  const toPoint = transferPoints[toCountry];

  if (!fromPoint || !toPoint) return null;

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-background to-card">
      <Canvas className="w-full h-full">
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />
        
        {/* Globe */}
        <Globe3D autoRotate={!isActive} rotationSpeed={0.003} />
        
        {/* Transfer Arc */}
        {isActive && (
          <TransferArc
            startPoint={fromPoint.position}
            endPoint={toPoint.position}
            isActive={animationStep >= 1}
            color="#3b82f6"
            currency={toCurrency}
            amount={Math.round(amount * 1.2)}
          />
        )}
        
        {/* Camera controls */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={5}
          maxDistance={15}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI - Math.PI / 6}
          autoRotate={!isActive}
          autoRotateSpeed={0.5}
        />
      </Canvas>
      
      {/* Transfer status overlay */}
      {isActive && (
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