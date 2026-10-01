'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';

function Waves() {
  const mesh = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const geometry = mesh.current?.geometry;
    const position = geometry?.getAttribute('position');
    if (!position) return;

    const time = clock.elapsedTime;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      position.setZ(
        i,
        Math.sin(x * 1.4 + time) * 0.16 + Math.cos(y * 1.2 + time * 0.8) * 0.12
      );
    }
    position.needsUpdate = true;
  });

  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2.4, 0, 0.15]} position={[1.8, -0.2, 0]}>
      <planeGeometry args={[7, 4.5, 28, 18]} />
      <meshStandardMaterial color="#ff6622" wireframe />
    </mesh>
  );
}

export default function WavesScene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.4, 4.5], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={2.0} />
      <Waves />
    </Canvas>
  );
}
