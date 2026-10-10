"use client";
import PageIntro from "@/components/editorial/PageIntro";
import editorial from "@/components/editorial/editorial.module.css";
import styles from "@/components/editorial/transaction.module.css";
import Link from "next/link";
import { useWishlist } from "@/context/WishlistContext";
import ProductGrid from "@/components/ProductGrid";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
export default function MerkzettelPage() {
  const { items, clearWishlist, setIsWishlistOpen } = useWishlist();
  const { addItem } = useCart();
  const [message, setMessage] = useState("");
  return <><PageIntro eyebrow="Deine Auswahl" title="Merkzettel"><button type="button" className={editorial.secondaryLink} onClick={() => setIsWishlistOpen(true)}>Merkzettel-Vorschau öffnen</button></PageIntro><div className={styles.body} data-service="wishlist">
    {items.length ? <>
      <div className={styles.actions}>
        <button type="button" className={editorial.primaryLink} onClick={() => { items.forEach(item => addItem(item)); setMessage("Deine vorgemerkten Artikel wurden zur unverbindlichen Anfrageliste hinzugefügt."); }}>Alle zur Anfrageliste ({items.length})</button>
        <button type="button" className={editorial.secondaryLink} onClick={() => { clearWishlist(); setMessage("Dein Merkzettel wurde geleert."); }}>Merkzettel leeren</button>
        <Link href="/warenkorb" className={styles.textLink}>Anfrageliste öffnen</Link>
      </div>
      <ProductGrid products={items} headingLevel={2} />
    </> : <p className={editorial.emptyState}>Noch keine Getränke vorgemerkt. Mit dem Herz am Produkt speicherst du deine Auswahl für diesen Besuch.</p>}
    <p role="status" aria-live="polite" className="my-5">{message}</p>
    <Link href="/produkte" className={styles.textLink}>Sortiment entdecken</Link>
  </div></>;
}
