import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Text } from '@react-three/drei';
import { Vector3, CatmullRomCurve3 } from 'three';
import type { TransferStatus } from '../types/transfers';

interface TransferArcProps {
  startPoint: [number, number, number];
  endPoint: [number, number, number];
  status: TransferStatus;
  color?: string;
  currency?: string;
  amount?: number;
}

const TransferArc: React.FC<TransferArcProps> = ({
  startPoint,
  endPoint,
  status,
  color = '#3b82f6',
  currency = 'USD',
  amount = 1000
}) => {
  const dotRef = useRef<any>(null);
  const [animationProgress, setAnimationProgress] = useState(() => {
    if (status === 'completed') {
      return 1;
    }

    if (status === 'pending') {
      return 0.15;
    }

    return 0;
  });

  // Create arc path points
  const arcPoints = useMemo(() => {
    const start = new Vector3(...startPoint);
    const end = new Vector3(...endPoint);
    
    // Calculate the midpoint and raise it for arc effect
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const height = start.distanceTo(end) * 0.3;
    mid.normalize().multiplyScalar(2 + height);
    
    // Create smooth curve
    const curve = new CatmullRomCurve3([start, mid, end]);
    return curve.getPoints(50);
  }, [startPoint, endPoint]);

  // Animate progress smoothly
  useFrame((state) => {
    if (status === 'active' && animationProgress < 1) {
      setAnimationProgress((prev) => Math.min(prev + 0.02, 1));
    }

    if (status === 'pending' && animationProgress < 0.35) {
      setAnimationProgress((prev) => Math.min(prev + 0.01, 0.35));
    }

    // Update dot position along the arc
    if (dotRef.current && animationProgress > 0 && status === 'active') {
      const currentIndex = Math.floor((arcPoints.length - 1) * animationProgress);
      const point = arcPoints[currentIndex];
      if (point) {
        dotRef.current.position.copy(point);
        // Add floating animation
        dotRef.current.position.y += Math.sin(state.clock.elapsedTime * 3) * 0.05;
      }
    }
  });

  useEffect(() => {
    if (status === 'completed') {
      setAnimationProgress(1);
    }

    if (status === 'pending') {
      setAnimationProgress((prev) => Math.max(prev, 0.15));
    }
  }, [status]);

  // Create visible arc points based on progress
  const visiblePoints = useMemo(() => {
    const visibleCount = Math.floor(arcPoints.length * animationProgress);
    return arcPoints.slice(0, Math.max(visibleCount, 1));
  }, [arcPoints, animationProgress]);

  const arcOpacity = status === 'completed' ? 0.35 : status === 'pending' ? 0.5 : 0.85;
  const startOpacity = status === 'completed' ? 0.6 : status === 'pending' ? 0.75 : 1;
  const destinationReached = status === 'completed' || animationProgress > 0.8;

  return (
    <group>
      {/* Arc line - only show if we have progress */}
      {animationProgress > 0 && visiblePoints.length > 1 && (
        <Line
          points={visiblePoints}
          color={color}
          lineWidth={3}
          transparent
          opacity={arcOpacity}
        />
      )}

      {/* Moving dot */}
      {animationProgress > 0 && status === 'active' && (
        <mesh ref={dotRef}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.9}
          />
        </mesh>
      )}

      {/* Source point */}
      <mesh position={startPoint}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial
          color={status === 'completed' ? '#16a34a' : color}
          transparent
          opacity={startOpacity}
        />
      </mesh>

      {/* Destination point */}
      <mesh position={endPoint}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial
          color={destinationReached ? '#10b981' : '#666666'}
          transparent
          opacity={destinationReached ? 1 : 0.5}
        />
      </mesh>

      {/* Currency label at destination - using Text from drei */}
      {status === 'active' && animationProgress > 0.8 && (
        <Text
          position={[endPoint[0], endPoint[1] + 0.4, endPoint[2]]}
          fontSize={0.15}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {currency} {amount.toLocaleString()}
        </Text>
      )}

      {/* Background for currency text */}
      {status === 'active' && animationProgress > 0.8 && (
        <mesh position={[endPoint[0], endPoint[1] + 0.4, endPoint[2]]}>
          <planeGeometry args={[1, 0.3]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}
    </group>
  );
};

export default TransferArc;