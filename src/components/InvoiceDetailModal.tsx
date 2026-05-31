import React, { useState } from 'react';
import { X, Printer, Download, Receipt, Building, Calendar, User, FileText, CheckCircle2 } from 'lucide-react';
import { Transaction } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export default function InvoiceDetailModal({ isOpen, onClose, transaction }: InvoiceDetailModalProps) {
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('print-area');
    if (!element) return;

    try {
      setIsExporting(true);

      // Create a high-res screenshot of the printable invoice area
      const canvas = await html2canvas(element, {
        scale: 2.5, // Enhances document sharpness and details (removes blur)
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: -window.scrollY
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
      pdf.save(`فاتورة_سما_المملكة_${transaction.invoiceNumber}_${safeClientName}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('حدث خطأ أثناء إصدار ملف الـ PDF المعرب. يرجى المحاولة لاحقاً، أو استخدام خيار طباعة لحفظ الفاتورة بصيغة PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in" dir="rtl">
      <div className="w-full max-w-2xl bg-white border-2 border-slate-900 rounded-lg shadow-2xl overflow-hidden my-8">
        {/* Modal Toolbar (Non-printable) */}
        <div className="bg-slate-950 text-white px-6 py-4 flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-base">استعراض الفاتورة الضريبية المبسطة</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-bold transition-colors ${
                isExporting 
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>{isExporting ? 'جاري التصدير...' : 'تصدير PDF'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 bg-amber-600 hover:bg-amber-500 text-slate-950 px-3 py-1.5 rounded text-sm font-bold transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الفاتورة</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content Frame */}
        <div id="print-area" className="p-8 bg-white text-slate-900 font-sans leading-relaxed relative">
          
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
              <div className="flex justify-between font-black text-lg text-slate-950 border-t-2 border-slate-900 pt-2 bg-amber-50 p-2 rounded">
                <span className="font-sans">الإجمالي النهائي المستحق:</span>
                <span>{transaction.total.toFixed(2)} ر.س</span>
              </div>
            </div>
          </div>

          {/* Special Notes */}
          {transaction.notes && (
            <div className="mt-8 p-3.5 bg-slate-50 border-r-4 border-amber-600 text-xs rounded text-slate-600 font-sans">
              <span className="font-bold text-slate-800 block mb-1">ملاحظات المستند المالي:</span>
              {transaction.notes}
            </div>
          )}

          {/* Footer of Receipt */}
          <div className="mt-12 text-center text-[11px] text-slate-400 border-t border-slate-100 pt-4">
            تعتبر هذه الفاتورة مستند رسمي لإثبات إنهاء وتعميد المعاملات عبر مكتب سما المملكة. نشكركم لثقتكم الغالية بنا.
          </div>
        </div>

        {/* Foot toolbar for cancellation */}
        <div className="bg-slate-50 px-6 py-3 flex justify-end gap-2 border-t border-slate-200 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-sm font-bold rounded transition-colors"
          >
            إغلاق العرض
          </button>
        </div>
      </div>
    </div>
  );
}
