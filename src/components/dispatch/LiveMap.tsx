import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Clock } from "lucide-react";
import { DisplayTrip } from "@/lib/types/trip";
import { useEffect, useMemo, useRef, useState } from "react";

interface LiveMapProps {
  trips: DisplayTrip[];
  variant?: "card" | "fullscreen";
}

export function LiveMap({ trips, variant = "card" }: LiveMapProps) {
  // Filter active trips that are in progress
  const activeTrips = trips.filter((trip) => trip.status === "in_progress");

  // Optional Map integrations (Google or Mapbox)
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const gmapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  const mapInstanceRef = useRef<any>(null);
  const mapProviderRef = useRef<"google" | "mapbox" | null>(null);
  const markersRef = useRef<any[]>([]);

  // Extract coords from trip (supports current_*, pickup_* fallbacks)
  const points = useMemo(() => {
    return activeTrips
      .map((t) => {
        const anyT = t as any;
        const lat = anyT.current_lat ?? anyT.pickup_lat;
        const lng = anyT.current_lng ?? anyT.pickup_lng;
        if (typeof lat === "number" && typeof lng === "number") {
          return { lat, lng, id: t.id, label: t.driver_name || "Trip" };
        }
        return null;
      })
      .filter(Boolean) as {
      lat: number;
      lng: number;
      id: string;
      label: string;
    }[];
  }, [activeTrips]);

  const routes = useMemo(() => {
    return activeTrips
      .map((t) => {
        const anyT = t as any;
        const hasPickup =
          typeof anyT.pickup_lat === "number" &&
          typeof anyT.pickup_lng === "number";
        const hasDrop =
          typeof anyT.dropoff_lat === "number" &&
          typeof anyT.dropoff_lng === "number";
        if (hasPickup && hasDrop) {
          return {
            id: t.id,
            start: { lat: anyT.pickup_lat, lng: anyT.pickup_lng },
            end: { lat: anyT.dropoff_lat, lng: anyT.dropoff_lng },
          };
        }
        return null;
      })
      .filter(Boolean) as {
      id: string;
      start: { lat: number; lng: number };
      end: { lat: number; lng: number };
    }[];
  }, [activeTrips]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const initGoogle = async () => {
      try {
        // 1) If already present, use it immediately
        let g = (window as any).google;
        if (!g?.maps) {
          // 2) Inject with callback and wait until window callback fires
          const scriptId = "gmaps-api-script";
          await new Promise<void>((resolve, reject) => {
            // If another instance already started loading, wait for the callback
            if (typeof (window as any)._gmapsLoaded === "function") {
              (window as any)._gmapsLoadedResolvers = (
                (window as any)._gmapsLoadedResolvers || []
              ).concat(resolve);
              return;
            }
            (window as any)._gmapsLoadedResolvers = [resolve];
            (window as any)._gmapsLoaded = () => {
              const resolvers = (window as any)._gmapsLoadedResolvers || [];
              resolvers.forEach((r: any) => r());
              (window as any)._gmapsLoadedResolvers = [];
            };
            if (!document.getElementById(scriptId)) {
              const s = document.createElement("script");
              s.id = scriptId;
              s.async = true;
              s.defer = true;
              s.src = `https://maps.googleapis.com/maps/api/js?key=${gmapsKey}&v=weekly&loading=async&callback=_gmapsLoaded`;
              s.onerror = () =>
                reject(new Error("Google Maps script failed to load"));
              document.head.appendChild(s);
            }
          });
          g = (window as any).google;
        }
        if (!g?.maps) throw new Error("Google Maps not available on window");
        const defaultCenter = { lat: 2.0469, lng: 45.3182 }; // Mogadishu
        const defaultZoom = 12;
        const map = new g.maps.Map(mapRef.current as HTMLElement, {
          center: defaultCenter,
          zoom: defaultZoom,
          mapTypeId: "satellite",
        });
        mapInstanceRef.current = map;
        mapProviderRef.current = "google";
        setMapReady(true);
      } catch (e) {
        console.warn("Google Maps init failed:", e);
      }
    };

    const initMapbox = async () => {
      try {
        // Inject Mapbox GL JS from CDN to avoid package dependency
        const cssId = "mapbox-gl-css";
        if (!document.getElementById(cssId)) {
          const l = document.createElement("link");
          l.id = cssId;
          l.rel = "stylesheet";
          l.href = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css";
          document.head.appendChild(l);
        }
        const scriptId = "mapbox-gl-script";
        if (!document.getElementById(scriptId)) {
          const s = document.createElement("script");
          s.id = scriptId;
          s.src = "https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js";
          s.async = true;
          document.body.appendChild(s);
          await new Promise((resolve, reject) => {
            s.onload = resolve as any;
            s.onerror = reject as any;
          });
        }
        const mapboxgl = (window as any).mapboxgl;
        if (!mapboxgl) throw new Error("mapboxgl not available on window");
        mapboxgl.accessToken = mapboxToken;
        const center = [45.3182, 2.0469]; // Mogadishu
        const zoom = 12;
        const map = new mapboxgl.Map({
          container: mapRef.current,
          style: "mapbox://styles/mapbox/satellite-streets-v12",
          center,
          zoom,
        });
        map.addControl(new mapboxgl.NavigationControl(), "top-right");
        map.on("load", () => {
          mapInstanceRef.current = map;
          mapProviderRef.current = "mapbox";
          setMapReady(true);
        });
      } catch (e) {
        console.warn("Mapbox init failed:", e);
      }
    };

    if (gmapsKey) initGoogle();
    else if (mapboxToken) initMapbox();

    return () => {
      // Cleanup on unmount
      try {
        if (mapProviderRef.current === "mapbox" && mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }
        if (mapProviderRef.current === "google" && markersRef.current) {
          markersRef.current.forEach((m) => m.setMap && m.setMap(null));
        }
      } catch {}
      markersRef.current = [];
      mapInstanceRef.current = null;
      mapProviderRef.current = null;
    };
  }, [gmapsKey, mapboxToken]);

  // Update markers when points change without re-initializing map
  useEffect(() => {
    if (!mapInstanceRef.current || !mapProviderRef.current) return;
    // Clear previous markers
    try {
      if (mapProviderRef.current === "google") {
        markersRef.current.forEach((m) => m.setMap(null));
      } else if (mapProviderRef.current === "mapbox") {
        markersRef.current.forEach((m) => m.remove());
      }
    } catch {}
    markersRef.current = [];

    if (points.length === 0 && routes.length === 0) return;

    if (mapProviderRef.current === "google") {
      const g = (window as any).google;
      points.forEach((p) => {
        const marker = new g.maps.Marker({
          position: { lat: p.lat, lng: p.lng },
          map: mapInstanceRef.current,
          title: p.label,
        });
        markersRef.current.push(marker);
      });
      // Draw simple polylines for routes (straight line)
      routes.forEach((r) => {
        const poly = new g.maps.Polyline({
          path: [r.start, r.end],
          geodesic: true,
          strokeColor: "#00B3FF",
          strokeOpacity: 0.8,
          strokeWeight: 3,
          map: mapInstanceRef.current,
        });
        markersRef.current.push(poly as any);
      });
    } else if (mapProviderRef.current === "mapbox") {
      const mapboxgl = (window as any).mapboxgl;
      points.forEach((p) => {
        const el = document.createElement("div");
        el.style.width = "10px";
        el.style.height = "10px";
        el.style.background = "#10b981";
        el.style.borderRadius = "9999px";
        const marker = new mapboxgl.Marker(el)
          .setLngLat([p.lng, p.lat])
          .addTo(mapInstanceRef.current);
        markersRef.current.push(marker);
      });
      routes.forEach((r) => {
        const id = `route-${r.id}`;
        const sourceData = {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [
                [r.start.lng, r.start.lat],
                [r.end.lng, r.end.lat],
              ],
            },
          },
        } as any;
        const map = mapInstanceRef.current as any;
        if (map.getSource(id)) map.removeLayer(id), map.removeSource(id);
        map.addSource(id, sourceData);
        map.addLayer({
          id,
          type: "line",
          source: id,
          paint: {
            "line-color": "#00B3FF",
            "line-width": 3,
            "line-opacity": 0.8,
          },
        });
      });
    }
  }, [points, routes]);

  if (variant === "fullscreen") {
    return (
      <div className="h-full w-full">
        {gmapsKey || mapboxToken ? (
          <div ref={mapRef} className="h-full w-full" />
        ) : (
          <div className="bg-muted/30 h-full w-full flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Map placeholder</p>
              <p className="text-xs text-muted-foreground">
                Set NEXT_PUBLIC_GOOGLE_MAPS_KEY or NEXT_PUBLIC_MAPBOX_TOKEN to
                enable live map
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full">
      <div className="rounded-lg h-full border overflow-hidden">
        {gmapsKey || mapboxToken ? (
          <div ref={mapRef} className="h-full w-full" />
        ) : (
          <div className="bg-muted/30 h-full flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Map placeholder</p>
              <p className="text-xs text-muted-foreground">
                Set NEXT_PUBLIC_GOOGLE_MAPS_KEY or NEXT_PUBLIC_MAPBOX_TOKEN to
                enable live map
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
