import React, { useState, useEffect } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { FiEye, FiEyeOff, FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import styles from './Login.module.scss';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Clear error when component mounts or form data changes
    if (error) {
      clearError();
    }
  }, [formData]);

  // Redirect if already authenticated
  if (isAuthenticated) {
    const redirectPath = location.state?.from?.pathname || '/';
    return <Navigate to={redirectPath} replace />;
  }

  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        if (!value) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Please enter a valid email address';
        }
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return '';
      default:
        return '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const errors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) errors[key] = error;
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Attempt login
    const result = await login(formData.email, formData.password);
    if (!result.success) {
      // Error is handled by the auth context
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <svg viewBox="0 0 32 32" width="32" height="32">
                <circle cx="16" cy="16" r="15" fill="var(--primary-500)"/>
                <path d="M6 14 L16 10 L26 14 L16 18 Z" fill="#ffffff" opacity="0.9"/>
                <path d="M11 12 L21 12 L21 13 L11 13 Z" fill="#ffffff" opacity="0.8"/>
                <rect x="8" y="20" width="3" height="3" fill="#ffffff" opacity="0.7" rx="0.5"/>
                <rect x="12" y="20" width="3" height="3" fill="#ffffff" opacity="0.7" rx="0.5"/>
                <rect x="16" y="20" width="3" height="3" fill="#ffffff" opacity="0.7" rx="0.5"/>
                <rect x="20" y="20" width="3" height="3" fill="#ffffff" opacity="0.7" rx="0.5"/>
                <circle cx="16" cy="26" r="2" fill="var(--accent-500)"/>
              </svg>
            </div>
            <h1>Campus Admin Agent</h1>
          </div>
          <p>Sign in to access your dashboard</p>
        </div>

        {/* Login Form */}
        <form className={styles.loginForm} onSubmit={handleSubmit}>
          {error && (
            <div className={styles.errorAlert}>
              <FiAlertCircle />
              <span>{error}</span>
            </div>
          )}

          {/* Email Field */}
          <div className={styles.formGroup}>
            <label htmlFor="email">Email Address</label>
            <div className={styles.inputGroup}>
              <FiMail className={styles.inputIcon} />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={fieldErrors.email ? styles.error : ''}
                placeholder="Enter your email address"
                autoComplete="email"
                disabled={isLoading}
              />
            </div>
            {fieldErrors.email && (
              <span className={styles.fieldError}>{fieldErrors.email}</span>
            )}
          </div>

          {/* Password Field */}
          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <div className={styles.inputGroup}>
              <FiLock className={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={fieldErrors.password ? styles.error : ''}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={isLoading}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={togglePasswordVisibility}
                disabled={isLoading}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {fieldErrors.password && (
              <span className={styles.fieldError}>{fieldErrors.password}</span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className={styles.spinner} />
                <span>Signing in...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className={styles.footer}>
          <p>
            Don't have an account?{' '}
            <Link to="/signup" className={styles.link}>
              Create one here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}