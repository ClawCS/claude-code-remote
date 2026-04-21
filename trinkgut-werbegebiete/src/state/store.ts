import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PUBLICATIONS } from "../data/publications";

interface StoreState {
  /** Aktivierte Publikations-IDs */
  activeIds: string[];
  toggle: (id: string) => void;
  setAll: (on: boolean) => void;
  focusedId: string | null;
  setFocused: (id: string | null) => void;

  /** Kosten pro Schaltung (EUR) pro Publication-ID */
  costs: Record<string, number>;
  setCost: (id: string, cost: number) => void;

  /** Map-Style Preference */
  mapStyle: "roadmap" | "hybrid" | "terrain";
  setMapStyle: (s: "roadmap" | "hybrid" | "terrain") => void;

  /** Label-Anzeige unter Markern */
  showLabels: boolean;
  toggleLabels: () => void;
}

const allIds = PUBLICATIONS.map((p) => p.id);

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      activeIds: allIds,
      toggle: (id) =>
        set((s) => ({
          activeIds: s.activeIds.includes(id)
            ? s.activeIds.filter((x) => x !== id)
            : [...s.activeIds, id],
        })),
      setAll: (on) => set({ activeIds: on ? allIds : [] }),

      focusedId: null,
      setFocused: (id) => set({ focusedId: id }),

      costs: {},
      setCost: (id, cost) => set((s) => ({ costs: { ...s.costs, [id]: cost } })),

      mapStyle: "roadmap",
      setMapStyle: (mapStyle) => set({ mapStyle }),

      showLabels: true,
      toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),
    }),
    {
      name: "trinkgut-werbegebiete-state-v1",
      partialize: (s) => ({
        activeIds: s.activeIds,
        costs: s.costs,
        mapStyle: s.mapStyle,
        showLabels: s.showLabels,
      }),
    },
  ),
);
