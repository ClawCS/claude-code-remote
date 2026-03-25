import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppButton from "@/components/WhatsAppButton";
import AIAssistant from "@/components/AIAssistant";
import CookieBanner from "@/components/CookieBanner";

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
  return (
    <html lang="de" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
          <WhatsAppButton />
          <AIAssistant />
          <CookieBanner />
        </CartProvider>
      </body>
    </html>
  );
}
