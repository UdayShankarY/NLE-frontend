import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AdminProduct } from '../types';
import { ProductCard } from './ProductSlider';
import { Bot, X, Send, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const navigate = useNavigate();
  const productTrackRef = useRef<HTMLDivElement>(null);

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
    if (el) {
      el.scrollTop = el.scrollHeight;
    }

    if (open && inputRef?.current) {
      inputRef.current.focus();
    }
  }, [messages, open, inputRef]);

  return (
    <>
    <div
      className={cn(
        'fixed inset-0 z-[10000] bg-slate-900/35 transition-opacity duration-200',
        open ? 'opacity-100' : 'pointer-events-none opacity-0'
      )}
      onClick={onClose}
    />

    <aside
      className={cn(
        'fixed inset-y-0 right-0 z-[10001] flex w-[min(380px,92vw)] flex-col bg-white shadow-2xl transition-transform duration-300',
        open ? 'translate-x-0' : 'translate-x-full'
      )}
      role="dialog"
      aria-modal="true"
      aria-label="AI Assistant"
    >
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 pb-4 pt-5">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-brand-purple">
            AI Assistant
          </p>
          <h3 className="text-base font-semibold text-gray-900">
            How can we help?
          </h3>
        </div>

        <button
          type="button"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20"
          onClick={onClose}
          aria-label="Close assistant"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1" id="assistant-scroll-container">

          {messages.map((message) => (
            <div key={message.id}>

              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-3 py-2.5 text-sm leading-snug break-words transition-opacity duration-300',
                  message.sender === 'bot'
                    ? 'self-start bg-brand-purple/10 text-brand-purple-dark'
                    : 'ml-auto bg-gradient-to-br from-brand-purple to-brand-pink text-white'
                )}
              >
                {message.loading ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span>🤖</span>
                      <span className="text-sm">Thinking</span>
                      <span className="dots inline-block w-8" aria-hidden>.
                        <style>{`.dots{display:inline-block}.dots::after{content:'...';animation:dot 1s steps(3,end) infinite}@keyframes dot{0%{content:''}33%{content:'.'}66%{content:'..'}100%{content:'...'}}`}</style>
                      </span>
                    </div>
                    <div className="rounded-[24px] bg-slate-50 p-3 shadow-sm">
                      <div className="flex gap-4 overflow-x-auto pb-2 pl-1 pr-3 scroll-smooth touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {[1, 2, 3].map((item) => (
                          <div key={item} className="min-w-[240px] snap-start rounded-[26px] border border-border bg-white p-3.5 shadow-card animate-pulse">
                            <div className="mb-3 h-[128px] w-full rounded-3xl bg-slate-200" />
                            <div className="space-y-2">
                              <div className="h-4 w-3/4 rounded-full bg-slate-200" />
                              <div className="h-3 w-1/2 rounded-full bg-slate-200" />
                              <div className="h-10 w-full rounded-2xl bg-slate-200" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="whitespace-pre-line">{message.text}</div>
                )}
              </div>

              {message.products && message.products.length > 0 && (
                <div className="mt-3 rounded-[28px] bg-slate-50 p-3 shadow-sm">
                  <div className="mb-3 text-sm font-semibold text-ink">✨ Recommended for You</div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => scrollProducts('left')}
                      className="absolute left-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white shadow hover:bg-gray-50 sm:flex"
                      aria-label="Scroll left"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div
                      ref={productTrackRef}
                      className="flex gap-4 overflow-x-auto pb-2 pl-1 pr-3 scroll-smooth touch-pan-x snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                      onMouseDown={onDragStart}
                      onMouseMove={onDragMove}
                      onMouseUp={onDragEnd}
                      onMouseLeave={onDragEnd}
                      onTouchStart={onDragStart}
                      onTouchMove={onDragMove}
                      onTouchEnd={onDragEnd}
                    >
                      {message.products.map((p) => {
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

                        const onViewDetails = (prod: AdminProduct) => navigate(`/product/${prod._id}`);

                        return (
                          <div key={p.id} className="min-w-[240px] snap-start sm:min-w-[260px]">
<ProductCard
    product={product}
    onViewDetails={onViewDetails}
    isAI
/>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => scrollProducts('right')}
                      className="absolute right-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white shadow hover:bg-gray-50 sm:flex"
                      aria-label="Scroll right"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}

            </div>
          ))}

        </div>

        <form
          className="flex gap-2 border-t border-gray-100 pt-3"
          onSubmit={onSubmit}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Ask me about decorations..."
            autoComplete="off"
            className="flex-1 rounded-full border border-border px-3.5 py-2.5 text-sm outline-none focus:border-brand-purple-light focus:ring-2 focus:ring-brand-purple-light/25"
          />

          <button
            type="submit"
            aria-label="Send"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-pink text-white"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
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
      'inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-purple to-brand-pink px-3 py-2 text-sm font-bold text-white shadow-[0_8px_18px_rgba(124,58,237,0.22)]',
      mobile
        ? 'mb-2 w-full justify-start rounded-lg bg-brand-purple/10 px-3.5 py-3 text-brand-purple-dark shadow-none'
        : 'hidden md:inline-flex'
    )}
  >
    <Bot size={18} strokeWidth={2.1} />
    <span>Help</span>
  </button>
);