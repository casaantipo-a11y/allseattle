// Районы для раздела City Map. x/y — проценты внутри схемы 0-100, не
// географические координаты: карта на странице нарисована от руки и подписана
// как схема. Счётчики не хранятся, а считаются по events / jobs / real-estate,
// у которых поле neighborhood уже есть.

export const NEIGHBORHOODS = [
  { id: "n-ballard", name: "Ballard", x: 30, y: 28, photo: "img/news/news-1.webp", known: "Breweries and the Sunday market", blurb: "A former fishing town that kept its main street. Ballard Avenue is the densest run of bars and bakeries in the city." },
  { id: "n-green-lake", name: "Green Lake", x: 52, y: 16, photo: "img/news/news-5.webp", known: "The loop around the water", blurb: "Built around a park that never empties: a 2.8-mile path, a rowing club and playing fields on the north side." },
  { id: "n-fremont", name: "Fremont", x: 40, y: 36, photo: "img/news/news-3.webp", known: "Oktoberfest and the troll", blurb: "Self-declared centre of the universe. Studios and small software offices sit between the canal and the hill." },
  { id: "n-wallingford", name: "Wallingford", x: 56, y: 32, photo: "img/news/news-2.webp", known: "Family houses and ramen", blurb: "Quiet residential streets either side of N 45th, which carries most of the restaurants." },
  { id: "n-queen-anne", name: "Queen Anne", x: 36, y: 47, photo: "img/hero/space-needle.webp", known: "The view from Kerry Park", blurb: "A steep hill with the postcard view at the top and the Seattle Center at the bottom." },
  { id: "n-capitol-hill", name: "Capitol Hill", x: 56, y: 50, photo: "img/news/news-9.webp", known: "Nightlife and the art walk", blurb: "The densest neighbourhood in the city: bars, galleries and the light rail station under Broadway." },
  { id: "n-downtown", name: "Downtown", x: 40, y: 58, photo: "img/hero/downtown.webp", known: "Pike Place and the waterfront", blurb: "Offices, the market, and the new pedestrian route down to the rebuilt waterfront park." },
  { id: "n-pioneer-square", name: "Pioneer Square", x: 43, y: 67, photo: "img/news/news-11.webp", known: "Brick buildings and galleries", blurb: "The oldest part of the city. Restored 1890s warehouses now full of studios, cafes and small offices." },
  { id: "n-georgetown", name: "Georgetown", x: 46, y: 81, photo: "img/news/news-12.webp", known: "Art Attack and workshops", blurb: "Industrial blocks turned over to makers. Airport Way South opens its studios on the first Saturday." },
  { id: "n-columbia-city", name: "Columbia City", x: 59, y: 72, photo: "img/news/news-10.webp", known: "Live music and the farmers market", blurb: "A landmarked main street on the light rail line, with the Rainier valley spread out behind it." },
];

// Схема города. Вся картинка — вода, поверх неё лежит суша: так залив слева
// и озеро справа получаются сами, без отдельных фигур. Координаты те же
// 0-100, что и у точек районов, поэтому точки не могут оказаться в воде.
export const MAP_SHAPES = {
  land: "M24 3 L60 5 L66 16 L63 27 L68 38 L64 50 L70 60 L66 74 L58 88 L48 97 L38 90 L33 76 L36 64 L30 54 L34 43 L27 33 L31 20 Z",
  canal: "M27 35 L66 37",
  labels: [
    { text: "Puget Sound", x: 11, y: 52 },
    { text: "Lake Washington", x: 84, y: 60 },
  ],
};
