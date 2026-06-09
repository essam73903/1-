import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Upload, 
  RotateCcw, 
  X, 
  Image as ImageIcon, 
  Check, 
  Cpu, 
  Loader2, 
  AlertCircle, 
  Palette, 
  HelpCircle,
  FileImage,
  ArrowLeftRight
} from 'lucide-react';

interface LogoCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'ar';
  currentLogo: string | null;
  onLogoChange: (newLogo: string | null) => void;
  defaultLogoUrl: string;
}

const STYLE_PRESETS = [
  { id: 'classic', nameAr: 'صقر ملكي وسيفين (شعار تقليدي)', nameEn: 'Royal Shield & Falcon', descAr: 'طراز رسمي مهيب ممتد باللون الذهبي العميق مع تفاصيل سعودية قيادية.', descEn: 'Official royal theme featuring swords, falcon elements, and deep golden hues.' },
  { id: 'geometric', nameAr: 'هندسي حديث ذكي (حرف S)', nameEn: 'Modern Geometric Node', descAr: 'شعار معاصر يعتمد العقد المترابطة ورسم هندسي مبتكر لحرف S.', descEn: 'Contemporary graphic icon built on linked tech connections and modular letter S.' },
  { id: 'minimalist', nameAr: 'ذهبي ناعم وبسيط (Luxury)', nameEn: 'Luxury Minimalist', descAr: 'خطوط ذهبية رفيعة أنيقة مع خلفية معتمة تمنح إحساساً بالنخبة.', descEn: 'Ultrasleek gold line-art contours paired with subtle darkness for premium feel.' }
];

const SAMPLE_PROMPTS = [
  { textAr: 'شعار ملكي مهيب يضم صقر طائر في وسطه ونخلة بلمسة فاخرة وخلفية داكنة', textEn: 'Premium royal emblem centering a soaring falcon and subtle palm tree, dark green outline' },
  { textAr: 'شعار ميزان العدالة باللون الذهبي لخدمات تيسير المحاكم والمعاملات والحقوق', textEn: 'Golden scales of justice premium vector icon representing civil rights and compliance' },
  { textAr: 'شعار هندسي أنيق لحرف S يرمز لسما المملكة بأسلوب تقني حديث متطور', textEn: 'Modern elegant geometric logo of letter S for Sama, tech-startup abstract vectors' }
];

