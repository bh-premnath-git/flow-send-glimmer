import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { Stars } from '@react-three/drei';

interface Globe3DProps {
  autoRotate?: boolean;
  rotationSpeed?: number;
}

const Globe3D: React.FC<Globe3DProps> = ({ 
  autoRotate = true, 
  rotationSpeed = 0.005 
}) => {
  const globeRef = useRef<Mesh>(null);

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