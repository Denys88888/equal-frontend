import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  const { t } = useTranslation();
  const navigate = useNavigate();

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
            Privacy Policy
          </h1>
        </div>

        {/* Content */}
        <div className="px-5 pb-8 space-y-6">
          {/* Shield icon */}
          <div className="flex justify-center py-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(187,131,201,0.15)' }}
            >
              <Shield size={32} style={{ color: '#BB83C9' }} strokeWidth={1.5} />
            </div>
          </div>

          <section>
            <h2 className="text-lg font-semibold text-[#232323] mb-2" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              1. Information We Collect
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(35,35,35,0.7)', fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.6 }}>
              Equal collects only the minimum information necessary to provide our dating service:
            </p>
            <ul className="mt-2 space-y-1 text-sm" style={{ color: 'rgba(35,35,35,0.7)', fontFamily: "'Outfit', system-ui, sans-serif" }}>
              <li className="flex items-start gap-2">
                <span style={{ color: '#BB83C9' }}>•</span>
                <span>Pi Network username and UID (via Pi authentication)</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#BB83C9' }}>•</span>
                <span>Profile information you voluntarily provide (bio, photos, interests, city)</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#BB83C9' }}>•</span>
                <span>App usage data (swipes, matches, messages)</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#232323] mb-2" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              2. Information We Do NOT Collect
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(35,35,35,0.7)', fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.6 }}>
              Equal is committed to privacy-first design. We do NOT collect:
            </p>
            <ul className="mt-2 space-y-1 text-sm" style={{ color: 'rgba(35,35,35,0.7)', fontFamily: "'Outfit', system-ui, sans-serif" }}>
              <li className="flex items-start gap-2">
                <span style={{ color: '#7DE0B3' }}>✓</span>
                <span>Email addresses</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#7DE0B3' }}>✓</span>
                <span>Phone numbers</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#7DE0B3' }}>✓</span>
                <span>Passwords</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#7DE0B3' }}>✓</span>
                <span>Payment information (all payments go through Pi Network)</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#7DE0B3' }}>✓</span>
                <span>Precise GPS location (only city-level)</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#232323] mb-2" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              3. How We Use Your Information
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(35,35,35,0.7)', fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.6 }}>
              Your information is used solely to:
            </p>
            <ul className="mt-2 space-y-1 text-sm" style={{ color: 'rgba(35,35,35,0.7)', fontFamily: "'Outfit', system-ui, sans-serif" }}>
              <li className="flex items-start gap-2">
                <span style={{ color: '#BB83C9' }}>•</span>
                <span>Authenticate you via Pi Network</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#BB83C9' }}>•</span>
                <span>Show your profile to potential matches</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#BB83C9' }}>•</span>
                <span>Enable messaging between matched users</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#BB83C9' }}>•</span>
                <span>Calculate compatibility scores</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#232323] mb-2" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              4. Data Storage & Security
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(35,35,35,0.7)', fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.6 }}>
              All data is stored securely using industry-standard encryption. We use PostgreSQL with SSL connections and never store passwords or payment details. Messages are encrypted in transit and at rest.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#232323] mb-2" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              5. Your Rights
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(35,35,35,0.7)', fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.6 }}>
              You can delete your account and all associated data at any time through the Settings page. This action is irreversible and removes all your profile information, photos, messages, and matches from our servers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#232323] mb-2" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              6. Contact
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(35,35,35,0.7)', fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.6 }}>
              For privacy-related questions, contact us through the Pi Network community channels or the Report feature in the app.
            </p>
          </section>

          <div className="pt-4 pb-2 text-center">
            <p className="text-xs" style={{ color: 'rgba(35,35,35,0.4)', fontFamily: "'Outfit', system-ui, sans-serif" }}>
              Last updated: June 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
