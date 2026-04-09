/**
 * Server-side content fetching with fallback to mock data.
 * Used in Next.js Server Components (pages) to enable SSR.
 */
import {
  blog, brand, dummyImages, hero, nav, portfolio, processSteps, seo, servicesSection,
} from "./mock";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://fursova-staging-production.up.railway.app";

function isObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

function resolveMediaUrls(value) {
  if (typeof value === "string") {
    return value.startsWith("/api/media/") ? `${BACKEND_URL}${value}` : value;
  }
  if (Array.isArray(value)) return value.map(resolveMediaUrls);
  if (isObject(value)) {
    const out = {};
    for (const k of Object.keys(value)) out[k] = resolveMediaUrls(value[k]);
    return out;
  }
  return value;
}

function mergeWithFallback(remote, fallback) {
  if (remote === undefined || remote === null) return fallback;
  if (Array.isArray(remote)) return remote;
  if (isObject(remote) && isObject(fallback)) {
    const out = { ...remote };
    for (const k of Object.keys(fallback)) {
      if (!(k in out) || out[k] === undefined || out[k] === null) {
        out[k] = fallback[k];
      } else if (isObject(out[k]) && isObject(fallback[k])) {
        out[k] = mergeWithFallback(out[k], fallback[k]);
      }
    }
    return out;
  }
  return remote;
}

const defaults = { blog, brand, nav, hero, servicesSection, portfolio, processSteps, dummyImages, seo };

export async function getSiteContent() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/content`, {
      next: { revalidate: 60 }, // ISR: revalidate every 60 seconds
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const remote = resolveMediaUrls(data?.content || {});
    return mergeWithFallback(remote, defaults);
  } catch {
    return defaults;
  }
}
