import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import ru from './locales/ru.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import zh from './locales/zh.json';
import de from './locales/de.json';
import it from './locales/it.json';
import pt from './locales/pt.json';
import uk from './locales/uk.json';
import tr from './locales/tr.json';
import ar from './locales/ar.json';
import hi from './locales/hi.json';
import id from './locales/id.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import vi from './locales/vi.json';
import th from './locales/th.json';
import fil from './locales/fil.json';
import ms from './locales/ms.json';
import sw from './locales/sw.json';
import nl from './locales/nl.json';
import pl from './locales/pl.json';
import fa from './locales/fa.json';
import bn from './locales/bn.json';
import ta from './locales/ta.json';
import el from './locales/el.json';
import cs from './locales/cs.json';
import hu from './locales/hu.json';
import ro from './locales/ro.json';
import hr from './locales/hr.json';
import sv from './locales/sv.json';
import no from './locales/no.json';
import da from './locales/da.json';
import fi from './locales/fi.json';
import he from './locales/he.json';

const resources = {
  en: { translation: en },
  ru: { translation: ru },
  es: { translation: es },
  fr: { translation: fr },
  zh: { translation: zh },
  de: { translation: de },
  it: { translation: it },
  pt: { translation: pt },
  uk: { translation: uk },
  tr: { translation: tr },
  ar: { translation: ar },
  hi: { translation: hi },
  id: { translation: id },
  ja: { translation: ja },
  ko: { translation: ko },
  vi: { translation: vi },
  th: { translation: th },
  fil: { translation: fil },
  ms: { translation: ms },
  sw: { translation: sw },
  nl: { translation: nl },
  pl: { translation: pl },
  fa: { translation: fa },
  bn: { translation: bn },
  ta: { translation: ta },
  el: { translation: el },
  cs: { translation: cs },
  hu: { translation: hu },
  ro: { translation: ro },
  hr: { translation: hr },
  sv: { translation: sv },
  no: { translation: no },
  da: { translation: da },
  fi: { translation: fi },
  he: { translation: he },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: undefined,
    load: 'languageOnly',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      convertDetectedLanguage: (lng: string) => lng.split('-')[0],
    },
  });

export default i18n;
