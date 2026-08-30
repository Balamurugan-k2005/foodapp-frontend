import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const UserProfile = () => {
  const { user, setUser } = useAuth();
  const { showToast, showConfirm } = useNotification();
  
  // Profile edit states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Address states
  const [addresses, setAddresses] = useState([]);
  const [loadingAddr, setLoadingAddr] = useState(true);

  // Address Form states
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [country, setCountry] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [addrError, setAddrError] = useState('');
  const [addrSuccess, setAddrSuccess] = useState('');
  const [savingAddr, setSavingAddr] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
    loadAddresses();
  }, [user]);

  const loadAddresses = async () => {
    try {
      const res = await axiosInstance.get('/api/users/addresses');
      if (res.data && res.data.success) {
        setAddresses(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAddr(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    setSavingProfile(true);

    try {
      const res = await axiosInstance.put('/api/users/profile', { name, phone });
      if (res.data && res.data.success) {
        setProfileSuccess('Profile updated successfully!');
        setUser({ ...user, name, phone });
      }
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setAddrError('');
    setAddrSuccess('');
    setSavingAddr(true);

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
        setAddrSuccess('Address added successfully!');
        setAddresses([...addresses, res.data.data]);
        
        // Clear fields
        setStreet('');
        setCity('');
        setState('');
        setPincode('');
        setCountry('');
        setIsDefault(false);
        
        // Reload all to reflect defaults accurately
        loadAddresses();
      }
    } catch (err) {
      setAddrError(err.message || 'Failed to save address.');
    } finally {
      setSavingAddr(false);
    }
  };

  const handleDeleteAddress = (addressId) => {
    showConfirm('Are you sure you want to delete this shipping address?', async () => {
      try {
        const res = await axiosInstance.delete(`/api/users/addresses/${addressId}`);
        if (res.data && res.data.success) {
          setAddresses(addresses.filter(a => a.id !== addressId));
          showToast('Address deleted successfully.', 'success');
        }
      } catch (err) {
        showToast('Failed to delete address.', 'error');
      }
    });
  };

  return (
    <div className="container py-5">
      <div className="row g-4">
        {/* Profile Card column */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
            <h4 className="fw-bold text-dark mb-3">Profile Details</h4>
            
            {profileSuccess && <div className="alert alert-success border-0 py-2 small">{profileSuccess}</div>}
            {profileError && <div className="alert alert-danger border-0 py-2 small">{profileError}</div>}

            <form onSubmit={handleUpdateProfile}>
              <div className="mb-3">
                <label className="form-label small text-muted">Email (Username)</label>
                <input
                  type="text"
                  className="form-control bg-light border-0 small text-dark"
                  value={user?.email || ''}
                  readOnly
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">Full Name</label>
                <input
                  type="text"
                  className="form-control bg-light border-0 small"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label small fw-semibold text-dark">Phone Number</label>
                <input
                  type="text"
                  className="form-control bg-light border-0 small"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="btn btn-gradient-primary w-100 py-2 rounded-pill small fw-semibold"
              >
                {savingProfile ? (
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                ) : (
                  'Save Profile Details'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Addresses book column */}
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm p-4 rounded-4 bg-white mb-4">
            <h4 className="fw-bold text-dark mb-3">Saved Addresses</h4>
            {loadingAddr ? (
              <p className="text-muted small">Loading addresses...</p>
            ) : addresses.length === 0 ? (
              <p className="text-muted small">No addresses saved. Use the form below to register your address.</p>
            ) : (
              <div className="d-flex flex-column gap-2 mb-3">
                {addresses.map((addr) => (
                  <div key={addr.id} className="card p-3 border-light bg-light rounded-3 d-flex flex-row justify-content-between align-items-center">
                    <div>
                      <h6 className="fw-bold text-dark mb-1 small">{addr.street}</h6>
                      <span className="text-muted fs-8">{addr.city}, {addr.state} - {addr.pincode}, {addr.country}</span>
                      {addr.default && <span className="badge bg-primary ms-2 small">Default</span>}
                    </div>
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="btn btn-link text-danger p-0"
                      title="Delete Address"
                    >
                      <i className="bi bi-trash fs-5"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Address Form */}
          <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
            <h5 className="fw-bold text-dark mb-3">Add New Address</h5>
            {addrError && <div className="alert alert-danger border-0 py-2 small">{addrError}</div>}
            {addrSuccess && <div className="alert alert-success border-0 py-2 small">{addrSuccess}</div>}

            <form onSubmit={handleAddAddress}>
              <div className="mb-2">
                <input
                  type="text"
                  className="form-control form-control-sm bg-light border-0 small"
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
                    className="form-control form-control-sm bg-light border-0 small"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
                <div className="col-6">
                  <input
                    type="text"
                    className="form-control form-control-sm bg-light border-0 small"
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
                    className="form-control form-control-sm bg-light border-0 small"
                    placeholder="Pincode"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    required
                  />
                </div>
                <div className="col-6">
                  <input
                    type="text"
                    className="form-control form-control-sm bg-light border-0 small"
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
                  id="profileDefaultCheck"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                />
                <label className="form-check-label small text-muted" htmlFor="profileDefaultCheck">
                  Set as default shipping address
                </label>
              </div>

              <button
                type="submit"
                disabled={savingAddr}
                className="btn btn-primary rounded-pill px-4 fw-bold small"
              >
                {savingAddr ? 'Saving...' : 'Add Address'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
