import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────
//  REGION CONFIG
//  This is the only section you need to edit to deploy for a new
//  region. Add, remove, or change programs, utilities, and counties.
//  The UI rebuilds itself from whatever is defined here.
// ─────────────────────────────────────────────────────────────────
const CONFIG = {

  // Display name shown in the tool header
  region: "Los Angeles, CA",

  // Average all-in retrofit cost per unit (used to calc % coverage)
  costPerUnit: 18000,
  costPerUnitLabel: "~$18K/unit avg. comprehensive electrification retrofit",

  // Set to false for non-California regions (disables CalEnviroScreen)
  dacCheckEnabled: true,

  // CTA section copy
  ctaButton: "Apply for Financial TA →",
  ctaHeadline: "Ready to Access Your Incentive Stack?",
  ctaBody: "Retrofit.LA's Financial Technical Assistance program helps nonprofit housing owners navigate applications, stack programs, and close the financing gap — at no cost to your organization.",
  ctaSubnote: "During FTA, you'll have the option to upload an anonymous rent roll for a more precise incentive calculation.",

  // Utility dropdown options
  // value must match eligibility.utilityRequired in programs below
  utilities: [
    { value: "ladwp", label: "LADWP (LA City)" },
    { value: "sce",   label: "SoCal Edison" },
    { value: "bwp",   label: "Burbank Water & Power" },
    { value: "gwp",   label: "Glendale Water & Power" },
    { value: "pwp",   label: "Pasadena Water & Power" },
    { value: "azusa", label: "Azusa Light & Water" },
    { value: "sdge",  label: "SDG&E" },
    { value: "pge",   label: "PG&E" },
    { value: "other", label: "Other" }
  ],

  // County dropdown options
  // value must match eligibility.counties entries in programs below
  counties: [
    { value: "la",            label: "Los Angeles County" },
    { value: "orange",        label: "Orange County" },
    { value: "riverside",     label: "Riverside County" },
    { value: "sanbernardino", label: "San Bernardino County" },
    { value: "ventura",       label: "Ventura County" },
    { value: "other",         label: "Other CA County" }
  ],

  // Maps geocoded city names → utility values for auto-detection
  cityUtilityMap: {
    "Los Angeles": "ladwp",
    "Burbank": "bwp",
    "Glendale": "gwp",
    "Pasadena": "pwp",
    "Azusa": "azusa",
    "Long Beach": "sce",
    "Anaheim": "sce",
    "Santa Monica": "sce",
    "Beverly Hills": "sce",
    "Culver City": "sce",
    "Inglewood": "sce",
    "Torrance": "sce",
    "Hawthorne": "sce",
    "Compton": "sce",
    "Downey": "sce",
    "El Monte": "sce",
    "Whittier": "sce",
    "Pomona": "sce",
    "Lancaster": "sce",
    "West Hollywood": "sce",
    "Monrovia": "sce",
    "South Pasadena": "sce"
  },
  // Fallback utility when city isn't in the map above
  defaultUtility: "sce",

  // ── PROGRAMS ──────────────────────────────────────────────────
  // Each program needs:
  //   id               unique string
  //   name             short display name
  //   funder           organization administering the program
  //   color            hex color for this program's bar and card accent
  //   textColor        text color on top of color (use #fff or dark color)
  //   perUnit          base incentive amount per unit ($)
  //   dacBonusPerUnit  higher amount if property is in a DAC (or null)
  //   description      one-sentence description (standard)
  //   dacDescription   description when DAC bonus applies (or null)
  //   measures         array of eligible upgrade types
  //   isEstimate       show asterisk noting amount is estimated
  //   eligibility      rules object — set any field to null to skip
  //     .utilityRequired   utility value string, array of strings, or null for any
  //     .minUnits          minimum total units, or null
  //     .minAmiPct         minimum % of units at ≤80% AMI, or null
  //     .counties          array of county values, or null for any
  //     .requiresNonprofit true/false
  //     .requiresDAC       true/false — property must be in a CalEPA DAC
  programs: [

    // ── STATEWIDE / CROSS-TERRITORY ──────────────────────────────

    {
      id: "liwp",
      name: "CA LIWP",
      funder: "CA Dept. of Community Services & Development",
      color: "#7B2D8B",
      textColor: "#ffffff",
      perUnit: 8000,
      dacBonusPerUnit: 12000,
      description: "Low Income Weatherization Program — deep weatherization + full electrification at 100% no-cost for income-qualified affordable housing. Applies in ALL utility territories including LADWP and all POUs. Delivered by AEA in LA County.",
      dacDescription: "DAC priority — enhanced funding avg. $12K/unit. Applies in ALL utility territories including LADWP and all POUs. AEA delivers in LA County for both LADWP and SCE territories.",
      measures: [
        "Heat Pump HVAC (space heating & cooling)",
        "Heat Pump Water Heaters",
        "Building Insulation & Air Sealing",
        "Electrical Panel Upgrades",
        "LED Lighting",
        "Low-Flow Fixtures",
        "Duct Sealing & Weatherization"
      ],
      isEstimate: true,
      eligibility: {
        utilityRequired: null,
        minUnits: 5,
        minAmiPct: 50,
        counties: null,
        requiresNonprofit: false,
        requiresDAC: false
      }
    },

    {
      id: "heehra",
      name: "IRA / HEEHRA",
      funder: "Federal IRA / CA Energy Commission",
      color: "#1A7A3A",
      textColor: "#ffffff",
      perUnit: 4500,
      dacBonusPerUnit: null,
      description: "Federal Home Electrification & Appliance Rebates — available in ALL utility territories statewide. Up to $1,750/unit HPWH + $8,000/unit HP HVAC + $4,000/unit panel upgrade for ≤80% AMI households.",
      dacDescription: null,
      measures: [
        "Heat Pump HVAC (space heating & cooling)",
        "Heat Pump Water Heaters",
        "Electrical Panel Upgrades",
        "Building Insulation & Air Sealing",
        "EV Charging Infrastructure"
      ],
      isEstimate: true,
      eligibility: {
        utilityRequired: null,
        minUnits: null,
        minAmiPct: 50,
        counties: null,
        requiresNonprofit: false,
        requiresDAC: false
      }
    },

    {
      id: "tech",
      name: "TECH Clean CA",
      funder: "CA Public Utilities Commission",
      color: "#27AAE1",
      textColor: "#ffffff",
      perUnit: 2000,
      dacBonusPerUnit: null,
      description: "Heat pump HVAC and water heater rebates for income-qualified affordable MF housing. Note: Standard reservation window closed Dec 2025 — HEEHRA lottery in progress as of May 2026. Confirm current availability with AEA before scoping.",
      dacDescription: null,
      measures: [
        "Heat Pump HVAC (space heating & cooling)",
        "Heat Pump Water Heaters",
        "Smart Thermostats"
      ],
      isEstimate: true,
      eligibility: {
        utilityRequired: null,
        minUnits: 2,
        minAmiPct: 50,
        counties: null,
        requiresNonprofit: false,
        requiresDAC: false
      }
    },

    // ── REGIONAL (AQMD — ALL LA COUNTY UTILITIES) ─────────────────

    {
      id: "mahep",
      name: "AQMD MAHEP",
      funder: "South Coast Air Quality Mgmt. District",
      color: "#A2E543",
      textColor: "#021230",
      perUnit: 5000,
      dacBonusPerUnit: null,
      description: "Multifamily Affordable Housing Electrification Program — electrification incentives across ALL LA County utility territories (LADWP, SCE, Burbank, Glendale, Pasadena, and all other POUs). Requires CalEPA Disadvantaged Community status.",
      dacDescription: null,
      measures: [
        "Heat Pump HVAC (space heating & cooling)",
        "Heat Pump Water Heaters",
        "Electric Cooking Appliances",
        "EV Charging Infrastructure",
        "Electrical Panel Upgrades"
      ],
      isEstimate: false,
      eligibility: {
        utilityRequired: null,
        minUnits: 5,
        minAmiPct: 66,
        counties: ["la", "orange", "riverside", "sanbernardino"],
        requiresNonprofit: false,
        requiresDAC: true
      }
    },

    // ── LADWP TERRITORY ───────────────────────────────────────────

    {
      id: "camr",
      name: "LADWP CAMR",
      funder: "LA Dept. of Water & Power",
      color: "#1D459A",
      textColor: "#ffffff",
      perUnit: 4500,
      dacBonusPerUnit: null,
      description: "Comprehensive Affordable Multifamily Retrofits — HVAC, lighting, water heating, solar (VNEM), and panel upgrades for LADWP customers. AEA implements — single TA partner for CAMR, LIWP, and MAHEP in LADWP territory.",
      dacDescription: null,
      measures: [
        "Heat Pump HVAC (space heating & cooling)",
        "Heat Pump Water Heaters",
        "LED Lighting (units & common areas)",
        "Building Insulation & Air Sealing",
        "Smart Thermostats & Controls",
        "EV Charging Infrastructure",
        "Solar PV Systems (VNEM eligible)",
        "Electrical Panel Upgrades"
      ],
      isEstimate: true,
      eligibility: {
        utilityRequired: "ladwp",
        minUnits: 5,
        minAmiPct: 66,
        counties: null,
        requiresNonprofit: false,
        requiresDAC: false
      }
    },

    {
      id: "ladwp_crp",
      name: "LADWP Rebates (CRP)",
      funder: "LA Dept. of Water & Power",
      color: "#4A90D9",
      textColor: "#ffffff",
      perUnit: 3500,
      dacBonusPerUnit: null,
      description: "Consumer Rebate Program — up to $2,500/unit for heat pump water heaters and $2,500/ton for HP HVAC (updated Nov 2025). Stackable on top of CAMR for LADWP properties.",
      dacDescription: null,
      measures: [
        "Heat Pump Water Heaters",
        "Heat Pump HVAC (space heating & cooling)",
        "Smart Thermostats",
        "EV Charging Infrastructure"
      ],
      isEstimate: true,
      eligibility: {
        utilityRequired: "ladwp",
        minUnits: null,
        minAmiPct: null,
        counties: null,
        requiresNonprofit: false,
        requiresDAC: false
      }
    },

    {
      id: "heip",
      name: "LADWP HEIP",
      funder: "LA Dept. of Water & Power",
      color: "#2E6DA4",
      textColor: "#ffffff",
      perUnit: 2000,
      dacBonusPerUnit: null,
      description: "Home Energy Improvement Program — free standard EE measures (lighting, weatherization, insulation) for income-qualified LADWP customers. Foundational layer before deeper electrification work.",
      dacDescription: null,
      measures: [
        "LED Lighting",
        "Building Insulation & Air Sealing",
        "Weatherization",
        "Smart Thermostats"
      ],
      isEstimate: true,
      eligibility: {
        utilityRequired: "ladwp",
        minUnits: null,
        minAmiPct: 50,
        counties: null,
        requiresNonprofit: false,
        requiresDAC: false
      }
    },

    // ── SCE / IOU TERRITORY ───────────────────────────────────────

    {
      id: "sce_camr",
      name: "SCE CAMR",
      funder: "Southern California Edison / CPUC",
      color: "#C8102E",
      textColor: "#ffffff",
      perUnit: 3500,
      dacBonusPerUnit: null,
      description: "Comprehensive Affordable Multifamily Retrofits for SCE customers — includes deed-restricted AND non-deed-restricted NOAH properties. AEA implements — same TA partner as LIWP and MAHEP in SCE territory.",
      dacDescription: null,
      measures: [
        "Heat Pump HVAC (space heating & cooling)",
        "Heat Pump Water Heaters",
        "Building Insulation & Air Sealing",
        "LED Lighting (units & common areas)",
        "Electrical Panel Upgrades",
        "Smart Thermostats"
      ],
      isEstimate: true,
      eligibility: {
        utilityRequired: "sce",
        minUnits: 5,
        minAmiPct: 50,
        counties: null,
        requiresNonprofit: false,
        requiresDAC: false
      }
    },

    {
      id: "esa",
      name: "ESA Multifamily",
      funder: "Southern California Edison / CPUC",
      color: "#FF6B35",
      textColor: "#ffffff",
      perUnit: 4500,
      dacBonusPerUnit: null,
      description: "No-cost weatherization and efficiency upgrades for income-qualified affordable MF housing in IOU (SCE, PG&E, SDG&E) territories only. Typical value $3,000–$8,000/unit. Does not apply in LADWP or POU cities.",
      dacDescription: null,
      measures: [
        "LED Lighting",
        "HVAC Systems",
        "Water Heating",
        "Building Insulation & Air Sealing",
        "Weatherization & Air Sealing",
        "Appliances"
      ],
      isEstimate: true,
      eligibility: {
        utilityRequired: ["sce", "pge", "sdge"],
        minUnits: 5,
        minAmiPct: 50,
        counties: null,
        requiresNonprofit: false,
        requiresDAC: false
      }
    },

    {
      id: "sgip",
      name: "SGIP (Battery Storage)",
      funder: "CA Public Utilities Commission",
      color: "#B5651D",
      textColor: "#ffffff",
      perUnit: 1500,
      dacBonusPerUnit: null,
      description: "SGIP Equity Resiliency track — up to $1,000/kWh for battery storage at income-qualified properties in Disadvantaged Communities. IOU territories (SCE, PG&E, SDG&E) only.",
      dacDescription: null,
      measures: [
        "Battery Storage Systems"
      ],
      isEstimate: true,
      eligibility: {
        utilityRequired: ["sce", "pge", "sdge"],
        minUnits: null,
        minAmiPct: 50,
        counties: null,
        requiresNonprofit: false,
        requiresDAC: true
      }
    },

    // ── POU-SPECIFIC ──────────────────────────────────────────────

    {
      id: "bwp",
      name: "Burbank W&P Rebates",
      funder: "Burbank Water & Power",
      color: "#E07B00",
      textColor: "#ffffff",
      perUnit: 3000,
      dacBonusPerUnit: null,
      description: "HP HVAC, HPWH, and panel upgrade rebates for BWP customers. Enhanced rates available for affordable housing providers serving low/very-low income tenants. Stack with MAHEP (if DAC) and LIWP for comprehensive coverage.",
      dacDescription: null,
      measures: [
        "Heat Pump HVAC (space heating & cooling)",
        "Heat Pump Water Heaters",
        "Electrical Panel Upgrades",
        "EV Charging Infrastructure"
      ],
      isEstimate: true,
      eligibility: {
        utilityRequired: "bwp",
        minUnits: null,
        minAmiPct: null,
        counties: null,
        requiresNonprofit: false,
        requiresDAC: false
      }
    },

    {
      id: "gwp",
      name: "Glendale W&P Rebates",
      funder: "Glendale Water & Power",
      color: "#2E8B57",
      textColor: "#ffffff",
      perUnit: 3000,
      dacBonusPerUnit: null,
      description: "GWP rebates for HP HVAC, HPWH, and appliances (updated Nov 2025). Joint GWP + AQMD combined rebates reach up to $8,000/unit for DAC properties when stacked with MAHEP.",
      dacDescription: null,
      measures: [
        "Heat Pump HVAC (space heating & cooling)",
        "Heat Pump Water Heaters",
        "Electric Cooking Appliances",
        "Smart Thermostats"
      ],
      isEstimate: true,
      eligibility: {
        utilityRequired: "gwp",
        minUnits: null,
        minAmiPct: null,
        counties: null,
        requiresNonprofit: false,
        requiresDAC: false
      }
    },

    {
      id: "pwp",
      name: "Pasadena W&P Rebates",
      funder: "Pasadena Water & Power",
      color: "#6A0DAD",
      textColor: "#ffffff",
      perUnit: 2500,
      dacBonusPerUnit: null,
      description: "Solar, battery, HP HVAC, and HPWH rebates — new solar+battery pilot launched April 2026. Income-qualified owners receive $1/W for solar. Stack with MAHEP (if DAC) and LIWP.",
      dacDescription: null,
      measures: [
        "Solar PV Systems",
        "Battery Storage Systems",
        "Heat Pump HVAC (space heating & cooling)",
        "Heat Pump Water Heaters"
      ],
      isEstimate: true,
      eligibility: {
        utilityRequired: "pwp",
        minUnits: null,
        minAmiPct: null,
        counties: null,
        requiresNonprofit: false,
        requiresDAC: false
      }
    }

  ]
};
// ─────────────────────────────────────────────────────────────────
//  END CONFIG — no need to edit below this line
// ─────────────────────────────────────────────────────────────────

