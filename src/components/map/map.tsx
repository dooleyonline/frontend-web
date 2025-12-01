'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Polygon } from 'geojson';
import type {
  ControlPosition,
  IControl,
  Map as MapLibreMap,
  MapGeoJSONFeature,
  MapLayerMouseEvent,
  MapMouseEvent,
} from 'maplibre-gl';

import api from '@/lib/api';
import { cn } from '@/lib/utils';

type ZoneKey = 'main' | 'woodruff' | 'hospital' | 'clairmont';
type SpotProperties = {
  name?: string;
  desc?: string;
  zone?: string;
};

const DEFAULT_CENTER: [number, number] = [-84.32, 33.7955];

export type SelectedSpot = {
  name: string;
  desc?: string;
  coordinates: [number, number];
  zone?: string;
  category: 'meetup' | 'accessible';
};

const PALETTE = {
  zoneFill: '#90caf9',
  zoneFillActive: '#64b5f6',
  zoneLine: '#1976d2',
  poi: '#002f6c',
  poiSelected: '#053472',
  accPoi: '#f2a900',
  accPoiSelected: '#f5bd05',
  label: '#263238',
};

class ResetControl implements IControl {
  private mapInstance?: MapLibreMap;
  private container: HTMLElement | null = null;
  private readonly onReset: () => void;

  constructor(onReset: () => void) {
    this.onReset = onReset;
  }

  onAdd(map: MapLibreMap): HTMLElement {
    this.mapInstance = map;

    const container = document.createElement('div');
    container.className = 'maplibregl-ctrl maplibregl-ctrl-group';

    const button = document.createElement('button');
    button.type = 'button';
    button.title = 'Reset View';
    button.textContent = 'Reset';
    button.style.fontSize = '14px';
    button.style.lineHeight = '18px';
    button.style.cursor = 'pointer';
    button.onclick = this.onReset;

    container.appendChild(button);
    this.container = container;
    return container;
  }

  onRemove(): void {
    if (this.container?.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.mapInstance = undefined;
  }

  getDefaultPosition(): ControlPosition {
    return 'top-left';
  }
}

export type CampusMapProps = {
  initialCenter?: [number, number];
  initialZoom?: number;
  className?: string;
  onSelectSpot?: (spot: SelectedSpot) => void;
};

export function CampusMap({
  initialCenter = DEFAULT_CENTER,
  initialZoom = 14,
  className,
  onSelectSpot,
}: CampusMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  function computeZoom(base: number) {
    if (typeof window === 'undefined') return base;
    const aspect = window.innerHeight / window.innerWidth;
    let zoom = base;
    if (aspect > 1.3) zoom -= 0.3;
    if (aspect > 1.6) zoom -= 0.6;
    if (aspect > 1.9) zoom -= 1.0;
    return Math.max(zoom, 13);
  }

  const [effectiveZoom, setEffectiveZoom] = useState(() => computeZoom(initialZoom));
  const [selectedPoi, setSelectedPoi] = useState<SelectedSpot | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const effectiveZoomRef = useRef(effectiveZoom);

  const initialCenterKey = `${initialCenter[0]},${initialCenter[1]}`;
  const resolvedCenter = useMemo<[number, number]>(() => {
    const [lngStr, latStr] = initialCenterKey.split(',');
    const lng = Number(lngStr);
    const lat = Number(latStr);
    return [Number.isFinite(lng) ? lng : DEFAULT_CENTER[0], Number.isFinite(lat) ? lat : DEFAULT_CENTER[1]];
  }, [initialCenterKey]);

  const zonesQuery = useQuery(api.map.getZones());
  const meetupPlacesQuery = useQuery(api.map.getMeetupPlaces());
  const accessiblePlacesQuery = useQuery(api.map.getAccessiblePlaces());

  const zones = zonesQuery.data;
  const meetupPlaces = meetupPlacesQuery.data;
  const accessiblePlaces = accessiblePlacesQuery.data;

  const mapDataError =
    zonesQuery.error ?? meetupPlacesQuery.error ?? accessiblePlacesQuery.error ?? null;
  const isMapDataReady = Boolean(zones && meetupPlaces && accessiblePlaces);
  const isMapLoading =
    !isMapDataReady &&
    (zonesQuery.isLoading || meetupPlacesQuery.isLoading || accessiblePlacesQuery.isLoading);

  const buildPopupHtml = (name: string, desc?: string) => {
    const trimmed = desc?.trim();
    const descBlock = trimmed
      ? `<div style="margin-top:4px;color:#475569;font-size:12px;line-height:1.4;">${trimmed}</div>`
      : '';
    return `<div style="font-size:14px"><strong>${name}</strong>${descBlock}</div>`;
  };

  function showToast(message: string) {
    setToast(message);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    if (!mapDataError) return;
    const message =
      mapDataError instanceof Error ? mapDataError.message : 'Failed to load map data.';
    showToast(message);
  }, [mapDataError]);

