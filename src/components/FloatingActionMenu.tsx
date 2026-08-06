import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, MessageCircle, Phone, X } from 'lucide-react';

const SUPPORT_PHONE = '+917022058460';
const WHATSAPP_URL = `https://wa.me/${SUPPORT_PHONE}`;

interface FloatingActionMenuProps {
  onAssistantOpen: () => void;
  assistantOpen?: boolean;
}

const actions = [
  {
    label: 'AI Assistant',
    icon: Bot,
    bg: 'bg-gradient-to-br from-brand-purple to-brand-purple-light',
    shadow: 'shadow-[0_4px_16px_rgba(107,33,168,0.4)]',
    action: 'assistant',
  },
  {
    label: 'Call Us',
    icon: Phone,
    bg: 'bg-gradient-to-br from-pink-500 to-rose-500',
    shadow: 'shadow-[0_4px_16px_rgba(236,72,153,0.4)]',
    action: 'call',
  },
  {
    label: 'WhatsApp',
    icon: MessageCircle,
    bg: 'bg-gradient-to-br from-emerald-400 to-green-500',
    shadow: 'shadow-[0_4px_16px_rgba(16,185,129,0.4)]',
    action: 'whatsapp',
  },
] as const;

export function FloatingActionMenu({ onAssistantOpen, assistantOpen = false }: FloatingActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      window.location.href = `tel:${SUPPORT_PHONE}`;
    }
    if (action === 'whatsapp') window.open(WHATSAPP_URL, '_blank', 'noopener,noreferrer');
  };

  const isProductPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/product/');

  if (!mounted || typeof document === 'undefined' || assistantOpen) return null;

  return ReactDOM.createPortal(
    <div
      ref={menuRef}
      className="fixed flex flex-col items-end gap-3 pointer-events-none transition-all duration-300"
      style={{
        position: 'fixed',
        bottom: isProductPage
          ? 'calc(76px + env(safe-area-inset-bottom, 0px))'
          : 'calc(20px + env(safe-area-inset-bottom, 0px))',
        right: '20px',
        zIndex: 999999,
      }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            className="flex flex-col items-end gap-3 pointer-events-auto"
            initial="closed"
            animate="open"
            exit="closed"
            variants={{
              open: { transition: { staggerChildren: 0.07, staggerDirection: -1 } },
              closed: { transition: { staggerChildren: 0.04, staggerDirection: 1 } },
            }}
          >
            {actions.map(({ label, icon: Icon, bg, shadow, action }) => (
              <motion.div
                key={action}
                className="flex items-center gap-2.5"
                variants={{
                  open: { opacity: 1, y: 0, scale: 1 },
                  closed: { opacity: 0, y: 14, scale: 0.7 },
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              >
                {/* Tooltip label */}
                <span className="rounded-lg bg-gray-900/85 px-2.5 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
                  {label}
                </span>

                {/* Icon button */}
                <button
                  type="button"
                  aria-label={label}
                  onClick={() => closeAnd(action)}
                  className={`flex h-12 w-12 items-center justify-center rounded-full text-white transition-transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-purple-light ${bg} ${shadow}`}
                >
                  <Icon size={20} />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        type="button"
        aria-label={open ? 'Close quick actions' : 'Open quick actions'}
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className="pointer-events-auto flex h-[58px] w-[58px] items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-purple-dark text-white shadow-[0_6px_24px_rgba(107,33,168,0.45)] ring-4 ring-white/80 dark:ring-slate-900/80 transition-colors hover:opacity-90 focus:outline-none sm:h-16 sm:w-16"
        whileTap={{ scale: 0.9 }}
      >
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          className="flex items-center justify-center"
        >
          {open ? <X size={24} /> : <MessageCircle size={23} />}
        </motion.span>
      </motion.button>
    </div>,
    document.body
  );
}
