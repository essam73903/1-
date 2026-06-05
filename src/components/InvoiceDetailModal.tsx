import React, { useState } from 'react';
import { X, Printer, Download, Receipt, Building, Calendar, User, FileText, CheckCircle2, Sparkles, MessageSquare, Send, Eye } from 'lucide-react';
import { Transaction } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface CountryBankInfo {
  code: string;
  nameAr: string;
  nameEn: string;
  flag: string;
  bankNameAr: string;
  bankNameEn: string;
  beneficiaryAr: string;
  beneficiaryEn: string;
  iban: string;
  swift: string;
  currencyAr: string;
  currencyEn: string;
  exchangeRate: number; // rate against 1 SAR
  notesAr: string;
  notesEn: string;
}

const COUNTRIES_BANKS: CountryBankInfo[] = [
  {
    code: 'SA',
    nameAr: 'المملكة العربية السعودية',
    nameEn: 'Saudi Arabia',
    flag: '🇸🇦',
    bankNameAr: 'مصرف الراجحي المعتمد',
    bankNameEn: 'Al Rajhi Bank (HQ)',
    beneficiaryAr: 'مؤسسة سما المملكة لخدمات التعقيب',
    beneficiaryEn: 'Sama Al-Mamlakah Government Bureau',
    iban: 'SA93 8000 0000 1234 5678 9012',
    swift: 'RJHIYARI',
    currencyAr: 'ر.س',
    currencyEn: 'SAR',
    exchangeRate: 1.0,
    notesAr: 'يرجى كتابة رقم الحوالة يدوياً بعد إتمام التحويل والخصم من الحساب',
    notesEn: 'Write down Al Rajhi reference info manually after transfer'
  },
  {
    code: 'AE',
    nameAr: 'الإمارات العربية المتحدة',
    nameEn: 'United Arab Emirates',
    flag: '🇦🇪',
    bankNameAr: 'بنك أبوظبي الأول (FAB)',
    bankNameEn: 'First Abu Dhabi Bank (FAB)',
    beneficiaryAr: 'مكتب سما المملكة للخدمات المعتمدة - الفرع الإقليمي',
    beneficiaryEn: 'Sama Al-Mamlakah Regional Office',
    iban: 'AE72 0210 0000 0112 3456 7890',
    swift: 'FABUAEADXXX',
    currencyAr: 'د.إ',
    currencyEn: 'AED',
    exchangeRate: 0.978,
    notesAr: 'التحويل المحلي الفوري بالدرهم الإماراتي يخضع لنظام المقاصة الإماراتي السريع',
    notesEn: 'Instant domestic transfer is governed by UAE local clearing rules'
  },
  {
    code: 'QA',
    nameAr: 'دولة قطر',
    nameEn: 'Qatar',
    flag: '🇶🇦',
    bankNameAr: 'بنك قطر الوطني (QNB)',
    bankNameEn: 'Qatar National Bank (QNB)',
    beneficiaryAr: 'مؤسسة سما المملكة للتعقيب والخدمات الضريبية',
    beneficiaryEn: 'Sama Al-Mamlakah Tax & Clearing Services',
    iban: 'QA41 QNBA 0000 0000 1234 5678 9011',
    swift: 'QNBAQAQA',
    currencyAr: 'ر.ق',
    currencyEn: 'QAR',
    exchangeRate: 0.971,
    notesAr: 'يرجى إرفاق رقم العملية القطرية الموحدة وتدوين مرجع التحويل الفوري',
    notesEn: 'Please declare the Qatari unified transfer reference code'
  },
  {
    code: 'KW',
    nameAr: 'دولة الكويت',
    nameEn: 'Kuwait',
    flag: '🇰🇼',
    bankNameAr: 'بنك الكويت الوطني (NBK)',
    bankNameEn: 'National Bank of Kuwait (NBK)',
    beneficiaryAr: 'مكتب سما المملكة لخدمات التعقيب والاستشارات',
    beneficiaryEn: 'Sama Al-Mamlakah Consulting & Clearing',
    iban: 'KW43 NBOK 0000 0000 1234 5678 9012',
    swift: 'NBOKKWKW',
    currencyAr: 'د.ك',
    currencyEn: 'KWD',
    exchangeRate: 0.082,
    notesAr: 'خاضع لتعليمات التحويل الفوري الخاص ببنوك دولة الكويت عبر نظام (K-Net)',
    notesEn: 'All settling values must confirm K-Net local clearing reference numbers'
  },
  {
    code: 'OM',
    nameAr: 'سلطنة عمان',
    nameEn: 'Oman',
    flag: '🇴🇲',
    bankNameAr: 'بنك مسقط المركزي (Bank Muscat)',
    bankNameEn: 'Bank Muscat',
    beneficiaryAr: 'مكتب سما المملكة لخدمات وتسهيل المعاملات الحكومية',
    beneficiaryEn: 'Sama Al-Mamlakah Government Facilities',
    iban: 'OM62 BMUS 0000 0012 3456 7890 1234',
    swift: 'BMUSOMOM',
    currencyAr: 'ر.ع',
    currencyEn: 'OMR',
    exchangeRate: 0.103,
    notesAr: 'يرجى إدراج وثيقة الحوالة البنكية المباشرة مضافاً إليها رقم مرجع الوفاء العماني',
    notesEn: 'Please supply Bank Muscat receipt or local clearing receipt reference'
  },
  {
    code: 'BH',
    nameAr: 'مملكة البحرين',
    nameEn: 'Bahrain',
    flag: '🇧🇭',
    bankNameAr: 'بنك البحرين الوطني (NBB)',
    bankNameEn: 'National Bank of Bahrain (NBB)',
    beneficiaryAr: 'مؤسسة سما المملكة لخدمات ومعاملات الخليج المعتمدة',
    beneficiaryEn: 'Sama Al-Mamlakah GCC Authorized Services',
    iban: 'BH29 NBBB 0000 0012 3456 7890',
    swift: 'NBBBBHBH',
    currencyAr: 'د.ب',
    currencyEn: 'BHD',
    exchangeRate: 0.100,
    notesAr: 'التسوية بالدينار البحريني خاضعة لنظام المحول المالي الإلكتروني (Fawri+)',
    notesEn: 'Payments via NBB settle under Electronic Fund Transfer System (Fawri+)'
  },
  {
    code: 'EG',
    nameAr: 'جمهورية مصر العربية',
    nameEn: 'Egypt',
    flag: '🇪🇬',
    bankNameAr: 'البنك الأهلي المصري (NBE) أو إنستاباي',
    bankNameEn: 'National Bank of Egypt & InstaPay',
    beneficiaryAr: 'مكتب سما المملكة لخدمات التعقيب وعلاقات المغتربين',
    beneficiaryEn: 'Sama Al-Mamlakah Govt Services & Expats Agency',
    iban: 'EG91 0003 0000 1234 5678 9012 345',
    swift: 'NBEGEGCX',
    currencyAr: 'ج.م',
    currencyEn: 'EGP',
    exchangeRate: 12.85,
    notesAr: 'التحويل من الحسابات المصرية يتطلب رقم المعاملة البنكية المحلية عبر إنستاباي أو إشعار البنك',
    notesEn: 'Egyptian Pound clearing requires InstaPay validation code or National Bank receipt upload'
  },
  {
    code: 'YE',
    nameAr: 'الجمهورية اليمنية',
    nameEn: 'Yemen',
    flag: '🇾🇪',
    bankNameAr: 'بنك الكريمي الإسلامي أو المحافظ الإلكترونية',
    bankNameEn: 'Al Kuraimi Bank & E-Wallets (Jawwal Pay / One Cash)',
    beneficiaryAr: 'مكتب سما المملكة للخدمات والتعقيب - فرع اليمن والتسويات',
    beneficiaryEn: 'Sama Al-Mamlakah Govt Services - Yemen Branch & Settlements',
    iban: 'YE39 KEMI 0215 1245 6789 2211 0000',
    swift: 'KEMIYEAAXXX',
    currencyAr: 'ر.ي',
    currencyEn: 'YER',
    exchangeRate: 143.50,
    notesAr: 'التحويل متاح لحساب بنك الكريمي الرسمي أو عبر المحافظ الإلكترونية (كريمي جوال / ون كاش / جوال باي) بموجب سعر الصرف المعتمد والمثبت بالإشعار.',
    notesEn: 'Settle directly to Al Kuraimi Bank or via Yemeni Mobile Wallets (Kuraimi Pay, One Cash, or Jawwal Pay). Please upload transaction confirmation.'
  },
  {
    code: 'JO',
    nameAr: 'المملكة الأردنية الهاشمية',
    nameEn: 'Jordan',
    flag: '🇯🇴',
    bankNameAr: 'البنك العربي والمحفظة الوطنية (CliQ)',
    bankNameEn: 'Arab Bank & CliQ Jordan',
    beneficiaryAr: 'مكتب سما المملكة لخدمات المعاملات والاستشارات بالأردن',
    beneficiaryEn: 'Sama Al-Mamlakah Bureau Services - Jordan',
    iban: 'JO52 ARAB 1100 0012 3456 7890 0000',
    swift: 'ARABJOAMXXX',
    currencyAr: 'د.أ',
    currencyEn: 'JOD',
    exchangeRate: 0.189,
    notesAr: 'التحويل فوري ومتاح عبر تطبيق كليك (CliQ) أو الحوالات المباشرة لدى البنك العربي بموجب رقم الآيبان.',
    notesEn: 'Instant domestic transfer is enabled through CliQ app or standard Arab Bank IBAN wire. Please indicate reference.'
  },
  {
    code: 'IQ',
    nameAr: 'جمهورية العراق',
    nameEn: 'Iraq',
    flag: '🇮🇶',
    bankNameAr: 'مصرف التجارة العراقي (TBI) أو زين كاش',
    bankNameEn: 'Trade Bank of Iraq (TBI) & Zain Cash',
    beneficiaryAr: 'سما المملكة لمتابعة وتسهيل المعاملات الضريبية بجامعة الدول العربية',
    beneficiaryEn: 'Sama Al-Mamlakah Corporate & Govt Liaison Office - Iraq',
    iban: 'IQ22 TBII 0041 1234 5678 0000',
    swift: 'TBIIIQBGXXX',
    currencyAr: 'د.ع',
    currencyEn: 'IQD',
    exchangeRate: 346.50,
    notesAr: 'التسوية مقبولة بالدولار الأمريكي أو الدينار العراقي عبر تحويل حساب بنك TBI أو زين كاش بموجب إشعار منسق.',
    notesEn: 'Available in USD or Local IQD at prevailing central bank rates via TBI or Zain Cash. Attach transaction receipt.'
  },
  {
    code: 'SD',
    nameAr: 'جمهورية السودان',
    nameEn: 'Sudan',
    flag: '🇸🇩',
    bankNameAr: 'بنك الخرطوم (نظام بنكك)',
    bankNameEn: 'Bank of Khartoum (BOK - MBOK App)',
    beneficiaryAr: 'فريق تسويات سما المملكة للخدمات العابرة والتعقيب المالي',
    beneficiaryEn: 'Sama Al-Mamlakah Crossborder Settlement Desk',
    iban: 'SD14 BOKH 0011 2345 6789 0000',
    swift: 'BOKHSDKHXXX',
    currencyAr: 'ج.س',
    currencyEn: 'SDG',
    exchangeRate: 160.0,
    notesAr: 'يرجى التحويل إلى حسابنا المخصص بنك الخرطوم وإدخال الرقم المرجعي الظاهر في إيصال (بنكك) لإتمام المراجعة.',
    notesEn: 'Settle securely via BOK MBOK application and fill the 12-digit transaction index manually.'
  },
  {
    code: 'SY',
    nameAr: 'الجمهورية العربية السورية',
    nameEn: 'Syria',
    flag: '🇸🇾',
    bankNameAr: 'شبكة الهرم أو الفؤاد أو الحوالات السريعة',
    bankNameEn: 'Syrian Fast Money Transfer Network (Al-Haram / Al-Foad)',
    beneficiaryAr: 'وكيل مكتب سما المملكة المعتمد للتسويات وتخليص المعاملات',
    beneficiaryEn: 'Sama Al-Mamlakah Settlement Trustee Office',
    iban: 'SY14 SYCB 0010 1122 3344 5566 7788',
    swift: 'SYCBSYDAXXX',
    currencyAr: 'ل.س',
    currencyEn: 'SYP',
    exchangeRate: 3460.0,
    notesAr: 'الرجاء إرفاق رمز الحوالة الصادر من شبكة الهرم أو الفؤاد لتسديد الرسوم مباشرة.',
    notesEn: 'Kindly provide Al-Haram or Al-Foad fast transfer control number (MTCN Equivalent).'
  },
  {
    code: 'LB',
    nameAr: 'الجمهورية اللبنانية',
    nameEn: 'Lebanon',
    flag: '🇱🇧',
    bankNameAr: 'بنك بيروت أو شبكة OMT / وسترن يونيون المعتمدة',
    bankNameEn: 'Bank of Beirut or OMT Network (Western Union)',
    beneficiaryAr: 'مكتب سما المملكة للعلاقات وتسيير المعاملات ببيروت',
    beneficiaryEn: 'Sama Al-Mamlakah Liaison & Clearing - Beirut',
    iban: 'LB52 BOBE 0000 0112 3456 7890 12',
    swift: 'BOBBLBBYXXX',
    currencyAr: 'ل.ل',
    currencyEn: 'LBP',
    exchangeRate: 23800.0,
    notesAr: 'ندعم التحويل المالي عبر مكتب OMT أو حسابنا ببنك بيروت لتسهيل تعميد مستندات المعاملات.',
    notesEn: 'Available via OMT Fast Pay or cash pickup in USD/LBP. Add reference code for approval.'
  },
  {
    code: 'PS',
    nameAr: 'دولة فلسطين',
    nameEn: 'Palestine',
    flag: '🇵🇸',
    bankNameAr: 'بنك فلسطين وحسابات الدفع السريع',
    bankNameEn: 'Bank of Palestine (BoP)',
    beneficiaryAr: 'سما المملكة لتخليص المعاملات الحكومية - فرع فلسطين',
    beneficiaryEn: 'Sama Al-Mamlakah Govt clearing - Palestine',
    iban: 'PS96 BKPL 0000 0012 3456 7890 000',
    swift: 'BKPLPS22XXX',
    currencyAr: 'ش.ج',
    currencyEn: 'ILS',
    exchangeRate: 0.98,
    notesAr: 'يتم دفع الرسوم بالدولار الأمريكي أو الشيكل عبر بنك فلسطين. يرجى تزويدنا بصورة الإيصال مباشرة.',
    notesEn: 'Settle in USD, JOD, or ILS directly at Bank of Palestine. Provide transaction scan.'
  },
  {
    code: 'MA',
    nameAr: 'المملكة المغربية',
    nameEn: 'Morocco',
    flag: '🇲🇦',
    bankNameAr: 'التجاري وفا بنك ومحفظة البنك الشعبي',
    bankNameEn: 'Attijariwafa Bank / Banque Populaire',
    beneficiaryAr: 'سما المملكة للعلاقات الدولية والتعقيب وتسهيل الخدمات',
    beneficiaryEn: 'Sama Al-Mamlakah International Govt Services - Morocco',
    iban: 'MA21 0071 2000 0012 3456 7890 111',
    swift: 'BCMAMAMCXXX',
    currencyAr: 'د.م',
    currencyEn: 'MAD',
    exchangeRate: 2.68,
    notesAr: 'التحويل متاح بالدرهم المغربي أو عبر نظام الدفع الإلكتروني المباشر بالمغرب.',
    notesEn: 'Acceptable in MAD through Attijariwafa local network. Supply clearing trace reference.'
  },
  {
    code: 'DZ',
    nameAr: 'الجمهورية الجزائرية الديمقراطية الشعبية',
    nameEn: 'Algeria',
    flag: '🇩🇿',
    bankNameAr: 'البنك الوطني الجزائري وحوالات البريد السريع',
    bankNameEn: 'Banque Nationale d\'Algérie (BNA)',
    beneficiaryAr: 'الشريك المحاسبي المعتمد لمؤسسة سما المملكة للتسويات الدبلوماسية',
    beneficiaryEn: 'Sama Al-Mamlakah Settlement Associate - Algeria',
    iban: 'DZ11 0010 0000 1234 5678 9012 34',
    swift: 'BNALDZALXXX',
    currencyAr: 'د.ج',
    currencyEn: 'DZD',
    exchangeRate: 35.80,
    notesAr: 'الدفع بالدينار الجزائري لدى البنك الوطني أو الحوالة البريدية الرسمية.',
    notesEn: 'Settle in DZD or postal financial systems. Provide the official Post confirmation slip.'
  },
  {
    code: 'TN',
    nameAr: 'الجمهورية التونسية',
    nameEn: 'Tunisia',
    flag: '🇹🇳',
    bankNameAr: 'البنك الوطني الفلاحي (BNA TUNISIA)',
    bankNameEn: 'Banque Nationale Agricole (BNA)',
    beneficiaryAr: 'سما المملكة لخدمات المتابعة والتيسير المعتمدة - تونس',
    beneficiaryEn: 'Sama Al-Mamlakah Services Hub - Tunisia',
    iban: 'TN59 0300 0000 1234 5678 9012',
    swift: 'BNATTNTTXXX',
    currencyAr: 'د.ت',
    currencyEn: 'TND',
    exchangeRate: 0.83,
    notesAr: 'يرجى تسجيل حوالة البنك الفلاحي وإدخال رقم المرجع لتسريع تعميد الفاتورة.',
    notesEn: 'Available in TND via BNA international bank link. Scan the receipt for prompt approval.'
  },
  {
    code: 'LY',
    nameAr: 'دولة ليبيا',
    nameEn: 'Libya',
    flag: '🇱🇾',
    bankNameAr: 'مصرف الجمهورية أو بنك الأمان',
    bankNameEn: 'Jumhouria Bank or Al-Aman Bank',
    beneficiaryAr: 'فرع سما المملكة لتسهيل الخدمات الحكومية والخليجية بليبيا',
    beneficiaryEn: 'Sama Al-Mamlakah Services Portal - Libya',
    iban: 'LY41 JUMH 0000 0112 3456 7890 12',
    swift: 'JUMHLYTRXXX',
    currencyAr: 'د.ل',
    currencyEn: 'LYD',
    exchangeRate: 1.29,
    notesAr: 'التسوية مقبولة في حساب تسيير المعاملات الخاص بنا بمصرف الجمهورية بموجب الإخطار المالي.',
    notesEn: 'Libyan Dinar processing is governed by Jumhouria local settlement guidelines.'
  },
  {
    code: 'TR',
    nameAr: 'جمهورية تركيا',
    nameEn: 'Turkey',
    flag: '🇹🇷',
    bankNameAr: 'بنك زراعات الزراعي والحوالات الفورية (FAST / Ziraat)',
    bankNameEn: 'Ziraat Bankası Turkey',
    beneficiaryAr: 'مكتب سما المملكة للخدمات الدولية والاستشارات في اسطنبول',
    beneficiaryEn: 'Sama Al-Mamlakah Consultancy Hub - Turkey',
    iban: 'TR89 0001 0000 1234 5678 9012 34',
    swift: 'TCZBAR22XXX',
    currencyAr: 'ل.ت',
    currencyEn: 'TRY',
    exchangeRate: 8.65,
    notesAr: 'التحويل متاح بالليرة التركية أو اليورو أو الدولار عبر نظام FAST الفوري أو الآيبان المعتمد.',
    notesEn: 'Send TRY / EUR / USD instantly using FAST code or standard Ziraat IBAN.'
  },
  {
    code: 'GB',
    nameAr: 'المملكة المتحدة',
    nameEn: 'United Kingdom',
    flag: '🇬🇧',
    bankNameAr: 'بنك باركليز العالمي وحوالات (Faster Payments)',
    bankNameEn: 'Barclays Bank UK PLC & Faster Payments',
    beneficiaryAr: 'سما المملكة لمعالجة وإصدار المعاملات والشهادات الدولية',
    beneficiaryEn: 'Sama Al-Mamlakah Worldwide Documents Processing',
    iban: 'GB21 BARC 2000 1123 4567 89',
    swift: 'BARCGB22XXX',
    currencyAr: 'ج.إ',
    currencyEn: 'GBP',
    exchangeRate: 0.21,
    notesAr: 'ندعم التحويل المالي المباشر عبر (FPS) أو الآيبان الدولي بموجب الإشعار التلقائي.',
    notesEn: 'Direct FPS settlements are fully processed within 10 minutes. Provide UK Sort Code/Acc.'
  },
  {
    code: 'US',
    nameAr: 'الولايات المتحدة الأمريكية وباقي دول العالم',
    nameEn: 'United States & Global Regions',
    flag: '🇺🇸',
    bankNameAr: 'سيتي بنك العالمي لتسوية العلاقات والتحصيل الدولي',
    bankNameEn: 'Citibank N.A. (HQ New York)',
    beneficiaryAr: 'مكتب سما المملكة المعتمد للتسويات البنكية الدولية',
    beneficiaryEn: 'Sama Al-Mamlakah global clearing & settlement',
    iban: 'US90 CITI 1201 1234 5678 9123',
    swift: 'CITIUS33XXX',
    currencyAr: 'د.أ',
    currencyEn: 'USD',
    exchangeRate: 0.266,
    notesAr: 'من خارج أمريكا يمكن التحويل عبر SWIFT بالدولار الأمريكي. يتم قيد الحوالة فور وصول إيصال الإرسال.',
    notesEn: 'Use international SWIFT Wire transfer in USD currency. Processed globally.'
  },
  {
    code: 'GLOBAL',
    nameAr: 'جميع الدول الأخرى (تحويل دولي / موني جرام / ويسترن)',
    nameEn: 'All Other Countries (Western Union / MoneyGram / Express Pay)',
    flag: '🌐',
    bankNameAr: 'وكلاء الدفع السريع الدولي (Western Union / MoneyGram)',
    bankNameEn: 'Unified International Payment Gateway (Western Union / MoneyGram)',
    beneficiaryAr: 'المدير المالي المعتمد لشبكة مكاتب سما المملكة العالمية',
    beneficiaryEn: 'Sama Al-Mamlakah Government Services Financial Director',
    iban: 'WU-MG DIRECT GLOBAL TRANSFER GATEWAY',
    swift: 'WUMGGLOBALXXX',
    currencyAr: 'دولار',
    currencyEn: 'USD',
    exchangeRate: 0.266,
    notesAr: 'لجميع مواطني وجنسيات دول العالم، يمكن تسديد الرسوم مباشرة بإشعار رقم الرقابة المالي (MTCN) لشركة Western Union أو MoneyGram.',
    notesEn: 'For all global users, submit Western Union or MoneyGram MTCN reference number directly. Highly secured and processed instantly.'
  }
];

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  lang?: 'ar' | 'en';
  triggerDirectPrint?: boolean;
  initialPdfPreview?: boolean;
}

