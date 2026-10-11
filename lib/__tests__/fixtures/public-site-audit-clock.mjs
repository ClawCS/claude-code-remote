// Child-process clock only: the production audit has no clock override.
const instant = Date.parse(process.env.JAMMERS_AUDIT_FIXTURE_NOW);
if (!Number.isFinite(instant)) throw new Error("Missing audit fixture clock");
const NativeDate = Date;
globalThis.Date = class FixtureDate extends NativeDate {
  constructor(...args) { if (args.length) super(...args); else super(instant); }
  static now() { return instant; }
};
