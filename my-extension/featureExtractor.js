import { TLD_CATS } from "./tld_cats.js";

/* Minimal MurmurHash-3 (32-bit) */
function murmur32(key, seed = 0) {
  let h1 = seed ^ key.length,
    k1, i = 0,
    c1 = 0xcc9e2d51, c2 = 0x1b873593;

  while (key.length - i >= 4) {
    k1 = (key.charCodeAt(i) & 0xff) |
         ((key.charCodeAt(i + 1) & 0xff) << 8) |
         ((key.charCodeAt(i + 2) & 0xff) << 16) |
         ((key.charCodeAt(i + 3) & 0xff) << 24);
    i += 4;

    k1 = Math.imul(k1, c1);
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = Math.imul(k1, c2);

    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1 = Math.imul(h1, 5) + 0xe6546b64;
  }

  h1 ^= key.length;
  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  h1 = Math.imul(h1, 0xc2b2ae35);
  h1 ^= h1 >>> 16;

  return h1 >>> 0;
}

/* Basic URL decomposition */
function extractDomain(url) {
  try {
    const host = new URL(url).hostname;
    const parts = host.split(".");
    return parts.length > 1 ? parts[parts.length - 2] : "";
  } catch {
    return "";
  }
}

function extractTLD(url) {
  try {
    return new URL(url).hostname.split(".").pop();
  } catch {
    return "";
  }
}

function extractSubdomain(url) {
  try {
    const host = new URL(url).hostname;
    const parts = host.split(".");
    return parts.length > 2 ? parts.slice(0, -2).join(".") : "";
  } catch {
    return "";
  }
}

/* Base64 detector */
function looksLikeBase64(s) {
  return /^[A-Za-z0-9+/]+={0,2}$/.test(s) && s.length % 4 === 0;
}

/* Heuristic URL-in-string checker */
function containsUrlLikeString(s) {
  return /https?:|www\.|\.com|\.net|\.org/.test(s);
}

/* === Main feature extractor === */
export function extractFeatures(url) {
  if (!url) return [];

  const u = new URL(url);
  const queryParams = new URLSearchParams(u.search);
  const queryValues = [...queryParams.values()];

  // --- 14 raw numeric/boolean features
  const rawFeatures = [
    url.length,                           // url_length
    (url.match(/-/g) || []).length,      // num_dashes
    (url.match(/\./g) || []).length,     // num_dots
    (u.pathname.match(/\//g) || []).length, // num_subdirs
    [...url].filter(c => /\d/.test(c)).length, // num_digits
    [...url].filter(c => /[a-zA-Z]/.test(c)).length, // num_letters
    extractDomain(url).length,           // domain_length
    u.search.length,                     // params_length
    [...queryParams.keys()].length,      // num_params

    url.startsWith("https") ? 1 : 0,     // has_https
    /^\d+\.\d+\.\d+\.\d+$/.test(u.hostname) ? 1 : 0, // uses_ip_address
    ["com", "net", "org"].some(tld => extractSubdomain(url).startsWith(tld) || extractDomain(url).startsWith(tld)) ? 1 : 0, // starts_with_tld
    queryValues.some(looksLikeBase64) ? 1 : 0, // has_b64_param
    queryValues.some(containsUrlLikeString) ? 1 : 0, // has_url_in_params
  ];

  // --- One-hot TLD vector
  const tld = extractTLD(url);
  const tldVector = TLD_CATS.map(label => (label === `tld_.${tld}` ? 1 : 0));

  // --- Hashed domain (1024-dim)
  const domain = extractDomain(url) || "EMPTY";
  const domainHash = Array(1024).fill(0);
  domainHash[murmur32(domain) % 1024] = 1;

  // --- Hashed subdomain (1024-dim)
  const sub = extractSubdomain(url) || "EMPTY";
  const subHash = Array(1024).fill(0);
  subHash[murmur32(sub) % 1024] = 1;

  // --- Final feature vector
  return [...rawFeatures, ...tldVector, ...domainHash, ...subHash];
}
