// Районы для раздела City Map. lat/lng — настоящие координаты центра района
// (точка на карте OpenStreetMap), по ним и ставятся метки. Счётчики не
// хранятся, а считаются по events / jobs / real-estate, у которых поле
// neighborhood уже есть.

export const NEIGHBORHOODS = [
  { id: "n-ballard", name: "Ballard", lat: 47.6687, lng: -122.3847, photo: "img/news/news-1.webp", known: "Breweries and the Sunday market", blurb: "A former fishing town that kept its main street. Ballard Avenue is the densest run of bars and bakeries in the city." },
  { id: "n-green-lake", name: "Green Lake", lat: 47.6798, lng: -122.3285, photo: "img/news/news-5.webp", known: "The loop around the water", blurb: "Built around a park that never empties: a 2.8-mile path, a rowing club and playing fields on the north side." },
  { id: "n-fremont", name: "Fremont", lat: 47.651, lng: -122.35, photo: "img/news/news-3.webp", known: "Oktoberfest and the troll", blurb: "Self-declared centre of the universe. Studios and small software offices sit between the canal and the hill." },
  { id: "n-wallingford", name: "Wallingford", lat: 47.6615, lng: -122.3348, photo: "img/news/news-2.webp", known: "Family houses and ramen", blurb: "Quiet residential streets either side of N 45th, which carries most of the restaurants." },
  { id: "n-queen-anne", name: "Queen Anne", lat: 47.637, lng: -122.3571, photo: "img/hero/space-needle.webp", known: "The view from Kerry Park", blurb: "A steep hill with the postcard view at the top and the Seattle Center at the bottom." },
  { id: "n-capitol-hill", name: "Capitol Hill", lat: 47.6253, lng: -122.3222, photo: "img/news/news-9.webp", known: "Nightlife and the art walk", blurb: "The densest neighbourhood in the city: bars, galleries and the light rail station under Broadway." },
  { id: "n-downtown", name: "Downtown", lat: 47.609, lng: -122.338, photo: "img/hero/downtown.webp", known: "Pike Place and the waterfront", blurb: "Offices, the market, and the new pedestrian route down to the rebuilt waterfront park." },
  { id: "n-pioneer-square", name: "Pioneer Square", lat: 47.6015, lng: -122.3343, photo: "img/news/news-11.webp", known: "Brick buildings and galleries", blurb: "The oldest part of the city. Restored 1890s warehouses now full of studios, cafes and small offices." },
  { id: "n-georgetown", name: "Georgetown", lat: 47.547, lng: -122.32, photo: "img/news/news-12.webp", known: "Art Attack and workshops", blurb: "Industrial blocks turned over to makers. Airport Way South opens its studios on the first Saturday." },
  { id: "n-columbia-city", name: "Columbia City", lat: 47.5594, lng: -122.2866, photo: "img/news/news-10.webp", known: "Live music and the farmers market", blurb: "A landmarked main street on the light rail line, with the Rainier valley spread out behind it." },
];

