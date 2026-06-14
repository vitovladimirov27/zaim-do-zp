import React, { useState, useEffect } from "react";
import { MfoBrand, SeoCategory } from "../types";
import { seoCategories } from "../data/seoData";
import { 
  Building2, 
  Check, 
  AlertCircle, 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Link2,
  FileText,
  ShieldCheck,
  Percent,
  Copy,
  RotateCcw,
  CheckCircle2,
  Globe,
  HelpCircle,
  Code2,
  Server
} from "lucide-react";

interface WebmasterDashboardProps {
  mfoBrands: MfoBrand[];
  onUpdateMfo: (updatedMfo: MfoBrand) => Promise<void>;
  onAddMfo?: (newMfo: MfoBrand) => Promise<void>;
  onDeleteMfo?: (id: string) => Promise<void>;
  seoOverrides?: Record<string, SeoCategory>;
  onUpdateSeoOverrides?: (overrides: Record<string, SeoCategory>) => void;
  customScripts?: { head: string; body: string };
  onUpdateCustomScripts?: (scripts: { head: string; body: string }) => void;
}

export default function WebmasterDashboard({ 
  mfoBrands, 
  onUpdateMfo, 
  onAddMfo, 
  onDeleteMfo,
  seoOverrides = {},
  onUpdateSeoOverrides,
  customScripts = { head: "", body: "" },
  onUpdateCustomScripts
}: WebmasterDashboardProps) {
  // Brand selection / Accordion state
  const [activeBrandId, setActiveBrandId] = useState<string | null>(mfoBrands[0]?.id || null);
  
  // Local form state for draft edits
  const [draftBrands, setDraftBrands] = useState<Record<string, MfoBrand>>({});
  const [savingBrandIds, setSavingBrandIds] = useState<Record<string, boolean>>({});
  const [successBrandIds, setSuccessBrandIds] = useState<Record<string, boolean>>({});
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});

  const [activeTab, setActiveTab] = useState<"mfo" | "seo" | "scripts" | "publishing">("mfo");

  // Custom Scripts local state
  const [localScriptHead, setLocalScriptHead] = useState(customScripts.head || "");
  const [localScriptBody, setLocalScriptBody] = useState(customScripts.body || "");
  const [isSavingScripts, setIsSavingScripts] = useState(false);
  const [scriptsSavedSuccess, setScriptsSavedSuccess] = useState(false);

  // Synchronize dynamic script codes when props update
  useEffect(() => {
    setLocalScriptHead(customScripts.head || "");
    setLocalScriptBody(customScripts.body || "");
  }, [customScripts]);

  const handleSaveScripts = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateCustomScripts) return;
    setIsSavingScripts(true);
    setScriptsSavedSuccess(false);

    setTimeout(() => {
      onUpdateCustomScripts({
        head: localScriptHead,
        body: localScriptBody
      });
      setIsSavingScripts(false);
      setScriptsSavedSuccess(true);
      setTimeout(() => setScriptsSavedSuccess(false), 3000);
    }, 800);
  };

  // SEO Text Generator state
  const [seoKeyword, setSeoKeyword] = useState("");
  const [selectedSeoCategory, setSelectedSeoCategory] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generatedSeo, setGeneratedSeo] = useState<SeoCategory | null>(null);
  const [seoLoadError, setSeoLoadError] = useState("");
  const [copySuccessField, setCopySuccessField] = useState<string | null>(null);
  const [isOverrideSaved, setIsOverrideSaved] = useState(false);

  // Helper: Copy elements
  const handleCopyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccessField(fieldKey);
    setTimeout(() => {
      setCopySuccessField(null);
    }, 2000);
  };

  // Helper: Call AI API Endpoint
  const handleGenerateSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seoKeyword.trim()) {
      setSeoLoadError("Введите ключевое слово для запуска генератора.");
      return;
    }

    setIsGenerating(true);
    setSeoLoadError("");
    setGeneratedSeo(null);
    setIsOverrideSaved(false);
    setGenerationStep(0);

    // Dynamic sequence for generation messages
    const stepInterval = setInterval(() => {
      setGenerationStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 2200);

    try {
      const res = await fetch("/api/generate-seo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyword: seoKeyword.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Ошибка со стороны сервера при вызове ИИ.");
      }

      const data = await res.json();
      if (data.success) {
        setGeneratedSeo({
          id: selectedSeoCategory,
          tag: seoCategories.find((c) => c.id === selectedSeoCategory)?.tag || "SEO займы",
          title: data.title || "",
          metaDescription: data.metaDescription || "",
          h1: data.h1 || "",
          keywords: data.keywords || seoKeyword.trim().toLowerCase(),
          seoText: data.seoText || "",
          faqs: data.faqs || []
        });
      } else {
        throw new Error("Не удалось получить сгенерированные SEO-данные.");
      }
    } catch (err: any) {
      setSeoLoadError(err.message || "Ошибка подключения при вызове ИИ генерации.");
    } finally {
      clearInterval(stepInterval);
      setIsGenerating(false);
    }
  };

  // Helper: Apply override
  const handleApplyOverride = () => {
    if (!generatedSeo || !onUpdateSeoOverrides) return;
    
    const updatedOverrides = {
      ...(seoOverrides || {}),
      [selectedSeoCategory]: {
        ...generatedSeo,
        id: selectedSeoCategory,
        tag: seoCategories.find((c) => c.id === selectedSeoCategory)?.tag || "SEO займы"
      }
    };
    
    onUpdateSeoOverrides(updatedOverrides);
    setIsOverrideSaved(true);
  };

  // Helper: Reset overrides
  const handleResetOverride = () => {
    if (!onUpdateSeoOverrides) return;
    const nextOverrides = { ...seoOverrides };
    delete nextOverrides[selectedSeoCategory];
    onUpdateSeoOverrides(nextOverrides);
    setIsOverrideSaved(false);
    setGeneratedSeo(null);
    alert(`SEO настройки для категории "${seoCategories.find(c => c.id === selectedSeoCategory)?.tag}" возвращены к исходным!`);
  };

  // New MFO Form Creation state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [addingError, setAddingError] = useState("");
  const [isAddingLoading, setIsAddingLoading] = useState(false);
  
  const [newMfo, setNewMfo] = useState<MfoBrand>({
    id: "",
    name: "",
    rating: 4.8,
    maxAmount: 30000,
    minAmount: 1000,
    dailyRate: 0.8,
    minTerm: 1,
    maxTerm: 30,
    approvalRate: 98,
    ageMin: 18,
    ageMax: 78,
    documents: ["Паспорт РФ"],
    cbLicense: "№ " + Math.floor(1000000000000 + Math.random() * 9000000000000),
    cbDate: new Date().toLocaleDateString("ru-RU"),
    partnerUrl: "https://yandex.ru",
    logoColor: "from-amber-500 to-orange-600",
    logoText: "НЗ",
    isFirstPromoZero: true,
    payoutMethods: ["Карта", "СБП", "QIWI"],
    isActive: true,
    features: ["Мгновенно", "Без справок"],
    seoDescription: "Быстрый займ под выгодный процент.",
    psk: 292
  });

  const handleCreateMfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMfo.id.trim()) {
      setAddingError("ID (слаг) МФО обязателен для ввода.");
      return;
    }
    if (!/^[a-z0-9_-]+$/i.test(newMfo.id.trim())) {
      setAddingError("ID (слаг) должен состоять только из латинских букв, цифр, дефиса или подчеркивания.");
      return;
    }
    if (!newMfo.name.trim()) {
      setAddingError("Название МФО обязательно для ввода.");
      return;
    }

    setIsAddingLoading(true);
    setAddingError("");

    try {
      if (onAddMfo) {
        await onAddMfo({
          ...newMfo,
          id: newMfo.id.trim(),
          name: newMfo.name.trim()
        });
        
        setIsAddingNew(false);
        // Reset template with dynamic license
        setNewMfo({
          id: "",
          name: "",
          rating: 4.8,
          maxAmount: 30000,
          minAmount: 1000,
          dailyRate: 0.8,
          minTerm: 1,
          maxTerm: 30,
          approvalRate: 98,
          ageMin: 18,
          ageMax: 78,
          documents: ["Паспорт РФ"],
          cbLicense: "№ " + Math.floor(1000000000000 + Math.random() * 9000000000000),
          cbDate: new Date().toLocaleDateString("ru-RU"),
          partnerUrl: "https://yandex.ru",
          logoColor: "from-amber-500 to-orange-600",
          logoText: "НЗ",
          isFirstPromoZero: true,
          payoutMethods: ["Карта", "СБП", "QIWI"],
          isActive: true,
          features: ["Мгновенно", "Без справок"],
          seoDescription: "Быстрый займ под выгодный процент.",
          psk: 292
        });
      }
    } catch (err: any) {
      setAddingError(err.message || "Ошибка при добавлении МФО на витрину.");
    } finally {
      setIsAddingLoading(false);
    }
  };

  // Initialize draft if it doesn't exist
  const getDraft = (mfo: MfoBrand): MfoBrand => {
    if (draftBrands[mfo.id]) {
      return draftBrands[mfo.id];
    }
    return mfo;
  };

  const updateDraftField = (brandId: string, field: keyof MfoBrand, value: any) => {
    setDraftBrands((prev) => {
      const currentDraft = prev[brandId] || mfoBrands.find((m) => m.id === brandId)!;
      return {
        ...prev,
        [brandId]: {
          ...currentDraft,
          [field]: value,
        },
      };
    });
    // Reset success/error visual indicators on edits
    setSuccessBrandIds((prev) => ({ ...prev, [brandId]: false }));
    setErrorMessages((prev) => ({ ...prev, [brandId]: "" }));
  };

  const saveBrandEdits = async (brandId: string) => {
    const draft = draftBrands[brandId];
    if (!draft) {
      // Nothing changed
      setSuccessBrandIds((prev) => ({ ...prev, [brandId]: true }));
      return;
    }

    setSavingBrandIds((prev) => ({ ...prev, [brandId]: true }));
    setErrorMessages((prev) => ({ ...prev, [brandId]: "" }));
    setSuccessBrandIds((prev) => ({ ...prev, [brandId]: false }));

    try {
      await onUpdateMfo(draft);
      setSuccessBrandIds((prev) => ({ ...prev, [brandId]: true }));
      // Clear success indicator after 3s
      setTimeout(() => {
        setSuccessBrandIds((prev) => ({ ...prev, [brandId]: false }));
      }, 3000);
    } catch (err: any) {
      setErrorMessages((prev) => ({
        ...prev,
        [brandId]: err.message || "Ошибка соединения с сервером при сохранении изменений.",
      }));
    } finally {
      setSavingBrandIds((prev) => ({ ...prev, [brandId]: false }));
    }
  };

  return (
    <div className="space-y-6" id="webmaster-mfo-manager">
      
      {/* Visual Header Panel */}
      <div className="bg-white rounded-none border border-black p-6 select-none animate-fade-in flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif italic text-black tracking-tighter uppercase font-black flex items-center gap-2">
            <Building2 className="w-6 h-6 text-black shrink-0" />
            Панель Управления МФО
          </h2>
          <p className="text-xs uppercase tracking-widest text-[#9c9c9c] mt-2 font-sans font-bold leading-relaxed">
            Редактор условий и редиректов витрины микрозаймов
          </p>
        </div>
        {onAddMfo && (
          <button
            onClick={() => {
              setActiveTab("mfo");
              setIsAddingNew(!isAddingNew);
            }}
            className="px-5 py-3 bg-black hover:bg-neutral-850 text-white text-[10px] uppercase tracking-[0.15em] font-bold transition-all shrink-0 rounded-none cursor-pointer flex items-center justify-center gap-2"
          >
            {isAddingNew && activeTab === "mfo" ? "Закрыть форму" : "+ ДОБАВИТЬ МФО"}
          </button>
        )}
      </div>

      {/* Tabs Selector Navigation */}
      <div className="grid grid-cols-2 md:flex border border-black select-none bg-white">
        <button
          type="button"
          onClick={() => setActiveTab("mfo")}
          className={`px-2 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-50 transition-all cursor-pointer flex items-center justify-center gap-2 border-r border-b md:border-b-0 border-black flex-1 ${
            activeTab === "mfo" ? "bg-black text-white hover:bg-black" : "bg-white text-black"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          Управление МФО
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("seo")}
          className={`px-2 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-50 transition-all cursor-pointer flex items-center justify-center gap-2 border-r border-b md:border-b-0 border-black flex-1 ${
            activeTab === "seo" ? "bg-black text-white hover:bg-black" : "bg-white text-black"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
          SEO Генератор (Gemini AI)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("scripts")}
          className={`px-2 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-50 transition-all cursor-pointer flex items-center justify-center gap-2 border-r border-black flex-1 ${
            activeTab === "scripts" ? "bg-black text-white hover:bg-black" : "bg-white text-black"
          }`}
        >
          <Code2 className="w-3.5 h-3.5 text-violet-500" />
          Коды и Пиксели (GTM)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("publishing")}
          className={`px-2 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-50 transition-all cursor-pointer flex items-center justify-center gap-2 flex-1 ${
            activeTab === "publishing" ? "bg-black text-white hover:bg-black" : "bg-white text-black"
          }`}
        >
          <Server className="w-3.5 h-3.5 text-emerald-500" />
          Размещение на хостинг
        </button>
      </div>

      {activeTab === "mfo" && isAddingNew && (
        <form onSubmit={handleCreateMfoSubmit} className="bg-white border border-black p-6 space-y-6 animate-fade-in">
          <div className="flex items-center gap-2 border-b border-black pb-3 select-none">
            <span className="w-2.5 h-2.5 rounded-none bg-black"></span>
            <h3 className="text-xs font-bold uppercase tracking-widest text-black">ДОБАВЛЕНИЕ НОВОЙ КАРТОЧКИ МФО</h3>
          </div>

          {addingError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-[10px] uppercase font-bold tracking-wider">
              ⚠️ {addingError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                ID (слаг для редиректов: только латиница, цифры, дефис) *
              </label>
              <input
                type="text"
                placeholder="например: zaimer"
                value={newMfo.id}
                onChange={(e) => setNewMfo(prev => ({ ...prev, id: e.target.value.toLowerCase().replace(/\s+/g, "") }))}
                className="w-full border border-black rounded-none bg-[#FDFDFB] p-2.5 text-xs font-mono font-bold text-black focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                Название бренда МФО *
              </label>
              <input
                type="text"
                placeholder="например: Займер"
                value={newMfo.name}
                onChange={(e) => setNewMfo(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border border-black rounded-none bg-[#FDFDFB] p-2.5 text-xs font-sans font-bold text-black focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                Партнерская ссылка (Redirect URL) *
              </label>
              <input
                type="url"
                placeholder="https://affiliate-network.ru/click"
                value={newMfo.partnerUrl}
                onChange={(e) => setNewMfo(prev => ({ ...prev, partnerUrl: e.target.value }))}
                className="w-full border border-black rounded-none bg-[#FDFDFB] p-2.5 text-xs font-mono text-black focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                Микро-текст логотипа (2 символа)
              </label>
              <input
                type="text"
                maxLength={2}
                value={newMfo.logoText}
                onChange={(e) => setNewMfo(prev => ({ ...prev, logoText: e.target.value }))}
                className="w-full border border-black rounded-none bg-[#FDFDFB] p-2.5 text-xs font-mono font-bold text-black text-center focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                Градиент логотипа (Tailwind classes)
              </label>
              <select
                value={newMfo.logoColor}
                onChange={(e) => setNewMfo(prev => ({ ...prev, logoColor: e.target.value }))}
                className="w-full border border-black rounded-none bg-[#FDFDFB] p-2 text-xs font-mono text-black focus:outline-none"
              >
                <option value="from-amber-500 to-orange-600">from-amber-500 to-orange-600 (Оранжевый)</option>
                <option value="from-blue-600 to-indigo-700">from-blue-600 to-indigo-700 (Синий)</option>
                <option value="from-emerald-600 to-teal-700">from-emerald-600 to-teal-700 (Зеленый)</option>
                <option value="from-purple-600 to-fuchsia-700">from-purple-600 to-fuchsia-700 (Фиолетовый)</option>
                <option value="from-red-600 to-rose-700">from-red-600 to-rose-700 (Красный)</option>
                <option value="from-slate-700 to-neutral-900">from-slate-700 to-neutral-900 (Антрацит)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                Минимальная сумма (Руб)
              </label>
              <input
                type="number"
                value={newMfo.minAmount}
                onChange={(e) => setNewMfo(prev => ({ ...prev, minAmount: parseInt(e.target.value) || 1000 }))}
                className="w-full border border-black rounded-none bg-[#FDFDFB] p-2.5 text-xs font-mono text-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                Максимальная сумма (Руб)
              </label>
              <input
                type="number"
                value={newMfo.maxAmount}
                onChange={(e) => setNewMfo(prev => ({ ...prev, maxAmount: parseInt(e.target.value) || 30000 }))}
                className="w-full border border-black rounded-none bg-[#FDFDFB] p-2.5 text-xs font-mono text-black focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                Ежедневная ставка (%)
              </label>
              <input
                type="number"
                step={0.01}
                value={newMfo.dailyRate}
                onChange={(e) => setNewMfo(prev => ({ ...prev, dailyRate: parseFloat(e.target.value) || 0.8 }))}
                className="w-full border border-black rounded-none bg-[#FDFDFB] p-2.5 text-xs font-mono text-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                ПСК (годовой %)
              </label>
              <input
                type="number"
                value={newMfo.psk || 292}
                onChange={(e) => setNewMfo(prev => ({ ...prev, psk: parseInt(e.target.value) || 292 }))}
                className="w-full border border-black rounded-none bg-[#FDFDFB] p-2.5 text-xs font-mono text-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                Мин. срок (дней)
              </label>
              <input
                type="number"
                value={newMfo.minTerm}
                onChange={(e) => setNewMfo(prev => ({ ...prev, minTerm: parseInt(e.target.value) || 1 }))}
                className="w-full border border-black rounded-none bg-[#FDFDFB] p-2.5 text-xs font-mono text-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                Макс. срок (дней)
              </label>
              <input
                type="number"
                value={newMfo.maxTerm}
                onChange={(e) => setNewMfo(prev => ({ ...prev, maxTerm: parseInt(e.target.value) || 30 }))}
                className="w-full border border-black rounded-none bg-[#FDFDFB] p-2.5 text-xs font-mono text-black focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                Процент одобрения (%)
              </label>
              <input
                type="number"
                value={newMfo.approvalRate}
                onChange={(e) => setNewMfo(prev => ({ ...prev, approvalRate: parseInt(e.target.value) || 95 }))}
                className="w-full border border-black rounded-none bg-[#FDFDFB] p-2.5 text-xs font-mono text-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                Мин. возраст заемщика
              </label>
              <input
                type="number"
                value={newMfo.ageMin}
                onChange={(e) => setNewMfo(prev => ({ ...prev, ageMin: parseInt(e.target.value) || 18 }))}
                className="w-full border border-black rounded-none bg-[#FDFDFB] p-2.5 text-xs font-mono text-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                Макс. возраст заемщика
              </label>
              <input
                type="number"
                value={newMfo.ageMax}
                onChange={(e) => setNewMfo(prev => ({ ...prev, ageMax: parseInt(e.target.value) || 75 }))}
                className="w-full border border-black rounded-none bg-[#FDFDFB] p-2.5 text-xs font-mono text-black focus:outline-none"
              />
            </div>

            <div className="flex flex-col justify-end pb-1.5 h-full">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newMfo.isFirstPromoZero}
                  onChange={(e) => setNewMfo(prev => ({ ...prev, isFirstPromoZero: e.target.checked }))}
                  className="w-4 h-4 accent-black border border-black"
                />
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-700">Первый заем под 0%</span>
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-black/10">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="px-4 py-3 border border-black/35 hover:border-black text-[10px] uppercase tracking-widest font-bold transition-all bg-white text-black rounded-none cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isAddingLoading}
              className="px-6 py-3 bg-black hover:bg-neutral-800 disabled:bg-neutral-400 text-white text-[10px] uppercase tracking-[0.15em] font-bold transition-all rounded-none cursor-pointer flex items-center justify-center gap-2"
            >
              {isAddingLoading ? "Публикация..." : "Добавить на витрину"}
            </button>
          </div>
        </form>
      )}

      {/* Main List Grid */}
      <div className={activeTab === "mfo" ? "space-y-4 animate-fade-in" : "hidden"}>
        {mfoBrands.map((brand) => {
          const isOpen = activeBrandId === brand.id;
          const draft = getDraft(brand);
          const isSaving = savingBrandIds[brand.id] || false;
          const isSaved = successBrandIds[brand.id] || false;
          const apiError = errorMessages[brand.id] || "";

          // Simple calculations for badge previews
          const rateToDisplay = draft.isFirstPromoZero ? "0% (Акция)" : `${draft.dailyRate}%`;

          return (
            <div 
              key={brand.id} 
              className={`bg-white rounded-none border transition-all ${
                isOpen ? "border-2 border-black" : "border border-black/35 hover:border-black"
              }`}
              id={`editor-item-${brand.id}`}
            >
              
              {/* Accordion header button */}
              <button 
                onClick={() => setActiveBrandId(isOpen ? null : brand.id)}
                className="w-full flex items-center justify-between p-4 bg-[#F4F4F2]/20 hover:bg-[#F4F4F2]/50 transition-colors text-left font-sans select-none"
              >
                <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
                  <div className={`w-10 h-10 border border-black bg-gradient-to-tr ${draft.logoColor} flex items-center justify-center text-white font-serif italic font-extrabold text-sm shadow-sm shrink-0`}>
                    {draft.logoText}
                  </div>
                  
                  <div>
                    <span className="font-serif italic text-lg font-black text-black">
                      {draft.name}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider font-mono text-neutral-400 block mt-0.5 leading-none">
                      ID: #{draft.id} • ПСК: {draft.isFirstPromoZero ? "от 0% / " : ""}{draft.psk !== undefined ? `${draft.psk}%` : `${Math.round(draft.dailyRate * 365)}%`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="hidden md:flex gap-2 text-[9px] font-bold uppercase tracking-widest font-mono">
                    <span className={`px-2 py-1 border ${draft.isActive ? "border-emerald-600/30 text-emerald-800 bg-emerald-50" : "border-red-600/30 text-red-800 bg-red-50"}`}>
                      {draft.isActive ? "АКТИВЕН" : "ОТКЛЮЧЕН"}
                    </span>
                    <span className="px-2 py-1 bg-neutral-100 border border-neutral-300 text-neutral-700">
                      Ставка: {rateToDisplay}
                    </span>
                  </div>

                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-black shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-black shrink-0" />
                  )}
                </div>
              </button>

              {/* Accordion content form */}
              {isOpen && (
                <div className="border-t border-black p-5 md:p-6 space-y-6 bg-[#FCFCFA] animate-fade-in font-sans">
                  
                  {/* Conveniently grouped sub-blocks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Sub-block 1: Основные сведения */}
                    <div className="border border-black bg-white p-4 space-y-4 rounded-none">
                      <div className="flex items-center gap-2 border-b border-black pb-2">
                        <Link2 className="w-4 h-4 text-black shrink-0" />
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-black">
                          ПОДБЛОК 1: ТЕКСТ И РЕДИРЕКТЫ
                        </h4>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                            Название компании (в карточке)
                          </label>
                          <input 
                            type="text" 
                            value={draft.name}
                            onChange={(e) => updateDraftField(brand.id, "name", e.target.value)}
                            className="w-full border border-black rounded-none bg-[#FDFDFB] p-2 text-xs font-bold font-sans text-black focus:outline-none focus:ring-0 focus:border-black"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                            Текст иконки-логотипа (2 символа РФ)
                          </label>
                          <input 
                            type="text" 
                            maxLength={2}
                            value={draft.logoText}
                            onChange={(e) => updateDraftField(brand.id, "logoText", e.target.value)}
                            className="w-24 border border-black rounded-none bg-[#FDFDFB] p-2 text-xs font-bold font-mono text-black text-center focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                            Партнерская ссылка (Редирект CPA)
                          </label>
                          <input 
                            type="text" 
                            value={draft.partnerUrl}
                            onChange={(e) => updateDraftField(brand.id, "partnerUrl", e.target.value)}
                            className="w-full border border-black rounded-none bg-[#FDFDFB] p-2 text-xs font-mono text-black focus:outline-none focus:ring-0 focus:border-black"
                          />
                        </div>

                        <div className="pt-2">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input 
                              type="checkbox"
                              checked={draft.isActive}
                              onChange={(e) => updateDraftField(brand.id, "isActive", e.target.checked)}
                              className="w-4 h-4 accent-black border border-black"
                            />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-black">
                              Активно отображать МФО на витрине
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Sub-block 2: Кредитные Лимиты (Суммы и сроки) */}
                    <div className="border border-black bg-white p-4 space-y-4 rounded-none">
                      <div className="flex items-center gap-2 border-b border-black pb-2">
                        <FileText className="w-4 h-4 text-black shrink-0" />
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-black">
                          ПОДБЛОК 2: КРЕДИТНЫЕ ЛИМИТЫ
                        </h4>
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                              Сумма ОТ (руб)
                            </label>
                            <input 
                              type="number" 
                              value={draft.minAmount}
                              onChange={(e) => updateDraftField(brand.id, "minAmount", parseInt(e.target.value) || 0)}
                              className="w-full border border-black rounded-none bg-[#FDFDFB] p-2 text-xs font-mono font-bold text-black focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                              Сумма ДО (руб)
                            </label>
                            <input 
                              type="number" 
                              value={draft.maxAmount}
                              onChange={(e) => updateDraftField(brand.id, "maxAmount", parseInt(e.target.value) || 0)}
                              className="w-full border border-black rounded-none bg-[#FDFDFB] p-2 text-xs font-mono font-bold text-black focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                              Срок ОТ (дней)
                            </label>
                            <input 
                              type="number" 
                              value={draft.minTerm}
                              onChange={(e) => updateDraftField(brand.id, "minTerm", parseInt(e.target.value) || 0)}
                              className="w-full border border-black rounded-none bg-[#FDFDFB] p-2 text-xs font-mono text-black focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                              Срок ДО (дней)
                            </label>
                            <input 
                              type="number" 
                              value={draft.maxTerm}
                              onChange={(e) => updateDraftField(brand.id, "maxTerm", parseInt(e.target.value) || 0)}
                              className="w-full border border-black rounded-none bg-[#FDFDFB] p-2 text-xs font-mono text-black focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                            Вероятность одобрения (%)
                          </label>
                          <input 
                            type="number" 
                            min={1} 
                            max={100}
                            value={draft.approvalRate}
                            onChange={(e) => updateDraftField(brand.id, "approvalRate", parseInt(e.target.value) || 0)}
                            className="w-full border border-black rounded-none bg-[#FDFDFB] p-2 text-xs font-mono font-bold text-black focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sub-block 3: Ставка и ПСК */}
                    <div className="border border-black bg-white p-4 space-y-4 rounded-none">
                      <div className="flex items-center gap-2 border-b border-black pb-2">
                        <Percent className="w-4 h-4 text-black shrink-0" />
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-black">
                          ПОДБЛОК 3: ПРОЦЕНТНАЯ СТАВКА И ПСК
                        </h4>
                      </div>

                      <div className="space-y-4">
                        {/* Toggle first loan zero */}
                        <div className="bg-[#F4F4F2]/30 p-2 border border-black/10 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-black">
                            Первый заем бесплатно (под 0%)?
                          </span>
                          <button
                            type="button"
                            onClick={() => updateDraftField(brand.id, "isFirstPromoZero", !draft.isFirstPromoZero)}
                            className="focus:outline-none text-black hover:opacity-85"
                          >
                            {draft.isFirstPromoZero ? (
                              <ToggleRight className="w-10 h-7 text-black stroke-[1.5]" />
                            ) : (
                              <ToggleLeft className="w-10 h-7 text-neutral-400 stroke-[1.5]" />
                            )}
                          </button>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                            Ставка по займу в день (% по договору)
                          </label>
                          <input 
                            type="number" 
                            step={0.01} 
                            placeholder="Например, 0.8"
                            value={draft.dailyRate}
                            onChange={(e) => updateDraftField(brand.id, "dailyRate", parseFloat(e.target.value) || 0)}
                            className="w-full border border-black rounded-none bg-[#FDFDFB] p-2 text-xs font-mono font-bold text-black focus:outline-none"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                              ПСК на витрине (% годовых)
                            </label>
                            <span className="text-[9px] text-[#1A1A1A] font-mono leading-none bg-[#F4F4F2] px-1 py-0.5 border border-black/10 uppercase tracking-widest font-bold">
                              Авто-расчет: {Math.round(draft.dailyRate * 365)}%
                            </span>
                          </div>
                          <input 
                            type="number" 
                            placeholder="Вбейте одну цифру, например 292"
                            value={draft.psk !== undefined && draft.psk !== null ? draft.psk : ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateDraftField(brand.id, "psk", val === "" ? undefined : parseInt(val));
                            }}
                            className="w-full border border-black rounded-none bg-[#FDFDFB] p-2 text-xs font-mono font-bold text-black focus:outline-none placeholder-gray-400"
                          />
                          <p className="text-[8px] text-gray-400 mt-1 uppercase font-mono tracking-wider">
                            * Если вбито, на витрине выводится ПСК ДО [ЗНАЧЕНИЕ]%. Если оставить пустым, рассчитается автоматически как (Ставка * 365).
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Sub-block 4: Юридические реквизиты */}
                    <div className="border border-black bg-white p-4 space-y-4 rounded-none">
                      <div className="flex items-center gap-2 border-b border-black pb-2">
                        <ShieldCheck className="w-4 h-4 text-black shrink-0" />
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-black">
                          ПОДБЛОК 4: ЛИЦЕНЗИИ И ТРЕБОВАНИЯ
                        </h4>
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                              Номер Лицензии ЦБ РФ
                            </label>
                            <input 
                              type="text" 
                              value={draft.cbLicense}
                              onChange={(e) => updateDraftField(brand.id, "cbLicense", e.target.value)}
                              className="w-full border border-black rounded-none bg-[#FDFDFB] p-2 text-xs font-mono text-black focus:outline-none"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                              Дата регистрации ЦБ РФ
                            </label>
                            <input 
                              type="text" 
                              value={draft.cbDate}
                              onChange={(e) => updateDraftField(brand.id, "cbDate", e.target.value)}
                              className="w-full border border-black rounded-none bg-[#FDFDFB] p-2 text-xs font-mono text-black focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                              Мин. возраст
                            </label>
                            <input 
                              type="number" 
                              value={draft.ageMin}
                              onChange={(e) => updateDraftField(brand.id, "ageMin", parseInt(e.target.value) || 18)}
                              className="w-full border border-black rounded-none bg-[#FDFDFB] p-2 text-xs font-mono text-black focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                              Макс. возраст
                            </label>
                            <input 
                              type="number" 
                              value={draft.ageMax}
                              onChange={(e) => updateDraftField(brand.id, "ageMax", parseInt(e.target.value) || 80)}
                              className="w-full border border-black rounded-none bg-[#FDFDFB] p-2 text-xs font-mono text-black focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                            Рейтинг МФО (от 1.0 до 5.0)
                          </label>
                          <input 
                            type="number" 
                            step={0.1}
                            min={1} 
                            max={5}
                            value={draft.rating}
                            onChange={(e) => updateDraftField(brand.id, "rating", parseFloat(e.target.value) || 4.5)}
                            className="w-full border border-black rounded-none bg-[#FDFDFB] p-2 text-xs font-mono font-bold text-black focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Feedback Message Bar */}
                  {apiError && (
                    <div className="flex items-center gap-1.5 p-3 bg-red-50 text-red-800 text-[11px] font-bold uppercase tracking-wide border border-red-200">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {apiError}
                    </div>
                  )}

                  {isSaved && (
                    <div className="flex items-center justify-center gap-1.5 p-3 bg-emerald-50 text-emerald-800 text-[11px] font-bold uppercase tracking-wider border border-emerald-200">
                      <Check className="w-4 h-4 shrink-0" />
                      Изменения по {draft.name} успешно сохранены в базе системы!
                    </div>
                  )}

                  {/* Form Submission Actions */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-black/10">
                    <div>
                      {onDeleteMfo ? (
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm(`Вы уверены, что хотите полностью удалить МФО "${brand.name}" с витрины?`)) {
                              try {
                                await onDeleteMfo(brand.id);
                              } catch (err: any) {
                                alert(err.message || "Ошибка при удалении");
                              }
                            }
                          }}
                          className="px-4 py-2 border border-red-300 hover:border-red-650 hover:bg-rose-50 text-[10px] uppercase font-bold tracking-widest text-red-650 transition-colors cursor-pointer rounded-none bg-white"
                        >
                          Удалить МФО
                        </button>
                      ) : <div />}
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          // Reset local draft state to synchronize with raw brand values
                          setDraftBrands((prev) => {
                            const next = { ...prev };
                            delete next[brand.id];
                            return next;
                          });
                          setSuccessBrandIds((prev) => ({ ...prev, [brand.id]: false }));
                          setErrorMessages((prev) => ({ ...prev, [brand.id]: "" }));
                        }}
                        className="px-4 py-2 border border-black/25 hover:border-black text-[10px] uppercase tracking-widest font-bold transition-colors cursor-pointer rounded-none bg-white text-black"
                      >
                        Сбросить черновик
                      </button>
                      
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => saveBrandEdits(brand.id)}
                        className="px-5 py-2 bg-black hover:bg-neutral-800 disabled:bg-neutral-400 text-white text-[10px] uppercase tracking-[0.2em] font-bold transition-all flex items-center gap-1.5 cursor-pointer rounded-none"
                        id={`save-brand-btn-${brand.id}`}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Сохранение...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Сохранить условия</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* SEO Text Generator Section */}
      <div className={activeTab === "seo" ? "block space-y-6 animate-fade-in" : "hidden"}>
        {/* Main info banner */}
        <div className="bg-white border border-black p-6 space-y-4 rounded-none select-none">
          <div className="flex items-center gap-2 border-b border-black pb-3">
            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#1a1a1a]">Генератор SEO Описаний на базе искусственного интеллекта</h3>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Создайте оптимизированные мета-заголовки, описания для поисковых систем, H1 заголовки, продающие SEO-статьи на русском языке и FAQ-блоки под ваши целевые ключевые слова. Система использует языковую модель <strong className="text-black font-semibold">Gemini 3.5-flash</strong> на стороне сервера, чтобы сгенерировать чистый, экспертный и уникальный контент.
          </p>
        </div>

        {/* Configuration core form */}
        <form onSubmit={handleGenerateSeo} className="bg-white border border-black p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Поисковый запрос / Ключевое слово (Keyword)
              </label>
              <input
                type="text"
                placeholder="например: займы без отказа круглосуточно по паспорту"
                value={seoKeyword}
                onChange={(e) => setSeoKeyword(e.target.value)}
                className="w-full border border-black rounded-none bg-[#FDFDFB] p-3 text-xs font-sans font-bold text-black focus:outline-none focus:border-black"
                required
              />
              
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block w-full mb-1">
                  Идеи для запросов:
                </span>
                {[
                  "срочный займ без проверок",
                  "микрозайм под ноль процентов",
                  "займы на карту быстро круглосуточно",
                  "одобрение без отказа за 5 минут",
                  "микрозаймы с плохой кредитной историей"
                ].map((kw) => (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => setSeoKeyword(kw)}
                    className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-[9px] font-mono text-neutral-800 transition-colors rounded-none whitespace-nowrap cursor-pointer uppercase font-semibold"
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Привязать результат к целевой категории витрины
              </label>
              <select
                value={selectedSeoCategory}
                onChange={(e) => {
                  setSelectedSeoCategory(e.target.value);
                  setIsOverrideSaved(false);
                }}
                className="w-full border border-black rounded-none bg-[#FDFDFB] p-2.5 text-xs font-sans font-bold text-black focus:outline-none"
              >
                {seoCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.tag} (ID: {c.id})
                  </option>
                ))}
              </select>
              <p className="text-[9px] uppercase tracking-wider text-neutral-400 leading-tight">
                Вы можете заменить стандартный SEO-текст выбранной вкладки витрины на сгенерированный ИИ текст!
              </p>

              {seoOverrides[selectedSeoCategory] && (
                <div className="p-2 border border-amber-300 bg-amber-50 rounded-none text-[9px] uppercase font-bold tracking-wider text-amber-800 flex items-center gap-1.5 leading-none">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Для вкладки "{seoCategories.find(c => c.id === selectedSeoCategory)?.tag}" сейчас действует активный ИИ-оверрайд
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-black/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              {seoOverrides[selectedSeoCategory] && (
                <button
                  type="button"
                  onClick={handleResetOverride}
                  className="px-4 py-2 text-[10px] uppercase font-bold tracking-widest text-[#C0392B] hover:bg-rose-50 border border-red-300 transition-colors rounded-none cursor-pointer bg-white"
                >
                  Сбросить настройки страницы к дефолту
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isGenerating}
              className="px-6 py-3 bg-black hover:bg-neutral-800 disabled:bg-neutral-400 text-white text-[10px] uppercase tracking-[0.15em] font-bold transition-all rounded-none cursor-pointer flex items-center justify-center gap-2"
              id="generate-seo-submit-btn"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Создание статьи ИИ...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Сгенерировать SEO-текст</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Loading status */}
        {isGenerating && (
          <div className="bg-[#FCFCFA] border border-black p-8 text-center space-y-4 animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin text-black mx-auto" />
            <div className="space-y-1.5 select-none">
              <h4 className="text-xs font-bold uppercase tracking-widest text-black">
                {generationStep === 0 && "🔎 Шаг 1/4: Анализируем плотность ключевых выражений..."}
                {generationStep === 1 && "🧠 Шаг 2/4: Gemini 3.5-flash формирует семантическое ядро..."}
                {generationStep === 2 && "✍️ Шаг 3/4: Создание продающих текстов с HTML-разметкой..."}
                {generationStep === 3 && "📑 Шаг 4/4: Генерация структурированных Meta-тегов и Списка FAQ..."}
              </h4>
              <p className="text-[9px] uppercase tracking-wider text-neutral-400">
                Пожалуйста, не закрывайте вкладку. Это займет всего 5-8 секунд.
              </p>
            </div>
          </div>
        )}

        {/* Error reporting */}
        {seoLoadError && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-bold uppercase tracking-wider">
            ⚠️ Ошибка вызова ИИ: {seoLoadError}
          </div>
        )}

        {/* Rich SEO result representation */}
        {generatedSeo && (
          <div className="space-y-6 animate-fade-in text-sans">
            <div className="bg-emerald-50 border border-emerald-300 p-4 text-emerald-800 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between gap-4 flex-wrap">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
                SEO контент полностью подготовлен и оптимизирован!
              </span>
              
              <button
                type="button"
                onClick={handleApplyOverride}
                className="px-5 py-2.5 bg-[#1B5E20] hover:bg-[#2E7D32] text-white text-[10px] uppercase font-bold tracking-widest rounded-none transition-colors cursor-pointer"
              >
                🚀 Применить оверрайд на витрину
              </button>
            </div>

            {isOverrideSaved && (
              <div className="p-4 bg-emerald-50 border-2 border-emerald-500 text-emerald-900 text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
                <Check className="w-4 h-4 text-[#1B5E20] shrink-0" />
                SEO-оверрайд применен к категории витрины "{seoCategories.find(c => c.id === selectedSeoCategory)?.tag}"! Теперь контент на этой вкладке обновлен.
              </div>
            )}

            {/* Grid for Tags */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Meta Title */}
              <div className="bg-white border border-black p-4 space-y-2 rounded-none relative">
                <div className="flex items-center justify-between border-b border-black pb-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 font-mono">META TITLE</span>
                  <button
                    type="button"
                    onClick={() => handleCopyToClipboard(generatedSeo.title, "title")}
                    className="text-neutral-500 hover:text-black transition-colors"
                  >
                    {copySuccessField === "title" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-xs font-bold text-black select-all pt-1 leading-snug">
                  {generatedSeo.title}
                </p>
              </div>

              {/* H1 Title */}
              <div className="bg-white border border-black p-4 space-y-2 rounded-none relative">
                <div className="flex items-center justify-between border-b border-black pb-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 font-mono">H1 HEADER (НАЗВАНИЕ СТРАНИЦЫ)</span>
                  <button
                    type="button"
                    onClick={() => handleCopyToClipboard(generatedSeo.h1, "h1")}
                    className="text-neutral-500 hover:text-black transition-colors"
                  >
                    {copySuccessField === "h1" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-xs font-bold text-black select-all pt-1 leading-snug">
                  {generatedSeo.h1}
                </p>
              </div>

              {/* Meta Description */}
              <div className="bg-white border border-black p-4 space-y-2 rounded-none relative">
                <div className="flex items-center justify-between border-b border-black pb-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 font-mono">META DESCRIPTION</span>
                  <button
                    type="button"
                    onClick={() => handleCopyToClipboard(generatedSeo.metaDescription, "metaDesc")}
                    className="text-neutral-500 hover:text-black transition-colors"
                  >
                    {copySuccessField === "metaDesc" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-neutral-600 select-all pt-1 leading-relaxed">
                  {generatedSeo.metaDescription}
                </p>
              </div>
            </div>

            {/* Complete SEO Text Area block */}
            <div className="bg-white border border-black p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-black pb-3 select-none">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-black" />
                  <h4 className="text-xs font-bold uppercase tracking-widest text-black">SEO Статья (HTML код)</h4>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyToClipboard(generatedSeo.seoText, "article")}
                  className="flex items-center gap-1.5 border border-black/25 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-black hover:border-black transition-all bg-white"
                >
                  {copySuccessField === "article" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Скопировано!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      КОПИРОВАТЬ HTML
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-neutral-400 block font-mono">ИСХОДНЫЙ HTML-КОД:</span>
                  <pre className="w-full h-80 overflow-y-auto border border-black/15 p-3 bg-neutral-900 text-[#00FF55] font-mono text-[10px] leading-relaxed whitespace-pre-wrap select-all">
                    {generatedSeo.seoText}
                  </pre>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-neutral-400 block font-mono">ПРЕВЬЮ ОТОБРАЖЕНИЯ НА САЙТЕ:</span>
                  <div className="w-full h-80 overflow-y-auto border border-black/15 p-4 bg-[#FDFCFA] prose prose-slate max-w-none text-xs text-neutral-700 leading-relaxed font-sans space-y-3">
                    <h2 className="text-sm font-serif italic text-black font-black mb-3 border-b pb-1">
                      {generatedSeo.h1}
                    </h2>
                    <div dangerouslySetInnerHTML={{ __html: generatedSeo.seoText }} />
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Q&A Schema visualization block */}
            {generatedSeo.faqs && generatedSeo.faqs.length > 0 && (
              <div className="bg-white border border-black p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-black pb-3 select-none">
                  <HelpCircle className="w-4 h-4 text-black animate-bounce" />
                  <h4 className="text-xs font-bold uppercase tracking-widest text-black">Раздел FAQ (Вопросы и Ответы)</h4>
                </div>

                <div className="space-y-3">
                  {generatedSeo.faqs.map((faq, i) => (
                    <div key={i} className="border border-black p-3 space-y-1 text-xs bg-neutral-50 rounded-none">
                      <p className="font-bold text-[#1a1a1a] flex items-start gap-1">
                        <span className="text-neutral-400 select-none">В:</span>
                        {faq.q}
                      </p>
                      <p className="text-neutral-600 leading-relaxed pl-3.5 flex items-start gap-1 font-sans">
                        <span className="text-neutral-400 select-none">О:</span>
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Panel footer operations */}
            <div className="bg-white border border-black p-4 flex justify-end gap-3 rounded-none">
              <button
                type="button"
                onClick={() => setGeneratedSeo(null)}
                className="px-4 py-2 border border-black/25 hover:border-black text-[10px] uppercase tracking-widest font-bold transition-colors bg-white rounded-none cursor-pointer text-black"
              >
                Скрыть блок результатов
              </button>
              <button
                type="button"
                onClick={handleApplyOverride}
                className="px-6 py-2 bg-black hover:bg-neutral-850 text-white text-[10px] uppercase tracking-[0.2em] font-bold transition-all rounded-none cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Применить на витрине
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom Scripts & GTM Tab Section */}
      <div className={activeTab === "scripts" ? "block space-y-6 animate-fade-in" : "hidden"}>
        <div className="bg-white border border-black p-6 space-y-4 rounded-none select-none">
          <div className="flex items-center gap-2 border-b border-black pb-3">
            <Code2 className="w-5 h-5 text-violet-500" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#1a1a1a]">Интеграция Пикселей и Кастомных Кодов (GTM / Мета / Аналитика)</h3>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Вставьте теги отслеживания Google Tag Manager, счетчики Яндекс.Метрики, пиксели Facebook/VK, код чатов поддержки или любые другие кастомные JS/HTML-скрипты. Коды будут автоматически внедряться как в шапку страницы (<code className="font-mono bg-neutral-100 px-1 py-0.5">&lt;head&gt;</code>), так и в начало тела (<code className="font-mono bg-neutral-100 px-1 py-0.5">&lt;body&gt;</code>) вашей витрины.
          </p>
        </div>

        <form onSubmit={handleSaveScripts} className="bg-white border border-black p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Код для вставки в секцию &lt;head&gt; (Рекомендуется для Google Tag Manager, скриптов аналитики)
              </label>
              <textarea
                value={localScriptHead}
                onChange={(e) => setLocalScriptHead(e.target.value)}
                placeholder="<!-- Вставьте код отслеживания сюда -->&#10;<script>&#10;  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':...&#10;</script>"
                className="w-full h-44 overflow-y-auto border border-black rounded-none bg-[#111111] text-[#00FF55] p-3.5 font-mono text-[11px] leading-relaxed focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Код для вставки в секцию &lt;body&gt; (Рекомендуется для резервных iframe, noscript-пикселей и виджетов)
              </label>
              <textarea
                value={localScriptBody}
                onChange={(e) => setLocalScriptBody(e.target.value)}
                placeholder="<!-- Вставьте noscript фреймы или нижние виджеты сюда -->&#10;<noscript><iframe src='https://www.googletagmanager.com/ns.html?id=GTM-XXXX' h=0 w=0>... </noscript>"
                className="w-full h-44 overflow-y-auto border border-black rounded-none bg-[#111111] text-[#00FF55] p-3.5 font-mono text-[11px] leading-relaxed focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-black/10 flex items-center justify-between gap-4">
            <div>
              {scriptsSavedSuccess && (
                <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-700 flex items-center gap-1.5 animate-pulse">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  Коды успешно сохранены и применены в DOM!
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSavingScripts}
              className="px-6 py-3 bg-black hover:bg-neutral-800 disabled:bg-neutral-400 text-white text-[10px] uppercase tracking-[0.15em] font-bold transition-all rounded-none cursor-pointer flex items-center justify-center gap-2"
            >
              {isSavingScripts ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Сохранение скриптов...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Сохранить и активировать коды</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Hosting & Publishing Instructions Tab Section */}
      <div className={activeTab === "publishing" ? "block space-y-6 animate-fade-in" : "hidden"}>
        <div className="bg-white border border-black p-6 space-y-4 rounded-none select-none">
          <div className="flex items-center gap-2 border-b border-black pb-3">
            <Server className="w-5 h-5 text-emerald-500" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#1a1a1a]">Пошаговое руководство по размещению витрины на хостинг</h3>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Созданная вами витрина микрозаймов является современным <strong className="text-black">Single Page Application (SPA)</strong> на базе React + Vite. Это означает, что после сборки проект представляет собой набор статичных, чрезвычайно быстрых HTML, CSS и JS файлов, которые можно разместить на абсолютно любом веб-сервере или хостинге!
          </p>
        </div>

        {/* Bento grid steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
          <div className="bg-white border border-black p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-black pb-2 select-none">
              <span className="w-5 h-5 rounded-none bg-black text-white text-[10px] font-bold flex items-center justify-center">1</span>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-black">Сборка и экспорт файлов</h4>
            </div>
            <p className="text-xs text-[#444] leading-relaxed">
              Чтобы получить оптимизированный продакшн-код вашего сайта, в терминале управления проектом выполните команду сборки:
            </p>
            <pre className="p-3 bg-neutral-900 border border-black text-[#00FF55] font-mono text-[10px] select-all">
              npm run build
            </pre>
            <p className="text-xs text-[#666] leading-relaxed">
              В результате в корневой директории вашего проекта появится папка <strong className="text-black font-semibold">dist/</strong>. Именно всё её содержимое является вашим готовым сайтом.
            </p>
          </div>

          <div className="bg-white border border-black p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-black pb-2 select-none">
              <span className="w-5 h-5 rounded-none bg-black text-white text-[10px] font-bold flex items-center justify-center">2</span>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-black">Загрузка на сервер (Shared / FTP / DirectAdmin)</h4>
            </div>
            <p className="text-xs text-[#444] leading-relaxed">
              Если вы пользуетесь классическим веб-хостингом (Reg.ru, Beget, Hostland, cPanel):
            </p>
            <ul className="list-disc pl-4 text-xs text-[#666] space-y-1.5 leading-relaxed">
              <li>Откройте встроенный Менеджер файлов в панели хостинга.</li>
              <li>Перейдите в корневую публичную директорию сайта (обычно <code className="font-mono bg-neutral-100 px-1 py-0.2 select-all font-bold">public_html</code> или <code className="font-mono bg-neutral-100 px-1 py-0.2 select-all font-bold">www</code>).</li>
              <li>Скопируйте и загрузите файлы из локальной директории <strong className="text-black font-semibold">dist/</strong> (прямо в корень, чтобы файл <code className="font-mono">index.html</code> лежал прямо в корневом каталоге).</li>
            </ul>
          </div>

          <div className="bg-white border border-black p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-black pb-2 select-none">
              <span className="w-5 h-5 rounded-none bg-black text-white text-[10px] font-bold flex items-center justify-center">3</span>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-black">Настройка роутинга (Nginx / Apache / htaccess)</h4>
            </div>
            <p className="text-xs text-[#444] leading-relaxed">
              Поскольку сайт использует клиентский роутинг (React Router), необходимо перенаправлять все входящие URL на <code className="font-mono bg-neutral-50 px-1">index.html</code>, иначе при перезагрузке внутренних страниц возникнет ошибка 404.
            </p>
            
            <div className="space-y-2 pt-1">
              <div>
                <span className="text-[9px] font-bold font-mono uppercase block text-neutral-450">Для Apache (создайте .htaccess в корне сайта):</span>
                <pre className="p-2.5 bg-neutral-900 border border-black/35 text-white font-mono text-[9px] select-all overflow-x-auto whitespace-pre leading-normal">
{"RewriteEngine On\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteCond %{REQUEST_FILENAME} !-d\nRewriteRule ^ index.html [L]"}
                </pre>
              </div>

              <div>
                <span className="text-[9px] font-bold font-mono uppercase block text-neutral-450">Для Nginx (конфиг блока server):</span>
                <pre className="p-2.5 bg-neutral-900 border border-black/35 text-white font-mono text-[9px] select-all overflow-x-auto whitespace-pre leading-normal">
{"location / {\n    try_files $uri $uri/ /index.html;\n}"}
                </pre>
              </div>
            </div>
          </div>

          <div className="bg-white border border-black p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-black pb-2 select-none">
                <span className="w-5 h-5 rounded-none bg-black text-white text-[10px] font-bold flex items-center justify-center">4</span>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-black">Облачное развертывание (Netlify / Vercel / GitHub Pages)</h4>
              </div>
              <p className="text-xs text-[#444] leading-relaxed">
                Если вы предпочитаете современные serverless-облака, вы можете задеплоить сайт абсолютно бесплатно за 1 минуту:
              </p>
              <ul className="list-disc pl-4 text-xs text-[#666] space-y-1 leading-relaxed">
                <li><strong className="text-black">Vercel:</strong> Импортируйте репозиторий из GitHub, выберите фреймворк <strong className="text-black font-semibold">Vite</strong> и нажмите Deploy.</li>
                <li><strong className="text-black">Netlify:</strong> Просто перетащите папку <code className="font-mono bg-neutral-100">dist</code> в веб-интерфейс Netlify Drop, и ваш сайт мгновенно получит публичный адрес.</li>
              </ul>
            </div>
            <div className="pt-4 border-t border-black/10 text-center">
              <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-[#2E7D32] bg-emerald-50 px-3 py-1.5 border border-emerald-300">
                🚀 Ваша витрина готова к покорению топа поисковой выдачи!
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
