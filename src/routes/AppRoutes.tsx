import { Routes, Route } from 'react-router-dom';
import App from '../App';
import ProductPage from '../pages/ProductPage';
import BookingRoutePage from '../pages/BookingRoutePage';
import TermsPageRoute from '../pages/TermsPage';
import AdminPage from '../pages/AdminPage';
import GoogleCallbackPage from '../pages/GoogleCallbackPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/product/:id" element={<ProductPage />} />
      <Route path="/booking/:id" element={<BookingRoutePage />} />
      <Route path="/cart" element={<App />} />
      <Route path="/terms" element={<TermsPageRoute />} />
      <Route path="/privacy" element={<TermsPageRoute />} />
      <Route path="/refund" element={<TermsPageRoute />} />
      <Route path="/about" element={<TermsPageRoute />} />
      <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/products" element={<AdminPage />} />
      <Route path="/admin/categories" element={<AdminPage />} />
      <Route path="/admin/users" element={<AdminPage />} />
      <Route path="/admin/orders" element={<AdminPage />} />
      <Route path="/admin/sliders" element={<AdminPage />} />
      <Route path="/admin/terms" element={<AdminPage />} />
    </Routes>
  );
}