'use client';

import dynamic from 'next/dynamic';

import type { CampusMapProps } from './map';

const DynamicCampusMap = dynamic(async () => {
  const mod = await import('./map');
  return mod.CampusMap;
}, { ssr: false });

export function CampusMapWrapper(props: CampusMapProps) {
  return <DynamicCampusMap {...props} />;
}