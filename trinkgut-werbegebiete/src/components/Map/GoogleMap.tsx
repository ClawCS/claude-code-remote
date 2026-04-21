import { useEffect, useRef } from "react";
import {
  PUBLICATIONS,
  STORE_LOCATION,
  type Publication,
  type City,
} from "../../data/publications";
import { useAppStore } from "../../store/useAppStore";
import { fetchDirections } from "../../hooks/useDirections";
import { formatKm, formatMin } from "../../utils/geo";

type Props = {
  ready: boolean;
  onMapReady?: (map: google.maps.Map) => void;
};

type PubMarkers = {
  markers: google.maps.Marker[];
};

const INITIAL_CENTER = { lat: 51.72, lng: 5.9 };
const INITIAL_ZOOM = 9;

function markerIconFor(pub: Publication): google.maps.Symbol {
  if (pub.type === "daily") {
    return {
      path: "M -9 -9 L 9 -9 L 9 9 L -9 9 Z",
      fillColor: pub.color,
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeWeight: 2,
      rotation: 45,
      scale: 1,
      anchor: new google.maps.Point(0, 0),
    };
  }
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: pub.color,
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
    scale: 9,
  };
}

function storeIcon(): google.maps.Symbol {
  return {
    path: "M 0 -18 L 6 -6 L 18 -4 L 9 4 L 12 18 L 0 10 L -12 18 L -9 4 L -18 -4 L -6 -6 Z",
    fillColor: "#c8102e",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2.5,
    scale: 0.9,
    anchor: new google.maps.Point(0, 0),
  };
}

function infoWindowContent(pub: Publication, city: City): string {
  return `
    <div style="font-family: system-ui; padding: 2px 4px; min-width: 200px;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: ${pub.color}; font-weight: 600;">
        ${pub.name}
      </div>
      <div style="font-size: 18px; font-weight: 500; color: #1a1814; margin: 4px 0 2px; font-family: 'Instrument Serif', Georgia, serif;">
        ${city.name} <span style="font-size: 11px; color: #6a6458; text-transform: uppercase;">${city.country}</span>
      </div>
      <div style="font-size: 12px; color: #6a6458; margin-bottom: 6px;">
        ${pub.rhythm} · Auflage ${pub.circulation.toLocaleString("de-DE")}
      </div>
      <div id="drive-${pub.id}-${city.name.replace(/\W/g, "")}" style="font-size: 12px; color: #3a362d;">
        <span style="opacity: 0.6;">Berechne Fahrzeit…</span>
      </div>
    </div>
  `;
}

