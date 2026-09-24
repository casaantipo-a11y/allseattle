// Единственный источник погодных чисел на сайте. Раньше «61°F / Cloudy»
// был вшит прямо в partials.js; теперь и виджет в шапке, и раздел weather.html
// читают отсюда, иначе они разойдутся и это будет видно на одном экране.

export const WEATHER_NOW = {
  city: "Seattle, WA",
  temp: 61,
  condition: "Cloudy",
  note: "Cloudy, no precipitation",
  icon: "cloud",
  feelsLike: 59,
  humidity: "78%",
  wind: "8 mph W",
  pressure: "30.1 in",
  visibility: "9 mi",
  uv: "2 of 11 · Low",
  sunrise: "6:52 a.m.",
  sunset: "7:02 p.m.",
};

export const WEATHER_HOURLY = [
  { hour: "9 AM", temp: 58, icon: "cloud", pop: 10 },
  { hour: "10 AM", temp: 59, icon: "cloud", pop: 10 },
  { hour: "11 AM", temp: 61, icon: "cloud-sun", pop: 10 },
  { hour: "12 PM", temp: 62, icon: "cloud-sun", pop: 0 },
  { hour: "1 PM", temp: 63, icon: "cloud-sun", pop: 0 },
  { hour: "2 PM", temp: 63, icon: "cloud", pop: 10 },
  { hour: "3 PM", temp: 62, icon: "cloud", pop: 20 },
  { hour: "4 PM", temp: 61, icon: "rain", pop: 40 },
  { hour: "5 PM", temp: 59, icon: "rain", pop: 50 },
  { hour: "6 PM", temp: 57, icon: "rain", pop: 45 },
  { hour: "7 PM", temp: 56, icon: "cloud", pop: 25 },
  { hour: "8 PM", temp: 54, icon: "cloud", pop: 20 },
];

export const WEATHER_WEEK = [
  { day: "Today", date: "Sep 24", hi: 63, lo: 52, icon: "cloud", condition: "Cloudy", pop: 20 },
  { day: "Thu", date: "Sep 25", hi: 61, lo: 51, icon: "rain", condition: "Light rain", pop: 70 },
  { day: "Fri", date: "Sep 26", hi: 58, lo: 50, icon: "rain", condition: "Rain", pop: 85 },
  { day: "Sat", date: "Sep 27", hi: 60, lo: 49, icon: "cloud-sun", condition: "Partly sunny", pop: 30 },
  { day: "Sun", date: "Sep 28", hi: 65, lo: 51, icon: "sun", condition: "Sunny", pop: 5 },
  { day: "Mon", date: "Sep 29", hi: 66, lo: 53, icon: "sun", condition: "Sunny", pop: 5 },
  { day: "Tue", date: "Sep 30", hi: 62, lo: 52, icon: "cloud-sun", condition: "Partly sunny", pop: 20 },
];

export const WEATHER_REGION = [
  { city: "Bellevue", temp: 62, condition: "Cloudy", icon: "cloud" },
  { city: "Tacoma", temp: 63, condition: "Partly sunny", icon: "cloud-sun" },
  { city: "Everett", temp: 59, condition: "Light rain", icon: "rain" },
  { city: "Olympia", temp: 64, condition: "Cloudy", icon: "cloud" },
  { city: "Bremerton", temp: 60, condition: "Cloudy", icon: "cloud" },
  { city: "Snoqualmie Pass", temp: 44, condition: "Rain and snow", icon: "snow" },
];

// Заголовок-строка для шапки: дата живая, всё остальное из WEATHER_NOW.
export function weatherHeaderLine() {
  const d = new Date();
  return {
    city: WEATHER_NOW.city,
    date: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    temp: `${WEATHER_NOW.temp}°F`,
    note: WEATHER_NOW.note,
  };
}
