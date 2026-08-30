import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const Wishlist = () => {
  const { cart, addToCart, updateQuantity, removeFromCart: removeCartItem } = useCart();
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);

  const fetchWishlist = async () => {
    try {
      const res = await axiosInstance.get('/api/wishlist');
      if (res.data && res.data.success) {
        setWishlistProducts(res.data.data.products || []);
      }
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemoveFromWishlist = async (productId) => {
    try {
      const res = await axiosInstance.post(`/api/wishlist/${productId}`);
      if (res.data && res.data.success) {
        setWishlistProducts(res.data.data.products || []);
        showToast('Removed from favorites.', 'info');
      }
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
      showToast('Failed to remove item from wishlist.', 'error');
    }
  };

  const handleAddToCart = async (productId) => {
    if (!user) {
      showToast('Please log in to add items.', 'warning');
      return;
    }
    setAddingId(productId);
    try {
      await addToCart(productId, 1);
      showToast('Added to cart!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to add item to cart', 'error');
    } finally {
      setAddingId(null);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h3 className="fw-extrabold text-dark mb-4 d-flex align-items-center gap-2">
        <i className="bi bi-heart-fill text-danger"></i>My Favorites
      </h3>

      {wishlistProducts.length === 0 ? (
        <div className="card border-0 shadow-sm text-center py-5 rounded-4">
          <div className="card-body">
            <i className="bi bi-heart text-muted display-1"></i>
            <h4 className="fw-bold mt-3 text-dark">Your Favorites is Empty</h4>
            <p className="text-muted small">Save your favorite dishes to order them quickly next time.</p>
            <Link to="/" className="btn btn-primary rounded-pill px-4 py-2 mt-2 fw-semibold">
              Browse Restaurants
            </Link>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {wishlistProducts.map((dish) => {
            const cartItem = cart?.items?.find((item) => item.productId === dish.id);
            return (
              <div key={dish.id} className="col-md-6 col-lg-4">
                <div className="card border-0 shadow-sm overflow-hidden hover-card h-100 p-3 position-relative">
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveFromWishlist(dish.id)}
                    className="btn btn-light rounded-circle position-absolute end-0 top-0 m-3 p-2 shadow-sm border-0 transition-all text-danger"
                    style={{ zIndex: 10 }}
                    title="Remove from favorites"
                  >
                    <i className="bi bi-heart-fill"></i>
                  </button>

                  {/* Dish Image */}
                  <div
                    className="rounded-3 mb-3"
                    style={{
                      height: '160px',
                      backgroundImage: `url(${dish.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  ></div>

                  {/* Info details */}
                  <div className="d-flex flex-column justify-content-between flex-grow-1">
                    <div>
                      <span className="badge bg-light text-primary rounded-pill px-2 py-1 mb-2 small fw-semibold">
                        {dish.categoryName}
                      </span>
                      <h5 className="fw-bold text-dark mb-1">{dish.name}</h5>
                      <p className="text-muted small mb-3" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {dish.description}
                      </p>
                    </div>

                    <div className="d-flex align-items-center justify-content-between border-top pt-3">
                      <div>
                        <span className="d-block small text-muted">Price</span>
                        <span className="fs-5 fw-extrabold text-primary">₹{dish.price?.toFixed(2)}</span>
                      </div>

                      {/* Real-world Add button */}
                      {(() => {
                        if (!cartItem) {
                          return (
                            <button
                              onClick={() => handleAddToCart(dish.id)}
                              disabled={addingId === dish.id}
                              className="btn btn-outline-success bg-white fw-extrabold rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-1 hover-bg-light transition-all"
                              style={{
                                color: '#2e7d32',
                                borderColor: '#a5d6a7',
                                borderWidth: '1.5px',
                                fontSize: '0.85rem',
                                minWidth: '95px',
                                height: '34px'
                              }}
                            >
                              {addingId === dish.id ? (
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                              ) : (
                                <>
                                  <span>ADD</span>
                                  <i className="bi bi-plus ms-1 text-success" style={{ fontSize: '0.75rem' }}></i>
                                </>
                              )}
                            </button>
                          );
                        } else {
                          return (
                            <div
                              className="d-flex align-items-center justify-content-between rounded-3 shadow-sm"
                              style={{
                                background: '#ffffff',
                                border: '1.5px solid #a5d6a7',
                                minWidth: '95px',
                                height: '34px',
                                fontSize: '0.85rem',
                                padding: '0 8px',
                              }}
                            >
                              <button
                                className="btn btn-sm text-success p-0 border-0 fw-extrabold"
                                style={{ width: '20px', height: '20px', lineHeight: '20px' }}
                                onClick={() => {
                                  if (cartItem.quantity > 1) {
                                    updateQuantity(dish.id, cartItem.quantity - 1);
                                  } else {
                                    removeCartItem(dish.id);
                                  }
                                }}
                              >
                                <i className="bi bi-dash"></i>
                              </button>
                              <span className="fw-bold text-success mx-2">{cartItem.quantity}</span>
                              <button
                                className="btn btn-sm text-success p-0 border-0 fw-extrabold"
                                style={{ width: '20px', height: '20px', lineHeight: '20px' }}
                                onClick={() => updateQuantity(dish.id, cartItem.quantity + 1)}
                              >
                                <i className="bi bi-plus"></i>
                              </button>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
