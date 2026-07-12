import { useState, useCallback } from 'react';
import type { LangCode, Translations } from '../types';
import { TRANSLATIONS, LANGS } from '../i18n/translations';

export function useLanguage() {
  const [langCode, setLangCode] = useState<LangCode>('en');

  const t: Translations = TRANSLATIONS[langCode];
  const currentLang = LANGS.find(l => l.code === langCode)!;

  const changeLang = useCallback((code: LangCode) => {
    setLangCode(code);
  }, []);

  return { t, langCode, currentLang, changeLang, LANGS };
}
