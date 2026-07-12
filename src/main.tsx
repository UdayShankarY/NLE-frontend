import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Wire up reveal animations
const observer = new IntersectionObserver(
  (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); }),
  { threshold: 0.1 }
);
const observeReveal = () => {
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
};
observeReveal();
// Re-observe after React renders new elements
const mo = new MutationObserver(observeReveal);
mo.observe(document.body, { childList: true, subtree: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
