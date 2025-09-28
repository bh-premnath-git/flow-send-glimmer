import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Text } from '@react-three/drei';
import { Vector3, CatmullRomCurve3 } from 'three';

interface TransferArcProps {
  startPoint: [number, number, number];
  endPoint: [number, number, number];
  isActive: boolean;
  progress?: number;
  color?: string;
  currency?: string;
  amount?: number;
}

const TransferArc: React.FC<TransferArcProps> = ({
  startPoint,
  endPoint,
  isActive,
  progress = 0,
  color = '#3b82f6',
  currency = 'USD',
  amount = 1000
}) => {
  const dotRef = useRef<any>(null);
  const [animationProgress, setAnimationProgress] = useState(0);

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
    if (isActive && animationProgress < 1) {
      setAnimationProgress(prev => Math.min(prev + 0.02, 1));
    } else if (!isActive && animationProgress > 0) {
      setAnimationProgress(prev => Math.max(prev - 0.05, 0));
    }

    // Update dot position along the arc
    if (dotRef.current && animationProgress > 0) {
      const currentIndex = Math.floor((arcPoints.length - 1) * animationProgress);
      const point = arcPoints[currentIndex];
      if (point) {
        dotRef.current.position.copy(point);
        // Add floating animation
        dotRef.current.position.y += Math.sin(state.clock.elapsedTime * 3) * 0.05;
      }
    }
  });

  // Create visible arc points based on progress
  const visiblePoints = useMemo(() => {
    const visibleCount = Math.floor(arcPoints.length * animationProgress);
    return arcPoints.slice(0, Math.max(visibleCount, 1));
  }, [arcPoints, animationProgress]);

  return (
    <group>
      {/* Arc line - only show if we have progress */}
      {animationProgress > 0 && visiblePoints.length > 1 && (
        <Line
          points={visiblePoints}
          color={color}
          lineWidth={3}
          transparent
          opacity={isActive ? 0.8 : 0.3}
        />
      )}

      {/* Moving dot */}
      {animationProgress > 0 && (
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
          color={isActive ? color : '#666666'}
          transparent
          opacity={isActive ? 1 : 0.5}
        />
      </mesh>

      {/* Destination point */}
      <mesh position={endPoint}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial 
          color={animationProgress > 0.8 ? '#10b981' : '#666666'}
          transparent
          opacity={animationProgress > 0.8 ? 1 : 0.5}
        />
      </mesh>

      {/* Currency label at destination - using Text from drei */}
      {animationProgress > 0.8 && (
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
      {animationProgress > 0.8 && (
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