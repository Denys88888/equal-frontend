import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SECTIONS = [
  ['legal.t1h', 'legal.t1p'],
  ['legal.t2h', 'legal.t2p'],
  ['legal.t3h', 'legal.t3p'],
  ['legal.t4h', 'legal.t4p'],
  ['legal.t5h', 'legal.t5p'],
  ['legal.t6h', 'legal.t6p'],
  ['legal.t7h', 'legal.t7p'],
  ['legal.t8h', 'legal.t8p'],
] as const;

export default function TermsOfService() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-[100dvh] w-full flex justify-center" style={{ backgroundColor: '#F7F4EE' }}>
      <div className="w-full max-w-[430px]" style={{ paddingTop: 'calc(24px + env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-3 px-5 py-4">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(232,226,216,0.5)' }}>
            <ArrowLeft size={20} className="text-[#232323]" strokeWidth={2} />
          </motion.button>
          <h1 className="text-xl font-bold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>{t('legal.termsTitle')}</h1>
        </div>

        <div className="px-5 pb-8 space-y-6">
          <div className="flex justify-center py-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(187,131,201,0.15)' }}>
              <FileText size={32} style={{ color: '#BB83C9' }} strokeWidth={1.5} />
            </div>
          </div>

          {SECTIONS.map(([h, p]) => (
            <section key={h}>
              <h2 className="text-lg font-semibold text-[#232323] mb-2" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>{t(h)}</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(35,35,35,0.7)', fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.6 }}>
                {t(p)}
              </p>
            </section>
          ))}

          <div className="pt-4 pb-2 text-center">
            <p className="text-xs" style={{ color: 'rgba(35,35,35,0.4)', fontFamily: "'Outfit', system-ui, sans-serif" }}>{t('legal.lastUpdated')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
