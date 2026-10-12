// More demo cars (client, 12.10.2026: "at least 20 listings", then "every car photo
// different and matching its make"). Seven come from the prototype's 48-listing
// js/mock-data/cars.js (git 56ea1af) and use the prototype's own photo sets c3–c13,
// one set per listing; eight are new models with their own photo, c14–c21 — free
// Unsplash photos (Unsplash License), credits in PHOTO_CREDITS below. Together with
// the six in cars.js that makes 21 listings on 21 different photo sets. Colours
// follow the photos. Seeded like the rest (isDemo, idempotent by title).

export const EXTRA_CARS = [
  {
    make: 'Mazda', model: '3', year: 2020, bodyType: 'sedan', price: 17800, mileage: 29500,
    engine: '2.5L I4', transmission: 'Automatic', color: 'Red', fuel: 'Gasoline',
    description: 'Low mileage, garage kept, no accidents. Great handling and fuel economy for city driving.',
    seller: { name: 'Nina H.', phone: '(206) 555-0414' },
    photos: ['img/cars/c3-1.webp', 'img/cars/c3-2.webp', 'img/cars/c3-3.webp'],
  },
  {
    make: 'Ford', model: 'Explorer', year: 2018, bodyType: 'suv', price: 21200, mileage: 58000,
    engine: '3.5L V6', transmission: 'Automatic', color: 'Silver', fuel: 'Gasoline',
    description: '3-row seating, tow package, recently serviced brakes and battery.',
    seller: { name: 'Marcus L.', phone: '(206) 555-0427' },
    photos: ['img/cars/c6-1.webp', 'img/cars/c6-2.webp', 'img/cars/c6-3.webp'],
  },
  {
    make: 'Jeep', model: 'Wrangler', year: 2020, bodyType: 'suv', price: 29800, mileage: 27500,
    engine: '3.6L V6', transmission: 'Automatic', color: 'Gray', fuel: 'Gasoline',
    description: 'Removable hardtop, off-road package, well cared for. Fun weekend and daily driver.',
    seller: { name: 'Owen R.', phone: '(206) 555-0438' },
    photos: ['img/cars/c7-1.webp', 'img/cars/c7-2.webp', 'img/cars/c7-3.webp'],
  },
  {
    make: 'Chevrolet', model: 'Silverado 1500', year: 2020, bodyType: 'truck', price: 33500, mileage: 34500,
    engine: '5.3L V8', transmission: 'Automatic', color: 'Red', fuel: 'Gasoline',
    description: 'Crew cab, LT trim, low mileage for the year, no accidents on record.',
    seller: { name: 'Luis V.', phone: '(206) 555-0449' },
    photos: ['img/cars/c9-1.webp', 'img/cars/c9-2.webp', 'img/cars/c9-3.webp'],
  },
  {
    make: 'Honda', model: 'Fit', year: 2017, bodyType: 'hatchback', price: 13900, mileage: 62000,
    engine: '1.5L I4', transmission: 'CVT Automatic', color: 'Black', fuel: 'Gasoline',
    description: 'Reliable, economical, and easy to park in the city. New tires this year.',
    seller: { name: 'Amy C.', phone: '(206) 555-0452' },
    photos: ['img/cars/c10-1.webp', 'img/cars/c10-2.webp', 'img/cars/c10-3.webp'],
  },
  {
    make: 'Volkswagen', model: 'Golf', year: 2018, bodyType: 'hatchback', price: 15600, mileage: 51000,
    engine: '1.8L Turbo I4', transmission: 'Automatic', color: 'Red', fuel: 'Gasoline',
    description: 'Fun to drive, well maintained, recent timing belt service completed.',
    seller: { name: 'Erik S.', phone: '(206) 555-0463' },
    photos: ['img/cars/c11-1.webp', 'img/cars/c11-2.webp', 'img/cars/c11-3.webp'],
  },
  {
    make: 'Chevrolet', model: 'Camaro', year: 2019, bodyType: 'coupe', price: 26800, mileage: 26000,
    engine: '2.0L Turbo I4', transmission: 'Automatic', color: 'White', fuel: 'Gasoline',
    description: '1LT trim, well cared for, non-smoker. Great condition inside and out.',
    seller: { name: 'Jordan T.', phone: '(206) 555-0474' },
    photos: ['img/cars/c13-1.webp', 'img/cars/c13-2.webp', 'img/cars/c13-3.webp'],
  },
  {
    make: 'Tesla', model: 'Model 3', year: 2021, bodyType: 'sedan', price: 31900, mileage: 28400,
    engine: 'Dual-motor electric', transmission: 'Automatic', color: 'White', fuel: 'Electric',
    description: 'Long Range AWD, about 350 miles on a charge, Autopilot. One owner, charged at home.',
    seller: { name: 'Priya S.', phone: '(206) 555-0481' },
    photos: ['img/cars/c14-1.webp'],
  },
  {
    make: 'Subaru', model: 'Forester', year: 2018, bodyType: 'suv', price: 21400, mileage: 52300,
    engine: '2.5L Boxer 4', transmission: 'CVT Automatic', color: 'Blue', fuel: 'Gasoline',
    description: 'Premium trim, symmetrical all-wheel drive, roof rails. Ready for the mountain passes.',
    seller: { name: 'Hannah B.', phone: '(206) 555-0492' },
    photos: ['img/cars/c15-1.webp'],
  },
  {
    make: 'Toyota', model: 'Tacoma', year: 2019, bodyType: 'truck', price: 34800, mileage: 38700,
    engine: '3.5L V6', transmission: 'Automatic', color: 'Tan', fuel: 'Gasoline',
    description: 'TRD Off-Road double cab, lifted on all-terrain tires, tow package. Clean title.',
    seller: { name: 'Caleb J.', phone: '(206) 555-0503' },
    photos: ['img/cars/c16-1.webp'],
  },
  {
    make: 'BMW', model: '3 Series', year: 2018, bodyType: 'sedan', price: 46900, mileage: 31200,
    engine: '3.0L Twin-Turbo I6', transmission: 'Manual', color: 'Orange', fuel: 'Gasoline',
    description: 'M3 with the six-speed manual, aftermarket wheels, adult owned and dealer serviced.',
    seller: { name: 'Alex M.', phone: '(206) 555-0514' },
    photos: ['img/cars/c17-1.webp'],
  },
  {
    make: 'Toyota', model: 'Prius', year: 2023, bodyType: 'hatchback', price: 30900, mileage: 9800,
    engine: '2.0L I4 Hybrid', transmission: 'CVT Automatic', color: 'White', fuel: 'Hybrid',
    description: 'The new-shape Prius, about 57 mpg combined. Still under factory warranty.',
    seller: { name: 'Mei L.', phone: '(206) 555-0525' },
    photos: ['img/cars/c18-1.webp'],
  },
  {
    make: 'Jeep', model: 'Grand Cherokee', year: 2019, bodyType: 'suv', price: 26700, mileage: 47600,
    engine: '3.6L V6', transmission: 'Automatic', color: 'Gray', fuel: 'Gasoline',
    description: 'Limited 4x4, leather, heated seats and steering wheel. Winter tires included.',
    seller: { name: 'Ryan K.', phone: '(206) 555-0536' },
    photos: ['img/cars/c19-1.webp'],
  },
  {
    make: 'Hyundai', model: 'Tucson', year: 2020, bodyType: 'suv', price: 19800, mileage: 36900,
    engine: '2.0L I4', transmission: 'Automatic', color: 'Gray', fuel: 'Gasoline',
    description: 'SE with Apple CarPlay and blind-spot monitoring. Balance of the factory warranty.',
    seller: { name: 'Sofia G.', phone: '(206) 555-0547' },
    photos: ['img/cars/c20-1.webp'],
  },
  {
    make: 'Honda', model: 'Civic', year: 2020, bodyType: 'hatchback', price: 22600, mileage: 24100,
    engine: '1.5L Turbo I4', transmission: 'CVT Automatic', color: 'Red', fuel: 'Gasoline',
    description: 'Sport hatchback, Honda Sensing, center-exit exhaust. One owner, no accidents.',
    seller: { name: 'Daniel P.', phone: '(206) 555-0558' },
    photos: ['img/cars/c21-1.webp'],
  },
] as const

