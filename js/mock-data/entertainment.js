// Площадки раздела Entertainment: куда пойти, в отличие от Events —
// что происходит в конкретную дату. Фото делятся с пулами img/business/
// и img/hero/.

export const VENUES = [
  { id: "v1", name: "Emerald Cinema", kind: "Cinema", neighborhood: "Capitol Hill", price: "$$", hours: "Daily 12:00–23:00", photo: "img/business/biz-8.webp", description: "Four screens, a restored 1930s auditorium and a late-night repertory programme on weekends." },
  { id: "v2", name: "Harbor Playhouse", kind: "Theater", neighborhood: "Belltown", price: "$$$", hours: "Wed–Sun, curtain 19:30", photo: "img/business/biz-2.webp", description: "A 280-seat house running six productions a season, half of them by Pacific Northwest writers." },
  { id: "v3", name: "Museum of Puget Sound", kind: "Museum", neighborhood: "Downtown", price: "$$", hours: "Tue–Sun 10:00–17:00", photo: "img/hero/downtown.webp", description: "Maritime history, a working boat shop and a gallery on the city's fishing fleet." },
  { id: "v4", name: "The Royal Room", kind: "Live Music", neighborhood: "Columbia City", price: "$$", hours: "Nightly from 18:00", photo: "img/business/biz-12.webp", description: "Jazz, soul and improvised nights seven days a week, with a full kitchen until eleven." },
  { id: "v5", name: "Rain City Comedy Club", kind: "Comedy", neighborhood: "Pioneer Square", price: "$$", hours: "Thu–Sat, two shows", photo: "img/business/biz-5.webp", description: "Touring headliners on weekends and an open mic on Thursdays with a two-drink minimum." },
  { id: "v6", name: "Needle Point Lounge", kind: "Nightlife", neighborhood: "Belltown", price: "$$$", hours: "Wed–Sat 20:00–02:00", photo: "img/business/biz-4.webp", description: "Cocktail bar with a small dance floor and a rotating roster of local DJs." },
  { id: "v7", name: "Ballard Arthouse", kind: "Cinema", neighborhood: "Ballard", price: "$$", hours: "Daily 14:00–22:30", photo: "img/business/biz-7.webp", description: "Two screens showing subtitled releases and a Sunday matinee series for families." },
  { id: "v8", name: "Gallery North", kind: "Museum", neighborhood: "Fremont", price: "$", hours: "Wed–Sun 11:00–18:00", photo: "img/business/biz-10.webp", description: "Contemporary work by artists living in the city, with a new show every six weeks." },
  { id: "v9", name: "Sound Stage Ballroom", kind: "Live Music", neighborhood: "SoDo", price: "$$$", hours: "Show nights only", photo: "img/hero/waterfront.webp", description: "A 1,400-capacity room that takes the touring acts too big for the clubs and too small for the arena." },
  { id: "v10", name: "Lakeside Bowling", kind: "Nightlife", neighborhood: "Green Lake", price: "$$", hours: "Daily 11:00–24:00", photo: "img/business/biz-6.webp", description: "Sixteen lanes, a decent burger and league nights Monday through Wednesday." },
  { id: "v11", name: "Pike Street Improv", kind: "Comedy", neighborhood: "Capitol Hill", price: "$", hours: "Fri–Sat 20:00", photo: "img/business/biz-3.webp", description: "Long-form improv from resident teams, plus drop-in workshops on Saturday afternoons." },
  { id: "v12", name: "Rainier Heritage House", kind: "Museum", neighborhood: "Columbia City", price: "$", hours: "Thu–Sun 10:00–16:00", photo: "img/hero/mount-rainier.webp", description: "A restored 1904 home telling the story of the valley's first neighbourhoods." },
];

export const VENUE_KINDS = [...new Set(VENUES.map((v) => v.kind))].sort();
