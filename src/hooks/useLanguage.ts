import { useState, useCallback, useEffect } from 'react';
import type { LangCode, Translations } from '../types';
import { TRANSLATIONS, LANGS } from '../i18n/translations';

export function useLanguage() {
  const [langCode, setLangCode] = useState<LangCode>(() => {
    const saved = localStorage.getItem('language') as LangCode | null;
    return saved && ['en', 'kn', 'te', 'ta'].includes(saved) ? saved : 'en';
  });

  const t: Translations = TRANSLATIONS[langCode];
  const currentLang = LANGS.find(l => l.code === langCode)!;

  useEffect(() => {
    const handleLanguageChange = (event: Event) => {
      const code = (event as CustomEvent<LangCode>).detail;
      if (['en', 'kn', 'te', 'ta'].includes(code)) setLangCode(code);
    };
    window.addEventListener('languagechange', handleLanguageChange);
    return () => window.removeEventListener('languagechange', handleLanguageChange);
  }, []);

  const changeLang = useCallback((code: LangCode) => {
    if (!['en', 'kn', 'te', 'ta'].includes(code)) return;
    localStorage.setItem('language', code);
    setLangCode(code);
    window.dispatchEvent(new CustomEvent<LangCode>('languagechange', { detail: code }));
  }, []);

  return { t, langCode, currentLang, changeLang, LANGS };
}
