import React, { useState } from 'react';
import { 
  Briefcase, Compass, Users, FileText, Truck, Plane, 
  Building, Moon, Info, ArrowLeft, Sparkles, AlertCircle
} from 'lucide-react';
import { Service } from '../types';

interface ServiceParallaxCardProps {
  key?: string | number;
  service: Service;
  onSelect: (serviceId: string) => void;
  onDetails: (service: Service) => void;
  renderIcon: (iconName: string, className?: string) => React.ReactNode;
  lang?: 'ar' | 'en';
}

// Map each service category of سما المملكة to a highly relevant, premium thematic background image
const getBackgroundImage = (id: string, category: string): string => {
  const images: Record<string, string> = {
    'srv-1': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80', // Work Visa: Modern boardroom, laptop, business operations
    'srv-2': 'https://images.unsplash.com/photo-1591604021695-0c69b7c05981?auto=format&fit=crop&w=600&q=80', // Hajj & Umrah: Beautiful Islamic geometry, arch dome architecture
    'srv-3': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80', // Visit Visa: Traveler maps, compass, passport pages
    'srv-4': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80', // Gov clearance: Modern sleek glass business highrise, architectural lines
    'srv-5': 'https://images.unsplash.com/photo-1516576880881-14017730d8c3?auto=format&fit=crop&w=600&q=80', // Land logistics: cargo shipping highway trailer truck
    'srv-6': 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=600&q=80', // Air transport: passenger plane rising in sunrise
  };

  if (images[id]) return images[id];

  // Fallbacks by category
  if (category === 'visa') {
    return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80';
  } else if (category === 'gov') {
    return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80';
  } else if (category === 'transport') {
    return 'https://images.unsplash.com/photo-1516576880881-14017730d8c3?auto=format&fit=crop&w=600&q=80';
  }

  return 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80'; // Sleek general office
};