export default function LogoCustomizerModal({
  isOpen,
  onClose,
  lang,
  currentLogo,
  onLogoChange,
  defaultLogoUrl
}: LogoCustomizerModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'ai'>('ai');
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('classic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSteps, setGenerationSteps] = useState<string>('');
  const [aiError, setAiError] = useState<string | null>(null);
  
  // Real-time temporary preview logo
  const [previewLogo, setPreviewLogo] = useState<string | null>(currentLogo);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isAiOfflineNotice, setIsAiOfflineNotice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 3MB for localStorage base64 safety)
    if (file.size > 3 * 1024 * 1024) {
      setUploadError(lang === 'en' ? 'File is too large. Max allowed is 3MB.' : 'حجم الصورة كبير جداً. الحد الأقصى المسموح به هو 3 ميجابايت.');
      return;
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      setUploadError(lang === 'en' ? 'Only image files are allowed.' : 'يُسمح برفع ملفات الصور فقط.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreviewLogo(reader.result);
      }
    };
    reader.onerror = () => {
      setUploadError(lang === 'en' ? 'Error reading file.' : 'حدث خطأ أثناء قراءة الملف.');
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateLogo = async () => {
    if (!prompt.trim()) {
      setAiError(lang === 'en' ? 'Please enter a description prompt.' : 'الرجاء كتابة وصف الشعار أولاً.');
      return;
    }

    setIsGenerating(true);
    setAiError(null);
    setIsAiOfflineNotice(false);

    // Dynamic progress animations
    const steps = lang === 'en' 
      ? ['Connecting to Gemini Creative Agent...', 'Styling design directives...', 'Engaging SVG vector generator engine...', 'Compiling geometric contours and scales...']
      : ['جاري الاتصال بوكيل التصميم الإبداعي للذكاء الاصطناعي...', 'جاري تصفية توجيهات الألوان والأنماط الذهبية...', 'تفعيل محرك توليد الرسم المتجه المتكامل (SVG)...', 'صياغة المنحنيات الهندسية وميزان الهوية الشاملة...'];

    let stepIdx = 0;
    setGenerationSteps(steps[0]);
    const interval = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        setGenerationSteps(steps[stepIdx]);
      }
    }, 700);

    try {
      const response = await fetch('/api/generate-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style: selectedStyle })
      });

      if (!response.ok) {
        throw new Error('Server error generating logo');
      }

      const data = await response.json();
      clearInterval(interval);

      if (data.svg) {
        // Encode SVG as a valid data URL
        const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(data.svg)}`;
        setPreviewLogo(svgDataUrl);
        if (data.isAiOffline) {
          setIsAiOfflineNotice(true);
        }
      } else {
        throw new Error('No SVG content returned');
      }
    } catch (err) {
      clearInterval(interval);
      console.error(err);
      setAiError(
        lang === 'en' 
          ? 'Failed to generate logo. Standard system is running in offline sandbox Mode.' 
          : 'فشل توليد الشعار. النظام يعمل حالياً في وضع عدم الاتصال بالخادم الذكي.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyLogo = () => {
    onLogoChange(previewLogo);
    onClose();
  };

  const handleResetLogo = () => {
    setPreviewLogo(null);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-fade-in"
      dir={lang === 'en' ? 'ltr' : 'rtl'}
    >
      <div className="w-full max-w-4xl bg-white border border-amber-500/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        
        {/* LEFT COLUMN: ACTIVE VISUAL REAL-TIME PREVIEW CARD */}
        <div className="w-full md:w-1/3 bg-gradient-to-b from-slate-900 via-slate-950 to-[#012211] p-6 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-slate-800 text-white min-h-[320px] md:min-h-auto">
          <div className="text-center space-y-1 w-full">
            <span className="inline-flex items-center gap-1 bg-amber-500 text-slate-950 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <Palette className="w-3 h-3" />
              <span>{lang === 'en' ? 'PREVIEW EMBLEM' : 'معاينة شعار مكتبك'}</span>
            </span>
            <h3 className="text-sm font-bold text-slate-300 mt-2">{lang === 'en' ? 'Official Invoices Logo' : 'الشعار المعتمد وخطابات الفواتير'}</h3>
            <p className="text-[10px] text-slate-400 font-sans">{lang === 'en' ? 'Real-time rendering visualization' : 'المظهر المباشر لخدمة العملاء والسندات'}</p>
          </div>

          {/* Glowing Custom Logo Container */}
          <div className="relative my-6 w-44 h-44 rounded-2xl overflow-hidden border-2 border-amber-500/35 bg-slate-950 flex items-center justify-center p-1.5 shadow-2xl group transition-all duration-300 hover:border-amber-400">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-600 to-emerald-600 rounded-2xl blur-md opacity-20"></div>
            
            <img 
              src={previewLogo || defaultLogoUrl} 
              alt="Logo Preview" 
              className="w-full h-full object-contain relative z-15"
              referrerPolicy="no-referrer"
            />

            {isAiOfflineNotice && (
              <span className="absolute bottom-2 right-2 bg-slate-900 border border-amber-500/40 text-amber-500 text-[8px] font-black px-1.5 py-0.5 rounded-md z-20">
                AI PRESET
              </span>
            )}
          </div>

          <div className="w-full text-center space-y-3">
            <div className="bg-slate-800/45 border border-slate-700/50 rounded-lg p-2.5 text-[10px] text-slate-300">
              {previewLogo ? (
                <div className="flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>{lang === 'en' ? 'Custom Logo is Active' : 'تم تفعيل شعار مخصص للمكتب'}</span>
                </div>
              ) : (
                <p>{lang === 'en' ? 'Default Sama Logo is applied' : 'شعار سما المملكة الأصلي قيد الاستخدام حالياً'}</p>
              )}
            </div>

            {previewLogo && (
              <button
                onClick={handleResetLogo}
                className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-md bg-rose-950/20 border border-rose-900/30 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Restore Default Logo' : 'إستعادة الشعار الأصلي'}</span>
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CONTROL PANEL TABS */}
        <div className="w-full md:w-2/3 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Header Title */}
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-amber-500" />
                  <span>{lang === 'en' ? 'Office Identity Logo Editor' : 'مطور وهوية شعار مكتب سما المملكة'}</span>
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {lang === 'en' 
                    ? 'Apply high-fidelity professional logos manually or utilize corporate generative AI.' 
                    : 'قم بضبط الهوية الرسمية للمكتب برفع شعار مخصص وصورة، أو قم بإنشاء رسومات شعاعية راقية ومخصصة بذكاء الاصطناعي.'}
                </p>
              </div>
              <button 
                onClick={onClose}
                className="p-1 rounded-full cursor-pointer hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                id="close-logo-button"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-6">
              <button
                onClick={() => { setActiveTab('ai'); setAiError(null); }}
                className={`py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'ai' 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'en' ? 'AI Vector Designer (SVG)' : 'توليد الشعار بالذكاء الاصطناعي'}</span>
              </button>
              <button
                onClick={() => { setActiveTab('upload'); setUploadError(null); }}
                className={`py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'upload' 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Manual Upload Image' : 'رفع ملف صورة شعار مخصصة'}</span>
              </button>
            </div>

            {/* TAB CONTENT: AI SVG GENERATION */}
            {activeTab === 'ai' && (
              <div className="space-y-4 animate-fade-in text-slate-800">
                
                {/* AI Input Prompt */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 flex justify-between items-center">
                    <span>{lang === 'en' ? 'AI Graphic Prompt Description:' : 'اكتب وصف شعار المكتب بكلماتك:'}</span>
                    <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md font-sans">
                      {lang === 'en' ? 'Gemini 3.5 Stylist engine' : 'ذكاء اصطناعي فوري للمتجهات'}
                    </span>
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={lang === 'en' ? 'e.g., A luxury golden falcon shield with emerald green accents...' : 'مثال: شعار ميزان عدالة ملكي محفوف بالنخيل وصقر ذهبي ذو هيبة فخمة وخلفية داكنة...'}
                    rows={2.5}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-medium leading-relaxed bg-slate-50 focus:bg-white transition-all"
                  />
                </div>

                {/* Sample Prompt Suggestions */}
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{lang === 'en' ? 'Click to try ideas:' : 'أفكار رائجة جاهزة (انقر للنسخ والبدء):'}</span>
                  <div className="flex flex-col gap-1.5">
                    {SAMPLE_PROMPTS.map((sample, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPrompt(lang === 'en' ? sample.textEn : sample.textAr)}
                        className="text-right text-[11px] text-slate-600 hover:text-amber-700 bg-slate-50 hover:bg-amber-50/50 p-2 border border-slate-200/60 rounded-lg transition-all text-ellipsis overflow-hidden whitespace-nowrap block w-full focus:outline-none cursor-pointer"
                      >
                        ⚡ {lang === 'en' ? sample.textEn : sample.textAr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Presets Settings */}
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-slate-700">{lang === 'en' ? 'Select Logo Preset Aesthetic:' : 'اختر التوجه الفني والجمالي للشعار:'}</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {STYLE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => setSelectedStyle(preset.id)}
                        className={`text-right p-3 rounded-xl border text-xs flex flex-col justify-between h-20 transition-all focus:outline-none cursor-pointer ${
                          selectedStyle === preset.id
                            ? 'border-amber-500 bg-amber-50/40 shadow-2xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="font-extrabold text-slate-900">{lang === 'en' ? preset.nameEn : preset.nameAr}</span>
                          {selectedStyle === preset.id && (
                            <span className="w-3.5 h-3.5 rounded-full bg-amber-500 flex items-center justify-center text-slate-950">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-slate-500 mt-1 leading-normal line-clamp-2">
                          {lang === 'en' ? preset.descEn : preset.descAr}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generating Loading State */}
                {isGenerating && (
                  <div className="bg-amber-50/70 border border-amber-300/40 rounded-xl p-4 flex items-center gap-3 animate-pulse">
                    <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-amber-900">{lang === 'en' ? 'AI Agent Designing Vector Logo...' : 'جاري توليد الشعار بذكاء الاصطناعي...'}</p>
                      <p className="text-[10px] text-amber-700">{generationSteps}</p>
                    </div>
                  </div>
                )}

                {/* AI Error */}
                {aiError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span>{aiError}</span>
                  </div>
                )}

                {/* Run Generation Command Button */}
                {!isGenerating && (
                  <button
                    onClick={handleGenerateLogo}
                    className="w-full bg-gradient-to-r from-amber-500 hover:from-amber-600 to-amber-600 text-slate-950 font-black py-3 rounded-xl shadow-md border border-amber-600 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-99"
                  >
                    <Sparkles className="w-4 h-4 fill-slate-950" />
                    <span>{lang === 'en' ? 'Generate & Render SVG via AI' : 'توليد وتجسيد الشعار بالذكاء الاصطناعي'}</span>
                  </button>
                )}
              </div>
            )}

            {/* TAB CONTENT: MANUAL IMAGE UPLOAD */}
            {activeTab === 'upload' && (
              <div className="space-y-4 animate-fade-in">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    setUploadError(null);
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      if (file.size > 3 * 1024 * 1024) {
                        setUploadError(lang === 'en' ? 'File is too large. Max 3MB.' : 'حجم الصورة كبير جداً. الحد الأقصى ٣ ميجابايت.');
                        return;
                      }
                      if (!file.type.startsWith('image/')) {
                        setUploadError(lang === 'en' ? 'Only image files allowed.' : 'يسمح برفع صور فقط.');
                        return;
                      }
                      const r = new FileReader();
                      r.onload = () => {
                        if (typeof r.result === 'string') setPreviewLogo(r.result);
                      };
                      r.readAsDataURL(file);
                    }
                  }}
                  className="border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/10 rounded-2xl p-8 hover:cursor-pointer text-center space-y-3 transition-all flex flex-col items-center justify-center group"
                >
                  <div className="p-3.5 bg-slate-100 rounded-2xl text-slate-400 group-hover:text-amber-600 group-hover:bg-amber-100/50 transition-colors">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700">
                      {lang === 'en' ? 'Click to browse or drag and drop image here' : 'انقر هنا لتصفح ملفات جهازك أو قم بسحب وإسقاط الصورة هنا'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {lang === 'en' ? 'Supports PNG, JPG, JPEG or SVG. Maximum file size 3MB.' : 'يدعم صيغ PNG, JPG, JPEG أو رسم متجه SVG (بحد أقصى ٣ ميجابايت)'}
                    </p>
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {uploadError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Technical Note */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-[10px] text-slate-500 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-700 font-bold mb-1">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                    <span>{lang === 'en' ? 'How does this modify invoices?' : 'كيف يظهر شعاري في المعاملات والفواتير؟'}</span>
                  </div>
                  <p className="leading-relaxed">
                    {lang === 'en' 
                      ? 'The custom logo replaces the Sama Al-Mamlakah branding icon at the top of the header in the app navigation and the main home portal. It respects transparent PNG backgrounds.'
                      : 'الشعار الجديد يستبدل شعار سما المملكة الافتراضي على الفور في شريط التنقل العلوي والواجهة الرئيسية ويسهل من طابع الطابعة الورقية السريعة. ننصح برفع شعار بخلفية شفافة PNG.'}
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* LOWER FIXED BUTTON BAR: COMPLETE ACTION OR DISCARD */}
          <div className="flex gap-3 pt-6 border-t border-slate-100 mt-6 justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer transition-all active:scale-99"
            >
              {lang === 'en' ? 'Discard Changes' : 'إلغاء وتجاهل'}
            </button>
            <button
              onClick={handleApplyLogo}
              disabled={isGenerating}
              className="px-6 py-2.5 bg-slate-900 border border-slate-800 text-white hover:bg-slate-850 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50 active:scale-99"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{lang === 'en' ? 'Save as Office Official Logo' : 'إعتماد وحفظ كشعار رسمي'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
