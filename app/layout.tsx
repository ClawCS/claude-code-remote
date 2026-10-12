import PublicChrome from "@/components/PublicChrome";
import JsonLdScript from "@/components/JsonLdScript";
import RouteContent from "@/components/RouteContent";
import LegacyStorageCleanup from "@/components/LegacyStorageCleanup";
import {
  LOCAL_BUSINESS_JSON_LD,
  SITE_METADATA,
} from "@/lib/cinematic/metadata";

import "./globals.css";
import "./public-site.css";
import "./jakarta-fonts.css";
import { cinematicTokenStyle } from "@/lib/cinematic/tokens";
import { resolveHomepageNow } from "@/lib/cinematic/server-clock";

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
      className="h-full antialiased font-jakarta"
    >
      <body className="min-h-full flex flex-col font-sans">
        <JsonLdScript value={LOCAL_BUSINESS_JSON_LD} />
        <LegacyStorageCleanup>
            <div className="public-site" style={cinematicTokenStyle}>
              <PublicChrome slot="header" nowIso={nowIso} />
              <RouteContent>{children}</RouteContent>
              <PublicChrome slot="footer" nowIso={nowIso} />
              <div data-shopping-drawers-root />
            </div>
        </LegacyStorageCleanup>
      </body>
    </html>
  );
}
