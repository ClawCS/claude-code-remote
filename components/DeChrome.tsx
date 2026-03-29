"use client";

import { usePathname } from "next/navigation";

/**
 * Wrapper that hides its children on /nl routes.
 * Used in root layout to hide German Header/Footer/WhatsApp/AI on the NL landing page.
 */
export default function DeChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/nl")) return null;
  return <>{children}</>;
}
