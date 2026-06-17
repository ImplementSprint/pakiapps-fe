import { useEffect, useMemo, useState } from "react";

type RoutePoint = {
  lat: number;
  lng: number;
};

interface MapWithRouteProps {
  pickupAddress: string;
  deliveryAddress: string;
  onRouteCalculated?: (duration: string, distance: string, via: string) => void;
}

type RouteState = {
  pickup: RoutePoint | null;
  delivery: RoutePoint | null;
  bbox: string | null;
};

function formatDuration(seconds: number) {
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  if (totalMinutes < 60) return `${totalMinutes} min`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
}

async function geocodeAddress(address: string) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ph&q=${encodeURIComponent(address)}`,
  );
  const result = (await response.json()) as Array<{ lat: string; lon: string }>;
  const match = result[0];

  if (!match) return null;

  return {
    lat: Number(match.lat),
    lng: Number(match.lon),
  };
}

async function fetchRouteMetrics(pickup: RoutePoint, delivery: RoutePoint) {
  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${delivery.lng},${delivery.lat}?overview=false&steps=true`,
  );
  const result = await response.json();
  const route = result.routes?.[0];

  if (!route) return null;

  const roadNames = (route.legs?.[0]?.steps ?? [])
    .map((step: { name?: string }) => step.name?.trim())
    .filter((value: string | undefined): value is string => Boolean(value));

  return {
    duration: formatDuration(Number(route.duration ?? 0)),
    distance: `${(Number(route.distance ?? 0) / 1000).toFixed(1)} km`,
    via: roadNames[0] ? `via ${roadNames.slice(0, 2).join(" / ")}` : "",
  };
}

function buildBounds(pickup: RoutePoint, delivery: RoutePoint) {
  const minLat = Math.min(pickup.lat, delivery.lat);
  const maxLat = Math.max(pickup.lat, delivery.lat);
  const minLng = Math.min(pickup.lng, delivery.lng);
  const maxLng = Math.max(pickup.lng, delivery.lng);
  const padLat = Math.max((maxLat - minLat) * 0.2, 0.02);
  const padLng = Math.max((maxLng - minLng) * 0.2, 0.02);

  return `${minLng - padLng},${minLat - padLat},${maxLng + padLng},${maxLat + padLat}`;
}

export default function MapWithRoute({
  pickupAddress,
  deliveryAddress,
  onRouteCalculated,
}: MapWithRouteProps) {
  const [routeState, setRouteState] = useState<RouteState>({
    pickup: null,
    delivery: null,
    bbox: null,
  });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [pickup, delivery] = await Promise.all([
          geocodeAddress(pickupAddress),
          geocodeAddress(deliveryAddress),
        ]);

        if (cancelled || !pickup || !delivery) return;

        setRouteState({
          pickup,
          delivery,
          bbox: buildBounds(pickup, delivery),
        });

        const metrics = await fetchRouteMetrics(pickup, delivery);
        if (!cancelled && metrics) {
          onRouteCalculated?.(metrics.duration, metrics.distance, metrics.via);
        }
      } catch {
        // Leave the embedded map in its default Manila view if geocoding fails.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [deliveryAddress, onRouteCalculated, pickupAddress]);

  const embedUrl = useMemo(() => {
    if (!routeState.pickup || !routeState.delivery || !routeState.bbox) {
      return "https://www.openstreetmap.org/export/embed.html?bbox=120.90%2C14.48%2C121.10%2C14.70&layer=mapnik";
    }

    return (
      "https://www.openstreetmap.org/export/embed.html?" +
      `bbox=${encodeURIComponent(routeState.bbox)}` +
      "&layer=mapnik" +
      `&marker=${routeState.pickup.lat}%2C${routeState.pickup.lng}` +
      `&marker=${routeState.delivery.lat}%2C${routeState.delivery.lng}`
    );
  }, [routeState]);

  return (
    <iframe
      title="Route map"
      src={embedUrl}
      className="absolute inset-0 h-full w-full border-0"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
