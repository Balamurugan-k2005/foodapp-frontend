import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('CUSTOMER');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !phone) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await register(name, email, password, phone, role);
      setSuccess('Account registered successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Registration failed. Email might already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid auth-bg d-flex align-items-center justify-content-center" style={{ minHeight: '90vh' }}>
      <div className="card shadow-lg border-0 p-4 m-3" style={{ width: '100%', maxWidth: '485px', borderRadius: '16px' }}>
        <div className="text-center mb-4">
          <i className="bi bi-bicycle text-primary fs-1"></i>
          <h2 className="fw-bold mt-2 text-dark">Create Account</h2>
          <p className="text-muted small">Sign up to start ordering on BiteSpeed</p>
        </div>

        {error && (
          <div className="alert alert-danger border-0 small text-center py-2" role="alert" style={{ borderRadius: '8px' }}>
            <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
          </div>
        )}

        {success && (
          <div className="alert alert-success border-0 small text-center py-2" role="alert" style={{ borderRadius: '8px' }}>
            <i className="bi bi-check-circle-fill me-2"></i>{success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label small fw-semibold text-dark">Full Name</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-0"><i className="bi bi-person text-muted"></i></span>
                <input
                  type="text"
                  className="form-control bg-light border-0 py-2 small"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{ borderRadius: '0 8px 8px 0' }}
                />
              </div>
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label small fw-semibold text-dark">Phone Number</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-0"><i className="bi bi-telephone text-muted"></i></span>
                <input
                  type="tel"
                  className="form-control bg-light border-0 py-2 small"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  style={{ borderRadius: '0 8px 8px 0' }}
                />
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold text-dark">Email Address</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-0"><i className="bi bi-envelope text-muted"></i></span>
              <input
                type="email"
                className="form-control bg-light border-0 py-2 small"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ borderRadius: '0 8px 8px 0' }}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold text-dark">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-0"><i className="bi bi-shield-lock text-muted"></i></span>
              <input
                type="password"
                className="form-control bg-light border-0 py-2 small"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ borderRadius: '0 8px 8px 0' }}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold text-dark">Register As</label>
            <div className="d-flex gap-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="roleRadio"
                  id="customerRadio"
                  value="CUSTOMER"
                  checked={role === 'CUSTOMER'}
                  onChange={() => setRole('CUSTOMER')}
                />
                <label className="form-check-label small text-dark" htmlFor="customerRadio">
                  Customer
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="roleRadio"
                  id="adminRadio"
                  value="ADMIN"
                  checked={role === 'ADMIN'}
                  onChange={() => setRole('ADMIN')}
                />
                <label className="form-check-label small text-dark" htmlFor="adminRadio">
                  Administrator
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-gradient-primary w-100 py-2 fw-semibold rounded-pill mb-3"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            ) : (
              'Sign Up'
            )}
          </button>

          <div className="text-center mt-3">
            <span className="text-muted small">Already have an account? </span>
            <Link to="/login" className="small fw-semibold text-primary text-decoration-none">
              Log In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
