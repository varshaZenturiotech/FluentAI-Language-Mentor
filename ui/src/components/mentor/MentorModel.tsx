import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export type MentorCharacterState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface MentorModelProps {
  state?: MentorCharacterState;
  scale?: number;
  modelUrl?: string;
}

// export const DEFAULT_MODEL_URL = '/models/fluentai-mentor.glb';
export const DEFAULT_MODEL_URL = '/models/Demo_Model.glb';

export const MentorModel: React.FC<MentorModelProps> = ({
  state = 'idle',
  scale = 1.0,
  modelUrl = DEFAULT_MODEL_URL,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Load GLB model using Drei useGLTF hook
  const { scene } = useGLTF(modelUrl);

  // Target animation values for smooth lerping
  const targetPos = useRef({ y: -0.55 });
  const targetRot = useRef({ x: 0, y: 0, z: 0 });
  const targetScale = useRef(scale * 1.35);

  useFrame((stateContext, delta) => {
    if (!groupRef.current) return;

    const elapsedTime = stateContext.clock.getElapsedTime();
    const lerpFactor = Math.min(delta * 6, 0.2); // Smooth easing for state transitions

    // Calculate state-driven procedural micro-animations
    switch (state) {
      case 'listening': {
        // Subtle forward lean + focused float pulse
        targetPos.current.y = -0.55 + Math.sin(elapsedTime * 2.2) * 0.035;
        targetRot.current.x = 0.04 + Math.sin(elapsedTime * 1.5) * 0.015;
        targetRot.current.y = Math.sin(elapsedTime * 0.8) * 0.03;
        targetRot.current.z = 0;
        targetScale.current = scale * 1.38 + Math.sin(elapsedTime * 3) * 0.01;
        break;
      }
      case 'thinking': {
        // Thoughtful tilt + subtle wobbling float
        targetPos.current.y = -0.55 + Math.sin(elapsedTime * 2.8) * 0.03;
        targetRot.current.x = 0.02;
        targetRot.current.y = Math.sin(elapsedTime * 1.2) * 0.05;
        targetRot.current.z = Math.sin(elapsedTime * 1.8) * 0.025;
        targetScale.current = scale * 1.35;
        break;
      }
      case 'speaking': {
        // Rhythmic vocal cadence float + conversational micro-gestures
        targetPos.current.y = -0.55 + Math.sin(elapsedTime * 3.5) * 0.035;
        targetRot.current.x = Math.sin(elapsedTime * 4.0) * 0.025;
        targetRot.current.y = Math.sin(elapsedTime * 2.2) * 0.06;
        targetRot.current.z = Math.sin(elapsedTime * 1.5) * 0.015;
        targetScale.current = scale * 1.36 + Math.sin(elapsedTime * 5.0) * 0.018;
        break;
      }
      case 'idle':
      default: {
        // Living AI mentor idle: gentle vertical breath float & micro-rotation
        targetPos.current.y = -0.55 + Math.sin(elapsedTime * 1.5) * 0.025;
        targetRot.current.x = 0;
        targetRot.current.y = Math.sin(elapsedTime * 0.7) * 0.025;
        targetRot.current.z = 0;
        targetScale.current = scale * 1.35 + Math.sin(elapsedTime * 2.0) * 0.008;
        break;
      }
    }

    // Apply linear interpolation (lerp) to position, rotation, and scale
    groupRef.current.position.y += (targetPos.current.y - groupRef.current.position.y) * lerpFactor;
    groupRef.current.rotation.x += (targetRot.current.x - groupRef.current.rotation.x) * lerpFactor;
    groupRef.current.rotation.y += (targetRot.current.y - groupRef.current.rotation.y) * lerpFactor;
    groupRef.current.rotation.z += (targetRot.current.z - groupRef.current.rotation.z) * lerpFactor;

    const currentScale = groupRef.current.scale.x;
    const newScale = currentScale + (targetScale.current - currentScale) * lerpFactor;
    groupRef.current.scale.set(newScale, newScale, newScale);
  });

  return (
    <group ref={groupRef} position={[0, -0.55, 0]} dispose={null}>
      <primitive object={scene} />
    </group>
  );
};

// Preload the model asset for efficient loading
useGLTF.preload(DEFAULT_MODEL_URL);
