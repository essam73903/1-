import React, { useState } from 'react';
import { Lock, AlertCircle, X, ShieldAlert } from 'lucide-react';

interface PasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PasscodeModal({ isOpen, onClose, onSuccess }: PasscodeModalProps) {
  const [pin, setPin] = useState('');
  const [errorAndAlert, setErrorAndAlert] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234') {
      onSuccess();
      setPin('');
      setErrorAndAlert('');
    } else {
      setErrorAndAlert('رمز المرور غير صحيح! يرجى إدخال (1234) للوصول التجاري.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" dir="rtl">
      <div className="w-full max-w-md bg-[#fafafa] border-2 border-slate-900 rounded-lg p-6 shadow-2xl relative translate-y-0 transition-all">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-amber-600" />
            <span className="font-bold text-lg text-slate-900">تسجيل دخول الإدارة والعمليات</span>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 text-amber-800 text-sm mb-5 leading-relaxed flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div>
            <span className="font-bold block mb-1">منطقة آمنة ومحمية</span>
            هذا القسم مخصص لإدارة الحسابات، مراجعة العمليات المالية، والتحصيل الضريبي. يرجى إدخال الرمز السري الخاص بالعمليات.
            <div className="mt-2 text-xs font-mono text-slate-600">
              الرمز التجريبي لمكتب سما المملكة هو: <span className="font-bold text-amber-700 underline text-sm">1234</span>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">رمز المرور السري (PIN):</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setErrorAndAlert('');
              }}
              placeholder="••••"
              maxLength={8}
              required
              className="w-full p-3 text-center tracking-widest text-xl font-bold border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-slate-800 bg-white shadow-inner"
              autoFocus
            />
          </div>

          {errorAndAlert && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded text-red-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorAndAlert}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-slate-900 text-white py-2.5 rounded hover:bg-slate-800 transition font-bold"
            >
              تحقق وتأكيد الدخول
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded transition font-bold"
            >
              إلغاء لغرفة العميل
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
