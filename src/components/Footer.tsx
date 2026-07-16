import React from 'react';
import { Phone, Mail } from 'lucide-react';
import type { Translations } from '../types';
import { FOOTER_LINKS } from '../data';
import { trackContactClick, trackWhatsappClick } from '../lib/analytics';

interface FooterProps {
  t: Translations;
  onPageOpen: (key: 'terms' | 'privacy' | 'refund' | 'about') => void;
}

export const Footer: React.FC<FooterProps> = ({ t, onPageOpen }) => {
  const expLinks = FOOTER_LINKS.experiences.map(l => ({ key: l.key, label: t[l.key as keyof Translations] as string }));
  const giftLinks = FOOTER_LINKS.gifts.map(l => ({ key: l.key, label: t[l.key as keyof Translations] as string }));
  const compLinks = FOOTER_LINKS.company.map(l => ({ key: l.key, label: t[l.key as keyof Translations] as string }));

  const linkClass = 'text-sm text-white/70 hover:text-white transition-colors';
  const colTitleClass = 'mb-4 text-sm font-semibold uppercase tracking-wide text-white';

  return (
    <footer className="bg-brand-purple-dark text-white">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-3 text-xl font-extrabold">{t.logo}</div>
          <p className="mb-4 text-sm text-white/70">{t.footer_copy}</p>
          <div className="mb-4 flex flex-col gap-2">
            <a href="tel:+917022058460" onClick={() => trackContactClick()} className="flex items-center gap-2 text-sm text-white/80 hover:text-white">
              <Phone size={15} />
              +91 70220 58460
            </a>
            <a href="mailto:thedecorparty.team@gmail.com" onClick={() => trackContactClick()} className="flex items-center gap-2 text-sm text-white/80 hover:text-white">
              <Mail size={15} />
              thedecorparty.team@gmail.com
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://www.instagram.com/thedecorparty.com_?utm_source=qr&igsh=MW15aTFvOWY0MjU1cg=="
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
            </a>
            <a
              href="https://wa.me/917022058460"
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
              onClick={() => trackWhatsappClick()}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
            </a>
          </div>
        </div>

        <div>
          <h4 className={colTitleClass}>{t.footer_exp_title}</h4>
          <ul className="flex flex-col gap-2.5">
            {expLinks.map(l => <li key={l.key}><a href="#" className={linkClass}>{l.label}</a></li>)}
          </ul>
        </div>

        <div>
          <h4 className={colTitleClass}>{t.footer_gifts_title}</h4>
          <ul className="flex flex-col gap-2.5">
            {giftLinks.map(l => <li key={l.key}><a href="#" className={linkClass}>{l.label}</a></li>)}
          </ul>
        </div>

        <div>
          <h4 className={colTitleClass}>{t.footer_company_title}</h4>
          <ul className="flex flex-col gap-2.5">
            {compLinks.map(l => <li key={l.key}><a href="#" className={linkClass}>{l.label}</a></li>)}
            <li><a href="#" className={linkClass} onClick={e => { e.preventDefault(); onPageOpen('about'); }}>About Us</a></li>
            <li><a href="#" className={linkClass} onClick={e => { e.preventDefault(); onPageOpen('terms'); }}>Terms &amp; Conditions</a></li>
            <li><a href="#" className={linkClass} onClick={e => { e.preventDefault(); onPageOpen('privacy'); }}>Privacy Policy</a></li>
            <li><a href="#" className={linkClass} onClick={e => { e.preventDefault(); onPageOpen('refund'); }}>Refund Policy</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-5 text-center text-xs text-white/60">
        <p>{t.footer_copy_bottom}</p>
        <p>{t.footer_legal_bottom}</p>
      </div>
    </footer>
  );
};
