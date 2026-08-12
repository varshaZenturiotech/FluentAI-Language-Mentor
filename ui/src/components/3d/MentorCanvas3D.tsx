import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';

const GlowingOrb: React.FC<{ micState?: string }> = ({ micState }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  const getDistortColor = () => {
    switch (micState) {
      case 'listening':
        return '#3B82F6'; // blue
      case 'speaking':
        return '#22C55E'; // green
      case 'thinking':
        return '#8B5CF6'; // purple
      default:
        return '#4F46E5'; // indigo
    }
  };

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.8}>
      <Sphere ref={meshRef} args={[1, 64, 64]} scale={1.8}>
        <MeshDistortMaterial
          color={getDistortColor()}
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
};

export const MentorCanvas3D: React.FC<{ micState?: string; className?: string }> = ({
  micState = 'idle',
  className = 'w-full h-48',
}) => {
  return (
    <div className={`relative rounded-3xl overflow-hidden ${className}`}>
      <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <GlowingOrb micState={micState} />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1.5} />
      </Canvas>
      <div className="absolute bottom-2 right-3 text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-white/70 backdrop-blur-md px-2 py-0.5 rounded-full border border-slate-200">
        3D AI Mentor Ready (R3F)
      </div>
    </div>
  );
};
