import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
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
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import WishlistDrawer from "@/components/WishlistDrawer";
import WhatsAppButton from "@/components/WhatsAppButton";
import AIAssistant from "@/components/AIAssistant";
import CookieBanner from "@/components/CookieBanner";
import DeChrome from "@/components/DeChrome";

export const metadata: Metadata = {
  metadataBase: new URL("https://trinkgut-jammers.de"),
  title: {
    default: "Trinkgut Jammers Goch – Dein Getränkemarkt Online",
    template: "%s – Trinkgut Jammers Goch",
  },
  description:
    "Über 7.000 Getränke online bestellen bei Trinkgut Jammers in Goch. Bier, Wein, Wasser, Spirituosen, Softdrinks. Partyservice, Vermietung & mehr.",
  keywords: ["Trinkgut", "Jammers", "Goch", "Getränkemarkt", "Bier", "Wein", "Spirituosen", "Partyservice", "Lieferung"],
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: "Trinkgut Jammers Goch",
    title: "Trinkgut Jammers Goch – Dein Getränkemarkt Online",
    description: "Über 7.000 Getränke. Partyplaner, Vermietung, Finder-Tools und mehr.",
    images: [
      {
        url: "/images/logo-trinkgut-jammers.png",
        width: 1200,
        height: 630,
        alt: "Trinkgut Jammers Goch",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LiquorStore",
    name: "Trinkgut Jammers Goch",
    image: "https://trinkgut-jammers.de/images/logo-trinkgut-jammers.png",
    "@id": "https://trinkgut-jammers.de",
    url: "https://trinkgut-jammers.de",
    telephone: "+49 2823 418707",
    priceRange: "€€",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Jurgenstr. 20",
      addressLocality: "Goch",
      postalCode: "47574",
      addressCountry: "DE",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "08:00",
        closes: "20:00",
      },
    ],
    sameAs: [
      "https://www.instagram.com/trinkgutjammers_goch/",
      "https://www.facebook.com/trinkgutjammers",
    ],
  };

  return (
    <html lang="de" className={`h-full antialiased ${jakarta.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-full flex flex-col font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
        <CartProvider>
          <WishlistProvider>
            <DeChrome>
              <Header />
            </DeChrome>
            <main className="flex-1">{children}</main>
            <DeChrome>
              <Footer />
            </DeChrome>
            <CartDrawer />
            <WishlistDrawer />
            <DeChrome>
              <WhatsAppButton />
              <AIAssistant />
            </DeChrome>
            <CookieBanner />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
