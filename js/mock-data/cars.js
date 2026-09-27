// Наборов фотографий 13 — по одному на модель. Любое объявление ссылается на
// набор своей модели, поэтому на фото всегда та машина, что в заголовке.
// Новых фотографий взять негде: демо должно работать без сети, а внешние
// картинки в проект не тянем (CLAUDE.md, «Images»). Поэтому каталог живёт
// внутри этих моделей, а не сорока марками из макета — это был выбор клиента,
// когда встал вопрос «фото или длинный список марок».
//
// Объявлений 12, по одному на модель: было 48, клиент сократил вдвое, потом до
// двенадцати. Набор c13 (Chevrolet Camaro) теперь не используется ни одним
// объявлением — модель выпала, чтобы у остальных не пустел блок «Similar Cars».
function photosFor(id) {
  return [
    `../img/cars/${id}-1.webp`,
    `../img/cars/${id}-2.webp`,
    `../img/cars/${id}-3.webp`,
  ];
}

export const CAR_LISTINGS = [
  {
    id: "c16",
    make: "Toyota", model: "Camry", year: 2021, bodyType: "sedan",
    price: 24300, mileage: 33400, engine: "2.5L I4 Hybrid", transmission: "CVT Automatic",
    color: "Blue", fuel: "Hybrid",
    postedAt: "2026-09-26T09:00:00-07:00", ref: "A-4100",
    description: "Hybrid LE, averages 48 mpg on the daily commute to Bellevue.",
    seller: { name: "Grace W.", phone: "(206) 555-0368" },
    photos: photosFor("c1"),
  },
  {
    id: "c2",
    make: "Honda", model: "Accord", year: 2019, bodyType: "sedan",
    price: 20400, mileage: 45200, engine: "1.5L Turbo I4", transmission: "CVT Automatic",
    color: "Black", fuel: "Gasoline",
    postedAt: "2026-09-26T11:00:00-07:00", ref: "A-4137",
    description: "Sport trim, sunroof, heated seats. Recently passed a full inspection, tires replaced last month.",
    seller: { name: "Denise K.", phone: "(206) 555-0214" },
    photos: photosFor("c2"),
  },
  {
    id: "c22",
    make: "Mazda", model: "3", year: 2019, bodyType: "sedan",
    price: 16900, mileage: 44800, engine: "2.0L I4", transmission: "Manual",
    color: "White", fuel: "Gasoline",
    postedAt: "2026-09-25T13:00:00-07:00", ref: "A-4174",
    description: "Six-speed manual, hard to find in this trim. Garage kept its whole life.",
    seller: { name: "Ruth E.", phone: "(206) 555-0429" },
    photos: photosFor("c3"),
  },
  {
    id: "c4",
    make: "Subaru", model: "Outback", year: 2021, bodyType: "suv",
    price: 27500, mileage: 31000, engine: "2.5L Boxer 4", transmission: "CVT Automatic",
    color: "Green", fuel: "Gasoline",
    postedAt: "2026-09-25T15:00:00-07:00", ref: "A-4211",
    description: "All-wheel drive, roof rack, great for the Cascades. Non-smoker, no pets.",
    seller: { name: "Sarah M.", phone: "(206) 555-0233" },
    photos: photosFor("c4"),
  },
  {
    id: "c5",
    make: "Toyota", model: "RAV4", year: 2022, bodyType: "suv",
    price: 27900, mileage: 22000, engine: "2.5L I4", transmission: "Automatic",
    color: "White", fuel: "Gasoline",
    postedAt: "2026-09-24T08:00:00-07:00", ref: "A-4248",
    description: "Still under factory warranty, one owner, Seattle-area car its whole life.",
    seller: { name: "James P.", phone: "(206) 555-0246" },
    photos: photosFor("c5"),
  },
  {
    id: "c6",
    make: "Ford", model: "Explorer", year: 2018, bodyType: "suv",
    price: 21200, mileage: 58000, engine: "3.5L V6", transmission: "Automatic",
    color: "Gray", fuel: "Gasoline",
    postedAt: "2026-09-24T10:00:00-07:00", ref: "A-4285",
    description: "3-row seating, tow package, recently serviced brakes and battery.",
    seller: { name: "Chris L.", phone: "(206) 555-0259" },
    photos: photosFor("c6"),
  },
  {
    id: "c7",
    make: "Jeep", model: "Wrangler", year: 2020, bodyType: "suv",
    price: 29800, mileage: 27500, engine: "3.6L V6", transmission: "Automatic",
    color: "Red", fuel: "Gasoline",
    postedAt: "2026-09-23T12:00:00-07:00", ref: "A-4322",
    description: "Removable hardtop, off-road package, well cared for. Fun weekend and daily driver.",
    seller: { name: "Kevin B.", phone: "(206) 555-0262" },
    photos: photosFor("c7"),
  },
  {
    id: "c36",
    make: "Ford", model: "F-150", year: 2020, bodyType: "truck",
    price: 35700, mileage: 41300, engine: "3.0L Power Stroke V6", transmission: "Automatic",
    color: "Black", fuel: "Diesel",
    postedAt: "2026-09-23T14:00:00-07:00", ref: "A-4359",
    description: "Power Stroke diesel, 30 mpg on the highway, full tow package.",
    seller: { name: "Rosa I.", phone: "(206) 555-0560" },
    photos: photosFor("c8"),
  },
  {
    id: "c9",
    make: "Chevrolet", model: "Silverado 1500", year: 2020, bodyType: "truck",
    price: 33500, mileage: 34500, engine: "5.3L V8", transmission: "Automatic",
    color: "Black", fuel: "Gasoline",
    postedAt: "2026-09-22T16:00:00-07:00", ref: "A-4396",
    description: "Crew cab, LT trim, low mileage for the year, no accidents on record.",
    seller: { name: "Robert G.", phone: "(206) 555-0288" },
    photos: photosFor("c9"),
  },
  {
    id: "c39",
    make: "Honda", model: "Fit", year: 2015, bodyType: "hatchback",
    price: 10400, mileage: 88600, engine: "1.5L I4", transmission: "Manual",
    color: "Blue", fuel: "Gasoline",
    postedAt: "2026-09-21T09:00:00-07:00", ref: "A-4433",
    description: "Five-speed manual, cheap to run and insure, a perfect first car.",
    seller: { name: "Oscar Z.", phone: "(206) 555-0599" },
    photos: photosFor("c10"),
  },
  {
    id: "c11",
    make: "Volkswagen", model: "Golf", year: 2018, bodyType: "hatchback",
    price: 15600, mileage: 51000, engine: "1.4L Turbo I4", transmission: "Automatic",
    color: "Gray", fuel: "Gasoline",
    postedAt: "2026-09-21T11:00:00-07:00", ref: "A-4470",
    description: "Fun to drive, well maintained, recent timing belt service completed.",
    seller: { name: "Nate H.", phone: "(206) 555-0304" },
    photos: photosFor("c11"),
  },
  {
    id: "c12",
    make: "Ford", model: "Mustang", year: 2021, bodyType: "coupe",
    price: 32900, mileage: 18500, engine: "5.0L V8", transmission: "Manual",
    color: "Red", fuel: "Gasoline",
    postedAt: "2026-09-20T13:00:00-07:00", ref: "A-4507",
    description: "GT trim, manual transmission, garage kept. Clean title, no track use.",
    seller: { name: "Tyler F.", phone: "(206) 555-0317" },
    photos: photosFor("c12"),
  },
];
