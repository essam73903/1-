import React, { useState, useEffect } from 'react';
import { 
  X, CreditCard, Wallet, Receipt, DollarSign, ShieldCheck, 
  CheckCircle2, Clock, Phone, Fingerprint, Upload, Building, 
  ArrowLeft, ArrowRight, Printer, Download, Eye, FileText, Globe, AlertCircle 
} from 'lucide-react';
import { Service, AttachedFile, BookingRequest } from '../types';

interface CheckoutPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
  clientName: string;
  clientPhone: string;
  clientNotes: string;
  attachedFiles: AttachedFile[];
  onPaymentSuccess: (
    booking: BookingRequest, 
    paymentMethod: 'mada' | 'visa' | 'applepay' | 'stcpay' | 'bank_transfer' | 'cash', 
    amount: number, 
    details?: any
  ) => void;
  lang: 'ar' | 'en';
}

export default function CheckoutPaymentModal({
  isOpen,
  onClose,
  service,
  clientName,
  clientPhone,
  clientNotes,
  attachedFiles,
  onPaymentSuccess,
  lang,
}: CheckoutPaymentModalProps) {
  // Checkout flow state
  const [step, setStep] = useState<'options' | 'input' | 'secure_otp' | 'success'>('options');
  const [paymentMethod, setPaymentMethod] = useState<'mada' | 'visa' | 'applepay' | 'stcpay' | 'bank_transfer' | 'cash' | null>(null);
  
  // Form fields
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardBrand, setCardBrand] = useState<'mada' | 'visa' | 'mastercard' | 'unknown'>('unknown');
  
  // STC Pay & Apple Pay Simulation fields
  const [stcPhone, setStcPhone] = useState(clientPhone || '05');
  const [stcOtpSent, setStcOtpSent] = useState(false);
  const [stcOtp, setStcOtp] = useState('');
  const [stcTimer, setStcTimer] = useState(45);
  
  // Bank Transfer fields
  const [selectedBank, setSelectedBank] = useState<'rajhi' | 'snb'>('rajhi');
  const [transferSlip, setTransferSlip] = useState<File | null>(null);
  const [transferSlipBase64, setTransferSlipBase64] = useState<string | null>(null);
  const [transferIsUploading, setTransferIsUploading] = useState(false);

  // SMS 3D Secure OTP Verification State
  const [smsOtp, setSmsOtp] = useState('');
  const [smsError, setSmsError] = useState('');
  const [isProcessingTx, setIsProcessingTx] = useState(false);
  const [processingStatusText, setProcessingStatusText] = useState('');
  
  // Generated success receipt
  const [receiptCode, setReceiptCode] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paymentDate, setPaymentDate] = useState('');

  // Reset modal state when closed or opened
  useEffect(() => {
    if (isOpen) {
      setStep('options');
      setPaymentMethod(null);
      setCardName('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setCardBrand('unknown');
      setStcPhone(clientPhone || '05');
      setStcOtpSent(false);
      setStcOtp('');
      setTransferSlip(null);
      setTransferSlipBase64(null);
      setSmsOtp('');
      setSmsError('');
      setIsProcessingTx(false);
      setReceiptCode(`SM-PAY-${Math.floor(Math.random() * 90000) + 10000}`);
      setTransactionId(`TX${Date.now().toString().substring(4)}`);
      setPaymentDate(new Date().toISOString());
    }
  }, [isOpen, clientPhone]);

  // Handle STC CountDown timer simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (stcOtpSent && stcTimer > 0) {
      interval = setInterval(() => {
        setStcTimer(t => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [stcOtpSent, stcTimer]);

  // Autotrigger print dialog immediately on successful receipt generation if configured
  useEffect(() => {
    if (step === 'success') {
      const isAutoPrintEnabled = localStorage.getItem('sm_auto_print') === 'true';
      if (isAutoPrintEnabled) {
         const printTimer = setTimeout(() => {
           window.print();
         }, 600);
         return () => clearTimeout(printTimer);
      }
    }
  }, [step]);

  if (!isOpen || !service) return null;

  // Pricing calculations
  const govFee = service.govFee || 0;
  const officeFee = service.officeFee || 0;
  const additionalFeesSum = service.additionalFees?.reduce((acc, f) => acc + f.amount, 0) || 0;
  const tax = officeFee * 0.15;
  const total = govFee + officeFee + additionalFeesSum + tax;

  // Detect card brand based on starting digit
  const handleCardNumberChange = (value: string) => {
    // strip non-digits
    const digits = value.replace(/\D/g, '').substring(0, 16);
    
    // format as xxxx xxxx xxxx xxxx
    let formatted = '';
    for (let i = 0; i < digits.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += ' ';
      }
      formatted += digits[i];
    }
    setCardNumber(formatted);

    // Brand detection
    if (digits.startsWith('4')) {
      setCardBrand('visa');
    } else if (digits.startsWith('5')) {
      setCardBrand('mastercard');
    } else if (digits.startsWith('9') || digits.startsWith('6') || digits.startsWith('58')) {
      setCardBrand('mada');
    } else if (digits.length > 0) {
      setCardBrand('unknown');
    } else {
      setCardBrand('unknown');
    }
  };

  const handleExpiryChange = (value: string) => {
    const digits = value.replace(/\D/g, '').substring(0, 4);
    if (digits.length >= 3) {
      setCardExpiry(`${digits.substring(0, 2)}/${digits.substring(2)}`);
    } else {
      setCardExpiry(digits);
    }
  };

  const handleCvvChange = (value: string) => {
    const digits = value.replace(/\D/g, '').substring(0, 3);
    setCardCvv(digits);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTransferSlip(file);
    setTransferIsUploading(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      setTransferSlipBase64(reader.result as string);
      setTransferIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Step 2 Submission to secure OTP or complete immediately
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSmsError('');

    if (paymentMethod === 'mada' || paymentMethod === 'visa') {
      if (cardNumber.replace(/\s/g, '').length < 16) {
        setSmsError(lang === 'en' ? 'Card number must be 16 digits' : 'رقم البطاقة غير مكتمل (يجب أن يكون مكون من ١٦ خانة)');
        return;
      }
      if (cardExpiry.length < 5) {
        setSmsError(lang === 'en' ? 'Invalid Expiry date' : 'تاريخ الصلاحية غير دائم أو غير صحيح (MM/YY)');
        return;
      }
      if (cardCvv.length < 3) {
        setSmsError(lang === 'en' ? 'Invalid CVV' : 'رمز التحقق (CVV) غير مكتمل');
        return;
      }
      
      // Navigate to Secure 3DS OTP
      setStep('secure_otp');
    } else if (paymentMethod === 'stcpay') {
      if (!stcOtpSent) {
        setStcOtpSent(true);
        setStcTimer(45);
      } else {
        if (stcOtp.length < 4) {
          setSmsError(lang === 'en' ? 'Enter a 4-digit OTP' : 'يرجى كتابة رمز التحقق المكون من ٤ أرقام');
          return;
        }
        processSecureExecution();
      }
    } else if (paymentMethod === 'applepay' || paymentMethod === 'bank_transfer' || paymentMethod === 'cash') {
      processSecureExecution();
    }
  };

  // Triggers professional simulated banking gateways delays
  const processSecureExecution = () => {
    setIsProcessingTx(true);
    let delayTextIndex = 0;
    const arabicTexts = [
      'جاري الاتصال بالنظام البنكي البيني ومصرف الراجحي للتفويض...',
      'يتصل بخدمات الحماية لشبكة الدفع السعودية الموحدة (Mada SAMA)...',
      'يجري خصم الرسوم وتوثيق القنوات الأمنية وتحديث الضمان المعياري...',
      'يربط السداد بالرقم المرجعي وإصدار شهادة التعميد الفورية بنجاح!'
    ];
    const englishTexts = [
      'Establishing secure channel to Saudi Central Bank (SAMA)...',
      'Verifying credit accounts & initiating internal 3D-Secure logs...',
      'Debiting fee amount and registering transaction ID globally...',
      'Publishing digital receipts and updating local office ledger!'
    ];

    const texts = lang === 'en' ? englishTexts : arabicTexts;
    setProcessingStatusText(texts[0]);

    const interval = setInterval(() => {
      delayTextIndex++;
      if (delayTextIndex < texts.length) {
        setProcessingStatusText(texts[delayTextIndex]);
      } else {
        clearInterval(interval);
        
        // Finalize transaction mapping
        let metadata: any = {};
        if (paymentMethod === 'mada' || paymentMethod === 'visa') {
          metadata = {
            cardEnding: cardNumber.substring(cardNumber.length - 4),
            transactionId: transactionId,
          };
        } else if (paymentMethod === 'stcpay') {
          metadata = {
            stcPhone: stcPhone,
            transactionId: transactionId,
          };
        } else if (paymentMethod === 'bank_transfer') {
          metadata = {
            bankName: selectedBank === 'rajhi' ? 'مصرف الراجحي' : 'البنك الأهلي السعودي (SNB)',
            transferReceiptName: transferSlip ? transferSlip.name : 'سند بنكي مرفق',
            transactionId: transactionId,
          };
        } else {
          metadata = {
            transactionId: transactionId,
          };
        }

        const bookingObj: BookingRequest = {
          id: `bk-${Date.now()}`,
          clientName: clientName,
          phoneNumber: clientPhone,
          serviceId: service.id,
          serviceName: service.name,
          status: paymentMethod === 'bank_transfer' ? 'pending' : 'pending', // Keeps office protocol active
          notes: clientNotes,
          date: paymentDate,
          paymentMethod: paymentMethod!,
          paymentStatus: paymentMethod === 'bank_transfer' 
            ? 'processing_transfer' 
            : paymentMethod === 'cash' 
              ? 'unpaid' 
              : 'paid',
          paymentDetails: metadata,
          totalAmount: total,
        };

        // Fire Callback
        onPaymentSuccess(bookingObj, paymentMethod!, total, metadata);

        setIsProcessingTx(false);
        setStep('success');
      }
    }, 1500);
  };

  const handleSmsOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (smsOtp !== '1234') {
      setSmsError(lang === 'en' ? 'Incorrect OTP code. Please use 1234 for testing purposes.' : 'رمز التحقق ثنائي الأبعاد المدخل غير صحيح. يرجى استخدام الرمز الافتراضي (1234) للتجربة والتعميد الفوري.');
      return;
    }
    setSmsError('');
    processSecureExecution();
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 overflow-y-auto animate-fade-in" dir={lang === 'en' ? 'ltr' : 'rtl'}>
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border-2 border-slate-900 overflow-hidden my-4 relative">
        
        {/* Header Toolbar */}
        <div className="bg-slate-950 text-white px-5 py-4 flex justify-between items-center select-none print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500 animate-pulse" />
            <div className="text-right">
              <span className="font-bold text-sm block">
                {lang === 'en' ? 'Secure Checkout Gateway' : 'بوابة السداد الإلكتروني والتعميد الفوري'}
              </span>
              <span className="text-[10px] text-emerald-400 block font-mono">
                {lang === 'en' ? 'SAMA Compliant • 256-bit Encrypted' : 'معتمد من البنك المركزي السعودي • مشفر ومحمي'}
              </span>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Step Content */}
        <div className="p-6">
          
          {/* Progress Indicators */}
          {step !== 'success' && (
            <div className="flex items-center justify-between pb-6 border-b border-slate-100 font-bold text-xs select-none print:hidden">
              <div className="flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center ${step === 'options' ? 'bg-amber-600 text-slate-950' : 'bg-slate-200 text-slate-600'}`}>١</span>
                <span>{lang === 'en' ? 'Choose Channel' : 'وسيلة الدفع'}</span>
              </div>
              <div className="h-[1px] bg-slate-200 flex-1 mx-3"></div>
              <div className="flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center ${step === 'input' ? 'bg-amber-600 text-slate-950' : 'bg-slate-200 text-slate-600'}`}>٢</span>
                <span>{lang === 'en' ? 'Enter Details' : 'البيانات'}</span>
              </div>
              <div className="h-[1px] bg-slate-200 flex-1 mx-3"></div>
              <div className="flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center ${step === 'secure_otp' ? 'bg-amber-600 text-slate-950' : 'bg-slate-200 text-slate-600'}`}>٣</span>
                <span>{lang === 'en' ? 'Secure Verification' : 'التحقق الآمن'}</span>
              </div>
            </div>
          )}

          {/* Core Price Summary Box (Sticky style for checkout context) */}
          {step !== 'success' && (
            <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-4 my-4 font-sans relative">
              <div className="absolute top-3.5 left-4 text-left">
                <span className="text-[10px] text-slate-500 block">{lang === 'en' ? 'Total with VAT' : 'الإجمالي شامل الضريبة'}</span>
                <span className="text-xl font-black text-amber-700 font-mono">{total.toFixed(2)} <span className="text-xs font-bold">{lang === 'en' ? 'SAR' : 'ر.س'}</span></span>
              </div>
              <div className={lang === 'en' ? 'text-left' : 'text-right'}>
                <span className="text-[10px] bg-amber-200/50 text-amber-800 px-2.5 py-0.5 rounded-full font-bold">
                  {lang === 'en' ? 'Service Order Bill' : 'تفاصيل استحقاق الخدمة المحددة'}
                </span>
                <h4 className="font-extrabold text-slate-900 text-sm mt-1.5">{service.name}</h4>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] text-slate-500 font-mono">
                  <span>{lang === 'en' ? 'Gov Fees:' : 'رسوم جهة الدولة:'} {govFee.toFixed(2)} {lang === 'en' ? 'SAR' : 'ر.س'}</span>
                  <span>{lang === 'en' ? 'Office Fees:' : 'أتعاب المكتب:'} {officeFee.toFixed(2)} {lang === 'en' ? 'SAR' : 'ر.س'}</span>
                  <span>{lang === 'en' ? 'VAT (15%):' : 'الضريبة المضافة:'} {tax.toFixed(2)} {lang === 'en' ? 'SAR' : 'ر.س'}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: OPTIONS */}
          {step === 'options' && (
            <div className="space-y-4 print:hidden animate-fade-in font-sans">
              <p className="text-slate-700 text-xs font-bold text-center">
                {lang === 'en' ? 'Select your secure payment channel to proceed with official certification:' : 'اختر قناة الدفع الإلكترونية المفضلة لتفعيل معالجة الطلب فورياً عبر بوابة سما الآمنة:'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {/* 1. MADA */}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('mada');
                    setStep('input');
                  }}
                  className="bg-slate-50 hover:bg-slate-100/90 border border-slate-200 hover:border-blue-500 p-4 rounded-xl flex items-center justify-between text-right group transition-all cursor-pointer shadow-sm"
                >
                  <div className="space-y-1">
                    <span className="font-extrabold text-sm text-slate-850 group-hover:text-blue-600 transition-colors">بطاقة مدى البنكية</span>
                    <span className="text-[10px] text-slate-500 block">يقبل كافة البنوك السعودية مباشرة</span>
                  </div>
                  <div className="w-12 h-6 flex items-center justify-center bg-white border border-slate-200 rounded p-1">
                    {/* mada stylized simulated graphic logo */}
                    <span className="text-[8px] font-black text-amber-600 tracking-tighter">Mada/مدى</span>
                  </div>
                </button>

                {/* 2. VISA / MC */}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('visa');
                    setStep('input');
                  }}
                  className="bg-slate-50 hover:bg-slate-100/90 border border-slate-200 hover:border-indigo-500 p-4 rounded-xl flex items-center justify-between text-right group transition-all cursor-pointer shadow-sm"
                >
                  <div className="space-y-1">
                    <span className="font-extrabold text-sm text-slate-850 group-hover:text-indigo-600 transition-colors">فيزا / ماستركارد</span>
                    <span className="text-[10px] text-slate-500 block">بطاقات الائتمان والدفع الدولية والمحلية</span>
                  </div>
                  <div className="flex gap-1">
                    <span className="text-[7px] font-mono font-bold bg-white text-blue-800 px-1 border border-slate-200 rounded">VISA</span>
                    <span className="text-[7px] font-mono font-bold bg-white text-orange-600 px-1 border border-slate-200 rounded">MC</span>
                  </div>
                </button>

                {/* 3. APPLE PAY */}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('applepay');
                    setStep('input');
                  }}
                  className="bg-slate-950 hover:bg-slate-900 border border-slate-850 p-4 rounded-xl flex items-center justify-between text-right group transition-all text-white cursor-pointer shadow-md"
                >
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-sm text-amber-400 group-hover:text-white transition-colors flex items-center gap-1">
                      <span>Apple Pay</span>
                    </span>
                    <span className="text-[9px] text-slate-400 block font-sans">تسديد بنقرة واحدة فائقة الأمان</span>
                  </div>
                  <div className="flex items-center justify-center bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold font-mono text-white">
                     Pay
                  </div>
                </button>

                {/* 4. STC PAY */}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('stcpay');
                    setStep('input');
                  }}
                  className="bg-[#faf5ff] hover:bg-[#f3e8ff] border border-purple-200 hover:border-purple-500 p-4 rounded-xl flex items-center justify-between text-right group transition-all cursor-pointer shadow-sm"
                >
                  <div className="space-y-1">
                    <span className="font-extrabold text-sm text-purple-950 group-hover:text-purple-700 transition-colors">STC Pay</span>
                    <span className="text-[10px] text-purple-600 block">المحفظة الرقمية لشركة الاتصالات</span>
                  </div>
                  <div className="bg-purple-600 text-white font-black px-2 py-0.5 rounded text-[9px] font-mono">
                    stc pay
                  </div>
                </button>

                {/* 5. BANK TRANSFERS */}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('bank_transfer');
                    setStep('input');
                  }}
                  className="bg-slate-50 hover:bg-slate-100/90 border border-slate-200 hover:border-emerald-500 p-4 rounded-xl flex items-center justify-between text-right group transition-all cursor-pointer shadow-sm"
                >
                  <div className="space-y-1">
                    <span className="font-extrabold text-sm text-slate-850 group-hover:text-emerald-700 transition-colors">التحويل البنكي الفوري</span>
                    <span className="text-[10px] text-slate-500 block">تحويل مباشر إلى أحد حساباتنا ومصارفنا</span>
                  </div>
                  <Building className="w-5 h-5 text-emerald-600" />
                </button>

                {/* 6. OFFICE CASH / PAY LATER */}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('cash');
                    setStep('input');
                  }}
                  className="bg-slate-50 hover:bg-slate-100/90 border border-slate-200 hover:border-amber-600 p-4 rounded-xl flex items-center justify-between text-right group transition-all cursor-pointer shadow-sm"
                >
                  <div className="space-y-1">
                    <span className="font-extrabold text-sm text-slate-850 group-hover:text-amber-700 transition-colors">الدفع لاحقاً في مقر المكتب</span>
                    <span className="text-[10px] text-slate-500 block">حفظ المعاملة كحجر وتسديد نقدي بموقعنا</span>
                  </div>
                  <DollarSign className="w-5 h-5 text-amber-600" />
                </button>

              </div>

              {/* Secure guarantee footnotes */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-[10px] text-slate-500 leading-normal font-sans text-center flex items-center justify-center gap-1.5 pt-4">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>جميع المدخلات الموفرة محمية ومزودة بحماية المصادقة المشددة للبيانات البنكية المشفرة بالكامل.</span>
              </div>
            </div>
          )}

          {/* STEP 2: INPUT FORMS FOR DIFFERENT METHODS */}
          {step === 'input' && (
            <div className="space-y-4 print:hidden animate-fade-in font-sans">
              
              {/* Back button */}
              <button 
                type="button"
                onClick={() => setStep('options')} 
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold transition-colors select-none"
              >
                <ArrowRight className="w-4 h-4" />
                <span>{lang === 'en' ? 'Back to Payment Methods' : 'الرجوع لاختيار طريقة الدفع'}</span>
              </button>

              {/* SUBform A: CARDS (MADA / VISA / MASTERCARD) */}
              {(paymentMethod === 'mada' || paymentMethod === 'visa') && (
                <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-2">
                  <div className="flex items-center justify-between border-b pb-1">
                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-amber-600" />
                      <span>{lang === 'en' ? 'Card Information Details' : 'أدخل بيانات بطاقتك الائتمانية / مدى'}</span>
                    </h4>
                    {/* Card Brand Badge visual indicators */}
                    <div className="flex gap-1.5 items-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border transition-all ${cardBrand === 'mada' ? 'bg-blue-50 border-blue-400 text-blue-700 font-black' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>MADY / مدى</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border transition-all ${cardBrand === 'visa' ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-black' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>VISA</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border transition-all ${cardBrand === 'mastercard' ? 'bg-orange-50 border-orange-400 text-orange-700 font-black' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>MASTER</span>
                    </div>
                  </div>

                  {smsError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                      <span>{smsError}</span>
                    </div>
                  )}

                  {/* VISUAL REALISTIC CREDIT CARD GRAPHIC */}
                  <div className="bg-gradient-to-tr from-slate-900 to-slate-800 text-white p-5 rounded-2xl border border-slate-700 shadow-lg space-y-6 relative overflow-hidden select-none select-none my-2 font-mono">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-slate-400 font-sans font-extrabold">Sama Mada Card Wallet</span>
                      <div className="font-bold text-amber-500 text-sm">
                        {cardBrand === 'mada' ? 'مدى 🇸🇦' : cardBrand === 'visa' ? 'VISA 💳' : cardBrand === 'mastercard' ? 'MASTER 💳' : 'Credit 💳'}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Formatted Number Display */}
                      <div className="text-lg md:text-xl font-bold tracking-widest text-slate-100 font-mono py-1">
                        {cardNumber || '•••• •••• •••• ••••'}
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-sans">اسم صاحب البطاقة</span>
                          <span className="font-bold tracking-wide uppercase font-sans truncate block max-w-[180px]">{cardName || 'CARDHOLDER NAME'}</span>
                        </div>
                        <div className="text-left">
                          <span className="text-[9px] text-slate-400 block font-sans">تاريخ الانتهاء</span>
                          <span className="font-bold">{cardExpiry || 'MM/YY'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card input controls */}
                  <div className="space-y-3 font-sans">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">اسم حامل البطاقة (بالترميز اللاتيني):</label>
                      <input
                        type="text"
                        required
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="e.g. ABDULLAH M ALOTAIBI"
                        className="w-full p-2.5 border border-slate-300 rounded focus:border-amber-500 focus:outline-none text-sm font-sans font-medium uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">رقم بطاقة الدفع (١٦ رقم):</label>
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        placeholder="4000 1234 5678 9010"
                        className="w-full p-2.5 border border-slate-300 rounded focus:border-amber-500 focus:outline-none text-sm font-mono tracking-wider"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ نهاية الصلاحية:</label>
                        <input
                          type="text"
                          required
                          value={cardExpiry}
                          onChange={(e) => handleExpiryChange(e.target.value)}
                          placeholder="MM/YY"
                          className="w-full p-2.5 border border-slate-300 rounded focus:border-amber-500 focus:outline-none text-sm font-mono tracking-wider text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">رمز الأمان (CVV خلف البطاقة):</label>
                        <input
                          type="password"
                          required
                          value={cardCvv}
                          onChange={(e) => handleCvvChange(e.target.value)}
                          placeholder="•••"
                          className="w-full p-2.5 border border-slate-300 rounded focus:border-amber-500 focus:outline-none text-sm font-mono tracking-widest text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Secure checkout */}
                  <button
                    type="submit"
                    className="w-full bg-slate-900 border border-slate-900 text-white font-bold py-3 px-4 rounded-xl hover:bg-slate-850 mt-4 flex items-center justify-center gap-2 select-none"
                  >
                    <ShieldCheck className="w-5 h-5 text-amber-500" />
                    <span>إرسال وتوثيق تفاصيل البطاقة عبر الحماية الثلاثية</span>
                  </button>
                </form>
              )}

              {/* SUBform B: APPLE PAY SIMULATION */}
              {paymentMethod === 'applepay' && (
                <div className="text-center space-y-6 py-6 font-sans">
                  <div className="bg-slate-950 text-white p-5 rounded-2xl max-w-sm mx-auto space-y-6 shadow-inner border border-slate-800">
                    <div className="flex justify-between items-center pb-2 border-b border-white/10 select-none">
                      <span className="text-[10px] text-slate-400 font-mono"> Apple Pay Gateway</span>
                      <span className="text-[10px] bg-emerald-500 text-slate-950 px-2.5 py-0.5 rounded-full font-bold">Secure Connection</span>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-bold text-slate-200">الدفع الفوري والتثبيت لطلبك</p>
                      <p className="text-xs text-slate-400 leading-relaxed">يرجى تأكيد السداد الفوري وتطبيق اللمس والمصادقة بالبصمة من خلال النقر المطول على الدائرة بالأسفل.</p>
                      
                      <div className="text-lg py-2 font-black text-amber-400 font-mono">
                        {total.toFixed(2)} ر.س
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handlePaymentSubmit}
                      className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-600 to-amber-500 text-slate-950 border-4 border-white/20 hover:border-amber-400 flex flex-col items-center justify-center mx-auto shadow-lg hover:shadow-amber-550/30 active:scale-95 transition-all text-xs font-black cursor-pointer group"
                    >
                      <Fingerprint className="w-8 h-8 text-slate-950 mb-1 group-hover:scale-110 transition-transform" />
                      <span>ضع بصمتك</span>
                    </button>
                    
                    <p className="text-[10px] text-slate-500 font-mono">طابور الدفع الآمن مدعوم بشفرة المعاملات البيومترية.</p>
                  </div>
                </div>
              )}

              {/* SUBform C: STC PAY SYSTEM INPUT */}
              {paymentMethod === 'stcpay' && (
                <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-2 font-sans">
                  <div className="flex items-center gap-2 text-purple-950 border-b pb-1.5">
                    <div className="bg-purple-600 text-white font-black px-1.5 py-0.5 rounded text-[10px] font-mono">stc pay</div>
                    <span className="font-extrabold text-sm">{lang === 'en' ? 'STC Pay Wallet Verification' : 'تعميد وتسديد المدفوعات عبر STC Pay'}</span>
                  </div>

                  {!stcOtpSent ? (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-600 leading-relaxed">
                        أدخل رقم الجوال المسجل بمحفظتك الرقمية لتطبيق STC Pay البنكي، وسيرسل إليك رمز الأمان المصادق عليه لإصدار الفاتورة فوراً.
                      </p>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">رقم جوال المحفظة الإلكترونية:</label>
                        <input
                          type="tel"
                          required
                          value={stcPhone}
                          onChange={(e) => setStcPhone(e.target.value)}
                          placeholder="e.g. 0501234567"
                          className="w-full p-2.5 border border-slate-300 rounded focus:border-amber-500 focus:outline-none text-sm font-mono tracking-wider"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-purple-700 text-white font-bold py-3 px-4 rounded-xl hover:bg-purple-800 transition-colors flex items-center justify-center gap-2"
                      >
                        <span>إرسال طلب التحقق للمحفظة عبر التطبيق</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 text-center">
                      <div className="p-3 bg-indigo-50 border border-indigo-250 text-indigo-800 text-xs rounded-lg font-sans leading-relaxed">
                        تم إرسال رمز التحقق المؤقت (OTP) إلى جهاز جوال رقم <strong className="font-mono text-slate-900">{stcPhone}</strong>. الرمز الافتراضي لتعميد التجربة الفوري المدعوم هو <strong className="text-indigo-950 font-bold">8591</strong>.
                      </div>

                      <div className="max-w-xs mx-auto space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">رقم الكود المكون من ٤ خانات:</label>
                        <input
                          type="text"
                          required
                          maxLength={4}
                          value={stcOtp}
                          onChange={(e) => setStcOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="8591"
                          className="w-full p-3 border-2 border-slate-300 rounded-lg text-center font-mono text-lg tracking-[8px] focus:border-amber-500 focus:outline-none"
                        />
                        <span className="text-[11px] text-slate-500 block">سينتهي الرمز خلال {stcTimer} ثانية</span>
                      </div>

                      <button
                        type="submit"
                        disabled={stcOtp.length < 4}
                        className="w-full bg-purple-700 disabled:bg-purple-400 text-white font-bold py-3 px-4 rounded-xl hover:bg-purple-800 transition-colors"
                      >
                        تأكيد الخصم المباشر وإصدار السند الإلكتروني
                      </button>
                    </div>
                  )}
                </form>
              )}

              {/* SUBform D: DIRECT BANK TRANSFER */}
              {paymentMethod === 'bank_transfer' && (
                <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-2 font-sans">
                  <div className="flex items-center gap-1.5 border-b pb-1.5 text-slate-800">
                    <Building className="w-4 h-4 text-emerald-600" />
                    <span className="font-extrabold text-sm">الحسابات البنكية الرسمية للمكتب وطرق التحويل</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    يمكنك القيام بالحوالة المالية المباشرة على أحد هذه الحسابات، ثم حدد البنك المحول منه وارفق صورة إيصال التحويل (Receipt File) أو تدوين رقم العملية لتدقيقها ماليًا.
                  </p>

                  {/* Bank Accounts visual cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2 select-none font-sans">
                    {/* Al Rajhi Card */}
                    <button
                      type="button"
                      onClick={() => setSelectedBank('rajhi')}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between text-right transition-all cursor-pointer ${selectedBank === 'rajhi' ? 'bg-amber-50/70 border-amber-500 shadow-sm' : 'bg-slate-50 border-slate-200'}`}
                    >
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block">مصرف الراجحي</span>
                        <span className="font-extrabold text-xs text-slate-900">مكتب سما للمقاولات والتخليص</span>
                      </div>
                      <div className="mt-3 text-right">
                        <span className="text-[9px] text-slate-500 block">الآيبان IBAN:</span>
                        <span className="text-[10px] font-mono font-bold text-slate-800 block select-all">SA9880000000123456789012</span>
                      </div>
                    </button>

                    {/* SNB Card */}
                    <button
                      type="button"
                      onClick={() => setSelectedBank('snb')}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between text-right transition-all cursor-pointer ${selectedBank === 'snb' ? 'bg-emerald-50/70 border-emerald-500 shadow-sm' : 'bg-slate-50 border-slate-200'}`}
                    >
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block">البنك الأهلي السعودي</span>
                        <span className="font-extrabold text-xs text-slate-900">مؤسسة سما المملكة التجارية</span>
                      </div>
                      <div className="mt-3 text-right">
                        <span className="text-[9px] text-slate-500 block">الآيبان IBAN:</span>
                        <span className="text-[10px] font-mono font-bold text-slate-800 block select-all">SA4310000000987654321098</span>
                      </div>
                    </button>
                  </div>

                  {/* Receipt Upload area */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5 text-emerald-500" />
                      <span>إرفاق صورة التحويل أو إيصال ترحيل الحوالة (اختياري لسرعة التدقيق):</span>
                    </label>

                    <div className="relative border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-lg p-4 bg-slate-50 flex flex-col items-center justify-center cursor-pointer min-h-[90px]">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="text-center space-y-1 pointer-events-none select-none">
                        <FileText className="w-6 h-6 text-slate-400 mx-auto" />
                        <p className="text-[11px] text-slate-600 font-bold">
                          {transferSlip ? `تم إرفاق: ${transferSlip.name}` : 'اسحب أو ارفع ملف إيصال الإيداع البنكي هنا'}
                        </p>
                        <p className="text-[9px] text-slate-400">يدعم صيغ الصور والهياكل المستندية المختلفة</p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={transferIsUploading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-3 px-4 rounded-xl mt-4 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأكيد الحوالة المصرفية وإرسال المعاملة للإدارة</span>
                  </button>
                </form>
              )}

              {/* SUBform E: PAY IN OFFICE / CASH */}
              {paymentMethod === 'cash' && (
                <div className="space-y-4 pt-2 font-sans">
                  <div className="p-4 bg-amber-50 border border-amber-200 text-amber-950 text-xs rounded-xl flex items-start gap-2.5 leading-relaxed">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <span className="font-extrabold block text-sm mb-1">تعليمات الدفع النقدي وحفظ المعاملة</span>
                      سيقوم مكتب سما المملكة بحجز وحفظ هذه المعاملة فورياً بملف قيد مالي معلق. يُعتمد تقديم طلب الخدمة وتفعيله حال تواجدكم بمقرنا لإتمام عملية السداد اليدوي وإصدار التخليص ماليًا.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={processSecureExecution}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl mt-4 select-none"
                  >
                    تأكيد المعاملة المعلقة والدفع لاحقًا بالمقر
                  </button>
                </div>
              )}

            </div>
          )}

          {/* STEP 3: OTP 3D SECURE MADA FORM */}
          {step === 'secure_otp' && (
            <div className="space-y-5 print:hidden animate-fade-in font-sans">
              <div className="p-5 border-2 border-slate-900 rounded-2xl space-y-4 bg-slate-50 text-slate-900 text-center relative max-w-sm mx-auto">
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-blue-100 text-blue-800 text-[8px] font-bold px-2 py-0.5 rounded-full select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                  <span>Mada PG Security Gate</span>
                </div>

                <div className="flex flex-col items-center">
                  <svg className="w-12 h-12 text-blue-600 mb-2" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="25" y="10" width="50" height="80" rx="8" fill="#1e3a8a" stroke="#1e3a8a" />
                    <rect x="35" y="22" width="30" height="35" rx="3" fill="#ffffff" />
                    <circle cx="50" cy="80" r="4" fill="#d97706" />
                    <path d="M43 35h14M43 42h14M48 49h4" stroke="#0f172a" strokeWidth={3} />
                  </svg>
                  <h4 className="font-black text-xs text-slate-900 uppercase tracking-widest leading-relaxed">
                    بوابة التحقق الآمن لمدفوعات البنك المركزي السعودي
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    لقد أرسلنا نظام الحماية كود تحقق مؤقت (OTP) إلى الهاتف المرتبط ببطاقتك لتأكيد سحب <span className="font-bold text-amber-700">{total.toFixed(2)} ر.س</span>.
                  </p>
                </div>

                {smsError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg select-none">
                    {smsError}
                  </div>
                )}

                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-[11px] rounded-lg">
                  💡 <strong>أغراض الاختبار والتحقق:</strong> يرجى إدخال الشفرة البنكية المعيارية الافتراضية للتعميد وهي: <span className="font-bold text-slate-900 font-mono text-xs">1234</span>
                </div>

                <form onSubmit={handleSmsOtpSubmit} className="space-y-3 font-sans">
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={smsOtp}
                    onChange={(e) => setSmsOtp(e.target.value)}
                    placeholder="رمز السداد OTP (1234)"
                    className="w-full p-2.5 border-2 border-slate-400 rounded-lg text-center font-mono text-[16px] tracking-[6px] focus:border-blue-600 focus:outline-none"
                  />
                  
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded-lg text-xs"
                    >
                      تأكيد والخصم المالي الآمن
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('input')}
                      className="bg-white border border-slate-300 text-slate-700 font-bold py-2 px-4 rounded-lg text-xs hover:bg-slate-50"
                    >
                      تراجع
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* SUBSET LOADING STATE */}
          {isProcessingTx && (
            <div className="absolute inset-0 z-40 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in font-sans">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-amber-600 border-t-transparent animate-spin"></div>
              </div>
              <h4 className="font-black text-slate-950 text-sm mt-5">{lang === 'en' ? 'Securing Transaction Connection...' : 'جاري تشفير وتعميد العملية البنكية...'}</h4>
              <p className="text-slate-500 text-xs mt-2 font-mono blink max-w-sm whitespace-pre-wrap">{processingStatusText}</p>
            </div>
          )}

          {/* STEP 4: SUCCESS RECEIPT SCREEN */}
          {step === 'success' && (
            <div className="space-y-4 animate-fade-in font-sans">
              
              {/* Confetti layout element */}
              <div className="text-center space-y-2 select-none print:hidden">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2 animate-bounce">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black text-emerald-950">
                  {lang === 'en' ? 'Payment Verified & Confirmed Successfully!' : 'تم سداد رسوم المعاملة وتعميد الحجز بنجاح غامر!'}
                </h3>
                <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
                  {lang === 'en'
                    ? 'Your billing is approved directly by Sama Kingdom online system. Your invoice and receipts are logged. Tracking is initiated automatically!'
                    : 'تم تأمين السداد الإلكتروني لطلبك وتجهيز سند القبض الرقمي وفاتورة الزكاة والضريبة المقترنة بالتفويض والجاهزة للتصدير.'}
                </p>
              </div>

              {/* PRINTABLE OFFICIAL VOUCHER (سند قبض رسمي) */}
              <div id="payment-receipt-print-area" className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-6 space-y-4 text-slate-900 relative">
                
                {/* Official Stamp */}
                <div className="absolute top-5 left-5 w-20 h-20 border-4 border-emerald-500/30 rounded-full flex flex-col items-center justify-center rotate-12 select-none pointer-events-none text-emerald-600/60 font-black text-center text-[10px]">
                  <span className="border-b border-emerald-500/20 pb-0.5">{lang === 'en' ? 'DEPOSITED' : 'مدفوعة'}</span>
                  <span className="text-[7px] tracking-tighter">{lang === 'en' ? 'Sama Office' : 'مكتب سما المملكة'}</span>
                  <span className="text-[6px] font-mono">APPROVED</span>
                </div>

                <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="font-black text-sm tracking-wide text-slate-950">مكتب سما المملكة للخدمات المتكاملة</h4>
                    <span className="text-[9px] text-slate-500 block">منصة الخدمات وتخليص المعاملات الحكومية الإلكترونية الموحدة</span>
                  </div>
                  <div className="text-left font-mono text-[9px] text-slate-500 space-y-0.5">
                    <p>{lang === 'en' ? 'Receipt No:' : 'رقم السند:'} <strong className="text-slate-900 font-bold">{receiptCode}</strong></p>
                    <p>{lang === 'en' ? 'Date:' : 'التاريخ:'} {new Date(paymentDate).toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-SA')}</p>
                  </div>
                </div>

                {/* Sub title voucher */}
                <h5 className="text-center font-black text-xs text-slate-800 bg-slate-200 py-1.5 rounded-lg border uppercase tracking-wider">
                  {lang === 'en' ? 'OFFICIAL PAYMENT VOUCHER & CASH RECEIPT' : 'سند قبض مالي وتصريح سداد إلكتروني معمد'}
                </h5>

                <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed pt-2 font-sans">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-400 block text-[10px]">{lang === 'en' ? 'Received From Client Name:' : 'استلمنا من العميل المستفيد:'}</span>
                      <strong className="text-slate-900 text-xs">{clientName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">{lang === 'en' ? 'Client Phone Number:' : 'جوال العميل للمتابعة:'}</span>
                      <strong className="text-slate-900 text-xs font-mono">{clientPhone}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-400 block text-[10px]">{lang === 'en' ? 'Settled Service Item:' : 'وصف الخدمة والإجراء للعملية:'}</span>
                      <strong className="text-slate-900 text-xs">{service.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">{lang === 'en' ? 'Payment Method Used:' : 'طريقة وقناة السداد الآمنة:'}</span>
                      <strong className="text-indigo-600 font-bold text-xs uppercase">{paymentMethod}</strong>
                    </div>
                  </div>

                  {paymentMethod === 'bank_transfer' ? (
                    <div className="bg-slate-200/50 p-2.5 rounded-lg border border-slate-300 text-[10px] text-slate-600">
                      <strong>* حالة التحويل المحمي:</strong> قيد التحقق والتدقيق المالي من قبل محاسب الإدارة العامة لمطابقة وصول الحوالة على {selectedBank === 'rajhi' ? 'مصرف الراجحي' : 'البنك الأهلي السعودي'}. المعاملة نشطة الآن.
                    </div>
                  ) : paymentMethod === 'cash' ? (
                    <div className="bg-slate-200/50 p-2.5 rounded-lg border border-slate-300 text-[10px] text-amber-700">
                      <strong>* حالة الفاتورة المعلقة:</strong> لم يُدفع الرسوم إلكترونياً بعد. يرجى إتمام السداد يدوياً بمجرد حضوركم الشخصي لمقر المكتب من أجل بدء تعقيب الإجراء الإداري بالدولة.
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-150 p-2.5 rounded-lg text-emerald-800 text-[10px] font-mono flex justify-between items-center">
                      <span>رقم المعالجة البنكية (TXID): <strong>{transactionId}</strong></span>
                      <span className="bg-emerald-600 text-white text-[8px] font-sans font-bold px-2 py-0.5 rounded">مكتملة ومستحقة الدفع</span>
                    </div>
                  )}

                  {/* Pricing break downs on voucher */}
                  <div className="bg-white border text-xs font-mono rounded-lg overflow-hidden mt-4">
                    <div className="bg-slate-900 text-white p-2 text-center font-sans font-black text-[11px] select-none">
                      الحسبة المالية وقيمة الضرائب المفصلة للسند
                    </div>
                    <div className="p-3 divide-y divide-slate-100 space-y-1.5 leading-loose text-slate-700">
                      <div className="flex justify-between items-center">
                        <span className="font-sans text-[11px]">الرسوم الحكومية للدولة (معفاة الضريبة):</span>
                        <span>{govFee.toFixed(2)} ر.س</span>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="font-sans text-[11px]">أتعاب مكتب سما المملكة الإدارية (خاضعة):</span>
                        <span>{officeFee.toFixed(2)} ر.س</span>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="font-sans text-[11px]">ضريبة القيمة المضافة ١٥٪:</span>
                        <span>{tax.toFixed(2)} ر.س</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-black text-slate-950 pt-2 border-t font-sans">
                        <span>إجمالي الرسوم المدفوعة والمسددة:</span>
                        <span className="text-emerald-700 font-mono text-base">{total.toFixed(2)} ر.س</span>
                      </div>
                    </div>
                  </div>

                  {/* QR details & footer */}
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-200 select-none">
                    <svg className="w-16 h-16 text-slate-800 flex-shrink-0" viewBox="0 0 100 100">
                      <rect x="5" y="5" width="20" height="20" fill="currentColor"/>
                      <rect x="5" y="75" width="20" height="20" fill="currentColor"/>
                      <rect x="75" y="5" width="20" height="20" fill="currentColor"/>
                      <rect x="35" y="35" width="30" height="30" fill="currentColor"/>
                      <rect x="40" y="10" width="20" height="15" fill="currentColor"/>
                      <rect x="70" y="55" width="25" height="40" fill="currentColor"/>
                    </svg>
                    <div className="text-[10px] text-slate-500 font-sans leading-relaxed">
                      <strong>* سند مالي إلكتروني:</strong> مستخرج ومعتمد عبر منصة السداد الموحدة لمكتب سما المملكة الرقمية. يمكنك طباعة هذا السند للاحتفاظ به ومطالبة فريق التعقيب بالخدمة.
                    </div>
                  </div>

                </div>
              </div>

              {/* Success Action Toolbar */}
              <div className="flex gap-2.5 justify-end pt-2 print:hidden select-none">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Print Receipt & Invoice' : 'طباعة الإيصال والسند'}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 text-white text-xs font-black transition-colors shadow-md cursor-pointer"
                >
                  {lang === 'en' ? 'Close & View Status' : 'إغلاق ومتابعة الطلب'}
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
