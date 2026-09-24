// Акции раздела Shopping. Каждая ссылается на компанию из справочника через
// businessId — фото, имя и телефон берутся оттуда, а не дублируются здесь.
// Это заодно показывает, что разделы портала связаны между собой.

import { BUSINESSES } from "./businesses.js";

export const SHOPPING_DEALS = [
  { id: "d1", businessId: "b1", title: "Second bag of beans half price", discount: "50% off", category: "Food & Drink", validUntil: "Oct 15", terms: "Whole bean only, one per customer per visit." },
  { id: "d2", businessId: "b5", title: "Autumn outerwear clearance", discount: "30% off", category: "Clothing", validUntil: "Oct 31", terms: "Marked items only, no rain checks." },
  { id: "d3", businessId: "b7", title: "Free pastry with any loaf before 9 a.m.", discount: "Free item", category: "Food & Drink", validUntil: "Nov 1", terms: "Weekdays only, while supplies last." },
  { id: "d4", businessId: "b8", title: "Buy two used books, get one free", discount: "3 for 2", category: "Books & Media", validUntil: "Oct 20", terms: "Lowest-priced title is the free one." },
  { id: "d5", businessId: "b6", title: "First month of membership free", discount: "1 month free", category: "Health & Fitness", validUntil: "Oct 10", terms: "New members on a twelve-month plan." },
  { id: "d6", businessId: "b4", title: "Cut and beard trim bundle", discount: "$15 off", category: "Beauty", validUntil: "Oct 25", terms: "Booked appointments only, mention the offer." },
  { id: "d7", businessId: "b10", title: "Seasonal bouquet of the week", discount: "25% off", category: "Home & Garden", validUntil: "Oct 12", terms: "In-store pickup, no delivery." },
  { id: "d8", businessId: "b15", title: "Kids scoop free with any adult sundae", discount: "Free item", category: "Food & Drink", validUntil: "Oct 5", terms: "One per family, dine-in only." },
  { id: "d9", businessId: "b14", title: "Power tool rental weekend rate", discount: "20% off", category: "Home & Garden", validUntil: "Nov 15", terms: "Friday to Monday returns, deposit required." },
  { id: "d10", businessId: "b13", title: "Ten-class pass at the drop-in rate", discount: "$40 off", category: "Health & Fitness", validUntil: "Oct 30", terms: "New students only, passes expire after ninety days." },
  { id: "d11", businessId: "b11", title: "Nail trim free with a full groom", discount: "Free add-on", category: "Pet Services", validUntil: "Oct 18", terms: "Dogs under 40 lb, booked in advance." },
  { id: "d12", businessId: "b12", title: "Flight of four for the price of three", discount: "4 for 3", category: "Food & Drink", validUntil: "Oct 22", terms: "Taproom only, house pours." },
];

export const DEAL_CATEGORIES = [...new Set(SHOPPING_DEALS.map((d) => d.category))].sort();

// Склеивает акцию с её компанией. Возвращает null, если id в справочнике нет —
// лучше пропустить карточку, чем отрисовать её с пустым фото.
export function dealWithBusiness(deal) {
  const biz = BUSINESSES.find((b) => b.id === deal.businessId);
  return biz ? { ...deal, business: biz } : null;
}

export function allDealsWithBusiness() {
  return SHOPPING_DEALS.map(dealWithBusiness).filter(Boolean);
}
