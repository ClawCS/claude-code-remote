"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { formatPrice, type Product } from "@/lib/utils";
import { countryProducts, type CountryData } from "@/data/country-products";
import productsData from "@/data/products.json";

const allProducts = productsData as Product[];

// SVG paths for a simplified world map - Europe-focused with key countries
const countryPaths: Record<string, { d: string; label: string; labelX: number; labelY: number }> = {
  DE: {
    d: "M495,155 L500,148 L510,145 L520,148 L525,155 L528,165 L525,175 L520,182 L510,185 L500,182 L492,175 L490,165 Z",
    label: "DE", labelX: 510, labelY: 167,
  },
  FR: {
    d: "M455,165 L465,158 L478,160 L490,165 L492,175 L488,188 L480,195 L468,198 L458,192 L450,182 L448,172 Z",
    label: "FR", labelX: 470, labelY: 178,
  },
  ES: {
    d: "M435,195 L448,188 L462,192 L470,200 L468,212 L460,220 L445,222 L432,218 L425,208 L428,198 Z",
    label: "ES", labelX: 448, labelY: 208,
  },
  IT: {
    d: "M500,185 L510,188 L518,198 L520,210 L515,222 L508,228 L502,225 L498,215 L495,205 L492,195 Z",
    label: "IT", labelX: 508, labelY: 208,
  },
  GB: {
    d: "M445,120 L455,115 L462,120 L460,132 L455,140 L448,142 L442,138 L438,130 L440,122 Z",
    label: "GB", labelX: 450, labelY: 130,
  },
  IE: {
    d: "M425,122 L435,118 L440,125 L438,135 L432,138 L425,135 L422,128 Z",
    label: "IE", labelX: 432, labelY: 128,
  },
  NL: {
    d: "M485,140 L495,138 L500,142 L498,150 L492,152 L486,148 Z",
    label: "NL", labelX: 492, labelY: 145,
  },
  DK: {
    d: "M498,122 L508,118 L515,122 L514,132 L508,136 L500,132 L496,128 Z",
    label: "DK", labelX: 506, labelY: 127,
  },
  AT: {
    d: "M510,168 L525,165 L535,168 L538,175 L532,180 L520,182 L510,178 L508,172 Z",
    label: "AT", labelX: 523, labelY: 174,
  },
  GR: {
    d: "M535,205 L545,198 L555,202 L558,212 L552,220 L542,222 L535,218 L532,210 Z",
    label: "GR", labelX: 545, labelY: 212,
  },
  US: {
    d: "M100,165 L180,155 L220,158 L250,165 L255,180 L245,195 L220,200 L180,198 L140,195 L110,188 L95,178 Z",
    label: "US", labelX: 175, labelY: 178,
  },
  CU: {
    d: "M180,245 L200,242 L215,245 L218,252 L210,258 L195,258 L182,255 Z",
    label: "CU", labelX: 200, labelY: 250,
  },
  VE: {
    d: "M220,275 L240,270 L255,275 L258,288 L250,295 L235,298 L222,292 L218,282 Z",
    label: "VE", labelX: 238, labelY: 285,
  },
  BB: {
    d: "M260,262 L268,258 L275,262 L275,270 L268,274 L260,270 Z",
    label: "BB", labelX: 268, labelY: 266,
  },
  JP: {
    d: "M795,185 L805,178 L815,182 L818,192 L812,200 L802,202 L795,198 L792,192 Z",
    label: "JP", labelX: 805, labelY: 192,
  },
  PH: {
    d: "M780,260 L790,255 L798,260 L798,272 L792,278 L782,275 L778,268 Z",
    label: "PH", labelX: 788, labelY: 268,
  },
};

