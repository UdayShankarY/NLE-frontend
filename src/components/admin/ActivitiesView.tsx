import { useEffect, useState } from 'react';
import { Plus, Eye, EyeOff, Trash2, Search } from 'lucide-react';
import { Modal } from './Modal';
import { ConfirmModal } from './ConfirmModal';
import { getApiUrl } from '../../lib/api';
import type { AdminProduct } from '../../types';
import { ProductSearchSelector } from './ProductSearchSelector';
import { toast } from 'react-toastify';

const API = getApiUrl('/api/activities');
const PRODUCT_API = getApiUrl('/api/products');

interface ActivityItem {
  _id: string;
  product: AdminProduct;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const ActivitiesView = () => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<ActivityItem | null>(null);
  const [search, setSearch] = useState('');

  const fetchProducts = async () => {
    try {
      const res = await fetch(PRODUCT_API);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load products');
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setActivities(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load activities');
    }
  };

  useEffect(() => {
    void fetchProducts();
    void fetchActivities();
  }, []);

  const openAdd = () => {
    setSelectedProductIds([]);
    setShowModal(true);
  };

  const excludedProductIds = activities
    .map((activity) => activity.product?._id)
    .filter((id): id is string => Boolean(id));

  const save = async () => {
    if (selectedProductIds.length === 0) {
      toast.error('Please select at least one product');
      return;
    }

    const payload = { products: selectedProductIds };
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.error || 'Unable to save activity');
      }

      const saved = await res.json();
      setActivities((prev) => [...(Array.isArray(saved) ? saved : [saved]), ...prev]);
      toast.success('Activity created');
      setShowModal(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save activity');
    }
  };

  const remove = async (activity: ActivityItem) => {
    try {
      await fetch(`${API}/${activity._id}`, { method: 'DELETE' });
      setActivities((prev) => prev.filter((item) => item._id !== activity._id));
      setDeleteConfirm(null);
      toast.success('Activity deleted');
    } catch {
      toast.error('Failed to delete activity');
    }
  };

  const toggleVisibility = async (activity: ActivityItem) => {
    try {
      const res = await fetch(`${API}/${activity._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !activity.active }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.error || 'Unable to update activity');
      }
      const updated = await res.json();
      setActivities((prev) => prev.map((item) => item._id === updated._id ? updated : item));
      toast.success(`Activity ${updated.active ? 'shown' : 'hidden'}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update activity');
    }
  };

  const filteredActivities = activities.filter((activity) => {
    if (!search.trim()) return true;
    return activity.product.name.toLowerCase().includes(search.trim().toLowerCase());
  });

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Activities</h2>
        <button className="adm-btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Activity
        </button>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-[1fr,180px]">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            className="adm-input pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search selected product names"
          />
        </div>
        <div className="text-sm text-ink-muted flex items-center justify-end">{filteredActivities.length} activities</div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredActivities.map((activity) => (
          <div key={activity._id} className="overflow-hidden rounded-card border border-border bg-white shadow-card">
            <div className="relative h-40 w-full bg-gray-100">
              {activity.product?.image ? (
                <img src={activity.product.image} alt={activity.product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-ink-muted">No image</div>
              )}
            </div>
            <div className="p-4">
              <div className="mt-3 rounded-lg border border-border bg-gray-50 px-3 py-2 text-sm text-ink">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{activity.product.name}</div>
                    {(activity.product.categoryName || activity.product.subcategory) && (
                      <div className="truncate text-xs text-ink-muted">
                        {activity.product.categoryName}
                        {activity.product.subcategory ? ` · ${activity.product.subcategory}` : ''}
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-brand-purple">₹{activity.product.price.toLocaleString()}</div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  className="adm-btn-ghost"
                  onClick={() => toggleVisibility(activity)}
                >
                  {activity.active ? <EyeOff size={14} /> : <Eye size={14} />} 
                  {activity.active ? 'Hide' : 'Show'}
                </button>
                <button className="adm-btn-danger" onClick={() => setDeleteConfirm(activity)}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title="Add Activity" onClose={() => setShowModal(false)} large>
          <div className="adm-form">
            <label>Select Products *</label>
            <ProductSearchSelector
              products={products}
              selectedProductIds={selectedProductIds}
              excludedProductIds={excludedProductIds}
              onChange={setSelectedProductIds}
            />
            <div className="adm-modal-footer">
              <button className="adm-btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="adm-btn-primary" onClick={save}>Save Activity</button>
            </div>
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <ConfirmModal
          title="Delete Activity"
          message={`Are you sure you want to delete this activity?`}
          onConfirm={() => remove(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
          confirmText="Delete"
        />
      )}
    </div>
  );
};