export default function ServiceParallaxCard({ service, onSelect, onDetails, renderIcon, lang = 'ar' }: ServiceParallaxCardProps) {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const [categories] = useState<{ id: string; nameAr: string; color: string }[]>(() => {
    const DEFAULT_CATEGORIES = [
      { id: 'visa', nameAr: 'خدمات تأشيرات وسفر', color: 'purple' },
      { id: 'gov', nameAr: 'تعقيب ومراجعة دائرية', color: 'amber' },
      { id: 'transport', nameAr: 'نقل ومواصلات', color: 'blue' },
      { id: 'other', nameAr: 'خدمات عامة مخصصة', color: 'emerald' }
    ];
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sm_service_categories');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed.map(c => ({
              id: c.id,
              nameAr: c.nameAr || c.label || c.id,
              color: c.color || 'emerald'
            }));
          }
        } catch (e) {
          // ignore
        }
      }
    }
    return DEFAULT_CATEGORIES;
  });

  const getServiceDisplayName = (srv: Service) => {
    if (lang === 'en') {
      if (srv.id === 'srv-1') return 'Work Visa';
      if (srv.id === 'srv-2') return 'Hajj & Umrah Visa';
      if (srv.id === 'srv-3') return 'Visit Visa';
      if (srv.id === 'srv-4') return 'Gov Follow-up & Clearance';
      if (srv.id === 'srv-5') return 'Land Transport';
      if (srv.id === 'srv-6') return 'Air Transport';
      
      // If there are other standard names we can support:
      if (srv.name && srv.name.includes('تأشيرة عمل')) return 'Work Visa';
      if (srv.name && srv.name.includes('عمرة وحج')) return 'Hajj & Umrah Visa';
      if (srv.name && srv.name.includes('زيارة')) return 'Visit Visa';
      if (srv.name && srv.name.includes('تعقيب')) return 'Gov Clearance';
      if (srv.name && srv.name.includes('نقل بري')) return 'Land Transport';
      if (srv.name && srv.name.includes('نقل جوي')) return 'Air Transport';
      
      return srv.name;
    }
    return srv.name;
  };

  const getServiceDisplayDesc = (srv: Service) => {
    if (lang === 'en') {
      if (srv.id === 'srv-1') return 'Facilitating all recruitment, delegation, and issuances of work visas for individuals and companies with high speed and privacy.';
      if (srv.id === 'srv-2') return 'Issuing pilgrim/visitor visas, coordinating lodging, and transportation at special prices.';
      if (srv.id === 'srv-3') return 'Family, personal, commercial, and tourist visa procedures with follow-ups on visa acceptance and stamping.';
      if (srv.id === 'srv-4') return 'Following up on and completing all government office, ministry of labor, passport control, and municipality procedures with high efficiency.';
      if (srv.id === 'srv-5') return 'Providing group land transport, shipping goods, packages, and vehicles across KSA and Gulf countries.';
      if (srv.id === 'srv-6') return 'Flight ticket booking, follow-up, air freight policy issuance, and facilitating airport reception.';
      return srv.description;
    }
    return srv.description;
  };

  const getCategoryName = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return catId;
    if (lang === 'en') {
      if (catId === 'visa') return 'Visas & Travel';
      if (catId === 'gov') return 'Gov Follow-up';
      if (catId === 'transport') return 'Transport & Shipping';
      if (catId === 'other') return 'Custom Public';
      return cat.nameAr;
    }
    return cat.nameAr;
  };

  const addFeesTotal = (service.additionalFees || []).reduce((sum, f) => sum + f.amount, 0);
  const srvTax = service.officeFee * 0.15;
  const srvTotal = service.govFee + service.officeFee + srvTax + addFeesTotal;
  const bgImg = getBackgroundImage(service.id, service.category);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    
    // Normalized position from center of card (-0.5 to +0.5)
    // Client position relative to card boundaries
    const clientXRelative = e.clientX - rect.left;
    const clientYRelative = e.clientY - rect.top;
    
    const x = (clientXRelative / rect.width) - 0.5;
    const y = (clientYRelative / rect.height) - 0.5;
    
    setCoords({ x, y });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setCoords({ x: 0, y: 0 }); // Snap back smoothly to dead center
  };

  // Modern design values calculated from pointer coordinate vectors
  // Outer Card tilting styles
  const cardTransform = isHovered 
    ? `perspective(1000px) rotateY(${coords.x * 12}deg) rotateX(${coords.y * -12}deg) translateY(-8px)` 
    : 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateY(0px)';

  // Subtler opposite translation for the background image to trigger high-fidelity parallax depth
  const backgroundTransform = isHovered 
    ? `translate(${coords.x * -22}px, ${coords.y * -22}px) scale(1.18)` 
    : 'translate(0px, 0px) scale(1.03)';

  // Reflection gloss layer shifting to simulate dynamic light refraction across the card surface
  const glossGradient = isHovered 
    ? `radial-gradient(circle at ${(coords.x + 0.5) * 100}% ${(coords.y + 0.5) * 100}%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 65%)`
    : 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0) 100%)';

  return (
    <div 
      className="bg-white rounded-3xl border border-slate-200/80 shadow-md flex flex-col justify-between relative group cursor-pointer overflow-hidden transition-all duration-300 transform-gpu"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: cardTransform,
        boxShadow: isHovered 
          ? '0 20px 40px -15px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(245, 158, 11, 0.2)' 
          : '0 4px 12px -2px rgba(15, 23, 42, 0.04), 0 0 0 1px rgba(15, 23, 42, 0.02)',
        transition: isHovered 
          ? 'transform 0.08s ease-out, shadow 0.15s ease-out, border-color 0.2s ease-out' 
          : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s ease',
        borderColor: isHovered ? '#f59e0b' : 'rgba(226, 232, 240, 0.8)'
      }}
    >
      {/* Dynamic Light Refraction Overlord */}
      <div 
        className="absolute inset-0 pointer-events-none z-35 transition-all duration-100"
        style={{ background: glossGradient }}
      />

      {/* Top Graphic Header with Parallax Aspect */}
      <div className="h-40 w-full relative overflow-hidden bg-slate-950 flex-shrink-0">
        <div 
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none pointer-events-none opacity-45 mix-blend-overlay"
          style={{
            backgroundImage: `url(${bgImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: backgroundTransform,
            transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />

        {/* Ambient Overlay to fade picture smoothly into white base */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/20 to-transparent z-10" />

        {/* Categories Badges overlaid elegantly */}
        <span className="absolute top-4 right-4 z-20 text-[10px] font-black tracking-wider bg-slate-900/60 text-amber-400 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 uppercase font-sans flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
          <span>
            {getCategoryName(service.category)}
          </span>
        </span>
      </div>

      {/* Elevated Icon Sphere overlaying the seam */}
      <div 
        className="w-14 h-14 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black flex items-center justify-center rounded-2xl border-4 border-white shadow-lg absolute right-6 top-28 z-25 transition-all duration-300"
        style={{
          transform: isHovered ? 'scale(1.12) rotate(6deg) translateY(-2px)' : 'scale(1) rotate(0deg) translateY(0px)',
          transition: isHovered ? 'all 0.15s ease-out' : 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        title={service.name}
      >
        {renderIcon(service.icon, "w-6 h-6 text-slate-950 stroke-[2.2]")}
      </div>

      {/* Main card descriptive details */}
      <div className="pt-7 px-6 pb-4 flex-grow flex flex-col justify-between text-start relative z-20">
        <div>
          <h3 className="text-base font-black text-slate-900 mb-1.5 transition-colors group-hover:text-amber-600 duration-300">
            {getServiceDisplayName(service)}
          </h3>
          <p className="text-slate-500 text-xs leading-relaxed min-h-[44px] line-clamp-2 select-none">
            {getServiceDisplayDesc(service)}
          </p>
        </div>

        {/* Redesigned billing fee checklist - elegant bento style */}
        <div className="mt-4 bg-slate-50/75 rounded-2xl p-4 border border-slate-100 group-hover:bg-amber-50/15 group-hover:border-amber-100/30 transition-colors duration-450 space-y-2.5 relative">
          
          <div className="flex justify-between items-center text-[11px] text-slate-500 font-sans">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              <span>{lang === 'en' ? 'Government Fees:' : 'الرسوم الحكومية:'}</span>
            </span>
            <span className="font-bold text-slate-900 font-mono">{service.govFee.toFixed(2)} {lang === 'en' ? 'SAR' : 'ر.س'}</span>
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-500 font-sans">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              <span>{lang === 'en' ? 'Sama Office Fees:' : 'أتعاب مكتب سما المملكة:'}</span>
            </span>
            <span className="font-bold text-slate-900 font-mono">{service.officeFee.toFixed(2)} {lang === 'en' ? 'SAR' : 'ر.س'}</span>
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-500 font-sans">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              <span>{lang === 'en' ? 'VAT (15%):' : 'ضريبة القيمة المضافة (15%):'}</span>
            </span>
            <span className="font-bold text-slate-900 font-mono">{srvTax.toFixed(2)} {lang === 'en' ? 'SAR' : 'ر.س'}</span>
          </div>

          {addFeesTotal > 0 && (
            <div className="flex justify-between items-center text-[10px] text-indigo-700 font-sans border-t border-slate-150 pt-1">
              <span className="flex items-center gap-1 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                <span>{lang === 'en' ? 'Additional Fees:' : 'بند رسوم إضافية تابعة:'}</span>
              </span>
              <span className="font-black font-mono">{addFeesTotal.toFixed(2)} {lang === 'en' ? 'SAR' : 'ر.س'}</span>
            </div>
          )}

          {/* Dotted border ticket tear simulator */}
          <div className="border-t border-dashed border-slate-200/80 pt-2.5 mt-2.5 flex justify-between items-center text-xs text-amber-900">
            <span className="font-bold font-sans">{lang === 'en' ? 'Estimated Total:' : 'باقة السعر التقريبي:'}</span>
            <span className="font-black text-amber-700 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 font-mono">
              {srvTotal.toFixed(2)} {lang === 'en' ? 'SAR' : 'ر.س'}
            </span>
          </div>
        </div>

        {/* Bottom actionable panels with smooth animations */}
        <div className="mt-4 pt-1 flex justify-between gap-2.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(service.id);
            }}
            className="flex-1 bg-slate-950 hover:bg-slate-850 text-white py-2.5 px-4 rounded-xl text-xs font-extrabold text-center transition-all shadow-sm hover:shadow-md cursor-pointer font-sans active:translate-y-0.5"
          >
            {lang === 'en' ? 'Request Service' : 'طلب هذه الخدمة'}
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDetails(service);
            }}
            className="px-3 py-2.5 bg-slate-100 hover:bg-amber-550/10 text-slate-700 hover:text-amber-800 hover:border-amber-350 active:scale-95 rounded-xl text-xs transition-all border border-slate-200 flex items-center justify-center gap-1 shadow-2xs hover:shadow cursor-pointer"
            title={lang === 'en' ? 'Review items & documents' : 'مراجعة البنود والمستندات'}
          >
            <Info className="w-3.5 h-3.5 flex-shrink-0 text-slate-500 group-hover:text-amber-600 transition-colors" />
            <span className="font-extrabold text-[11px] select-none">{lang === 'en' ? 'Details' : 'تفاصيل البنود'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
