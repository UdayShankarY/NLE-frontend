import { useState, useEffect } from "react";
import type { AdminProduct, AdminCategory, AdminAddon } from "../../types";
import { Modal } from "./Modal";
import { ConfirmModal } from "./ConfirmModal";
import { toast } from "react-toastify";
import { Pencil, Eye, EyeOff, Trash2, Upload, Link as LinkIcon, X, Star, Lightbulb, Copy } from "lucide-react";
import { cn } from "../../lib/utils";
import { getApiUrl } from '../../lib/api';

const API = getApiUrl('/api/products');
const CAT_API = getApiUrl('/api/categories');

export const ProductsView = () => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [availableAddons, setAvailableAddons] = useState<AdminAddon[]>([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [imageMode, setImageMode] = useState<"url" | "upload">("upload");
  const [uploading, setUploading] = useState(false);
  const [moreImagesMode, setMoreImagesMode] = useState<"url" | "upload">("upload");
  const [moreUploading, setMoreUploading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    categoryName: "",
    subcategory: "",
    price: 0,
    originalPrice: 0,
    description: "",
    inclusions: [] as string[],
    addOns: [] as { name: string; price: number }[],
    image: "",
    moreImages: [] as string[],
    badge: "",
    badgeColor: "purple" as "purple" | "pink" | "gold" | "green",
    active: true,
    featured: false,
  });

  const copyToClipboard = async (value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Copied link');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const [newInclusion, setNewInclusion] = useState("");
  const [addonSearch, setAddonSearch] = useState("");
  const [newAddOn, setNewAddOn] = useState({ name: "", price: 0 });
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const fetchProducts = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      toast.error("Failed to load products");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(CAT_API);
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      toast.error("Failed to load categories");
    }
  };

  const fetchAddons = async () => {
    try {
      const res = await fetch(getApiUrl('/api/addons/active'));
      const data = await res.json();
      setAvailableAddons(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load add-ons");
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchAddons();
  }, []);

  const getSubcategories = (): string[] => {
    const cat = categories.find((c) => c._id === form.categoryId);
    if (!cat?.subcategories) return [];

    return cat.subcategories.map((sub) =>
      typeof sub === "string" ? sub : sub.name
    );
  };

  const openAdd = () => {
    setEditing(null);
    setSelectedAddonIds([]);
    setForm({
      name: "",
      categoryId: "",
      categoryName: "",
      subcategory: "",
      price: 0,
      originalPrice: 0,
      description: "",
      inclusions: [],
      addOns: [],
      image: "",
      moreImages: [],
      badge: "",
      badgeColor: "purple",
      active: true,
      featured: false,
    });
    setImageMode("upload");
    setShowModal(true);
  };

  const openEdit = (p: AdminProduct) => {
    setEditing(p);
    const selectedIds = (Array.isArray(p.addons) ? p.addons : []).map((addon) => typeof addon === "string" ? addon : addon._id).filter(Boolean);
    setSelectedAddonIds(selectedIds);
    setForm({
      name: p.name,
      categoryId: p.categoryId,
      categoryName: p.categoryName,
      subcategory: p.subcategory,
      price: p.price,
      originalPrice: p.originalPrice || 0,
      description: p.description,
      inclusions: p.inclusions || [],
      addOns: p.addOns || [],
      image: p.image,
      moreImages: p.moreImages || [],
      badge: p.badge || "",
      badgeColor: p.badgeColor,
      active: p.active,
      featured: p.featured,
    });
    setImageMode("upload");
    setShowModal(true);
  };

  const uploadImageFile = async (file: File) => {
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
    formData.append("folder", "ems/products");

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
    await uploadImageFile(file);
    e.target.value = "";
  };

  const handleImageDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await uploadImageFile(file);
  };

  const uploadMoreImageFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setMoreUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ems_categories");
    formData.append("folder", "ems/products");

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
      setForm((f) => ({ ...f, moreImages: [...f.moreImages, data.secure_url] }));
      toast.success("Image added!");
    } catch (error) {
      toast.error("Failed to upload image. Please try again.");
      console.error("Upload error:", error);
    } finally {
      setMoreUploading(false);
    }
  };

  const handleMoreImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadMoreImageFile(file);
    e.target.value = "";
  };

  const handleMoreImagesDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await uploadMoreImageFile(file);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }

    if (!form.categoryId) {
      toast.error("Please select a category");
      return;
    }

    if (!form.image.trim()) {
      toast.error("Product image is required");
      return;
    }

    if (form.price <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }

    const selectedCat = categories.find((c) => c._id === form.categoryId);
    const selectedSnapshots = availableAddons
      .filter((addon) => selectedAddonIds.includes(addon._id))
      .map((addon) => ({ id: addon._id, name: addon.name, price: addon.price }));

    const existingInlineAddOns = Array.isArray(form.addOns) ? form.addOns : [];
    const mergedAddOns = [
      ...selectedSnapshots,
      ...existingInlineAddOns.filter((inline) =>
        !selectedSnapshots.some((addon) => addon.name.trim().toLowerCase() === inline.name.trim().toLowerCase())
      ),
    ];

    const payload = {
      ...form,
      categoryName: selectedCat?.name || "",
      addons: selectedAddonIds,
      addOns: mergedAddOns,
    };

    if (editing) {
      try {
        const res = await fetch(`${API}/${editing._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const updated = await res.json();
        setProducts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
        toast.success("Product updated successfully!");
      } catch {
        toast.error("Failed to update product");
      }
    } else {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const newProduct = await res.json();
      setProducts((prev) => [newProduct, ...prev]);
      toast.success("Product added successfully!");
    }

    setShowModal(false);
  };

  const del = async (id: string) => {
    await fetch(`${API}/${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p._id !== id));
    setDeleteConfirm(null);
    toast.success("Product deleted!");
  };

  const toggle = async (id: string, active: boolean) => {
    await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    setProducts((prev) => prev.map((p) => (p._id === id ? { ...p, active } : p)));
  };

  const addInclusion = () => {
    if (!newInclusion.trim()) return;
    setForm((f) => ({ ...f, inclusions: [...f.inclusions, newInclusion.trim()] }));
    setNewInclusion("");
  };

  const removeInclusion = (idx: number) => {
    setForm((f) => ({ ...f, inclusions: f.inclusions.filter((_, i) => i !== idx) }));
  };

  const addAddOn = () => {
    if (!newAddOn.name.trim() || newAddOn.price <= 0) {
      toast.error("Add-on name and price are required");
      return;
    }
    const duplicate = form.addOns.some((addon) => addon.name.trim().toLowerCase() === newAddOn.name.trim().toLowerCase());
    if (duplicate) {
      toast.error("This add-on is already attached to the product");
      return;
    }
    setForm((f) => ({ ...f, addOns: [...f.addOns, { ...newAddOn }] }));
    setNewAddOn({ name: "", price: 0 });
  };

  const removeAddOn = (idx: number) => {
    setForm((f) => ({ ...f, addOns: f.addOns.filter((_, i) => i !== idx) }));
  };

  const filteredAvailableAddons = availableAddons.filter((addon) => {
    const query = addonSearch.trim().toLowerCase();
    if (!query) return true;
    return addon.name.toLowerCase().includes(query)
      || addon.category?.toLowerCase().includes(query)
      || addon.description?.toLowerCase().includes(query);
  });

  const removeMoreImage = (idx: number) => {
    setForm((f) => ({ ...f, moreImages: f.moreImages.filter((_, i) => i !== idx) }));
  };

  const addNewCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      const res = await fetch(CAT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          icon: "📦",
          image: "",
          slug: newCategoryName.toLowerCase().replace(/\s+/g, "-"),
          active: true,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.message || "Failed to add category");
        return;
      }

      const newCategory = await res.json();
      setCategories((prev) => [...prev, newCategory]);
      setForm((f) => ({ ...f, categoryId: newCategory._id, subcategory: "" }));
      setNewCategoryName("");
      setShowAddCategoryModal(false);
      toast.success("Category added successfully!");
    } catch (err) {
      toast.error("Failed to add category");
    }
  };

  const badgeColorClass: Record<string, string> = {
    purple: 'bg-brand-purple text-white',
    pink: 'bg-brand-pink text-white',
    gold: 'bg-brand-gold text-white',
    green: 'bg-emerald-500 text-white',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Event Decoration Packages</h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Manage decor packages, pricing, inclusions, and photo galleries.</p>
        </div>
        <button 
          type="button" 
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-purple hover:bg-brand-purple-dark text-white px-4 py-2.5 text-xs font-bold shadow-md shadow-purple-600/20 active:scale-95 transition-all cursor-pointer" 
          onClick={openAdd}
        >
          + Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((prod) => (
          <div key={prod._id} className={cn('overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between transition-all', !prod.active && 'opacity-60')}>
            <div>
              <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <img src={prod.image} alt={prod.name} className="h-full w-full object-cover" />
                {prod.badge && (
                  <span className={cn('absolute left-2.5 top-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase border', badgeColorClass[prod.badgeColor] || badgeColorClass.purple)}>
                    {prod.badge}
                  </span>
                )}
                {prod.featured && (
                  <span className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 dark:bg-slate-900/90 text-amber-500 shadow-xs">
                    <Star size={14} fill="currentColor" />
                  </span>
                )}
              </div>
              <div className="p-4 space-y-1">
                <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">{prod.name}</h3>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 truncate">
                  {prod.categoryName} {prod.subcategory && `\u00b7 ${prod.subcategory}`}
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-sm font-black text-brand-purple dark:text-purple-400">&#8377;{Number(prod.price || 0).toLocaleString('en-IN')}</span>
                  {(prod.originalPrice ?? 0) > 0 && (
                    <span className="text-xs text-slate-400 line-through">&#8377;{Number(prod.originalPrice || 0).toLocaleString('en-IN')}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 pt-0 flex items-center gap-1.5">
              <button 
                type="button" 
                className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer" 
                onClick={() => openEdit(prod)}
              >
                <Pencil size={12} /> Edit
              </button>
              <button 
                type="button" 
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer" 
                onClick={() => copyToClipboard(`/product/${prod._id}`)}
                title="Copy Product Link"
              >
                <Copy size={12} />
              </button>
              <button 
                type="button" 
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer" 
                onClick={() => toggle(prod._id, !prod.active)}
              >
                {prod.active ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 p-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 cursor-pointer"
                onClick={() => setDeleteConfirm({ id: prod._id, name: prod.name })}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal
          title={editing ? "Edit Product" : "Add Product"}
          onClose={() => setShowModal(false)}
          large
        >
          <div className="adm-form">
            <div className="adm-form-row">
              <div className="adm-form-col">
                <label>Product Name *</label>
                <input
                  className="adm-input"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Romantic Candlelight Dinner"
                />
              </div>
            </div>

            <div className="adm-form-row">
              <div className="adm-form-col">
                <label>Category *</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <select
                    className="adm-input"
                    style={{ flex: 1 }}
                    value={form.categoryId}
                    onChange={(e) => {
                      const catId = e.target.value;
                      setForm((f) => ({ ...f, categoryId: catId, subcategory: "" }));
                    }}
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="adm-btn-add"
                    onClick={() => setShowAddCategoryModal(true)}
                    title="Add new category"
                  >
                    + New
                  </button>
                </div>
              </div>

              <div className="adm-form-col">
                <label>Subcategory</label>
                <select
                  className="adm-input"
                  value={form.subcategory}
                  onChange={(e) => setForm((f) => ({ ...f, subcategory: e.target.value }))}
                  disabled={!form.categoryId}
                >
                  <option value="">Select Subcategory</option>
                  {getSubcategories().map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="adm-form-row">
              <div className="adm-form-col">
                <label>Price (&#8377;) *</label>
                <input
                  type="number"
                  className="adm-input"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                  min="0"
                />
              </div>

              <div className="adm-form-col">
                <label>Original Price (&#8377;)</label>
                <input
                  type="number"
                  className="adm-input"
                  value={form.originalPrice}
                  onChange={(e) => setForm((f) => ({ ...f, originalPrice: Number(e.target.value) }))}
                  min="0"
                />
              </div>
            </div>

            <label>Description</label>
            <textarea
              className="adm-input adm-textarea"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={4}
              placeholder="Describe your product..."
            />

            <label>Main Image *</label>
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
                onDrop={handleImageDrop}
              >
                <input
                  type="file"
                  id="product-image-upload"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="adm-file-input"
                  disabled={uploading}
                />
                <label htmlFor="product-image-upload" className="adm-file-label">
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
                placeholder="https://example.com/image.jpg"
              />
            )}

            {form.image && !uploading && (
              <div className="adm-image-preview">
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

            <label>More Images</label>
            <div className="adm-image-mode-tabs">
              <button
                type="button"
                className={`adm-mode-tab${moreImagesMode === "upload" ? " active" : ""}`}
                onClick={() => setMoreImagesMode("upload")}
              >
                <Upload size={13} className="mr-1 inline" /> Upload File
              </button>
              <button
                type="button"
                className={`adm-mode-tab${moreImagesMode === "url" ? " active" : ""}`}
                onClick={() => setMoreImagesMode("url")}
              >
                <LinkIcon size={13} className="mr-1 inline" /> Image URL
              </button>
            </div>

            {moreImagesMode === "upload" ? (
              <div
                className="adm-file-upload"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleMoreImagesDrop}
              >
                <input
                  type="file"
                  id="more-images-upload"
                  accept="image/*"
                  onChange={handleMoreImagesUpload}
                  className="adm-file-input"
                  disabled={moreUploading}
                />
                <label htmlFor="more-images-upload" className="adm-file-label">
                  {moreUploading ? (
                    <>
                      <span className="adm-file-icon">&#8987;</span>
                      <span className="adm-file-text">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <span className="adm-file-icon"><Upload size={20} /></span>
                      <span className="adm-file-text">Add More Images</span>
                      <span className="adm-file-hint">Drag & drop or browse · Max 5MB</span>
                    </>
                  )}
                </label>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  className="adm-input"
                  placeholder="https://example.com/image.jpg"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                      setForm((f) => ({
                        ...f,
                        moreImages: [...f.moreImages, e.currentTarget.value.trim()],
                      }));
                      e.currentTarget.value = "";
                    }
                  }}
                />
              </div>
            )}

            {form.moreImages.length > 0 && (
              <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {form.moreImages.map((img, idx) => (
                  <div key={idx} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                    <img src={img} alt={`More ${idx + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => removeMoreImage(idx)}
                      title="Remove"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label>Inclusions</label>
            <div className="flex gap-2">
              <input
                className="adm-input"
                value={newInclusion}
                onChange={(e) => setNewInclusion(e.target.value)}
                placeholder="e.g. Cake, Balloons, Decorations"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addInclusion();
                  }
                }}
              />
              <button type="button" className="adm-btn-add" onClick={addInclusion}>
                + Add
              </button>
            </div>
            {form.inclusions.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1.5">
                {form.inclusions.map((inc, idx) => (
                  <li key={idx} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-sm text-ink">
                    {inc}
                    <button type="button" className="text-ink-muted hover:text-red-500" onClick={() => removeInclusion(idx)}>
                      <X size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <label>Attach existing active add-ons</label>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row">
              <input
                className="adm-input"
                value={addonSearch}
                onChange={(e) => setAddonSearch(e.target.value)}
                placeholder="Search add-ons"
              />
              <button
                type="button"
                className="adm-btn-ghost"
                onClick={() => setSelectedAddonIds([])}
              >
                Clear selected
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {filteredAvailableAddons.map((addon) => {
                const checked = selectedAddonIds.includes(addon._id);
                return (
                  <label key={addon._id} className="flex items-center gap-2 rounded-lg border border-border bg-gray-50 px-3 py-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...selectedAddonIds, addon._id]
                          : selectedAddonIds.filter((id) => id !== addon._id);
                        setSelectedAddonIds(next);
                      }}
                    />
                    <span className="flex-1">{addon.name}</span>
                    <span className="font-semibold text-brand-purple">₹{addon.price.toLocaleString()}</span>
                  </label>
                );
              })}
            </div>
            {filteredAvailableAddons.length === 0 && (
              <div className="mt-2 rounded-lg border border-dashed border-border bg-gray-50 px-3 py-4 text-sm text-ink-muted">
                No add-ons match “{addonSearch}”.
              </div>
            )}

            <label className="mt-3">Quick add-ons (legacy inline)</label>
            <div className="flex gap-2">
              <input
                className="adm-input"
                value={newAddOn.name}
                onChange={(e) => setNewAddOn((a) => ({ ...a, name: e.target.value }))}
                placeholder="Add-on name"
              />
              <input
                type="number"
                className="adm-input"
                style={{ maxWidth: 100 }}
                value={newAddOn.price}
                onChange={(e) => setNewAddOn((a) => ({ ...a, price: Number(e.target.value) }))}
                placeholder="Price"
                min="0"
              />
              <button type="button" className="adm-btn-add" onClick={addAddOn}>
                + Add
              </button>
            </div>
            {form.addOns.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1.5">
                {form.addOns.map((addon, idx) => (
                  <li key={idx} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-sm text-ink">
                    {addon.name} - &#8377;{addon.price}
                    <button type="button" className="text-ink-muted hover:text-red-500" onClick={() => removeAddOn(idx)}>
                      <X size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="adm-form-row">
              <div className="adm-form-col">
                <label>Badge Text</label>
                <input
                  className="adm-input"
                  value={form.badge}
                  onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
                  placeholder="e.g. BESTSELLER"
                />
              </div>

              <div className="adm-form-col">
                <label>Badge Color</label>
                <select
                  className="adm-input"
                  value={form.badgeColor}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      badgeColor: e.target.value as "purple" | "pink" | "gold" | "green",
                    }))
                  }
                >
                  <option value="purple">Purple</option>
                  <option value="pink">Pink</option>
                  <option value="gold">Gold</option>
                  <option value="green">Green</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <label className="adm-check-row">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                />
                Active
              </label>
              <label className="adm-check-row">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                />
                Featured
              </label>
            </div>

            <div className="adm-modal-footer">
              <button className="adm-btn-ghost" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="adm-btn-primary" onClick={save} disabled={uploading || moreUploading}>
                {editing ? "Save Changes" : "Add Product"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <ConfirmModal
          title="Delete Product"
          message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
          onConfirm={() => del(deleteConfirm.id)}
          onCancel={() => setDeleteConfirm(null)}
          confirmText="Delete"
        />
      )}

      {showAddCategoryModal && (
        <Modal
          title="Add New Category"
          onClose={() => {
            setShowAddCategoryModal(false);
            setNewCategoryName("");
          }}
        >
          <div className="adm-form">
            <label>Category Name *</label>
            <input
              className="adm-input"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g. Birthday Decorations"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addNewCategory();
                }
              }}
            />
            <p className="mt-2 flex items-start gap-1.5 text-xs text-ink-muted">
              <Lightbulb size={13} className="mt-0.5 flex-shrink-0 text-brand-purple" />
              Quick add: Category will be created with default settings. You can edit it later from the Categories page.
            </p>
            <div className="adm-modal-footer">
              <button
                className="adm-btn-ghost"
                onClick={() => {
                  setShowAddCategoryModal(false);
                  setNewCategoryName("");
                }}
              >
                Cancel
              </button>
              <button className="adm-btn-primary" onClick={addNewCategory}>
                Add Category
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
