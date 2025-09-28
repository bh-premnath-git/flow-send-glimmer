import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl, { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import type { Feature, FeatureCollection, GeoJsonProperties, LineString, Point } from 'geojson';
import React, { useEffect, useMemo, useRef } from 'react';
import type { TransferHistoryEntry } from '../types/transfers';

export const COUNTRY_COORDINATES: Record<string, { name: string; coordinates: [number, number] }> = {
  UK: { name: 'United Kingdom', coordinates: [-0.1276, 51.5074] },
  US: { name: 'United States', coordinates: [-74.0059, 40.7128] },
  IN: { name: 'India', coordinates: [77.209, 28.6139] },
  CA: { name: 'Canada', coordinates: [-79.3832, 43.6532] },
  AU: { name: 'Australia', coordinates: [151.2093, -33.8688] },
  DE: { name: 'Germany', coordinates: [13.405, 52.52] },
  FR: { name: 'France', coordinates: [2.3522, 48.8566] },
  JP: { name: 'Japan', coordinates: [139.6917, 35.6895] },
  SG: { name: 'Singapore', coordinates: [103.8198, 1.3521] },
  AE: { name: 'United Arab Emirates', coordinates: [55.2708, 25.2048] },
};

const EMPTY_COLLECTION: FeatureCollection<LineString | Point, GeoJsonProperties> = {
  type: 'FeatureCollection',
  features: [],
};

interface TransferMapProps {
  transferHistory: TransferHistoryEntry[];
  currentTransfer: TransferHistoryEntry | null;
}

const statusPriority: Record<TransferHistoryEntry['status'], number> = {
  active: 3,
  pending: 2,
  completed: 1,
};

const statusColorExpression = [
  'case',
  ['==', ['get', 'isCurrent'], true], '#38bdf8',
  ['==', ['get', 'status'], 'active'], '#38bdf8',
  ['==', ['get', 'status'], 'pending'], '#fbbf24',
  '#22c55e',
];

const TransferMap: React.FC<TransferMapProps> = ({ transferHistory, currentTransfer }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const currentTransferId = currentTransfer?.id ?? null;

  const { lineCollection, pointCollection } = useMemo(() => {
    const countryStatus = new Map<string, { status: TransferHistoryEntry['status']; count: number }>();

    const lineFeatures: Feature<LineString, GeoJsonProperties>[] = [];

    transferHistory.forEach((transfer) => {
      const from = COUNTRY_COORDINATES[transfer.fromCountry];
      const to = COUNTRY_COORDINATES[transfer.toCountry];

      if (!from || !to) {
        return;
      }

      const updateCountryStatus = (code: string) => {
        const entry = countryStatus.get(code);
        if (!entry || statusPriority[transfer.status] > statusPriority[entry.status]) {
          countryStatus.set(code, { status: transfer.status, count: 1 });
        } else if (entry) {
          entry.count += 1;
          countryStatus.set(code, entry);
        }
      };

      updateCountryStatus(transfer.fromCountry);
      updateCountryStatus(transfer.toCountry);

      lineFeatures.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [from.coordinates, to.coordinates],
        },
        properties: {
          id: transfer.id,
          status: transfer.status,
          isCurrent: transfer.id === currentTransferId,
        },
      });
    });

    const pointFeatures: Feature<Point, GeoJsonProperties>[] = Array.from(countryStatus.entries())
      .map(([code, meta]) => {
        const country = COUNTRY_COORDINATES[code];
        if (!country) {
          return null;
        }

        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: country.coordinates,
          },
          properties: {
            code,
            name: country.name,
            status: meta.status,
            count: meta.count,
            isCurrent:
              currentTransfer?.fromCountry === code || currentTransfer?.toCountry === code,
          },
        };
      })
      .filter((feature): feature is Feature<Point, GeoJsonProperties> => Boolean(feature));

    const lines: FeatureCollection<LineString, GeoJsonProperties> = {
      type: 'FeatureCollection',
      features: lineFeatures,
    };

    const points: FeatureCollection<Point, GeoJsonProperties> = {
      type: 'FeatureCollection',
      features: pointFeatures,
    };

    return { lineCollection: lines, pointCollection: points };
  }, [transferHistory, currentTransfer, currentTransferId]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [15, 20],
      zoom: 1.4,
      attributionControl: false,
      maxBounds: [-180, -85, 180, 85],
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    const onLoad = () => {
      if (map.getSource('transfer-lines')) {
        return;
      }

      map.addSource('transfer-lines', {
        type: 'geojson',
        data: EMPTY_COLLECTION,
      });

      map.addLayer({
        id: 'transfer-lines',
        type: 'line',
        source: 'transfer-lines',
        paint: {
          'line-color': statusColorExpression,
          'line-width': [
            'case',
            ['==', ['get', 'isCurrent'], true], 3.5,
            ['==', ['get', 'status'], 'active'], 2.8,
            ['==', ['get', 'status'], 'pending'], 2,
            1.2,
          ],
          'line-opacity': [
            'case',
            ['==', ['get', 'isCurrent'], true], 0.9,
            ['==', ['get', 'status'], 'active'], 0.75,
            ['==', ['get', 'status'], 'pending'], 0.6,
            0.4,
          ],
          'line-dasharray': [1.5, 1],
          'line-cap': 'round',
          'line-join': 'round',
        },
      });

      map.addSource('transfer-points', {
        type: 'geojson',
        data: EMPTY_COLLECTION,
      });

      map.addLayer({
        id: 'transfer-point-glow',
        type: 'circle',
        source: 'transfer-points',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'count'], 0],
            0,
            6,
            10,
            10,
            30,
            16,
          ],
          'circle-color': statusColorExpression,
          'circle-opacity': [
            'case',
            ['==', ['get', 'isCurrent'], true], 0.45,
            ['==', ['get', 'status'], 'active'], 0.35,
            0.2,
          ],
        },
      });

      map.addLayer({
        id: 'transfer-points',
        type: 'circle',
        source: 'transfer-points',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'count'], 0],
            0,
            3.5,
            10,
            6,
            30,
            10,
          ],
          'circle-color': statusColorExpression,
          'circle-opacity': 0.9,
          'circle-stroke-width': [
            'case',
            ['==', ['get', 'isCurrent'], true], 2,
            1,
          ],
          'circle-stroke-color': '#0f172a',
        },
      });

      map.addLayer({
        id: 'transfer-labels',
        type: 'symbol',
        source: 'transfer-points',
        layout: {
          'text-field': ['get', 'code'],
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-offset': [0, 1.2],
          'text-size': 12,
        },
        paint: {
          'text-color': '#e2e8f0',
          'text-halo-color': '#0f172a',
          'text-halo-width': 1.5,
        },
      });
    };

    map.on('load', onLoad);

    return () => {
      map.off('load', onLoad);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const applyData = () => {
      const lineSource = map.getSource('transfer-lines') as GeoJSONSource | undefined;
      const pointSource = map.getSource('transfer-points') as GeoJSONSource | undefined;

      if (!lineSource || !pointSource) {
        return;
      }

      lineSource.setData(lineCollection);
      pointSource.setData(pointCollection);
    };

    if (map.isStyleLoaded()) {
      applyData();
    } else {
      const handleLoad = () => {
        applyData();
      };
      map.once('load', handleLoad);
      return () => {
        map.off('load', handleLoad);
      };
    }
  }, [lineCollection, pointCollection]);

  return <div ref={containerRef} className="w-full h-full rounded-2xl overflow-hidden" />;
};

export default TransferMap;
