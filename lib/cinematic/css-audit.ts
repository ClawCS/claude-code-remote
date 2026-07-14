const categoryPrefixes = {
  color: "--cinematic-color-",
  spacing: "--cinematic-spacing-",
  typography: "--cinematic-typography-",
  motion: "--cinematic-motion-",
} as const;

type Category = keyof typeof categoryPrefixes;

function category(property: string): Category | null {
  if (
    /^(?:color|background(?:-color)?|border(?:-[a-z-]+)?-color|outline-color|fill|stroke|text-decoration-color)$/.test(
      property,
    )
  ) {
    return "color";
  }
  if (/^(?:margin|padding|gap|row-gap|column-gap)(?:-[a-z]+)*$/.test(property)) {
    return "spacing";
  }
  if (/^(?:font-family|font-size|font-weight|line-height|letter-spacing)$/.test(property)) {
    return "typography";
  }
  if (/^(?:transition|animation)(?:-(?:duration|delay|timing-function))?$/.test(property)) {
    return "motion";
  }
  return null;
}

export function auditCinematicCss(source: string): readonly string[] {
  const css = source.replace(/\/\*[\s\S]*?\*\//g, "");
  const findings: string[] = [];

  if (/#[\da-f]{3,8}\b|(?:rgb|hsl)a?\(/i.test(css)) {
    findings.push("raw color literal");
  }
  if (/\b\d*\.?\d+m?s\b|cubic-bezier\(|steps\(/i.test(css)) {
    findings.push("raw motion literal");
  }

  for (const match of css.matchAll(/([a-z-]+)\s*:\s*([^;{}]+)[;}]/gi)) {
    const property = match[1].toLowerCase();
    const value = match[2].trim();
    const kind = category(property);
    if (!kind) continue;

    const variables = [
      ...value.matchAll(/var\((--cinematic-[a-z\d-]+)/gi),
    ].map((entry) => entry[1]);
    if (
      variables.some(
        (variable) => !variable.startsWith(categoryPrefixes[kind]),
      )
    ) {
      findings.push(`${property} uses wrong token category`);
    }

    const safe = /^(?:0|auto|none|inherit|initial|unset|transparent|currentcolor)(?:\s+(?:0|auto))*$/i.test(
      value,
    );
    if (!safe && variables.length === 0) {
      findings.push(`${property} lacks ${kind} token`);
    }
  }

  return findings;
}
