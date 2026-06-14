import React, { useState } from "react";
import { MfoBrand } from "../types";
import { formatRub } from "../utils";
import { Star, CheckCircle, ShieldCheck, CreditCard, ChevronDown, ChevronUp, Clock, UserCheck } from "lucide-react";

interface MfoCardProps {
  key?: any;
  brand: MfoBrand;
  amountQuery: number;
  termQuery: number;
  subId: string;
}

export default function MfoCard({ brand, amountQuery, termQuery, subId }: MfoCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Quick calculators inside the card
  const isPromoActive = brand.isFirstPromoZero && amountQuery <= 30000 && termQuery <= 21;
  const cardRate = isPromoActive ? 0 : brand.dailyRate;
  
  const interestForCard = isPromoActive ? 0 : Math.round(amountQuery * (brand.dailyRate / 100) * termQuery);
  const totalForCard = amountQuery + interestForCard;

  const trackingLink = `/api/redirect?brandId=${brand.id}&subId=${subId || "showcase_main"}`;

  return (
    <div 
      className={`bg-white rounded-none border transition-all duration-300 overflow-hidden ${
        isPromoActive 
          ? "border-2 border-black" 
          : "border border-black hover:bg-[#FDFDFB]"
      }`} 
      id={`mfo-card-${brand.id}`}
    >
      {/* Promo banner for 0% loans */}
      {isPromoActive && (
        <div className="bg-black text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center justify-between border-b border-black">
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            Вы попадаете под акцию: первый займ бесплатно!
          </span>
          <span className="bg-neutral-800 px-2 py-0.5 rounded-none text-[9px] font-mono">0% ПЕРЕПЛАТЫ</span>
        </div>
      )}

      <div className="p-5 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6 justify-between animate-fade-in">
          
          {/* Logo, Rating, License */}
          <div className="flex items-center gap-4 lg:w-1/4 select-none">
            <div className={`w-14 h-14 rounded-none border border-black bg-gradient-to-tr ${brand.logoColor} flex items-center justify-center text-white font-serif italic font-black text-2xl shadow-sm shrink-0`}>
              {brand.logoText}
            </div>
            <div>
              <h3 className="text-2xl font-serif italic font-black uppercase tracking-tighter text-[#1A1A1A] flex items-center gap-2 leading-none">
                {brand.name}
                {brand.rating >= 4.8 && (
                  <span className="bg-black text-white text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 border border-black">
                    ТОП
                  </span>
                )}
              </h3>
              
              <div className="flex items-center gap-1 mt-1.5">
                <span className="text-xs text-[#E5B800] leading-none">★★★★★</span>
                <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">
                  {brand.rating}/5.0
                </span>
              </div>
              
              <span className="block text-[9px] text-gray-400 font-mono mt-1 leading-none uppercase tracking-wider">
                Лицензия ЦБ {brand.cbLicense}
              </span>
            </div>
          </div>

          {/* Stats matrix */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:w-3/5 border-t border-b md:border-t-0 md:border-b-0 border-black/10 py-4 md:py-0">
            <div>
              <span className="block text-[9px] text-gray-400 uppercase font-bold tracking-wider">Макс. Сумма</span>
              <span className="block font-serif text-lg text-black mt-1">
                {formatRub(brand.maxAmount)}
              </span>
              <span className="block text-[9px] text-gray-400 mt-0.5 font-mono">от {formatRub(brand.minAmount)}</span>
            </div>
            
            <div>
              <span className="block text-[9px] text-gray-400 uppercase font-bold tracking-wider">Ставка в день</span>
              <span className="block font-serif text-lg text-black mt-1">
                {cardRate === 0 ? (
                  <span className="text-emerald-700 font-bold italic">0% (Дар)</span>
                ) : (
                  `до ${cardRate}%`
                )}
              </span>
              <span className="block text-[9px] text-gray-400 mt-0.5 font-mono uppercase tracking-wider">
                ПСК {brand.isFirstPromoZero && cardRate === 0 ? "от 0%" : `до ${brand.psk !== undefined && brand.psk !== null ? brand.psk : Math.round(brand.dailyRate * 365)}%`}
              </span>
            </div>

            <div>
              <span className="block text-[9px] text-gray-400 uppercase font-bold tracking-wider">Срок возврата</span>
              <span className="block font-serif text-lg text-black mt-1">
                {brand.maxTerm >= 90 ? `${Math.round(brand.maxTerm / 30)} месяцев` : `до ${brand.maxTerm} дней`}
              </span>
              <span className="block text-[9px] text-gray-400 mt-0.5 font-mono">от {brand.minTerm} дней</span>
            </div>

            <div>
              <span className="block text-[9px] text-gray-400 uppercase font-bold tracking-wider">Вероятность</span>
              <span className="block font-serif text-lg text-emerald-700 mt-1">
                {brand.approvalRate}%
              </span>
              <span className="block text-[9px] text-gray-400 mt-0.5 font-mono uppercase tracking-widest">одобрение</span>
            </div>
          </div>

          {/* Call to action & Redirection Button */}
          <div className="flex flex-col gap-2 lg:w-1/5 justify-center">
            <a 
              href={trackingLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full py-2.5 px-4 rounded-none font-bold text-center text-[10px] uppercase tracking-[0.2em] transition-all duration-200 flex items-center justify-center gap-1.5 ${
                isPromoActive
                  ? "bg-black text-white hover:bg-emerald-800"
                  : "bg-black text-white hover:bg-blue-800"
              }`}
              id={`apply-button-${brand.id}`}
            >
              Получить деньги
            </a>
            <span className="text-[8px] text-center text-gray-400 uppercase tracking-widest leading-none mt-1">
              БЕЗ СКРЫТЫХ ПЛАТЕЖЕЙ
            </span>
          </div>

        </div>

        {/* Mini Badges */}
        <div className="flex flex-wrap items-center mt-5 gap-2 border-t border-black/10 pt-3">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#1A1A1A] bg-[#F4F4F2] border border-black/10 rounded-none px-2.5 py-1 flex items-center gap-1 mr-1">
            <Clock className="w-3 h-3 text-black shrink-0" />
            Решение за 2 минуты
          </span>
          {brand.features.map((feat, i) => (
            <span 
              key={i} 
              className="text-[9px] font-bold uppercase tracking-widest text-neutral-600 bg-neutral-100/50 px-2.5 py-1 border border-transparent rounded-none"
            >
              {feat}
            </span>
          ))}
          
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-auto text-[10px] font-bold uppercase tracking-widest text-neutral-600 hover:text-black hover:underline transition-colors flex items-center gap-1 py-1.5 px-3 rounded-none border border-black/10"
            id={`toggle-details-${brand.id}`}
          >
            {expanded ? "Свернуть" : "Подробнее"}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Expandable Details Tray */}
        {expanded && (
          <div className="mt-5 border-t border-black pt-5 space-y-4 text-xs text-[#1A1A1A] bg-[#F4F4F2]/50 p-4 rounded-none">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Requirements */}
              <div className="space-y-2 bg-white p-3 border border-black/10 rounded-none">
                <h4 className="font-bold text-black flex items-center gap-1.5 uppercase tracking-widest text-[9px]">
                  <UserCheck className="w-3.5 h-3.5 text-black" />
                  Требования
                </h4>
                <ul className="space-y-1 ml-1 text-gray-600 leading-relaxed text-[11px]">
                  <li>• Возраст: <strong className="text-black font-semibold">{brand.ageMin} — {brand.ageMax} лет</strong></li>
                  <li>• Гражданство: <strong className="text-black font-semibold">Российская Федерация</strong></li>
                  <li>• Документы: <span className="font-bold text-black">{brand.documents.join(", ")}</span></li>
                  <li>• Смартфон с SIM картой РФ</li>
                </ul>
              </div>

              {/* Payment methods */}
              <div className="space-y-2 bg-white p-3 border border-black/10 rounded-none">
                <h4 className="font-bold text-black flex items-center gap-1.5 uppercase tracking-widest text-[9px]">
                  <CreditCard className="w-3.5 h-3.5 text-black" />
                  Выплата
                </h4>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {brand.payoutMethods.map((pm, i) => (
                    <span 
                      key={i} 
                      className="bg-[#F4F4F2] border border-black/20 px-2 py-0.5 font-bold uppercase tracking-wider text-[#1A1A1A] text-[9px]"
                    >
                      {pm}
                    </span>
                  ))}
                </div>
              </div>

              {/* Central bank license info */}
              <div className="space-y-2 bg-white p-3 border border-black/10 rounded-none">
                <h4 className="font-bold text-black flex items-center gap-1.5 uppercase tracking-widest text-[9px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-black" />
                  Юридические реквизиты
                </h4>
                <div className="space-y-1 text-gray-500 text-[10px] uppercase tracking-wider">
                  <p>Государственный реестр МФО:</p>
                  <p className="font-mono text-black font-bold bg-[#F4F4F2] px-2 py-0.5 border border-black/20 inline-block mt-0.5">
                    {brand.cbLicense}
                  </p>
                  <p className="mt-1">Дата: {brand.cbDate}</p>
                </div>
              </div>

            </div>

            <div className="border-t border-black/10 pt-3 text-[11px] leading-relaxed">
              <h4 className="font-bold uppercase tracking-widest text-[9px] text-[#1A1A1A] mb-1">О компании и условиях:</h4>
              <p className="text-neutral-600 font-sans">{brand.seoDescription}</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 bg-white p-3 rounded-none border border-black gap-4 text-center font-mono text-[10px] uppercase tracking-widest">
              <div>
                <span className="text-gray-400 block text-[8px] font-bold">Сумма займа</span>
                <span className="text-black font-extrabold">{formatRub(amountQuery)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[8px] font-bold">Срок</span>
                <span className="text-black font-extrabold">{termQuery} дн.</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[8px] font-bold">Переплата</span>
                <span className="text-emerald-700 font-extrabold">{formatRub(interestForCard)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[8px] font-bold">Итого к возврату</span>
                <span className="text-black font-black">{formatRub(totalForCard)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
