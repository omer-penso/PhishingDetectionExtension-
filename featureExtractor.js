/* featureExtractor.js
   ------------------------------------------------------------------
   Re-implements the Python feature-engineering pipeline in pure JS.
   Exports:
       - extractFeatures(url)  →  Float64Array (length = 14 + T + 1024 + 1024)
   Requirements:
       - tldts@6   (tiny, MIT)   npm i tldts
   ------------------------------------------------------------------ */

   import { parse as parseTLD } from "tldts";

   /* ---------- MurmurHash3 (32-bit) ---------------------------------- */
   function murmur32(key, seed = 0) {
     let k1,
       h1 = seed ^ key.length;
     const c1 = 0xcc9e2d51,
       c2 = 0x1b873593,
       len = key.length;
     let i = 0;
     while (len - i >= 4) {
       k1 =
         (key.charCodeAt(i) & 0xff) |
         ((key.charCodeAt(i + 1) & 0xff) << 8) |
         ((key.charCodeAt(i + 2) & 0xff) << 16) |
         ((key.charCodeAt(i + 3) & 0xff) << 24);
       ++i; ++i; ++i; ++i;
       k1 = Math.imul(k1, c1);
       k1 = (k1 << 15) | (k1 >>> 17);
       k1 = Math.imul(k1, c2);
       h1 ^= k1;
       h1 = (h1 << 13) | (h1 >>> 19);
       h1 = Math.imul(h1, 5) + 0xe6546b64;
     }
     k1 = 0;
     switch (len & 3) {
       case 3:
         k1 = (key.charCodeAt(i + 2) & 0xff) << 16;
       case 2:
         k1 |= (key.charCodeAt(i + 1) & 0xff) << 8;
       case 1:
         k1 |= key.charCodeAt(i) & 0xff;
         k1 = Math.imul(k1, c1);
         k1 = (k1 << 15) | (k1 >>> 17);
         k1 = Math.imul(k1, c2);
         h1 ^= k1;
     }
     h1 ^= len;
     h1 ^= h1 >>> 16;
     h1 = Math.imul(h1, 0x85ebca6b);
     h1 ^= h1 >>> 13;
     h1 = Math.imul(h1, 0xc2b2ae35);
     h1 ^= h1 >>> 16;
     return h1 >>> 0; // unsigned
   }
   
   /* ---------- helpers ------------------------------------------------ */
   const B64_RE = /^[A-Za-z0-9+/]+={0,2}$/;
   function looksLikeBase64(str) {
     return str.length && str.length % 4 === 0 && B64_RE.test(str);
   }
   function countChars(str, re) {
     const m = str.match(re);
     return m ? m.length : 0;
   }
   
   /* ---------- One-hot TLD categories  --------------------------------
      !!!!!!!!!!!!!! MUST match Python's  ohe.get_feature_names_out(["tld"]) --> מוסיפים כאן מה שייצא בprint(list(ohe.get_feature_names_out(['tld'])))
 בסוף המחברת של הURL
      Example below (adjust to yours). */
   const TLD_CATS = [
     "tld_.com",
     "tld_.co.uk",
     "tld_.net",
     "tld_.org",
     "tld_.io",
     // ... add all categories in exact order ...
   ];
   const TLD_ZERO = new Array(TLD_CATS.length).fill(0);
   
   /* ---------- Hash helpers (1024 dims) ------------------------------ */
   const HASH_DIM = 1024;
   function hashedVector(token) {
     const vec = new Float64Array(HASH_DIM);
     const h   = murmur32(token);
     const idx = h % HASH_DIM;
     vec[idx] = (h & 1) ? -1 : 1;          // sign bit
     return vec;
   }
   
   /* ---------- Main feature extractor -------------------------------- */
   export function extractFeatures(rawUrl) {
     let url;
     try {
       url = new URL(rawUrl);
     } catch {
       return null; // invalid URL
     }
   
     const full = url.href;
     const host = url.hostname;
     const { domain: dom, subdomain: sub, publicSuffix: tldStr } = parseTLD(host);
   
     /* ---- numeric / boolean 14-feat block -------------------------- */
     const numeric = [
       full.length,                                    // url_length
       countChars(full, /-/g),                         // num_dashes
       countChars(full, /\./g),                        // num_dots
       url.pathname.split("/").length - 1,            // num_subdirs
       full.startsWith("https") ? 1 : 0,              // has_https
       countChars(full, /\d/g),                       // num_digits
       countChars(full, /[A-Za-z]/g),                 // num_letters
       dom ? dom.length : 0,                          // domain_length
       url.search.length ? url.search.slice(1).length : 0, // params_length
       [...new URLSearchParams(url.search)].length,    // num_params
       /* flags */
       /^(com|org|net)/.test(sub) || /^(com|org|net)/.test(dom) ? 1 : 0, // starts_with_tld
       [...new URLSearchParams(url.search).values()].some(looksLikeBase64) ? 1 : 0, // has_b64_param
       [...new URLSearchParams(url.search).values()].some(v => /(com|org|net|http|www)/.test(v)) ? 1 : 0, // has_url_in_params
       /^\d+\.\d+\.\d+\.\d+$/.test(host) ? 1 : 0       // uses_ip_address (simple IPv4 check)
     ];
   
     /* ---- one-hot TLD ---------------------------------------------- */
     const tldOneHot = [...TLD_ZERO];
     const catName   = `tld_.${tldStr || ""}`;
     const idxTld    = TLD_CATS.indexOf(catName);
     if (idxTld !== -1) tldOneHot[idxTld] = 1;
   
     /* ---- hashed vectors ------------------------------------------- */
     const domVec = hashedVector(dom || "EMPTY");
     const subVec = hashedVector(sub || "EMPTY");
   
     /* ---- concatenate ---------------------------------------------- */
     const featureArr = new Float64Array(
       numeric.length + tldOneHot.length + domVec.length + subVec.length
     );
     featureArr.set(numeric, 0);
     featureArr.set(tldOneHot, numeric.length);
     featureArr.set(domVec, numeric.length + tldOneHot.length);
     featureArr.set(subVec, numeric.length + tldOneHot.length + domVec.length);
   
     return featureArr; // ready for predictRF(...)
   }
   