export default function InvoiceDetailModal({ isOpen, onClose, transaction, lang = 'ar', triggerDirectPrint = false, initialPdfPreview = false }: InvoiceDetailModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [autoPrint, setAutoPrint] = useState(() => {
    return localStorage.getItem('sm_auto_print') === 'true';
  });

  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [zoom, setZoom] = useState(85); // Default 85% is perfect for previewing A4
  const [paperColor, setPaperColor] = useState<'white' | 'cream' | 'cool-grey'>('white');
  const [showPageBreaks, setShowPageBreaks] = useState(true);
  const [showWatermark, setShowWatermark] = useState<'none' | 'draft' | 'copy' | 'paid'>('none');

  // Print-Ready animation states
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [printProgress, setPrintProgress] = useState(0);

  // WhatsApp Share Panel states
  const [showWhatsAppPanel, setShowWhatsAppPanel] = useState(false);
  const [recipientPhone, setRecipientPhone] = useState('');

  // Country Selection for adaptive regional bank billing
  const [selectedCountryCode, setSelectedCountryCode] = useState('SA');

  // Selected display currency for international clients (USD or EUR)
  const [selectedDisplayCurrency, setSelectedDisplayCurrency] = useState<'USD' | 'EUR'>('USD');

  // Synchronize display currency if the transaction specifies a paymentCurrency
  React.useEffect(() => {
    if (transaction?.paymentCurrency) {
      if (transaction.paymentCurrency === 'EUR') {
        setSelectedDisplayCurrency('EUR');
      } else {
        setSelectedDisplayCurrency('USD');
      }
    }
  }, [transaction?.paymentCurrency]);

  // Synchronize pdf preview state based on initialPdfPreview on open
  React.useEffect(() => {
    if (isOpen) {
      if (initialPdfPreview) {
        setShowPdfPreview(true);
      } else {
        setShowPdfPreview(false);
      }
    }
  }, [isOpen, initialPdfPreview]);

  // Extract phone helper
  const getExtractedPhone = (): string => {
    if (!transaction?.notes) return '';
    const match = transaction.notes.match(/(05\d{8}|966\d{9})/);
    return match ? match[0] : '';
  };

  // Automatically intelligent detection of country based on text/notes/phone prefix
  const detectCountryFromData = (): string => {
    const textToSearch = `${transaction?.notes || ''} ${transaction?.clientName || ''} ${getExtractedPhone()}`.toLowerCase();
    
    if (textToSearch.includes('971') || textToSearch.includes('الإمارات') || textToSearch.includes('امارات') || textToSearch.includes('uae') || textToSearch.includes('aed')) {
      return 'AE';
    }
    if (textToSearch.includes('974') || textToSearch.includes('قطر') || textToSearch.includes('qatar') || textToSearch.includes('qar')) {
      return 'QA';
    }
    if (textToSearch.includes('965') || textToSearch.includes('الكويت') || textToSearch.includes('kuwait') || textToSearch.includes('kwd')) {
      return 'KW';
    }
    if (textToSearch.includes('968') || textToSearch.includes('عمان') || textToSearch.includes('oman') || textToSearch.includes('omr')) {
      return 'OM';
    }
    if (textToSearch.includes('973') || textToSearch.includes('البحرين') || textToSearch.includes('bahrain') || textToSearch.includes('bhd')) {
      return 'BH';
    }
    if (textToSearch.includes('201') || textToSearch.includes('202') || textToSearch.includes('201') || textToSearch.includes('0020') || textToSearch.includes('مصر') || textToSearch.includes('egypt') || textToSearch.includes('egp')) {
      return 'EG';
    }
    if (textToSearch.includes('967') || textToSearch.includes('اليمن') || textToSearch.includes('يمن') || textToSearch.includes('yemen') || textToSearch.includes('yer') || textToSearch.includes('كريمي') || textToSearch.includes('kuraimi') || textToSearch.includes('one cash') || textToSearch.includes('ون كاش') || textToSearch.includes('محفظة')) {
      return 'YE';
    }
    if (textToSearch.includes('962') || textToSearch.includes('الأردن') || textToSearch.includes('أردن') || textToSearch.includes('jordan') || textToSearch.includes('jod') || textToSearch.includes('cliqu') || textToSearch.includes('كليك')) {
      return 'JO';
    }
    if (textToSearch.includes('964') || textToSearch.includes('العراق') || textToSearch.includes('عراق') || textToSearch.includes('iraq') || textToSearch.includes('iqd')) {
      return 'IQ';
    }
    if (textToSearch.includes('249') || textToSearch.includes('السودان') || textToSearch.includes('سودان') || textToSearch.includes('sudan') || textToSearch.includes('sdg') || textToSearch.includes('بنكك')) {
      return 'SD';
    }
    if (textToSearch.includes('963') || textToSearch.includes('سوريا') || textToSearch.includes('syria') || textToSearch.includes('syp') || textToSearch.includes('الهرم')) {
      return 'SY';
    }
    if (textToSearch.includes('961') || textToSearch.includes('لبنان') || textToSearch.includes('lebanon') || textToSearch.includes('lbp') || textToSearch.includes('omt')) {
      return 'LB';
    }
    if (textToSearch.includes('970') || textToSearch.includes('فلسطين') || textToSearch.includes('palestine') || textToSearch.includes('ils') || textToSearch.includes('شيكل')) {
      return 'PS';
    }
    if (textToSearch.includes('212') || textToSearch.includes('المغرب') || textToSearch.includes('مغرب') || textToSearch.includes('morocco') || textToSearch.includes('mad') || textToSearch.includes('وفا')) {
      return 'MA';
    }
    if (textToSearch.includes('213') || textToSearch.includes('الجزائر') || textToSearch.includes('جزائر') || textToSearch.includes('algeria') || textToSearch.includes('dzd')) {
      return 'DZ';
    }
    if (textToSearch.includes('216') || textToSearch.includes('تونس') || textToSearch.includes('tunisia') || textToSearch.includes('tnd')) {
      return 'TN';
    }
    if (textToSearch.includes('218') || textToSearch.includes('ليبيا') || textToSearch.includes('libya') || textToSearch.includes('lyd')) {
      return 'LY';
    }
    if (textToSearch.includes('90') || textToSearch.includes('تركيا') || textToSearch.includes('turkey') || textToSearch.includes('try') || textToSearch.includes('ziraat')) {
      return 'TR';
    }
    if (textToSearch.includes('44') || textToSearch.includes('بريطانيا') || textToSearch.includes('uk') || textToSearch.includes('gbp') || textToSearch.includes('london')) {
      return 'GB';
    }
    if (textToSearch.includes('usa') || textToSearch.includes('america') || textToSearch.includes('دولار') || textToSearch.includes('usd') || textToSearch.includes('أمريكا')) {
      return 'US';
    }
    return 'SA'; // Default to KSA
  };

  React.useEffect(() => {
    if (transaction) {
      setRecipientPhone(getExtractedPhone());
      setSelectedCountryCode(detectCountryFromData());
    }
  }, [transaction?.id]);

  const generateWhatsAppMessage = () => {
    if (!transaction) return '';
    const statusText = isTransferOrCashPending 
      ? (lang === 'en' ? '⏳ Under Review & Verification' : '⏳ قيد المراجعة والسداد')
      : (lang === 'en' ? '✓ Paid & Authorized' : '✓ مسدد بالكامل ومعتمد');
    
    return lang === 'en' 
      ? `*Sama Al-Mamlakah Government Services & Follow-ups Bureau* 📊\n` +
        `*Simplified Tax Invoice Number:* ${transaction.invoiceNumber}\n` +
        `*Status:* ${statusText}\n\n` +
        `*Customer/Beneficiary:* ${transaction.clientName}\n` +
        `*Requested Service:* ${transaction.serviceName}\n` +
        `----------------------------------------\n` +
        `*Government Fees:* ${transaction.govFee.toFixed(2)} SAR\n` +
        `*Sama Al-Mamlakah Fees:* ${transaction.officeFee.toFixed(2)} SAR\n` +
        `*Value Added Tax (15%):* ${transaction.tax.toFixed(2)} SAR\n` +
        `*Grand Total Settled Amount:* ${transaction.total.toFixed(2)} SAR\n` +
        `----------------------------------------\n` +
        `Thank you for choosing Sama Al-Mamlakah. The tax document was generated and finalized.\n` +
        `Track your real-time transactions through our official portal:\n` +
        `${window.location.origin}`
      : `*مكتب سما المملكة لخدمات التعقيب والمعاملات المعتمدة* 📊\n` +
        `*فاتورة ضريبية مبسطة رقم:* ${transaction.invoiceNumber}\n` +
        `*حالة المعاملة:* ${statusText}\n\n` +
        `*العميل المستفيد:* ${transaction.clientName}\n` +
        `*نوع الخدمة:* ${transaction.serviceName}\n` +
        `----------------------------------------\n` +
        `*الرسوم والمستحقات الحكومية:* ${transaction.govFee.toFixed(2)} ر.س\n` +
        `*أتعاب سما المملكة:* ${transaction.officeFee.toFixed(2)} ر.س\n` +
        `*ضريبة القيمة المضافة (15%):* ${transaction.tax.toFixed(2)} ر.س\n` +
        `*الإجمالي الكلي المدفوع:* ${transaction.total.toFixed(2)} ر.س\n` +
        `----------------------------------------\n` +
        `نشكركم لثقتكم الغالية بمكتبنا. تم توثيق وإصدار السند الضريبي بنجاح.\n` +
        `تابع حالة معاملتك الفورية واستعرض فواتيرك عبر البوابة الرسمية:\n` +
        `${window.location.origin}`;
  };

  const handleSendToClient = () => {
    if (!recipientPhone.trim()) {
      alert(lang === 'en' ? 'Please enter a valid phone number' : 'يرجى إدخال رقم هاتف جوال صحيح أولاً');
      return;
    }
    let formattedPhone = recipientPhone.replace(/\s+/g, '').replace(/\D/g, '');
    if (formattedPhone.startsWith('05')) {
      formattedPhone = '966' + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('5')) {
      formattedPhone = '966' + formattedPhone;
    } else if (!formattedPhone.startsWith('966') && formattedPhone.length === 9) {
      formattedPhone = '966' + formattedPhone;
    }
    
    // Save to logs locally
    try {
      const logsRaw = localStorage.getItem('sm_wa_logs');
      const logs = logsRaw ? JSON.parse(logsRaw) : [];
      const newLog = {
        id: 'log-' + Date.now(),
        timestamp: new Date().toISOString(),
        phoneNumber: formattedPhone,
        message: generateWhatsAppMessage(),
        success: true,
        type: 'invoice_share'
      };
      localStorage.setItem('sm_wa_logs', JSON.stringify([newLog, ...logs]));
    } catch (e) {
      console.error(e);
    }

    const textMsg = generateWhatsAppMessage();
    const url = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(textMsg)}`;
    window.open(url, '_blank');
  };

  const handleSendToOffice = () => {
    const rawOfficeUrl = localStorage.getItem('sm_social_whatsapp') || 'https://wa.me/966500000000';
    let officeNum = rawOfficeUrl.replace(/\D/g, '');
    if (!officeNum) {
      officeNum = '966500000000';
    }
    const textMsg = generateWhatsAppMessage();
    const url = `https://api.whatsapp.com/send?phone=${officeNum}&text=${encodeURIComponent(textMsg)}`;
    window.open(url, '_blank');
  };

  const handleToggleAutoPrint = (checked: boolean) => {
    setAutoPrint(checked);
    localStorage.setItem('sm_auto_print', checked ? 'true' : 'false');
  };

  const startPrintWithLoader = () => {
    if (isPreparingPrint) return;
    setIsPreparingPrint(true);
    setPrintProgress(0);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 4;
      if (progress > 100) progress = 100;
      setPrintProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          window.print();
          setIsPreparingPrint(false);
        }, 350);
      }
    }, 45); // ~1100ms total loader duration
  };

  React.useEffect(() => {
    if (isOpen && transaction) {
      if (triggerDirectPrint) {
        startPrintWithLoader();
      } else if (autoPrint) {
        const printTimer = setTimeout(() => {
          startPrintWithLoader();
        }, 500);
        return () => clearTimeout(printTimer);
      }
    }
  }, [isOpen, transaction?.id, triggerDirectPrint, autoPrint]);

  if (!isOpen || !transaction) return null;

  const isTransferOrCashPending = !!(transaction.notes && (
    transaction.notes.includes('معلقة') || 
    transaction.notes.includes('معلق') || 
    transaction.notes.includes('تدقيق') || 
    transaction.notes.includes('بانتظار') ||
    transaction.notes.includes('نقدي بمقر المكتب') ||
    transaction.notes.includes('سداد نقدي') ||
    transaction.notes.includes('مرحل تلقائياً')
  ));

  const handlePrint = () => {
    startPrintWithLoader();
  };

  const handlePrintPreview = () => {
    const element = document.getElementById('print-area');
    if (!element) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert(lang === 'en' 
        ? 'Popup blocker active! Please allow popups for this site to view the print preview.' 
        : 'تم حظر النافذة المنبثقة! يرجى السماح بالنوافذ المنبثقة في متصفحك لاستعراض معاينة الطباعة.');
      return;
    }

    // Determine background color based on settings
    let paperBgStyle = 'background-color: #ffffff !important;';
    if (showPdfPreview) {
      if (paperColor === 'cream') paperBgStyle = 'background-color: #faf8f0 !important;';
      else if (paperColor === 'cool-grey') paperBgStyle = 'background-color: #f4f5f7 !important;';
    }

    // Get all style tags and link stylesheet tags from main page
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(style => style.outerHTML)
      .join('\n');

    const direction = lang === 'en' ? 'ltr' : 'rtl';
    const docTitle = lang === 'en' ? `Print Preview - Invoice ${transaction.invoiceNumber}` : `معاينة الطباعة - فاتورة رقم ${transaction.invoiceNumber}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="${lang}" dir="${direction}">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${docTitle}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet">
          ${styles}
          <style>
            @media print {
              .no-print {
                display: none !important;
              }
              body {
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              .preview-container {
                box-shadow: none !important;
                border: none !important;
                margin: 0 !important;
                padding: 0 !important;
                max-width: 100% !important;
                width: 100% !important;
              }
            }
            body {
              background-color: #0f172a;
              color: #f8fafc;
              font-family: "Tajawal", "Helvetica Neue", Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 0;
            }
            .preview-container {
              transition: all 0.2s ease-in-out;
            }
          </style>
        </head>
        <body class="bg-slate-900 text-slate-100 flex flex-col min-h-screen">
          <!-- Non-printable top action bar -->
          <div class="no-print bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-lg sticky top-0 z-50 select-none">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              </div>
              <div>
                <h1 class="text-xs md:text-sm font-black text-white leading-tight">
                  \${lang === 'en' ? 'Professional Print Preview' : 'معاينة طباعة السند المالي الرسمي'}
                </h1>
                <p class="text-[10px] text-slate-400 font-mono mt-0.5" style="direction: ltr; text-align: left;">
                  ID: \${transaction.invoiceNumber} • \${transaction.clientName}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2.5">
              <button 
                onclick="window.print()" 
                class="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14" rx="1"/><path d="M6 8V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4"/></svg>
                <span>\${lang === 'en' ? 'Print' : 'إجراء الطباعة'}</span>
              </button>

              <button 
                onclick="window.close()" 
                class="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border border-slate-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                <span>\${lang === 'en' ? 'Close' : 'إغلاق المعاينة'}</span>
              </button>
            </div>
          </div>

          <!-- Printable area wrapper -->
          <div class="flex-1 flex justify-center items-center p-4 md:p-8 bg-slate-900 overflow-y-auto">
            <div 
              class="preview-container bg-white text-slate-900 rounded-xl border border-slate-950 shadow-2xl relative max-w-[210mm] w-full p-8 md:p-12"
              style="min-h: 297mm; \${paperBgStyle}"
            >
              \${element.innerHTML}
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('print-area');
    if (!element) return;

    // Temporarily reset any active transform scale and margin bottom on the scale-container to guarantee perfect capture
    const scaleContainer = document.getElementById('pdf-scale-container');
    const originalTransform = scaleContainer ? scaleContainer.style.transform : '';
    const originalMarginBottom = scaleContainer ? scaleContainer.style.marginBottom : '';

    if (scaleContainer) {
      scaleContainer.style.transform = 'none';
      scaleContainer.style.marginBottom = '0px';
    }

    try {
      setIsExporting(true);

      // Create a high-res screenshot of the printable invoice area
      const canvas = await html2canvas(element, {
        scale: 2.5, // For maximum clarity & sharpness
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Initialize jsPDF with A4 size dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Draw the canvas to PDF page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      // Handle multi-page generation if invoice is long
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      // Generate localized, slugified filename for compatibility
      const safeClientName = transaction.clientName.trim().replace(/\s+/g, '_');
      const filenamePrefix = lang === 'en' ? 'Sama_Al_Mamlakah_Invoice' : 'فاتورة_سما_المملكة';
      pdf.save(`${filenamePrefix}_${transaction.invoiceNumber}_${safeClientName}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      const errMsg = lang === 'en'
        ? 'Could not generate high-fidelity PDF. Please try again or use web Print to save as PDF directly.'
        : 'حدث خطأ أثناء إصدار ملف الـ PDF المعرب. يرجى المحاولة لاحقاً، أو استخدام خيار طباعة لحفظ الفاتورة بصيغة PDF.';
      alert(errMsg);
    } finally {
      // Restore scale container transform styles if modified
      if (scaleContainer) {
        scaleContainer.style.transform = originalTransform;
        scaleContainer.style.marginBottom = originalMarginBottom;
      }
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in" dir={lang === 'en' ? 'ltr' : 'rtl'}>
      <div className={`w-full ${showPdfPreview ? 'max-w-4xl' : 'max-w-2xl'} bg-white border-2 border-slate-900 rounded-lg shadow-2xl overflow-hidden my-8 transition-all duration-300 ${lang === 'en' ? 'text-left' : 'text-right'}`}>
        {/* Modal Toolbar (Non-printable) */}
        <div className={`bg-slate-950 text-white px-6 py-4 flex justify-between items-center print:hidden ${lang === 'en' ? 'flex-row-reverse' : ''}`}>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className={`flex items-center gap-2 ${lang === 'en' ? 'flex-row-reverse' : ''}`}>
              <Receipt className="w-5 h-5 text-amber-500" />
              <span className="font-bold text-base">
                {lang === 'en' ? 'Review Simplified Tax Invoice' : 'استعراض الفاتورة الضريبية المبسطة'}
              </span>
            </div>
            {isTransferOrCashPending ? (
              <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] px-2.5 py-1 rounded-full font-bold animate-subtle-pulse-amber flex items-center gap-1 leading-none">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                <span>{lang === 'en' ? '⏳ Processing & Payment Review' : '⏳ قيد معالجة الطلب والسداد'}</span>
              </span>
            ) : (
              <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 leading-none">
                <span>{lang === 'en' ? '✓ Completed & Fully Settled' : '✓ معاملة مكتملة ومسددة'}</span>
              </span>
            )}
          </div>
          <div className={`flex items-center gap-2 flex-wrap ${lang === 'en' ? 'flex-row-reverse' : ''}`}>
            <button
              type="button"
              onClick={() => setShowPdfPreview(!showPdfPreview)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-bold transition-all border cursor-pointer ${
                showPdfPreview 
                  ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-md font-black'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${showPdfPreview ? 'animate-pulse text-amber-950' : 'text-amber-500'}`} />
              <span>{showPdfPreview ? (lang === 'en' ? 'Classic View' : 'العرض العادي') : (lang === 'en' ? 'PDF Preview (A4)' : 'معاينة PDF (A4)')}</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-bold transition-colors cursor-pointer ${
                isExporting 
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>{isExporting ? (lang === 'en' ? 'Exporting...' : 'جاري التصدير...') : (lang === 'en' ? 'Export PDF' : 'تصدير PDF')}</span>
            </button>
            <button
              onClick={handlePrintPreview}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-500 hover:text-amber-400 px-3 py-1.5 rounded text-sm font-bold transition-all cursor-pointer"
              title={lang === 'en' ? 'Open in a new window for professional print preview' : 'فتح في نافذة متصفح جديدة لمعاينة الطباعة الاحترافية'}
            >
              <Eye className="w-4 h-4" />
              <span>{lang === 'en' ? 'Print Preview' : 'معاينة الطباعة'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 bg-amber-600 hover:bg-amber-500 text-slate-950 px-3 py-1.5 rounded text-sm font-bold transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'en' ? 'Print Invoice' : 'طباعة الفاتورة'}</span>
            </button>
            <button
              onClick={() => setShowWhatsAppPanel(!showWhatsAppPanel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-bold transition-all border cursor-pointer ${
                showWhatsAppPanel
                  ? 'bg-emerald-600 border-emerald-700 text-white shadow-md'
                  : 'bg-slate-900 border-slate-800 text-emerald-400 hover:text-emerald-350 hover:bg-slate-800'
              }`}
              title={lang === 'en' ? 'Send invoice via WhatsApp' : 'إرسال الفاتورة عبر الواتساب'}
            >
              <MessageSquare className="w-4 h-4" />
              <span>{lang === 'en' ? 'WhatsApp' : 'واتساب'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Smart Billing Settings Bar (Non-printable) */}
        <div className={`bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex flex-wrap justify-between items-center text-[11px] select-none print:hidden gap-3 ${lang === 'en' ? 'flex-row-reverse' : ''}`}>
          <div className="flex items-center gap-2 text-slate-700">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${autoPrint ? 'bg-amber-400' : 'bg-slate-350'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${autoPrint ? 'bg-amber-500' : 'bg-slate-400'}`}></span>
            </span>
            <span className="font-extrabold text-slate-800">
              {lang === 'en' ? 'Billing Options & Print Control:' : 'خيارات الفوترة والتحكّم بالطباعة:'}
            </span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-950 transition-colors">
            <input 
              type="checkbox"
              id="autoprint-toggle-checkbox"
              checked={autoPrint}
              onChange={(e) => handleToggleAutoPrint(e.target.checked)}
              className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer accent-amber-500"
            />
            <span className="font-bold">
              {lang === 'en' 
                ? 'Automatically open printer dialog box immediately when reviewing or issuing invoice'
                : 'تفعيل تشغيل حوار الطباعة التلقائي (Print Dialog) فوراً عند إصدار أو فتح السند المالي'}
            </span>
          </label>
        </div>

        {/* WhatsApp Quick Share Panel (Non-printable) */}
        {showWhatsAppPanel && (
          <div className="bg-slate-50 border-b border-slate-200 p-5 print:hidden animate-fade-in text-slate-800 space-y-4 font-sans" dir={lang === 'en' ? 'ltr' : 'rtl'}>
            <div className="flex justify-between items-center bg-emerald-500/10 text-emerald-950 border border-emerald-500/20 px-4 py-2.5 rounded-lg flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600 animate-pulse" />
                <span className="font-extrabold text-sm text-emerald-800">
                  {lang === 'en' ? 'Sama Al-Mamlakah WhatsApp Billing Hub' : 'بوابة المشاركة وسند الفواتير السريع عبر الواتساب'}
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setShowWhatsAppPanel(false)}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 px-2 py-1 hover:bg-emerald-500/20 rounded transition-all cursor-pointer"
              >
                {lang === 'en' ? 'Hide Panel ×' : 'إخفاء اللوحة ×'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recipient Input & Send Actions */}
              <div className="space-y-3.5 text-right">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5 text-right">
                    {lang === 'en' ? 'Recipient Mobile Phone Number:' : 'رقم جوال المستفيد (المستلم):'}
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="05xxxxxxxx"
                      className="w-full bg-white border border-slate-300 hover:border-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 px-3.5 py-2 text-slate-800 rounded-lg text-sm font-mono outline-hidden font-bold transition-all text-center"
                    />
                    {getExtractedPhone() && recipientPhone !== getExtractedPhone() && (
                      <button
                        type="button"
                        onClick={() => setRecipientPhone(getExtractedPhone())}
                        className="absolute left-2 top-2 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded transition-all cursor-pointer border border-slate-200"
                        title={lang === 'en' ? 'Restore extracted number' : 'استعادة الرقم المكتشف'}
                      >
                        {lang === 'en' ? 'Restore Phone' : 'جوال الكشف الآلي'}
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 font-sans leading-relaxed text-right">
                    {lang === 'en' 
                      ? 'Extracted automatically from transaction notes. Use international format starts with 05xxxxxxxx.' 
                      : 'الكشف التلقائي يستخلص رقم الهاتف المدون بالطلب لخدمتك وتوفير وقتك.'}
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-1.5">
                  <button
                    type="button"
                    onClick={handleSendToClient}
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white px-4 py-2.5 rounded-lg font-bold text-sm shadow-xs transition-all cursor-pointer border border-emerald-700"
                  >
                    <Send className="w-4 h-4" />
                    <span>{lang === 'en' ? 'Send Invoice to Client via WA' : 'إرسال الفاتورة لجوال العميل المستلم'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendToOffice}
                    className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 active:scale-98 text-slate-100 px-4 py-2.5 rounded-lg font-bold text-sm shadow-xs transition-all cursor-pointer border border-slate-950"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-450 text-emerald-400" />
                    <span>{lang === 'en' ? 'Send to Office WhatsApp' : 'إرسال الفاتورة لواتساب المكتب المعتمد'}</span>
                  </button>
                </div>
              </div>

              {/* Live Preview Text area */}
              <div className="flex flex-col h-full text-right">
                <label className="block text-xs font-black text-slate-700 mb-1.5 text-right">
                  {lang === 'en' ? 'Live Message Raw Preview:' : 'معاينة نص المستند الضريبي الصادر للواتساب:'}
                </label>
                <textarea
                  readOnly
                  rows={6}
                  value={generateWhatsAppMessage()}
                  className="w-full flex-grow bg-slate-100 border border-slate-200 text-slate-600 p-3 rounded-lg text-[10px] font-mono leading-relaxed resize-none focus:outline-none select-all text-right"
                />
              </div>
            </div>
          </div>
        )}

        {/* PDF Preview Toolkit Bar (Non-printable) */}
        {showPdfPreview && (
          <div className={`bg-slate-900 border-b border-slate-800 px-6 py-2.5 flex flex-wrap justify-between items-center text-xs select-none print:hidden gap-4 transition-all animate-fade-in text-slate-200 ${lang === 'en' ? 'flex-row-reverse' : ''}`}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-extrabold text-slate-100 text-[11px]">
                {lang === 'en' ? 'Simulated A4 Paper Layout Grid:' : 'مـعـايـنـة ورق A4 PDF المـطـابـق:'}
              </span>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              {/* Paper color option */}
              <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                <span className="text-slate-400 text-[10px]">{lang === 'en' ? 'Paper:' : 'خلفية الورق:'}</span>
                <button 
                  type="button" 
                  onClick={() => setPaperColor('white')} 
                  className={`w-3.5 h-3.5 rounded-full bg-white border cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all ${paperColor === 'white' ? 'ring-2 ring-emerald-500' : ''}`}
                  title={lang === 'en' ? 'Standard White' : 'أبيض قياسي'}
                />
                <button 
                  type="button" 
                  onClick={() => setPaperColor('cream')} 
                  className={`w-3.5 h-3.5 rounded-full bg-[#faf8f0] border cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all ${paperColor === 'cream' ? 'ring-2 ring-emerald-500' : ''}`}
                  title={lang === 'en' ? 'Creamy Comfort' : 'عاجي مريح للعين'}
                />
                <button 
                  type="button" 
                  onClick={() => setPaperColor('cool-grey')} 
                  className={`w-3.5 h-3.5 rounded-full bg-[#f4f5f7] border cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all ${paperColor === 'cool-grey' ? 'ring-2 ring-emerald-500' : ''}`}
                  title={lang === 'en' ? 'Cool Slate' : 'رمادي مالي'}
                />
              </div>

              {/* Watermark toggle */}
              <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800 text-[10px]">
                <span className="text-slate-405 text-slate-400">{lang === 'en' ? 'Watermark:' : 'علامة مائية:'}</span>
                <select 
                  value={showWatermark} 
                  onChange={(e: any) => setShowWatermark(e.target.value)}
                  className="bg-slate-900 text-slate-200 border-none font-bold cursor-pointer text-[10px] focus:outline-none py-0.5"
                >
                  <option value="none">{lang === 'en' ? 'None' : 'بدون'}</option>
                  <option value="draft">{lang === 'en' ? 'DRAFT' : 'مسودة (DRAFT)'}</option>
                  <option value="copy">{lang === 'en' ? 'COPY' : 'نسخة (COPY)'}</option>
                  <option value="paid">{lang === 'en' ? 'PAID' : 'مسددة (PAID)'}</option>
                </select>
              </div>

              {/* Page indicator guide lines */}
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-350 hover:text-white transition-colors text-[11px]">
                <input 
                  type="checkbox"
                  checked={showPageBreaks}
                  onChange={(e) => setShowPageBreaks(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer accent-emerald-500"
                />
                <span className="font-bold">{lang === 'en' ? 'Page Breaks Limit' : 'مؤشر فاصل الصفحات'}</span>
              </label>

              {/* Zoom controls */}
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                <span className="text-slate-400 text-[10px]">{lang === 'en' ? 'Scale:' : 'حجم السند:'}</span>
                <button 
                  type="button"
                  disabled={zoom <= 60}
                  onClick={() => setZoom(prev => Math.max(60, prev - 10))}
                  className="w-4 h-4 flex items-center justify-center bg-slate-900 hover:bg-slate-800 disabled:opacity-30 rounded text-slate-200 font-bold cursor-pointer text-xs"
                >
                  -
                </button>
                <span className="font-mono font-bold text-slate-100 min-w-[28px] text-center text-[10px]">{zoom}%</span>
                <button 
                  type="button"
                  disabled={zoom >= 130}
                  onClick={() => setZoom(prev => Math.min(130, prev + 10))}
                  className="w-4 h-4 flex items-center justify-center bg-slate-900 hover:bg-slate-800 disabled:opacity-30 rounded text-slate-200 font-bold cursor-pointer text-xs"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Printable Content Frame & Layout Wrapper */}
        <div className={showPdfPreview ? 'bg-slate-800 border-b border-slate-300 flex justify-center py-8 px-4 overflow-y-auto overflow-x-hidden max-h-[580px] print:p-0 print:bg-white' : 'bg-white'}>
          <div
            id="pdf-scale-container"
            style={showPdfPreview ? {
              width: '210mm',
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              marginBottom: `calc(297mm * (1 - ${zoom / 100}) * -1)`,
            } : undefined}
            className={showPdfPreview ? 'origin-top shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] border border-slate-950 relative transition-transform duration-200 print:shadow-none print:border-none' : 'w-full'}
          >
            <div 
              id="print-area" 
              className={`p-8 text-slate-900 font-sans leading-relaxed relative transition-colors duration-200 ${
                showPdfPreview 
                  ? `min-h-[297mm] ${
                      paperColor === 'cream' ? 'bg-[#faf8f0]' : paperColor === 'cool-grey' ? 'bg-[#f4f5f7]' : 'bg-white'
                    }` 
                  : 'bg-white'
              }`}
            >
              {/* Dynamic visual page break line indicators */}
              {showPdfPreview && showPageBreaks && (
                <div className="absolute left-0 right-0 border-t-2 border-dashed border-red-500/40 pointer-events-none z-40 flex items-center justify-center font-mono text-[9px] text-red-500 bg-red-400/5 select-none" style={{ top: '293mm' }}>
                  <span className="bg-red-950 text-white px-2 py-0.5 rounded-b-md shadow font-black tracking-wider leading-none">حدود صفحة الطباعة الأولى A4</span>
                </div>
              )}

              {/* Permanent elegant security watermark background defending against document alterations */}
              <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0 flex flex-col justify-between py-16 print-watermark opacity-[0.035] dark:opacity-[0.025]" aria-hidden="true">
                <div className="flex justify-around items-center w-full transform -rotate-12 select-none whitespace-nowrap">
                  <span className="font-sans font-black text-xl md:text-2xl uppercase tracking-[0.25em] select-none">سما المملكة Sama Al-Mamlakah</span>
                  <span className="font-sans font-black text-xl md:text-2xl uppercase tracking-[0.25em] select-none hidden lg:inline">سما المملكة Sama Al-Mamlakah</span>
                </div>
                <div className="flex justify-around items-center w-full transform -rotate-12 select-none whitespace-nowrap">
                  <span className="font-sans font-black text-xl md:text-2xl uppercase tracking-[0.25em] select-none hidden lg:inline">سما المملكة Sama Al-Mamlakah</span>
                  <span className="font-sans font-black text-xl md:text-2xl uppercase tracking-[0.25em] select-none">سما المملكة Sama Al-Mamlakah</span>
                </div>
                <div className="flex justify-around items-center w-full transform -rotate-12 select-none whitespace-nowrap">
                  <span className="font-sans font-black text-xl md:text-2xl uppercase tracking-[0.25em] select-none">سما المملكة Sama Al-Mamlakah</span>
                  <span className="font-sans font-black text-xl md:text-2xl uppercase tracking-[0.25em] select-none hidden lg:inline">سما المملكة Sama Al-Mamlakah</span>
                </div>
                <div className="flex justify-around items-center w-full transform -rotate-12 select-none whitespace-nowrap">
                  <span className="font-sans font-black text-xl md:text-2xl uppercase tracking-[0.25em] select-none hidden lg:inline">سما المملكة Sama Al-Mamlakah</span>
                  <span className="font-sans font-black text-xl md:text-2xl uppercase tracking-[0.25em] select-none">سما المملكة Sama Al-Mamlakah</span>
                </div>
                <div className="flex justify-around items-center w-full transform -rotate-12 select-none whitespace-nowrap">
                  <span className="font-sans font-black text-xl md:text-2xl uppercase tracking-[0.25em] select-none">سما المملكة Sama Al-Mamlakah</span>
                  <span className="font-sans font-black text-xl md:text-2xl uppercase tracking-[0.25em] select-none hidden lg:inline">سما المملكة Sama Al-Mamlakah</span>
                </div>
                <div className="flex justify-around items-center w-full transform -rotate-12 select-none whitespace-nowrap">
                  <span className="font-sans font-black text-xl md:text-2xl uppercase tracking-[0.25em] select-none hidden lg:inline">سما المملكة Sama Al-Mamlakah</span>
                  <span className="font-sans font-black text-xl md:text-2xl uppercase tracking-[0.25em] select-none">سما المملكة Sama Al-Mamlakah</span>
                </div>
              </div>

              {/* Watermark overlay captured in PDF and print */}
              {showWatermark !== 'none' && (
                <div className="absolute inset-x-0 top-1/4 bottom-1/4 pointer-events-none select-none z-0 flex items-center justify-center overflow-hidden">
                  <div className="text-slate-900/10 dark:text-slate-900/5 font-black text-6xl md:text-8xl tracking-widest uppercase rotate-[-35deg] border-8 border-slate-900/10 dark:border-slate-900/5 p-4 rounded-xl text-center">
                    {showWatermark === 'draft' ? (
                      <>
                        <div className="text-4xl md:text-5xl">مسودة</div>
                        <div className="text-lg md:text-xl mt-2 tracking-normal">DRAFT DOCUMENT</div>
                      </>
                    ) : showWatermark === 'copy' ? (
                      <>
                        <div className="text-4xl md:text-5xl">نسخة</div>
                        <div className="text-lg md:text-xl mt-2 tracking-normal font-sans">OFFICIAL COPY</div>
                      </>
                    ) : (
                      <>
                        <div className="text-emerald-900/15 text-4xl md:text-5xl">مسددة</div>
                        <div className="text-emerald-950/15 text-lg md:text-xl mt-2 tracking-normal font-sans">PAID IN FULL</div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Dedicated Print-Only Top Branding Header */}
              <div 
                id="print-only-office-header"
                className={`hidden pb-2.5 mb-6 border-b border-slate-400 justify-between items-center text-[10px] text-slate-800 font-sans tracking-tight ${
                  showPdfPreview ? 'flex' : 'print:flex'
                }`}
                dir={lang === 'en' ? 'ltr' : 'rtl'}
              >
                <div className="flex items-center gap-2">
                  <span className="font-sans font-black text-slate-950 text-xs">سما المملكة Sama Al-Mamlakah</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-700 font-bold">{lang === 'en' ? 'Official Tax Invoice Documents' : 'المستندات الضريبية الرسمية المعتمدة'}</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[9.5px] font-bold text-slate-800">
                  <span>{lang === 'en' ? 'Tel / Phone: 0500000000' : 'الجوال المعتمد: 0500000000'}</span>
                  <span>•</span>
                  <span>info@sama.sa</span>
                  <span>•</span>
                  <span>Riyadh, KSA</span>
                </div>
              </div>
          
          {/* Internal Header Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b-2 border-slate-900 items-start">
            <div>
              <div className="text-2xl font-black text-slate-900 tracking-wider">مكتب سما المملكة</div>
              <div className="text-amber-600 font-bold text-sm tracking-wide mb-2">للخدمات المتكاملة والتأشيرات والتعقيب</div>
              <div className="text-xs text-slate-500 space-y-0.5 font-mono">
                <p>الرقم الضريبي المستهدف: 300065432100003</p>
                <p>مكتب مرخص رقم: 84729 / ج</p>
                <p>العنوان: شارع العليا العام، الرياض، المملكة العربية السعودية</p>
                <p>الجوال: +966 50 000 0000</p>
              </div>
            </div>
            <div className="flex flex-col items-end md:text-left text-xs space-y-1.5 font-mono">
              <div className="bg-slate-100 px-3 py-1.5 border border-slate-300 font-bold text-sm rounded flex items-center gap-1.5 text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>فاتورة ضريبية مبسطة صادرة ومسجلة</span>
              </div>
              {isTransferOrCashPending ? (
                <div className="bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 font-bold text-xs rounded-md flex items-center gap-1.5 animate-subtle-pulse-amber self-stretch md:self-end justify-center md:justify-start">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span>قيد تدقيق الحسابات ومراجعة السداد</span>
                </div>
              ) : (
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 font-bold text-xs rounded-md flex items-center gap-1.5 self-stretch md:self-end justify-center md:justify-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>معاملة مسددة بالكامل ومعتمدة</span>
                </div>
              )}
              <p><span className="text-slate-500">رقم الفاتورة:</span> <span className="font-bold text-slate-900 text-sm">{transaction.invoiceNumber}</span></p>
              <p><span className="text-slate-500">تاريخ الإصدار:</span> <span className="font-bold">{new Date(transaction.date).toLocaleDateString('ar-SA')} - {new Date(transaction.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span></p>
            </div>
          </div>

          {/* Client Details Row */}
          <div className="my-6 bg-slate-50 p-4 border border-slate-200 rounded-lg">
            <h4 className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">بيانات العميل المستفيد</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-slate-800">{transaction.clientName}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                <span className="font-mono text-slate-600">الخدمة المطلوبة: {transaction.serviceName}</span>
              </div>
            </div>
          </div>

          {/* Services breakdown table */}
          <div className="overflow-x-auto border border-slate-900 rounded mt-6">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="bg-slate-900 text-white border-b border-slate-900">
                  <th className="p-3">وصف الخدمة والإجراء للعملية</th>
                  <th className="p-3 text-center">الخضوع للضريية</th>
                  <th className="p-3 text-left">قيمة البند الأصلي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {/* Government segment */}
                <tr>
                  <td className="p-3">
                    <p className="font-bold font-sans">الرسوم والمستحقات الحكومية والدولة</p>
                    <p className="text-slate-500 text-xs font-sans">تشمل تكاليف جهات الإصدار الحكومية والبلدية والجوازات التي تم تسديدها مباشرة.</p>
                  </td>
                  <td className="p-3 text-center text-slate-500 font-sans">معفى / صفر ضريبة</td>
                  <td className="p-3 text-left font-bold text-slate-800">{transaction.govFee.toFixed(2)} ر.س</td>
                </tr>
                {/* Office fee segment */}
                <tr>
                  <td className="p-3">
                    <p className="font-bold font-sans">أتعاب وتكاليف خدمات سما المملكة</p>
                    <p className="text-slate-500 text-xs font-sans">رسوم الإدارة والصياغة والمتابعة والتعقيب واستخلاص الأوراق والملفات.</p>
                  </td>
                  <td className="p-3 text-center text-slate-900 font-sans">خاضع (15%)</td>
                  <td className="p-3 text-left font-bold text-slate-800">{transaction.officeFee.toFixed(2)} ر.س</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="mt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-4 border-t border-slate-200">
            {/* Zatca QR Code mockup */}
            <div className="flex items-center gap-3 bg-slate-50 p-2.5 border border-slate-200 rounded-lg">
              <div className="p-1.5 bg-white border border-slate-300 rounded">
                {/* Dynamic simulated beautiful QR code vector representation */}
                <svg className="w-20 h-20 text-slate-900" viewBox="0 0 100 100">
                  <rect x="0" y="0" width="10" height="10" fill="currentColor"/>
                  <rect x="15" y="0" width="10" height="5" fill="currentColor"/>
                  <rect x="0" y="15" width="10" height="10" fill="currentColor"/>
                  <rect x="40" y="0" width="20" height="10" fill="currentColor"/>
                  <rect x="80" y="0" width="20" height="20" fill="currentColor"/>
                  <rect x="80" y="30" width="10" height="10" fill="currentColor"/>
                  <rect x="0" y="80" width="20" height="20" fill="currentColor"/>
                  <rect x="30" y="80" width="5" height="10" fill="currentColor"/>
                  <text x="50" y="60" fontSize="7" fontWeight="bold" textAnchor="middle" fill="#d97706">ZATCA</text>
                  <rect x="30" y="30" width="30" height="15" fill="currentColor" opacity="0.8"/>
                  <rect x="65" y="65" width="30" height="30" fill="currentColor"/>
                </svg>
              </div>
              <div className="text-[11px] font-sans text-slate-500 leading-normal max-w-[190px]">
                <p className="font-bold text-slate-800">فاتورة إلكترونية معتمدة</p>
                <p>مشفر باسم مكتب سما المملكة للفوترة الرقمية والتسجيل في هيئة الزكاة والضريبة والجمارك بالمملكة.</p>
              </div>
            </div>

            {/* Price Calculations Column */}
            <div className="w-full md:w-80 font-mono text-sm space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>إجمالي الخاضع للضريبة (أتعاب المكتب):</span>
                <span>{transaction.officeFee.toFixed(2)} ر.س</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>ضريبة القيمة المضافة (15%):</span>
                <span>{transaction.tax.toFixed(2)} ر.س</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>الرسوم والمصاريف الحكومية المستحقة والمسددة:</span>
                <span>{transaction.govFee.toFixed(2)} ر.س</span>
              </div>

              {transaction.paymentCurrency && (
                <div className="flex items-center justify-between text-[11px] font-sans print:hidden py-1.5 border-b border-t border-dashed border-slate-200 mt-1 select-none">
                  <span className="text-slate-500 font-bold">عملة العرض الدولي:</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedDisplayCurrency('USD')}
                      className={`px-2 py-0.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                        selectedDisplayCurrency === 'USD'
                          ? 'bg-amber-500 text-slate-950 border border-amber-600'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                      }`}
                    >
                      USD ($)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDisplayCurrency('EUR')}
                      className={`px-2 py-0.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                        selectedDisplayCurrency === 'EUR'
                          ? 'bg-amber-500 text-slate-950 border border-amber-600'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                      }`}
                    >
                      EUR (€)
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1 border-t-2 border-slate-900 pt-2 bg-amber-50 p-2.5 rounded">
                <div className="flex justify-between font-black text-slate-950 text-sm md:text-base">
                  <span className="font-sans">الإجمالي النهائي المستحق:</span>
                  <span>{transaction.total.toFixed(2)} ر.س</span>
                </div>
                
                {transaction.paymentCurrency && (
                  <div className="flex justify-between items-center border-t border-amber-200/50 pt-1.5 mt-1 text-emerald-900 font-bold text-xs md:text-sm animate-fade-in font-sans">
                    <span className="flex items-center gap-1">
                      <span>إجمالي سداد ({selectedDisplayCurrency === 'USD' ? 'دولار أمريكي' : 'يورو أوروبي'}):</span>
                    </span>
                    <span className="font-mono text-sm md:text-[15px] font-black">
                      {(transaction.total * (selectedDisplayCurrency === 'USD' ? 0.266 : 0.245)).toFixed(2)} {selectedDisplayCurrency === 'USD' ? 'USD $' : 'EUR €'}
                    </span>
                  </div>
                )}
              </div>

              {transaction.paymentCurrency && (
                <div className="text-[9.5px] text-slate-400 font-sans text-left mt-1 select-none flex justify-between px-1">
                  <span>* سعر الصرف ومكافئ التحويل الدولي:</span>
                  <span className="font-mono font-bold">1 SAR = {selectedDisplayCurrency === 'USD' ? '0.266 USD' : '0.245 EUR'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bank Payment Details Box (Robust security details with manual verification block for physical invoices) */}
          {(() => {
            const activeCountry = COUNTRIES_BANKS.find(c => c.code === selectedCountryCode) || COUNTRIES_BANKS[0];
            return (
              <div className="mt-6 border border-slate-300 rounded-xl p-4 bg-slate-50/70 font-sans relative overflow-hidden" dir={lang === 'en' ? 'ltr' : 'rtl'}>
                {/* Non-printable adaptive country selector to modify target bank */}
                <div className="mb-4 pb-3 border-b border-dashed border-slate-200 print:hidden flex flex-wrap justify-between items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                    <span>🌍 {lang === 'en' ? "Client's Country of Residence:" : "دولة تواجد العميل للتحصيل المحلي:"}</span>
                    <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px]">كشف تلقائي وعالمي</span>
                  </div>
                  <select
                    value={selectedCountryCode}
                    onChange={(e) => setSelectedCountryCode(e.target.value)}
                    className="bg-white border border-slate-300 hover:border-slate-400 focus:border-emerald-500 text-slate-800 text-xs px-2.5 py-1 rounded-lg outline-none font-bold transition-all cursor-pointer"
                  >
                    {COUNTRIES_BANKS.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {lang === 'en' ? c.nameEn : c.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-2 mb-3 gap-2">
                  <span className="font-black text-slate-900 text-sm">
                    {lang === 'en' ? '🏛️ Bank Settlement & Payment Details' : '🏛️ حسابات السداد والتسوية البنكية والتحصيل الدولي'}
                  </span>
                  <span className="px-3.5 py-1 bg-amber-500 text-slate-950 font-sans text-xs font-black rounded-lg border border-amber-600 shadow-sm flex items-center gap-1.5">
                    <span>{activeCountry.flag}</span>
                    <span>{lang === 'en' ? `Bank: ${activeCountry.bankNameEn}` : `البنك: ${activeCountry.bankNameAr}`}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                  <div className="space-y-2 text-right">
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500 font-bold">{lang === 'en' ? 'Beneficiary Name:' : 'اسم صاحب الحساب المستفيد:'}</span>
                      <span className="text-slate-900 font-extrabold">{lang === 'en' ? activeCountry.beneficiaryEn : activeCountry.beneficiaryAr}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500 font-bold font-mono">{lang === 'en' ? 'IBAN No:' : 'رقم الآيبان الدولي (IBAN):'}</span>
                      <span className="text-slate-900 font-black font-mono tracking-wider">{activeCountry.iban}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500 font-bold font-mono">{lang === 'en' ? 'SWIFT BIK Code:' : 'رمز السويفت كود (SWIFT):'}</span>
                      <span className="text-slate-900 font-black font-mono tracking-wider">{activeCountry.swift}</span>
                    </div>
                    {activeCountry.exchangeRate !== 1.0 && (
                      <div className="flex justify-between gap-2 mt-2 pt-2 border-t border-slate-200 bg-emerald-50 p-1.5 rounded border border-emerald-200">
                        <span className="text-emerald-800 font-extrabold">{lang === 'en' ? 'Local Equivalent Value:' : 'الإجمالي المعادل بالعملة المحلية:'}</span>
                        <span className="text-emerald-950 font-black font-mono">
                          {(transaction.total * activeCountry.exchangeRate).toFixed(2)} {lang === 'en' ? activeCountry.currencyEn : activeCountry.currencyAr}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className={`pt-3 md:pt-0 border-t md:border-t-0 border-slate-200 space-y-2 ${lang === 'en' ? 'md:border-l md:pl-4' : 'md:border-r md:pr-4'}`}>
                    <label className="block text-xs font-black text-slate-800 text-right">
                      {lang === 'en' ? 'Manual Transfer Reference / Tx ID:' : 'مرجع الحوالة البنكية / الرمز المرجعي (تعبئة يدوية):'}
                    </label>
                    <div className="w-full border-b-2 border-slate-400 border-dashed h-8 flex items-center justify-center text-slate-400 text-[10px] font-mono select-none">
                      .................................................................
                    </div>
                    <span className="block text-[9.5px] text-slate-400 font-sans text-right leading-relaxed">
                      {lang === 'en' ? `(${activeCountry.notesEn})` : `(${activeCountry.notesAr})`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Special Notes */}
          {transaction.notes && (
            <div className="mt-8 p-3.5 bg-slate-50 border-r-4 border-amber-600 text-xs rounded text-slate-600 font-sans">
              <span className="font-bold text-slate-800 block mb-1">ملاحظات المستند المالي:</span>
              {transaction.notes}
            </div>
          )}

          {/* Footer of Receipt */}
          <div className="mt-12 text-center text-[11px] text-slate-400 border-t border-slate-100 pt-4">
            {lang === 'en' 
              ? 'This invoice is considered an official document to prove the completion and authorization of transactions through the Bureau of Sama Al-Mamlakah. Thank you for your precious trust.'
              : 'تعتبر هذه الفاتورة مستند رسمي لإثبات إنهاء وتعميد المعاملات عبر مكتب سما المملكة. نشكركم لثقتكم الغالية بنا.'}
          </div>

          {/* Dedicated Print-Only Bottom Branding Footer */}
          <div 
            id="print-only-office-footer"
            className={`hidden pt-2.5 mt-10 border-t border-slate-400 justify-between items-center text-[9.5px] text-slate-600 font-sans tracking-tight ${
              showPdfPreview ? 'flex' : 'print:flex'
            }`}
            dir={lang === 'en' ? 'ltr' : 'rtl'}
          >
            <div className="flex items-center gap-3 font-mono text-[9px] font-bold text-slate-700">
              <span>{lang === 'en' ? 'Email: info@sama.sa' : 'البريد الإلكتروني: info@sama.sa'}</span>
              <span>•</span>
              <span>{lang === 'en' ? 'Phone / WA: 0500000000' : 'هاتف / واتساب: 0500000000'}</span>
              <span>•</span>
              <span>{lang === 'en' ? 'Address: Riyadh, KSA' : 'العنوان: الرياض، المملكة العربية السعودية'}</span>
            </div>
            <div className="text-right">
              <span className="font-extrabold text-slate-900 text-[9.5px]">{lang === 'en' ? 'Sama Al-Mamlakah Government Services' : 'مكتب سما المملكة المعتمد للخدمات الحكومية والتعقيب'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

        {/* Foot toolbar for cancellation */}
        <div className={`bg-slate-50 px-6 py-3 flex justify-end gap-2.5 border-t border-slate-200 print:hidden ${lang === 'en' ? 'flex-row-reverse' : ''}`}>
          <button
            id="print-invoice-footer-btn"
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 px-5 py-2 rounded-lg font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer border border-amber-600"
          >
            <Printer className="w-4 h-4" />
            <span>{lang === 'en' ? 'Print Professional Layout' : 'طباعة مستند الفاتورة'}</span>
          </button>
          <button
            id="print-preview-footer-btn"
            type="button"
            onClick={handlePrintPreview}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-350 text-amber-500 hover:text-amber-400 px-5 py-2 rounded-lg font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
            title={lang === 'en' ? 'Open inside browser new window for proofreading' : 'فتح معاينة مستقلة في نافذة جديدة قبل الطباعة'}
          >
            <Eye className="w-4 h-4" />
            <span>{lang === 'en' ? 'Print Preview' : 'معاينة الطباعة'}</span>
          </button>
          <button
            id="whatsapp-share-footer-btn"
            type="button"
            onClick={() => {
              setShowWhatsAppPanel(!showWhatsAppPanel);
              const element = document.getElementById('autoprint-toggle-checkbox');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer border ${
              showWhatsAppPanel
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-800'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{lang === 'en' ? 'WhatsApp Gateway' : 'إرسال الفاتورة عبر الواتساب'}</span>
          </button>
          <button
            id="close-invoice-modal-btn"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-sm font-bold rounded-lg transition-colors cursor-pointer"
          >
            {lang === 'en' ? 'Close View' : 'إغلاق العرض'}
          </button>
        </div>
      </div>

      {/* Subtle print-ready loading card */}
      {isPreparingPrint && (
        <div id="print-loader-overlay" className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/75 backdrop-blur-xs animate-fade-in print:hidden">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-sm w-full mx-4 space-y-6 text-center text-white font-sans">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center bg-amber-500/10 rounded-full border border-amber-500/30">
              <Printer className="w-8 h-8 text-amber-500 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-2 border-t-amber-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-base font-black text-slate-100">
                {lang === 'en' ? 'Preparing Printable Layout' : 'جاري تهيئة تنسيق الطباعة عالي الدقة'}
              </h4>
              <p className="text-xs text-slate-300 font-medium min-h-[36px] flex items-center justify-center px-2 leading-relaxed">
                {printProgress < 35 ? (
                  lang === 'en' ? 'Optimizing document margins & typography...' : 'جاري تجهيز وتنسيق الهوامش والخطوط للمستند المالي...'
                ) : printProgress < 75 ? (
                  lang === 'en' ? 'Rendering clean VAT breakdown grids (A4)...' : 'محاذاة البنود والتحقق من الحقول الضريبية...'
                ) : (
                  lang === 'en' ? 'Launching secure system printing dialog box...' : 'يجري الآن إطلاق معالج الطباعة التلقائي لمتصفحك...'
                )}
              </p>
            </div>
            
            <div className="space-y-1.5">
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-750">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-amber-655 h-full rounded-full transition-all duration-150 ease-out"
                  style={{ width: `${printProgress}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono font-bold px-1">
                <span>{printProgress}%</span>
                <span>A4 LAYOUT</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
