import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import './index.css';
import AppRoutes from './routes/AppRoutes';

import { initGA } from "./lib/analytics";

initGA();

// Reveal animations
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
      }
    });
  },
  { threshold: 0.1 }
);

const observeReveal = () => {
  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
};

observeReveal();

const mo = new MutationObserver(observeReveal);
mo.observe(document.body, {
  childList: true,
  subtree: true,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);