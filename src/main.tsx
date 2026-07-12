import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { getRedirectResult } from 'firebase/auth';
import { auth } from './firebase';
import { AuthProvider } from './context/AuthContext';

import './index.css';
import AppRoutes from './routes/AppRoutes';
import { getApiUrl } from './lib/api';

const GoogleRedirectHandler: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        const firebaseUser = result?.user;

        if (!firebaseUser) return;

        const res = await fetch(getApiUrl('/api/auth/google'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            firstName: firebaseUser.displayName?.split(' ')[0] || '',
            lastName:
              firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
            photoURL: firebaseUser.photoURL || '',
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.msg || 'Google login failed');
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        window.location.replace('/');
      } catch (error) {
        console.error('Google redirect handling failed:', error);
      }
    };

    handleRedirect();
  }, [navigate]);

  return null;
};

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
        <GoogleRedirectHandler />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);