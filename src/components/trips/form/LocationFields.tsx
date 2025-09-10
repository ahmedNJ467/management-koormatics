import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DisplayTrip } from "@/lib/types/trip";
import { UIServiceType } from "./types";
import { useEffect, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps-loader";

interface LocationFieldsProps {
  editTrip: DisplayTrip | null;
  serviceType?: UIServiceType;
}

export function LocationFields({ editTrip, serviceType }: LocationFieldsProps) {
  const [stops, setStops] = useState<string[]>([]);
  const [gmapsReady, setGmapsReady] = useState(false);

  // Load Google Places library lazily for address autocompletion
  useEffect(() => {
    let cancelled = false;
    async function loadPlaces() {
      try {
        if ((window as any).google?.maps?.places) {
          if (!cancelled) setGmapsReady(true);
          return;
        }

        // Use centralized Google Maps loader with Places library
        await loadGoogleMaps({ libraries: ["places"] });

        // Ensure suggestions appear above dialogs
        const styleId = "gmaps-places-zindex";
        if (!document.getElementById(styleId)) {
          const st = document.createElement("style");
          st.id = styleId;
          st.textContent = `.pac-container{z-index:99999 !important}`;
          document.head.appendChild(st);
        }

        if (!cancelled) setGmapsReady(true);
      } catch {
        // ignore failures; inputs remain plain
      }
    }
    loadPlaces();
    return () => {
      cancelled = true;
    };
  }, []);

  const initAutocomplete = async (input: HTMLInputElement) => {
    const g = (window as any).google;
    if (!g?.maps) return;
    try {
      const placesMod = g.maps.importLibrary
        ? await g.maps.importLibrary("places")
        : g.maps.places;
      const PlaceAutocompleteElement = (placesMod as any)
        ?.PlaceAutocompleteElement;
      if (PlaceAutocompleteElement) {
        const pae = new PlaceAutocompleteElement();
        pae.inputElement = input;
        pae.addEventListener("gmp-placeselect", (ev: any) => {
          const place = ev?.detail?.place || pae?.value;
          const loc = place?.location;
          const lat = typeof loc?.lat === "function" ? loc.lat() : loc?.lat;
          const lng = typeof loc?.lng === "function" ? loc.lng() : loc?.lng;
          const address =
            place?.formatted_address || place?.displayName || input.value;
          input.value = address;
          const latEl = input.parentElement?.querySelector(
            'input[name$="_lat"]'
          ) as HTMLInputElement | null;
          const lngEl = input.parentElement?.querySelector(
            'input[name$="_lng"]'
          ) as HTMLInputElement | null;
          if (latEl && typeof lat === "number") latEl.value = String(lat);
          if (lngEl && typeof lng === "number") lngEl.value = String(lng);
        });
        return;
      }
      // Fallback to legacy Autocomplete for older API
      if (g.maps.places?.Autocomplete) {
        const ac = new g.maps.places.Autocomplete(input, {
          fields: ["formatted_address", "geometry", "name"],
          types: ["geocode"],
        });
        ac.addListener("place_changed", () => {
          const p = ac.getPlace();
          const lat = p.geometry?.location?.lat?.();
          const lng = p.geometry?.location?.lng?.();
          const address = p.formatted_address || p.name || input.value;
          input.value = address;
          const latEl = input.parentElement?.querySelector(
            'input[name$="_lat"]'
          ) as HTMLInputElement | null;
          const lngEl = input.parentElement?.querySelector(
            'input[name$="_lng"]'
          ) as HTMLInputElement | null;
          if (latEl && typeof lat === "number") latEl.value = String(lat);
          if (lngEl && typeof lng === "number") lngEl.value = String(lng);
        });
      }
    } catch {}
  };

  const attachAutocomplete = (input: HTMLInputElement | null) => {
    if (!input || !(window as any).google?.maps) return;
    // Defer to ensure element is in DOM
    setTimeout(() => {
      initAutocomplete(input);
    }, 0);
  };

  const addStop = () => setStops([...stops, ""]);

  const updateStop = (index: number, value: string) => {
    const updated = [...stops];
    updated[index] = value;
    setStops(updated);
  };

  const removeStop = (index: number) => {
    const updated = stops.filter((_, i) => i !== index);
    setStops(updated);
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {/* Pickup */}
      <div className="space-y-2">
        <Label htmlFor="pickup_location">Pickup Location</Label>
        <Input
          id="pickup_location"
          name="pickup_location"
          placeholder="Enter pickup location"
          defaultValue={editTrip?.pickup_location || ""}
          required
          ref={attachAutocomplete}
          autoComplete="off"
        />
        {/* Hidden coords populated by Places */}
        <input
          type="hidden"
          name="pickup_lat"
          defaultValue={"" + (editTrip as any)?.pickup_lat || ""}
        />
        <input
          type="hidden"
          name="pickup_lng"
          defaultValue={"" + (editTrip as any)?.pickup_lng || ""}
        />
      </div>

      {/* Intermediate Stops */}
      {stops.map((stop, index) => (
        <div key={index} className="space-y-2">
          <Label htmlFor={`stop_${index}`}>{`Stop ${index + 1}`}</Label>
          <div className="flex gap-2">
            <Input
              id={`stop_${index}`}
              name="stops[]"
              placeholder="Enter stop location"
              value={stop}
              onChange={(e) => updateStop(index, e.target.value)}
              ref={attachAutocomplete}
              autoComplete="off"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeStop(index)}
            >
              Remove
            </Button>
          </div>
        </div>
      ))}

      {/* Add stop button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addStop}
        className="w-fit"
      >
        + Add Stop
      </Button>

      {/* Drop-off */}
      <div className="space-y-2">
        <Label htmlFor="dropoff_location">Dropoff Location</Label>
        <Input
          id="dropoff_location"
          name="dropoff_location"
          placeholder="Enter dropoff location"
          defaultValue={editTrip?.dropoff_location || ""}
          required
          ref={attachAutocomplete}
          autoComplete="off"
        />
        <input
          type="hidden"
          name="dropoff_lat"
          defaultValue={"" + (editTrip as any)?.dropoff_lat || ""}
        />
        <input
          type="hidden"
          name="dropoff_lng"
          defaultValue={"" + (editTrip as any)?.dropoff_lng || ""}
        />
      </div>
    </div>
  );
}
