import React from 'react';
import { Text } from '@react-three/drei';

interface CountryMarker {
  code: string;
  position: [number, number, number];
  name: string;
  isActive?: boolean;
}

interface CountryMarkersProps {
  markers: CountryMarker[];
  activeCountries?: string[];
  transferCounts?: Record<string, number>;
}

const CountryMarkers: React.FC<CountryMarkersProps> = ({
  markers,
  activeCountries = [],
  transferCounts = {}
}) => {
  return (
    <group>
      {markers.map((marker) => {
        const isActive = activeCountries.includes(marker.code);
        const transferCount = transferCounts[marker.code] ?? 0;
        const badgeWidth = Math.max(0.3, 0.24 + transferCount.toString().length * 0.08);

        return (
          <group key={marker.code}>
            {/* Country dot */}
            <mesh position={marker.position}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshBasicMaterial 
                color={isActive ? '#3b82f6' : '#64748b'}
                transparent
                opacity={isActive ? 1 : 0.6}
              />
            </mesh>
            
            {/* Country label */}
            <Text
              position={[marker.position[0], marker.position[1] + 0.2, marker.position[2]]}
              fontSize={0.1}
              color={isActive ? '#ffffff' : '#94a3b8'}
              anchorX="center"
              anchorY="middle"
              fontWeight={isActive ? "bold" : "normal"}
            >
              {marker.code}
            </Text>
            
            {/* Glow effect for active countries */}
            {isActive && (
              <mesh position={marker.position}>
                <sphereGeometry args={[0.12, 8, 8]} />
                <meshBasicMaterial 
                  color="#3b82f6"
                  transparent
                  opacity={0.3}
                />
              </mesh>
            )}

            {/* Transfer count badge */}
            {transferCount > 0 && (
              <group position={[marker.position[0], marker.position[1] + 0.4, marker.position[2]]}>
                <mesh>
                  <planeGeometry args={[badgeWidth, 0.22]} />
                  <meshBasicMaterial
                    color={isActive ? '#2563eb' : '#0f172a'}
                    transparent
                    opacity={isActive ? 0.95 : 0.7}
                  />
                </mesh>
                <Text
                  position={[0, 0, 0.01]}
                  fontSize={0.12}
                  color="#ffffff"
                  anchorX="center"
                  anchorY="middle"
                  fontWeight="bold"
                >
                  {transferCount}
                </Text>
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
};

export default CountryMarkers;