'use client';

import dynamic from 'next/dynamic';
import TopBar from '@/components/ui/TopBar';
import Dock from '@/components/ui/Dock';
import Panels from '@/components/ui/Panels';
import InfoPanel from '@/components/ui/InfoPanel';
import HUD from '@/components/ui/HUD';

// The Cesium scene touches `window`/WebGL and must never run during SSR.
const CesiumViewer = dynamic(() => import('@/components/CesiumViewer'), {
  ssr: false,
});

export default function Home() {
  return (
    <main>
      <CesiumViewer />
      <TopBar />
      <Dock />
      <Panels />
      <InfoPanel />
      <HUD />
    </main>
  );
}
