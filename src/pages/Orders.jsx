import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useNotification } from '../context/NotificationContext';

const Orders = () => {
  const { showToast, showConfirm } = useNotification();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchOrders = async () => {
    try {
      const res = await axiosInstance.get('/api/orders');
      if (res.data && res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch orders history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = (orderId) => {
    showConfirm('Are you sure you want to cancel this order? This will restock the items immediately.', async () => {
      setCancellingId(orderId);
      try {
        const res = await axiosInstance.put(`/api/orders/${orderId}/cancel`);
        if (res.data && res.data.success) {
          showToast('Order cancelled successfully!', 'success');
          // Update local state status
          setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o));
        }
      } catch (err) {
        showToast(err.message || 'Failed to cancel order.', 'error');
      } finally {
        setCancellingId(null);
      }
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'DELIVERED': return 'bg-success';
      case 'PENDING': return 'bg-warning text-dark';
      case 'SHIPPED': return 'bg-info text-white';
      case 'CONFIRMED': return 'bg-primary';
      case 'CANCELLED': return 'bg-secondary';
      default: return 'bg-light text-muted';
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5" style={{ maxWidth: '800px' }}>
      <h3 className="fw-bold text-dark mb-4">My Orders</h3>

      {orders.length === 0 ? (
        <div className="card border-0 shadow-sm p-5 text-center bg-white rounded-4">
          <i className="bi bi-box text-muted display-3 mb-3"></i>
          <h5 className="fw-bold">No Orders Placed Yet</h5>
          <p className="text-muted small">You haven't checked out any orders with us yet.</p>
          <a href="/" className="btn btn-gradient-primary rounded-pill px-4 align-self-center mt-2">Go to Shop</a>
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">
          {orders.map((order) => (
            <div key={order.id} className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
              {/* Card Header */}
              <div className="bg-light p-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
                <div>
                  <span className="text-muted small me-3">Order ID: <span className="fw-bold text-dark">#{order.id}</span></span>
                  <span className="text-muted small">Placed on: <span className="fw-semibold text-dark">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'recent'}</span></span>
                </div>
                <span className={`badge ${getStatusBadgeClass(order.status)} px-3 py-2 rounded-pill`}>
                  {order.status}
                </span>
              </div>

              {/* Items in order */}
              <div className="p-3">
                <div className="d-flex flex-column gap-2">
                  {order.items && order.items.map((item) => (
                    <div key={item.id} className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2">
                      <div className="d-flex align-items-center gap-3">
                        {/* Mock Thumb */}
                        <div className="bg-light rounded-3 p-1 text-center" style={{ width: '45px', height: '45px', overflow: 'hidden' }}>
                          <i className="bi bi-egg-fried text-primary fs-5"></i>
                        </div>
                        <div>
                          <h6 className="fw-bold text-dark mb-0 small">{item.productName}</h6>
                          <span className="text-muted fs-8">Quantity: {item.quantity} | Unit Price: ₹{item.priceAtPurchase.toFixed(2)}</span>
                        </div>
                      </div>
                      <span className="fw-bold text-dark small">₹{(item.priceAtPurchase * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="bg-white p-3 border-top d-flex justify-content-between align-items-center">
                <div>
                  <span className="text-muted small">Total Paid: </span>
                  <span className="fs-5 fw-bold text-primary">₹{order.totalAmount.toFixed(2)}</span>
                </div>

                {order.status === 'PENDING' && (
                  <button
                    onClick={() => handleCancelOrder(order.id)}
                    disabled={cancellingId === order.id}
                    className="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold"
                  >
                    {cancellingId === order.id ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                      'Cancel Order'
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
