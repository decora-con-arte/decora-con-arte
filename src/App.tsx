import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { BuilderPage } from './pages/BuilderPage';
import { Layout } from './components/Layout';
import { MenuPage } from './pages/MenuPage';
import { CartPage } from './pages/CartPage';

export function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<MenuPage />} />
            <Route path="/builder" element={<BuilderPage />} />
            <Route path="/cart" element={<CartPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </CartProvider>
  );
}