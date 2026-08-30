import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const ProductDetails = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { user, isAdmin } = useAuth();
  const { showToast } = useNotification();
  
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Review submission state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchProductAndReviews = async () => {
    try {
      const prodRes = await axiosInstance.get(`/api/products/${id}`);
      if (prodRes.data && prodRes.data.success) {
        setProduct(prodRes.data.data);
      }

      // Fetch reviews
      const reviewRes = await axiosInstance.get(`/api/products/${id}/reviews`);
      if (reviewRes.data && reviewRes.data.success) {
        setReviews(reviewRes.data.data.content);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductAndReviews();
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      showToast('Please log in to add items.', 'warning');
      return;
    }
    setAdding(true);
    setSuccessMsg('');
    try {
      await addToCart(product.id, quantity);
      showToast(`Added ${quantity} item(s) to cart!`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to add items to cart', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setReviewError('Review comment cannot be empty');
      return;
    }
    setReviewError('');
    setReviewSuccess('');
    setSubmittingReview(true);

    try {
      const response = await axiosInstance.post(`/api/products/${id}/reviews`, {
        rating,
        comment,
      });
      if (response.data && response.data.success) {
        setReviewSuccess('Review submitted successfully!');
        setComment('');
        setRating(5);
        // Refresh product and reviews log
        fetchProductAndReviews();
      }
    } catch (err) {
      console.error(err);
      setReviewError(err.message || 'Only customers who purchased this product can leave a review.');
    } finally {
      setSubmittingReview(false);
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

  if (!product) {
    return (
      <div className="container py-5 text-center">
        <h3 className="fw-bold text-dark">Product Not Found</h3>
        <p className="text-muted">The requested product could not be loaded.</p>
        <Link to="/" className="btn btn-primary rounded-pill px-4">Back to Shop</Link>
      </div>
    );
  }

  return (
    <div className="container py-5">
      {/* Success alert message overlay */}
      {successMsg && (
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1055 }}>
          <div className="alert alert-success border-0 shadow-lg d-flex align-items-center py-2 px-3 gap-2" role="alert" style={{ borderRadius: '8px' }}>
            <i className="bi bi-check-circle-fill text-success fs-5"></i>
            <span className="fw-semibold small">{successMsg}</span>
          </div>
        </div>
      )}

      {/* Back Link */}
      <Link to="/" className="btn btn-link text-decoration-none text-muted mb-4 p-0">
        <i className="bi bi-arrow-left me-2"></i>Back to Browse
      </Link>

      <div className="row g-5">
        {/* Left Column: Image Card */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm p-4 rounded-4 bg-white text-center d-flex align-items-center justify-content-center" style={{ minHeight: '380px' }}>
            <img
              src={product.imageUrl || 'https://via.placeholder.com/400x400?text=No+Image'}
              alt={product.name}
              className="img-fluid object-fit-contain"
              style={{ maxParentHeight: '400px', mixBlendMode: 'multiply' }}
            />
          </div>
        </div>

        {/* Right Column: Details */}
        <div className="col-md-6">
          <div className="d-flex flex-column justify-content-between h-100">
            <div>
              <span className="badge bg-light text-primary mb-2 px-3 py-2 small fw-semibold">
                {product.categoryName || 'General Tech'}
              </span>
              <h2 className="fw-bold text-dark mb-2">{product.name}</h2>
              
              {/* Ratings */}
              <div className="d-flex align-items-center mb-4 small text-warning">
                <i className="bi bi-star-fill me-1"></i>
                <span className="text-dark fw-bold fs-6 me-2">
                  {product.averageRating ? product.averageRating.toFixed(1) : '5.0'}
                </span>
                <span className="text-muted">
                  ({reviews.length} customer reviews)
                </span>
              </div>

              {/* Price */}
              <div className="mb-4">
                <span className="fs-2 fw-bold text-primary">₹{product.price.toFixed(2)}</span>
              </div>

              {/* Description */}
              <div className="mb-4">
                <h6 className="fw-bold text-dark">Description</h6>
                <p className="text-muted small">{product.description || 'This is a premium gadget curated for top-tier performance. Features excellent materials, sleek design elements, and reliable integration.'}</p>
              </div>

              {/* Stock Indicator */}
              <div className="mb-4">
                <h6 className="fw-bold text-dark">Availability</h6>
                {product.stock === 0 ? (
                  <span className="badge bg-danger rounded-pill px-3 py-2">Out of Stock</span>
                ) : (
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-success rounded-pill px-3 py-2">In Stock</span>
                    <span className="text-muted small">({product.stock} units available)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Add-to-cart operations */}
            {!isAdmin && product.stock > 0 && (
              <div className="card bg-light border-0 p-4 rounded-4 mt-3">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <label className="fw-bold small text-dark">Quantity:</label>
                  <div className="input-group" style={{ width: '130px' }}>
                    <button
                      className="btn btn-outline-secondary btn-sm bg-white"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <i className="bi bi-dash"></i>
                    </button>
                    <input
                      type="number"
                      className="form-control text-center bg-white border-0 text-dark small"
                      value={quantity}
                      readOnly
                    />
                    <button
                      className="btn btn-outline-secondary btn-sm bg-white"
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    >
                      <i className="bi bi-plus"></i>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={adding}
                  className="btn btn-gradient-primary w-100 py-3 fw-bold rounded-pill"
                >
                  {adding ? (
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  ) : (
                    <>
                      <i className="bi bi-cart-plus me-2"></i>Add to Cart
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Customer Reviews Logs & Submission form */}
      <div className="row mt-5 pt-5 border-top">
        {/* Review list */}
        <div className="col-lg-7">
          <h4 className="fw-bold text-dark mb-4">Customer Reviews</h4>
          {reviews.length === 0 ? (
            <div className="alert alert-light border text-muted small py-4 text-center">
              No reviews have been written for this product yet. Be the first to purchase and review!
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {reviews.map((rev) => (
                <div key={rev.id} className="card border-0 shadow-sm p-4 rounded-3 bg-white">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', fontSize: '14px', fontWeight: 'bold' }}>
                        {rev.userName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <h6 className="fw-bold text-dark mb-0 small">{rev.userName || 'Anonymous Client'}</h6>
                        <span className="text-muted fs-8">Posted on {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'recent'}</span>
                      </div>
                    </div>
                    {/* Stars */}
                    <div className="text-warning">
                      {[...Array(5)].map((_, i) => (
                        <i key={i} className={`bi ${i < rev.rating ? 'bi-star-fill' : 'bi-star'} me-1`}></i>
                      ))}
                    </div>
                  </div>
                  <p className="text-muted small mb-0 mt-2">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review submission Form */}
        {!isAdmin && user && (
          <div className="col-lg-5 ps-lg-5 mt-5 mt-lg-0">
            <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
              <h5 className="fw-bold text-dark mb-3">Write a Review</h5>
              
              {reviewError && (
                <div className="alert alert-danger border-0 small text-center py-2" role="alert" style={{ borderRadius: '8px' }}>
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>{reviewError}
                </div>
              )}

              {reviewSuccess && (
                <div className="alert alert-success border-0 small text-center py-2" role="alert" style={{ borderRadius: '8px' }}>
                  <i className="bi bi-check-circle-fill me-2"></i>{reviewSuccess}
                </div>
              )}

              <form onSubmit={handleReviewSubmit}>
                {/* Stars selector */}
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted d-block">Rating Score</label>
                  <div className="d-flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className="btn btn-link p-0 text-warning text-decoration-none"
                        style={{ fontSize: '24px' }}
                      >
                        <i className={`bi ${star <= rating ? 'bi-star-fill' : 'bi-star'}`}></i>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment area */}
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted">Your Feedback</label>
                  <textarea
                    rows="4"
                    className="form-control bg-light border-0 small"
                    placeholder="Tell us what you liked or disliked about this product..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="btn btn-gradient-primary w-100 py-2 rounded-pill small fw-semibold"
                >
                  {submittingReview ? (
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  ) : (
                    'Submit Review'
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
