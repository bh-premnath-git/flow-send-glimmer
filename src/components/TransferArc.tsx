import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Sphere, Text } from '@react-three/drei';
import { Vector3, CatmullRomCurve3, BufferGeometry, Color } from 'three';
import * as THREE from 'three';

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
  const arcRef = useRef<any>(null);
  const dotRef = useRef<any>(null);
  const progressRef = useRef(0);

  // Create arc path
  const arcPoints = useMemo(() => {
    const start = new Vector3(...startPoint);
    const end = new Vector3(...endPoint);
    
    // Calculate the midpoint and raise it for arc effect
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const height = start.distanceTo(end) * 0.3; // Arc height
    mid.normalize().multiplyScalar(2 + height); // Raise the arc
    
    // Create smooth curve
    const curve = new CatmullRomCurve3([start, mid, end]);
    return curve.getPoints(50);
  }, [startPoint, endPoint]);

  // Animate progress
  useFrame((state) => {
    if (isActive && progressRef.current < 1) {
      progressRef.current = Math.min(progressRef.current + 0.02, 1);
    } else if (!isActive) {
      progressRef.current = Math.max(progressRef.current - 0.05, 0);
    }

    // Update arc visibility based on progress
    if (arcRef.current) {
      const geometry = arcRef.current.geometry;
      if (geometry && geometry.attributes.position) {
        const positions = geometry.attributes.position.array;
        const visiblePoints = Math.floor(arcPoints.length * progressRef.current);
        
        // Create new geometry with only visible points
        const visiblePositions = new Float32Array(visiblePoints * 3);
        for (let i = 0; i < visiblePoints; i++) {
          const point = arcPoints[i];
          visiblePositions[i * 3] = point.x;
          visiblePositions[i * 3 + 1] = point.y;
          visiblePositions[i * 3 + 2] = point.z;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(visiblePositions, 3));
        geometry.attributes.position.needsUpdate = true;
      }
    }

    // Update dot position
    if (dotRef.current && progressRef.current > 0) {
      const currentIndex = Math.floor((arcPoints.length - 1) * progressRef.current);
      const point = arcPoints[currentIndex];
      if (point) {
        dotRef.current.position.copy(point);
        // Add floating animation
        dotRef.current.position.y += Math.sin(state.clock.elapsedTime * 3) * 0.1;
      }
    }
  });

  return (
    <group>
      {/* Arc line */}
      <line ref={arcRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={arcPoints.length}
            array={new Float32Array(arcPoints.flatMap(p => [p.x, p.y, p.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial 
          color={color} 
          linewidth={3}
          transparent
          opacity={isActive ? 0.8 : 0.3}
        />
      </line>

      {/* Moving dot */}
      {progressRef.current > 0 && (
        <mesh ref={dotRef}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial 
            color={color}
            transparent
            opacity={0.9}
          />
        </mesh>
      )}

      {/* Source point */}
      <mesh position={startPoint}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial 
          color={isActive ? color : '#666666'}
          transparent
          opacity={isActive ? 1 : 0.5}
        />
      </mesh>

      {/* Destination point */}
      <mesh position={endPoint}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial 
          color={progressRef.current > 0.8 ? '#10b981' : '#666666'}
          transparent
          opacity={progressRef.current > 0.8 ? 1 : 0.5}
        />
      </mesh>

      {/* Currency label at destination */}
      {progressRef.current > 0.8 && (
        <Text
          position={[endPoint[0], endPoint[1] + 0.3, endPoint[2]]}
          fontSize={0.2}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {currency} {amount.toLocaleString()}
        </Text>
      )}
    </group>
  );
};

export default TransferArc;