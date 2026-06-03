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
];

export default function LanguageSelector() {
  const { i18n } = useTranslation();

  const handleChange = (value: string) => {
    i18n.changeLanguage(value);
  };

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  return (
    <div className="flex items-center gap-3">
      <Globe size={18} className="text-[#BB83C9] flex-shrink-0" strokeWidth={2} />
      <Select value={i18n.language} onValueChange={handleChange}>
        <SelectTrigger
          className="w-[140px] h-9 rounded-[12px] border-0 bg-white px-3 text-sm font-semibold text-[#232323] shadow-none focus:ring-0 focus:ring-offset-0"
          style={{
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            fontFamily: "'Outfit', system-ui, sans-serif",
          }}
        >
          <SelectValue placeholder="Select language">
            <span className="flex items-center gap-2">
              <span>{currentLang.flag}</span>
              <span>{currentLang.code.toUpperCase()}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          className="rounded-[12px] border-0 bg-white"
          style={{
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            fontFamily: "'Outfit', system-ui, sans-serif",
          }}
          align="end"
        >
          {languages.map((lang) => (
            <SelectItem
              key={lang.code}
              value={lang.code}
              className="rounded-[10px] text-sm font-semibold text-[#232323] cursor-pointer focus:bg-[rgba(187,131,201,0.1)] focus:text-[#232323]"
            >
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
