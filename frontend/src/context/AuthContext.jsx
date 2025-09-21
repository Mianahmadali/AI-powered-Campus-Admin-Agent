import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { api } from '../api';

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
};

// Reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: action.payload,
      };

    default:
      return state;
  }
}

// Create context
const AuthContext = createContext();

// Auth Provider component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set token in API headers and localStorage
  const setToken = (token) => {
    if (token) {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const { access_token, user } = response.data;
      
      setToken(access_token);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          token: access_token,
          user,
        },
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Login failed';
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Signup function
  const signup = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const response = await api.post('/auth/signup', userData);
      const { access_token, user } = response.data;

      setToken(access_token);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          token: access_token,
          user,
        },
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Signup failed';
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Logout function
  const logout = () => {
    setToken(null);
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  // Verify token and get current user
  const verifyToken = async () => {
    if (!state.token) {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      return;
    }

    try {
      setToken(state.token);
      const response = await api.get('/auth/me');
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          token: state.token,
          user: response.data,
        },
      });
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    } catch (error) {
      console.error('Token verification failed:', error);
      
      // Only logout if the error indicates the token is actually invalid
      // Don't logout for network errors or server downtime
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('Token is invalid, logging out');
        logout();
      } else {
        console.log('Network or server error during token verification, keeping user logged in');
        // Just set loading to false but keep the current auth state
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    }
  };

  // Update user profile
  const updateUser = async (userData) => {
    try {
      const response = await api.put('/auth/me', userData);
      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: response.data,
      });
      return { success: true, user: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Update failed';
      return { success: false, error: errorMessage };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Initialize auth on mount
  useEffect(() => {
    verifyToken();
  }, []);

  const value = {
    ...state,
    login,
    signup,
    logout,
    updateUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;