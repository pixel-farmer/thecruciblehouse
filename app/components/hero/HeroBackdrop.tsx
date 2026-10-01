'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, type ComponentType } from 'react';
import { siteConfig, type HeroSceneId } from '@/site.config';
import styles from '../../styles/Home.module.css';

const sceneLoaders: Record<Exclude<HeroSceneId, 'off'>, ComponentType> = {
  waves: dynamic(() => import('./scenes/WavesScene'), { ssr: false }),
  grid: dynamic(() => import('./scenes/GridScene'), { ssr: false }),
  molten: dynamic(() => import('./scenes/MoltenScene'), { ssr: false }),
};

export default function HeroBackdrop() {
  const scene = siteConfig.hero.scene;
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (scene === 'off') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!media.matches) setShow(true);
  }, [scene]);

  if (scene === 'off' || !show) return null;

  const Scene = sceneLoaders[scene];
  return (
    <div className={styles.heroScene} aria-hidden="true">
      <Scene />
    </div>
  );
}
