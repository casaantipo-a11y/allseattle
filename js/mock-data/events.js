// События для раздела Events. Фотографии берутся из общего пула img/news/ —
// новых снимков взять негде, а демо обязано работать офлайн.

export const EVENTS = [
  {
    id: "ev1",
    title: "Fremont Oktoberfest",
    category: "Food",
    venue: "N 34th Street",
    neighborhood: "Fremont",
    startsAt: "2026-09-26T16:00:00",
    price: "$35",
    photo: "img/news/news-3.jpg",
    description: "Twenty local breweries, a redesigned beer garden under the Aurora Bridge and a second entrance to cut the lines.",
  },
  {
    id: "ev2",
    title: "Ballard Night Market",
    category: "Food",
    venue: "Ballard Avenue NW",
    neighborhood: "Ballard",
    startsAt: "2026-09-25T17:00:00",
    price: "Free",
    photo: "img/news/news-1.jpg",
    description: "Forty stalls along the historic block, live music at both ends and the bakeries staying open late.",
  },
  {
    id: "ev3",
    title: "Sounders vs. Portland",
    category: "Sports",
    venue: "Lumen Field",
    neighborhood: "SoDo",
    startsAt: "2026-09-27T19:30:00",
    price: "$45",
    photo: "img/news/news-7.jpg",
    description: "The Cascadia derby. Gates open two hours early and Occidental Avenue closes to traffic at 4 p.m.",
  },
  {
    id: "ev4",
    title: "Chamber Music at Benaroya",
    category: "Music",
    venue: "Benaroya Hall",
    neighborhood: "Downtown",
    startsAt: "2026-09-28T14:00:00",
    price: "$28",
    photo: "img/news/news-5.jpg",
    description: "An afternoon programme of Brahms and Shostakovich, performed by members of the Seattle Symphony.",
  },
  {
    id: "ev5",
    title: "Capitol Hill Art Walk",
    category: "Art",
    venue: "Pike/Pine corridor",
    neighborhood: "Capitol Hill",
    startsAt: "2026-09-25T18:00:00",
    price: "Free",
    photo: "img/news/news-9.jpg",
    description: "Thirty galleries, studios and shops open their doors on the second Thursday of every month.",
  },
  {
    id: "ev6",
    title: "Waterfront Family Day",
    category: "Family",
    venue: "Overlook Walk",
    neighborhood: "Downtown",
    startsAt: "2026-09-27T10:00:00",
    price: "Free",
    photo: "img/news/news-11.jpg",
    description: "Face painting, a small amphitheatre programme and free entry to the play area on the new pedestrian bridge.",
  },
  {
    id: "ev7",
    title: "Georgetown Art Attack",
    category: "Art",
    venue: "Airport Way South",
    neighborhood: "Georgetown",
    startsAt: "2026-10-03T18:00:00",
    price: "Free",
    photo: "img/news/news-12.jpg",
    description: "More than a dozen studios open for the free self-guided walk, with most staying open until 9 p.m.",
  },
  {
    id: "ev8",
    title: "Green Lake 10K",
    category: "Sports",
    venue: "Green Lake Park",
    neighborhood: "Green Lake",
    startsAt: "2026-10-04T08:30:00",
    price: "$40",
    photo: "img/news/news-2.jpg",
    description: "Two laps of the lake, chip timing, and a pancake breakfast at the finish run by the rowing club.",
  },
  {
    id: "ev9",
    title: "Live Jazz at the Royal Room",
    category: "Music",
    venue: "The Royal Room",
    neighborhood: "Columbia City",
    startsAt: "2026-09-26T21:00:00",
    price: "$20",
    photo: "img/news/news-6.jpg",
    description: "A rotating house quartet plus a guest soloist, two sets, doors at half past eight.",
  },
  {
    id: "ev10",
    title: "Neighborhood Safety Meeting",
    category: "Community",
    venue: "Hing Hay Park",
    neighborhood: "Chinatown-International District",
    startsAt: "2026-09-29T18:30:00",
    price: "Free",
    photo: "img/news/news-10.jpg",
    description: "SPD precinct staff answer questions from residents and business owners. Interpretation provided.",
  },
  {
    id: "ev11",
    title: "Pike Place Harvest Market",
    category: "Food",
    venue: "Pike Place Market",
    neighborhood: "Downtown",
    startsAt: "2026-10-05T09:00:00",
    price: "Free",
    photo: "img/news/news-8.jpg",
    description: "Late-season tomatoes, squash and cider from thirty regional growers, plus cooking demonstrations.",
  },
  {
    id: "ev12",
    title: "Storytime at the Library",
    category: "Family",
    venue: "Ballard Branch Library",
    neighborhood: "Ballard",
    startsAt: "2026-09-30T10:30:00",
    price: "Free",
    photo: "img/news/news-4.jpg",
    description: "Picture books and songs for under-fives, every Wednesday morning in the community room.",
  },
];

export const EVENT_CATEGORIES = [...new Set(EVENTS.map((e) => e.category))].sort();

// Ближайшие события по дате — используется и разделом Entertainment.
export function upcomingEvents(count = 3) {
  return [...EVENTS].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)).slice(0, count);
}

export function eventDateParts(iso) {
  const d = new Date(iso);
  return {
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day: String(d.getDate()),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    weekday: d.toLocaleDateString("en-US", { weekday: "long" }),
  };
}
