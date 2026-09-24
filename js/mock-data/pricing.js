export const PRICING_TIERS = [
  {
    key: "standard",
    name: "Standard",
    monthly: 49,
    q3: 147,
    q6: 294,
    yearly: 588,
    yearlyDiscounted: 490,
  },
  {
    key: "lux",
    name: "Lux",
    monthly: 79,
    q3: 237,
    q6: 474,
    yearly: 948,
    yearlyDiscounted: 790,
  },
  {
    key: "premium",
    name: "Premium",
    monthly: 129,
    q3: 387,
    q6: 774,
    yearly: 1548,
    yearlyDiscounted: 1290,
  },
];

/**
 * Feature/limit matrix per tier. `true` = included, `false` = not included,
 * a number = a numeric limit for that tier.
 */
export const PRICING_FEATURES = [
  { label: "Edit your own listing data", standard: true, lux: true, premium: true },
  { label: "Placement on the city map", standard: true, lux: true, premium: true },
  { label: "Post company news & promotions", standard: true, lux: true, premium: true },
  { label: "Upload price lists & certificates", standard: true, lux: true, premium: true },
  { label: "Directory categories", standard: 2, lux: 10, premium: 15 },
  { label: "Photos (storefront, products)", standard: 10, lux: 100, premium: 1000 },
  { label: "Listings & job postings", standard: 5, lux: 50, premium: 100 },
  { label: "Product listings", standard: 0, lux: 100, premium: 1000 },
  { label: "Custom subdomain (yourbusiness.allseattle.org)", standard: false, lux: true, premium: true },
  { label: "Priority placement in directory & search", standard: false, lux: true, premium: true },
  { label: "Banner in category for first month", standard: false, lux: false, premium: true },
  { label: "Branded business page", standard: false, lux: false, premium: true },
];
