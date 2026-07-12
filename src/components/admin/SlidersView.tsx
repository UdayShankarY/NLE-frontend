import { useState, useEffect } from "react";
import type { AdminSlide } from "../../types";
import { Modal } from "./Modal";
import { ConfirmModal } from "./ConfirmModal";
import { toast } from "react-toastify";
import { GripVertical, Pencil, Eye, EyeOff, Trash2, Upload, Link as LinkIcon, X, Check, Lightbulb } from "lucide-react";
import { EmptyState } from "../EmptyState";
import { cn } from "../../lib/utils";

const API = '/api/sliders';

const GRADIENT_PRESETS = [
  { name: "Purple Pink", value: "linear-gradient(135deg, rgba(107,33,168,0.85), rgba(236,72,153,0.75))" },
  { name: "Blue Teal", value: "linear-gradient(135deg, rgba(37,99,235,0.85), rgba(20,184,166,0.75))" },
  { name: "Orange Red", value: "linear-gradient(135deg, rgba(249,115,22,0.85), rgba(239,68,68,0.75))" },
  { name: "Green Emerald", value: "linear-gradient(135deg, rgba(34,197,94,0.85), rgba(16,185,129,0.75))" },
  { name: "Dark Purple", value: "linear-gradient(135deg, rgba(88,28,135,0.9), rgba(107,33,168,0.8))" },
  { name: "Pink Rose", value: "linear-gradient(135deg, rgba(236,72,153,0.85), rgba(244,114,182,0.75))" },
];

