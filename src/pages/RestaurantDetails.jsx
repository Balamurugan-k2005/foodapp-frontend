import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const RestaurantDetails = () => {
  const { id } = useParams();
  const { addToCart, cart, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [restaurant, setRestaurant] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [filteredDishes, setFilteredDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [addingId, setAddingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState({});
  const [wishlistIds, setWishlistIds] = useState([]);

  const loadRestaurantData = async () => {
    setLoading(true);
    try {
      // Fetch restaurant by ID and products for that restaurant in parallel
      const [restRes, menuRes] = await Promise.all([
        axiosInstance.get(`/api/restaurants/${id}`),
        axiosInstance.get('/api/products', { params: { restaurantId: id, size: 100 } })
      ]);

      if (restRes.data && restRes.data.success) {
        setRestaurant(restRes.data.data);
      }
      if (menuRes.data && menuRes.data.success) {
        const content = menuRes.data.data.content || [];
        setDishes(content);
        setFilteredDishes(content);
      }

      if (user) {
        const wishlistRes = await axiosInstance.get('/api/wishlist');
        if (wishlistRes.data && wishlistRes.data.success) {
          setWishlistIds(wishlistRes.data.data.products.map((p) => p.id));
        }
      }
    } catch (err) {
      console.error('Failed to load restaurant details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWishlist = async (dishId) => {
    if (!user) {
      showToast('Please log in to add items to your favorites.', 'warning');
      return;
    }
    try {
      const res = await axiosInstance.post(`/api/wishlist/${dishId}`);
      if (res.data && res.data.success) {
        setWishlistIds(res.data.data.products.map((p) => p.id));
        showToast('Favorites updated!', 'success');
      }
    } catch (err) {
      console.error('Failed to toggle wishlist:', err);
    }
  };

  useEffect(() => {
    loadRestaurantData();
  }, [id]);

  useEffect(() => {
    let result = dishes;
    if (searchQuery.trim()) {
      result = result.filter(
        (dish) =>
          dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (dish.description && dish.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    if (selectedCategory !== 'All') {
      result = result.filter((dish) => dish.categoryName === selectedCategory);
    }
    setFilteredDishes(result);
  }, [searchQuery, selectedCategory, dishes]);

  const handleAddToCart = async (dishId, dishName) => {
    if (!user) {
      showToast('Please log in to add items to your cart.', 'warning');
      return;
    }
    setAddingId(dishId);
    try {
      await addToCart(dishId, 1);
      showToast(`${dishName} added to cart!`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to add item to cart', 'error');
    } finally {
      setAddingId(null);
    }
  };

  // Get distinct categories in this restaurant's menu
  const menuCategories = ['All', ...new Set(dishes.map((d) => d.categoryName).filter(Boolean))];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="container text-center py-5">
        <i className="bi bi-exclamation-triangle text-warning display-1"></i>
        <h3 className="fw-bold mt-3">Restaurant Not Found</h3>
        <p className="text-muted">The restaurant you are looking for does not exist or has been removed.</p>
        <Link to="/" className="btn btn-primary rounded-pill px-4">
          Go Back Home
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Restaurant Hero Banner */}
      <div
        className="position-relative text-white py-5 d-flex align-items-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${restaurant.imageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '300px',
        }}
      >
        <div className="container">
          <div className="row">
            <div className="col-lg-8">
              <span className="badge bg-primary mb-2 py-2 px-3 rounded-pill text-uppercase tracking-wider small fw-bold">
                {restaurant.cuisineType}
              </span>
              <h1 className="display-4 fw-extrabold">{restaurant.name}</h1>
              <p className="lead opacity-90 fs-6 mb-4">{restaurant.description}</p>
              
              <div className="d-flex flex-wrap gap-4 align-items-center bg-dark bg-opacity-25 p-3 rounded-3" style={{ maxWidth: 'fit-content' }}>
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-star-fill text-warning fs-5"></i>
                  <span className="fw-bold fs-5">4.5</span>
                  <span className="opacity-75 small">(150+ ratings)</span>
                </div>
                <div className="vr bg-light"></div>
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-clock-history fs-5"></i>
                  <span className="fw-bold fs-5">{restaurant.deliveryTime || 30} mins</span>
                </div>
                <div className="vr bg-light"></div>
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-currency-rupee fs-5"></i>
                  <span className="fw-bold fs-5">₹{restaurant.averagePrice?.toFixed(0) || '150'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Menu Section */}
      <div className="container py-5">
        <div className="row g-4">
          
          {/* Menu Sidebar Filters */}
          <div className="col-lg-3">
            <div className="card border-0 shadow-sm p-4 rounded-3 sticky-lg-top" style={{ top: '100px', zIndex: 10 }}>
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-list-stars text-primary"></i>Menu Categories
              </h5>
              
              <div className="d-flex flex-column gap-2">
                {menuCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`btn text-start py-2 px-3 rounded-3 border-0 small fw-semibold transition-all ${
                      selectedCategory === cat
                        ? 'btn-primary text-white shadow-sm'
                        : 'btn-light text-dark hover-bg-light'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Menu Input */}
              <div className="mt-4">
                <label className="form-label small fw-semibold text-muted">Search Food Item</label>
                <div className="input-group">
                  <span className="input-group-text border-0 bg-light"><i className="bi bi-search text-muted"></i></span>
                  <input
                    type="text"
                    className="form-control border-0 bg-light py-2 rounded-end-3 text-dark small"
                    placeholder="Search dishes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dishes List Section */}
          <div className="col-lg-9">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <h3 className="fw-bold mb-0">Popular Dishes</h3>
              <span className="text-muted small fw-semibold bg-light px-3 py-1 rounded-pill">
                Showing {filteredDishes.length} items
              </span>
            </div>

            {filteredDishes.length === 0 ? (
              <div className="card border-0 shadow-sm text-center py-5 rounded-3">
                <div className="card-body">
                  <i className="bi bi-egg-fried text-muted display-1"></i>
                  <h4 className="fw-bold mt-3 text-dark">No Dishes Found</h4>
                  <p className="text-muted small">No items match your selected filters or search query.</p>
                </div>
              </div>
            ) : (
              <div className="d-flex flex-column gap-4">
                {filteredDishes.map((dish) => (
                  <div key={dish.id} className="card border-0 shadow-sm rounded-3 overflow-hidden hover-card p-3">
                    <div className="row g-3 align-items-center">
                      
                      {/* Dish Image */}
                      <div className="col-md-3 position-relative">
                        <div
                          className="rounded-3"
                          style={{
                            height: '140px',
                            backgroundImage: `url(${dish.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80'})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        ></div>
                        {user && (
                          <button
                            onClick={() => handleToggleWishlist(dish.id)}
                            className="btn btn-light rounded-circle position-absolute end-0 top-0 m-2 shadow-sm border-0 transition-all d-flex align-items-center justify-content-center"
                            style={{ 
                              zIndex: 5,
                              color: wishlistIds.includes(dish.id) ? '#e53935' : '#757575',
                              width: '32px',
                              height: '32px'
                            }}
                            title="Toggle favorite"
                          >
                            <i className={wishlistIds.includes(dish.id) ? "bi bi-heart-fill fs-6" : "bi bi-heart fs-6"}></i>
                          </button>
                        )}
                      </div>

                      {/* Dish Details */}
                      <div className="col-md-6">
                        <span className="badge bg-light text-primary rounded-pill px-2 py-1 mb-2 small fw-semibold border border-primary border-opacity-10">
                          {dish.categoryName}
                        </span>
                        <h5 className="fw-bold mb-1 text-dark">{dish.name}</h5>
                        <p className="text-muted small mb-0" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {dish.description}
                        </p>
                      </div>

                      {/* Price & Add Button */}
                      <div className="col-md-3 text-md-end d-flex flex-row flex-md-column justify-content-between align-items-center gap-3">
                        <div className="text-start text-md-end">
                          <span className="d-block small text-muted">Price</span>
                          <span className="fs-4 fw-extrabold text-primary">₹{dish.price?.toFixed(2)}</span>
                        </div>
                        
                        {(() => {
                          const cartItem = cart?.items?.find((item) => item.productId === dish.id);
                          if (!cartItem) {
                            return (
                              <button
                                onClick={() => handleAddToCart(dish.id, dish.name)}
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
                                      removeFromCart(dish.id);
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
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default RestaurantDetails;
