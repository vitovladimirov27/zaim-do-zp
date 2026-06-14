import { MfoBrand } from "./types";

export function formatRub(amount: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getRepaymentDetails(
  amount: number,
  days: number,
  dailyRate: number,
  isPromoZero: boolean
) {
  const overpayment = isPromoZero ? 0 : amount * (dailyRate / 100) * days;
  const total = amount + overpayment;
  const psk = isPromoZero ? 0 : dailyRate * 365; // Approx annual rate (Полная стоимость кредита)
  
  return {
    overpayment: Math.round(overpayment),
    total: Math.round(total),
    psk: parseFloat(psk.toFixed(1)),
  };
}

export function getRepaymentDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  
  const months = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ];
  
  const formattedDay = date.getDate();
  const formattedMonth = months[date.getMonth()];
  const formattedYear = date.getFullYear();
  
  return `${formattedDay} ${formattedMonth} ${formattedYear}`;
}

export function getDeclension(value: number, words: [string, string, string]): string {
  const cases = [2, 0, 1, 1, 1, 2];
  return words[
    value % 100 > 4 && value % 100 < 20
      ? 2
      : cases[value % 10 < 5 ? value % 10 : 5]
  ];
}
