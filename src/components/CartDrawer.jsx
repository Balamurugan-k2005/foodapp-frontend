import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const CartDrawer = ({ isOpen, onClose }) => {
  const { cart, updateQuantity, removeFromCart, itemCount } = useCart();
  const navigate = useNavigate();

  const handleCheckoutRedirect = () => {
    onClose();
    navigate('/checkout');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="modal-backdrop fade show" onClick={onClose} style={{ zIndex: 1040 }}></div>

      {/* Drawer */}
      <div
        className="offcanvas offcanvas-end show"
        tabIndex="-1"
        style={{ zIndex: 1045, visibility: 'visible', width: '100%', maxWidth: '400px' }}
        aria-labelledby="cartDrawerLabel"
      >
        <div className="offcanvas-header border-bottom py-3">
          <h5 className="offcanvas-title fw-bold d-flex align-items-center gap-2" id="cartDrawerLabel">
            <i className="bi bi-cart3 text-primary"></i>My Cart
            <span className="badge bg-light text-primary rounded-pill small">{itemCount} items</span>
          </h5>
          <button type="button" className="btn-close text-reset" onClick={onClose} aria-label="Close"></button>
        </div>

        <div className="offcanvas-body d-flex flex-column justify-content-between p-0 bg-light">
          {/* Scrollable list */}
          <div className="flex-grow-1 overflow-auto p-3" style={{ maxHeight: 'calc(100vh - 180px)' }}>
            {!cart || !cart.items || cart.items.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-cart-x text-muted display-3"></i>
                <h5 className="fw-bold text-dark mt-3">Your Cart is Empty</h5>
                <p className="text-muted small">Add premium items to get started.</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {cart.items.map((item) => (
                  <div key={item.id} className="card border-0 shadow-sm p-3 rounded-3 bg-white">
                    <div className="d-flex gap-3 align-items-center">
                      {/* Image */}
                      <div className="bg-light rounded-3 p-2 text-center" style={{ width: '70px', height: '70px', overflow: 'hidden' }}>
                        <img
                          src={item.productImageUrl || 'https://via.placeholder.com/100x100?text=No+Image'}
                          alt={item.productName}
                          className="img-fluid h-100 object-fit-contain"
                        />
                      </div>

                      {/* Info & Quantity controls */}
                      <div className="flex-grow-1">
                        <h6 className="fw-bold text-dark mb-1 small text-truncate" style={{ maxWidth: '180px' }}>
                          {item.productName}
                        </h6>
                        <span className="text-primary fw-bold small d-block mb-2">₹{item.productPrice.toFixed(2)}</span>
                        
                        <div className="d-flex align-items-center justify-content-between">
                          {/* Decrement / Increment */}
                          <div
                            className="d-flex align-items-center justify-content-between rounded-3 shadow-sm"
                            style={{
                              background: '#ffffff',
                              border: '1.5px solid #a5d6a7',
                              width: '85px',
                              height: '30px',
                              fontSize: '0.85rem',
                              padding: '0 6px',
                            }}
                          >
                            <button
                              className="btn btn-sm text-success p-0 border-0 fw-extrabold d-flex align-items-center justify-content-center"
                              style={{ width: '20px', height: '20px' }}
                              onClick={() => {
                                if (item.quantity > 1) {
                                  updateQuantity(item.productId, item.quantity - 1);
                                } else {
                                  removeFromCart(item.productId);
                                }
                              }}
                            >
                              <i className="bi bi-dash"></i>
                            </button>
                            <span className="fw-bold text-success mx-1">{item.quantity}</span>
                            <button
                              className="btn btn-sm text-success p-0 border-0 fw-extrabold d-flex align-items-center justify-content-center"
                              style={{ width: '20px', height: '20px' }}
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            >
                              <i className="bi bi-plus"></i>
                            </button>
                          </div>

                          {/* Delete Item */}
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="btn btn-link text-danger p-0"
                            title="Remove"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Total & Checkout trigger */}
          {cart && cart.items && cart.items.length > 0 && (
            <div className="p-3 bg-white border-top shadow-lg">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <span className="fw-semibold text-muted small">Cart Subtotal:</span>
                <span className="fs-4 fw-bold text-dark">₹{cart.totalAmount.toFixed(2)}</span>
              </div>
              <button
                onClick={handleCheckoutRedirect}
                className="btn btn-gradient-primary w-100 py-3 fw-bold rounded-pill"
              >
                Proceed to Checkout
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
