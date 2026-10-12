// The Business Directory's headings (client, 12.10.2026): 13 sections, each
// with its sub-categories, replacing the prototype's flat list. Read by the seed
// (scripts/seed-businesses.ts), which creates the tree, moves the businesses and
// removes the old directory categories, and by the directory route, which sends
// the old category URLs to their new homes. Shopping and Leisure keep their own
// categories.

import { slugify } from '../fields'

export const DIRECTORY_TREE: [section: string, children: string[]][] = [
  ['Automotive', ['Car Dealers', 'Auto Repair & Service', 'Auto Parts', 'Tires & Tire Shops', 'Car Wash', 'Auto Detailing', 'Body Shops', 'Auto Glass', 'Towing', 'Car Rental']],
  ['Real Estate', ['Real Estate Agents', 'Real Estate Agencies', 'Homes for Sale', 'Rentals', 'Property Management', 'Mortgage & Loans', 'Home Builders & Developers']],
  ['Restaurants & Food', ['Restaurants', 'Cafes', 'Coffee Shops', 'Bars', 'Bakeries', 'Fast Food', 'Food Delivery', 'Catering', 'Grocery Stores']],
  ['Beauty & Health', ['Beauty Salons', 'Barbershops', 'Nail Salons', 'Spas', 'Dental Clinics', 'Medical Clinics', 'Opticians', 'Fitness & Gyms']],
  ['Home & Remodeling', ['General Contractors', 'Painting', 'Plumbing', 'Electrical', 'HVAC', 'Roofing', 'Windows & Doors', 'Tile', 'Flooring', 'Drywall', 'Cleaning', 'Landscaping', 'Furniture & Interior']],
  ['Business Services', ['Attorneys', 'Accounting', 'Tax Services', 'Insurance', 'Financial Services', 'Consulting', 'Marketing & Advertising', 'IT Services']],
  ['Shopping & Retail', ['Clothing', 'Shoes', 'Electronics', 'Furniture', 'Jewelry', 'Gifts', 'Home Goods', 'Grocery', 'Specialty Stores', 'Beauty & Cosmetics', 'Sporting Goods']],
  ['Kids & Family', ['Daycares', 'Preschools', "Kids' Centers", 'Tutoring', "Kids' Activities", "Children's Stores", 'Family Services', 'Entertainment Centers']],
  ['Entertainment & Leisure', ['Cinemas', 'Bowling', 'Escape Rooms', 'Nightclubs', 'Karaoke', 'Concert Venues', 'Golf', 'Entertainment Centers']],
  ['Travel & Tourism', ['Hotels', 'Tours & Excursions', 'Vacation Rentals', 'Travel Agencies', 'Car Rentals']],
  ['Jobs & Education', ['Jobs & Careers', 'Staffing Agencies', 'Language Schools', 'Educational Centers', 'Vocational Training', 'Driving Schools']],
  ['Pets & Animals', ['Veterinary Clinics', 'Pet Grooming', 'Pet Stores', 'Pet Boarding', 'Pet Training']],
  ['Local Services', ['Moving Services', 'Dry Cleaning', 'Appliance Repair', 'Photography', 'Printing', 'Delivery & Courier Services']],
]

// Category slugs are unique across the whole site, not per section: Shopping
// already has "clothing", and "Entertainment Centers" sits in two sections here.
// Those few take a fixed slug of their own.
const SLUG_OVERRIDES: Record<string, string> = {
  'Shopping & Retail/Clothing': 'clothing-stores',
  'Kids & Family/Entertainment Centers': 'kids-family-entertainment-centers',
}

export const categorySlug = (name: string, parent?: string) =>
  (parent && SLUG_OVERRIDES[`${parent}/${name}`]) || slugify(name)

/** The demo businesses' new sub-category, by business name. */
export const BUSINESS_SUBCATEGORY: Record<string, [section: string, sub: string]> = {
  'Ballard Auto Parts & Supply': ['Automotive', 'Auto Parts'],
  'Cascade Tire & Wheel': ['Automotive', 'Tires & Tire Shops'],
  'Emerald Shine Car Wash': ['Automotive', 'Car Wash'],
  'Fremont Service Station & Tuning': ['Automotive', 'Auto Repair & Service'],
  'Northgate Motors Dealership': ['Automotive', 'Car Dealers'],
  'Puget Sound Driving School': ['Jobs & Education', 'Driving Schools'],
  'Rainier Car Rental': ['Automotive', 'Car Rental'],
  'Sound Auto Repair': ['Automotive', 'Auto Repair & Service'],
  'Westlake Towing & Roadside': ['Automotive', 'Towing'],
  'Needle & Fade Barbershop': ['Beauty & Health', 'Barbershops'],
  'Emerald City Coffee Roasters': ['Restaurants & Food', 'Coffee Shops'],
  'Fremont Sourdough Bakery': ['Restaurants & Food', 'Bakeries'],
  'Scoop City Creamery': ['Restaurants & Food', 'Cafes'],
  'Cascade Fitness Studio': ['Beauty & Health', 'Fitness & Gyms'],
  'Evergreen Yoga & Wellness': ['Beauty & Health', 'Fitness & Gyms'],
  'Duwamish Hardware & Supply': ['Shopping & Retail', 'Home Goods'],
  "Waggin' Waterfront Pet Grooming": ['Pets & Animals', 'Pet Grooming'],
  'Puget Sound Web Studio': ['Business Services', 'IT Services'],
  'Rainier Kitchen & Bar': ['Restaurants & Food', 'Restaurants'],
  'Skyline Brewing Taproom': ['Restaurants & Food', 'Bars'],
  'Blossom & Bay Florist': ['Shopping & Retail', 'Gifts'],
  'Elliott Bay Boutique': ['Shopping & Retail', 'Clothing'],
  'Pike & Pine Bookshop': ['Shopping & Retail', 'Specialty Stores'],
}

/** Old directory category slug → new category slug, for businesses outside the
 *  demo list and for 308 redirects from the old URLs. */
export const OLD_DIRECTORY_SLUGS: Record<string, string> = {
  'auto-services': 'automotive',
  'car-repair': 'auto-repair-service',
  'tires-wheels': 'tires-tire-shops',
  'service-stations': 'auto-repair-service',
  dealerships: 'car-dealers',
  'beauty-salons': 'beauty-salons',
  'coffee-cafes': 'coffee-shops',
  'food-bakeries': 'bakeries',
  'health-fitness': 'fitness-gyms',
  'home-hardware': 'home-goods',
  'pet-services': 'pets-animals',
  'professional-services': 'business-services',
}
