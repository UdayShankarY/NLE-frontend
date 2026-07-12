import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Pencil, Eye, RotateCcw, Save, Lightbulb } from 'lucide-react';
import { cn } from '../../lib/utils';

const API = '/api/site-content';

const PAGES = [
  { key: 'product-terms', label: 'Product Page Terms', icon: '📦' },
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
      setTitle(data.title);
      setContent(data.content);
    } catch {
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPage(activeKey); }, [activeKey]);

  const save = async () => {
    if (!title.trim() || !content.trim()) { toast.error('Title and content are required'); return; }
    setSaving(true);
    try {
      await fetch(`${API}/${activeKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      toast.success('Page saved successfully!');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Pages & Legal Content</h2>
        <p className="text-sm text-ink-muted">Edit content visible to users on the website</p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2 border-b border-border">
        {PAGES.map(p => (
          <button
            key={p.key}
            className={cn(
              'flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              activeKey === p.key ? 'border-brand-purple text-brand-purple' : 'border-transparent text-ink-muted hover:text-ink'
            )}
            onClick={() => { setActiveKey(p.key); setPreview(false); }}
          >
            <span>{p.icon}</span> {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm text-ink-muted">Loading...</div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Page Title</label>
            <input
              className="adm-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Page title"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-ink">
              Content <span className="font-normal text-ink-muted">(HTML supported)</span>
            </label>
            <div className="flex overflow-hidden rounded-lg border border-border">
              <button
                className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium', !preview ? 'bg-brand-purple text-white' : 'text-ink-muted hover:bg-black/5')}
                onClick={() => setPreview(false)}
              >
                <Pencil size={12} /> Edit
              </button>
              <button
                className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium', preview ? 'bg-brand-purple text-white' : 'text-ink-muted hover:bg-black/5')}
                onClick={() => setPreview(true)}
              >
                <Eye size={12} /> Preview
              </button>
            </div>
          </div>

          {preview ? (
            <div
              className="min-h-[400px] rounded-lg border border-border bg-white p-4 text-sm text-ink"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <textarea
              className="min-h-[400px] w-full rounded-lg border border-border bg-white p-3 font-mono text-sm text-ink outline-none focus:border-brand-purple-light focus:ring-2 focus:ring-brand-purple-light"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write HTML content here..."
              rows={22}
            />
          )}

          <div className="flex items-start gap-2 rounded-lg bg-brand-purple/5 px-3.5 py-2.5 text-xs text-ink-muted">
            <Lightbulb size={14} className="mt-0.5 flex-shrink-0 text-brand-purple" />
            Tip: Use HTML tags like &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt; to format content.
          </div>

          <div className="adm-modal-footer" style={{ marginTop: 16 }}>
            <button className="adm-btn-ghost" onClick={() => fetchPage(activeKey)}>
              <RotateCcw size={13} className="mr-1 inline" /> Reset
            </button>
            <button className="adm-btn-primary" onClick={save} disabled={saving}>
              <Save size={13} className="mr-1 inline" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
