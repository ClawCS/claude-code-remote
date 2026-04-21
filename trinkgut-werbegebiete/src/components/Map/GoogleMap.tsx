import { useEffect, useMemo, useRef, useState } from "react";
import { useGoogleMaps } from "../../hooks/useGoogleMaps";
import { PUBLICATIONS, STORE, type Publication } from "../../data/publications";
import { useStore } from "../../state/store";
import { PublicationLayer } from "./PublicationLayer";
import { Layers, Map as MapIcon, Mountain, Eye, EyeOff } from "lucide-react";

interface Props {
  heatmapPoints?: Array<{ lat: number; lng: number; weight: number }>;
}

export function GoogleMap({ heatmapPoints }: Props): JSX.Element {
  const { status, google, error } = useGoogleMaps();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const storeMarkerRef = useRef<google.maps.Marker | null>(null);
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const activeIds = useStore((s) => s.activeIds);
  const focusedId = useStore((s) => s.focusedId);
  const mapStyle = useStore((s) => s.mapStyle);
  const setMapStyle = useStore((s) => s.setMapStyle);
  const showLabels = useStore((s) => s.showLabels);
  const toggleLabels = useStore((s) => s.toggleLabels);

  const activePubs = useMemo<Publication[]>(
    () => PUBLICATIONS.filter((p) => activeIds.includes(p.id)),
    [activeIds],
  );

  // Init map
  useEffect(() => {
    if (status !== "ready" || !google || !containerRef.current || mapRef.current) return;
    const map = new google.maps.Map(containerRef.current, {
      center: { lat: STORE.lat, lng: STORE.lng },
      zoom: 10,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      gestureHandling: "greedy",
      styles: [
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
      ],
    });
    mapRef.current = map;

    storeMarkerRef.current = new google.maps.Marker({
      map,
      position: { lat: STORE.lat, lng: STORE.lng },
      title: STORE.name,
      zIndex: 9999,
      icon: {
        path: "M 0,-24 C 8,-24 14,-18 14,-10 C 14,-1 0,14 0,14 C 0,14 -14,-1 -14,-10 C -14,-18 -8,-24 0,-24 Z",
        fillColor: "#c8102e",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 3,
        scale: 1.2,
        labelOrigin: new google.maps.Point(0, -10),
      },
      label: {
        text: "TRINKGUT",
        color: "#ffffff",
        fontSize: "10px",
        fontWeight: "700",
      },
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `<div style="font-family:system-ui;padding:4px 6px;min-width:200px;">
        <div style="font-weight:700;color:#c8102e;font-size:13px;margin-bottom:4px;">${STORE.name}</div>
        <div style="font-size:12px;color:#3a3a3a;">${STORE.address}</div>
      </div>`,
    });
    storeMarkerRef.current.addListener("click", () => {
      if (storeMarkerRef.current && mapRef.current) {
        infoWindow.open(mapRef.current, storeMarkerRef.current);
      }
    });

    setMapReady(true);
  }, [status, google]);

  // Map-Style
  useEffect(() => {
    if (!mapRef.current || !google) return;
    const t = mapStyle === "roadmap"
      ? google.maps.MapTypeId.ROADMAP
      : mapStyle === "hybrid"
        ? google.maps.MapTypeId.HYBRID
        : google.maps.MapTypeId.TERRAIN;
    mapRef.current.setMapTypeId(t);
  }, [mapStyle, google]);

  // Fit-bounds auf sichtbare Publikationen
  useEffect(() => {
    if (!mapRef.current || !google) return;
    if (focusedId) {
      const pub = PUBLICATIONS.find((p) => p.id === focusedId);
      if (pub && pub.cities.length) {
        const bounds = new google.maps.LatLngBounds();
        pub.cities.forEach((c) => bounds.extend({ lat: c.lat, lng: c.lng }));
        bounds.extend({ lat: STORE.lat, lng: STORE.lng });
        mapRef.current.fitBounds(bounds, 64);
      }
      return;
    }
    if (activePubs.length === 0) {
      mapRef.current.panTo({ lat: STORE.lat, lng: STORE.lng });
      mapRef.current.setZoom(10);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    activePubs.forEach((p) => p.cities.forEach((c) => bounds.extend({ lat: c.lat, lng: c.lng })));
    bounds.extend({ lat: STORE.lat, lng: STORE.lng });
    mapRef.current.fitBounds(bounds, 80);
  }, [activePubs, focusedId, google]);

  // Heatmap
  useEffect(() => {
    if (!mapRef.current || !google) return;
    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
      heatmapRef.current = null;
    }
    if (!heatmapPoints || heatmapPoints.length === 0) return;
    const data = heatmapPoints.map((p) => ({
      location: new google.maps.LatLng(p.lat, p.lng),
      weight: p.weight,
    }));
    heatmapRef.current = new google.maps.visualization.HeatmapLayer({
      data,
      map: mapRef.current,
      radius: 32,
      opacity: 0.75,
    });
  }, [heatmapPoints, google]);

  if (status === "no-key") {
    return <NoApiKeyFallback />;
  }
  if (status === "error") {
    return (
      <div className="flex h-[55vh] min-h-[420px] flex-col items-center justify-center rounded-2xl bg-white p-8 text-center shadow-card">
        <div className="font-display text-xl text-trinkgut">Google Maps konnte nicht geladen werden</div>
        <p className="mt-2 max-w-md text-sm text-ink-500">
          {error ?? "Unbekannter Fehler"} — pruefe den API-Key in <code>.env.local</code> und ob Maps/Directions/Geocoding-APIs in der Cloud Console aktiviert sind.
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-cream-200 shadow-card ring-1 ring-ink-900/5">
      <div ref={containerRef} className="h-[55vh] min-h-[420px] w-full bg-cream-200" />

      {/* Map-Style-Umschalter */}
      <div className="pointer-events-auto absolute right-4 top-4 flex overflow-hidden rounded-full bg-white/95 shadow-card ring-1 ring-ink-900/10 backdrop-blur">
        <StyleBtn active={mapStyle === "roadmap"} onClick={() => setMapStyle("roadmap")} label="Strasse">
          <MapIcon size={14} />
        </StyleBtn>
        <StyleBtn active={mapStyle === "hybrid"} onClick={() => setMapStyle("hybrid")} label="Satellit">
          <Layers size={14} />
        </StyleBtn>
        <StyleBtn active={mapStyle === "terrain"} onClick={() => setMapStyle("terrain")} label="Terrain">
          <Mountain size={14} />
        </StyleBtn>
        <button
          onClick={toggleLabels}
          className="flex items-center gap-1 border-l border-ink-900/10 px-3 py-1.5 text-xs text-ink-700 hover:bg-cream-100"
          title={showLabels ? "Labels ausblenden" : "Labels einblenden"}
        >
          {showLabels ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
      </div>

      {/* Legend / Badge unten links */}
      <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs text-ink-700 shadow-card ring-1 ring-ink-900/10 backdrop-blur">
        <span className="h-2 w-2 rounded-full bg-trinkgut" />
        <span className="font-medium">Goch · Jurgensstr. 20</span>
        <span className="text-ink-400">·</span>
        <span>{activePubs.length} / {PUBLICATIONS.length} Publikationen sichtbar</span>
      </div>

      {/* Layer rendern */}
      {mapReady && google && mapRef.current && activePubs.map((pub) => (
        <PublicationLayer
          key={pub.id}
          pub={pub}
          map={mapRef.current!}
          google={google}
          showLabels={showLabels}
        />
      ))}
    </div>
  );
}

function StyleBtn({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-3 py-1.5 text-xs transition-colors ${
        active ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-cream-100"
      }`}
      title={label}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function NoApiKeyFallback(): JSX.Element {
  return (
    <div className="flex h-[55vh] min-h-[420px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-trinkgut/40 bg-white/60 p-8 text-center">
      <div className="font-display text-2xl text-trinkgut">Kein Google Maps API-Key</div>
      <p className="mt-3 max-w-lg text-sm text-ink-700">
        Lege eine Datei <code className="rounded bg-cream-200 px-1.5 py-0.5 font-mono text-xs">.env.local</code> neben der <code>package.json</code> an und setze darin:
      </p>
      <pre className="mt-3 rounded-lg bg-ink-900 px-4 py-3 text-left text-xs text-cream-100">
VITE_GOOGLE_MAPS_API_KEY=dein_key_von_google_cloud
      </pre>
      <p className="mt-3 max-w-lg text-xs text-ink-500">
        Aktiviere in der Google Cloud Console: <strong>Maps JavaScript API</strong>, <strong>Directions API</strong>, <strong>Geocoding API</strong>. Dann Dev-Server neu starten.
      </p>
    </div>
  );
}
