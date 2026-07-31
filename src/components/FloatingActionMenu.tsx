import { AnimatePresence, motion } from 'framer-motion';
import { Bot, MessageCircle, Phone, Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const SUPPORT_PHONE = '+917022058460';
const WHATSAPP_URL = `https://wa.me/${SUPPORT_PHONE}`;

interface FloatingActionMenuProps {
  onAssistantOpen: () => void;
}

const actions = [
  { label: 'AI Assistant', icon: Bot, className: 'bg-brand-purple text-white', action: 'assistant' },
  { label: 'Call Us', icon: Phone, className: 'bg-pink-600 text-white', action: 'call' },
  { label: 'WhatsApp', icon: MessageCircle, className: 'bg-emerald-500 text-white', action: 'whatsapp' },
] as const;

export function FloatingActionMenu({ onAssistantOpen }: FloatingActionMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const closeAnd = (action: typeof actions[number]['action']) => {
    setOpen(false);
    if (action === 'assistant') onAssistantOpen();
    if (action === 'call') {
      const isMobile = window.matchMedia('(max-width: 767px)').matches;
      if (isMobile || window.confirm('Call TheDecorParty?')) window.location.href = `tel:${SUPPORT_PHONE}`;
    }
    if (action === 'whatsapp') window.open(WHATSAPP_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div ref={menuRef} className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-[999] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {open && (
          <motion.div
            className="flex flex-col items-end gap-3"
            initial="closed"
            animate="open"
            exit="closed"
            variants={{ open: { transition: { staggerChildren: 0.07, staggerDirection: -1 } }, closed: { transition: { staggerChildren: 0.04, staggerDirection: 1 } } }}
          >
            {actions.map(({ label, icon: Icon, className, action }) => (
              <motion.button
                key={action}
                type="button"
                aria-label={label}
                onClick={() => closeAnd(action)}
                className="group flex items-center gap-2 rounded-full bg-white/95 pl-3 pr-1.5 py-1.5 text-sm font-semibold text-ink shadow-lg ring-1 ring-black/5 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-brand-purple-light"
                variants={{ open: { opacity: 1, y: 0, scale: 1 }, closed: { opacity: 0, y: 18, scale: 0.8 } }}
                transition={{ type: 'spring', stiffness: 420, damping: 25 }}
              >
                <span>{label}</span>
                <span className={`flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition-transform group-hover:scale-105 ${className}`}>
                  <Icon size={19} />
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        aria-label={open ? 'Close quick actions' : 'Open quick actions'}
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-purple text-white shadow-xl ring-4 ring-white/70 transition-colors hover:bg-brand-purple-dark focus:outline-none focus:ring-4 focus:ring-brand-purple-light/40"
        whileTap={{ scale: 0.92 }}
      >
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
          {open ? <X size={24} /> : <Plus size={25} />}
        </motion.span>
      </motion.button>
    </div>
  );
}
