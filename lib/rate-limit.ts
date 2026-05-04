// Simple in-memory rate limiter (per IP).
// For production with multiple instances, replace with Upstash/Vercel KV/Cloudflare Turnstile.

import { NextRequest } from "next/server";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export function rateLimit(req: NextRequest, opts: { key: string; max: number; windowMs: number }) {
  const ip = getClientIp(req);
  const id = `${opts.key}:${ip}`;
  const now = Date.now();
  const bucket = buckets.get(id);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(id, { count: 1, resetAt: now + opts.windowMs });
    return { allowed: true, remaining: opts.max - 1, retryAfter: 0 };
  }

  if (bucket.count >= opts.max) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, remaining: opts.max - bucket.count, retryAfter: 0 };
}

// Cleanup stale buckets every 5 min
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of buckets) {
      if (v.resetAt < now) buckets.delete(k);
    }
  }, 5 * 60 * 1000);
}
