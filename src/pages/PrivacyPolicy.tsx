import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Section {
  h: string;
  p: string;
  items?: string[];
  marker?: string;
  markerColor?: string;
}

const SECTIONS: Section[] = [
  { h: 'legal.p1h', p: 'legal.p1p', items: ['legal.p1i1', 'legal.p1i2', 'legal.p1i3'], marker: '•', markerColor: '#BB83C9' },
  { h: 'legal.p2h', p: 'legal.p2p', items: ['legal.p2i1', 'legal.p2i2', 'legal.p2i3', 'legal.p2i4', 'legal.p2i5'], marker: '✓', markerColor: '#7DE0B3' },
  { h: 'legal.p3h', p: 'legal.p3p', items: ['legal.p3i1', 'legal.p3i2', 'legal.p3i3', 'legal.p3i4'], marker: '•', markerColor: '#BB83C9' },
  { h: 'legal.p4h', p: 'legal.p4p' },
  { h: 'legal.p5h', p: 'legal.p5p' },
  { h: 'legal.p6h', p: 'legal.p6p' },
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-[100dvh] w-full flex justify-center" style={{ backgroundColor: '#F7F4EE' }}>
      <div className="w-full max-w-[430px]" style={{ paddingTop: 'calc(24px + env(safe-area-inset-top))' }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(232,226,216,0.5)' }}
          >
            <ArrowLeft size={20} className="text-[#232323]" strokeWidth={2} />
          </motion.button>
          <h1
            className="text-xl font-bold text-[#232323]"
            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
          >
            {t('legal.privacyTitle')}
          </h1>
        </div>

        {/* Content */}
        <div className="px-5 pb-8 space-y-6">
          <div className="flex justify-center py-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(187,131,201,0.15)' }}
            >
              <Shield size={32} style={{ color: '#BB83C9' }} strokeWidth={1.5} />
            </div>
          </div>

          {SECTIONS.map((s) => (
            <section key={s.h}>
              <h2 className="text-lg font-semibold text-[#232323] mb-2" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                {t(s.h)}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(35,35,35,0.7)', fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.6 }}>
                {t(s.p)}
              </p>
              {s.items && (
                <ul className="mt-2 space-y-1 text-sm" style={{ color: 'rgba(35,35,35,0.7)', fontFamily: "'Outfit', system-ui, sans-serif" }}>
                  {s.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span style={{ color: s.markerColor }}>{s.marker}</span>
                      <span>{t(item)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <div className="pt-4 pb-2 text-center">
            <p className="text-xs" style={{ color: 'rgba(35,35,35,0.4)', fontFamily: "'Outfit', system-ui, sans-serif" }}>
              {t('legal.lastUpdated')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
