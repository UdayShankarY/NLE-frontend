import { useEffect, useState } from 'react';
import { Copy, Globe, Send, Mail, MessageCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { cn } from '../../lib/utils';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  text: string;
  url: string;
}

const shareButtons = [
  {
    label: 'WhatsApp',
    icon: MessageCircle,
    href: (url: string) =>
      `https://api.whatsapp.com/send?text=${encodeURIComponent(url)}`,
    className: 'bg-emerald-600 text-white',
  },
  {
    label: 'Facebook',
    icon: Globe,
    href: (url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    className: 'bg-blue-600 text-white',
  },
  {
    label: 'X',
    icon: Globe,
    href: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    className: 'bg-slate-900 text-white',
  },
  {
    label: 'Telegram',
    icon: Send,
    href: (url: string, title: string) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    className: 'bg-blue-500 text-white',
  },
  {
    label: 'Email',
    icon: Mail,
    href: (url: string, title: string, text: string) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`,
    className: 'bg-slate-800 text-white',
  },
];

export const ShareDialog: React.FC<ShareDialogProps> = ({ open, onClose, title, text, url }) => {
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (!open) return;
    const checkMobile = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setCopied(false);
  }, [open]);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('✓ Link Copied Successfully');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center sm:p-6">
      <div
        className={cn(
          'w-full max-w-xl rounded-3xl border border-border bg-white shadow-2xl transition-transform',
          isMobile ? 'translate-y-0 rounded-t-3xl' : 'translate-y-0'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-dialog-title"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">Share this page</p>
            <h2 id="share-dialog-title" className="mt-1 text-lg font-semibold text-ink">Share this page</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border p-2 text-ink-muted transition hover:bg-gray-100"
            aria-label="Close share dialog"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="rounded-3xl border border-border bg-gray-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">Copy Link</p>
                <p className="text-xs text-ink-muted">Share the current page with your friends.</p>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:bg-gray-100"
              >
                <Copy size={16} /> {copied ? 'Copied' : 'Copy Link'}
              </button>
            </div>
            <div className="rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink">{url}</div>
          </div>

          <div className="rounded-3xl border border-border bg-gray-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">Quick Share</p>
                <p className="text-xs text-ink-muted">Send the page instantly with your favourite app.</p>
              </div>
              <span className="rounded-full bg-brand-purple/10 px-2 py-1 text-xs font-semibold text-brand-purple">Professional</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {shareButtons.map((button) => {
                const Icon = button.icon;
                return (
                  <a
                    key={button.label}
                    href={button.href(url, title, text)}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      'inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold transition',
                      button.className
                    )}
                  >
                    <Icon size={16} /> {button.label}
                  </a>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-white p-4 text-sm text-ink-muted">
            <p className="font-semibold text-ink">Pro tip</p>
            <p className="mt-1">Use the share button to quickly send the page link through WhatsApp, Facebook, X, Telegram, or email.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
