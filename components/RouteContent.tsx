"use client";

import { usePathname } from "next/navigation";

export default function RouteContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return pathname === "/" ? (
    <div className="flex-1">{children}</div>
  ) : (
    <main className="flex-1">{children}</main>
  );
}
