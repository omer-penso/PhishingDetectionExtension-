/* featureExtractor.js  ──────────────────────────────────────────────────────
   Generates the same feature vector used in the Python notebook:
     · 14 numeric / boolean features
     · One-hot TLD vector (full list below, identical ordering)
     · 1 024-dim Murmur-hash vector for domain_name
     · 1 024-dim Murmur-hash vector for sub_domain
   Requires:  tldts.esm.min.js  (ES-module build) in the same directory.
   ------------------------------------------------------------------------ */

//import { parse as parseTLD } from "./tldts.esm.min.js";   // relative path

/* ── Minimal MurmurHash-3 (32-bit) ───────────────────────────────────────── */
function murmur32(key, seed = 0) {
  let h1 = seed ^ key.length,
      k1, i = 0,
      c1 = 0xcc9e2d51, c2 = 0x1b873593, len = key.length;

  while (len - i >= 4) {
    k1 =  (key.charCodeAt(i) & 0xff)        |
         ((key.charCodeAt(i + 1) & 0xff) << 8)  |
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
  k1 = 0;
  switch (len & 3) {
    case 3: k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
    case 2: k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
    case 1:
      k1 ^= key.charCodeAt(i) & 0xff;
      k1 = Math.imul(k1, c1);
      k1 = (k1 << 15) | (k1 >>> 17);
      k1 = Math.imul(k1, c2);
      h1 ^= k1;
  }
  h1 ^= len;
  h1 ^= h1 >>> 16;
  h1  = Math.imul(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  h1  = Math.imul(h1, 0xc2b2ae35);
  h1 ^= h1 >>> 16;
  return h1 >>> 0;
}

/* ── Constants ───────────────────────────────────────────────────────────── */
const HASH_DIM = 1024;
const HASH_ZERO = new Float64Array(HASH_DIM);

const TLD_CATS = [
"tld_", "tld_COM.BR", "tld_abbott", "tld_ac", "tld_ac.at", "tld_ac.bd",
"tld_ac.cr", "tld_ac.id", "tld_ac.il", "tld_ac.in", "tld_ac.ir", "tld_ac.jp",
"tld_ac.ke", "tld_ac.kr", "tld_ac.nz", "tld_ac.rs", "tld_ac.th", "tld_ac.uk",
"tld_ac.za", "tld_actor", "tld_ad", "tld_ad.jp", "tld_adv.br", "tld_ae",
"tld_aero", "tld_africa", "tld_ag", "tld_ai", "tld_al", "tld_am", "tld_app",
"tld_app.br", "tld_ar", "tld_army", "tld_art", "tld_as", "tld_asia",
"tld_associates", "tld_at", "tld_aws", "tld_az", "tld_ba", "tld_band",
"tld_bank", "tld_bar", "tld_barclays", "tld_basketball", "tld_be", "tld_best",
"tld_bet", "tld_bet.ar", "tld_bet.br", "tld_bf", "tld_bg", "tld_bi",
"tld_bid", "tld_bingo", "tld_bio", "tld_biz", "tld_biz.id", "tld_bj",
"tld_blog", "tld_blue", "tld_bnpparibas", "tld_bond", "tld_box", "tld_br",
"tld_bradesco", "tld_bs", "tld_bt", "tld_business", "tld_buzz", "tld_by",
"tld_bz", "tld_ca", "tld_cab", "tld_cam", "tld_camera", "tld_canon",
"tld_capital", "tld_care", "tld_cars", "tld_cat", "tld_cc", "tld_cd",
"tld_cern", "tld_cf", "tld_cfd", "tld_cg", "tld_ch", "tld_chat", "tld_ci",
"tld_city", "tld_cl", "tld_claims", "tld_click", "tld_cloud", "tld_club",
"tld_cm", "tld_cn", "tld_co", "tld_co.ao", "tld_co.at", "tld_co.bw",
"tld_co.ck", "tld_co.cm", "tld_co.cr", "tld_co.id", "tld_co.il", "tld_co.in",
"tld_co.jp", "tld_co.ke", "tld_co.kr", "tld_co.ls", "tld_co.ma", "tld_co.mw",
"tld_co.mz", "tld_co.nz", "tld_co.rs", "tld_co.rw", "tld_co.th", "tld_co.tz",
"tld_co.ug", "tld_co.uk", "tld_co.uz", "tld_co.ve", "tld_co.vi", "tld_co.za",
"tld_co.zm", "tld_co.zw", "tld_com", "tld_com.af", "tld_com.ag", "tld_com.ai",
"tld_com.al", "tld_com.ar", "tld_com.au", "tld_com.ba", "tld_com.bd",
"tld_com.bh", "tld_com.bn", "tld_com.bo", "tld_com.br", "tld_com.by",
"tld_com.bz", "tld_com.cn", "tld_com.co", "tld_com.cu", "tld_com.cy",
"tld_com.do", "tld_com.ec", "tld_com.ee", "tld_com.eg", "tld_com.es",
"tld_com.et", "tld_com.fj", "tld_com.gh", "tld_com.gi", "tld_com.gt",
"tld_com.hk", "tld_com.im", "tld_com.jm", "tld_com.kg", "tld_com.kh",
"tld_com.kw", "tld_com.lb", "tld_com.ly", "tld_com.mm", "tld_com.ms",
"tld_com.mt", "tld_com.mx", "tld_com.my", "tld_com.na", "tld_com.nf",
"tld_com.ng", "tld_com.ni", "tld_com.np", "tld_com.om", "tld_com.pa",
"tld_com.pe", "tld_com.pg", "tld_com.ph", "tld_com.pk", "tld_com.pl",
"tld_com.pr", "tld_com.py", "tld_com.qa", "tld_com.ro", "tld_com.sa",
"tld_com.sb", "tld_com.sg", "tld_com.sl", "tld_com.sv", "tld_com.tj",
"tld_com.tr", "tld_com.tw", "tld_com.ua", "tld_com.uy", "tld_com.vc",
"tld_com.ve", "tld_com.vn", "tld_community", "tld_cool", "tld_cr", "tld_cv",
"tld_cx", "tld_cyou", "tld_cz", "tld_date", "tld_day", "tld_de", "tld_deals",
"tld_delivery", "tld_desi", "tld_design", "tld_dev", "tld_digital",
"tld_direct", "tld_dj", "tld_dk", "tld_dm", "tld_do", "tld_dog", "tld_domains",
"tld_dp.ua", "tld_dz", "tld_earth", "tld_ec", "tld_edu", "tld_edu.ar",
"tld_edu.au", "tld_edu.bd", "tld_edu.cn", "tld_edu.co", "tld_edu.do",
"tld_edu.ec", "tld_edu.hk", "tld_edu.in", "tld_edu.it", "tld_edu.ng",
"tld_edu.np", "tld_edu.pe", "tld_edu.ph", "tld_edu.pk", "tld_edu.pl",
"tld_edu.rs", "tld_edu.sa", "tld_edu.sg", "tld_edu.tr", "tld_edu.tw",
"tld_edu.vn", "tld_ee", "tld_eg", "tld_email", "tld_eng.br", "tld_es",
"tld_es.gov.br", "tld_eti.br", "tld_eu", "tld_eus", "tld_events",
"tld_exchange", "tld_fans", "tld_fi", "tld_finance", "tld_fm",
"tld_foundation", "tld_fr", "tld_fujitsu", "tld_fun", "tld_fyi", "tld_ga",
"tld_gal", "tld_gallery", "tld_game", "tld_games", "tld_gd", "tld_ge",
"tld_gg", "tld_gl", "tld_gle", "tld_global", "tld_gm", "tld_go.cr", "tld_go.id",
"tld_go.jp", "tld_go.th", "tld_go.ug", "tld_gob.ar", "tld_gob.cl", "tld_gob.es",
"tld_gob.mx", "tld_gob.pe", "tld_golf", "tld_goog", "tld_google",
"tld_gouv.fr", "tld_gov", "tld_gov.ar", "tld_gov.au", "tld_gov.bd",
"tld_gov.br", "tld_gov.by", "tld_gov.cn", "tld_gov.co", "tld_gov.gh",
"tld_gov.gr", "tld_gov.il", "tld_gov.in", "tld_gov.it", "tld_gov.kz",
"tld_gov.ph", "tld_gov.pk", "tld_gov.sg", "tld_gov.tr", "tld_gov.ua",
"tld_gov.uk", "tld_gov.vn", "tld_gov.za", "tld_gp", "tld_gr", "tld_group",
"tld_gs", "tld_gt", "tld_guru", "tld_gy", "tld_hair", "tld_health",
"tld_help", "tld_hk", "tld_hn", "tld_homes", "tld_honda", "tld_host",
"tld_hosting", "tld_hr", "tld_ht", "tld_hu", "tld_icu", "tld_id", "tld_id.vn",
"tld_ie", "tld_im", "tld_in", "tld_in.th", "tld_in.ua", "tld_inc", "tld_info",
"tld_info.pl", "tld_info.tr", "tld_ing", "tld_ink", "tld_int", "tld_io",
"tld_io.in", "tld_io.vn", "tld_iq", "tld_ir", "tld_is", "tld_it", "tld_je",
"tld_jo", "tld_jp", "tld_k12.ca.us", "tld_ke", "tld_kg", "tld_ki", "tld_kim",
"tld_kr", "tld_kyiv.ua", "tld_kz", "tld_la", "tld_lat", "tld_law",
"tld_leclerc", "tld_legal", "tld_li", "tld_life", "tld_limo", "tld_link",
"tld_live", "tld_lk", "tld_log.br", "tld_lol", "tld_lombardia.it",
"tld_london", "tld_love", "tld_ls", "tld_lt", "tld_ltd", "tld_ltda", "tld_lu",
"tld_lv", "tld_ly", "tld_ma", "tld_market", "tld_marketing", "tld_mc",
"tld_md", "tld_me", "tld_media", "tld_men", "tld_menu", "tld_mg",
"tld_microsoft", "tld_mil", "tld_mil.br", "tld_mk", "tld_ml", "tld_mn",
"tld_mobi", "tld_moe", "tld_mom", "tld_money", "tld_movie", "tld_mq",
"tld_ms", "tld_mt", "tld_mu", "tld_mus.br", "tld_museum", "tld_mv",
"tld_mw", "tld_mx", "tld_my", "tld_my.id", "tld_mz", "tld_name", "tld_ne",
"tld_ne.jp", "tld_net", "tld_net.ar", "tld_net.au", "tld_net.bd",
"tld_net.br", "tld_net.id", "tld_net.il", "tld_net.th", "tld_net.tr",
"tld_net.vn", "tld_network", "tld_news", "tld_nexus", "tld_nf", "tld_ng",
"tld_nhs.uk", "tld_nic.in", "tld_ninja", "tld_nl", "tld_no", "tld_now",
"tld_nr", "tld_ntt", "tld_nu", "tld_nyc", "tld_nysa.pl", "tld_nz",
"tld_od.ua", "tld_one", "tld_onl", "tld_online", "tld_ooo", "tld_or.id",
"tld_or.jp", "tld_org", "tld_org.ar", "tld_org.au", "tld_org.br",
"tld_org.cn", "tld_org.eg", "tld_org.il", "tld_org.in", "tld_org.mx",
"tld_org.ng", "tld_org.np", "tld_org.nz", "tld_org.pl", "tld_org.rw",
"tld_org.sa", "tld_org.uk", "tld_org.vc", "tld_org.vn", "tld_org.za",
"tld_page", "tld_panasonic", "tld_party", "tld_pb.gov.br", "tld_pe",
"tld_pe.kr", "tld_ph", "tld_phd", "tld_pics", "tld_pk", "tld_pl", "tld_pl.ua",
"tld_place", "tld_plus", "tld_pm", "tld_pn", "tld_police.uk", "tld_porn",
"tld_press", "tld_pro", "tld_ps", "tld_pt", "tld_pub", "tld_pw", "tld_qa",
"tld_qpon", "tld_quest", "tld_re", "tld_realtor", "tld_red", "tld_ren",
"tld_report", "tld_rest", "tld_rj.gov.br", "tld_ro", "tld_rocks",
"tld_rodeo", "tld_rs", "tld_ru", "tld_rugby", "tld_run", "tld_rw", "tld_sa",
"tld_sale", "tld_saxo", "tld_sbi", "tld_sbs", "tld_sc", "tld_sc.tz",
"tld_school", "tld_science", "tld_scot", "tld_se", "tld_security",
"tld_services", "tld_sex", "tld_sexy", "tld_sg", "tld_sh", "tld_shop",
"tld_shopping", "tld_show", "tld_si", "tld_site", "tld_sk", "tld_skin",
"tld_sm", "tld_sn", "tld_so", "tld_social", "tld_spa", "tld_space", "tld_sr",
"tld_st", "tld_store", "tld_stream", "tld_studio", "tld_su", "tld_support",
"tld_sx", "tld_systems", "tld_szczecin.pl", "tld_tc", "tld_td", "tld_team",
"tld_tec.br", "tld_tech", "tld_technology", "tld_tf", "tld_tg", "tld_th",
"tld_tips", "tld_tj", "tld_tk", "tld_tl", "tld_tm", "tld_tn", "tld_to",
"tld_today", "tld_tokyo", "tld_tools", "tld_top", "tld_toyota", "tld_tr",
"tld_travel", "tld_tt", "tld_tube", "tld_tv", "tld_tv.br", "tld_tw", "tld_ua",
"tld_ug", "tld_uk", "tld_uno", "tld_us", "tld_uz", "tld_uz.ua", "tld_vc",
"tld_vg", "tld_video", "tld_vip", "tld_vn", "tld_voyage", "tld_vu",
"tld_wang", "tld_watch", "tld_web.id", "tld_web.pk", "tld_webcam",
"tld_website", "tld_wf", "tld_wiki", "tld_win", "tld_work", "tld_world",
"tld_ws", "tld_wtf", "tld_xin", "tld_xn--p1ai", "tld_xn--ses554g", "tld_xxx",
"tld_xyz", "tld_zone", "tld_zp.ua"
];

const TLD_ZERO = new Float64Array(TLD_CATS.length);

/* ── helper functions ────────────────────────────────────────────────────── */
const B64_RE = /^[A-Za-z0-9+/]+={0,2}$/;
function looksB64(str) { return str.length && str.length % 4 === 0 && B64_RE.test(str); }
function count(str, regex) { const m=str.match(regex); return m ? m.length : 0; }
function hashVector(token) {
  const v = HASH_ZERO.slice();
  const h = murmur32(token);
  v[h % HASH_DIM] = (h & 1) ? -1 : 1;
  return v;
}

/* ── main extractor ─────────────────────────────────────────────────────── */
export function extractFeatures(rawUrl) {
  let url;
  try { url = new URL(rawUrl); } catch { return null; }

  const full = url.href;
  const host = url.hostname;
  //const { domain: dom, subdomain: sub, publicSuffix: suffix } = parseTLD(host);
  const hostname = new URL(url).hostname;
  const parts = hostname.split('.');

  const suffix = parts.slice(-1)[0];
  const dom = parts.length >= 2 ? parts[parts.length - 2] : "";
  const sub = parts.slice(0, -2).join('.');
  /* numeric & boolean block (14) */
  const nums = [
    full.length,
    count(full, /-/g),
    count(full, /\./g),
    url.pathname.split("/").length - 1,
    full.startsWith("https") ? 1 : 0,
    count(full, /\d/g),
    count(full, /[A-Za-z]/g),
    dom ? dom.length : 0,
    url.search.length ? url.search.slice(1).length : 0,
    [...new URLSearchParams(url.search)].length,
    /^(com|org|net)/.test(sub) || /^(com|org|net)/.test(dom) ? 1 : 0,
    [...new URLSearchParams(url.search).values()].some(looksB64) ? 1 : 0,
    [...new URLSearchParams(url.search).values()].some(v => /(com|org|net|http|www)/.test(v)) ? 1 : 0,
    /^\d{1,3}(\.\d{1,3}){3}$/.test(host) ? 1 : 0
  ];

  /* one-hot TLD */
  const tldVec = TLD_ZERO.slice();
  const pos = TLD_CATS.indexOf(`tld_${suffix || ""}`);
  if (pos !== -1) tldVec[pos] = 1;

  /* hashed domain + subdomain */
  const domVec = hashVector(dom || "EMPTY");
  const subVec = hashVector(sub || "EMPTY");

  /* concatenate to Float64Array */
  const feat = new Float64Array(nums.length + tldVec.length + domVec.length + subVec.length);
  feat.set(nums, 0);
  feat.set(tldVec, nums.length);
  feat.set(domVec, nums.length + tldVec.length);
  feat.set(subVec, nums.length + tldVec.length + domVec.length);

  return feat;
}
