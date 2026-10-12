// More demo cars (client, 12.10.2026: "at least 20 listings", then "every car photo
// different and matching its make"). Seven come from the prototype's 48-listing
// js/mock-data/cars.js (git 56ea1af) and use the prototype's own photo sets c3–c13,
// one set per listing; eight are new models with three photos of one car each,
// c22–c29 — free Unsplash photos (Unsplash License), credits in PHOTO_CREDITS below. Together with
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
    photos: ['img/cars/c22-1.webp', 'img/cars/c22-2.webp', 'img/cars/c22-3.webp'],
  },
  {
    make: 'Subaru', model: 'WRX', year: 2019, bodyType: 'sedan', price: 32500, mileage: 27800,
    engine: '2.5L Turbo Boxer 4', transmission: 'Manual', color: 'Blue', fuel: 'Gasoline',
    description: 'STI with the big wing and the six-speed manual, Brembo brakes. Garage kept, never tracked.',
    seller: { name: 'Hannah B.', phone: '(206) 555-0492' },
    photos: ['img/cars/c23-1.webp', 'img/cars/c23-2.webp', 'img/cars/c23-3.webp'],
  },
  {
    make: 'Toyota', model: 'Tacoma', year: 2019, bodyType: 'truck', price: 34800, mileage: 38700,
    engine: '3.5L V6', transmission: 'Automatic', color: 'Gray', fuel: 'Gasoline',
    description: 'TRD Off-Road double cab, crawl control, tow package. Clean title.',
    seller: { name: 'Caleb J.', phone: '(206) 555-0503' },
    photos: ['img/cars/c24-1.webp', 'img/cars/c24-2.webp', 'img/cars/c24-3.webp'],
  },
  {
    make: 'BMW', model: '3 Series', year: 2018, bodyType: 'sedan', price: 24900, mileage: 41600,
    engine: '2.0L Turbo I4', transmission: 'Automatic', color: 'Gray', fuel: 'Gasoline',
    description: '330i M Sport with navigation and heated seats. Dealer serviced, no accidents.',
    seller: { name: 'Alex M.', phone: '(206) 555-0514' },
    photos: ['img/cars/c25-1.webp', 'img/cars/c25-2.webp', 'img/cars/c25-3.webp'],
  },
  {
    make: 'Toyota', model: '4Runner', year: 2020, bodyType: 'suv', price: 38400, mileage: 32900,
    engine: '4.0L V6', transmission: 'Automatic', color: 'White', fuel: 'Gasoline',
    description: 'TRD Off-Road 4x4 with crawl control and a roof rack. Seattle winters were no problem.',
    seller: { name: 'Mei L.', phone: '(206) 555-0525' },
    photos: ['img/cars/c26-1.webp', 'img/cars/c26-2.webp', 'img/cars/c26-3.webp'],
  },
  {
    make: 'Ford', model: 'Bronco', year: 2022, bodyType: 'suv', price: 44900, mileage: 14200,
    engine: '2.7L EcoBoost V6', transmission: 'Automatic', color: 'Blue', fuel: 'Gasoline',
    description: 'Badlands four-door with the Sasquatch package, removable roof and doors. One owner.',
    seller: { name: 'Ryan K.', phone: '(206) 555-0536' },
    photos: ['img/cars/c27-1.webp', 'img/cars/c27-2.webp', 'img/cars/c27-3.webp'],
  },
  {
    make: 'Hyundai', model: 'Tucson', year: 2022, bodyType: 'suv', price: 26300, mileage: 18700,
    engine: '2.5L I4', transmission: 'Automatic', color: 'Gray', fuel: 'Gasoline',
    description: 'SEL in the new design, wireless CarPlay and Highway Driving Assist. Balance of the factory warranty.',
    seller: { name: 'Sofia G.', phone: '(206) 555-0547' },
    photos: ['img/cars/c28-1.webp', 'img/cars/c28-2.webp', 'img/cars/c28-3.webp'],
  },
  {
    make: 'Honda', model: 'Civic', year: 2020, bodyType: 'hatchback', price: 22600, mileage: 24100,
    engine: '1.5L Turbo I4', transmission: 'CVT Automatic', color: 'Red', fuel: 'Gasoline',
    description: 'Sport hatchback, Honda Sensing, center-exit exhaust. One owner, no accidents.',
    seller: { name: 'Daniel P.', phone: '(206) 555-0558' },
    photos: ['img/cars/c29-1.webp', 'img/cars/c29-2.webp', 'img/cars/c29-3.webp'],
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
  // One photo each (first version of the new models, same day); replaced by models
  // with three photos of one car. Kept titles (Model 3, Tacoma, 3 Series, Civic) are
  // updated in place instead.
  '2018 Subaru Forester',
  '2023 Toyota Prius',
  '2019 Jeep Grand Cherokee',
  '2020 Hyundai Tucson',
]

/** c22–c29 are Unsplash photos (Unsplash License: free to use, credit appreciated),
 *  three shots of one car each. */
export const PHOTO_CREDITS: Record<string, string> = {
  c22: "I'M ZION",
  c23: 'Andrew Akabane',
  c24: 'Blake Carpenter',
  c25: 'Александр Бендус',
  c26: 'Zoshua Colah',
  c27: 'Luke Scarpino',
  c28: 'Rohan Krishnan',
  c29: 'C Joyful',
}
