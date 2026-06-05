import React, { useState, useEffect } from 'react';
import { X, Printer, Download, Receipt, Sparkles, CheckCircle2, User, FileText, ChevronDown, ListFilter, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { Transaction } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface BatchPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTransactions: Transaction[];
  lang?: 'ar' | 'en';
}

export default function BatchPrintModal({ isOpen, onClose, selectedTransactions, lang = 'ar' }: BatchPrintModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [zoom, setZoom] = useState(80); // Default 80% is ideal for batch landscape/portrait screens
  const [paperColor, setPaperColor] = useState<'white' | 'cream' | 'cool-grey'>('white');
  const [showPageBreaks, setShowPageBreaks] = useState(true);
  const [includeCoverPage, setIncludeCoverPage] = useState(true);
  const [showWatermarks, setShowWatermarks] = useState(true);

  // Print preparation loader state
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [printProgress, setPrintProgress] = useState(0);

  // Auto scroll to top of preview when opened
  useEffect(() => {
    if (isOpen) {
      const container = document.getElementById('batch-print-modal-scroll');
      if (container) {
        container.scrollTop = 0;
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculators for totals
  const totalGovFee = selectedTransactions.reduce((acc, t) => acc + t.govFee, 0);
  const totalOfficeFee = selectedTransactions.reduce((acc, t) => acc + t.officeFee, 0);
  const totalTax = selectedTransactions.reduce((acc, t) => acc + t.tax, 0);
  const grandTotal = selectedTransactions.reduce((acc, t) => acc + t.total, 0);

  // Start combined print procedure
  const startBatchPrint = () => {
    if (isPreparingPrint) return;
    setIsPreparingPrint(true);
    setPrintProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      if (progress > 100) progress = 100;
      setPrintProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          window.print();
          setIsPreparingPrint(false);
        }, 400);
      }
    }, 30);
  };

  // Download high-res combined PDF
  const handleDownloadCombinedPDF = async () => {
    const element = document.getElementById('print-area');
    if (!element) return;

    const scaleContainer = document.getElementById('batch-pdf-scale-container');
    const originalTransform = scaleContainer ? scaleContainer.style.transform : '';
    const originalMarginBottom = scaleContainer ? scaleContainer.style.marginBottom : '';

    if (scaleContainer) {
      scaleContainer.style.transform = 'none';
      scaleContainer.style.marginBottom = '0px';
    }

    try {
      setIsExporting(true);

      const canvas = await html2canvas(element, {
        scale: 2.0, // High quality vector capture
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; 
      const pageHeight = 297; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      const fileDate = new Date().toISOString().split('T')[0];
      const filename = lang === 'en' 
        ? `Sama_Al_Mamlakah_Batch_Invoices_${fileDate}.pdf`
        : `سما_المملكة_دفعة_فواتير_${fileDate}.pdf`;

      pdf.save(filename);
    } catch (error) {
      console.error('Error generating batch PDF:', error);
      alert(lang === 'en'
        ? 'Failed to build high-fidelity PDF. Please use the system print dialogue to Save as PDF directly.'
        : 'فشل إخراج مستند الـ PDF المجمع. يرجى استخدام أمر الطباعة والحفظ كملف PDF رقمي.');
    } finally {
      if (scaleContainer) {
        scaleContainer.style.transform = originalTransform;
        scaleContainer.style.marginBottom = originalMarginBottom;
      }
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in" dir={lang === 'en' ? 'ltr' : 'rtl'}>
      <div className="w-full max-w-5xl bg-white border border-slate-900 rounded-xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        
        {/* TOP COMPREHENSIVE ACTION CONTROL BAR */}
        <div className={`bg-slate-950 text-white px-6 py-4 flex justify-between items-center print:hidden ${lang === 'en' ? 'flex-row-reverse' : ''}`}>
          <div className="flex items-center gap-2.5 flex-wrap">
            <Receipt className="w-5 h-5 text-amber-500 animate-pulse" />
            <span className="font-extrabold text-base">
              {lang === 'en' ? 'Batch Printing & PDF Generation Hub' : 'مركز الطباعة المجمعة وإصدار الفواتير المتعددة'}
            </span>
            <span className="bg-amber-500 text-slate-950 text-[10px] px-2.5 py-0.5 rounded-full font-black">
              {lang === 'en' ? `${selectedTransactions.length} Selected` : `تم اختيار ${selectedTransactions.length} فواتير`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
              title={lang === 'en' ? 'Close' : 'إغلاق نافذة الطباعة'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTROLS & SETTINGS SIDEBAR AND PREVIEW FRAME GRID */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-4 bg-slate-100 font-sans">
          
          {/* CONTROL PANEL */}
          <div className="p-5 bg-white border-b lg:border-b-0 lg:border-l border-slate-200 space-y-5 overflow-y-auto max-h-[250px] lg:max-h-none select-none print:hidden">
            <div>
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <ListFilter className="w-4 h-4 text-slate-400" />
                <span>{lang === 'en' ? 'Layout Controls' : 'خيارات الإخراج والطباعة'}</span>
              </h4>
              
              <div className="space-y-3">
                {/* Include Cover Sheet Checkbox */}
                <label className="flex items-center gap-2.5 text-xs text-slate-700 hover:text-slate-900 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCoverPage}
                    onChange={(e) => setIncludeCoverPage(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-300 transition-all cursor-pointer"
                  />
                  <span>{lang === 'en' ? 'Include Cover Ledger Sheet' : 'إرفاق ورقة غلاف مجمعة للدفعة'}</span>
                </label>

                {/* Show Page Boundary Checkbox */}
                <label className="flex items-center gap-2.5 text-xs text-slate-700 hover:text-slate-900 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPageBreaks}
                    onChange={(e) => setShowPageBreaks(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-300 transition-all cursor-pointer"
                  />
                  <span>{lang === 'en' ? 'Show Page-Separator Marks' : 'إظهار علامات حدود صفحات الـ A4'}</span>
                </label>

                {/* Show Anti-Alter Watermarks Checkbox */}
                <label className="flex items-center gap-2.5 text-xs text-slate-700 hover:text-slate-900 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showWatermarks}
                    onChange={(e) => setShowWatermarks(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-300 transition-all cursor-pointer"
                  />
                  <span>{lang === 'en' ? 'Inject Watermark Backgrounds' : 'تفعيل الطباعة المائية على الخلفية'}</span>
                </label>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Tint Color Selector */}
            <div>
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                {lang === 'en' ? 'Paper Page Color Tint' : 'درجة لون ورق الطباعة'}
              </h4>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaperColor('white')}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-extrabold border transition-all text-center cursor-pointer ${
                    paperColor === 'white' 
                      ? 'bg-white border-slate-950 text-slate-950 font-black shadow-xs' 
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                  }`}
                >
                  {lang === 'en' ? 'Pure White' : 'أبيض ناصع'}
                </button>
                <button
                  type="button"
                  onClick={() => setPaperColor('cream')}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-extrabold border transition-all text-center cursor-pointer ${
                    paperColor === 'cream' 
                      ? 'bg-[#fdfbf6] border-amber-600 text-amber-950 font-black shadow-xs' 
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                  }`}
                >
                  {lang === 'en' ? 'Vintage Cream' : 'كريم كلاسيك'}
                </button>
                <button
                  type="button"
                  onClick={() => setPaperColor('cool-grey')}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-extrabold border transition-all text-center cursor-pointer ${
                    paperColor === 'cool-grey' 
                      ? 'bg-[#f1f3f5] border-slate-600 text-slate-900 font-black shadow-xs' 
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                  }`}
                >
                  {lang === 'en' ? 'Cool Grey' : 'رمادي هادئ'}
                </button>
              </div>
            </div>

            {/* Live Interactive Zoom Slider */}
            <div>
              <div className="flex justify-between items-center text-[11px] font-black text-slate-400 mb-1.5 uppercase">
                <span>{lang === 'en' ? 'Preview Scale' : 'نسبة تكبير المعاينة'}</span>
                <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">{zoom}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <hr className="border-slate-100" />

            {/* CUMULATIVE FINANCIAL CARD PREVIEW */}
            <div className="bg-slate-950 text-white rounded-lg p-3.5 border border-slate-800 space-y-2 font-mono">
              <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded uppercase leading-none font-sans block w-fit">
                {lang === 'en' ? 'Cumulative Totals' : 'حصيلة القيود المالية المحددة'}
              </span>
              <div className="text-xs space-y-1.5 pt-1">
                <div className="flex justify-between text-slate-450 border-b border-slate-850 pb-1">
                  <span>{lang === 'en' ? 'Valid Invoices:' : 'عدد الفواتير:'}</span>
                  <span className="text-white font-bold">{selectedTransactions.length}</span>
                </div>
                <div className="flex justify-between text-slate-450 border-b border-slate-850 pb-1">
                  <span>{lang === 'en' ? 'State Fees:' : 'رسوم الدولة الكلية:'}</span>
                  <span className="text-white font-bold">{totalGovFee.toFixed(2)} ر.س</span>
                </div>
                <div className="flex justify-between text-slate-450 border-b border-slate-850 pb-1">
                  <span>{lang === 'en' ? 'Office Fees:' : 'أتعاب المكتب:'}</span>
                  <span className="text-white font-bold">{totalOfficeFee.toFixed(2)} ر.س</span>
                </div>
                <div className="flex justify-between text-slate-450 border-b border-slate-850 pb-1">
                  <span>{lang === 'en' ? 'VAT (15%):' : 'ضريبة القيمة المضافة:'}</span>
                  <span className="text-white font-bold">{totalTax.toFixed(2)} ر.س</span>
                </div>
                <div className="flex justify-between text-amber-400 font-bold pt-1.5 text-sm">
                  <span>{lang === 'en' ? 'Grand Total:' : 'المجموع الإجمالي الكلي:'}</span>
                  <span>{grandTotal.toFixed(2)} ر.س</span>
                </div>
              </div>
            </div>

            {/* DIRECT ACTION BUTTONS */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={startBatchPrint}
                disabled={isPreparingPrint || selectedTransactions.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-black py-2.5 rounded-lg text-xs shadow-md active:scale-98 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-950 font-bold" />
                <span>{lang === 'en' ? 'Launch Bulk Print' : 'بدء الطباعة المشتركة'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCombinedPDF}
                disabled={isExporting || selectedTransactions.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 text-white font-bold py-2.5 rounded-lg text-xs active:scale-98 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-amber-500" />
                <span>{isExporting ? (lang === 'en' ? 'Composing PDF...' : 'جاري إخراج الـ PDF...') : (lang === 'en' ? 'Download Merged PDF' : 'تنزيل مستند PDF الموحد')}</span>
              </button>
            </div>
          </div>

          {/* PRINT VIEWPORT & SCROLL AREA */}
          <div 
            id="batch-print-modal-scroll"
            className="lg:col-span-3 p-4 md:p-8 overflow-y-auto max-h-[500px] lg:max-h-full flex justify-center bg-slate-850 print:p-0 print:bg-white"
          >
            {/* Real-time Loader Overlay during formatting preparation */}
            {isPreparingPrint && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex flex-col items-center justify-center text-white print:hidden">
                <div className="w-80 space-y-4 text-center">
                  <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <h3 className="font-extrabold text-white text-base tracking-wide">
                    {lang === 'en' ? 'Optimizing Grid layout for A4 Printer...' : 'جاري تنسيق ومطابقة الأبعاد مع قياسات A4'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {lang === 'en' ? `Formatting ${selectedTransactions.length} items • Please wait` : `تقسيم وتسكين عدد ${selectedTransactions.length} فواتير في أرشيف الطباعة`}
                  </p>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-amber-400 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${printProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div
              id="batch-pdf-scale-container"
              style={{
                width: '210mm',
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                marginBottom: `calc(297mm * (1 - ${zoom / 100}) * -1)`,
              }}
              className="origin-top shadow-[0_25px_70px_-15px_rgba(0,0,0,0.8)] border border-slate-950 relative transition-transform duration-200 print:shadow-none print:border-none"
            >
              <div 
                id="print-area" 
                className={`text-slate-950 font-sans leading-relaxed relative ${
                  paperColor === 'cream' ? 'bg-[#faf8f0]' : paperColor === 'cool-grey' ? 'bg-[#f4f5f7]' : 'bg-white'
                }`}
                style={{ width: '210mm', minHeight: '297mm' }}
              >
                
                {/* ======================================= */}
                {/* SECTION 1: COVER SUMMARY SHEET (OPTIONAL) */}
                {/* ======================================= */}
                {includeCoverPage && (
                  <div 
                    className="p-10 select-none flex flex-col justify-between"
                    style={{ 
                      minHeight: '297mm', 
                      boxSizing: 'border-box',
                      pageBreakAfter: 'always',
                      breakAfter: 'page',
                      borderBottom: showPageBreaks ? '3px dashed #d1d5db' : 'none'
                    }}
                  >
                    <div>
                      {/* Top Branding Cover Logo */}
                      <div className="flex justify-between items-center border-b border-slate-300 pb-5 mb-8">
                        <div>
                          <h2 className="text-xl font-bold text-slate-950 uppercase tracking-widest leading-none">مكتب سما المملكة للخدمات</h2>
                          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em] mt-1.5">Sama Al-Mamlakah Bureau Services</p>
                        </div>
                        <div className="text-right text-[10px] text-slate-600 font-mono space-y-1">
                          <p>كشف فواتير مجمع / BULK INVOICES REPORT</p>
                          <p>{lang === 'en' ? 'Date Issued:' : 'تاريخ الإصدار:'} {new Date().toLocaleDateString('ar-SA')}</p>
                          <p>الرمز الضريبي: 300065432100003</p>
                        </div>
                      </div>

                      {/* Cover Title */}
                      <div className="text-center space-y-2 my-10">
                        <div className="inline-flex items-center gap-2 bg-amber-500 text-slate-950 font-black text-xs px-3 py-1 rounded-full border border-amber-600 shadow-3xs uppercase">
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>سند القيود المالية الشامل</span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-wide mt-2">تقرير بيان تسوية القيود الضريبية المجمعة</h1>
                        <p className="text-xs text-slate-500 font-mono tracking-tight max-w-xl mx-auto">
                          Sama Al-Mamlakah Combined Tax Ledger Details covering all listed client services, government settle-downs, VAT compliance audits and consolidated payment receipts.
                        </p>
                      </div>

                      {/* Cumulative stats board */}
                      <div className="grid grid-cols-4 gap-4 my-8 bg-slate-50/70 p-5 rounded-xl border border-slate-200">
                        <div className="text-center space-y-1">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{lang === 'en' ? 'Invoice Count' : 'عدد العمليات والقيد'}</span>
                          <p className="text-xl font-mono font-black text-slate-900">{selectedTransactions.length}</p>
                        </div>
                        <div className="text-center space-y-1 border-r border-slate-200">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{lang === 'en' ? 'Cumulative Gov Fees' : 'مجموع رسوم الدولة'}</span>
                          <p className="text-xl font-mono font-black text-slate-900">{totalGovFee.toFixed(2)} ر.س</p>
                        </div>
                        <div className="text-center space-y-1 border-r border-slate-200">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{lang === 'en' ? 'Cumulative Bureau' : 'إجمالي أتعاب المكتب'}</span>
                          <p className="text-xl font-mono font-black text-slate-950">{totalOfficeFee.toFixed(2)} ر.س</p>
                        </div>
                        <div className="text-center space-y-1 border-r border-slate-200">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{lang === 'en' ? 'Consolidated Total' : 'صافي الإجمالي الضريبي'}</span>
                          <p className="text-xl font-mono font-black text-amber-800">{grandTotal.toFixed(2)} ر.س</p>
                        </div>
                      </div>

                      {/* Comprehensive Ledger Table */}
                      <div className="border border-slate-900 rounded-lg overflow-hidden my-6">
                        <table className="w-full text-right text-xs">
                          <thead>
                            <tr className="bg-slate-950 text-white border-b border-slate-900 font-sans font-bold">
                              <th className="p-3 text-right">رقم الفاتورة</th>
                              <th className="p-3 text-right">العميل المستورد</th>
                              <th className="p-3 text-right">نوع الخدمة والتعقيب</th>
                              <th className="p-3 text-left">أتعاب المكتب</th>
                              <th className="p-3 text-left">الضريبة (١٥%)</th>
                              <th className="p-3 text-left font-black">المجموع الكلي</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 font-mono text-slate-800">
                            {selectedTransactions.map((t) => (
                              <tr key={t.id} className="hover:bg-slate-50 transition-all">
                                <td className="p-3 font-bold text-slate-950">{t.invoiceNumber}</td>
                                <td className="p-3 font-sans font-bold text-slate-900">{t.clientName}</td>
                                <td className="p-3 font-sans">{t.serviceName}</td>
                                <td className="p-3 text-left">{t.officeFee.toFixed(2)} ر.س</td>
                                <td className="p-3 text-left text-slate-500">{t.tax.toFixed(2)} ر.س</td>
                                <td className="p-3 text-left font-bold text-amber-800">{t.total.toFixed(2)} ر.س</td>
                              </tr>
                            ))}
                            <tr className="bg-slate-100 font-sans font-black text-slate-950 border-t border-slate-900">
                              <td colSpan={3} className="p-3 text-right">{lang === 'en' ? 'Consolidated Ledger Summary Totals' : 'المستحقات الكلية الضريبية المجمعة'}</td>
                              <td className="p-3 text-left font-mono">{totalOfficeFee.toFixed(2)} ر.س</td>
                              <td className="p-3 text-left font-mono text-slate-650">{totalTax.toFixed(2)} ر.س</td>
                              <td className="p-3 text-left font-mono text-amber-900 text-sm border-l-2 border-amber-600">{grandTotal.toFixed(2)} ر.س</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* cover page footer certified signs */}
                    <div className="grid grid-cols-2 gap-8 border-t border-slate-300 pt-8 mt-12 items-end">
                      <div className="space-y-4">
                        <p className="text-[10px] text-slate-505 font-bold uppercase tracking-wider">{lang === 'en' ? 'Financial Auditor Signature' : 'توقيع المحاسب والمراجع المالي الكلي'}</p>
                        <div className="h-10 w-44 border-b border-slate-400 border-dashed"></div>
                        <p className="text-[9px] text-slate-400 font-mono">Date: ________________________</p>
                      </div>
                      <div className="text-left space-y-4 flex flex-col items-end">
                        <p className="text-[10px] text-slate-505 font-bold uppercase tracking-wider">{lang === 'en' ? 'Bureau Authority Certified Stamp' : 'اعتماد الإدارة وختم المعاملات المالي'}</p>
                        <div className="w-20 h-20 rounded-full border-2 border-amber-500/30 flex items-center justify-center p-2 text-center text-[10px] text-amber-700 font-black tracking-tighter uppercase relative select-none" style={{ transform: 'rotate(-8deg)' }}>
                          <span className="leading-tight">سما المملكة للتسويات<br/>SAMA CO.</span>
                          <div className="absolute inset-2 border border-dashed border-amber-400/20 rounded-full"></div>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* ======================================= */}
                {/* SECTION 2: THE ACTUAL SIMPLIFIED TAX INVOICES */}
                {/* ======================================= */}
                {selectedTransactions.map((transaction, index) => {
                  const isTransferOrCashPending = !!(transaction.notes && (
                    transaction.notes.includes('معلقة') || 
                    transaction.notes.includes('معلق') || 
                    transaction.notes.includes('تدقيق') || 
                    transaction.notes.includes('بانتظار') ||
                    transaction.notes.includes('نقدي بمقر المكتب') ||
                    transaction.notes.includes('سداد نقدي') ||
                    transaction.notes.includes('مرحل تلقائياً')
                  ));

                  const isLast = index === selectedTransactions.length - 1;

                  return (
                    <div
                      key={transaction.id}
                      className="p-10 select-none relative flex flex-col justify-between"
                      style={{
                        minHeight: '297mm',
                        boxSizing: 'border-box',
                        pageBreakAfter: isLast ? 'auto' : 'always',
                        breakAfter: isLast ? 'auto' : 'page',
                        borderBottom: (!isLast && showPageBreaks) ? '3px dashed #d1d5db' : 'none'
                      }}
                    >
                      {/* Security Watermark Background */}
                      {showWatermarks && (
                        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0 flex flex-col justify-between py-16 opacity-[0.035]" aria-hidden="true">
                          <div className="flex justify-around items-center w-full transform -rotate-12 select-none whitespace-nowrap">
                            <span className="font-sans font-black text-xl">سما المملكة Sama Al-Mamlakah</span>
                            <span className="font-sans font-black text-xl hidden lg:inline">سما المملكة Sama Al-Mamlakah</span>
                          </div>
                          <div className="flex justify-around items-center w-full transform -rotate-12 select-none whitespace-nowrap">
                            <span className="font-sans font-black text-xl hidden lg:inline">سما المملكة Sama Al-Mamlakah</span>
                            <span className="font-sans font-black text-xl">سما المملكة Sama Al-Mamlakah</span>
                          </div>
                          <div className="flex justify-around items-center w-full transform -rotate-12 select-none whitespace-nowrap">
                            <span className="font-sans font-black text-xl">سما المملكة Sama Al-Mamlakah</span>
                            <span className="font-sans font-black text-xl hidden lg:inline">سما المملكة Sama Al-Mamlakah</span>
                          </div>
                        </div>
                      )}

                      <div>
                        {/* Page Boundary Indicator inside PDF Preview */}
                        {showPageBreaks && (
                          <div className="absolute left-0 right-0 border-t-2 border-dashed border-red-500/30 pointer-events-none z-30 flex items-center justify-center font-mono text-[9px] text-red-500 bg-red-400/5 select-none" style={{ top: '293mm' }}>
                            <span className="bg-red-950 text-white px-2 py-0.5 rounded-b-md shadow font-bold tracking-wider leading-none">حدود صفحة الطباعة A4 (فاتورة مخرجة #{index + 1})</span>
                          </div>
                        )}

                        {/* Invoice Header Brand */}
                        <div className="hidden pb-2.5 mb-6 border-b border-slate-400 flex justify-between items-center text-[10px] text-slate-850 font-sans tracking-tight">
                          <div className="flex items-center gap-2">
                            <span className="font-sans font-black text-slate-950 text-xs">سما المملكة Sama Al-Mamlakah</span>
                            <span className="text-slate-450">|</span>
                            <span className="text-slate-700 font-bold">{lang === 'en' ? 'Unified Customer Tax Invoice Statement' : 'السند والمرفق المالي الرسمي للعميل'}</span>
                          </div>
                          <div className="flex items-center gap-3 font-mono text-[9.5px] font-bold text-slate-800">
                            <span>{lang === 'en' ? 'Tel: 0500000050' : 'جوال الشؤون المالية: 0500000050'}</span>
                            <span>•</span>
                            <span>Riyadh, KSA</span>
                          </div>
                        </div>

                        {/* Core Header Meta Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b-2 border-slate-900 items-start">
                          <div>
                            <div className="text-2xl font-black text-slate-900 tracking-wider">مكتب سما المملكة</div>
                            <div className="text-amber-600 font-bold text-sm tracking-wide mb-2">للخدمات المتكاملة والتأشيرات والتعقيب</div>
                            <div className="text-xs text-slate-500 space-y-0.5 font-mono leading-relaxed">
                              <p>الرقم الضريبي المستهدف: 300065432100003</p>
                              <p>مكتب مرخص رقم: 84729 / ج</p>
                              <p>العنوان: شارع العليا العام، الرياض، المملكة العربية السعودية</p>
                              <p>الجوال: +966 50 000 0000</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end text-right text-xs space-y-1.5 font-mono">
                            <div className="bg-slate-150 px-3 py-1.5 border border-slate-300 font-bold text-xs rounded flex items-center gap-1.5 text-slate-900">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>فاتورة ضريبية مبسطة صادرة ومسجلة</span>
                            </div>
                            {isTransferOrCashPending ? (
                              <div className="bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded font-bold text-[11px] flex items-center gap-1">
                                <span>قيد تدقيق الحسابات ومراجعة السداد</span>
                              </div>
                            ) : (
                              <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded font-bold text-[11px] flex items-center gap-1">
                                <span>معاملة مسددة بالكامل ومعتمدة</span>
                              </div>
                            )}
                            <p><span className="text-slate-500">رقم الفاتورة:</span> <span className="font-bold text-slate-900 text-sm">{transaction.invoiceNumber}</span></p>
                            <p><span className="text-slate-500">تاريخ الإصدار:</span> <span className="font-bold">{new Date(transaction.date).toLocaleDateString('ar-SA')} - {new Date(transaction.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span></p>
                          </div>
                        </div>

                        {/* Customer Row */}
                        <div className="my-6 bg-slate-50 p-4 border border-slate-200 rounded-lg">
                          <h4 className="text-slate-600 font-bold text-xs uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">بيانات العميل المستفيد</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-amber-500" />
                              <span className="font-bold text-slate-900">{transaction.clientName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-amber-500" />
                              <span className="text-slate-700">الخدمة المطلوبة: <strong className="font-bold">{transaction.serviceName}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Services Breakdown Table */}
                        <div className="overflow-x-auto border border-slate-900 rounded mt-6">
                          <table className="w-full text-right text-sm">
                            <thead>
                              <tr className="bg-slate-900 text-white border-b border-slate-900 font-sans">
                                <th className="p-3">وصف الخدمة والإجراء للعملية</th>
                                <th className="p-3 text-center">الخضوع للضريية</th>
                                <th className="p-3 text-left">قيمة البند الأصلي</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-mono">
                              <tr>
                                <td className="p-3">
                                  <p className="font-bold font-sans text-slate-900">الرسوم والمستحقات الحكومية والدولة</p>
                                  <p className="text-slate-500 text-xs font-sans mt-0.5">تكاليف جهات جهات الإصدار الحكومية والبلدية تم تسويتها بالكامل.</p>
                                </td>
                                <td className="p-3 text-center text-slate-500 font-sans">معفى / صفر ضريبة</td>
                                <td className="p-3 text-left font-bold text-slate-800">{transaction.govFee.toFixed(2)} ر.س</td>
                              </tr>
                              <tr>
                                <td className="p-3">
                                  <p className="font-bold font-sans text-slate-900">أتعاب وتكاليف خدمات سما المملكة</p>
                                  <p className="text-slate-500 text-xs font-sans mt-0.5">أتعاب إنتاج وصياغة المعاملة ومتابعة التعقيب والمراجعة.</p>
                                </td>
                                <td className="p-3 text-center text-slate-950 font-sans">خاضع (15%)</td>
                                <td className="p-3 text-left font-bold text-slate-800">{transaction.officeFee.toFixed(2)} ر.س</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Total VAT Calculator Grid */}
                        <div className="mt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-5 border-t border-slate-200">
                          
                          {/* ZATCA QR block */}
                          <div className="flex items-center gap-3 bg-slate-50 p-2.5 border border-slate-200 rounded-lg">
                            <div className="p-1 bg-white border border-slate-250 rounded">
                              <svg className="w-16 h-16 text-slate-950" viewBox="0 0 100 100">
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
                            <div className="text-[10px] font-sans text-slate-550 leading-normal max-w-[200px]">
                              <p className="font-bold text-slate-800 text-[11px]">فاتورة إلكترونية معتمدة كلياً</p>
                              <p>مشفر باسم سما المملكة لربط الفواتير إلكترونياً مع الهيئة السعودية للزكاة والضريبة والجمارك.</p>
                            </div>
                          </div>

                          {/* Calculations Right column */}
                          <div className="w-full md:w-80 font-mono text-xs space-y-2 text-slate-700">
                            <div className="flex justify-between">
                              <span>الخاضع للضريبة (أتعاب الاستخلاص):</span>
                              <span className="font-bold text-slate-900">{transaction.officeFee.toFixed(2)} ر.س</span>
                            </div>
                            <div className="flex justify-between">
                              <span>قيمة مضافة معتمدة (15%):</span>
                              <span className="font-bold text-slate-900">{transaction.tax.toFixed(2)} ر.س</span>
                            </div>
                            <div className="flex justify-between">
                              <span>الرسوم والمبالغ الحكومية المستحقة:</span>
                              <span className="font-bold text-slate-900">{transaction.govFee.toFixed(2)} ر.س</span>
                            </div>
                            <div className="flex justify-between text-slate-950 font-sans font-black text-sm border-t border-slate-350 pt-2 text-amber-850">
                              <span>الإجمالي الكلي السداد المعتمد:</span>
                              <span className="font-mono">{transaction.total.toFixed(2)} ر.س</span>
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* Invoice Signatures and Stamps Footer */}
                      <div className="grid grid-cols-2 gap-8 border-t border-slate-350 pt-6 mt-10 items-end">
                        <div className="space-y-2">
                          <p className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider">سلطة الإقرار والتعميد المالي</p>
                          <div className="h-6 w-32 border-b border-slate-300 border-dashed"></div>
                          <p className="text-[8px] text-slate-400 font-mono">ID: {transaction.invoiceNumber}</p>
                        </div>
                        <div className="text-left flex flex-col items-end">
                          <div className="w-16 h-16 rounded-full border border-emerald-500/30 flex items-center justify-center p-1.5 text-center text-[7.5px] text-emerald-700 font-black tracking-tight uppercase relative select-none" style={{ transform: 'rotate(-4deg)' }}>
                            <span>سما المملكة للتعقيب<br/>SAMA GENERAL</span>
                            <div className="absolute inset-1 border border-dashed border-emerald-450/25 rounded-full"></div>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })}

              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
