import React from 'react';
import { MOST_BOOKED } from './data';

export const DebugProducts = () => {
  console.log('Products loaded:', MOST_BOOKED);
  console.log('Product count:', MOST_BOOKED.length);
  
  return (
    <div style={{ padding: '20px', background: '#f0f0f0', margin: '20px' }}>
      <h2>Debug: Products</h2>
      <p>Total products: {MOST_BOOKED.length}</p>
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
        {MOST_BOOKED.map((p, i) => (
          <div key={i} style={{ 
            minWidth: '200px', 
            background: 'white', 
            padding: '10px',
            border: '1px solid #ccc'
          }}>
            <img src={p.img} alt={p.title} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
            <h4>{p.title}</h4>
            <p>{p.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
