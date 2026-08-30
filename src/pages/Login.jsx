import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      // Redirect based on role
      if (data.role === 'ADMIN') {
        navigate('/admin');
      } else if (data.role === 'RESTAURANT_OWNER') {
        navigate('/owner');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid auth-bg d-flex align-items-center justify-content-center" style={{ minHeight: '90vh' }}>
      <div className="card shadow-lg border-0 p-4 m-3" style={{ width: '100%', maxWidth: '450px', borderRadius: '16px' }}>
        <div className="text-center mb-4">
          <i className="bi bi-bicycle text-primary fs-1"></i>
          <h2 className="fw-bold mt-2 text-dark">Welcome Back</h2>
          <p className="text-muted small">Sign in to your BiteSpeed account</p>
        </div>

        {error && (
          <div className="alert alert-danger border-0 small text-center py-2" role="alert" style={{ borderRadius: '8px' }}>
            <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
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

          <div className="mb-4">
            <label className="form-label small fw-semibold text-dark">Password</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-0"><i className="bi bi-shield-lock text-muted"></i></span>
              <input
                type="password"
                className="form-control bg-light border-0 py-2 small"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ borderRadius: '0 8px 8px 0' }}
              />
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
              'Log In'
            )}
          </button>

          <div className="text-center mt-3">
            <span className="text-muted small">Don't have an account? </span>
            <Link to="/register" className="small fw-semibold text-primary text-decoration-none">
              Sign Up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
