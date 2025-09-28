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
}

const CountryMarkers: React.FC<CountryMarkersProps> = ({ 
  markers, 
  activeCountries = [] 
}) => {
  return (
    <group>
      {markers.map((marker) => {
        const isActive = activeCountries.includes(marker.code);
        
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
          </group>
        );
      })}
    </group>
  );
};

export default CountryMarkers;