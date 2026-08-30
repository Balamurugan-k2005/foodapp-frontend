import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmConfig, setConfirmConfig] = useState(null); // { message, onConfirm, onCancel }

  // Show a toast notification (e.g. success, error, warning, info)
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove toast after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  // Show a confirmation modal
  const showConfirm = useCallback((message, onConfirm, onCancel = null) => {
    setConfirmConfig({
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig(null);
      },
      onCancel: () => {
        if (onCancel) onCancel();
        setConfirmConfig(null);
      },
    });
  }, []);

  return (
    <NotificationContext.Provider value={{ showToast, showConfirm }}>
      {children}

      {/* Toast Notifications Container */}
      <div
        className="position-fixed top-0 end-0 p-3"
        style={{ zIndex: 1100, maxWidth: '350px' }}
      >
        {toasts.map((toast) => {
          let bgClass = 'bg-success';
          let iconClass = 'bi-check-circle-fill';
          if (toast.type === 'danger' || toast.type === 'error') {
            bgClass = 'bg-danger';
            iconClass = 'bi-exclamation-triangle-fill';
          } else if (toast.type === 'warning') {
            bgClass = 'bg-warning text-dark';
            iconClass = 'bi-exclamation-circle-fill';
          } else if (toast.type === 'info') {
            bgClass = 'bg-info';
            iconClass = 'bi-info-circle-fill';
          }

          return (
            <div
              key={toast.id}
              className={`toast show align-items-center text-white ${bgClass} border-0 shadow-lg mb-2 rounded-3 fade-in`}
              role="alert"
              aria-live="assertive"
              aria-atomic="true"
            >
              <div className="d-flex p-3">
                <i className={`bi ${iconClass} me-2 fs-5`}></i>
                <div className="toast-body fw-bold py-0.5">{toast.message}</div>
                <button
                  type="button"
                  className="btn-close btn-close-white ms-auto me-0"
                  onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                ></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Confirmation Modal */}
      {confirmConfig && (
        <div
          className="modal show d-block fade-in"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1090 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg p-3">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark">Confirm Action</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={confirmConfig.onCancel}
                ></button>
              </div>
              <div className="modal-body py-4">
                <p className="lead fs-6 text-muted mb-0">{confirmConfig.message}</p>
              </div>
              <div className="modal-footer border-0 pt-0 d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-light rounded-pill px-4 fw-bold flex-fill"
                  onClick={confirmConfig.onCancel}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary rounded-pill px-4 fw-bold flex-fill"
                  onClick={confirmConfig.onConfirm}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
