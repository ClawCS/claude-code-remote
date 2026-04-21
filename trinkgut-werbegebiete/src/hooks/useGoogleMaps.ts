import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { useEffect, useState } from "react";
import { GOOGLE_MAPS_API_KEY, HAS_API_KEY } from "../utils/config";

let bootPromise: Promise<void> | null = null;

function bootstrap(): Promise<void> {
  if (!HAS_API_KEY) {
    return Promise.reject(new Error("VITE_GOOGLE_MAPS_API_KEY fehlt"));
  }
  if (!bootPromise) {
    setOptions({
      key: GOOGLE_MAPS_API_KEY,
      v: "weekly",
      libraries: ["places", "visualization", "marker", "geocoding", "routes"],
      region: "DE",
      language: "de",
    });
    bootPromise = Promise.all([
      importLibrary("maps"),
      importLibrary("marker"),
      importLibrary("places"),
      importLibrary("geocoding"),
      importLibrary("routes"),
      importLibrary("visualization"),
    ]).then(() => undefined);
  }
  return bootPromise;
}

export function useGoogleMaps() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!HAS_API_KEY) {
      setError("API-Key fehlt in .env.local (VITE_GOOGLE_MAPS_API_KEY)");
      return;
    }
    let cancelled = false;
    bootstrap()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unbekannter Fehler");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { ready, error };
}
