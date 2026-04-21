export const GOOGLE_MAPS_API_KEY: string =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ?? "";

export const HAS_API_KEY = GOOGLE_MAPS_API_KEY.length > 0;
