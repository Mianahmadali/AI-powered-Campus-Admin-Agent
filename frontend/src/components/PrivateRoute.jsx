import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './PrivateRoute.module.scss';

export default function PrivateRoute({ children, requiredRole = null }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner} />
        </div>
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if required
  if (requiredRole && user?.role !== requiredRole) {
    // You could redirect to an access denied page or show an error
    return (
      <div className={styles.accessDenied}>
        <div className={styles.accessDeniedContent}>
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
          <p>Required role: <strong>{requiredRole}</strong></p>
          <p>Your role: <strong>{user?.role || 'unknown'}</strong></p>
        </div>
      </div>
    );
  }

  // Render the protected component
  return children;
}