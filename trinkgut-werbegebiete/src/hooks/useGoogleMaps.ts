import { Loader } from "@googlemaps/js-api-loader";
import { useEffect, useState } from "react";

/** Singleton-Loader-Promise, damit mehrere Komponenten den Key-Load teilen */
let loaderPromise: Promise<typeof google> | null = null;

export function getApiKey(): string | null {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key || key === "DEIN_API_KEY_HIER" || key.trim() === "") return null;
  return key;
}

export function loadGoogleMaps(): Promise<typeof google> | null {
  const key = getApiKey();
  if (!key) return null;
  if (!loaderPromise) {
    const loader = new Loader({
      apiKey: key,
      version: "weekly",
      libraries: ["places", "geometry", "visualization"],
      language: "de",
      region: "DE",
    });
    loaderPromise = loader.load();
  }
  return loaderPromise;
}

export interface GoogleMapsState {
  status: "idle" | "loading" | "ready" | "error" | "no-key";
  google: typeof google | null;
  error?: string;
}

export function useGoogleMaps(): GoogleMapsState {
  const [state, setState] = useState<GoogleMapsState>(() => ({
    status: getApiKey() ? "loading" : "no-key",
    google: null,
  }));

  useEffect(() => {
    if (state.status !== "loading") return;
    const promise = loadGoogleMaps();
    if (!promise) {
      setState({ status: "no-key", google: null });
      return;
    }
    let mounted = true;
    promise
      .then((g) => {
        if (!mounted) return;
        setState({ status: "ready", google: g });
      })
      .catch((err: Error) => {
        if (!mounted) return;
        setState({ status: "error", google: null, error: err.message });
      });
    return () => {
      mounted = false;
    };
  }, [state.status]);

  return state;
}
