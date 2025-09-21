import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiMail, FiLock, FiUser, FiBriefcase, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import styles from './Signup.module.scss';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    role: 'user',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  
  const { signup, isAuthenticated, isLoading, error, clearError } = useAuth();

  useEffect(() => {
    // Clear error when component mounts or form data changes
    if (error) {
      clearError();
    }
  }, [formData]);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value) return 'Full name is required';
        if (value.length < 2) return 'Name must be at least 2 characters';
        if (value.length > 100) return 'Name must be less than 100 characters';
        return '';
      case 'email':
        if (!value) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Please enter a valid email address';
        }
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        if (value.length > 128) return 'Password must be less than 128 characters';
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
        }
        return '';
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== formData.password) return 'Passwords do not match';
        return '';
      case 'department':
        if (!value) return 'Department is required';
        if (value.length > 100) return 'Department name must be less than 100 characters';
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

    // Also clear confirm password error if password changes
    if (name === 'password' && fieldErrors.confirmPassword) {
      setFieldErrors(prev => ({
        ...prev,
        confirmPassword: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const errors = {};
    Object.keys(formData).forEach(key => {
      if (key !== 'role') { // role is optional with default
        const error = validateField(key, formData[key]);
        if (error) errors[key] = error;
      }
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Attempt signup
    const { confirmPassword, ...signupData } = formData;
    const result = await signup(signupData);
    if (!result.success) {
      // Error is handled by the auth context
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else if (field === 'confirmPassword') {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const getPasswordStrength = () => {
    const { password } = formData;
    if (!password) return { strength: 0, label: '' };
    
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.length >= 10) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return { strength, label: labels[strength] };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className={styles.signupPage}>
      <div className={styles.signupContainer}>
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
          <p>Create your account to get started</p>
        </div>

        {/* Signup Form */}
        <form className={styles.signupForm} onSubmit={handleSubmit}>
          {error && (
            <div className={styles.errorAlert}>
              <FiAlertCircle />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.formRow}>
            {/* Name Field */}
            <div className={styles.formGroup}>
              <label htmlFor="name">Full Name</label>
              <div className={styles.inputGroup}>
                <FiUser className={styles.inputIcon} />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={fieldErrors.name ? styles.error : ''}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  disabled={isLoading}
                />
              </div>
              {fieldErrors.name && (
                <span className={styles.fieldError}>{fieldErrors.name}</span>
              )}
            </div>

            {/* Department Field */}
            <div className={styles.formGroup}>
              <label htmlFor="department">Department</label>
              <div className={styles.inputGroup}>
                <FiBriefcase className={styles.inputIcon} />
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className={fieldErrors.department ? styles.error : ''}
                  placeholder="Enter your department"
                  disabled={isLoading}
                />
              </div>
              {fieldErrors.department && (
                <span className={styles.fieldError}>{fieldErrors.department}</span>
              )}
            </div>
          </div>

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

          {/* Role Field */}
          <div className={styles.formGroup}>
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              disabled={isLoading}
              className={styles.selectInput}
            >
              <option value="user">User</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className={styles.formRow}>
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
                  placeholder="Create a password"
                  autoComplete="new-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => togglePasswordVisibility('password')}
                  disabled={isLoading}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {formData.password && (
                <div className={styles.passwordStrength}>
                  <div className={`${styles.strengthBar} ${styles['strength-' + passwordStrength.strength]}`}>
                    <div className={styles.strengthFill} />
                  </div>
                  <span className={styles.strengthLabel}>{passwordStrength.label}</span>
                </div>
              )}
              {fieldErrors.password && (
                <span className={styles.fieldError}>{fieldErrors.password}</span>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className={styles.inputGroup}>
                <FiLock className={styles.inputIcon} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={fieldErrors.confirmPassword ? styles.error : ''}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {formData.confirmPassword && formData.confirmPassword === formData.password && (
                <div className={styles.passwordMatch}>
                  <FiCheckCircle />
                  <span>Passwords match</span>
                </div>
              )}
              {fieldErrors.confirmPassword && (
                <span className={styles.fieldError}>{fieldErrors.confirmPassword}</span>
              )}
            </div>
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
                <span>Creating account...</span>
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className={styles.footer}>
          <p>
            Already have an account?{' '}
            <Link to="/login" className={styles.link}>
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}