import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] w-full flex justify-center" style={{ backgroundColor: '#F7F4EE' }}>
      <div className="w-full max-w-[430px]" style={{ paddingTop: 'calc(24px + env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-3 px-5 py-4">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(232,226,216,0.5)' }}>
            <ArrowLeft size={20} className="text-[#232323]" strokeWidth={2} />
          </motion.button>
          <h1 className="text-xl font-bold text-[#232323]" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>Terms of Service</h1>
        </div>

        <div className="px-5 pb-8 space-y-6">
          <div className="flex justify-center py-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(187,131,201,0.15)' }}>
              <FileText size={32} style={{ color: '#BB83C9' }} strokeWidth={1.5} />
            </div>
          </div>

          <section>
            <h2 className="text-lg font-semibold text-[#232323] mb-2" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>1. Acceptance of Terms</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(35,35,35,0.7)', fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.6 }}>
              By accessing or using Equal, you agree to be bound by these Terms of Service. If you do not agree, please do not use the application.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#232323] mb-2" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>2. Eligibility</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(35,35,35,0.7)', fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.6 }}>
              You must be at least 18 years old to use Equal. By using the service, you represent that you meet this requirement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#232323] mb-2" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>3. Pi Network Account</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(35,35,35,0.7)', fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.6 }}>
              Equal uses Pi Network for authentication. You are responsible for maintaining the security of your Pi account. We do not store passwords or email addresses.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#232323] mb-2" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>4. User Conduct</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(35,35,35,0.7)', fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.6 }}>
              You agree not to: harass other users, post offensive content, create fake profiles, solicit money, or use the app for commercial purposes without authorization.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#232323] mb-2" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>5. Content</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(35,35,35,0.7)', fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.6 }}>
              You retain ownership of content you post. By posting, you grant Equal a license to display your content to other users. We may remove content that violates these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#232323] mb-2" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>6. Payments</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(35,35,35,0.7)', fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.6 }}>
              All payments on Equal are processed through Pi Network. Equal does not handle fiat currency. Refunds are handled according to Pi Network policies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#232323] mb-2" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>7. Termination</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(35,35,35,0.7)', fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.6 }}>
              We may suspend or terminate your account for violations of these terms. You may delete your account at any time through the Settings page.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#232323] mb-2" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>8. Disclaimer</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(35,35,35,0.7)', fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.6 }}>
              Equal is provided &ldquo;as is&rdquo; without warranties of any kind. We are not responsible for user interactions or outcomes from using the service.
            </p>
          </section>

          <div className="pt-4 pb-2 text-center">
            <p className="text-xs" style={{ color: 'rgba(35,35,35,0.4)', fontFamily: "'Outfit', system-ui, sans-serif" }}>Last updated: June 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
