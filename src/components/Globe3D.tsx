import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { Stars } from '@react-three/drei';
import CountryMarkers from './CountryMarkers';

interface Globe3DProps {
  autoRotate?: boolean;
  rotationSpeed?: number;
  activeCountries?: string[];
}

const Globe3D: React.FC<Globe3DProps> = ({ 
  autoRotate = true, 
  rotationSpeed = 0.005,
  activeCountries = []
}) => {
  const globeRef = useRef<Mesh>(null);

  // Country positions on the globe
  const countryMarkers = [
    { code: 'UK', position: [0.5, 1.2, 1.5] as [number, number, number], name: 'United Kingdom' },
    { code: 'US', position: [-1.5, 0.8, 1.2] as [number, number, number], name: 'United States' },
    { code: 'IN', position: [1.2, 0.5, -1.5] as [number, number, number], name: 'India' },
    { code: 'CA', position: [-1.8, 1.0, 0.8] as [number, number, number], name: 'Canada' },
    { code: 'AU', position: [1.5, -1.2, 1.0] as [number, number, number], name: 'Australia' },
    { code: 'DE', position: [0.8, 1.0, 1.7] as [number, number, number], name: 'Germany' },
    { code: 'FR', position: [0.3, 1.1, 1.8] as [number, number, number], name: 'France' },
    { code: 'JP', position: [1.8, 0.8, -0.5] as [number, number, number], name: 'Japan' },
    { code: 'SG', position: [1.4, -0.3, -1.4] as [number, number, number], name: 'Singapore' },
    { code: 'AE', position: [1.0, 0.2, -1.8] as [number, number, number], name: 'UAE' },
  ];

  useFrame(() => {
    if (globeRef.current && autoRotate) {
      globeRef.current.rotation.y += rotationSpeed;
    }
  });

  return (
    <group>
      {/* Stars background */}
      <Stars 
        radius={300} 
        depth={50} 
        count={1000} 
        factor={4} 
        saturation={0} 
        fade 
        speed={0.5}
      />
      
      {/* Main Globe */}
      <mesh ref={globeRef} position={[0, 0, 0]}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshPhongMaterial 
          color="#1e40af"
          transparent
          opacity={0.8}
          shininess={100}
        />
      </mesh>
      
      {/* Land masses - simplified green patches */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <sphereGeometry args={[2.01, 32, 32]} />
        <meshBasicMaterial 
          color="#10b981"
          transparent
          opacity={0.3}
        />
      </mesh>
      
      {/* Atmosphere glow */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2.1, 32, 32]} />
        <meshBasicMaterial 
          color="#4fa8ff"
          transparent
          opacity={0.1}
          side={2} // DoubleSide
        />
      </mesh>
      
      {/* Country Markers */}
      <CountryMarkers 
        markers={countryMarkers}
        activeCountries={activeCountries}
      />
      
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={0.8}
      />
      <pointLight position={[-5, -5, -5]} intensity={0.4} color="#4fa8ff" />
    </group>
  );
};

export default Globe3D;