import "server-only";

type ClockEnvironment = Readonly<{
  CINEMATIC_E2E?: string;
  CINEMATIC_TEST_NOW?: string;
  [key: string]: string | undefined;
}>;

type ClockOptions = Readonly<{
  env?: ClockEnvironment;
  realNow?: () => Date;
}>;

const canonicalInstant =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export function resolveHomepageNow({
  env = process.env,
  realNow = () => new Date(),
}: ClockOptions = {}): Date {
  const fixed = env.CINEMATIC_TEST_NOW;
  if (fixed === undefined) return realNow();
  if (env.CINEMATIC_E2E !== "1") {
    throw new TypeError("CINEMATIC_TEST_NOW requires CINEMATIC_E2E=1");
  }
  if (!canonicalInstant.test(fixed)) {
    throw new TypeError("invalid CINEMATIC_TEST_NOW");
  }

  const parsed = new Date(fixed);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString() !== fixed) {
    throw new TypeError("invalid CINEMATIC_TEST_NOW");
  }
  return parsed;
}
