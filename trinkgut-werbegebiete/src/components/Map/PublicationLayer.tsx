import { useEffect, useRef } from "react";
import type { Publication } from "../../data/publications";

interface Props {
  pub: Publication;
  map: google.maps.Map;
  google: typeof window.google;
  showLabels: boolean;
}

/**
 * Rendert alle Staedte einer Publikation als Marker.
 * Wochenblaetter = runde Pins, Tageszeitungen = Rauten (45deg).
 */
export function PublicationLayer({ pub, map, google, showLabels }: Props): null {
  const markersRef = useRef<google.maps.Marker[]>([]);
  const circlesRef = useRef<google.maps.Circle[]>([]);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);

  useEffect(() => {
    if (!infoRef.current) {
      infoRef.current = new google.maps.InfoWindow();
    }
    const info = infoRef.current;

    const isWeekly = pub.kind === "weekly";
    const markers: google.maps.Marker[] = [];
    const circles: google.maps.Circle[] = [];

    for (const city of pub.cities) {
      const icon: google.maps.Symbol = isWeekly
        ? {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: pub.color,
            fillOpacity: 0.95,
            strokeColor: "#ffffff",
            strokeWeight: 2,
            scale: 8,
            labelOrigin: new google.maps.Point(0, 2.5),
          }
        : {
            // Raute = quadrat um 45deg gedreht
            path: "M 0,-9 L 9,0 L 0,9 L -9,0 Z",
            fillColor: pub.color,
            fillOpacity: 0.95,
            strokeColor: "#ffffff",
            strokeWeight: 2,
            scale: 1,
            labelOrigin: new google.maps.Point(0, 18),
          };

      const marker = new google.maps.Marker({
        map,
        position: { lat: city.lat, lng: city.lng },
        title: `${city.name} · ${pub.title}`,
        icon,
        label: showLabels
          ? {
              text: city.name,
              color: "#1a1a1a",
              fontSize: "11px",
              fontWeight: "600",
              className: "gm-marker-label",
            }
          : undefined,
        zIndex: isWeekly ? 100 : 200,
      });

      marker.addListener("click", () => {
        info.setContent(
          `<div style="font-family:system-ui;padding:4px 6px;min-width:220px;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${pub.color};"></span>
              <span style="font-weight:700;font-size:13px;">${city.name}${city.de ? " (DE)" : ""}</span>
            </div>
            <div style="font-size:12px;color:#3a3a3a;">
              <strong>${pub.title}</strong><br/>
              ${pub.rhythm} · ${pub.circulationLabel} Auflage
            </div>
          </div>`,
        );
        info.open(map, marker);
      });

      markers.push(marker);

      // optionaler Reichweiten-Kreis (3 km um jede Stadt)
      const circle = new google.maps.Circle({
        map,
        center: { lat: city.lat, lng: city.lng },
        radius: 3000,
        fillColor: pub.color,
        fillOpacity: 0.07,
        strokeColor: pub.color,
        strokeOpacity: 0.25,
        strokeWeight: 1,
        clickable: false,
        zIndex: 1,
      });
      circles.push(circle);
    }

    markersRef.current = markers;
    circlesRef.current = circles;

    return () => {
      markers.forEach((m) => m.setMap(null));
      circles.forEach((c) => c.setMap(null));
      info.close();
    };
  }, [pub, map, google, showLabels]);

  return null;
}
