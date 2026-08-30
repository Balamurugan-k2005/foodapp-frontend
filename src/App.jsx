import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import BrowseProducts from './pages/BrowseProducts';
import ProductDetails from './pages/ProductDetails';
import RestaurantDetails from './pages/RestaurantDetails';
import Wishlist from './pages/Wishlist';
import Login from './pages/Login';
import Register from './pages/Register';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import UserProfile from './pages/UserProfile';
import AdminDashboard from './pages/admin/AdminDashboard';
import OwnerDashboard from './pages/owner/OwnerDashboard';

function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <NotificationProvider>
      <AuthProvider>
        <CartProvider>
        <Router>
          <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
            {/* Navbar with Cart Open click trigger */}
            <Navbar onCartOpen={() => setIsCartOpen(true)} />
            
            {/* Slide-out Cart Drawer Overlay */}
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

            {/* Router Main Viewport */}
            <main className="flex-grow-1">
              <Routes>
                {/* Public Paths */}
                <Route path="/" element={<BrowseProducts />} />
                <Route path="/restaurants/:id" element={<RestaurantDetails />} />
                <Route path="/products/:id" element={<ProductDetails />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Customer Secured Paths */}
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <Orders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/wishlist"
                  element={
                    <ProtectedRoute>
                      <Wishlist />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <UserProfile />
                    </ProtectedRoute>
                  }
                />

                {/* Administrator Console Paths */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/owner"
                  element={
                    <ProtectedRoute ownerOnly={true}>
                      <OwnerDashboard />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>

            {/* Footer */}
            <footer className="bg-white border-top py-4 text-center mt-5">
              <div className="container text-muted small">
                &copy; {new Date().getFullYear()} BiteSpeed Inc. All rights reserved. Made with Spring Boot 3, React, and Bootstrap.
              </div>
            </footer>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  </NotificationProvider>
);
}

export default App;
