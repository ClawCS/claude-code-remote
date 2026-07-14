import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";

import CookieBanner from "@/components/CookieBanner";
import DeChrome from "@/components/DeChrome";
import JsonLdScript from "@/components/JsonLdScript";
import RouteContent from "@/components/RouteContent";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import {
  LOCAL_BUSINESS_JSON_LD,
  SITE_METADATA,
} from "@/lib/cinematic/metadata";

import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

// Display-Schrift für Headlines (modern/technisch — Apple/SpaceX-Anmutung)
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata = SITE_METADATA;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`h-full antialiased ${jakarta.variable} ${spaceGrotesk.variable}`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <JsonLdScript value={LOCAL_BUSINESS_JSON_LD} />
        <CartProvider>
          <WishlistProvider>
            <DeChrome slot="header" />
            <RouteContent>{children}</RouteContent>
            <DeChrome slot="footer" />
            <DeChrome slot="drawers" />
            <DeChrome slot="floating" />
            <CookieBanner />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
