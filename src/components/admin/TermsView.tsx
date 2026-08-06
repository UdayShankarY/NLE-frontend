import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Pencil, Eye, RotateCcw, Save, Lightbulb } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getApiUrl } from '../../lib/api';

const API = getApiUrl('/api/site-content');

const PAGES = [
  { key: 'product-terms', label: 'Product Terms', icon: '📦' },
  { key: 'terms',         label: 'Terms & Conditions', icon: '📋' },
  { key: 'privacy',       label: 'Privacy Policy',      icon: '🔒' },
  { key: 'refund',        label: 'Refund Policy',        icon: '💰' },
  { key: 'about',         label: 'About Us',             icon: '🏢' },
];

export const TermsView = () => {
  const [activeKey, setActiveKey] = useState('terms');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  const fetchPage = async (key: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/${key}`);
      const data = await res.json();
      setTitle(data.title || '');
      setContent(data.content || '');
    } catch {
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchPage(activeKey); }, [activeKey]);

  const save = async () => {
    if (!title.trim() || !content.trim()) { toast.error('Title and content are required'); return; }
    setSaving(true);
    try {
      await fetch(`${API}/${activeKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      toast.success('Page content saved!');
    } catch {
      toast.error('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Pages &amp; Legal Content</h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Edit customer-facing policy pages and terms displayed on the platform.</p>
        </div>
      </div>

      {/* Page Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-1 no-scrollbar">
        {PAGES.map(p => (
          <button
            key={p.key}
            type="button"
            className={cn(
              'flex items-center gap-2 shrink-0 border-b-2 px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer',
              activeKey === p.key 
                ? 'border-brand-purple text-brand-purple dark:text-purple-400' 
                : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white'
            )}
            onClick={() => { setActiveKey(p.key); setPreview(false); }}
          >
            <span>{p.icon}</span> {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs font-bold text-slate-400">Loading page content...</div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
          <div>
            <label className="text-xs font-extrabold uppercase text-slate-400">Page Title</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Page Title"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase text-slate-400">
              Content Editor <span className="font-semibold text-slate-400 lowercase">(HTML supported)</span>
            </label>
            <div className="flex overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer', !preview ? 'bg-brand-purple text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}
                onClick={() => setPreview(false)}
              >
                <Pencil size={12} /> Edit
              </button>
              <button
                type="button"
                className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer', preview ? 'bg-brand-purple text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}
                onClick={() => setPreview(true)}
              >
                <Eye size={12} /> Preview
              </button>
            </div>
          </div>

          {preview ? (
            <div
              className="min-h-[380px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <textarea
              className="min-h-[380px] w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 font-mono text-xs font-semibold text-slate-900 dark:text-white outline-none"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write HTML content here..."
              rows={18}
            />
          )}

          <div className="flex items-start gap-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 p-3 text-xs font-semibold text-slate-600 dark:text-slate-300 border border-purple-100 dark:border-purple-900/50">
            <Lightbulb size={16} className="mt-0.5 shrink-0 text-brand-purple dark:text-purple-400" />
            <span>Tip: You can use HTML formatting tags like <code>&lt;h2&gt;</code>, <code>&lt;p&gt;</code>, <code>&lt;ul&gt;</code>, <code>&lt;li&gt;</code>, and <code>&lt;strong&gt;</code> to structure page content.</span>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
            <button 
              type="button" 
              className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer" 
              onClick={() => void fetchPage(activeKey)}
            >
              <RotateCcw size={13} className="mr-1 inline" /> Reset
            </button>
            <button 
              type="button" 
              className="rounded-xl bg-brand-purple text-white px-4 py-2.5 text-xs font-bold shadow-md shadow-purple-600/20 disabled:opacity-60 cursor-pointer" 
              onClick={save} 
              disabled={saving}
            >
              <Save size={13} className="mr-1 inline" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