/** The six prototype listings (js/mock-data/cars.js), recoloured to match their photos. */
export const PROTOTYPE_CAR_COLORS: Record<string, string> = {
  '2021 Toyota Camry': 'White',
  '2021 Subaru Outback': 'Black',
  '2022 Toyota RAV4': 'Blue',
  '2020 Ford F-150': 'Orange',
  '2021 Ford Mustang': 'Gray',
}

/** Demo listings seeded on 12.10.2026 and replaced the same day: they reused another
 *  listing's photo set. The seed removes them (demo rows only). */
export const RETIRED_DEMO_CARS = [
  '2020 Toyota Camry',
  '2022 Subaru Outback',
  '2021 Toyota RAV4',
  '2021 Ford Explorer',
  '2022 Jeep Wrangler',
  '2022 Chevrolet Silverado 1500',
  '2019 Volkswagen Golf',
  '2022 Ford Mustang',
]

/** c14–c21 are Unsplash photos (Unsplash License: free to use, credit appreciated). */
export const PHOTO_CREDITS: Record<string, string> = {
  c14: 'Charlie Deets',
  c15: 'Andrew Van Hofwegen',
  c16: 'Dusty Barnes',
  c17: 'Akbar Nemati',
  c18: 'Zion C',
  c19: 'Travis Essinger',
  c20: 'Duncan Winslow',
  c21: 'C Joyful',
}