const B = { navy:"#021230", sky:"#27AAE1", green:"#A2E543", gray:"#B2B2B2" };

// Evaluates whether a program's eligibility rules pass
function checkEligibility(program, form, amiPct, isDac) {
  const e = program.eligibility;
  if (e.utilityRequired) {
    const req = e.utilityRequired;
    if (Array.isArray(req)) {
      if (!req.includes(form.util)) return false;
    } else {
      if (form.util !== req) return false;
    }
  }
  if (e.minUnits && parseInt(form.units) < e.minUnits) return false;
  if (e.minAmiPct && amiPct < e.minAmiPct) return false;
  if (e.counties && e.counties.length > 0 && !e.counties.includes(form.county)) return false;
  if (e.requiresNonprofit && form.np !== "yes") return false;
  if (e.requiresDAC && !isDac) return false;
  return true;
}

// Returns the first failing rule as a human-readable string
function getFailureReason(program, form, amiPct, isDac) {
  const e = program.eligibility;
  if (e.utilityRequired) {
    const req = e.utilityRequired;
    const fails = Array.isArray(req) ? !req.includes(form.util) : form.util !== req;
    if (fails) {
      const utilLabels = Array.isArray(req)
        ? req.map(u => CONFIG.utilities.find(x => x.value === u)?.label || u).join(" or ")
        : CONFIG.utilities.find(u => u.value === req)?.label || req;
      return `Requires ${utilLabels} service territory`;
    }
  }
  if (e.minUnits && parseInt(form.units) < e.minUnits)
    return `Requires ${e.minUnits}+ units`;
  if (e.minAmiPct && amiPct < e.minAmiPct)
    return `Requires ${e.minAmiPct}%+ low-income units — currently ${Math.round(amiPct)}%`;
  if (e.counties && e.counties.length > 0 && !e.counties.includes(form.county)) {
    const names = e.counties.map(v => CONFIG.counties.find(c => c.value === v)?.label || v).join(", ");
    return `Requires property in: ${names}`;
  }
  if (e.requiresNonprofit && form.np !== "yes")
    return "Requires 501(c)(3) nonprofit status";
  if (e.requiresDAC && !isDac)
    return "Requires CalEPA Disadvantaged Community (DAC) status";
  return null;
}

