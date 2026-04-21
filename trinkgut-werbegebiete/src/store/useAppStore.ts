import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PUBLICATIONS } from "../data/publications";

export type BonRow = {
  plz: string;
  anzahlBons: number;
  datum?: string;
  umsatz?: number;
  warengruppen?: string;
};

export type GeocodedBon = BonRow & {
  lat: number;
  lng: number;
};

type AppState = {
  visible: Record<string, boolean>;
  toggle: (id: string) => void;
  showAll: () => void;
  hideAll: () => void;
  focusedPublicationId: string | null;
  setFocusedPublication: (id: string | null) => void;

  costs: Record<string, number>;
  setCost: (id: string, value: number) => void;

  bons: GeocodedBon[];
  setBons: (rows: GeocodedBon[]) => void;
  clearBons: () => void;
  showHeatmap: boolean;
  setShowHeatmap: (v: boolean) => void;
};

const initialVisible: Record<string, boolean> = Object.fromEntries(
  PUBLICATIONS.map((p) => [p.id, true]),
);

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      visible: initialVisible,
      toggle: (id) =>
        set((s) => ({ visible: { ...s.visible, [id]: !s.visible[id] } })),
      showAll: () =>
        set(() => ({
          visible: Object.fromEntries(PUBLICATIONS.map((p) => [p.id, true])),
        })),
      hideAll: () =>
        set(() => ({
          visible: Object.fromEntries(PUBLICATIONS.map((p) => [p.id, false])),
        })),

      focusedPublicationId: null,
      setFocusedPublication: (id) => set({ focusedPublicationId: id }),

      costs: {},
      setCost: (id, value) =>
        set((s) => ({ costs: { ...s.costs, [id]: value } })),

      bons: [],
      setBons: (rows) => set({ bons: rows }),
      clearBons: () => set({ bons: [] }),
      showHeatmap: true,
      setShowHeatmap: (v) => set({ showHeatmap: v }),
    }),
    {
      name: "trinkgut-werbegebiete",
      partialize: (state) => ({
        visible: state.visible,
        costs: state.costs,
        bons: state.bons,
        showHeatmap: state.showHeatmap,
      }),
    },
  ),
);
