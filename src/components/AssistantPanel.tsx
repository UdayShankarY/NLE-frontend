import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AdminProduct } from '../types';
import { ProductCard } from './ProductSlider';
import { useLanguage } from '../hooks/useLanguage';
import { Bot, X, Send, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

export type AssistantProduct = {
  id: string;
  name: string;
  image: string;
  category: string;
  price: number;
  featured: boolean;
  description?: string;
};

export type AssistantMessage = {
  id: number;
  sender: 'bot' | 'user';
  text: string;
  products?: AssistantProduct[];
  loading?: boolean;
};

interface AssistantPanelProps {
  open: boolean;
  onClose: () => void;
  messages: AssistantMessage[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

export const AssistantPanel: React.FC<AssistantPanelProps> = ({
  open,
  onClose,
  messages,
  inputValue,
  onInputChange,
  onSubmit,
  inputRef,
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const productTrackRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollProducts = (direction: 'left' | 'right') => {
    const track = productTrackRef.current;
    if (!track) return;
    const card = track.querySelector('[data-card]') as HTMLElement | null;
    const offset = card ? card.offsetWidth + 16 : 280;
    track.scrollBy({ left: direction === 'left' ? -offset * 1.5 : offset * 1.5, behavior: 'smooth' });
  };

  const startDrag = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollStart = useRef(0);

  const onDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
    startDrag.current = true;
    dragStartX.current = pageX - (productTrackRef.current?.offsetLeft || 0);
    dragScrollStart.current = productTrackRef.current?.scrollLeft || 0;
    if (productTrackRef.current) productTrackRef.current.style.cursor = 'grabbing';
  };

  const onDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!startDrag.current || !productTrackRef.current) return;
    e.preventDefault();
    const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
    const x = pageX - productTrackRef.current.offsetLeft;
    productTrackRef.current.scrollLeft = dragScrollStart.current - (x - dragStartX.current) * 1.2;
  };

  const onDragEnd = () => {
    startDrag.current = false;
    if (productTrackRef.current) productTrackRef.current.style.cursor = 'grab';
  };

  // Auto-scroll to latest message when messages change
  React.useEffect(() => {
    const el = document.getElementById('assistant-scroll-container');
    if (el) el.scrollTop = el.scrollHeight;
    if (open && inputRef?.current) inputRef.current.focus();
  }, [messages, open, inputRef]);

  // Lock body scroll when panel is open — prevents page scroll-through
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-[1000000] bg-black/50 backdrop-blur-sm transition-opacity duration-200',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-[1000001] flex w-[min(420px,100vw)] flex-col bg-white dark:bg-slate-900 border-l border-gray-100 dark:border-slate-800 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.34,1.1,0.64,1)]',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label={t.ai_assistant || 'AI Assistant'}
        // Prevent touch events from bubbling to backdrop/page
        onTouchMove={e => e.stopPropagation()}
        onWheel={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-brand-purple to-brand-purple-light px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <Bot size={20} className="text-white" />
              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-brand-purple bg-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/70">
                {t.ai_assistant || 'AI Assistant'}
              </p>
              <h3 className="text-sm font-semibold text-white">
                {t.ask_assistant || 'How can we help?'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
            onClick={onClose}
            aria-label="Close assistant"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4"
          id="assistant-scroll-container"
          style={{
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
          }}
        >
          {messages.map(message => (
            <div key={message.id} className={cn('flex flex-col gap-2', message.sender === 'user' && 'items-end')}>
              {/* Bubble */}
              <div
                className={cn(
                  'max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed break-words',
                  message.sender === 'bot'
                    ? 'rounded-tl-sm bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-100'
                    : 'rounded-tr-sm bg-gradient-to-br from-brand-purple to-brand-purple-light text-white'
                )}
              >
                {message.loading ? (
                  <div className="flex items-center gap-3">
                    <Sparkles size={14} className="text-brand-purple dark:text-purple-300 animate-pulse" />
                    <span className="text-gray-500 dark:text-slate-400">Thinking</span>
                    <div className="flex items-center gap-1">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                  </div>
                ) : (
                  <div className="whitespace-pre-line">{message.text}</div>
                )}
              </div>

              {/* Product cards for bot messages */}
              {message.products && message.products.length > 0 && (
                <div className="w-full rounded-2xl bg-gray-50 dark:bg-slate-800/80 p-3 shadow-sm border border-gray-100 dark:border-slate-700/60">
                  <div className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-slate-200">
                    <Sparkles size={12} className="text-brand-purple dark:text-purple-300" />
                    Recommended for You
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => scrollProducts('left')}
                      className="absolute left-0 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 sm:flex"
                      aria-label="Scroll left"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <div
                      ref={productTrackRef}
                      className="flex gap-3 overflow-x-auto pb-2 pl-1 pr-3 scroll-smooth no-scrollbar scroll-snap-x"
                      style={{ touchAction: 'pan-x pan-y' }}
                      onMouseDown={onDragStart}
                      onMouseMove={onDragMove}
                      onMouseUp={onDragEnd}
                      onMouseLeave={onDragEnd}
                    >
                      {message.products.map(p => {
                        const product: AdminProduct = {
                          _id: p.id,
                          name: p.name,
                          categoryId: '',
                          categoryName: p.category || '',
                          subcategory: '',
                          price: p.price ?? 0,
                          originalPrice: undefined,
                          description: p.description ?? '',
                          inclusions: [],
                          addOns: [],
                          image: p.image,
                          moreImages: [],
                          badge: undefined,
                          badgeColor: 'purple',
                          rating: 0,
                          reviewCount: 0,
                          active: true,
                          featured: !!p.featured,
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                        };

                        return (
                          <div key={p.id} className="w-[180px] flex-shrink-0 snap-start">
                            <ProductCard
                              product={product}
                              onViewDetails={() => {
                                navigate(`/product/${product._id}`);
                                onClose();
                              }}
                              isAI
                            />
                          </div>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => scrollProducts('right')}
                      className="absolute right-0 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 sm:flex"
                      aria-label="Scroll right"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Form input */}
        <form onSubmit={onSubmit} className="relative z-30 flex items-center gap-2.5 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-xl">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => onInputChange(e.target.value)}
            placeholder={t.ask_assistant || 'Ask about decorations...'}
            autoComplete="off"
            className="flex-1 rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-4 py-3 text-xs sm:text-sm text-gray-900 dark:text-slate-100 outline-none transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-brand-purple focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-brand-purple/20"
          />
          <button
            type="submit"
            aria-label="Send"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-purple text-white shadow-lg shadow-purple-600/30 transition-all duration-200 hover:bg-brand-purple-dark hover:shadow-xl active:scale-95 cursor-pointer"
          >
            <Send size={18} />
          </button>
        </form>
      </aside>
    </>
  );
};

export const AssistantTrigger: React.FC<{
  onOpen: () => void;
  mobile?: boolean;
}> = ({ onOpen, mobile = false }) => (
  <button
    type="button"
    title="AI Assistant"
    aria-label="AI Assistant"
    onClick={onOpen}
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full font-bold text-white transition-all duration-200',
      mobile
        ? 'mb-2 w-full justify-start rounded-xl bg-brand-purple/10 px-4 py-3 text-sm text-brand-purple shadow-none hover:bg-brand-purple/20'
        : 'hidden bg-gradient-to-r from-brand-purple to-brand-purple-light px-4 py-2 text-sm shadow-[0_4px_16px_rgba(107,33,168,0.3)] hover:shadow-[0_6px_20px_rgba(107,33,168,0.4)] hover:scale-105 md:inline-flex'
    )}
  >
    <Bot size={mobile ? 18 : 16} strokeWidth={2.1} />
    <span>{mobile ? 'AI Assistant' : 'Help'}</span>
  </button>
);