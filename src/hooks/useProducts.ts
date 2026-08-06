import { useState, useEffect } from 'react';
import type { AdminProduct, AdminCategory } from '../types';
import { getApiUrl } from '../lib/api';

interface GroupedProducts {
  [categoryName: string]: AdminProduct[];
}

let memoryCategories: AdminCategory[] = [];
let memoryGrouped: GroupedProducts = {};

try {
  const savedCats = localStorage.getItem('tdp_cached_categories');
  if (savedCats) memoryCategories = JSON.parse(savedCats);
} catch {
  // ignore json parse error
}

export function useProducts() {
  const [grouped, setGrouped] = useState<GroupedProducts>(memoryGrouped);
  const [categories, setCategories] = useState<AdminCategory[]>(memoryCategories);
  const [loading, setLoading] = useState(memoryCategories.length === 0);

  useEffect(() => {
    Promise.all([
      fetch(getApiUrl('/api/products')).then(r => (r.ok ? r.json() : [])).catch(() => []),
      fetch(getApiUrl('/api/categories')).then(r => (r.ok ? r.json() : [])).catch(() => []),
    ])
      .then(([products, cats]: [AdminProduct[], AdminCategory[]]) => {
        if (Array.isArray(products)) {
          const active = products.filter(p => p?.active);
          const groups: GroupedProducts = {};
          active.forEach(p => {
            const cat = p.categoryName || 'Other';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(p);
          });
          memoryGrouped = groups;
          setGrouped(groups);
        }

        if (Array.isArray(cats) && cats.length > 0) {
          const activeCats = cats.filter(c => c?.active);
          memoryCategories = activeCats;
          setCategories(activeCats);
          try {
            localStorage.setItem('tdp_cached_categories', JSON.stringify(activeCats));
          } catch {
            // ignore storage quota error
          }
        }
      })
      .catch(err => console.error('Failed to load data:', err))
      .finally(() => setLoading(false));
  }, []);

  return { grouped, categories, loading };
}
