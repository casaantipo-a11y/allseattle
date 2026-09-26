import { BUSINESSES } from "./businesses.js";
import { CAR_LISTINGS } from "./cars.js";
import { NEWS_ARTICLES } from "./news.js";

/**
 * Числа для витринных виджетов: «AllSeattle at a Glance» на главной и
 * «Statistics» в справочнике показывают одно и то же. Раньше список жил
 * внутри home.js, и вторая копия разошлась бы с первой при первой же правке —
 * ровно так когда-то разъехались погода в шапке и погода в разделе.
 *
 * Множители — витрина, а не арифметика по данным: в демо 15 компаний, а
 * клиенту показываем портал, который выглядит наполненным. Меняется здесь
 * и сразу в обоих местах.
 */
export function siteStats() {
  return [
    ["Listed businesses", `${BUSINESSES.length * 41}+`],
    ["Active car listings", `${CAR_LISTINGS.length * 27}+`],
    ["Articles this month", `${NEWS_ARTICLES.length * 6}+`],
    ["Monthly visitors", "48.2k"],
  ];
}
