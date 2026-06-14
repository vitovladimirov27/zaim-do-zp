import React from "react";
import { formatRub, getRepaymentDate } from "../utils";
import { Coins, Calendar, ShieldCheck } from "lucide-react";

interface LoanCalculatorProps {
  amount: number;
  setAmount: (val: number) => void;
  term: number;
  setTerm: (val: number) => void;
  calculatedOverpayment: number;
  calculatedTotal: number;
  estimatedPsk: number;
}

export default function LoanCalculator({
  amount,
  setAmount,
  term,
  setTerm,
  calculatedOverpayment,
  calculatedTotal,
  estimatedPsk
}: LoanCalculatorProps) {
  
  const QUICK_AMOUNTS = [5000, 10000, 15000, 30000, 50000];
  const QUICK_TERMS = [7, 14, 21, 30, 90, 180];

  return (
    <div className="bg-white rounded-none border border-black p-6 md:p-8 mb-8" id="loan-calculator-section">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left column: Sliders */}
        <div className="lg:col-span-7 space-y-8 flex flex-col justify-center">
          
          <div>
            <div className="flex justify-between items-end mb-3">
              <label className="text-[11px] uppercase font-bold tracking-widest text-[#1A1A1A] flex items-center gap-2 select-none">
                <Coins className="w-4 h-4 text-black shrink-0" />
                Сумма займа
              </label>
              <div className="text-2xl md:text-3xl font-serif font-light text-black">
                {formatRub(amount)}
              </div>
            </div>
            
            <input
              type="range"
              min="1000"
              max="100000"
              step="1000"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full h-1 bg-black appearance-none cursor-pointer accent-black"
              id="amount-slider"
            />
            
            <div className="flex border-b border-black/10 pb-2 justify-between text-[10px] text-gray-500 mt-2 font-mono uppercase tracking-widest">
              <span>1 000 ₽</span>
              <span>30 000 ₽</span>
              <span>50 000 ₽</span>
              <span>100 000 ₽</span>
            </div>
            
            {/* Quick selectors */}
            <div className="flex flex-wrap gap-1.5 mt-3 items-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mr-1">Быстрый выбор:</span>
              {QUICK_AMOUNTS.map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(val)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-none border transition-all ${
                    amount === val
                      ? "bg-black text-white border-black"
                      : "bg-transparent text-gray-700 border-gray-300 hover:border-black hover:bg-gray-50"
                  }`}
                  id={`quick-amount-${val}`}
                >
                  {formatRub(val)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-end mb-3">
              <label className="text-[11px] uppercase font-bold tracking-widest text-[#1A1A1A] flex items-center gap-2 select-none">
                <Calendar className="w-4 h-4 text-black shrink-0" />
                Срок возврата
              </label>
              <div className="text-2xl md:text-3xl font-serif font-light text-black">
                {term} {term === 1 ? "день" : term < 5 ? "дня" : "дней"}
              </div>
            </div>
            
            <input
              type="range"
              min="1"
              max="365"
              step="1"
              value={term}
              onChange={(e) => setTerm(Number(e.target.value))}
              className="w-full h-1 bg-black appearance-none cursor-pointer accent-black"
              id="term-slider"
            />
            
            <div className="flex border-b border-black/10 pb-2 justify-between text-[10px] text-gray-500 mt-2 font-mono uppercase tracking-widest">
              <span>1 день</span>
              <span>30 дней</span>
              <span>180 дней</span>
              <span>365 дней</span>
            </div>
            
            {/* Quick selectors */}
            <div className="flex flex-wrap gap-1.5 mt-3 items-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mr-1">Быстрый выбор:</span>
              {QUICK_TERMS.map((val) => (
                <button
                  key={val}
                  onClick={() => setTerm(val)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-none border transition-all ${
                    term === val
                      ? "bg-black text-white border-black"
                      : "bg-transparent text-gray-700 border-gray-300 hover:border-black hover:bg-gray-50"
                  }`}
                  id={`quick-term-${val}`}
                >
                  {val >= 30 ? `${Math.round(val/30)} мес.` : `${val} дн.`}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right column: Overpayment Breakdown and Summary Callout */}
        <div className="lg:col-span-5 bg-[#F4F4F2] text-black border border-black p-6 md:p-8 rounded-none relative flex flex-col justify-between">
          <div>
            <h3 className="text-[11px] font-bold text-black uppercase tracking-widest mb-6 border-b border-black/10 pb-2">
              Результаты расчета
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs uppercase tracking-wider font-bold">
                <span className="text-gray-600 border-b border-dashed border-black/30 cursor-help" title="Беспроцентный займ дает нулевую переплату">Переплата:</span>
                <span className={`font-serif text-lg font-bold ${calculatedOverpayment === 0 ? "text-emerald-700" : "text-black"}`}>
                  {calculatedOverpayment === 0 ? "0 ₽ (Акция 0%)" : `+${formatRub(calculatedOverpayment)}`}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-xs uppercase tracking-wider font-bold">
                <span className="text-gray-600">Стоимость (ПСК):</span>
                <span className="font-serif text-lg font-semibold text-black">
                  {estimatedPsk === 0 ? "0%" : `до ${estimatedPsk}% год.`}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs uppercase tracking-wider font-bold">
                <span className="text-gray-600">Дата возврата:</span>
                <span className="font-serif text-lg text-black">
                  {getRepaymentDate(term)}
                </span>
              </div>
              
              <div className="border-t border-black/20 my-4 pt-4">
                <div className="text-[11px] uppercase font-bold text-gray-500 mb-1 tracking-widest">Всего к возврату:</div>
                <div className="text-3xl md:text-4xl font-extrabold text-black font-serif italic tracking-tight">
                  {formatRub(calculatedTotal)}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex items-start gap-2 bg-white p-3 border border-black/10 rounded-none">
            <ShieldCheck className="w-4 h-4 text-black shrink-0 mt-0.5" />
            <div className="text-[10px] text-gray-600 leading-tight uppercase tracking-tighter">
              Регулируется ФЗ №353 «О потребительском кредите». Безопасное мгновенное зачисление.
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