function ProductModal({
  country,
  products,
  onClose,
}: {
  country: CountryData;
  products: Product[];
  onClose: () => void;
}) {
  const { addItem } = useCart();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{country.flag}</span>
            <div>
              <h2 className="text-xl font-bold text-secondary">{country.nameDE}</h2>
              <p className="text-sm text-muted">
                {products.length} {products.length === 1 ? "Produkt" : "Produkte"} im Sortiment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-light transition-colors text-muted hover:text-secondary"
            aria-label="Schlie\u00dfen"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Products Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="group bg-white rounded-xl border border-border hover:border-primary/30 transition-all overflow-hidden flex flex-col"
              >
                <div className="p-3 pb-2">
                  <div className="aspect-square bg-gradient-to-br from-light to-gray-100 rounded-lg flex items-center justify-center overflow-hidden relative">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                </div>
                <div className="p-3 pt-1 flex flex-col flex-1">
                  <span className="text-xs text-muted uppercase tracking-wide font-medium">
                    {product.category}
                  </span>
                  <h3 className="font-semibold text-secondary text-sm mt-0.5 line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  {product.unit && (
                    <p className="text-xs text-muted mt-0.5 line-clamp-1">{product.unit}</p>
                  )}
                  <div className="mt-auto pt-2 flex items-center justify-between">
                    <span className="text-lg font-extrabold text-primary">
                      {product.price > 0 ? formatPrice(product.price) : "Preis im Markt"}
                    </span>
                    <button
                      onClick={() => addItem(product)}
                      className="px-2.5 py-1 bg-primary hover:bg-primary-dark text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                    >
                      + Warenkorb
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BierkartePage() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const productsByCountry = useMemo(() => {
    const map: Record<string, Product[]> = {};
    for (const [code, data] of Object.entries(countryProducts)) {
      map[code] = data.productIds
        .map((id) => allProducts.find((p) => p.id === id))
        .filter((p): p is Product => p !== undefined);
    }
    return map;
  }, []);

  const activeCountries = useMemo(
    () => new Set(Object.keys(countryProducts)),
    []
  );

  const handleCountryClick = useCallback((code: string) => {
    if (activeCountries.has(code)) {
      setSelectedCountry(code);
    }
  }, [activeCountries]);

  const handleMouseMove = useCallback((e: React.MouseEvent, code: string) => {
    if (activeCountries.has(code)) {
      const rect = (e.currentTarget as SVGElement).closest("svg")?.getBoundingClientRect();
      if (rect) {
        setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top - 15 });
      }
      setHoveredCountry(code);
    }
  }, [activeCountries]);

  const totalProducts = useMemo(
    () => Object.values(productsByCountry).reduce((sum, p) => sum + p.length, 0),
    [productsByCountry]
  );

  const countryList = useMemo(
    () =>
      Object.entries(countryProducts)
        .map(([code, data]) => ({
          code,
          ...data,
          count: productsByCountry[code]?.length || 0,
        }))
        .sort((a, b) => b.count - a.count),
    [productsByCountry]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white">
      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6">
        <div className="text-center animate-fade-in-up">
          <p className="text-sm font-semibold tracking-widest uppercase text-amber-600 mb-2">
            Weltweit geniessen
          </p>
          <h1 className="text-3xl md:text-5xl font-extrabold text-secondary mb-3">
            Bier- & Spirituosen-Weltkarte
          </h1>
          <p className="text-muted max-w-2xl mx-auto text-lg">
            {totalProducts} Produkte aus {Object.keys(countryProducts).length} Laendern — klicke
            auf ein Land und entdecke unser internationales Sortiment.
          </p>
        </div>
      </div>

      {/* SVG Map */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-4 md:p-8 overflow-hidden">
          <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
            <svg
              viewBox="50 80 820 340"
              className="w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Ocean background */}
              <rect x="50" y="80" width="820" height="340" fill="#EFF6FF" rx="8" />

              {/* Grid lines for ocean effect */}
              {Array.from({ length: 12 }, (_, i) => (
                <line
                  key={`h-${i}`}
                  x1="50"
                  y1={80 + i * 30}
                  x2="870"
                  y2={80 + i * 30}
                  stroke="#DBEAFE"
                  strokeWidth="0.5"
                  strokeDasharray="4 8"
                />
              ))}
              {Array.from({ length: 16 }, (_, i) => (
                <line
                  key={`v-${i}`}
                  x1={50 + i * 55}
                  y1="80"
                  x2={50 + i * 55}
                  y2="420"
                  stroke="#DBEAFE"
                  strokeWidth="0.5"
                  strokeDasharray="4 8"
                />
              ))}

              {/* Inactive continent shapes (simplified backgrounds) */}
              {/* Africa */}
              <path
                d="M480,235 L510,230 L530,245 L535,275 L525,310 L510,330 L490,335 L475,320 L465,295 L460,265 L470,245 Z"
                fill="#E5E7EB"
                stroke="#D1D5DB"
                strokeWidth="0.5"
              />
              {/* South America (rest) */}
              <path
                d="M200,300 L230,295 L250,310 L260,340 L255,370 L240,390 L220,395 L205,380 L195,355 L190,330 L192,310 Z"
                fill="#E5E7EB"
                stroke="#D1D5DB"
                strokeWidth="0.5"
              />
              {/* Russia / Northern Asia */}
              <path
                d="M560,100 L650,95 L720,100 L770,108 L790,120 L785,140 L760,150 L700,155 L640,152 L590,148 L565,140 L555,125 L558,108 Z"
                fill="#E5E7EB"
                stroke="#D1D5DB"
                strokeWidth="0.5"
              />
              {/* China / East Asia */}
              <path
                d="M700,160 L740,155 L770,165 L785,180 L780,200 L765,210 L740,215 L715,210 L700,200 L695,180 Z"
                fill="#E5E7EB"
                stroke="#D1D5DB"
                strokeWidth="0.5"
              />
              {/* Southeast Asia / Indonesia */}
              <path
                d="M750,240 L770,235 L790,240 L810,250 L820,265 L815,280 L800,288 L775,285 L755,275 L748,258 Z"
                fill="#E5E7EB"
                stroke="#D1D5DB"
                strokeWidth="0.5"
              />
              {/* Australia */}
              <path
                d="M760,320 L800,315 L830,325 L840,345 L830,365 L805,372 L775,368 L758,355 L752,340 Z"
                fill="#E5E7EB"
                stroke="#D1D5DB"
                strokeWidth="0.5"
              />
              {/* Canada */}
              <path
                d="M80,100 L180,92 L250,95 L280,105 L275,120 L250,128 L180,130 L110,128 L80,118 Z"
                fill="#E5E7EB"
                stroke="#D1D5DB"
                strokeWidth="0.5"
              />
              {/* Mexico / Central America */}
              <path
                d="M100,200 L150,195 L175,205 L185,220 L175,235 L155,240 L130,238 L110,228 L98,215 Z"
                fill="#E5E7EB"
                stroke="#D1D5DB"
                strokeWidth="0.5"
              />
              {/* Scandinavia */}
              <path
                d="M490,90 L510,85 L525,90 L530,105 L525,115 L510,118 L498,115 L488,108 L486,98 Z"
                fill="#E5E7EB"
                stroke="#D1D5DB"
                strokeWidth="0.5"
              />
              {/* Eastern Europe */}
              <path
                d="M540,140 L560,135 L575,142 L578,158 L572,172 L560,178 L548,175 L538,165 L535,152 Z"
                fill="#E5E7EB"
                stroke="#D1D5DB"
                strokeWidth="0.5"
              />
              {/* Turkey / Middle East */}
              <path
                d="M560,190 L585,185 L610,190 L620,200 L615,212 L600,218 L578,215 L562,208 L555,198 Z"
                fill="#E5E7EB"
                stroke="#D1D5DB"
                strokeWidth="0.5"
              />
              {/* India */}
              <path
                d="M650,210 L675,205 L690,215 L695,235 L685,255 L670,262 L655,255 L645,238 L643,222 Z"
                fill="#E5E7EB"
                stroke="#D1D5DB"
                strokeWidth="0.5"
              />

              {/* Active country paths */}
              {Object.entries(countryPaths).map(([code, { d }]) => {
                const isActive = activeCountries.has(code);
                const isHovered = hoveredCountry === code;
                return (
                  <path
                    key={code}
                    d={d}
                    data-country={code}
                    fill={
                      isActive
                        ? isHovered
                          ? "#F59E0B"
                          : "#D97706"
                        : "#E5E7EB"
                    }
                    stroke={isActive ? "#92400E" : "#D1D5DB"}
                    strokeWidth={isActive ? 1.5 : 0.5}
                    className={
                      isActive
                        ? "cursor-pointer transition-all duration-200 drop-shadow-sm hover:drop-shadow-md"
                        : ""
                    }
                    onClick={() => handleCountryClick(code)}
                    onMouseMove={(e) => handleMouseMove(e, code)}
                    onMouseLeave={() => setHoveredCountry(null)}
                    style={
                      isActive && isHovered
                        ? { filter: "drop-shadow(0 0 8px rgba(245, 158, 11, 0.5))" }
                        : undefined
                    }
                  />
                );
              })}

              {/* Country labels */}
              {Object.entries(countryPaths).map(([code, { labelX, labelY }]) => {
                if (!activeCountries.has(code)) return null;
                const count = productsByCountry[code]?.length || 0;
                return (
                  <g key={`label-${code}`} className="pointer-events-none">
                    <text
                      x={labelX}
                      y={labelY - 2}
                      textAnchor="middle"
                      fill="#78350F"
                      fontSize="8"
                      fontWeight="700"
                      fontFamily="system-ui, sans-serif"
                    >
                      {countryProducts[code]?.flag}
                    </text>
                    <text
                      x={labelX}
                      y={labelY + 8}
                      textAnchor="middle"
                      fill="#451A03"
                      fontSize="6"
                      fontWeight="600"
                      fontFamily="system-ui, sans-serif"
                    >
                      {count}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Tooltip */}
            {hoveredCountry && countryProducts[hoveredCountry] && (
              <div
                className="absolute pointer-events-none bg-secondary text-white px-3 py-2 rounded-lg shadow-xl text-sm font-medium z-20 whitespace-nowrap"
                style={{
                  left: `${tooltipPos.x}px`,
                  top: `${tooltipPos.y}px`,
                  transform: "translate(-50%, -100%)",
                }}
              >
                <span className="mr-1.5">{countryProducts[hoveredCountry].flag}</span>
                {countryProducts[hoveredCountry].nameDE}
                <span className="ml-2 text-amber-300 font-bold">
                  {productsByCountry[hoveredCountry]?.length || 0} Produkte
                </span>
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-secondary" />
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 text-sm text-muted">
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded-sm bg-amber-600" />
              <span>Produkte verfuegbar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 rounded-sm bg-gray-200 border border-gray-300" />
              <span>Keine Produkte</span>
            </div>
          </div>
        </div>
      </div>

      {/* Country List Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <h2 className="text-2xl font-bold text-secondary mb-6 text-center">
          Alle Laender im Ueberblick
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {countryList.map(({ code, nameDE, flag, count }) => (
            <button
              key={code}
              onClick={() => setSelectedCountry(code)}
              className="group bg-white rounded-xl border border-border hover:border-amber-300 p-4 text-center transition-all hover:shadow-md hover:shadow-amber-100"
            >
              <span className="text-3xl block mb-2">{flag}</span>
              <p className="font-semibold text-secondary text-sm group-hover:text-amber-700 transition-colors">
                {nameDE}
              </p>
              <p className="text-xs text-muted mt-1">
                {count} {count === 1 ? "Produkt" : "Produkte"}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedCountry && countryProducts[selectedCountry] && (
        <ProductModal
          country={countryProducts[selectedCountry]}
          products={productsByCountry[selectedCountry] || []}
          onClose={() => setSelectedCountry(null)}
        />
      )}
    </div>
  );
}
