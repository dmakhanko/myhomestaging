/**
 * Server-side content fetching — reads MongoDB directly (no HTTP round-trip).
 * Falls back to mock data if DB is unavailable.
 */
import {
  blog, brand, dummyImages, hero, nav, portfolio, processSteps, seo, servicesSection,
} from "./mock";
import { getSiteContentFromDb } from "./siteContent";

function isObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
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
    const remote = await getSiteContentFromDb();
    return mergeWithFallback(remote, defaults);
  } catch {
    return defaults;
  }
}
