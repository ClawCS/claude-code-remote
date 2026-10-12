"use client";

import { useEffect } from "react";
import { removeLegacyPersonalData } from "@/lib/legacy-storage";

export default function LegacyStorageCleanup({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try { removeLegacyPersonalData(localStorage); } catch { /* Storage is optional. */ }
  }, []);
  return children;
}
