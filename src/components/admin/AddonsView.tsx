import { useEffect, useMemo, useRef, useState } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
    <div className="adm-section">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Add-ons</h2>
        <button className="adm-btn-primary" onClick={openAdd}>+ Add Add-on</button>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-[1fr,180px,180px]">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            className="adm-input pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search add-ons"
          />
        </div>
        <select className="adm-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className="text-sm text-ink-muted flex items-center justify-end">{filtered.length} results</div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {paged.map((addon) => (
          <div key={addon._id} className={cn('overflow-hidden rounded-card border border-border bg-white shadow-card', !addon.active && 'opacity-60')}>
            <div className="relative h-40 w-full bg-gray-100">
              {addon.image ? <img src={addon.image} alt={addon.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-ink-muted">No image</div>}
            </div>
            <div className="p-4">
              <h3 className="truncate text-sm font-semibold text-ink">{addon.name}</h3>
              <p className="mt-1 text-xs text-ink-muted">{addon.category || 'General'}</p>
              <div className="mt-2 text-base font-bold text-brand-purple">₹{addon.price.toLocaleString()}</div>
              <p className="mt-2 line-clamp-2 text-xs text-ink-muted">{addon.description || 'No description provided.'}</p>
              <div className="mt-3 flex gap-1.5">
                <button className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-black/5" onClick={() => openEdit(addon)}>
                  <Pencil size={12} /> Edit
                </button>
                <button className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-black/5" onClick={() => toggle(addon._id, !addon.active)}>
                  {addon.active ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
                <button className="flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50" onClick={() => setDeleteConfirm({ id: addon._id, name: addon.name })}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between">
          <button className="adm-btn-ghost" disabled={safePage === 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>Previous</button>
          <span className="text-sm text-ink-muted">Page {safePage} of {pageCount}</span>
          <button className="adm-btn-ghost" disabled={safePage === pageCount} onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}>Next</button>
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Edit Add-on' : 'Add Add-on'} onClose={() => setShowModal(false)} large>
          <div className="adm-form">
            <div className="adm-form-row">
              <div className="adm-form-col">
                <label>Name *</label>
                <input className="adm-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Rose Petal Garland" />
              </div>
              <div className="adm-form-col">
                <label>Price (₹) *</label>
                <input type="number" min="0" className="adm-input" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} />
              </div>
            </div>

            <label>Description / Details</label>
            <textarea className="adm-input adm-textarea" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={4} placeholder="Describe the add-on" />

            <div className="adm-image-mode-tabs">
              <button
                type="button"
                className={`adm-mode-tab${imageMode === 'upload' ? ' active' : ''}`}
                onClick={() => setImageMode('upload')}
              >
                <Upload size={13} className="mr-1 inline" /> Upload File
              </button>
              <button
                type="button"
                className={`adm-mode-tab${imageMode === 'url' ? ' active' : ''}`}
                onClick={() => setImageMode('url')}
              >
                <LinkIcon size={13} className="mr-1 inline" /> Image URL
              </button>
            </div>

            {imageMode === 'upload' ? (
              <div
                className="adm-file-upload"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDropUpload}
              >
                <input
                  type="file"
                  id="addon-image-upload"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="adm-file-input"
                  disabled={uploading}
                />
                <label htmlFor="addon-image-upload" className="adm-file-label">
                  {uploading ? (
                    <>
                      <span className="adm-file-icon">&#8987;</span>
                      <span className="adm-file-text">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <span className="adm-file-icon"><Upload size={20} /></span>
                      <span className="adm-file-text">
                        {form.image ? 'Change Image' : 'Choose Image'}
                      </span>
                      <span className="adm-file-hint">Drag & drop or browse · Max 5MB</span>
                    </>
                  )}
                </label>
              </div>
            ) : (
              <input
                className="adm-input"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="https://example.com/addon.jpg"
              />
            )}

            {previewUrl && (
              <div className="adm-image-preview mt-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-ink">Preview</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="adm-remove-image-btn"
                      onClick={() => {
                        setUploadedImage('');
                        setImageUrlInput('');
                        setForm((f) => ({ ...f, image: '' }));
                      }}
                    >
                      Remove image
                    </button>
                    <button
                      type="button"
                      className="adm-remove-image-btn"
                      onClick={() => {
                        setUploadedImage('');
                        setImageUrlInput('');
                        setImageMode('upload');
                        fileInputRef.current?.click();
                      }}
                    >
                      Replace image
                    </button>
                  </div>
                </div>
                {previewIsValid ? (
                  <img src={previewUrl} alt="Add-on preview" className="h-48 w-full rounded-lg object-cover" onError={() => toast.error('Preview image could not be loaded. Please verify the URL.')} />
                ) : (
                  <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border text-sm text-ink-muted">Image preview unavailable</div>
                )}
              </div>
            )}
            {imageMode === 'url' && imageUrlInput.trim() && !isValidImageUrl(imageUrlInput.trim()) && (
              <p className="mt-2 text-xs text-red-500">Please enter a valid image URL.</p>
            )}
            <div className="adm-modal-footer">
              <button className="adm-btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="adm-btn-primary" onClick={save}>{editing ? 'Save Changes' : 'Add Add-on'}</button>
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
