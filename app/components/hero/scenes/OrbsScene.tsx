'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

function Orbs() {
  const group = useRef<Group>(null);

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.12;
  });

  return (
    <group ref={group} position={[1.6, 0, 0]}>
      <mesh position={[0.2, 0.45, 0]}>
        <sphereGeometry args={[0.62, 32, 32]} />
        <meshStandardMaterial color="#ff6622" roughness={0.45} />
      </mesh>
      <mesh position={[1.35, -0.35, -0.4]}>
        <sphereGeometry args={[0.38, 32, 32]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.35} />
      </mesh>
      <mesh position={[-0.7, -0.55, 0.3]}>
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshStandardMaterial color="#d4af37" roughness={0.4} />
      </mesh>
    </group>
  );
}

export default function OrbsScene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.75} />
      <directionalLight position={[3, 3, 2]} intensity={1.2} />
      <Orbs />
    </Canvas>
  );
}
