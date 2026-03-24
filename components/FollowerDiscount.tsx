"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatPrice, type Product } from "@/lib/utils";

const DISCOUNT_AMOUNT = 5;

export function FollowerDiscountBadge({
  product,
  isEligible,
}: {
  product: Product;
  isEligible: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!isEligible) return null;

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setModalOpen(true);
        }}
        className="absolute top-2 left-2 z-10 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg hover:scale-105 transition-transform cursor-pointer"
      >
        5 EUR Follower-Rabatt!
      </button>

      {modalOpen && (
        <FollowerDiscountModal
          product={product}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

function FollowerDiscountModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const { addItem } = useCart();
  const discountedPrice = Math.max(0, product.price - DISCOUNT_AMOUNT);

  const handleRedeem = () => {
    // Add product with discounted price
    const discountedProduct = {
      ...product,
      originalPrice: product.price,
      price: discountedPrice,
      name: `${product.name} (Follower-Rabatt)`,
    };
    addItem(discountedProduct);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-muted hover:text-secondary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Instagram gradient header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-xl p-4 mb-4 text-white text-center">
          <svg className="h-8 w-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
          </svg>
          <p className="font-bold text-lg">5 EUR Follower-Rabatt!</p>
        </div>

        <h3 className="font-bold text-secondary text-lg mb-2">{product.name}</h3>

        <p className="text-sm text-muted mb-4">
          Folge uns auf Instagram und erhalte <span className="font-bold text-primary">5 EUR Rabatt</span> auf
          dieses Produkt! Einfach folgen, Rabatt einloesen und sparen.
        </p>

        <div className="bg-light rounded-lg p-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Normalpreis:</span>
            <span className="text-secondary line-through">{formatPrice(product.price)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-muted">Dein Preis:</span>
            <span className="text-primary font-bold text-lg">{formatPrice(discountedPrice)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <a
            href="https://www.instagram.com/trinkgutjammers_goch/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
            Auf Instagram folgen
          </a>
          <button
            onClick={handleRedeem}
            className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors"
          >
            Rabatt einloesen - {formatPrice(discountedPrice)}
          </button>
        </div>
      </div>
    </div>
  );
}

