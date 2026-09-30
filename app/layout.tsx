import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";

import PublicChrome from "@/components/PublicChrome";
import JsonLdScript from "@/components/JsonLdScript";
import RouteContent from "@/components/RouteContent";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import {
  LOCAL_BUSINESS_JSON_LD,
  SITE_METADATA,
} from "@/lib/cinematic/metadata";

import "./globals.css";
import "./public-site.css";
import { cinematicTokenStyle } from "@/lib/cinematic/tokens";
import { resolveHomepageNow } from "@/lib/cinematic/server-clock";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
  preload: false,
});

// Display-Schrift für Headlines (modern/technisch — Apple/SpaceX-Anmutung)
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
  preload: false,
});

export const metadata = SITE_METADATA;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nowIso = resolveHomepageNow().toISOString();
  return (
    <html
      lang="de"
      className={`h-full antialiased ${jakarta.variable} ${spaceGrotesk.variable}`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <JsonLdScript value={LOCAL_BUSINESS_JSON_LD} />
        <CartProvider>
          <WishlistProvider>
            <div className="public-site" style={cinematicTokenStyle}>
              <PublicChrome slot="header" nowIso={nowIso} />
              <RouteContent>{children}</RouteContent>
              <PublicChrome slot="footer" nowIso={nowIso} />
              <PublicChrome slot="drawers" nowIso={nowIso} />
            </div>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