export const SlidersView = () => {
  const [sliders, setSliders] = useState<AdminSlide[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AdminSlide | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; headline: string } | null>(null);
  const [imageMode, setImageMode] = useState<"url" | "upload">("upload");
  const [uploading, setUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [form, setForm] = useState({
    image: "",
    chip: "",
    headline: "",
    subtext: "",
    gradient: GRADIENT_PRESETS[0].value,
    useGradient: true,
    ctaText: "Book Now",
    ctaLink: "#",
    active: true,
  });

  const fetchSliders = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setSliders(data);
    } catch (err) {
      toast.error("Failed to load sliders");
    }
  };

  useEffect(() => {
    fetchSliders();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({
      image: "",
      chip: "",
      headline: "",
      subtext: "",
      gradient: GRADIENT_PRESETS[0].value,
      useGradient: true,
      ctaText: "Book Now",
      ctaLink: "#",
      active: true,
    });
    setImageMode("upload");
    setShowModal(true);
  };

  const openEdit = (slide: AdminSlide) => {
    setEditing(slide);
    setForm({
      image: slide.image,
      chip: slide.chip,
      headline: slide.headline,
      subtext: slide.subtext,
      gradient: slide.gradient,
      useGradient: slide.gradient !== 'none',
      ctaText: slide.ctaText,
      ctaLink: slide.ctaLink,
      active: slide.active,
    });
    setImageMode("upload");
    setShowModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ems_categories");
    formData.append("folder", "ems/sliders");

    try {
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/duwkslkdt/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setForm((f) => ({ ...f, image: data.secure_url }));
      toast.success("Image uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload image. Please try again.");
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.headline.trim()) {
      toast.error("Headline is required");
      return;
    }

    if (!form.image.trim()) {
      toast.error("Slider image is required");
      return;
    }

    // Set gradient to 'none' if useGradient is false
    const payload = {
      ...form,
      gradient: form.useGradient ? form.gradient : 'none',
    };

    if (editing) {
      try {
        const res = await fetch(`${API}/${editing._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const updated = await res.json();
        setSliders((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
        toast.success("Slider updated successfully!");
      } catch {
        toast.error("Failed to update slider");
      }
    } else {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const newSlider = await res.json();
      setSliders((prev) => [...prev, newSlider]);
      toast.success("Slider added successfully!");
    }

    setShowModal(false);
  };

  const del = async (id: string) => {
    await fetch(`${API}/${id}`, { method: "DELETE" });
    setSliders((prev) => prev.filter((s) => s._id !== id));
    setDeleteConfirm(null);
    toast.success("Slider deleted!");
  };

  const toggle = async (id: string, active: boolean) => {
    await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    setSliders((prev) => prev.map((s) => (s._id === id ? { ...s, active } : s)));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSliders = [...sliders];
    const draggedItem = newSliders[draggedIndex];
    newSliders.splice(draggedIndex, 1);
    newSliders.splice(index, 0, draggedItem);

    setSliders(newSliders);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    // Update order in backend
    const reorderedSliders = sliders.map((slider, idx) => ({
      id: slider._id,
      order: idx,
    }));

    try {
      await fetch(`${API}/reorder/all`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sliders: reorderedSliders }),
      });
      toast.success("Slider order updated!");
    } catch {
      toast.error("Failed to update order");
      fetchSliders(); // Reload on error
    }

    setDraggedIndex(null);
  };

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <div>
          <h2 className="adm-section-title">Hero Sliders</h2>
          <p className="adm-section-sub">Manage homepage banner slides &middot; Drag to reorder</p>
        </div>
        <button className="adm-btn-primary" onClick={openAdd}>
          + Add Slider
        </button>
      </div>

      <div className="mb-5 flex items-start gap-2 rounded-lg bg-brand-purple/5 px-3.5 py-2.5 text-sm text-ink-muted">
        <Lightbulb size={15} className="mt-0.5 flex-shrink-0 text-brand-purple" />
        <span><strong className="text-ink">Tip:</strong> Drag and drop slides to reorder them. The order will be saved automatically.</span>
      </div>

      <div className="flex flex-col gap-3">
        {sliders.map((slide, idx) => (
          <div
            key={slide._id}
            className={cn(
              'flex items-center gap-3 rounded-card border border-border bg-white p-3 transition-opacity',
              !slide.active && 'opacity-60',
              draggedIndex === idx && 'opacity-40'
            )}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
          >
            <span className="flex-shrink-0 cursor-grab text-ink-muted"><GripVertical size={18} /></span>
            <span className="flex-shrink-0 text-xs font-bold text-ink-muted">#{idx + 1}</span>
            <img src={slide.image} alt={slide.headline} className="h-14 w-24 flex-shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              {slide.chip && <div className="mb-0.5 inline-block rounded-full bg-brand-purple/10 px-2 py-0.5 text-[10px] font-bold text-brand-purple">{slide.chip}</div>}
              <div className="truncate text-sm font-semibold text-ink">{slide.headline}</div>
              {slide.subtext && <div className="truncate text-xs text-ink-muted">{slide.subtext}</div>}
              <div className="mt-0.5 text-xs text-ink-muted">
                CTA: <em className="not-italic font-medium">{slide.ctaText}</em> &rarr; <code className="text-[11px]">{slide.ctaLink}</code>
              </div>
            </div>
            <div className="flex flex-shrink-0 gap-1.5">
              <button className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-black/5" onClick={() => openEdit(slide)}>
                <Pencil size={12} /> Edit
              </button>
              <button className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-black/5" onClick={() => toggle(slide._id, !slide.active)}>
                {slide.active ? <EyeOff size={12} /> : <Eye size={12} />} {slide.active ? "Hide" : "Show"}
              </button>
              <button
                className="flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                onClick={() => setDeleteConfirm({ id: slide._id, headline: slide.headline })}
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
        ))}

        {sliders.length === 0 && (
          <EmptyState title="No sliders yet" description='Click "+ Add Slider" to create your first hero banner slide.' />
        )}
      </div>

      {showModal && (
        <Modal
          title={editing ? "Edit Slider" : "Add Slider"}
          onClose={() => setShowModal(false)}
          large
        >
          <div className="adm-form">
            <label>Slider Image (1920x400px recommended) *</label>
            <div className="adm-image-mode-tabs">
              <button
                type="button"
                className={`adm-mode-tab${imageMode === "upload" ? " active" : ""}`}
                onClick={() => setImageMode("upload")}
              >
                <Upload size={13} className="mr-1 inline" /> Upload File
              </button>
              <button
                type="button"
                className={`adm-mode-tab${imageMode === "url" ? " active" : ""}`}
                onClick={() => setImageMode("url")}
              >
                <LinkIcon size={13} className="mr-1 inline" /> Image URL
              </button>
            </div>

            {imageMode === "upload" ? (
              <div className="adm-file-upload">
                <input
                  type="file"
                  id="slider-image-upload"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="adm-file-input"
                  disabled={uploading}
                />
                <label htmlFor="slider-image-upload" className="adm-file-label">
                  {uploading ? (
                    <>
                      <span className="adm-file-icon">&#8987;</span>
                      <span className="adm-file-text">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <span className="adm-file-icon"><Upload size={20} /></span>
                      <span className="adm-file-text">
                        {form.image ? "Change Image" : "Choose Image"}
                      </span>
                      <span className="adm-file-hint">Max 5MB &middot; 1920x400px recommended</span>
                    </>
                  )}
                </label>
              </div>
            ) : (
              <input
                className="adm-input"
                value={form.image}
                onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                placeholder="https://example.com/banner.jpg"
              />
            )}

            {form.image && !uploading && (
              <div className="adm-image-preview adm-img-wide">
                <img src={form.image} alt="Preview" />
                <button
                  type="button"
                  className="adm-remove-image"
                  onClick={() => setForm((f) => ({ ...f, image: "" }))}
                  title="Remove image"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <label>Chip Text (Small label above headline)</label>
            <input
              className="adm-input"
              value={form.chip}
              onChange={(e) => setForm((f) => ({ ...f, chip: e.target.value }))}
              placeholder="e.g. SPECIAL OFFER, NEW ARRIVAL"
            />

            <label>Headline *</label>
            <input
              className="adm-input"
              value={form.headline}
              onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
              placeholder="e.g. Make Every Moment Magical"
            />

            <label>Subtext</label>
            <textarea
              className="adm-input adm-textarea"
              value={form.subtext}
              onChange={(e) => setForm((f) => ({ ...f, subtext: e.target.value }))}
              rows={2}
              placeholder="e.g. Create unforgettable memories with our premium event services"
            />

            <label>Overlay Gradient</label>
            <label className="adm-check-row" style={{ marginBottom: '12px' }}>
              <input
                type="checkbox"
                checked={form.useGradient}
                onChange={(e) => setForm((f) => ({ ...f, useGradient: e.target.checked }))}
              />
              Use gradient overlay (makes text more readable)
            </label>

            {form.useGradient && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {GRADIENT_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    className="relative h-12 rounded-lg border-2 transition-colors"
                    style={{ background: preset.value, borderColor: form.gradient === preset.value ? '#6B21A8' : 'transparent' }}
                    onClick={() => setForm((f) => ({ ...f, gradient: preset.value }))}
                    title={preset.name}
                  >
                    {form.gradient === preset.value && <Check size={16} className="absolute inset-0 m-auto text-white" />}
                  </button>
                ))}
              </div>
            )}

            <div className="adm-form-row">
              <div className="adm-form-col">
                <label>CTA Button Text</label>
                <input
                  className="adm-input"
                  value={form.ctaText}
                  onChange={(e) => setForm((f) => ({ ...f, ctaText: e.target.value }))}
                  placeholder="Book Now"
                />
              </div>

              <div className="adm-form-col">
                <label>CTA Link</label>
                <input
                  className="adm-input"
                  value={form.ctaLink}
                  onChange={(e) => setForm((f) => ({ ...f, ctaLink: e.target.value }))}
                  placeholder="#products or /category/birthdays"
                />
              </div>
            </div>

            <label className="adm-check-row">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
              Active (Show on homepage)
            </label>

            <div className="adm-modal-footer">
              <button className="adm-btn-ghost" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="adm-btn-primary" onClick={save} disabled={uploading}>
                {editing ? "Save Changes" : "Add Slider"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <ConfirmModal
          title="Delete Slider"
          message={`Are you sure you want to delete "${deleteConfirm.headline}"? This action cannot be undone.`}
          onConfirm={() => del(deleteConfirm.id)}
          onCancel={() => setDeleteConfirm(null)}
          confirmText="Delete"
        />
      )}
    </div>
  );
};
