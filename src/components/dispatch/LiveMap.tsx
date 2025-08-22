import { DisplayTrip } from "@/lib/types/trip";
import { useEffect, useMemo, useRef, useState } from "react";

interface LiveMapProps {
  trips: DisplayTrip[];
  variant?: "card" | "fullscreen";
}

export function LiveMap({ trips, variant = "card" }: LiveMapProps) {
  // Filter active trips that are in progress
  const activeTrips = trips.filter((trip) => trip.status === "in_progress");

  // Google Maps integration only
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const gmapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Debug logging
  console.log("LiveMap Debug:", {
    gmapsKey: gmapsKey ? "Available" : "Not available"
  });

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
    console.log("Map initialization effect triggered", {
      mapRef: !!mapRef.current,
      mapInstance: !!mapInstanceRef.current,
    });

    if (!mapRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const initGoogle = async () => {
      try {
        console.log("Starting Google Maps initialization...");
        console.log(
          "Google Maps API Key:",
          gmapsKey ? "Available" : "Not available"
        );

        // 1) If already present, use it immediately
        let g = (window as any).google;
        if (!g?.maps) {
          console.log("Google Maps not loaded, injecting script...");
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

        console.log("Creating Google Maps instance...");
        const defaultCenter = { lat: 2.0469, lng: 45.3182 }; // Mogadishu
        const defaultZoom = 12;
        const map = new g.maps.Map(mapRef.current as HTMLElement, {
          center: defaultCenter,
          zoom: defaultZoom,
          mapTypeId: "satellite",
        });

        console.log("Google Maps initialization complete!");
        mapInstanceRef.current = map;
        setMapReady(true);
      } catch (e) {
        console.error("Google Maps init failed:", e);
      }
    };

    // Initialize Google Maps
    if (gmapsKey) {
      initGoogle();
    }

    return () => {
      // Cleanup on unmount
      try {
        if (markersRef.current) {
          markersRef.current.forEach((m) => m.setMap && m.setMap(null));
        }
      } catch {}
      markersRef.current = [];
      mapInstanceRef.current = null;
    };
  }, [gmapsKey]);

  // Update markers when points change without re-initializing map
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    // Clear previous markers
    try {
      markersRef.current.forEach((m) => m.setMap(null));
    } catch {}
    markersRef.current = [];

    if (points.length === 0 && routes.length === 0) return;

    const g = (window as any).google;
    if (!g?.maps) return;

    // Add markers for trip points
    points.forEach((p) => {
      const marker = new g.maps.Marker({
        position: { lat: p.lat, lng: p.lng },
        map: mapInstanceRef.current,
        title: p.label,
      });
      markersRef.current.push(marker);
    });

    // Draw polylines for routes
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
  }, [points, routes]);

  if (variant === "fullscreen") {
    return (
      <div className="h-full w-full relative">


        {gmapsKey ? (
          <div ref={mapRef} className="h-full w-full" />
        ) : (
          <div className="bg-muted/30 h-full w-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">🗺️</div>
              <p className="text-sm text-muted-foreground">
                Google Maps not available
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                API Key: {gmapsKey ? "Configured" : "Missing"}
              </p>
              <p className="text-xs text-muted-foreground">
                Check your environment configuration
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full relative">


      {gmapsKey ? (
        <div ref={mapRef} className="h-full w-full" />
      ) : (
        <div className="bg-muted/30 h-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl mb-2">🗺️</div>
            <p className="text-sm text-muted-foreground">
              Google Maps not available
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              API Key: {gmapsKey ? "Configured" : "Missing"}
            </p>
            <p className="text-xs text-muted-foreground">
              Check your environment configuration
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
