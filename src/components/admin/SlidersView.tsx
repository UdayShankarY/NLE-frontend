import { useState, useEffect, useMemo } from "react";
import type { AdminSlide, AdminCategory, AdminProduct } from "../../types";
import { Modal } from "./Modal";
import { ConfirmModal } from "./ConfirmModal";
import { toast } from "react-toastify";
import { GripVertical, Pencil, Eye, EyeOff, Trash2, Upload, Link as LinkIcon, X, Check, Lightbulb, Copy } from "lucide-react";
import { EmptyState } from "../EmptyState";
import { cn } from "../../lib/utils";
import { getApiUrl } from '../../lib/api';

const API = getApiUrl('/api/sliders');
const CATEGORY_API = getApiUrl('/api/categories');
const PRODUCT_API = getApiUrl('/api/products');

type CTADestination = 'products' | 'category' | 'subcategory' | 'product' | 'custom';

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
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [subcategorySearch, setSubcategorySearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [ctaDestination, setCtaDestination] = useState<CTADestination>('custom');
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [customCtaUrl, setCustomCtaUrl] = useState("");

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

  const fetchCategories = async () => {
    try {
      const res = await fetch(CATEGORY_API);
      const data = await res.json();
      setCategories(Array.isArray(data) ? data.filter((c) => c.active) : []);
    } catch (err) {
      toast.error("Failed to load categories");
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(PRODUCT_API);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data.filter((p) => p.active) : []);
    } catch (err) {
      toast.error("Failed to load products");
    }
  };

  useEffect(() => {
    fetchSliders();
    fetchCategories();
    fetchProducts();
  }, []);

  const filteredCategories = useMemo(() => {
    const query = categorySearch.trim().toLowerCase();
    return categories.filter((cat) => !query || cat.name.toLowerCase().includes(query));
  }, [categories, categorySearch]);

  const subcategoryOptions = useMemo(() => {
    const query = subcategorySearch.trim().toLowerCase();
    const entries: { name: string; parentName: string }[] = [];

    categories.forEach((cat) => {
      const subs = cat.subcategories || [];
      subs.forEach((sub) => {
        const subName = typeof sub === 'string' ? sub : sub.name;
        if (!query || subName.toLowerCase().includes(query) || cat.name.toLowerCase().includes(query)) {
          entries.push({ name: subName, parentName: cat.name });
        }
      });
    });

    return entries;
  }, [categories, subcategorySearch]);

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    return products.filter((prod) => !query || prod.name.toLowerCase().includes(query));
  }, [products, productSearch]);

  const selectedCategory = categories.find((cat) => cat._id === selectedCategoryId);
  const selectedProduct = products.find((prod) => prod._id === selectedProductId);

  const getCtaStateFromLink = (link: string) => {
    if (!link) return { destination: 'custom' as CTADestination, customUrl: link };
    const normalized = link.trim();
    const categoryMatch = normalized.match(/^\/category\/([^/]+)(?:\/(.+))?$/);
    if (categoryMatch) {
      return {
        destination: categoryMatch[2] ? 'subcategory' as CTADestination : 'category' as CTADestination,
        categoryValue: decodeURIComponent(categoryMatch[1]),
        subcategoryValue: categoryMatch[2] ? decodeURIComponent(categoryMatch[2]) : undefined,
      };
    }

    const productMatch = normalized.match(/^\/product\/([A-Za-z0-9_-]+)$/);
    if (productMatch) {
      return { destination: 'product' as CTADestination, productId: productMatch[1] };
    }

    return { destination: 'custom' as CTADestination, customUrl: normalized };
  };

  const generatedCtaLink = useMemo(() => {
    switch (ctaDestination) {
      case 'category':
        return selectedCategory ? `/category/${encodeURIComponent(selectedCategory.name)}` : '';
      case 'subcategory':
        if (!selectedCategory || !selectedSubcategory) return '';
        return `/category/${encodeURIComponent(selectedCategory.name)}/${encodeURIComponent(selectedSubcategory)}`;
      case 'product':
        return selectedProduct ? `/product/${selectedProduct._id}` : '';
      case 'custom':
      default:
        return customCtaUrl || form.ctaLink;
    }
  }, [ctaDestination, selectedCategory, selectedSubcategory, selectedProduct, customCtaUrl, form.ctaLink]);

  const copyToClipboard = async (value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Copied CTA link');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const openAdd = () => {
    setEditing(null);
    setCategorySearch("");
    setSubcategorySearch("");
    setProductSearch("");
    setCtaDestination('custom');
    setSelectedCategoryId("");
    setSelectedSubcategory("");
    setSelectedProductId("");
    setCustomCtaUrl("");
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
    setCategorySearch("");
    setSubcategorySearch("");
    setProductSearch("");
    const ctaState = getCtaStateFromLink(slide.ctaLink);
    const selectedCategory = ctaState.categoryValue
      ? categories.find((cat) => cat.name === ctaState.categoryValue || cat.slug === ctaState.categoryValue)
      : undefined;

    setCtaDestination(ctaState.destination);
    setSelectedCategoryId(selectedCategory?._id || "");
    setSelectedSubcategory(ctaState.subcategoryValue || "");
    setSelectedProductId(ctaState.productId || "");
    setCustomCtaUrl(ctaState.destination === 'custom' ? ctaState.customUrl || slide.ctaLink : "");
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

  const uploadSliderImageFile = async (file: File) => {
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadSliderImageFile(file);
    e.target.value = "";
  };

  const handleSliderDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await uploadSliderImageFile(file);
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

    if (ctaDestination === 'category' && !selectedCategory) {
      toast.error("Please select a category for the CTA link.");
      return;
    }

    if (ctaDestination === 'subcategory' && !selectedSubcategory) {
      toast.error("Please select a subcategory for the CTA link.");
      return;
    }

    if (ctaDestination === 'product' && !selectedProduct) {
      toast.error("Please select a product for the CTA link.");
      return;
    }

    if (ctaDestination === 'custom' && !customCtaUrl.trim() && !form.ctaLink.trim()) {
      toast.error("Please enter a custom CTA URL.");
      return;
    }

    // Set gradient to 'none' if useGradient is false
    const payload = {
      ...form,
      ctaLink: generatedCtaLink || form.ctaLink,
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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Hero Sliders &amp; Banners</h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Manage homepage banner slides. Drag and drop slides to reorder.</p>
        </div>
        <button 
          type="button" 
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-purple hover:bg-brand-purple-dark text-white px-4 py-2.5 text-xs font-bold shadow-md shadow-purple-600/20 active:scale-95 transition-all cursor-pointer" 
          onClick={openAdd}
        >
          + Add Slider
        </button>
      </div>

      <div className="flex items-start gap-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 p-4 text-xs font-semibold text-slate-600 dark:text-slate-300 border border-purple-100 dark:border-purple-900/50">
        <Lightbulb size={16} className="mt-0.5 shrink-0 text-brand-purple dark:text-purple-400" />
        <span><strong className="font-extrabold text-slate-900 dark:text-white">Pro Tip:</strong> Drag and drop slides to reorder their display order on the homepage banner.</span>
      </div>

      <div className="space-y-3">
        {sliders.map((slide, idx) => (
          <div
            key={slide._id}
            className={cn(
              'flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs transition-all',
              !slide.active && 'opacity-60',
              draggedIndex === idx && 'opacity-40'
            )}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="shrink-0 cursor-grab text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"><GripVertical size={18} /></span>
              <span className="shrink-0 text-xs font-black text-slate-400 dark:text-slate-500">#{idx + 1}</span>
              <img src={slide.image} alt={slide.headline} className="h-14 w-24 shrink-0 rounded-xl object-cover border border-slate-200 dark:border-slate-800" />
              <div className="min-w-0 flex-1">
                {slide.chip && <div className="mb-0.5 inline-block rounded-full bg-purple-100 dark:bg-purple-950/80 px-2 py-0.5 text-[10px] font-extrabold text-brand-purple dark:text-purple-300">{slide.chip}</div>}
                <div className="truncate text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">{slide.headline}</div>
                {slide.subtext && <div className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{slide.subtext}</div>}
                <div className="mt-0.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 truncate">
                  CTA: <em className="not-italic font-bold text-slate-700 dark:text-slate-300">{slide.ctaText}</em> &rarr; <code className="text-[10px] font-mono">{slide.ctaLink}</code>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
              <button 
                type="button" 
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer" 
                onClick={() => openEdit(slide)}
              >
                <Pencil size={12} /> Edit
              </button>
              <button 
                type="button" 
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer" 
                onClick={() => toggle(slide._id, !slide.active)}
              >
                {slide.active ? <EyeOff size={12} /> : <Eye size={12} />} {slide.active ? "Hide" : "Show"}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 cursor-pointer"
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
              <div
                className="adm-file-upload"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleSliderDrop}
              >
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
                      <span className="adm-file-hint">Drag & drop or browse · Max 5MB</span>
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
                <label>CTA Destination</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'category' as CTADestination, label: 'Category' },
                    { value: 'subcategory' as CTADestination, label: 'Subcategory' },
                    { value: 'product' as CTADestination, label: 'Product' },
                    { value: 'custom' as CTADestination, label: 'Custom URL' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`rounded-lg border px-3 py-2 text-sm text-left transition ${ctaDestination === option.value ? 'border-brand-purple bg-brand-purple/10 text-brand-purple' : 'border-border bg-white text-ink hover:bg-gray-50'}`}
                      onClick={() => setCtaDestination(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="mt-4 space-y-3">

                  {ctaDestination === 'category' && (
                    <div className="space-y-3">
                      <input
                        className="adm-input"
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        placeholder="Search categories"
                      />
                      <div className="max-h-48 overflow-auto rounded-card border border-border bg-white p-2">
                        {filteredCategories.length > 0 ? filteredCategories.map((cat) => (
                          <button
                            key={cat._id}
                            type="button"
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${selectedCategoryId === cat._id ? 'bg-brand-purple/10 text-brand-purple' : 'hover:bg-gray-50'}`}
                            onClick={() => setSelectedCategoryId(cat._id)}
                          >
                            <span>{cat.name}</span>
                            <span className="text-xs text-ink-muted">{cat.productCount || 0}</span>
                          </button>
                        )) : (
                          <div className="py-3 text-sm text-ink-muted">No categories found.</div>
                        )}
                      </div>
                      {selectedCategory && (
                        <div className="rounded-card border border-border bg-gray-50 p-3 text-sm">
                          <div className="font-semibold">Preview</div>
                          <div className="mt-1">{selectedCategory.name}</div>
                          <div className="mt-1 rounded-lg bg-white px-3 py-2 text-sm text-ink">{`/category/${encodeURIComponent(selectedCategory.name)}`}</div>
                          <button type="button" className="adm-btn-secondary mt-3 inline-flex items-center gap-2" onClick={() => copyToClipboard(`/category/${encodeURIComponent(selectedCategory.name)}`)}>
                            <Copy size={14} /> Copy CTA Link
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {ctaDestination === 'subcategory' && (
                    <div className="space-y-3">
                      <input
                        className="adm-input"
                        value={subcategorySearch}
                        onChange={(e) => setSubcategorySearch(e.target.value)}
                        placeholder="Search subcategories"
                      />
                      <div className="max-h-48 overflow-auto rounded-card border border-border bg-white p-2">
                        {subcategoryOptions.length > 0 ? subcategoryOptions.map((sub) => (
                          <button
                            key={`${sub.parentName}-${sub.name}`}
                            type="button"
                            className={`flex w-full flex-col items-start rounded-lg px-3 py-2 text-left text-sm ${selectedSubcategory === sub.name ? 'bg-brand-purple/10 text-brand-purple' : 'hover:bg-gray-50'}`}
                            onClick={() => setSelectedSubcategory(sub.name)}
                          >
                            <span className="font-medium">{sub.name}</span>
                            <span className="mt-0.5 text-xs text-ink-muted">{sub.parentName}</span>
                          </button>
                        )) : (
                          <div className="py-3 text-sm text-ink-muted">No subcategories found.</div>
                        )}
                      </div>
                      {selectedSubcategory && (
                        <div className="rounded-card border border-border bg-gray-50 p-3 text-sm">
                          <div className="font-semibold">Preview</div>
                          <div className="mt-1">{selectedSubcategory}</div>
                          <div className="mt-1 rounded-lg bg-white px-3 py-2 text-sm text-ink">{`/category/${encodeURIComponent(selectedCategory?.name || '')}/${encodeURIComponent(selectedSubcategory)}`}</div>
                          <button type="button" className="adm-btn-secondary mt-3 inline-flex items-center gap-2" onClick={() => copyToClipboard(`/category/${encodeURIComponent(selectedCategory?.name || '')}/${encodeURIComponent(selectedSubcategory)}`)}>
                            <Copy size={14} /> Copy CTA Link
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {ctaDestination === 'product' && (
                    <div className="space-y-3">
                      <input
                        className="adm-input"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Search products"
                      />
                      <div className="max-h-48 overflow-auto rounded-card border border-border bg-white p-2">
                        {filteredProducts.length > 0 ? filteredProducts.map((prod) => (
                          <button
                            key={prod._id}
                            type="button"
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${selectedProductId === prod._id ? 'bg-brand-purple/10 text-brand-purple' : 'hover:bg-gray-50'}`}
                            onClick={() => setSelectedProductId(prod._id)}
                          >
                            <img src={prod.image} alt={prod.name} className="h-10 w-10 rounded-md object-cover" />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">{prod.name}</div>
                              <div className="mt-0.5 text-xs text-ink-muted truncate">{prod.categoryName}</div>
                            </div>
                            <span className="text-xs text-ink-muted">₹{prod.price}</span>
                          </button>
                        )) : (
                          <div className="py-3 text-sm text-ink-muted">No products found.</div>
                        )}
                      </div>
                      {selectedProduct && (
                        <div className="rounded-card border border-border bg-gray-50 p-3 text-sm">
                          <div className="font-semibold">Preview</div>
                          <div className="mt-1">{selectedProduct.name}</div>
                          <div className="mt-1 rounded-lg bg-white px-3 py-2 text-sm text-ink">{`/product/${selectedProduct._id}`}</div>
                          <button type="button" className="adm-btn-secondary mt-3 inline-flex items-center gap-2" onClick={() => copyToClipboard(`/product/${selectedProduct._id}`)}>
                            <Copy size={14} /> Copy CTA Link
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {ctaDestination === 'custom' && (
                    <div className="space-y-3">
                      <input
                        className="adm-input"
                        value={customCtaUrl}
                        onChange={(e) => setCustomCtaUrl(e.target.value)}
                        placeholder="/contact or /about"
                      />
                      <div className="rounded-card border border-border bg-gray-50 p-3 text-sm">
                        <div className="font-semibold">Preview</div>
                        <div className="mt-1 rounded-lg bg-white px-3 py-2 text-sm text-ink">{customCtaUrl || form.ctaLink}</div>
                        <button type="button" className="adm-btn-secondary mt-3 inline-flex items-center gap-2" onClick={() => copyToClipboard(customCtaUrl || form.ctaLink)}>
                          <Copy size={14} /> Copy CTA Link
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
