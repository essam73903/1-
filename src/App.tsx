import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Briefcase, Compass, Users, FileText, Truck, Plane, 
  TrendingUp, Coins, Receipt, Calendar, Search, Lock, 
  Plus, Trash2, CheckCircle2, AlertCircle, Download, Film, Image, 
  LogOut, Home, Info, ShieldCheck, Activity, ChevronLeft, 
  PlusCircle, FileSpreadsheet, ListFilter, HelpCircle, PhoneCall, FolderPlus,
  Paperclip, Eye, Upload, Sparkles, Sun, Moon, ArrowUpDown,
  MessageSquare, Send, Clock, Smartphone, Building, Printer,
  Facebook, Instagram, Linkedin, Youtube, Twitter, X, Minimize2, Globe, Menu,
  MapPin, Megaphone, Share2, Check, ExternalLink, Bell, RefreshCw
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

import { 
  Service, BookingRequest, Transaction, AttachedFile,
  DEFAULT_SERVICES, INITIAL_TRANSACTIONS, INITIAL_BOOKINGS,
  Job, Announcement, JobApplication, INITIAL_JOBS, INITIAL_ANNOUNCEMENTS
} from './types';

import PasscodeModal from './components/PasscodeModal';
import InvoiceDetailModal from './components/InvoiceDetailModal';
import BatchPrintModal from './components/BatchPrintModal';
import ServiceParallaxCard from './components/ServiceParallaxCard';
import CheckoutPaymentModal from './components/CheckoutPaymentModal';

// WhatsApp Notification Log Interface
export interface WhatsAppLog {
  id: string;
  bookingId: string;
  clientName: string;
  phoneNumber: string;
  serviceName: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  message: string;
  sentAt: string;
  success: boolean;
  apiResponse: string;
}

// Placeholder/Mock API integration to simulate WhatsApp notifications
const sendPlaceholderWhatsAppAPI = async (phoneNumber: string, message: string) => {
  try {
    // Simulate real-world network latency locally to avoid sandboxed iframe fetch constraints and CORS blocks
    await new Promise(resolve => setTimeout(resolve, 250));
    
    return {
      success: true,
      apiResponse: JSON.stringify({
        status: 'queued',
        messageId: `wa-msg-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        gateway: 'https://api.whatsapp.mock/v1/messages',
        payload: {
          id: Math.floor(Math.random() * 90000) + 10000,
          recipient: phoneNumber,
          message_preview: message.substring(0, 50) + (message.length > 50 ? '...' : '')
        }
      }, null, 2)
    };
  } catch (error: any) {
    const errorMsg = error?.message || 'خطأ غير معروف في الشبكة أو البوابة';
    
    // Log with warning instead of error to prevent triggering platform metric alerts
    console.warn(`[WhatsApp API Warning] Thrown error while sending to ${phoneNumber}. Message: ${errorMsg}`);

    // Separate global log array/variable for telemetry debugging
    if (typeof window !== 'undefined') {
      const exceptionLog = {
        timestamp: new Date().toISOString(),
        recipient: phoneNumber,
        messagePreview: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
        type: 'EXCEPTION_ERROR',
        details: errorMsg,
        stack: error?.stack || null
      };
      (window as any).whatsappErrorLogs = (window as any).whatsappErrorLogs || [];
      (window as any).whatsappErrorLogs.push(exceptionLog);
    }

    return {
      success: false,
      apiResponse: errorMsg
    };
  }
};

// Import image assets to allow proper bundling by Vite
// @ts-ignore
import makkahSunriseImg from './assets/images/makkah_sunrise_1779229201653.png';
// @ts-ignore
import makkahSunsetImg from './assets/images/makkah_bg_1779228945233.png';
// @ts-ignore
import makkahNightImg from './assets/images/makkah_night_1779229182943.png';
// @ts-ignore
import samaLogoImg from './assets/images/sama_logo_1779229636162.png';

// Helper to normalize attached files for a booking request (supports single and multiple files)
const getBookingFiles = (b: BookingRequest): Array<{ name: string; data: string; size: string }> => {
  if (b.attachedFiles && b.attachedFiles.length > 0) {
    return b.attachedFiles;
  }
  if (b.attachedFileName) {
    return [{
      name: b.attachedFileName,
      data: b.attachedFileData || '',
      size: b.attachedFileSize || ''
    }];
  }
  return [];
};

const AVAILABLE_ICONS = [
  // --- المستندات والمعاملات ---
  { value: "FileText", label: "📄 ملف مستند نصي (FileText)" },
  { value: "File", label: "📄 ملف مستقل (File)" },
  { value: "Files", label: "📚 ملفات متعددة ومرفقات (Files)" },
  { value: "FileSpreadsheet", label: "📊 جدول بيانات مالي أو إحصائي (FileSpreadsheet)" },
  { value: "FileCheck", label: "✅ ملف معتمد ومفحوص (FileCheck)" },
  { value: "FileSignature", label: "✍️ توقيع إلكتروني وعقد (FileSignature)" },
  { value: "Clipboard", label: "📋 حافظة متابعة مهام (Clipboard)" },
  { value: "ClipboardList", label: "📋 قائمة مراجعات متكاملة (ClipboardList)" },
  { value: "ClipboardCheck", label: "✔️ استمارة مكتملة ومدققة (ClipboardCheck)" },
  { value: "Folder", label: "📁 مجلد مستندات (Folder)" },
  { value: "FolderOpen", label: "📂 مجلد مفتوح (FolderOpen)" },
  { value: "FolderPlus", label: "📁 مجلد معاملة جديدة (FolderPlus)" },
  { value: "Archive", label: "🗄️ الأرشيف والحفظ التاريخي (Archive)" },
  { value: "BookOpen", label: "📖 دليل شروط أو كتيب (BookOpen)" },
  { value: "Scroll", label: "📜 وثيقة رسمية أو صك شرعي (Scroll)" },

  // --- الأعمال والاستقدام والخدمات الحكومية ---
  { value: "Briefcase", label: "💼 أعمال، تأشيرات تجارية واستقدام (Briefcase)" },
  { value: "Users", label: "👥 عائلات، أفراد ومجموعات مستفيدة (Users)" },
  { value: "User", label: "👤 عميل فردي (User)" },
  { value: "UserPlus", label: "➕ إضافة تابع أو مستفيد جديد (UserPlus)" },
  { value: "UserCheck", label: "✔️ اعتماد وتأهيل مستخدم (UserCheck)" },
  { value: "Building", label: "🏛️ مبنى بلدي أو إدارة حكومية (Building)" },
  { value: "Building2", label: "🏢 منشأة تجارية أو شركة (Building2)" },
  { value: "Landmark", label: "🏛️ قطاع مصرفي وبنوك مالية (Landmark)" },
  { value: "Compass", label: "🧭 توجيه وإرشاد معاملات (Compass)" },
  { value: "Globe", label: "🌐 خدمات دولية وسفر خارجي (Globe)" },
  { value: "MapPin", label: "📍 موقع جغرافي وفروع المكتب (MapPin)" },
  { value: "Map", label: "🗺️ خريطة بلدي ومخطط فروع (Map)" },

  // --- السفر واللوجستيات والنقل ---
  { value: "Plane", label: "✈️ طيران وسفر خارجي للأفراد (Plane)" },
  { value: "Truck", label: "🚚 خدمات نقل بري، بضائع وشحن لوجستي (Truck)" },
  { value: "Car", label: "🚗 ليموزين مواصلات وسيارات (Car)" },
  { value: "Ship", label: "🚢 شحن بحري وتأشيرات بحارة (Ship)" },
  { value: "Navigation", label: "🧭 إبحار وتجوال وتوجيه (Navigation)" },

  // --- المواعيد والجدولة والتوقيت ---
  { value: "Calendar", label: "📅 حجز موعد وجدولة مراجعات (Calendar)" },
  { value: "Clock", label: "⏰ توقيت وتتبع فترات زمنية (Clock)" },
  { value: "Hourglass", label: "⏳ معاملة قيد الانتظار أو الإجراء (Hourglass)" },
  { value: "Bell", label: "🔔 إشعارات وتنبيهات هامة (Bell)" },
  { value: "BellRing", label: "🕭 جرس إشعار عاجل (BellRing)" },
  { value: "Sun", label: "☀️ مواعيد نهارية (Sun)" },
  { value: "Moon", label: "🌙 عمرة وحج ومواسم دينية (Moon)" },

  // --- المالية، المدفوعات والضرائب ---
  { value: "Coins", label: "💰 أتعاب ورسوم حكومية (Coins)" },
  { value: "CreditCard", label: "💳 سداد إلكتروني ورسوم دفع (CreditCard)" },
  { value: "Wallet", label: "👛 محفظة مالية واسترجاع مدفوعات (Wallet)" },
  { value: "Receipt", label: "🧾 فاتورة سداد ورسوم ضريبية (Receipt)" },
  { value: "DollarSign", label: "💵 عملات نقدية وصرف ومصروفات (DollarSign)" },
  { value: "Percent", label: "٪ نسبة خصم وضريبة مضافة (Percent)" },
  { value: "TrendingUp", label: "📈 مؤشرات نمو وأرباح (TrendingUp)" },
  { value: "TrendingDown", label: "📉 انخفاض مالي خسائر وأوزان (TrendingDown)" },

  // --- التواصل والدعم الفني والأدوات والأمان ---
  { value: "PhoneCall", label: "📞 اتصال واستفسار هاتفي (PhoneCall)" },
  { value: "Phone", label: "☎️ هاتف خدمة عملاء (Phone)" },
  { value: "PhoneForwarded", label: "📞 تحويل المكالمات (PhoneForwarded)" },
  { value: "MessageSquare", label: "💬 إشعار واتساب وتواصل كتابي (MessageSquare)" },
  { value: "MessagesSquare", label: "💬 نقاشات ومحادثات متعددة (MessagesSquare)" },
  { value: "MessageCircle", label: "💬 دردشة فورية فردية (MessageCircle)" },
  { value: "Send", label: "✉️ إرسال رسائل أو معاملات (Send)" },
  { value: "Mail", label: "📧 بريد إلكتروني ومراسلات رسمية (Mail)" },
  { value: "HelpCircle", label: "❓ دعم فني وإجابة استفسارات (HelpCircle)" },
  { value: "ShieldCheck", label: "🛡️ ضمان وأمان وتوثيق ومصادقة (ShieldCheck)" },
  { value: "Lock", label: "🔒 خصوصية وخدمات سرية (Lock)" },
  { value: "Unlock", label: "🔓 معاملات منتهية الصلاحية (Unlock)" },
  { value: "Key", label: "🔑 حقوق وصول وتراخيص (Key)" },
  { value: "KeyRound", label: "🔑 تراخيص أمان رقمية (KeyRound)" },
  { value: "Eye", label: "👁️ معاينة وتدقيق مستندات (Eye)" },
  { value: "Info", label: "ℹ️ دليل إرشادي وتفاصيل المعاملة (Info)" },
  { value: "AlertTriangle", label: "⚠️ شروط وضوابط هامة (AlertTriangle)" },
  { value: "AlertCircle", label: "🔴 تنبيه مهم وعقوبة (AlertCircle)" },
  { value: "CheckCircle2", label: "🟢 مراجعة واكتمال تام مقنع (CheckCircle2)" },
  { value: "Printer", label: "🖨️ طباعة تراخيص وتقارير فواتير (Printer)" },
  { value: "Laptop", label: "💻 جهاز حاسب آلي وخِدْمات إلكترونية (Laptop)" },
  { value: "Smartphone", label: "📱 تطبيق جوال وتفعيل حساب (Smartphone)" },
  { value: "Settings", label: "⚙️ إعدادات وخيارات متقدمة (Settings)" },
  { value: "Wrench", label: "🔧 خدمات صيانة ودعم إجرائي (Wrench)" },
  { value: "Sparkles", label: "✨ خدمات ذهبية ومميزات (Sparkles)" },
  { value: "Star", label: "⭐ تقييم جودة الخدمة ورضا العملاء (Star)" },
  { value: "Heart", label: "❤️ باقات رعاية وعروض محبة للعملاء (Heart)" }
];

export default function App() {
  // --- STATE DECLARATIONS ---
  const [lang, setLang] = useState<'ar' | 'en'>(() => {
    return (localStorage.getItem('sm_lang') as 'ar' | 'en') || 'ar';
  });

  const [exchangeRates, setExchangeRates] = useState<{ [key: string]: number }>({
    SAR: 1.0,
    USD: 0.2666,
    EUR: 0.2455,
  });
  const [isFetchingRates, setIsFetchingRates] = useState<boolean>(false);
  const [lastRatesUpdate, setLastRatesUpdate] = useState<string>('2026-06-01 12:00:00');

  const [newSrvBaseCurrency, setNewSrvBaseCurrency] = useState<'SAR' | 'USD' | 'EUR'>('SAR');
  const [newSrvBaseGovFee, setNewSrvBaseGovFee] = useState<number>(0);
  const [newSrvBaseOfficeFee, setNewSrvBaseOfficeFee] = useState<number>(0);

  const [newSrvGovFee, setNewSrvGovFee] = useState<number>(0);
  const [newSrvOfficeFee, setNewSrvOfficeFee] = useState<number>(0);

  const convertToSari = (amt: number, fromCurr: 'SAR' | 'USD' | 'EUR') => {
    if (fromCurr === 'SAR') return amt;
    const rate = exchangeRates[fromCurr];
    if (!rate) return amt * (fromCurr === 'USD' ? 3.75 : 4.08); // fallback
    return amt / rate;
  };

  const convertFromSari = (amt: number, toCurr: 'SAR' | 'USD' | 'EUR') => {
    if (toCurr === 'SAR') return amt;
    const rate = exchangeRates[toCurr];
    if (!rate) return amt * (toCurr === 'USD' ? 0.2666 : 0.2455); // fallback
    return amt * rate;
  };

  const toggleLanguage = () => {
    const nextLang = lang === 'ar' ? 'en' : 'ar';
    setLang(nextLang);
    localStorage.setItem('sm_lang', nextLang);
  };

  const t = (key: string) => {
    const dict: Record<'ar' | 'en', Record<string, string>> = {
      ar: {
        appName: 'مكتب سما المملكة',
        appSubtitle: 'الخدمات المتكاملة',
        home: 'الرئيسية',
        track: 'الاستعلام عن طلب',
        adminPanel: 'لوحة التحكم والعمليات',
        portalTitleDefault: 'البوابة الرسمية والذكية للمستفيدين',
        heroTitle: 'ننجز معاملاتك بكل ثقة وكفاءة',
        heroSubtitle: 'سجل الحسابات والتعقيب متصل بالبوابة الموحدة للمملكة',
        servicesTitle: 'دليل الخدمات والتكاليف والرسوم',
        servicesDesc: 'تحديد دقيق وموثق للتكاليف الإدارية للمكتب والرسوم التابعة للدولة قبل البدء بالمعاملة.',
        taxUpdate: 'محدثة حسب اللوائح الضريبية لعام 2026 (15%)',
        searchPlaceholder: 'ابحث عن الخدمة التي تحتاجها...',
        allCategories: 'كل الخدمات',
        sortNameAsc: 'الاسم (أ - ي)',
        sortNameDesc: 'الاسم (ي - أ)',
        sortPriceAsc: 'السعر الإجمالي (تصاعدي)',
        sortPriceDesc: 'السعر الإجمالي (تنازلي)',
        submitRequest: 'استمارة تقديم حجز معاملة رقمية جديدة',
        submitRequestDesc: 'يرجى تعبئة الحقول أدناه لتأكيد حجز الخدمة، وسيقوم فريق المختصين بمراجعتها وإصدار الفاتورة.',
        clientNameLabel: 'اسم العميل الكامل (الرباعي):',
        clientNamePlaceholder: 'مثلاً: عبد الله بن محمد العتيبي',
        phoneLabel: 'رقم الهاتف الجوال المقترن بالواتساب:',
        phonePlaceholder: '05xxxxxxxx',
        selectedServiceLabel: 'الخدمة المختارة للحجز الإجرائي:',
        attachmentLabel: 'المستندات والوثائق الثبوتية الداعمة (اختياري - مسموح بملفات متعددة):',
        dropfiles: 'اسحب وأسقط الملفات هنا، أو انقر للتصفح',
        fileLimit: 'الحد الأقصى للملف الواحد: 10 ميجا الحجم الإجمالي المسموح للطلب 35 ميجا.',
        notesLabel: 'ملاحظات وتفاصيل إضافية عن المعاملة والطلبات المحددة:',
        notesPlaceholder: 'يرجى كتابة أي تفاصيل، شروط، أو متمتطلبات خاصة بالخدمة هنا لتسهيل وسرعة الإنجاز...',
        confirmSend: 'تأكيد الإرسال والترحيل لمكتب سما المملكة',
        sending: 'جاري الإرسال...',
        requestAddedSuccess: 'تم إرسال طلبك بنجاح لمكتب سما المملكة الرقم المرجعي: ',
        footerTitle: 'مكتب سما المملكة للخدمات المتكاملة',
        footerDesc: 'المنصة الموحدة الذكية التابعة لمكتب سما المملكة للخدمات وتخليص المعاملات الإلكترونية الحكومية.',
        allRightsReserved: 'جميع الحقوق محفوظة لمكتب سما المملكة للخدمات المتكاملة © 2026',
        saudiVision: 'تحت مظلة المبادرات الرقمية لرؤية المملكة 2030',
        trackTitle: 'استعلم وتتبع حالة معاملتك فوراً',
        trackDesc: 'أدخل رقم جوالك المسجل للبحث عن حالة كافة الحجوزات السابقة والمعاملات قيد الإجراء والاطلاع على تفاصيل الفاتورة.',
        phoneSearchLabel: 'رقم جوال المستفيد المسجل بالطلب:',
        searchBtn: 'ابحث الآن بالأرشيف المالي',
        noResultsTitle: 'لا توجد معاملات مسجلة',
        noResultsDesc: 'الرقم الذي أدخلته لا يطابق أي معاملة حالية في أرشيف مكتب سما المملكة.',
        orderStatus: 'حالة المعاملة',
        invoiceDetail: 'تفاصيل الفاتورة الرسمية',
        status_pending: 'قيد الانتظار والتدقيق',
        status_processing: 'قيد الإجراء والتعقيب',
        status_completed: 'مكتملة وجاهزة للتسليم',
        status_cancelled: 'ملغاة أو مرفوضة',
        viewInvoice: 'عرض مستند الفاتورة',
        close: 'إغلاق',
        localTimePrefix: 'التوقيت المحلي لإنهاء المعاملات:',
        currentUserPrefix: 'المستخدم الحالي للفوترة:'
      },
      en: {
        appName: 'Sama Al-Mamlakah Office',
        appSubtitle: 'Integrated Services',
        home: 'Home',
        track: 'Track Request',
        adminPanel: 'Admin Panel & Operations',
        portalTitleDefault: 'Official & Smart Portal for Beneficiaries',
        heroTitle: 'We Process Your Transactions with Complete Trust & Efficiency',
        heroSubtitle: 'Accounting & tracking records connected to the Unified Saudi Portal',
        servicesTitle: 'Services Guide, Costs & Fees',
        servicesDesc: 'Accurate and documented specification of the office administrative costs and government state fees before starting.',
        taxUpdate: 'Updated to 2026 National Tax Regulations (15%)',
        searchPlaceholder: 'Search for the service you need...',
        allCategories: 'All Services',
        sortNameAsc: 'Name (A - Z)',
        sortNameDesc: 'Name (Z - A)',
        sortPriceAsc: 'Total Price (Low to High)',
        sortPriceDesc: 'Total Price (High to Low)',
        submitRequest: 'New Digital Transaction Booking Form',
        submitRequestDesc: 'Please fill in the fields below to confirm the service booking. Our specialists will review it and issue your invoice.',
        clientNameLabel: 'Client Full Name (Quadruple):',
        clientNamePlaceholder: 'e.g., Abdullah bin Mohammed Al-Otaibi',
        phoneLabel: 'Mobile Phone Number (associated with WhatsApp):',
        phonePlaceholder: '05xxxxxxxx',
        selectedServiceLabel: 'Selected Service for Procedural Booking:',
        attachmentLabel: 'Supported Identification Documents (Optional - Multiple allowed):',
        dropfiles: 'Drag & drop files here, or click to browse',
        fileLimit: 'Max file size: 10MB. Maximum total size allowed is 35MB.',
        notesLabel: 'Additional notes & specific requests for the transaction:',
        notesPlaceholder: 'Please write any details, terms, or specific requirements here to facilitate quick processing...',
        confirmSend: 'Confirm Submission & Send to Sama Al-Mamlakah Office',
        sending: 'Submitting...',
        requestAddedSuccess: 'Your request has been submitted successfully to Sama Al-Mamlakah! Reference Number: ',
        footerTitle: 'Sama Al-Mamlakah Office for Integrated Services',
        footerDesc: 'Unified smart platform affiliated with Sama Al-Mamlakah for government e-services and clearance.',
        allRightsReserved: 'All rights reserved to Sama Al-Mamlakah Office for Integrated Services © 2026',
        saudiVision: 'Under the umbrella of Saudi Vision 2030 digital initiatives',
        trackTitle: 'Inquire & Track Your Transaction Instantly',
        trackDesc: 'Enter your registered mobile number to search for past bookings, active transactions, and view invoice details.',
        phoneSearchLabel: 'Registered mobile number of the beneficiary:',
        searchBtn: 'Search Financial Archive Now',
        noResultsTitle: 'No Transactions Found',
        noResultsDesc: 'The phone number you entered does not match any transactions in the archives of Sama Al-Mamlakah.',
        orderStatus: 'Transaction Status',
        invoiceDetail: 'Official Invoice Details',
        status_pending: 'Pending Administrative Verification',
        status_processing: 'In Progress & Government Follow-up',
        status_completed: 'Completed & Ready for Delivery',
        status_cancelled: 'Cancelled or Rejected',
        viewInvoice: 'View Invoice Document',
        close: 'Close',
        localTimePrefix: 'Local time for transactions processing:',
        currentUserPrefix: 'Current billing user:'
      }
    };
    return dict[lang][key] || key;
  };

  const [selectedRegionTab, setSelectedRegionTab] = useState<'all' | 'asia' | 'africa' | 'europe_americas'>('all');

  const getWelcomeText = () => {
    if (lang === 'en') {
      return 'Welcome to Sama Al-Mamlakah Office Platform for integrated services and government electronic transactions clearance. We are pleased to serve you and execute all your transactions with complete precision, safety, and speed under the supervision of elite specialists and professionals.';
    }
    return welcomeMessage;
  };

  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem('sm_services');
    let loaded: Service[] = saved ? JSON.parse(saved) : DEFAULT_SERVICES;
    
    // Check if we already applied the 10% increase to visa services
    const migKey = 'sm_visa_fees_raised_v2';
    if (!localStorage.getItem(migKey)) {
      loaded = loaded.map(s => {
        if (s.category === 'visa') {
          return {
            ...s,
            govFee: Math.round(s.govFee * 1.1),
            officeFee: Math.round(s.officeFee * 1.1)
          };
        }
        return s;
      });
      localStorage.setItem(migKey, 'true');
      localStorage.setItem('sm_services', JSON.stringify(loaded));
    }

    // Modern distinct icons automatic safety upgrader for users on current browser session
    let iconsMigrated = false;
    loaded = loaded.map(s => {
      if (s.id === 'srv-2' && s.icon === 'Compass') {
        iconsMigrated = true;
        return { ...s, icon: 'Moon' };
      }
      if (s.id === 'srv-4' && s.icon === 'FileText') {
        iconsMigrated = true;
        return { ...s, icon: 'Building' };
      }
      return s;
    });

    if (iconsMigrated) {
      localStorage.setItem('sm_services', JSON.stringify(loaded));
    }

    return loaded;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('sm_transactions');
    let loaded: Transaction[] = saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    
    // Check if we should migrate pre-populated transactions too
    const migKeyTx = 'sm_visa_tx_fees_raised_v2';
    if (!localStorage.getItem(migKeyTx)) {
      loaded = loaded.map(t => {
        if (t.serviceName === 'تأشيرة عمل' && t.govFee === 2000 && t.officeFee === 500) {
          const govFee = 2200;
          const officeFee = 550;
          const tax = 82.5;
          const total = 2832.5;
          return { ...t, govFee, officeFee, tax, total };
        }
        if (t.serviceName === 'تأشيرة عمرة وحج' && t.govFee === 300 && t.officeFee === 150) {
          const govFee = 330;
          const officeFee = 165;
          const tax = 24.75;
          const total = 519.75;
          return { ...t, govFee, officeFee, tax, total };
        }
        return t;
      });
      localStorage.setItem(migKeyTx, 'true');
      localStorage.setItem('sm_transactions', JSON.stringify(loaded));
    }
    return loaded;
  });

  const [bookings, setBookings] = useState<BookingRequest[]>(() => {
    const saved = localStorage.getItem('sm_bookings');
    return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
  });

  // Dynamic service categories
  const [categories, setCategories] = useState<{ id: string; nameAr: string; color: string }[]>(() => {
    const DEFAULT_CATEGORIES = [
      { id: 'visa', nameAr: 'خدمات تأشيرات وسفر', color: 'purple' },
      { id: 'gov', nameAr: 'تعقيب ومراجعة دائرية', color: 'amber' },
      { id: 'transport', nameAr: 'نقل ومواصلات وشحن', color: 'blue' },
      { id: 'other', nameAr: 'خدمات عامة مخصصة', color: 'emerald' }
    ];
    const saved = localStorage.getItem('sm_service_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  useEffect(() => {
    localStorage.setItem('sm_service_categories', JSON.stringify(categories));
  }, [categories]);

  // Dynamic service sub-categories
  const [subCategories, setSubCategories] = useState<{ id: string; parentId: string; nameAr: string }[]>(() => {
    const DEFAULT_SUBCATEGORIES = [
      { id: 'visa-work', parentId: 'visa', nameAr: 'تأشيرات العمل والاستقدام' },
      { id: 'visa-hajj', parentId: 'visa', nameAr: 'الحج والعمرة والزيارة الدينية' },
      { id: 'visa-visit', parentId: 'visa', nameAr: 'الزيارات العائلية والشخصية' },
      { id: 'gov-labor', parentId: 'gov', nameAr: 'وزارة الموارد البشرية والعمل' },
      { id: 'gov-jawazat', parentId: 'gov', nameAr: 'الجوازات والإقامة والرحلات' },
      { id: 'gov-municipality', parentId: 'gov', nameAr: 'خدمات البلدية والدفاع المدني' },
      { id: 'transport-land', parentId: 'transport', nameAr: 'شحن ونقل بري ولوجستيات' },
      { id: 'transport-air', parentId: 'transport', nameAr: 'حجز ومتابعة تذاكر وشحن جوي' }
    ];
    const saved = localStorage.getItem('sm_service_subcategories');
    return saved ? JSON.parse(saved) : DEFAULT_SUBCATEGORIES;
  });

  useEffect(() => {
    localStorage.setItem('sm_service_subcategories', JSON.stringify(subCategories));
  }, [subCategories]);

  // Handle addition of custom sub-categories inside Admin Services tab
  const [newSubCatId, setNewSubCatId] = useState('');
  const [newSubCatParentId, setNewSubCatParentId] = useState('visa');
  const [newSubCatNameAr, setNewSubCatNameAr] = useState('');

  // Handle addition of custom categories form inside Admin Services tab
  const [newCatId, setNewCatId] = useState('');
  const [newCatNameAr, setNewCatNameAr] = useState('');
  const [newCatColor, setNewCatColor] = useState('indigo');

  const getCategoryStyles = (catId: string) => {
    const cat = categories.find(c => c.id === catId) || { id: catId, nameAr: catId, color: 'emerald' };
    const color = cat.color || 'emerald';
    
    const map: { [key: string]: { badge: string; bg: string; icon: string } } = {
      purple: {
        badge: "bg-purple-50 text-purple-700 border-purple-100",
        bg: "bg-purple-500",
        icon: "bg-purple-50 border-purple-100 text-purple-700"
      },
      amber: {
        badge: "bg-amber-50 text-amber-700 border-amber-100",
        bg: "bg-amber-500",
        icon: "bg-amber-50 border-amber-100 text-amber-700"
      },
      blue: {
        badge: "bg-blue-50 text-blue-700 border-blue-100",
        bg: "bg-blue-500",
        icon: "bg-blue-50 border-blue-100 text-blue-700"
      },
      emerald: {
        badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
        bg: "bg-emerald-500",
        icon: "bg-emerald-50 border-emerald-100 text-emerald-700"
      },
      indigo: {
        badge: "bg-indigo-50 text-indigo-700 border-indigo-100",
        bg: "bg-indigo-500",
        icon: "bg-indigo-50 border-indigo-100 text-indigo-700"
      },
      rose: {
        badge: "bg-rose-50 text-rose-700 border-rose-100",
        bg: "bg-rose-500",
        icon: "bg-rose-50 border-rose-100 text-rose-700"
      },
      cyan: {
        badge: "bg-cyan-50 text-cyan-700 border-cyan-100",
        bg: "bg-cyan-500",
        icon: "bg-cyan-50 border-cyan-100 text-cyan-700"
      },
      orange: {
        badge: "bg-orange-50 text-orange-700 border-orange-100",
        bg: "bg-orange-500",
        icon: "bg-orange-50 border-orange-100 text-orange-700"
      },
      slate: {
        badge: "bg-slate-50 text-slate-700 border-slate-100",
        bg: "bg-slate-500",
        icon: "bg-slate-50 border-slate-100 text-slate-705"
      }
    };
    return map[color] || map.emerald;
  };

  const getCategoryName = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.nameAr : catId;
  };

  const getSubCategoryName = (subCatId?: string) => {
    if (!subCatId) return '';
    const sub = subCategories.find(sc => sc.id === subCatId);
    return sub ? sub.nameAr : '';
  };

  // Current tab: 'home' | 'track' | 'jobs' | 'admin'
  const [activeTab, setActiveTab] = useState<'home' | 'track' | 'jobs' | 'admin'>('home');

  // Mobile navigation menu toggle state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // News & Regulations Summary Modal State
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);

  // Online/Offline status check helper
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Real-time live date/time state to ensure same day dynamic accuracy
  const [liveTime, setLiveTime] = useState(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      setLiveTime(`${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchRates = async () => {
      setIsFetchingRates(true);
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/SAR');
        if (res.ok) {
          const data = await res.json();
          if (data && data.rates && isMounted) {
            setExchangeRates({
              SAR: 1.0,
              USD: data.rates.USD || 0.2666,
              EUR: data.rates.EUR || 0.2455,
            });
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const hh = String(now.getHours()).padStart(2, '0');
            const min = String(now.getMinutes()).padStart(2, '0');
            const ss = String(now.getSeconds()).padStart(2, '0');
            setLastRatesUpdate(`${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`);
          }
        }
      } catch (err) {
        console.error("Error fetching live rates", err);
      } finally {
        if (isMounted) setIsFetchingRates(false);
      }
    };
    
    fetchRates();
    const rateInterval = setInterval(fetchRates, 300000); // 5 mins
    return () => {
      isMounted = false;
      clearInterval(rateInterval);
    };
  }, []);

  // Sync multi-currency inputs reactively into standard SAR fees for downstream calculations
  useEffect(() => {
    const convertedOffice = convertToSari(newSrvBaseOfficeFee, newSrvBaseCurrency);
    const convertedGov = convertToSari(newSrvBaseGovFee, newSrvBaseCurrency);
    setNewSrvOfficeFee(Number(convertedOffice.toFixed(2)));
    setNewSrvGovFee(Number(convertedGov.toFixed(2)));
  }, [newSrvBaseOfficeFee, newSrvBaseGovFee, newSrvBaseCurrency, exchangeRates]);
  
  // Admin Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('sm_admin_logged') === 'true';
  });
  const [showPasscode, setShowPasscode] = useState(false);

  // Home Page Form states (initialized from local storage draft if available)
  const [clientName, setClientName] = useState(() => {
    try {
      const saved = localStorage.getItem('sm_draft_booking_form');
      if (saved) {
        return JSON.parse(saved).clientName || '';
      }
    } catch (_) {}
    return '';
  });
  const [clientPhone, setClientPhone] = useState(() => {
    try {
      const saved = localStorage.getItem('sm_draft_booking_form');
      if (saved) {
        return JSON.parse(saved).clientPhone || '';
      }
    } catch (_) {}
    return '';
  });
  const [selectedServiceId, setSelectedServiceId] = useState(() => {
    try {
      const saved = localStorage.getItem('sm_draft_booking_form');
      if (saved) {
        return JSON.parse(saved).selectedServiceId || '';
      }
    } catch (_) {}
    return '';
  });
  const [clientNotes, setClientNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('sm_draft_booking_form');
      if (saved) {
        return JSON.parse(saved).clientNotes || '';
      }
    } catch (_) {}
    return '';
  });

  // Keep references to continuous state values to bypass interval static closures
  const draftStateRef = useRef({ clientName, clientPhone, selectedServiceId, clientNotes });
  
  useEffect(() => {
    draftStateRef.current = { clientName, clientPhone, selectedServiceId, clientNotes };
  }, [clientName, clientPhone, selectedServiceId, clientNotes]);

  // Periodic autosave to local storage every 5 seconds
  useEffect(() => {
    const draftInterval = setInterval(() => {
      const { clientName: name, clientPhone: phone, selectedServiceId: srvId, clientNotes: notes } = draftStateRef.current;
      // If the user has entered some draft information, persist it
      if (name.trim() || phone.trim() || srvId || notes.trim()) {
        localStorage.setItem('sm_draft_booking_form', JSON.stringify({
          clientName: name,
          clientPhone: phone,
          selectedServiceId: srvId,
          clientNotes: notes
        }));
      }
    }, 5000);

    return () => clearInterval(draftInterval);
  }, []);
  const [submissionFeedback, setSubmissionFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  // Client requests search status
  const [searchPhone, setSearchPhone] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [trackedRequests, setTrackedRequests] = useState<BookingRequest[]>([]);

  // Selected Transaction for printable Invoice view
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [directPrintActive, setDirectPrintActive] = useState(false);
  const [invoiceInitialPdfActive, setInvoiceInitialPdfActive] = useState(false);

  // Batch selection states for multi-print ledger utility
  const [selectedBatchTxIds, setSelectedBatchTxIds] = useState<string[]>([]);
  const [isBatchPrintOpen, setIsBatchPrintOpen] = useState(false);

  // Saudi Labor News from Search Grounding API
  const [laborNews, setLaborNews] = useState<string>('');
  const [laborNewsSources, setLaborNewsSources] = useState<{title: string; uri: string}[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState<boolean>(false);
  const [newsError, setNewsError] = useState<string | null>(null);

  // Admin Inner-Tab: 'ledger' | 'requests' | 'services' | 'stats' | 'whatsapp' | 'jobs'
  const [adminTab, setAdminTab] = useState<'stats' | 'requests' | 'ledger' | 'services' | 'whatsapp' | 'jobs'>('stats');

  // New Transaction Form State (Admin)
  const [txClientName, setTxClientName] = useState('');
  const [txServiceId, setTxServiceId] = useState(DEFAULT_SERVICES[0]?.id || '');
  const [txGovFee, setTxGovFee] = useState<number>(DEFAULT_SERVICES[0]?.govFee || 0);
  const [txOfficeFee, setTxOfficeFee] = useState<number>(DEFAULT_SERVICES[0]?.officeFee || 0);
  const [txPaymentCurrency, setTxPaymentCurrency] = useState<'SAR' | 'USD' | 'EUR'>('SAR');
  const [txNotes, setTxNotes] = useState('');

  // New Dynamic Service Form State (Admin)
  const [newSrvName, setNewSrvName] = useState('');
  const [newSrvDesc, setNewSrvDesc] = useState('');
  const [newSrvCategory, setNewSrvCategory] = useState<string>('visa');
  const [newSrvSubCategory, setNewSrvSubCategory] = useState<string>('');

  const [newSrvIcon, setNewSrvIcon] = useState('PlusCircle');
  const [iconSearchNew, setIconSearchNew] = useState('');
  const [iconSearchEdit, setIconSearchEdit] = useState('');
  const [newSrvAdditionalFees, setNewSrvAdditionalFees] = useState<{ id: string; name: string; amount: number }[]>([]);
  const [tempFeeNameNew, setTempFeeNameNew] = useState('');
  const [tempFeeAmountNew, setTempFeeAmountNew] = useState<number | ''>('');
  const [tempFeeNameEdit, setTempFeeNameEdit] = useState('');
  const [tempFeeAmountEdit, setTempFeeAmountEdit] = useState<number | ''>('');
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceToDeleteCheck, setServiceToDeleteCheck] = useState<Service | null>(null);
  const [showCannotDeleteAlert, setShowCannotDeleteAlert] = useState(false);

  // Triggering visual popup on service cards details
  const [infoPopupService, setInfoPopupService] = useState<Service | null>(null);

  // Client PDF Attachment state variables
  const [attachedFileName, setAttachedFileName] = useState('');
  const [attachedFileData, setAttachedFileData] = useState('');
  const [attachedFileSize, setAttachedFileSize] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [uploadProgresses, setUploadProgresses] = useState<{ [filename: string]: { progress: number; size: string } }>({});
  const [selectedViewBooking, setSelectedViewBooking] = useState<BookingRequest | null>(null);
  const [previewFile, setPreviewFile] = useState<{ name: string; data: string; size: string } | null>(null);

  // Service management filtering & sorting state
  const [servicesSearchQuery, setServicesSearchQuery] = useState('');
  const [servicesFilterCategory, setServicesFilterCategory] = useState<string>('all');
  const [servicesSortKey, setServicesSortKey] = useState<'name-asc' | 'name-desc' | 'total-asc' | 'total-desc'>('name-asc');
  const [visibleServicesCount, setVisibleServicesCount] = useState<number>(10);

  // Public service exploration filters
  const [homeFilterCategory, setHomeFilterCategory] = useState<string>('all');
  const [homeFilterSubCategory, setHomeFilterSubCategory] = useState<string>('all');

  // Requests manager advanced filtering and sorting state
  const [reqFilterServiceId, setReqFilterServiceId] = useState<string>('all');
  const [reqFilterPaymentStatus, setReqFilterPaymentStatus] = useState<string>('all');
  const [reqFilterDate, setReqFilterDate] = useState<string>('all'); // 'all' | 'today' | '7days' | '30days' | 'custom'
  const [reqFilterStartDate, setReqFilterStartDate] = useState<string>('');
  const [reqFilterEndDate, setReqFilterEndDate] = useState<string>('');
  const [reqSearchPhoneOrName, setReqSearchPhoneOrName] = useState<string>('');
  const [reqSortKey, setReqSortKey] = useState<string>('date-desc'); // 'date-desc' | 'date-asc' | 'name-asc'
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState('');

  // Welcome Message States
  const [welcomeMessage, setWelcomeMessage] = useState<string>(() => {
    return localStorage.getItem('sm_welcome_msg') || 'أهلاً ومرحباً بكم في منصة مكتب سما المملكة للخدمات المتكاملة وتخليص المعاملات الإلكترونية الحكومية. نسعد بخدمتكم وتخليص كافة معاملاتكم بكل دقة وأمان وسرعة بإشراف نخبة من المختصين والمهنيين.';
  });
  const [welcomeEditor, setWelcomeEditor] = useState<string>(() => {
    return localStorage.getItem('sm_welcome_msg') || 'أهلاً ومرحباً بكم في منصة مكتب سما المملكة للخدمات المتكاملة وتخليص المعاملات الإلكترونية الحكومية. نسعد بخدمتكم وتخليص كافة معاملاتكم بكل دقة وأمان وسرعة بإشراف نخبة من المختصين والمهنيين.';
  });
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Customizable Status Update messages for bookings
  const [statusMsgPending, setStatusMsgPending] = useState<string>(() => {
    return localStorage.getItem('sm_status_msg_pending') || 'قيد الانتظار لمراجعة الإدارة - نعتز بثقتكم وسنتولى معالجتها حالاً.';
  });
  const [statusMsgProcessing, setStatusMsgProcessing] = useState<string>(() => {
    return localStorage.getItem('sm_status_msg_processing') || 'تحت المعالجة الإجرائية الآن - يتم تنفيذ المعاملة ومراجعة الجهات المختصة.';
  });
  const [statusMsgCompleted, setStatusMsgCompleted] = useState<string>(() => {
    return localStorage.getItem('sm_status_msg_completed') || 'مكتملة ومستند الفاتورة جاهز - نسعد دائماً برضاكم التام.';
  });
  const [statusMsgCancelled, setStatusMsgCancelled] = useState<string>(() => {
    return localStorage.getItem('sm_status_msg_cancelled') || 'ملغية - نرجو التواصل مع الإدارة للاستفسار والتحقق.';
  });
  const [saveSuccessStatusMsg, setSaveSuccessStatusMsg] = useState(false);

  // Compute the filtered list of bookings based on advanced filtering criteria (date, service type, payment status, name/phone search)
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // 1. Service Type Filter
      if (reqFilterServiceId !== 'all' && b.serviceId !== reqFilterServiceId) {
        return false;
      }

      // 2. Payment Status Filter
      if (reqFilterPaymentStatus !== 'all' && (b.paymentStatus || 'unpaid') !== reqFilterPaymentStatus) {
        return false;
      }

      // 3. Date Filter
      if (reqFilterDate !== 'all') {
        const bDate = new Date(b.date);
        const bTime = bDate.getTime();
        
        if (reqFilterDate === 'today') {
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          if (bTime < startOfToday.getTime()) return false;
        } else if (reqFilterDate === '7days') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          sevenDaysAgo.setHours(0, 0, 0, 0);
          if (bTime < sevenDaysAgo.getTime()) return false;
        } else if (reqFilterDate === '30days') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          thirtyDaysAgo.setHours(0, 0, 0, 0);
          if (bTime < thirtyDaysAgo.getTime()) return false;
        } else if (reqFilterDate === 'custom') {
          if (reqFilterStartDate) {
            const start = new Date(reqFilterStartDate);
            start.setHours(0, 0, 0, 0);
            if (bTime < start.getTime()) return false;
          }
          if (reqFilterEndDate) {
            const end = new Date(reqFilterEndDate);
            end.setHours(23, 59, 59, 999);
            if (bTime > end.getTime()) return false;
          }
        }
      }

      // 4. Search text (name, phone, notes, or service name)
      if (reqSearchPhoneOrName.trim()) {
        const q = reqSearchPhoneOrName.trim().toLowerCase();
        const matchesName = b.clientName.toLowerCase().includes(q);
        const matchesPhone = b.phoneNumber.toLowerCase().includes(q);
        const matchesNotes = b.notes ? b.notes.toLowerCase().includes(q) : false;
        const matchesServiceName = b.serviceName ? b.serviceName.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesPhone && !matchesNotes && !matchesServiceName) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (reqSortKey === 'date-asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (reqSortKey === 'name-asc') {
        return a.clientName.localeCompare(b.clientName, 'ar');
      }
      // default: date-desc
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [bookings, reqFilterDate, reqFilterStartDate, reqFilterEndDate, reqFilterPaymentStatus, reqFilterServiceId, reqSearchPhoneOrName, reqSortKey]);

  // Compute filtered ledger transactions
  const filteredTransactions = useMemo(() => {
    if (!ledgerSearchQuery.trim()) return transactions;
    const q = ledgerSearchQuery.trim().toLowerCase();
    return transactions.filter(t => 
      t.invoiceNumber.toLowerCase().includes(q) ||
      t.clientName.toLowerCase().includes(q) ||
      t.serviceName.toLowerCase().includes(q) ||
      (t.notes && t.notes.toLowerCase().includes(q))
    );
  }, [transactions, ledgerSearchQuery]);

  // Social Media Links States
  const [socialTwitter, setSocialTwitter] = useState<string>(() => {
    return localStorage.getItem('sm_social_twitter') || 'https://x.com/sama_kingdom';
  });
  const [socialFacebook, setSocialFacebook] = useState<string>(() => {
    return localStorage.getItem('sm_social_facebook') || 'https://facebook.com/sama_kingdom';
  });
  const [socialInstagram, setSocialInstagram] = useState<string>(() => {
    return localStorage.getItem('sm_social_instagram') || 'https://instagram.com/sama_kingdom';
  });
  const [socialLinkedin, setSocialLinkedin] = useState<string>(() => {
    return localStorage.getItem('sm_social_linkedin') || 'https://linkedin.com/company/sama_kingdom';
  });
  const [socialSnapchat, setSocialSnapchat] = useState<string>(() => {
    return localStorage.getItem('sm_social_snapchat') || 'https://snapchat.com/add/sama_kingdom';
  });
  const [socialYoutube, setSocialYoutube] = useState<string>(() => {
    return localStorage.getItem('sm_social_youtube') || 'https://youtube.com/@sama_kingdom';
  });
  const [socialWhatsapp, setSocialWhatsapp] = useState<string>(() => {
    return localStorage.getItem('sm_social_whatsapp') || 'https://wa.me/966500000000';
  });
  const [saveSuccessSocialMedia, setSaveSuccessSocialMedia] = useState(false);

  // WhatsApp Integration states and customizable templates
  const [whatsappTemplateCompleted, setWhatsappTemplateCompleted] = useState<string>(() => {
    return localStorage.getItem('sm_wa_template_completed') || 'السلام عليكم ورحمة الله وبركاته، الأخ/الأخت {name} المحترم. يسعدنا إبلاغكم بأن معاملتكم لطلب ({service}) قد اكتملت بنجاح ومستند الفاتورة جاهز. شكراً لثقتكم بمكتب سما المملكة للخدمات المتكاملة.';
  });
  const [whatsappTemplateCancelled, setWhatsappTemplateCancelled] = useState<string>(() => {
    return localStorage.getItem('sm_wa_template_cancelled') || 'السلام عليكم ورحمة الله وبركاته، الأخ/الأخت {name} المحترم. نود إبلاغكم بأنه تم إلغاء معاملتكم رقم {bookingId} لطلب ({service}). لمزيد من الاستفسارات يرجى الاتصال بإدارة المكتب. شكراً لتفهمكم.';
  });
  const [whatsappTemplateProcessing, setWhatsappTemplateProcessing] = useState<string>(() => {
    return localStorage.getItem('sm_wa_template_processing') || 'السلام عليكم ورحمة الله وبركاته، الأخ/الأخت {clientName} المحترم. نود إبلاغكم بأن طلبكم رقم {bookingId} لمعاملة ({serviceName}) هو الآن قيد المعالجة الإجرائية من قبل فريق المراجعة والجهات المختصة. سنوافيكم بالتطورات قريباً.';
  });
  const [whatsappTemplatePending, setWhatsappTemplatePending] = useState<string>(() => {
    return localStorage.getItem('sm_wa_template_pending') || 'السلام عليكم ورحمة الله وبركاته، الأخ/الأخت {clientName} المحترم. تم استلام طلبكم رقم {bookingId} لمعاملة ({serviceName}) بنجاح. وهو قيد الانتظار حالياً للمراجعة والتدقيق الإداري. شكراً لثقتكم بمكتب سما المملكة.';
  });
  const [whatsappTemplateReminderProcessing, setWhatsappTemplateReminderProcessing] = useState<string>(() => {
    return localStorage.getItem('sm_wa_template_reminder_processing') || 'السلام عليكم ورحمة الله وبركاته، الأخ/الأخت {clientName} المحترم. نود إحاطتكم بأن طلبكم رقم {bookingId} لمعاملة ({serviceName}) لا يزال قيد المعالجة الإجرائية من قبل فريق المراجعين والمتابعة مع الجهات المختصة لإنهاء المعاملة وتيسير إجرائها بأسرع وقت ممكن. نحن نسعى دائماً لخدمتكم وتسريع معاملاتكم. شكراً لثقتكم بمكتب سما المملكة.';
  });
  const [autoSchedulerEnabled, setAutoSchedulerEnabled] = useState<boolean>(() => {
    return localStorage.getItem('sm_auto_scheduler_enabled') !== 'false';
  });
  const [schedulerThresholdHours, setSchedulerThresholdHours] = useState<number>(() => {
    const saved = localStorage.getItem('sm_scheduler_threshold_hours');
    return saved ? parseFloat(saved) : 48;
  });
  const [schedulerLogs, setSchedulerLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('sm_scheduler_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [whatsappLogs, setWhatsappLogs] = useState<WhatsAppLog[]>(() => {
    const saved = localStorage.getItem('sm_wa_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [waToast, setWaToast] = useState<{ show: boolean; type: 'loading' | 'success' | 'error'; message: string; details: string } | null>(null);
  const [saveSuccessWaTemplate, setSaveSuccessWaTemplate] = useState(false);

  // WhatsApp testing and simulation state
  const [testConsoleBookingId, setTestConsoleBookingId] = useState<string>('');
  const [testConsoleTemplateType, setTestConsoleTemplateType] = useState<'pending' | 'processing' | 'completed' | 'cancelled'>('completed');
  const [testConsoleIsDispatching, setTestConsoleIsDispatching] = useState(false);

  useEffect(() => {
    if (bookings.length > 0 && !testConsoleBookingId) {
      setTestConsoleBookingId(bookings[0].id);
    }
  }, [bookings]);

  // Background selection strategy: 'ai' | 'sunrise' | 'sunset' | 'night'
  const [bgStrategy, setBgStrategy] = useState<'ai' | 'sunrise' | 'sunset' | 'night'>('ai');

  // New state to toggle whether the floating widget is visible or collapsed
  const [showBgSelector, setShowBgSelector] = useState<boolean>(() => {
    return localStorage.getItem('sm_show_bg_selector') !== 'false';
  });
  const [isBgSelectorCollapsed, setIsBgSelectorCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sm_bg_selector_collapsed') !== 'false'; // Defaults to true (collapsed/small)
  });

  useEffect(() => {
    localStorage.setItem('sm_show_bg_selector', String(showBgSelector));
  }, [showBgSelector]);

  useEffect(() => {
    localStorage.setItem('sm_bg_selector_collapsed', String(isBgSelectorCollapsed));
  }, [isBgSelectorCollapsed]);

  // Real Checkout Payment Wizard State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutService, setCheckoutService] = useState<Service | null>(null);

  // Jobs & Announcements State
  const [jobs, setJobs] = useState<Job[]>(() => {
    const saved = localStorage.getItem('sm_jobs');
    return saved ? JSON.parse(saved) : INITIAL_JOBS;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('sm_announcements');
    return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
  });

  const [jobApplications, setJobApplications] = useState<JobApplication[]>(() => {
    const saved = localStorage.getItem('sm_job_applications');
    return saved ? JSON.parse(saved) : [
      {
        id: 'app-1',
        jobId: 'job-1',
        jobTitle: 'معقب معاملات ميداني',
        applicantName: 'سعود بن عبد العزيز الحربي',
        applicantPhone: '0501234789',
        applicantEmail: 's.alharbi@samajobs.com',
        coverLetter: 'أتقدم لشغل وظيفة معقب ميداني بالرياض. لدي خبرة ٣ سنوات في تفويض الخارجية ومنصات وزارة التجارة وإنجاز معاملات الجوازات بموثوقية وسرعة فائقة.',
        cvFileName: 'saud_cv_clearence.pdf',
        cvFileData: 'data:application/pdf;base64,U2FtcGxlUERG',
        date: '2026-05-30T14:15:00Z',
        status: 'pending'
      },
      {
        id: 'app-2',
        jobId: 'job-2',
        jobTitle: 'موظف خدمة عملاء واستقبل',
        applicantName: 'ياسمين بنت عبد الله القحطاني',
        applicantPhone: '0562345678',
        applicantEmail: 'yasmin.q@samajobs.com',
        coverLetter: 'لدي شغف بالمسؤولية الإدارية والترحيب بضيوف ومراجعي مكتب سما المملكة الموقر. أطمح للتطوير الدائم وخدمة المعقبيين والمراجعين بجدة والرد السريع.',
        cvFileName: 'yasmin_q_resume.pdf',
        cvFileData: 'data:application/pdf;base64,U2FtcGxlUERG',
        date: '2026-05-31T08:30:00Z',
        status: 'pending'
      },
      {
        id: 'app-3',
        jobId: 'job-3',
        jobTitle: 'مستشار تطوير أعمال ومبيعات خدمات',
        applicantName: 'فيصل بن محمد الشمراني',
        applicantPhone: '0543210987',
        applicantEmail: 'f.shamrani@samajobs.com',
        coverLetter: 'متخصص مبيعات B2B وبناء الشركات التعاقدية من الفئات المتوسطة والكبيرة. أهدر المراجعات لتطوير عقد مبيعات المكتب وتقديم عروض تنافسية.',
        cvFileName: 'f_shamrani_advisor_cv.pdf',
        cvFileData: 'data:application/pdf;base64,U2FtcGxlUERG',
        date: '2026-05-31T11:22:00Z',
        status: 'pending'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('sm_jobs', JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    localStorage.setItem('sm_announcements', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem('sm_job_applications', JSON.stringify(jobApplications));
  }, [jobApplications]);

  // Public Jobs view state
  const [jobsSubTab, setJobsSubTab] = useState<'all' | 'jobs' | 'announcements'>('all');
  const [jobsSearchQuery, setJobsSearchQuery] = useState('');
  const [selectedApplyJob, setSelectedApplyJob] = useState<Job | null>(null);
  const [activeMediaLightbox, setActiveMediaLightbox] = useState<{ url: string; title: string, isVideo: boolean } | null>(null);

  // Application form fields
  const [appApplicantName, setAppApplicantName] = useState('');
  const [appApplicantPhone, setAppApplicantPhone] = useState('');
  const [appApplicantEmail, setAppApplicantEmail] = useState('');
  const [appCoverLetter, setAppCoverLetter] = useState('');
  const [appCvFileName, setAppCvFileName] = useState('');
  const [appCvFileData, setAppCvFileData] = useState('');
  const [appSubmittedSuccess, setAppSubmittedSuccess] = useState(false);

  // Admin section jobs tab states
  const [adminJobSubTab, setAdminJobSubTab] = useState<'manage_jobs' | 'manage_announcements' | 'view_applications'>('manage_jobs');
  
  // Admin Editing state for Job
  const [adminEditingJob, setAdminEditingJob] = useState<Job | null>(null);
  const [adminJobTitle, setAdminJobTitle] = useState('');
  const [adminJobDepartment, setAdminJobDepartment] = useState('');
  const [adminJobLocation, setAdminJobLocation] = useState('');
  const [adminJobType, setAdminJobType] = useState<'full-time' | 'part-time' | 'contract'>('full-time');
  const [adminJobSalary, setAdminJobSalary] = useState('');
  const [adminJobDescription, setAdminJobDescription] = useState('');
  const [adminJobRequirements, setAdminJobRequirements] = useState('');
  
  // Admin Editing state for Announcement
  const [adminEditingAnnouncement, setAdminEditingAnnouncement] = useState<Announcement | null>(null);
  const [adminAnnTitle, setAdminAnnTitle] = useState('');
  const [adminAnnContent, setAdminAnnContent] = useState('');
  const [adminAnnCategory, setAdminAnnCategory] = useState<'alert' | 'offer' | 'news' | 'holiday'>('news');
  const [adminAnnIsPinned, setAdminAnnIsPinned] = useState(false);
  const [adminAnnMediaType, setAdminAnnMediaType] = useState<'none' | 'image' | 'video'>('none');
  const [adminAnnMediaUrl, setAdminAnnMediaUrl] = useState('');
  const [adminAnnMediaFileUploading, setAdminAnnMediaFileUploading] = useState(false);
  const [adminAnnMediaUploadProgress, setAdminAnnMediaUploadProgress] = useState<number | null>(null);

  const handleAnnMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let detectedType: 'none' | 'image' | 'video' = 'none';
    if (file.type.startsWith('image/')) {
      detectedType = 'image';
    } else if (file.type.startsWith('video/')) {
      detectedType = 'video';
    }

    if (detectedType === 'none') {
      alert(lang === 'ar' ? 'يرجى اختيار ملف صورة أو فيديو صالح فقط.' : 'Please select a valid image or video file only.');
      return;
    }

    const maxBytes = detectedType === 'image' ? 6 * 1024 * 1024 : 15 * 1024 * 1024;
    if (file.size > maxBytes) {
      const displayMax = detectedType === 'image' ? '6MB' : '15MB';
      alert(lang === 'ar' 
        ? `عذراً، حجم الملف كبير للغاية. الحد الأقصى المسموح به هو ${displayMax}.` 
        : `Sorry, this file is too large. The maximum allowed is ${displayMax}.`);
      return;
    }

    setAdminAnnMediaType(detectedType);
    setAdminAnnMediaFileUploading(true);
    setAdminAnnMediaUploadProgress(10);

    const reader = new FileReader();
    reader.onprogress = (progressEvent) => {
      if (progressEvent.lengthComputable) {
        const percent = Math.round((progressEvent.loaded / progressEvent.total) * 90);
        setAdminAnnMediaUploadProgress(percent);
      }
    };
    reader.onload = (event) => {
      const resultData = event.target?.result as string;
      if (!resultData) {
        setAdminAnnMediaFileUploading(false);
        setAdminAnnMediaUploadProgress(null);
        return;
      }
      setAdminAnnMediaUrl(resultData);
      setAdminAnnMediaUploadProgress(100);
      setTimeout(() => {
        setAdminAnnMediaFileUploading(false);
        setAdminAnnMediaUploadProgress(null);
      }, 500);
    };
    reader.onerror = () => {
      alert(lang === 'ar' ? 'حدث خطأ أثناء قراءة الملف.' : 'An error occurred while reading the file.');
      setAdminAnnMediaFileUploading(false);
      setAdminAnnMediaUploadProgress(null);
    };
    reader.readAsDataURL(file);
  };


  const makkahImages = {
    sunrise: makkahSunriseImg,
    sunset: makkahSunsetImg,
    night: makkahNightImg,
  };

  const getActiveMakkahImg = () => {
    if (bgStrategy !== 'ai') {
      return makkahImages[bgStrategy];
    }
    // AI Intelligent Strategy: Determine based on local client hour!
    const clientHour = new Date().getHours();
    if (clientHour >= 5 && clientHour < 16) {
      return makkahImages.sunrise; // Day / Sunrise (5 AM to 4 PM)
    } else if (clientHour >= 16 && clientHour < 20) {
      return makkahImages.sunset; // Twilight / Sunset (4 PM to 8 PM)
    } else {
      return makkahImages.night; // Midnight / Stars (8 PM to 5 AM)
    }
  };

  const getBgNameAr = (strategy: string) => {
    switch (strategy) {
      case 'sunrise': return 'مظهر شروق مكة (الصباح)';
      case 'sunset': return 'مظهر غروب مكة (الأصيل)';
      case 'night': return 'مظهر ليل مكة (التهجد)';
      case 'ai': 
      default: {
        const hr = new Date().getHours();
        if (hr >= 5 && hr < 16) return 'الذكاء الاصطناعي (شروق مكة الآن)';
        if (hr >= 16 && hr < 20) return 'الذكاء الاصطناعي (غروب مكة الآن)';
        return 'الذكاء الاصطناعي (ليل مكة الآن)';
      }
    }
  };

  // Local persistence triggers
  useEffect(() => {
    localStorage.setItem('sm_bg_strategy', bgStrategy);
  }, [bgStrategy]);

  useEffect(() => {
    localStorage.setItem('sm_services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('sm_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('sm_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('sm_welcome_msg', welcomeMessage);
  }, [welcomeMessage]);

  useEffect(() => {
    localStorage.setItem('sm_status_msg_pending', statusMsgPending);
  }, [statusMsgPending]);

  useEffect(() => {
    localStorage.setItem('sm_status_msg_processing', statusMsgProcessing);
  }, [statusMsgProcessing]);

  useEffect(() => {
    localStorage.setItem('sm_status_msg_completed', statusMsgCompleted);
  }, [statusMsgCompleted]);

  useEffect(() => {
    localStorage.setItem('sm_status_msg_cancelled', statusMsgCancelled);
  }, [statusMsgCancelled]);

  useEffect(() => {
    localStorage.setItem('sm_social_twitter', socialTwitter);
  }, [socialTwitter]);

  useEffect(() => {
    localStorage.setItem('sm_social_facebook', socialFacebook);
  }, [socialFacebook]);

  useEffect(() => {
    localStorage.setItem('sm_social_instagram', socialInstagram);
  }, [socialInstagram]);

  useEffect(() => {
    localStorage.setItem('sm_social_linkedin', socialLinkedin);
  }, [socialLinkedin]);

  useEffect(() => {
    localStorage.setItem('sm_social_snapchat', socialSnapchat);
  }, [socialSnapchat]);

  useEffect(() => {
    localStorage.setItem('sm_social_youtube', socialYoutube);
  }, [socialYoutube]);

  useEffect(() => {
    localStorage.setItem('sm_social_whatsapp', socialWhatsapp);
  }, [socialWhatsapp]);

  useEffect(() => {
    localStorage.setItem('sm_wa_template_completed', whatsappTemplateCompleted);
  }, [whatsappTemplateCompleted]);

  useEffect(() => {
    localStorage.setItem('sm_wa_template_cancelled', whatsappTemplateCancelled);
  }, [whatsappTemplateCancelled]);

  useEffect(() => {
    localStorage.setItem('sm_wa_template_processing', whatsappTemplateProcessing);
  }, [whatsappTemplateProcessing]);

  useEffect(() => {
    localStorage.setItem('sm_wa_template_pending', whatsappTemplatePending);
  }, [whatsappTemplatePending]);

  useEffect(() => {
    localStorage.setItem('sm_wa_template_reminder_processing', whatsappTemplateReminderProcessing);
  }, [whatsappTemplateReminderProcessing]);

  useEffect(() => {
    localStorage.setItem('sm_auto_scheduler_enabled', String(autoSchedulerEnabled));
  }, [autoSchedulerEnabled]);

  useEffect(() => {
    localStorage.setItem('sm_scheduler_threshold_hours', String(schedulerThresholdHours));
  }, [schedulerThresholdHours]);

  useEffect(() => {
    localStorage.setItem('sm_scheduler_logs', JSON.stringify(schedulerLogs));
  }, [schedulerLogs]);

  useEffect(() => {
    localStorage.setItem('sm_wa_logs', JSON.stringify(whatsappLogs));
  }, [whatsappLogs]);

  // Stable references for async interval callback triggers to avoid React stale closures
  const bookingsRef = useRef<BookingRequest[]>([]);
  const whatsappLogsRef = useRef<WhatsAppLog[]>([]);

  useEffect(() => {
    bookingsRef.current = bookings;
  }, [bookings]);

  useEffect(() => {
    whatsappLogsRef.current = whatsappLogs;
  }, [whatsappLogs]);

  // Scheduled background task for sending WhatsApp reminders (runs every 60 seconds in the background)
  const runOverdueSchedulerCheck = async (forceManual: boolean = false) => {
    if (!autoSchedulerEnabled && !forceManual) {
      return;
    }

    try {
      const now = new Date();
      const currentBookings = bookingsRef.current;
      const currentLogs = whatsappLogsRef.current;

      // Filter bookings currently in "processing" status
      const activeProcessingBookings = currentBookings.filter(b => b.status === 'processing');
      
      const overdueList = activeProcessingBookings.filter(b => {
        const bookingDate = new Date(b.date);
        const elapsedHours = (now.getTime() - bookingDate.getTime()) / (1000 * 60 * 60);
        
        // Skip if elapsed hours hasn't crossed the threshold hours (default 48 hrs)
        if (elapsedHours < schedulerThresholdHours) {
          return false;
        }

        // Avoid sending duplicates: search whatsappLogs for an automated reminder already sent for this booking ID
        const alreadySent = currentLogs.some(log => 
          log.bookingId === b.id && log.message.includes('[تذكير تلقائي]')
        );

        return !alreadySent;
      });

      const triggered: any[] = [];
      const newLogsDispatched: WhatsAppLog[] = [];

      for (const b of overdueList) {
        // Build formatted reminder notification message
        const formattedMessage = whatsappTemplateReminderProcessing
          .replace(/{name}/g, b.clientName)
          .replace(/{clientName}/g, b.clientName)
          .replace(/{service}/g, b.serviceName)
          .replace(/{serviceName}/g, b.serviceName)
          .replace(/{status}/g, 'تحت المعالجة الإجرائية من قبل فريق المراجعين والمتابعة الخارجية')
          .replace(/{phone}/g, b.phoneNumber)
          .replace(/{bookingId}/g, b.id);
        
        const loggedMessage = `[تذكير تلقائي - ${schedulerThresholdHours}ساعة] ${formattedMessage}`;

        // Call our simulated API
        const result = await sendPlaceholderWhatsAppAPI(b.phoneNumber, loggedMessage);

        const newLog: WhatsAppLog = {
          id: `wa-log-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          bookingId: b.id,
          clientName: b.clientName,
          phoneNumber: b.phoneNumber,
          serviceName: b.serviceName,
          status: 'processing',
          message: loggedMessage,
          sentAt: new Date().toISOString(),
          success: result.success,
          apiResponse: result.apiResponse
        };

        newLogsDispatched.push(newLog);
        triggered.push({
          bookingId: b.id,
          clientName: b.clientName,
          phoneNumber: b.phoneNumber
        });
      }

      // Append new logs if any notifications sent (in callback form to avoid state overwrite conflict)
      if (newLogsDispatched.length > 0) {
        setWhatsappLogs(prev => [...newLogsDispatched, ...prev]);
        
        setWaToast({
          show: true,
          type: 'success',
          message: `🔔 [مجدول التذكيرات تلقائي]: تم إرسال عدد (${newLogsDispatched.length}) تذكيرات تلقائية للعملاء بنجاح!`,
          details: `تم إشعار العملاء ذوي طلبات المعالجة المتأخرة لأكثر من ${schedulerThresholdHours} ساعة.`
        });
      } else if (forceManual) {
        setWaToast({
          show: true,
          type: 'success',
          message: `🔍 [مجدول المهام في الخلفية]: تم تشغيل الفحص والجدولة التلقائية بنظام كامل.`,
          details: `لم يتم الكشف عن أي معاملات جديدة بالمعالجة تجاوزت عتبة ${schedulerThresholdHours} ساعة ولم تبلغ مسبقاً.`
        });
      }

      // Add a scheduler audit log entry for admin panel monitoring
      const newSchedulerRun = {
        id: `sched-run-${Date.now()}`,
        runAt: now.toISOString(),
        checkedCount: activeProcessingBookings.length,
        processingOverdueCount: overdueList.length,
        remindersSentCount: triggered.length,
        triggeredBookings: triggered
      };

      setSchedulerLogs(prev => {
        const updated = [newSchedulerRun, ...prev];
        return updated.slice(0, 50); // Keep last 50 run logs to avoid storage saturation
      });

    } catch (e) {
      console.error("[Scheduler Error] Failed to execute background WhatsApp scheduler:", e);
    }
  };

  useEffect(() => {
    if (!autoSchedulerEnabled) return;

    // Fast trigger on reload/app start (postponed slightly for clean experience)
    const initialTimer = setTimeout(() => {
      runOverdueSchedulerCheck();
    }, 3000);

    // Periodical checking loop
    const checkInterval = setInterval(() => {
      runOverdueSchedulerCheck();
    }, 60000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(checkInterval);
    };
  }, [autoSchedulerEnabled, whatsappTemplateReminderProcessing, schedulerThresholdHours]);

  const fetchLaborNews = async () => {
    setIsNewsLoading(true);
    setNewsError(null);
    try {
      const res = await fetch('/api/saudi-labor-news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        throw new Error('فشل جلب أحدث الأخبار من الخادم');
      }
      const data = await res.json();
      setLaborNews(data.newsContent);
      setLaborNewsSources(data.sources || []);
    } catch (err: any) {
      console.error('Error fetching labor news:', err);
      // Fallback to high-quality offline explanation
      setLaborNews(`### 📌 وضع تصفح مستقر بدون اتصال بالإنترنت (Offline Mode)
      
يرحب بكم مكتب **سما المملكة**. يعمل النظام حالياً بكفاءة كاملة وسرعة استجابة فائقة مستعيناً بقواعد البيانات المحلية للمتصفح.
* جميع خدمات الاستعلام، المعاملات، الإعلانات الوظيفية، حساب الرسوم، وطباعة السندات جاهزة وقابلة للعمل دون انقطاع.
* سيتم تلقائياً تحديث الأخبار الرسمية مباشرة من منصات **وزارة الموارد البشرية**، **قوى**، و**مساند** بمجرد استعادة اتصال جهازك بالشبكة.`);
      setLaborNewsSources([
        { title: "قاعدة بيانات المتصفح النشطة (Local Cache Storage)", uri: "#" }
      ]);
    } finally {
      setIsNewsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'home' && !laborNews && !isNewsLoading) {
      fetchLaborNews();
    }
  }, [activeTab]);

  // Handle standard dynamic service standard changes when selected in admin form
  const handleAdminServiceSelectChange = (srvId: string) => {
    setTxServiceId(srvId);
    const selected = services.find(s => s.id === srvId);
    if (selected) {
      setTxGovFee(selected.govFee);
      setTxOfficeFee(selected.officeFee);
    }
  };

  // Maps custom system icons from standard catalog by accepting properties as a React component
  const RenderServiceIcon = ({ iconName, className }: { iconName: string; className?: string }) => {
    // Dynamically retrieve the component from standard Lucide namespace
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.FileText;
    return <IconComponent className={className || "w-6 h-6 text-amber-600"} />;
  };

  // Backwards compatible wrapper for simple functional calls
  const renderServiceIcon = (iconName: string, className?: string) => {
    return <RenderServiceIcon iconName={iconName} className={className} />;
  };

  // --- SUBMISSIONS HANDLERS ---
  
  // Handle individual file processing with simulated progress indicators
  const processUploadFile = (file: File) => {
    if (file.type !== 'application/pdf') {
      alert(`عذراً، المستند "${file.name}" ليس بصيغة PDF. يرجى إرفاق مستندات بصيغة PDF فقط لضمان توافق النظام وسهولة المعالجة.`);
      return;
    }

    // Limit to 4MB for high reliability in local state/storage
    if (file.size > 4 * 1024 * 1024) {
      alert(`عذراً، حجم المستند "${file.name}" كبير للغاية. يرجى إرفاق ملف PDF بحجم لا يتجاوز 4 ميجابايت.`);
      return;
    }

    const kb = file.size / 1024;
    const formattedSize = kb > 1024 
      ? `${(kb / 1024).toFixed(2)} MB` 
      : `${kb.toFixed(1)} KB`;

    // Initialize progress tracking for this file
    setUploadProgresses(prev => ({
      ...prev,
      [file.name]: { progress: 0, size: formattedSize }
    }));

    const reader = new FileReader();
    reader.onload = (event) => {
      const resultData = event.target?.result as string;
      if (!resultData) return;

      // Simulate step-by-step progress tracking for high-fidelity interactive feedback
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 15) + 12;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
          
          // Add to attachedFiles array
          setAttachedFiles(prev => {
            if (prev.some(f => f.name === file.name)) return prev;
            return [...prev, { name: file.name, data: resultData, size: formattedSize }];
          });

          // Smooth fade out of individual progress trackers after complete
          setTimeout(() => {
            setUploadProgresses(prev => {
              const copy = { ...prev };
              delete copy[file.name];
              return copy;
            });
          }, 850);
        }

        setUploadProgresses(prev => {
          if (!prev[file.name]) return prev;
          return {
            ...prev,
            [file.name]: { ...prev[file.name], progress: currentProgress }
          };
        });
      }, 90);
    };
    reader.readAsDataURL(file);
  };

  // Handle client PDF attachment upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      processUploadFile(files[i]);
    }

    e.target.value = ''; // Reset input to allow duplicate selection
  };
  
  // Submit Customer booking from public site (triggers secure payment checkout wizard)
  const handleClientBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim() || !selectedServiceId) {
      setSubmissionFeedback({ success: false, msg: 'يرجى تعبئة كافة الخانات المطلوبة بالكامل.' });
      return;
    }

    const matchedService = services.find(s => s.id === selectedServiceId);
    if (!matchedService) return;

    // Save selected service in checkout contextual state to load calculated fees, then trigger modal
    setCheckoutService(matchedService);
    setIsCheckoutOpen(true);
  };

  // Called when payment flow successfully completes!
  const handleCheckoutSuccess = (
    newBooking: BookingRequest, 
    paymentMethod: 'mada' | 'visa' | 'applepay' | 'stcpay' | 'bank_transfer' | 'cash', 
    amount: number, 
    details?: any
  ) => {
    // 1. Add the booking request (marked paid where appropriate)
    const updatedBookings = [newBooking, ...bookings];
    setBookings(updatedBookings);

    // 2. Automatically generate the corresponding Tax Simplified Invoice in transactions
    // This allows customers and admin to download/print the standard ZATCA-compliant invoice directly!
    const svc = services.find(s => s.id === newBooking.serviceId) || checkoutService;
    const govFee = svc ? svc.govFee : 0;
    const officeFee = svc ? svc.officeFee : 200;
    const calculatedTax = officeFee * 0.15;
    const invoiceCode = `SM-${new Date().getFullYear().toString().substring(2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${(transactions.length + 1).toString().padStart(3, '0')}`;
    
    let txtNotes = '';
    if (paymentMethod === 'bank_transfer') {
      txtNotes = `حوالة بنكية معلقة للدراسة والتدقيق المصرفي على بنك: ${details?.bankName || 'مصرف الراجحي'}. رقم العملية البنكية: ${details?.transactionId || 'تم تزويده'}`;
    } else if (paymentMethod === 'cash') {
      txtNotes = `تأمين قيد مالي معلق لطلب سداد نقدي بمقر مكتب سما المملكة.`;
    } else {
      txtNotes = `مدفوعة بالكامل إلكترونياً عبر بوابة سداد الآمنة لمكتب سما المملكة (${paymentMethod.toUpperCase()}). رقم العملية البنكية الموحد: ${details?.transactionId || 'N/A'}`;
    }

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      clientName: newBooking.clientName,
      serviceName: newBooking.serviceName,
      govFee: govFee,
      officeFee: officeFee,
      tax: calculatedTax,
      total: amount,
      date: new Date().toISOString(),
      invoiceNumber: invoiceCode,
      notes: txtNotes,
      paymentCurrency: (details?.country && details?.country !== 'SA') ? 'USD' : undefined
    };
    
    setTransactions(prev => [newTx, ...prev]);

    // Update feedback for user view
    let feedbackAr = `تم حجز معاملتكم بنجاح ومصادقة عملية السداد لـ (${newBooking.serviceName}). الرقم المرجعي لمعاملتكم: ${newBooking.id.substring(3)}.`;
    if (paymentMethod === 'bank_transfer') {
      feedbackAr = `تم استلام تفاصيل التحويل البنكي وحفظ معاملتك بنجاح لتأشيرة (${newBooking.serviceName}). الرقم المرجعي: ${newBooking.id.substring(3)}. جاري التدقيق من محاسب المكتب.`;
    } else if (paymentMethod === 'cash') {
      feedbackAr = `تم حجز معاملتك لخدمة (${newBooking.serviceName}) بنجاح بدورة سداد نقدي معلقة. الرقم المرجعي: ${newBooking.id.substring(3)}. يرجى تزويد الكاشير بمقر المكتب بالرمز لإكمال السداد البدء بالتعقيب.`;
    }

    setSubmissionFeedback({ 
      success: true, 
      msg: feedbackAr
    });

    // Reset form fields
    setClientName('');
    setClientPhone('');
    setClientNotes('');
    setSelectedServiceId('');
    try {
      localStorage.removeItem('sm_draft_booking_form');
    } catch (_) {}
    setAttachedFileName('');
    setAttachedFileData('');
    setAttachedFileSize('');
    setAttachedFiles([]);
    setUploadProgresses({});

    // Pop search phone automatically to help client track instantly
    setSearchPhone(newBooking.phoneNumber);
  };

  // Client Request status lookup
  const handleTrackPhoneNumberLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPhone.trim()) return;

    // Convert Arabic Eastern numerals to Western digits, ignore spaces and convert to lowercase
    const normalizeInput = (str: string) => {
      const parsedBytes = str.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
      return parsedBytes.replace(/\s+/g, '').toLowerCase();
    };

    const term = normalizeInput(searchPhone);

    const results = bookings.filter(b => {
      // 1. Match normalized mobile phone number
      const normPhone = normalizeInput(b.phoneNumber);
      if (normPhone === term) return true;

      // 2. Match normalized Booking/Request temporary ID (or partial ID)
      const normBookingId = normalizeInput(b.id);
      if (normBookingId.includes(term)) return true;

      // 3. Match normalized Invoice code from transactions lookup
      // Find corresponding transactions matching this phone number OR name
      const matchingTxs = transactions.filter(t => 
        (t.clientName.trim().toLowerCase() === b.clientName.trim().toLowerCase() && 
         t.serviceName.trim().toLowerCase() === b.serviceName.trim().toLowerCase())
      );
      
      const hasMatchingInvoice = matchingTxs.some(t => {
        const normInvoice = normalizeInput(t.invoiceNumber);
        return normInvoice.includes(term);
      });

      return hasMatchingInvoice;
    });

    setTrackedRequests(results);
    setHasSearched(true);
  };

  // Adding transaction ledger directly via Admin
  const handleAddTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txClientName.trim()) {
      alert('يرجى كتابة اسم العميل أولاً.');
      return;
    }

    const matchedService = services.find(s => s.id === txServiceId);
    const serviceName = matchedService ? matchedService.name : 'خدمة مخصصة';

    const calculatedTax = txOfficeFee * 0.15;
    const finalTotal = txGovFee + txOfficeFee + calculatedTax;

    const invoiceCode = `SM-${new Date().getFullYear().toString().substring(2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${(transactions.length + 1).toString().padStart(3, '0')}`;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      clientName: txClientName.trim(),
      serviceName: serviceName,
      govFee: txGovFee,
      officeFee: txOfficeFee,
      tax: calculatedTax,
      total: finalTotal,
      date: new Date().toISOString(),
      invoiceNumber: invoiceCode,
      notes: txNotes.trim(),
      paymentCurrency: txPaymentCurrency !== 'SAR' ? txPaymentCurrency : undefined
    };

    setTransactions([newTx, ...transactions]);

    // Cleanup inputs
    setTxClientName('');
    setTxNotes('');
    setTxPaymentCurrency('SAR');
    
    // reset to original service parameters
    if (services.length > 0) {
      setTxServiceId(services[0].id);
      setTxGovFee(services[0].govFee);
      setTxOfficeFee(services[0].officeFee);
    }

    alert('تم حفظ القيد المالي وترحيله للفاتورة الضريبية بنجاح!');
  };

  // Pre-fill administrative transaction creation using a customer request
  const handlePreFillTransactionFromBooking = (booking: BookingRequest) => {
    setTxClientName(booking.clientName);
    const svc = services.find(s => s.id === booking.serviceId) || services.find(s => s.name === booking.serviceName);
    if (svc) {
      setTxServiceId(svc.id);
      setTxGovFee(svc.govFee);
      setTxOfficeFee(svc.officeFee);
    } else {
      setTxGovFee(0);
      setTxOfficeFee(200);
    }
    setTxNotes(`مرحل تلقائياً من طلب العميل برقم الجوال: ${booking.phoneNumber} والملاحظات الكلوية مسبقاً: ${booking.notes}`);
    
    // Switch to active financial ledger
    setAdminTab('ledger');
  };

  // Handler to simulate a random transaction for today's date instantly to test daily revenue
  const handleSimulateDailyTransaction = () => {
    const clients = [
      'سلمان بن عبد العزيز المقرن',
      'مؤسسة النور الساطع للمقاولات',
      'هيفاء بنت طلال العتيبي',
      'حلول الأعمال المبتكرة للخدمات',
      'عبد الرحمن بن سليمان الفهد'
    ];
    const servicesPool = services.length > 0 ? services : DEFAULT_SERVICES;
    const randomService = servicesPool[Math.floor(Math.random() * servicesPool.length)];
    const randomClient = clients[Math.floor(Math.random() * clients.length)];
    
    // Calculate values
    const govFee = randomService.govFee;
    const officeFee = randomService.officeFee;
    const tax = Math.round(officeFee * 0.15 * 100) / 100;
    const total = govFee + officeFee + tax;
    
    // Generate a beautiful new invoice number
    const lastNum = transactions.length + 1;
    const invoiceNumber = `SM-2605-${String(lastNum).padStart(3, '0')}`;
    
    const newTx: Transaction = {
      id: `sim-tx-${Date.now()}`,
      clientName: randomClient,
      serviceName: randomService.name,
      govFee,
      officeFee,
      tax,
      total,
      date: new Date().toISOString(), // Today!
      invoiceNumber,
      notes: 'معاملة تجريبية مدعومة من لوحة القيادة لقياس التدفق اليومي الهيكلي للمنشأة اليوم'
    };
    
    setTransactions(prev => [newTx, ...prev]);
  };

  // Add Dynamic Service
  const handleAddServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSrvName.trim() || !newSrvDesc.trim()) {
      alert('يرجى ملء اسم الخدمة ووصفها بشكل صحيح.');
      return;
    }

    const newSrv: Service = {
      id: `srv-${Date.now()}`,
      name: newSrvName.trim(),
      description: newSrvDesc.trim(),
      govFee: Number(newSrvGovFee) || 0,
      officeFee: Number(newSrvOfficeFee) || 0,
      category: newSrvCategory,
      subCategory: newSrvSubCategory,
      icon: newSrvIcon,
      additionalFees: newSrvAdditionalFees,
      baseCurrency: newSrvBaseCurrency,
      baseGovFee: Number(newSrvBaseGovFee) || 0,
      baseOfficeFee: Number(newSrvBaseOfficeFee) || 0,
    };

    setServices([...services, newSrv]);

    // reset fields
    setNewSrvName('');
    setNewSrvDesc('');
    setNewSrvGovFee(0);
    setNewSrvOfficeFee(0);
    setNewSrvBaseCurrency('SAR');
    setNewSrvBaseGovFee(0);
    setNewSrvBaseOfficeFee(0);
    setNewSrvSubCategory('');
    setIconSearchNew('');
    setNewSrvAdditionalFees([]);
    setTempFeeNameNew('');
    setTempFeeAmountNew('');

    alert('تمت إضافة الخدمة الجديدة بنجاح للمكتب!');
  };

  // Edit Dynamic Service and Prices
  const handleUpdateServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService || !editingService.name.trim() || !editingService.description.trim()) {
      alert('يرجى ملء كافة الخانات المطلوبة بشكل صحيح.');
      return;
    }

    const updated = services.map(s => {
      if (s.id === editingService.id) {
        return editingService;
      }
      return s;
    });

    setServices(updated);
    setEditingService(null);
    alert('تم حفظ وتعديل أسعار وبنود الخدمة بنجاح!');
  };

  // Admin Request status updates with automatic WhatsApp notifications
  const handleUpdateBookingStatus = async (bookingId: string, status: 'pending' | 'processing' | 'completed' | 'cancelled') => {
    const targetBooking = bookings.find(b => b.id === bookingId);
    if (!targetBooking) return;

    const oldStatus = targetBooking.status;

    const updated = bookings.map(b => {
      if (b.id === bookingId) {
        return { ...b, status: status };
      }
      return b;
    });
    setBookings(updated);

    // If the status has changed
    if (oldStatus !== status) {
      let template = '';
      let statusAr = '';
      if (status === 'completed') {
        template = whatsappTemplateCompleted;
        statusAr = 'مكتملة ومستحقة الدفع';
      } else if (status === 'cancelled') {
        template = whatsappTemplateCancelled;
        statusAr = 'ملغية ومسحوبة';
      } else if (status === 'processing') {
        template = whatsappTemplateProcessing;
        statusAr = 'تحت المعالجة الإجرائية من قبل فريق المراجعين';
      } else if (status === 'pending') {
        template = whatsappTemplatePending;
        statusAr = 'قيد المراجعة والتدقيق الإداري والمحاسبي';
      }

      if (template) {
        const formattedMessage = template
          .replace(/{name}/g, targetBooking.clientName)
          .replace(/{clientName}/g, targetBooking.clientName)
          .replace(/{service}/g, targetBooking.serviceName)
          .replace(/{serviceName}/g, targetBooking.serviceName)
          .replace(/{status}/g, statusAr)
          .replace(/{phone}/g, targetBooking.phoneNumber)
          .replace(/{bookingId}/g, bookingId);

        // Trigger temporary visual notification feedback
        setWaToast({
          show: true,
          type: 'loading',
          message: `جاري إرسال إشعار WhatsApp تلقائي إلى ${targetBooking.clientName}...`,
          details: formattedMessage
        });

      // Call API
      const result = await sendPlaceholderWhatsAppAPI(targetBooking.phoneNumber, formattedMessage);

      // Create Transmission Log
      const newLog: WhatsAppLog = {
        id: `wa-log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        bookingId: bookingId,
        clientName: targetBooking.clientName,
        phoneNumber: targetBooking.phoneNumber,
        serviceName: targetBooking.serviceName,
        status: status,
        message: formattedMessage,
        sentAt: new Date().toISOString(),
        success: result.success,
        apiResponse: result.apiResponse
      };

      setWhatsappLogs(prev => [newLog, ...prev]);

      if (result.success) {
        setWaToast({
          show: true,
          type: 'success',
          message: `تم إرسال إشعار WhatsApp تلقائي بالنجاح للأخ ${targetBooking.clientName}!`,
          details: formattedMessage
        });
      } else {
        setWaToast({
          show: true,
          type: 'error',
          message: `تعذر إرسال الإشعار للعميل: ${result.apiResponse}`,
          details: formattedMessage
        });
      }

      // Automatically auto-close feedback toast in 7 seconds
      setTimeout(() => {
        setWaToast(prev => {
          if (prev && (prev.message.includes(targetBooking.clientName) || prev.type === 'error')) {
            return { ...prev, show: false };
          }
          return prev;
        });
      }, 7000);
      }
    }
  };

  // Manual Trigger for WhatsApp Dynamic Testing Console
  const handleManualTestWaDispatch = async () => {
    const target = bookings.find(b => b.id === testConsoleBookingId);
    if (!target) {
      alert('يرجى تحديد معاملة نشطة من القائمة المنسدلة أولاً.');
      return;
    }

    setTestConsoleIsDispatching(true);

    let template = '';
    let statusAr = '';
    if (testConsoleTemplateType === 'completed') {
      template = whatsappTemplateCompleted;
      statusAr = 'مكتملة ومستحقة الدفع';
    } else if (testConsoleTemplateType === 'cancelled') {
      template = whatsappTemplateCancelled;
      statusAr = 'ملغية ومسحوبة';
    } else if (testConsoleTemplateType === 'processing') {
      template = whatsappTemplateProcessing;
      statusAr = 'تحت المعالجة الإجرائية من قبل فريق المراجعين';
    } else if (testConsoleTemplateType === 'pending') {
      template = whatsappTemplatePending;
      statusAr = 'قيد المراجعة والتدقيق الإداري والمحاسبي';
    }

    const formattedMessage = template
      .replace(/{name}/g, target.clientName)
      .replace(/{clientName}/g, target.clientName)
      .replace(/{service}/g, target.serviceName)
      .replace(/{serviceName}/g, target.serviceName)
      .replace(/{status}/g, statusAr)
      .replace(/{phone}/g, target.phoneNumber)
      .replace(/{bookingId}/g, target.id);

    const result = await sendPlaceholderWhatsAppAPI(target.phoneNumber, formattedMessage);

    const newLog: WhatsAppLog = {
      id: `wa-log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      bookingId: target.id,
      clientName: target.clientName,
      phoneNumber: target.phoneNumber,
      serviceName: target.serviceName,
      status: testConsoleTemplateType,
      message: formattedMessage,
      sentAt: new Date().toISOString(),
      success: result.success,
      apiResponse: result.apiResponse
    };

    setWhatsappLogs(prev => [newLog, ...prev]);
    setTestConsoleIsDispatching(false);

    setWaToast({
      show: true,
      type: result.success ? 'success' : 'error',
      message: result.success 
        ? `[إرسال تجريبي] تم بث رسالة WhatsApp تلقائية بنجاح للمستفيد ${target.clientName}!`
        : `[فشل تجريبي] تعذر بث الإشعار للعميل: ${result.apiResponse}`,
      details: formattedMessage
    });

    setTimeout(() => {
      setWaToast(prev => {
        if (prev && prev.message.includes('[إرسال تجريبي]')) {
          return { ...prev, show: false };
        }
        return prev;
      });
    }, 7000);
  };

  // Link booking directly to a service in the service directory
  const handleUpdateBookingService = (bookingId: string, serviceId: string) => {
    const srv = services.find(s => s.id === serviceId);
    if (!srv) return;
    const updated = bookings.map(b => {
      if (b.id === bookingId) {
        return { ...b, serviceId: serviceId, serviceName: srv.name };
      }
      return b;
    });
    setBookings(updated);
  };

  // Delete transaction safely
  const handleDeleteTransaction = (txId: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا القيد المالي بشكل نهائي؟')) {
      const filtered = transactions.filter(t => t.id !== txId);
      setTransactions(filtered);
    }
  };

  // Export all transaction records to a CSV file
  const handleExportTransactionsToCSV = () => {
    if (transactions.length === 0) {
      alert(lang === 'en' ? 'No transactions to export.' : 'لا توجد عمليات لتصديرها.');
      return;
    }

    const headers = lang === 'en' ? [
      'Invoice Number',
      'Client Name',
      'Service Name',
      'Gov Fee (SAR)',
      'Office Fee (SAR)',
      'Vat 15% (SAR)',
      'Total Amount (SAR)',
      'Date of Entry',
      'Notes'
    ] : [
      'رقم الفاتورة',
      'اسم العميل',
      'إجراء الخدمة',
      'رسوم الدولة (ر.س)',
      'أتعاب المكتب (ر.س)',
      'الضريبة المضافة 15% (ر.س)',
      'المجموع الشامل (ر.س)',
      'تاريخ وقت القيد',
      'ملاحظات السند'
    ];

    const escapeCSVValue = (value: any) => {
      if (value === undefined || value === null) return '';
      let str = String(value);
      // Escape internal double quotes by doubling them
      str = str.replace(/"/g, '""');
      // Wrap in double quotes if it contains separator, quote or newline
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        str = `"${str}"`;
      }
      return str;
    };

    const csvRows: string[] = [];
    csvRows.push(headers.join(','));

    for (const t of transactions) {
      const formattedDate = new Date(t.date).toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-SA') + ' ' + 
        new Date(t.date).toLocaleTimeString(lang === 'en' ? 'en-US' : 'ar-SA', { hour: '2-digit', minute: '2-digit' });
      
      const row = [
        escapeCSVValue(t.invoiceNumber),
        escapeCSVValue(t.clientName),
        escapeCSVValue(t.serviceName),
        escapeCSVValue(t.govFee.toFixed(2)),
        escapeCSVValue(t.officeFee.toFixed(2)),
        escapeCSVValue(t.tax.toFixed(2)),
        escapeCSVValue(t.total.toFixed(2)),
        escapeCSVValue(formattedDate),
        escapeCSVValue(t.notes || '')
      ];
      csvRows.push(row.join(','));
    }

    // UTF-8 BOM to display Arabic characters correctly in Excel
    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = lang === 'en' ? `Sama_AlMamlakah_Ledger_${new Date().toISOString().split('T')[0]}.csv` : `قيود_مكتب_سما_المملكة_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Delete Service safely
  const handleDeleteService = (srvId: string) => {
    const srv = services.find(s => s.id === srvId);
    if (!srv) return;
    
    if (services.length <= 1) {
      setShowCannotDeleteAlert(true);
      return;
    }
    setServiceToDeleteCheck(srv);
  };

  const confirmDeleteService = () => {
    if (serviceToDeleteCheck) {
      const filtered = services.filter(s => s.id !== serviceToDeleteCheck.id);
      setServices(filtered);
      setServiceToDeleteCheck(null);
    }
  };

  // Handling navigation tabs
  const handleTabClick = (tab: 'home' | 'track' | 'jobs' | 'admin') => {
    if (tab === 'admin') {
      if (isAdminAuthenticated) {
        setActiveTab('admin');
      } else {
        setShowPasscode(true);
      }
    } else {
      setActiveTab(tab);
    }
  };

  const handleAdminAuthSuccess = () => {
    setIsAdminAuthenticated(true);
    sessionStorage.setItem('sm_admin_logged', 'true');
    setShowPasscode(false);
    setActiveTab('admin');
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('sm_admin_logged');
    setActiveTab('home');
  };

  // --- FINANCIAL CALC COMBINED ---
  const totalGovSpent = transactions.reduce((sum, t) => sum + t.govFee, 0);
  const totalOfficeRevenues = transactions.reduce((sum, t) => sum + t.officeFee, 0);
  const totalVATCollected = transactions.reduce((sum, t) => sum + t.tax, 0);
  const totalOverallAccountingVolume = totalGovSpent + totalOfficeRevenues + totalVATCollected;

  // Today's dynamic metrics
  const todayDateStr = new Date().toISOString().split('T')[0]; // Current day (e.g., 2026-05-31)
  const todayTransactions = transactions.filter(t => {
    if (!t.date) return false;
    return t.date.startsWith(todayDateStr);
  });
  const todayOfficeRevenue = todayTransactions.reduce((sum, t) => sum + t.officeFee, 0);
  const todayGovSpent = todayTransactions.reduce((sum, t) => sum + t.govFee, 0);
  const todayVATCollected = todayTransactions.reduce((sum, t) => sum + t.tax, 0);
  const todayOverallAccountingVolume = todayGovSpent + todayOfficeRevenue + todayVATCollected;

  // Requests Pending vs Completed Ratio
  const pendingRequestsCount = bookings.filter(b => b.status === 'pending').length;
  const completedRequestsCount = bookings.filter(b => b.status === 'completed').length;
  const processingRequestsCount = bookings.filter(b => b.status === 'processing').length;
  const cancelledRequestsCount = bookings.filter(b => b.status === 'cancelled').length;
  
  // Ratio string: ratio of Completed over Pending
  const completedToPendingRatio = pendingRequestsCount > 0 
    ? (completedRequestsCount / pendingRequestsCount).toFixed(1) 
    : completedRequestsCount > 0 ? `${completedRequestsCount}` : '0';
  
  // Sorted list of recently joined applicants
  const recentJobApplications = [...jobApplications]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  return (
    <div 
      className="min-h-screen bg-slate-100 bg-cover bg-center bg-no-repeat bg-fixed transition-all duration-500"
      dir={lang === 'en' ? 'ltr' : 'rtl'}
      style={{ 
        fontFamily: lang === 'en' ? '"Inter", system-ui, sans-serif' : '"Tajawal", system-ui, sans-serif',
        backgroundImage: `linear-gradient(rgba(243, 244, 246, 0.94), rgba(243, 244, 246, 0.94)), url("${getActiveMakkahImg()}")`,
      }}
    >
      
      {/* Top Main Nav */}
      <nav className="bg-slate-900 border-b border-slate-950 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Logo brand */}
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-amber-500/30 flex-shrink-0 bg-slate-950 shadow-md">
                <img 
                  src={samaLogoImg} 
                  alt={t('appName')} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base sm:text-xl tracking-tight text-amber-500 leading-tight">{t('appName')}</span>
                <span className="hidden xs:inline-block text-[9px] sm:text-[10px] text-slate-400 font-medium">{t('appSubtitle')}</span>
              </div>
            </div>

            {/* Nav tabs desktop (Hidden on mobile/tablet, shown on large screens) */}
            <div className="hidden lg:flex items-center gap-2 sm:gap-3 xl:gap-4">
              <button 
                onClick={() => handleTabClick('home')}
                className={`px-3 py-2 text-sm font-bold rounded transition-all flex items-center gap-1.5 ${activeTab === 'home' ? 'bg-amber-600 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
              >
                <Home className="w-4 h-4" />
                <span>{t('home')}</span>
              </button>

              <button 
                onClick={() => handleTabClick('track')}
                className={`px-3 py-2 text-sm font-bold rounded transition-all flex items-center gap-1.5 ${activeTab === 'track' ? 'bg-amber-600 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
              >
                <Search className="w-4 h-4" />
                <span>{t('track')}</span>
              </button>

              <button 
                onClick={() => handleTabClick('jobs')}
                className={`px-3 py-2 text-sm font-bold rounded transition-all flex items-center gap-1.5 ${activeTab === 'jobs' ? 'bg-amber-600 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
              >
                <Briefcase className="w-4 h-4" />
                <span>{lang === 'ar' ? 'الوظائف والإعلانات' : 'Jobs & Careers'}</span>
              </button>

              <button 
                onClick={() => handleTabClick('admin')}
                className={`px-3 py-2 text-sm font-bold rounded transition-all flex items-center gap-1.5 ${activeTab === 'admin' ? 'bg-slate-200 text-slate-950 shadow-md' : 'bg-slate-800 border border-slate-700 text-amber-500 hover:bg-slate-700'}`}
              >
                <Lock className="w-4 h-4" />
                <span>{t('adminPanel')}</span>
              </button>

              {/* News and MHRSD updates summary opener */}
              <button 
                onClick={() => setIsNewsModalOpen(true)}
                className="px-3 py-1.5 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 bg-amber-950/45 text-amber-400 hover:text-white hover:bg-amber-900 border border-amber-500/30 cursor-pointer shadow-sm select-none"
                title={lang === 'ar' ? 'موجز قرارات وزارة الموارد البشرية ومنصتي قوى ومساند' : 'MHRSD, Qiwa, and Musaned Decisions Summary'}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>{lang === 'ar' ? 'موجز القرارات 2026' : 'MHRSD Summary'}</span>
              </button>

              {/* Bilingual Language Switcher Toggle */}
              <button 
                onClick={toggleLanguage}
                className="px-3 py-1.5 text-xs font-black rounded-lg transition-all flex items-center gap-1 bg-slate-800 text-amber-400 hover:text-white hover:bg-slate-700 border border-amber-500/20 hover:border-amber-500/50 cursor-pointer shadow-sm select-none"
                title={lang === 'ar' ? 'Switch to English' : 'التحويل إلى اللغة العربية'}
              >
                <Globe className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-sans font-bold">{lang === 'ar' ? 'English' : 'عربي'}</span>
              </button>

              {isAdminAuthenticated && activeTab === 'admin' && (
                <button 
                  onClick={handleAdminLogout}
                  title="تسجيل الخروج من الإدارة"
                  className="p-1.5 bg-red-900/40 text-red-300 hover:text-white rounded border border-red-800/60 hover:bg-red-900 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Mobile Header elements (language selector & hamburger icon) */}
            <div className="flex lg:hidden items-center gap-2">
              {/* Language Switcher on mobile header directly for easy accessibility */}
              <button 
                onClick={toggleLanguage}
                className="px-2.5 py-1.5 text-xs font-black rounded-lg transition-all flex items-center gap-1 bg-slate-800 text-amber-400 hover:text-white border border-amber-500/20 hover:border-amber-500/50 cursor-pointer shadow-sm select-none"
                title={lang === 'ar' ? 'Switch to English' : 'التحويل إلى اللغة العربية'}
              >
                <Globe className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-sans font-bold">{lang === 'ar' ? 'EN' : 'عربي'}</span>
              </button>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none transition-colors border border-slate-800 cursor-pointer"
                aria-label="Toggle Menu"
              >
                {isMobileMenuOpen ? (
                  <X className="block h-5.5 w-5.5 text-amber-500" />
                ) : (
                  <Menu className="block h-5.5 w-5.5 text-slate-300" />
                )}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile slide-down menu drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-950 bg-slate-900 px-4 py-3.5 pb-5 space-y-3 animate-fade-in shadow-2xl relative z-40 select-none">
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => {
                  handleTabClick('home');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-3 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'home' 
                    ? 'bg-amber-600 text-slate-950 shadow-md font-black' 
                    : 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>{t('home')}</span>
              </button>

              <button 
                onClick={() => {
                  handleTabClick('track');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-3 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'track' 
                    ? 'bg-amber-600 text-slate-950 shadow-md font-black' 
                    : 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>{t('track')}</span>
              </button>

              <button 
                onClick={() => {
                  handleTabClick('jobs');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-3 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'jobs' 
                    ? 'bg-amber-600 text-slate-950 shadow-md font-black' 
                    : 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>{lang === 'ar' ? 'الوظائف والإعلانات' : 'Jobs & Careers'}</span>
              </button>

              <button 
                onClick={() => {
                  handleTabClick('admin');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-3 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'admin' 
                    ? 'bg-slate-200 text-slate-950 shadow-md font-black' 
                    : 'bg-slate-800 hover:bg-slate-750 text-amber-500 border border-slate-700/50'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>{t('adminPanel')}</span>
              </button>
            </div>

            {/* News and regulations update tool trigger on mobile */}
            <button 
              onClick={() => {
                setIsNewsModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full px-4 py-3 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-2 bg-amber-950/40 text-amber-400 hover:text-white hover:bg-amber-900/60 border border-amber-500/30 cursor-pointer shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>{lang === 'ar' ? 'موجز قرارات وزارة الموارد البشرية والعمل' : 'MHRSD Official Decisions Summary'}</span>
            </button>

            {isAdminAuthenticated && activeTab === 'admin' && (
              <button 
                onClick={() => {
                  handleAdminLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full px-4 py-2.5 bg-red-950/40 text-red-300 hover:text-white rounded-lg border border-red-900/60 hover:bg-red-900 flex items-center justify-center gap-2 text-xs font-black transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{lang === 'ar' ? 'تسجيل الخروج من الإدارة' : 'Logout Admin'}</span>
              </button>
            )}
          </div>
        )}
      </nav>

      {/* BANNER CLOCK & SYSTEM STATE */}
      <div className="bg-slate-950 text-slate-400 py-2 border-b border-slate-800 text-center text-xs font-mono select-none px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2 text-[11px]">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`}></span>
            <span className="text-slate-300 font-sans font-medium">
              {isOffline 
                ? (lang === 'ar' ? 'وضع عدم الاتصال: يمكنك تخليص وقيد المعاملات محلياً الآن' : 'Offline Mode: You can manage and draft bookings locally') 
                : t('heroSubtitle')}
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 flex-wrap justify-center">
            <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold border transition-colors ${
              isOffline 
                ? 'bg-amber-950/40 text-amber-500 border-amber-900/60' 
                : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/60'
            }`}>
              {isOffline 
                ? (lang === 'ar' ? '🔌 عمل محلي (بدون نت)' : '🔌 Local Database (Offline)') 
                : (lang === 'ar' ? '⚡ متصل بالشبكة المعرفية' : '⚡ Online & Synced')
              }
            </span>
            <span className="hidden sm:inline text-slate-700">|</span>
            <span>{t('localTimePrefix')} <strong className="text-slate-200 font-mono">{liveTime}</strong></span>
            <span className="hidden sm:inline text-slate-700">|</span>
            <span>{t('currentUserPrefix')} <strong className="text-amber-500">essam73903@gmail.com</strong></span>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER CONTENT VIEW */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ==================== TAB 1: CLIENT HOME PORTAL ==================== */}
        {activeTab === 'home' && (
          <div className="space-y-12">
            
            {/* Elegant Saudi Pattern Hero */}
            <div 
              className="bg-slate-900 text-white rounded-2xl overflow-hidden shadow-2xl relative border border-slate-850 bg-cover bg-center transition-all duration-500" 
              style={{ backgroundImage: `linear-gradient(to left, rgba(15, 23, 42, 0.96) 45%, rgba(15, 23, 42, 0.7) 80%, rgba(15, 23, 42, 0.3)), url("${getActiveMakkahImg()}")` }}
            >
              {/* Abs decoration backdrop line */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl -z-10"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-10"></div>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 md:p-12">
                {/* Right Side: Welcome text and info - occupies 7 cols on lg */}
                <div className="lg:col-span-7 flex flex-col justify-center text-center md:text-right">
                  <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/20 mb-4 self-center md:self-start">
                    <Activity className="w-3.5 h-3.5 animate-pulse" />
                    <span>{t('portalTitleDefault')}</span>
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black mb-4 leading-normal text-slate-100 font-sans">
                    {lang === 'en' ? (
                      <>We Process Your Transactions with Complete <span className="text-amber-500 underline decoration-wavy decoration-amber-500/40">Trust & Efficiency</span></>
                    ) : (
                      <>ننجز معاملاتك بكل <span className="text-amber-500 underline decoration-wavy decoration-amber-500/40">ثقة وكفاءة</span></>
                    )}
                  </h1>
                  
                  <div className="bg-slate-950/80 backdrop-blur-md rounded-2xl p-5 border border-amber-500/30 text-right max-w-3xl mb-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-500"></div>
                    <div className="flex items-center gap-2 text-amber-500 font-extrabold text-xs mb-2 bg-amber-500/10 w-fit px-2.5 py-1 rounded-md border border-amber-500/20">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span>{lang === 'en' ? 'Official Welcome Statement for Visitors & Clients' : 'البيان الترحيبي الخاص بالزوار والعملاء'}</span>
                    </div>
                    <p className={`text-xs md:text-sm text-slate-100 leading-relaxed font-sans whitespace-pre-wrap ${lang === 'en' ? 'text-left' : 'text-right'}`}>
                      {getWelcomeText()}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-start">
                    <a 
                      href="#booking-anchor" 
                      className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold px-8 py-3.5 rounded-lg text-center transition-all shadow-lg hover:shadow-amber-600/20 text-sm"
                    >
                      {lang === 'en' ? 'Request Your Service Now' : 'اطلب خدمتك الآن'}
                    </a>
                    <button 
                      onClick={() => handleTabClick('track')}
                      className="bg-slate-800 hover:bg-slate-750 hover:text-white text-slate-200 font-bold px-8 py-3.5 rounded-lg text-center transition-all text-sm border border-slate-700"
                    >
                      {lang === 'en' ? 'Direct Status Inquiry & Track Requests' : 'الاستعلام المباشر عن حالة المعاملة'}
                    </button>
                  </div>
                </div>

                {/* Left Side: Outstanding Royal Logo with customized premium background - occupies 5 cols on lg */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center">
                  <div className="relative group w-64 h-64 md:w-72 md:h-72 rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/40 bg-slate-950 flex items-center justify-center transition-all duration-500 hover:border-amber-400 hover:scale-102">
                    
                    {/* Glowing backlight */}
                    <div className="absolute -inset-1 bg-gradient-to-tr from-amber-600 to-indigo-600 rounded-3xl blur opacity-30 group-hover:opacity-40 transition-opacity duration-500"></div>
                    
                    {/* Dynamic overlay reflection */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80 z-10"></div>
                    
                    {/* The Actual Luxury Logo Image */}
                    <img 
                      src={samaLogoImg} 
                      alt="شعار مكتب سما المملكة" 
                      className="w-full h-full object-cover relative z-0"
                      referrerPolicy="no-referrer"
                    />

                    {/* Logo Info Overlay */}
                    <div className="absolute bottom-4 inset-x-4 z-20 text-center space-y-1">
                      <h3 className="text-amber-400 font-black text-sm tracking-wide drop-shadow-md">مكتب سما المملكة</h3>
                      <p className="text-slate-300 text-[9px] drop-shadow-sm font-sans">الخدمات المتكاملة وتخليص المعاملات الحكومية</p>
                    </div>

                    {/* Live indicator badge */}
                    <span className="absolute top-3 left-3 z-25 bg-amber-500 text-slate-950 text-[8px] font-black px-2 py-0.5 rounded-full border border-amber-400 animate-pulse uppercase tracking-wider font-sans">
                      المكتب الرقمي الموثق
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SOCIAL MEDIA QUICK CONNECT STRIP */}
            <div className="bg-white/85 backdrop-blur-md rounded-2xl p-5 border border-slate-205 shadow-md flex flex-col lg:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 text-amber-700 p-2.5 rounded-xl border border-amber-200 flex-shrink-0 animate-bounce">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 text-right">قنوات التواصل والربط الاجتماعي الرسمي للمكتب</h3>
                  <p className="text-xs text-slate-500 font-sans text-right">يسعدنا تواصلكم وتلقي استفساراتكم وملاحظاتكم مباشرة عبر شبكاتنا المعتمدة.</p>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-2.5">
                {socialTwitter && (
                  <a href={socialTwitter} target="_blank" rel="noopener noreferrer" title="منصة X / تويتر" className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 text-slate-100 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 rounded-xl text-xs font-bold transition-all shadow-sm">
                    <Twitter className="w-4 h-4 text-slate-300" />
                    <span className="hidden sm:inline">تويتر X</span>
                  </a>
                )}
                {socialFacebook && (
                  <a href={socialFacebook} target="_blank" rel="noopener noreferrer" title="فيسبوك" className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-105 hover:border-blue-200 rounded-xl text-xs font-bold transition-all shadow-sm">
                    <Facebook className="w-4 h-4 text-blue-600" />
                    <span className="hidden sm:inline">فيسبوك</span>
                  </a>
                )}
                {socialInstagram && (
                  <a href={socialInstagram} target="_blank" rel="noopener noreferrer" title="إنستغرام" className="flex items-center gap-1.5 px-3 py-2 bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-105 hover:border-pink-205 rounded-xl text-xs font-bold transition-all shadow-sm font-sans">
                    <Instagram className="w-4 h-4 text-pink-600" />
                    <span className="hidden sm:inline">إنستغرام</span>
                  </a>
                )}
                {socialLinkedin && (
                  <a href={socialLinkedin} target="_blank" rel="noopener noreferrer" title="لينكد إن" className="flex items-center gap-1.5 px-3 py-2 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-105 hover:border-sky-205 rounded-xl text-xs font-bold transition-all shadow-sm">
                    <Linkedin className="w-4 h-4 text-sky-600" />
                    <span className="hidden sm:inline">لينكد إن</span>
                  </a>
                )}
                {socialYoutube && (
                  <a href={socialYoutube} target="_blank" rel="noopener noreferrer" title="قناة يوتيوب" className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 border border-red-105 hover:border-red-205 rounded-xl text-xs font-bold transition-all shadow-sm">
                    <Youtube className="w-4 h-4 text-red-600" />
                    <span className="hidden sm:inline">يوتيوب</span>
                  </a>
                )}
                {socialSnapchat && (
                  <a href={socialSnapchat} target="_blank" rel="noopener noreferrer" title="سناب شات" className="flex items-center gap-1.5 px-3 py-2 bg-yellow-50 text-yellow-800 hover:bg-yellow-101 border border-yellow-100 hover:border-yellow-200 rounded-xl text-xs font-bold transition-all shadow-sm font-sans">
                    <Smartphone className="w-4 h-4 text-yellow-605" />
                    <span className="hidden sm:inline">سناب شات</span>
                  </a>
                )}
                {socialWhatsapp && (
                  <a href={socialWhatsapp} target="_blank" rel="noopener noreferrer" title="تواصل واتساب" className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-105 hover:border-emerald-250 rounded-xl text-xs font-bold transition-all shadow-sm animate-pulse">
                    <PhoneCall className="w-4 h-4 text-emerald-600" />
                    <span>واتساب مباشر</span>
                  </a>
                )}
              </div>
            </div>

            {/* REGIONAL PUBLISHING & OPERATIONS NETWORK WIDGET */}
            <div className="hidden bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-800 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-64 h-64 bg-amber-600/5 rounded-full blur-3xl -z-10"></div>
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-600/5 rounded-full blur-3xl -z-10"></div>

              {/* Title & Badge */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-500/20 uppercase tracking-wider">
                    <Globe className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>{lang === 'en' ? 'Verified Global Publishing & Service Network' : 'نطاق النشر الجغرافي والخدماتي العالمي المعتمد'}</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-100 font-sans text-right">
                    {lang === 'en' ? 'Global Operations Scope: Worldwide Coverage' : 'نطاق النشر الجغرافي والأعمال: عالمي متكامل'}
                  </h2>
                  <p className="text-slate-400 text-xs text-right max-w-3xl leading-relaxed font-sans">
                    {lang === 'en' 
                      ? 'Official electronic publishing and integration services of Sama Al-Mamlakah Office connecting cross-border visa systems, transit, and cargo systems across Earth continents directly with Saudi Arabia.'
                      : 'منظومة النشر الرقمي لخدمات مكتب سما المملكة المعتمدة لربط وتخليص المعاملات والعمليات الدولية المباشرة للتأشيرات والخدمات عبر جميع القارات بربط مباشر مع بوابات التخليص والمعاملات.'}
                  </p>
                </div>

                {/* Switcher Tabs */}
                <div className="flex flex-wrap bg-slate-950 p-1.5 rounded-xl border border-slate-800/80 w-full md:w-auto shrink-0 select-none gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedRegionTab('all')}
                    className={`flex-1 md:flex-none px-3.5 py-2 rounded-lg font-bold text-xs transition-all ${
                      selectedRegionTab === 'all' 
                        ? 'bg-amber-600 text-slate-950 shadow-md cursor-pointer' 
                        : 'text-slate-400 hover:text-white cursor-pointer'
                    }`}
                  >
                    {lang === 'en' ? 'Global View' : 'النطاق الشامل'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRegionTab('asia')}
                    className={`flex-1 md:flex-none px-3.5 py-2 rounded-lg font-bold text-xs transition-all ${
                      selectedRegionTab === 'asia' 
                        ? 'bg-amber-600 text-slate-950 shadow-md cursor-pointer' 
                        : 'text-slate-400 hover:text-white cursor-pointer'
                    }`}
                  >
                    {lang === 'en' ? 'Asia Continent' : 'قارة آسيا'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRegionTab('africa')}
                    className={`flex-1 md:flex-none px-3.5 py-2 rounded-lg font-bold text-xs transition-all ${
                      selectedRegionTab === 'africa' 
                        ? 'bg-amber-600 text-slate-950 shadow-md cursor-pointer' 
                        : 'text-slate-400 hover:text-white cursor-pointer'
                    }`}
                  >
                    {lang === 'en' ? 'Africa Continent' : 'قارة أفريقيا'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRegionTab('europe_americas')}
                    className={`flex-1 md:flex-none px-3.5 py-2 rounded-lg font-bold text-xs transition-all ${
                      selectedRegionTab === 'europe_americas' 
                        ? 'bg-amber-600 text-slate-950 shadow-md cursor-pointer' 
                        : 'text-slate-400 hover:text-white cursor-pointer'
                    }`}
                  >
                    {lang === 'en' ? 'Europe & Americas' : 'أوروبا والأمريكتين'}
                  </button>
                </div>
              </div>

              {/* Dynamic Grid Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Active Continent Segment cards */}
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ASIA CARD */}
                  {(selectedRegionTab === 'all' || selectedRegionTab === 'asia') && (
                    <div className="bg-slate-950/70 p-5 rounded-xl border border-slate-800 flex flex-col justify-between hover:border-amber-500/30 transition-all group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-bl-full pointer-events-none group-hover:bg-amber-500/10 transition-colors"></div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-md font-bold tracking-wider font-mono">
                            ASIA REGION
                          </span>
                          <div className="bg-amber-500/10 text-amber-500 p-2 rounded-lg border border-amber-500/20">
                            <Briefcase className="w-4 h-4 text-amber-400" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-200 text-right group-hover:text-amber-500 transition-colors">
                            {lang === 'en' ? 'Asia & Far East Network Hub' : 'الشبكة الآسيوية للخدمات والاستقدام'}
                          </h3>
                          <p className="text-slate-400 text-xs text-right mt-1.5 font-sans leading-relaxed">
                            {lang === 'en'
                              ? 'Comprehensive labor recruitment, commercial visitor visa processing, and air freight scheduling connecting major far-east systems directly with Saudi electronic gates.'
                              : 'تخليص تأشيرات الاستقدام وقرارات العمل، تنسيق الطيران والحجز الدولي، ومتابعة قنوات الربط الرقمية لجميع دول الخليج وجنوب شرق آسيا والشرق الأقصى.'}
                          </p>
                        </div>
                        
                        {/* Dynamic list of cities/nodes */}
                        <div className="pt-2">
                          <span className="text-[10px] text-slate-505 text-slate-400 font-bold block text-right mb-1.5 font-sans">{lang === 'en' ? 'Active Digital Nodes:' : 'محطات النشر والبوابات النشطة:'}</span>
                          <div className="flex flex-wrap gap-1 justify-end">
                            {['مومباي', 'مانيلا', 'جاكرتا', 'دكا', 'نيودلهي', 'كراتشي', 'كولومبو'].map(node => (
                              <span key={node} className="text-[9px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-sans">
                                {node}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-900 pt-3 mt-4 flex justify-between items-center text-[10px]">
                        <span className="text-slate-500 font-sans">{lang === 'en' ? 'Target Audience Coverage' : 'تغطية الجمهور المستهدف'}</span>
                        <strong className="text-amber-400 font-extrabold font-sans">+ 15,000 {lang === 'en' ? 'Beneficiaries' : 'مستفيد'}</strong>
                      </div>
                    </div>
                  )}

                  {/* AFRICA CARD */}
                  {(selectedRegionTab === 'all' || selectedRegionTab === 'africa') && (
                    <div className="bg-slate-950/70 p-5 rounded-xl border border-slate-800 flex flex-col justify-between hover:border-emerald-500/30 transition-all group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors"></div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md font-bold tracking-wider font-mono">
                            AFRICA REGION
                          </span>
                          <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-lg border border-emerald-500/20">
                            <Truck className="w-4 h-4 text-emerald-400" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-200 text-right group-hover:text-emerald-400 transition-colors">
                            {lang === 'en' ? 'African Logistics & Travel Gate' : 'الشبكة الأفريقية للنقل والتأشيرات'}
                          </h3>
                          <p className="text-slate-400 text-xs text-right mt-1.5 font-sans leading-relaxed">
                            {lang === 'en'
                              ? 'Visit procedures, business visa clearances, and land/air cargo networks spanning North, East, and central Africa countries, built with unified custom routes.'
                              : 'إنجاز موافقات تأشيرات العمل والزيارة المتبادلة، تأمين اللوجستيات البرية والبحرية، الترانزيت، والشحن الجوي لرفد التجارة وتدفق المعاملات بمرونة كاملة.'}
                          </p>
                        </div>

                        {/* Dynamic list of cities/nodes */}
                        <div className="pt-2">
                          <span className="text-[10px] text-slate-505 text-slate-400 font-bold block text-right mb-1.5 font-sans">{lang === 'en' ? 'Active Digital Nodes:' : 'محطات النشر والبوابات النشطة:'}</span>
                          <div className="flex flex-wrap gap-1 justify-end">
                            {['القاهرة', 'الدار البيضاء', 'الخرطوم', 'أديس أبابا', 'نيروبي', 'تونس'].map(node => (
                              <span key={node} className="text-[9px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-sans">
                                {node}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-900 pt-3 mt-4 flex justify-between items-center text-[10px]">
                        <span className="text-slate-500 font-sans">{lang === 'en' ? 'Target Audience Coverage' : 'تغطية الجمهور المستهدف'}</span>
                        <strong className="text-emerald-400 font-extrabold font-sans">+ 9,800 {lang === 'en' ? 'Beneficiaries' : 'مستفيد'}</strong>
                      </div>
                    </div>
                  )}

                  {/* EUROPE & AMERICAS CARD */}
                  {(selectedRegionTab === 'all' || selectedRegionTab === 'europe_americas') && (
                    <div className="bg-slate-950/70 p-5 rounded-xl border border-slate-800 flex flex-col justify-between hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-bl-full pointer-events-none group-hover:bg-indigo-500/10 transition-colors"></div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-md font-bold tracking-wider font-mono">
                            EUROPE & AMERICAS
                          </span>
                          <div className="bg-indigo-500/10 text-indigo-400 p-2 rounded-lg border border-indigo-500/20">
                            <Compass className="w-4 h-4 text-indigo-400" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-200 text-right group-hover:text-indigo-400 transition-colors">
                            {lang === 'en' ? 'Europe & Americas Diplomatic Gateway' : 'بوابة أوروبا والأمريكتين لربط المعاملات'}
                          </h3>
                          <p className="text-slate-400 text-xs text-right mt-1.5 font-sans leading-relaxed">
                            {lang === 'en'
                              ? 'Handling priority commercial delegations, tourist visas clearance, academic validation, and global verification of documents across EU countries, UK, USA, and Canada.'
                              : 'تأمين وتسجيل تأشيرات الوفود التجارية، السياحة المتميزة، تصديق الوثائق الأكاديمية والمهنية، والربط الحكومي الموثق مع الاتحاد الأوروبي والمملكة المتحدة والولايات المتحدة وكندا بمرونة كاملة.'}
                          </p>
                        </div>

                        {/* Dynamic list of cities/nodes */}
                        <div className="pt-2">
                          <span className="text-[10px] text-slate-505 text-slate-400 font-bold block text-right mb-1.5 font-sans">{lang === 'en' ? 'Active Digital Nodes:' : 'محطات النشر والبوابات النشطة:'}</span>
                          <div className="flex flex-wrap gap-1 justify-end">
                            {['لندن', 'باريس', 'واشنطن', 'نيويورك', 'فرانكفورت', 'روما', 'تورونتو'].map(node => (
                              <span key={node} className="text-[9px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-sans">
                                {node}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-900 pt-3 mt-4 flex justify-between items-center text-[10px]">
                        <span className="text-slate-500 font-sans">{lang === 'en' ? 'Target Audience Coverage' : 'تغطية الجمهور المستهدف'}</span>
                        <strong className="text-indigo-400 font-extrabold font-sans">+ 14,200 {lang === 'en' ? 'Beneficiaries' : 'مستفيد'}</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Telemetry Real-time network health - occupies 4 cols on lg */}
                <div className="lg:col-span-4 bg-slate-950 p-5 rounded-xl border border-slate-800 hover:border-indigo-500/30 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-extrabold text-xs text-slate-300 uppercase tracking-widest text-right flex items-center justify-end gap-1.5 border-b border-slate-900 pb-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                      <span>{lang === 'en' ? 'Global Platform Telemetry' : 'لوحة متابعة الأداء الجغرافي العالمي للمنصة'}</span>
                    </h4>

                    <div className="space-y-2 font-sans select-none">
                      {/* Stat 1 */}
                      <div className="flex justify-between items-center bg-slate-900/50 p-2 rounded-lg border border-slate-800 text-[10px]">
                        <span className="text-slate-400">{lang === 'en' ? 'Avg Processing' : 'متوسط مدة الإنجاز'}</span>
                        <strong className="text-emerald-400 font-bold">{lang === 'en' ? '48 Hrs' : '٤٨ ساعة عمل'}</strong>
                      </div>
                      {/* Stat 2 */}
                      <div className="flex justify-between items-center bg-slate-900/50 p-2 rounded-lg border border-slate-800 text-[10px]">
                        <span className="text-slate-400">{lang === 'en' ? 'Active Routes' : 'مسارات الشحن والنقل'}</span>
                        <strong className="text-amber-400 font-bold">{lang === 'en' ? '32 Express Lines' : '٣٢ خط نقل مباشر'}</strong>
                      </div>
                      {/* Stat 3 */}
                      <div className="flex justify-between items-center bg-slate-900/50 p-2 rounded-lg border border-slate-800 text-[10px]">
                        <span className="text-slate-400">{lang === 'en' ? 'Security Index' : 'مؤشر أمان وخصوصية المعاملة'}</span>
                        <strong className="text-slate-200 font-bold">100% {lang === 'en' ? 'Encrypted' : 'تشفير كامل'}</strong>
                      </div>
                      {/* Stat 4 */}
                      <div className="flex justify-between items-center bg-slate-900/50 p-2 rounded-lg border border-slate-800 text-[10px]">
                        <span className="text-slate-400">{lang === 'en' ? 'Connected Embassies' : 'السفارات والقنصليات المعرفّة'}</span>
                        <strong className="text-indigo-400 font-bold">٨٤ {lang === 'en' ? 'Diplomatic Mission' : 'بعثة دبلوماسية عالمية'}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-850 space-y-1">
                    <span className="text-[9px] text-slate-500 font-bold block text-right font-sans">{lang === 'en' ? 'Operations Note:' : 'ملاحظة تشغيلية مهمة:'}</span>
                    <p className="text-[9px] text-slate-400 leading-normal text-right font-sans">
                      {lang === 'en'
                        ? 'Website publishing sphere is globally distributed and highly optimized across all international nodes. Data streams are secured via globally redundant private channels.'
                        : 'يتم نشر الموقع الرسمي بنطاق جغرافي عالمي وتغطية إلكترونية نشطة ممتدة حول العالم لتقديم أعلى معايير تخليص المعاملات والربط الدبلوماسي العابر للقارات.'}
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* SERVICES PREVIEW CARDS */}
            <section className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-300 pb-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">دليل الخدمات والتكاليف والرسوم</h2>
                  <p className="text-slate-500 text-sm mt-1">تحديد دقيق وموثق للتكاليف الإدارية للمكتب والرسوم التابعة للدولة قبل البدء بالمعاملة.</p>
                </div>
                <span className="text-xs bg-slate-200 text-slate-600 hover:bg-slate-300 font-bold px-3 py-1.5 rounded-full mt-2 md:mt-0 font-sans">
                  محدثة حسب اللوائح الضريبية لعام 2026 (15%)
                </span>
              </div>

              {/* Category & Sub-category Filter Tabs */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 md:p-5 space-y-4 text-right">
                <div className="flex flex-wrap items-center gap-1.5 justify-start">
                  <span className="text-[11px] font-sans font-black text-slate-500 ml-2">🗂️ {lang === 'en' ? 'Main Category:' : 'الفئة الإدارية:'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setHomeFilterCategory('all');
                      setHomeFilterSubCategory('all');
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                      homeFilterCategory === 'all' 
                        ? 'bg-slate-950 text-white shadow-3xs' 
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-205'
                    }`}
                  >
                    <span>{lang === 'en' ? 'All Services' : 'كافة الخدمات والتعقيب'}</span>
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setHomeFilterCategory(cat.id);
                        setHomeFilterSubCategory('all');
                      }}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                        homeFilterCategory === cat.id 
                          ? 'bg-amber-600 text-slate-950 shadow-3xs border border-amber-650' 
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-205'
                      }`}
                    >
                      <span>{cat.nameAr}</span>
                    </button>
                  ))}
                </div>

                {/* Subcategory pills rendered only when specific category is active */}
                {homeFilterCategory !== 'all' && (
                  <div className="flex flex-wrap items-center gap-1.5 justify-start pt-3.5 border-t border-slate-200/50">
                    <span className="text-[11px] font-sans font-black text-slate-400 ml-2">🏷️ {lang === 'en' ? 'Subcategory:' : 'النوع الفرعي التابع:'}</span>
                    <button
                      type="button"
                      onClick={() => setHomeFilterSubCategory('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        homeFilterSubCategory === 'all' 
                          ? 'bg-slate-700 text-white shadow-3xs' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium'
                      }`}
                    >
                      <span>{lang === 'en' ? 'Show All' : 'الكل'}</span>
                    </button>
                    {subCategories.filter(sc => sc.parentId === homeFilterCategory).length === 0 ? (
                      <span className="text-[10px] text-slate-400 italic">لا توجد باقات أو فروع فرعية مضافة تحت هذه الفئة بعد.</span>
                    ) : (
                      subCategories.filter(sc => sc.parentId === homeFilterCategory).map(sc => (
                        <button
                          key={sc.id}
                          type="button"
                          onClick={() => setHomeFilterSubCategory(sc.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            homeFilterSubCategory === sc.id 
                              ? 'bg-indigo-600 text-white shadow-3xs' 
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium'
                          }`}
                        >
                          <span>{sc.nameAr}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(() => {
                  const filteredList = services.filter(s => {
                    const matchesCat = homeFilterCategory === 'all' || s.category === homeFilterCategory;
                    const matchesSub = homeFilterSubCategory === 'all' || s.subCategory === homeFilterSubCategory;
                    return matchesCat && matchesSub;
                  });

                  if (filteredList.length === 0) {
                    return (
                      <div className="col-span-full py-16 text-center bg-slate-50 rounded-3xl border border-slate-200/60 text-slate-500 font-sans">
                        <span className="text-3xl block mb-2">⚠️</span>
                        <p className="text-sm font-black text-slate-800">عذراً، لا تتوفر أي خدمات نشطة في مكتب سما ضمن التصاميم والمحدد حالياً.</p>
                        <p className="text-xs text-slate-400 mt-1.5 font-sans">تفضل بتغيير خيارات التصفية أو تصفح الأقسام الأخرى.</p>
                      </div>
                    );
                  }

                  return filteredList.slice(0, visibleServicesCount).map(s => (
                    <ServiceParallaxCard 
                      key={s.id}
                      service={s}
                      onSelect={(serviceId) => {
                        setSelectedServiceId(serviceId);
                        // Scroll to form smoothly
                        document.getElementById('booking-anchor')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      onDetails={(service) => setInfoPopupService(service)}
                      renderIcon={renderServiceIcon}
                    />
                  ));
                })()}
              </div>

              {services.length > 10 && (
                <div className="text-center pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  {visibleServicesCount < services.length ? (
                    <button
                      type="button"
                      id="load-more-services-btn"
                      onClick={() => setVisibleServicesCount(prev => prev + 10)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-full shadow-sm hover:shadow transition-all cursor-pointer"
                    >
                      <span>🔽 عرض المزيد من الخدمات ({services.length - visibleServicesCount})</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      id="show-less-services-btn"
                      onClick={() => setVisibleServicesCount(10)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-800 font-bold text-xs rounded-full shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                    >
                      <span>🔼 طي الخدمات وعرض أقل</span>
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* SAUDI LABOR MINISTRY NEWS SECTION WITH GOOGLE SEARCH GROUNDING */}
            <section className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 border border-slate-850 shadow-xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1 text-right">
                  <div className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-[10px] font-black border border-blue-500/20 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse text-blue-400" />
                    <span>تأصيل بحث جوجل المباشر (Google Search Grounding Live)</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-100 font-sans">
                    مستجدات الأنظمة وقرارات وزارة الموارد البشرية والعمل السعودية
                  </h2>
                  <p className="text-slate-400 text-xs leading-relaxed max-w-3xl">
                    بوابة أخبار ذكية مدمجة بالذكاء الاصطناعي الفوري ومؤسسة على نتائج البحث الحي لعام 2026 لمتابعة لوائح التأشيرات والعمل والعمالة المنزلية والمهنية عبر المنصات الرسمية (قوى، مساند، وزارة الموارد البشرية).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fetchLaborNews}
                  disabled={isNewsLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all self-stretch md:self-auto justify-center disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isNewsLoading ? 'animate-spin' : ''}`} />
                  <span>{isNewsLoading ? 'يجري جلب وتأصيل المستجدات...' : 'تحديث الأخبار فورياً'}</span>
                </button>
              </div>

              {newsError ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center space-y-2 text-right">
                  <p className="text-xs text-red-400 font-sans font-bold">⚠️ {newsError}</p>
                  <button
                    type="button"
                    onClick={fetchLaborNews}
                    className="text-[10px] underline text-red-300 font-bold hover:text-red-200"
                  >
                    محاولة الاتصال مرة أخرى
                  </button>
                </div>
              ) : isNewsLoading ? (
                <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="relative flex h-8 w-8">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-8 w-8 bg-blue-500 items-center justify-center">
                      <RefreshCw className="w-4 h-4 text-white animate-spin" />
                    </span>
                  </div>
                  <div className="space-y-1 text-center">
                    <p className="text-xs font-black text-slate-200">يجري فحص وتجميع أحدث القرارات الرسمية الصادرة من وزارة الموارد البشرية السعودية من الويب...</p>
                    <p className="text-[10px] text-slate-505">يتضمن البحث المباشر في لوائح التأشيرات، رخص العمل، قرارات الاستقدام الحالية (Musaned & Qiwa)</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="bg-slate-950/65 border border-slate-850 rounded-xl p-6 shadow-inner text-right relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500"></div>
                    <div className="prose prose-invert prose-xs max-w-none text-slate-200 leading-relaxed font-sans whitespace-pre-wrap text-xs md:text-sm">
                      {laborNews || "انقر فوق زر تحديث الأخبار لعرض مستجدات العمل والعمالة بالتأصيل الحي."}
                    </div>
                  </div>

                  {laborNewsSources && laborNewsSources.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-extrabold text-slate-300 flex items-center justify-start gap-1 text-right">
                        <span>🔗</span>
                        <span>مصادر ومراجع التحقق والتأصيل الرقمي (Grounding Sources):</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {laborNewsSources.map((src, idx) => (
                          <a
                            key={idx}
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-850 hover:border-blue-500/40 rounded-lg text-[10px] md:text-xs text-blue-400 hover:text-blue-300 transition-all font-bold group"
                          >
                            <span className="truncate max-w-[85%] text-right">{src.title}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* REALTIME SYSTEM SUBMIT FORM */}
            <section id="booking-anchor" className="bg-slate-100 py-10 rounded-2xl border border-slate-200 shadow-inner px-4 block">
              <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-l from-slate-900 to-slate-800 text-white p-6 space-y-1">
                  <div className="flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-amber-500" />
                    <h3 className="text-xl font-bold">
                      {lang === 'en' ? 'Submit or Book a New Transaction' : 'تقديم أو حجز معاملة جديدة'}
                    </h3>
                  </div>
                  <p className="text-slate-300 text-xs">
                    {lang === 'en' ? 'Register your details and you will receive instant follow-up alerts from the reviewing staff.' : 'سجل بياناتك وسيصلك إشعار المتابعة والترحيل الفوري من فريق المراجعة.'}
                  </p>
                </div>

                <form onSubmit={handleClientBookingSubmit} className="p-6 space-y-4">
                  {submissionFeedback && (
                    <div className={`p-3 rounded-lg border text-sm flex items-start gap-2.5 ${submissionFeedback.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                      {submissionFeedback.success ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />}
                      <div>
                        {submissionFeedback.msg}
                        {submissionFeedback.success && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTx(null);
                              setActiveTab('track');
                              setHasSearched(true);
                              const searchInput = document.getElementById('search-phone-input') as HTMLInputElement;
                              if (searchInput) searchInput.value = searchPhone;
                            }}
                            className="block text-emerald-700 underline font-bold mt-1 text-xs"
                          >
                            {lang === 'en' ? 'Go to live tracking & inquiry portal now →' : 'انتقل للاستعلام وتتبع حالة المعاملة الآن ←'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {lang === 'en' ? 'Beneficiary Full Name (Quadruple):' : 'اسم العميل المستفيد بالكامل:'}
                      </label>
                      <input 
                        type="text" 
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder={lang === 'en' ? 'e.g., Abdullah bin Mohammed Al-Otaibi' : 'مثل: عبد الله بن محمد العتيبي'} 
                        className="w-full p-3 border border-slate-300 rounded focus:outline-none focus:border-amber-500 font-sans shadow-sm text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          {lang === 'en' ? 'Mobile Number (associated with WhatsApp):' : 'رقم جوال العميل للتواصل والمتابعة:'}
                        </label>
                        <input 
                          type="tel" 
                          required
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder={lang === 'en' ? 'e.g., 05xxxxxxxx' : 'مثلاً: 0501234567'} 
                          className="w-full p-3 border border-slate-300 rounded focus:outline-none focus:border-amber-500 font-mono shadow-sm text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          {lang === 'en' ? 'Select Required Service Type:' : 'اختر نوع الخدمة المطلوبة:'}
                        </label>
                        <select 
                          required
                          value={selectedServiceId}
                          onChange={(e) => setSelectedServiceId(e.target.value)}
                          className="w-full p-3 border border-slate-300 rounded bg-white focus:outline-none focus:border-amber-500 shadow-sm text-sm font-sans"
                        >
                          <option value="">{lang === 'en' ? 'Select procedural service...' : 'اختر الخدمة الإجرائية...'}</option>
                          {services.map(s => (
                            <option key={s.id} value={s.id}>
                              {lang === 'en' ? (s.nameEn || s.name) : s.name} ({lang === 'en' ? `Fees: ${s.officeFee} SAR + Gov Fees: ${s.govFee} SAR` : `أتعاب: ${s.officeFee} ر.س + رسوم جهة: ${s.govFee} ر.س`})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {lang === 'en' ? 'Any additional notes, specifications, or details:' : 'أي ملاحظات إضافية، مستندات، أو متطلبات خاصة:'}
                      </label>
                      <textarea 
                        value={clientNotes}
                        onChange={(e) => setClientNotes(e.target.value)}
                        placeholder={lang === 'en' ? 'Please write any extra details like visa destination country, family size, or special administrative requirements...' : 'دون هنا تفاصيل الطلب الإضافية مثل أعداد الأفراد، الجهة المقصودة للتأشيرة، أي تعليمات خاصة بالإدارة الحكومية...'}
                        className="w-full p-3 border border-slate-300 rounded focus:outline-none focus:border-amber-500 h-28 font-sans shadow-sm text-sm"
                      ></textarea>
                    </div>

                    {/* Integrated PDF Document Upload */}
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                        <span>
                          {lang === 'en' ? 'Attach Transaction Documents in PDF (Optional - National ID, Registry):' : 'إرفاق مستندات المعاملة بصيغة PDF (اختياري - كالهوية الوطنية، السجل، أو المتطلبات):'}
                        </span>
                      </label>
                      <div className="relative border-2 border-dashed border-slate-200 hover:border-amber-500/80 rounded-lg p-5 bg-[#fafbfd] hover:bg-slate-50 transition duration-150 flex flex-col items-center justify-center cursor-pointer min-h-[120px]">
                        <input 
                          type="file" 
                          id="client-pdf-upload"
                          accept=".pdf"
                          multiple
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        />
                        <div className="text-center space-y-1.5 select-none pointer-events-none">
                          <Upload className="w-8 h-8 text-slate-400 mx-auto" strokeWidth={1.5} />
                          <p className="text-xs text-slate-600 font-bold">
                            {lang === 'en' ? 'Drag & drop PDF files here, or click to choose' : 'اسحب ملفات الـ PDF وأفلتها هنا أو انقر للتحديد من جهازك'}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {lang === 'en' ? 'Supports multiple PDF documents (Max 4MB per file)' : 'يقبل النظام ملفات متعددة بصيغة PDF فقط (بحد أقصى 4 ميجابايت للملف الواحد)'}
                          </p>
                        </div>
                      </div>

                      {/* Uploading Files Progress (Shown during active upload) */}
                      {Object.keys(uploadProgresses).length > 0 && (
                        <div className="space-y-2.5">
                          <p className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                            <span>{lang === 'en' ? 'Currently uploading and processing document files...' : 'يجري رفع معالجة الملفات المحددة حالياً...'}</span>
                          </p>
                          {Object.entries(uploadProgresses).map(([fileName, details]) => {
                            const info = details as { progress: number; size: string };
                            return (
                              <div key={fileName} className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 select-none relative z-30 animate-fade-in font-sans">
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileText className="w-4 h-4 text-amber-600 flex-shrink-0 animate-pulse" />
                                    <div className={`${lang === 'en' ? 'text-left' : 'text-right'} min-w-0`}>
                                      <p className="font-bold text-slate-700 truncate max-w-[250px]" title={fileName}>{fileName}</p>
                                      <p className="text-[9px] text-slate-400 font-mono">{info.size}</p>
                                    </div>
                                  </div>
                                  <span className="font-extrabold text-amber-600 font-mono text-[11px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">{info.progress}%</span>
                                </div>
                                {/* Progress bar */}
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-amber-500 h-full rounded-full transition-all duration-100" 
                                    style={{ width: `${info.progress}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Completed/Attached Files List */}
                      {attachedFiles.length > 0 && (
                        <div className="space-y-2.5 font-sans">
                          <p className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>
                              {lang === 'en' ? `Attached Documents (${attachedFiles.length}):` : `المستندات المرفقة بنجاح (${attachedFiles.length}):`}
                            </span>
                          </p>
                          <div className="space-y-2">
                            {attachedFiles.map((file, idx) => (
                              <div key={idx} className="w-full flex items-center justify-between bg-emerald-50 border border-emerald-150 p-2.5 rounded-lg text-xs select-none relative z-30 animate-fade-in hover:bg-emerald-50/80 transition-colors">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                  <div className={`${lang === 'en' ? 'text-left' : 'text-right'} min-w-0`}>
                                    <p className="font-bold text-slate-800 truncate max-w-[280px]" title={file.name}>{file.name}</p>
                                    <p className="text-[10px] text-slate-500 font-mono">{file.size}</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setAttachedFiles(prev => prev.filter((_, fIdx) => fIdx !== idx));
                                  }}
                                  className="text-[11px] text-red-600 hover:text-red-700 bg-white hover:bg-red-50 px-2.5 py-1.5 rounded-md border border-red-100 hover:border-red-200 transition font-extrabold relative z-40"
                                  title={lang === 'en' ? 'Remove this document' : 'إزالة هذا المستند'}
                                >
                                  {lang === 'en' ? '✕ Remove' : '✕ إزالة'}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button 
                      type="submit" 
                      className="w-full bg-slate-900 border border-slate-950 text-white hover:bg-slate-800 transition py-3.5 rounded-lg text-sm font-bold shadow-md flex items-center justify-center gap-2"
                    >
                      <span>{lang === 'en' ? 'Confirm Submission & Route to Sama Al-Mamlakah Office' : 'تأكيد الإرسال والترحيل لمكتب سما المملكة'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </div>
        )}
        {activeTab === 'track' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                <Search className="w-5.5 h-5.5 text-amber-600" />
                <span>
                  {lang === 'en' ? 'Interactive Transaction Status Tracking & Financial Inquiries' : 'الاستعلام التفاعلي عن حالة المعاملات والطلبات المالية'}
                </span>
              </h2>
              <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                {lang === 'en' ? 'Please enter your registered mobile phone number when submitting your booking request to view live statuses and access simplified invoices immediately.' : 'يرجى إدخال رقم الجوال المسجل عند تقديم المعاملة لاستعراض حالة طلبك فورياً، والاطلاع على الفاتورة المبسطة وتنزيلها للعملاء الذين أكملوا سداد رسوم المعاملة الإدارية.'}
              </p>

              <form onSubmit={handleTrackPhoneNumberLookup} className="mt-5 max-w-lg">
                <div className="flex gap-2">
                  <input
                    type="tel"
                    id="search-phone-input"
                    value={searchPhone}
                    onChange={(e) => {
                      setSearchPhone(e.target.value);
                      setHasSearched(false);
                    }}
                    placeholder={lang === 'en' ? 'e.g., 05xxxxxxxx' : 'مثال رقم الجوال: 0501234567'}
                    className="flex-1 p-3 border-2 border-slate-300 rounded focus:outline-none focus:border-slate-800 font-mono text-sm"
                  />
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded text-sm whitespace-nowrap transition-colors flex items-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    <span>{lang === 'en' ? 'Track Now' : 'تتبع الآن'}</span>
                  </button>
                </div>
              </form>
            </div>

            {hasSearched ? (
              trackedRequests.length > 0 ? (
                <div className="space-y-4">
                  <div className="text-slate-700 font-bold text-sm">
                    {lang === 'en' ? `We found (${trackedRequests.length}) registered transactions associated with your lookup:` : `وجدنا عدد (${trackedRequests.length}) معامِلات مسجلة لطلبك المالي:`}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {trackedRequests.map(b => {
                      // Lookup corresponding transaction
                      // If the request has matched name & service, let's link
                      const correspondingTx = transactions.find(
                        t => t.clientName.trim() === b.clientName.trim() && t.serviceName.trim() === b.serviceName.trim()
                      );

                      return (
                        <div key={b.id} className="bg-white border-r-4 border-l border-t border-b border-slate-200 rounded-lg p-5 shadow-sm relative flex flex-col justify-between"
                          style={{
                            borderRightColor: 
                              b.status === 'completed' ? '#10b981' : 
                              b.status === 'processing' ? '#3b82f6' : 
                              b.status === 'cancelled' ? '#ef4444' : '#f59e0b'
                          }}
                        >
                          <div>
                            <div className="flex flex-wrap gap-2 items-center justify-between mb-3 border-b border-slate-100 pb-2">
                              <div className="flex items-center gap-1.5 font-mono text-xs text-slate-500 font-bold">
                                <span>{lang === 'en' ? `Tran ID: #${b.id.substring(3, 9)}` : `معاملة ID: #${b.id.substring(3, 9)}`}</span>
                                {b.paymentStatus && (
                                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                                    b.paymentStatus === 'paid' ? 'bg-emerald-550/10 text-emerald-700 border border-emerald-550/20' :
                                    b.paymentStatus === 'processing_transfer' ? 'bg-indigo-550/10 text-indigo-700 border border-indigo-550/20' :
                                    'bg-amber-550/10 text-amber-700 border border-amber-550/20'
                                  }`}>
                                    {b.paymentStatus === 'paid' && `💳 ${lang === 'en' ? 'Paid' : 'مسددة'} (${b.paymentMethod?.toUpperCase()})`}
                                    {b.paymentStatus === 'processing_transfer' && `⏳ ${lang === 'en' ? 'Verifying' : 'تحت التدقيق الحسابي'}`}
                                    {b.paymentStatus === 'unpaid' && `💵 ${lang === 'en' ? 'Cash Pending' : 'سداد نقدي بمقر المكتب'}`}
                                  </span>
                                )}
                              </div>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                                b.status === 'completed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                                b.status === 'processing' ? 'bg-blue-50 text-blue-800 border border-blue-200 animate-subtle-pulse-blue font-extrabold' :
                                b.status === 'cancelled' ? 'bg-red-50 text-red-800 border border-red-200' :
                                'bg-amber-50 text-amber-800 border border-amber-200 animate-subtle-pulse-amber font-extrabold'
                              }`}>
                                {b.status === 'pending' && (lang === 'en' ? 'Pending Administrative Review' : 'قيد الانتظار لمراجعة الإدارة')}
                                {b.status === 'processing' && (lang === 'en' ? 'Processing & Executing' : 'تحت المعالجة الإجرائية الآن')}
                                {b.status === 'completed' && (lang === 'en' ? 'Completed & Invoice Ready' : 'مكتملة ومستند الفاتورة جاهز')}
                                {b.status === 'cancelled' && (lang === 'en' ? 'Cancelled' : 'ملغية')}
                              </span>
                            </div>

                            <h4 className="text-base font-black text-slate-900 mb-1">{b.serviceName}</h4>
                            <p className="text-slate-500 text-xs mb-3 font-mono">
                              {lang === 'en' ? `Booking Date: ${new Date(b.date).toLocaleDateString('en-US')}` : `تاريخ تقديم الطلب المالي: ${new Date(b.date).toLocaleDateString('ar-SA')}`}
                            </p>
                            
                            {b.notes && (
                              <div className="text-xs bg-slate-50 p-2.5 rounded border border-slate-200 text-slate-600 line-clamp-2 mb-4 font-sans">
                                <strong>{lang === 'en' ? 'Your booking notes:' : 'ملاحظاتك للطلب:'}</strong> {b.notes}
                              </div>
                            )}

                            {/* Dynamic Customizable Admin Status Message */}
                            <div className={`text-xs p-3.5 rounded-lg border leading-relaxed mb-4 font-sans shadow-3xs ${
                              b.status === 'completed' ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' :
                              b.status === 'processing' ? 'bg-blue-50/60 border-blue-200 text-blue-950' :
                              b.status === 'cancelled' ? 'bg-red-50/60 border-red-200 text-red-950' :
                              'bg-amber-50/60 border-amber-200 text-amber-950'
                            }`}>
                              <div className="flex items-center gap-1.5 font-extrabold mb-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 animate-pulse" />
                                <span className="text-slate-900 text-[11px]">{lang === 'en' ? 'Instant status feedback statement:' : 'رسالة إفادة حالة الطلب الفورية:'}</span>
                              </div>
                              <p className="font-medium text-slate-800 antialiased whitespace-pre-wrap leading-normal">
                                {b.status === 'pending' && statusMsgPending}
                                {b.status === 'processing' && statusMsgProcessing}
                                {b.status === 'completed' && statusMsgCompleted}
                                {b.status === 'cancelled' && statusMsgCancelled}
                              </p>
                            </div>

                            {getBookingFiles(b).length > 0 && (
                              <div className="space-y-2 mb-4">
                                <p className="text-[10px] font-bold text-slate-500">
                                  {lang === 'en' ? `Official Attached Documents (${getBookingFiles(b).length}):` : `المستندات الرسمية المرفقة (${getBookingFiles(b).length}):`}
                                </p>
                                {getBookingFiles(b).map((file, fIdx) => (
                                  <div key={fIdx} className="text-xs bg-emerald-50/40 p-2 rounded-lg border border-emerald-150 text-slate-700 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <Paperclip className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                      <span className={`${lang === 'en' ? 'text-left' : 'text-right'} truncate font-bold text-slate-850`} title={file.name}>
                                        {file.name}
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-mono">({file.size})</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                      {file.data && (
                                        <a
                                          href={file.data}
                                          download={file.name}
                                          className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 border border-amber-600 px-2.5 py-1 rounded shadow-3xs hover:shadow-2xs transition-all cursor-pointer"
                                          title={lang === 'en' ? 'Download file directly' : 'تنزيل المستند مباشرة'}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Download className="w-3 h-3" />
                                          <span>{lang === 'en' ? 'Download' : 'تنزيل'}</span>
                                        </a>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedViewBooking(b);
                                          setPreviewFile(file);
                                        }}
                                        className="text-[10px] bg-emerald-100 text-emerald-800 hover:bg-emerald-200 px-2.5 py-1 rounded font-bold whitespace-nowrap transition-colors"
                                        title={lang === 'en' ? 'Preview document' : 'استعراض المستند'}
                                      >
                                        {lang === 'en' ? 'Preview' : 'معاينة'}
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                            <span className="text-xs text-slate-500 font-sans">
                              {lang === 'en' ? <>Beneficiary: <strong className="text-slate-800">{b.clientName}</strong></> : <>اسم المستفيد: <strong className="text-slate-800">{b.clientName}</strong></>}
                            </span>
                            {b.status === 'completed' && correspondingTx ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedTx(correspondingTx);
                                    setIsInvoiceOpen(true);
                                  }}
                                  className="bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-300 font-bold text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                                  title={lang === 'en' ? 'View Tax Simplified Invoice Details' : 'استعراض تفاصيل الفاتورة الضريبية'}
                                >
                                  <Receipt className="w-3.5 h-3.5 text-sky-600" />
                                  <span>{lang === 'en' ? 'Invoice details' : 'تفاصيل الفاتورة'}</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedTx(correspondingTx);
                                    setIsInvoiceOpen(true);
                                    setDirectPrintActive(true);
                                  }}
                                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                                  title={lang === 'en' ? 'Print simplified VAT invoice' : 'طباعة الفاتورة والعمولات مباشرة'}
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>{lang === 'en' ? 'Print Invoice' : 'طباعة الفاتورة'}</span>
                                </button>
                              </div>
                            ) : b.status === 'completed' ? (
                              <div className="text-[11px] text-slate-400 font-sans italic">
                                {lang === 'en' ? 'The administration will link this service with the ledger shortly to generate the invoice file.' : 'يرجى من الإدارة ربط المعاملة بالدفتر المالي لتظهر الفاتورة'}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic font-sans flex items-center gap-1">
                                <Activity className="w-3.5 h-3.5 animate-pulse text-amber-600" />
                                <span>{lang === 'en' ? 'Invoice will populate automatically upon execution & financial clearance' : 'ستظهر الفاتورة فور الإنجاز والترحيل المالي'}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 text-amber-950 p-5 rounded-lg border border-amber-200 max-w-lg flex gap-3 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-1">{lang === 'en' ? 'No Registered Transactions Found' : 'لم نجد أي معاملات مسجلة'}</span>
                    {lang === 'en' ? (
                      <>The number you entered <strong className="font-mono text-slate-900">"{searchPhone}"</strong> does not match any current transaction in the Sama Al-Mamlakah Office archive. Please verify that the number matches the one submitted in the booking form.</>
                    ) : (
                      <>الرقم الذي أدخلته <strong className="font-mono text-slate-900">"{searchPhone}"</strong> لا يطابق أي معاملة حالية في أرشيف مكتب سما المملكة. يرجى التأكد من كتابة الرقم بشكل صحيح الذي تم تقديمه خلال استمارة الحجز."</>
                    )}
                  </div>
                </div>
              )
            ) : (
              <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-300 rounded-xl bg-white max-w-xl">
                <HelpCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-xs">
                  {lang === 'en' ? 'Please fill in your mobile phone number above to track your requests or print your verified automated invoices.' : 'يرجى تعبئة رقم جوالك بالأعلى لمتابعة طلباتك أو إصدار فواتيرك بطريقة آلية معتمدة.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 2.5: JOBS & ANNOUNCEMENTS BOARD ==================== */}
        {activeTab === 'jobs' && (
          <div className="space-y-8 animate-fade-in font-sans" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            
            {/* Header Banner */}
            <div className="relative overflow-hidden bg-slate-950 text-white p-8 rounded-2xl shadow-xl border border-slate-800">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600/10 via-slate-900/40 to-slate-950 opacity-90 z-0"></div>
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-amber-500/15 text-amber-500 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border border-amber-500/20">
                      {lang === 'ar' ? 'بوابة الكفاءات والتعاميم' : 'Talent & Announcement Portal'}
                    </span>
                    <span className="bg-emerald-500/15 text-emerald-400 px-3 py-1 rounded-full text-xs font-black tracking-wider border border-emerald-500/20">
                      ● {lang === 'ar' ? 'محدثة اليوم' : 'Updated Today'}
                    </span>
                  </div>
                  <h1 className="text-3xl font-black text-amber-500 tracking-tight">
                    {lang === 'ar' ? 'الشواغر الإدارية والتعاميم الرسمية' : 'Careers & Official Circulars'}
                  </h1>
                  <p className="text-slate-350 text-sm mt-2 max-w-2xl">
                    {lang === 'ar' 
                      ? 'المنصة النشطة لتوظيف الكفاءات الوطنية وإعلان التعاميم التشغيلية والعروض الصادرة مباشرة من الهيئة العليا لمكتب سما المملكة.' 
                      : 'The active platform for recruiting national talents and broadcasting operational circulars and offers directly from Sama Al-Mamlakah Management.'}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      // Navigate client to submit request on home page
                      setActiveTab('home');
                      setTimeout(() => {
                        const formElem = document.getElementById('booking-form-section');
                        if (formElem) {
                          formElem.scrollIntoView({ behavior: 'smooth' });
                        }
                      }, 120);
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <FolderPlus className="w-4 h-4" />
                    {lang === 'ar' ? 'طلب معاملة جديدة' : 'Order New Transaction'}
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Layout with sidebar grids */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Sidebar Panel - Social Media Integration Connections Hub (4 Cols) */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Community Connection Widget */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-md p-5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600"></div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-1.5">
                    <Share2 className="w-5 h-5 text-amber-600 animate-pulse" />
                    <span>{lang === 'ar' ? 'شركاؤنا المتصلون وقنواتنا' : 'Connected Channels Hub'}</span>
                  </h3>
                  <p className="text-slate-500 text-xs leading-relaxed mb-4">
                    {lang === 'ar' 
                      ? 'جميع العروض والتعاميم المعروضة هنا يتم مزامنتها وبثها تلقائياً على قنوات مكتب سما المملكة الرسمية لضمان وصولها للمستفيدين.' 
                      : 'All circulars and jobs published here are automatically broadcasted across Sama Al-Mamlakah official accounts in real-time.'}
                  </p>

                  <div className="space-y-3">
                    {/* Twitter Link */}
                    {socialTwitter ? (
                      <a href={socialTwitter} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-slate-105 text-slate-800 rounded-lg">
                            <Twitter className="w-4 h-4 text-slate-900" />
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-800">{lang === 'ar' ? 'منصة X الرسمية للمكتب' : 'Official X Community'}</p>
                            <span className="text-[10px] text-slate-400 font-mono">@sama_mamlakah</span>
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </a>
                    ) : (
                      <div className="flex items-center justify-between p-3 rounded-xl border border-dashed border-slate-100 opacity-60">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-slate-105 text-slate-400 rounded-lg">
                            <Twitter className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-medium text-slate-400">{lang === 'ar' ? 'منصة تويتر غير مهيأة' : 'X platform not set'}</span>
                        </div>
                      </div>
                    )}

                    {/* WhatsApp Community */}
                    {socialWhatsapp ? (
                      <a href={socialWhatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl border border-emerald-100 hover:border-emerald-250 bg-emerald-50/20 hover:bg-emerald-50/50 transition-all">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-emerald-600 text-white rounded-lg">
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-emerald-800">{lang === 'ar' ? 'قناة الواتساب التفاعلية والنبضية' : 'Interactive WhatsApp Broadcast'}</p>
                            <span className="text-[10px] text-emerald-500 font-bold">{lang === 'ar' ? 'انضم للمجتمع الإخباري' : 'Join News Forum'}</span>
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                      </a>
                    ) : (
                      <div className="flex items-center justify-between p-3 rounded-xl border border-dashed border-slate-100 opacity-60">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-slate-105 text-slate-400 rounded-lg">
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-medium text-slate-400">{lang === 'ar' ? 'واتساب غير مهيأ' : 'WhatsApp not set'}</span>
                        </div>
                      </div>
                    )}

                    {/* Linkedin */}
                    {socialLinkedin ? (
                      <a href={socialLinkedin} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-blue-700 text-white rounded-lg">
                            <Linkedin className="w-4 h-4" />
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-800">{lang === 'ar' ? 'لينكدإن للمسارات المهنية' : 'LinkedIn Careers Portal'}</p>
                            <span className="text-[10px] text-slate-400">Sama Al-Mamlakah Office</span>
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </a>
                    ) : (
                      <div className="flex items-center justify-between p-3 rounded-xl border border-dashed border-slate-100 opacity-60">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-slate-105 text-slate-400 rounded-lg">
                            <Linkedin className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-medium text-slate-400">{lang === 'ar' ? 'لينكدإن غير مهيأ' : 'LinkedIn not set'}</span>
                        </div>
                      </div>
                    )}

                    {/* Instagram/Facebook details */}
                    {socialInstagram && (
                      <a href={socialInstagram} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-pink-600 text-white rounded-lg">
                            <Instagram className="w-4 h-4" />
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-800">{lang === 'ar' ? 'حساب إنستغرام المصور' : 'Instagram Feed'}</p>
                            <span className="text-[10px] text-slate-400">@SamaMamlakah</span>
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Info Circular Alert */}
                <div className="bg-amber-50/50 border border-amber-500/10 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1 px-2 text-[10px] bg-amber-500 text-slate-950 rounded-md font-bold">
                      {lang === 'ar' ? 'موثوقية متبادلة' : 'Verified'}
                    </div>
                    <span className="text-xs font-black text-amber-900">{lang === 'ar' ? 'ملاحظة للمهنيين والمتقدمين' : 'Notes for Applicants'}</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    {lang === 'ar'
                      ? 'مكتب سما المملكة مصنف ومصادق من وزارة العمل والهيئات المشغلة لمزودي التأشيرات بالمملكة العربية السعودية لعام ٢٠٢٦. جميع عمليات التقديم للوظائف مجانية بالكامل ولن يطلب منك أي كادر مالي تحت أي ظرف.'
                      : 'Sama Al-Mamlakah Office is actively verified and certified by the Saudi Ministry of Human Resources for 2026. All application processes are 100% free of charge.'}
                  </p>
                </div>
              </div>

              {/* Central Posts Stream Box (8 Cols) */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Search & Tabs Toolbar */}
                <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                  
                  {/* Tabs Selector list */}
                  <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
                    <button 
                      onClick={() => setJobsSubTab('all')}
                      className={`flex-1 md:flex-initial px-4 py-2 text-xs font-black rounded-lg transition-all ${jobsSubTab === 'all' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      {lang === 'ar' ? '🚀 الكل' : 'All'} ({jobs.length + announcements.length})
                    </button>
                    <button 
                      onClick={() => setJobsSubTab('jobs')}
                      className={`flex-1 md:flex-initial px-4 py-2 text-xs font-black rounded-lg transition-all ${jobsSubTab === 'jobs' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      {lang === 'ar' ? '💼 شواغر وظيفية' : 'Job Openings'} ({jobs.length})
                    </button>
                    <button 
                      onClick={() => setJobsSubTab('announcements')}
                      className={`flex-1 md:flex-initial px-4 py-2 text-xs font-black rounded-lg transition-all ${jobsSubTab === 'announcements' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      {lang === 'ar' ? '📢 تعاميم وأخبار' : 'News & Announcements'} ({announcements.length})
                    </button>
                  </div>

                  {/* Search filter input */}
                  <div className="relative w-full md:w-64">
                    <input 
                      type="text"
                      placeholder={lang === 'ar' ? 'ابحث بالوظائف والإعلانات...' : 'Search posts...'}
                      value={jobsSearchQuery}
                      onChange={(e) => setJobsSearchQuery(e.target.value)}
                      className="w-full text-xs border border-slate-250 pr-8 pl-3 py-2 rounded-xl focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                    <Search className={`w-4 h-4 text-slate-400 absolute top-2.5 ${lang === 'ar' ? 'right-2.5' : 'left-8.5'}`} />
                  </div>
                </div>

                {/* Posts Stream rendering */}
                <div className="space-y-6">
                  
                  {/* Filtering data logic */}
                  {(() => {
                    // Filtered Jobs
                    const filteredJobs = jobs.filter(j => {
                      if (jobsSubTab === 'announcements') return false;
                      const query = jobsSearchQuery.trim().toLowerCase();
                      if (!query) return true;
                      return j.title.toLowerCase().includes(query) || 
                             j.department.toLowerCase().includes(query) || 
                             j.description.toLowerCase().includes(query) ||
                             j.location.toLowerCase().includes(query) ||
                             j.requirements.some(r => r.toLowerCase().includes(query));
                    });

                    // Filtered Announcements
                    const filteredAnnouncements = announcements.filter(a => {
                      if (jobsSubTab === 'jobs') return false;
                      const query = jobsSearchQuery.trim().toLowerCase();
                      if (!query) return true;
                      return a.title.toLowerCase().includes(query) || 
                             a.content.toLowerCase().includes(query) ||
                             a.category.toLowerCase().includes(query);
                    });

                    // Combined and Sorted Lists
                    // Let's sort Pinned Announcements first, then sort by date descending
                    const combinedPostsList: Array<{ type: 'job' | 'announcement'; date: string; isPinned: boolean; data: any }> = [];
                    
                    filteredAnnouncements.forEach(a => {
                      combinedPostsList.push({
                        type: 'announcement',
                        date: a.date,
                        isPinned: !!a.isPinned,
                        data: a
                      });
                    });

                    filteredJobs.forEach(j => {
                      combinedPostsList.push({
                        type: 'job',
                        date: j.date,
                        isPinned: false, // jobs don't explicitly pin
                        data: j
                      });
                    });

                    // Sort: Pinned first, then date desc
                    combinedPostsList.sort((a, b) => {
                      if (a.isPinned && !b.isPinned) return -1;
                      if (!a.isPinned && b.isPinned) return 1;
                      return new Date(b.date).getTime() - new Date(a.date).getTime();
                    });

                    if (combinedPostsList.length === 0) {
                      return (
                        <div className="text-center bg-white border border-slate-200 rounded-2xl p-12 text-slate-500 shadow-xs">
                          <Bell className="w-12 h-12 mx-auto text-slate-300 mb-3 animate-bounce" />
                          <h4 className="font-bold text-slate-900 text-sm mb-1">{lang === 'ar' ? 'لا توجد نتائج مطابقة لبحثك' : 'No matching updates found'}</h4>
                          <p className="text-xs">{lang === 'ar' ? 'يرجى مراجعة العبارة المدخلة، أو التبديل لأحد التبويبات الأخرى.' : 'Verify your query or switch categories.'}</p>
                        </div>
                      );
                    }

                    return combinedPostsList.map((post, idx) => {
                      if (post.type === 'job') {
                        const j = post.data as Job;
                        return (
                          <div key={j.id} className="bg-white border border-slate-200 hover:border-amber-400/40 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all relative group overflow-hidden text-right">
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-100 group-hover:bg-amber-400"></div>
                            
                            <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
                              <div className="flex items-center gap-2">
                                <span className="p-1 px-2 text-[10px] bg-amber-50 text-amber-700 border border-amber-250/30 rounded-lg font-bold">
                                  {lang === 'ar' ? 'حقيبة التوظيف الشاغرة' : 'Job Vacancy'}
                                </span>
                                <span className="font-mono text-[10px] text-slate-400">
                                  {new Date(j.date).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                                </span>
                              </div>
                              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black ${
                                j.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}>
                                {j.status === 'active' ? (lang === 'ar' ? '● شاغر متاح للتقديم' : 'Active Seat') : (lang === 'ar' ? 'مغلق' : 'Closed')}
                              </span>
                            </div>

                            <h3 className="text-lg font-black text-slate-900 group-hover:text-amber-600 transition-colors mb-2 text-right">{j.title}</h3>
                            <div className="flex flex-wrap gap-2.5 mb-4 font-sans text-xs">
                              <span className="flex items-center gap-1 bg-slate-50 border border-slate-150 rounded-lg px-2.5 py-1 text-slate-650" title="القسم الداخلي">
                                <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                                {j.department}
                              </span>
                              <span className="flex items-center gap-1 bg-slate-50 border border-slate-150 rounded-lg px-2.5 py-1 text-slate-650" title="مقر العمل">
                                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                {j.location}
                              </span>
                              <span className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-slate-900 rounded-lg px-2.5 py-1 font-bold" title="طبيعة العمل">
                                {j.type === 'full-time' && (lang === 'ar' ? 'دوام كامل' : 'Full Time')}
                                {j.type === 'part-time' && (lang === 'ar' ? 'دوام جزئي' : 'Part Time')}
                                {j.type === 'contract' && (lang === 'ar' ? 'عقد خارجي' : 'Contract basis')}
                              </span>
                              <span className="flex items-center gap-1 bg-emerald-50 border border-emerald-100/55 rounded-lg px-2.5 py-1 text-emerald-850 font-mono text-[11px] font-bold" title="الراتب المتوقع والبدلات">
                                <Coins className="w-3.5 h-3.5 text-emerald-600" />
                                {j.salary}
                              </span>
                            </div>

                            <p className="text-xs text-slate-550 leading-relaxed mb-4 bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-right">{j.description}</p>
                            
                            <div className="space-y-1.5 mb-5 font-sans">
                              <h4 className="text-[11px] font-black text-slate-800 text-right">{lang === 'ar' ? 'المهارات وبنود القبول المطلوبة:' : 'Job Requirements & Preferred Credentials:'}</h4>
                              <ul className="list-disc pr-4 space-y-1 text-xs text-slate-550 text-right">
                                {j.requirements.map((req, rIdx) => (
                                  <li key={rIdx}>{req}</li>
                                ))}
                              </ul>
                            </div>

                            {/* Job actions with Social Media shares connected! */}
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100">
                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                {j.status === 'active' ? (
                                  <button 
                                    onClick={() => {
                                      setSelectedApplyJob(j);
                                      setAppApplicantName('');
                                      setAppApplicantPhone('');
                                      setAppApplicantEmail('');
                                      setAppCoverLetter('');
                                      setAppCvFileName('');
                                      setAppCvFileData('');
                                      setAppSubmittedSuccess(false);
                                    }}
                                    className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-amber-505 px-5.5 py-2 rounded-xl border border-slate-850 hover:border-slate-750 text-amber-500 hover:text-white px-5.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1 text-center"
                                  >
                                    <Send className="w-3.5 h-3.5 text-amber-500" />
                                    <span>{lang === 'ar' ? 'التقديم الإلكتروني السريع' : 'Submit Application Now'}</span>
                                  </button>
                                ) : (
                                  <button disabled className="w-full sm:w-auto bg-slate-100 text-slate-400 px-5.5 py-2 rounded-xl font-bold text-xs cursor-not-allowed">
                                    {lang === 'ar' ? 'باب التقديم مغلق حالياً' : 'Recruitment Closed'}
                                  </button>
                                )}
                              </div>

                              {/* Share Board with live links targeting social media channels! */}
                              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
                                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                  <Share2 className="w-3.5 h-3.5" />
                                  <span>{lang === 'ar' ? `مشاركة (${j.shares || 0}):` : `Share (${j.shares || 0}):`}</span>
                                </span>

                                {/* WhatsApp Share */}
                                <a 
                                  onClick={() => {
                                    // Increment simulated counter
                                    setJobs(prev => prev.map(item => item.id === j.id ? { ...item, shares: (item.shares || 0) + 1 } : item));
                                  }}
                                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                                    `*شاغر وظيفي في مكتب سما المملكة للتعقيب:*\n\nالمسمى: *${j.title}*\nالقسم: ${j.department}\nالراتب المخصص: ${j.salary}\n\nتفضل بتقديم سيرتك الذاتية الإلكترونية الفورية:\n${window.location.origin}`
                                  )}`}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  title="مشاركة عبر واتساب"
                                  className="p-1 px-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all flex items-center gap-0.5 border border-emerald-150/30"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>واتساب</span>
                                </a>

                                {/* Twitter/X Share */}
                                <a 
                                  onClick={() => {
                                    // Increment simulated counter
                                    setJobs(prev => prev.map(item => item.id === j.id ? { ...item, shares: (item.shares || 0) + 1 } : item));
                                  }}
                                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                                    `مكتب سما المملكة يعلن عن توفر شاغر وظيفي بمسمى [${j.title}] في ${j.location}. بادر بالتقديم الإلكتروني الآن من خلال موقعنا الرسمى:`
                                  )}&url=${encodeURIComponent(window.location.origin)}`}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  title="مشاركة عبر منصة X"
                                  className="p-1 px-2.5 bg-slate-950 text-slate-100 hover:bg-slate-900 rounded-lg text-xs font-bold transition-all flex items-center gap-0.5"
                                >
                                  <Twitter className="w-3 h-3 text-white" />
                                  <span>X</span>
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        const a = post.data as Announcement;
                        return (
                          <div key={a.id} className="bg-white border border-slate-200 hover:border-blue-400/40 rounded-2xl p-5 shadow-xs relative transition-all group overflow-hidden text-right">
                            
                            {/* Colorful Left Highlight Indicator */}
                            <div className={`absolute top-0 bottom-0 ${lang === 'ar' ? 'right-0 w-1.5' : 'left-0 w-1.5'} ${
                              a.category === 'alert' ? 'bg-red-500' :
                              a.category === 'offer' ? 'bg-indigo-500' :
                              a.category === 'news' ? 'bg-blue-500' : 'bg-amber-500'
                            }`}></div>

                            <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 px-2">
                              <div className="flex items-center gap-2">
                                <span className={`p-1 px-2.5 text-[10px] rounded-lg font-black ${
                                  a.category === 'alert' ? 'bg-red-50 text-red-700 border border-red-150/30' :
                                  a.category === 'offer' ? 'bg-indigo-50 text-indigo-700 border border-indigo-150/30' :
                                  a.category === 'news' ? 'bg-blue-50 text-blue-700 border border-blue-150/30' : 
                                  'bg-amber-50 text-amber-700 border border-amber-150/30'
                                }`}>
                                  {a.category === 'alert' && (lang === 'ar' ? '🚨 تعميم عاجل ونظامي' : 'System Alert')}
                                  {a.category === 'offer' && (lang === 'ar' ? '🏷️ عروض وباقات جديدة' : 'Exclusive Offer')}
                                  {a.category === 'news' && (lang === 'ar' ? '📢 أخبار ومستجدات' : 'Corporate News')}
                                  {a.category === 'holiday' && (lang === 'ar' ? '📅 ساعات العمل والإجازات' : 'Calendar & Holidays')}
                                </span>
                                <span className="font-mono text-[10px] text-slate-400">
                                  {new Date(a.date).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                                </span>
                              </div>

                              {a.isPinned && (
                                <span className="bg-amber-500/10 text-amber-700 text-[10px] px-2.5 py-0.5 rounded-full font-black border border-amber-500/20 animate-pulse flex items-center gap-1">
                                  ★ {lang === 'ar' ? 'مثبت بالإدارة' : 'Pinned Circular'}
                                </span>
                              )}
                            </div>

                            <div className="px-2">
                              <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors mb-2 text-right">{a.title}</h3>
                              <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium whitespace-pre-wrap text-right mb-3">{a.content}</p>

                              {/* Image Announcement Media Display with Lightbox launch */}
                              {a.mediaType === 'image' && a.mediaUrl && (
                                <div 
                                  onClick={() => setActiveMediaLightbox({ url: a.mediaUrl!, title: a.title, isVideo: false })}
                                  className="mt-3 mb-1.5 rounded-xl overflow-hidden border border-slate-150 max-h-72 flex justify-center bg-slate-50 cursor-zoom-in relative group/media select-none"
                                >
                                  <img 
                                    src={a.mediaUrl} 
                                    alt={a.title} 
                                    className="object-cover w-full h-full max-h-72 transition-transform duration-500 group-hover/media:scale-[1.03]"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="bg-slate-900/90 text-white rounded-full p-2 px-3 text-xs font-bold flex items-center gap-1 shadow-md">
                                      <Eye className="w-3.5 h-3.5 text-amber-500" />
                                      <span>{lang === 'ar' ? 'تكبير العرض' : 'Zoom Image'}</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Video Announcement Media Display with full inline controls plus optional Lightbox expansion */}
                              {a.mediaType === 'video' && a.mediaUrl && (
                                <div className="mt-3 mb-1.5 rounded-xl overflow-hidden border border-slate-150 bg-slate-950 max-h-72 flex flex-col justify-center relative group/media select-none">
                                  <video 
                                    src={a.mediaUrl} 
                                    controls 
                                    className="w-full h-full max-h-64 object-contain"
                                  />
                                  <div className="absolute top-3 left-3 z-10 opacity-0 group-hover/media:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={() => setActiveMediaLightbox({ url: a.mediaUrl!, title: a.title, isVideo: true })}
                                      className="bg-black/70 hover:bg-black text-white hover:text-amber-500 p-1.5 rounded-lg text-[10px] font-bold border border-white/10 transition-all flex items-center gap-1 cursor-pointer"
                                      title={lang === 'ar' ? 'مسرح عرض الفيديو الأكبر' : 'Expand Video Theater'}
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>{lang === 'ar' ? 'مسرح السينما' : 'Cinema Theater'}</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Announcement Shared button */}
                            <div className="flex justify-end items-center gap-2 pt-3 mt-4 border-t border-slate-100">
                              <span className="text-[10px] text-slate-400 font-bold">{lang === 'ar' ? 'مشاركة الإعلان:' : 'Share update:'}</span>
                              
                              <a 
                                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                                  `*تنويه وتعميم صادر عن مكتب سما المملكة لمراجعة المعاملات:*\n\n*${a.title}*\n\n${a.content}\n\nلمتابعة البوابة المعتمدة:\n${window.location.origin}`
                                )}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-1 px-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all flex items-center gap-0.5"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>واتساب</span>
                              </a>

                              <a 
                                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                                  `تعميم معتمد من سما المملكة للخدمات: [${a.title}]`
                                )}&url=${encodeURIComponent(window.location.origin)}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-1 px-2.5 bg-slate-950 text-slate-100 hover:bg-slate-900 rounded-lg text-xs font-bold transition-all flex items-center gap-0.5"
                              >
                                <Twitter className="w-3 h-3 text-white" />
                                <span>تويتر</span>
                              </a>
                            </div>
                          </div>
                        );
                      }
                    });
                  })()}
                </div>
              </div>
            </div>

            {/* Active Announcement Media Lightbox Modal */}
            {activeMediaLightbox && (
              <div 
                className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 md:p-8 animate-fade-in select-none"
                onClick={() => setActiveMediaLightbox(null)}
              >
                {/* Close Button */}
                <button 
                  onClick={() => setActiveMediaLightbox(null)}
                  className="absolute top-4 right-4 md:top-6 md:right-6 bg-slate-900 border border-white/10 text-slate-300 hover:text-white p-2.5 rounded-full hover:bg-slate-800 transition-all z-55 cursor-pointer flex items-center justify-center shadow-lg"
                  title={lang === 'ar' ? 'إغلاق نافذة المرفقات' : 'Exit Full View'}
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Content Container */}
                <div 
                  className="max-w-5xl w-full max-h-[85vh] flex flex-col items-center justify-center space-y-4 animate-scale-up"
                  onClick={(e) => e.stopPropagation()} // Stop propagation to prevent closing
                >
                  {/* Media Content */}
                  <div className="relative w-full max-h-[75vh] rounded-2xl overflow-hidden border border-white/10 bg-slate-900 flex justify-center items-center shadow-2xl">
                    {activeMediaLightbox.isVideo ? (
                      <video 
                        src={activeMediaLightbox.url} 
                        controls 
                        autoPlay
                        className="max-w-full max-h-[75vh] object-contain"
                      />
                    ) : (
                      <img 
                        src={activeMediaLightbox.url} 
                        alt={activeMediaLightbox.title} 
                        className="max-w-full max-h-[75vh] object-contain"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>

                  {/* Title Bar */}
                  <div className="bg-slate-900/80 border border-white/5 backdrop-blur-xs p-3.5 px-6 rounded-2xl max-w-2xl w-full text-center shadow-xl">
                    <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2.5 py-0.5 rounded-full font-black mb-1.5 inline-block">
                      {lang === 'ar' ? 'العرض المكبر للمرفق' : 'Full Screen Attachment'}
                    </span>
                    <h4 className="text-sm font-black text-white leading-relaxed">{activeMediaLightbox.title}</h4>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Job Application Modal Dialogue */}
            {selectedApplyJob && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4" dir="rtl">
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-scale-up border border-slate-200 text-right">
                  
                  {/* Modal Header */}
                  <div className="bg-slate-950 text-white p-5 relative">
                    <button 
                      onClick={() => setSelectedApplyJob(null)}
                      className={`absolute top-4 p-1 rounded-full bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ${lang === 'ar' ? 'left-4' : 'right-4'}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full font-black mb-1.5 inline-block">
                      {lang === 'ar' ? 'استمارة طلب توظيف فورية' : 'Electronic HR Application'}
                    </span>
                    <h3 className="text-base font-black text-white text-right">{selectedApplyJob.title}</h3>
                    <p className="text-[11px] text-slate-350 text-right">{selectedApplyJob.department} • {selectedApplyJob.location}</p>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto font-sans">
                    
                    {appSubmittedSuccess ? (
                      <div className="py-8 text-center space-y-3">
                        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-250/30">
                          <Check className="w-8 h-8 font-black" />
                        </div>
                        <h4 className="font-black text-slate-900 text-base">{lang === 'ar' ? 'تم استلام طلبكم بنجاح ومصداقية' : 'HR Application Submitted'}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                          {lang === 'ar' 
                            ? `شكراً لك، تم حفظ طلبك وإرساله لشعبة تقييم الموارد البشرية لمكتب سما المملكة. سيتم التواصل معك قريباً على الجوال ${appApplicantPhone} في حال مطابقة المؤهلات.`
                            : `Thank you, your application details have been saved for review. We will contact you at ${appApplicantPhone} if selected.`}
                        </p>
                        <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-[11px] text-slate-550 text-right space-y-1">
                          <p><strong>اسم المتقدم:</strong> {appApplicantName}</p>
                          <p><strong>المسمى الوظيفي:</strong> {selectedApplyJob.title}</p>
                          {appCvFileName && <p><strong>مرفق السيرة الذاتية:</strong> {appCvFileName} (قيد الفحص والدراسة)</p>}
                        </div>
                        <button 
                          onClick={() => setSelectedApplyJob(null)}
                          className="mt-6 bg-slate-950 hover:bg-slate-800 text-amber-500 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          {lang === 'ar' ? 'موافق وإغلاق النافذة' : 'Got it'}
                        </button>
                      </div>
                    ) : (
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!appApplicantName.trim() || !appApplicantPhone.trim()) {
                            alert(lang === 'ar' ? 'يرجى ملء الحقول الإلزامية الاسم والهاتف لحفظ طلبك.' : 'Name and telephone are required.');
                            return;
                          }

                          // Create application object
                          const newApp: JobApplication = {
                            id: `app-${Date.now()}`,
                            jobId: selectedApplyJob.id,
                            jobTitle: selectedApplyJob.title,
                            applicantName: appApplicantName.trim(),
                            applicantPhone: appApplicantPhone.trim(),
                            applicantEmail: appApplicantEmail.trim() || undefined,
                            coverLetter: appCoverLetter.trim() || undefined,
                            cvFileName: appCvFileName || undefined,
                            cvFileData: appCvFileData || undefined,
                            date: new Date().toISOString(),
                            status: 'pending'
                          };

                          setJobApplications(prev => [newApp, ...prev]);
                          setAppSubmittedSuccess(true);
                        }}
                        className="space-y-4 text-right"
                      >
                        {/* Name */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">اسم المتقدم بالكامل (الرباعي) <span className="text-rose-600">*</span></label>
                          <input 
                            type="text" 
                            required
                            placeholder="مثال: صالح عبد الرحمن الماجد"
                            value={appApplicantName}
                            onChange={(e) => setAppApplicantName(e.target.value)}
                            className="w-full text-xs border border-slate-250 rounded-xl p-2.5 focus:outline-hidden focus:border-amber-500 text-right"
                          />
                        </div>

                        {/* Phone */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف الجوال الفعال <span className="text-rose-600">*</span></label>
                          <input 
                            type="tel" 
                            required
                            placeholder="05xxxxxxx"
                            value={appApplicantPhone}
                            onChange={(e) => setAppApplicantPhone(e.target.value)}
                            className="w-full text-xs font-mono border border-slate-250 rounded-xl p-2.5 text-right focus:outline-hidden focus:border-amber-500"
                          />
                        </div>

                        {/* Email */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني للردود (اختياري)</label>
                          <input 
                            type="email" 
                            placeholder="yourname@domain.com"
                            value={appApplicantEmail}
                            onChange={(e) => setAppApplicantEmail(e.target.value)}
                            className="w-full text-xs font-mono border border-slate-250 rounded-xl p-2.5 text-right focus:outline-hidden focus:border-amber-500"
                          />
                        </div>

                        {/* Cover letter */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">لماذا تجد نفسك مناسباً لهذه الفرصة؟ (ملاحظات إضافية)</label>
                          <textarea 
                            rows={3}
                            placeholder="تحدث بإيجاز عن خبراتك الوظيفية السابقة وشغفك للعمل معنا..."
                            value={appCoverLetter}
                            onChange={(e) => setAppCoverLetter(e.target.value)}
                            className="w-full text-xs border border-slate-250 rounded-xl p-2.5 focus:outline-hidden focus:border-amber-500 text-right"
                          />
                        </div>

                        {/* File CV Upload */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">أرفق السيرة الذاتية (PDF, Word أو صورة)</label>
                          
                          <div className="relative border-2 border-dashed border-slate-200 hover:border-amber-400 bg-slate-50/50 hover:bg-amber-500/5 p-4 rounded-xl text-center select-none transition-all">
                            <input 
                              type="file" 
                              accept=".pdf,.doc,.docx,image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  setAppCvFileName(file.name);
                                  setAppCvFileData(event.target?.result as string);
                                };
                                reader.readAsDataURL(file);
                              }}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <div className="space-y-1 text-center">
                              <Paperclip className="w-5 h-5 mx-auto text-slate-400 animate-pulse" />
                              <p className="text-[11px] font-medium text-slate-550">
                                {appCvFileName ? (
                                  <span className="text-emerald-700 font-bold">✓ المرفق: {appCvFileName}</span>
                                ) : (
                                  <span>اسحب وأفلت ملف سيرتك هنا، أو انقر للتصفح</span>
                                )}
                              </p>
                              <p className="text-[9px] text-slate-400 font-mono">PDF, DOCX, PNG (Max 5MB)</p>
                            </div>
                          </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                          <button 
                            type="button"
                            onClick={() => setSelectedApplyJob(null)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-755 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                          >
                            إلغاء
                          </button>
                          <button 
                            type="submit"
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-6 py-2 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
                          >
                            تأكيد تقديم طلب التوظيف
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 3: ADMIN & OPERATIONS CONTROL PANEL ==================== */}
        {activeTab === 'admin' && isAdminAuthenticated && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Admin Header Toolbar */}
            <div className="bg-white p-5 rounded-xl shadow-md border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-7 h-7 text-amber-600" />
                  <span>بوابة إدارة وعمليات مكتب سما المملكة المالية</span>
                </h2>
                <p className="text-slate-500 text-xs mt-1">نظام حسابي ورقابي عالي الكفاءة يدعم إحصاءات المعاملات والفوترة وفق معايير ١٥% نسبة ضريبية مضافة.</p>
              </div>

              {/* Toolbar Actions */}
              <div className="flex gap-2.5 flex-wrap">
                <button
                  onClick={() => setAdminTab('stats')}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${adminTab === 'stats' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  التقارير والإخصاءات المالية
                </button>
                <button
                  onClick={() => setAdminTab('requests')}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${adminTab === 'requests' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  الطلبات الواردة من الموقع ({bookings.filter(b => b.status === 'pending').length})
                </button>
                <button
                  onClick={() => setAdminTab('ledger')}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${adminTab === 'ledger' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  المحاسبة والقيود المالية للدولة والمكتب
                </button>
                <button
                  onClick={() => setAdminTab('services')}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${adminTab === 'services' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  إدارة دليل الخدمات وأسعار العمليات
                </button>
                <button
                  onClick={() => setAdminTab('whatsapp')}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all whitespace-nowrap bg-emerald-950/20 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-900/40 ${
                    adminTab === 'whatsapp' ? 'bg-emerald-600 text-slate-950 border-emerald-500' : ''
                  }`}
                >
                  💬 إشعارات واتساب الفورية {whatsappLogs.length > 0 && `(${whatsappLogs.length})`}
                </button>
                <button
                  onClick={() => setAdminTab('jobs')}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all whitespace-nowrap bg-amber-950/20 text-amber-500 border border-amber-500/20 hover:bg-amber-900/40 ${
                    adminTab === 'jobs' ? 'bg-amber-500 text-slate-950 border-amber-500' : ''
                  }`}
                >
                  💼 إدارة الوظائف والإعلانات والطلبات ({jobApplications.filter(a => a.status === 'pending').length})
                </button>
              </div>
            </div>

            {/* --- ADMIN INTERNAL VIEW 1: STATS & SUMMARY --- */}
            {adminTab === 'stats' && (
              <div className="space-y-8">
                {/* HIGH-LEVEL OPERATIONAL DASHBOARD SUMMARY - DIRECTLY REQUESTED FEATURES */}
                <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-5 mb-6 gap-4">
                    <div>
                      <h2 className="text-lg font-black text-amber-500 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 animate-pulse text-amber-500" />
                        <span>لوحة الملخص التشغيلي للأداء الفوري والمعاملات اليومية</span>
                      </h2>
                      <p className="text-slate-400 text-xs mt-1 font-sans">
                        مؤشرات حية للتوزيع والتدفق المالي اليومي، ونسب كفاءة إنجاز الطلبات، وأحدث الكوادر البشرية المتقدمة لسام المملكة.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 bg-slate-950/80 border border-slate-800 text-slate-350 text-xs font-mono font-bold rounded-xl flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        <span>اليوم: {todayDateStr}</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* CARD 1: TOTAL DAILY REVENUE */}
                    <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between pointer-events-none">
                          <span className="text-slate-400 text-xs font-bold block">إيرادات وحركة اليوم المالية</span>
                          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                            <Coins className="w-4 h-4" />
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <span className="text-slate-400 text-[10px] block font-sans">صافي أتعاب المكتب لليوم ({todayTransactions.length} فواتير تامة)</span>
                          <strong className="text-3xl font-black text-amber-500 block font-mono tracking-tight mt-1">
                            {todayOfficeRevenue.toFixed(2)} ر.س
                          </strong>
                          <span className="text-[10px] text-slate-400 block font-sans mt-1">
                            الدخل الكلي لليوم: {todayOverallAccountingVolume.toFixed(2)} ر.س
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 font-sans space-y-1 font-sans">
                        <div className="flex justify-between font-sans">
                          <span>الضريبة المُحصّلة:</span>
                          <span className="font-mono text-slate-200">{todayVATCollected.toFixed(2)} ر.س</span>
                        </div>
                        <div className="flex justify-between font-sans">
                          <span>الرسوم الحكومية للأمانات:</span>
                          <span className="font-mono text-slate-200">{todayGovSpent.toFixed(2)} ر.س</span>
                        </div>
                      </div>
                    </div>

                    {/* CARD 2: PENDING VS COMPLETED REQUESTS RATIO */}
                    <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 flex flex-col justify-between font-sans">
                      <div>
                        <div className="flex items-center justify-between pointer-events-none font-sans font-sans">
                          <span className="text-slate-400 text-xs font-bold block">معدل الإنجاز والتعقيب الفوري</span>
                          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                            <Activity className="w-4 h-4" />
                          </div>
                        </div>

                        <div className="mt-3 font-sans">
                          <span className="text-slate-400 text-[10px] block font-sans">نسبة المعاملات المنجزة تماماً للمعلقة</span>
                          <strong className="font-sans font-black text-blue-400 font-mono tracking-tight">
                            {completedToPendingRatio}:1
                          </strong>
                           <span className="text-[10px] text-slate-400 font-sans">
                            نسبة المكتملة إلى المعلقة (Ratio)
                          </span>
                        </div>

                        <p className="text-[10px] text-slate-300 mt-1 font-sans">
                          {pendingRequestsCount > 0 
                            ? `كل معلقة تقابلها ${completedToPendingRatio} معاملة مكتملة في الأنظمة.` 
                            : 'جميع المعاملات الصادرة تم إنهاؤها واعتمادها بالكامل.'}
                        </p>

                        <div className="mt-4 pt-4 border-t border-slate-900 space-y-3 font-sans text-[11px]">
                          <div className="flex justify-between items-center text-slate-300 font-sans">
                            <span className="flex items-center gap-1.5 font-sans">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                              <span>المعاملات المنجزة تماماً:</span>
                            </span>
                            <span className="font-mono font-bold text-slate-200">{completedRequestsCount} طلب مكتمل</span>
                          </div>
                          
                          <div className="flex justify-between items-center text-slate-300 font-sans">
                            <span className="flex items-center gap-1.5 font-sans">
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                              <span>المعاملات المعلقة (قيد المراجعة):</span>
                            </span>
                            <span className="font-mono font-bold text-amber-400">{pendingRequestsCount} طلب وافد</span>
                          </div>

                          <div className="flex justify-between items-center text-slate-300 font-sans">
                            <span className="flex items-center gap-1.5 font-sans">
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                              <span>تحت التعقيب الحكومي النشط:</span>
                            </span>
                            <span className="font-mono font-bold text-blue-400">{processingRequestsCount} تحت المعالجة</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 space-y-2">
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden flex flex-row-reverse">
                          <div 
                            style={{ width: `${bookings.length > 0 ? (completedRequestsCount / bookings.length) * 100 : 0}%` }} 
                            className="bg-emerald-500 h-full"
                          ></div>
                          <div 
                            style={{ width: `${bookings.length > 0 ? (processingRequestsCount / bookings.length) * 100 : 0}%` }} 
                            className="bg-blue-500 h-full"
                          ></div>
                          <div 
                            style={{ width: `${bookings.length > 0 ? (pendingRequestsCount / bookings.length) * 100 : 0}%` }} 
                            className="bg-amber-500 h-full"
                          ></div>
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 font-sans">
                          <span>منجز ({completedRequestsCount})</span>
                          <span>ميداني ({processingRequestsCount})</span>
                          <span>معلق ({pendingRequestsCount})</span>
                          <span>إجمالي: {bookings.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* CARD 3: RECENTLY JOINED APPLICANTS */}
                    <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 flex flex-col justify-between font-sans">
                      <div>
                        <div className="flex items-center justify-between pointer-events-none">
                          <span className="text-slate-400 text-xs font-bold block">السير الذاتية والطلبات المستلمة</span>
                          <div className="p-2 bg-pink-500/10 text-pink-400 rounded-lg">
                            <Briefcase className="w-4 h-4" />
                          </div>
                        </div>

                        <div className="mt-3">
                          <span className="text-slate-400 text-[10px] block font-sans font-sans">أحدث الكوادر البشرية المتقدمة للتوظيف</span>
                          <span className="text-lg font-black text-slate-100 block font-sans mt-0.5">
                            المتقدمون ({jobApplications.length} متقدمين)
                          </span>
                        </div>

                        <div className="mt-4 space-y-2 font-sans">
                          {recentJobApplications.length === 0 ? (
                            <p className="text-slate-500 text-[11px] italic text-center py-6 font-sans">لا يتوفر متقدمون حالياً.</p>
                          ) : (
                            recentJobApplications.map(app => (
                              <div key={app.id} className="p-2 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between text-[11px] hover:border-slate-700 transition-all font-sans">
                                <div className="truncate pl-2">
                                  <span className="font-bold text-slate-100 block truncate font-sans">{app.applicantName}</span>
                                  <span className="text-[9px] text-amber-500 block truncate font-sans">{app.jobTitle}</span>
                                </div>
                                <div className="text-left flex-shrink-0">
                                  <span className="inline-block px-1.5 py-0.5 bg-slate-950 text-[9px] text-slate-400 rounded font-mono font-sans">
                                    {app.date.includes('T') ? app.date.split('T')[1].substring(0, 5) : app.date}
                                  </span>
                                  <span className={`block text-[8px] font-bold text-center mt-0.5 font-sans ${
                                    app.status === 'pending' ? 'text-amber-400 animate-pulse' : 'text-emerald-400'
                                  }`}>
                                    {app.status === 'pending' ? 'جديد ⏳' : 'مراجعة'}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="mt-4 font-sans">
                        <button
                          type="button"
                          onClick={() => {
                            setAdminTab('jobs');
                          }}
                          className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-amber-500 hover:text-amber-400 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>إدارة وفرز طلبات التوظيف بالكامل</span>
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Divider / Separator */}
                <div className="border-t border-slate-200/50 pt-4">
                  <h3 className="text-xs font-black text-slate-500 tracking-wider uppercase mb-1">المؤشرات المالية التحليلية المتكاملة والتقارير</h3>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  
                  {/* Total Revenues */}
                  <div className="bg-white p-5 rounded-xl shadow border-r-8 border-slate-900 border-t border-b border-l border-slate-200 flex flex-col justify-between">
                    <div>
                      <span className="text-slate-505 text-xs font-bold block">إجمالي أتعاب المكتب الصافية</span>
                      <strong className="text-2xl font-black text-slate-900 mt-1.5 block font-mono">{totalOfficeRevenues.toFixed(2)} ر.س</strong>
                    </div>
                    <span className="text-[10px] text-slate-400 font-sans block mt-3">من استخلاص وبنود الخدمات فقط</span>
                  </div>

                  {/* Total Taxes */}
                  <div className="bg-white p-5 rounded-xl shadow border-r-8 border-amber-600 border-t border-b border-l border-slate-200 flex flex-col justify-between">
                    <div>
                      <span className="text-slate-505 text-xs font-bold block">مجموع ضريبة القيمة المضافة (15%)</span>
                      <strong className="text-2xl font-black text-slate-900 mt-1.5 block font-mono">{totalVATCollected.toFixed(2)} ر.س</strong>
                    </div>
                    <span className="text-[10px] text-slate-400 font-sans block mt-3">مستحقات الخزينة - هيئة الزكاة والجمارك</span>
                  </div>

                  {/* Gov payments */}
                  <div className="bg-white p-5 rounded-xl shadow border-r-8 border-blue-900 border-t border-b border-l border-slate-200 flex flex-col justify-between">
                    <div>
                      <span className="text-slate-505 text-xs font-bold block flex items-center gap-1">
                        <span>أمانات الرسوم الحكومية للدولة</span>
                      </span>
                      <strong className="text-2xl font-black text-slate-900 mt-1.5 block font-mono">{totalGovSpent.toFixed(2)} ر.س</strong>
                    </div>
                    <span className="text-[10px] text-slate-400 font-sans block mt-3">معفاة من الضريبة (مستحقات جهات الإصدار للوزارات)</span>
                  </div>

                  {/* Combined throughput */}
                  <div className="bg-amber-50 p-5 rounded-xl shadow border border-amber-200 flex flex-col justify-between">
                    <div>
                      <span className="text-amber-800 text-xs font-black block">إجمالي الحركة المالية الكلية</span>
                      <strong className="text-2xl font-black text-amber-950 mt-1.5 block font-mono">{totalOverallAccountingVolume.toFixed(2)} ر.س</strong>
                    </div>
                    <span className="text-[10px] text-slate-500 font-sans block mt-3">شاملة الرسوم والضرائب التامة</span>
                  </div>
                </div>

                {/* Sub row: Count charts & quick lookup lists */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
                  
                  {/* Status Counts */}
                  <div className="bg-white p-5 rounded-xl shadow border border-slate-200 col-span-1 font-sans">
                    <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-slate-600" />
                      <span>إحصائيات حالات المعاملات المرفوعة</span>
                    </h3>

                    <div className="space-y-3 font-sans text-xs">
                      <div className="flex justify-between items-center p-2.5 bg-yellow-50 text-yellow-800 rounded border border-yellow-101">
                        <span className="font-bold">قيد الانتظار لمراجعة الإدارة:</span>
                        <strong className="text-sm font-mono">{bookings.filter(b => b.status === 'pending').length}</strong>
                      </div>
                      <div className="flex justify-between items-center p-2.5 bg-blue-50 text-blue-800 rounded border border-blue-101 font-sans">
                        <span className="font-bold">تحت المعالجة الإجرائية والتعقيب:</span>
                        <strong className="text-sm font-mono">{bookings.filter(b => b.status === 'processing').length}</strong>
                      </div>
                      <div className="flex justify-between items-center p-2.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-100 font-sans">
                        <span className="font-bold">المكتملة بنجاح:</span>
                        <strong className="text-sm font-mono">{bookings.filter(b => b.status === 'completed').length}</strong>
                      </div>
                      <div className="flex justify-between items-center p-2.5 bg-slate-100 text-slate-700 rounded border border-slate-200 font-sans">
                        <span>إجمالي الطلبات الكلي:</span>
                        <strong className="text-sm font-mono">{bookings.length}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Simple dynamic SVG visualizer of Service popularity in financial ledger */}
                  <div className="bg-white p-5 rounded-xl shadow border border-slate-200 lg:col-span-2 font-sans font-sans">
                    <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 mb-4 font-sans font-sans">
                      مقارنة الحصص الإيرادية للخدمات بالدفتر الحسابي
                    </h3>
                    
                    {transactions.length === 0 ? (
                      <p className="text-slate-400 text-xs italic text-center py-10 font-sans">لا تتوفر معاملات منجزة حتى الآن لرسم المخططات الإحصائية.</p>
                    ) : (
                      <div className="space-y-4 font-sans font-sans">
                         {services.map(s => {
                          const associatedTxs = transactions.filter(t => t.serviceName === s.name);
                          const revenueForThis = associatedTxs.reduce((sum, t) => sum + t.officeFee, 0);
                          const percentageOfTotal = totalOfficeRevenues > 0 ? (revenueForThis / totalOfficeRevenues) * 105 : 0;

                          return (
                            <div key={s.id} className="text-xs space-y-1 font-sans">
                              <div className="flex justify-between text-slate-600 font-sans">
                                <span className="font-bold font-sans">{s.name} ({associatedTxs.length} فواتير)</span>
                                <span className="font-mono text-slate-900 font-semibold">{revenueForThis.toFixed(2)} ر.س ({percentageOfTotal.toFixed(0)}%)</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div 
                                  className="bg-amber-500 h-full rounded-full transition-all" 
                                  style={{ width: `${Math.max(percentageOfTotal, 2)}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Developer audit info block */}
                <div className="p-4 bg-slate-150 border border-slate-200 rounded-lg text-slate-600 text-xs space-y-1 font-sans">
                  <span className="font-bold block text-slate-800 font-sans font-sans">سجل النشاط العام للبوابة:</span>
                  <p>• النظام يعمل بالكامل على الذاكرة التزامنية المستندة إلى المتصفح المحلي (Local & Session Storage) لسرية معلومات العهدة.</p>
                  <p>• يرجى إسناد وتعديل الحصص المالية للجهات المعفاة من الضرائب بشكل موثق من قسم إدارة تعرفة الخدمات.</p>
                </div>
              </div>
            )}

            {/* --- ADMIN INTERNAL VIEW 2: CLIENT BOOKINGS MANAGER --- */}
            {adminTab === 'requests' && (
              <div className="space-y-6 @container font-sans">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3 font-sans">
                  <div>
                    <h3 className="text-lg font-bold text-slate-950 font-sans">إدارة طلبات المعاملات والتعقيب المرفوعة</h3>
                    <p className="text-slate-500 text-xs mt-1 font-sans">طلبات العملاء تأتي من الموقع الخارجي؛ يمكنك مراجعتها، تحديث حالاتها، أو ترحيلها مباشرة كمستند فاتورة مالي.</p>
                  </div>
                  <span className="text-xs bg-slate-200 font-bold px-2.5 py-1 rounded-full text-slate-700 font-sans">
                    المطابقة: {filteredBookings.length} من أصل {bookings.length}
                  </span>
                </div>

                {/* Advanced Search & Filtering Bar */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 font-sans text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {/* Search text */}
                    <div className="col-span-1 md:col-span-2 relative">
                      <label className="block text-slate-700 font-bold mb-1">البحث بالاسم، رقم الجوال أو ملاحظات الطلب:</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={reqSearchPhoneOrName}
                          onChange={(e) => setReqSearchPhoneOrName(e.target.value)}
                          placeholder="اكتب اسم العميل، جواله، أو أي ملاحظات..."
                          className="w-full pr-8 pl-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-slate-800 text-xs"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3" />
                      </div>
                    </div>

                    {/* Filter by Service */}
                    <div>
                      <label className="block text-slate-705 text-slate-700 font-bold mb-1">تصفية حسب نوع الخدمة:</label>
                      <select
                        value={reqFilterServiceId}
                        onChange={(e) => setReqFilterServiceId(e.target.value)}
                        className="w-full p-2 border border-slate-300 bg-white rounded focus:outline-none focus:border-slate-800 text-xs"
                      >
                        <option value="all">جميع الخدمات المتاحة</option>
                        {services.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Filter by Payment Status */}
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">تصفية بحالة السداد المالي للطلب:</label>
                      <select
                        value={reqFilterPaymentStatus}
                        onChange={(e) => setReqFilterPaymentStatus(e.target.value)}
                        className="w-full p-2 border border-slate-300 bg-white rounded focus:outline-none focus:border-slate-800 text-xs"
                      >
                        <option value="all">مسددة وغير مسددة</option>
                        <option value="paid">💳 مسددة بالكامل</option>
                        <option value="processing_transfer">⏳ بانتظار مراجعة التحويل</option>
                        <option value="unpaid">💵 دفع بالمنشأة / معلق</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-slate-200">
                    {/* Date filter select */}
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">تاريخ تقديم معاملة الحجز:</label>
                      <select
                        value={reqFilterDate}
                        onChange={(e) => setReqFilterDate(e.target.value)}
                        className="w-full p-2 border border-slate-300 bg-white rounded focus:outline-none focus:border-slate-800 text-xs"
                      >
                        <option value="all">كامل الأرشيف الـمتاح</option>
                        <option value="today">اليوم فقط</option>
                        <option value="7days">آخر 7 أيام</option>
                        <option value="30days">آخر 30 يوماً</option>
                        <option value="custom">فترة تاريخية مخصصة...</option>
                      </select>
                    </div>

                    {/* Custom Start / End Dates */}
                    {reqFilterDate === 'custom' && (
                      <>
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">من تاريخ:</label>
                          <input
                            type="date"
                            value={reqFilterStartDate}
                            onChange={(e) => setReqFilterStartDate(e.target.value)}
                            className="w-full p-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:border-slate-800 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">إلى تاريخ:</label>
                          <input
                            type="date"
                            value={reqFilterEndDate}
                            onChange={(e) => setReqFilterEndDate(e.target.value)}
                            className="w-full p-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:border-slate-800 text-xs"
                          />
                        </div>
                      </>
                    )}

                    {/* Sort Key */}
                    <div className={reqFilterDate === 'custom' ? 'col-span-1' : 'col-span-1 md:col-span-3'}>
                      <label className="block text-slate-700 font-bold mb-1">ترتيب فرز المعاملات:</label>
                      <select
                        value={reqSortKey}
                        onChange={(e) => setReqSortKey(e.target.value)}
                        className="w-full p-2 border border-slate-300 bg-white rounded focus:outline-none focus:border-slate-800 text-xs"
                      >
                        <option value="date-desc">الفرز من الأحدث تاريخاً للأقدم</option>
                        <option value="date-asc">الفرز من الأقدم تاريخاً للأحدث</option>
                        <option value="name-asc">اسم العميل أبجدياً (أ-ي)</option>
                      </select>
                    </div>
                  </div>

                  {/* Clear filter button if active */}
                  {(reqSearchPhoneOrName || reqFilterServiceId !== 'all' || reqFilterPaymentStatus !== 'all' || reqFilterDate !== 'all') && (
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setReqSearchPhoneOrName('');
                          setReqFilterServiceId('all');
                          setReqFilterPaymentStatus('all');
                          setReqFilterDate('all');
                          setReqFilterStartDate('');
                          setReqFilterEndDate('');
                          setReqSortKey('date-desc');
                        }}
                        className="text-amber-850 hover:text-amber-955 font-bold underline transition flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>إعادة ضبط وعرض كافة المعاملات</span>
                      </button>
                    </div>
                  )}
                </div>

                {bookings.length === 0 ? (
                  <div className="text-center py-10 bg-white border border-stone-200 rounded-lg text-slate-400 text-sm font-sans">
                    لا تتوفر طلبات مرفوعة حالياً من الموقع بانتظار معاملات جديدة.
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <div className="text-center py-12 bg-white border border-slate-200 rounded-xl shadow-xs text-slate-400 text-sm font-sans">
                    لم نجد أي طلبات مطابقة لمعايير البحث والتصفية المحددة حالياً.
                    <button
                      type="button"
                      onClick={() => {
                        setReqSearchPhoneOrName('');
                        setReqFilterServiceId('all');
                        setReqFilterPaymentStatus('all');
                        setReqFilterDate('all');
                        setReqFilterStartDate('');
                        setReqFilterEndDate('');
                        setReqSortKey('date-desc');
                      }}
                      className="block mx-auto mt-3 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold transition font-sans cursor-pointer"
                    >
                      عرض جميع الطلبات
                    </button>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm font-sans">
                    {/* Mobile Card List: visible on small sizes */}
                    <div className="block @md:hidden divide-y divide-slate-100 font-sans text-xs">
                      {filteredBookings.map(b => (
                        <div key={b.id} className="p-4 space-y-3 font-sans">
                          <div className="flex justify-between items-start font-sans">
                            <div>
                              <strong className="text-slate-900 text-sm font-sans block">{b.clientName}</strong>
                              <span className="text-slate-500 font-mono text-xs">{b.phoneNumber}</span>
                            </div>
                            {b.paymentStatus ? (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-sans ${
                                b.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                                b.paymentStatus === 'processing_transfer' ? 'bg-indigo-100 text-indigo-808' :
                                'bg-amber-100 text-amber-805'
                              }`}>
                                {b.paymentStatus === 'paid' && `💳 مسددة`}
                                {b.paymentStatus === 'processing_transfer' && `⏳ معلقة`}
                                {b.paymentStatus === 'unpaid' && `💵 عند المنشأة`}
                              </span>
                            ) : (
                              <span className="text-[10px] bg-slate-100 text-slate-650 px-2 py-0.5 rounded-full font-sans">💵 غير محدد</span>
                            )}
                          </div>

                          <div className="text-xs space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-sans">
                            <div className="flex justify-between font-sans">
                              <span className="text-slate-505 font-sans">الخدمة:</span>
                              <span className="font-bold text-slate-800 font-sans">{b.serviceName}</span>
                            </div>
                            <div className="flex justify-between font-sans font-sans">
                              <span className="text-slate-550 font-sans">التاريخ:</span>
                              <span className="font-mono text-slate-800 font-sans">{new Date(b.date).toLocaleDateString('ar-SA')}</span>
                            </div>
                            {b.notes && (
                              <div className="pt-1.5 border-t border-slate-200 mt-1.5 font-sans">
                                <span className="text-[10px] font-bold text-slate-400 block font-sans">ملاحظات العميل:</span>
                                <p className="text-[11px] text-slate-650 mt-0.5 font-sans whitespace-pre-wrap">{b.notes}</p>
                              </div>
                            )}
                            {getBookingFiles(b).length > 0 && (
                              <div className="mt-2 pt-2 border-t border-slate-200/50 space-y-1.5 font-sans">
                                <p className="text-[10px] font-extrabold text-slate-400 font-sans">المستندات الرسمية ({getBookingFiles(b).length}):</p>
                                {getBookingFiles(b).map((file, fIdx) => (
                                  <div key={fIdx} className="flex items-center gap-1.5 flex-wrap font-sans">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedViewBooking(b);
                                        setPreviewFile(file);
                                      }}
                                      className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-850 bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md transition-colors font-sans"
                                    >
                                      <Paperclip className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                                      <span className="truncate max-w-[130px] font-sans" title={file.name}>{file.name}</span>
                                    </button>
                                    {file.data && (
                                      <a
                                        href={file.data}
                                        download={file.name}
                                        className="inline-flex items-center gap-1 text-[9px] font-extrabold text-slate-950 bg-amber-500 hover:bg-amber-600 border border-amber-600 px-1.5 py-0.5 rounded cursor-pointer font-sans"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Download className="w-2.5 h-2.5" />
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 font-sans pt-1 border-t border-slate-100">
                            <div className="flex items-center gap-1.5 justify-between font-sans">
                              <span className="text-xs text-slate-505 font-bold font-sans">الحالة الإجرائية:</span>
                              <select
                                value={b.status}
                                onChange={(e) => handleUpdateBookingStatus(b.id, e.target.value as any)}
                                className={`p-1.5 text-xs font-bold rounded-lg border bg-white focus:outline-none ${
                                  b.status === 'completed' ? 'text-emerald-800 border-emerald-300 bg-emerald-50' :
                                  b.status === 'processing' ? 'text-blue-800 border-blue-300 bg-blue-50' :
                                  b.status === 'cancelled' ? 'text-red-800 border-red-300 bg-red-50' :
                                  'text-amber-850 border-amber-300 bg-amber-50'
                                }`}
                              >
                                <option value="pending">قيد الانتظار لمراجعة الإدارة</option>
                                <option value="processing">تحت الإخراج والتعقيب</option>
                                <option value="completed">مكتملة ومستحقة الدفع</option>
                                <option value="cancelled">ملغية ومسحوبة</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-1.5 justify-end pt-2 border-t border-slate-100 flex-wrap font-sans">
                              {b.paymentStatus === 'processing_transfer' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedBookings = bookings.map(item => {
                                      if (item.id === b.id) return { ...item, paymentStatus: 'paid' as const };
                                      return item;
                                    });
                                    setBookings(updatedBookings);
                                    
                                    const updatedTxs = transactions.map(t => {
                                      if (t.clientName.trim() === b.clientName.trim() && t.serviceName.trim() === b.serviceName.trim()) {
                                        return {
                                          ...t,
                                          notes: t.notes.replace('حوالة بنكية معلقة للدراسة والتدقيق المصرفي', 'مدفوعة بالكامل ومعتمدة بموجب تدقيق الإدارة')
                                        };
                                      }
                                      return t;
                                    });
                                    setTransactions(updatedTxs);
                                    alert('✅ تم اعتماد التحويل البنكي وتأكيد السداد!');
                                  }}
                                  className="bg-indigo-650 hover:bg-indigo-700 text-white px-2 py-1.5 rounded font-extrabold text-[10px] whitespace-nowrap transition-colors"
                                  title="اعتماد الحوالة البنكية وتصفية الديون"
                                >
                                  ✔ اعتماد التحويل
                                </button>
                              )}
                                {(() => {
                                   const matchingTx = transactions.find(t => 
                                     t.clientName.trim() === b.clientName.trim() && 
                                     t.serviceName.trim() === b.serviceName.trim()
                                   );
                                   return matchingTx ? (
                                     <button
                                       onClick={() => {
                                         setSelectedTx(matchingTx);
                                         setIsInvoiceOpen(true);
                                         setDirectPrintActive(true);
                                       }}
                                       className="bg-amber-500 hover:bg-amber-600 border border-amber-600 text-slate-950 px-2.5 py-1.5 rounded font-black text-[11px] flex items-center gap-1.5 transition-colors shadow-3xs cursor-pointer ml-1.5"
                                       title={lang === 'en' ? 'Print official simplified VAT invoice' : 'طباعة الفاتورة والعمولات المعتمدة'}
                                     >
                                        <Printer className="w-3.5 h-3.5" />
                                        <span>{lang === 'en' ? 'Print' : 'طباعة'}</span>
                                     </button>
                                   ) : null;
                                 })()}
                                 <button
                                   onClick={() => handlePreFillTransactionFromBooking(b)}
                                   className="bg-slate-950 hover:bg-slate-800 text-white px-2.5 py-1.5 rounded font-black text-[11px] transition-colors cursor-pointer"
                                   title="ترحيل بيانات الطلب لإنشاء قيد مالي"
                                 >
                                   ترحيل لدفتر الفواتير المالية
                                 </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm('هل تريد حذف سجل الطلب هذا نهائياً من أرشيف المراجعة؟')) {
                                      const filtered = bookings.filter(item => item.id !== b.id);
                                      setBookings(filtered);
                                    }
                                  }}
                                  className="p-1 px-1.5 text-red-650 hover:text-white hover:bg-red-605 border border-red-200 rounded transition-colors"
                                  title="حذف من الأرشيف"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop Table Layout: visible on larger screens */}
                      <div className="hidden @md:block overflow-x-auto font-sans">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-700 font-bold font-sans">
                            <tr>
                              <th className="p-4">العميل المستفيد وجواله</th>
                              <th className="p-4">الخدمة المطلوبة</th>
                              <th className="p-4">تاريخ المرفق</th>
                              <th className="p-4 text-center font-sans">الوضعية الحالية للطلب</th>
                              <th className="p-4 text-left font-sans">العمليات الإدارية الفورية</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150 font-sans">
                            {filteredBookings.map(b => (
                              <tr key={b.id} className="hover:bg-slate-50 transition-colors font-sans">
                                <td className="p-4 font-sans">
                                  <strong className="text-slate-900 block text-sm font-sans">{b.clientName}</strong>
                                  <div className="flex flex-wrap gap-1.5 items-center mt-0.5 font-sans">
                                    <span className="text-slate-500 font-mono text-[11px] tracking-wide">{b.phoneNumber}</span>
                                    {b.paymentStatus ? (
                                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold font-sans ${
                                        b.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                                        b.paymentStatus === 'processing_transfer' ? 'bg-indigo-100 text-indigo-805' :
                                        'bg-amber-100 text-amber-850'
                                      }`}>
                                        {b.paymentStatus === 'paid' && `💳 مسددة (${b.paymentMethod?.toUpperCase()})`}
                                        {b.paymentStatus === 'processing_transfer' && `⏳ بانتظار مراجعة التحويل`}
                                        {b.paymentStatus === 'unpaid' && `💵 دفع نقدي بالمنشأة`}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] bg-slate-100 text-slate-650 px-1.5 py-0.2 rounded font-bold font-sans">💵 سداد غير محدد</span>
                                    )}
                                  </div>
                                  {b.notes && (
                                    <p className="text-[11px] text-slate-500 mt-1 max-w-sm font-sans line-clamp-2" title={b.notes}>
                                      <strong>ملاحظات:</strong> {b.notes}
                                    </p>
                                  )}
                                  {getBookingFiles(b).length > 0 && (
                                    <div className="mt-2 space-y-1.5 max-w-sm font-sans">
                                      <p className="text-[10px] font-extrabold text-slate-400">المستندات الرسمية ({getBookingFiles(b).length}):</p>
                                      {getBookingFiles(b).map((file, fIdx) => (
                                        <div key={fIdx} className="flex items-center gap-1.5 flex-wrap font-sans">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSelectedViewBooking(b);
                                              setPreviewFile(file);
                                            }}
                                            className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-850 bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md transition-colors"
                                            title="اضغط لمعاينة هذا الملف PDF تفاعلياً"
                                          >
                                            <Paperclip className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                                            <span className="truncate max-w-[130px] font-sans" title={file.name}>{file.name}</span>
                                            <span className="text-[9px] text-slate-400 font-mono">({file.size})</span>
                                          </button>
                                          {file.data && (
                                            <a
                                              href={file.data}
                                              download={file.name}
                                              className="inline-flex items-center gap-1 text-[9px] font-extrabold text-slate-950 bg-amber-500 hover:bg-amber-600 border border-amber-600 px-1.5 py-0.5 rounded cursor-pointer"
                                              title="تنزيل المستند مباشرة"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <Download className="w-2.5 h-2.5" />
                                              <span>تنزيل</span>
                                            </a>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </td>
                                <td className="p-4">
                                  <div className="flex flex-col gap-1 max-w-[180px] font-sans">
                                    <select
                                      value={b.serviceId}
                                      onChange={(e) => handleUpdateBookingService(b.id, e.target.value)}
                                      className="p-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 cursor-pointer font-sans shadow-3xs"
                                      title="ربط وتعديل ارتباط هذا الطلب بخدمة أخرى من دليل الخدمات لتتبع أدائه المالي والعملياتي"
                                    >
                                      {services.map(s => (
                                        <option key={s.id} value={s.id}>
                                          {s.name} ({s.officeFee} ر.س)
                                        </option>
                                      ))}
                                      {!services.some(s => s.id === b.serviceId) && (
                                        <option value={b.serviceId} disabled>
                                          {b.serviceName} (غير ملتصق بالدليل)
                                        </option>
                                      )}
                                    </select>
                                    <span className="text-[9px] text-slate-400 font-sans block">
                                      معرّف الحزمة: <span className="font-mono text-[8px] bg-slate-100 px-1 py-0.5 rounded text-slate-600">{b.serviceId || 'srv-none'}</span>
                                    </span>
                                  </div>
                                </td>
                                <td className="p-4 font-mono text-slate-500 text-xs">
                                  {new Date(b.date).toLocaleDateString('ar-SA')} 
                                  <span className="block text-[10px] text-slate-400 mt-0.5 font-sans">
                                    {new Date(b.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </td>
                                <td className="p-4 text-center">
                                  <select
                                    value={b.status}
                                    onChange={(e) => handleUpdateBookingStatus(b.id, e.target.value as any)}
                                    className={`p-1.5 text-xs font-bold font-sans rounded border bg-white focus:outline-none ${
                                      b.status === 'completed' ? 'text-emerald-800 border-emerald-300 bg-emerald-50' :
                                      b.status === 'processing' ? 'text-blue-800 border-blue-300 bg-blue-50' :
                                      b.status === 'cancelled' ? 'text-red-800 border-red-300 bg-red-50' :
                                      'text-amber-850 border-amber-300 bg-amber-50'
                                    }`}
                                  >
                                    <option value="pending">قيد الانتظار لمراجعة الإدارة</option>
                                    <option value="processing">تحت الإخراج والتعقيب</option>
                                    <option value="completed">مكتملة ومستحقة الدفع</option>
                                    <option value="cancelled">ملغية ومسحوبة</option>
                                  </select>
                                </td>
                                <td className="p-4 text-left space-x-reverse space-x-1.5 flex flex-wrap gap-1 items-center justify-end font-sans">
                                  {b.paymentStatus === 'processing_transfer' && (
                                    <button
                                      onClick={() => {
                                        const updatedBookings = bookings.map(item => {
                                          if (item.id === b.id) return { ...item, paymentStatus: 'paid' as const };
                                          return item;
                                        });
                                        setBookings(updatedBookings);
                                        
                                        const updatedTxs = transactions.map(t => {
                                          if (t.clientName.trim() === b.clientName.trim() && t.serviceName.trim() === b.serviceName.trim()) {
                                            return {
                                              ...t,
                                              notes: t.notes.replace('حوالة بنكية معلقة للدراسة والتدقيق المصرفي', 'مدفوعة بالكامل ومعتمدة بموجب تدقيق الإدارة')
                                            };
                                          }
                                          return t;
                                        });
                                        setTransactions(updatedTxs);
                                        alert('✅ تم اعتماد التحويل البنكي وتأكيد السداد!');
                                      }}
                                      className="bg-indigo-650 hover:bg-indigo-700 text-white px-2 py-1.5 rounded font-extrabold text-[10px] whitespace-nowrap transition-colors"
                                      title="اعتماد الحوالة البنكية وتصفية الديون"
                                    >
                                      ✔ اعتماد التحويل
                                    </button>
                                  )}
                                  {(() => {
                                     const matchingTx = transactions.find(t => 
                                       t.clientName.trim() === b.clientName.trim() && 
                                       t.serviceName.trim() === b.serviceName.trim()
                                     );
                                     return matchingTx ? (
                                       <button
                                         onClick={() => {
                                           setSelectedTx(matchingTx);
                                           setIsInvoiceOpen(true);
                                           setDirectPrintActive(true);
                                         }}
                                         className="bg-amber-500 hover:bg-amber-600 border border-amber-600 text-slate-950 px-2.5 py-1.5 rounded font-black text-[11px] flex items-center gap-1.5 transition-colors shadow-3xs cursor-pointer ml-1.5 font-sans"
                                         title={lang === 'en' ? 'Print official simplified VAT invoice' : 'طباعة الفاتورة والعمولات المعتمدة'}
                                       >
                                          <Printer className="w-3.5 h-3.5" />
                                          <span>{lang === 'en' ? 'Print' : 'طباعة'}</span>
                                       </button>
                                     ) : null;
                                   })()}
                                   <button
                                     onClick={() => handlePreFillTransactionFromBooking(b)}
                                     className="bg-slate-950 hover:bg-slate-800 text-white px-2.5 py-1.5 rounded font-black text-[11px] transition-colors cursor-pointer font-sans"
                                     title="ترحيل بيانات الطلب لإنشاء قيد مالي"
                                   >
                                     ترحيل لدفتر الفواتير المالية
                                   </button>
                                  <button
                                    onClick={() => {
                                      if (window.confirm('هل تريد حذف سجل الطلب هذا نهائياً من أرشيف المراجعة؟')) {
                                        const filtered = bookings.filter(item => item.id !== b.id);
                                        setBookings(filtered);
                                      }
                                    }}
                                    className="p-1 px-1.5 text-red-650 hover:text-white hover:bg-red-605 border border-red-200 rounded transition-colors"
                                    title="حذف من الأرشيف"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

            {/* --- ADMIN INTERNAL VIEW 2: CLIENT BOOKINGS MANAGER (REDUNDANT DUPLICATE INACTIVE) --- */}
            {adminTab === 'requests_inactive_duplicate_never_show' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-950">إدارة طلبات المعاملات والتعقيب المرفوعة</h3>
                    <p className="text-slate-500 text-xs mt-1">طلبات العملاء تأتي من الموقع الخارجي؛ يمكنك مراجعتها، تحديث حالاتها، أو ترحيلها مباشرة كمستند فاتورة مالي.</p>
                  </div>
                  <span className="text-xs bg-slate-200 font-bold px-2.5 py-1 rounded-full text-slate-700">إجمالي الطلبات: {bookings.length}</span>
                </div>

                {bookings.length === 0 ? (
                  <div className="text-center py-10 bg-white border border-stone-200 rounded-lg text-slate-400 text-sm">
                    لا تتوفر طلبات مرفوعة حالياً من الموقع بانتظار معاملات جديدة.
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-[#f8fafc] border-b border-slate-200 text-slate-700 font-bold">
                          <tr>
                            <th className="p-4">العميل المستفيد وجواله</th>
                            <th className="p-4">الخدمة المطلوبة</th>
                            <th className="p-4">تاريخ المرفق</th>
                            <th className="p-4 text-center">الوضعية الحالية للطلب</th>
                            <th className="p-4 text-left">العمليات الإدارية الفورية</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150">
                          {bookings.map(b => (
                            <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4">
                                <strong className="text-slate-900 block text-sm font-sans">{b.clientName}</strong>
                                <div className="flex flex-wrap gap-1.5 items-center mt-0.5">
                                  <span className="text-slate-500 font-mono text-[11px] tracking-wide">{b.phoneNumber}</span>
                                  {b.paymentStatus ? (
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                      b.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                                      b.paymentStatus === 'processing_transfer' ? 'bg-indigo-100 text-indigo-805' :
                                      'bg-amber-100 text-amber-850'
                                    }`}>
                                      {b.paymentStatus === 'paid' && `💳 مسددة (${b.paymentMethod?.toUpperCase()})`}
                                      {b.paymentStatus === 'processing_transfer' && `⏳ بانتظار مراجعة التحويل`}
                                      {b.paymentStatus === 'unpaid' && `💵 دفع نقدي بالمنشأة`}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] bg-slate-100 text-slate-650 px-1.5 py-0.2 rounded font-bold">💵 سداد غير محدد</span>
                                  )}
                                </div>
                                {b.notes && (
                                  <p className="text-[11px] text-slate-500 mt-1 max-w-sm font-sans line-clamp-2" title={b.notes}>
                                    <strong>ملاحظات:</strong> {b.notes}
                                  </p>
                                )}
                                {getBookingFiles(b).length > 0 && (
                                  <div className="mt-2 space-y-1.5 max-w-sm">
                                    <p className="text-[10px] font-extrabold text-slate-400">المستندات الرسمية ({getBookingFiles(b).length}):</p>
                                    {getBookingFiles(b).map((file, fIdx) => (
                                      <div key={fIdx} className="flex items-center gap-1.5 flex-wrap">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedViewBooking(b);
                                            setPreviewFile(file);
                                          }}
                                          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-850 bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md transition-colors"
                                          title="اضغط لمعاينة هذا الملف PDF تفاعلياً"
                                        >
                                          <Paperclip className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                                          <span className="truncate max-w-[130px] font-sans" title={file.name}>{file.name}</span>
                                          <span className="text-[9px] text-slate-400 font-mono">({file.size})</span>
                                        </button>
                                        {file.data && (
                                          <a
                                            href={file.data}
                                            download={file.name}
                                            className="inline-flex items-center gap-1 text-[9px] font-extrabold text-slate-950 bg-amber-500 hover:bg-amber-600 border border-amber-600 px-1.5 py-0.5 rounded cursor-pointer"
                                            title="تنزيل المستند مباشرة"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <Download className="w-2.5 h-2.5" />
                                            <span>تنزيل</span>
                                          </a>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="p-4">
                                <div className="flex flex-col gap-1 max-w-[180px]">
                                  <select
                                    value={b.serviceId}
                                    onChange={(e) => handleUpdateBookingService(b.id, e.target.value)}
                                    className="p-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 cursor-pointer font-sans shadow-3xs"
                                    title="ربط وتعديل ارتباط هذا الطلب بخدمة أخرى من دليل الخدمات لتتبع أدائه المالي والعملياتي"
                                  >
                                    {services.map(s => (
                                      <option key={s.id} value={s.id}>
                                        {s.name} ({s.officeFee} ر.س)
                                      </option>
                                    ))}
                                    {!services.some(s => s.id === b.serviceId) && (
                                      <option value={b.serviceId} disabled>
                                        {b.serviceName} (غير ملتصق بالدليل)
                                      </option>
                                    )}
                                  </select>
                                  <span className="text-[9px] text-slate-400 font-sans block">
                                    معرّف الحزمة: <span className="font-mono text-[8px] bg-slate-100 px-1 py-0.5 rounded text-slate-600">{b.serviceId || 'srv-none'}</span>
                                  </span>
                                </div>
                              </td>
                              <td className="p-4 font-mono text-slate-500 text-xs">
                                {new Date(b.date).toLocaleDateString('ar-SA')} 
                                <span className="block text-[10px] text-slate-400 mt-0.5">
                                  {new Date(b.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <select
                                  value={b.status}
                                  onChange={(e) => handleUpdateBookingStatus(b.id, e.target.value as any)}
                                  className={`p-1.5 text-xs font-bold rounded border bg-white focus:outline-none ${
                                    b.status === 'completed' ? 'text-emerald-800 border-emerald-300 bg-emerald-50' :
                                    b.status === 'processing' ? 'text-blue-800 border-blue-300 bg-blue-50' :
                                    b.status === 'cancelled' ? 'text-red-800 border-red-300 bg-red-50' :
                                    'text-amber-850 border-amber-300 bg-amber-50'
                                  }`}
                                >
                                  <option value="pending">قيد الانتظار لمراجعة الإدارة</option>
                                  <option value="processing">تحت الإخراج والتعقيب</option>
                                  <option value="completed">مكتملة ومستحقة الدفع</option>
                                  <option value="cancelled">ملغية ومسحوبة</option>
                                </select>
                              </td>
                              <td className="p-4 text-left space-x-reverse space-x-1.5 flex flex-wrap gap-1 items-center justify-end">
                                {b.paymentStatus === 'processing_transfer' && (
                                  <button
                                    onClick={() => {
                                      const updatedBookings = bookings.map(item => {
                                        if (item.id === b.id) {
                                          return { ...item, paymentStatus: 'paid' as const };
                                        }
                                        return item;
                                      });
                                      setBookings(updatedBookings);
                                      
                                      const updatedTxs = transactions.map(t => {
                                        if (t.clientName.trim() === b.clientName.trim() && t.serviceName.trim() === b.serviceName.trim()) {
                                          return {
                                            ...t,
                                            notes: t.notes.replace('حوالة بنكية معلقة للدراسة والتدقيق المصرفي', 'مدفوعة بالكامل ومعتمدة بموجب تدقيق الإدارة')
                                          };
                                        }
                                        return t;
                                      });
                                      setTransactions(updatedTxs);
                                      alert('✅ تم اعتماد التحويل البنكي وتأكيد السداد في سجلات الحسابات الفورية!');
                                    }}
                                    className="bg-indigo-650 hover:bg-indigo-700 text-white px-2 py-1.5 rounded font-extrabold text-[11px] whitespace-nowrap transition-colors shadow-3xs"
                                    title="اعتماد الحوالة البنكية وتصفية الديون"
                                  >
                                    ✔ اعتماد التحويل
                                  </button>
                                )}
                                {(() => {
                                   const matchingTx = transactions.find(t => 
                                     t.clientName.trim() === b.clientName.trim() && 
                                     t.serviceName.trim() === b.serviceName.trim()
                                   );
                                   return matchingTx ? (
                                     <button
                                       onClick={() => {
                                         setSelectedTx(matchingTx);
                                         setIsInvoiceOpen(true);
                                         setDirectPrintActive(true);
                                       }}
                                       className="bg-amber-500 hover:bg-amber-600 border border-amber-600 text-slate-950 px-2.5 py-1.5 rounded font-black text-[11px] flex items-center gap-1.5 transition-colors shadow-3xs cursor-pointer ml-1.5"
                                       title={lang === 'en' ? 'Print official simplified VAT invoice' : 'طباعة الفاتورة والعمولات المعتمدة'}
                                     >
                                        <Printer className="w-3.5 h-3.5" />
                                        <span>{lang === 'en' ? 'Print' : 'طباعة'}</span>
                                     </button>
                                   ) : null;
                                 })()}
                                 <button
                                   onClick={() => handlePreFillTransactionFromBooking(b)}
                                   className="bg-slate-950 hover:bg-slate-800 text-white px-2.5 py-1.5 rounded font-black text-[11px] transition-colors cursor-pointer"
                                   title="ترحيل بيانات الطلب لإنشاء قيد مالي"
                                 >
                                   ترحيل لدفتر الفواتير المالية
                                 </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm('هل تريد حذف سجل الطلب هذا نهائياً من أرشيف المراجعة؟')) {
                                      const filtered = bookings.filter(item => item.id !== b.id);
                                      setBookings(filtered);
                                    }
                                  }}
                                  className="p-1 px-1.5 text-red-600 hover:text-white hover:bg-red-600 border border-red-200 rounded transition-colors"
                                  title="حذف من الأرشيف"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --- ADMIN INTERNAL VIEW 3: ACCOUNTING JOURNAL (GENERAL LEDGER) --- */}
            {adminTab === 'ledger' && (
              <div className="space-y-8 animate-fade-in">
                
                {/* 1. Register new ledger transaction */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-md">
                  <div className="flex items-center gap-2 mb-4 text-slate-900 border-b border-slate-100 pb-2.5">
                    <PlusCircle className="w-5 h-5 text-amber-600" />
                    <h3 className="text-base font-extrabold">تسجيل وترحيل فاتورة وعملية مالية جديدة</h3>
                  </div>

                  <form onSubmit={handleAddTransactionSubmit} className="space-y-4 font-sans text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {/* Client Name */}
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">اسم العميل بالكامل:</label>
                        <input
                          type="text"
                          required
                          value={txClientName}
                          onChange={(e) => setTxClientName(e.target.value)}
                          placeholder="مثلاً: شركة النخبة المحدودة"
                          className="w-full p-2.5 border border-slate-300 rounded focus:outline-none focus:border-slate-800 text-sm font-sans"
                        />
                      </div>

                      {/* Service Type matched */}
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">الخدمة الإجرائية للمكتب:</label>
                        <select
                          value={txServiceId}
                          onChange={(e) => handleAdminServiceSelectChange(e.target.value)}
                          className="w-full p-2.5 border border-slate-300 rounded bg-white focus:outline-none focus:border-slate-800 text-sm font-sans"
                        >
                          {services.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Gov State Fee */}
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">الرسوم والمستحقات الحكومية (ر.س):</label>
                        <input
                          type="number"
                          required
                          value={txGovFee}
                          onChange={(e) => setTxGovFee(Number(e.target.value) || 0)}
                          placeholder="0.00"
                          className="w-full p-2.5 border border-slate-300 rounded focus:outline-none focus:border-slate-800 text-sm font-mono"
                        />
                      </div>

                      {/* Office administrative fee */}
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">أتعاب خدمات متبعة (ر.س):</label>
                        <input
                          type="number"
                          required
                          value={txOfficeFee}
                          onChange={(e) => setTxOfficeFee(Number(e.target.value) || 0)}
                          placeholder="0.00"
                          className="w-full p-2.5 border border-slate-300 rounded focus:outline-none focus:border-slate-800 text-sm font-mono"
                        />
                      </div>

                      {/* Preferred international customer currency selector */}
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">عملة السداد والمطابقة:</label>
                        <select
                          value={txPaymentCurrency}
                          onChange={(e) => setTxPaymentCurrency(e.target.value as 'SAR' | 'USD' | 'EUR')}
                          className="w-full p-2.5 border border-slate-300 rounded bg-white focus:outline-none focus:border-slate-800 text-sm font-sans font-bold text-amber-950"
                        >
                          <option value="SAR">🇸🇦 SAR (الريال)</option>
                          <option value="USD">🇺🇸 USD (الدولار)</option>
                          <option value="EUR">🇪🇺 EUR (اليورو)</option>
                        </select>
                      </div>
                    </div>

                    {/* Additional Notes for Invoice */}
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">ملاحظات المستند المالي وفترة التغطية:</label>
                      <input
                        type="text"
                        value={txNotes}
                        onChange={(e) => setTxNotes(e.target.value)}
                        placeholder="مثل: المتابعة لإصدار السجل التجاري شامل الترخيص والدفاع المدني بجدة..."
                        className="w-full p-2.5 border border-slate-300 rounded focus:outline-none focus:border-slate-800 text-sm font-sans"
                      />
                    </div>

                    {/* Pricing calculation feedback banner */}
                    <div className="bg-[#f8fafc] p-3 rounded border border-slate-205 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono items-center">
                      <div>
                        <span className="text-slate-500 font-sans">أتعاب المكتب الخاضعة:</span>
                        <strong className="block text-slate-900 text-sm">{txOfficeFee.toFixed(2)} ر.س</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 font-sans">ضريبة مضافة (15%):</span>
                        <strong className="block text-slate-950 text-sm">{(txOfficeFee * 0.15).toFixed(2)} ر.س</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 font-sans">جهة الرسوم (معفى ضريبياً):</span>
                        <strong className="block text-blue-900 text-sm">{txGovFee.toFixed(2)} ر.س</strong>
                      </div>
                      <div className="bg-amber-100 p-2 rounded text-center col-span-1 font-sans">
                        <span className="text-amber-850 font-bold">المجموع المقيد:</span>
                        <strong className="block text-amber-950 text-sm font-mono">{(txGovFee + txOfficeFee + (txOfficeFee * 0.15)).toFixed(2)} ر.س</strong>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm px-6 py-2.5 rounded shadow transition-colors"
                      >
                        ترحيل وترصيد الفاتورة الضريبية
                      </button>
                    </div>
                  </form>
                </div>

                {/* 2. Ledger list transactions */}
                <div className="space-y-4 font-sans">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-slate-200 gap-3">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <FileSpreadsheet className="w-5.5 h-5.5 text-slate-600" />
                      <span>{lang === 'en' ? 'Accounting Journal & Invoiced Transactions' : 'دفتر قيود الحسابات والفواتير المرفوعة'}</span>
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="text-xs text-slate-500 font-mono bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                        {lang === 'en' ? `Transactions: ${transactions.length}` : `العمليات المرحلة كلياً: ${transactions.length}`}
                      </span>
                      {transactions.length > 0 && (
                        <button
                          id="export-ledger-csv-btn"
                          type="button"
                          onClick={handleExportTransactionsToCSV}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded shadow-xs text-xs font-sans transition-all"
                          title={lang === 'en' ? 'Export journal to Microsoft Excel / CSV file' : 'تصدير قيود الحسابات لملف إكسيل / CSV'}
                        >
                          <Download className="w-4 h-4 text-white" />
                          <span>{lang === 'en' ? 'Export CSV' : 'تصدير الحسابات (CSV)'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {transactions.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs bg-white border border-slate-205 rounded">
                      لا توجد فواتير ضريبية مقيدة بالدفتر المالي بعد.
                    </div>
                  ) : (
                    <>
                      {/* Search Bar / Batch Action Control Panel */}
                      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 font-sans">
                        <div className="flex items-center gap-2 w-full max-w-md">
                          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <input
                            type="text"
                            value={ledgerSearchQuery}
                            onChange={(e) => setLedgerSearchQuery(e.target.value)}
                            placeholder={lang === 'en' ? 'Search by invoice #, client name or service...' : 'بحث في الفواتير برقم الفاتورة، اسم العميل، والخدمة...'}
                            className="w-full text-xs bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 font-sans focus:ring-0"
                          />
                          {ledgerSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setLedgerSearchQuery('')}
                              className="text-xs text-slate-400 hover:text-slate-600 font-mono flex-shrink-0"
                            >
                              ✖ مسح
                            </button>
                          )}
                        </div>

                        {/* Batch Action Section */}
                        {selectedBatchTxIds.length > 0 && (
                          <div className="flex items-center gap-2.5 flex-wrap text-xs bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg shadow-3xs animate-fade-in font-sans">
                            <span className="font-bold text-amber-900 leading-none">
                              {lang === 'en' 
                                ? `${selectedBatchTxIds.length} invoice(s) selected` 
                                : `تم تحديد عدد ${selectedBatchTxIds.length} فاتورة`}
                            </span>
                            
                            <button
                              type="button"
                              onClick={() => {
                                setIsBatchPrintOpen(true);
                              }}
                              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-3 py-1 rounded shadow-sm text-[11px] transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-950" />
                              <span>{lang === 'en' ? 'Bulk Print/PDF Hub' : 'طباعة وإصدار مجمع'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedBatchTxIds([])}
                              className="text-slate-500 hover:text-slate-800 hover:underline px-1.5 text-[11px] font-bold"
                            >
                              {lang === 'en' ? 'Clear Selection' : 'إعادة ضبط'}
                            </button>
                          </div>
                        )}
                      </div>

                      {filteredTransactions.length === 0 ? (
                        <div className="py-12 text-center text-slate-500 text-xs bg-white border border-slate-200 rounded-xl shadow-3xs flex flex-col items-center justify-center gap-2 font-sans">
                          <span>🔍 لم يتم العثور على أي فواتير تطابق استعلام البحث الحالي: "{ledgerSearchQuery}"</span>
                          <button
                            type="button"
                            onClick={() => setLedgerSearchQuery('')}
                            className="mt-1 bg-slate-905 hover:bg-slate-800 text-slate-900 border border-slate-300 font-bold px-3 py-1 rounded text-[11px] transition-all"
                          >
                            إعادة ضبط البحث
                          </button>
                        </div>
                      ) : (
                        <div className="bg-white border border-slate-250 rounded-xl overflow-hidden shadow-sm">
                          <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold select-none">
                                  <th className="p-3 text-center w-12">
                                    <input
                                      type="checkbox"
                                      checked={
                                        filteredTransactions.length > 0 &&
                                        filteredTransactions.every(t => selectedBatchTxIds.includes(t.id))
                                      }
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          const allIds = filteredTransactions.map(t => t.id);
                                          setSelectedBatchTxIds(prev => Array.from(new Set([...prev, ...allIds])));
                                        } else {
                                          const allIds = filteredTransactions.map(t => t.id);
                                          setSelectedBatchTxIds(prev => prev.filter(id => !allIds.includes(id)));
                                        }
                                      }}
                                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-300 transition-all cursor-pointer"
                                      title={lang === 'en' ? 'Select All Invoices' : 'تحديد كافة الفواتير'}
                                    />
                                  </th>
                                  <th className="p-3">رقم الفاتورة</th>
                                  <th className="p-3">العميل</th>
                                  <th className="p-3">اسم الخدمة</th>
                                  <th className="p-3">رسوم الدولة</th>
                                  <th className="p-3">أتعاب المكتب</th>
                                  <th className="p-3">الضريبة</th>
                                  <th className="p-3">المجموع الكلي</th>
                                  <th className="p-3">تاريخ القيد</th>
                                  <th className="p-3 text-center">الإجراءات</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700">
                                {filteredTransactions.map(t => {
                                  const isChecked = selectedBatchTxIds.includes(t.id);
                                  return (
                                    <tr 
                                      key={t.id} 
                                      className={`hover:bg-slate-50/80 transition-colors ${
                                        isChecked ? 'bg-amber-500/5 hover:bg-amber-500/8' : ''
                                      }`}
                                    >
                                      <td className="p-3 text-center">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => {
                                            if (isChecked) {
                                              setSelectedBatchTxIds(prev => prev.filter(id => id !== t.id));
                                            } else {
                                              setSelectedBatchTxIds(prev => [...prev, t.id]);
                                            }
                                          }}
                                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-300 transition-all cursor-pointer"
                                        />
                                      </td>
                                      <td className="p-3 font-mono font-bold text-slate-900">{t.invoiceNumber}</td>
                                      <td className="p-3 font-bold">{t.clientName}</td>
                                      <td className="p-3">{t.serviceName}</td>
                                      <td className="p-3 font-mono">{t.govFee.toFixed(2)} ر.س</td>
                                      <td className="p-3 font-mono">{t.officeFee.toFixed(2)} ر.س</td>
                                      <td className="p-3 font-mono text-slate-500">{t.tax.toFixed(2)} ر.س</td>
                                      <td className="p-3 font-mono font-bold text-amber-800">{t.total.toFixed(2)} ر.س</td>
                                      <td className="p-3 text-slate-500">{new Date(t.date).toLocaleDateString('ar-SA')}</td>
                                      <td className="p-3 font-sans">
                                        <div className="flex justify-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSelectedTx(t);
                                              setIsInvoiceOpen(true);
                                            }}
                                            className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-300 rounded text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                            title="معاينة الفاتورة"
                                          >
                                            <Eye className="w-3.5 h-3.5 text-sky-600" />
                                            <span>معاينة</span>
                                           </button>
                                           <button
                                             type="button"
                                             onClick={() => {
                                               setSelectedTx(t);
                                               setInvoiceInitialPdfActive(true);
                                               setIsInvoiceOpen(true);
                                             }}
                                             className="px-2 py-1 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-300 rounded text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                             title="معاينة الطباعة - تنسيق عالي الدقة A4"
                                           >
                                             <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                                             <span>معاينة الطباعة</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSelectedTx(t);
                                              setIsInvoiceOpen(true);
                                              setTimeout(() => {
                                                setDirectPrintActive(true);
                                              }, 180);
                                            }}
                                            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 border border-amber-600 rounded text-[11px] font-bold transition flex items-center gap-1 shadow-3xs cursor-pointer"
                                            title="طباعة الفاتورة مباشرة"
                                          >
                                            <Printer className="w-3.5 h-3.5" />
                                            <span>طباعة</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteTransaction(t.id)}
                                            className="p-1 border border-slate-150 text-red-650 hover:bg-red-50 hover:text-red-700 rounded transition cursor-pointer"
                                            title="إزالة القيد"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                  )}
                </>
              )}
                </div>
              </div>
            )}

            {adminTab === 'services' && (
              <div className="space-y-8 animate-fade-in font-sans">
                
                {/* WELCOME MESSAGE MANAGEMENT CARD */}
                <div className="bg-gradient-to-l from-slate-900 to-slate-850 text-white rounded-2xl p-6 shadow-xl border border-slate-800 space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="font-extrabold text-amber-505 text-lg flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                        <span>إدارة والتحكم بالرسالة الترحيبية المميزة (للزوار والعملاء)</span>
                      </h3>
                      <p className="text-slate-400 text-xs mt-1 font-sans">
                        صياغة النص الترحيبي العريض والمثبت الذي يشاهده المستفيدون فور مراجعة دليل خدمات مكتب سما المملكة بالرئيسية.
                      </p>
                    </div>
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 font-bold px-3 py-1 rounded-full border border-amber-500/20">
                      بوابة التخصيص الفوري
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Form Input fields */}
                    <div className="lg:col-span-2 space-y-4">
                      <label className="block text-slate-300 font-bold text-xs font-sans">نص الرسالة الترحيبية المقترح:</label>
                      <textarea
                        value={welcomeEditor}
                        onChange={(e) => setWelcomeEditor(e.target.value)}
                        placeholder="اكتب هنا الرسالة الترحيبية المميزة للمنصة..."
                        className="w-full p-4 border border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm h-32 bg-slate-950 text-slate-100 leading-relaxed transition-all placeholder:text-slate-600 font-sans"
                      />
                      <div className="flex justify-between items-center text-[11px] text-slate-400 pr-1">
                        <span>* التكرير والأسلوب الودي يشجع العملاء على حجز معاملاتهم بثقة أكبر.</span>
                        <span className="font-mono text-slate-500">حجم المدخلات: <strong className="text-slate-300">{welcomeEditor.length}</strong> حرف</span>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setWelcomeMessage(welcomeEditor);
                            setSaveSuccessMsg(true);
                            setTimeout(() => setSaveSuccessMsg(false), 3000);
                          }}
                          className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-black px-6 py-2.5 rounded-lg text-xs shadow-md transition duration-150 flex items-center gap-2 active:scale-98 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>حفظ وتعميم الرسالة بالمنصة فوراً</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            const defaultMsg = 'أهلاً ومرحباً بكم في منصة مكتب سما المملكة للخدمات المتكاملة وتخليص المعاملات الإلكترونية الحكومية. نسعد بخدمتكم وتخليص كافة معاملاتكم بكل دقة وأمان وسرعة بإشراف نخبة من المختصين والمهنيين.';
                            setWelcomeEditor(defaultMsg);
                          }}
                          className="bg-slate-800 hover:bg-slate-755 text-slate-305 font-bold px-4 py-2.5 rounded-lg text-xs border border-slate-700 transition duration-150"
                        >
                          استعادة النص الافتراضي
                        </button>
                      </div>

                      {saveSuccessMsg && (
                        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-xs font-bold animate-pulse flex items-center gap-2 font-sans">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>تم تحديث وتعميم الرسالة الترحيبية بنجاح! سيراها الآن جميع مستخدمي وزوار الواجهة المباشرة.</span>
                        </div>
                      )}
                    </div>

                    {/* Previews panel */}
                    <div className="bg-slate-950/65 rounded-xl border border-slate-800 p-4 space-y-3.5 flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="text-[10px] bg-slate-850 text-slate-300 font-bold px-2 py-0.5 rounded border border-slate-700">معاينة حية فورية لوجه الصرف</span>
                        <p className="text-[11px] text-slate-550 leading-relaxed font-sans">هكذا تظهر الرسالة تماماً لعملائك الكرام بصدر صفحة التبويب الرئيسية:</p>
                      </div>

                      {/* Micro mockup client rendering */}
                      <div className="bg-slate-905 border border-slate-800 rounded-lg p-4 relative overflow-hidden select-none">
                        <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-slate-800">
                          <span className="w-2h-2 rounded-full bg-red-500"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                          <span className="text-[10px] text-slate-600 font-mono ml-auto">sama-sa.com</span>
                        </div>
                        <div className="bg-slate-950/85 rounded p-3 border border-amber-500/25 relative">
                          <div className="absolute top-0 right-0 w-1 h-full bg-amber-500"></div>
                          <div className="flex items-center gap-1 text-[8px] text-amber-500 font-extrabold mb-1.5 font-sans">
                            <Sparkles className="w-2.5 h-2.5 text-amber-450" />
                            <span>البيان الترحيبي</span>
                          </div>
                          <p className="text-[9px] text-slate-300 leading-normal line-clamp-4 font-sans whitespace-pre-wrap select-text">
                            {welcomeEditor || "أهلاً ومرحباً بكم مع مكتب سما المملكة للخدمات..."}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-[10px] text-amber-500/70 font-sans leading-normal text-center bg-amber-500/5 py-1.5 rounded-lg border border-amber-500/10">
                        * يتم الحفظ التلقائي في قواعد التخزين المحلية للمتصفح.
                      </p>
                    </div>
                  </div>
                </div>

                {/* STATUS MESSAGES MANAGEMENT CARD */}
                <div className="bg-gradient-to-l from-slate-900 to-slate-850 text-white rounded-2xl p-6 shadow-xl border border-slate-800 space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="font-extrabold text-amber-500 text-lg flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                        <span>تعديل وتخصيص رسائل حالات الطلبات والتواصل التلقائي</span>
                      </h3>
                      <p className="text-slate-400 text-xs mt-1 font-sans">
                        تحرير وتهيئة الردود والإفادات المباشرة التي تظهر للعملاء فور الاستفسار وتتبع معاملاتهم حسب الوضع المالي والعملياتي للطلب.
                      </p>
                    </div>
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 font-bold px-3 py-1 rounded-full border border-amber-500/20">
                      قنوات الحالة التفاعلية
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Status 1: Pending */}
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-amber-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-550"></span>
                          رسالة حالة قيد الانتظار لمراجعة الإدارة (Pending)
                        </span>
                      </div>
                      <textarea
                        value={statusMsgPending}
                        onChange={(e) => setStatusMsgPending(e.target.value)}
                        placeholder="ماذا يظهر للعميل عندما يكون الطلب معلقاً بانتظار المراجعة الإدارية..."
                        className="w-full p-3 border border-slate-700 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs h-20 bg-slate-950 text-slate-100 leading-relaxed transition-all placeholder:text-slate-600 font-sans"
                      />
                    </div>

                    {/* Status 2: Processing */}
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-blue-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          رسالة حالة قيد الإنجاز والمعالجة الفورية (Processing)
                        </span>
                      </div>
                      <textarea
                        value={statusMsgProcessing}
                        onChange={(e) => setStatusMsgProcessing(e.target.value)}
                        placeholder="ماذا يظهر للعميل أثناء سير المعاملة ومراجعة الدوائر الحكومية والمختصين..."
                        className="w-full p-3 border border-slate-700 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs h-20 bg-slate-950 text-slate-100 leading-relaxed transition-all placeholder:text-slate-600 font-sans"
                      />
                    </div>

                    {/* Status 3: Completed */}
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          رسالة حالة اكتمال المعاملة وصدور الفاتورة (Completed)
                        </span>
                      </div>
                      <textarea
                        value={statusMsgCompleted}
                        onChange={(e) => setStatusMsgCompleted(e.target.value)}
                        placeholder="ماذا يظهر للعميل عندما تنجز المعاملة والطلب المالي بالكامل وتصبح جاهزة..."
                        className="w-full p-3 border border-slate-700 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs h-20 bg-slate-950 text-slate-100 leading-relaxed transition-all placeholder:text-slate-600 font-sans"
                      />
                    </div>

                    {/* Status 4: Cancelled */}
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-red-450 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          رسالة حالة الاعتذار أو إلغاء الطلب (Cancelled)
                        </span>
                      </div>
                      <textarea
                        value={statusMsgCancelled}
                        onChange={(e) => setStatusMsgCancelled(e.target.value)}
                        placeholder="ماذا يظهر للعميل في حال رفض أو تعذر إنهاء المعاملة وإلغائها لأسباب تنظيمية..."
                        className="w-full p-3 border border-slate-700 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs h-20 bg-slate-950 text-slate-100 leading-relaxed transition-all placeholder:text-slate-600 font-sans"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.setItem('sm_status_msg_pending', statusMsgPending);
                        localStorage.setItem('sm_status_msg_processing', statusMsgProcessing);
                        localStorage.setItem('sm_status_msg_completed', statusMsgCompleted);
                        localStorage.setItem('sm_status_msg_cancelled', statusMsgCancelled);
                        setSaveSuccessStatusMsg(true);
                        setTimeout(() => setSaveSuccessStatusMsg(false), 3000);
                      }}
                      className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-black px-6 py-2.5 rounded-lg text-xs shadow-md transition duration-150 flex items-center gap-2 active:scale-98 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>حفظ وتطبيق رسائل الحالات بالمنصة فوراً</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const defPending = 'قيد الانتظار لمراجعة الإدارة - نعتز بثقتكم وسنتولى معالجتها حالاً.';
                        const defProcessing = 'تحت المعالجة الإجرائية الآن - يتم تنفيذ المعاملة ومراجعة الجهات المختصة.';
                        const defCompleted = 'مكتملة ومستند الفاتورة جاهز - نسعد دائماً برضاكم التام.';
                        const defCancelled = 'ملغية - نرجو التواصل مع الإدارة للاستفسار والتحقق.';
                        
                        setStatusMsgPending(defPending);
                        setStatusMsgProcessing(defProcessing);
                        setStatusMsgCompleted(defCompleted);
                        setStatusMsgCancelled(defCancelled);
                      }}
                      className="bg-slate-800 hover:bg-slate-755 text-slate-305 font-bold px-4 py-2.5 rounded-lg text-xs border border-slate-700 transition duration-150"
                    >
                      استعادة الإفادات الافتراضية
                    </button>
                    
                    {saveSuccessStatusMsg && (
                      <span className="text-emerald-400 text-xs font-bold animate-pulse font-sans flex items-center gap-1.5 mr-auto">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>تم حفظ وتطبيق رسائل حالات المعاملات بنجاح!</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* BACKGROUND SETTINGS AND AI CONFIGURATION CARD */}
                <div className="bg-gradient-to-l from-slate-900 to-slate-850 text-white rounded-2xl p-6 shadow-xl border border-slate-800 space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="font-extrabold text-amber-500 text-lg flex items-center gap-2">
                        <Sun className="w-5 h-5 text-amber-400" />
                        <span>التحكم بالخلفية الإيمانية وإعدادات الذكاء الاصطناعي لمكة المكرمة</span>
                      </h3>
                      <p className="text-slate-400 text-xs mt-1 font-sans">
                        تحرير وتعيين مظهر صور مكة المكرمة المهيبة بخلفية المنصة لتتناسب بذكاء مع الزوار والعملاء.
                      </p>
                    </div>
                    <span className="text-[10px] bg-sky-500/10 text-sky-400 font-bold px-3 py-1 rounded-full border border-sky-500/20">
                      إعدادات مظهر النظام
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Strategy 1: AI Auto */}
                    <div 
                      onClick={() => setBgStrategy('ai')}
                      className={`cursor-pointer group relative border rounded-xl p-4 transition-all hover:border-amber-500/50 ${
                        bgStrategy === 'ai' 
                          ? 'bg-slate-950/90 border-amber-500 ring-1 ring-amber-500 shadow-md shadow-amber-500/5' 
                          : 'bg-slate-950/30 border-slate-800'
                      }`}
                    >
                      <div className="absolute top-2.5 left-2.5 bg-amber-500/10 p-1 rounded-md text-amber-400">
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      </div>
                      <h4 className="font-extrabold text-xs text-amber-500 mb-1.5 flex items-center gap-1">
                        <span>التبديل التلقائي الذكي</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-normal mb-3 font-sans">
                        تحديد وتعميم الخلفية تلقائياً بناءً على الوقت المحلي للزائر لمطابقة صلواتهم وتوقيت الديار المقدسة.
                      </p>
                      <span className="text-[9px] font-bold text-amber-400/80 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10 block text-center">
                        موصى به للزوار
                      </span>
                    </div>

                    {/* Strategy 2: Sunrise */}
                    <div 
                      onClick={() => setBgStrategy('sunrise')}
                      className={`cursor-pointer group relative border rounded-xl overflow-hidden transition-all hover:border-amber-500/50 ${
                        bgStrategy === 'sunrise' 
                          ? 'bg-slate-950/90 border-amber-500 ring-1 ring-amber-500' 
                          : 'bg-slate-950/30 border-slate-800'
                      }`}
                    >
                      <div className="h-20 bg-cover bg-center animate-fade-in" style={{ backgroundImage: `url("${makkahSunriseImg}")` }}></div>
                      <div className="p-3">
                        <h4 className="font-extrabold text-xs text-white mb-1 flex items-center gap-1">
                          <Sun className="w-3 h-3 text-amber-500" />
                          <span>شروق مكة المكرمة</span>
                        </h4>
                        <p className="text-[9px] text-slate-400 leading-normal font-sans">
                          فرض خلفية الشروق المشرق (ألوان ذهبية دافئة مناسبة لفترة الصباح الباكر والنشاط).
                        </p>
                      </div>
                    </div>

                    {/* Strategy 3: Sunset */}
                    <div 
                      onClick={() => setBgStrategy('sunset')}
                      className={`cursor-pointer group relative border rounded-xl overflow-hidden transition-all hover:border-amber-500/50 ${
                        bgStrategy === 'sunset' 
                          ? 'bg-slate-950/90 border-amber-500 ring-1 ring-amber-500' 
                          : 'bg-slate-950/30 border-slate-800'
                      }`}
                    >
                      <div className="h-20 bg-cover bg-center animate-fade-in" style={{ backgroundImage: `url("${makkahSunsetImg}")` }}></div>
                      <div className="p-3">
                        <h4 className="font-extrabold text-xs text-white mb-1 flex items-center gap-1">
                          <Sun className="w-3 h-3 text-amber-600" />
                          <span>غروب مكة المكرمة</span>
                        </h4>
                        <p className="text-[9px] text-slate-400 leading-normal font-sans">
                          فرض خلفية الغروب المهيب (أصيل مكة الكرمة الهادئ والمريح للأعصاب البصرية).
                        </p>
                      </div>
                    </div>

                    {/* Strategy 4: Night */}
                    <div 
                      onClick={() => setBgStrategy('night')}
                      className={`cursor-pointer group relative border rounded-xl overflow-hidden transition-all hover:border-amber-500/50 ${
                        bgStrategy === 'night' 
                          ? 'bg-slate-950/90 border-amber-500 ring-1 ring-amber-500' 
                          : 'bg-slate-950/30 border-slate-800'
                      }`}
                    >
                      <div className="h-20 bg-cover bg-center animate-fade-in" style={{ backgroundImage: `url("${makkahNightImg}")` }}></div>
                      <div className="p-3">
                        <h4 className="font-extrabold text-xs text-white mb-1 flex items-center gap-1">
                          <Moon className="w-3 h-3 text-indigo-400" />
                          <span>الليل والتهجد بمكة</span>
                        </h4>
                        <p className="text-[9px] text-slate-400 leading-normal font-sans">
                          فرض خلفية ليل الحرم المكي الشريف الاستثنائي المضاء بمصابيح المنارة الباهرة.
                        </p>
                      </div>
                    </div>
                  </div>

                   <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col lg:flex-row justify-between items-center gap-3 text-xs font-sans">
                    <p className="text-slate-350">
                      💡 <span className="font-bold text-white">معلومة الإدارة:</span> يثق زوار مكتب سما المملكة بمدى اهتمامكم الدؤوب وتجهيز الخدمات بأرقى معايير التقنية السعودية المحكمة. يمكن للزوار أيضاً التحكم بموضوع المظهر عبر التبويب العائم أو قفل التحكم به تماماً.
                    </p>
                    <div className="flex flex-wrap gap-2.5 items-center justify-end">
                      <span className="bg-amber-600 text-slate-950 text-[10px] font-black px-3 py-2 rounded-lg">الخلفية النشطة بالنظام الآن: {getBgNameAr(bgStrategy)}</span>
                      <button
                        type="button"
                        onClick={() => setShowBgSelector(!showBgSelector)}
                        className={`text-[10px] font-bold px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                          showBgSelector 
                            ? 'bg-emerald-600/10 hover:bg-emerald-650/20 text-emerald-400 border-emerald-500/20' 
                            : 'bg-amber-600/10 hover:bg-amber-650/20 text-amber-500 border-amber-500/25 animate-pulse'
                        }`}
                      >
                        {showBgSelector ? 'تعطيل الايقونة العائمة للزوار ✘' : 'تمكين الايقونة العائمة للزوار ✔'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* SOCIAL MEDIA MANAGEMENT CARD */}
                <div className="bg-gradient-to-l from-slate-900 to-slate-850 text-white rounded-2xl p-6 shadow-xl border border-slate-800 space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="font-extrabold text-amber-500 text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-amber-400" />
                        <span>إدارة والتحكم بروابط منصات التواصل الاجتماعي للمكتب</span>
                      </h3>
                      <p className="text-slate-400 text-xs mt-1 font-sans">
                        تعديل وتعيين روابط حسابات التواصل الاجتماعي الرسمية للمكتب لتظهر بشكل أنيق وتفاعلي في فوتر وأقسام المنصة لتمكين تواصل المستفيدين المباشر والموثوق.
                      </p>
                    </div>
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 font-bold px-3 py-1 rounded-full border border-amber-500/20 animate-pulse">
                      بوابة الربط والتواصل الاجتماعي
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 font-sans">
                    {/* Twitter/X */}
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-2">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Twitter className="w-4 h-4 text-slate-300" />
                        <span>منصة X / تويتر:</span>
                      </label>
                      <input
                        type="text"
                        value={socialTwitter}
                        onChange={(e) => setSocialTwitter(e.target.value)}
                        className="w-full p-2.5 bg-slate-900 text-slate-100 border border-slate-700 rounded-lg text-xs focus:outline-none focus:border-amber-500 transition-all font-sans"
                        placeholder="https://x.com/username"
                      />
                    </div>

                    {/* Facebook */}
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-2">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Facebook className="w-4 h-4 text-blue-500" />
                        <span>فيسبوك (Facebook):</span>
                      </label>
                      <input
                        type="text"
                        value={socialFacebook}
                        onChange={(e) => setSocialFacebook(e.target.value)}
                        className="w-full p-2.5 bg-slate-900 text-slate-100 border border-slate-700 rounded-lg text-xs focus:outline-none focus:border-amber-500 transition-all font-sans"
                        placeholder="https://facebook.com/page"
                      />
                    </div>

                    {/* Instagram */}
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-2">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Instagram className="w-4 h-4 text-pink-500" />
                        <span>إنستغرام (Instagram):</span>
                      </label>
                      <input
                        type="text"
                        value={socialInstagram}
                        onChange={(e) => setSocialInstagram(e.target.value)}
                        className="w-full p-2.5 bg-slate-900 text-slate-100 border border-slate-700 rounded-lg text-xs focus:outline-none focus:border-amber-500 transition-all font-sans"
                        placeholder="https://instagram.com/username"
                      />
                    </div>

                    {/* LinkedIn */}
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-2">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Linkedin className="w-4 h-4 text-sky-500" />
                        <span>لينكد إن (LinkedIn):</span>
                      </label>
                      <input
                        type="text"
                        value={socialLinkedin}
                        onChange={(e) => setSocialLinkedin(e.target.value)}
                        className="w-full p-2.5 bg-slate-900 text-slate-100 border border-slate-700 rounded-lg text-xs focus:outline-none focus:border-amber-500 transition-all font-sans"
                        placeholder="https://linkedin.com/company/name"
                      />
                    </div>

                    {/* YouTube */}
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-2">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Youtube className="w-4 h-4 text-red-500" />
                        <span>يوتيوب (YouTube):</span>
                      </label>
                      <input
                        type="text"
                        value={socialYoutube}
                        onChange={(e) => setSocialYoutube(e.target.value)}
                        className="w-full p-2.5 bg-slate-900 text-slate-100 border border-slate-700 rounded-lg text-xs focus:outline-none focus:border-amber-500 transition-all font-sans"
                        placeholder="https://youtube.com/@channel"
                      />
                    </div>

                    {/* Snapchat */}
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-2">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-yellow-400" />
                        <span>سناب شات (Snapchat):</span>
                      </label>
                      <input
                        type="text"
                        value={socialSnapchat}
                        onChange={(e) => setSocialSnapchat(e.target.value)}
                        className="w-full p-2.5 bg-slate-900 text-slate-100 border border-slate-700 rounded-lg text-xs focus:outline-none focus:border-amber-500 transition-all font-sans"
                        placeholder="https://snapchat.com/add/username"
                      />
                    </div>

                    {/* WhatsApp */}
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-2 lg:col-span-3">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <PhoneCall className="w-4 h-4 text-emerald-505 animate-pulse" />
                        <span>رابط أو رقم واتساب للتواصل السريع والطلبات الاستثنائية:</span>
                      </label>
                      <input
                        type="text"
                        value={socialWhatsapp}
                        onChange={(e) => setSocialWhatsapp(e.target.value)}
                        className="w-full p-2.5 bg-slate-900 text-slate-100 border border-slate-700 rounded-lg text-xs focus:outline-none focus:border-amber-500 transition-all font-sans"
                        placeholder="https://wa.me/96650XXXXXXXX"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2 font-sans">
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.setItem('sm_social_twitter', socialTwitter);
                        localStorage.setItem('sm_social_facebook', socialFacebook);
                        localStorage.setItem('sm_social_instagram', socialInstagram);
                        localStorage.setItem('sm_social_linkedin', socialLinkedin);
                        localStorage.setItem('sm_social_snapchat', socialSnapchat);
                        localStorage.setItem('sm_social_youtube', socialYoutube);
                        localStorage.setItem('sm_social_whatsapp', socialWhatsapp);
                        setSaveSuccessSocialMedia(true);
                        setTimeout(() => setSaveSuccessSocialMedia(false), 3000);
                      }}
                      className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-black px-6 py-2.5 rounded-lg text-xs shadow-md transition duration-150 flex items-center gap-2 active:scale-98 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>حفظ وتطبيق روابط التواصل الاجتماعي</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSocialTwitter('https://x.com/sama_kingdom');
                        setSocialFacebook('https://facebook.com/sama_kingdom');
                        setSocialInstagram('https://instagram.com/sama_kingdom');
                        setSocialLinkedin('https://linkedin.com/company/sama_kingdom');
                        setSocialSnapchat('https://snapchat.com/add/sama_kingdom');
                        setSocialYoutube('https://youtube.com/@sama_kingdom');
                        setSocialWhatsapp('https://wa.me/966500000000');
                        setSaveSuccessSocialMedia(true);
                        setTimeout(() => setSaveSuccessSocialMedia(false), 3000);
                      }}
                      className="bg-slate-800 hover:bg-slate-755 text-slate-305 font-bold px-4 py-2.5 rounded-lg text-xs border border-slate-700 transition duration-150"
                    >
                      استعادة الروابط الافتراضية
                    </button>

                    {saveSuccessSocialMedia && (
                      <span className="text-emerald-400 text-xs font-bold animate-pulse font-sans flex items-center gap-1.5 mr-auto">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>تم التحديث والمزامنة في كافة أجزاء المنصة بنجاح!</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Add Service Section with 2 columns: left Form, right Live Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Left (Span 2) - Form Block */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-205 shadow-md">
                  <h3 className="font-extrabold text-slate-900 text-lg border-b border-slate-200 pb-3 mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-amber-100 p-1.5 rounded-lg border border-amber-200">
                        <PlusCircle className="w-5 h-5 text-amber-700" />
                      </div>
                      <span className="font-black text-slate-950">إضافة وتهيئة خدمة إدارية جديدة للمكتب</span>
                    </div>
                    <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-sans">بوابة مسؤولي النظام</span>
                  </h3>

                  {/* Form Controls - Left (Span 2) */}
                  <form onSubmit={handleAddServiceSubmit} className="space-y-6 text-xs font-sans">
                      
                      {/* Section 1: Basic Identity & Classification */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 space-y-4 shadow-2xs">
                        <div className="flex items-center gap-2 text-slate-900 font-extrabold pb-2 border-b border-slate-200">
                          <div className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-mono text-xs">١</div>
                          <span className="text-sm font-black">المعلومات الأساسية والهوية التصنيفية</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-slate-800 font-bold mb-1.5">* اسم الخدمة بالكامل (أو نوع المعاملة):</label>
                            <div className="relative">
                              <input
                                type="text"
                                required
                                value={newSrvName}
                                onChange={(e) => setNewSrvName(e.target.value)}
                                placeholder="مثلاً: تأشيرة علاجية أو سياحية خاصة"
                                className="w-full pr-10 pl-3 py-2.5 border border-slate-300 rounded focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-sm bg-white text-slate-900 transition-colors"
                              />
                              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                                <FileText className="h-4.5 w-4.5 text-slate-400" />
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-slate-800 font-bold mb-1.5">* فئة الخدمة الرئيسية التابعة:</label>
                            <div className="relative">
                              <select
                                value={newSrvCategory}
                                onChange={(e) => {
                                  setNewSrvCategory(e.target.value);
                                  setNewSrvSubCategory('');
                                }}
                                className="w-full pr-10 pl-3 py-2.5 border border-slate-300 rounded bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-sm text-slate-900 transition-colors"
                              >
                                {categories.map(cat => (
                                  <option key={cat.id} value={cat.id}>{cat.nameAr}</option>
                                ))}
                              </select>
                              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                                <ListFilter className="h-4.5 w-4.5 text-slate-400" />
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-slate-800 font-bold mb-1.5">الفئة الفرعية المخصصة (اختياري):</label>
                            <div className="relative">
                              <select
                                value={newSrvSubCategory}
                                onChange={(e) => setNewSrvSubCategory(e.target.value)}
                                className="w-full pr-10 pl-3 py-2.5 border border-slate-300 rounded bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-sm text-slate-900 transition-colors"
                              >
                                <option value="">-- عام / بدون فئة فرعية --</option>
                                {subCategories.filter(sc => sc.parentId === newSrvCategory).map(sc => (
                                  <option key={sc.id} value={sc.id}>{sc.nameAr}</option>
                                ))}
                              </select>
                              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                                <ListFilter className="h-4.5 w-4.5 text-slate-400" />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          <div>
                            <label className="block text-slate-800 font-bold mb-1.5">* الرمز والأيقونة التعبيرية الممثلة للخدمة:</label>
                            
                            {/* Filter Input for Dynamic Selection */}
                            <div className="mb-2.5 relative">
                              <input
                                type="text"
                                placeholder="🔍 ابحـث باسم أو وظيفة الأيقونـة... (مثال: طيران، سيارة، ملف، مالية، سفر)"
                                value={iconSearchNew}
                                onChange={(e) => setIconSearchNew(e.target.value)}
                                className="w-full pr-10 pl-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-xs bg-white text-slate-900 transition-colors font-sans"
                              />
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-slate-400 text-xs">🔎</span>
                              </div>
                              {iconSearchNew && (
                                <button
                                  type="button"
                                  onClick={() => setIconSearchNew('')}
                                  className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-650 font-bold text-xs"
                                >
                                  ✕
                                </button>
                              )}
                            </div>

                            <div className="relative">
                              <select
                                value={newSrvIcon}
                                onChange={(e) => setNewSrvIcon(e.target.value)}
                                className="w-full pr-10 pl-3 py-2.5 border border-slate-300 rounded bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-sm text-slate-900 transition-colors font-sans"
                              >
                                {(() => {
                                  const filtered = AVAILABLE_ICONS.filter(icon => 
                                    icon.value.toLowerCase().includes(iconSearchNew.toLowerCase()) || 
                                    icon.label.toLowerCase().includes(iconSearchNew.toLowerCase())
                                  );
                                  if (filtered.length === 0) {
                                    return (
                                      <option value="FileText" disabled>⚠️ لا توجد أيقونة مطابقة لبحثك</option>
                                    );
                                  }
                                  return filtered.map(icon => (
                                    <option key={icon.value} value={icon.value}>{icon.label}</option>
                                  ));
                                })()}
                              </select>
                              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                                <span className="text-slate-500 font-bold">★</span>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-550 mt-1">تُعرض الأيقونة المختارة في بطاقات الخدمات على الواجهة العامة للتوضيح البصري للعملاء والمستفيدين.</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 space-y-4 shadow-2xs">
                        <div className="flex items-center gap-2 text-slate-900 font-extrabold pb-2 border-b border-slate-200">
                          <div className="w-6 h-6 rounded-md bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 font-mono text-xs font-black">٢</div>
                          <span className="text-sm font-black">الضوابط المالية وجداول التسعير الفني</span>
                        </div>

                        {/* Live Feed Rates Ticker Banner */}
                        <div className="bg-slate-100 border border-slate-300/60 rounded-xl p-3.5 space-y-2.5 font-sans">
                          <div className="flex items-center justify-between text-slate-700 text-xs flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="relative flex h-2 w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isFetchingRates ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${isFetchingRates ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                              </span>
                              <span className="font-extrabold">تغذية أسعار أسواق المال المباشرة (التحصين المصرفي):</span>
                            </div>
                            <span className="text-[10px] text-slate-400">تحديث تلقائي: {lastRatesUpdate}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-white/60 p-2 rounded-lg border border-slate-200 text-[11px] font-mono justify-center text-slate-800">
                            <span>🇸🇦 1.00 SAR</span>
                            <span className="text-slate-300">|</span>
                            <span>🇺🇸 1 USD = {(1 / exchangeRates.USD).toFixed(3)} SAR</span>
                            <span className="text-slate-300">|</span>
                            <span>🇪🇺 1 EUR = {(1 / exchangeRates.EUR).toFixed(3)} SAR</span>
                          </div>
                        </div>

                        {/* Currency Selector */}
                        <div className="bg-amber-50/20 border border-amber-200/50 rounded-xl p-3.5 space-y-2">
                          <label className="block text-slate-800 font-extrabold text-xs text-right">عملة التسعير المرجعية للباقة:</label>
                          <div className="flex flex-wrap gap-2">
                            {(['SAR', 'USD', 'EUR'] as const).map((curr) => {
                              const labelMap = { SAR: '🇸🇦 ريال سعودي (SAR)', USD: '🇺🇸 دولار أمريكي (USD)', EUR: '🇪🇺 يورو أوروبي (EUR)' };
                              const isSelected = newSrvBaseCurrency === curr;
                              return (
                                <button
                                  key={curr}
                                  type="button"
                                  onClick={() => {
                                    setNewSrvBaseCurrency(curr);
                                    // if changing to SAR, reset base fees to current standard fees to avoid confusion
                                    if (curr === 'SAR') {
                                      setNewSrvBaseOfficeFee(newSrvOfficeFee);
                                      setNewSrvBaseGovFee(newSrvGovFee);
                                    }
                                  }}
                                  className={`flex-1 min-w-[120px] py-2 px-3 text-xs font-extrabold rounded-lg border transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-xs'
                                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  {labelMap[curr]}
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            المكتب يعتمد تسعير الخدمات بعملات عالمية على أن تتم تصفيتها محاسبياً بالريال السعودي تلقائياً حسب جدول الصرف الموضح أعلاه.
                          </p>
                        </div>

                        {/* Fee Inputs with Multi-Currency Context */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-3xs space-y-1.5 text-right">
                            <label className="block text-slate-800 font-bold text-xs flex items-center gap-1 justify-start">
                              <Coins className="w-3.5 h-3.5 text-indigo-600" />
                              <span>* أتعاب وتكاليف تعقيب المكتب ({newSrvBaseCurrency === 'SAR' ? 'ر.س' : newSrvBaseCurrency}):</span>
                            </label>
                            <input
                              type="number"
                              required
                              value={newSrvBaseCurrency === 'SAR' ? newSrvOfficeFee : newSrvBaseOfficeFee}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                if (newSrvBaseCurrency === 'SAR') {
                                  setNewSrvOfficeFee(val);
                                  setNewSrvBaseOfficeFee(val);
                                } else {
                                  setNewSrvBaseOfficeFee(val);
                                }
                              }}
                              placeholder="0.00"
                              className="w-full p-2.5 border border-slate-300 rounded focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-sm font-mono text-slate-900"
                            />
                            
                            {newSrvBaseCurrency !== 'SAR' && (
                              <div className="flex justify-between items-center text-[10px] text-amber-900 bg-amber-500/10 p-1.5 rounded font-sans leading-none border border-amber-500/15">
                                <span>الريال السعودي بمعدل الصرف:</span>
                                <strong className="font-mono text-amber-950">{newSrvOfficeFee.toFixed(2)} ر.س</strong>
                              </div>
                            )}

                            <div className="flex justify-between items-center text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded font-sans leading-none">
                              <span>ضريبة مضافة مقيدة (15%):</span>
                              <strong className="font-mono text-emerald-800">{(newSrvOfficeFee * 0.15).toFixed(2)} ر.س</strong>
                            </div>
                          </div>

                          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-3xs space-y-1.5 text-right">
                            <label className="block text-slate-800 font-bold text-xs flex items-center gap-1 justify-start">
                              <Receipt className="w-3.5 h-3.5 text-blue-600" />
                              <span>* الرسوم الحكومية المستحقة للدولة ({newSrvBaseCurrency === 'SAR' ? 'ر.س' : newSrvBaseCurrency}):</span>
                            </label>
                            <input
                              type="number"
                              required
                              value={newSrvBaseCurrency === 'SAR' ? newSrvGovFee : newSrvBaseGovFee}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                if (newSrvBaseCurrency === 'SAR') {
                                  setNewSrvGovFee(val);
                                  setNewSrvBaseGovFee(val);
                                } else {
                                  setNewSrvBaseGovFee(val);
                                }
                              }}
                              placeholder="0.00"
                              className="w-full p-2.5 border border-slate-300 rounded focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-sm font-mono text-slate-900"
                            />

                            {newSrvBaseCurrency !== 'SAR' && (
                              <div className="flex justify-between items-center text-[10px] text-amber-900 bg-amber-500/10 p-1.5 rounded font-sans leading-none border border-amber-500/15">
                                <span>الريال السعودي بمعدل الصرف:</span>
                                <strong className="font-mono text-amber-950">{newSrvGovFee.toFixed(2)} ر.س</strong>
                              </div>
                            )}

                            <div className="flex justify-between items-center text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded font-sans leading-none">
                              <span>الحالة الضريبية في سما:</span>
                              <strong className="text-blue-850 font-black">معفى من الضريبة</strong>
                            </div>
                          </div>
                        </div>

                        {/* Direct automatic fee assessment display */}
                        <div className="bg-emerald-50/65 border border-emerald-150/80 rounded-lg p-3.5 text-xs flex justify-between items-center">
                          <div className="space-y-1">
                            <h5 className="font-extrabold text-emerald-950">إقرار كلي لحاصل تكلفة الخدمة المقترحة:</h5>
                            <p className="text-[10px] text-emerald-800 leading-snug">يتكفل المستفيد بدفع هذا الإجمالي تلقائياً في دورة المعاملة شاملة أتعاب سما الإدارية والضريبة الرسمية.</p>
                          </div>
                          <div className="text-left">
                            <span className="text-[10px] text-emerald-600 font-sans block">إجمالي التكلفة الشاملة:</span>
                            <strong className="text-base text-emerald-950 font-black font-mono">{(newSrvGovFee + newSrvOfficeFee * 1.15 + newSrvAdditionalFees.reduce((sum, f) => sum + f.amount, 0)).toFixed(2)} ر.س</strong>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Operational Steps & Clear Descriptions */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 space-y-4 shadow-2xs">
                        <div className="flex items-center gap-2 text-slate-900 font-extrabold pb-2 border-b border-slate-200">
                          <div className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-754 font-mono text-xs font-black">٣</div>
                          <span className="text-sm font-black">الشرح التفصيلي ودليل تفويض الإنجاز</span>
                        </div>

                        <div>
                          <label className="block text-slate-800 font-bold mb-1.5">* وصف المعاملة ومتطلبات الأوراق واللوائح التوثيقية:</label>
                          <textarea
                            required
                            value={newSrvDesc}
                            onChange={(e) => setNewSrvDesc(e.target.value)}
                            placeholder="اكتب هنا ما يغطي بالتفصيل كيفية وأبعاد تقديم الإجراء، مثلاً الأوراق والوثائق المطلوبة، الشروط السنية أو المالية، والمهلة الزمنية المتوقعة للإصدار..."
                            className="w-full p-3 border border-slate-300 rounded focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-sm h-28 bg-white text-slate-900 leading-relaxed transition-all placeholder:text-slate-400"
                          ></textarea>

                          <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 font-sans">
                            <span>* يرجى إيضاح المتطلبات بدقة لتجنيب العميل الرفض من المسار الحكومي.</span>
                            <span className="font-mono font-bold">المدخلات: {newSrvDesc.length} حرف</span>
                          </div>
                        </div>
                      </div>

                      {/* Section 4: Additional Custom Fees (e.g. Expedited processing, Translation, etc) */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 space-y-4 shadow-2xs">
                        <div className="flex items-center gap-2 text-slate-900 font-extrabold pb-2 border-b border-slate-200">
                          <div className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-754 font-mono text-xs font-black">٤</div>
                          <span className="text-sm font-black">الرسوم والمدفوعات الإضافية المخصصة (اختياري)</span>
                        </div>

                        <p className="text-slate-500 text-[11px] leading-relaxed">
                          يمكنك تعريف بنود مالية ورسوم إضافية تابعة لهذه الخدمة وتضاف لقائمتها مثل (رسوم المعالجة السريعة، أتعاب الترجمة والتوثيق، رسوم شحنات عاجلة).
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-3 border-b border-slate-150">
                          <div>
                            <label className="block text-slate-700 font-bold mb-1">اسم البند أو الرسم الإضافي:</label>
                            <input
                              type="text"
                              value={tempFeeNameNew}
                              onChange={(e) => setTempFeeNameNew(e.target.value)}
                              placeholder="مثلاً: رسوم معالجة مستعجلة، رسوم ترجمة"
                              className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900 text-xs focus:outline-none focus:border-slate-800 font-sans font-medium"
                            />
                          </div>
                          <div className="flex items-end gap-2">
                            <div className="flex-1">
                              <label className="block text-slate-700 font-bold mb-1">مقدار الرسم (ر.س):</label>
                              <input
                                type="number"
                                value={tempFeeAmountNew}
                                onChange={(e) => setTempFeeAmountNew(e.target.value !== '' ? Number(e.target.value) : '')}
                                placeholder="0.00"
                                className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900 text-xs focus:outline-none focus:border-slate-800 font-mono font-medium"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (!tempFeeNameNew.trim()) {
                                  alert('يرجى كتابة اسم البند الإضافي أولاً.');
                                  return;
                                }
                                if (tempFeeAmountNew === '' || Number(tempFeeAmountNew) <= 0) {
                                  alert('يرجى تحديد سعر مناسب للبند الإضافي.');
                                  return;
                                }
                                const newFee = {
                                  id: `fee-${Date.now()}`,
                                  name: tempFeeNameNew.trim(),
                                  amount: Number(tempFeeAmountNew)
                                };
                                setNewSrvAdditionalFees([...newSrvAdditionalFees, newFee]);
                                setTempFeeNameNew('');
                                setTempFeeAmountNew('');
                              }}
                              className="bg-indigo-600 hover:bg-indigo-550 text-white font-bold py-2 px-3 rounded text-xs transition h-9 cursor-pointer flex items-center justify-center gap-1 font-sans shadow-3xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>إضافة</span>
                            </button>
                          </div>
                        </div>

                        {newSrvAdditionalFees.length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            <h5 className="font-bold text-slate-800 text-[11px]">البنود المضافة حالياً للمعاملة:</h5>
                            <div className="grid grid-cols-1 gap-2">
                              {newSrvAdditionalFees.map((fee) => (
                                <div key={fee.id} className="bg-white border border-slate-205 p-2 rounded-lg flex items-center justify-between text-xs font-sans shadow-3xs">
                                  <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                    <span className="font-bold text-slate-800">{fee.name}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="font-mono text-indigo-700 font-extrabold">{fee.amount.toFixed(2)} ر.س</span>
                                    <button
                                      type="button"
                                      onClick={() => setNewSrvAdditionalFees(newSrvAdditionalFees.filter(f => f.id !== fee.id))}
                                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                                      title="حذف البند"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 bg-slate-100/50 rounded-lg border border-dashed border-slate-200 text-slate-400 text-[11px]">
                            لم يتم إضافة أي أتعاب أو رسوم مخصصة بعد لهذه الخدمة (اختياري).
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end pt-3 border-t border-slate-200 gap-3 font-sans">
                        <button
                          type="submit"
                          className="bg-slate-950 border border-slate-900 hover:bg-slate-850 text-white font-black px-10 py-3 rounded-lg text-sm shadow-md transition duration-150 flex items-center gap-2 active:scale-98"
                        >
                          <PlusCircle className="w-5 h-5" />
                          <span>تفعيل وجدولة الخدمة بالمنصة فوراً</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Interactive Live Card Preview - Right (Span 1) */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4 font-sans">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-extrabold text-slate-800 text-xs">معاينة تفاعلية حية (البطاقة الذكية للخدمة)</span>
                        <span className="text-[9px] bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded font-bold animate-pulse">مباشر</span>
                      </div>
                      
                      {/* Simulated public service card layout */}
                      <div className="bg-white rounded-xl shadow border border-slate-200 p-5 flex flex-col justify-between relative group hover:shadow-md transition-all antialiased text-right">
                        <div>
                          {/* Card Top */}
                          <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                              <RenderServiceIcon iconName={newSrvIcon} className="w-6 h-6 text-amber-700" />
                            </div>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-wider font-sans">
                              {getCategoryName(newSrvCategory)}
                            </span>
                          </div>

                          {/* Title and details */}
                          <h3 className="text-base font-black text-slate-900 mb-2 line-clamp-1">
                            {newSrvName.trim() || 'اسم الخدمة التجريبي'}
                          </h3>
                          <p className="text-slate-600 text-[11px] leading-relaxed mb-4 line-clamp-3 min-h-[48px]">
                            {newSrvDesc.trim() || 'الشرح والتوضيح ومسار المعاملة الحكومية وسيظهر هنا بالكامل للعملاء والمستفيدين فور رغبة الحجز...'}
                          </p>
                        </div>

                        <div className="border-t border-slate-105 pt-4 mt-2 space-y-2 text-xs">
                          <div className="flex justify-between font-sans">
                            <span className="text-slate-500">رسوم جهات الدولة:</span>
                            <span className="font-bold text-slate-950 font-mono">{newSrvGovFee.toFixed(2)} ر.س</span>
                          </div>
                          <div className="flex justify-between font-sans">
                            <span className="text-slate-500">أتعاب المكتب المعيارية:</span>
                            <span className="font-bold text-slate-950 font-mono">{(newSrvOfficeFee * 1.15).toFixed(2)} ر.س</span>
                          </div>
                          <div className="flex justify-between text-slate-400 text-[10px] pr-2 border-r-2 border-slate-200 font-sans font-medium">
                            <span>شامل ضريبة مضافة:</span>
                            <span className="font-mono font-bold text-slate-700">{(newSrvOfficeFee * 0.15).toFixed(2)} ر.s</span>
                          </div>
                          
                          {newSrvAdditionalFees.length > 0 && (
                            <div className="pt-1.5 border-t border-slate-100 space-y-1">
                              <span className="text-[10px] text-indigo-700 font-bold block mb-1">الرسوم الإضافية المعرّفة:</span>
                              {newSrvAdditionalFees.map(f => (
                                <div key={f.id} className="flex justify-between text-[11px] font-sans text-slate-600 pr-2 border-r border-indigo-200">
                                  <span>{f.name}:</span>
                                  <span className="font-mono font-bold text-slate-800">{f.amount.toFixed(2)} ر.س</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex justify-between border-t border-dashed border-slate-150 pt-2 font-black text-amber-800 text-sm font-sans">
                            <span>التكلفة الإجمالية:</span>
                            <span className="font-mono font-bold text-amber-950">{(newSrvGovFee + newSrvOfficeFee * 1.15 + newSrvAdditionalFees.reduce((sum, f) => sum + f.amount, 0)).toFixed(2)} ر.س</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#f1f5f9] border border-slate-200 p-3 rounded-lg text-[10px] text-slate-600 space-y-1 font-sans">
                      <strong className="text-slate-900 block font-bold mb-1">💡 إرشادات الإعداد الفني للخدمات الجديد:</strong>
                      <p>١. الأمانات المعفاة هي مدفوعات الدولة المباشرة عبر منابر (أبشر، قوى، بلدي).</p>
                      <p>٢. يلتزم تطبيق الفاتورة بالضريبة السائدة ١٥٪ على أتعاب تعقيب المكتب فحسب.</p>
                    </div>
                  </div>
                </div>

                {/* --- CATEGORY MANAGEMENT SECTION --- */}
                <div className="bg-white p-6 rounded-2xl border border-slate-205 shadow-sm space-y-6 text-right font-sans">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-indigo-50 p-2 rounded-xl border border-indigo-150 text-indigo-700">
                        <FolderPlus className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-950 text-sm">إدارة وتخصيص الفئات الإدارية للمكتب</h4>
                        <p className="text-slate-500 text-[11px] mt-0.5 font-sans">يمكنك إضافة فئات تصنيفية جديدة مخصصة للمكتب بخلاف فئات النظام الافتراضية مع تحديد ألوان مميزة.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-sans">
                    
                    {/* Add Category Form (Col 1) */}
                    <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4 text-right">
                      <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b border-slate-150 pb-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-550 animate-pulse"></span>
                        <span className="font-bold">إضافة فئة تصنيف جديدة</span>
                      </h5>

                      <div className="space-y-3.5">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1 font-sans">معرف الفئة البرمجي (بالإنجليزي - فريد):</label>
                          <input
                            type="text"
                            required
                            placeholder="مثلاً: health, insurance, commercial"
                            value={newCatId}
                            onChange={(e) => setNewCatId(e.target.value.toLowerCase().trim().replace(/[^a-z0-9_-]/g, ''))}
                            className="w-full p-2.5 border border-slate-300 rounded bg-white text-slate-900 text-xs focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1 font-sans">اسم الفئة باللغة العربية لعرضه للعملاء:</label>
                          <input
                            type="text"
                            required
                            placeholder="مثلاً: معاملات الرعاية والخدمات الطبية"
                            value={newCatNameAr}
                            onChange={(e) => setNewCatNameAr(e.target.value)}
                            className="w-full p-2.5 border border-slate-300 rounded bg-white text-slate-900 text-xs focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-705 font-bold mb-1 font-sans">اللون البصري المخصص للفئة:</label>
                          <select
                            value={newCatColor}
                            onChange={(e) => setNewCatColor(e.target.value)}
                            className="w-full p-2.5 border border-slate-300 rounded bg-white text-slate-900 text-xs focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                          >
                            <option value="indigo">💜 بنفسجي داكن (Indigo)</option>
                            <option value="purple">🔮 أرجواني ساطع (Purple)</option>
                            <option value="blue">💙 أزرق بحري (Blue)</option>
                            <option value="emerald">💚 أخضر زمردي (Emerald)</option>
                            <option value="amber">💛 ذهبي خريفي (Amber)</option>
                            <option value="orange">🧡 برتقالي مشرق (Orange)</option>
                            <option value="rose">🌸 وردي مخملي (Rose)</option>
                            <option value="cyan">💎 تركوازي سماوي (Cyan)</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (!newCatId || !newCatNameAr) {
                              alert('من فضلك أكمل كافة خانات الفئة بالشرح الصحيح أولاً.');
                              return;
                            }
                            if (categories.some(c => c.id === newCatId)) {
                              alert('هذا المعرف متواجد بالفعل، يرجى تدوين رمز تعريفي فريد.');
                              return;
                            }
                            const updated = [...categories, { id: newCatId, nameAr: newCatNameAr, color: newCatColor }];
                            setCategories(updated);
                            setNewCatId('');
                            setNewCatNameAr('');
                            setNewCatColor('indigo');
                            alert('تم تسجيل وتفعيل الفئة التصنيفية الجديدة بالمكتب بنجاح!');
                          }}
                          className="w-full bg-slate-950 hover:bg-slate-850 text-white font-black py-2.5 px-4 rounded-lg transition text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>تنشيط وتفعيل الفئة الجديدة</span>
                        </button>
                      </div>
                    </div>

                    {/* Display Current Registered Categories list (Col 2 & 3 - Span 2) */}
                    <div className="md:col-span-2 border border-slate-200 p-5 rounded-xl space-y-4 bg-slate-50/40 text-right">
                      <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b border-slate-150 pb-2">
                        <span>إحصائيات وقائمة الفئات المهيأة بالمكتب ({categories.length})</span>
                      </h5>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[295px] overflow-y-auto pr-1">
                        {categories.map(cat => {
                          const catStyles = getCategoryStyles(cat.id);
                          const isDefault = ['visa', 'gov', 'transport', 'other'].includes(cat.id);
                          const associatedCount = services.filter(s => s.category === cat.id).length;

                          return (
                            <div 
                              key={cat.id} 
                              className="bg-white border border-slate-205 p-3.5 rounded-xl flex items-center justify-between shadow-3xs group hover:border-slate-300 transition-all text-right"
                            >
                              <div className="flex items-center gap-3">
                                <span className={`w-3 h-3 rounded-full ${catStyles.bg} border-2 border-white shadow-3xs flex-shrink-0`}></span>
                                <div>
                                  <strong className="text-slate-850 text-xs block leading-tight font-extrabold">{cat.nameAr}</strong>
                                  <span className="text-[9px] text-slate-400 font-mono block mt-0.5">الرمز: {cat.id} • مرتبط بـ ({associatedCount}) خدمات</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${catStyles.badge} font-mono uppercase leading-none`}>
                                  {cat.color}
                                </span>
                                {!isDefault && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (associatedCount > 0) {
                                        alert('لا يمكن حذف هذه الفئة لأنها مستخدمة حالياً ببعض الخدمات النشطة بالمكتب. يرجى تعديل تلك الخدمات أولاً.');
                                        return;
                                      }
                                      if (confirm(`هل أنت متأكد من حذف الفئة المخصصة "${cat.nameAr}" كلياً من لوحة تحكم المكتب؟`)) {
                                        setCategories(categories.filter(c => c.id !== cat.id));
                                      }
                                    }}
                                    className="p-1 border border-transparent text-red-500 hover:bg-red-50 hover:border-red-100 rounded-lg transition-colors cursor-pointer"
                                    title="إزالة هذه الفئة"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl text-[10px] text-amber-850 leading-relaxed font-sans">
                        💡 <strong className="font-extrabold text-amber-900">إرشادات السلامة التصنيفية:</strong> للتأكد من المحافظة على دقة وسلامة ملفات حجز فواتير العملاء السابقة، فإن الفئات الأربعة الافتراضية بنظام سما المملكة (تعقيب، تأشيرات، شحن بري، عامة مخصصة) هي فئات مصونة وثابتة من الحذف نهائياً. الفئات الجديدة التي تنشئها يدوياً تكون قابلة للإزالة التامة بمجرد سحب الخدمات التابعة لها وإخلائها مسبقاً من لوحة التحكم.
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- SUB-CATEGORY MANAGEMENT SECTION --- */}
                <div className="bg-white p-6 rounded-2xl border border-slate-205 shadow-sm space-y-6 text-right font-sans">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-amber-50 p-2 rounded-xl border border-amber-150 text-amber-700">
                        <FolderPlus className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-950 text-sm">إدارة وتخصيص الفئات الفرعية (Sub-Categories)</h4>
                        <p className="text-slate-500 text-[11px] mt-0.5 font-sans">إنشاء وتعديل فئات فرعية مخصصة تندرج تحت الفئات الإدارية الرئيسية لتجميع وتنظيم باقات الخدمات والتعقيب بشكل أدق.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-sans">
                    
                    {/* Add Sub-Category Form (Col 1) */}
                    <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4 text-right">
                      <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b border-slate-150 pb-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        <span className="font-bold">إضافة فئة فرعية جديدة</span>
                      </h5>

                      <div className="space-y-3.5">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1 font-sans">الفئة الرئيسية التابعة لها أولاً:</label>
                          <select
                            value={newSubCatParentId}
                            onChange={(e) => setNewSubCatParentId(e.target.value)}
                            className="w-full p-2.5 border border-slate-300 rounded bg-white text-slate-900 text-xs focus:outline-none focus:border-slate-850"
                          >
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.nameAr}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-705 font-bold mb-1 font-sans">معرّف الفئة الفرعية الفريد (بالإنجليزي):</label>
                          <input
                            type="text"
                            required
                            placeholder="مثلاً: private-driver, commercial-visas"
                            value={newSubCatId}
                            onChange={(e) => setNewSubCatId(e.target.value.toLowerCase().trim().replace(/[^a-z0-9_-]/g, ''))}
                            className="w-full p-2.5 border border-slate-300 rounded bg-white text-slate-900 text-xs focus:outline-none focus:border-slate-850"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1 font-sans">اسم الفئة الفرعية (بالعربية للعملاء):</label>
                          <input
                            type="text"
                            required
                            placeholder="مثلاً: تفويض سائقين واستقدام منزلي"
                            value={newSubCatNameAr}
                            onChange={(e) => setNewSubCatNameAr(e.target.value)}
                            className="w-full p-2.5 border border-slate-300 rounded bg-white text-slate-900 text-xs focus:outline-none focus:border-slate-850"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (!newSubCatId || !newSubCatNameAr || !newSubCatParentId) {
                              alert('من فضلك أكمل كافة خانات الفئة الفرعية أولاً.');
                              return;
                            }
                            if (subCategories.some(sc => sc.id === newSubCatId)) {
                              alert('معرف الفئة الفرعية متواجد بالفعل، يرجى تدوين رمز تعريفي متميز.');
                              return;
                            }
                            const updated = [...subCategories, { id: newSubCatId, parentId: newSubCatParentId, nameAr: newSubCatNameAr }];
                            setSubCategories(updated);
                            setNewSubCatId('');
                            setNewSubCatNameAr('');
                            alert('تم تسجيل وتفعيل الفئة الفرعية الجديدة بنجاح تحت الفئة المحددة!');
                          }}
                          className="w-full bg-slate-950 hover:bg-slate-850 text-white font-black py-2.5 px-4 rounded-lg transition text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>تنشيط وتفعيل الفئة الفرعية</span>
                        </button>
                      </div>
                    </div>

                    {/* Display Current Registered Sub-categories list grouped by category */}
                    <div className="md:col-span-2 border border-slate-200 p-5 rounded-xl space-y-4 bg-slate-50/40 text-right">
                      <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b border-slate-150 pb-2">
                        <span>إحصائيات وقائمة الفئات الفرعية النشطة ({subCategories.length})</span>
                      </h5>

                      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                        {categories.map(cat => {
                          const associatedSubs = subCategories.filter(sc => sc.parentId === cat.id);
                          const catStyles = getCategoryStyles(cat.id);
                          return (
                            <div key={cat.id} className="bg-white border border-slate-155 rounded-xl p-3.5 space-y-2.5">
                              <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 font-sans">
                                <span className={`w-2.5 h-2.5 rounded-full ${catStyles.bg}`}></span>
                                <span className="font-extrabold text-slate-950 text-xs">{cat.nameAr}</span>
                                <span className="text-[9px] text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded-md">رمز الفئة: {cat.id}</span>
                              </div>

                              {associatedSubs.length === 0 ? (
                                <p className="text-[10px] text-slate-400 italic">لا توجد فئات فرعية مضافة تحت هذه الفئة حتى الآن.</p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {associatedSubs.map(sc => {
                                    const associatedServicesCount = services.filter(s => s.subCategory === sc.id).length;
                                    const isDefaultSub = ['visa-work', 'visa-hajj', 'visa-visit', 'gov-labor', 'gov-jawazat', 'gov-municipality', 'transport-land', 'transport-air'].includes(sc.id);
                                    return (
                                      <div key={sc.id} className="bg-slate-50/70 border border-slate-200 p-2.5 rounded-lg flex items-center justify-between text-right">
                                        <div className="space-y-0.5">
                                          <strong className="text-slate-805 text-[11px] block font-bold leading-tight">{sc.nameAr}</strong>
                                          <span className="text-[9px] text-slate-400 block font-mono">الرمز: {sc.id} • مرتبطة بـ ({associatedServicesCount}) خدمات</span>
                                        </div>
                                        
                                        {!isDefaultSub && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (associatedServicesCount > 0) {
                                                alert('لا يمكن حذف هذه الفئة الفرعية لأن هناك خدمات نشطة مرتبطة بها حالياً. يرجى تعديل تلك الخدمات أو نقلها أولاً.');
                                                return;
                                              }
                                              if (confirm(`هل أنت متأكد من حذف الفئة الفرعية المخصصة "${sc.nameAr}"؟`)) {
                                                setSubCategories(subCategories.filter(item => item.id !== sc.id));
                                              }
                                            }}
                                            className="p-1 text-red-500 hover:bg-red-50 hover:text-red-750 rounded transition-colors cursor-pointer"
                                            title="إزالة هذه الفئة الفرعية"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl text-[10px] text-amber-850 leading-relaxed font-sans">
                        💡 <strong className="font-extrabold text-amber-900">إرشادات الفئات الفرعية:</strong> عند إنشاء فئات فرعية مخصصة، ستظهر فوراً في نماذج إضافة وتعديل أسعار ومعاملات السفر والتعقيب بالمكتب لتنظيم الخدمات المخصصة للجمهور.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Directory listing and search tools */}
                <div className="space-y-5 bg-slate-50/70 border border-slate-200 rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                        <ListFilter className="w-5 h-5 text-amber-600" />
                        <span>دليل الخدمات وباقات العمليات النشطة بالمكتب</span>
                      </h3>
                      <p className="text-slate-500 text-[11px] mt-1 font-sans">
                        ابحث وقارن ورتب جميع المعاملات المهيأة على منصة مكتب سما المملكة بمرونة تامة ونمط عصري.
                      </p>
                    </div>

                    {/* Summary indicator */}
                    <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-3xs font-sans self-start md:self-auto">
                      إجمالي الخدمات: <strong className="text-slate-900">{services.length} خدمات</strong>
                    </span>
                  </div>

                  {/* Highly polished control bar with filters, search and sorting */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-end font-sans">
                    
                    {/* Search box - 5 cols */}
                    <div className="lg:col-span-5 space-y-1.5">
                      <label className="block text-slate-700 font-extrabold text-[11px]">
                        {lang === 'en' ? 'Search by service name or details:' : 'ابحث باسم الخدمة أو الشرح التفصيلي:'}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={servicesSearchQuery}
                          onChange={(e) => setServicesSearchQuery(e.target.value)}
                          placeholder={lang === 'en' ? 'Type the service you are looking for...' : 'اكتب المعاملة التي تبحث عنها هنا...'}
                          className="w-full pr-10 pl-3.5 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs bg-white text-slate-900 placeholder:text-slate-400 font-sans shadow-3xs transition-all"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        {servicesSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setServicesSearchQuery('')}
                            className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-700 font-bold"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Category Filter - 4 cols */}
                    <div className="lg:col-span-4 space-y-1.5">
                      <label className="block text-slate-700 font-extrabold text-[11px]">
                        {lang === 'en' ? 'Filter by service category:' : 'تصفية بحسب فئة المعاملات:'}
                      </label>
                      <div className="relative">
                        <select
                          value={servicesFilterCategory}
                          onChange={(e) => setServicesFilterCategory(e.target.value)}
                          className="w-full pr-10 pl-3 py-2 border border-slate-300 rounded-xl bg-white text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-3xs appearance-none transition-all"
                        >
                          <option value="all">
                            {lang === 'en' ? '📁 All Categories & Specialties' : '📁 جميع الفئات والتخصصات بالمكتب'}
                          </option>
                          {categories.map(cat => {
                            let icon = '📁';
                            if (cat.id === 'visa') icon = '🛂';
                            else if (cat.id === 'gov') icon = '🏛️';
                            else if (cat.id === 'transport') icon = '🚚';
                            else if (cat.id === 'other') icon = '⚙️';
                            return (
                              <option key={cat.id} value={cat.id}>
                                {icon} {lang === 'en' ? (cat.nameEn || cat.nameAr) : cat.nameAr}
                              </option>
                            );
                          })}
                        </select>
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                          ▼
                        </div>
                      </div>
                    </div>

                    {/* Sorting Selection - 3 cols */}
                    <div className="lg:col-span-3 space-y-1.5">
                      <label className="block text-slate-700 font-extrabold text-[11px]">
                        {lang === 'en' ? 'Sort services guide by:' : 'ترتيب عرض قائمة التحكم:'}
                      </label>
                      <div className="relative">
                        <select
                          value={servicesSortKey}
                          onChange={(e) => setServicesSortKey(e.target.value as any)}
                          className="w-full pr-8 pl-3 py-2 border border-slate-300 rounded-xl bg-white text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-3xs appearance-none transition-all"
                        >
                          <option value="name-asc">
                            {lang === 'en' ? '🔤 Name (A - Z)' : '🔤 اسم الخدمة (أ - ي)'}
                          </option>
                          <option value="name-desc">
                            {lang === 'en' ? '🔤 Name (Z - A)' : '🔤 اسم الخدمة (ي - أ)'}
                          </option>
                          <option value="total-desc">
                            {lang === 'en' ? '💰 Cost: High to Low' : '💰 التكلفة: الأعلى أولاً'}
                          </option>
                          <option value="total-asc">
                            {lang === 'en' ? '💰 Cost: Low to High' : '💰 التكلفة: الأقل أولاً'}
                          </option>
                        </select>
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                          <ArrowUpDown className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Indicator showing filters applied */}
                  {(servicesSearchQuery || servicesFilterCategory !== 'all') && (
                    <div className="flex justify-between items-center text-[10px] bg-amber-500/5 text-amber-800 border border-amber-500/10 rounded-lg py-1.5 px-3 font-sans">
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>تم تطبيق الفرز المتطور بنجاح.</span>
                      </div>
                      <button 
                        onClick={() => {
                          setServicesSearchQuery('');
                          setServicesFilterCategory('all');
                          setServicesSortKey('name-asc');
                        }}
                        className="font-bold underline hover:text-amber-950 transition-colors"
                      >
                        إعادة تهيئة الافتراضي ✕
                      </button>
                    </div>
                  )}

                  {/* Main Render Grid of cards */}
                  {(() => {
                    const filteredAndSortedServices = services.filter(s => {
                      const matchesSearch = servicesSearchQuery.trim() === '' || 
                        s.name.toLowerCase().includes(servicesSearchQuery.toLowerCase()) ||
                        s.description.toLowerCase().includes(servicesSearchQuery.toLowerCase());
                      const matchesCategory = servicesFilterCategory === 'all' || s.category === servicesFilterCategory;
                      return matchesSearch && matchesCategory;
                    }).sort((a, b) => {
                      const costA = a.govFee + a.officeFee * 1.15;
                      const costB = b.govFee + b.officeFee * 1.15;
                      if (servicesSortKey === 'name-asc') return a.name.localeCompare(b.name, 'ar');
                      if (servicesSortKey === 'name-desc') return b.name.localeCompare(a.name, 'ar');
                      if (servicesSortKey === 'total-asc') return costA - costB;
                      if (servicesSortKey === 'total-desc') return costB - costA;
                      return 0;
                    });

                    if (filteredAndSortedServices.length === 0) {
                      return (
                        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3 shadow-3xs animate-fade-in">
                          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto">
                            <Search className="w-6 h-6" />
                          </div>
                          <h4 className="font-extrabold text-slate-700 text-sm">لم يتم العثور على أي نتائج مطابقة</h4>
                          <p className="text-slate-400 text-xs font-sans max-w-sm mx-auto leading-normal">
                            لم نجد خدمة تابعة لـ <strong className="text-slate-700">"{servicesSearchQuery}"</strong> أو الفئة المذكورة. يرجى مراجعة التهجئة أو التصفية مجدداً.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setServicesSearchQuery('');
                              setServicesFilterCategory('all');
                            }}
                            className="bg-slate-900 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg hover:bg-slate-800 transition-all font-sans"
                          >
                            عرض كافة الخدمات النشطة
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredAndSortedServices.map(s => {
                          const isEditing = editingService && editingService.id === s.id;

                          if (isEditing && editingService) {
                            const addFeesTotal = (editingService.additionalFees || []).reduce((sum, f) => sum + f.amount, 0);
                            const taxTotal = editingService.officeFee * 0.15;
                            const combineTotal = editingService.govFee + editingService.officeFee + taxTotal + addFeesTotal;

                            return (
                              <form 
                                key={s.id} 
                                onSubmit={handleUpdateServiceSubmit}
                                className="bg-amber-50/40 border-2 border-amber-400 rounded-2xl p-5 shadow-inner space-y-4 text-xs font-sans animate-fade-in"
                              >
                                <div className="flex justify-between items-center border-b border-amber-200 pb-2.5">
                                  <span className="font-black text-amber-950 text-sm flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
                                    <span>تحديث المعاملة: {s.name}</span>
                                  </span>
                                  <button 
                                    type="button" 
                                    onClick={() => setEditingService(null)}
                                    className="text-slate-500 hover:text-slate-800 font-extrabold text-sm"
                                  >
                                    ✕
                                  </button>
                                </div>

                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-slate-700 font-bold mb-1">اسم الخدمة المعروض:</label>
                                    <input
                                      type="text"
                                      required
                                      value={editingService.name}
                                      onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-amber-500 bg-white text-slate-900"
                                    />
                                  </div>

                                  {/* Multi-Currency Selection in edit form */}
                                  <div className="bg-slate-100/80 p-3 rounded-xl border border-slate-200/60 space-y-2">
                                    <div className="flex justify-between items-center text-[11px] text-slate-700 font-bold">
                                      <span>عملة التسعير (التحويل المباشر لـ SAR):</span>
                                      <span className="font-mono text-[10px] text-amber-800">🇺🇸$={(1 / exchangeRates.USD).toFixed(3)} | 🇪🇺€={(1 / exchangeRates.EUR).toFixed(3)}</span>
                                    </div>
                                    <div className="flex gap-1.5">
                                      {(['SAR', 'USD', 'EUR'] as const).map(curr => {
                                        const labelMap = { SAR: '🇸🇦 SAR', USD: '🇺🇸 USD', EUR: '🇪🇺 EUR' };
                                        const isSelected = (editingService.baseCurrency || 'SAR') === curr;
                                        return (
                                          <button
                                            key={curr}
                                            type="button"
                                            onClick={() => {
                                              const currentBaseCurrency = editingService.baseCurrency || 'SAR';
                                              const currentBaseOffice = currentBaseCurrency === 'SAR' ? editingService.officeFee : (editingService.baseOfficeFee || 0);
                                              const currentBaseGov = currentBaseCurrency === 'SAR' ? editingService.govFee : (editingService.baseGovFee || 0);

                                              const nextBaseOffice = curr === 'SAR' ? 0 : currentBaseOffice;
                                              const nextBaseGov = curr === 'SAR' ? 0 : currentBaseGov;

                                              const convertedOffice = convertToSari(currentBaseOffice, curr);
                                              const convertedGov = convertToSari(currentBaseGov, curr);

                                              setEditingService({
                                                ...editingService,
                                                baseCurrency: curr,
                                                baseOfficeFee: nextBaseOffice,
                                                baseGovFee: nextBaseGov,
                                                officeFee: Number(convertedOffice.toFixed(2)),
                                                govFee: Number(convertedGov.toFixed(2))
                                              });
                                            }}
                                            className={`flex-1 py-1.5 text-[11px] font-extrabold rounded border transition-all cursor-pointer ${
                                              isSelected
                                                ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-2xs'
                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                          >
                                            {labelMap[curr]}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-slate-700 font-bold mb-1">
                                        الرسوم الحكومية ({(editingService.baseCurrency || 'SAR') === 'SAR' ? 'ر.س' : editingService.baseCurrency}):
                                      </label>
                                      <input
                                        type="number"
                                        required
                                        value={(editingService.baseCurrency || 'SAR') === 'SAR' ? editingService.govFee : (editingService.baseGovFee || 0)}
                                        onChange={(e) => {
                                          const val = Number(e.target.value) || 0;
                                          const curr = editingService.baseCurrency || 'SAR';
                                          const converted = convertToSari(val, curr as any);
                                          setEditingService({
                                            ...editingService,
                                            baseGovFee: curr === 'SAR' ? 0 : val,
                                            govFee: Number(converted.toFixed(2))
                                          });
                                        }}
                                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-amber-500 font-mono bg-white text-slate-900"
                                      />
                                      {(editingService.baseCurrency && editingService.baseCurrency !== 'SAR') ? (
                                        <div className="text-[9px] text-amber-800 bg-amber-500/10 p-1 mt-1 rounded font-mono text-center">
                                          ≈ {editingService.govFee.toFixed(2)} ر.س
                                        </div>
                                      ) : null}
                                    </div>
                                    <div>
                                      <label className="block text-slate-700 font-bold mb-1">
                                        أتعاب المكتب ({(editingService.baseCurrency || 'SAR') === 'SAR' ? 'ر.س' : editingService.baseCurrency}):
                                      </label>
                                      <input
                                        type="number"
                                        required
                                        value={(editingService.baseCurrency || 'SAR') === 'SAR' ? editingService.officeFee : (editingService.baseOfficeFee || 0)}
                                        onChange={(e) => {
                                          const val = Number(e.target.value) || 0;
                                          const curr = editingService.baseCurrency || 'SAR';
                                          const converted = convertToSari(val, curr as any);
                                          setEditingService({
                                            ...editingService,
                                            baseOfficeFee: curr === 'SAR' ? 0 : val,
                                            officeFee: Number(converted.toFixed(2))
                                          });
                                        }}
                                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-amber-500 font-mono bg-white text-slate-900"
                                      />
                                      {(editingService.baseCurrency && editingService.baseCurrency !== 'SAR') ? (
                                        <div className="text-[9px] text-amber-800 bg-amber-500/10 p-1 mt-1 rounded font-mono text-center">
                                          ≈ {editingService.officeFee.toFixed(2)} ر.س
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-3 gap-3">
                                    <div>
                                      <label className="block text-slate-900 font-bold mb-1">فئة الخدمة:</label>
                                      <select
                                        value={editingService.category}
                                        onChange={(e) => setEditingService({ 
                                          ...editingService, 
                                          category: e.target.value,
                                          subCategory: ''
                                        })}
                                        className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-xs text-slate-900 font-medium font-sans"
                                      >
                                        {categories.map(cat => (
                                          <option key={cat.id} value={cat.id}>{cat.nameAr}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-slate-900 font-bold mb-1">الفئة الفرعية التابعة (اختياري):</label>
                                      <select
                                        value={editingService.subCategory || ''}
                                        onChange={(e) => setEditingService({ ...editingService, subCategory: e.target.value })}
                                        className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-xs text-slate-900 font-medium font-sans"
                                      >
                                        <option value="">-- عام / بدون فئة فرعية --</option>
                                        {subCategories.filter(sc => sc.parentId === editingService.category).map(sc => (
                                          <option key={sc.id} value={sc.id}>{sc.nameAr}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-slate-700 font-bold mb-1">الأيقونة البصرية:</label>
                                      <div className="space-y-1.5">
                                        <input
                                          type="text"
                                          placeholder="🔍 تصفية الأيقونات..."
                                          value={iconSearchEdit}
                                          onChange={(e) => setIconSearchEdit(e.target.value)}
                                          className="w-full px-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-amber-500 text-[10px] bg-white text-slate-900 font-sans"
                                        />
                                        <select
                                          value={editingService.icon}
                                          onChange={(e) => setEditingService({ ...editingService, icon: e.target.value })}
                                          className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs text-slate-900 font-sans"
                                        >
                                          {(() => {
                                            const filtered = AVAILABLE_ICONS.filter(icon => 
                                              icon.value.toLowerCase().includes(iconSearchEdit.toLowerCase()) || 
                                              icon.label.toLowerCase().includes(iconSearchEdit.toLowerCase())
                                            );
                                            if (filtered.length === 0) {
                                              return <option value="FileText" disabled>⚠️ لا توجد أيقونة مطابقة</option>;
                                            }
                                            return filtered.map(icon => (
                                              <option key={icon.value} value={icon.value}>{icon.label}</option>
                                            ));
                                          })()}
                                        </select>
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-slate-700 font-bold mb-1">الشرح التفصيلي للعميل:</label>
                                    <textarea
                                      required
                                      value={editingService.description}
                                      onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:border-amber-500 h-16 bg-white text-slate-900"
                                    ></textarea>
                                  </div>

                                  {/* Additional Custom Fees for Editing */}
                                  <div className="bg-slate-100/60 border border-slate-200 rounded-xl p-3.5 space-y-3.5 text-right font-sans">
                                    <label className="block text-slate-900 font-extrabold text-[11px] border-b border-slate-200 pb-1 flex items-center gap-1.5">
                                      <PlusCircle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                                      <span>الرسوم وتكلفة الإنجاز الإضافية التابعة (اختياري):</span>
                                    </label>

                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <input
                                          type="text"
                                          value={tempFeeNameEdit}
                                          onChange={(e) => setTempFeeNameEdit(e.target.value)}
                                          placeholder="اسم الرسم الإضافي (ترجمة، مستعجل...)"
                                          className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-amber-500 text-[10px] bg-white text-slate-900 font-sans"
                                        />
                                      </div>
                                      <div className="flex gap-1.5">
                                        <input
                                          type="number"
                                          value={tempFeeAmountEdit}
                                          onChange={(e) => setTempFeeAmountEdit(e.target.value !== '' ? Number(e.target.value) : '')}
                                          placeholder="السعر (ر.س)"
                                          className="flex-1 p-2 border border-slate-300 rounded focus:outline-none focus:border-amber-500 text-[10px] font-mono bg-white text-slate-900"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (!tempFeeNameEdit.trim()) {
                                              alert('يرجى تحديد اسم الرسم الإضافي.');
                                              return;
                                            }
                                            if (tempFeeAmountEdit === '' || Number(tempFeeAmountEdit) <= 0) {
                                              alert('يرجى كتابة سعر صحيح أكبر من الصفر.');
                                              return;
                                            }
                                            const updatedFees = [
                                              ...(editingService.additionalFees || []),
                                              {
                                                id: `fee-${Date.now()}`,
                                                name: tempFeeNameEdit.trim(),
                                                amount: Number(tempFeeAmountEdit)
                                              }
                                            ];
                                            setEditingService({
                                              ...editingService,
                                              additionalFees: updatedFees
                                            });
                                            setTempFeeNameEdit('');
                                            setTempFeeAmountEdit('');
                                          }}
                                          className="bg-slate-900 hover:bg-slate-800 text-white font-black px-2.5 rounded text-[10px] h-8 align-middle flex items-center justify-center font-sans shadow-3xs cursor-pointer flex-shrink-0"
                                        >
                                          إضافة
                                        </button>
                                      </div>
                                    </div>

                                    {(editingService.additionalFees && editingService.additionalFees.length > 0) ? (
                                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                        {editingService.additionalFees.map(fee => (
                                          <div key={fee.id} className="bg-white border border-slate-200 p-1.5 rounded flex items-center justify-between text-[11px] font-sans shadow-3xs">
                                            <span className="font-bold text-slate-700">{fee.name}</span>
                                            <div className="flex items-center gap-2">
                                              <span className="font-mono text-indigo-700 font-bold">{fee.amount.toFixed(2)} ر.س</span>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const filtered = (editingService.additionalFees || []).filter(f => f.id !== fee.id);
                                                  setEditingService({
                                                    ...editingService,
                                                    additionalFees: filtered
                                                  });
                                                }}
                                                className="p-0.5 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                                                title="حذف الرسم"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-center py-2 border border-dashed border-slate-300 rounded text-slate-400 text-[10px]">
                                        لم يتم إضافة أي أتعاب إضافية مخصصة بعد (اختياري).
                                      </div>
                                    )}
                                  </div>

                                  <div className="bg-amber-100/40 p-3 rounded-lg border border-amber-200 text-[10px] font-mono select-none">
                                    <span className="block text-amber-900 font-bold mb-1">الاحتساب الضريبي والمالي للعميل (15%):</span>
                                    <div className="space-y-0.5 text-slate-650 font-semibold">
                                      <p className="flex justify-between"><span>أتعاب سما المعتمدة:</span> <span>{editingService.officeFee.toFixed(2)} ر.س</span></p>
                                      <p className="flex justify-between"><span>الضريبة المضافة للخدمة الأساسية:</span> <span>{taxTotal.toFixed(2)} ر.س</span></p>
                                      {addFeesTotal > 0 && (
                                        <div className="pt-0.5 border-t border-amber-205 space-y-0.5 text-slate-600 font-medium">
                                          <p className="font-sans font-bold text-[9px] text-amber-900">الرسوم الإضافية:</p>
                                          {(editingService.additionalFees || []).map(f => (
                                            <p className="flex justify-between" key={f.id}>
                                              <span>{f.name}:</span>
                                              <span>{f.amount.toFixed(2)} ر.س</span>
                                            </p>
                                          ))}
                                        </div>
                                      )}
                                      <p className="flex justify-between border-t border-amber-200 pt-0.5 text-slate-900 font-extrabold"><span>المجموع الكلي المقدر بالدليل:</span> <span>{combineTotal.toFixed(2)} ر.س</span></p>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex gap-2 justify-end pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditingService(null)}
                                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg border border-slate-300 transition text-xs"
                                  >
                                    إلغاء
                                  </button>
                                  <button
                                    type="submit"
                                    className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded-lg shadow-sm transition text-xs"
                                  >
                                    حفظ التعديلات بالمكتب
                                  </button>
                                </div>
                              </form>
                            );
                          }

                          const taxTotal = s.officeFee * 0.15;
                          const combineTotal = s.govFee + s.officeFee + taxTotal;

                          const catStyles = getCategoryStyles(s.category);
                          const badgeStyle = catStyles.badge;

                          return (
                            <div 
                              key={s.id} 
                              className="group relative bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between overflow-hidden"
                            >
                              {/* Aesthetic corner color banner depending on category */}
                              <div className={`absolute top-0 right-0 left-0 h-1.5 ${catStyles.bg}`}></div>

                              <div>
                                <div className="flex justify-between items-start mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-xl border transition-colors ${catStyles.icon}`}>
                                      {renderServiceIcon(s.icon, "w-6 h-6")}
                                    </div>
                                    <div>
                                      <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-amber-800 transition-colors leading-tight mb-1">{s.name}</h4>
                                      <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badgeStyle} font-sans`}>
                                        {getCategoryName(s.category)}
                                      </span>
                                      {s.subCategory && (
                                        <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-slate-250 bg-slate-50 text-slate-700 font-sans mr-1.5 shadow-3xs">
                                          {getSubCategoryName(s.subCategory)}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Action button triggers list */}
                                  <div className="flex gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={() => setEditingService(s)}
                                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/60 rounded-lg text-[10px] font-bold transition-all"
                                      title="تعديل تفاصيل وأسعار الخدمة"
                                    >
                                      تعديل الأسعار
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteService(s.id)}
                                      className="p-1.5 border border-slate-100 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
                                      title="إزالة وإخفاء الخدمة"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                <p className="text-slate-600 text-xs leading-relaxed mb-5 min-h-[40px] font-sans line-clamp-3">
                                  {s.description}
                                </p>
                              </div>

                              {/* Financial ledger summary block with great visual cues */}
                              <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 text-xs font-mono space-y-2 mt-auto">
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-500 font-sans flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                    <span>رسوم الدولة (مدفوعة ومباشرة):</span>
                                  </span> 
                                  <strong className="text-slate-900 font-bold">{s.govFee.toFixed(2)} ر.س</strong>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-500 font-sans flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                    <span>أتعاب المعاملة لدى سما:</span>
                                  </span> 
                                  <strong className="text-slate-900 font-bold">{s.officeFee.toFixed(2)} ر.س</strong>
                                </div>
                                <div className="flex justify-between items-center text-[11px] text-slate-550 pr-2 border-r-2 border-slate-200 select-none">
                                  <span className="font-sans">مشمول ضريبة مضافة (15%):</span>
                                  <span>{taxTotal.toFixed(2)} ر.س</span>
                                </div>
                                
                                <div className="flex justify-between items-center border-t border-dashed border-slate-200 pt-2 font-black text-amber-900 text-[13px] font-sans">
                                  <span className="flex items-center gap-1">
                                    <Coins className="w-4 h-4 text-amber-600" />
                                    <span>المجموع الشامل التقديري:</span>
                                  </span>
                                  <strong className="font-mono text-amber-950 text-sm">{combineTotal.toFixed(2)} ر.س</strong>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
            
            {adminTab === 'whatsapp' && (
              <div className="space-y-8 animate-fade-in font-sans">
                
                {/* WHATSAPP OVERVIEW & STATISTICS CARD */}
                <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-emerald-600" />
                        <span>بوابة إشعار العملاء والربط التلقائي بـ WhatsApp</span>
                      </h3>
                      <p className="text-slate-500 text-xs mt-1">
                        يقوم النظام الذكي تلقائياً بإرسال رسائل WhatsApp مخصصة إلى جوال العميل فور تغيير حالة المعاملة إلى <strong className="text-emerald-700 font-bold">"مكتملة ومستند الفاتورة جاهز"</strong> أو <strong className="text-red-700 font-bold">"ملغية"</strong> عبر البوابة الرقمية النشطة.
                      </p>
                    </div>
                    <div className="flex gap-2.5">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full select-none">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>بوابة WhatsApp النشطة: متصلة (MOCK_API)</span>
                      </span>
                    </div>
                  </div>

                  {/* Operational statistics */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">إجمالي الإشعارات الصادرة</span>
                        <strong className="text-xl font-black text-slate-955 font-mono mt-0.5 block">{whatsappLogs.length}</strong>
                      </div>
                      <Send className="w-5 h-5 text-slate-400" />
                    </div>

                    <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-emerald-800 font-bold block">نسبة نجاح التوصيل الفوري</span>
                        <strong className="text-xl font-black text-emerald-950 font-mono mt-0.5 block">
                          {whatsappLogs.length > 0 
                            ? `${Math.round((whatsappLogs.filter(l => l.success).length / whatsappLogs.length) * 100)}%` 
                            : '100%'
                          }
                        </strong>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">إرسال يدوي / تجريبي</span>
                        <strong className="text-xl font-black text-slate-955 font-mono mt-0.5 block">
                          {whatsappLogs.filter(l => l.message.includes('[إرسال تجريبي]')).length || 0}
                        </strong>
                      </div>
                      <Sparkles className="w-5 h-5 text-amber-500" />
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">متوسط زمن الاستجابة</span>
                        <strong className="text-xl font-black text-slate-955 font-mono mt-0.5 block">240ms</strong>
                      </div>
                      <Activity className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* AUTOMATED BACKGROUND SCHEDULER PANEL */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 animate-fade-in font-sans">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-600 animate-pulse animate-duration-2000" />
                        <span>مجدول التذكيرات والمهام التلقائي في الخلفية (Background Task Scheduler)</span>
                      </h3>
                      <p className="text-slate-500 text-xs mt-1">
                        يقوم النظام بفحص كافة المعاملات والطلبات التي لا تزال في حالة <strong className="text-amber-700 font-bold">"تحت المعالجة"</strong> وتجاوزت عتبة المدة المحددة (مثل: 48 ساعة) دون تحديث، ويرسل لهم تذكيرات تلقائية عبر الواتساب لتأكيد المتابعة السريعة.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
                      <span className="text-xs font-bold text-slate-700">تنفيذ المجدول في الخلفية:</span>
                      <button
                        type="button"
                        onClick={() => setAutoSchedulerEnabled(!autoSchedulerEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${autoSchedulerEnabled ? 'bg-emerald-600' : 'bg-slate-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoSchedulerEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Controls */}
                    <div className="space-y-4 bg-slate-50/75 p-5 border border-slate-200/60 rounded-xl flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-slate-800">حد التأخير الإجرائي للتذكير:</span>
                          <span className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-0.5 rounded font-mono font-bold">
                            {schedulerThresholdHours} ساعة
                          </span>
                        </div>
                        
                        <input
                          type="range"
                          min="0.1"
                          max="168"
                          step="0.1"
                          value={schedulerThresholdHours}
                          onChange={(e) => setSchedulerThresholdHours(parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />

                        <div className="flex justify-between text-[10px] text-slate-400 font-medium font-sans">
                          <span>0.1 ساعة (6 دقائق للمعاينة)</span>
                          <span>48 ساعة (افتراضي)</span>
                          <span>168 ساعة (أسبوع)</span>
                        </div>
                        
                        <p className="text-[10px] text-slate-500 leading-normal bg-amber-50 border border-amber-100 p-2.5 rounded-lg font-sans">
                          💡 <strong>تلميح للمعاينة الفورية:</strong> اسحب المنزلق جهة اليسار (مثلاً لـ 0.1 أو 1 ساعة) ثم اضغط على زر تشغيل الفحص أدناه، وسيقوم المجدول بالفحص الفوري للمعاملات التي تجاوزت هذه المدة وإرسال التنبيهات تلقائياً!
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => runOverdueSchedulerCheck(true)}
                          className="w-full py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold rounded-lg transition-all text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>تشغيل الفحص والجدولة التلقائية الآن</span>
                        </button>
                      </div>
                    </div>

                    {/* Operational Status */}
                    <div className="space-y-3 bg-slate-50/75 p-5 border border-slate-200/60 rounded-xl">
                      <span className="text-xs font-black text-slate-800 block">حالة نظام الفحص وجدولة المعاملات:</span>
                      
                      <div className="space-y-2.5 pt-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${autoSchedulerEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                          <span className={`text-[11px] font-bold ${autoSchedulerEnabled ? 'text-emerald-700' : 'text-slate-600'}`}>
                            {autoSchedulerEnabled ? 'نظام المجدول التلقائي نشط ويعمل في الخلفية' : 'المجدول في الخلفية معطل مؤقتاً'}
                          </span>
                        </div>
                        
                        <div className="text-[11px] text-slate-600 space-y-1 font-sans">
                          <div className="flex justify-between">
                            <span className="text-slate-500">معدل الفحص الدوري:</span>
                            <span className="font-bold">{autoSchedulerEnabled ? 'مراقبة فورية (كل 60 ثانية)' : 'متوقف'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">آخر فحص إلكتروني:</span>
                            <span className="font-mono text-slate-700">
                              {schedulerLogs.length > 0 ? new Date(schedulerLogs[0].runAt).toLocaleTimeString() : 'لم يبدأ بعد'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">إجمالي دورات الفحص المتراكمة:</span>
                            <span className="font-mono text-slate-700">{schedulerLogs.length} دورة</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">المعاملات تحت المعالجة حالياً:</span>
                            <span className="font-mono text-slate-700 text-amber-700 font-bold">
                              {bookings.filter(b => b.status === 'processing').length} معاملات
                            </span>
                          </div>
                        </div>

                        <div className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-lg text-[10px] text-indigo-800">
                          <strong>سياسة الاستدعاء المجدول:</strong> يتفادى المجدول تكرار إرسال التذكيرات لنفس المعاملة والحالة الإجرائية نهائياً لضمان عدم إزعاج العميل وبث أعلى درجات الموثوقية بالمنظومة.
                        </div>
                      </div>
                    </div>

                    {/* Task Execution Logs & Audit Trail */}
                    <div className="space-y-3 bg-slate-50/75 p-5 border border-slate-200/60 rounded-xl flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-black text-slate-800 block mb-2">سجلات الفحص الإجرائي والأداء التلقائي (Audit Trail):</span>
                        
                        <div className="overflow-y-auto max-h-[145px] pr-1 space-y-2 text-[10px] scrollbar-thin">
                          {schedulerLogs.map((item, index) => (
                            <div key={item.id} className="bg-white border border-slate-150 p-2 rounded-lg space-y-1 font-mono hover:border-slate-300 transition-colors">
                              <div className="flex justify-between items-center text-slate-400">
                                <span>#دورة رقم {schedulerLogs.length - index}</span>
                                <span>{new Date(item.runAt).toLocaleTimeString()}</span>
                              </div>
                              <div className="flex justify-between text-slate-700 font-sans">
                                <span className="font-sans text-slate-500 font-bold">المشمول للفحص:</span>
                                <strong>{item.checkedCount} طلبات</strong>
                              </div>
                              <div className="flex justify-between text-slate-700 font-sans">
                                <span className="font-sans text-slate-500 font-bold">المجاوز للوقت ولم يُذكّر:</span>
                                <strong className={item.processingOverdueCount > 0 ? 'text-amber-700 font-bold font-mono' : 'font-mono'}>
                                  {item.processingOverdueCount} طلبات
                                </strong>
                              </div>
                              <div className="flex justify-between text-slate-700 border-t border-dashed border-slate-100 pt-1 mt-1 font-sans">
                                <span className="font-sans text-slate-500 font-bold">إشعارات التذكير الصادرة:</span>
                                <span className={`font-mono font-bold px-1.5 py-0.2 rounded ${item.remindersSentCount > 0 ? 'bg-emerald-50 text-emerald-700' : 'text-slate-400'}`}>
                                  {item.remindersSentCount} إشعارات
                                </span>
                              </div>
                              {item.triggeredBookings && item.triggeredBookings.length > 0 && (
                                <div className="pt-1 mt-1 border-t border-slate-150 text-[9px] text-indigo-700 leading-normal font-sans bg-indigo-50/40 p-1.5 rounded">
                                  <strong>العملاء المذكَّرون:</strong>
                                  <ul className="list-disc list-inside mt-0.5 space-y-0.5 pr-1">
                                    {item.triggeredBookings.map((tb: any, subIdx: number) => (
                                      <li key={tb.bookingId || subIdx} className="truncate">
                                        {tb.clientName} (معاملة رقمه {tb.bookingId})
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}

                          {schedulerLogs.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-6 font-sans">
                              <RefreshCw className="w-5 h-5 mb-2 text-slate-300 animate-spin" />
                              <span>في انتظار بدء أول فحص إلكتروني مجدول تلقائياً في الخلفية...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TEMPLATE CUSTOMIZATION SECTION */}
                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200/80 space-y-6">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                    <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-600 border border-emerald-500/20">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base">تخصيص قوالب الرسائل التلقائية وحقول الدمج الديناميكية</h4>
                      <p className="text-slate-500 text-xs mt-0.5">خصص صياغة إشعارات الواتساب لكل حالة وحافط على تفاعل عملائك بذكاء من خلال المتغيرات التلقائية.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Template Pending Editing Card */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center border-b border-indigo-100 pb-3">
                        <h5 className="font-extrabold text-sm text-indigo-950 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                          <span>قالب إشعار: قيد الانتظار الإداري</span>
                        </h5>
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono font-bold">Pending</span>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-slate-700 text-xs font-bold">صياغة نص الرسالة:</label>
                        <textarea
                          value={whatsappTemplatePending}
                          onChange={(e) => setWhatsappTemplatePending(e.target.value)}
                          className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 leading-relaxed font-sans h-28"
                          placeholder="اكتب رسالة قيد الانتظار..."
                        />
                      </div>

                      {/* Clickable Quick Insert Tokens */}
                      <div className="space-y-1 pt-1">
                        <span className="block text-[10px] text-slate-400 font-bold">انقر فوق المتغير لإدراجه تلقائياً بالنص:</span>
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => setWhatsappTemplatePending(p => p + ' {clientName}')}
                            className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 px-2 py-1 rounded font-mono font-bold transition-all"
                            title="إدراج اسم العميل"
                          >
                            {"{clientName}"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setWhatsappTemplatePending(p => p + ' {serviceName}')}
                            className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 px-2 py-1 rounded font-mono font-bold transition-all"
                            title="إدراج اسم الخدمة"
                          >
                            {"{serviceName}"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setWhatsappTemplatePending(p => p + ' {bookingId}')}
                            className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 px-2 py-1 rounded font-mono font-bold transition-all"
                            title="إدراج رقم المعاملة"
                          >
                            {"{bookingId}"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setWhatsappTemplatePending(p => p + ' {status}')}
                            className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 px-2 py-1 rounded font-mono font-bold transition-all"
                            title="إدراج حالة الطلب الفعلي"
                          >
                            {"{status}"}
                          </button>
                        </div>
                      </div>

                      {/* Pre-computation of real time preview with a dummy user */}
                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs leading-normal">
                        <span className="font-extrabold text-[10px] text-slate-500 block mb-1">🔍 معاينة حية للمحتوى الصادر:</span>
                        <p className="text-slate-700 italic pr-3 border-r-2 border-slate-350">
                          {whatsappTemplatePending
                            .replace(/{name}/g, 'ريما بنت أحمد العسيري')
                            .replace(/{clientName}/g, 'ريما بنت أحمد العسيري')
                            .replace(/{service}/g, 'تفويض تأشيرة الكتروني')
                            .replace(/{serviceName}/g, 'تفويض تأشيرة الكتروني')
                            .replace(/{status}/g, 'قيد المراجعة والتدقيق الإداري والمحاسبي')
                            .replace(/{phone}/g, '0567891234')
                            .replace(/{bookingId}/g, 'REQ-10492')
                          }
                        </p>
                      </div>
                    </div>

                    {/* Template Processing Editing Card */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center border-b border-amber-100 pb-3">
                        <h5 className="font-extrabold text-sm text-amber-950 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                          <span>قالب إشعار: قيد معالجة المعاملة</span>
                        </h5>
                        <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-mono font-bold">Processing</span>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-slate-700 text-xs font-bold">صياغة نص الرسالة:</label>
                        <textarea
                          value={whatsappTemplateProcessing}
                          onChange={(e) => setWhatsappTemplateProcessing(e.target.value)}
                          className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 leading-relaxed font-sans h-28"
                          placeholder="اكتب رسالة قيد المعالجة..."
                        />
                      </div>

                      {/* Clickable Quick Insert Tokens */}
                      <div className="space-y-1 pt-1">
                        <span className="block text-[10px] text-slate-400 font-bold">انقر فوق المتغير لإدراجه تلقائياً بالنص:</span>
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => setWhatsappTemplateProcessing(p => p + ' {clientName}')}
                            className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 px-2 py-1 rounded font-mono font-bold transition-all"
                            title="إدراج اسم العميل"
                          >
                            {"{clientName}"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setWhatsappTemplateProcessing(p => p + ' {serviceName}')}
                            className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 px-2 py-1 rounded font-mono font-bold transition-all"
                            title="إدراج اسم الخدمة"
                          >
                            {"{serviceName}"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setWhatsappTemplateProcessing(p => p + ' {bookingId}')}
                            className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 px-2 py-1 rounded font-mono font-bold transition-all"
                            title="إدراج رقم المعاملة"
                          >
                            {"{bookingId}"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setWhatsappTemplateProcessing(p => p + ' {status}')}
                            className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 px-2 py-1 rounded font-mono font-bold transition-all"
                            title="إدراج حالة الطلب الفعلي"
                          >
                            {"{status}"}
                          </button>
                        </div>
                      </div>

                      {/* Pre-computation of real time preview with a dummy user */}
                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs leading-normal">
                        <span className="font-extrabold text-[10px] text-slate-500 block mb-1">🔍 معاينة حية للمحتوى الصادر:</span>
                        <p className="text-slate-700 italic pr-3 border-r-2 border-slate-350">
                          {whatsappTemplateProcessing
                            .replace(/{name}/g, 'خالد محمد الشهراني')
                            .replace(/{clientName}/g, 'خالد محمد الشهراني')
                            .replace(/{service}/g, 'تمديد تأشيرة زيارة')
                            .replace(/{serviceName}/g, 'تمديد تأشيرة زيارة')
                            .replace(/{status}/g, 'تحت المعالجة الإجرائية من قبل فريق المراجعين')
                            .replace(/{phone}/g, '0502468135')
                            .replace(/{bookingId}/g, 'REQ-29401')
                          }
                        </p>
                      </div>
                    </div>

                    {/* Template Completed Editing Card */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center border-b border-emerald-100 pb-3">
                        <h5 className="font-extrabold text-sm text-emerald-950 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>قالب إشعار: اكتمال المعاملة والطلب</span>
                        </h5>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono font-bold">Completed</span>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-slate-700 text-xs font-bold">صياغة نص الرسالة:</label>
                        <textarea
                          value={whatsappTemplateCompleted}
                          onChange={(e) => setWhatsappTemplateCompleted(e.target.value)}
                          className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 leading-relaxed font-sans h-28"
                          placeholder="اكتب رسالة طلب مكتمل..."
                        />
                      </div>

                      {/* Clickable Quick Insert Tokens */}
                      <div className="space-y-1 pt-1">
                        <span className="block text-[10px] text-slate-400 font-bold">انقر فوق المتغير لإدراجه تلقائياً بالنص:</span>
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => setWhatsappTemplateCompleted(p => p + ' {clientName}')}
                            className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 px-2 py-1 rounded font-mono font-bold transition-all"
                            title="إدراج اسم العميل"
                          >
                            {"{clientName}"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setWhatsappTemplateCompleted(p => p + ' {serviceName}')}
                            className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 px-2 py-1 rounded font-mono font-bold transition-all"
                            title="إدراج اسم الخدمة"
                          >
                            {"{serviceName}"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setWhatsappTemplateCompleted(p => p + ' {bookingId}')}
                            className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 px-2 py-1 rounded font-mono font-bold transition-all"
                            title="إدراج رقم المعاملة"
                          >
                            {"{bookingId}"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setWhatsappTemplateCompleted(p => p + ' {status}')}
                            className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 px-2 py-1 rounded font-mono font-bold transition-all"
                            title="إدراج حالة الطلب الفعلي"
                          >
                            {"{status}"}
                          </button>
                        </div>
                      </div>

                      {/* Pre-computation of real time preview with a dummy user */}
                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs leading-normal">
                        <span className="font-extrabold text-[10px] text-slate-500 block mb-1">🔍 معاينة حية للمحتوى الصادر:</span>
                        <p className="text-slate-700 italic pr-3 border-r-2 border-slate-350">
                          {whatsappTemplateCompleted
                            .replace(/{name}/g, 'عبد الرحمن سفيان الحركان')
                            .replace(/{clientName}/g, 'عبد الرحمن سفيان الحركان')
                            .replace(/{service}/g, 'تأشيرة عمل مهندس')
                            .replace(/{serviceName}/g, 'تأشيرة عمل مهندس')
                            .replace(/{status}/g, 'مكتملة ومستحقة الدفع')
                            .replace(/{phone}/g, '0501234567')
                            .replace(/{bookingId}/g, 'REQ-48192')
                          }
                        </p>
                      </div>
                    </div>

                    {/* Template Cancelled Editing Card */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center border-b border-red-100 pb-3">
                        <h5 className="font-extrabold text-sm text-red-950 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                          <span>قالب إشعار: إلغاء المعاملة والطلب</span>
                        </h5>
                        <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded font-mono font-bold">Cancelled</span>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-slate-700 text-xs font-bold">صياغة نص الرسالة:</label>
                        <textarea
                          value={whatsappTemplateCancelled}
                          onChange={(e) => setWhatsappTemplateCancelled(e.target.value)}
                          className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 leading-relaxed font-sans h-28"
                          placeholder="اكتب رسالة تم الإلغاء..."
                        />
                      </div>

                      {/* Clickable Quick Insert Tokens */}
                      <div className="space-y-1 pt-1">
                        <span className="block text-[10px] text-slate-400 font-bold">انقر فوق المتغير لإدراجه تلقائياً بالنص:</span>
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => setWhatsappTemplateCancelled(p => p + ' {clientName}')}
                            className="text-[9px] bg-red-50 text-red-800 border border-red-200 hover:bg-red-100 px-2 py-1 rounded font-mono font-bold transition-all"
                            title="إدراج اسم العميل"
                          >
                            {"{clientName}"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setWhatsappTemplateCancelled(p => p + ' {serviceName}')}
                            className="text-[9px] bg-red-50 text-red-800 border border-red-200 hover:bg-red-100 px-2 py-1 rounded font-mono font-bold transition-all"
                            title="إدراج اسم الخدمة"
                          >
                            {"{serviceName}"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setWhatsappTemplateCancelled(p => p + ' {bookingId}')}
                            className="text-[9px] bg-red-50 text-red-800 border border-red-200 hover:bg-red-100 px-2 py-1 rounded font-mono font-bold transition-all"
                            title="إدراج رقم المعاملة"
                          >
                            {"{bookingId}"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setWhatsappTemplateCancelled(p => p + ' {status}')}
                            className="text-[9px] bg-red-50 text-red-800 border border-red-200 hover:bg-red-100 px-2 py-1 rounded font-mono font-bold transition-all"
                            title="إدراج حالة الطلب الفعلي"
                          >
                            {"{status}"}
                          </button>
                        </div>
                      </div>

                      {/* Pre-computation of real time preview with a dummy user */}
                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs leading-normal">
                        <span className="font-extrabold text-[10px] text-slate-500 block mb-1">🔍 معاينة حية للمحتوى الصادر:</span>
                        <p className="text-slate-700 italic pr-3 border-r-2 border-slate-350">
                          {whatsappTemplateCancelled
                            .replace(/{name}/g, 'سارة بنت حمود الطويرقي')
                            .replace(/{clientName}/g, 'سارة بنت حمود الطويرقي')
                            .replace(/{service}/g, 'تأشيرة زيارة عائلية')
                            .replace(/{serviceName}/g, 'تأشيرة زيارة عائلية')
                            .replace(/{status}/g, 'ملغية ومسحوبة')
                            .replace(/{phone}/g, '0559876543')
                            .replace(/{bookingId}/g, 'REQ-38291')
                          }
                        </p>
                      </div>
                    </div>

                    {/* Template Reminder Processing Editing Card */}
                    <div className="bg-white p-5 rounded-2xl border border-indigo-150 shadow-sm space-y-4 hover:shadow-md transition-shadow relative overflow-hidden">
                      {/* Premium indicator banner for automated task template */}
                      <div className="absolute top-0 right-0 left-0 h-1 bg-violet-600"></div>

                      <div className="flex justify-between items-center border-b border-violet-100 pb-3">
                        <h5 className="font-extrabold text-sm text-violet-950 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse"></span>
                          <span>قالب تلويح تذكيري للتأخر الإجرائي</span>
                        </h5>
                        <span className="text-[10px] bg-violet-50 text-violet-700 px-2 py-0.5 rounded font-mono font-bold">Auto-Reminder</span>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-slate-700 text-xs font-bold">صياغة نص رسالة التذكير التلقائية (بالواتساب):</label>
                        <textarea
                          value={whatsappTemplateReminderProcessing}
                          onChange={(e) => setWhatsappTemplateReminderProcessing(e.target.value)}
                          className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 leading-relaxed font-sans h-28"
                          placeholder="اكتب صياغة نص تذكير المعاملات المتأخرة..."
                        />
                      </div>

                      {/* Clickable Quick Insert Tokens */}
                      <div className="space-y-1 pt-1">
                        <span className="block text-[10px] text-slate-400 font-bold">انقر فوق المتغير لإدراجه تلقائياً بالنص:</span>
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => setWhatsappTemplateReminderProcessing(p => p + ' {clientName}')}
                            className="text-[9px] bg-violet-50 text-violet-800 border border-violet-200 hover:bg-violet-100 px-2 py-1 rounded font-mono font-bold transition-all cursor-pointer"
                            title="إدراج اسم العميل"
                          >
                            {"{clientName}"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setWhatsappTemplateReminderProcessing(p => p + ' {serviceName}')}
                            className="text-[9px] bg-violet-50 text-violet-800 border border-violet-200 hover:bg-violet-100 px-2 py-1 rounded font-mono font-bold transition-all cursor-pointer"
                            title="إدراج اسم الخدمة"
                          >
                            {"{serviceName}"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setWhatsappTemplateReminderProcessing(p => p + ' {bookingId}')}
                            className="text-[9px] bg-violet-50 text-violet-800 border border-violet-200 hover:bg-violet-100 px-2 py-1 rounded font-mono font-bold transition-all cursor-pointer"
                            title="إدراج رقم المعاملة"
                          >
                            {"{bookingId}"}
                          </button>
                        </div>
                      </div>

                      {/* Pre-computation of real time preview with a dummy user */}
                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs leading-normal">
                        <span className="font-extrabold text-[10px] text-slate-500 block mb-1">🔍 معاينة حية للتذكير الصادر:</span>
                        <p className="text-slate-700 italic pr-3 border-r-2 border-violet-300 bg-violet-50/20 p-1.5 rounded-lg">
                          {whatsappTemplateReminderProcessing
                            .replace(/{name}/g, 'خالصة بنت عيسى الوهيبي')
                            .replace(/{clientName}/g, 'خالصة بنت عيسى الوهيبي')
                            .replace(/{service}/g, 'إصدار رخصة بلدي بلدية')
                            .replace(/{serviceName}/g, 'إصدار رخصة بلدي بلدية')
                            .replace(/{status}/g, 'تحت المعالجة الإجرائية من قبل فريق المراجعين والمتابعة الخارجية')
                            .replace(/{phone}/g, '0543210987')
                            .replace(/{bookingId}/g, 'REQ-50983')
                          }
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* TOKENS CHEAT SHEET & RESET BUTTONS */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                  <div>
                    <span className="font-extrabold text-slate-900 block mb-2">🏷️ رموز الاختصارات المدعومة داخل القوالب:</span>
                    <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                      <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 px-2.5 py-1 rounded" title="الاسم الكامل للعميل">{"{clientName}"} أو {"{name}"} : اسم العميل</span>
                      <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 px-2.5 py-1 rounded" title="اسم الخدمة المختارة">{"{serviceName}"} أو {"{service}"} : نوع الخدمة</span>
                      <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 px-2.5 py-1 rounded" title="رقم جوال المستفيد">{"{phone}"} : رقم الجوال</span>
                      <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 px-2.5 py-1 rounded" title="توصيف حالة الطلب">{"{status}"} : وصف الحالة</span>
                      <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 px-2.5 py-1 rounded" title="رقم المعاملة الفريد">{"{bookingId}"} : رقم المعاملة</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 w-full md:w-auto self-end">
                    <button
                      type="button"
                      onClick={() => {
                        setWhatsappTemplateCompleted('السلام عليكم ورحمة الله وبركاته، الأخ/الأخت {name} المحترم. يسعدنا إبلاغكم بأن معاملتكم لطلب ({service}) قد اكتملت بنجاح ومستند الفاتورة جاهز. شكراً لثقتكم بمكتب سما المملكة للخدمات المتكاملة.');
                        setWhatsappTemplateCancelled('السلام عليكم ورحمة الله وبركاته، الأخ/الأخت {name} المحترم. نود إبلاغكم بأنه تم إلغاء معاملتكم رقم {bookingId} لطلب ({service}). لمزيد من الاستفسارات يرجى الاتصال بإدارة المكتب. شكراً لتفهمكم.');
                        setWhatsappTemplateProcessing('السلام عليكم ورحمة الله وبركاته، الأخ/الأخت {clientName} المحترم. نود إبلاغكم بأن طلبكم رقم {bookingId} لمعاملة ({serviceName}) هو الآن قيد المعالجة الإجرائية من قبل فريق المراجعة والجهات المختصة. سنوافيكم بالتطورات قريباً.');
                        setWhatsappTemplatePending('السلام عليكم ورحمة الله وبركاته، الأخ/الأخت {clientName} المحترم. تم استلام طلبكم رقم {bookingId} لمعاملة ({serviceName}) بنجاح. وهو قيد الانتظار حالياً للمراجعة والتدقيق الإداري. شكراً لثقتكم بمكتب سما المملكة.');
                        setWhatsappTemplateReminderProcessing('السلام عليكم ورحمة الله وبركاته، الأخ/الأخت {clientName} المحترم. نود إحاطتكم بأن طلبكم رقم {bookingId} لمعاملة ({serviceName}) لا يزال قيد المعالجة الإجرائية من قبل فريق المراجعين والمتابعة مع الجهات المختصة لإنهاء المعاملة وتيسير إجرائها بأسرع وقت ممكن. نحن نسعى دائماً لخدمتكم وتسريع معاملاتكم. شكراً لثقتكم بمكتب سما المملكة.');
                        setSaveSuccessWaTemplate(true);
                        setTimeout(() => setSaveSuccessWaTemplate(false), 3000);
                      }}
                      className="px-3 border border-slate-300 text-slate-800 font-bold py-2 bg-white hover:bg-slate-100 rounded-xl transition text-xs flex-1 md:flex-initial cursor-pointer"
                    >
                      استعادة الافتراضي
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSaveSuccessWaTemplate(true);
                        setTimeout(() => setSaveSuccessWaTemplate(false), 3000);
                      }}
                      className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-500 font-black rounded-xl border border-slate-700 transition shadow text-xs flex items-center justify-center gap-1.5 flex-1 md:flex-initial"
                    >
                      {saveSuccessWaTemplate ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                          <span className="text-emerald-400">تم حفظ القوالب بنجاح!</span>
                        </>
                      ) : (
                        <span>حفظ التعديلات والتخصيص</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* LIVE DYNAMIC TEST CONSOLE SECTION */}
                <div className="bg-gradient-to-l from-slate-900 to-slate-850 p-6 rounded-xl text-white shadow-xl border border-slate-800 space-y-4">
                  <div>
                    <h3 className="font-extrabold text-amber-500 text-sm flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>بوابة الاختبار والتحقق التلقائي المباشر (Simulator Dispatch Console)</span>
                    </h3>
                    <p className="text-slate-400 text-xs mt-1 font-sans">
                      اختبر بث البوابة الرقمية في أي وقت! اختر معاملة من المعاملات النشطة بالنظام ثم حدد حالة الإرسال للبث لترى النتيجة الصادرة والـ Response الآتي من Gateway API بصورة واقعية.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1.5 text-xs">١. اختر معاملة مرجعية للفحص:</label>
                      <select
                        value={testConsoleBookingId}
                        onChange={(e) => setTestConsoleBookingId(e.target.value)}
                        className="w-full p-2.5 bg-slate-950 text-slate-100 border border-slate-750 rounded-xl focus:outline-none focus:border-amber-500 text-xs"
                      >
                        {bookings.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.clientName} ({b.serviceName}) - {b.phoneNumber}
                          </option>
                        ))}
                        {bookings.length === 0 && (
                          <option value="">لا يوجد أي معاملات متاحة للتجربة</option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1.5 text-xs">٢. اختر حالة البث المنشودة:</label>
                      <select
                        value={testConsoleTemplateType}
                        onChange={(e) => setTestConsoleTemplateType(e.target.value as any)}
                        className="w-full p-2.5 bg-slate-950 text-slate-100 border border-slate-750 rounded-xl focus:outline-none focus:border-amber-500 text-xs"
                      >
                        <option value="pending">قيد الانتظار الإداري (Pending Template)</option>
                        <option value="processing">قيد معالجة المعاملة (Processing Template)</option>
                        <option value="completed">اكتمال وتهيئة الفاتورة (Completed Template)</option>
                        <option value="cancelled">إلغاء المعاملة (Cancelled Template)</option>
                      </select>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={handleManualTestWaDispatch}
                        disabled={testConsoleIsDispatching || !testConsoleBookingId}
                        className="w-full p-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-xl transition text-xs flex items-center justify-center gap-2 shadow disabled:bg-slate-700 disabled:text-slate-400"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{testConsoleIsDispatching ? 'جاري بث الإجراء للبوابة...' : 'بث واختبار الإرسال الإلكتروني الآن'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* HISTORICAL TRANSMISSION LOGS */}
                <div className="bg-white p-6 rounded-xl shadow border border-slate-200">
                  <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-emerald-600" />
                        <span>سجل بث وتوصيل إشعارات WhatsApp (تتبع البوابة)</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">ملخص بكافة المعاملات الصادرة عبر بوابتنا الحسابية الافتراضية مع الحالة المرجعية للبث.</p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('هل تريد مسح سجل الإشعارات نهائياً؟')) {
                          setWhatsappLogs([]);
                        }
                      }}
                      className="text-xs text-red-600 hover:text-red-700 font-bold"
                      disabled={whatsappLogs.length === 0}
                    >
                      مسح سجل البث الكلي
                    </button>
                  </div>

                  {whatsappLogs.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 bg-slate-50 rounded-xl">
                      <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="text-xs font-bold text-slate-500">سجل الإشعارات فارغ تماماً حالياً</p>
                      <p className="text-[10px] text-slate-400 mt-1">قم بتغيير حالة المستند لأي معاملة بالبوابة إلى مكتمل أو ملغى، أو اضغط على إرسال تجريبي في شريط الاختيار بالأعلى.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-150 rounded-lg">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                            <th className="p-3 text-right">رقم البث / المستفيد</th>
                            <th className="p-3 text-right">المعاملة المستهدفة</th>
                            <th className="p-3 text-right">محتوى الرسالة الصادرة</th>
                            <th className="p-3 text-right">تاريخ وتوقيت الإرسال</th>
                            <th className="p-3 text-center">حالة العملية</th>
                            <th className="p-3 text-center">بوابة استجابة المطور (API)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {whatsappLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 font-sans">
                                <div className="font-bold text-slate-850 flex items-center gap-1.5">
                                  <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{log.clientName}</span>
                                </div>
                                <span className="text-[10px] font-mono text-slate-500 block mt-0.5">{log.phoneNumber}</span>
                              </td>
                              
                              <td className="p-3 font-sans">
                                <span className="font-bold text-slate-800">{log.serviceName}</span>
                                <div className="text-[10px] mt-0.5 flex items-center gap-1">
                                  <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'completed' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                  <span>{log.status === 'completed' ? 'تحديث: مكتمل' : 'تحديث: ملغى'}</span>
                                </div>
                              </td>

                              <td className="p-3 max-w-[280px]">
                                <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-150 font-sans leading-relaxed line-clamp-3 hover:line-clamp-none cursor-help transition-all" title={log.message}>
                                  {log.message}
                                </div>
                              </td>

                              <td className="p-3 font-mono text-slate-500">
                                <span>{new Date(log.sentAt).toLocaleDateString('ar-SA')}</span>
                                <span className="block text-[10px] text-slate-400 mt-0.5">
                                  {new Date(log.sentAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                              </td>

                              <td className="p-3 text-center">
                                {log.success ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>بث بنجاح</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-50 text-red-800 border border-red-200 px-2.5 py-1 rounded">
                                    <AlertCircle className="w-3 h-3 text-red-600" />
                                    <span>فشل الإرسال</span>
                                  </span>
                                )}
                              </td>

                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    alert(`الاستجابة الرسمية الآتية من بوابة WhatsApp API:\n\n${log.apiResponse}`);
                                  }}
                                  className="text-[10px] text-slate-600 border border-slate-200 bg-white hover:bg-slate-100 px-2 py-1 rounded font-mono select-none"
                                >
                                  عرض JSON Payload
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* --- ADMIN INTERNAL VIEW 6: JOBS & ANNOUNCEMENTS CONTROL --- */}
            {adminTab === 'jobs' && (
              <div className="space-y-8 animate-fade-in font-sans" dir="rtl">
                
                {/* Admin Jobs Header */}
                <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200 text-right">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-xl font-black text-slate-950 flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-amber-600" />
                        <span>لوحة إدارة الكوادر البشرية والإعلانات والتعاميم</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        إدارة مباشرة للشواغر الوظيفية، تعيين تعاميم الإدارة لمكتب سما المملكة، ومراجعة السير الذاتية المرفقة من قبل المتقدمين ماليًا ومهنيًا.
                      </p>
                    </div>
                    
                    {/* Sub-tab selection inside HR panel */}
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button 
                        type="button"
                        onClick={() => setAdminJobSubTab('applications')}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${adminJobSubTab === 'applications' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-850'}`}
                      >
                        📂 طلبات التوظيف ({jobApplications.length})
                      </button>
                      <button 
                        type="button"
                        onClick={() => setAdminJobSubTab('jobs')}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${adminJobSubTab === 'jobs' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-850'}`}
                      >
                        💼 الشواغر الوظيفية ({jobs.length})
                      </button>
                      <button 
                        type="button"
                        onClick={() => setAdminJobSubTab('announcements')}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${adminJobSubTab === 'announcements' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-850'}`}
                      >
                        📢 التعاميم والأخبار ({announcements.length})
                      </button>
                    </div>
                  </div>
                </div>

                {/* SUB-VIEW 1: APPLICATIONS */}
                {adminJobSubTab === 'applications' && (
                  <div className="bg-white rounded-xl shadow border border-slate-200 p-6 space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 text-right">
                      <h4 className="font-extrabold text-slate-900 text-sm">{lang === 'ar' ? 'السير الذاتية والطلبات الواردة' : 'Submitted Job Applications'}</h4>
                      <span className="text-xs font-bold text-slate-400 font-mono">Total: {jobApplications.length} entries</span>
                    </div>

                    {jobApplications.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-150 rounded-xl bg-slate-50">
                        <Users className="w-12 h-12 mx-auto text-slate-350 mb-3" />
                        <h5 className="font-bold text-slate-800 text-sm mb-1">لا توجد طلبات توظيف مقدمة حالياً</h5>
                        <p className="text-xs">بمجرد تقديم سير ذاتية جديدة عبر صفحة الوظائف العامة، ستظهر بيانات وتفاصيل المتقدمين فورياً في هذه القائمة.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-slate-200 rounded-lg">
                        <table className="w-full text-right text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                              <th className="p-3 text-right">المتقدم للوظيفة</th>
                              <th className="p-3 text-right">الوظيفة المستهدفة</th>
                              <th className="p-3 text-right">بيانات الاتصال والبريد</th>
                              <th className="p-3 text-right">تاريخ التقديم</th>
                              <th className="p-3 text-center">حالة الطلب</th>
                              <th className="p-3 text-center">الإجراءات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150">
                            {jobApplications.map((app) => (
                              <tr key={app.id} className="hover:bg-slate-50/50 transition-all">
                                <td className="p-3 font-sans text-right">
                                  <div className="font-black text-slate-900">{app.applicantName}</div>
                                  {app.cvFileName && (
                                    <span className="text-[10px] text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 inline-block mt-1 font-bold border border-amber-200">
                                      📎 CV: {app.cvFileName}
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-right">
                                  <div className="font-bold text-slate-850">{app.jobTitle}</div>
                                  <span className="text-[10px] text-slate-400 font-mono">ID: {app.jobId}</span>
                                </td>
                                <td className="p-3 font-mono text-right">
                                  <div className="text-slate-700">{app.applicantPhone}</div>
                                  <div className="text-[10px] text-slate-400">{app.applicantEmail || 'لا يوجد بريد'}</div>
                                </td>
                                <td className="p-3 font-mono text-slate-500 text-right">{new Date(app.date).toLocaleDateString('ar-SA')}</td>
                                <td className="p-3 text-center">
                                  <span className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full font-black ${
                                    app.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-205' :
                                    app.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-250' :
                                    'bg-slate-100 text-slate-500'
                                  }`}>
                                    {app.status === 'pending' && (lang === 'ar' ? 'قيد المراجعة' : 'Pending')}
                                    {app.status === 'approved' && (lang === 'ar' ? 'مقبول مبدئياً' : 'Shortlisted')}
                                    {app.status === 'rejected' && (lang === 'ar' ? 'مستبعد' : 'Disqualified')}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex justify-center items-center gap-1.5">
                                    
                                    {/* Status approval toggling buttons */}
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        setJobApplications(prev => prev.map(item => item.id === app.id ? { ...item, status: 'approved' } : item));
                                      }}
                                      className="px-2 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded text-[10px] font-bold transition-all border border-emerald-200 cursor-pointer"
                                      title="قبول الطلب مبدئياً"
                                    >
                                      قبول
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        setJobApplications(prev => prev.map(item => item.id === app.id ? { ...item, status: 'rejected' } : item));
                                      }}
                                      className="px-2 py-1 bg-red-50 text-red-800 hover:bg-red-100 rounded text-[10px] font-bold transition-all border border-red-200 cursor-pointer"
                                      title="استبعاد الطلب"
                                    >
                                      استبعاد
                                    </button>

                                    {/* View Cover letter Details */}
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        let msg = `تفاصيل طلب التوظيف للمتقدم: ${app.applicantName}\n\n`;
                                        msg += `البريد الإلكتروني: ${app.applicantEmail || 'لا يوجد'}\n`;
                                        msg += `رقم الهاتف: ${app.applicantPhone}\n`;
                                        msg += `خطاب التغطية والمؤهلات:\n"${app.coverLetter || 'لم يكتب خطاباً مخصصاً.'}"\n\n`;
                                        if (app.cvFileData) {
                                          msg += `تنبيه: السيرة الذاتية مرفقة وقابلة للتنزيل فورياً.`;
                                        }
                                        alert(msg);
                                      }}
                                      className="p-1 text-slate-650 hover:bg-slate-100 rounded border border-slate-200 transition-all cursor-pointer"
                                      title="عرض التفاصيل"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Download file CV base64 code */}
                                    {app.cvFileData && (
                                      <a 
                                        href={app.cvFileData} 
                                        download={app.cvFileName || "cv.pdf"}
                                        className="p-1 text-slate-650 hover:bg-amber-50 hover:text-amber-700 rounded border border-slate-200 transition-all"
                                        title="تحميل السيرة الذاتية المرفقة"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </a>
                                    )}

                                    {/* Delete Request Button */}
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        if (window.confirm('هل أنت متأكد من حذف هذا السجل نهائياً؟')) {
                                          setJobApplications(prev => prev.filter(item => item.id !== app.id));
                                        }
                                      }}
                                      className="p-1 text-red-650 hover:bg-red-50 hover:text-red-700 rounded border border-red-150 transition-all cursor-pointer"
                                      title="حذف الطلب نهائياً"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* SUB-VIEW 2: JOBS MANAGEMENT */}
                {adminJobSubTab === 'jobs' && (
                  <div className="bg-white rounded-xl shadow border border-slate-200 p-6 space-y-6">
                    
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 text-right">
                      <h4 className="font-extrabold text-slate-900 text-sm">إدارة شواغر التوظيف المفتوحة بالمكتب</h4>
                      
                      <button 
                        type="button"
                        onClick={() => {
                          if (adminEditingJob) {
                            setAdminEditingJob(null);
                          } else {
                            setAdminEditingJob({
                              id: `job-${Date.now()}`,
                              title: '',
                              department: 'شعبة العلاقات العامة والتعقيب',
                              location: 'الرياض - المقر الرئيسي',
                              type: 'full-time',
                              salary: '5,000 - 7,500 ر.س',
                              description: '',
                              requirements: [],
                              date: new Date().toISOString().split('T')[0],
                              status: 'active'
                            });
                            // Initialize fields
                            setAdminJobTitle('');
                            setAdminJobDepartment('شعبة العلاقات العامة والتعقيب');
                            setAdminJobLocation('الرياض - المقر الرئيسي');
                            setAdminJobType('full-time');
                            setAdminJobSalary('5,000 - 7,500 ر.س');
                            setAdminJobDescription('');
                            setAdminJobRequirements('');
                          }
                        }}
                        className="px-3.5 py-1.5 bg-slate-900 text-amber-500 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        {adminEditingJob ? 'إلغاء النموذج والعودة' : '+ إضافة وظيفة شاغرة جديدة'}
                      </button>
                    </div>

                    {adminEditingJob ? (
                      /* Form content */
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!adminJobTitle.trim() || !adminJobDescription.trim()) {
                            alert('يرجى كتابة المسمى والوصف لحفظ التغييرات.');
                            return;
                          }

                          const reqsArray = adminJobRequirements
                            .split('\n')
                            .map(r => r.trim())
                            .filter(Boolean);

                          const updatedJobObj: Job = {
                            ...adminEditingJob,
                            title: adminJobTitle.trim(),
                            department: adminJobDepartment,
                            location: adminJobLocation,
                            type: adminJobType,
                            salary: adminJobSalary.trim(),
                            description: adminJobDescription.trim(),
                            requirements: reqsArray.length > 0 ? reqsArray : ['مؤهل علمي وبدني مناسب لمهمات المراجعة للوزارات بالمملكة']
                          };

                          setJobs(prev => {
                            if (prev.some(item => item.id === updatedJobObj.id)) {
                              return prev.map(item => item.id === updatedJobObj.id ? updatedJobObj : item);
                            } else {
                              return [updatedJobObj, ...prev];
                            }
                          });

                          setAdminEditingJob(null);
                        }}
                        className="space-y-4 max-w-2xl bg-slate-50 p-5 rounded-xl border border-slate-150 text-right"
                      >
                        <h4 className="font-extrabold text-slate-800 text-xs text-amber-600">
                          {adminEditingJob.title ? `تعديل الشاغر: ${adminEditingJob.title}` : 'المواصفات المهنية للشاغر الجديد'}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">المسمى الوظيفي المقترح <span className="text-rose-600">*</span></label>
                            <input 
                              type="text" 
                              required
                              placeholder="مثال: أخصائي تعقيب وتخليص ميداني"
                              value={adminJobTitle}
                              onChange={(e) => setAdminJobTitle(e.target.value)}
                              className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white focus:outline-hidden focus:border-amber-500 text-right"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">القسم والشعبة الإدارية</label>
                            <select 
                              value={adminJobDepartment}
                              onChange={(e) => setAdminJobDepartment(e.target.value)}
                              className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white focus:outline-hidden focus:border-amber-500"
                            >
                              <option value="شعبة العلاقات العامة والتعقيب">شعبة العلاقات العامة والتعقيب</option>
                              <option value="قسم تطوير الأعمال والتقنيات">قسم تطوير الأعمال والتقنيات</option>
                              <option value="إدارة العمليات والخدمات الحكومية">إدارة العمليات والخدمات الحكومية</option>
                              <option value="شؤون الموظفين وهيئة المتابعة الكلية">شؤون الموظفين وهيئة المتابعة الكلية</option>
                              <option value="المحاسبة والإحصاء المالي العام">المحاسبة والإحصاء المالي العام</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">الراتب المتوقع والبدلات</label>
                            <input 
                              type="text" 
                              placeholder="5,000 - 7,500 ر.س"
                              value={adminJobSalary}
                              onChange={(e) => setAdminJobSalary(e.target.value)}
                              className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white focus:outline-hidden focus:border-amber-500 text-right"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">موقع العمل المخصص</label>
                            <input 
                              type="text" 
                              placeholder="الرياض - المقر الرئيسي"
                              value={adminJobLocation}
                              onChange={(e) => setAdminJobLocation(e.target.value)}
                              className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white focus:outline-hidden focus:border-amber-500 text-right"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">طبيعة العقد والدوام</label>
                            <select 
                              value={adminJobType}
                              onChange={(e) => setAdminJobType(e.target.value as any)}
                              className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white focus:outline-hidden focus:border-amber-500"
                            >
                              <option value="full-time">دوام كامل (Full Time)</option>
                              <option value="part-time">دوام جزئي (Part Time)</option>
                              <option value="contract">عقد خارجي مؤقت (Contract)</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">وصف العمل الرئيسي والواجبات <span className="text-rose-600">*</span></label>
                          <textarea 
                            rows={3}
                            required
                            placeholder="تحدث بالتفصيل عن واجبات ومسؤوليات الموظف المقترح في مكتب سما المملكة..."
                            value={adminJobDescription}
                            onChange={(e) => setAdminJobDescription(e.target.value)}
                            className="w-full text-xs border border-slate-2.5 border-slate-250 p-2.5 rounded-xl bg-white focus:outline-hidden focus:border-amber-500 text-right leading-relaxed"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">المهارات والخبرات المطلوبة للقبول (اكتب كل بند في سطر مستقل)</label>
                          <textarea 
                            rows={4}
                            placeholder="مثال:
إتقان استخدام بوابة جدارة وأبشر أعمال ومقيم
خبرة لا تقل عن سنتين في تعقيب المكاتب والهيئات الحكومية
امتلاك سيارة ورخصة قيادة سارية المفعول بالمملكة"
                            value={adminJobRequirements}
                            onChange={(e) => setAdminJobRequirements(e.target.value)}
                            className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white focus:outline-hidden focus:border-amber-500 text-right font-sans"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button 
                            type="button"
                            onClick={() => setAdminEditingJob(null)}
                            className="bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            إلغاء
                          </button>
                          <button 
                            type="submit"
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-6 py-2 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
                          >
                            حفظ الشاغر الوظيفي وبثه للمستفيدين
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* Vacancies listing table */
                      <div className="space-y-4">
                        {jobs.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl">
                            لا توجد شواغر معلنة حالياً. انقل للتبويب بالأعلى لإضافة واحدة.
                          </div>
                        ) : (
                          <div className="overflow-x-auto border border-slate-200 rounded-lg">
                            <table className="w-full text-right text-xs">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                                  <th className="p-3">المسمى الوظيفي الشاغر</th>
                                  <th className="p-3">القسم</th>
                                  <th className="p-3">الموقع / الدوام</th>
                                  <th className="p-3">الراتب المخصص</th>
                                  <th className="p-3 text-center">حالة التقديم</th>
                                  <th className="p-3 text-center">الإجراءات</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-150">
                                {jobs.map((j) => (
                                  <tr key={j.id} className="hover:bg-slate-50/50">
                                    <td className="p-3 font-black text-slate-900 text-right">{j.title}</td>
                                    <td className="p-3 text-slate-600 text-right">{j.department}</td>
                                    <td className="p-3 text-right">
                                      <span className="font-medium text-slate-800">{j.location}</span>
                                      <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 inline-block mr-1.5">
                                        {j.type === 'full-time' ? 'دوام كامل' : j.type === 'part-time' ? 'دوام جزئي' : 'عقد'}
                                      </span>
                                    </td>
                                    <td className="p-3 font-mono text-slate-800 text-right">{j.salary}</td>
                                    <td className="p-3 text-center">
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          const nextStatus = j.status === 'active' ? 'closed' : 'active';
                                          setJobs(prev => prev.map(item => item.id === j.id ? { ...item, status: nextStatus } : item));
                                        }}
                                        className={`inline-block text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer transition-all ${
                                          j.status === 'active' ? 'bg-emerald-50 text-emerald-800 border border-emerald-250/20' : 'bg-rose-50 text-rose-800 border border-rose-250/20'
                                        }`}
                                        title="انقر للتبديل السريع لحالة شاغر العمل"
                                      >
                                        {j.status === 'active' ? '● شاغر نشط ومفتوح' : 'مغلق مؤقتاً'}
                                      </button>
                                    </td>
                                    <td className="p-3 text-center">
                                      <div className="flex justify-center items-center gap-1">
                                        <button 
                                          type="button"
                                          onClick={() => {
                                            setAdminEditingJob(j);
                                            setAdminJobTitle(j.title);
                                            setAdminJobDepartment(j.department);
                                            setAdminJobLocation(j.location);
                                            setAdminJobType(j.type);
                                            setAdminJobSalary(j.salary);
                                            setAdminJobDescription(j.description);
                                            setAdminJobRequirements(j.requirements.join('\n'));
                                          }}
                                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold transition-all border border-slate-200 cursor-pointer"
                                        >
                                          تعديل
                                        </button>
                                        <button 
                                          type="button"
                                          onClick={() => {
                                            if (window.confirm('هل أنت متأكد من مسح هذه الوظيفة من قاعدة البيانات؟')) {
                                              setJobs(prev => prev.filter(item => item.id !== j.id));
                                            }
                                          }}
                                          className="p-1 text-red-650 hover:bg-red-50 hover:text-red-700 rounded border border-red-150 transition-all cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* SUB-VIEW 3: ANNOUNCEMENTS MANAGEMENT */}
                {adminJobSubTab === 'announcements' && (
                  <div className="bg-white rounded-xl shadow border border-slate-200 p-6 space-y-6">
                    
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 text-right">
                      <h4 className="font-extrabold text-slate-900 text-sm">إدارة التعاميم الرسمية وتحديثات المعاملات</h4>
                      
                      <button 
                        type="button"
                        onClick={() => {
                          if (adminEditingAnnouncement) {
                            setAdminEditingAnnouncement(null);
                          } else {
                            setAdminEditingAnnouncement({
                              id: `ann-${Date.now()}`,
                              title: '',
                              content: '',
                              category: 'news',
                              date: new Date().toISOString().split('T')[0],
                              isPinned: false,
                              mediaType: 'none',
                              mediaUrl: ''
                            });
                            setAdminAnnTitle('');
                            setAdminAnnContent('');
                            setAdminAnnCategory('news');
                            setAdminAnnIsPinned(false);
                            setAdminAnnMediaType('none');
                            setAdminAnnMediaUrl('');
                          }
                        }}
                        className="px-3.5 py-1.5 bg-slate-900 text-amber-500 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        {adminEditingAnnouncement ? 'إلغاء والعودة للقائمة' : '+ صياغة تعميم أو إعلان إداري جديد'}
                      </button>
                    </div>

                    {adminEditingAnnouncement ? (
                      /* Form content */
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!adminAnnTitle.trim() || !adminAnnContent.trim()) {
                            alert('يرجى ملء مسمى البيان ومحتواه.');
                            return;
                          }

                          const updatedAnnObj: Announcement = {
                            ...adminEditingAnnouncement,
                            title: adminAnnTitle.trim(),
                            content: adminAnnContent.trim(),
                            category: adminAnnCategory,
                            isPinned: adminAnnIsPinned,
                            mediaType: adminAnnMediaType,
                            mediaUrl: adminAnnMediaUrl
                          };

                          setAnnouncements(prev => {
                            if (prev.some(item => item.id === updatedAnnObj.id)) {
                              return prev.map(item => item.id === updatedAnnObj.id ? updatedAnnObj : item);
                            } else {
                              return [updatedAnnObj, ...prev];
                            }
                          });

                          setAdminEditingAnnouncement(null);
                        }}
                        className="space-y-4 max-w-xl bg-slate-50 p-5 rounded-xl border border-slate-150 text-right mx-auto"
                      >
                        <h4 className="font-extrabold text-slate-850 text-xs text-blue-600">
                          {adminEditingAnnouncement.title ? `تعديل التعميم: ${adminEditingAnnouncement.title}` : 'المواصفات العامة للبيان الجديد'}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">عنوان التعميم / الخبر <span className="text-rose-600">*</span></label>
                            <input 
                              type="text" 
                              required
                              placeholder="تعديل ساعات العمل الإداري بمكتب سماء المملكة"
                              value={adminAnnTitle}
                              onChange={(e) => setAdminAnnTitle(e.target.value)}
                              className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white focus:outline-hidden focus:border-amber-500 text-right"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">فئة ومجال التعميم</label>
                            <select 
                              value={adminAnnCategory}
                              onChange={(e) => setAdminAnnCategory(e.target.value as any)}
                              className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white focus:outline-hidden focus:border-amber-500"
                            >
                              <option value="alert">🚨 تعميم عاجل ونظامي (Alert)</option>
                              <option value="news">📢 مستجدات وأخبار عامة (News)</option>
                              <option value="offer">🏷️ عروض وباقات ترويجية (Promotions)</option>
                              <option value="holiday">📅 إجازات وجدول الأعياد (Holidays)</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">نص وتوضيح التعميم <span className="text-rose-600">*</span></label>
                          <textarea 
                            rows={5}
                            required
                            placeholder="اكتب التوجيهات الرسمية بوضوح متناهي..."
                            value={adminAnnContent}
                            onChange={(e) => setAdminAnnContent(e.target.value)}
                            className="w-full text-xs border border-slate-250 p-2.5 rounded-xl bg-white focus:outline-hidden focus:border-amber-500 text-right leading-relaxed"
                          />
                        </div>

                        {/* Media and Attachments section */}
                        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5 text-right font-sans">
                          <span className="text-xs font-black text-slate-800 flex items-center gap-1 border-b border-slate-100 pb-2">
                            <span>🖼️ ألبوم ترويج الميديا (المرفقات الصور والڤيديو)</span>
                          </span>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 mb-1">نوع المرفق الإعلاني</label>
                              <div className="flex gap-2">
                                {(
                                  [
                                    { value: 'none', label: 'نص فقط', icon: 'Text' },
                                    { value: 'image', label: 'صورة إعلانية', icon: 'Image' },
                                    { value: 'video', label: 'فيديو ترويجي', icon: 'Film' }
                                  ] as const
                                ).map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                      setAdminAnnMediaType(opt.value);
                                      if (opt.value === 'none') {
                                        setAdminAnnMediaUrl('');
                                      }
                                    }}
                                    className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                      adminAnnMediaType === opt.value
                                        ? 'bg-amber-500/10 border-amber-500 text-amber-800 font-extrabold shadow-2xs'
                                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                    }`}
                                  >
                                    {opt.value === 'image' && <Image className="w-3 h-3" />}
                                    {opt.value === 'video' && <Film className="w-3 h-3" />}
                                    <span>{opt.label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {adminAnnMediaType !== 'none' && (
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">تعليمات المرفقات الكبرى</label>
                                <div className="text-[10px] text-slate-400 leading-snug mt-1">
                                  بإمكانك رفع ملف مباشرة من جهازك (بحد أقصى 6MB للصور و15MB للفيديو) أو إدخال رابط خارجي مباشر.
                                </div>
                              </div>
                            )}
                          </div>

                          {adminAnnMediaType !== 'none' && (
                            <div className="space-y-3 pt-1 border-t border-slate-100">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                {/* Option A: File Upload */}
                                <div className="border border-dashed border-slate-300 rounded-xl p-3 bg-slate-50/50 flex flex-col items-center justify-center text-center relative group hover:bg-slate-50 transition-all min-h-24">
                                  <input 
                                    type="file" 
                                    accept={adminAnnMediaType === 'image' ? 'image/*' : 'video/*'}
                                    onChange={handleAnnMediaUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    disabled={adminAnnMediaFileUploading}
                                  />
                                  <div className="space-y-1">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto group-hover:bg-amber-100 group-hover:text-amber-700 transition-all">
                                      <Upload className="w-4 h-4" />
                                    </div>
                                    <div className="text-[10px] font-extrabold text-slate-750">
                                      {adminAnnMediaFileUploading ? 'جاري قراءة ورفع الملف...' : `اسحب أو انقر لرفع ${adminAnnMediaType === 'image' ? 'صورة' : 'فيديو'}`}
                                    </div>
                                    <div className="text-[9px] text-slate-400">صيغ مدعومة: JPG, PNG, WEBP, MP4</div>
                                  </div>

                                  {adminAnnMediaFileUploading && (
                                    <div className="absolute inset-0 bg-white/90 rounded-xl flex flex-col items-center justify-center p-3 animate-fade-in z-20">
                                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-1.5">
                                        <div 
                                          className="bg-amber-500 h-1 rounded-full transition-all duration-300" 
                                          style={{ width: `${adminAnnMediaUploadProgress || 10}%` }}
                                        />
                                      </div>
                                      <span className="text-[9px] font-bold text-slate-600 font-mono">
                                        {adminAnnMediaUploadProgress || 10}%
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Option B: URL Input */}
                                <div className="space-y-1.5 flex flex-col justify-center">
                                  <label className="block text-[10px] font-bold text-slate-500">أو أدخل رابط ويب مباشر للوسائط (URL):</label>
                                  <input 
                                    type="url" 
                                    placeholder={adminAnnMediaType === 'image' ? "https://example.com/banner.jpg" : "https://example.com/promo.mp4"}
                                    value={adminAnnMediaUrl.startsWith('data:') ? '' : adminAnnMediaUrl}
                                    onChange={(e) => setAdminAnnMediaUrl(e.target.value)}
                                    className="w-full text-xs font-mono border border-slate-250 p-2.5 rounded-xl bg-white focus:outline-hidden focus:border-amber-500 text-left"
                                  />
                                  {adminAnnMediaUrl.startsWith('data:') && (
                                    <div className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5">
                                      <span>✓ تم إرفاق الملف المرفوع بنجاح (مخزن محلياً)</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Attachment Preview Box */}
                              {adminAnnMediaUrl && (
                                <div className="mt-2 p-2.5 bg-slate-90 border border-slate-150 rounded-xl flex items-center justify-between gap-3 text-right bg-slate-50">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-105 flex items-center justify-center">
                                      {adminAnnMediaType === 'image' ? (
                                        <img src={adminAnnMediaUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      ) : (
                                        <video src={adminAnnMediaUrl} className="w-full h-full object-cover" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-[10px] font-black text-slate-800">العرض المسبق للمرفق</div>
                                      <div className="text-[9px] text-slate-400 font-mono truncate max-w-[200px]">{adminAnnMediaUrl}</div>
                                    </div>
                                  </div>
                                  
                                  <button
                                    type="button"
                                    onClick={() => setAdminAnnMediaUrl('')}
                                    className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-all border border-rose-150 flex items-center gap-1 text-[9px] font-bold cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>حذف المرفق</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 py-1 select-none">
                          <input 
                            type="checkbox" 
                            id="annPinnedCheck"
                            checked={adminAnnIsPinned}
                            onChange={(e) => setAdminAnnIsPinned(e.target.checked)}
                            className="w-4 h-4 cursor-pointer accent-amber-500"
                          />
                          <label htmlFor="annPinnedCheck" className="text-xs font-bold text-slate-850 cursor-pointer">
                            تثبيت هذا التعميم في صدارة صفحة التوظيف العامة (Pinned)
                          </label>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button 
                            type="button"
                            onClick={() => setAdminEditingAnnouncement(null)}
                            className="bg-slate-200 text-slate-705 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            إلغاء
                          </button>
                          <button 
                            type="submit"
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-6 py-2 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
                          >
                            بث ونشر التعميم فورياً
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* Listing of Announcements */
                      <div className="space-y-4 font-sans text-right">
                        {announcements.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl">
                            لا توجد بيانات تعاميم أو إعلانات مسجلة.
                          </div>
                        ) : (
                          <div className="overflow-x-auto border border-slate-200 rounded-lg">
                            <table className="w-full text-right text-xs">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                                  <th className="p-3">عنوان ونوع ومجال التعقيم الإداري</th>
                                  <th className="p-3 text-right">نص البيان والمحتوى المختصر</th>
                                  <th className="p-3">تاريخ البث</th>
                                  <th className="p-3 text-center">التثبيت بالقمة</th>
                                  <th className="p-3 text-center">الإجراءات والتحكم</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-150">
                                {announcements.map((a) => (
                                  <tr key={a.id} className="hover:bg-slate-50/50">
                                    <td className="p-3 text-right">
                                      <div className="font-extrabold text-slate-900">{a.title}</div>
                                      <span className={`text-[9px] font-black px-2 mt-1 inline-block rounded ${
                                        a.category === 'alert' ? 'bg-red-50 text-red-700 border border-red-150/20' :
                                        a.category === 'offer' ? 'bg-indigo-50 text-indigo-700 border border-indigo-150/20' :
                                        a.category === 'news' ? 'bg-blue-50 text-blue-700 border border-blue-150/20' :
                                        'bg-amber-50 text-amber-700 border border-amber-150/20'
                                      }`}>
                                        {a.category === 'alert' ? '🚨 بيان عاجل ونظامي' : 
                                         a.category === 'offer' ? '🏷️ عروض وباقات جديدة' : 
                                         a.category === 'news' ? '📢 مستجدات عامة' : '📅 إجازة تشغيلية'}
                                      </span>
                                    </td>
                                    <td className="p-3 text-right">
                                      <p className="text-slate-500 line-clamp-2 leading-relaxed">{a.content}</p>
                                    </td>
                                    <td className="p-3 font-mono text-slate-500 text-right">
                                      {new Date(a.date).toLocaleDateString('ar-SA')}
                                    </td>
                                    <td className="p-3 text-center">
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          setAnnouncements(prev => prev.map(item => item.id === a.id ? { ...item, isPinned: !item.isPinned } : item));
                                        }}
                                        className={`px-2 py-0.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                                          a.isPinned ? 'bg-amber-50 text-amber-750 border border-amber-200' : 'bg-slate-50 text-slate-400 border border-slate-200'
                                        }`}
                                      >
                                        {a.isPinned ? '★ مثبت متصدر' : 'تثبيت'}
                                      </button>
                                    </td>
                                    <td className="p-3 text-center">
                                      <div className="flex justify-center items-center gap-1">
                                        <button 
                                          type="button"
                                          onClick={() => {
                                            setAdminEditingAnnouncement(a);
                                            setAdminAnnTitle(a.title);
                                            setAdminAnnContent(a.content);
                                            setAdminAnnCategory(a.category);
                                            setAdminAnnIsPinned(!!a.isPinned);
                                            setAdminAnnMediaType(a.mediaType || 'none');
                                            setAdminAnnMediaUrl(a.mediaUrl || '');
                                          }}
                                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold transition-all border border-slate-200 cursor-pointer"
                                        >
                                          تعديل
                                        </button>
                                        <button 
                                          type="button"
                                          onClick={() => {
                                            if (window.confirm('هل أنت متأكد من مسح هذا التعميم نهائياً؟')) {
                                              setAnnouncements(prev => prev.filter(item => item.id !== a.id));
                                            }
                                          }}
                                          className="p-1 text-red-650 hover:bg-red-50 hover:text-red-700 rounded border border-red-150 transition-all cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

          </div>
        )}
      </main>

      {/* FOOTER GENERAL */}
      <footer className="bg-slate-950 text-slate-500 border-t border-slate-800 py-10 mt-16 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pb-6 border-b border-slate-900">
            <div>
              <div className="text-lg font-bold text-white mb-2">مكتب سما المملكة للخدمات المتكاملة</div>
              <p className="text-xs text-slate-400 max-w-xl leading-normal">
                المنصة الموحدة الذكية التابعة لمكتب سما المملكة للخدمات وتخليص المعاملات الإلكترونية الحكومية.
              </p>
            </div>
            
            {/* Social Media Links section */}
            <div className="flex flex-col items-center md:items-start gap-2.5">
              <span className="text-[11px] font-bold text-slate-400 self-center md:self-start">شبكات وعناوين التواصل الاجتماعي:</span>
              <div className="flex flex-wrap gap-2">
                {socialTwitter && (
                  <a href={socialTwitter} target="_blank" rel="noopener noreferrer" title="تابعنا على منصة X" className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-white rounded-lg transition-all shadow-sm">
                    <Twitter className="w-4 h-4" />
                  </a>
                )}
                {socialFacebook && (
                  <a href={socialFacebook} target="_blank" rel="noopener noreferrer" title="تابعنا على فيسبوك" className="p-2 bg-slate-900 hover:bg-blue-950 border border-slate-800 hover:border-blue-800 text-slate-350 hover:text-blue-550 rounded-lg transition-all shadow-sm">
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
                {socialInstagram && (
                  <a href={socialInstagram} target="_blank" rel="noopener noreferrer" title="تابعنا على إنستغرام" className="p-2 bg-slate-900 hover:bg-pink-950 border border-slate-800 hover:border-pink-800 text-slate-350 hover:text-pink-500 rounded-lg transition-all shadow-sm">
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {socialLinkedin && (
                  <a href={socialLinkedin} target="_blank" rel="noopener noreferrer" title="تابعنا على لينكد إن" className="p-2 bg-slate-900 hover:bg-sky-950 border border-slate-800 hover:border-sky-800 text-slate-350 hover:text-sky-500 rounded-lg transition-all shadow-sm">
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                {socialYoutube && (
                  <a href={socialYoutube} target="_blank" rel="noopener noreferrer" title="تابعنا على يوتيوب" className="p-2 bg-slate-900 hover:bg-red-950 border border-slate-800 hover:border-red-800 text-slate-350 hover:text-red-500 rounded-lg transition-all shadow-sm">
                    <Youtube className="w-4 h-4" />
                  </a>
                )}
                {socialSnapchat && (
                  <a href={socialSnapchat} target="_blank" rel="noopener noreferrer" title="تابعنا على سناب شات" className="p-2 bg-slate-900 hover:bg-yellow-950 border border-slate-800 hover:border-yellow-850 text-slate-350 hover:text-yellow-450 rounded-lg transition-all shadow-sm">
                    <Smartphone className="w-4 h-4" />
                  </a>
                )}
                {socialWhatsapp && (
                  <a href={socialWhatsapp} target="_blank" rel="noopener noreferrer" title="تواصل معنا عبر واتساب" className="p-2 bg-slate-900 hover:bg-emerald-950 border border-slate-800 hover:border-emerald-800 text-slate-350 hover:text-emerald-500 rounded-lg transition-all shadow-sm">
                    <PhoneCall className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Quick action footer tabs */}
            <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-400">
              <button onClick={() => { setActiveTab('home'); window.scrollTo(0,0); }} className="hover:text-amber-500">الرئيسية</button>
              <span>•</span>
              <button onClick={() => { setActiveTab('track'); window.scrollTo(0,0); }} className="hover:text-amber-500">الاستعلام المباشر</button>
              <span>•</span>
              <button onClick={() => { setActiveTab('admin'); window.scrollTo(0,0); }} className="hover:text-amber-500">منطقة الإدارة المالية</button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center text-[11px] gap-2">
            <div className="flex font-mono text-slate-500 gap-1.5">
              <span>VAT: 300065432100003</span>
              <span>•</span>
              <span className="text-slate-400 font-sans hover:underline cursor-pointer flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>الامتثال المفتوح ٢٠٢٦</span>
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* --- INTRATIVE MODALS & DIALOGS --- */}

      {/* Admin lock pin dialog passcode */}
      <PasscodeModal 
        isOpen={showPasscode}
        onClose={() => setShowPasscode(false)}
        onSuccess={handleAdminAuthSuccess}
      />

      {/* Invoice Details view & Printing dialog */}
      <InvoiceDetailModal 
        isOpen={isInvoiceOpen}
        onClose={() => {
          setIsInvoiceOpen(false);
          setSelectedTx(null);
          setDirectPrintActive(false);
          setInvoiceInitialPdfActive(false);
        }}
        transaction={selectedTx}
        lang={lang}
        triggerDirectPrint={directPrintActive}
        initialPdfPreview={invoiceInitialPdfActive}
      />

      {/* Batch Print and PDF Merging Hub */}
      <BatchPrintModal
        isOpen={isBatchPrintOpen}
        onClose={() => {
          setIsBatchPrintOpen(false);
        }}
        selectedTransactions={transactions.filter(t => selectedBatchTxIds.includes(t.id))}
        lang={lang}
      />

      {/* Checkout Online Payment dialogue */}
      <CheckoutPaymentModal 
        isOpen={isCheckoutOpen}
        onClose={() => {
          setIsCheckoutOpen(false);
          setCheckoutService(null);
        }}
        service={checkoutService}
        clientName={clientName}
        clientPhone={clientPhone}
        clientNotes={clientNotes}
        attachedFiles={attachedFiles}
        onPaymentSuccess={handleCheckoutSuccess}
        lang={lang}
      />

      {/* Hover Info Popup Service Details cards */}
      {infoPopupService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4" dir="rtl">
          <div className="w-full max-w-md bg-white border border-slate-900 p-6 rounded-lg shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                {renderServiceIcon(infoPopupService.icon, "w-5 h-5 text-amber-500")}
                <h4 className="font-extrabold text-slate-900 text-base">{infoPopupService.name}</h4>
              </div>
              <button 
                onClick={() => setInfoPopupService(null)} 
                className="text-slate-400 hover:text-slate-900 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed font-sans">
              <div>
                <strong className="block text-slate-800 text-xs font-bold mb-1">وصف الإجراء العام:</strong>
                <p>{infoPopupService.description}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 space-y-1.5 font-mono">
                {(() => {
                  const addFeesTotal = (infoPopupService.additionalFees || []).reduce((sum, f) => sum + f.amount, 0);
                  const taxOffice = infoPopupService.officeFee * 0.15;
                  const srvTotal = infoPopupService.govFee + infoPopupService.officeFee + taxOffice + addFeesTotal;

                  return (
                    <>
                      <p className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                        <span className="font-sans text-slate-500 block">تكاليف الدولة (الوزارات والجهات ورسوم المصدقة):</span>
                        <strong className="text-slate-900 font-bold block">{infoPopupService.govFee.toFixed(2)} ر.س</strong>
                      </p>
                      <p className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                        <span className="font-sans text-slate-500 block">أتعاب مراجعة مكتب سما المملكة الإستخلاصي:</span>
                        <strong className="text-slate-900 font-bold block">{infoPopupService.officeFee.toFixed(2)} ر.س</strong>
                      </p>
                      <p className="flex justify-between items-center bg-white p-2 rounded border border-slate-300">
                        <span className="font-sans text-slate-500 block">ضريبة القيمة المضافة المحسوبة (15%):</span>
                        <strong className="text-slate-700 block">{taxOffice.toFixed(2)} ر.س</strong>
                      </p>

                      {infoPopupService.additionalFees && infoPopupService.additionalFees.length > 0 && (
                        <div className="p-2 bg-indigo-50/50 border border-indigo-150 rounded space-y-1 text-[11px] font-sans">
                          <span className="text-indigo-950 font-bold block mb-1">الرسوم والمدفوعات الإضافية المخصصة:</span>
                          {infoPopupService.additionalFees.map(f => (
                            <p className="flex justify-between" key={f.id}>
                              <span className="text-slate-600 font-medium">{f.name}:</span>
                              <strong className="text-slate-900 font-mono">{f.amount.toFixed(2)} ر.س</strong>
                            </p>
                          ))}
                        </div>
                      )}

                      <p className="flex justify-between items-center bg-amber-50 p-2.5 rounded border border-amber-300 font-bold leading-normal text-amber-950 font-sans text-sm">
                        <span>الإجمالي الضريبي التقريبي:</span>
                        <span className="font-mono">{srvTotal.toFixed(2)} ر.س</span>
                      </p>
                    </>
                  );
                })()}
              </div>

              <div className="flex gap-2.5 items-start bg-blue-50/50 p-3 border border-blue-200 text-blue-800 rounded-lg text-[11px]">
                <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="font-medium leading-relaxed">
                  تحتسب الرسوم بصورة تفصيلية معلنة ولا توجد عمولات مبطنة. سيقوم مراجع الإجراء بالجهة بتسليمك إشعار الفاتورة الضريبية فور اكتمال تعميد الأوراق.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setSelectedServiceId(infoPopupService.id);
                  setInfoPopupService(null);
                  document.getElementById('booking-anchor')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full bg-slate-950 hover:bg-slate-800 text-white py-2.5 font-extrabold rounded text-xs text-center transition-colors"
              >
                المضي قدماً بطلب {infoPopupService.name}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADMIN DOCUMENT VIEWER MODAL DIALOG --- */}
      {selectedViewBooking && (() => {
        const modalFiles = getBookingFiles(selectedViewBooking);
        const activeFile = previewFile || modalFiles[0];
        
        if (!activeFile) return null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" dir="rtl">
            <div className="w-full max-w-4xl bg-white border border-slate-900 p-6 rounded-xl shadow-2xl space-y-4 font-sans flex flex-col md:flex-row gap-6 relative">
              
              {/* Sidebar File Selector (Only if there are multiple files) */}
              {modalFiles.length > 1 && (
                <div className="w-full md:w-64 border-l border-slate-200 pl-4 flex flex-col space-y-2 flex-shrink-0">
                  <h5 className="font-extrabold text-xs text-slate-500 tracking-wider mb-2">قائمة المستندات المرفقة ({modalFiles.length}):</h5>
                  <div className="space-y-1.5 max-h-[450px] overflow-y-auto">
                    {modalFiles.map((file, idx) => {
                      const isActive = activeFile.name === file.name;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPreviewFile(file)}
                          className={`w-full text-right p-2.5 rounded-lg border text-xs font-bold transition-all flex items-start gap-2.5 ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-950 border-emerald-300 ring-1 ring-emerald-300'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <Paperclip className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <div className="min-w-0 flex-1">
                            <span className="block truncate" title={file.name}>{file.name}</span>
                            <span className="block text-[9px] font-mono text-slate-400 mt-0.5">({file.size})</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Main Document Viewer Container */}
              <div className="flex-1 space-y-4 min-w-0">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-150">
                      <Paperclip className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-950 text-base">بوابة استعراض الوثائق والمستندات الرسمية</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">طلب تعقيب رقم: #{selectedViewBooking.id.substring(3, 9)} للعميل المستفيد: <strong className="text-slate-850 font-bold">{selectedViewBooking.clientName}</strong></p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedViewBooking(null);
                      setPreviewFile(null);
                    }} 
                    className="text-slate-400 hover:text-slate-900 text-lg font-bold p-1 hover:bg-slate-50 rounded transition cursor-pointer"
                    title="إغلاق النافذة"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-[#f8fafc] border border-slate-200 rounded-lg p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="text-slate-700 truncate">
                        <span className="text-slate-400">اسم الملف المعروض:</span> <strong className="font-sans text-slate-900 select-all" title={activeFile.name}>{activeFile.name}</strong>
                      </p>
                      <p className="text-slate-700">
                        <span className="text-slate-400">حجم المستند:</span> <strong className="font-mono text-slate-800">{activeFile.size}</strong>
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <a
                        href={activeFile.data}
                        download={activeFile.name}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded shadow-sm text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>تحميل المستند PDF (دقة كاملة)</span>
                      </a>
                    </div>
                  </div>

                  {/* View Container Frame */}
                  <div className="bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                    <object
                      data={activeFile.data}
                      type="application/pdf"
                      className="w-full h-[450px]"
                    >
                      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 bg-white h-[450px]">
                        <div className="bg-amber-50 p-3 rounded-full border border-amber-200">
                          <FileText className="w-10 h-10 text-amber-600" />
                        </div>
                        <div className="space-y-1.5">
                          <h5 className="font-black text-slate-900 text-sm">استعراض PDF التفاعلي غير مدعوم مباشرة في متصفحك</h5>
                          <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                            يتعذر إظهار المستند بصيغة PDF مدمجة بسبب قيود العرض الأمنية لبيئة التصفح الحالية. يرجى الضغط على الزر الأخضر بالأعلى لتنزيله مطلعاً عليه بمرونة تامة.
                          </p>
                        </div>
                        <a
                          href={activeFile.data}
                          download={activeFile.name}
                          className="bg-slate-950 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded text-xs inline-flex items-center gap-1.5 shadow transition-colors animate-pulse"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>تنزيل الملف {activeFile.name}</span>
                        </a>
                      </div>
                    </object>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedViewBooking(null);
                      setPreviewFile(null);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2 rounded text-xs font-bold transition-colors cursor-pointer"
                  >
                    إغلاق مساحة المعاينة
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* --- SERVICE DELETE CONFIRMATION DIALOG MODAL --- */}
      {serviceToDeleteCheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in" dir="rtl">
          <div className="w-full max-w-md bg-white border border-slate-300 rounded-2xl shadow-2xl overflow-hidden font-sans transform transition-all">
            {/* Header Red Warning style */}
            <div className="bg-red-50 border-b border-red-100 p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-650 animate-pulse flex-shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm">تأكيد حذف الخدمة نهائياً</h4>
                <p className="text-[10px] text-red-700 font-bold mt-0.5">تنبيه ذو أهمية قصوى لمنع الفقدان المفاجئ للبيانات</p>
              </div>
            </div>

            {/* Warning Content */}
            <div className="p-5 space-y-4">
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1.5">
                <span className="text-[10px] text-slate-400 block font-bold">المعاملة المستهدفة بالحذف:</span>
                <span className="font-extrabold text-slate-850 text-sm block">{serviceToDeleteCheck.name}</span>
                <span className="inline-block text-[9px] font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded mr-0.5">
                  📁 {getCategoryName(serviceToDeleteCheck.category)}
                </span>
              </div>

              <p className="text-slate-600 text-xs leading-relaxed">
                إن حذف هذه الخدمة سيؤدي بمفعول فوري ومستمر إلى إزالتها كلياً من كافة قوائم اختيار واستمارات حجز العملاء (الواجهات العامة والخاصة بالمستخدمين) بالإضافة إلى جميع المراجع والروابط الداخلية النشطة بلوحة تحكم النظام.
              </p>
              <p className="text-slate-750 text-xs font-bold leading-relaxed text-slate-800">
                هل تريد الاستمرار بمتابعة الحذف الفعلي لهذه الخدمة وتأكيد الإجراء، أم تود التراجع والإلغاء؟
              </p>

              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-900 text-[10px] font-semibold leading-relaxed">
                ⚠️ <strong className="text-amber-950 font-black">ملاحظة محاسبية:</strong> الحذف لا يؤثر على التقارير المالية والقيود المحاسبية التاريخية المسجلة مسبقاً في الدفتر المالي؛ بل يمنع الحجوزات المستقبلية فقط.
              </div>
            </div>

            {/* Action buttons */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setServiceToDeleteCheck(null)}
                className="px-4 py-2 bg-white hover:bg-slate-105 text-slate-700 font-bold rounded-xl border border-slate-300 transition text-xs"
              >
                تراجع وإلغاء
              </button>
              <button
                type="button"
                onClick={confirmDeleteService}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-md transition text-xs"
              >
                تأكيد حذف الخدمة نهائياً
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CANNOT DELETE ALERT DIALOG --- */}
      {showCannotDeleteAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 animate-fade-in" dir="rtl">
          <div className="w-full max-w-sm bg-white border border-slate-300 rounded-2xl shadow-2xl overflow-hidden font-sans transform transition-all">
            {/* Header Block */}
            <div className="bg-amber-50 border-b border-amber-100 p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm">إجراء غير مسموح بنظام سما</h4>
                <p className="text-[10px] text-amber-800 font-bold mt-0.5">ضوابط الحد الأدنى من الدليل النشط</p>
              </div>
            </div>

            {/* Content info */}
            <div className="p-5 space-y-3.5">
              <p className="text-slate-650 text-xs leading-normal">
                عذراً، يجب أن تحتفظ منصة مكتب سما المملكة <strong className="text-slate-900 font-bold">بخدمة واحدة نشطة على الأقل</strong> في قاعدة البيانات لتجنب تعطل لوحة استمارات الحجز الذاتية وتلف واجهة المستفيدين.
              </p>
              <p className="text-slate-500 text-[11px] leading-normal font-sans">
                💡 يرجى إضافة الخدمة البديلة الجديدة وتفعيلها أولاً، ثم العودة لإلغاء أو تعديل أو مسح هذه الخدمة الحالية بأمان تام.
              </p>
            </div>

            {/* Close footer button */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCannotDeleteAlert(false)}
                className="w-full sm:w-auto px-6 py-2 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-xl transition text-xs text-center"
              >
                حسناً، فهمت ذلك
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Smart Appearance and Spiritual Background Controller */}
      {showBgSelector && (
        <div className="fixed bottom-4 left-4 z-40 hidden md:flex flex-col items-end gap-2 font-sans select-none animate-fade-in">
          {isBgSelectorCollapsed ? (
            /* Tiny elegant closed floating circle badge */
            <div className="flex items-center gap-1 bg-slate-900/95 backdrop-blur-md text-white border border-slate-800 hover:border-amber-400/60 rounded-xl p-1 shadow-2xl transition-all duration-300 hover:scale-105">
              <button
                type="button"
                onClick={() => setIsBgSelectorCollapsed(false)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-amber-400 hover:text-amber-300 transition-all cursor-pointer font-black"
                title="ذكاء المظهر والخلفيات الإيمانية"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="text-[10px] tracking-tight">مظهر مكة الذكي</span>
              </button>
              
              <button
                type="button"
                onClick={() => setShowBgSelector(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                title="إخفاء هذا الزر بالكامل (يمكنك إعادته من لوحة المدراء)"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            /* Expanded widget card */
            <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-800 rounded-2xl p-3.5 shadow-2xl space-y-3 w-64 transition-all duration-305 relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <div className="bg-amber-500/10 p-1 rounded-lg border border-amber-500/20 text-amber-500">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10.5px] font-black text-slate-100 block">ذكاء المظهر والخلفيات</span>
                    <span className="text-[8.5px] text-slate-400 block mt-0.5">مزامنة توقيت العاصمة المقدسة</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {/* Minimize button */}
                  <button
                    type="button"
                    onClick={() => setIsBgSelectorCollapsed(true)}
                    className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="تصغير الأيقونة"
                  >
                    <Minimize2 className="w-3 h-3" />
                  </button>
                  {/* Close button */}
                  <button
                    type="button"
                    onClick={() => setShowBgSelector(false)}
                    className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                    title="إخفاء تماماً من الشاشة"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Strategy selectors */}
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-300 block pr-0.5">اختيار السمة الروحية للمسجد الحرام:</span>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setBgStrategy('ai')}
                    className={`py-1.5 px-2 rounded-lg font-bold border flex items-center justify-center gap-1 transition-all ${
                      bgStrategy === 'ai' 
                        ? 'bg-amber-600 text-slate-950 border-amber-400 shadow-sm' 
                        : 'bg-slate-950/50 hover:bg-slate-800 text-slate-200 border-slate-850'
                    }`}
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>تحديد ذكي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBgStrategy('sunrise')}
                    className={`py-1.5 px-2 rounded-lg font-bold border flex items-center justify-center gap-1 transition-all ${
                      bgStrategy === 'sunrise' 
                        ? 'bg-amber-600 text-slate-950 border-amber-400 shadow-sm' 
                        : 'bg-slate-950/50 hover:bg-slate-800 text-slate-200 border-slate-850'
                    }`}
                  >
                    <Sun className="w-2.5 h-2.5" />
                    <span>شروق مكة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBgStrategy('sunset')}
                    className={`py-1.5 px-2 rounded-lg font-bold border flex items-center justify-center gap-1 transition-all ${
                      bgStrategy === 'sunset' 
                        ? 'bg-amber-600 text-slate-950 border-amber-400 shadow-sm' 
                        : 'bg-slate-950/50 hover:bg-slate-800 text-slate-200 border-slate-850'
                    }`}
                  >
                    <Sun className="w-2.5 h-2.5" />
                    <span>غروب مكة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBgStrategy('night')}
                    className={`py-1.5 px-2 rounded-lg font-bold border flex items-center justify-center gap-1 transition-all ${
                      bgStrategy === 'night' 
                        ? 'bg-amber-600 text-slate-950 border-amber-400 shadow-sm' 
                        : 'bg-slate-950/50 hover:bg-slate-800 text-slate-200 border-slate-850'
                    }`}
                  >
                    <Moon className="w-2.5 h-2.5" />
                    <span>ليل مكة</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-855 text-[8.5px] text-slate-300 leading-relaxed font-sans text-right flex justify-between">
                <span>السمة الحالية:</span>
                <strong className="text-amber-400 font-extrabold">{getBgNameAr(bgStrategy)}</strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toast Feedback for Real-Time WhatsApp Notifications */}
      {waToast && waToast.show && (
        <div className="fixed bottom-6 left-6 z-50 max-w-md w-full sm:w-[440px] bg-slate-900 border border-slate-800 text-white p-4 rounded-xl shadow-2xl animate-fade-in font-sans" dir="rtl">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg flex-shrink-0 ${
              waToast.type === 'loading' ? 'bg-indigo-500/10 text-indigo-400' :
              waToast.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
              'bg-red-500/10 text-red-400'
            }`}>
              {waToast.type === 'loading' && (
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {waToast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
              {waToast.type === 'error' && <AlertCircle className="w-5 h-5" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-amber-400 tracking-wider uppercase block">
                  {waToast.type === 'loading' && 'جاري بث الإشعار الفوري...'}
                  {waToast.type === 'success' && 'البوابة الإلكترونية: تم البث بنجاح'}
                  {waToast.type === 'error' && 'البوابة الإلكترونية: خطأ في البث'}
                </span>
                <button 
                  onClick={() => setWaToast(null)}
                  className="text-slate-500 hover:text-slate-300 text-xs font-bold font-sans cursor-pointer transition-colors"
                >
                  إغلاق
                </button>
              </div>
              
              <h4 className="text-[12px] font-bold text-slate-150 mt-1">{waToast.message}</h4>
              
              <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-lg text-[10px] text-slate-400 mt-2 font-mono whitespace-pre-wrap leading-relaxed max-h-[140px] overflow-y-auto">
                <div className="border-b border-slate-900 pb-1 mb-1 font-sans font-extrabold text-slate-500 flex justify-between select-none">
                  <span>تفاصيل الرسالة المرسلة:</span>
                  <span className="text-emerald-500 text-[9px]">WhatsApp Gateway</span>
                </div>
                {waToast.details}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FIXED FLOATING NEWS & REGULATIONS WIDGET */}
      <button
        type="button"
        onClick={() => setIsNewsModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full sm:rounded-2xl shadow-xl border border-blue-400/30 hover:scale-105 active:scale-95 transition-all duration-300 animate-bounce cursor-pointer select-none group"
        title={lang === 'ar' ? 'موجز قرارات وزارة الموارد البشرية والعمل 2026' : 'MHRSD Regulations Summary 2026'}
      >
        <div className="relative">
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
        </div>
        <span className="text-xs font-extrabold max-w-0 group-hover:max-w-xs sm:max-w-xs overflow-hidden transition-all duration-500 whitespace-nowrap block font-sans">
          {lang === 'ar' ? 'موجز الأنظمة والقرارات' : 'MHRSD Summary'}
        </span>
      </button>

      {/* MHRSD, Qiwa, and Musaned news & updates summary modal */}
      {isNewsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4" dir={lang === 'en' ? 'ltr' : 'rtl'}>
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] font-sans text-right">
            
            {/* Modal Header */}
            <div className={`bg-gradient-to-l from-slate-950 to-slate-900 border-b border-slate-800 p-5 md:p-6 flex justify-between items-center relative ${lang === 'en' ? 'flex-row-reverse' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50/5 border border-blue-550/20 flex items-center justify-center text-blue-400">
                  <Sparkles className="w-5.5 h-5.5 animate-pulse text-blue-400" />
                </div>
                <div className="space-y-0.5 text-right">
                  <h4 className="font-extrabold text-white text-base md:text-lg">
                    {lang === 'ar' ? 'موجز الأنظمة والقرارات الرسمية لمكتب سما المملكة' : 'Sama Al-Mamlakah Official Regulations Summary'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {lang === 'ar' ? 'وزارة الموارد البشرية والتنمية الاجتماعية • منصة قوى • منصة مساند' : 'MHRSD • Qiwa • Musaned Platforms Log'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsNewsModalOpen(false)} 
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold border border-slate-755 transition-colors cursor-pointer"
                title={lang === 'ar' ? 'إغلاق النافذة' : 'Close window'}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className={`p-6 md:p-8 overflow-y-auto space-y-6 flex-1 text-slate-100 ${lang === 'en' ? 'text-left' : 'text-right'}`}>
              
              {/* Grounding Tool info segment */}
              <div className={`bg-blue-950/35 border border-blue-900/40 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-right ${lang === 'en' ? 'flex-row-reverse text-left' : ''}`}>
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[10px] font-black border border-blue-500/20 uppercase tracking-widest">
                    {lang === 'ar' ? 'التحقق المعرفي الفوري (Grounding)' : 'Live Semantic Grounding Enabled'}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {lang === 'ar'
                      ? 'البوابة متصلة مباشرة بالنموذج المعرفي وفهرسة البحث الفوري لوزارة العمل بموجب قوانين ومراسيم عام 2026.'
                      : 'The portal is bound directly to live search index for accurate, verified, and audited regulatory information.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fetchLaborNews}
                  disabled={isNewsLoading}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-lg shadow-sm transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isNewsLoading ? 'animate-spin' : ''}`} />
                  <span>{isNewsLoading ? (lang === 'ar' ? 'يجري جلب وتحليل المستجدات...' : 'Updating...') : (lang === 'ar' ? 'تحديث الأخبار الآن' : 'Refresh News Live')}</span>
                </button>
              </div>

              {/* News Text display or loading state */}
              {isNewsLoading ? (
                <div className="bg-slate-950/45 border border-slate-850 rounded-xl p-12 flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="relative flex h-10 w-10">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-10 w-10 bg-blue-500 items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-white animate-spin" />
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-200">{lang === 'ar' ? 'يجري تنشيط محرك البحث وجلب المستجدات فورا...' : 'Querying MHRSD databases via search index...'}</p>
                    <p className="text-[10px] text-slate-500">{lang === 'ar' ? 'نقوم بتحليل وفهرسة السجلات التنظيمية لمنصة قوى ومساند والوزارة...' : 'Fusing and validating regulatory documents for 2026'}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Markdown or formatted output */}
                  <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-5 md:p-6 shadow-inner text-right relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500"></div>
                    <div className={`prose prose-invert prose-xs max-w-none text-slate-200 leading-relaxed font-sans whitespace-pre-wrap text-xs md:text-sm ${lang === 'en' ? 'text-left' : 'text-right'}`}>
                      {laborNews || (lang === 'ar' ? "انقر فوق زر تحديث الأخبار لعرض مستجدات العمل والعمالة بالتأصيل الحي." : "No updates fetched. Please trigger the live updates button.") }
                    </div>
                  </div>

                  {/* Sources Citations */}
                  {laborNewsSources && laborNewsSources.length > 0 && (
                    <div className="space-y-3 font-sans">
                      <h5 className={`text-xs font-extrabold text-slate-300 flex items-center gap-1 ${lang === 'en' ? 'justify-start' : 'justify-start'}`}>
                        <span>🔗</span>
                        <span>{lang === 'ar' ? 'مراجع وقنوات التحقق والتأصيل الرقمي (Verified References):' : 'Grounding Sources & Official Channels:'}</span>
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {laborNewsSources.map((src, idx) => (
                          <a
                            key={idx}
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-800 hover:border-blue-500/40 rounded-lg text-xs text-blue-400 hover:text-blue-300 transition-all font-bold group"
                          >
                            <span className="truncate max-w-[85%] text-right">{src.title}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* System State Notice */}
                  <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-xl text-[10px] sm:text-xs text-slate-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>
                      {lang === 'ar'
                        ? 'مكتب سما المملكة مرخص ومسجل بالكامل ومطابق لمعايير رقابة وزارة الموارد البشرية والعمل السعودية لعام 2026.'
                        : 'Sama Al-Mamlakah Office is actively audited, compliant and fully licensed under MHRSD regulations of Saudi Arabia for 2026.'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={`bg-slate-950 border-t border-slate-800 p-4 flex gap-3 font-bold text-xs ${lang === 'en' ? 'justify-start' : 'justify-end'}`}>
              <button
                type="button"
                onClick={() => setIsNewsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all border border-slate-750 hover:border-slate-700 cursor-pointer"
              >
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
