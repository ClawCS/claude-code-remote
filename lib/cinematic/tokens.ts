import type { CSSProperties } from "react";

type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer Item)[]
    ? readonly DeepReadonly<Item>[]
    : T extends object
      ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
      : T;

function deepFreeze<T extends object>(value: T): DeepReadonly<T> {
  for (const entry of Object.values(value)) {
    if (typeof entry === "object" && entry !== null) deepFreeze(entry);
  }
  return Object.freeze(value) as DeepReadonly<T>;
}

export const CINEMATIC_TOKENS = deepFreeze({
  color: {
    yellow: "#FEE005",
    red: "#E20F1D",
    blue: "#0086C8",
    gray: "#414045",
    black: "#000000",
    white: "#FFFFFF",
  },
  typography: {
    family: {
      sans: "var(--font-jakarta)",
      display: "var(--font-display)",
    },
    size: {
      label: "0.75rem",
      small: "0.875rem",
      body: "1rem",
      lead: "clamp(1.0625rem, 1.8vw, 1.25rem)",
      heading: "clamp(2.5rem, 6vw, 5.5rem)",
      display: "clamp(3.4rem, 11vw, 10rem)",
    },
    lineHeight: { display: "0.86", heading: "0.94", body: "1.55" },
    weight: { regular: "400", medium: "500", semibold: "600", bold: "700", extraBold: "800" },
    tracking: { tight: "-0.045em", normal: "0em", wide: "0.14em" },
  },
  spacing: {
    none: "0rem",
    twoXs: "0.25rem",
    xs: "0.5rem",
    sm: "0.75rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    twoXl: "3rem",
    threeXl: "4rem",
    fourXl: "6rem",
    target: "2.75rem",
    gutter: "clamp(1rem, 4vw, 4rem)",
    section: "clamp(4.5rem, 10vw, 10rem)",
  },
  layout: {
    contentMax: "120rem",
    textMeasure: "54ch",
    headerHeight: "4.5rem",
    posterWidth: "clamp(34rem, 68vw, 70rem)",
  },
  motion: {
    duration: { instant: "0ms", fast: "160ms", medium: "320ms", slow: "700ms", scene: "1200ms" },
    easing: {
      standard: "cubic-bezier(0.2, 0, 0, 1)",
      entrance: "cubic-bezier(0.16, 1, 0.3, 1)",
      exit: "cubic-bezier(0.7, 0, 0.84, 0)",
    },
    runtime: {
      scrollScrubSeconds: 0.55,
      revealDistancePx: 28,
      revealDurationSeconds: 0.8,
      revealStaggerSeconds: 0.09,
      parallaxTravelPercent: 8,
    },
  },
} as const);

type TokenLeaf = string | number;
type CinematicCustomProperty = `--cinematic-${string}`;
type CinematicTokenStyle = Readonly<
  CSSProperties & Record<CinematicCustomProperty, TokenLeaf>
>;

function kebabCase(segment: string): string {
  return segment.replace(/([a-z\d])([A-Z])/g, "$1-$2").toLowerCase();
}

function tokenEntries(
  value: Readonly<Record<string, unknown>>,
  parent: readonly string[] = [],
): readonly (readonly [CinematicCustomProperty, TokenLeaf])[] {
  return Object.entries(value).flatMap(([key, entry]) => {
    const path = [...parent, key];
    if (typeof entry === "object" && entry !== null && !Array.isArray(entry)) {
      return tokenEntries(entry as Readonly<Record<string, unknown>>, path);
    }
    if (typeof entry !== "string" && typeof entry !== "number") {
      throw new TypeError(`Unsupported cinematic token at ${path.join(".")}`);
    }
    return [[`--cinematic-${path.map(kebabCase).join("-")}`, entry] as const];
  });
}

export function createTokenStyle<
  Tokens extends Readonly<Record<string, unknown>>,
>(tokens: Tokens): CinematicTokenStyle {
  const entries = tokenEntries(tokens);
  const variables = new Set<CinematicCustomProperty>();

  for (const [variable] of entries) {
    if (variables.has(variable)) {
      throw new TypeError(`Duplicate cinematic CSS variable "${variable}"`);
    }
    variables.add(variable);
  }

  return Object.freeze(Object.fromEntries(entries)) as CinematicTokenStyle;
}

export const cinematicTokenStyle = createTokenStyle(CINEMATIC_TOKENS);
