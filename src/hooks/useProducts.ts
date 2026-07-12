import { useState, useEffect } from 'react';
import type { AdminProduct, AdminCategory } from '../types';
import { getApiUrl } from '../lib/api';

interface GroupedProducts {
  [categoryName: string]: AdminProduct[];
}

export function useProducts() {
  const [grouped, setGrouped] = useState<GroupedProducts>({});
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(getApiUrl('/api/products')).then(r => r.json()),
      fetch(getApiUrl('/api/categories')).then(r => r.json()),
    ])
      .then(([products, cats]: [AdminProduct[], AdminCategory[]]) => {
        const active = products.filter(p => p.active);
        const groups: GroupedProducts = {};
        active.forEach(p => {
          const cat = p.categoryName || 'Other';
          if (!groups[cat]) groups[cat] = [];
          groups[cat].push(p);
        });
        setGrouped(groups);
        setCategories(cats.filter(c => c.active));
      })
      .catch(err => console.error('Failed to load data:', err))
      .finally(() => setLoading(false));
  }, []);

  return { grouped, categories, loading };
}
