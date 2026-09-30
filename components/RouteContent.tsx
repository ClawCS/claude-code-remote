"use client";

import { usePathname } from "next/navigation";

export default function RouteContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return pathname === "/" || pathname === "/nl" ? (
    <div className="flex-1">{children}</div>
  ) : (
    <main id="main-content" tabIndex={-1} className="flex-1 public-subpage">{children}</main>
  );
}
