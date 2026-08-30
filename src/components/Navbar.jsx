import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = ({ onCartOpen }) => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light sticky-top glass-nav py-3">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center fw-bold text-dark fs-4" to="/">
          <i className="bi bi-bicycle text-primary me-2 fs-3"></i>
          <span>Bite<span className="text-primary">Speed</span></span>
        </Link>
        
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-4">
            <li className="nav-item">
              <Link className="nav-link text-dark fw-semibold" to="/">
                Browse Restaurants
              </Link>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-3">
            {isAuthenticated ? (
              <>
                {!isAdmin && user.role !== 'RESTAURANT_OWNER' && (
                  <>
                    <Link to="/wishlist" className="btn btn-light rounded-circle position-relative p-2" title="Wishlist">
                      <i className="bi bi-heart fs-5 text-danger"></i>
                    </Link>

                    <button
                      onClick={onCartOpen}
                      className="btn btn-light rounded-circle position-relative p-2"
                      title="Cart"
                    >
                      <i className="bi bi-cart3 fs-5 text-dark"></i>
                      {itemCount > 0 && (
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary fs-9">
                          {itemCount}
                        </span>
                      )}
                    </button>
                  </>
                )}

                <div className="dropdown">
                  <button
                    className="btn btn-light dropdown-toggle d-flex align-items-center gap-2 rounded-pill px-3"
                    type="button"
                    id="userDropdown"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="bi bi-person-circle fs-5 text-primary"></i>
                    <span className="fw-semibold small">{user.name || user.email}</span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end border-0 shadow-lg mt-2 p-2" aria-labelledby="userDropdown">
                    {isAdmin ? (
                      <li>
                        <Link className="dropdown-item rounded" to="/admin">
                          <i className="bi bi-speedometer2 me-2"></i>Admin Dashboard
                        </Link>
                      </li>
                    ) : user.role === 'RESTAURANT_OWNER' ? (
                      <>
                        <li>
                          <Link className="dropdown-item rounded" to="/owner">
                            <i className="bi bi-speedometer2 me-2"></i>Owner Dashboard
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item rounded" to="/profile">
                            <i className="bi bi-person me-2"></i>My Profile
                          </Link>
                        </li>
                      </>
                    ) : (
                      <>
                        <li>
                          <Link className="dropdown-item rounded" to="/profile">
                            <i className="bi bi-person me-2"></i>My Profile
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item rounded" to="/orders">
                            <i className="bi bi-box-seam me-2"></i>My Orders
                          </Link>
                        </li>
                      </>
                    )}
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button onClick={handleLogout} className="dropdown-item rounded text-danger" type="button">
                        <i className="bi bi-box-arrow-right me-2"></i>Logout
                      </button>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="d-flex gap-2">
                <Link to="/login" className="btn btn-light rounded-pill px-4 fw-semibold text-dark">
                  Log In
                </Link>
                <Link to="/register" className="btn btn-gradient-primary rounded-pill px-4 fw-semibold">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
