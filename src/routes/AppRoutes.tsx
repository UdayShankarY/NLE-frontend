import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import App from '../App';
import ProductPage from '../pages/ProductPage';
import BookingRoutePage from '../pages/BookingRoutePage';
import TermsPageRoute from '../pages/TermsPage';
import AdminPage from '../pages/AdminPage';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import ProfilePage from '../pages/ProfilePage';
import { ScrollToTop } from '../components/ScrollToTop';
import { trackPageView, trackSearch, trackViewCategory } from '../lib/analytics';

function RouteAnalytics() {
  const location = useLocation();

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    trackPageView(path);

    const categoryMatch = location.pathname.match(/^\/category\/([^/]+)(?:\/([^/]+))?$/);
    if (categoryMatch) {
      const [, categorySegment, subcategorySegment] = categoryMatch;
      const category = decodeURIComponent(categorySegment);
      const subcategory = subcategorySegment ? decodeURIComponent(subcategorySegment) : null;
      trackViewCategory(subcategory ? `${category}/${subcategory}` : category);
    }

    const search = new URLSearchParams(location.search).get('search')?.trim();
    if (search) {
      trackSearch(search);
    }
  }, [location.pathname, location.search]);

  return null;
}

export default function AppRoutes() {
  return (
    <>
      <RouteAnalytics />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/category/:category" element={<App />} />
        <Route path="/category/:category/:subcategory" element={<App />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/booking/:id" element={<BookingRoutePage />} />
        <Route path="/cart" element={<App />} />
        <Route path="/terms" element={<TermsPageRoute />} />
        <Route path="/privacy" element={<TermsPageRoute />} />
        <Route path="/refund" element={<TermsPageRoute />} />
        <Route path="/about" element={<TermsPageRoute />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/dashboard" element={<AdminPage />} />
        <Route path="/admin/products" element={<AdminPage />} />
        <Route path="/admin/categories" element={<AdminPage />} />
        <Route path="/admin/users" element={<AdminPage />} />
        <Route path="/admin/orders" element={<AdminPage />} />
        <Route path="/admin/bookings" element={<AdminPage />} />
        <Route path="/admin/sliders" element={<AdminPage />} />
        <Route path="/admin/terms" element={<AdminPage />} />
      </Routes>
    </>
  );
}