// Returns the effective per-unit amount (with DAC bonus if applicable)
function getAmount(program, isDac) {
  return (isDac && program.dacBonusPerUnit) ? program.dacBonusPerUnit : program.perUnit;
}

// Returns the effective description
function getDesc(program, isDac) {
  return (isDac && program.dacDescription) ? program.dacDescription : program.description;
}

// Geocode address using Census API
async function geocodeAddr(address) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const url = `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    const data = await res.json();
    const match = data?.result?.addressMatches?.[0];
    if (!match) return { err: "notfound" };
    if ((match.addressComponents?.state || "").toUpperCase() !== "CA") return { err: "notca" };
    const countyName = match.geographies?.Counties?.[0]?.NAME || "";
    return {
      lat: match.coordinates?.y,
      lng: match.coordinates?.x,
      city: match.addressComponents?.city || "",
      countyName,
      matched: match.matchedAddress
    };
  } catch { clearTimeout(t); return { err: "network" }; }
}

// Map county name → county value
function toCountyVal(name) {
  const n = name.toLowerCase();
  return CONFIG.counties.find(c => n.includes(c.label.toLowerCase().replace(" county", "")))?.value || "other";
}

// Infer utility from geocoded city
function inferUtil(city) {
  return CONFIG.cityUtilityMap[city] || CONFIG.defaultUtility;
}

// Check DAC status via CalEnviroScreen (CA only)
async function checkDac(lat, lng) {
  if (!CONFIG.dacCheckEnabled) return { status: "disabled" };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const params = new URLSearchParams({
      geometry: `${lng},${lat}`, geometryType: "esriGeometryPoint",
      inSR: "4326", spatialRel: "esriSpatialRelIntersects",
      outFields: "CES4Score,Pct", returnGeometry: "false", f: "json"
    });
    const res = await fetch(
      `https://services1.arcgis.com/PCHfdHz2E7yMnDmG/arcgis/rest/services/CalEnviroScreen_4_CES_With_Score/FeatureServer/0/query?${params}`,
      { signal: ctrl.signal }
    );
    clearTimeout(t);
    const a = res.ok ? (await res.json())?.features?.[0]?.attributes : null;
    if (!a) return { status: "unknown" };
    const pct = Math.round(a.Pct);
    return { status: "found", pct, isDAC: pct >= 75 };
  } catch { clearTimeout(t); return { status: "unknown" }; }
}

