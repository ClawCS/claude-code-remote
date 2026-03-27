"use client";

import Image from "next/image";
import Link from "next/link";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";

export default function WishlistDrawer() {
  const { items, removeItem, clearWishlist, isWishlistOpen, setIsWishlistOpen } = useWishlist();
  const { addItem: addToCart } = useCart();

  const addAllToCart = () => {
    items.forEach((product) => addToCart(product, 1));
    setIsWishlistOpen(false);
  };

  if (!isWishlistOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-50"
        onClick={() => setIsWishlistOpen(false)}
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-secondary flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
            Merkzettel ({items.length})
          </h2>
          <button
            onClick={() => setIsWishlistOpen(false)}
            className="p-1 text-muted hover:text-secondary"
            aria-label="Schliessen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-border mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <p className="text-muted font-medium">Dein Merkzettel ist leer</p>
              <p className="text-sm text-muted mt-1">Tippe auf das Herz bei einem Produkt</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((product) => (
                <div key={product.id} className="flex gap-3 bg-light rounded-xl p-3">
                  <Link
                    href={`/produkte/${product.slug}`}
                    onClick={() => setIsWishlistOpen(false)}
                    className="flex-shrink-0 w-16 h-16 bg-white rounded-lg overflow-hidden relative"
                  >
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="64px"
                      className="object-contain p-1"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/produkte/${product.slug}`}
                      onClick={() => setIsWishlistOpen(false)}
                      className="text-sm font-semibold text-secondary hover:text-primary line-clamp-2"
                    >
                      {product.name}
                    </Link>
                    <p className="text-xs text-muted mt-0.5">{product.unit}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-sm font-bold text-primary">{formatPrice(product.price)}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => addToCart(product, 1)}
                          className="px-2 py-1 bg-primary text-white text-xs font-medium rounded-md hover:bg-primary-dark transition-colors"
                        >
                          + Warenkorb
                        </button>
                        <button
                          onClick={() => removeItem(product.id)}
                          className="p-1 text-muted hover:text-red-500 transition-colors"
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
          <div className="p-4 border-t border-border space-y-2">
            <button
              onClick={addAllToCart}
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-colors shadow-sm"
            >
              Alle zum Warenkorb ({items.length})
            </button>
            <button
              onClick={clearWishlist}
              className="w-full py-2 text-sm text-muted hover:text-red-500 transition-colors"
            >
              Merkzettel leeren
            </button>
          </div>
        )}
      </div>
    </>
  );
}
