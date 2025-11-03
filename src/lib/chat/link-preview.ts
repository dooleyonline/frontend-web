import { GOOGLE_MAPS_STATIC_API_KEY } from "@/lib/env";

export type LinkPreviewCandidate =
  | {
      kind: "product";
      itemId: string;
      url: string;
    }
  | {
      kind: "google-map";
      url: string;
      query: string;
      label: string;
      center?: {
        lat: number;
        lng: number;
      };
    };

const URL_PATTERN =
  /((?:https?:\/\/|www\.)[^\s]+|\/[^\s]+)/gi;

const tryParseUrl = (value: string): URL | null => {
  try {
    if (value.startsWith("http://") || value.startsWith("https://")) {
      return new URL(value);
    }
    if (value.startsWith("www.")) {
      return new URL(`https://${value}`);
    }
    if (value.startsWith("/")) {
      return new URL(value, "https://local.placeholder");
    }
    return null;
  } catch {
    return null;
  }
};

const decodeComponent = (value: string | null | undefined): string =>
  value ? decodeURIComponent(value.replaceAll("+", " ")) : "";

const extractProductCandidate = (url: URL, rawUrl: string) => {
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 2) return null;
  const [first, second] = segments;
  if (first !== "item") return null;
  if (!second) return null;
  return {
    kind: "product" as const,
    itemId: second,
    url: rawUrl,
  };
};

const extractMapCandidate = (url: URL, rawUrl: string) => {
  const hostname = url.hostname.toLowerCase();
  const isGoogleDomain = hostname.includes("google.");
  const isMapsHost = hostname.includes("maps");
  const isMapsPath = url.pathname.toLowerCase().includes("/maps");

  if (!(isGoogleDomain && (isMapsHost || isMapsPath))) {
    return null;
  }

  const params = url.searchParams;
  const queryParam =
    decodeComponent(params.get("q")) ||
    decodeComponent(params.get("query")) ||
    decodeComponent(params.get("destination")) ||
    decodeComponent(params.get("center"));

  let lat: number | undefined;
  let lng: number | undefined;
  let label = queryParam;

  const atMatch = url.href.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    lat = Number.parseFloat(atMatch[1]);
    lng = Number.parseFloat(atMatch[2]);
  } else if (queryParam) {
    const coordMatch = queryParam.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
    if (coordMatch) {
      lat = Number.parseFloat(coordMatch[1]);
      lng = Number.parseFloat(coordMatch[2]);
    }
  }

  if (!label) {
    const pathSegments = url.pathname.split("/").filter(Boolean);
    const placeIndex = pathSegments.findIndex((segment) => segment === "place");
    if (placeIndex !== -1 && pathSegments.length > placeIndex + 1) {
      label = decodeComponent(pathSegments[placeIndex + 1]);
    }
  }

  if (!label && lat !== undefined && lng !== undefined) {
    label = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }

  if (!label) return null;

  const query = lat !== undefined && lng !== undefined ? `${lat},${lng}` : label;

  return {
    kind: "google-map" as const,
    url: rawUrl,
    query,
    label,
    center:
      lat !== undefined && lng !== undefined
        ? {
            lat,
            lng,
          }
        : undefined,
  };
};

export const extractLinkPreviewCandidate = (
  body: string,
): LinkPreviewCandidate | null => {
  if (!body) return null;
  const matches = body.match(URL_PATTERN);
  if (!matches) return null;

  for (const match of matches) {
    const rawUrl = match;
    const normalized = match.startsWith("www.") ? `https://${match}` : match;
    const url = tryParseUrl(normalized);
    if (!url) continue;

    const productCandidate = extractProductCandidate(url, rawUrl);
    if (productCandidate) {
      return productCandidate;
    }

    const mapCandidate = extractMapCandidate(url, rawUrl);
    if (mapCandidate) {
      return mapCandidate;
    }
  }

  return null;
};

export const buildGoogleStaticMapUrl = (
  query: string,
  center?: { lat: number; lng: number },
): string | null => {
  if (!GOOGLE_MAPS_STATIC_API_KEY) return null;

  const params = new URLSearchParams({
    size: "600x360",
    scale: "2",
    maptype: "roadmap",
    key: GOOGLE_MAPS_STATIC_API_KEY,
  });

  if (center) {
    const coordinate = `${center.lat},${center.lng}`;
    params.set("center", coordinate);
    params.set("markers", `color:red|${coordinate}`);
  } else {
    params.set("center", query);
    params.set("markers", `color:red|${query}`);
  }

  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
};
