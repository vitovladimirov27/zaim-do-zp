import React, { useState, useEffect } from "react";
import { initialMfoBrands } from "./data/mfoData";
import { seoCategories } from "./data/seoData";
import { MfoBrand, ClickLog, SeoCategory } from "./types";
import { formatRub, getRepaymentDetails, getDeclension } from "./utils";

import LoanCalculator from "./components/LoanCalculator";
import MfoCard from "./components/MfoCard";
import SeoText from "./components/SeoText";
import WebmasterDashboard from "./components/WebmasterDashboard";

import { 
  Building2, 
  Filter, 
  TrendingUp, 
  CheckCircle, 
  Sparkles, 
  Search, 
  Settings, 
  ChevronRight, 
  Info, 
  HelpCircle,
  Undo2,
  RefreshCw,
  Award
} from "lucide-react";

export default function App() {
  // Main states
  const [amountQuery, setAmountQuery] = useState(15000);
  const [termQuery, setTermQuery] = useState(15);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"rating" | "rate" | "maxAmount">("rating");
  const [searchWord, setSearchWord] = useState("");
  const [selectedPayout, setSelectedPayout] = useState("any");

  // Webmaster administration states
  const [showAdminTab, setShowAdminTab] = useState(false);
  const [trackingLogs, setTrackingLogs] = useState<ClickLog[]>([]);
  const [activePartnerLinks, setActivePartnerLinks] = useState<Record<string, string>>({});
  const [activeSubId, setActiveSubId] = useState("seo_landing");

  // Security Administration Access states
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminToken, setAdminToken] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Dynamic MFO configuration state
  const [mfoBrands, setMfoBrands] = useState<MfoBrand[]>(initialMfoBrands);

  // Dynamic SEO copy overrides (populated via Gemini API)
  const [seoOverrides, setSeoOverrides] = useState<Record<string, SeoCategory>>(() => {
    try {
      const saved = localStorage.getItem("seo_overrides");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Dynamic GTM/Analytics custom script codes
  const [customScripts, setCustomScripts] = useState<{ head: string; body: string }>(() => {
    try {
      const saved = localStorage.getItem("custom_scripts");
      return saved ? JSON.parse(saved) : { head: "", body: "" };
    } catch {
      return { head: "", body: "" };
    }
  });

  // Persist SEO overrides to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem("seo_overrides", JSON.stringify(seoOverrides));
    } catch (err) {
      console.warn("Failed to write seo_overrides to localStorage", err);
    }
  }, [seoOverrides]);

  // Persist and inject Custom Scripts to head/body
  useEffect(() => {
    try {
      localStorage.setItem("custom_scripts", JSON.stringify(customScripts));
    } catch (err) {
      console.warn("Failed to write custom_scripts to localStorage", err);
    }

    // 1. Clean previous injected nodes
    document.querySelectorAll('[data-custom-inject="true"]').forEach((el) => el.remove());

    const injectBlock = (htmlCode: string, targetContainer: HTMLElement) => {
      if (!htmlCode) return;
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlCode;

      // Extract scripts
      const scripts = Array.from(tempDiv.getElementsByTagName("script"));
      for (const script of scripts) {
        script.parentNode?.removeChild(script);
        const newScript = document.createElement("script");
        newScript.setAttribute("data-custom-inject", "true");

        for (let i = 0; i < script.attributes.length; i++) {
          const attr = script.attributes[i];
          newScript.setAttribute(attr.name, attr.value);
        }
        newScript.textContent = script.textContent;
        targetContainer.appendChild(newScript);
      }

      // Extract other nodes
      while (tempDiv.firstChild) {
        const child = tempDiv.firstChild as HTMLElement;
        if (child.nodeType === Node.ELEMENT_NODE) {
          child.setAttribute("data-custom-inject", "true");
        }
        targetContainer.appendChild(child);
      }
    };

    if (customScripts.head) {
      injectBlock(customScripts.head, document.head);
    }
    if (customScripts.body) {
      injectBlock(customScripts.body, document.body);
    }
  }, [customScripts]);

  // Subdomain restriction for Webmaster panel
  const isAdminSubdomain = (() => {
    const host = window.location.hostname;
    if (host.includes("domen.ru")) {
      return host.startsWith("admin.");
    }
    return true; // fallback to true for testing on developer preview or localhost
  })();

  // 1. Load webmaster logs, links and MFO brands on mount
  const syncServerStats = async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setTrackingLogs(data.logs || []);
        setActivePartnerLinks(data.affiliateLinks || {});
        if (data.mfoBrands) {
          setMfoBrands(data.mfoBrands);
        }
      }
    } catch (err) {
      console.warn("Failed to synchronize statistic records from server. Using mock mode.", err);
    }
  };

  useEffect(() => {
    syncServerStats();
    // Auto sync stats every 5 seconds to automatically pick up user clicks
    const interval = setInterval(syncServerStats, 5000);

    // Check localStorage for saved admin token
    const savedToken = localStorage.getItem("admin_token");
    if (savedToken) {
      setAdminToken(savedToken);
      setIsAdminAuthenticated(true);
    }

    // Check URL parameters for explicit security key login e.g. ?key=vitovladimirov27
    const queryParams = new URLSearchParams(window.location.search);
    const key = queryParams.get("key");
    if (key) {
      const autoLogin = async () => {
        try {
          const res = await fetch("/api/verify-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: key }),
          });
          if (res.ok) {
            localStorage.setItem("admin_token", key);
            setAdminToken(key);
            setIsAdminAuthenticated(true);
            setShowAdminTab(true);
            // Clear URL parameter securely without reloading
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (err) {
          console.warn("Auto key authentication failed", err);
        }
      };
      autoLogin();
    }

    return () => clearInterval(interval);
  }, []);

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;
    setIsVerifying(true);
    setLoginError("");

    try {
      const res = await fetch("/api/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput.trim() }),
      });

      if (res.ok) {
        const passwordValue = passwordInput.trim();
        localStorage.setItem("admin_token", passwordValue);
        setAdminToken(passwordValue);
        setIsAdminAuthenticated(true);
        setLoginError("");
        setPasswordInput("");
      } else {
        const errData = await res.json();
        setLoginError(errData.error || "Неверный пароль администратора.");
      }
    } catch (err) {
      setLoginError("Ошибка подключения к серверу.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setAdminToken("");
    setIsAdminAuthenticated(false);
    setShowAdminTab(false);
  };

  const handleUpdateMfo = async (updatedMfo: MfoBrand) => {
    try {
      const res = await fetch("/api/update-mfo", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify({ updatedMfo }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.mfoBrands) {
          setMfoBrands(data.mfoBrands);
        } else {
          await syncServerStats();
        }
      } else {
        setMfoBrands((prev) => prev.map((m) => m.id === updatedMfo.id ? updatedMfo : m));
      }
    } catch (err) {
      console.error("Failed to update MFO:", err);
      setMfoBrands((prev) => prev.map((m) => m.id === updatedMfo.id ? updatedMfo : m));
    }
  };

  const handleAddMfo = async (newMfo: MfoBrand) => {
    try {
      const res = await fetch("/api/add-mfo", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify({ newMfo }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.mfoBrands) {
          setMfoBrands(data.mfoBrands);
        } else {
          await syncServerStats();
        }
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Ошибка со стороны сервера при добавлении МФО.");
      }
    } catch (err: any) {
      console.error("Failed to add MFO:", err);
      throw err;
    }
  };

  const handleDeleteMfo = async (id: string) => {
    try {
      const res = await fetch("/api/delete-mfo", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.mfoBrands) {
          setMfoBrands(data.mfoBrands);
        } else {
          await syncServerStats();
        }
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Ошибка со стороны сервера при удалении МФО.");
      }
    } catch (err: any) {
      console.error("Failed to delete MFO:", err);
      throw err;
    }
  };

  // 2. React to Category click
  // Dynamically updates Meta Tag details (Page Title & Document Meta description)
  const currentCategoryData = (): SeoCategory => {
    if (seoOverrides[selectedCategory]) {
      return seoOverrides[selectedCategory];
    }
    return seoCategories.find((s) => s.id === selectedCategory) || seoCategories[0];
  };

  useEffect(() => {
    const activeSeo = currentCategoryData();
    document.title = activeSeo.title;
    
    // Attempt to update standard meta description tag
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", activeSeo.metaDescription);
    
    // Attempt to update standard meta keywords tag
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement("meta");
      metaKeywords.setAttribute("name", "keywords");
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute("content", activeSeo.keywords);
  }, [selectedCategory, seoOverrides]);

  // 3. Webmaster configuration actions
  const handleUpdatePartnerLink = async (brandId: string, newUrl: string) => {
    try {
      const res = await fetch("/api/update-partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, newUrl }),
      });
      if (res.ok) {
        await syncServerStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerConversion = async (clickId: string) => {
    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clickId }),
      });
      if (res.ok) {
        await syncServerStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Callback to inject Gemini generated SEO Article immediately onto the active category
  const handleApplySeoCopy = (seoResult: any) => {
    const formattedSeo: SeoCategory = {
      id: selectedCategory,
      tag: seoCategories.find((c) => c.id === selectedCategory)?.tag || "SEO Раздел",
      title: seoResult.title,
      metaDescription: seoResult.metaDescription,
      h1: seoResult.h1,
      keywords: seoResult.keywords || seoResult.title,
      seoText: seoResult.seoText,
      faqs: seoResult.faqs || seoCategories[0].faqs,
    };
    
    setSeoOverrides((prev) => ({
      ...prev,
      [selectedCategory]: formattedSeo,
    }));
  };

  // 4. Client-side MFO filter & sorting calculations
  const getFilteredBrands = (): MfoBrand[] => {
    return mfoBrands
      .filter((mfo) => {
        // Active check
        if (!mfo.isActive) return false;
        
        // Amount query limits
        if (amountQuery > mfo.maxAmount || amountQuery < mfo.minAmount) return false;

        // Categorized tags
        if (selectedCategory === "bez-otkaza" && mfo.approvalRate < 93) return false;
        if (selectedCategory === "pod-nol" && !mfo.isFirstPromoZero) return false;
        if (selectedCategory === "plohaya-ki" && mfo.approvalRate < 94) return false;
        if (selectedCategory === "dolgosrochnye" && mfo.maxTerm < 90) return false;
        if (selectedCategory === "na-kartu" && !mfo.payoutMethods.includes("Карта")) return false;

        // Payout filter
        if (selectedPayout !== "any" && !mfo.payoutMethods.includes(selectedPayout)) return false;

        // Search term text check
        if (searchWord && !mfo.name.toLowerCase().includes(searchWord.toLowerCase())) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "rating") return b.rating - a.rating;
        if (sortBy === "maxAmount") return b.maxAmount - a.maxAmount;
        if (sortBy === "rate") {
          // Sort daily percentage from lowest to highest
          return a.dailyRate - b.dailyRate;
        }
        return 0;
      });
  };

  const filteredMfo = getFilteredBrands();

  // Overpayment calculations for the primary calculator
  const averageMfoDailyRate = 0.8; // Standard daily cap
  // Find if some active MFO provides 0% rate for first loan
  const somePromoActive = selectedCategory === "pod-nol" || 
    (filteredMfo.length > 0 && filteredMfo.some(b => b.isFirstPromoZero) && amountQuery <= 30000 && termQuery <= 15);
  
  const calcDetails = getRepaymentDetails(
    amountQuery,
    termQuery,
    averageMfoDailyRate,
    somePromoActive
  );

  const scrollToSection = (sectionId: string) => {
    if (showAdminTab) {
      setShowAdminTab(false);
    }
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, showAdminTab ? 100 : 0);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB] text-[#1A1A1A] flex flex-col font-sans antialiased">
      
      {/* 1. Header Navigation */}
      <header className="sticky top-0 bg-white z-40 border-b border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            
            {/* Branding */}
            <div className="flex items-center gap-8 select-none focus:outline-none">
              <span className="font-serif italic text-3xl font-black tracking-tighter text-[#1A1A1A]">ЗАЙМ ДО ЗП</span>
              <div className="hidden md:flex gap-6 text-[10px] uppercase tracking-widest font-bold">
                <button 
                  onClick={() => scrollToSection("filters-navigation-panel")}
                  className="text-black/50 hover:text-black transition-all cursor-pointer focus:outline-none border-none bg-transparent uppercase font-bold tracking-widest text-[10px]"
                >
                  РЕЙТИНГ МФО
                </button>
                <button 
                  onClick={() => scrollToSection("loan-calculator-section")}
                  className="text-black/50 hover:text-black transition-all cursor-pointer focus:outline-none border-none bg-transparent uppercase font-bold tracking-widest text-[10px]"
                >
                  КАЛЬКУЛЯТОР
                </button>
                <button 
                  onClick={() => scrollToSection("seo-text-container")}
                  className="text-black/50 hover:text-black transition-all cursor-pointer focus:outline-none border-none bg-transparent uppercase font-bold tracking-widest text-[10px]"
                >
                  АНАЛИТИКА 2026
                </button>
              </div>
            </div>

            {/* License callout for trust builder */}
            <div className="hidden lg:flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest font-bold bg-[#F4F4F2] border border-black/10 px-4.5 py-1.5 select-none">
              <span className="w-1.5 h-1.5 rounded-none bg-black"></span>
              Банк России реестр МФО • 2026
            </div>

            {/* Config & Dashboard toggle */}
            <div className="flex items-center gap-3">
              {isAdminSubdomain && (
                <button
                  onClick={() => showAdminTab ? handleLogout() : setShowAdminTab(true)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-none text-[10px] uppercase tracking-widest font-bold transition-all border ${
                    showAdminTab 
                      ? "bg-black border-black text-white" 
                      : "bg-white hover:bg-neutral-50 text-black border-black"
                  }`}
                  id="webmaster-tab-toggle"
                >
                  <Settings className={`w-3.5 h-3.5 ${showAdminTab ? "rotate-90" : ""} transition-transform duration-300`} />
                  {showAdminTab ? "Выйти" : "ВЕБМАСТЕР"}
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {showAdminTab && isAdminSubdomain ? (
          // Webmaster Admin Control Center view
          <div className="space-y-4 animate-fade-in">
            <button
              onClick={() => setShowAdminTab(false)}
              className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] hover:underline"
              id="back-to-showcase"
            >
              <Undo2 className="w-4 h-4" />
              Вернуться на витрину
            </button>
            
            {!isAdminAuthenticated ? (
              <div className="max-w-md mx-auto my-12 bg-white border border-black p-8 shadow-sm">
                <div className="flex items-center gap-2 mb-4 border-b border-black pb-4 select-none">
                  <span className="w-2 h-2 rounded-none bg-black"></span>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-black">ВХОД ДЛЯ АДМИНИСТРАТОРА</h3>
                </div>
                
                <p className="text-xs text-neutral-500 mb-6 font-medium leading-relaxed">
                  Панель вебмастера и управления МФО закрыта от посторонних. Пожалуйста, введите ваш персональный пароль для доступа к редактированию.
                </p>

                <form onSubmit={handleVerifyPassword} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 font-mono">
                      Пароль доступа
                    </label>
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Введи пароль администратора"
                      className="w-full border border-black rounded-none bg-[#FDFDFB] p-3 text-xs font-mono text-black focus:outline-none"
                      disabled={isVerifying}
                      autoFocus
                    />
                  </div>

                  {loginError && (
                    <p className="text-[10px] uppercase font-bold tracking-wider text-red-600 bg-red-50 border border-red-200 p-3 leading-tight font-sans">
                      ⚠️ {loginError}
                    </p>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isVerifying || !passwordInput.trim()}
                      className="w-full bg-black hover:bg-neutral-800 disabled:bg-neutral-300 text-white p-3 text-[10px] uppercase tracking-[0.2em] font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isVerifying ? "Проверка пароля..." : "Подтвердить пароль"}
                    </button>
                  </div>
                </form>

                <div className="mt-8 border-t border-black/10 pt-4 text-[9px] text-gray-400 uppercase tracking-wider font-mono space-y-2">
                  <p>💡 <strong>Совет:</strong> Вы можете войти автоматически, если перейдете по секретной ссылке вида:</p>
                  <p className="bg-[#F4F4F2]/50 p-2 text-[8px] border border-black/5 select-all overflow-x-auto break-all">
                    {window.location.origin}/?key=ВАШ_ПАРОЛЬ
                  </p>
                </div>
              </div>
            ) : (
              <WebmasterDashboard
                mfoBrands={mfoBrands}
                onUpdateMfo={handleUpdateMfo}
                onAddMfo={handleAddMfo}
                onDeleteMfo={handleDeleteMfo}
                seoOverrides={seoOverrides}
                onUpdateSeoOverrides={setSeoOverrides}
                customScripts={customScripts}
                onUpdateCustomScripts={setCustomScripts}
              />
            )}
          </div>
        ) : (
          // Consumer facing microloans comparison table
          <div className="space-y-8 animate-fade-in">
            
            {/* Landing Hero Title */}
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-10 select-none">
              <h1 className="font-serif text-4xl md:text-6xl font-light text-[#1A1A1A] leading-tight tracking-tight">
                {currentCategoryData().h1}
              </h1>
              <p className="text-xs uppercase tracking-widest leading-relaxed text-gray-400 max-w-xl mx-auto font-sans font-bold">
                Сравнение условий в реальном времени • Нет скрытых комиссий • Одобрение до 98%
              </p>
            </div>

            {/* Calculator Section */}
            <LoanCalculator
              amount={amountQuery}
              setAmount={setAmountQuery}
              term={termQuery}
              setTerm={setTermQuery}
              calculatedOverpayment={calcDetails.overpayment}
              calculatedTotal={calcDetails.total}
              estimatedPsk={calcDetails.psk}
            />

            {/* Filters Navigation Panel (SEO tags) */}
            <div className="bg-white rounded-none border border-black p-5 md:p-6 space-y-5" id="filters-navigation-panel">
              
              {/* Category tabs (SEO dynamic link landings) */}
              <div>
                <span className="block text-[9px] uppercase font-bold tracking-widest text-gray-400 mb-3 select-none">Популярные категории займов (SEO ТЕГИ)</span>
                <div className="flex flex-wrap gap-1.5 border-b border-black/10 pb-4">
                  {seoCategories.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold rounded-none transition-all duration-200 select-none border ${
                          isSelected
                            ? "bg-black border-black text-white"
                            : "bg-[#F4F4F2]/50 hover:bg-neutral-100 text-neutral-800 border-transparent"
                        }`}
                        id={`category-tab-${cat.id}`}
                      >
                        {cat.tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Advanced search & sorting options */}
              <div className="flex flex-wrap gap-4 items-center justify-between pt-1">
                
                {/* Advanced parameters filters */}
                <div className="flex flex-wrap gap-3 items-center grow">
                  
                  {/* Select sort */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-gray-400 select-none">Сортировка:</span>
                    <select
                      value={sortBy}
                      onChange={(e: any) => setSortBy(e.target.value)}
                      className="bg-[#F4F4F2]/60 border border-black/10 rounded-none px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-neutral-800 focus:outline-none focus:ring-0 focus:border-black cursor-pointer pr-4"
                      id="sort-select-dropdown"
                    >
                      <option value="rating">По рейтингу МФО</option>
                      <option value="rate">Минимум переплаты (ПСК)</option>
                      <option value="maxAmount">Максимальная сумма</option>
                    </select>
                  </div>

                  {/* Filter Payout */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-gray-400 select-none">Выплата:</span>
                    <select
                      value={selectedPayout}
                      onChange={(e: any) => setSelectedPayout(e.target.value)}
                      className="bg-[#F4F4F2]/60 border border-black/10 rounded-none px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-neutral-800 focus:outline-none focus:ring-0 focus:border-black cursor-pointer pr-4"
                      id="payout-filter-dropdown"
                    >
                      <option value="any">Все способы</option>
                      <option value="Карта">На банковскую карту</option>
                      <option value="ЮMoney">ЮMoney</option>
                      <option value="СБП">Мгновенный СБП</option>
                      <option value="QIWI">QIWI кошелек</option>
                    </select>
                  </div>

                </div>

                {/* Direct name search */}
                <div className="relative w-full md:w-64 max-w-full">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                    <Search className="w-3.5 h-3.5 text-black" />
                  </span>
                  <input
                    type="text"
                    placeholder="Быстрый поиск по имени..."
                    value={searchWord}
                    onChange={(e) => setSearchWord(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-[10px] uppercase font-bold tracking-widest bg-[#F4F4F2]/30 border border-black/20 rounded-none font-medium focus:bg-white focus:outline-none focus:border-black text-slate-800 placeholder-neutral-400"
                    id="search-brand-input"
                  />
                </div>

              </div>

            </div>

            {/* MFO Cards listing */}
            <div className="space-y-4">
              <div className="flex justify-between items-center select-none pb-1 border-b border-black">
                <span className="text-[10px] font-bold text-black uppercase tracking-widest">
                  Найдено и доступно: {filteredMfo.length} {getDeclension(filteredMfo.length, ["предложение", "предложения", "предложений"])}
                </span>
                
                <span className="text-[9px] text-gray-400 font-mono font-bold uppercase tracking-widest flex items-center gap-1">
                  SubID отслеживания: <code className="bg-neutral-100 px-1 py-0.5 border border-black/10 text-neutral-800 font-bold">{activeSubId || "direct"}</code>
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredMfo.map((mfo) => (
                  <MfoCard 
                    key={mfo.id} 
                    brand={mfo} 
                    amountQuery={amountQuery}
                    termQuery={termQuery}
                    subId={activeSubId}
                  />
                ))}
              </div>

              {filteredMfo.length === 0 && (
                <div className="bg-white border border-black p-12 text-center rounded-none space-y-4">
                  <div className="w-12 h-12 bg-[#F4F4F2] text-black border border-black/20 flex items-center justify-center mx-auto">
                    <Info className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif text-2xl italic font-bold text-black">По вашим параметрам предложений не найдено</h3>
                  <p className="text-xs text-gray-500 uppercase tracking-wider max-w-md mx-auto leading-normal">
                    Попробуйте скорректировать ползунки суммы и срока займа или очистить текстовый фильтр поиска.
                  </p>
                </div>
              )}
            </div>

            {/* Static Dynamic SEO Segment with FAQ accordions */}
            <SeoText 
              category={currentCategoryData()} 
              mfoBrands={filteredMfo.length > 0 ? filteredMfo : mfoBrands} 
            />

          </div>
        )}

      </main>

      {/* Primary regulatory and meta compliance footer */}
      <footer className="bg-white text-gray-500 text-[10px] border-t border-black mt-20 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-black/10 pb-6 gap-4">
            <div className="flex items-center gap-2">
              <span className="font-serif italic text-2xl font-black text-[#1A1A1A] tracking-tighter">ЗАЙМ ДО ЗП</span>
              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block pl-2 border-l border-black/10">Витрина микрофинансовых предложений</span>
            </div>
            
            <p className="text-[9px] text-gray-400 leading-normal max-w-xl md:text-right font-mono uppercase tracking-widest">
              Сайт не является кредитной или финансовой организацией, не выдает кредиты и не берет плату за услуги. Все опубликованные компании имеют лицензии ЦБ РФ.
            </p>
          </div>

          <div className="text-[9px] text-gray-400 leading-relaxed uppercase tracking-widest space-y-3">
            <p>
              <strong>Правовая информация:</strong> Все услуги на сайте представлены исключительно в целях ознакомления. Требования к заемщикам: гражданство РФ, возраст более 18 лет. Каждая организация самостоятельно рассчитывает Полную Стоимость Потребительского Кредита (Займа) (ПСК). Процентная ставка варьируется от 0% до 292% годовых (до 0.8% в день).
            </p>
            <p>
              Пример расчета переплаты: при сумме займа 10 000 рублей на 30 дней по стандартной ставке 0.8% в день, плата за пользование составит 2 400 рублей. Итоговая сумма к возврату: 12 400 рублей. В случае просрочки МФО начисляет неустойки в пределах, разрешенных законодательством РФ (не более 1.3-кратного размера суммы долга).
            </p>
            <p>
              © 2014-2026 Займ До ЗП. Все права защищены. Сервис сравнения финансовых услуг для граждан Российской Федерации. Лицензии ЦБ РФ в реестре.
            </p>
          </div>

        </div>
      </footer>

    </div>
  );
}
