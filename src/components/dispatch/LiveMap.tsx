import { DisplayTrip } from "@/lib/types/trip";
import { InterestPoint } from "@/lib/types/interest-point";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { loadGoogleMaps } from "@/lib/google-maps-loader";
import { getGoogleIconUrl } from "@/lib/utils/google-icons";

// Helper function to get Google Material Icon for info windows
const getCategoryIcon = (category: string): string => {
  switch (category) {
    case "places":
      return "place";
    case "checkpoints":
      return "security";
    case "market":
      return "shopping_cart";
    case "security":
      return "local_police";
    case "fuel":
      return "local_gas_station";
    case "health":
      return "local_hospital";
    case "restaurant":
      return "restaurant";
    case "hotel":
      return "hotel";
    case "bank":
      return "account_balance";
    case "school":
      return "school";
    case "mosque":
      return "mosque";
    default:
      return "place";
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
  showInterestPoints = true,
}: LiveMapProps) {
  // Filter active trips that are in progress
  const activeTrips = trips.filter((trip) => trip.status === "in_progress");

  // Google Maps integration only
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const { getGoogleMapsApiKey } = require("@/config/api-keys");
  const [gmapsKey, setGmapsKey] = useState<string | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const interestPointMarkersRef = useRef<any[]>([]);
  const labelOverlaysRef = useRef<any[]>([]);

  // Load Google Maps API key from database
  useEffect(() => {
    getGoogleMapsApiKey().then((key) => {
      setGmapsKey(key);
    }).catch((error) => {
      console.error("Failed to load Google Maps API key:", error);
    });
  }, [getGoogleMapsApiKey]);

  // Memoize interest points to prevent unnecessary re-renders - show all active points
  const memoizedInterestPoints = useMemo(() => {
    return interestPoints.filter((point) => point.is_active);
  }, [interestPoints]);

  // Debug logging
  console.log("LiveMap Debug:", {
    gmapsKey: gmapsKey ? "Available" : "Not available",
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

        // Use centralized Google Maps loader
        await loadGoogleMaps();

        const g = (window as any).google;
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
          map.addListener("click", (event: any) => {
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
          interestPointMarkersRef.current.forEach(
            (m) => m.setMap && m.setMap(null)
          );
        }
        if (labelOverlaysRef.current) {
          labelOverlaysRef.current.forEach(
            (overlay) => overlay.setMap && overlay.setMap(null)
          );
        }
      } catch {}
      markersRef.current = [];
      interestPointMarkersRef.current = [];
      labelOverlaysRef.current = [];
      mapInstanceRef.current = null;
    };
  }, [gmapsKey]);

  // Update markers when points change without re-initializing map
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear previous markers and labels
    try {
      markersRef.current.forEach((m) => m.setMap && m.setMap(null));
      interestPointMarkersRef.current.forEach(
        (m) => m.setMap && m.setMap(null)
      );
      labelOverlaysRef.current.forEach(
        (overlay) => overlay.setMap && overlay.setMap(null)
      );
    } catch {}
    markersRef.current = [];
    interestPointMarkersRef.current = [];
    labelOverlaysRef.current = [];

    if (
      points.length === 0 &&
      routes.length === 0 &&
      (!showInterestPoints || memoizedInterestPoints.length === 0)
    )
      return;

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

    // Add interest point markers with Google Material Icons
    if (showInterestPoints && memoizedInterestPoints.length > 0) {
      memoizedInterestPoints.forEach((point) => {
        try {
          // Create a custom marker with Google Material Icon
          const iconUrl = getGoogleIconUrl(point.icon || "place");

          const iconConfig = {
            url: iconUrl,
            scaledSize: new g.maps.Size(28, 28),
            anchor: new g.maps.Point(14, 14), // Center for proper positioning
          };

          const marker = new g.maps.Marker({
            position: { lat: point.latitude, lng: point.longitude },
            map: mapInstanceRef.current,
            title: point.name,
            icon: iconConfig,
          });

          // Add name label to the map using a custom overlay (Google Maps style)
          const labelDiv = document.createElement("div");
          labelDiv.className = "interest-point-label";
          labelDiv.textContent = point.name;
          labelDiv.style.position = "absolute";
          labelDiv.style.transform = "translate(-50%, -100%)";
          labelDiv.style.marginTop = "-12px";
          labelDiv.style.pointerEvents = "none";
          labelDiv.style.zIndex = "1000";
          labelDiv.style.backgroundColor = "white";
          labelDiv.style.color = "#1f2937";
          labelDiv.style.padding = "4px 8px";
          labelDiv.style.borderRadius = "4px";
          labelDiv.style.fontSize = "12px";
          labelDiv.style.fontWeight = "500";
          labelDiv.style.fontFamily =
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          labelDiv.style.boxShadow =
            "0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)";
          labelDiv.style.border = "1px solid rgba(0, 0, 0, 0.1)";
          labelDiv.style.whiteSpace = "nowrap";
          labelDiv.style.maxWidth = "200px";
          labelDiv.style.overflow = "hidden";
          labelDiv.style.textOverflow = "ellipsis";

          const labelOverlay = new g.maps.OverlayView();
          labelOverlay.onAdd = function () {
            const panes = this.getPanes();
            panes.overlayLayer.appendChild(labelDiv);
          };
          labelOverlay.draw = function () {
            const projection = this.getProjection();
            const position = projection.fromLatLngToDivPixel(
              new g.maps.LatLng(point.latitude, point.longitude)
            );
            if (position) {
              labelDiv.style.left = position.x + "px";
              labelDiv.style.top = position.y + "px";
            }
          };
          labelOverlay.onRemove = function () {
            if (labelDiv.parentNode) {
              labelDiv.parentNode.removeChild(labelDiv);
            }
          };
          labelOverlay.setMap(mapInstanceRef.current);
          labelOverlaysRef.current.push(labelOverlay);

          // Add info window for interest points with Google Material Icons
          const infoWindow = new g.maps.InfoWindow({
            content: `
                <div style="padding: 16px; min-width: 280px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: ${
                      point.color
                    }; display: flex; align-items: center; justify-content: center; color: white; font-size: 16px;">
                      <img src="https://fonts.gstatic.com/s/i/materialicons/${
                        point.icon
                      }/v1/24px.svg" 
                           style="width: 20px; height: 20px; filter: invert(1);" 
                           alt="${point.icon}" />
                    </div>
                    <div style="font-weight: 600; font-size: 16px; color: #1f2937;">${
                      point.name
                    }</div>
                  </div>
                  ${
                    point.description
                      ? `<div style="margin-bottom: 12px; color: #6b7280; font-size: 14px; line-height: 1.4;">${point.description}</div>`
                      : ""
                  }
                  <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                    <div style="font-size: 12px; color: #9ca3af; font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;">
                      ${point.latitude.toFixed(4)}, ${point.longitude.toFixed(
              4
            )}
                    </div>
                    <div style="font-size: 11px; color: #9ca3af; text-transform: uppercase; font-weight: 500;">
                      ${point.category}
                    </div>
                  </div>
                </div>
            `,
          });

          marker.addListener("click", () => {
            infoWindow.open(mapInstanceRef.current, marker);
          });

          interestPointMarkersRef.current.push(marker);
        } catch (error) {
          console.warn("Error creating interest point marker:", error, point);
        }
      });
    }
  }, [points, routes, memoizedInterestPoints, showInterestPoints]);

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