  useEffect(() => {
    effectiveZoomRef.current = effectiveZoom;
  }, [effectiveZoom]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const next = computeZoom(initialZoom);
    setEffectiveZoom((prev) => (Math.abs(prev - next) < 0.001 ? prev : next));
  }, [initialZoom]);

  function handleSelectSpot() {
    if (!selectedPoi) {
      showToast('Select a meetup spot first.');
      return;
    }
    if (onSelectSpot) {
      onSelectSpot(selectedPoi);
      return;
    }
    const { name, desc } = selectedPoi;
    showToast(desc ? `Selected Spot: ${name} - ${desc}` : name);
  }

  useEffect(() => {
    if (!containerRef.current) return;
    if (!zones || !meetupPlaces || !accessiblePlaces) return;

    if (mapRef.current) {
      const map = mapRef.current;
      (map.getSource('zones') as { setData?: (data: unknown) => void } | undefined)?.setData?.(zones);
      (map.getSource('places') as { setData?: (data: unknown) => void } | undefined)?.setData?.(
        meetupPlaces,
      );
      (
        map.getSource('accessible') as { setData?: (data: unknown) => void } | undefined
      )?.setData?.(accessiblePlaces);
      return;
    }

    let isCancelled = false;
    let cleanup = () => {};

    (async () => {
      const maplibre = await import('maplibre-gl');
      if (isCancelled) return;

      const startingZoom = computeZoom(initialZoom);
      effectiveZoomRef.current = startingZoom;
      setEffectiveZoom(startingZoom);

      const map = new maplibre.Map({
        container: containerRef.current!,
        style: `https://api.maptiler.com/maps/streets/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`,
        center: resolvedCenter,
        zoom: startingZoom,
      });

      mapRef.current = map;
      map.addControl(new maplibre.NavigationControl(), 'top-right');

      let activeZone: ZoneKey | null = null;
      let selectedPoiId: string | null = null;
      let selectedAccId: string | null = null;

      const boundsFromPolygon = (polygon: Polygon) => {
        const bounds = new maplibre.LngLatBounds();
        polygon.coordinates[0]?.forEach(([lng, lat]) => bounds.extend([lng, lat]));
        return bounds;
      };

      map.on('load', () => {
        map.addSource('zones', {
          type: 'geojson',
          data: zones,
          promoteId: 'key',
        });

        map.addLayer({
          id: 'zones-fill',
          type: 'fill',
          source: 'zones',
          paint: {
            'fill-color': PALETTE.zoneFill,
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'active'], false],
              0.05,
              0.2,
            ],
          },
        });

        map.addLayer({
          id: 'zones-line',
          type: 'line',
          source: 'zones',
          paint: {
            'line-color': PALETTE.zoneLine,
            'line-width': 2,
          },
        });

        map.addLayer({
          id: 'zones-label',
          type: 'symbol',
          source: 'zones',
          layout: { 'text-field': ['get', 'name'], 'text-size': 13, 'text-offset': [0, 0.3] },
          paint: { 'text-color': PALETTE.label },
        });

        map.addSource('places', { type: 'geojson', data: meetupPlaces, generateId: true });

        map.addLayer({
          id: 'poi-circle',
          type: 'circle',
          source: 'places',
          layout: { visibility: 'none' },
          paint: {
            'circle-radius': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              11,
              7,
            ],
            'circle-color': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              PALETTE.poiSelected,
              PALETTE.poi,
            ],
            'circle-stroke-width': 1.2,
            'circle-stroke-color': '#fff',
          },
        });

        map.setPaintProperty('poi-circle', 'circle-radius-transition', { duration: 5000, delay: 0 });
        map.setPaintProperty('poi-circle', 'circle-color-transition', { duration: 5000, delay: 0 });
        map.setPaintProperty('poi-circle', 'circle-stroke-width-transition', {
          duration: 5000,
          delay: 0,
        });

        map.addSource('accessible', { type: 'geojson', data: accessiblePlaces, generateId: true });

        map.addLayer({
          id: 'acc-poi-circle',
          type: 'circle',
          source: 'accessible',
          layout: { visibility: 'none' },
          paint: {
            'circle-radius': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              11,
              7,
            ],
            'circle-color': [
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              PALETTE.accPoiSelected,
              PALETTE.accPoi,
            ],
            'circle-stroke-width': 1.2,
            'circle-stroke-color': '#fff',
          },
        });

        map.setPaintProperty('acc-poi-circle', 'circle-radius-transition', {
          duration: 5000,
          delay: 0,
        });
        map.setPaintProperty('acc-poi-circle', 'circle-color-transition', { duration: 5000, delay: 0 });
        map.setPaintProperty('acc-poi-circle', 'circle-stroke-width-transition', {
          duration: 5000,
          delay: 0,
        });

        const setPointer = (active = true) => {
          map.getCanvas().style.cursor = active ? 'pointer' : '';
        };

        map.on('mouseenter', 'zones-fill', () => setPointer(true));
        map.on('mouseleave', 'zones-fill', () => setPointer(false));
        map.on('mouseenter', 'poi-circle', () => setPointer(true));
        map.on('mouseleave', 'poi-circle', () => setPointer(false));
        map.on('mouseenter', 'acc-poi-circle', () => setPointer(true));
        map.on('mouseleave', 'acc-poi-circle', () => setPointer(false));

        const clearSelection = () => {
          if (selectedPoiId) {
            map.setFeatureState({ source: 'places', id: selectedPoiId }, { selected: false });
            selectedPoiId = null;
          }
          if (selectedAccId) {
            map.setFeatureState({ source: 'accessible', id: selectedAccId }, { selected: false });
            selectedAccId = null;
          }
          setSelectedPoi(null);
        };

        map.on('click', 'zones-fill', (event: MapLayerMouseEvent) => {
          clearSelection();

          const feature = event.features?.[0] as MapGeoJSONFeature | undefined;
          if (!feature) return;

          const properties = (feature.properties ?? null) as Record<string, unknown> | null;
          const zoneValue = properties?.key;
          const zone = typeof zoneValue === 'string' ? (zoneValue as ZoneKey) : null;
          if (!zone) return;

          if (activeZone) {
            map.setFeatureState({ source: 'zones', id: activeZone }, { active: false });
          }
          map.setFeatureState({ source: 'zones', id: zone }, { active: true });
          activeZone = zone;

          map.setFilter('poi-circle', ['==', ['get', 'zone'], zone]);
          map.setLayoutProperty('poi-circle', 'visibility', 'visible');

          map.setFilter('acc-poi-circle', ['==', ['get', 'zone'], zone]);
          map.setLayoutProperty('acc-poi-circle', 'visibility', 'visible');

          if (feature.geometry.type !== 'Polygon') return;
          const polygon = feature.geometry;
          const bounds = boundsFromPolygon(polygon);
          map.fitBounds(bounds, {
            padding: { top: 50, bottom: 50, left: 40, right: 40 },
            duration: 800,
          });

          setSelectedPoi(null);
        });

        map.on('click', 'poi-circle', (event: MapLayerMouseEvent) => {
          if (selectedAccId) {
            map.setFeatureState({ source: 'accessible', id: selectedAccId }, { selected: false });
            selectedAccId = null;
          }

          const feature = event.features?.[0] as MapGeoJSONFeature | undefined;
          if (!feature) return;
          const featureId = feature.id;
          if (featureId == null) return;
          const id = String(featureId);

          if (selectedPoiId) {
            map.setFeatureState({ source: 'places', id: selectedPoiId }, { selected: false });
          }
          map.setFeatureState({ source: 'places', id }, { selected: true });
          selectedPoiId = id;

          if (feature.geometry.type !== 'Point') return;
          const coordinates = feature.geometry.coordinates as [number, number];

          const properties = (feature.properties ?? null) as SpotProperties | null;
          const name = properties?.name ?? 'Place';
          const desc = properties?.desc ?? '';
          const zone = typeof properties?.zone === 'string' ? properties.zone : undefined;

          setSelectedPoi({ name, desc, zone, coordinates, category: 'meetup' });

          new maplibre.Popup({ offset: 8, closeOnMove: true })
            .setLngLat(coordinates)
            .setHTML(buildPopupHtml(name, desc))
            .addTo(map);
        });

        map.on('click', 'acc-poi-circle', (event: MapLayerMouseEvent) => {
          if (selectedPoiId) {
            map.setFeatureState({ source: 'places', id: selectedPoiId }, { selected: false });
            selectedPoiId = null;
          }

          const feature = event.features?.[0] as MapGeoJSONFeature | undefined;
          if (!feature) return;
          const featureId = feature.id;
          if (featureId == null) return;
          const id = String(featureId);

          if (selectedAccId) {
            map.setFeatureState({ source: 'accessible', id: selectedAccId }, { selected: false });
          }
          map.setFeatureState({ source: 'accessible', id }, { selected: true });
          selectedAccId = id;

          if (feature.geometry.type !== 'Point') return;
          const coordinates = feature.geometry.coordinates as [number, number];

          const properties = (feature.properties ?? null) as SpotProperties | null;
          const name = properties?.name ?? 'Accessible Spot';
          const desc = properties?.desc ?? '';
          const zone = typeof properties?.zone === 'string' ? properties.zone : undefined;

          setSelectedPoi({ name, desc, zone, coordinates, category: 'accessible' });

          new maplibre.Popup({ offset: 8, closeOnMove: true })
            .setLngLat(coordinates)
            .setHTML(buildPopupHtml(name, desc))
            .addTo(map);
        });

        map.on('click', (event: MapMouseEvent) => {
          const hits = map.queryRenderedFeatures(event.point, {
            layers: ['poi-circle', 'acc-poi-circle', 'zones-fill'],
          });
          if (!hits || hits.length === 0) {
            clearSelection();
          }
        });

        const resetView = () => {
          if (activeZone) {
            map.setFeatureState({ source: 'zones', id: activeZone }, { active: false });
            activeZone = null;
          }
          map.setLayoutProperty('poi-circle', 'visibility', 'none');
          map.setLayoutProperty('acc-poi-circle', 'visibility', 'none');
          if (selectedPoiId) {
            map.setFeatureState({ source: 'places', id: selectedPoiId }, { selected: false });
            selectedPoiId = null;
          }
          if (selectedAccId) {
            map.setFeatureState({ source: 'accessible', id: selectedAccId }, { selected: false });
            selectedAccId = null;
          }
          setSelectedPoi(null);

          map.easeTo({ center: resolvedCenter, zoom: effectiveZoomRef.current, duration: 600 });
        };

        map.addControl(new ResetControl(resetView), 'top-left');
        map.once('idle', () => map.resize());
      });

      cleanup = () => {
        mapRef.current = null;
        map.remove();
      };
    })();

    return () => {
      isCancelled = true;
      cleanup();
    };
  }, [resolvedCenter, initialZoom, zones, meetupPlaces, accessiblePlaces]);

  useEffect(() => {
    function handleResize() {
      const nextZoom = computeZoom(initialZoom);
      setEffectiveZoom(nextZoom);
      if (mapRef.current) {
        mapRef.current.easeTo({ zoom: nextZoom, duration: 400 });
      }
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initialZoom]);

  const showLoadingOverlay = isMapLoading && !mapDataError;
  const showErrorOverlay = !isMapDataReady && Boolean(mapDataError);

  return (
    <div
      className={cn(
        'relative h-[70vh] w-full overflow-hidden rounded-2xl shadow-[0_6px_24px_rgba(0,0,0,0.12)]',
        className,
      )}
    >
      <div ref={containerRef} className="h-full w-full" />

      {showLoadingOverlay ? (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 text-sm font-medium text-muted-foreground">
          Loading map...
        </div>
      ) : null}

      {showErrorOverlay ? (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 px-6 text-center text-sm font-medium text-red-600">
          Unable to load map data. Please try again later.
        </div>
      ) : null}

      {selectedPoi ? (
        <div className="pointer-events-none absolute left-1/2 top-3 max-w-xs -translate-x-1/2 rounded-2xl border border-white/80 bg-white/70 px-5 py-2.5 text-center text-sm font-semibold text-slate-900 shadow-[0_4px_14px_rgba(0,0,0,0.12)] backdrop-blur-lg">
          <div className="font-bold">{selectedPoi.name}</div>
          {selectedPoi.desc ? (
            <div className="mt-1 text-xs font-normal text-slate-600">{selectedPoi.desc}</div>
          ) : null}
        </div>
      ) : null}

      <div className="absolute bottom-3 left-3 min-w-[160px] rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-xs text-slate-700 shadow-[0_8px_20px_rgba(0,0,0,0.12)]">
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <span className="inline-block size-[12px] rounded-full border border-white bg-[#002f6c] shadow-[0_0_0_1px_rgba(0,0,0,0.08)]" />
            Meetup Point
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-block size-[12px] rounded-full border border-white bg-[#f2a900] shadow-[0_0_0_1px_rgba(0,0,0,0.08)]" />
            Car-Accessible Meetup Point
          </li>
        </ul>
      </div>

      <button
        type="button"
        onClick={handleSelectSpot}
        className="absolute bottom-10 right-3 z-10 rounded-full border border-white/10 bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-opacity"
        style={{ opacity: selectedPoi ? 1 : 0.7 }}
      >
        Select This Spot
      </button>

      {toast ? (
        <div className="absolute bottom-6 left-1/2 max-w-xs -translate-x-1/2 rounded-xl border border-white/10 bg-slate-900/90 px-4 py-2 text-center text-sm font-medium text-white shadow-[0_10px_24px_rgba(0,0,0,0.25)]">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
