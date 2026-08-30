import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useNotification } from '../../context/NotificationContext';

const AdminDashboard = () => {
  const { showToast, showConfirm } = useNotification();
  const [activeTab, setActiveTab] = useState('overview');

  // Universal Loading states
  const [loading, setLoading] = useState(false);

  // 1. Overview states
  const [stats, setStats] = useState({ products: 0, categories: 0, coupons: 0, orders: 0 });

  // 2. Products states
  const [products, setProducts] = useState([]);
  const [prodPage, setProdPage] = useState(0);
  const [prodTotalPages, setProdTotalPages] = useState(0);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Product input fields
  const [pName, setPName] = useState('');
  const [pDescription, setPDescription] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pStock, setPStock] = useState('');
  const [pImageUrl, setPImageUrl] = useState('');
  const [pCategoryId, setPCategoryId] = useState('');

  // 3. Categories states
  const [categories, setCategories] = useState([]);
  const [cName, setCName] = useState('');
  const [cDescription, setCDescription] = useState('');

  // 4. Coupons states
  const [coupons, setCoupons] = useState([]);
  const [cpCode, setCpCode] = useState('');
  const [cpDiscount, setCpDiscount] = useState('');
  const [cpExpiry, setCpExpiry] = useState('');
  const [cpMinAmount, setCpMinAmount] = useState('');

  // 5. Orders states
  const [orders, setOrders] = useState([]);
  const [ordPage, setOrdPage] = useState(0);
  const [ordTotalPages, setOrdTotalPages] = useState(0);

  // Common Fetch methods
  const loadOverviewStats = async () => {
    try {
      const pRes = await axiosInstance.get('/api/products?size=1');
      const cRes = await axiosInstance.get('/api/categories');
      const oRes = await axiosInstance.get('/api/admin/orders?size=1');
      const cpRes = await axiosInstance.get('/api/coupons');

      setStats({
        products: pRes.data?.data?.totalElements || 0,
        categories: cRes.data?.data?.length || 0,
        orders: oRes.data?.data?.totalElements || 0,
        coupons: cpRes.data?.data?.length || 0
      });
    } catch (err) {
      console.error(err);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/products?page=${prodPage}&size=8&sort=id,desc`);
      if (res.data && res.data.success) {
        setProducts(res.data.data.content);
        setProdTotalPages(res.data.data.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/categories');
      if (res.data && res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/coupons');
      if (res.data && res.data.success) {
        setCoupons(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/admin/orders?page=${ordPage}&size=8&sort=id,desc`);
      if (res.data && res.data.success) {
        setOrders(res.data.data.content);
        setOrdTotalPages(res.data.data.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Sync data whenever active Tab updates
  useEffect(() => {
    if (activeTab === 'overview') loadOverviewStats();
    if (activeTab === 'products') {
      loadProducts();
      loadCategories(); // categories needed for product category selection
    }
    if (activeTab === 'categories') loadCategories();
    if (activeTab === 'coupons') loadCoupons();
    if (activeTab === 'orders') loadOrders();
  }, [activeTab, prodPage, ordPage]);

  // Product submit handler
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: pName,
      description: pDescription,
      price: parseFloat(pPrice),
      stock: parseInt(pStock),
      imageUrl: pImageUrl,
      categoryId: parseInt(pCategoryId)
    };

    try {
      if (editingProduct) {
        await axiosInstance.put(`/api/products/${editingProduct.id}`, payload);
        showToast('Product updated successfully!', 'success');
      } else {
        await axiosInstance.post('/api/products', payload);
        showToast('Product created successfully!', 'success');
      }
      setShowProductForm(false);
      setEditingProduct(null);
      // Reset inputs
      setPName('');
      setPDescription('');
      setPPrice('');
      setPStock('');
      setPImageUrl('');
      setPCategoryId('');
      loadProducts();
    } catch (err) {
      showToast(err.message || 'Product validation failed', 'error');
    }
  };

  const triggerEditProduct = (prod) => {
    setEditingProduct(prod);
    setPName(prod.name);
    setPDescription(prod.description || '');
    setPPrice(prod.price);
    setPStock(prod.stock);
    setPImageUrl(prod.imageUrl || '');
    setPCategoryId(prod.categoryId || '');
    setShowProductForm(true);
  };

  const handleDeleteProduct = (prodId) => {
    showConfirm('Are you sure you want to soft-delete this product?', async () => {
      try {
        await axiosInstance.delete(`/api/products/${prodId}`);
        showToast('Product soft-deleted successfully!', 'success');
        loadProducts();
      } catch (err) {
        showToast('Failed to delete product.', 'error');
      }
    });
  };

  // Category submit handler
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/api/categories', { name: cName, description: cDescription });
      showToast('Category added successfully!', 'success');
      setCName('');
      setCDescription('');
      loadCategories();
    } catch (err) {
      showToast('Failed to add category.', 'error');
    }
  };

  // Coupon submit handler
  const handleCouponSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/api/coupons', {
        code: cpCode.trim(),
        discountPercent: parseInt(cpDiscount),
        expiryDate: cpExpiry,
        minOrderAmount: cpMinAmount ? parseFloat(cpMinAmount) : null
      });
      showToast('Coupon created successfully!', 'success');
      setCpCode('');
      setCpDiscount('');
      setCpExpiry('');
      setCpMinAmount('');
      loadCoupons();
    } catch (err) {
      showToast('Failed to create coupon.', 'error');
    }
  };

  const handleToggleCoupon = async (couponId, currentActive) => {
    try {
      await axiosInstance.put(`/api/coupons/${couponId}/toggle?active=${!currentActive}`);
      loadCoupons();
      showToast('Coupon status updated!', 'success');
    } catch (err) {
      showToast('Failed to toggle coupon status.', 'error');
    }
  };

  // Order status submit handler
  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      await axiosInstance.put(`/api/admin/orders/${orderId}/status?status=${newStatus}`);
      showToast('Order status updated!', 'success');
      loadOrders();
    } catch (err) {
      showToast('Failed to update order status.', 'error');
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row g-4">
        {/* Admin Navigation Sidebar Tab togglers */}
        <div className="col-lg-3">
          <div className="card border-0 shadow-sm p-3 rounded-4 bg-white sticky-lg-top" style={{ top: '90px' }}>
            <div className="text-center py-3 border-bottom mb-3">
              <i className="bi bi-shield-lock text-primary fs-1"></i>
              <h5 className="fw-bold mt-2 text-dark">Admin Panel</h5>
              <span className="badge bg-light text-primary rounded-pill px-3">Management Desk</span>
            </div>
            
            <div className="nav flex-column nav-pills gap-1">
              <button onClick={() => setActiveTab('overview')} className={`nav-link text-start border-0 rounded-3 py-2 small fw-semibold ${activeTab === 'overview' ? 'active bg-primary text-white' : 'text-dark bg-white'}`}>
                <i className="bi bi-speedometer2 me-2"></i>Overview Console
              </button>
              <button onClick={() => setActiveTab('products')} className={`nav-link text-start border-0 rounded-3 py-2 small fw-semibold ${activeTab === 'products' ? 'active bg-primary text-white' : 'text-dark bg-white'}`}>
                <i className="bi bi-laptop me-2"></i>Products Inventory
              </button>
              <button onClick={() => setActiveTab('categories')} className={`nav-link text-start border-0 rounded-3 py-2 small fw-semibold ${activeTab === 'categories' ? 'active bg-primary text-white' : 'text-dark bg-white'}`}>
                <i className="bi bi-grid me-2"></i>Categories Manager
              </button>
              <button onClick={() => setActiveTab('coupons')} className={`nav-link text-start border-0 rounded-3 py-2 small fw-semibold ${activeTab === 'coupons' ? 'active bg-primary text-white' : 'text-dark bg-white'}`}>
                <i className="bi bi-tags me-2"></i>Coupons Dashboard
              </button>
              <button onClick={() => setActiveTab('orders')} className={`nav-link text-start border-0 rounded-3 py-2 small fw-semibold ${activeTab === 'orders' ? 'active bg-primary text-white' : 'text-dark bg-white'}`}>
                <i className="bi bi-card-checklist me-2"></i>Orders Dispatch Desk
              </button>
            </div>
          </div>
        </div>

        {/* Content Column */}
        <div className="col-lg-9">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
              <h4 className="fw-bold text-dark mb-4">Operations Console</h4>
              <div className="row g-4">
                {/* Product count */}
                <div className="col-md-3 col-sm-6">
                  <div className="card border-0 bg-light p-3 rounded-3 text-center">
                    <i className="bi bi-laptop fs-1 text-primary mb-2"></i>
                    <h6 className="text-muted small">Total Products</h6>
                    <h3 className="fw-bold text-dark">{stats.products}</h3>
                  </div>
                </div>
                {/* Category count */}
                <div className="col-md-3 col-sm-6">
                  <div className="card border-0 bg-light p-3 rounded-3 text-center">
                    <i className="bi bi-grid fs-1 text-success mb-2"></i>
                    <h6 className="text-muted small">Categories</h6>
                    <h3 className="fw-bold text-dark">{stats.categories}</h3>
                  </div>
                </div>
                {/* Coupon count */}
                <div className="col-md-3 col-sm-6">
                  <div className="card border-0 bg-light p-3 rounded-3 text-center">
                    <i className="bi bi-tags fs-1 text-warning mb-2"></i>
                    <h6 className="text-muted small">Coupons Code</h6>
                    <h3 className="fw-bold text-dark">{stats.coupons}</h3>
                  </div>
                </div>
                {/* Orders count */}
                <div className="col-md-3 col-sm-6">
                  <div className="card border-0 bg-light p-3 rounded-3 text-center">
                    <i className="bi bi-box-seam fs-1 text-danger mb-2"></i>
                    <h6 className="text-muted small">Orders Placed</h6>
                    <h3 className="fw-bold text-dark">{stats.orders}</h3>
                  </div>
                </div>
              </div>

              <div className="alert alert-light border mt-4 small text-muted">
                <i className="bi bi-info-circle-fill text-primary me-2"></i>
                Welcome back to your administration command console. Use the sidebar panel to add products, modify stock levels, review active coupons, or update customer order statuses.
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS MANAGER */}
          {activeTab === 'products' && (
            <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold text-dark m-0">Products Inventory</h4>
                {!showProductForm && (
                  <button onClick={() => setShowProductForm(true)} className="btn btn-gradient-primary rounded-pill px-4 small fw-bold">
                    + Add New Product
                  </button>
                )}
              </div>

              {showProductForm ? (
                <div className="border p-4 rounded-4 bg-light mb-4">
                  <h5 className="fw-bold text-dark mb-4">{editingProduct ? 'Edit Product details' : 'Add New Product'}</h5>
                  <form onSubmit={handleProductSubmit}>
                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark">Product Name</label>
                        <input type="text" className="form-control form-control-sm bg-white" placeholder="Product name" value={pName} onChange={(e) => setPName(e.target.value)} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark">Category</label>
                        <select className="form-select form-select-sm bg-white" value={pCategoryId} onChange={(e) => setPCategoryId(e.target.value)} required>
                          <option value="">Select Category</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-md-4">
                        <label className="form-label small fw-semibold text-dark">Price ($)</label>
                        <input type="number" step="0.01" className="form-control form-control-sm bg-white" placeholder="e.g. 599.99" value={pPrice} onChange={(e) => setPPrice(e.target.value)} required />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-semibold text-dark">Stock Units</label>
                        <input type="number" className="form-control form-control-sm bg-white" placeholder="Quantity" value={pStock} onChange={(e) => setPStock(e.target.value)} required />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-semibold text-dark">Image URL</label>
                        <input type="text" className="form-control form-control-sm bg-white" placeholder="https://..." value={pImageUrl} onChange={(e) => setPImageUrl(e.target.value)} />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="form-label small fw-semibold text-dark">Description</label>
                      <textarea rows="3" className="form-control bg-white" placeholder="Describe the product details..." value={pDescription} onChange={(e) => setPDescription(e.target.value)}></textarea>
                    </div>

                    <div className="d-flex gap-2">
                      <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold small">Save Product</button>
                      <button type="button" onClick={() => { setShowProductForm(false); setEditingProduct(null); }} className="btn btn-light rounded-pill px-4 small">Cancel</button>
                    </div>
                  </form>
                </div>
              ) : null}

              {/* Table */}
              <div className="table-responsive">
                <table className="table table-hover align-middle small">
                  <thead className="table-light">
                    <tr>
                      <th>Image</th>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(prod => (
                      <tr key={prod.id}>
                        <td>
                          <div className="bg-light p-1 rounded text-center" style={{ width: '40px', height: '40px' }}>
                            <img src={prod.imageUrl || 'https://via.placeholder.com/40' } alt="" className="img-fluid h-100 object-fit-contain" />
                          </div>
                        </td>
                        <td><span className="fw-semibold">{prod.name}</span></td>
                        <td>{prod.categoryName || 'General'}</td>
                        <td><span className="text-primary fw-bold">${prod.price.toFixed(2)}</span></td>
                        <td>
                          {prod.stock === 0 ? (
                            <span className="badge bg-danger rounded-pill">Out of Stock</span>
                          ) : (
                            <span className="badge bg-light text-dark border rounded-pill">{prod.stock} units</span>
                          )}
                        </td>
                        <td className="text-end">
                          <button onClick={() => triggerEditProduct(prod)} className="btn btn-sm btn-outline-primary me-2 rounded-circle py-1 px-2" title="Edit"><i className="bi bi-pencil"></i></button>
                          <button onClick={() => handleDeleteProduct(prod.id)} className="btn btn-sm btn-outline-danger rounded-circle py-1 px-2" title="Soft-delete"><i className="bi bi-trash"></i></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {prodTotalPages > 1 && (
                <div className="d-flex justify-content-center mt-3">
                  <nav>
                    <ul className="pagination pagination-sm gap-1 border-0">
                      {[...Array(prodTotalPages)].map((_, i) => (
                        <li key={i} className={`page-item ${prodPage === i ? 'active' : ''}`}>
                          <button onClick={() => setProdPage(i)} className="page-link rounded-circle border-0">{i + 1}</button>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CATEGORIES MANAGER */}
          {activeTab === 'categories' && (
            <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
              <h4 className="fw-bold text-dark mb-4">Categories Manager</h4>
              
              <div className="row g-4">
                {/* Form to add */}
                <div className="col-md-5">
                  <div className="card p-3 border-light bg-light rounded-3">
                    <h6 className="fw-bold text-dark mb-3">Add New Category</h6>
                    <form onSubmit={handleCategorySubmit}>
                      <div className="mb-2">
                        <label className="form-label small text-muted">Category Name</label>
                        <input type="text" className="form-control form-control-sm bg-white" placeholder="Category name" value={cName} onChange={(e) => setCName(e.target.value)} required />
                      </div>
                      <div className="mb-3">
                        <label className="form-label small text-muted">Description</label>
                        <textarea rows="3" className="form-control bg-white small" placeholder="Description details" value={cDescription} onChange={(e) => setCDescription(e.target.value)}></textarea>
                      </div>
                      <button type="submit" className="btn btn-primary btn-sm rounded-pill px-3 fw-bold">Create Category</button>
                    </form>
                  </div>
                </div>

                {/* List Table */}
                <div className="col-md-7">
                  <div className="table-responsive">
                    <table className="table align-middle small">
                      <thead className="table-light">
                        <tr>
                          <th>ID</th>
                          <th>Category Name</th>
                          <th>Slug</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map(cat => (
                          <tr key={cat.id}>
                            <td>{cat.id}</td>
                            <td><span className="fw-semibold">{cat.name}</span></td>
                            <td><code>{cat.slug}</code></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: COUPONS DASHBOARD */}
          {activeTab === 'coupons' && (
            <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
              <h4 className="fw-bold text-dark mb-4">Coupons Dashboard</h4>
              
              <div className="row g-4">
                {/* Form to add */}
                <div className="col-lg-4">
                  <div className="card p-3 border-light bg-light rounded-3">
                    <h6 className="fw-bold text-dark mb-3">Create Promo Coupon</h6>
                    <form onSubmit={handleCouponSubmit}>
                      <div className="mb-2">
                        <label className="form-label small text-muted">Promo Code</label>
                        <input type="text" className="form-control form-control-sm bg-white" placeholder="e.g. SAVE20" value={cpCode} onChange={(e) => setCpCode(e.target.value)} required />
                      </div>
                      <div className="row g-2 mb-2">
                        <div className="col-6">
                          <label className="form-label small text-muted">Discount (%)</label>
                          <input type="number" className="form-control form-control-sm bg-white" placeholder="20" value={cpDiscount} onChange={(e) => setCpDiscount(e.target.value)} required />
                        </div>
                        <div className="col-6">
                          <label className="form-label small text-muted">Min Order ($)</label>
                          <input type="number" className="form-control form-control-sm bg-white" placeholder="Min Amount" value={cpMinAmount} onChange={(e) => setCpMinAmount(e.target.value)} />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label small text-muted">Expiry Date</label>
                        <input type="date" className="form-control form-control-sm bg-white" value={cpExpiry} onChange={(e) => setCpExpiry(e.target.value)} required />
                      </div>
                      <button type="submit" className="btn btn-primary btn-sm rounded-pill px-3 fw-bold">Create Coupon</button>
                    </form>
                  </div>
                </div>

                {/* List Table */}
                <div className="col-lg-8">
                  <div className="table-responsive">
                    <table className="table align-middle small">
                      <thead className="table-light">
                        <tr>
                          <th>Code</th>
                          <th>Discount</th>
                          <th>Min Order</th>
                          <th>Expiry</th>
                          <th>Status</th>
                          <th className="text-end">Toggle</th>
                        </tr>
                      </thead>
                      <tbody>
                        {coupons.map(cp => (
                          <tr key={cp.id}>
                            <td><code>{cp.code}</code></td>
                            <td><span className="fw-bold text-success">{cp.discountPercent}%</span></td>
                            <td>${cp.minOrderAmount ? cp.minOrderAmount.toFixed(2) : '0.00'}</td>
                            <td><span className="text-muted small">{cp.expiryDate}</span></td>
                            <td>
                              {cp.active ? (
                                <span className="badge bg-success rounded-pill">Active</span>
                              ) : (
                                <span className="badge bg-secondary rounded-pill">Inactive</span>
                              )}
                            </td>
                            <td className="text-end">
                              <div className="form-check form-switch d-inline-block">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={cp.active}
                                  onChange={() => handleToggleCoupon(cp.id, cp.active)}
                                  style={{ cursor: 'pointer' }}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ORDERS DISPATCH DESK */}
          {activeTab === 'orders' && (
            <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
              <h4 className="fw-bold text-dark mb-4">Orders Dispatch Desk</h4>

              <div className="table-responsive">
                <table className="table table-hover align-middle small">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Order Total</th>
                      <th>Status</th>
                      <th>Created Date</th>
                      <th className="text-end">Fulfillment Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(ord => (
                      <tr key={ord.id}>
                        <td><span className="fw-bold">#{ord.id}</span></td>
                        <td><span className="text-primary fw-bold">${ord.totalAmount.toFixed(2)}</span></td>
                        <td>
                          <span className="badge bg-light text-dark border">{ord.status}</span>
                        </td>
                        <td><span className="text-muted small">{ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : 'recent'}</span></td>
                        <td className="text-end">
                          <select
                            className="form-select form-select-sm d-inline-block bg-light border-0 py-1 small"
                            value={ord.status}
                            onChange={(e) => handleOrderStatusUpdate(ord.id, e.target.value)}
                            style={{ width: '135px' }}
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="SHIPPED">SHIPPED</option>
                            <option value="DELIVERED">DELIVERED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {ordTotalPages > 1 && (
                <div className="d-flex justify-content-center mt-3">
                  <nav>
                    <ul className="pagination pagination-sm gap-1 border-0">
                      {[...Array(ordTotalPages)].map((_, i) => (
                        <li key={i} className={`page-item ${ordPage === i ? 'active' : ''}`}>
                          <button onClick={() => setOrdPage(i)} className="page-link rounded-circle border-0">{i + 1}</button>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
