import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const languages = [
  { code: 'en', label: 'English', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: 'ru', label: 'Русский', flag: '\u{1F1F7}\u{1F1FA}' },
  { code: 'es', label: 'Español', flag: '\u{1F1EA}\u{1F1F8}' },
  { code: 'fr', label: 'Français', flag: '\u{1F1EB}\u{1F1F7}' },
  { code: 'zh', label: '中文', flag: '\u{1F1E8}\u{1F1F3}' },
  { code: 'de', label: 'Deutsch', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: 'it', label: 'Italiano', flag: '\u{1F1EE}\u{1F1F9}' },
  { code: 'pt', label: 'Português', flag: '\u{1F1E7}\u{1F1F7}' },
  { code: 'uk', label: 'Українська', flag: '\u{1F1FA}\u{1F1E6}' },
  { code: 'tr', label: 'Türkçe', flag: '\u{1F1F9}\u{1F1F7}' },
  { code: 'ar', label: 'العربية', flag: '\u{1F1F8}\u{1F1E6}' },
  { code: 'hi', label: 'हिन्दी', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'id', label: 'Bahasa Indonesia', flag: '\u{1F1EE}\u{1F1E9}' },
  { code: 'ja', label: '日本語', flag: '\u{1F1EF}\u{1F1F5}' },
  { code: 'ko', label: '한국어', flag: '\u{1F1F0}\u{1F1F7}' },
  { code: 'vi', label: 'Tiếng Việt', flag: '\u{1F1FB}\u{1F1F3}' },
  { code: 'th', label: 'ไทย', flag: '\u{1F1F9}\u{1F1ED}' },
  { code: 'fil', label: 'Filipino', flag: '\u{1F1F5}\u{1F1ED}' },
  { code: 'ms', label: 'Melayu', flag: '\u{1F1F2}\u{1F1FE}' },
  { code: 'sw', label: 'Kiswahili', flag: '\u{1F1F0}\u{1F1EA}' },
  { code: 'nl', label: 'Nederlands', flag: '\u{1F1F3}\u{1F1F1}' },
  { code: 'pl', label: 'Polski', flag: '\u{1F1F5}\u{1F1F1}' },
  { code: 'fa', label: 'فارسی', flag: '\u{1F1EE}\u{1F1F7}' },
  { code: 'bn', label: 'বাংলা', flag: '\u{1F1E7}\u{1F1E9}' },
  { code: 'ta', label: 'தமிழ்', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'el', label: 'Ελληνικά', flag: '\u{1F1EC}\u{1F1F7}' },
  { code: 'cs', label: 'Čeština', flag: '\u{1F1E8}\u{1F1FF}' },
  { code: 'hu', label: 'Magyar', flag: '\u{1F1ED}\u{1F1FA}' },
  { code: 'ro', label: 'Română', flag: '\u{1F1F7}\u{1F1F4}' },
  { code: 'hr', label: 'Hrvatski', flag: '\u{1F1ED}\u{1F1F7}' },
  { code: 'sv', label: 'Svenska', flag: '\u{1F1F8}\u{1F1EA}' },
  { code: 'no', label: 'Norsk', flag: '\u{1F1F3}\u{1F1F4}' },
  { code: 'da', label: 'Dansk', flag: '\u{1F1E9}\u{1F1F0}' },
  { code: 'fi', label: 'Suomi', flag: '\u{1F1EB}\u{1F1EE}' },
  { code: 'he', label: 'עברית', flag: '\u{1F1EE}\u{1F1F1}' },
];

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const handleChange = (value: string) => { i18n.changeLanguage(value); };
  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];
  return (
    <div className="flex items-center gap-3">
      <Globe size={18} className="text-[#BB83C9] flex-shrink-0" strokeWidth={2} />
      <Select value={i18n.language} onValueChange={handleChange}>
        <SelectTrigger className="w-[150px] h-9 rounded-[12px] border-0 bg-white dark:bg-[#22293B] px-3 text-sm font-semibold text-[var(--charcoal)] shadow-none focus:ring-0 focus:ring-offset-0"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)', fontFamily: "'Outfit', system-ui, sans-serif" }}>
          <SelectValue placeholder="Select language">
            <span className="flex items-center gap-2">
              <span>{currentLang.flag}</span>
              <span>{currentLang.code.toUpperCase()}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="rounded-[12px] border-0 bg-white dark:bg-[#22293B] max-h-[300px]"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontFamily: "'Outfit', system-ui, sans-serif" }} align="end">
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}
              className="rounded-[10px] text-sm font-semibold text-[var(--charcoal)] cursor-pointer focus:bg-[rgba(187,131,201,0.1)] focus:text-[var(--charcoal)]">
              <span className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
