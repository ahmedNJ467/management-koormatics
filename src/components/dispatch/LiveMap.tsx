import { DisplayTrip } from "@/lib/types/trip";
import { InterestPoint } from "@/lib/types/interest-point";
import { useEffect, useMemo, useRef, useState } from "react";

// Helper function to create professional SVG icons
const createProfessionalIcon = (category: string, color: string): string => {
  const iconPath = getCategoryIconPath(category);
  return `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
        </filter>
      </defs>
      <circle cx="16" cy="16" r="14" fill="${color}" filter="url(#shadow)"/>
      <circle cx="16" cy="16" r="12" fill="${color}"/>
      <path d="${iconPath}" fill="white" stroke="white" stroke-width="0.5"/>
    </svg>
  `;
};

// Helper function to get SVG path for each category
const getCategoryIconPath = (category: string): string => {
  switch (category) {
    case 'airport':
      return 'M16 8l-2 2v4l2 2 2-2v-4l-2-2zm0 8l-2 2v4l2 2 2-2v-4l-2-2z';
    case 'port':
      return 'M8 12h16v8H8v-8zm2 2v4h12v-4H10z';
    case 'market':
      return 'M8 8h16v16H8V8zm2 2v12h12V10H10z M12 12h8v2h-8v-2z M12 16h8v2h-8v-2z';
    case 'city':
      return 'M8 8h6v6H8V8zm10 0h6v6h-6V8z M8 16h6v6H8v-6zm10 0h6v6h-6v-6z';
    case 'security':
      return 'M16 8l-4 4v4l4 4 4-4v-4l-4-4zm0 2l2 2v2l-2 2-2-2v-2l2-2z';
    case 'fuel':
      return 'M16 8l-2 2v8l2 2 2-2V10l-2-2zm0 4l-1 1v2l1 1 1-1v-2l-1-1z';
    case 'health':
      return 'M16 8l-4 4v8l4 4 4-4V12l-4-4zm0 2l2 2v6l-2 2-2-2V12l2-2z';
    case 'restaurant':
      return 'M8 8h16v4H8V8zm0 6h16v2H8v-2zm0 4h16v2H8v-2z';
    case 'hotel':
      return 'M8 8h16v16H8V8zm2 2v12h12V10H10z M12 12h8v2h-8v-2z M12 16h8v2h-8v-2z';
    case 'bank':
      return 'M16 8l-6 4v8h12V12l-6-4zm0 2l4 2v6H12V12l4-2z';
    case 'school':
      return 'M16 8l-6 4v8h12V12l-6-4zm0 2l4 2v6H12V12l4-2z';
    case 'mosque':
      return 'M16 8l-4 4v8l4 4 4-4V12l-4-4zm0 2l2 2v6l-2 2-2-2V12l2-2z';
    default:
      return 'M16 8l-4 4v8l4 4 4-4V12l-4-4z';
  }
};

// Helper function to get emoji icon for info windows
const getCategoryIcon = (category: string): string => {
  switch (category) {
    case 'airport': return '✈️';
    case 'port': return '🚢';
    case 'market': return '🛒';
    case 'city': return '🏙️';
    case 'security': return '🚨';
    case 'fuel': return '⛽';
    case 'health': return '🏥';
    case 'restaurant': return '🍽️';
    case 'hotel': return '🏨';
    case 'bank': return '🏦';
    case 'school': return '🏫';
    case 'mosque': return '🕌';
    default: return '📍';
  }
};

interface LiveMapProps {
  trips: DisplayTrip[];
  interestPoints?: InterestPoint[];
  variant?: "card" | "fullscreen";
  onMapClick?: (lat: number, lng: number) => void;
  showInterestPoints?: boolean;
}

export function LiveMap({ 
  trips, 
  interestPoints = [], 
  variant = "card", 
  onMapClick,
  showInterestPoints = true 
}: LiveMapProps) {
  // Filter active trips that are in progress
  const activeTrips = trips.filter((trip) => trip.status === "in_progress");

  // Google Maps integration only
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const gmapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const interestPointMarkersRef = useRef<any[]>([]);

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

        // Add click listener for adding interest points
        if (onMapClick) {
          map.addListener('click', (event: any) => {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            onMapClick(lat, lng);
          });
        }

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
        if (interestPointMarkersRef.current) {
          interestPointMarkersRef.current.forEach((m) => m.setMap && m.setMap(null));
        }
      } catch {}
      markersRef.current = [];
      interestPointMarkersRef.current = [];
      mapInstanceRef.current = null;
    };
  }, [gmapsKey]);

  // Update markers when points change without re-initializing map
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
          // Clear previous markers
      try {
        markersRef.current.forEach((m) => m.setMap(null));
        interestPointMarkersRef.current.forEach((m) => m.setMap(null));
      } catch {}
      markersRef.current = [];
      interestPointMarkersRef.current = [];

      if (points.length === 0 && routes.length === 0 && (!showInterestPoints || interestPoints.length === 0)) return;

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

      // Add interest point markers
      if (showInterestPoints && interestPoints.length > 0) {
        interestPoints.forEach((point) => {
          if (point.is_active) {
            // Create professional SVG icon based on category
            const iconSvg = createProfessionalIcon(point.category, point.color);
            
            const marker = new g.maps.Marker({
              position: { lat: point.latitude, lng: point.longitude },
              map: mapInstanceRef.current,
              title: point.name,
              icon: {
                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(iconSvg)}`,
                scaledSize: new g.maps.Size(32, 32),
                anchor: new g.maps.Point(16, 32) // Bottom center for proper positioning
              }
            });

            // Add info window for interest points
            const infoWindow = new g.maps.InfoWindow({
              content: `
                <div style="padding: 12px; min-width: 250px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <div style="width: 24px; height: 24px; border-radius: 50%; background: ${point.color}; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">
                      ${getCategoryIcon(point.category)}
                    </div>
                    <div style="font-weight: 600; font-size: 14px; color: #1f2937;">${point.name}</div>
                  </div>
                  ${point.description ? `<div style="margin-bottom: 8px; color: #6b7280; font-size: 13px; line-height: 1.4;">${point.description}</div>` : ''}
                  <div style="font-size: 11px; color: #9ca3af; font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;">
                    ${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}
                  </div>
                </div>
              `
            });

            marker.addListener('click', () => {
              infoWindow.open(mapInstanceRef.current, marker);
            });

            interestPointMarkersRef.current.push(marker);
          }
        });
      }
    }, [points, routes, interestPoints, showInterestPoints]);

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
