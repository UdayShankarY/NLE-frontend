import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
const API = '/api/site-content';

interface TermsPageProps {
  pageKey: 'terms' | 'privacy' | 'refund' | 'about';
  onClose: () => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ pageKey, onClose }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/${pageKey}`)
      .then(r => r.json())
      .then(d => { setTitle(d.title); setContent(d.content); })
      .catch(() => { setTitle('Content unavailable'); setContent('<p>Please try again later.</p>'); })
      .finally(() => setLoading(false));
  }, [pageKey]);

  return (
    <div
      className="fixed inset-0 z-[900] flex items-center justify-center bg-black/50 p-4 sm:items-center"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:self-auto">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <button className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-black/5" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">
          {loading
            ? <div className="py-10 text-center text-sm text-ink-muted">Loading...</div>
            : <div
                className="text-sm leading-relaxed text-ink [&_h1]:mb-2 [&_h1]:mt-4 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-bold [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1"
                dangerouslySetInnerHTML={{ __html: content }}
              />
          }
        </div>
      </div>
    </div>
  );
};