export default function GoogleMap({ ready, onMapReady }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const pubMarkersRef = useRef<Record<string, PubMarkers>>({});
  const storeMarkerRef = useRef<google.maps.Marker | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(
    null,
  );

  const visible = useAppStore((s) => s.visible);
  const focusedPublicationId = useAppStore((s) => s.focusedPublicationId);
  const bons = useAppStore((s) => s.bons);
  const showHeatmap = useAppStore((s) => s.showHeatmap);

  // init map once
  useEffect(() => {
    if (!ready || !containerRef.current || mapRef.current) return;

    const map = new google.maps.Map(containerRef.current, {
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_RIGHT,
        mapTypeIds: [
          google.maps.MapTypeId.ROADMAP,
          google.maps.MapTypeId.HYBRID,
          google.maps.MapTypeId.TERRAIN,
        ],
      },
      styles: [
        {
          featureType: "poi.business",
          stylers: [{ visibility: "off" }],
        },
        {
          featureType: "transit",
          stylers: [{ visibility: "simplified" }],
        },
      ],
    });

    mapRef.current = map;
    infoWindowRef.current = new google.maps.InfoWindow();

    // Store marker
    storeMarkerRef.current = new google.maps.Marker({
      position: { lat: STORE_LOCATION.lat, lng: STORE_LOCATION.lng },
      map,
      icon: storeIcon(),
      title: STORE_LOCATION.name,
      label: {
        text: "Trinkgut Goch",
        color: "#1a1814",
        fontSize: "12px",
        fontWeight: "600",
        className: "pin-label",
      },
      zIndex: 1000,
    });

    storeMarkerRef.current.addListener("click", () => {
      if (!infoWindowRef.current || !mapRef.current) return;
      infoWindowRef.current.setContent(`
        <div style="font-family: system-ui; padding: 2px 4px;">
          <div style="font-family: 'Instrument Serif', serif; font-size: 22px; font-weight: 500; color: #c8102e;">
            Trinkgut Jammers Goch
          </div>
          <div style="font-size: 13px; color: #3a362d; margin-top: 2px;">
            ${STORE_LOCATION.address}
          </div>
        </div>
      `);
      infoWindowRef.current.open({
        map: mapRef.current,
        anchor: storeMarkerRef.current!,
      });
    });

    // Build all publication markers once
    PUBLICATIONS.forEach((pub) => {
      const markers: google.maps.Marker[] = pub.cities.map((city) => {
        const marker = new google.maps.Marker({
          position: { lat: city.lat, lng: city.lng },
          map,
          icon: markerIconFor(pub),
          title: `${city.name} · ${pub.name}`,
          label: {
            text: city.name,
            color: "#1a1814",
            fontSize: "11px",
            fontWeight: "500",
            className: "pin-label",
          },
        });

        marker.addListener("click", async () => {
          if (!infoWindowRef.current || !mapRef.current) return;
          infoWindowRef.current.setContent(infoWindowContent(pub, city));
          infoWindowRef.current.open({
            map: mapRef.current,
            anchor: marker,
          });

          const res = await fetchDirections(
            { lat: STORE_LOCATION.lat, lng: STORE_LOCATION.lng },
            { lat: city.lat, lng: city.lng },
          );
          const targetId = `drive-${pub.id}-${city.name.replace(/\W/g, "")}`;
          const node = document.getElementById(targetId);
          if (node) {
            const note =
              res.source === "estimate" ? " (Schätzung)" : "";
            node.innerHTML = `
              <strong>${formatMin(res.durationMin)}</strong> ·
              ${formatKm(res.drivingKm)} Fahrweg${note}
            `;
          }
        });

        return marker;
      });
      pubMarkersRef.current[pub.id] = { markers };
    });

    onMapReady?.(map);
  }, [ready, onMapReady]);

  // Toggle visibility
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    PUBLICATIONS.forEach((pub) => {
      const entry = pubMarkersRef.current[pub.id];
      if (!entry) return;
      const show = visible[pub.id] ?? true;
      entry.markers.forEach((m) => m.setMap(show ? map : null));
    });
  }, [visible]);

  // Fit bounds to focused publication OR all visible markers
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    bounds.extend({ lat: STORE_LOCATION.lat, lng: STORE_LOCATION.lng });
    hasPoints = true;

    if (focusedPublicationId) {
      const pub = PUBLICATIONS.find((p) => p.id === focusedPublicationId);
      pub?.cities.forEach((c) => {
        bounds.extend({ lat: c.lat, lng: c.lng });
        hasPoints = true;
      });
    } else {
      PUBLICATIONS.forEach((pub) => {
        if (!(visible[pub.id] ?? true)) return;
        pub.cities.forEach((c) => {
          bounds.extend({ lat: c.lat, lng: c.lng });
          hasPoints = true;
        });
      });
    }

    if (hasPoints) {
      map.fitBounds(bounds, 80);
    }
  }, [visible, focusedPublicationId]);

  // Heatmap layer
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
      heatmapRef.current = null;
    }
    if (!showHeatmap || bons.length === 0) return;
    if (!google.maps.visualization) return;

    const data = bons.map(
      (b) =>
        ({
          location: new google.maps.LatLng(b.lat, b.lng),
          weight: b.anzahlBons,
        }) as google.maps.visualization.WeightedLocation,
    );

    heatmapRef.current = new google.maps.visualization.HeatmapLayer({
      data,
      map,
      radius: 35,
      opacity: 0.7,
    });
  }, [bons, showHeatmap]);

  return (
    <div
      ref={containerRef}
      className="h-[55vh] min-h-[420px] w-full rounded-2xl border border-ink-900/10 bg-cream-200 shadow-card"
    />
  );
}