const fmt = n => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const LBL = { display: "block", fontSize: 11, fontWeight: 700, color: "#B2B2B2", marginBottom: 8, textTransform: "uppercase", letterSpacing: "1px" };

// Fetch address suggestions from Nominatim (OSM), CA only
async function fetchSuggestions(query) {
  if (query.trim().length < 4) return [];
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1&countrycodes=us`;
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    const data = await res.json();
    return data
      .filter(item => item.address?.state === "California")
      .map(item => {
        const a = item.address;
        const street = [a.house_number, a.road].filter(Boolean).join(" ");
        const city   = a.city || a.town || a.village || a.suburb || "";
        const zip    = a.postcode ? a.postcode.split("-")[0] : "";
        const label  = [street, city, zip ? `CA ${zip}` : "CA"].filter(Boolean).join(", ");
        return { label, lat: parseFloat(item.lat), lng: parseFloat(item.lon), city, countyName: a.county || "" };
      })
      .filter(s => s.label.length > 5);
  } catch { return []; }
}

export default function App() {
  const [step, setStep]     = useState("lookup");
  const [addr, setAddr]     = useState("");
  const [loading, setLoading] = useState(false);
  const [geo, setGeo]       = useState(null);
  const [geoErr, setGeoErr] = useState(null);
  const [manual, setManual] = useState(false);
  const [open, setOpen]     = useState(false);
  const [form, setForm]     = useState({ county: "", util: "", units: "", li: "", np: "yes" });
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug]         = useState(false);
  const [activeIdx, setActiveIdx]     = useState(-1);
  const sugRef = useRef(null);

  // Debounced suggestion fetch
  useEffect(() => {
    if (addr.length < 4) { setSuggestions([]); setShowSug(false); return; }
    const t = setTimeout(async () => {
      const results = await fetchSuggestions(addr);
      setSuggestions(results);
      setShowSug(results.length > 0);
      setActiveIdx(-1);
    }, 380);
    return () => clearTimeout(t);
  }, [addr]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = e => { if (sugRef.current && !sugRef.current.contains(e.target)) setShowSug(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // When user picks a suggestion: use Nominatim lat/lng directly — skip Census geocoder
  const handleSelectSuggestion = async (sug) => {
    setAddr(sug.label);
    setShowSug(false);
    setSuggestions([]);
    setLoading(true); setGeoErr(null);
    const county = toCountyVal(sug.countyName);
    const util   = inferUtil(sug.city);
    setGeo({ matched: sug.label, county, util, city: sug.city, lat: sug.lat, lng: sug.lng, dac: { status: "checking" } });
    setForm(f => ({ ...f, county, util }));
    setStep("form"); setLoading(false);
    const dac = await checkDac(sug.lat, sug.lng);
    setGeo(prev => ({ ...prev, dac }));
  };

  // Keyboard navigation for dropdown
  const handleAddrKeyDown = e => {
    if (!showSug || suggestions.length === 0) {
      if (e.key === "Enter") handleLookup();
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === "Enter") { e.preventDefault(); if (activeIdx >= 0) handleSelectSuggestion(suggestions[activeIdx]); else handleLookup(); }
    else if (e.key === "Escape") { setShowSug(false); setActiveIdx(-1); }
  };

  const tu    = parseInt(form.units) || 0;
  const li    = parseInt(form.li) || 0;
  const pct   = tu > 0 && li > 0 ? (li / tu) * 100 : 0;
  const ok    = form.util && form.county && tu > 0 && li > 0 && li <= tu;
  const isDac = geo?.dac?.isDAC || false;

  // Evaluate all programs against current form state
  const ev = CONFIG.programs.map(p => {
    const elig = checkEligibility(p, form, pct, isDac);
    const amt  = getAmount(p, isDac);
    return { ...p, elig, reason: elig ? null : getFailureReason(p, form, pct, isDac), amt, tot: amt * tu, desc: getDesc(p, isDac), isDacBonus: isDac && !!p.dacBonusPerUnit };
  });
  const yes   = ev.filter(p => p.elig);
  const no    = ev.filter(p => !p.elig);
  const tipu  = yes.reduce((s, p) => s + p.amt, 0);
  const ti    = tipu * tu;
  const tc    = CONFIG.costPerUnit * tu;
  const cpct  = Math.min(100, Math.round((tipu / CONFIG.costPerUnit) * 100));
  const gap   = Math.max(0, tc - ti);
  const gpu   = tu > 0 ? gap / tu : 0;
  const cc    = cpct >= 90 ? B.green : cpct >= 60 ? B.sky : B.gray;
  const measures = [...new Set(yes.flatMap(p => p.measures))];

  let cum = 0;
  const segs = [
    ...yes.map(p => { const w = Math.min((p.amt / CONFIG.costPerUnit) * 100, 100 - cum); const seg = { ...p, w: Math.max(w, 0), s: cum }; cum = Math.min(cum + w, 100); return seg; }),
    ...(gap > 0 ? [{ id: "gap", name: "Remaining Gap", isGap: true, color: "rgba(255,255,255,0.06)", textColor: "rgba(255,255,255,0.35)", w: 100 - cum, s: cum, amt: gpu }] : [])
  ];

  const handleLookup = async () => {
    if (!addr.trim() || loading) return;
    setLoading(true); setGeoErr(null);
    const g = await geocodeAddr(addr);
    if (g.err) { setGeoErr(g.err); setLoading(false); return; }
    const county = toCountyVal(g.countyName);
    const util   = inferUtil(g.city);
    setGeo({ matched: g.matched, county, util, city: g.city, lat: g.lat, lng: g.lng, dac: { status: "checking" } });
    setForm(f => ({ ...f, county, util }));
    setStep("form"); setLoading(false);
    const dac = await checkDac(g.lat, g.lng);
    setGeo(prev => ({ ...prev, dac }));
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    .field{width:100%;background:rgba(255,255,255,0.05);border:1.5px solid rgba(255,255,255,0.12);border-radius:8px;padding:12px 14px;color:#fff;font-family:'Barlow',sans-serif;font-size:15px;transition:border-color 0.2s;appearance:none;-webkit-appearance:none}
    .field:focus{border-color:#27AAE1;background:rgba(39,170,225,0.06);outline:none}
    select.field option{background:#021230}
    .hov:hover{background:rgba(255,255,255,0.06)!important}
    .cta{transition:all 0.18s;display:inline-block}.cta:hover{opacity:.88;transform:scale(1.02)}
    @keyframes up{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
    .fade{animation:up 0.45s ease forwards}
    @keyframes sIn{from{transform:scaleX(0)}to{transform:scaleX(1)}}
    .seg-anim{animation:sIn .65s cubic-bezier(.34,1.1,.64,1) both;transform-origin:left center}
    @keyframes pop{from{opacity:0;transform:scale(.9) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
    .pop{animation:pop .5s ease .35s both}
    @keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin 1s linear infinite}
    @keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}.pulse{animation:pulse 1.5s ease infinite}
    .sugg-drop{position:absolute;top:calc(100% + 6px);left:0;right:0;background:#071a3e;border:1.5px solid rgba(39,170,225,0.3);border-radius:10px;overflow:hidden;z-index:100;box-shadow:0 8px 32px rgba(0,0,0,0.45)}
    .sugg-item{padding:11px 16px;font-size:14px;cursor:pointer;color:rgba(255,255,255,0.8);border-bottom:1px solid rgba(255,255,255,0.06);transition:background 0.12s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .sugg-item:last-child{border-bottom:none}
    .sugg-item:hover,.sugg-item.active{background:rgba(39,170,225,0.12);color:#fff}
  `;

  return (
    <div style={{ minHeight: "100vh", background: B.navy, fontFamily: "'Barlow',sans-serif", color: "#fff" }}>
      <style>{css}</style>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(163,229,67,0.1)", border: "1px solid rgba(163,229,67,0.25)", borderRadius: 20, padding: "5px 14px", marginBottom: 22 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: B.green }} />
            <span style={{ fontSize: 11, color: B.green, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" }}>
              Retrofit.LA · {CONFIG.region}
            </span>
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "clamp(36px,6vw,54px)", fontWeight: 800, lineHeight: 1.05 }}>
            Incentive Stack<br /><span style={{ color: B.sky }}>Calculator</span>
          </h1>
          <p style={{ marginTop: 14, color: B.gray, fontSize: 16, lineHeight: 1.65, maxWidth: 520 }}>
            Enter your property address to see which decarbonization incentive programs you qualify for — and how much of your retrofit they can cover.
          </p>
        </div>

        {/* ── LOOKUP ── */}
        {step === "lookup" && (
          <div className="fade">
            <div style={{ background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 18, padding: "32px 28px" }}>
              <label style={LBL}>Property Address</label>
              <div style={{ display: "flex", gap: 10, position: "relative" }} ref={sugRef}>
                <div style={{ flex: 1, position: "relative" }}>
                  <input type="text" className="field" autoComplete="off"
                    placeholder="e.g. 611 S Lorena St, Los Angeles"
                    value={addr}
                    onChange={e => { setAddr(e.target.value); setGeoErr(null); }}
                    onKeyDown={handleAddrKeyDown}
                    onFocus={() => suggestions.length > 0 && setShowSug(true)}
                    style={{ width: "100%" }} />
                  {showSug && suggestions.length > 0 && (
                    <div className="sugg-drop">
                      {suggestions.map((s, i) => (
                        <div key={i}
                          className={"sugg-item" + (i === activeIdx ? " active" : "")}
                          onMouseDown={() => handleSelectSuggestion(s)}>
                          {s.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div onClick={handleLookup} className="cta" style={{
                  padding: "12px 18px", borderRadius: 8, flexShrink: 0, whiteSpace: "nowrap",
                  background: addr.trim() && !loading ? B.green : "rgba(255,255,255,0.08)",
                  color: addr.trim() && !loading ? B.navy : "rgba(255,255,255,0.3)",
                  fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15,
                  cursor: addr.trim() && !loading ? "pointer" : "default",
                  display: "flex", alignItems: "center", gap: 8, alignSelf: "flex-start"
                }}>
                  {loading
                    ? <><div className="spin" style={{ width: 16, height: 16, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: B.navy, borderRadius: "50%" }} /> Looking up...</>
                    : "Look Up →"}
                </div>
              </div>
              {geoErr && (
                <div style={{ marginTop: 14, padding: "12px 16px", background: "rgba(255,80,80,0.08)", borderLeft: "3px solid rgba(255,100,100,0.5)", borderRadius: "0 8px 8px 0" }}>
                  <p style={{ fontSize: 13, color: "rgba(255,160,160,1)", lineHeight: 1.5 }}>
                    {geoErr === "notfound" && "Address not found. Check the address and try again, or enter manually."}
                    {geoErr === "notca" && "This tool is currently for California properties."}
                    {geoErr === "network" && "Couldn't reach the lookup service. Try again or enter manually."}
                  </p>
                </div>
              )}
              <div style={{ marginTop: 20, padding: "13px 16px", background: "rgba(39,170,225,0.07)", borderLeft: "3px solid " + B.sky, borderRadius: "0 8px 8px 0" }}>
                <p style={{ fontSize: 13, color: B.sky, lineHeight: 1.55 }}>
                  Your address is used to check county, utility territory, and Disadvantaged Community status — which affects which programs you qualify for. Address is not stored.
                </p>
              </div>
            </div>
            <div style={{ textAlign: "center", marginTop: 18 }}>
              <span onClick={() => { setManual(true); setStep("form"); }} style={{ fontSize: 13, color: B.gray, cursor: "pointer", textDecoration: "underline", textDecorationColor: "rgba(178,178,178,0.35)" }}>
                Skip — enter county and utility manually
              </span>
            </div>
          </div>
        )}

        {/* ── FORM ── */}
        {step === "form" && (
          <div className="fade">
            {geo && !manual && (
              <div style={{ background: "rgba(163,229,67,0.05)", border: "1px solid rgba(163,229,67,0.18)", borderRadius: 14, padding: "20px 22px", marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: B.green, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>Property Detected</div>
                    <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>{geo.matched}</div>
                    <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: B.gray }}>{CONFIG.counties.find(c => c.value === geo.county)?.label || geo.county}</span>
                      <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
                      <span style={{ fontSize: 12, color: B.gray }}>{CONFIG.utilities.find(u => u.value === geo.util)?.label || geo.util}</span>
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {geo.dac?.status === "checking" && <div className="pulse" style={{ fontSize: 12, color: B.sky, fontWeight: 600, padding: "8px 12px" }}>Checking DAC status…</div>}
                    {geo.dac?.status === "found" && geo.dac.isDAC && (
                      <div style={{ background: "rgba(163,229,67,0.12)", border: "1px solid rgba(163,229,67,0.35)", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: B.green, textTransform: "uppercase", letterSpacing: "0.8px" }}>✓ Disadvantaged Community</div>
                        <div style={{ fontSize: 12, color: B.green, marginTop: 3 }}>CalEnviroScreen {geo.dac.pct}th pct.</div>
                        <div style={{ fontSize: 11, color: "rgba(163,229,67,0.65)", marginTop: 2 }}>MAHEP, SGIP Equity Resiliency eligible</div>
                      </div>
                    )}
                    {geo.dac?.status === "found" && !geo.dac.isDAC && (
                      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: B.gray, textTransform: "uppercase", letterSpacing: "0.8px" }}>Standard Area</div>
                        <div style={{ fontSize: 12, color: B.gray, marginTop: 3 }}>CES {geo.dac.pct}th pct.</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>Standard program eligibility</div>
                      </div>
                    )}
                    {(geo.dac?.status === "unknown" || geo.dac?.status === "disabled") && (
                      <div style={{ background: "rgba(39,170,225,0.06)", border: "1px solid rgba(39,170,225,0.2)", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: B.sky, textTransform: "uppercase", letterSpacing: "0.8px" }}>DAC Status</div>
                        <div style={{ fontSize: 11, color: B.sky, marginTop: 3 }}>Verified during FTA</div>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: 14, borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Wrong address?</span>
                  <span onClick={() => { setStep("lookup"); setGeo(null); setGeoErr(null); }} style={{ fontSize: 12, color: B.sky, cursor: "pointer", textDecoration: "underline" }}>Start over</span>
                </div>
              </div>
            )}

            <div style={{ background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 18, padding: "28px" }}>
              <div style={{ display: "grid", gap: 22 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ ...LBL, display: "flex", alignItems: "center", gap: 6 }}>
                      County {geo && !manual && <span style={{ color: B.sky, fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: 11 }}>auto-detected</span>}
                    </label>
                    <select className="field" value={form.county} onChange={e => sf("county", e.target.value)}>
                      {!form.county && <option value="">Select...</option>}
                      {CONFIG.counties.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ ...LBL, display: "flex", alignItems: "center", gap: 6 }}>
                      Utility {geo && !manual && <span style={{ color: B.sky, fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: 11 }}>auto-detected</span>}
                    </label>
                    <select className="field" value={form.util} onChange={e => sf("util", e.target.value)}>
                      {!form.util && <option value="">Select...</option>}
                      {CONFIG.utilities.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={LBL}>Total Units</label>
                    <input type="number" className="field" placeholder="e.g. 45" value={form.units} min="1" onChange={e => sf("units", e.target.value)} />
                  </div>
                  <div>
                    <label style={{ ...LBL, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span>Low-Income Units</span>
                      {pct > 0 && <span style={{ color: B.sky, fontWeight: 500, textTransform: "none", letterSpacing: 0, fontSize: 12 }}>= {Math.round(pct)}% at ≤80% AMI</span>}
                    </label>
                    <input type="number" className="field" placeholder={tu ? "0–" + tu : "e.g. 36"} value={form.li} min="0" max={form.units || undefined} onChange={e => sf("li", e.target.value)} />
                  </div>
                </div>
                <div style={{ padding: "14px 16px", background: "rgba(39,170,225,0.07)", borderLeft: "3px solid " + B.sky, borderRadius: "0 8px 8px 0" }}>
                  <p style={{ fontSize: 13, color: B.sky, lineHeight: 1.6 }}>
                    <strong>This is an estimate.</strong> Count units where tenant income is at or below 80% AMI — from your rent roll. Don't have the exact number? Enter your best guess.
                    <span style={{ color: "rgba(39,170,225,0.7)" }}> When you apply for Financial TA, you'll have the option to upload an anonymous rent roll for a more precise calculation.</span>
                  </p>
                </div>
                <div>
                  <label style={LBL}>Organization Type</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[{ v: "yes", l: "501(c)(3) Nonprofit" }, { v: "no", l: "For-Profit / Other" }].map(({ v, l }) => (
                      <div key={v} onClick={() => sf("np", v)} style={{ flex: 1, padding: "13px 16px", borderRadius: 9, textAlign: "center", cursor: "pointer", fontWeight: 600, fontSize: 14, border: "2px solid " + (form.np === v ? B.sky : "rgba(255,255,255,0.1)"), background: form.np === v ? "rgba(39,170,225,0.1)" : "rgba(255,255,255,0.02)", color: form.np === v ? B.sky : "rgba(255,255,255,0.35)", transition: "all 0.18s" }}>{l}</div>
                    ))}
                  </div>
                </div>
              </div>
              <div onClick={() => ok && setStep("results")} style={{ marginTop: 26, padding: "17px 24px", borderRadius: 10, textAlign: "center", background: ok ? B.green : "rgba(255,255,255,0.06)", color: ok ? B.navy : "rgba(255,255,255,0.25)", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: "1.2px", textTransform: "uppercase", cursor: ok ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
                Calculate My Incentive Stack →
              </div>
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {step === "results" && (
          <div className="fade">
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>📊</span>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
                <strong style={{ color: "rgba(255,255,255,0.8)" }}>These are estimates</strong> based on current program guidelines as of May 2026. Actual amounts depend on your building's systems, planned scope, and program funding availability. Upload an anonymous rent roll during Financial TA for a precise figure.
              </p>
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 18, padding: "28px", marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20, marginBottom: isDac ? 16 : 26 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: B.gray, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Estimated Project Cost</div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 42, fontWeight: 800, lineHeight: 1, color: "rgba(255,255,255,0.4)" }}>{fmt(tc)}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", marginTop: 5 }}>{CONFIG.costPerUnitLabel}</div>
                </div>
                <div className="pop" style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: B.gray, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Incentives Cover</div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 54, fontWeight: 800, lineHeight: 1, color: cc }}>{cpct}%</div>
                  <div style={{ fontSize: 13, color: B.gray, marginTop: 5 }}>{fmt(ti)} of {fmt(tc)}</div>
                </div>
              </div>

              {isDac && (
                <div style={{ marginBottom: 20, padding: "11px 16px", background: "rgba(163,229,67,0.08)", border: "1px solid rgba(163,229,67,0.25)", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>📍</span>
                  <span style={{ fontSize: 13, color: B.green, lineHeight: 1.4 }}>
                    <strong>Disadvantaged Community</strong> — This property is in a CalEnviroScreen priority area. DAC status unlocks MAHEP, SGIP Equity Resiliency, and enhanced LIWP rates. Your FTA advisor will identify any additional DAC-specific funding opportunities.
                  </span>
                </div>
              )}

              <div style={{ fontSize: 11, fontWeight: 700, color: B.gray, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>How the Stack Covers Your Project</div>
              <div style={{ position: "relative", height: 80, borderRadius: 12, overflow: "hidden", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                {segs.map((seg, i) => (
                  <div key={seg.id} className="seg-anim" style={{
                    position: "absolute", top: 0, bottom: 0, left: seg.s + "%", width: seg.w + "%",
                    background: seg.color,
                    borderRight: i < segs.length - 1 ? "2px solid rgba(2,18,48,0.5)" : "none",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    overflow: "hidden", padding: "0 6px",
                    animationDelay: `${i * 0.2 + 0.1}s`
                  }}>
                    {seg.w > 8 && <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: seg.textColor || seg.tc, lineHeight: 1.2, whiteSpace: "nowrap" }}>{seg.isGap ? "Gap" : seg.name}</div>
                      {seg.w > 14 && <div style={{ fontSize: 10, color: seg.textColor || seg.tc, opacity: .75, marginTop: 2 }}>{fmt(seg.amt)}/unit</div>}
                    </div>}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
                {segs.map(seg => (
                  <div key={seg.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: seg.color, border: seg.isGap ? "1px solid rgba(255,255,255,0.2)" : "none", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: seg.isGap ? "rgba(255,255,255,0.3)" : B.gray }}>{seg.name} — {fmt(seg.amt)}/unit</span>
                  </div>
                ))}
              </div>
              {gap > 0 ? (
                <div style={{ marginTop: 18, padding: "13px 16px", background: "rgba(39,170,225,0.07)", borderLeft: "3px solid " + B.sky, borderRadius: "0 8px 8px 0" }}>
                  <span style={{ fontSize: 13, color: B.sky, lineHeight: 1.5 }}><strong>{fmt(gap)}</strong> remaining gap can be bridged through GoGreen Financing (IBank), CDFI loans, or philanthropic capital. Your FTA advisor will structure this.</span>
                </div>
              ) : yes.length > 0 ? (
                <div style={{ marginTop: 18, padding: "13px 16px", background: "rgba(163,229,67,0.08)", borderLeft: "3px solid " + B.green, borderRadius: "0 8px 8px 0" }}>
                  <span style={{ fontSize: 13, color: B.green }}><strong>Your stack covers 100% of estimated retrofit costs.</strong> This is a prime candidate for a fully-funded retrofit.</span>
                </div>
              ) : null}
            </div>

            {yes.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: B.gray, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>✓ Qualified Programs ({yes.length})</div>
                <div style={{ display: "grid", gap: 10 }}>
                  {yes.map(p => (
                    <div key={p.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid " + p.color + "35", borderLeft: "4px solid " + p.color, borderRadius: "0 12px 12px 0", padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: B.gray, marginTop: 2 }}>{p.funder}</div>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 6, lineHeight: 1.5 }}>{p.desc}</div>
                        {p.isDacBonus && <div style={{ fontSize: 11, color: B.green, marginTop: 5 }}>✓ DAC enhanced rate applied</div>}
                        {p.isEstimate && !p.isDacBonus && <div style={{ fontSize: 11, color: B.sky, marginTop: 5 }}>* Estimated amount — confirm with program administrator</div>}
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 32, fontWeight: 800, color: p.color, lineHeight: 1 }}>{fmt(p.amt)}<span style={{ fontSize: 14, fontWeight: 500 }}>/unit</span></div>
                        <div style={{ fontSize: 13, color: B.gray, marginTop: 5 }}>{fmt(p.tot)} total</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {yes.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div onClick={() => setOpen(o => !o)} className="hov" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "16px 22px", background: "rgba(29,69,154,0.15)", border: "1px solid rgba(29,69,154,0.35)", borderRadius: open ? "12px 12px 0 0" : "12px", transition: "border-radius 0.2s,background 0.2s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>What These Programs Can Fund</span>
                    <span style={{ background: "rgba(29,69,154,0.5)", color: B.sky, fontSize: 11, fontWeight: 700, borderRadius: 20, padding: "3px 10px" }}>{measures.length} upgrade types</span>
                  </div>
                  <span style={{ color: B.sky, fontSize: 22, lineHeight: 1, display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s" }}>⌄</span>
                </div>
                {open && (
                  <div style={{ background: "rgba(29,69,154,0.07)", border: "1px solid rgba(29,69,154,0.35)", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "22px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10, marginBottom: 18 }}>
                      {measures.map(m => {
                        const fb = yes.filter(p => p.measures.includes(m));
                        return (
                          <div key={m} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.07)" }}>
                            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, lineHeight: 1.3 }}>{m}</div>
                            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                              {fb.map(p => <span key={p.id} style={{ fontSize: 10, fontWeight: 700, background: p.color + "25", color: p.color, border: "1px solid " + p.color + "45", borderRadius: 4, padding: "2px 7px" }}>{p.name}</span>)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ padding: "14px 18px", background: "rgba(163,229,67,0.07)", borderLeft: "3px solid " + B.green, borderRadius: "0 8px 8px 0" }}>
                      <p style={{ fontSize: 13, color: B.green, lineHeight: 1.55 }}>
                        <strong>Stacked correctly, these programs can cover 90–100% of retrofit costs.</strong> Financial TA helps you sequence applications, navigate requirements, and access every dollar you qualify for.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {no.length > 0 && (
              <div style={{ marginBottom: 26 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Not Currently Eligible ({no.length})</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {no.map(p => (
                    <div key={p.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "rgba(255,255,255,0.3)" }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", marginTop: 3 }}>{p.reason}</div>
                      </div>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.18)" }}>{fmt(p.perUnit)}/unit missed</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {yes.length > 0 && (
              <div style={{ background: "linear-gradient(135deg,rgba(29,69,154,0.35) 0%,rgba(39,170,225,0.15) 100%)", border: "1px solid rgba(39,170,225,0.3)", borderRadius: 18, padding: "32px 28px", marginBottom: 16, textAlign: "center" }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: "clamp(22px,4vw,30px)", fontWeight: 800, marginBottom: 12 }}>
                  {CONFIG.ctaHeadline}
                </div>
                <p style={{ fontSize: 15, color: B.gray, lineHeight: 1.65, maxWidth: 480, margin: "0 auto 10px" }}>
                  {CONFIG.ctaBody}
                </p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 24, lineHeight: 1.5 }}>
                  {CONFIG.ctaSubnote}
                </p>
                <div className="cta" style={{ padding: "17px 44px", borderRadius: 10, background: B.green, cursor: "pointer", color: B.navy, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 19, letterSpacing: "1px", textTransform: "uppercase" }}>
                  {CONFIG.ctaButton}
                </div>
              </div>
            )}

            <div onClick={() => { setStep("form"); setOpen(false); }} className="hov" style={{ padding: "14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", textAlign: "center", cursor: "pointer", color: B.gray, fontWeight: 600, fontSize: 14, marginBottom: 24, transition: "background 0.18s" }}>
              ← Recalculate
            </div>

            <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.18)", lineHeight: 1.75 }}>
              Estimates based on program guidelines as of May 2026. Sources: LADWP, SCE, SCAQMD, CSD, CEC/CPUC, AEA program data. Project costs at ~${CONFIG.costPerUnit.toLocaleString()}/unit avg. comprehensive electrification retrofit. Actual amounts vary by scope and program availability. Not financial or legal advice.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
