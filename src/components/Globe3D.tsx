import React, { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader, Mesh, SphereGeometry, MeshPhongMaterial } from 'three';
import { Sphere, Stars } from '@react-three/drei';

interface Globe3DProps {
  autoRotate?: boolean;
  rotationSpeed?: number;
}

const Globe3D: React.FC<Globe3DProps> = ({ 
  autoRotate = true, 
  rotationSpeed = 0.005 
}) => {
  const globeRef = useRef<Mesh>(null);

  // Create earth texture using a data URL for a blue/green earth-like appearance
  const earthTexture = useMemo(() => {
    // Create a canvas for the earth texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    // Create a gradient that looks like Earth from space
    const gradient = ctx.createLinearGradient(0, 0, 512, 256);
    gradient.addColorStop(0, '#1e3a8a'); // Deep blue (oceans)
    gradient.addColorStop(0.3, '#3b82f6'); // Blue
    gradient.addColorStop(0.5, '#10b981'); // Green (land)
    gradient.addColorStop(0.7, '#059669'); // Dark green
    gradient.addColorStop(1, '#1e3a8a'); // Back to blue
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 256);
    
    // Add some continent-like shapes
    ctx.fillStyle = '#10b981';
    
    // North America
    ctx.beginPath();
    ctx.ellipse(100, 80, 40, 30, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Europe/Africa
    ctx.beginPath();
    ctx.ellipse(280, 90, 25, 45, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Asia
    ctx.beginPath();
    ctx.ellipse(380, 70, 50, 35, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Australia
    ctx.beginPath();
    ctx.ellipse(420, 180, 20, 15, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add some cloud-like effects
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 256;
      const radius = Math.random() * 15 + 5;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    const texture = new TextureLoader().load(canvas.toDataURL());
    return texture;
  }, []);

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
        count={2000} 
        factor={4} 
        saturation={0} 
        fade 
        speed={0.5}
      />
      
      {/* Globe */}
      <mesh ref={globeRef} position={[0, 0, 0]}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshPhongMaterial 
          map={earthTexture}
          transparent
          opacity={0.9}
          shininess={100}
        />
      </mesh>
      
      {/* Atmosphere glow */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2.1, 64, 64]} />
        <meshPhongMaterial 
          color="#4fa8ff"
          transparent
          opacity={0.1}
          side={2} // DoubleSide
        />
      </mesh>
      
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={1}
        castShadow
      />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color="#4fa8ff" />
    </group>
  );
};

export default Globe3D;