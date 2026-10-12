"use client";

import { usePathname } from "next/navigation";
import { getAtmosphereTheme } from "@/lib/cinematic/atmosphere";

export default function RouteContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const theme = getAtmosphereTheme(pathname);
  return pathname === "/" || pathname === "/nl" ? (
    <div className="flex-1" data-atmosphere={theme}>{children}</div>
  ) : (
    <main id="main-content" tabIndex={-1} className="flex-1 public-subpage" data-atmosphere={theme}>{children}</main>
  );
}
