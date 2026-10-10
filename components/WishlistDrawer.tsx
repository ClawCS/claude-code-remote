"use client";

import Image from "next/image";
import { useCallback } from "react";
import Link from "next/link";
import editorial from "@/components/editorial/editorial.module.css";
import styles from "@/components/editorial/transaction.module.css";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { useModalA11y } from "@/lib/useModalA11y";

export default function WishlistDrawer() {
  const { items, removeItem, clearWishlist, isWishlistOpen, setIsWishlistOpen } = useWishlist();
  const { addItem: addToCart } = useCart();
  const close = useCallback(() => setIsWishlistOpen(false), [setIsWishlistOpen]);
  const panelRef = useModalA11y(isWishlistOpen, close);

  const addAllToCart = () => {
    items.forEach((product) => addToCart(product, 1));
    setIsWishlistOpen(false);
  };

  if (!isWishlistOpen) return null;

  return (
    <>
      <div
        className={styles.drawerBackdrop}
        onClick={() => setIsWishlistOpen(false)}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wishlist-drawer-title"
        className={styles.drawerPanel}
      >
        {/* Header */}
        <div className={styles.drawerHeader}>
          <h2 id="wishlist-drawer-title" className="text-lg font-bold text-secondary flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
            Merkzettel ({items.length})
          </h2>
          <button
            onClick={() => setIsWishlistOpen(false)}
            className={styles.iconButton}
            aria-label="Schliessen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className={styles.drawerBody}>
          {items.length === 0 ? (
            <div className={editorial.emptyState}>
              <p className="text-muted font-medium">Dein Merkzettel ist leer</p>
              <p className="text-sm text-muted mt-1">Tippe auf das Herz bei einem Produkt</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((product) => (
                <div key={product.id} className={`${styles.drawerItem} ${styles.cartRow}`}>
                  {product.image && product.image !== "/images/home/brand-logo.webp" && <Link
                    href={`/produkte/${product.slug}`}
                    onClick={() => setIsWishlistOpen(false)}
                    className={styles.thumbnail}
                  >
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="64px"
                      className="object-contain p-1"
                    />
                  </Link>}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/produkte/${product.slug}`}
                      onClick={() => setIsWishlistOpen(false)}
                      className="text-sm font-semibold text-secondary hover:text-primary line-clamp-2"
                    >
                      {product.name}
                    </Link>
                    <p className="text-xs text-muted mt-0.5">{product.unit}</p>
                    <div className={styles.drawerControls}>
                      <span className="text-xs text-muted">Preis auf Anfrage</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => addToCart(product, 1)}
                          className={editorial.primaryLink}
                        >
                          + Anfrage
                        </button>
                        <button
                          onClick={() => removeItem(product.id)}
                          className={styles.iconButton}
                          aria-label="Entfernen"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className={styles.drawerFooter}>
            <button
              onClick={addAllToCart}
              className={editorial.primaryLink}
            >
              Alle zur Anfrageliste ({items.length})
            </button>
            <button
              onClick={clearWishlist}
              className={styles.textLink}
            >
              Merkzettel leeren
            </button>
          </div>
        )}
      </div>
    </>
  );
}
