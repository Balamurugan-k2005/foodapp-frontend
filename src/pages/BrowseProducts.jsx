import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

const CATEGORY_ICONS = {
  'biryani': '🍛',
  'pizza': '🍕',
  'burger': '🍔',
  'south-indian': '🫓',
  'desserts': '🍰',
  'beverages': '🥤',
  'default': '🍽️'
};

const BrowseProducts = () => {
  const { user } = useAuth();

  // Restaurants and Categories states
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search & Filtering states
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('All');

  // Debouncing Search Input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Load Categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await axiosInstance.get('/api/categories');
        if (res.data && res.data.success) {
          setCategories(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
  }, []);

  // Fetch Restaurants
  useEffect(() => {
    const loadRestaurants = async () => {
      setLoading(true);
      try {
        const params = {
          size: 20
        };
        if (debouncedSearch) {
          params.search = debouncedSearch;
        }
        const res = await axiosInstance.get('/api/restaurants', { params });
        if (res.data && res.data.success) {
          let content = res.data.data.content || [];
          // If a category category slug is selected (and not 'All'), we filter the restaurants locally or fetch.
          // Since restaurants have a list of products (menu), let's filter restaurants that offer dishes in this category.
          // In BiteSpeed ReactNative search handles category filtering by slug, but here we can filter by cuisine type or locally!
          if (selectedCategorySlug !== 'All') {
            content = content.filter(r => 
              r.cuisineType.toLowerCase().includes(selectedCategorySlug.toLowerCase())
            );
          }
          setRestaurants(content);
        }
      } catch (err) {
        console.error('Failed to load restaurants:', err);
      } finally {
        setLoading(false);
      }
    };
    loadRestaurants();
  }, [debouncedSearch, selectedCategorySlug]);

  return (
    <div className="container py-4">
      
      {/* Delivering to section */}
      <div className="d-flex align-items-center justify-content-between mb-4 bg-white p-3 rounded-3 shadow-sm border border-light">
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-geo-alt-fill text-primary fs-4"></i>
          <div>
            <span className="d-block small text-muted fw-semibold">DELIVER TO</span>
            <span className="fw-bold text-dark">
              {user ? 'Home - 123 Grand Avenue, NY' : 'Guest - Log in to select address'}
            </span>
          </div>
        </div>
        {user && (
          <Link to="/profile" className="btn btn-light rounded-pill px-3 py-1 text-primary small fw-semibold">
            Change
          </Link>
        )}
      </div>

      {/* Offer Banner */}
      <div className="p-4 rounded-3 text-white mb-5 shadow-sm d-flex align-items-center justify-content-between" 
           style={{ background: 'linear-gradient(135deg, #e53935 0%, #ff6b6b 100%)' }}>
        <div>
          <h2 className="fw-extrabold mb-1">50% OFF</h2>
          <p className="mb-2 opacity-90">Get yummy deals on your favorite meals</p>
          <span className="bg-dark bg-opacity-25 px-3 py-1 rounded small fw-bold">Use code: WELCOME10</span>
        </div>
        <span style={{ fontSize: '4.5rem' }}>🍕</span>
      </div>

      {/* Categories Horizontal Scroll */}
      <div className="mb-5">
        <h4 className="fw-bold text-dark mb-4">What's on your mind?</h4>
        <div className="d-flex gap-3 overflow-auto pb-2 scrollbar-none" style={{ scrollSnapType: 'x mandatory' }}>
          
          {/* All chip */}
          <button
            onClick={() => setSelectedCategorySlug('All')}
            className={`d-flex flex-column align-items-center gap-2 p-3 rounded-3 border-0 transition-all text-center`}
            style={{ 
              minWidth: '90px', 
              background: selectedCategorySlug === 'All' ? '#ffebee' : '#ffffff',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
            }}
          >
            <div className="d-flex align-items-center justify-content-center bg-light rounded-circle shadow-sm" style={{ width: '50px', height: '50px' }}>
              <span className="fs-3">🍽️</span>
            </div>
            <span className="small fw-bold text-dark">All</span>
          </button>

          {categories.map((cat) => {
            const icon = CATEGORY_ICONS[cat.slug] || CATEGORY_ICONS['default'];
            const isSelected = selectedCategorySlug === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategorySlug(cat.slug)}
                className={`d-flex flex-column align-items-center gap-2 p-3 rounded-3 border-0 transition-all text-center`}
                style={{ 
                  minWidth: '90px', 
                  background: isSelected ? '#ffebee' : '#ffffff',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}
              >
                <div className="d-flex align-items-center justify-content-center bg-light rounded-circle shadow-sm" style={{ width: '50px', height: '50px' }}>
                  <span className="fs-3">{icon}</span>
                </div>
                <span className="small fw-bold text-dark">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <h4 className="fw-bold text-dark mb-0">Featured Restaurants</h4>
        
        {/* Search Input */}
        <div style={{ width: '100%', maxWidth: '350px' }}>
          <div className="input-group">
            <span className="input-group-text border-0 bg-white shadow-sm rounded-start-3"><i className="bi bi-search text-muted"></i></span>
            <input
              type="text"
              className="form-control border-0 bg-white shadow-sm py-2 rounded-end-3 text-dark small"
              placeholder="Search restaurants or cuisines..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Loading Spinner */}
      {loading && restaurants.length === 0 ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : restaurants.length === 0 ? (
        <div className="card border-0 shadow-sm text-center py-5 rounded-3">
          <div className="card-body">
            <i className="bi bi-shop-window text-muted display-1"></i>
            <h4 className="fw-bold mt-3 text-dark">No Restaurants Found</h4>
            <p className="text-muted small">No restaurants match your selection. Try searching something else.</p>
          </div>
        </div>
      ) : (
        /* Restaurants Grid */
        <div className="row g-4">
          {restaurants.map((rest) => (
            <div key={rest.id} className="col-md-6 col-lg-4">
              <Link to={`/restaurants/${rest.id}`} className="text-decoration-none">
                <div className="card border-0 shadow-sm overflow-hidden hover-card h-100">
                  {/* Restaurant Image */}
                  <div
                    className="position-relative"
                    style={{
                      height: '180px',
                      backgroundImage: `url(${rest.imageUrl || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=500&q=80'})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <span className="position-absolute bottom-0 start-0 m-3 badge bg-white text-dark py-2 px-3 rounded-pill shadow-sm d-flex align-items-center gap-1 fw-bold">
                      <i className="bi bi-clock text-primary"></i>
                      {rest.deliveryTime || 30} mins
                    </span>
                  </div>

                  {/* Card Info */}
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h5 className="fw-bold text-dark mb-0 text-truncate" style={{ maxWidth: '80%' }}>
                        {rest.name}
                      </h5>
                      <span className="badge bg-success py-1 px-2 rounded d-flex align-items-center gap-1 small fw-bold">
                        ⭐ 4.5
                      </span>
                    </div>

                    <p className="text-muted small text-truncate mb-3">{rest.cuisineType}</p>
                    
                    <div className="border-top pt-3 d-flex justify-content-between align-items-center text-muted small">
                      <span>Average Price</span>
                      <span className="fw-bold text-dark">₹{rest.averagePrice?.toFixed(0) || '150'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseProducts;
