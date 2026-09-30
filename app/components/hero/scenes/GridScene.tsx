'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

function Grid() {
  const group = useRef<Group>(null);

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.z += delta * 0.05;
  });

  return (
    <group ref={group} position={[1.8, 0, 0]} rotation={[0.4, 0.2, 0]}>
      <gridHelper args={[6, 14, '#ff6622', '#e0e0e0']} />
    </group>
  );
}

export default function GridScene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 1.2, 4.2], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
    >
      <Grid />
    </Canvas>
  );
}
