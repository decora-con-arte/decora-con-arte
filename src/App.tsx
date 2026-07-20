import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { BuilderPage } from './pages/BuilderPage';
import { Layout } from './components/Layout';
import { MenuPage } from './pages/MenuPage';
import { CartPage } from './pages/CartPage';
import { LoginPage } from './pages/LoginPage';
import { AdminPage } from './pages/AdminPage';
import { AdminProductos } from './pages/admin/AdminProductos';

export function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<MenuPage />} />
            <Route path="/builder" element={<BuilderPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/productos" element={<AdminProductos />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </CartProvider>
  );
}