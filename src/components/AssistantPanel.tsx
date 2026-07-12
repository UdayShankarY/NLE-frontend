import React from 'react';
import { Bot, X, Send } from 'lucide-react';
import { cn } from '../lib/utils';

export type AssistantMessage = {
  id: number;
  sender: 'bot' | 'user';
  text: string;
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
}) => (
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
        'fixed inset-y-0 right-0 z-[10001] flex w-[min(360px,92vw)] flex-col bg-white shadow-2xl transition-transform duration-300',
        open ? 'translate-x-0' : 'translate-x-full'
      )}
      role="dialog"
      aria-modal="true"
      aria-label="AI Assistant"
    >
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 pb-4 pt-5">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-brand-purple">AI Assistant</p>
          <h3 className="text-base font-semibold text-gray-900">How can we help?</h3>
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
        <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
          {messages.map(message => (
            <div
              key={message.id}
              className={cn(
                'max-w-[85%] rounded-2xl px-3 py-2.5 text-sm leading-snug break-words',
                message.sender === 'bot'
                  ? 'self-start bg-brand-purple/10 text-brand-purple-dark'
                  : 'self-end bg-gradient-to-br from-brand-purple to-brand-pink text-white'
              )}
            >
              {message.text}
            </div>
          ))}
        </div>
        <form className="flex gap-2 border-t border-gray-100 pt-3" onSubmit={onSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => onInputChange(e.target.value)}
            placeholder="Type your message..."
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

export const AssistantTrigger: React.FC<{ onOpen: () => void; mobile?: boolean }> = ({ onOpen, mobile = false }) => (
  <button
    type="button"
    title="AI Assistant"
    aria-label="AI Assistant"
    onClick={onOpen}
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-brand-purple to-brand-pink px-3 py-2 text-sm font-bold text-white shadow-[0_8px_18px_rgba(124,58,237,0.22)]',
      mobile ? 'mb-2 w-full justify-start rounded-lg bg-brand-purple/10 px-3.5 py-3 text-brand-purple-dark shadow-none' : 'hidden md:inline-flex'
    )}
  >
    <Bot size={18} strokeWidth={2.1} />
    <span>Help</span>
  </button>
);
