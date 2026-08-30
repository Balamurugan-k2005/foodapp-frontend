import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const OwnerDashboard = () => {
  const { user } = useAuth();
  const { showToast, showConfirm } = useNotification();
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tabs: 'orders', 'menu'
  const [activeTab, setActiveTab] = useState('orders');
  // Order subtabs: 'active', 'completed'
  const [orderSubTab, setOrderSubTab] = useState('active');

  // Menu item Form State
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [dName, setDName] = useState('');
  const [dDescription, setDDescription] = useState('');
  const [dPrice, setDPrice] = useState('');
  const [dStock, setDStock] = useState('100');
  const [dImageUrl, setDImageUrl] = useState('');
  const [dCategoryId, setDCategoryId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadOwnerDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch restaurant by owner
      const restRes = await axiosInstance.get('/api/restaurants/owner');
      if (restRes.data && restRes.data.success) {
        const rest = restRes.data.data;
        setRestaurant(rest);

        // 2. Fetch orders
        const ordersRes = await axiosInstance.get('/api/owner/orders');
        if (ordersRes.data && ordersRes.data.success) {
          setOrders(ordersRes.data.data || []);
        }

        // 3. Fetch dishes/products for this restaurant
        const dishesRes = await axiosInstance.get('/api/products', {
          params: { restaurantId: rest.id, size: 100 }
        });
        if (dishesRes.data && dishesRes.data.success) {
          setDishes(dishesRes.data.data.content || []);
        }
      }

      // 4. Fetch food categories
      const categoriesRes = await axiosInstance.get('/api/categories');
      if (categoriesRes.data && categoriesRes.data.success) {
        setCategories(categoriesRes.data.data || []);
        if (categoriesRes.data.data.length > 0) {
          setDCategoryId(categoriesRes.data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load owner dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOwnerDashboardData();
  }, []);

  const handleUpdateOrderStatus = async (orderId, nextStatus) => {
    try {
      const res = await axiosInstance.put(`/api/owner/orders/${orderId}/status?status=${nextStatus}`);
      if (res.data && res.data.success) {
        setOrders(orders.map(o => o.id === orderId ? res.data.data : o));
        showToast('Order status updated successfully!', 'success');
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      showToast('Failed to update order status', 'error');
    }
  };

  const openDishForm = (dish = null) => {
    setEditingDish(dish);
    if (dish) {
      setDName(dish.name);
      setDDescription(dish.description || '');
      setDPrice(dish.price.toString());
      setDStock(dish.stock.toString());
      setDImageUrl(dish.imageUrl || '');
      // Try to find category ID in category list
      const matchedCat = categories.find(c => c.name === dish.categoryName || c.slug === dish.categoryName);
      setDCategoryId(matchedCat?.id || categories[0]?.id || '');
    } else {
      setDName('');
      setDDescription('');
      setDPrice('');
      setDStock('100');
      setDImageUrl('');
      setDCategoryId(categories[0]?.id || '');
    }
    setShowMenuForm(true);
  };

  const handleSaveDish = async (e) => {
    e.preventDefault();
    if (!dName || !dPrice || !dCategoryId) {
      showToast('Please fill in all required fields.', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: dName.trim(),
        description: dDescription.trim(),
        price: parseFloat(dPrice),
        stock: parseInt(dStock),
        imageUrl: dImageUrl.trim(),
        categoryId: parseInt(dCategoryId),
        restaurantId: restaurant.id
      };

      if (editingDish) {
        const res = await axiosInstance.put(`/api/products/${editingDish.id}`, payload);
        if (res.data && res.data.success) {
          setDishes(dishes.map(d => d.id === editingDish.id ? res.data.data : d));
          showToast('Menu item updated successfully.', 'success');
        }
      } else {
        const res = await axiosInstance.post('/api/products', payload);
        if (res.data && res.data.success) {
          setDishes([res.data.data, ...dishes]);
          showToast('New dish added to menu successfully.', 'success');
        }
      }
      setShowMenuForm(false);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to save menu item.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDish = (dishId) => {
    showConfirm('Are you sure you want to delete this item?', async () => {
      try {
        const res = await axiosInstance.delete(`/api/products/${dishId}`);
        if (res.data && res.data.success) {
          setDishes(dishes.filter(d => d.id !== dishId));
          showToast('Item removed from menu.', 'success');
        }
      } catch (err) {
        console.error(err);
        showToast('Failed to delete item.', 'error');
      }
    });
  };

  // Group orders
  const activeOrders = orders.filter(o => !['DELIVERED', 'CANCELLED', 'REJECTED'].includes(o.status));
  const completedOrders = orders.filter(o => ['DELIVERED', 'CANCELLED', 'REJECTED'].includes(o.status));

  // Compute stats
  const totalRevenue = completedOrders
    .filter(o => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'PENDING': return <span className="badge bg-warning text-dark px-3 py-1.5 rounded-pill fw-bold">ORDER PLACED</span>;
      case 'CONFIRMED': return <span className="badge bg-info text-white px-3 py-1.5 rounded-pill fw-bold">ACCEPTED</span>;
      case 'PREPARING': return <span className="badge bg-primary text-white px-3 py-1.5 rounded-pill fw-bold">PREPARING</span>;
      case 'READY': return <span className="badge bg-success text-white px-3 py-1.5 rounded-pill fw-bold">FOOD READY</span>;
      case 'OUT_FOR_DELIVERY': return <span className="badge bg-secondary text-white px-3 py-1.5 rounded-pill fw-bold">OUT FOR DELIVERY</span>;
      case 'DELIVERED': return <span className="badge bg-success bg-opacity-25 text-success px-3 py-1.5 rounded-pill fw-bold">DELIVERED</span>;
      case 'CANCELLED': return <span className="badge bg-danger bg-opacity-25 text-danger px-3 py-1.5 rounded-pill fw-bold">CANCELLED</span>;
      case 'REJECTED': return <span className="badge bg-danger text-white px-3 py-1.5 rounded-pill fw-bold">REJECTED</span>;
      default: return <span className="badge bg-secondary text-white px-3 py-1.5 rounded-pill fw-bold">{status}</span>;
    }
  };

  const renderOrderActions = (order) => {
    switch (order.status) {
      case 'PENDING':
        return (
          <div className="d-flex gap-2 w-100">
            <button
              onClick={() => handleUpdateOrderStatus(order.id, 'REJECTED')}
              className="btn btn-outline-danger btn-sm rounded-pill px-3 py-1.5 fw-bold flex-fill"
            >
              Reject
            </button>
            <button
              onClick={() => handleUpdateOrderStatus(order.id, 'CONFIRMED')}
              className="btn btn-success btn-sm rounded-pill px-3 py-1.5 fw-bold flex-fill"
            >
              Accept Order
            </button>
          </div>
        );
      case 'CONFIRMED':
        return (
          <button
            onClick={() => handleUpdateOrderStatus(order.id, 'PREPARING')}
            className="btn btn-primary btn-sm w-100 rounded-pill py-2 fw-bold"
          >
            Start Preparing
          </button>
        );
      case 'PREPARING':
        return (
          <button
            onClick={() => handleUpdateOrderStatus(order.id, 'READY')}
            className="btn btn-success btn-sm w-100 rounded-pill py-2 fw-bold"
          >
            Mark Food Ready
          </button>
        );
      case 'READY':
        return (
          <button
            onClick={() => handleUpdateOrderStatus(order.id, 'OUT_FOR_DELIVERY')}
            className="btn btn-warning text-dark btn-sm w-100 rounded-pill py-2 fw-bold"
          >
            Dispatch Valet
          </button>
        );
      case 'OUT_FOR_DELIVERY':
        return (
          <button
            onClick={() => handleUpdateOrderStatus(order.id, 'DELIVERED')}
            className="btn btn-success btn-sm w-100 rounded-pill py-2 fw-bold"
          >
            Mark Delivered
          </button>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger text-center shadow-sm rounded-4 p-5">
          <i className="bi bi-exclamation-octagon-fill display-1 text-danger"></i>
          <h3 className="fw-bold mt-4">Access Denied</h3>
          <p className="lead text-muted mb-0">No restaurant is currently linked to your owner account. Please contact administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      
      {/* Restaurant Header */}
      <div className="bg-white p-4 rounded-4 shadow-sm border border-light mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-1.5 mb-2 small fw-extrabold text-uppercase">
              Owner Dashboard
            </span>
            <h2 className="fw-extrabold text-dark mb-1">{restaurant.name}</h2>
            <p className="text-muted small mb-0"><i className="bi bi-geo-alt-fill me-1"></i>{restaurant.cuisineType} Cuisine</p>
          </div>
          <div className="d-flex align-items-center gap-2 bg-light p-2.5 rounded-3">
            <div className="text-end">
              <span className="d-block small text-muted fw-semibold">RESTAURANT STATUS</span>
              <span className="fw-bold text-success">ONLINE & ACCEPTING ORDERS</span>
            </div>
            <i className="bi bi-circle-fill text-success ms-2 animated pulse" style={{ fontSize: '0.75rem' }}></i>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-3.5 h-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="d-block text-muted small fw-semibold">ACTIVE ORDERS</span>
                <span className="display-6 fw-extrabold text-dark">{activeOrders.length}</span>
              </div>
              <div className="bg-primary bg-opacity-10 p-3 rounded-4 text-primary">
                <i className="bi bi-receipt-cutoff fs-3"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-3.5 h-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="d-block text-muted small fw-semibold">TOTAL REVENUE</span>
                <span className="display-6 fw-extrabold text-dark">₹{totalRevenue.toFixed(0)}</span>
              </div>
              <div className="bg-success bg-opacity-10 p-3 rounded-4 text-success">
                <i className="bi bi-wallet2 fs-3"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-3.5 h-100">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="d-block text-muted small fw-semibold">MENU DISHES</span>
                <span className="display-6 fw-extrabold text-dark">{dishes.length}</span>
              </div>
              <div className="bg-info bg-opacity-10 p-3 rounded-4 text-info">
                <i className="bi bi-egg-fried fs-3"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="d-flex gap-2 border-bottom pb-3 mb-4">
        <button
          onClick={() => setActiveTab('orders')}
          className={`btn rounded-pill px-4 py-2 fw-bold transition-all border-0 ${
            activeTab === 'orders' ? 'btn-primary' : 'btn-light text-muted'
          }`}
        >
          <i className="bi bi-receipt-cutoff me-2"></i>Orders Queue
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          className={`btn rounded-pill px-4 py-2 fw-bold transition-all border-0 ${
            activeTab === 'menu' ? 'btn-primary' : 'btn-light text-muted'
          }`}
        >
          <i className="bi bi-menu-button-wide-fill me-2"></i>Manage Menu
        </button>
      </div>

      {/* Orders View */}
      {activeTab === 'orders' && (
        <div>
          {/* Subtabs */}
          <div className="d-flex gap-3 mb-4">
            <button
              onClick={() => setOrderSubTab('active')}
              className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold ${
                orderSubTab === 'active' ? 'bg-primary bg-opacity-10 text-primary' : 'bg-transparent text-muted'
              }`}
              style={{ border: 'none' }}
            >
              Active Queue ({activeOrders.length})
            </button>
            <button
              onClick={() => setOrderSubTab('completed')}
              className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold ${
                orderSubTab === 'completed' ? 'bg-success bg-opacity-10 text-success' : 'bg-transparent text-muted'
              }`}
              style={{ border: 'none' }}
            >
              Completed ({completedOrders.length})
            </button>
          </div>

          {/* Orders List */}
          {(orderSubTab === 'active' ? activeOrders : completedOrders).length === 0 ? (
            <div className="card border-0 shadow-sm text-center py-5 rounded-4 bg-white">
              <div className="card-body">
                <i className="bi bi-inbox text-muted display-3"></i>
                <h4 className="fw-bold mt-3 text-dark">No Orders Found</h4>
                <p className="text-muted small mb-0">There are no orders in this queue currently.</p>
              </div>
            </div>
          ) : (
            <div className="row g-4">
              {(orderSubTab === 'active' ? activeOrders : completedOrders).map((order) => (
                <div key={order.id} className="col-lg-6">
                  <div className="card border-0 shadow-sm rounded-4 bg-white p-4 h-100 border-start border-4 border-primary">
                    
                    {/* Header */}
                    <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
                      <div>
                        <h5 className="fw-extrabold text-dark mb-1">Order #{order.id}</h5>
                        <span className="text-muted small">
                          Placed: {order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : 'Recent'}
                        </span>
                      </div>
                      {renderStatusBadge(order.status)}
                    </div>

                    {/* Customer Details */}
                    <div className="bg-light p-3 rounded-3 mb-3">
                      <h6 className="fw-bold text-dark small mb-2"><i className="bi bi-person-fill text-muted me-1"></i>Customer Details</h6>
                      <p className="text-dark small mb-1 fw-semibold">{order.customerName || 'BiteSpeed User'}</p>
                      <p className="text-muted small mb-0">{order.addressStreet}, {order.addressCity}</p>
                    </div>

                    {/* Ordered Items */}
                    <div className="mb-4 flex-grow-1">
                      <h6 className="fw-bold text-dark small mb-2"><i className="bi bi-cart-fill text-muted me-1"></i>Dishes Ordered</h6>
                      <ul className="list-unstyled mb-0">
                        {order.orderItems?.map((oItem) => (
                          <li key={oItem.id} className="d-flex justify-content-between align-items-center border-bottom border-light py-1.5 small text-dark">
                            <span>• {oItem.productName}</span>
                            <span className="fw-bold">x{oItem.quantity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Footer */}
                    <div className="border-top pt-3 d-flex flex-column gap-3 mt-auto">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small fw-semibold">Order Value:</span>
                        <span className="fs-4 fw-extrabold text-primary">₹{order.totalAmount?.toFixed(2)}</span>
                      </div>

                      {/* Action buttons */}
                      {renderOrderActions(order)}
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Menu View */}
      {activeTab === 'menu' && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="fw-bold text-dark mb-0">Restaurant Menu Dishes</h4>
            <button
              onClick={() => openDishForm(null)}
              className="btn btn-primary rounded-pill px-4 fw-bold"
            >
              + Add New Dish
            </button>
          </div>

          {/* Dishes List */}
          {dishes.length === 0 ? (
            <div className="card border-0 shadow-sm text-center py-5 rounded-4 bg-white">
              <div className="card-body">
                <i className="bi bi-egg-fried text-muted display-3"></i>
                <h4 className="fw-bold mt-3 text-dark">No Menu Dishes Found</h4>
                <p className="text-muted small mb-0">Your restaurant menu is currently empty. Click Add New Dish to get started.</p>
              </div>
            </div>
          ) : (
            <div className="row g-4">
              {dishes.map((dish) => (
                <div key={dish.id} className="col-md-6 col-lg-4">
                  <div className="card border-0 shadow-sm overflow-hidden h-100 rounded-4 bg-white p-3 d-flex flex-column">
                    <div className="d-flex gap-3">
                      {/* Image */}
                      <div
                        className="rounded-3"
                        style={{
                          width: '90px',
                          height: '90px',
                          backgroundImage: `url(${dish.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80'})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          flexShrink: 0
                        }}
                      ></div>

                      {/* Info */}
                      <div className="flex-grow-1 min-w-0">
                        <span className="badge bg-light text-primary rounded-pill px-2 py-0.5 mb-1.5 small fw-semibold border border-primary border-opacity-10">
                          {dish.categoryName}
                        </span>
                        <h5 className="fw-bold text-dark text-truncate mb-1">{dish.name}</h5>
                        <span className="fs-5 fw-extrabold text-primary d-block mb-1">₹{dish.price?.toFixed(2)}</span>
                        <span className="text-muted small">Stock: {dish.stock} units</span>
                      </div>
                    </div>

                    <p className="text-muted small mt-3 mb-4 flex-grow-1" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {dish.description}
                    </p>

                    <div className="border-top pt-3 d-flex gap-2 justify-content-end mt-auto">
                      <button
                        onClick={() => openDishForm(dish)}
                        className="btn btn-light text-primary btn-sm rounded-pill px-3 fw-bold border-0"
                      >
                        <i className="bi bi-pencil-square me-1"></i>Edit
                      </button>
                      <button
                        onClick={() => handleDeleteDish(dish.id)}
                        className="btn btn-light text-danger btn-sm rounded-pill px-3 fw-bold border-0"
                      >
                        <i className="bi bi-trash-fill me-1"></i>Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add/Edit Modal */}
          {showMenuForm && (
            <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 rounded-4 shadow-lg">
                  <div className="modal-header border-bottom">
                    <h5 className="modal-title fw-bold text-dark">{editingDish ? 'Edit Dish' : 'Add New Dish'}</h5>
                    <button type="button" className="btn-close" onClick={() => setShowMenuForm(false)}></button>
                  </div>
                  <form onSubmit={handleSaveDish}>
                    <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                      
                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-dark">Dish Name *</label>
                        <input
                          type="text"
                          className="form-control bg-light border-0 py-2 small"
                          placeholder="e.g. Special Chicken Dum Biryani"
                          value={dName}
                          onChange={(e) => setDName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-dark">Description</label>
                        <textarea
                          className="form-control bg-light border-0 py-2 small"
                          rows="3"
                          placeholder="Describe ingredients or size..."
                          value={dDescription}
                          onChange={(e) => setDDescription(e.target.value)}
                        />
                      </div>

                      <div className="row mb-3">
                        <div className="col-6">
                          <label className="form-label small fw-semibold text-dark">Price (₹) *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            className="form-control bg-light border-0 py-2 small"
                            placeholder="Price"
                            value={dPrice}
                            onChange={(e) => setDPrice(e.target.value)}
                            required
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label small fw-semibold text-dark">Stock Units *</label>
                          <input
                            type="number"
                            min="0"
                            className="form-control bg-light border-0 py-2 small"
                            value={dStock}
                            onChange={(e) => setDStock(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-dark">Image URL</label>
                        <input
                          type="url"
                          className="form-control bg-light border-0 py-2 small"
                          placeholder="https://images.unsplash.com/..."
                          value={dImageUrl}
                          onChange={(e) => setDImageUrl(e.target.value)}
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-dark">Category *</label>
                        <select
                          className="form-select bg-light border-0 py-2 small"
                          value={dCategoryId}
                          onChange={(e) => setDCategoryId(e.target.value)}
                          required
                        >
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>

                    </div>
                    <div className="modal-footer border-top p-3 d-flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowMenuForm(false)}
                        className="btn btn-light rounded-pill px-4 fw-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="btn btn-primary rounded-pill px-4 fw-bold"
                      >
                        {submitting ? 'Saving...' : 'Save Dish'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default OwnerDashboard;
