import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kühlschrank-Manager — Vorrat im Blick ",
  description: " Trinkgut Jammers|Verwalte deinen Getränkevorrat zu Hause — nie wieder leer im Kühlschrank.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
