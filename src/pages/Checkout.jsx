import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useCart } from '../context/CartContext';

const Checkout = () => {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();

  // Address selection states
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  
  // New address form states
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [country, setCountry] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [addressError, setAddressError] = useState('');

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  // Payment mock states
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Checkout process states
  const [processing, setProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');

  const loadAddresses = async () => {
    try {
      const res = await axiosInstance.get('/api/users/addresses');
      if (res.data && res.data.success) {
        setAddresses(res.data.data);
        // Auto select default address
        const def = res.data.data.find(a => a.default);
        if (def) {
          setSelectedAddressId(def.id);
        } else if (res.data.data.length > 0) {
          setSelectedAddressId(res.data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load shipping addresses:', err);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  // Calculate prices
  const subtotal = cart?.totalAmount || 0;
  let discountAmount = 0;
  if (appliedCoupon) {
    discountAmount = (subtotal * appliedCoupon.discountPercent) / 100;
  }
  const finalTotal = subtotal - discountAmount;

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponError('');
    setAppliedCoupon(null);

    try {
      const res = await axiosInstance.get(`/api/coupons/${couponCode.trim()}`);
      if (res.data && res.data.success) {
        const coupon = res.data.data;
        if (!coupon.active) {
          setCouponError('This coupon code is currently inactive.');
          return;
        }
        if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
          setCouponError(`Minimum order amount of ₹${coupon.minOrderAmount} is required for this coupon.`);
          return;
        }
        setAppliedCoupon(coupon);
      }
    } catch (err) {
      console.error(err);
      setCouponError('Invalid or expired coupon code.');
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!street || !city || !state || !pincode || !country) {
      setAddressError('Please fill in all address fields.');
      return;
    }
    setAddressError('');

    try {
      const res = await axiosInstance.post('/api/users/addresses', {
        street,
        city,
        state,
        pincode,
        country,
        default: isDefault
      });
      if (res.data && res.data.success) {
        const newAddress = res.data.data;
        setAddresses([...addresses, newAddress]);
        setSelectedAddressId(newAddress.id);
        setShowNewAddressForm(false);
        // Clear fields
        setStreet('');
        setCity('');
        setState('');
        setPincode('');
        setCountry('');
        setIsDefault(false);
      }
    } catch (err) {
      setAddressError(err.message || 'Failed to save address.');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setCheckoutError('Please select a shipping address.');
      return;
    }

    if (paymentMethod === 'CARD') {
      const cleanCardNum = cardNumber.replace(/\s+/g, '');
      const numRegex = /^\d+$/;

      if (!cleanCardNum) {
        setCheckoutError('Please enter your card number.');
        return;
      }
      if (!numRegex.test(cleanCardNum) || cleanCardNum.length < 15 || cleanCardNum.length > 16) {
        setCheckoutError('Invalid card number. Must be a 15 or 16-digit numeric card number.');
        return;
      }

      if (!cardExpiry.trim()) {
        setCheckoutError('Please enter your card expiry date.');
        return;
      }

      const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
      if (!expiryRegex.test(cardExpiry.trim())) {
        setCheckoutError('Invalid expiry date format. Please use MM/YY (e.g., 12/28).');
        return;
      }

      const [expMonth, expYear] = cardExpiry.split('/').map(Number);
      const now = new Date();
      const currentYear = now.getFullYear() % 100;
      const currentMonth = now.getMonth() + 1;
      if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        setCheckoutError('Card has expired. Please use a valid card.');
        return;
      }

      if (!cardCvv.trim()) {
        setCheckoutError('Please enter your card CVV.');
        return;
      }
      if (!/^\d{3,4}$/.test(cardCvv.trim())) {
        setCheckoutError('Invalid CVV. Must be a 3 or 4-digit CVV number.');
        return;
      }
    }

    setCheckoutError('');
    setProcessing(true);

    try {
      const payload = {
        addressId: selectedAddressId,
        couponCode: appliedCoupon ? appliedCoupon.code : null
      };

      const res = await axiosInstance.post('/api/orders', payload);
      if (res.data && res.data.success) {
        setOrderSuccess(res.data.data);
        clearCart();
      }
    } catch (err) {
      console.error(err);
      setCheckoutError(err.message || 'Place order request failed. Verify item stocks or coupon restrictions.');
    } finally {
      setProcessing(false);
    }
  };

  // If order matches success state, show order summary
  if (orderSuccess) {
    return (
      <div className="container py-5 text-center" style={{ maxWidth: '600px' }}>
        <div className="card border-0 shadow-lg p-5 rounded-4 bg-white">
          <i className="bi bi-patch-check text-success display-1 mb-3"></i>
          <h2 className="fw-bold text-dark">Order Confirmed!</h2>
          <p className="text-muted small">Your checkout completed successfully. Our team is packaging your items.</p>
          
          <div className="bg-light p-4 rounded-3 text-start my-4">
            <div className="d-flex justify-content-between mb-2 small">
              <span className="text-muted">Order ID:</span>
              <span className="fw-bold text-dark">#{orderSuccess.id}</span>
            </div>
            <div className="d-flex justify-content-between mb-2 small">
              <span className="text-muted">Current Status:</span>
              <span className="badge bg-warning text-dark">{orderSuccess.status}</span>
            </div>
            <div className="d-flex justify-content-between mb-2 small">
              <span className="text-muted">Total Charged:</span>
              <span className="fw-bold text-primary">₹{orderSuccess.totalAmount.toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between small">
              <span className="text-muted">Delivery Address:</span>
              <span className="fw-bold text-dark text-truncate" style={{ maxWidth: '220px' }}>
                {orderSuccess.addressStreet}, {orderSuccess.addressCity}
              </span>
            </div>
          </div>

          <div className="d-flex flex-column gap-2">
            <Link to="/orders" className="btn btn-gradient-primary py-3 rounded-pill fw-bold">
              Track My Orders
            </Link>
            <Link to="/" className="btn btn-outline-secondary py-2 rounded-pill small fw-semibold">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Redirect if cart empty
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="container py-5 text-center">
        <h3 className="fw-bold text-dark">Your Cart is Empty</h3>
        <p className="text-muted small">Add products to your cart before proceeding to checkout.</p>
        <Link to="/" className="btn btn-gradient-primary rounded-pill px-4">Browse Catalog</Link>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h2 className="fw-bold text-dark mb-4">Secure Checkout</h2>

      {checkoutError && (
        <div className="alert alert-danger border-0 small text-center mb-4 py-2" role="alert" style={{ borderRadius: '8px' }}>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>{checkoutError}
        </div>
      )}

      <div className="row g-5">
        {/* Left Column: Forms */}
        <div className="col-lg-7">
          {/* Step 1: Address selection */}
          <div className="card border-0 shadow-sm p-4 rounded-4 bg-white mb-4">
            <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <span className="badge bg-primary rounded-circle" style={{ width: '24px', height: '24px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
              <span>Shipping Address</span>
            </h5>

            {addresses.length > 0 ? (
              <div className="d-flex flex-column gap-2 mb-3">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`card p-3 border-2 rounded-3 cursor-pointer ${selectedAddressId === addr.id ? 'border-primary bg-light' : 'border-light'}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="form-check m-0">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="addressRadio"
                        id={`addr-${addr.id}`}
                        value={addr.id}
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                      />
                      <label className="form-check-label text-dark small" htmlFor={`addr-${addr.id}`}>
                        <span className="fw-bold">{addr.street}</span>, {addr.city}, {addr.state} - {addr.pincode}, {addr.country}
                        {addr.default && <span className="badge bg-light text-primary ms-2 small">Default</span>}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted small">No saved shipping addresses found. Register a new address below.</p>
            )}

            {!showNewAddressForm ? (
              <button
                onClick={() => setShowNewAddressForm(true)}
                className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-semibold align-self-start"
              >
                + Add New Address
              </button>
            ) : (
              <div className="border p-3 rounded-3 mt-3">
                <h6 className="fw-bold text-dark mb-3">New Delivery Address</h6>
                {addressError && <div className="alert alert-danger py-1 small">{addressError}</div>}
                
                <form onSubmit={handleAddAddress}>
                  <div className="mb-2">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Street Address"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      required
                    />
                  </div>
                  <div className="row g-2 mb-2">
                    <div className="col-6">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="City"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="State"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="row g-2 mb-2">
                    <div className="col-6">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Pincode"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="defaultCheck"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                    />
                    <label className="form-check-label small text-muted" htmlFor="defaultCheck">
                      Set as default shipping address
                    </label>
                  </div>
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary btn-sm rounded-pill px-3 fw-bold">Save Address</button>
                    <button type="button" onClick={() => setShowNewAddressForm(false)} className="btn btn-light btn-sm rounded-pill px-3">Cancel</button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Step 2: Payment options */}
          <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
            <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <span className="badge bg-primary rounded-circle" style={{ width: '24px', height: '24px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
              <span>Payment Details</span>
            </h5>

            <div className="mb-3">
              <div className="form-check form-check-inline me-4">
                <input
                  className="form-check-input"
                  type="radio"
                  id="payCard"
                  value="CARD"
                  checked={paymentMethod === 'CARD'}
                  onChange={() => setPaymentMethod('CARD')}
                />
                <label className="form-check-label text-dark small" htmlFor="payCard">Credit/Debit Card</label>
              </div>
              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  id="payCod"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                />
                <label className="form-check-label text-dark small" htmlFor="payCod">Cash on Delivery</label>
              </div>
            </div>

            {paymentMethod === 'CARD' && (
              <div className="bg-light p-3 rounded-3 mt-2">
                <div className="mb-3">
                  <label className="form-label small text-muted">Card Number</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="1234 5678 1234 5678"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />
                </div>
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label small text-muted">Expiry Date</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small text-muted">CVV</label>
                    <input
                      type="password"
                      className="form-control form-control-sm"
                      placeholder="123"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order summary & coupon */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm p-4 rounded-4 bg-white sticky-lg-top" style={{ top: '90px' }}>
            <h5 className="fw-bold text-dark mb-3">Order Summary</h5>
            
            {/* Items list */}
            <div className="d-flex flex-column gap-3 mb-4 max-height-300" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {cart.items.map((item) => (
                <div key={item.id} className="d-flex justify-content-between align-items-center border-bottom pb-2">
                  <div>
                    <span className="fw-semibold text-dark small text-truncate d-inline-block" style={{ maxWidth: '180px' }}>
                      {item.productName}
                    </span>
                    <span className="text-muted small ms-2">x{item.quantity}</span>
                  </div>
                  <span className="fw-bold text-dark small">₹{(item.productPrice * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Coupon Application Form */}
            <form onSubmit={handleApplyCoupon} className="mb-4">
              <label className="form-label small fw-semibold text-muted">Have a Coupon?</label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control bg-light border-0 py-2 small"
                  placeholder="Promo Code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={!!appliedCoupon}
                />
                {appliedCoupon ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponCode('');
                    }}
                    className="btn btn-outline-danger px-3 py-2 small fw-semibold"
                  >
                    Clear
                  </button>
                ) : (
                  <button type="submit" className="btn btn-primary px-3 py-2 small fw-semibold">
                    Apply
                  </button>
                )}
              </div>
              {couponError && <p className="text-danger small mt-1">{couponError}</p>}
              {appliedCoupon && (
                <p className="text-success small mt-1">
                  <i className="bi bi-tag-fill me-1"></i>Coupon Applied: {appliedCoupon.discountPercent}% Discount!
                </p>
              )}
            </form>

            {/* Calculations Breakdown */}
            <div className="d-flex flex-column gap-2 mb-4 border-top pt-3">
              <div className="d-flex justify-content-between small text-muted">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="d-flex justify-content-between small text-success">
                  <span>Discount:</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="d-flex justify-content-between small text-muted">
                <span>Shipping:</span>
                <span className="text-success">FREE</span>
              </div>
              <div className="d-flex justify-content-between border-top pt-2">
                <span className="fw-bold text-dark">Total:</span>
                <span className="fs-4 fw-bold text-primary">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={processing || !selectedAddressId}
              className="btn btn-gradient-primary w-100 py-3 fw-bold rounded-pill"
            >
              {processing ? (
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              ) : (
                'Place Order'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
