
import type { Feature, FeatureCollection, Point, Polygon } from "geojson";
import { z } from "zod";

import { ApiQueryOptions } from "./shared";

type SpotProperties = {
  name: string;
  desc?: string;
  zone?: string;
};

type ZoneProperties = {
  key: string;
  name: string;
};

export type MapPlacesFeatureCollection = FeatureCollection<
  Point,
  SpotProperties
>;
export type MapAccessibleFeatureCollection = FeatureCollection<
  Point,
  SpotProperties
>;
export type MapZonesFeatureCollection = FeatureCollection<
  Polygon,
  ZoneProperties
>;

const coordinateTupleSchema = z.tuple([z.number(), z.number()]);

const pointFeatureSchema: z.ZodType<Feature<Point, SpotProperties>> = z.object({
  type: z.literal("Feature"),
  id: z.union([z.string(), z.number()]).optional(),
  properties: z.object({
    name: z.string(),
    desc: z.string().optional(),
    zone: z.string().optional(),
  }),
  geometry: z.object({
    type: z.literal("Point"),
    coordinates: coordinateTupleSchema,
  }),
});

const pointCollectionSchema: z.ZodType<MapPlacesFeatureCollection> = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(pointFeatureSchema),
});

const linearRingSchema = z.array(coordinateTupleSchema).min(4);
const polygonCoordinatesSchema = z.array(linearRingSchema).min(1);

const zoneFeatureSchema: z.ZodType<Feature<Polygon, ZoneProperties>> = z
  .object({
    type: z.literal("Feature"),
    id: z.union([z.string(), z.number()]).optional(),
    properties: z.object({
      key: z.string(),
      name: z.string(),
    }),
    geometry: z.object({
      type: z.literal("Polygon"),
      coordinates: polygonCoordinatesSchema,
    }),
  });

const zoneCollectionSchema: z.ZodType<MapZonesFeatureCollection> = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(zoneFeatureSchema),
});

const createMapQuery = <T>(
  key: ["map", string],
  path: string,
  schema: z.ZodType<T>,
): ApiQueryOptions<T> => ({
  queryKey: key,
  queryFn: async ({ signal }) => {
    const response = await fetch(path, { signal });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${path}`);
    }
    const json = await response.json();
    return schema.parse(json);
  },
});

export const getZones = (): ApiQueryOptions<MapZonesFeatureCollection> =>
  createMapQuery(["map", "zones"], "/api/map/zones", zoneCollectionSchema);

export const getMeetupPlaces =
  (): ApiQueryOptions<MapPlacesFeatureCollection> =>
    createMapQuery(["map", "places"], "/api/map/places", pointCollectionSchema);

export const getAccessiblePlaces =
  (): ApiQueryOptions<MapAccessibleFeatureCollection> =>
    createMapQuery(
      ["map", "accessible"],
      "/api/map/accessible",
      pointCollectionSchema,
    );
