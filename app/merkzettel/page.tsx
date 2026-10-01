"use client";
import Link from "next/link";
import { useWishlist } from "@/context/WishlistContext";
import ProductGrid from "@/components/ProductGrid";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
export default function MerkzettelPage() {
  const { items, clearWishlist } = useWishlist();
  const { addItem } = useCart();
  const [message, setMessage] = useState("");
  return <div className="max-w-7xl mx-auto px-6 py-12">
    <p className="text-primary font-semibold">Deine Auswahl</p>
    <h1 className="text-4xl font-bold mb-6">Merkzettel</h1>
    {items.length ? <>
      <div className="flex flex-wrap gap-3 mb-6">
        <button type="button" className="px-5 py-3 bg-primary text-white font-semibold rounded-lg" onClick={() => { items.forEach(item => addItem(item)); setMessage("Deine vorgemerkten Artikel wurden zur unverbindlichen Anfrageliste hinzugefügt."); }}>Alle zur Anfrageliste ({items.length})</button>
        <button type="button" className="px-5 py-3 border border-border rounded-lg" onClick={() => { clearWishlist(); setMessage("Dein Merkzettel wurde geleert."); }}>Merkzettel leeren</button>
        <Link href="/warenkorb" className="px-5 py-3 text-primary underline">Anfrageliste öffnen</Link>
      </div>
      <ProductGrid products={items} headingLevel={2} />
    </> : <p className="text-muted mb-6">Noch keine Getränke vorgemerkt. Mit dem Herz am Produkt speicherst du deine Auswahl für diesen Besuch.</p>}
    <p role="status" aria-live="polite" className="my-5">{message}</p>
    <Link href="/produkte" className="text-primary underline">Sortiment entdecken</Link>
  </div>;
}
