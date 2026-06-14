import React, { useState } from "react";
import { SeoCategory, MfoBrand } from "../types";
import { formatRub } from "../utils";
import { HelpCircle, ChevronDown, ChevronUp, Table as TableIcon, FileText } from "lucide-react";

interface SeoTextProps {
  category: SeoCategory;
  mfoBrands: MfoBrand[];
}

export default function SeoText({ category, mfoBrands }: SeoTextProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="mt-12 space-y-8" id="seo-text-container">
      {/* 1. Dynamic SEO Text Segment */}
      <div className="bg-white rounded-none border border-black p-6 md:p-8 animate-fade-in">
        <h2 className="text-3xl font-serif italic font-light text-black tracking-tight mb-6 flex items-center gap-2">
          <FileText className="w-5 h-5 text-black shrink-0" />
          {category.h1}
        </h2>
        
        {/* Render HTML content safely inside a beautifully formatted typography block */}
        <div 
          className="prose prose-slate max-w-none text-neutral-700 text-sm leading-relaxed space-y-4 font-sans"
          dangerouslySetInnerHTML={{ __html: category.seoText }}
        />
      </div>

      {/* 2. Structured comparison grid for Google indexing spiders (SEO Table) */}
      <div className="bg-white rounded-none border border-black p-6 md:p-8 animate-fade-in">
        <div className="flex items-center gap-2 mb-6 border-b border-black pb-3">
          <TableIcon className="w-5 h-5 text-black" />
          <h3 className="text-lg font-serif italic font-bold text-black tracking-tight">
            Сравнительная таблица предложений {category.tag} (2026)
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-black text-black font-bold uppercase tracking-widest text-[9px]">
                <th className="py-3 px-4">Организация (МФО)</th>
                <th className="py-3 px-4">Сумма займа</th>
                <th className="py-3 px-4">Срок займа</th>
                <th className="py-3 px-4">Ставка (в день)</th>
                <th className="py-3 px-4">Одобрение</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 font-medium text-neutral-800">
              {mfoBrands.map((mfo) => (
                <tr key={mfo.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-black">{mfo.name}</td>
                  <td className="py-3.5 px-4 font-mono">{formatRub(mfo.minAmount)} — {formatRub(mfo.maxAmount)}</td>
                  <td className="py-3.5 px-4 font-mono">{mfo.minTerm} — {mfo.maxTerm} дн.</td>
                  <td className="py-3.5 px-4 text-emerald-800 font-semibold">{mfo.isFirstPromoZero ? "0% (новым) / " : ""}{mfo.dailyRate}%</td>
                  <td className="py-3.5 px-4 font-bold text-black font-mono">{mfo.approvalRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <p className="text-[9px] text-gray-400 mt-4 leading-relaxed font-mono uppercase tracking-widest">
          * Расчеты носят информационный характер. МФО самостоятельно определяют условия кредитного договора в соответствии с ФЗ №353. Данные сверены на 2026 год.
        </p>
      </div>

      {/* 3. FAQ Schema Block */}
      <div className="bg-white rounded-none border border-black p-6 md:p-8 animate-fade-in" id="faq-accordions-schema">
        <div className="flex items-center gap-2 mb-6 border-b border-black pb-3">
          <HelpCircle className="w-5 h-5 text-black" />
          <h3 className="text-lg font-serif italic font-bold text-black tracking-tight">
            Часто задаваемые вопросы по категории: {category.tag}
          </h3>
        </div>

        <div className="space-y-3">
          {category.faqs.map((faq, index) => (
            <div 
              key={index}
              className="border border-black rounded-none overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex items-center justify-between p-4 bg-[#F4F4F2]/50 font-bold text-[#1A1A1A] text-left text-xs uppercase tracking-wider hover:bg-[#F4F4F2] transition-colors"
                id={`faq-btn-${index}`}
              >
                <span>{faq.q}</span>
                {openFaq === index ? (
                  <ChevronUp className="w-4 h-4 text-black shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-black shrink-0" />
                )}
              </button>
              
              {openFaq === index && (
                <div className="p-4 bg-white text-xs text-neutral-700 border-t border-black leading-relaxed font-sans font-medium">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
