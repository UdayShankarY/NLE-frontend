import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Pencil, Search, Trash2, Upload, Link as LinkIcon } from 'lucide-react';
import { Modal } from './Modal';
import { ConfirmModal } from './ConfirmModal';
import { cn } from '../../lib/utils';
import { getApiUrl } from '../../lib/api';
import type { AdminAddon } from '../../types';

const API = getApiUrl('/api/addons');
const PAGE_SIZE = 8;
const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/duwkslkdt/image/upload';

export const AddonsView = () => {
  const [addons, setAddons] = useState<AdminAddon[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AdminAddon | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [uploading, setUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    image: '',
    active: true,
  });

  const fetchAddons = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setAddons(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load add-ons');
    }
  };

  useEffect(() => {
    void fetchAddons();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return addons.filter((addon) => {
      const matchesSearch = !query || [addon.name, addon.description, addon.category || '']
        .join(' ')
        .toLowerCase()
        .includes(query);

      const matchesStatus = statusFilter === 'all'
        ? true
        : statusFilter === 'active'
          ? addon.active
          : !addon.active;

      return matchesSearch && matchesStatus;
    });
  }, [addons, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const resetImageState = () => {
    setUploadedImage('');
    setImageUrlInput('');
    setImageMode('upload');
  };

  const isValidImageUrl = (value: string) => {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const uploadImageFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ems_categories');
    formData.append('folder', 'ems/addons');

    try {
      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setUploadedImage(data.secure_url);
      setForm((f) => ({ ...f, image: data.secure_url }));
      setImageUrlInput('');
      setImageMode('upload');
      toast.success('Image uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload image. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadImageFile(file);
    e.target.value = '';
  };

  const handleDropUpload = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await uploadImageFile(file);
  };

  const openAdd = () => {
    setEditing(null);
    resetImageState();
    setForm({
      name: '',
      description: '',
      price: 0,
      image: '',
      active: true,
    });
    setShowModal(true);
  };

  const openEdit = (addon: AdminAddon) => {
    setEditing(addon);
    resetImageState();
    setForm({
      name: addon.name,
      description: addon.description,
      price: addon.price,
      image: addon.image,
      active: addon.active,
    });
    setUploadedImage(addon.image || '');
    setImageUrlInput(addon.image || '');
    setImageMode('upload');
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error('Add-on name is required');
      return;
    }

    if (!form.price || form.price <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    const finalImage = (uploadedImage || imageUrlInput.trim()).trim();
    if (!finalImage) {
      toast.error('Add-on image is required');
      return;
    }

    if (imageUrlInput.trim() && !isValidImageUrl(imageUrlInput.trim())) {
      toast.error('Please enter a valid image URL');
      return;
    }

    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
        image: finalImage,
      };

      if (editing) {
        const res = await fetch(`${API}/${editing._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const updated = await res.json();
        setAddons((prev) => prev.map((item) => item._id === updated._id ? updated : item));
        toast.success('Add-on updated');
      } else {
        const res = await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const created = await res.json();
        setAddons((prev) => [created, ...prev]);
        toast.success('Add-on created');
      }

      setShowModal(false);
      void fetchAddons();
    } catch {
      toast.error('Failed to save add-on');
    }
  };

  const del = async (id: string) => {
    try {
      await fetch(`${API}/${id}`, { method: 'DELETE' });
      setAddons((prev) => prev.filter((item) => item._id !== id));
      setDeleteConfirm(null);
      toast.success('Add-on deleted');
    } catch {
      toast.error('Failed to delete add-on');
    }
  };

  const toggle = async (id: string, active: boolean) => {
    try {
      await fetch(`${API}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      });
      setAddons((prev) => prev.map((item) => item._id === id ? { ...item, active } : item));
    } catch {
      toast.error('Failed to update add-on status');
    }
  };

  const previewUrl = uploadedImage || imageUrlInput.trim();
  const previewIsValid = previewUrl ? isValidImageUrl(previewUrl) : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Product Add-ons</h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Manage extra decor elements (balloons, lights, props) for event packages.</p>
        </div>
        <button 
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-purple hover:bg-brand-purple-dark text-white px-4 py-2.5 text-xs font-bold shadow-md shadow-purple-600/20 active:scale-95 transition-all cursor-pointer" 
          onClick={openAdd}
        >
          + Add Add-on
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:max-w-xl">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search add-on title or category..."
            />
          </div>
          <select 
            className="w-full sm:w-40 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none" 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 self-end sm:self-center">
          {filtered.length} total add-ons
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {paged.map((addon) => (
          <div key={addon._id} className={cn('overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between transition-all', !addon.active && 'opacity-60')}>
            <div>
              <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                {addon.image ? (
                  <img src={addon.image} alt={addon.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-400">No Image</div>
                )}
                <span className={`absolute top-2.5 right-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase border ${
                  addon.active ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                }`}>
                  {addon.active ? 'Active' : 'Hidden'}
                </span>
              </div>
              <div className="p-4 space-y-1.5">
                <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">{addon.name}</h3>
                <div className="text-xs font-black text-brand-purple dark:text-purple-400">₹{Number(addon.price || 0).toLocaleString('en-IN')}</div>
                <p className="line-clamp-2 text-xs font-medium text-slate-500 dark:text-slate-400">{addon.description || 'No description provided.'}</p>
              </div>
            </div>

            <div className="p-4 pt-0 flex items-center gap-1.5">
              <button 
                type="button"
                className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer" 
                onClick={() => openEdit(addon)}
              >
                <Pencil size={12} /> Edit
              </button>
              <button 
                type="button"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer" 
                onClick={() => toggle(addon._id, !addon.active)}
              >
                {addon.active ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button 
                type="button"
                className="inline-flex items-center justify-center rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 p-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer" 
                onClick={() => setDeleteConfirm({ id: addon._id, name: addon.name })}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
          <button 
            type="button"
            className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-50 cursor-pointer" 
            disabled={safePage === 1} 
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Previous
          </button>
          <span className="text-xs font-bold text-slate-900 dark:text-white">Page {safePage} of {pageCount}</span>
          <button 
            type="button"
            className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-50 cursor-pointer" 
            disabled={safePage === pageCount} 
            onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
          >
            Next
          </button>
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Edit Add-on' : 'Add Add-on'} onClose={() => setShowModal(false)} large>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-extrabold uppercase text-slate-400">Name *</label>
                <input className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white outline-none" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Rose Petal Garland" />
              </div>
              <div>
                <label className="text-xs font-extrabold uppercase text-slate-400">Price (₹) *</label>
                <input type="number" min="0" className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white outline-none" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} />
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold uppercase text-slate-400">Description / Details</label>
              <textarea className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-white outline-none" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} placeholder="Describe the add-on package" />
            </div>

            <div className="flex gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <button
                type="button"
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${imageMode === 'upload' ? 'bg-brand-purple text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                onClick={() => setImageMode('upload')}
              >
                <Upload size={13} className="mr-1 inline" /> Upload File
              </button>
              <button
                type="button"
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${imageMode === 'url' ? 'bg-brand-purple text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                onClick={() => setImageMode('url')}
              >
                <LinkIcon size={13} className="mr-1 inline" /> Image URL
              </button>
            </div>

            {imageMode === 'upload' ? (
              <div
                className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-6 text-center bg-slate-50/50 dark:bg-slate-800/40"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDropUpload}
              >
                <input
                  type="file"
                  id="addon-image-upload"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <label htmlFor="addon-image-upload" className="cursor-pointer space-y-1 block">
                  {uploading ? (
                    <div className="text-xs font-bold text-brand-purple">Uploading image to cloud...</div>
                  ) : (
                    <>
                      <div className="flex justify-center text-slate-400 mb-2"><Upload size={24} /></div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{form.image ? 'Change Image' : 'Choose Image File'}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">Drag &amp; drop or click to browse · Max 5MB</div>
                    </>
                  )}
                </label>
              </div>
            ) : (
              <input
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white outline-none"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="https://example.com/addon.jpg"
              />
            )}

            {previewUrl && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-400 uppercase">
                  <span>Image Preview</span>
                  <button
                    type="button"
                    className="text-rose-600 hover:underline cursor-pointer"
                    onClick={() => {
                      setUploadedImage('');
                      setImageUrlInput('');
                      setForm((f) => ({ ...f, image: '' }));
                    }}
                  >
                    Remove
                  </button>
                </div>
                {previewIsValid ? (
                  <img src={previewUrl} alt="Add-on preview" className="h-44 w-full rounded-xl object-cover border border-slate-200 dark:border-slate-800" onError={() => toast.error('Preview image failed to load.')} />
                ) : (
                  <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-400">Image preview unavailable</div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              <button type="button" className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="button" className="rounded-xl bg-brand-purple text-white px-4 py-2.5 text-xs font-bold shadow-md shadow-purple-600/20 cursor-pointer" onClick={save}>{editing ? 'Save Changes' : 'Add Add-on'}</button>
            </div>
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <ConfirmModal
          title="Delete Add-on"
          message={`Are you sure you want to delete "${deleteConfirm.name}"?`}
          onConfirm={() => del(deleteConfirm.id)}
          onCancel={() => setDeleteConfirm(null)}
          confirmText="Delete"
        />
      )}
    </div>
  );
};
