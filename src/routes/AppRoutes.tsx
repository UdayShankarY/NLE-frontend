import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import App from '../App';
import ProductPage from '../pages/ProductPage';
import BookingRoutePage from '../pages/BookingRoutePage';
import OrderDetailsPage from '../pages/OrderDetailsPage.tsx';
import TermsPageRoute from '../pages/TermsPage';
import AdminPage from '../pages/AdminPage';
import WishlistPage from '../pages/WishlistPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import ProfilePage from '../pages/ProfilePage';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminRoute from '../components/AdminRoute';
import { ScrollToTop } from '../components/ScrollToTop';
import { trackPageView, trackSearch, trackViewItemList } from '../lib/analytics';

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
      const listName = subcategory ? `${category} - ${subcategory}` : category;
      trackViewItemList(listName);
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
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/category/:category" element={<App />} />
        <Route path="/category/:category/:subcategory" element={<App />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/booking/:id" element={<BookingRoutePage />} />
        <Route path="/orders/:id" element={<OrderDetailsPage />} />
        <Route path="/cart" element={<App />} />
        <Route path="/terms" element={<TermsPageRoute />} />
        <Route path="/privacy" element={<TermsPageRoute />} />
        <Route path="/refund" element={<TermsPageRoute />} />
        <Route path="/about" element={<TermsPageRoute />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="/admin/dashboard" element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="/admin/products" element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="/admin/addons" element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="/admin/activities" element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="/admin/categories" element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="/admin/orders" element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="/admin/bookings" element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="/admin/sliders" element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="/admin/terms" element={<AdminRoute><AdminPage /></AdminRoute>} />
      </Routes>
    </>
  );
}