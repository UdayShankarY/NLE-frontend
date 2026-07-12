import { useState, useEffect } from "react";
import type { AdminCategory } from "../../types";
import { Modal } from "./Modal";
import { ConfirmModal } from "./ConfirmModal";
import { toast } from "react-toastify";
import { Pencil, Eye, EyeOff, Trash2, Layers, Plus, Upload, Link as LinkIcon, X } from "lucide-react";
import { EmptyState } from "../EmptyState";
import { cn } from "../../lib/utils";

const API = '/api/categories';

export const CategoriesView = () => {
  const [cats, setCats] = useState<AdminCategory[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [showSubsModal, setShowSubsModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AdminCategory | null>(null);
  const [showAddSubModal, setShowAddSubModal] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [deleteSubConfirm, setDeleteSubConfirm] = useState<{ idx: number; name: string } | null>(null);
  const [editSubModal, setEditSubModal] = useState<{ idx: number; name: string } | null>(null);
  const [editSubName, setEditSubName] = useState('');
  const [imageMode, setImageMode] = useState<"url" | "upload">("upload");
  const [uploading, setUploading] = useState(false);
  const [subImageMode, setSubImageMode] = useState<"url" | "upload">("upload");
  const [subUploading, setSubUploading] = useState(false);
  const [subImage, setSubImage] = useState("");

  const [form, setForm] = useState({
    name: "",
    icon: "",
    image: "",
    slug: "",
    active: true,
  });

  const addSubcategory = async (categoryId: string) => {
    if (!newSubName.trim()) {
      toast.error("Please enter subcategory name");
      return;
    }

    if (!subImage.trim()) {
      toast.error("Please add subcategory image");
      return;
    }

    const category = cats.find((c) => c._id === categoryId);
    const updatedSubs = [...(category?.subcategories || []), { name: newSubName.trim(), image: subImage }];

    const res = await fetch(`${API}/${categoryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subcategories: updatedSubs }),
    });

    const updated = await res.json();
    setCats((prev) => prev.map((cat) => (cat._id === updated._id ? updated : cat)));

    if (selectedCategory && selectedCategory._id === categoryId) {
      setSelectedCategory(updated);
    }

    setNewSubName("");
    setSubImage("");
    setShowAddSubModal(false);
    toast.success("Subcategory added!");
  };

  const editSubcategory = async () => {
    if (!editSubName.trim() || !selectedCategory || editSubModal === null) {
      toast.error("Please enter subcategory name");
      return;
    }

    if (!subImage.trim()) {
      toast.error("Please add subcategory image");
      return;
    }

    const updatedSubs = [...(selectedCategory.subcategories || [])];
    updatedSubs[editSubModal.idx] = { name: editSubName.trim(), image: subImage };

    const res = await fetch(`${API}/${selectedCategory._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subcategories: updatedSubs }),
    });

    const updated = await res.json();
    setCats((prev) => prev.map((cat) => (cat._id === updated._id ? updated : cat)));
    setSelectedCategory(updated);
    setEditSubModal(null);
    setEditSubName("");
    setSubImage("");
    toast.success("Subcategory updated!");
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setCats(data);
    } catch (err) {
      toast.error("Failed to load categories");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", icon: "", image: "", slug: "", active: true });
    setImageMode("upload");
    setShowModal(true);
  };

  const openEdit = (c: AdminCategory) => {
    setEditing(c);
    setForm({ name: c.name, icon: "", image: c.image || "", slug: c.slug, active: c.active });
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
    formData.append("folder", "ems/categories");

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

  const handleSubFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setSubUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ems_categories");
    formData.append("folder", "ems/subcategories");

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
      setSubImage(data.secure_url);
      toast.success("Image uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload image. Please try again.");
      console.error("Upload error:", error);
    } finally {
      setSubUploading(false);
    }
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    if (!form.image.trim()) {
      toast.error("Category image is required");
      return;
    }

    const exists = cats.some(
      (c) => c.name.toLowerCase() === form.name.toLowerCase() && c._id !== editing?._id
    );

    if (!editing && exists) {
      toast.error("Category already exists!");
      return;
    }

    if (editing) {
      try {
        const res = await fetch(`${API}/${editing._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const updated = await res.json();
        setCats((prev) => prev.map((cat) => (cat._id === updated._id ? updated : cat)));
        toast.success("Category updated successfully!");
      } catch {
        toast.error("Failed to update category");
      }
    } else {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const newCategory = await res.json();
      setCats((prev) => [...prev, newCategory]);
      toast.success("Category added successfully!");
    }

    setShowModal(false);
  };

  const del = async (id: string) => {
    await fetch(`${API}/${id}`, { method: "DELETE" });
    setCats((prev) => prev.filter((cat) => cat._id !== id));
    setDeleteConfirm(null);
    toast.success("Category deleted!");
  };

  const toggle = async (id: string, active: boolean) => {
    await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    setCats((prev) => prev.map((cat) => (cat._id === id ? { ...cat, active } : cat)));
  };

  const imageModeTabs = (mode: "url" | "upload", setMode: (m: "url" | "upload") => void) => (
    <div className="adm-image-mode-tabs">
      <button type="button" className={`adm-mode-tab${mode === "upload" ? " active" : ""}`} onClick={() => setMode("upload")}>
        <Upload size={13} className="mr-1 inline" /> Upload File
      </button>
      <button type="button" className={`adm-mode-tab${mode === "url" ? " active" : ""}`} onClick={() => setMode("url")}>
        <LinkIcon size={13} className="mr-1 inline" /> Image URL
      </button>
    </div>
  );

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Categories</h2>
        <button className="adm-btn-primary" onClick={openAdd}>+ Add Category</button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cats.map((cat) => (
          <div key={cat._id} className={cn('overflow-hidden rounded-card border border-border bg-white shadow-card', !cat.active && 'opacity-60')}>
            {cat.image && (
              <div className="h-32 w-full bg-gray-100">
                <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="p-4">
              <div className="text-sm font-semibold text-ink">{cat.name}</div>
              <div className="mt-0.5 text-xs text-ink-muted">{cat.productCount || 0} products &middot; /{cat.slug}</div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <button className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-black/5" onClick={() => openEdit(cat)}>
                  <Pencil size={12} /> Edit
                </button>
                <button className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-black/5" onClick={() => toggle(cat._id, !cat.active)}>
                  {cat.active ? <EyeOff size={12} /> : <Eye size={12} />} {cat.active ? "Hide" : "Show"}
                </button>
                <button
                  className="flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  onClick={() => setDeleteConfirm({ id: cat._id, name: cat.name })}
                >
                  <Trash2 size={12} /> Delete
                </button>
                <button
                  className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-black/5"
                  onClick={() => { setSelectedCategory(cat); setShowSubsModal(true); }}
                >
                  <Layers size={12} /> Sub ({cat.subcategories?.length || 0})
                </button>
                <button
                  className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-black/5"
                  onClick={() => { setSelectedCategory(cat); setShowAddSubModal(true); }}
                >
                  <Plus size={12} /> Sub
                </button>
              </div>

              <div className="mt-3 flex items-center gap-1.5 text-xs text-ink-muted">
                <span className={cn('h-1.5 w-1.5 rounded-full', cat.active ? 'bg-emerald-500' : 'bg-gray-300')} />
                {cat.active ? "Active" : "Hidden"}
              </div>
            </div>
          </div>
        ))}

        {cats.length === 0 && (
          <div className="col-span-full">
            <EmptyState title="No categories yet" description='Click "+ Add Category" to create your first one.' />
          </div>
        )}
      </div>

      {showModal && (
        <Modal title={editing ? "Edit Category" : "Add Category"} onClose={() => setShowModal(false)}>
          <div className="adm-form">
            <label>Category Name *</label>
            <input
              className="adm-input"
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((f) => ({ ...f, name, slug: name.toLowerCase().replace(/\s+/g, "-") }));
              }}
            />
            <label>Category Image *</label>
            {imageModeTabs(imageMode, setImageMode)}

            {imageMode === "upload" ? (
              <div className="adm-file-upload">
                <input
                  type="file"
                  id="cat-image-upload"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="adm-file-input"
                  disabled={uploading}
                />
                <label htmlFor="cat-image-upload" className="adm-file-label">
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
                      <span className="adm-file-hint">Max 5MB (JPG, PNG, WebP)</span>
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
            <label>Slug</label>
            <input
              className="adm-input"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
            />
            <label className="adm-check-row">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
              Active
            </label>
            <div className="adm-modal-footer">
              <button className="adm-btn-ghost" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="adm-btn-primary" onClick={save} disabled={uploading}>
                {editing ? "Save Changes" : "Add Category"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showSubsModal && selectedCategory && (
        <Modal
          title={`Subcategories - ${selectedCategory.name}`}
          onClose={() => {
            setShowSubsModal(false);
            setSelectedCategory(null);
          }}
        >
          <div className="flex flex-col gap-4">
            {selectedCategory.subcategories && selectedCategory.subcategories.length > 0 ? (
              <div className="flex flex-col gap-2">
                {selectedCategory.subcategories.map((sub, idx) => {
                  const subName = typeof sub === 'string' ? sub : sub.name;
                  const subImg = typeof sub === 'string' ? '' : sub.image;

                  return (
                    <div key={idx} className="flex items-center gap-2.5 rounded-lg border border-border p-2">
                      <span className="w-5 flex-shrink-0 text-xs text-ink-muted">{idx + 1}.</span>
                      {subImg && (
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                          <img src={subImg} alt={subName} className="h-full w-full object-cover" />
                        </div>
                      )}
                      <span className="flex-1 truncate text-sm font-medium text-ink">{subName}</span>
                      <div className="flex flex-shrink-0 gap-1.5">
                        <button
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-ink hover:bg-black/5"
                          onClick={() => {
                            setEditSubModal({ idx, name: subName });
                            setEditSubName(subName);
                            setSubImage(subImg || "");
                          }}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteSubConfirm({ idx, name: subName })}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="No subcategories yet" description='Click "+ Add Subcategory" to add one.' />
            )}
            <div className="adm-modal-footer">
              <button className="adm-btn-primary" onClick={() => setShowAddSubModal(true)}>
                + Add Subcategory
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showAddSubModal && selectedCategory && (
        <Modal
          title="Add Subcategory"
          onClose={() => {
            setShowAddSubModal(false);
            setNewSubName("");
            setSubImage("");
          }}
        >
          <div className="adm-form">
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-gray-50 p-2.5">
              <span className="text-xs font-medium text-ink-muted">Adding to:</span>
              <div className="flex items-center gap-1.5">
                {selectedCategory.image ? (
                  <img src={selectedCategory.image} alt={selectedCategory.name} className="h-6 w-6 rounded-md object-cover" />
                ) : (
                  <span>{selectedCategory.icon}</span>
                )}
                <span className="text-sm font-semibold text-ink">{selectedCategory.name}</span>
              </div>
            </div>

            <label>Subcategory Name *</label>
            <input
              className="adm-input"
              value={newSubName}
              onChange={(e) => setNewSubName(e.target.value)}
              placeholder="e.g. Balloon Decorations"
              autoFocus
            />

            <label>Subcategory Image *</label>
            {imageModeTabs(subImageMode, setSubImageMode)}

            {subImageMode === "upload" ? (
              <div className="adm-file-upload">
                <input
                  type="file"
                  id="sub-image-upload"
                  accept="image/*"
                  onChange={handleSubFileUpload}
                  className="adm-file-input"
                  disabled={subUploading}
                />
                <label htmlFor="sub-image-upload" className="adm-file-label">
                  {subUploading ? (
                    <>
                      <span className="adm-file-icon">&#8987;</span>
                      <span className="adm-file-text">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <span className="adm-file-icon"><Upload size={20} /></span>
                      <span className="adm-file-text">
                        {subImage ? "Change Image" : "Choose Image"}
                      </span>
                      <span className="adm-file-hint">Max 5MB (JPG, PNG, WebP)</span>
                    </>
                  )}
                </label>
              </div>
            ) : (
              <input
                className="adm-input"
                value={subImage}
                onChange={(e) => setSubImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            )}

            {subImage && !subUploading && (
              <div className="adm-image-preview">
                <img src={subImage} alt="Preview" />
                <button
                  type="button"
                  className="adm-remove-image"
                  onClick={() => setSubImage("")}
                  title="Remove image"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="adm-modal-footer">
              <button
                className="adm-btn-ghost"
                onClick={() => {
                  setShowAddSubModal(false);
                  setNewSubName("");
                  setSubImage("");
                }}
              >
                Cancel
              </button>
              <button
                className="adm-btn-primary"
                onClick={() => addSubcategory(selectedCategory._id)}
                disabled={subUploading}
              >
                Add Subcategory
              </button>
            </div>
          </div>
        </Modal>
      )}

      {editSubModal && selectedCategory && (
        <Modal
          title="Edit Subcategory"
          onClose={() => {
            setEditSubModal(null);
            setEditSubName("");
            setSubImage("");
          }}
        >
          <div className="adm-form">
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-gray-50 p-2.5">
              <span className="text-xs font-medium text-ink-muted">Category:</span>
              <div className="flex items-center gap-1.5">
                {selectedCategory.image ? (
                  <img src={selectedCategory.image} alt={selectedCategory.name} className="h-6 w-6 rounded-md object-cover" />
                ) : (
                  <span>{selectedCategory.icon}</span>
                )}
                <span className="text-sm font-semibold text-ink">{selectedCategory.name}</span>
              </div>
            </div>

            <label>Subcategory Name *</label>
            <input
              className="adm-input"
              value={editSubName}
              onChange={(e) => setEditSubName(e.target.value)}
              placeholder="e.g. Balloon Decorations"
              autoFocus
            />

            <label>Subcategory Image *</label>
            {imageModeTabs(subImageMode, setSubImageMode)}

            {subImageMode === "upload" ? (
              <div className="adm-file-upload">
                <input
                  type="file"
                  id="sub-image-upload-edit"
                  accept="image/*"
                  onChange={handleSubFileUpload}
                  className="adm-file-input"
                  disabled={subUploading}
                />
                <label htmlFor="sub-image-upload-edit" className="adm-file-label">
                  {subUploading ? (
                    <>
                      <span className="adm-file-icon">&#8987;</span>
                      <span className="adm-file-text">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <span className="adm-file-icon"><Upload size={20} /></span>
                      <span className="adm-file-text">
                        {subImage ? "Change Image" : "Choose Image"}
                      </span>
                      <span className="adm-file-hint">Max 5MB (JPG, PNG, WebP)</span>
                    </>
                  )}
                </label>
              </div>
            ) : (
              <input
                className="adm-input"
                value={subImage}
                onChange={(e) => setSubImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            )}

            {subImage && !subUploading && (
              <div className="adm-image-preview">
                <img src={subImage} alt="Preview" />
                <button
                  type="button"
                  className="adm-remove-image"
                  onClick={() => setSubImage("")}
                  title="Remove image"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="adm-modal-footer">
              <button
                className="adm-btn-ghost"
                onClick={() => {
                  setEditSubModal(null);
                  setEditSubName("");
                  setSubImage("");
                }}
              >
                Cancel
              </button>
              <button className="adm-btn-primary" onClick={editSubcategory} disabled={subUploading}>
                Save Changes
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <ConfirmModal
          title="Delete Category"
          message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
          onConfirm={() => del(deleteConfirm.id)}
          onCancel={() => setDeleteConfirm(null)}
          confirmText="Delete"
        />
      )}

      {deleteSubConfirm && selectedCategory && (
        <ConfirmModal
          title="Delete Subcategory"
          message={`Are you sure you want to delete "${deleteSubConfirm.name}"?`}
          onConfirm={async () => {
            const updated = selectedCategory.subcategories?.filter((_, i) => i !== deleteSubConfirm.idx) || [];
            await fetch(`${API}/${selectedCategory._id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ subcategories: updated }),
            });
            setCats((prev) =>
              prev.map((cat) => (cat._id === selectedCategory._id ? { ...cat, subcategories: updated } : cat))
            );
            setSelectedCategory({ ...selectedCategory, subcategories: updated });
            setDeleteSubConfirm(null);
            toast.success("Subcategory deleted!");
          }}
          onCancel={() => setDeleteSubConfirm(null)}
          confirmText="Delete"
        />
      )}
    </div>
  );
};
