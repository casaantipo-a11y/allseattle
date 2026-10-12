// More demo cars (client, 12.10.2026: "at least 20 listings"). Taken from the
// prototype's 48-listing version of js/mock-data/cars.js (git 56ea1af), so every
// photo set matches its model; together with the six in cars.js that makes 21.
// Seeded like the rest (isDemo, idempotent by title).

export const EXTRA_CARS = [
  {
    make: "Toyota",
    model: "Camry",
    year: 2020,
    bodyType: "sedan",
    price: 21900,
    mileage: 38000,
    engine: "2.5L I4",
    transmission: "Automatic",
    color: "Silver",
    fuel: "Gasoline",
    description: "One-owner, clean Carfax, well maintained with full dealer service history. Great commuter car with excellent fuel economy.",
    seller: {
      name: "Mike R.",
      phone: "(206) 555-0201"
    },
    photos: [
      "img/cars/c1-1.webp",
      "img/cars/c1-2.webp",
      "img/cars/c1-3.webp"
    ]
  },
  {
    make: "Mazda",
    model: "3",
    year: 2020,
    bodyType: "sedan",
    price: 17800,
    mileage: 29500,
    engine: "2.0L I4",
    transmission: "Automatic",
    color: "Blue",
    fuel: "Gasoline",
    description: "Low mileage, garage kept, no accidents. Great handling and fuel economy for city driving.",
    seller: {
      name: "Alex T.",
      phone: "(206) 555-0227"
    },
    photos: [
      "img/cars/c3-1.webp",
      "img/cars/c3-2.webp",
      "img/cars/c3-3.webp"
    ]
  },
  {
    make: "Ford",
    model: "Explorer",
    year: 2018,
    bodyType: "suv",
    price: 21200,
    mileage: 58000,
    engine: "3.5L V6",
    transmission: "Automatic",
    color: "Gray",
    fuel: "Gasoline",
    description: "3-row seating, tow package, recently serviced brakes and battery.",
    seller: {
      name: "Chris L.",
      phone: "(206) 555-0259"
    },
    photos: [
      "img/cars/c6-1.webp",
      "img/cars/c6-2.webp",
      "img/cars/c6-3.webp"
    ]
  },
  {
    make: "Jeep",
    model: "Wrangler",
    year: 2020,
    bodyType: "suv",
    price: 29800,
    mileage: 27500,
    engine: "3.6L V6",
    transmission: "Automatic",
    color: "Red",
    fuel: "Gasoline",
    description: "Removable hardtop, off-road package, well cared for. Fun weekend and daily driver.",
    seller: {
      name: "Kevin B.",
      phone: "(206) 555-0262"
    },
    photos: [
      "img/cars/c7-1.webp",
      "img/cars/c7-2.webp",
      "img/cars/c7-3.webp"
    ]
  },
  {
    make: "Chevrolet",
    model: "Silverado 1500",
    year: 2020,
    bodyType: "truck",
    price: 33500,
    mileage: 34500,
    engine: "5.3L V8",
    transmission: "Automatic",
    color: "Black",
    fuel: "Gasoline",
    description: "Crew cab, LT trim, low mileage for the year, no accidents on record.",
    seller: {
      name: "Robert G.",
      phone: "(206) 555-0288"
    },
    photos: [
      "img/cars/c9-1.webp",
      "img/cars/c9-2.webp",
      "img/cars/c9-3.webp"
    ]
  },
  {
    make: "Honda",
    model: "Fit",
    year: 2017,
    bodyType: "hatchback",
    price: 13900,
    mileage: 62000,
    engine: "1.5L I4",
    transmission: "CVT Automatic",
    color: "White",
    fuel: "Gasoline",
    description: "Reliable, economical, and easy to park in the city. New tires this year.",
    seller: {
      name: "Emily S.",
      phone: "(206) 555-0291"
    },
    photos: [
      "img/cars/c10-1.webp",
      "img/cars/c10-2.webp",
      "img/cars/c10-3.webp"
    ]
  },
  {
    make: "Volkswagen",
    model: "Golf",
    year: 2018,
    bodyType: "hatchback",
    price: 15600,
    mileage: 51000,
    engine: "1.4L Turbo I4",
    transmission: "Automatic",
    color: "Gray",
    fuel: "Gasoline",
    description: "Fun to drive, well maintained, recent timing belt service completed.",
    seller: {
      name: "Nate H.",
      phone: "(206) 555-0304"
    },
    photos: [
      "img/cars/c11-1.webp",
      "img/cars/c11-2.webp",
      "img/cars/c11-3.webp"
    ]
  },
  {
    make: "Chevrolet",
    model: "Camaro",
    year: 2019,
    bodyType: "coupe",
    price: 26800,
    mileage: 26000,
    engine: "3.6L V6",
    transmission: "Automatic",
    color: "Yellow",
    fuel: "Gasoline",
    description: "1LT trim, well cared for, non-smoker. Great condition inside and out.",
    seller: {
      name: "Marcus D.",
      phone: "(206) 555-0329"
    },
    photos: [
      "img/cars/c13-1.webp",
      "img/cars/c13-2.webp",
      "img/cars/c13-3.webp"
    ]
  },
  {
    make: "Subaru",
    model: "Outback",
    year: 2022,
    bodyType: "suv",
    price: 31200,
    mileage: 18900,
    engine: "2.5L Boxer 4",
    transmission: "CVT Automatic",
    color: "Blue",
    fuel: "Gasoline",
    description: "Onyx Edition, heated seats front and rear, one owner since new.",
    seller: {
      name: "Priya S.",
      phone: "(206) 555-0445"
    },
    photos: [
      "img/cars/c4-1.webp",
      "img/cars/c4-2.webp",
      "img/cars/c4-3.webp"
    ]
  },
  {
    make: "Toyota",
    model: "RAV4",
    year: 2021,
    bodyType: "suv",
    price: 29400,
    mileage: 26700,
    engine: "2.5L I4 Hybrid",
    transmission: "CVT Automatic",
    color: "Black",
    fuel: "Hybrid",
    description: "Hybrid XSE, 40 mpg combined, single owner and dealer maintained.",
    seller: {
      name: "Felix R.",
      phone: "(206) 555-0474"
    },
    photos: [
      "img/cars/c5-1.webp",
      "img/cars/c5-2.webp",
      "img/cars/c5-3.webp"
    ]
  },
  {
    make: "Ford",
    model: "Explorer",
    year: 2021,
    bodyType: "suv",
    price: 32400,
    mileage: 29500,
    engine: "3.5L V6",
    transmission: "Automatic",
    color: "Black",
    fuel: "Gasoline",
    description: "XLT with the 202A package, second-row captains chairs and a factory tow hitch.",
    seller: {
      name: "Bruce V.",
      phone: "(206) 555-0490"
    },
    photos: [
      "img/cars/c6-1.webp",
      "img/cars/c6-2.webp",
      "img/cars/c6-3.webp"
    ]
  },
  {
    make: "Jeep",
    model: "Wrangler",
    year: 2022,
    bodyType: "suv",
    price: 37500,
    mileage: 12800,
    engine: "3.6L V6",
    transmission: "Automatic",
    color: "Gray",
    fuel: "Gasoline",
    description: "Rubicon, barely driven, every factory option the dealer offered.",
    seller: {
      name: "Nadia F.",
      phone: "(206) 555-0531"
    },
    photos: [
      "img/cars/c7-1.webp",
      "img/cars/c7-2.webp",
      "img/cars/c7-3.webp"
    ]
  },
  {
    make: "Chevrolet",
    model: "Silverado 1500",
    year: 2022,
    bodyType: "truck",
    price: 42900,
    mileage: 15200,
    engine: "5.3L V8",
    transmission: "Automatic",
    color: "White",
    fuel: "Gasoline",
    description: "LTZ crew cab with leather and adaptive cruise. One owner, no accidents.",
    seller: {
      name: "Beatrice U.",
      phone: "(206) 555-0586"
    },
    photos: [
      "img/cars/c9-1.webp",
      "img/cars/c9-2.webp",
      "img/cars/c9-3.webp"
    ]
  },
  {
    make: "Volkswagen",
    model: "Golf",
    year: 2019,
    bodyType: "hatchback",
    price: 17900,
    mileage: 38200,
    engine: "1.4L Turbo I4",
    transmission: "Automatic",
    color: "Black",
    fuel: "Gasoline",
    description: "SE with sunroof and adaptive cruise control, one owner from new.",
    seller: {
      name: "Peter N.",
      phone: "(206) 555-0630"
    },
    photos: [
      "img/cars/c11-1.webp",
      "img/cars/c11-2.webp",
      "img/cars/c11-3.webp"
    ]
  },
  {
    make: "Ford",
    model: "Mustang",
    year: 2022,
    bodyType: "coupe",
    price: 41800,
    mileage: 9400,
    engine: "5.0L V8",
    transmission: "Manual",
    color: "Black",
    fuel: "Gasoline",
    description: "GT Premium, six-speed manual, adult owned and never tracked.",
    seller: {
      name: "Simone V.",
      phone: "(206) 555-0669"
    },
    photos: [
      "img/cars/c12-1.webp",
      "img/cars/c12-2.webp",
      "img/cars/c12-3.webp"
    ]
  }
] as const
